/* =========================================================================
   Boîte à outils accessibilité — Neodyr
   Squelette : registre de modules, routage par hash, thème, accessibilité.
   Chaque outil s'enregistre via Toolbox.register({...}). Voir tools/*.js.
   ========================================================================= */
(function(){
  "use strict";

  const Toolbox = window.Toolbox = {
    _mods: [],
    register(mod){ this._mods.push(mod); }
  };

  /* Outils à venir : fiches présentes dans la nav avant leur mise en service.
     Vide aujourd'hui : les quatre outils prévus sont des modules réels dans tools/. */
  const ROADMAP = [];

  let started = false;
  let currentCleanup = null;

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    buildNav();
    initTheme();
    window.addEventListener('hashchange', ()=>route(true));
    route(false);
    started = true;
  }

  /* ---------- navigation ---------- */
  function allEntries(){
    const real = Toolbox._mods.map(m=>({...m, ready:true}));
    const soon = ROADMAP.filter(r=>!Toolbox._mods.some(m=>m.id===r.id)).map(r=>({...r, ready:false}));
    return real.concat(soon);
  }
  function buildNav(){
    const ul = document.getElementById('nav');
    ul.innerHTML = allEntries().map(e=>`
      <li><a href="#${e.id}" ${e.ready?'':'class="soon"'} data-id="${e.id}">
        <span class="ico" aria-hidden="true">${e.icon}</span>
        <span>${e.name}</span>
        ${e.ready?'':'<span class="tag">à venir</span>'}
      </a></li>`).join('');
  }

  /* ---------- routage ---------- */
  function route(userNav){
    const id = (location.hash||'').replace(/^#/, '') || allEntries()[0].id;
    const entry = allEntries().find(e=>e.id===id) || allEntries()[0];

    // état visuel de la navigation
    document.querySelectorAll('#nav a').forEach(a=>{
      const cur = a.dataset.id===entry.id;
      if(cur) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    document.title = entry.name + ' — Boîte à outils accessibilité Neodyr';

    if(typeof currentCleanup==='function'){ try{ currentCleanup(); }catch(e){} currentCleanup=null; }
    renderHead(entry);
    const root = document.getElementById('tool-root');
    root.innerHTML='';
    if(entry.ready && typeof entry.mount==='function'){
      try{ const c = entry.mount(root); if(typeof c==='function') currentCleanup=c; }
      catch(err){ root.innerHTML = `<p class="hint">Erreur de chargement de l’outil : ${String(err.message||err)}</p>`; }
    }else{
      root.appendChild(placeholder(entry));
    }

    announce('Outil affiché : ' + entry.name);
    if(userNav || started){
      const h = document.getElementById('tool-title');
      if(h){ h.focus(); }
    }
  }

  function renderHead(e){
    const head = document.getElementById('tool-head');
    const crit = e.criteres && e.criteres.length ? `
      <p class="criteres"><span class="lbl">Critères visés :</span>${e.criteres.map(c=>
        `<span class="crit"><b>${c.ref}</b><span class="w">WCAG ${c.wcag}</span></span>`).join('')}</p>` : '';
    const howtoBody = e.howto || '<p>La documentation de cet outil arrivera avec sa mise en service.</p>';
    const video = `
      <div class="video-slot">
        <span aria-hidden="true">🎬</span>
        <span><b>Explication vidéo (à venir)</b> — un tutoriel court, avec transcription et sous-titres,
        sera intégré ici. L’emplacement est prêt et accessible.</span>
      </div>`;
    head.innerHTML = `
      <p class="eyebrow">Boîte à outils · accessibilité numérique</p>
      <h1 id="tool-title" tabindex="-1">${e.name}</h1>
      <p class="lede">${e.tagline||''}</p>
      ${crit}
      <details class="howto">
        <summary>Comment ça marche &amp; critères couverts</summary>
        <div class="howto-body">${howtoBody}${video}</div>
      </details>`;
  }

  function placeholder(e){
    const div = document.createElement('div');
    div.className='card card-pad';
    div.innerHTML = `<h2>Outil en construction</h2>
      <p class="hint" style="font-size:.9rem">Cet outil fait partie de la feuille de route de la boîte à outils.
      Sa fiche (objectif, critères RGAA/WCAG visés) est déjà en place ci-dessus ; l’interface interactive arrive prochainement.</p>`;
    return div;
  }

  /* ---------- annonces lecteur d'écran ---------- */
  function announce(msg){
    const live = document.getElementById('sr-announce');
    if(!live) return;
    live.textContent=''; // force le renvoi même si texte identique
    window.requestAnimationFrame(()=>{ live.textContent = msg; });
  }
  Toolbox.announce = announce;

  /* ---------- thème (système → clair → sombre) ---------- */
  function initTheme(){
    const btn = document.getElementById('theme');
    const root = document.documentElement;
    let mode = null;
    try{ mode = localStorage.getItem('a11ytb-theme'); }catch(e){}
    function label(){
      const map = {light:'Thème : clair', dark:'Thème : sombre'};
      const txt = map[mode] || 'Thème : système';
      btn.querySelector('.t-lbl').textContent = txt;
      btn.setAttribute('aria-label', txt + ' — activer pour changer');
    }
    function apply(){
      if(mode==='light'||mode==='dark') root.setAttribute('data-theme',mode);
      else root.removeAttribute('data-theme');
      label();
    }
    apply();
    btn.addEventListener('click', ()=>{
      mode = mode==null ? 'light' : mode==='light' ? 'dark' : null;
      try{ mode ? localStorage.setItem('a11ytb-theme',mode) : localStorage.removeItem('a11ytb-theme'); }catch(e){}
      apply();
      announce(btn.querySelector('.t-lbl').textContent);
    });
  }

})();
