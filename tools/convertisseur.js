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

  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const to2=n=>clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
  const rgbToHex=([r,g,b])=>('#'+to2(r)+to2(g)+to2(b)).toUpperCase();
  function hexToRgb(h){h=h.trim().replace(/^#/,'');if(h.length===3)h=h.split('').map(c=>c+c).join('');if(!/^[0-9a-fA-F]{6}$/.test(h))return null;return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function rgbToHsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return [h*360,s*100,l*100];}
  function hslToRgb(h,s,l){h=(h%360+360)%360/360;s=clamp(s,0,100)/100;l=clamp(l,0,100)/100;if(s===0){const v=Math.round(l*255);return [v,v,v];}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;const hue=t=>{t=(t%1+1)%1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};return [Math.round(hue(h+1/3)*255),Math.round(hue(h)*255),Math.round(hue(h-1/3)*255)];}

  // sRGB <-> OKLab/OKLCH (Björn Ottosson)
  const toLin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  const toSrgb=c=>{const v=c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055;return clamp(Math.round(v*255),0,255);};
  function rgbToOklch([r,g,b]){
    const R=toLin(r),G=toLin(g),B=toLin(b);
    const l=0.4122214708*R+0.5363325363*G+0.0514459929*B,
          m=0.2119034982*R+0.6806995451*G+0.1073969566*B,
          s=0.0883024619*R+0.2817188376*G+0.6299787005*B;
    const l_=Math.cbrt(l),m_=Math.cbrt(m),s_=Math.cbrt(s);
    const L=0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
          a=1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
          bb=0.0259040371*l_+0.7827717662*m_-0.8086757660*s_;
    const C=Math.hypot(a,bb);let H=Math.atan2(bb,a)*180/Math.PI;if(H<0)H+=360;
    return [L,C,H];
  }
  function oklchToRgb(L,C,H){
    const h=H*Math.PI/180, a=C*Math.cos(h), b=C*Math.sin(h);
    const l_=L+0.3963377774*a+0.2158037573*b,
          m_=L-0.1055613458*a-0.0638541728*b,
          s_=L-0.0894841775*a-1.2914855480*b;
    const l=l_**3,m=m_**3,s=s_**3;
    const R=+4.0767416621*l-3.3077115913*m+0.2309699292*s,
          G=-1.2684380046*l+2.6097574011*m-0.3413193965*s,
          B=-0.0041960863*l-0.7034186147*m+1.7076147010*s;
    return [toSrgb(R),toSrgb(G),toSrgb(B)];
  }

  // parsers
  function parseRgb(str){const m=str.match(/-?\d+(\.\d+)?/g);if(!m||m.length<3)return null;const [r,g,b]=m.map(Number);if([r,g,b].some(v=>v<0||v>255))return null;return [r,g,b].map(Math.round);}
  function parseHsl(str){const m=str.match(/-?\d+(\.\d+)?/g);if(!m||m.length<3)return null;const [h,s,l]=m.map(Number);return hslToRgb(h,s,l);}
  function parseOklch(str){const m=str.match(/-?\d+(\.\d+)?/g);if(!m||m.length<3)return null;let [L,C,H]=m.map(Number);if(/%/.test(str.split(/[ ,]/)[0])||L>1.5)L=L/100;return oklchToRgb(L,C,H);}

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
