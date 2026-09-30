export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const smoothstep=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
export const angleDelta=d=>Math.atan2(Math.sin(d),Math.cos(d));
export function createRng(seed=7){
  let state=seed;
  return ()=>(state=(state*16807)%2147483647)/2147483647;
}
