(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY='quranCompanion.pageMap.v1';
  const surahs=SURAHS;
  const params=new URLSearchParams(location.search);
  let flashTimer;
  function toast(str){const e=$('toast');e.textContent=str;e.classList.add('show');clearTimeout(flashTimer);flashTimer=setTimeout(()=>e.classList.remove('show'),3200);}
  function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(valid).sort((a,b)=>a.page-b.page):[];}catch(_){return [];}}
  function persist(rows){try{localStorage.setItem(KEY,JSON.stringify(rows));}catch(_){toast('Cannot save on this device. Try downloading a CSV.');}}
  function valid(x){return x&&Number.isInteger(x.page)&&x.page>0&&x.page<=9999&&Number.isInteger(x.s)&&x.s>=1&&x.s<=114&&Number.isInteger(x.v)&&x.v>=1&&x.v<=surahs[x.s-1].count;}
  function makeOpt(v,text){const o=document.createElement('option');o.value=String(v);o.textContent=text;return o;}
  function fillAyah(s,v=1){const el=$('studioAyah');el.replaceChildren();for(let i=1;i<=surahs[s-1].count;i++)el.add(makeOpt(i,i===1&&s!==9?'1 · Bismillah':String(i)));el.value=String(v);}
  surahs.forEach(s=>$('studioSurah').add(makeOpt(s.id,`${s.id}. ${s.name}`)));
  fillAyah(1);
  $('studioSurah').addEventListener('change',e=>fillAyah(Number(e.target.value)));
  function rootUrl(){return new URL('./',location.href);}
  function deepLink(s,v){const url=rootUrl();url.searchParams.set('s',s);url.searchParams.set('v',v);return url.href;}
  function qrImage(s,v){
    const img=new Image();img.alt=`Scan to open Surah ${s}, ayah ${v}`;
    img.loading='eager';img.width=150;img.height=150;
    if(location.protocol==='file:'){img.alt='Upload to GitHub Pages to enable printable QR codes';img.style.display='none';return img;}
    img.src=`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(deepLink(s,v))}`;
    return img;
  }
  function addRow(page,s,v){const item={page:Number(page),s:Number(s),v:Number(v)};
    if(!valid(item)){toast('Please enter a valid page, Surah and ayah.');return false;}
    const rows=load().filter(x=>x.page!==item.page);rows.push(item);rows.sort((a,b)=>a.page-b.page);persist(rows);render();return true;
  }
  function render(){
    const rows=load();$('mappedCount').textContent=rows.length;
    $('emptyState').hidden=rows.length>0;$('mapTable').hidden=rows.length===0;
    $('mapRows').replaceChildren();$('printGrid').replaceChildren();
    for(const item of rows){
      const tr=document.createElement('tr');
      const page=document.createElement('td');page.textContent=String(item.page);
      const surah=document.createElement('td');surah.textContent=surahs[item.s-1].name;
      const ref=document.createElement('td');ref.textContent=`${item.s}:${item.v}`;
      const link=document.createElement('td');const a=document.createElement('a');a.href=deepLink(item.s,item.v);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open link ↗';link.append(a);
      const del=document.createElement('td');const btn=document.createElement('button');btn.className='remove-btn';btn.type='button';btn.textContent='Remove';btn.addEventListener('click',()=>{persist(load().filter(x=>x.page!==item.page));render();});del.append(btn);
      tr.append(page,surah,ref,link,del);$('mapRows').append(tr);
      const card=document.createElement('article');card.className='print-label';
      const p=document.createElement('span');p.className='print-page';p.textContent=`PAGE ${item.page}`;
      const qr=qrImage(item.s,item.v);
      const n=document.createElement('strong');n.textContent=surahs[item.s-1].name;
      const small=document.createElement('span');small.textContent=`Ayah ${item.v} · ${item.s}:${item.v}`;
      card.append(p,qr,n,small);$('printGrid').append(card);
    }
  }
  $('mappingForm').addEventListener('submit',e=>{e.preventDefault();const p=$('pageNumber').value; if(addRow(p,$('studioSurah').value,$('studioAyah').value)){toast(`Page ${p} mapped.`);$('pageNumber').value='';$('pageNumber').focus();}});
  $('printSheet').addEventListener('click',()=>{
    if(location.protocol==='file:'){toast('Publish to GitHub Pages before printing QR codes.');return;}
    if(!load().length){toast('Add at least one page first.');return;}
    window.print();
  });
  $('exportCsv').addEventListener('click',()=>{
    const data='page,surah,ayah\n'+load().map(x=>`${x.page},${x.s},${x.v}`).join('\n')+'\n';
    const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='quran-page-qr-mappings.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  });
  $('clearMappings').addEventListener('click',()=>{if(!load().length)return;if(confirm('Delete all saved page mappings on this device?')){persist([]);render();toast('Page mappings cleared.');}});
  $('csvFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>1000000){toast('CSV is too large.');return;}
    const text=await file.text();const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());
    const result=load();let added=0,skipped=0;
    for(let i=0;i<lines.length;i++){
      const parts=lines[i].split(',').map(x=>x.trim());
      if(i===0 && parts[0].toLowerCase()==='page')continue;
      if(parts.length!==3){skipped++;continue;}
      const item={page:Number(parts[0]),s:Number(parts[1]),v:Number(parts[2])};
      if(!valid(item)){skipped++;continue;}
      const old=result.findIndex(x=>x.page===item.page);if(old>=0)result.splice(old,1);
      result.push(item);added++;
    }
    result.sort((a,b)=>a.page-b.page);persist(result);render();toast(`Imported ${added} pages${skipped?`; skipped ${skipped} invalid rows`:''}.`);e.target.value='';
  });
  const single=params.get('single');
  if(single){
    const m=single.match(/^(\d{1,3}):(\d{1,3})$/);
    if(m){const s=Number(m[1]),v=Number(m[2]);const page=Number(params.get('page'));
      if(s>=1 && s<=114 && v>=1 && v<=surahs[s-1].count){
        const target=Number.isInteger(page)&&page>0?page:9999;
        // Show only this QR in the print view; do not override the saved page mapping.
        document.body.classList.add('single-qr');
        const container=$('printGrid');container.replaceChildren();
        const card=document.createElement('article');card.className='print-label';
        const pageText=document.createElement('span');pageText.className='print-page';pageText.textContent=target===9999?'QURAN COMPANION':`PAGE ${page}`;
        const qr=qrImage(s,v);const name=document.createElement('strong');name.textContent=surahs[s-1].name;
        const ayah=document.createElement('span');ayah.textContent=`Ayah ${v} · ${s}:${v}`;
        card.append(pageText,qr,name,ayah);container.append(card);
        $('printSheet').onclick=()=>{if(location.protocol==='file:')toast('Upload website first to generate QR.');else window.print();};
        $('mappedCount').textContent='1';
        $('emptyState').textContent='Single QR print preview. Click “Print QR labels” to print this label.';
      }
    }
  }
  if(!document.body.classList.contains('single-qr'))render();
})();
