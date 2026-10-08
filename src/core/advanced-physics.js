export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function wheelContact(x,z,heading,groundAt,wheelbase=3.4,track=1.6){
 const fx=Math.sin(heading),fz=Math.cos(heading),sx=fz,sz=-fx;
 const corners=[];
 for(const long of [-1,1])for(const side of [-1,1]){
  const px=x+fx*wheelbase*.5*long+sx*track*.5*side,pz=z+fz*wheelbase*.5*long+sz*track*.5*side;
  corners.push(groundAt(px,pz));
 }
 if(!corners.every(Number.isFinite))return {valid:false,pitch:0,roll:0,height:0};
 const [rearL,rearR,frontL,frontR]=corners;
 const front=(frontL+frontR)*.5,rear=(rearL+rearR)*.5;
 const left=(rearL+frontL)*.5,right=(rearR+frontR)*.5;
 return {valid:true,height:corners.reduce((a,b)=>a+b,0)/4,pitch:Math.atan2(front-rear,wheelbase),roll:Math.atan2(right-left,track),range:Math.max(...corners)-Math.min(...corners)};
}
export function tractionStep(state,{dt=0,steering=0,speed=0,wet=0,groundRange=0,type='car'}={}){
 const d=clamp(dt,0,.05),grip=clamp(1-wet*.28-Math.min(groundRange*.035,.3),.38,1);
 const target=clamp(-steering*speed/Math.max(22,55*grip),-.68,.68);
 state.slip=(state.slip||0)+(target-(state.slip||0))*(1-Math.exp(-d*(3.5*grip+1)));
 const drift=Math.abs(state.slip)*Math.abs(speed)>6;
 state.suspension=(state.suspension||0)+(clamp(groundRange*.09,0,.4)-(state.suspension||0))*(1-Math.exp(-d*5));
 return {grip,slip:state.slip,drift,roll:clamp(state.slip*.17,-.16,.16),suspension:state.suspension};
}
export function aircraftForces({speed=0,pitch=0,altitude=0,dt=0,groundY=0,verticalSpeed=0}={}){
 const airspeed=Math.max(0,speed),stall=clamp((30-airspeed)/14,0,1);
 const sink=stall*8+Math.max(0,Math.abs(pitch)-.32)*8;
 const climb=Math.sin(pitch)*airspeed*(1-stall*.55)-sink;
 const y=Math.max(groundY+1.3,altitude+climb*clamp(dt,0,.05));
 return {stall:stall>.15,stallFactor:stall,verticalSpeed:climb,altitude:y,grounded:y<=groundY+1.301};
}
export function hullMotion({time=0,speed=0,heading=0,roughness=0,size=6}={}){
 const base=.07+clamp(roughness,0,1)*.25,phase=time*.9+heading;
 const lengthResponse=clamp(6/Math.max(3,size),.24,1);
 return {heave:Math.sin(phase*1.4)*base+Math.cos(phase*.8)*base*.35,
 pitch:Math.sin(phase*1.15)*base*.15*lengthResponse-Math.min(32,speed)*.0015,
 roll:Math.cos(phase*.92)*base*.19*lengthResponse};
}
export function submarineAttitude({pitch=0,depth=0,depthDelta=0,dt=0}={}){
 return pitch+ (clamp(-depthDelta*.12,-.16,.16)-pitch)*(1-Math.exp(-clamp(dt,0,.05)*2.4));
}
export function cameraClearance(target,want,{terrainAt,colliders=[],radius=.55,samples=16}={}){
 const start={x:target.x,y:target.y,z:target.z},end={x:want.x,y:want.y,z:want.z};
 let safe={...start};
 for(let i=1;i<=samples;i++){
  const t=i/samples,x=start.x+(end.x-start.x)*t,y=start.y+(end.y-start.y)*t,z=start.z+(end.z-start.z)*t;
  const h=terrainAt?.(x,z);
  if(Number.isFinite(h)&&y<h+radius)break;
  if(colliders.some(b=>Math.hypot(x-b.x,z-b.z)<b.r+radius&&y<(b.height??28)))break;
  safe={x,y,z};
 }
 const atEnd=Math.hypot(safe.x-end.x,safe.y-end.y,safe.z-end.z)<.001;
 return atEnd?end:{x:safe.x,y:Math.max(safe.y,(terrainAt?.(safe.x,safe.z)??-100)+radius),z:safe.z};
}
