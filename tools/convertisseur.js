/* =========================================================================
   Outil : Convertisseur de couleurs — HEX / RGB / HSL / OKLCH.
   Outil support pour préparer des couleurs contrastées (WCAG 1.4.3 / 1.4.11).
   ========================================================================= */
(function(){
  "use strict";

  const CSS = `
  .cv-row{display:flex;gap:9px;align-items:center;margin-bottom:10px}
  .cv-row label{width:64px;flex:none;font-size:.78rem;font-weight:600;color:var(--dim);font-family:var(--mono)}
  .cv-row input{flex:1;font-family:var(--mono);font-size:.92rem;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text)}
  .cv-row input:focus-visible{border-color:var(--signal)}
  .cv-row input[aria-invalid="true"]{border-color:var(--fail)}
  .cv-copy{flex:none}
  .cv-preview{height:120px;border-radius:12px;border:1px solid rgba(0,0,0,.12);display:flex;align-items:flex-end;justify-content:space-between;padding:12px 14px;margin-bottom:16px;gap:10px}
  .cv-preview .lab{font-family:var(--mono);font-size:.8rem;font-weight:600;background:rgba(255,255,255,.85);color:#111;border-radius:6px;padding:2px 8px}
  .cv-tools{display:flex;gap:9px;align-items:center;margin-bottom:16px}
  .cv-note{font-size:.78rem;color:var(--mute);line-height:1.6;margin-top:6px}
  `;
  function ensureCss(){ if(!document.getElementById('css-convertisseur')){const s=document.createElement('style');s.id='css-convertisseur';s.textContent=CSS;document.head.appendChild(s);} }

  const {hexToRgb,rgbToHex,rgbToHsl,hslToRgb,rgbToOklch,oklchToRgb,parseRgb,parseHsl,parseOklch}=window.TB.color;

  function fmt(rgb){
    const [h,s,l]=rgbToHsl(rgb), [L,C,H]=rgbToOklch(rgb);
    return {
      hex:rgbToHex(rgb),
      rgb:`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
      hsl:`hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`,
      oklch:`oklch(${(L*100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`
    };
  }

  const HOWTO = `
    <p>Saisis une couleur dans n’importe quel format ; les trois autres se mettent à jour instantanément. Pratique pour passer d’un code de maquette (HEX) à une valeur CSS moderne (OKLCH), ou pour lire une couleur en RGB/HSL.</p>
    <h3>Pourquoi OKLCH ?</h3>
    <ul>
      <li>C’est un espace <b>perceptuellement uniforme</b> : à luminosité (L) égale, deux couleurs paraissent aussi lumineuses. Idéal pour bâtir des paires texte/fond au contraste prévisible.</li>
      <li>Faire varier uniquement <b>L</b> permet d’ajuster le contraste sans changer la teinte — exactement ce dont on a besoin pour respecter WCAG 1.4.3.</li>
    </ul>
    <p>Chaque champ dispose d’un bouton « Copier ». La pipette prélève une couleur n’importe où à l’écran.</p>`;

  window.Toolbox.register({
    id:'convertisseur',
    name:'Convertisseur de couleurs',
    tagline:'HEX, RGB, HSL et OKLCH — conversion instantanée dans les deux sens.',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h11M4 7l3-3M4 7l3 3"/><path d="M20 17H9M20 17l-3-3M20 17l-3 3"/></svg>',
    criteres:[
      {ref:'Support', wcag:'1.4.3', label:'Manipuler les couleurs pour le contraste du texte'},
      {ref:'Support', wcag:'1.4.11', label:'Couleurs des composants d’interface'}
    ],
    howto:HOWTO,
    mount(root){
      ensureCss();
      root.innerHTML = `
      <div class="card card-pad" aria-label="Convertisseur de couleurs" style="max-width:560px">
        <div class="cv-preview" id="cv-preview"><span class="lab" id="cv-lab">#0A9D63</span></div>
        <div class="cv-tools">
          <label class="swatch" id="cv-sw" style="background:#0a9d63" title="Nuancier"><input type="color" id="cv-pick" value="#0a9d63" aria-label="Sélecteur de couleur"></label>
          <button class="icon-btn" id="cv-eye" type="button" title="Pipette à l’écran" aria-label="Pipette"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L21 6l-3.4 3.4a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4Z"/></svg></button>
          <span class="hint" style="margin:0">Nuancier · pipette</span>
        </div>
        ${row('hex','HEX')}
        ${row('rgb','RGB')}
        ${row('hsl','HSL')}
        ${row('oklch','OKLCH')}
        <p class="cv-note">OKLCH accepte L en % ou en 0–1 (ex. <code>oklch(62% 0.13 165)</code>). Une couleur OKLCH hors du gamut sRGB est ramenée dans l’espace affichable.</p>
        <p class="status" id="cv-status" role="status" aria-live="polite"></p>
      </div>`;

      const q=s=>root.querySelector(s);
      let rgb=[10,157,99];

      function refresh(except){
        const f=fmt(rgb);
        if(except!=='hex') q('#cv-hex').value=f.hex;
        if(except!=='rgb') q('#cv-rgb').value=f.rgb;
        if(except!=='hsl') q('#cv-hsl').value=f.hsl;
        if(except!=='oklch') q('#cv-oklch').value=f.oklch;
        q('#cv-preview').style.background=f.hex;
        q('#cv-lab').textContent=f.hex;
        q('#cv-sw').style.background=f.hex;
        q('#cv-pick').value=f.hex.toLowerCase();
      }
      function say(m){const el=q('#cv-status');el.textContent=m;clearTimeout(say._t);say._t=setTimeout(()=>el.textContent='',2500);}

      const parsers={hex:hexToRgb,rgb:parseRgb,hsl:parseHsl,oklch:parseOklch};
      ['hex','rgb','hsl','oklch'].forEach(fmtId=>{
        const inp=q('#cv-'+fmtId);
        inp.addEventListener('input',()=>{const v=parsers[fmtId](inp.value);if(v){rgb=v;inp.removeAttribute('aria-invalid');refresh(fmtId);}else{inp.setAttribute('aria-invalid','true');}});
        inp.addEventListener('blur',()=>{inp.removeAttribute('aria-invalid');refresh();});
        q('#cv-copy-'+fmtId).addEventListener('click',async()=>{try{await navigator.clipboard.writeText(inp.value);say(fmtId.toUpperCase()+' copié : '+inp.value);}catch(e){inp.select();say('Sélectionné — fais Ctrl+C');}});
      });
      q('#cv-pick').addEventListener('input',()=>{const v=hexToRgb(q('#cv-pick').value);if(v){rgb=v;refresh();}});
      const eye=q('#cv-eye');
      if(window.EyeDropper)eye.addEventListener('click',async()=>{try{const r=await new EyeDropper().open();const v=hexToRgb(r.sRGBHex);if(v){rgb=v;refresh();say('Prélevé : '+rgbToHex(v));}}catch(e){}});
      else{eye.disabled=true;eye.style.opacity=.4;eye.title='Pipette non gérée par ce navigateur';}

      refresh();
    }
  });

  function row(id,label){return `
    <div class="cv-row">
      <label for="cv-${id}">${label}</label>
      <input type="text" id="cv-${id}" spellcheck="false" autocapitalize="off">
      <button class="icon-btn cv-copy" id="cv-copy-${id}" type="button" aria-label="Copier la valeur ${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>
    </div>`;}
})();
