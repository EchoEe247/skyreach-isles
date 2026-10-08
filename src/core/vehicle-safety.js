export function chooseSafeExit({x,z,heading=0,radius=4,type='car',groundAt,surfaceAt,blocked=()=>false}){
 const nautical=type==='boat'||type==='submarine';
 let waterCandidate=null;
 for(let i=0;i<16;i++){
  const angle=heading+i*Math.PI/8,px=x+Math.sin(angle)*radius,pz=z+Math.cos(angle)*radius;
  if(blocked(px,pz))continue;
  const ground=groundAt(px,pz),surface=surfaceAt(px,pz);
  if(surface!=='water'&&Number.isFinite(ground)&&ground>-.25)return {x:px,z:pz,y:ground,swimming:false};
  if(nautical&&surface==='water'&&!waterCandidate)waterCandidate={x:px,z:pz,swimming:true};
 }
 return waterCandidate;
}

export function boatHullCanTravel(x,z,heading,length,canTravel){
 const halfLength=Math.max(2,length*.43),halfWidth=Math.max(.9,Math.min(10,length*.13));
 const fx=Math.sin(heading),fz=Math.cos(heading),sx=fz,sz=-fx;
 const samples=[[0,0],[halfLength,0],[-halfLength,0],[halfLength*.55,halfWidth],[halfLength*.55,-halfWidth],[-halfLength*.55,halfWidth],[-halfLength*.55,-halfWidth]];
 return samples.every(([f,w])=>canTravel(x+fx*f+sx*w,z+fz*f+sz*w));
}

export function spacecraftExitDecision(vehicle){
 if(vehicle?.celestial?.crashedBody||vehicle?.crashedBody)return 'recover';
 if(vehicle?.celestial?.landedBody==='moon')return 'moon';
 if(!vehicle?.celestial&&vehicle?.atmospheric&&(vehicle.altitude||0)<=2&&Math.abs(vehicle.verticalSpeed||0)<=1&&Math.abs(vehicle.horizontalSpeed||0)<3)return 'earth';
 return 'blocked';
}
export function resetSpacecraftDamage(vehicle){
 vehicle.fuel=1;
 vehicle.heat=0;
 vehicle.autoThrottle=0;
 vehicle.sp=0;
 vehicle.crashedBody=null;
 vehicle.landedBody=null;
 vehicle.pitch=0;
 vehicle.pitchRate=0;
 vehicle.yawRate=0;
 vehicle.verticalSpeed=0;
 vehicle.horizontalSpeed=0;
}
