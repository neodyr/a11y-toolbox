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

  /* Outils encore à venir : présents dans la navigation, avec leurs critères,
     mais dont l'interface arrivera dans une prochaine itération. */
  const ROADMAP = [
    { id:'audit-html', name:'Audit express HTML', tagline:'Hiérarchie des titres et images sans alternative, à partir de HTML collé.',
      icon:icoDoc(), criteres:[
        {ref:'RGAA 9.1', wcag:'1.3.1', label:'Structure des titres'},
        {ref:'RGAA 1.1', wcag:'1.1.1', label:'Alternative aux images'} ] },
    { id:'daltonisme', name:'Simulateur daltonisme', tagline:'Voir une image ou une interface en protanopie, deutéranopie et tritanopie.',
      icon:icoEye(), criteres:[
        {ref:'RGAA 3.1', wcag:'1.4.1', label:'Information non portée par la seule couleur'} ] },
    { id:'cibles', name:'Cibles tactiles', tagline:'Vérifier la taille minimale des zones cliquables (24 px / 44 px).',
      icon:icoTarget(), criteres:[
        {ref:'RGAA —', wcag:'2.5.8', label:'Taille de cible (minimum)'},
        {ref:'RGAA —', wcag:'2.5.5', label:'Taille de cible (optimale)'} ] },
    { id:'ordre', name:'Ordre de lecture & focus', tagline:'Visualiser l’ordre du DOM et l’ordre de tabulation d’une page.',
      icon:icoFlow(), criteres:[
        {ref:'RGAA 12.8', wcag:'2.4.3', label:'Ordre de tabulation cohérent'},
        {ref:'RGAA 10.3', wcag:'1.3.2', label:'Ordre de lecture significatif'} ] }
  ];

  let started = false;

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

    renderHead(entry);
    const root = document.getElementById('tool-root');
    root.innerHTML='';
    if(entry.ready && typeof entry.mount==='function'){
      try{ entry.mount(root); }
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

  /* ---------- icônes de secours pour la roadmap ---------- */
  function svg(p){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`; }
  function icoDoc(){ return svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'); }
  function icoEye(){ return svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'); }
  function icoTarget(){ return svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'); }
  function icoFlow(){ return svg('<rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="15" width="7" height="5" rx="1"/><path d="M6.5 9v4a2 2 0 0 0 2 2H14"/>'); }
})();
