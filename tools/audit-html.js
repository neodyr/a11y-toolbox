/* =========================================================================
   Outil : Audit express HTML — hiérarchie des titres + images sans alternative.
   Critères : RGAA 9.1 (WCAG 1.3.1), RGAA 1.1 (WCAG 1.1.1).
   L'analyse se fait via DOMParser : le HTML collé n'est jamais exécuté.
   ========================================================================= */
(function(){
  "use strict";
  const {dom} = window.TB;
  const esc = dom.escapeHtml;

  const CSS = `
  .ah-ta{width:100%;min-height:150px;font-family:var(--mono);font-size:.85rem;line-height:1.5;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);resize:vertical}
  .ah-ta:focus-visible{border-color:var(--signal)}
  .ah-bar{display:flex;gap:10px;align-items:center;margin:12px 0 4px;flex-wrap:wrap}
  .ah-summary{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 18px}
  .ah-pill{font-size:.8rem;border:1px solid var(--line);border-radius:20px;padding:5px 12px;display:inline-flex;gap:7px;align-items:center;background:var(--surface)}
  .ah-pill .n{font-weight:700}
  .ah-pill.ok{border-color:var(--pass);color:var(--pass)}.ah-pill.no{border-color:var(--fail);color:var(--fail)}.ah-pill.wa{border-color:var(--warn);color:var(--warn)}
  .ah-h3{font-family:var(--display);font-weight:600;font-size:1rem;margin:20px 0 10px}
  .ah-tree{list-style:none;margin:0;padding:0;font-family:var(--mono);font-size:.86rem}
  .ah-tree li{padding:6px 10px;border-left:2px solid var(--line);margin:2px 0}
  .ah-tree li.warn{border-left-color:var(--warn);background:var(--warn-soft)}
  .ah-tree .tag{color:var(--signal-ink);font-weight:700;margin-right:8px}
  .ah-tree .note{color:var(--warn);font-size:.78rem;margin-left:8px}
  .ah-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
  .ah-item{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface)}
  .ah-item .bul{width:11px;height:11px;border-radius:50%;flex:none;margin-top:4px}
  .ah-item.ok .bul{background:var(--pass)}.ah-item.no .bul{background:var(--fail)}.ah-item.wa .bul{background:var(--warn)}
  .ah-item .body{min-width:0}
  .ah-item .src{font-family:var(--mono);font-size:.8rem;color:var(--dim);word-break:break-all}
  .ah-item .msg{font-size:.82rem;margin-top:2px}
  .ah-item.ok .msg{color:var(--pass)}.ah-item.no .msg{color:var(--fail)}.ah-item.wa .msg{color:var(--warn)}
  .ah-none{font-size:.86rem;color:var(--dim)}
  `;

  const SAMPLE = `<h1>Nos services</h1>
<h3>Audit RGAA</h3>
<p>...</p>
<h2>Formations</h2>
<img src="equipe.jpg">
<img src="logo.svg" alt="">
<img src="schema.png" alt="Schéma du processus d'audit">
<img src="photo1.png" alt="photo1.png">`;

  const HOWTO = `
    <p>Colle le code HTML d'une page (ou d'un fragment) et lance l'analyse. Deux vérifications structurantes sont effectuées, sans jamais exécuter ton code (analyse par <code>DOMParser</code>).</p>
    <h3>Hiérarchie des titres — RGAA 9.1 (WCAG 1.3.1)</h3>
    <p>La liste des titres h1 à h6 est reconstruite et les <b>sauts de niveau</b> sont signalés (par exemple un h1 suivi directement d'un h3), ainsi que l'absence de h1 ou la présence de plusieurs h1.</p>
    <h3>Alternatives des images — RGAA 1.1 (WCAG 1.1.1)</h3>
    <p>Chaque <code>&lt;img&gt;</code> est classée : alternative absente (erreur), <code>alt=""</code> (image décorative, correct), alternative présente (correct), ou alternative <b>suspecte</b> (nom de fichier, « image », « photo »…).</p>`;

  window.Toolbox.register({
    id:'audit-html',
    name:'Audit express HTML',
    tagline:'Hiérarchie des titres et images sans alternative, à partir de HTML collé.',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    criteres:[
      {ref:'RGAA 9.1', wcag:'1.3.1', label:'Structure des titres'},
      {ref:'RGAA 1.1', wcag:'1.1.1', label:'Alternative textuelle aux images'}
    ],
    howto:HOWTO,
    mount(root){
      dom.injectCss('css-audit-html', CSS);
      root.innerHTML = `
      <div class="card card-pad" aria-label="Audit express HTML">
        <label class="lb" for="ah-input">Coller le HTML à analyser</label>
        <textarea class="ah-ta" id="ah-input" spellcheck="false" placeholder="&lt;h1&gt;Titre&lt;/h1&gt; ..."></textarea>
        <div class="ah-bar">
          <button class="btn" id="ah-run" type="button">Analyser</button>
          <button class="btn ghost" id="ah-sample" type="button">Charger un exemple</button>
        </div>
      </div>
      <div id="ah-out" aria-live="polite"></div>`;

      const q=s=>root.querySelector(s);
      q('#ah-sample').addEventListener('click',()=>{q('#ah-input').value=SAMPLE;analyse();});
      q('#ah-run').addEventListener('click',analyse);

      function analyse(){
        const html=q('#ah-input').value;
        const out=q('#ah-out');
        if(!html.trim()){out.innerHTML='<p class="ah-none">Colle du HTML puis clique sur « Analyser ».</p>';return;}
        const doc=new DOMParser().parseFromString(html,'text/html');
        out.innerHTML = renderTitres(doc) + renderImages(doc);
        window.Toolbox.announce && window.Toolbox.announce('Analyse terminée.');
      }

      function renderTitres(doc){
        const hs=[...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];
        const h1n=hs.filter(h=>h.tagName==='H1').length;
        let issues=0, prev=0, rows=[];
        hs.forEach((h,i)=>{
          const lvl=+h.tagName[1];
          let note='';
          if(i===0 && lvl!==1){note='Le premier titre devrait être un h1.';}
          else if(prev && lvl>prev+1){note='Saut de niveau : h'+prev+' → h'+lvl+'.';}
          if(note)issues++;
          rows.push(`<li class="${note?'warn':''}"><span class="tag" style="padding-left:${(lvl-1)*16}px">h${lvl}</span>${esc((h.textContent||'').trim().slice(0,90)||'(vide)')}${note?`<span class="note">${esc(note)}</span>`:''}</li>`);
          prev=lvl;
        });
        if(h1n===0)issues++;
        if(h1n>1)issues++;
        const pills=[
          pill(hs.length,'titre'+(hs.length>1?'s':''),'ok'),
          pill(h1n, 'h1', h1n===1?'ok':'no'),
          pill(issues, 'anomalie'+(issues>1?'s':''), issues?'wa':'ok')
        ].join('');
        const extra=[];
        if(h1n===0)extra.push('Aucun h1 : la page devrait avoir un titre principal unique.');
        if(h1n>1)extra.push('Plusieurs h1 détectés : un seul est recommandé.');
        return `<h2 class="ah-h3">Hiérarchie des titres <span class="ah-pill" style="border:0;padding:0;color:var(--mute)">RGAA 9.1 · WCAG 1.3.1</span></h2>
          <div class="ah-summary">${pills}</div>
          ${extra.map(e=>`<p class="ah-none" style="color:var(--warn)">${esc(e)}</p>`).join('')}
          ${hs.length?`<ul class="ah-tree">${rows.join('')}</ul>`:'<p class="ah-none">Aucun titre trouvé.</p>'}`;
      }

      function renderImages(doc){
        const imgs=[...doc.querySelectorAll('img')];
        let ok=0,dec=0,err=0,sus=0,rows=[];
        imgs.forEach(img=>{
          const hasAlt=img.hasAttribute('alt');
          const alt=(img.getAttribute('alt')||'').trim();
          const src=img.getAttribute('src')||'(sans src)';
          let cls,msg;
          if(!hasAlt){cls='no';msg='Attribut alt absent — erreur.';err++;}
          else if(alt===''){cls='ok';msg='alt="" — image décorative, correct.';dec++;}
          else if(suspect(alt,src)){cls='wa';msg='Alternative suspecte : « '+alt+' » ressemble à un nom de fichier ou est générique.';sus++;}
          else{cls='ok';msg='Alternative présente : « '+alt+' ».';ok++;}
          rows.push(`<li class="ah-item ${cls}"><span class="bul" aria-hidden="true"></span><span class="body"><span class="src">${esc(src)}</span><span class="msg">${esc(msg)}</span></span></li>`);
        });
        const pills=[
          pill(imgs.length,'image'+(imgs.length>1?'s':''),'ok'),
          pill(ok+dec,'correcte'+(ok+dec>1?'s':''),'ok'),
          pill(sus,'suspecte'+(sus>1?'s':''),sus?'wa':'ok'),
          pill(err,'erreur'+(err>1?'s':''),err?'no':'ok')
        ].join('');
        return `<h2 class="ah-h3">Alternatives des images <span class="ah-pill" style="border:0;padding:0;color:var(--mute)">RGAA 1.1 · WCAG 1.1.1</span></h2>
          <div class="ah-summary">${pills}</div>
          ${imgs.length?`<ul class="ah-list">${rows.join('')}</ul>`:'<p class="ah-none">Aucune image (&lt;img&gt;) trouvée.</p>'}`;
      }

      function suspect(alt,src){
        if(/\.(jpe?g|png|gif|svg|webp|avif)$/i.test(alt))return true;
        if(/^(image|photo|img|picture|logo|icone|icon|visuel)\d*$/i.test(alt))return true;
        const base=(src.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'');
        if(base && alt.toLowerCase()===base.toLowerCase())return true;
        return false;
      }
      function pill(n,label,cls){return `<span class="ah-pill ${cls}"><span class="n">${n}</span> ${esc(label)}</span>`;}
    }
  });
})();
