// Adaptive rendering scale is available only in Auto. Manual quality settings
// remain authoritative. Uses hysteresis and bounded sample windows to avoid
// resolution pumping when travelling between areas.
export function createFrameBudget({baseRatio=1,deviceRatio=1,windowSeconds=5}={}){
 const baseline=Math.max(.5,Math.min(1.5,baseRatio,deviceRatio));
 let scale=1,elapsed=0,samples=0,seconds=0,cooldown=0,changes=0,lastMeanMs=0;
 const steps=[.65,.8,1];
 return {
  sample(dt,{auto=true,visible=true}={}){
   if(!auto||!visible||!Number.isFinite(dt)||dt<=0){elapsed=0;seconds=0;samples=0;return null}
   elapsed+=dt;seconds+=dt;samples++;cooldown=Math.max(0,cooldown-dt);
   if(elapsed<windowSeconds)return null;
   lastMeanMs=1000*seconds/Math.max(1,samples);
   elapsed=seconds=samples=0;
   if(cooldown>0)return null;
   const current=steps.findIndex(n=>n>=scale-.001);
   let index=current;
   // <22 FPS triggers downscale; >51 FPS over repeated windows can recover.
   if(lastMeanMs>45&&current>0)index--;
   else if(lastMeanMs<19.5&&current<steps.length-1)index++;
   if(index===current)return null;
   scale=steps[index];cooldown=12;changes++;
   return {pixelRatio:Math.max(.5,baseline*scale),scale,shadows:scale>=.8,meanMs:lastMeanMs};
  },
  state:()=>({scale,pixelRatio:Math.max(.5,baseline*scale),meanMs:lastMeanMs,changes,cooldown})
 };
}
