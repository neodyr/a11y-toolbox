/* =========================================================================
   Outil : Colorimètre — contraste WCAG 2.1 + APCA, suggestions, daltonisme.
   Critères : RGAA 3.2 (WCAG 1.4.3), RGAA 3.3 (1.4.11), AAA (1.4.6), RGAA 3.1 (1.4.1).
   ========================================================================= */
(function(){
  "use strict";

  const CSS = `
  .colorblock{margin-bottom:14px}.colorblock:last-child{margin-bottom:0}
  .cb-label{display:flex;align-items:center;justify-content:space-between;font-size:.82rem;font-weight:600;margin:0 0 8px;color:var(--dim)}
  .adj-toggle{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
  .adj-toggle button{font:inherit;font-size:.72rem;font-weight:600;cursor:pointer;border:0;background:var(--surface-2);color:var(--dim);padding:4px 9px}
  .adj-toggle button[aria-pressed="true"]{background:var(--signal-ink);color:var(--btn-fg)}
  .cb-row{display:flex;gap:9px;align-items:center}
  .hexwrap{flex:1;display:flex;align-items:center;gap:7px}
  .hexwrap input[type=text]{width:100%;font-family:var(--mono);font-size:.95rem;font-weight:500;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text);text-transform:uppercase}
  .hexwrap input:focus-visible{border-color:var(--signal)}
  .swap-row{display:flex;justify-content:center;margin:6px 0}.swap{transform:rotate(90deg)}
  .opts{margin-top:16px;padding-top:16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
  .opt-label{font-size:.76rem;font-weight:600;color:var(--dim);margin:0 0 6px}
  .check{display:flex;gap:9px;align-items:flex-start;font-size:.8rem;color:var(--dim);cursor:pointer}
  .check input{margin-top:2px;accent-color:var(--signal);width:16px;height:16px}
  .preview{border-radius:12px;padding:26px 22px;min-height:150px;display:flex;flex-direction:column;justify-content:center;gap:6px;border:1px solid rgba(0,0,0,.12)}
  .preview .big{font-size:1.7rem;font-weight:700;font-family:var(--display)}
  .preview .small{font-size:.95rem}.preview .tiny{font-size:.78rem;opacity:.9}
  .ratio-row{display:flex;align-items:baseline;gap:12px;margin:16px 0 4px;flex-wrap:wrap}
  .ratio{font-family:var(--display);font-weight:700;font-size:2.6rem;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
  .ratio-verdict{font-size:.82rem;font-weight:600;padding:4px 10px;border-radius:20px}
  .v-pass{background:var(--pass-soft);color:var(--pass)}.v-warn{background:var(--warn-soft);color:var(--warn)}.v-fail{background:var(--fail-soft);color:var(--fail)}
  .badges{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-top:14px}
  .badge{border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--surface-2)}
  .badge .k{font-size:.7rem;color:var(--dim);font-weight:600}
  .badge .v{font-size:.82rem;font-weight:700;margin-top:3px;display:flex;align-items:center;gap:6px}
  .apca{margin-top:14px;padding-top:14px;border-top:1px solid var(--line);display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  .apca .lc{font-family:var(--mono);font-weight:600;font-size:1.4rem;color:var(--text);font-variant-numeric:tabular-nums}
  .apca .desc{font-size:.8rem;color:var(--dim)}
  .apca .tag{font-size:.7rem;font-family:var(--mono);color:var(--mute);border:1px solid var(--line);border-radius:6px;padding:1px 6px;margin-left:auto}
  .sug-sub{font-size:.82rem;color:var(--dim);margin:0 0 14px}.sug-sub b{color:var(--text)}
  .sugs{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px}
  .sug{border:1px solid var(--line);border-radius:11px;overflow:hidden;cursor:pointer;background:var(--surface);text-align:left;padding:0;font:inherit}
  .sug:hover{border-color:var(--signal)}
  .sug .chip{height:52px;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;font-size:1.05rem}
  .sug .meta{padding:7px 9px}.sug .meta .h{font-family:var(--mono);font-size:.78rem;font-weight:600;text-transform:uppercase;color:var(--text)}
  .sug .meta .r{font-size:.7rem;color:var(--mute);margin-top:1px}
  .empty{font-size:.85rem;color:var(--dim)}
  .pal-target{font-size:.82rem;color:var(--dim);margin:0 0 14px}.pal-target b{color:var(--text)}
  .pal-group{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;flex-wrap:wrap}.pal-group:last-child{margin-bottom:0}
  .pal-name{font-size:.72rem;font-weight:600;color:var(--mute);width:64px;flex:none;padding-top:6px;text-transform:uppercase;letter-spacing:.06em}
  .pal-row{display:flex;flex-wrap:wrap;gap:6px;flex:1}
  .pal{width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,0,0,.16);cursor:pointer;padding:0}
  .pal:hover{transform:scale(1.12)}
  .cvd{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.cvd figure{margin:0}
  .cvd .tile{border-radius:11px;padding:16px 14px;height:78px;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;font-size:1.05rem;border:1px solid rgba(0,0,0,.12)}
  .cvd figcaption{font-size:.76rem;color:var(--dim);margin-top:7px;display:flex;justify-content:space-between;gap:8px}
  .cvd figcaption b{color:var(--text);font-weight:600}.cvd .rr{font-family:var(--mono);font-variant-numeric:tabular-nums}
  `;
  function ensureCss(){ if(!document.getElementById('css-colorimetre')){const s=document.createElement('style');s.id='css-colorimetre';s.textContent=CSS;document.head.appendChild(s);} }

  /* ---------- maths couleur ---------- */
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  function hexToRgb(h){h=h.trim().replace(/^#/,'');if(h.length===3)h=h.split('').map(c=>c+c).join('');if(!/^[0-9a-fA-F]{6}$/.test(h))return null;return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  const to2=n=>clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
  const rgbToHex=([r,g,b])=>('#'+to2(r)+to2(g)+to2(b)).toUpperCase();
  function rgbToHsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return [h*360,s*100,l*100];}
  function hslToRgb(h,s,l){h=(h%360+360)%360/360;s=clamp(s,0,100)/100;l=clamp(l,0,100)/100;if(s===0){const v=Math.round(l*255);return [v,v,v];}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;const hue=t=>{t=(t%1+1)%1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};return [Math.round(hue(h+1/3)*255),Math.round(hue(h)*255),Math.round(hue(h-1/3)*255)];}
  function relLum([r,g,b]){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
  function wcag(a,b){const L1=relLum(a),L2=relLum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
  function apcaY([r,g,b]){const s=v=>Math.pow(v/255,2.4);return 0.2126729*s(r)+0.7151522*s(g)+0.0721750*s(b);}
  function apca(txt,bg){let Yt=apcaY(txt),Yb=apcaY(bg);const blk=0.022,c=1.414;Yt=Yt>blk?Yt:Yt+Math.pow(blk-Yt,c);Yb=Yb>blk?Yb:Yb+Math.pow(blk-Yb,c);if(Math.abs(Yb-Yt)<0.0005)return 0;let o;if(Yb>Yt){const S=(Math.pow(Yb,0.56)-Math.pow(Yt,0.57))*1.14;o=S<0.1?0:S-0.027;}else{const S=(Math.pow(Yb,0.65)-Math.pow(Yt,0.62))*1.14;o=S>-0.1?0:S+0.027;}return o*100;}
  function rgbToLab([r,g,b]){let R=r/255,G=g/255,B=b/255;const f=c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);R=f(R);G=f(G);B=f(B);let X=(R*0.4124+G*0.3576+B*0.1805)/0.95047,Y=R*0.2126+G*0.7152+B*0.0722,Z=(R*0.0193+G*0.1192+B*0.9505)/1.08883;const g2=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;X=g2(X);Y=g2(Y);Z=g2(Z);return [116*Y-16,500*(X-Y),200*(Y-Z)];}
  function deltaE(a,b){const la=rgbToLab(a),lb=rgbToLab(b);return Math.hypot(la[0]-lb[0],la[1]-lb[1],la[2]-lb[2]);}
  const CVD={Protanopie:[[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],'Deutéranopie':[[0.625,0.375,0],[0.70,0.30,0],[0,0.30,0.70]],Tritanopie:[[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]]};
  function applyCVD([r,g,b],m){return [clamp(Math.round(m[0][0]*r+m[0][1]*g+m[0][2]*b),0,255),clamp(Math.round(m[1][0]*r+m[1][1]*g+m[1][2]*b),0,255),clamp(Math.round(m[2][0]*r+m[2][1]*g+m[2][2]*b),0,255)];}

  const HOWTO = `
    <p>Saisis une couleur de <b>texte</b> et une couleur de <b>fond</b>. L’outil calcule le contraste selon deux méthodes complémentaires et propose, en cas d’échec, des couleurs valides proches de la tienne.</p>
    <h3>Deux mesures</h3>
    <ul>
      <li><b>WCAG&nbsp;2.1</b> — la référence légale (RGAA, EN&nbsp;301&nbsp;549). Rapport de 1 à 21. Seuils : 4,5:1 texte normal, 3:1 grand texte et composants d’interface.</li>
      <li><b>APCA</b> — le modèle perceptuel du futur WCAG&nbsp;3, plus fidèle à la lisibilité réelle. Valeur Lc de 0 à ~106.</li>
    </ul>
    <h3>Suggestions</h3>
    <p>Choisis la couleur « à ajuster » (texte ou fond). L’outil garde ta teinte et parcourt les luminosités/saturations pour trouver les variantes conformes les plus proches (distance perceptuelle Lab). Un clic applique la couleur.</p>
    <h3>Daltonisme</h3>
    <p>Le duo est simulé pour trois formes de daltonisme, avec le ratio recalculé — un contraste correct peut s’effondrer pour certains profils.</p>`;

  window.Toolbox.register({
    id:'colorimetre',
    name:'Colorimètre',
    tagline:'Contraste WCAG 2.1 et APCA, couleurs valides proches, simulation daltonisme.',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6 2 11c0 3 2.5 5 5 5h1.5c1 0 1.5.8 1.5 1.5 0 .5-.3 1-.3 1.5 0 1.4 1 2 2.3 2 5.5 0 10-4.5 10-10S17.5 2 12 2Z"/></svg>',
    criteres:[
      {ref:'RGAA 3.2', wcag:'1.4.3', label:'Contraste minimal du texte'},
      {ref:'RGAA 3.3', wcag:'1.4.11', label:'Contraste des composants et éléments graphiques'},
      {ref:'AAA', wcag:'1.4.6', label:'Contraste renforcé'},
      {ref:'RGAA 3.1', wcag:'1.4.1', label:'Information non portée par la seule couleur'}
    ],
    howto:HOWTO,
    mount(root){
      ensureCss();
      root.innerHTML = UI();
      const q=s=>root.querySelector(s), qa=s=>[...root.querySelectorAll(s)];
      const state={fg:[13,20,34],bg:[244,246,251],target:4.5,adjust:'fg',onlyL:false};

      function say(m){const el=q('#c-status');el.textContent=m;clearTimeout(say._t);say._t=setTimeout(()=>el.textContent='',2600);}

      function verdict(r){if(r>=7)return['v-pass','Excellent'];if(r>=4.5)return['v-pass','Bon (AA)'];if(r>=3)return['v-warn','Limite'];return['v-fail','Insuffisant'];}
      function apcaLabel(lc){const a=Math.abs(lc);if(a>=90)return'Maximal — tout texte';if(a>=75)return'Corps de texte (idéal ≥ 75)';if(a>=60)return'Grand texte / gras';if(a>=45)return'Titres, gros caractères';if(a>=30)return'Éléments non-texte seulement';if(a>=15)return'Décoratif — pas de texte';return'Insuffisant';}

      function render(){
        const {fg,bg}=state, ratio=wcag(fg,bg), lc=apca(fg,bg), fgHex=rgbToHex(fg), bgHex=rgbToHex(bg);
        const pv=q('#c-preview');pv.style.background=bgHex;pv.style.color=fgHex;
        q('#c-ratio').textContent=ratio.toFixed(2).replace(/\.?0+$/,'')+':1';
        const [vc,vt]=verdict(ratio);const v=q('#c-verdict');v.className='ratio-verdict '+vc;v.textContent=vt;
        const rows=[['Texte normal AA',ratio>=4.5],['Texte normal AAA',ratio>=7],['Grand texte AA',ratio>=3],['Grand texte AAA',ratio>=4.5],['Interface 1.4.11',ratio>=3]];
        q('#c-badges').innerHTML=rows.map(([k,ok])=>`<div class="badge"><div class="k">${k}</div><div class="v"><span class="dot ${ok?'p':'f'}"></span>${ok?'Conforme':'Échec'}</div></div>`).join('');
        q('#c-apca-lc').textContent='Lc '+Math.round(lc);
        q('#c-apca-desc').textContent=apcaLabel(lc);
        renderSug();
        q('#c-cvd').innerHTML=Object.entries(CVD).map(([n,m])=>{const f=applyCVD(fg,m),b=applyCVD(bg,m),rr=wcag(f,b),ok=rr>=state.target;return `<figure><div class="tile" style="background:${rgbToHex(b)};color:${rgbToHex(f)}">Aa Texte</div><figcaption><b>${n}</b> <span class="rr" style="color:${ok?'var(--pass)':'var(--fail)'}">${rr.toFixed(1)}:1</span></figcaption></figure>`;}).join('');
      }
      function renderSug(){
        const {adjust,target,onlyL}=state, fixed=adjust==='fg'?state.bg:state.fg, orig=adjust==='fg'?state.fg:state.bg, cur=wcag(state.fg,state.bg);
        const label=adjust==='fg'?'texte':'fond', other=adjust==='fg'?'fond':'texte', sub=q('#c-sug-sub');
        if(cur>=target)sub.innerHTML=`Le duo atteint déjà l’objectif (<b>${cur.toFixed(2)}:1 ≥ ${String(target).replace('.',',')}</b>). Variantes du <b>${label}</b> encore mieux contrastées :`;
        else sub.innerHTML=`Objectif <b>${String(target).replace('.',',')}:1</b> non atteint (actuel ${cur.toFixed(2)}:1). Variantes du <b>${label}</b> (${other} fixé) les plus proches, toutes conformes :`;
        const cands=find(fixed,orig,target,onlyL), box=q('#c-sugs'), empty=q('#c-empty');
        if(!cands.length){box.innerHTML='';empty.hidden=false;empty.textContent=`Aucune variante du ${label} n’atteint ${String(target).replace('.',',')}:1 en gardant la teinte. Modifie aussi le ${other}, ou décoche « ne changer que la luminosité ».`;return;}
        empty.hidden=true;
        box.innerHTML=cands.map(c=>{const cf=adjust==='fg'?rgbToHex(fixed):c.hex, cb=adjust==='fg'?c.hex:rgbToHex(fixed);return `<button class="sug" data-hex="${c.hex}" title="Appliquer ${c.hex}"><span class="chip" style="background:${cb};color:${cf}">Aa</span><span class="meta"><span class="h">${c.hex}</span><span class="r">${c.ratio.toFixed(2)}:1</span></span></button>`;}).join('');
      }
      function find(fixed,orig,target,onlyL){const [h,s]=rgbToHsl(orig);const out=[],seen=new Set();const sList=onlyL?[s]:[];if(!onlyL)for(let ss=0;ss<=100;ss+=4)sList.push(ss);for(const ss of sList)for(let ll=0;ll<=100;ll+=1.5){const rgb=hslToRgb(h,ss,ll);if(wcag(rgb,fixed)>=target){const hex=rgbToHex(rgb);if(seen.has(hex))continue;seen.add(hex);out.push({hex,rgb,ratio:wcag(rgb,fixed),dist:deltaE(rgb,orig)});}}out.sort((a,b)=>a.dist-b.dist);const picked=[];for(const c of out){if(picked.every(p=>deltaE(p.rgb,c.rgb)>4))picked.push(c);if(picked.length>=8)break;}return picked;}

      function setColor(which,rgb,silent){state[which]=rgb;const hex=rgbToHex(rgb);q('#c-hex-'+which).value=hex;q('#c-pick-'+which).value=hex.toLowerCase();q('#c-sw-'+which).style.background=hex;if(!silent)render();}
      function bindColor(which){
        const hex=q('#c-hex-'+which),pick=q('#c-pick-'+which),eye=q('#c-eye-'+which);
        hex.addEventListener('input',()=>{let val=hex.value.trim();if(val&&val[0]!=='#')val='#'+val;const rgb=hexToRgb(val);if(rgb){state[which]=rgb;pick.value=rgbToHex(rgb).toLowerCase();q('#c-sw-'+which).style.background=rgbToHex(rgb);render();}});
        hex.addEventListener('blur',()=>setColor(which,hexToRgb(hex.value)||state[which]));
        pick.addEventListener('input',()=>{const rgb=hexToRgb(pick.value);if(rgb)setColor(which,rgb);});
        if(window.EyeDropper){eye.addEventListener('click',async()=>{try{const r=await new EyeDropper().open();const rgb=hexToRgb(r.sRGBHex);if(rgb){setColor(which,rgb);say('Couleur prélevée : '+rgbToHex(rgb));}}catch(e){}});}
        else{eye.disabled=true;eye.title='Pipette non gérée par ce navigateur';eye.style.opacity=.4;}
      }
      function buildPalette(){
        const groups=[['Neodyr',['#0A0D13','#0D1422','#111723','#056A4A','#0A9D63','#4FE1A3','#E4F6EE','#F5F7FB']]];
        const hues=[0,30,55,90,140,165,190,215,250,280,310,335];
        [['Foncé',34,68],['Vif',50,74],['Clair',72,70]].forEach(([n,L,S])=>groups.push([n,hues.map(h=>rgbToHex(hslToRgb(h,S,L)))]));
        groups.push(['Gris',[0,12,25,38,50,62,75,88,100].map(l=>rgbToHex(hslToRgb(0,0,l)))]);
        q('#c-palette').innerHTML=groups.map(([n,cols])=>`<div class="pal-group"><span class="pal-name">${n}</span><span class="pal-row">`+cols.map(c=>`<button type="button" class="pal" style="background:${c}" data-hex="${c}" aria-label="Couleur ${c}"></button>`).join('')+`</span></div>`).join('');
      }

      // câblage
      qa('.adj-toggle button').forEach(btn=>btn.addEventListener('click',()=>{state.adjust=btn.dataset.adj;qa('.adj-toggle button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.adj===state.adjust));q('#c-pal-target').textContent=state.adjust==='fg'?'texte':'fond';renderSug();}));
      q('#c-target').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.target=parseFloat(b.dataset.t);q('#c-target').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();});
      q('#c-onlyL').addEventListener('change',e=>{state.onlyL=e.target.checked;renderSug();});
      q('#c-swap').addEventListener('click',()=>{const f=state.fg;setColor('fg',state.bg,true);setColor('bg',f,true);render();say('Texte et fond inversés');});
      q('#c-sugs').addEventListener('click',e=>{const b=e.target.closest('.sug');if(!b)return;setColor(state.adjust,hexToRgb(b.dataset.hex));say(b.dataset.hex+' appliqué au '+(state.adjust==='fg'?'texte':'fond'));});
      q('#c-palette').addEventListener('click',e=>{const b=e.target.closest('.pal');if(!b)return;setColor(state.adjust,hexToRgb(b.dataset.hex));say(b.dataset.hex+' → '+(state.adjust==='fg'?'texte':'fond'));});

      buildPalette();bindColor('fg');bindColor('bg');render();
    }
  });

  function UI(){return `
  <div class="grid2">
    <section class="card card-pad" aria-label="Choix des couleurs">
      <h2>Couleurs</h2>
      <p class="hint" style="margin:-6px 0 14px">Clique la pastille pour le nuancier complet · l’icône pipette prélève une couleur à l’écran · ou pioche dans la palette plus bas.</p>
      <div class="colorblock">
        <p class="cb-label"><span>Texte (premier plan)</span><span class="adj-toggle" role="group" aria-label="Couleur à ajuster : texte"><button type="button" data-adj="fg" aria-pressed="true">à ajuster</button></span></p>
        <div class="cb-row">
          <label class="swatch" style="background:#0d1422" id="c-sw-fg" title="Choisir la couleur du texte"><input type="color" id="c-pick-fg" value="#0d1422" aria-label="Sélecteur couleur du texte"></label>
          <span class="hexwrap"><input type="text" id="c-hex-fg" value="#0D1422" spellcheck="false" aria-label="Code hexadécimal du texte" maxlength="7">
            <button class="icon-btn" id="c-eye-fg" type="button" title="Pipette à l’écran" aria-label="Pipette pour le texte"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L21 6l-3.4 3.4a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4Z"/></svg></button></span>
        </div>
      </div>
      <div class="swap-row"><button class="icon-btn swap" id="c-swap" type="button" title="Inverser texte et fond" aria-label="Inverser le texte et le fond"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4 3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/></svg></button></div>
      <div class="colorblock">
        <p class="cb-label"><span>Fond (arrière-plan)</span><span class="adj-toggle" role="group" aria-label="Couleur à ajuster : fond"><button type="button" data-adj="bg" aria-pressed="false">à ajuster</button></span></p>
        <div class="cb-row">
          <label class="swatch" style="background:#f4f6fb" id="c-sw-bg" title="Choisir la couleur du fond"><input type="color" id="c-pick-bg" value="#f4f6fb" aria-label="Sélecteur couleur du fond"></label>
          <span class="hexwrap"><input type="text" id="c-hex-bg" value="#F4F6FB" spellcheck="false" aria-label="Code hexadécimal du fond" maxlength="7">
            <button class="icon-btn" id="c-eye-bg" type="button" title="Pipette à l’écran" aria-label="Pipette pour le fond"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L21 6l-3.4 3.4a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4Z"/></svg></button></span>
        </div>
      </div>
      <div class="opts">
        <div><p class="opt-label">Objectif de conformité</p>
          <div class="seg" id="c-target" role="group" aria-label="Objectif de conformité">
            <button type="button" data-t="4.5" aria-pressed="true">AA texte · 4,5</button>
            <button type="button" data-t="7" aria-pressed="false">AAA texte · 7</button>
            <button type="button" data-t="3" aria-pressed="false">Grand texte / UI · 3</button>
          </div>
        </div>
        <label class="check"><input type="checkbox" id="c-onlyL"> <span>Ne changer que la luminosité (garder teinte + saturation)</span></label>
      </div>
    </section>

    <section class="card card-pad" aria-label="Résultat du contraste">
      <h2>Résultat</h2>
      <div class="preview" id="c-preview"><span class="big">Titre d’exemple</span><span class="small">Une phrase de texte courant pour juger la lisibilité réelle.</span><span class="tiny">Petite mention légale · 12 px</span></div>
      <div class="ratio-row"><span class="ratio" id="c-ratio">21:1</span><span class="ratio-verdict v-pass" id="c-verdict">Excellent</span></div>
      <div class="badges" id="c-badges"></div>
      <div class="apca"><span class="lc" id="c-apca-lc">Lc 106</span><span class="desc" id="c-apca-desc">Contraste perceptuel APCA</span><span class="tag">APCA W3</span></div>
    </section>
  </div>

  <section class="card card-pad" aria-label="Palette" style="margin-top:18px">
    <h2>Palette</h2>
    <p class="pal-target">Un clic applique la couleur au <b id="c-pal-target">texte</b> (la couleur « à ajuster »).</p>
    <div id="c-palette"></div>
  </section>

  <section class="card card-pad" aria-label="Couleurs suggérées" style="margin-top:18px">
    <h2>Couleurs valides proches</h2>
    <p class="sug-sub" id="c-sug-sub"></p>
    <div class="sugs" id="c-sugs"></div>
    <p class="empty" id="c-empty" hidden></p>
  </section>

  <section class="card card-pad" aria-label="Simulation daltonisme" style="margin-top:18px">
    <h2>Rendu pour les daltonismes</h2>
    <p class="sug-sub">Le même duo tel que le perçoivent trois formes de daltonisme, ratio WCAG recalculé.</p>
    <div class="cvd" id="c-cvd"></div>
  </section>

  <p class="status" id="c-status" role="status" aria-live="polite"></p>`;}
})();
