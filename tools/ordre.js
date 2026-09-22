/* =========================================================================
   Outil : Ordre de lecture & focus.
   Critères : RGAA 12.8 (WCAG 2.4.3 ordre de focus), RGAA 10.3 (WCAG 1.3.2
   ordre de lecture significatif).
   L'aperçu est rendu dans une iframe sandbox SANS allow-scripts : le HTML
   collé ne s'exécute pas ; on lit seulement sa structure.
   ========================================================================= */
(function(){
  "use strict";
  const {dom} = window.TB;

  const CSS = `
  .ord-ta{width:100%;min-height:130px;font-family:var(--mono);font-size:.85rem;line-height:1.5;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);resize:vertical}
  .ord-ta:focus-visible{border-color:var(--signal)}
  .ord-bar{display:flex;gap:10px;align-items:center;margin:12px 0;flex-wrap:wrap}
  .ord-stage{position:relative;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;margin-top:8px}
  .ord-stage:fullscreen{overflow:auto;border-radius:0;border:0}
  .ord-frame{display:block;width:100%;border:0;background:#fff}
  .ord-overlay{position:absolute;top:0;left:0;width:100%;pointer-events:none}
  .ord-arrows{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
  .ord-arrows line{stroke:var(--signal-ink);stroke-width:2;opacity:.55}
  .ord-arrows marker path{fill:var(--signal-ink)}
  .ord-badge{position:absolute;background:var(--signal-ink);color:#fff;font:700 11px/1 var(--mono,monospace);
    min-width:18px;height:18px;padding:0 4px;border-radius:9px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 0 2px #fff;transform:translate(-45%,-45%)}
  .ord-legend{font-size:.82rem;color:var(--dim);margin:10px 0 0}
  .ord-bm{margin-top:20px;border-top:1px solid var(--line);padding-top:16px}
  .ord-bm .drag{display:inline-block;background:var(--signal-ink);color:#fff;font-weight:600;border-radius:9px;padding:8px 14px;text-decoration:none;cursor:grab}
  .ord-code{margin-top:10px;width:100%;font-family:var(--mono);font-size:.72rem;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);color:var(--dim);white-space:pre-wrap;word-break:break-all}
  `;

  const SAMPLE = `<header><a href="#">Accueil</a> <a href="#">Services</a></header>
<main>
  <h1>Bienvenue</h1>
  <button tabindex="3">Dernier dans le focus</button>
  <p>Un paragraphe. <a href="#">un lien</a>.</p>
  <button tabindex="1">Premier dans le focus</button>
  <input type="text" placeholder="Champ" tabindex="2">
</main>`;

  // Bookmarklet : superpose la numérotation de l'ordre de tabulation sur la page courante.
  const BOOKMARKLET = "javascript:(function(){var q='a[href],area[href],button,input:not([type=hidden]),select,textarea,iframe,[tabindex],[contenteditable=true]';var a=[].slice.call(document.querySelectorAll(q)).filter(function(e){var r=e.getBoundingClientRect();return !e.disabled&&e.tabIndex>=0&&r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'});function rk(e){return e.tabIndex>0?e.tabIndex:1e9}a.sort(function(x,y){return rk(x)-rk(y)});var NS='http://www.w3.org/2000/svg',W=Math.max(document.documentElement.scrollWidth,innerWidth),H=Math.max(document.documentElement.scrollHeight,innerHeight),s=document.createElementNS(NS,'svg');s.setAttribute('width',W);s.setAttribute('height',H);s.setAttribute('aria-hidden','true');s.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:2147483646';s.innerHTML='<defs><marker id=\"nah\" markerUnits=\"userSpaceOnUse\" markerWidth=\"11\" markerHeight=\"11\" refX=\"8\" refY=\"4\" orient=\"auto\"><path d=\"M0,0 L8,4 L0,8 Z\" fill=\"#056a4a\"/></marker></defs>';var p=a.map(function(e){var r=e.getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY}});for(var i=0;i<p.length-1;i++){var l=document.createElementNS(NS,'line');l.setAttribute('x1',p[i].x);l.setAttribute('y1',p[i].y);l.setAttribute('x2',p[i+1].x);l.setAttribute('y2',p[i+1].y);l.setAttribute('stroke','#056a4a');l.setAttribute('stroke-width','2');l.setAttribute('opacity','0.55');l.setAttribute('marker-end','url(#nah)');s.appendChild(l)}document.body.appendChild(s);a.forEach(function(e,i){var r=e.getBoundingClientRect();var b=document.createElement('div');b.textContent=i+1;b.style.cssText='position:absolute;z-index:2147483647;background:#056a4a;color:#fff;font:700 11px sans-serif;min-width:16px;height:16px;padding:0 3px;border-radius:8px;box-shadow:0 0 0 2px #fff;transform:translate(-45%,-45%)';b.style.left=(r.left+scrollX)+'px';b.style.top=(r.top+scrollY)+'px';document.body.appendChild(b)})})()";

  // Script injecté dans le nouvel onglet : recalcule l'ordre et dessine numéros + flèches.
  const OVERLAY_SCRIPT = `(function(){
    var MODE='__MODE__';
    var foc='a[href],area[href],button,input:not([type=hidden]),select,textarea,iframe,[tabindex],[contenteditable=true],audio[controls],video[controls]';
    var read='h1,h2,h3,h4,h5,h6,p,li,a[href],button,input:not([type=hidden]),select,textarea,img,figure,blockquote,td,th';
    function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';}
    var els;
    if(MODE==='tab'){
      els=[].slice.call(document.querySelectorAll(foc)).filter(function(e){return !e.disabled&&e.tabIndex>=0&&vis(e);});
      els=els.map(function(e,i){return{e:e,i:i};}).sort(function(a,b){var ra=a.e.tabIndex>0?a.e.tabIndex:1e9,rb=b.e.tabIndex>0?b.e.tabIndex:1e9;return ra-rb||a.i-b.i;}).map(function(o){return o.e;});
    }else{
      els=[].slice.call(document.querySelectorAll(read)).filter(vis);
    }
    var NS='http://www.w3.org/2000/svg';
    var W=Math.max(document.documentElement.scrollWidth,innerWidth),H=Math.max(document.documentElement.scrollHeight,innerHeight);
    var svg=document.createElementNS(NS,'svg');
    svg.setAttribute('width',W);svg.setAttribute('height',H);
    svg.setAttribute('aria-hidden','true');
    svg.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:2147483646';
    svg.innerHTML='<defs><marker id="ah" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#056a4a"/></marker></defs>';
    var pts=els.map(function(e){var r=e.getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY};});
    for(var i=0;i<pts.length-1;i++){var ln=document.createElementNS(NS,'line');ln.setAttribute('x1',pts[i].x);ln.setAttribute('y1',pts[i].y);ln.setAttribute('x2',pts[i+1].x);ln.setAttribute('y2',pts[i+1].y);ln.setAttribute('stroke','#056a4a');ln.setAttribute('stroke-width','2');ln.setAttribute('opacity','0.55');ln.setAttribute('marker-end','url(#ah)');svg.appendChild(ln);}
    document.body.appendChild(svg);
    els.forEach(function(e,i){var r=e.getBoundingClientRect();var b=document.createElement('div');b.textContent=i+1;b.style.cssText='position:absolute;z-index:2147483647;background:#056a4a;color:#fff;font:700 11px/1 monospace;min-width:18px;height:18px;padding:0 4px;border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff;transform:translate(-45%,-45%)';b.style.left=(r.left+scrollX)+'px';b.style.top=(r.top+scrollY)+'px';document.body.appendChild(b);});
  })();`;

  // Injecte une balise <base> pour que les URL relatives (CSS, images) se résolvent
  // contre l'adresse réelle de la page, au lieu de l'origine de la toolbox.
  function withBase(html,url){
    if(!url) return html;
    const base='<base href="'+url.replace(/"/g,'&quot;')+'">';
    if(/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, m=>m+base);
    if(/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, m=>m+'<head>'+base+'</head>');
    return '<head>'+base+'</head>'+html;
  }

  // Devine l'adresse réelle de la page à partir du source collé (canonical, og:url,
  // <base>, sinon l'origine du premier asset absolu). Sert à résoudre les CSS relatives.
  function attr(tag,name){const m=tag.match(new RegExp(name+'\\s*=\\s*["\\\']([^"\\\']+)','i'));return m?m[1]:null;}
  function detectBase(html){
    const bt=html.match(/<base\b[^>]*>/i);
    if(bt){const h=attr(bt[0],'href'); if(h&&/^https?:/i.test(h))return h;}
    for(const t of (html.match(/<link\b[^>]*>/gi)||[])){
      if(/rel\s*=\s*["\']?canonical/i.test(t)){const h=attr(t,'href'); if(h&&/^https?:/i.test(h))return h;}
    }
    for(const t of (html.match(/<meta\b[^>]*>/gi)||[])){
      if(/property\s*=\s*["\']?og:url/i.test(t)){const c=attr(t,'content'); if(c&&/^https?:/i.test(c))return c;}
    }
    const a=html.match(/(?:href|src)\s*=\s*["\'](https?:\/\/[^"\'\/]+)/i);
    return a?a[1]:'';
  }

  const HOWTO = `
    <p>Colle le HTML d'une page pour visualiser, superposés, soit l'ordre du DOM (l'ordre de lecture par défaut), soit l'ordre de tabulation au clavier. Le HTML collé n'est jamais exécuté (iframe sans scripts).</p>
    <h3>Deux ordres à comparer</h3>
    <ul>
      <li><b>Ordre de tabulation — RGAA 12.8 (WCAG 2.4.3)</b> : l'ordre dans lequel le focus clavier parcourt les éléments. Un <code>tabindex</code> positif le réorganise, souvent au détriment de la logique. Les numéros révèlent les incohérences.</li>
      <li><b>Ordre de lecture — RGAA 10.3 (WCAG 1.3.2)</b> : l'ordre du DOM, celui restitué par les lecteurs d'écran. Il doit rester cohérent même quand la mise en page CSS déplace les blocs visuellement.</li>
    </ul>
    <h3>Sur une vraie page</h3>
    <p>Glisse le bouton « Ordre de tabulation » (plus bas) dans ta barre de favoris, puis clique-le sur n'importe quel site pour y superposer la numérotation.</p>`;

  window.Toolbox.register({
    id:'ordre',
    name:'Ordre de lecture & focus',
    tagline:'Visualiser l\'ordre du DOM et l\'ordre de tabulation d\'une page.',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="15" width="7" height="5" rx="1"/><path d="M6.5 9v4a2 2 0 0 0 2 2H14"/></svg>',
    criteres:[
      {ref:'RGAA 12.8', wcag:'2.4.3', label:'Ordre de tabulation cohérent'},
      {ref:'RGAA 10.3', wcag:'1.3.2', label:'Ordre de lecture significatif'}
    ],
    howto:HOWTO,
    mount(root){
      dom.injectCss('css-ordre', CSS);
      root.innerHTML = `
      <div class="card card-pad" aria-label="Ordre de lecture et focus">
        <label class="lb" for="ord-input">Coller le HTML à visualiser</label>
        <textarea class="ord-ta" id="ord-input" spellcheck="false"></textarea>
        <label class="lb" for="ord-url" style="margin:12px 0 6px">URL de la page (facultatif) — pour charger ses styles et images</label>
        <input type="url" id="ord-url" class="field" placeholder="Laisse vide : détectée automatiquement dans le source" spellcheck="false">
        <p class="hint">Si tu laisses ce champ vide, l'outil tente de deviner l'adresse dans le source (balise canonical, og:url…) pour charger les feuilles de style externes. Le contenu généré par JavaScript n'apparaît pas ici ; pour une page complète et fidèle, préfère le bookmarklet plus bas, directement sur le site.</p>
        <div class="ord-bar">
          <button class="btn" id="ord-run" type="button">Visualiser</button>
          <button class="btn ghost" id="ord-sample" type="button">Charger un exemple</button>
          <button class="btn ghost" id="ord-full" type="button">Plein écran</button>
          <button class="btn ghost" id="ord-tab" type="button">Ouvrir dans un onglet</button>
          <div class="seg" role="group" aria-label="Ordre à afficher" style="margin-left:auto">
            <button type="button" data-mode="tab" aria-pressed="true">Tabulation</button>
            <button type="button" data-mode="dom" aria-pressed="false">Lecture (DOM)</button>
          </div>
        </div>
        <div class="ord-stage" id="ord-stage" hidden>
          <iframe class="ord-frame" id="ord-frame" title="Aperçu de la page analysée" sandbox="allow-same-origin"></iframe>
          <div class="ord-overlay" id="ord-overlay"></div>
        </div>
        <p class="ord-legend" id="ord-legend"></p>

        <div class="ord-bm">
          <p class="lb" style="margin-bottom:8px">Sur une vraie page : glisse ce bouton dans ta barre de favoris</p>
          <a class="drag" id="ord-drag" draggable="true">Ordre de tabulation</a>
          <p class="hint" style="margin-top:8px">Un clic ici ne fait rien d'utile (il s'appliquerait à cette page). Glisse-le dans les favoris, puis clique-le sur le site à tester. Ou copie le code&nbsp;:</p>
          <div class="ord-code" id="ord-code"></div>
        </div>
        <p class="status" id="ord-status" role="status" aria-live="polite"></p>
      </div>`;

      const q=s=>root.querySelector(s);
      let mode='tab';

      q('#ord-drag').setAttribute('href', BOOKMARKLET);
      q('#ord-code').textContent = BOOKMARKLET;

      q('#ord-sample').addEventListener('click',()=>{q('#ord-input').value=SAMPLE;visualise();});
      q('#ord-run').addEventListener('click',visualise);
      q('#ord-tab').addEventListener('click',openInTab);
      q('#ord-full').addEventListener('click',goFull);
      q('.ord-bar .seg').addEventListener('click',e=>{
        const b=e.target.closest('button');if(!b)return;
        mode=b.dataset.mode;
        q('.ord-bar .seg').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
        overlay();
      });

      const frame=q('#ord-frame');
      frame.addEventListener('load',()=>{ resize(); overlay(); });

      function visualise(){
        const html=q('#ord-input').value;
        if(!html.trim()){q('#ord-status').textContent='Colle du HTML puis clique sur « Visualiser ».';return;}
        q('#ord-stage').hidden=false;
        frame.srcdoc = withBase(html, currentUrl(html));
      }
      // URL à utiliser : celle saisie, sinon détectée dans le source (et affichée)
      function currentUrl(html){
        let u=q('#ord-url').value.trim();
        if(!u){ u=detectBase(html); if(u){ q('#ord-url').value=u; q('#ord-status').textContent='Origine détectée : '+u; } }
        return u;
      }
      function openInTab(){
        const html=q('#ord-input').value;
        if(!html.trim()){q('#ord-status').textContent='Colle du HTML avant d’ouvrir l’aperçu.';return;}
        const stripped=html.replace(/<script[\s\S]*?<\/script>/gi,'');
        const pageUrl=currentUrl(html);
        const base=pageUrl?'<base href="'+pageUrl.replace(/"/g,'&quot;')+'">':'';
        const doc='<!doctype html><html lang="fr"><head><meta charset="utf-8">'+base
          +'<title>Ordre & focus — aperçu Neodyr</title></head><body>'
          +stripped
          +'<scr'+'ipt>'+OVERLAY_SCRIPT.replace('__MODE__',mode)+'</scr'+'ipt>'
          +'</body></html>';
        const url=URL.createObjectURL(new Blob([doc],{type:'text/html'}));
        const w=window.open(url,'_blank');
        setTimeout(()=>URL.revokeObjectURL(url),30000);
        q('#ord-status').textContent = w ? 'Aperçu ouvert dans un nouvel onglet ('+(mode==='tab'?'tabulation':'lecture DOM')+').'
          : 'Le navigateur a bloqué l’onglet : autorise les popups pour ce site.';
      }
      function resize(){
        if(!frame.isConnected) return;
        try{
          const d=frame.contentDocument, h=Math.max(120,d.documentElement.scrollHeight);
          frame.style.height=h+'px';
          const ov=q('#ord-overlay'); if(ov) ov.style.height=h+'px'; // l'overlay suit la hauteur pour rester aligné
        }catch(e){}
      }
      function shown(d,e){const r=e.getBoundingClientRect();return r.width>0 && r.height>0 && d.defaultView.getComputedStyle(e).visibility!=='hidden';}
      function focusables(d){
        const sel='a[href],area[href],button,input:not([type="hidden"]),select,textarea,iframe,[tabindex],[contenteditable="true"],audio[controls],video[controls]';
        return [...d.querySelectorAll(sel)].filter(e=>!e.disabled && e.tabIndex>=0 && shown(d,e));
      }
      function readables(d){
        const sel='h1,h2,h3,h4,h5,h6,p,li,a[href],button,input:not([type="hidden"]),select,textarea,img,figure,blockquote,td,th';
        return [...d.querySelectorAll(sel)].filter(e=>shown(d,e));
      }
      function overlay(){
        const ov=q('#ord-overlay');
        if(!ov || !ov.isConnected) return; // outil quitté
        ov.innerHTML='';
        let d;try{d=frame.contentDocument;}catch(e){return;}
        if(!d||!d.body)return;
        let els;
        if(mode==='tab'){
          els=focusables(d);
          const rk=e=>e.tabIndex>0?e.tabIndex:1e9;
          els=els.map((e,i)=>({e,i})).sort((a,b)=>rk(a.e)-rk(b.e)||a.i-b.i).map(o=>o.e);
          q('#ord-legend').textContent='Ordre de tabulation au clavier : '+els.length+' élément(s) focusable(s). Un numéro « qui saute » révèle un tabindex mal placé.';
        }else{
          els=readables(d);
          q('#ord-legend').textContent='Ordre de lecture (DOM) : '+els.length+' bloc(s). C\'est l\'ordre restitué par les lecteurs d\'écran.';
        }
        // points d'ancrage (coin haut-gauche de chaque élément, là où est le numéro)
        const pts=els.map(e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top};});
        // flèches reliant chaque élément au suivant, dans l'ordre
        let lines='';
        for(let i=0;i<pts.length-1;i++){
          lines+=`<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[i+1].x.toFixed(1)}" y2="${pts[i+1].y.toFixed(1)}" marker-end="url(#ord-ah)"/>`;
        }
        ov.innerHTML=`<svg class="ord-arrows" aria-hidden="true"><defs><marker id="ord-ah" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"/></marker></defs>${lines}</svg>`;
        // numéros par-dessus les flèches
        els.forEach((e,i)=>{
          const r=e.getBoundingClientRect();
          const b=document.createElement('div');
          b.className='ord-badge';b.textContent=i+1;
          b.style.left=r.left+'px';b.style.top=r.top+'px';
          ov.appendChild(b);
        });
        q('#ord-status').textContent='Aperçu à jour.';
      }

      function goFull(){
        const stage=q('#ord-stage');
        if(stage.hidden){ visualise(); q('#ord-status').textContent='Aperçu généré — reclique sur « Plein écran ».'; return; }
        if(document.fullscreenElement){ document.exitFullscreen(); }
        else if(stage.requestFullscreen){ stage.requestFullscreen().catch(()=>{ q('#ord-status').textContent='Plein écran indisponible dans ce contexte.'; }); }
        else { q('#ord-status').textContent='Plein écran non géré par ce navigateur — utilise « Ouvrir dans un onglet ».'; }
      }
      function onFs(){ setTimeout(()=>{ resize(); overlay(); },80); } // dimensions changées : on recalcule

      let rt;
      const onResize=()=>{clearTimeout(rt);rt=setTimeout(()=>{resize();overlay();},150);};
      window.addEventListener('resize',onResize);
      document.addEventListener('fullscreenchange',onFs);

      // nettoyage à la navigation vers un autre outil
      return ()=>{
        window.removeEventListener('resize',onResize);
        document.removeEventListener('fullscreenchange',onFs);
        if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
      };
    }
  });
})();
