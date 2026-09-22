/* =========================================================================
   Boîte à outils accessibilité — Neodyr
   Bibliothèque partagée : window.TB = { color, dom }.
   Chargée avant app.js et les outils. Aucune dépendance externe.
   ========================================================================= */
(function(){
  "use strict";

  const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));

  /* ------------------------------------------------------------------ couleur */
  const color = {
    clamp,
    hexToRgb(h){
      h = String(h).trim().replace(/^#/, '');
      if(h.length===3) h = h.split('').map(c=>c+c).join('');
      if(!/^[0-9a-fA-F]{6}$/.test(h)) return null;
      return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
    },
    rgbToHex([r,g,b]){
      const to2 = n=>clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
      return ('#'+to2(r)+to2(g)+to2(b)).toUpperCase();
    },
    rgbToHsl([r,g,b]){
      r/=255;g/=255;b/=255;
      const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
      if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);
        if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}
      return [h*360,s*100,l*100];
    },
    hslToRgb(h,s,l){
      h=(h%360+360)%360/360;s=clamp(s,0,100)/100;l=clamp(l,0,100)/100;
      if(s===0){const v=Math.round(l*255);return [v,v,v];}
      const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
      const hue=t=>{t=(t%1+1)%1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
      return [Math.round(hue(h+1/3)*255),Math.round(hue(h)*255),Math.round(hue(h-1/3)*255)];
    },
    /* WCAG 2.1 */
    relLum([r,g,b]){
      const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
      return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
    },
    wcag(a,b){const L1=color.relLum(a),L2=color.relLum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);},
    /* APCA (APCA-W3 0.1.9) */
    apcaY([r,g,b]){const s=v=>Math.pow(v/255,2.4);return 0.2126729*s(r)+0.7151522*s(g)+0.0721750*s(b);},
    apca(txt,bg){
      let Yt=color.apcaY(txt),Yb=color.apcaY(bg);const blk=0.022,c=1.414;
      Yt=Yt>blk?Yt:Yt+Math.pow(blk-Yt,c);Yb=Yb>blk?Yb:Yb+Math.pow(blk-Yb,c);
      if(Math.abs(Yb-Yt)<0.0005)return 0;
      let o;
      if(Yb>Yt){const S=(Math.pow(Yb,0.56)-Math.pow(Yt,0.57))*1.14;o=S<0.1?0:S-0.027;}
      else{const S=(Math.pow(Yb,0.65)-Math.pow(Yt,0.62))*1.14;o=S>-0.1?0:S+0.027;}
      return o*100;
    },
    /* Lab / distance perceptuelle CIE76 */
    rgbToLab([r,g,b]){
      const f=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
      let R=f(r),G=f(g),B=f(b);
      let X=(R*0.4124+G*0.3576+B*0.1805)/0.95047,Y=R*0.2126+G*0.7152+B*0.0722,Z=(R*0.0193+G*0.1192+B*0.9505)/1.08883;
      const g2=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;X=g2(X);Y=g2(Y);Z=g2(Z);
      return [116*Y-16,500*(X-Y),200*(Y-Z)];
    },
    deltaE(a,b){const la=color.rgbToLab(a),lb=color.rgbToLab(b);return Math.hypot(la[0]-lb[0],la[1]-lb[1],la[2]-lb[2]);},
    /* Daltonisme (matrices de simulation classiques) */
    CVD:{Protanopie:[[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],
         'Deutéranopie':[[0.625,0.375,0],[0.70,0.30,0],[0,0.30,0.70]],
         Tritanopie:[[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]]},
    applyCVD([r,g,b],m){
      return [clamp(Math.round(m[0][0]*r+m[0][1]*g+m[0][2]*b),0,255),
              clamp(Math.round(m[1][0]*r+m[1][1]*g+m[1][2]*b),0,255),
              clamp(Math.round(m[2][0]*r+m[2][1]*g+m[2][2]*b),0,255)];
    },
    /* OKLCH (Björn Ottosson) */
    rgbToOklch([r,g,b]){
      const toLin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
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
    },
    oklchToRgb(L,C,H){
      const toSrgb=c=>{const v=c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055;return clamp(Math.round(v*255),0,255);};
      const h=H*Math.PI/180,a=C*Math.cos(h),b=C*Math.sin(h);
      const l_=L+0.3963377774*a+0.2158037573*b,m_=L-0.1055613458*a-0.0638541728*b,s_=L-0.0894841775*a-1.2914855480*b;
      const l=l_**3,m=m_**3,s=s_**3;
      return [toSrgb(+4.0767416621*l-3.3077115913*m+0.2309699292*s),
              toSrgb(-1.2684380046*l+2.6097574011*m-0.3413193965*s),
              toSrgb(-0.0041960863*l-0.7034186147*m+1.7076147010*s)];
    },
    /* parseurs souples pour les champs texte */
    parseRgb(str){const m=String(str).match(/-?\d+(\.\d+)?/g);if(!m||m.length<3)return null;const [r,g,b]=m.map(Number);if([r,g,b].some(v=>v<0||v>255))return null;return [r,g,b].map(Math.round);},
    parseHsl(str){const m=String(str).match(/-?\d+(\.\d+)?/g);if(!m||m.length<3)return null;const [h,s,l]=m.map(Number);return color.hslToRgb(h,s,l);},
    parseOklch(str){const m=String(str).match(/-?\d+(\.\d+)?/g);if(!m||m.length<3)return null;let [L,C,H]=m.map(Number);const first=String(str).split(/[ ,(]/).filter(Boolean)[1]||'';if(/%/.test(first)||L>1.5)L=L/100;return color.oklchToRgb(L,C,H);}
  };

  /* ------------------------------------------------------------------ DOM */
  const dom = {
    q(root,sel){ return (sel===undefined?document:root).querySelector(sel===undefined?root:sel); },
    qa(root,sel){ return [...(sel===undefined?document:root).querySelectorAll(sel===undefined?root:sel)]; },
    /* injecte une feuille de style une seule fois (id unique par outil) */
    injectCss(id,css){ if(!document.getElementById(id)){const s=document.createElement('style');s.id=id;s.textContent=css;document.head.appendChild(s);} },
    /* copie presse-papier avec repli sélection */
    async copy(text,inputEl){
      try{ await navigator.clipboard.writeText(text); return true; }
      catch(e){ if(inputEl&&inputEl.select){inputEl.select();} return false; }
    },
    escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  };

  window.TB = { color, dom };
})();
