"use strict";
const cfg = window.QURAN_CONFIG || {};
const $ = id => document.getElementById(id);
const state = { chapter:1, verses:[], selected:-1, repeats:0, loadId:0 };
const audio = $('audio');
const ZERO = n => String(n).padStart(3,'0');
// Al Islam / Ahmadiyya numbering. Surah 9 is the sole exception.
// Text of the basmala and its translation are from Al Islam 2:1.
const BASMALA = 'بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ';
const BASMALA_TRANSLATION = 'In the name of Allah, the Gracious, the Merciful.';
const url = new URL(location.href);
const legacy = {'fatiha-1':1, 'ikhlas-1':112};
state.chapter = Math.max(1, Math.min(114, Number(url.searchParams.get('surah')) || legacy[url.searchParams.get('page')] || 1));
const initialAyah = Number(url.searchParams.get('ayah')) || 0;
function setStatus(s) { $('status').textContent = s || ''; }
function formatTime(s) { return Number.isFinite(s) ? Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0') : '0:00'; }
function currentLink() { const u=new URL(location.href); u.search='?surah='+state.chapter; return u.toString(); }
function store(k,v) { try { localStorage.setItem(k,String(v)); } catch {} }
function stored(k,v) { try { return localStorage.getItem(k) ?? v; } catch { return v; } }
async function fetchJSON(uri) { const r=await fetch(uri); if(!r.ok) throw Error('HTTP '+r.status+' from '+uri); return r.json(); }
const names=['Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa','Al-Maidah','Al-Anam','Al-Araf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Rad','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Muminun','An-Nur','Al-Furqan','Ash-Shuara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqiah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumuah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Maarij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Naziat','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-Ala','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qariah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Maun','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];
function initSelect() {
  const sel=$('surahSelect');sel.replaceChildren();
  names.forEach((name,i)=>sel.add(new Option(`${i+1}. ${name}`,i+1)));
  sel.value=String(state.chapter);
  sel.addEventListener('change',()=>loadChapter(Number(sel.value)));
}
// Audio URLs are supplied by the documented Al Quran Cloud verse-audio API.
// These recordings are a fallback from a DIFFERENT service, not from Al Islam.
async function loadStreamedAudio(surah) {
  if(cfg.audioMode !== 'stream') return null;
  const api=cfg.audioApiBase || 'https://api.alquran.cloud/v1';
  try {
    const result=await fetchJSON(`${api}/surah/${surah}/${cfg.reciter || 'ar.alafasy'}`);
    if(result.code !== 200 || !Array.isArray(result.data?.ayahs)) throw Error('No audio list returned');
    return new Map(result.data.ayahs.map(a=>[Number(a.numberInSurah),a.audio]));
  } catch(err) {
    console.warn('Streaming audio list unavailable', err);
    return new Map();
  }
}
function getAudioURL(verse) {
  if(cfg.audioMode === 'stream') {
    if(verse.isBasmala) {
      const base=cfg.audioCDNBase||'https://cdn.islamic.network/quran/audio/128';
      return `${base}/${cfg.reciter||'ar.alafasy'}/1.mp3`;
    }
    return verse.streamAudio || '';
  }
  const surah=state.chapter, ayah=verse.number;
  if(cfg.audioMode === 'template' && cfg.audioUrlTemplate) {
    return cfg.audioUrlTemplate.replaceAll('{surah3}',ZERO(surah)).replaceAll('{ayah3}',ZERO(ayah))
      .replaceAll('{surah}',String(surah)).replaceAll('{ayah}',String(ayah));
  }
  // Local files follow Al Islam's DISPLAYED verse numbering (e.g. 002001 = Basmala).
  return `${cfg.localAudioFolder||'audio'}/${ZERO(surah)}${ZERO(ayah)}.mp3`;
}
function stopAudio() {
  audio.pause();audio.removeAttribute('src');audio.load();
  $('play').textContent='▶';$('seek').value=0;
  $('elapsed').textContent='0:00';$('duration').textContent='0:00';
}
async function loadChapter(num) {
  const req=++state.loadId;
  state.chapter=num;state.selected=-1;state.verses=[];
  stopAudio();$('nowPlaying').textContent='Tap a verse to play its recording.';
  $('verses').replaceChildren();$('surahSelect').value=String(num);
  $('chapterNumber').textContent='SURAH '+ZERO(num);
  $('chapterName').textContent=`Surah ${names[num-1]}`;
  $('chapterMeta').textContent='Loading…';
  // Basmala is inside the verse list, never a duplicate standalone heading.
  $('bismillah').hidden=true;
  setStatus('Loading Arabic, translation and audio references…');
  history.replaceState(null,'',currentLink());
  try {
    const base=cfg.dataBase;
    const [arabic, english, audioMap]=await Promise.all([
      fetchJSON(`${base}/text/${cfg.arabicScript}/chapters/${num}.json`),
      fetchJSON(`${base}/translations/${cfg.translation}/chapters/${num}.json`),
      loadStreamedAudio(num)
    ]);
    if(req!==state.loadId)return;
    const translations=new Map((english.verses||[]).map(v=>[String(v.id),v.translation ?? v.text ?? '']));
    const underlying=(arabic.verses||[]);
    if(!underlying.length)throw Error('No verses received');
    // The independent data source uses a different verse numbering convention.
    // Surah 1 already includes Basmala as 1; surah 9 never has it.
    // All other surahs receive Basmala as 1 and their original ayahs shift by one.
    const hasBasmala=num!==9;
    state.verses=underlying.map((v,i)=>({
      number:i+1+(num!==1&&hasBasmala ? 1 : 0),
      arabic:num===1 && i===0 ? BASMALA : v.text,
      translation:num===1 && i===0 ? BASMALA_TRANSLATION : translations.get(String(v.id))||'',
      sourceVerse:i+1,
      isBasmala:num===1 && i===0,
      streamAudio:audioMap?.get(i+1)||''
    }));
    if(hasBasmala && num!==1) {
      state.verses.unshift({number:1,arabic:BASMALA,translation:BASMALA_TRANSLATION,
        sourceVerse:0,isBasmala:true,streamAudio:''});
    }
    $('chapterMeta').textContent=`${state.verses.length} verses · Al Islam numbering`;
    renderVerses();setStatus('');
    if(req===state.loadId && initialAyah>0 && num===Number(url.searchParams.get('surah')||legacy[url.searchParams.get('page')]||1)) {
      const at=state.verses.findIndex(v=>v.number===initialAyah);
      if(at>=0){state.selected=at;highlight();}
    }
  } catch(err) {
    if(req!==state.loadId)return;
    console.error(err);setStatus('Unable to load verses. Check your internet connection and data source in config.js.');
    $('chapterMeta').textContent='Not available';
  }
}
function renderVerses() {
  const f=document.createDocumentFragment();
  state.verses.forEach((verse,i)=>{
    const btn=document.createElement('button');
    btn.type='button';btn.className='verse';btn.dataset.index=i;
    btn.setAttribute('aria-label',`Play verse ${verse.number}`);
    const row=document.createElement('div');row.className='verse-line';
    const marker=document.createElement('span');marker.className='verse-index';marker.textContent=verse.number;
    const ar=document.createElement('span');ar.className='verse-arabic';ar.lang='ar';ar.dir='rtl';ar.textContent=verse.arabic;
    row.append(marker,ar);btn.append(row);
    const tr=document.createElement('div');tr.className='verse-translation';
    tr.textContent=verse.translation;tr.hidden=!$('showTranslation').checked;btn.append(tr);
    btn.addEventListener('click',()=>selectVerse(i,true));f.append(btn);
  });
  $('verses').replaceChildren(f);
}
function highlight() {
  document.querySelectorAll('.verse').forEach((v,i)=>{
    v.classList.toggle('active',i===state.selected);
    v.setAttribute('aria-pressed',String(i===state.selected));
  });
}
async function selectVerse(i,autoplay=true) {
  if(i<0||i>=state.verses.length)return;
  state.selected=i;state.repeats=0;highlight();
  const verse=state.verses[i];
  $('nowPlaying').textContent=`Surah ${names[state.chapter-1]} · Verse ${verse.number}`;
  stopAudio();
  const source=getAudioURL(verse);
  if(!source){$('audioNote').textContent='This verse has no accessible audio URL. Check your chosen source.';return;}
  audio.src=source;audio.load();audio.playbackRate=Number($('speed').value);
  if(autoplay)await playAudio();
}
async function playAudio() {
  if(state.selected<0){await selectVerse(0,true);return;}
  try {
    await audio.play();$('play').textContent='Ⅱ';
    $('audioNote').textContent=cfg.audioMode==='stream'
      ? 'Streaming recitation: Mishary Alafasy via Al Quran Cloud (not Al Islam). Tap another verse to switch.'
      : 'Tap another verse to switch recordings.';
  } catch(err) {
    $('play').textContent='▶';
    $('audioNote').textContent='Audio could not be played. Check the audio link and your internet connection.';
    console.error('Audio error:',err,audio.currentSrc);
  }
}
$('play').addEventListener('click',()=>{
  if(!audio.paused){audio.pause();$('play').textContent='▶';}
  else playAudio();
});
$('previous').addEventListener('click',()=>selectVerse(Math.max(0,state.selected-1),true));
$('next').addEventListener('click',()=>selectVerse(Math.min(state.verses.length-1,state.selected+1),true));
audio.addEventListener('ended',async()=>{
  const count=Number($('repeat').value);
  if(count===0||state.repeats<count-1){state.repeats++;audio.currentTime=0;await playAudio();}
  else if(cfg.autoNextVerse&&state.selected<state.verses.length-1){selectVerse(state.selected+1,true);}
  else{$('play').textContent='▶';}
});
audio.addEventListener('timeupdate',()=>{
  if(Number.isFinite(audio.duration)&&audio.duration>0){
    $('seek').value=String(Math.round(100*audio.currentTime/audio.duration));
    $('elapsed').textContent=formatTime(audio.currentTime);$('duration').textContent=formatTime(audio.duration);
  }
});
audio.addEventListener('pause',()=>{$('play').textContent='▶';});
$('seek').addEventListener('input',()=>{
  if(Number.isFinite(audio.duration))audio.currentTime=Number($('seek').value)*audio.duration/100;
});
$('speed').addEventListener('change',()=>{audio.playbackRate=Number($('speed').value);store('speed',$('speed').value);});
$('settingsToggle').addEventListener('click',()=>{
  const hidden=$('settings').classList.toggle('hidden');
  $('settingsToggle').setAttribute('aria-expanded',String(!hidden));
});
$('arabicSize').addEventListener('input',()=>{
  document.documentElement.style.setProperty('--arabic-size',$('arabicSize').value+'px');
  $('sizeValue').textContent=$('arabicSize').value+' px';store('arabicSize',$('arabicSize').value);
});
$('showTranslation').addEventListener('change',()=>{
  document.querySelectorAll('.verse-translation').forEach(v=>v.hidden=!$('showTranslation').checked);
  store('showTranslation',$('showTranslation').checked);
});
$('highContrast').addEventListener('change',()=>{
  document.body.classList.toggle('contrast',$('highContrast').checked);
  store('highContrast',$('highContrast').checked);
});
$('copyLink').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(currentLink());$('copyLink').textContent='Copied!';
    setTimeout(()=>$('copyLink').textContent='Copy link',1600);
  }catch{prompt('Copy this link:',currentLink());}
});
$('arabicSize').value=stored('arabicSize','36');
$('arabicSize').dispatchEvent(new Event('input'));
$('showTranslation').checked=stored('showTranslation','true')==='true';
$('highContrast').checked=stored('highContrast','false')==='true';
document.body.classList.toggle('contrast',$('highContrast').checked);
$('speed').value=stored('speed','1');
$('attribution').textContent='Verse numbering and Bismillah follow Al Islam (except Surah 9). Other Arabic/English verses use Quran JSON (Uthmani / Saheeh International); recitation uses Al Quran Cloud (Mishary Alafasy). This is not yet an exact Al Islam text, translation or audio integration. Verify all content before printing.';
$('audioNote').textContent=cfg.audioMode==='stream'
  ? 'Online audio from Al Quran Cloud (Mishary Alafasy), not Al Islam. Internet required.'
  : 'Play approved local recordings or use an authorised source URL template.';
initSelect();loadChapter(state.chapter);
