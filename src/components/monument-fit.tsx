/**
 * Measures the resolved display face before first paint.
 *
 * The monument is sized from a fixed advance constant (`0.458em` per capital,
 * measured on the target) and compressed back onto it with a horizontal
 * `scale`. The right amount of compression depends on which face the local
 * `--font-narrow` stack actually resolved to, which only the browser knows: a
 * normal grotesque needs roughly `0.72`, an installed condensed face needs
 * none at all.
 *
 * It runs inline, synchronously, before the first paint, so the correct value
 * is used for the very first frame and no layout shift is introduced. It reads
 * the stack straight out of the cascade and measures on a canvas, so it never
 * touches layout. When it does not run — scripting disabled, or a browser
 * without canvas text metrics — the CSS default keeps the headline within a few
 * percent of its line.
 */
const FIT_SCRIPT = `(function(){try{
var r=document.documentElement;
var stack=getComputedStyle(r).getPropertyValue("--font-narrow").trim();
if(!stack)return;
var ctx=document.createElement("canvas").getContext("2d");
if(!ctx)return;
ctx.font='500 100px '+stack;
var sample="ANTARCTICA";
var advance=ctx.measureText(sample).width/sample.length/100;
if(!(advance>0))return;
var squeeze=Math.min(1,Math.max(0.55,0.458/advance));
r.style.setProperty("--monument-squeeze",String(Math.round(squeeze*1000)/1000));
}catch(e){}})();`;

export function MonumentFit() {
  return <script dangerouslySetInnerHTML={{ __html: FIT_SCRIPT }} />;
}
