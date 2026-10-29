/* Quran Companion: static, GitHub Pages compatible. No third-party tafsir or translations. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const surahs = SURAHS;
  const memoryKey = 'qc.lastPlace.v1';
  const pageMapKey = 'quranCompanion.pageMap.v1';
  const fatiha = FATIHAH;
  const contentCache = new Map([[1, fatiha]]);
  const pendingCache = new Map();
  let translations = null;
  let translationPromise = null;
  let showTranslation = true;
  let arabicFont = 36;
  let renderSerial = 0;
  let playing = false;
  let repeat = false;
  let speedIndex = 0;
  const speeds = [1, 1.25, 1.5, .75];
  let toastTimer;
  const audio = $('audio');
  const urlParams = new URLSearchParams(location.search);

  function storedJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (_) { return fallback; }
  }
  function storeJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); }
    catch (_) { /* Reading still works in private browsing. */ }
  }
  const saved = storedJSON(memoryKey, {s: 1, v: 1});
  const initialS = /^\d+$/.test(urlParams.get('s') || '') ? Number(urlParams.get('s')) : saved.s;
  const initialV = /^\d+$/.test(urlParams.get('v') || '') ? Number(urlParams.get('v')) : saved.v;
  const validSurah = s => Math.max(1, Math.min(114, Number.isFinite(Number(s)) ? Math.floor(Number(s)) : 1));
  const validVerse = (s, v) => Math.max(1, Math.min(surahs[s - 1].count, Number.isFinite(Number(v)) ? Math.floor(Number(v)) : 1));
  const state = {s: validSurah(initialS), v: 1};
  state.v = validVerse(state.s, initialV);

  function option(value, label) { const o = document.createElement('option'); o.value = String(value); o.textContent = label; return o; }
  function clear(node) { node.replaceChildren(); }
  function toast(msg) {
    const node = $('toast'); node.textContent = msg; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3200);
  }
  function pad(n) { return String(n).padStart(3, '0'); }
  function officialUrl(s, v) { return `https://www.alislam.org/quran/app/${s}:${v}`; }
  function audioUrl(s, v) { return `https://files.alislam.cloud/audio/tilawat/feroz/${pad(s)}-${pad(v)}-AR.mp3`; }
  function deepLink(s, v) {
    const url = new URL('./', location.href);
    url.searchParams.set('s', s);
    url.searchParams.set('v', v);
    return url.href;
  }
  function showMessage(message, isError = false) {
    const el = $('loadMessage');
    el.replaceChildren();
    if (!message) { el.hidden = true; return; }
    el.hidden = false;
    const msg = document.createElement('span'); msg.textContent = message;
    el.appendChild(msg);
    if (isError) {
      const a = document.createElement('a'); a.href = officialUrl(state.s, state.v);
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = ' Open on Alislam ↗'; el.appendChild(a);
    }
  }

  function fillVerseSelect(select, s, selected = 1) {
    clear(select);
    for (let v = 1; v <= surahs[s - 1].count; v++) select.add(option(v, v === 1 && s !== 9 ? '1 · Bismillah' : String(v)));
    select.value = String(validVerse(s, selected));
  }
  function fillSurahSelect(select) {
    surahs.forEach(s => select.add(option(s.id, `${s.id}. ${s.name}`)));
  }
  fillSurahSelect($('surahSelect'));
  fillSurahSelect($('qrSurah'));
  fillVerseSelect($('verseSelect'), state.s, state.v);
  fillVerseSelect($('qrVerse'), state.s, state.v);
  $('surahSelect').value = String(state.s);

  function chapterList(filter='') {
    const list = $('chapterList'); clear(list);
    const search = filter.trim().toLowerCase();
    for (const surah of surahs) {
      if (search && !`${surah.id} ${surah.name} ${surah.meaning}`.toLowerCase().includes(search) && !surah.arabic.includes(search)) continue;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = `chapter-entry${state.s === surah.id ? ' active' : ''}`;
      btn.setAttribute('aria-current', state.s === surah.id ? 'page' : 'false');
      const num = document.createElement('span'); num.className = 'chapter-num'; const numInner=document.createElement('span');numInner.textContent=String(surah.id).padStart(2, '0');num.append(numInner);
      const info = document.createElement('span'); info.className = 'chapter-name';
      const name = document.createElement('strong'); name.textContent = surah.name;
      const detail = document.createElement('small'); detail.textContent = `${surah.count} verses`;
      info.append(name,detail);
      const arabic = document.createElement('span'); arabic.className = 'chapter-arabic'; arabic.lang = 'ar'; arabic.textContent = surah.arabic;
      btn.append(num,info,arabic);
      btn.addEventListener('click', () => go(surah.id, 1, {scrollTop:true}));
      list.appendChild(btn);
    }
    if (!list.children.length) { const p=document.createElement('p'); p.className='empty-search';p.textContent='No matching Surah.';list.append(p); }
  }
  $('surahSearch').addEventListener('input', e => chapterList(e.target.value));

  async function arabicChapter(s) {
    if (contentCache.has(s)) return contentCache.get(s);
    if (pendingCache.has(s)) return pendingCache.get(s);
    const promise = (async () => {
      // Quran Arabic text only: no translations, commentaries or denominational material.
      // There is not an available documented Alislam CORS JSON API.
      const response = await fetch(`https://quran-json.risanb.com/text/uthmani/chapters/${s}.json`);
      if (!response.ok) throw new Error('Arabic source unavailable');
      const json = await response.json();
      if (!json || !Array.isArray(json.verses)) throw new Error('Arabic verses not found');
      const base = json.verses.map(x => ({arabic: typeof x.text === 'string' ? x.text : ''}));
      if (base.length !== surahs[s - 1].standard || base.some(v => !v.arabic)) throw new Error('Unexpected verse count or text');
      const result = s === 9 ? base : [{arabic: BISMILLAH.arabic, en: BISMILLAH.en}, ...base];
      contentCache.set(s, result);
      return result;
    })();
    pendingCache.set(s, promise);
    try { return await promise; } finally { pendingCache.delete(s); }
  }
  function translationFor(s, v) {
    if (s === 1) return fatiha[v-1]?.en || '';
    if (v === 1 && s !== 9) return BISMILLAH.en;
    if (!translations) return '';
    // Curated Sher Ali file follows standard chapter numbering; after Bismillah,
    // Ahmadiyya verses are shifted +1 (except Surah At-Taubah).
    const traditionalV = s === 9 ? v : v-1;
    const val = translations[String(s)]?.Ayahs?.[String(traditionalV)]?.['Sher Ali'];
    return typeof val === 'string' ? val : '';
  }
  function fetchSherAli() {
    if (translationPromise) return translationPromise;
    translationPromise = fetch('https://cdn.jsdelivr.net/gh/faisalill/quran_db@main/sherali.json')
      .then(r => { if (!r.ok) throw new Error('Sher Ali translation unavailable'); return r.json(); })
      .then(data => { if (!data['2']?.Ayahs?.['1']?.['Sher Ali']) throw new Error('Unexpected Sher Ali data'); translations=data; if (state.s!==1) renderCurrentChapter(false); })
      .catch(() => { /* Translation is optional; official Alislam link always offered. */ });
    return translationPromise;
  }

  function createIcon(kind) {
    // Static markup only, never user data.
    const icons = {
      play: '<path d="M8 5v14l11-7z"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    if (kind==='play') { svg.setAttribute('fill','currentColor'); svg.innerHTML=icons.play; }
    else { svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.innerHTML=icons.link; }
    return svg;
  }
  function renderVerse(ayah, index) {
    const s=state.s, v=index+1;
    const article = document.createElement('article');
    article.className = `verse${state.v===v?' active':''}`;
    article.id = `ayah-${v}`;
    article.dataset.verse = String(v);
    const top=document.createElement('div'); top.className='verse-top';
    const ref=document.createElement('span');ref.className='verse-reference';ref.textContent=`${s}:${v}`;
    const actions=document.createElement('div');actions.className='verse-acts';
    const play=document.createElement('button');play.className='ayah-btn';play.type='button';play.title=`Listen to ${s}:${v}`;play.setAttribute('aria-label',`Play Surah ${s}, ayah ${v}`);play.appendChild(createIcon('play'));
    play.addEventListener('click', () => selectVerse(v, {play:true, scroll:false}));
    const link=document.createElement('a');link.className='ayah-btn';link.href=officialUrl(s,v);link.title='View on Alislam';link.setAttribute('aria-label',`Read ${s}:${v} on Alislam`);link.target='_blank';link.rel='noopener noreferrer';link.appendChild(createIcon('link'));
    actions.append(play,link);top.append(ref,actions);
    const arabic=document.createElement('p');arabic.className='arabic-verse';arabic.setAttribute('lang','ar');arabic.setAttribute('dir','rtl');arabic.textContent=ayah.arabic;
    const english=document.createElement('p');english.className='verse-en';
    const translation=translationFor(s,v);
    if (translation) english.textContent=translation;
    else {
      const a = document.createElement('a');a.className='official-translation';a.href=officialUrl(s,v);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Read the Sher Ali translation on Alislam ↗';english.appendChild(a);
    }
    article.append(top,arabic,english);
    article.addEventListener('click', e=>{ if(e.target.closest('button,a')) return; selectVerse(v, {play:true,scroll:false}); });
    return article;
  }
  function activeHighlight(scroll=false) {
    $('verses').querySelectorAll('.verse').forEach(el=> el.classList.toggle('active', Number(el.dataset.verse)===state.v));
    const current=$(`ayah-${state.v}`);
    if(scroll && current) current.scrollIntoView({block:'start',behavior:'smooth'});
  }
  async function renderCurrentChapter(scrollToSelected=true) {
    const s=state.s, token=++renderSerial;
    if (contentCache.has(s)) {
      const verses=contentCache.get(s); const frag=document.createDocumentFragment();
      verses.forEach((verse,i)=>frag.appendChild(renderVerse(verse,i)));
      $('verses').replaceChildren(frag);showMessage('');
      if(scrollToSelected && state.v > 1) requestAnimationFrame(()=>activeHighlight(true));
      return;
    }
    clear($('verses'));
    showMessage('Loading Arabic verses…');
    try {
      const verses=await arabicChapter(s);
      if(s!==state.s || token!==renderSerial) return;
      const frag=document.createDocumentFragment();
      verses.forEach((verse,i)=>frag.appendChild(renderVerse(verse,i)));
      $('verses').replaceChildren(frag);showMessage('');
      if(scrollToSelected) requestAnimationFrame(()=>activeHighlight(true));
    } catch (error) {
      if(s!==state.s || token!==renderSerial) return;
      showMessage('Arabic text could not load. Please check your connection or read this verse directly on Alislam.', true);
    }
  }
  function setHeader() {
    const surah=surahs[state.s-1];
    $('surahTitle').textContent=surah.name;
    $('surahDetails').textContent=`${surah.meaning} · Chapter ${surah.id} · ${surah.count} verses`;
    $('arabicTitle').textContent=surah.arabic;
    $('readingLabel').textContent=`SURAH ${surah.name.toUpperCase()}`;
    $('trackTitle').textContent=`${surah.name} · Ayah ${state.v}`;
    $('surahSelect').value=String(state.s);
    fillVerseSelect($('verseSelect'),state.s,state.v);
    chapterList($('surahSearch').value);
  }
  function updateNavigation() {
    history.replaceState(null,'',deepLink(state.s,state.v));
    storeJSON(memoryKey,{s:state.s,v:state.v});
    $('verseSelect').value=String(state.v);
    $('trackTitle').textContent=`${surahs[state.s-1].name} · Ayah ${state.v}`;
    activeHighlight(false);
  }
  function prepareAudio() {
    audio.pause();
    playing=false;
    audio.src=audioUrl(state.s,state.v);
    audio.load();
    updatePlaybackUI();
    $('seekBar').value='0';$('timeCurrent').textContent='0:00';$('timeTotal').textContent='0:00';
  }
  function playCurrent() {
    if (!audio.src || !audio.src.includes(`${pad(state.s)}-${pad(state.v)}-AR.mp3`)) prepareAudio();
    const result=audio.play();
    if(result && typeof result.catch==='function') result.catch(()=>{playing=false;updatePlaybackUI();toast('Audio could not start. Try again or open the verse on Alislam.');});
  }
  function selectVerse(v, opts={}) {
    const next=validVerse(state.s,v);
    const changed=next!==state.v;
    state.v=next;
    updateNavigation();
    if(changed) prepareAudio();
    if(opts.scroll) activeHighlight(true);
    if(opts.play) playCurrent();
  }
  function go(s,v,opts={}) {
    s=validSurah(s);v=validVerse(s,v);
    const chapterChanged=s!==state.s;
    state.s=s;state.v=v;
    setHeader();updateNavigation();prepareAudio();
    if(chapterChanged) {
      renderCurrentChapter(opts.scrollTop!==true);
      if(showTranslation && !translations) fetchSherAli();
    } else activeHighlight(true);
    if(opts.scrollTop) window.scrollTo({top:0,behavior:'smooth'});
    if(opts.play) playCurrent();
  }
  function adjacent(delta) {
    let s=state.s,v=state.v+delta;
    if(v>surahs[s-1].count) {if(s===114)return null;s++;v=1;}
    else if(v<1) {if(s===1)return null;s--;v=surahs[s-1].count;}
    return {s,v};
  }
  function next(delta, autoplay=false) {const target=adjacent(delta);if(target) go(target.s,target.v,{play:autoplay}); else if(autoplay) toast('You have reached the end of the Holy Quran.');}
  function updatePlaybackUI() {
    playing=!audio.paused && !audio.ended;
    $('playBtn').setAttribute('aria-label',playing?'Pause':'Play verse');
    $('playIcon').innerHTML=playing?'<path d="M7 5h4v14H7zm6 0h4v14h-4z"/>':'<path d="M8 5v14l11-7z"/>';
    $('player').classList.toggle('is-playing',playing);
  }
  function formatTime(sec) {return Number.isFinite(sec)?`${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`:'0:00';}
  audio.addEventListener('play',updatePlaybackUI);
  audio.addEventListener('pause',updatePlaybackUI);
  audio.addEventListener('ended',()=> {updatePlaybackUI();if(repeat){audio.currentTime=0;playCurrent();}else next(1,true);});
  audio.addEventListener('timeupdate',()=> {const dur=audio.duration; $('timeCurrent').textContent=formatTime(audio.currentTime);if(Number.isFinite(dur)&&dur>0)$('seekBar').value=String(100*audio.currentTime/dur);});
  audio.addEventListener('loadedmetadata',()=>{$('timeTotal').textContent=formatTime(audio.duration);});
  audio.addEventListener('error',()=>{if(audio.src){updatePlaybackUI();toast('Feroz Alam audio unavailable for this ayah. View it on Alislam.');}});
  $('playBtn').addEventListener('click',()=>{if(audio.paused) playCurrent();else audio.pause();});
  $('prevBtn').addEventListener('click',()=>next(-1,false));
  $('nextBtn').addEventListener('click',()=>next(1,false));
  $('seekBar').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=audio.duration*Number(e.target.value)/100;});
  $('repeatBtn').addEventListener('click',()=>{repeat=!repeat;$('repeatBtn').setAttribute('aria-pressed',String(repeat));toast(repeat?'Repeat this ayah on':'Repeat off');});
  $('speedBtn').addEventListener('click',()=>{speedIndex=(speedIndex+1)%speeds.length;audio.playbackRate=speeds[speedIndex];$('speedBtn').textContent=`${speeds[speedIndex]}×`;});
  $('surahSelect').addEventListener('change',e=>fillVerseSelect($('verseSelect'),validSurah(e.target.value)));
  $('jumpButton').addEventListener('click',()=>go($('surahSelect').value,$('verseSelect').value));
  $('bookmarkButton').addEventListener('click',()=>{storeJSON(memoryKey,{s:state.s,v:state.v});toast(`Saved ${state.s}:${state.v}. Return anytime using this device.`);});
  $('toggleTranslation').addEventListener('click',()=>{showTranslation=!showTranslation;$('reader').classList.toggle('no-translation',!showTranslation);$('toggleTranslation').setAttribute('aria-pressed',String(showTranslation));$('translationTick').textContent=showTranslation?'✓':'';if(showTranslation && !translations)fetchSherAli();});
  function adjustArabic(delta){arabicFont=Math.max(23,Math.min(52,arabicFont+delta));document.documentElement.style.setProperty('--arabic-size',`${arabicFont}px`);}
  $('smallerText').addEventListener('click',()=>adjustArabic(-3));
  $('largerText').addEventListener('click',()=>adjustArabic(3));

  // The printed page number is intentionally user-supplied: no guessed mushaf mapping.
  function updateQr() {
    const s=validSurah($('qrSurah').value),v=validVerse(s,$('qrVerse').value),link=deepLink(s,v);
    $('qrUrl').value=link;$('qrCaption').textContent=`${surahs[s-1].name} · Ayah ${v}`;
    const container=$('qrImage');clear(container);
    if(location.protocol==='file:') {const span=document.createElement('span');span.className='qr-placeholder';span.title='Publish to GitHub Pages before printing QR codes';span.textContent='▦';container.append(span);return;}
    const img=new Image();img.alt=`QR code linking to Surah ${s} ayah ${v}`;
    img.width=150;img.height=150;
    img.src=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(link)}`;
    img.onerror=()=>{container.textContent='QR service unavailable';};
    container.append(img);
  }
  function openModal() {
    $('qrSurah').value=String(state.s);fillVerseSelect($('qrVerse'),state.s,state.v);
    $('qrPage').value='';$('qrModal').hidden=false;document.body.style.overflow='hidden';updateQr();
    $('closeQr').focus();
  }
  function closeModal() {$('qrModal').hidden=true;document.body.style.overflow='';$('openQr').focus();}
  $('openQr').addEventListener('click',openModal);
  $('closeQr').addEventListener('click',closeModal);
  $('qrModal').addEventListener('click',e=>{if(e.target.dataset.close)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('qrModal').hidden)closeModal();});
  $('qrSurah').addEventListener('change',()=>{fillVerseSelect($('qrVerse'),validSurah($('qrSurah').value));updateQr();});
  $('qrVerse').addEventListener('change',updateQr);
  $('savePage').addEventListener('click',()=>{
    const page=Number($('qrPage').value),s=Number($('qrSurah').value),v=Number($('qrVerse').value);
    if(!Number.isInteger(page)||page<1||page>9999){toast('Enter the printed page number first.');$('qrPage').focus();return;}
    const entries=storedJSON(pageMapKey,[]);const clean=Array.isArray(entries)?entries.filter(x=>x.page!==page):[];
    clean.push({page,s,v});clean.sort((a,b)=>a.page-b.page);
    storeJSON(pageMapKey,clean);toast(`Saved printed page ${page} → ${s}:${v}`);
  });
  $('copyQr').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText($('qrUrl').value);toast('QR link copied.');}
    catch(e){$('qrUrl').focus();$('qrUrl').select();document.execCommand('copy');toast('Link selected. Copy it if needed.');}
  });
  $('openSheet').addEventListener('click',()=>{location.href='qr-studio.html';});
  $('printOne').addEventListener('click',()=>{
    if(location.protocol==='file:'){toast('Upload the site to GitHub Pages before printing QR codes.');return;}
    const s=Number($('qrSurah').value),v=Number($('qrVerse').value);
    const page=$('qrPage').value.trim();
    location.href=`qr-studio.html?single=${s}:${v}${page?`&page=${encodeURIComponent(page)}`:''}`;
  });

  window.addEventListener('popstate',()=>{
    const p=new URLSearchParams(location.search);
    go(p.get('s')||1,p.get('v')||1);
  });
  document.title=`Quran Companion · ${surahs[state.s-1].name}`;
  setHeader();updateNavigation();prepareAudio();renderCurrentChapter(state.v>1);
  if(state.s!==1 && showTranslation)fetchSherAli();
})();
