/* =========================================================================
   Outil : Simulateur daltonisme sur image.
   Critère : RGAA 3.1 (WCAG 1.4.1) — ne pas véhiculer une information par la
   seule couleur. Traitement 100 % local (aucun envoi).
   ========================================================================= */
(function(){
  "use strict";
  const {color, dom} = window.TB;

  const CSS = `
  .dt-drop{border:2px dashed var(--line);border-radius:12px;padding:26px;text-align:center;background:var(--surface);transition:border-color .15s}
  .dt-drop.over{border-color:var(--signal);background:var(--signal-soft)}
  .dt-drop p{margin:8px 0 0;color:var(--dim);font-size:.88rem}
  .dt-file{display:inline-flex}
  .dt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:18px}
  .dt-fig{margin:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surface)}
  .dt-fig canvas{display:block;width:100%;height:auto;background:var(--surface-2)}
  .dt-fig figcaption{padding:9px 12px;font-size:.82rem;font-weight:600;border-top:1px solid var(--line)}
  .dt-fig figcaption span{display:block;font-weight:400;color:var(--dim);font-size:.76rem;margin-top:1px}
  `;

  const CVD_DESC={
    Protanopie:'absence des cônes rouges (~1 % des hommes)',
    'Deutéranopie':'absence des cônes verts (~1 % des hommes)',
    Tritanopie:'absence des cônes bleus (rare)'
  };

  const HOWTO = `
    <p>Charge une image (capture d'écran d'interface, graphique, logo…) : elle est affichée telle quelle, puis simulée pour trois formes de daltonisme. Le traitement est <b>entièrement local</b>, l'image ne quitte pas ton navigateur.</p>
    <h3>À quoi ça sert — RGAA 3.1 (WCAG 1.4.1)</h3>
    <p>Si une information repose uniquement sur la couleur (un statut « rouge/vert », une courbe distinguée par sa seule teinte), elle peut devenir illisible pour une personne daltonienne. La simulation permet de le repérer : si deux éléments deviennent indiscernables, il faut ajouter un autre indice (forme, texte, motif).</p>
    <p>Les simulations utilisent des matrices classiques : elles donnent une bonne indication, sans prétendre reproduire exactement la perception de chaque personne.</p>`;

  window.Toolbox.register({
    id:'daltonisme',
    name:'Simulateur daltonisme',
    tagline:'Voir une image en protanopie, deutéranopie et tritanopie.',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    criteres:[
      {ref:'RGAA 3.1', wcag:'1.4.1', label:'Information non portée par la seule couleur'}
    ],
    howto:HOWTO,
    mount(root){
      dom.injectCss('css-daltonisme', CSS);
      root.innerHTML = `
      <div class="card card-pad" aria-label="Simulateur daltonisme">
        <div class="dt-drop" id="dt-drop">
          <label class="btn dt-file">Choisir une image
            <input type="file" id="dt-file" accept="image/*" class="visually-hidden">
          </label>
          <p>ou glisse-dépose une image ici (traitement local, rien n'est envoyé).</p>
        </div>
        <div class="dt-grid" id="dt-grid" hidden></div>
        <p class="status" id="dt-status" role="status" aria-live="polite"></p>
      </div>`;

      const q=s=>root.querySelector(s);
      const drop=q('#dt-drop'), file=q('#dt-file'), grid=q('#dt-grid');

      file.addEventListener('change',()=>{if(file.files[0])load(file.files[0]);});
      ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
      ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
      drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f&&/^image\//.test(f.type))load(f);});

      function load(f){
        q('#dt-status').textContent='Chargement…';
        const reader=new FileReader();
        reader.onload=()=>{
          const img=new Image();
          img.onload=()=>render(img);
          img.onerror=()=>{q('#dt-status').textContent='Image illisible.';};
          img.src=reader.result;
        };
        reader.readAsDataURL(f);
      }

      function render(img){
        if(!grid.isConnected) return; // outil quitté pendant le chargement
        const MAX=460;
        const scale=Math.min(1, MAX/Math.max(img.width,img.height));
        const w=Math.max(1,Math.round(img.width*scale)), h=Math.max(1,Math.round(img.height*scale));
        const base=document.createElement('canvas');base.width=w;base.height=h;
        const bctx=base.getContext('2d');bctx.drawImage(img,0,0,w,h);
        let src;
        try{ src=bctx.getImageData(0,0,w,h); }
        catch(e){ q('#dt-status').textContent='Impossible de lire les pixels de cette image.'; return; }

        const views=[['Original',null]].concat(Object.keys(color.CVD).map(k=>[k,color.CVD[k]]));
        grid.hidden=false;
        grid.innerHTML=views.map(([name])=>`<figure class="dt-fig"><canvas id="dt-c-${slug(name)}" role="img" aria-label="Image simulée : ${name}"></canvas><figcaption>${name}${CVD_DESC[name]?`<span>${CVD_DESC[name]}</span>`:'<span>image d’origine</span>'}</figcaption></figure>`).join('');

        views.forEach(([name,m])=>{
          const cv=q('#dt-c-'+slug(name));cv.width=w;cv.height=h;
          const ctx=cv.getContext('2d');
          if(!m){ctx.putImageData(src,0,0);return;}
          const out=ctx.createImageData(w,h), s=src.data, d=out.data;
          for(let i=0;i<s.length;i+=4){
            const rgb=color.applyCVD([s[i],s[i+1],s[i+2]],m);
            d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=s[i+3];
          }
          ctx.putImageData(out,0,0);
        });
        q('#dt-status').textContent='Simulation prête ('+w+'×'+h+' px).';
      }
      function slug(s){return s.normalize('NFD').replace(/[^\w]/g,'').toLowerCase();}
    }
  });
})();
