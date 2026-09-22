/* =========================================================================
   Outil : Cibles tactiles — taille minimale des zones cliquables.
   Critères : WCAG 2.5.8 (minimum 24 px), WCAG 2.5.5 (optimal 44 px).
   ========================================================================= */
(function(){
  "use strict";
  const {dom} = window.TB;

  const CSS = `
  .ct-wrap{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:18px}
  @media(max-width:720px){.ct-wrap{grid-template-columns:1fr}}
  .ct-inputs{display:flex;gap:12px;margin-bottom:14px}
  .ct-inputs .f{flex:1}
  .ct-num{width:100%;font-family:var(--mono);font-size:1rem;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text)}
  .ct-num:focus-visible{border-color:var(--signal)}
  .ct-stage{position:relative;background:var(--surface-2);border:1px solid var(--line);border-radius:12px;min-height:230px;padding:20px;display:flex;align-items:flex-start}
  .ct-ref{position:absolute;top:20px;left:20px;border:1px dashed var(--mute);border-radius:4px;pointer-events:none;display:flex;align-items:flex-end;justify-content:flex-end}
  .ct-ref span{font-family:var(--mono);font-size:.62rem;color:var(--mute);background:var(--surface-2);padding:0 3px;transform:translateY(100%)}
  .ct-box{position:relative;z-index:2;background:var(--signal-soft);border:2px solid var(--signal);border-radius:6px;
    overflow:auto;resize:both;min-width:8px;min-height:8px;display:flex;align-items:center;justify-content:center;
    font-family:var(--mono);font-size:.72rem;color:var(--signal-ink);font-weight:600}
  .ct-verdicts{display:flex;flex-direction:column;gap:10px;margin-top:16px}
  .ct-v{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:10px;padding:11px 13px;background:var(--surface)}
  .ct-v .bul{width:11px;height:11px;border-radius:50%;flex:none}
  .ct-v.ok .bul{background:var(--pass)}.ct-v.no .bul{background:var(--fail)}
  .ct-v .txt{font-size:.88rem}.ct-v .txt b{font-weight:600}
  .ct-v .st{margin-left:auto;font-weight:700;font-size:.82rem}
  .ct-v.ok .st{color:var(--pass)}.ct-v.no .st{color:var(--fail)}
  `;

  const HOWTO = `
    <p>Indique la taille d'une zone cliquable (bouton, lien, icône), ou <b>redimensionne la zone verte</b> en tirant sur son coin. L'outil compare aux deux seuils WCAG.</p>
    <h3>Les deux seuils</h3>
    <ul>
      <li><b>2.5.8 Taille de cible (minimum), niveau AA</b> : au moins <b>24 × 24 px</b>. Des exceptions existent (cible en ligne dans du texte, espacement suffisant, équivalent alternatif).</li>
      <li><b>2.5.5 Taille de cible (optimal), niveau AAA</b> : au moins <b>44 × 44 px</b>, la valeur recommandée pour un usage tactile confortable.</li>
    </ul>
    <p>Les carrés en pointillés matérialisent les seuils de 24 et 44 px pour comparer d'un coup d'œil.</p>`;

  window.Toolbox.register({
    id:'cibles',
    name:'Cibles tactiles',
    tagline:'Vérifier la taille minimale des zones cliquables (24 px / 44 px).',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
    criteres:[
      {ref:'WCAG', wcag:'2.5.8', label:'Taille de cible (minimum) — 24 px'},
      {ref:'WCAG', wcag:'2.5.5', label:'Taille de cible (optimal) — 44 px'}
    ],
    howto:HOWTO,
    mount(root){
      dom.injectCss('css-cibles', CSS);
      root.innerHTML = `
      <div class="card card-pad" aria-label="Cibles tactiles">
        <div class="ct-wrap">
          <div>
            <div class="ct-inputs">
              <div class="f"><label class="lb" for="ct-w">Largeur (px)</label><input class="ct-num" id="ct-w" type="number" min="1" max="400" value="40" inputmode="numeric"></div>
              <div class="f"><label class="lb" for="ct-h">Hauteur (px)</label><input class="ct-num" id="ct-h" type="number" min="1" max="400" value="40" inputmode="numeric"></div>
            </div>
            <div class="ct-verdicts" id="ct-verdicts"></div>
          </div>
          <div>
            <p class="lb">Aperçu à l'échelle (redimensionnable)</p>
            <div class="ct-stage">
              <div class="ct-ref" id="ct-ref44" style="width:44px;height:44px"><span>44</span></div>
              <div class="ct-ref" id="ct-ref24" style="width:24px;height:24px;border-color:var(--signal-ink)"><span style="color:var(--signal-ink)">24</span></div>
              <div class="ct-box" id="ct-box" tabindex="0" role="img" aria-label="Zone cliquable redimensionnable">40×40</div>
            </div>
          </div>
        </div>
        <p class="status" id="ct-status" role="status" aria-live="polite"></p>
      </div>`;

      const q=s=>root.querySelector(s);
      const box=q('#ct-box'), inW=q('#ct-w'), inH=q('#ct-h');
      let w=40,h=40, fromObserver=false;

      function verdicts(){
        const rows=[
          ['2.5.8', '24', 'Minimum (AA)', w>=24&&h>=24],
          ['2.5.5', '44', 'Optimal (AAA)', w>=44&&h>=44]
        ];
        q('#ct-verdicts').innerHTML=rows.map(([c,t,lbl,ok])=>
          `<div class="ct-v ${ok?'ok':'no'}"><span class="bul" aria-hidden="true"></span><span class="txt"><b>WCAG ${c}</b> · ${lbl} · ${t}×${t} px</span><span class="st">${ok?'Conforme':'Trop petit'}</span></div>`
        ).join('');
      }
      function applySize(){
        box.style.width=w+'px';box.style.height=h+'px';
        box.textContent=Math.round(w)+'×'+Math.round(h);
        box.setAttribute('aria-label','Zone cliquable de '+Math.round(w)+' sur '+Math.round(h)+' pixels');
        verdicts();
      }
      inW.addEventListener('input',()=>{w=clampNum(inW.value);applySize();});
      inH.addEventListener('input',()=>{h=clampNum(inH.value);applySize();});
      function clampNum(v){v=parseInt(v,10);if(isNaN(v))v=1;return Math.min(400,Math.max(1,v));}

      // redimensionnement à la souris -> met à jour les champs
      if('ResizeObserver' in window){
        const ro=new ResizeObserver(entries=>{
          for(const e of entries){
            const nw=Math.round(e.contentRect.width), nh=Math.round(e.contentRect.height);
            if(nw!==Math.round(w)||nh!==Math.round(h)){
              w=nw;h=nh;inW.value=nw;inH.value=nh;
              box.textContent=nw+'×'+nh;
              box.setAttribute('aria-label','Zone cliquable de '+nw+' sur '+nh+' pixels');
              verdicts();
            }
          }
        });
        ro.observe(box);
      }
      applySize();
    }
  });
})();
