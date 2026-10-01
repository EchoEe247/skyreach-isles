import * as T from 'three';
import {addRealmScenery,realmSign} from './multiverse-art.js';

export const MULTIVERSE_ISLAND_ID='multiverse-nexus';
export const MULTIVERSE_REALMS=Object.freeze([
  {id:'velocity',name:'Velocity District',character:'Volt Runner',theme:'high-speed ring time trial'},
  {id:'breaker',name:'Breaker City',character:'Brick Titan',theme:'destruction arena'}
]);

const dist2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const mat=(color,emissive=0,intensity=.5)=>new T.MeshStandardMaterial({color,roughness:.55,metalness:.08,emissive,emissiveIntensity:intensity});
const basic=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1,blending:opacity<1?T.AdditiveBlending:T.NormalBlending});
const box=(parent,w,h,d,material,x=0,y=0,z=0)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
const cyl=(parent,r1,r2,h,material,x=0,y=0,z=0,seg=10)=>{const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};

function makePortal(color,label){
 const g=new T.Group(),ring=new T.Mesh(new T.TorusGeometry(4.4,.45,10,48),mat(color,color,1));ring.castShadow=true;g.add(ring);
 const inner=new T.Mesh(new T.CircleGeometry(3.95,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.20,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));inner.position.z=-.08;g.add(inner);
 const halo=new T.Mesh(new T.TorusGeometry(5.15,.09,6,52),basic(color,.65));halo.position.z=.03;g.add(halo);
 const plinth=new T.Mesh(new T.CylinderGeometry(5.5,6.2,.8,20),mat(0x20263d));plinth.position.y=-4.3;g.add(plinth);g.userData={ring,inner,halo,label};return g;
}
function limbBox(parent,w,h,d,material,x,y,z){const p=new T.Group();p.position.set(x,y,z);parent.add(p);box(p,w,h,d,material,0,-h*.5,0);return p}
function buildVolt(){
 const g=new T.Group(),blue=mat(0x176bc1,0x063f7f,.35),white=mat(0xf4f7f7),red=mat(0xe73439),tan=mat(0xf0ca99),dark=mat(0x153826);
 const torso=new T.Mesh(new T.SphereGeometry(.5,12,9),blue);torso.scale.set(.82,1.18,.68);torso.position.y=1.5;g.add(torso);
 const head=new T.Mesh(new T.SphereGeometry(.48,12,9),blue);head.position.y=2.25;g.add(head);
 for(let i=0;i<6;i++){const spike=new T.Mesh(new T.ConeGeometry(.19,.9,6),blue);spike.rotation.x=Math.PI/2+.18;spike.rotation.z=(i-2.5)*.14;spike.position.set((i-2.5)*.09,2.30,-.5-(2.5-Math.abs(i-2.5))*.08);g.add(spike)}
 box(g,.56,.28,.11,white,0,2.28,.43);for(const x of[-.13,.13])box(g,.07,.17,.13,dark,x,2.26,.47);box(g,.39,.20,.18,tan,0,2.06,.44);box(g,.38,.48,.12,tan,0,1.50,.34);
 const lA=limbBox(g,.18,.72,.20,blue,-.50,1.87,0),rA=limbBox(g,.18,.72,.20,blue,.50,1.87,0),lL=limbBox(g,.22,.87,.25,blue,-.21,1.08,0),rL=limbBox(g,.22,.87,.25,blue,.21,1.08,0);
 box(lA,.28,.22,.28,white,0,-.76,0);box(rA,.28,.22,.28,white,0,-.76,0);box(lL,.38,.20,.64,red,0,-.90,.14);box(rL,.38,.20,.64,red,0,-.90,.14);
 const trail=new T.Mesh(new T.ConeGeometry(.38,2.5,8,1,true),new T.MeshBasicMaterial({color:0x42e9ff,transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false}));trail.rotation.x=-Math.PI/2;trail.position.set(0,1.08,-1.35);trail.visible=false;g.add(trail);
 g.userData.limbs={lA,rA,lL,rL,torso,trail};return g;
}
function buildBreaker(){
 const g=new T.Group(),skin=mat(0xa95f3a),orange=mat(0xd85b2a),navy=mat(0x23344d),cream=mat(0xe3b66f),dark=mat(0x2a1e20);
 const torso=box(g,1.34,1.12,.66,orange,0,1.53,0);box(g,1.10,.35,.70,navy,0,1.10,0);box(g,.66,.62,.58,skin,0,2.34,0);
 for(const x of[-.14,.14]){box(g,.14,.14,.06,mat(0xffffff),x,2.41,.31);box(g,.06,.09,.07,dark,x,2.41,.35)}box(g,.34,.07,.07,dark,0,2.18,.32);
 for(let i=-2;i<=2;i++){const hair=new T.Mesh(new T.ConeGeometry(.12,.34,5),dark);hair.position.set(i*.12,2.70,-.05+Math.abs(i)*.02);g.add(hair)}
 const lA=limbBox(g,.36,.88,.40,skin,-.84,2.02,0),rA=limbBox(g,.36,.88,.40,skin,.84,2.02,0),lL=limbBox(g,.40,.86,.44,navy,-.31,1.02,0),rL=limbBox(g,.40,.86,.44,navy,.31,1.02,0);
 box(lA,.56,.46,.56,cream,0,-.98,.02);box(rA,.56,.46,.56,cream,0,-.98,.02);box(lL,.50,.22,.64,dark,0,-.91,.12);box(rL,.50,.22,.64,dark,0,-.91,.12);g.userData.limbs={lA,rA,lL,rL,torso};return g;
}
function makeCheckpoint(root,x,y,z,color){const g=new T.Group();g.position.set(x,y,z);cyl(g,.11,.16,3.4,mat(0x4a506b),0,1.7,0,7);const halo=new T.Mesh(new T.TorusGeometry(1.15,.08,6,24),basic(color,.7));halo.rotation.x=Math.PI/2;halo.position.y=.12;g.add(halo);root.add(g);return {g,halo,x,y,z}}
function makeGuard(){
 const g=new T.Group(),body=mat(0x6347a8,0x391a7d,.35),eye=basic(0xff5e75),metal=mat(0x30374b),shell=new T.Mesh(new T.SphereGeometry(1.22,10,7),body);shell.scale.y=.72;shell.position.y=1.42;g.add(shell);box(g,1.32,.16,.12,eye,0,1.58,1.02);
 for(const sx of[-1,1]){cyl(g,.18,.22,1.22,metal,sx*.80,.56,0,6);box(g,.54,.22,.78,metal,sx*.80,-.04,.14)}const tip=new T.Mesh(new T.SphereGeometry(.14,7,5),eye);tip.position.set(0,2.78,0);g.add(tip);g.userData.tip=tip;return g;
}
const rankFor=s=>s<=24?'S':s<=34?'A':s<=46?'B':'C';

export function createMultiverseIsle(scene,obstacles,{island,heightAt,hero,baseRig,onToast=()=>{},onHaptic=()=>{}}){
 const root=new T.Group();root.name='MultiverseIsle';scene.add(root);
 const cx=island.x,cz=island.z,hubY=heightAt(cx,cz),stone=mat(0x252d43),metal=mat(0x414a68);
 const hub=new T.Mesh(new T.CylinderGeometry(19,22,.8,24),stone);hub.position.set(cx,hubY+.38,cz-5);hub.receiveShadow=true;root.add(hub);
 for(const side of[-1,1]){const x=cx+side*16,z=cz-5,y=heightAt(x,z);cyl(root,.55,.82,5.2,metal,x,y+2.6,z,8);const orb=new T.Mesh(new T.OctahedronGeometry(.65),basic(side<0?0x4cecff:0xffaa55,.95));orb.position.set(x,y+5.7,z);root.add(orb)}
 realmSign(root,'NEXUS ISLE',cx,hubY+10,cz-5,'#d7f8ff',21);
 const defs=[
  {id:'velocity',name:'Velocity District',character:'Volt Runner',color:0x30d9ff,p:{x:cx-72,z:cz+8},start:{x:cx-118,z:cz-55},build:buildVolt},
  {id:'breaker',name:'Breaker City',character:'Brick Titan',color:0xff9b38,p:{x:cx+72,z:cz+8},start:{x:cx+92,z:cz+4},build:buildBreaker}
 ];
 const portals=defs.map(d=>{const g=makePortal(d.color,d.name),y=heightAt(d.p.x,d.p.z);g.position.set(d.p.x,y+5,d.p.z);g.rotation.y=Math.atan2(cx-d.p.x,cz-d.p.z);root.add(g);realmSign(root,d.name.toUpperCase(),d.p.x,y+11,d.p.z,'#'+d.color.toString(16),18);return {...d,g,y}});
 const variants={};for(const d of defs){const v=d.build();v.visible=false;v.scale.setScalar(d.id==='breaker'?1.02:.98);hero.add(v);variants[d.id]=v}
 const transformFx=new T.Mesh(new T.SphereGeometry(1,16,10),new T.MeshBasicMaterial({color:0xc7f8ff,transparent:true,opacity:0,wireframe:true,blending:T.AdditiveBlending,depthWrite:false}));transformFx.visible=false;scene.add(transformFx);let transformFxLife=0;
 const burst=(position,color)=>{transformFx.position.copy(position).add(new T.Vector3(0,1.4,0));transformFx.material.color.setHex(color);transformFx.scale.setScalar(.5);transformFx.material.opacity=.85;transformFx.visible=true;transformFxLife=.7};

 const speedRings=[],speedPads=[],speedCheckpoints=[],springs=[],spikes=[],trackPoints=[];
 for(let i=0;i<24;i++){
  const t=i/23,x=cx-121+t*91+Math.sin(t*Math.PI*2)*7,z=cz-55+Math.sin(t*Math.PI*2.35)*49+Math.cos(t*Math.PI)*7,y=heightAt(x,z)+2.45;
  trackPoints.push({x,z});const ring=new T.Mesh(new T.TorusGeometry(2.05,.23,8,24),mat(0xffd443,0xffa600,1.05));ring.position.set(x,y,z);root.add(ring);speedRings.push({g:ring,x,z,y,on:false,index:i});
  if([2,7,12,17,21].includes(i)){const pad=box(root,5.8,.16,7.5,mat(0x2879e8,0x31eaff,1),x,heightAt(x,z)+.18,z);speedPads.push({g:pad,x,z,index:i})}
  if([0,6,12,18].includes(i))speedCheckpoints.push(makeCheckpoint(root,x,heightAt(x,z),z,0x4feaff));
 }
 for(let i=0;i<speedRings.length;i++){const a=trackPoints[Math.max(0,i-1)],b=trackPoints[Math.min(trackPoints.length-1,i+1)],yaw=Math.atan2(b.x-a.x,b.z-a.z);speedRings[i].g.rotation.y=yaw;const pad=speedPads.find(p=>p.index===i);if(pad)pad.g.rotation.y=yaw}
 for(const i of[5,11,18]){const r=speedRings[i],g=cyl(root,1.25,1.25,.38,mat(0xe13e4c),r.x,heightAt(r.x,r.z)+.28,r.z,12);const coil=new T.Mesh(new T.TorusGeometry(.82,.14,6,16),mat(0xffda62));coil.rotation.x=Math.PI/2;coil.position.copy(g.position).add(new T.Vector3(0,.36,0));root.add(coil);springs.push({g,x:r.x,z:r.z,cooldown:0})}
 for(const i of[8,15,20]){const r=speedRings[i],x=r.x+3.8,z=r.z,y=heightAt(x,z),g=new T.Group();g.position.set(x,y,z);for(const d of[-.6,0,.6]){const spike=new T.Mesh(new T.ConeGeometry(.28,1.15,6),mat(0xc6dbea));spike.position.set(d,.58,0);g.add(spike)}root.add(g);spikes.push({g,x,z,y})}
 const speedGate=makePortal(0x30d9ff,'Velocity finish'),lastRing=speedRings.at(-1);speedGate.position.set(lastRing.x,heightAt(lastRing.x,lastRing.z)+3.2,lastRing.z);speedGate.scale.setScalar(.64);root.add(speedGate);

 const smashables=[],guards=[],cityX=cx+92,cityZ=cz+6;
 for(let i=0;i<12;i++){
  const row=Math.floor(i/4),col=i%4,x=cityX+(col-1.5)*13,z=cityZ+(row-1)*14,y=heightAt(x,z),g=new T.Group(),maxHp=2+(i%3===2?1:0),height=7+(i%3)*2;g.position.set(x,y,z);
  box(g,7,height,7,mat([0xa95d4b,0x6d6a9e,0x548b9c,0x9b7046][col],0x18152a,.18),0,height/2,0);
  for(let f=0;f<3;f++)for(const wx of[-2,0,2])box(g,1.05,.9,.12,basic(f%2?0xffe0a0:0x8fe9ff,.9),wx,1.5+f*1.9,3.56);
  box(g,7.4,.35,7.4,mat(0x30354a),0,height,0);root.add(g);smashables.push({kind:'tower',g,x,z,on:false,hp:maxHp,maxHp,height});
 }
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=cityX+Math.sin(a)*25,z=cityZ+Math.cos(a)*20,y=heightAt(x,z),g=makeGuard();g.position.set(x,y,z);root.add(g);guards.push({kind:'guard',g,x,z,homeX:x,homeZ:z,on:false,hp:1,maxHp:1,phase:i*1.15})}
 const debris=[];for(let i=0;i<26;i++){const g=box(root,.65,.65,.65,mat(i%3===0?0xe4a26b:i%3===1?0x91d7e4:0xb4a4d8));g.visible=false;debris.push({g,life:0,v:new T.Vector3()})}
 const returnPads=defs.map(d=>{const x=d.id==='velocity'?d.start.x+8:d.start.x-12,z=d.id==='velocity'?d.start.z-8:d.start.z-26,y=heightAt(x,z),g=new T.Mesh(new T.CylinderGeometry(3.8,4.3,.3,18),mat(0xb67cff,0x6f32d8,.75));g.position.set(x,y+.18,z);root.add(g);const halo=new T.Mesh(new T.TorusGeometry(3.4,.12,6,28),basic(0xe7c2ff,.75));halo.rotation.x=Math.PI/2;halo.position.set(x,y+.42,z);root.add(halo);realmSign(root,'RETURN TO NEXUS',x,y+3.7,z,'#dec4ff',12);return{id:d.id,g,halo,x,z}});
 addRealmScenery(root,{cx,cz,heightAt,trackPoints,city:{x:cityX,z:cityZ},smashables,velocityPortal:portals[0],breakerPortal:portals[1]});

 const SPIN_DURATION=1.2,SPIN_TURNS=4,SPIN_PIVOT_Y=1.35;
 let active=null,dashTimer=0,spinTimer=0,punchTimer=0,hurtCooldown=0,elapsed=0,finishTime=null,speedCheckpoint=0,combo=0,comboTimer=0,score=0;
 const completed={velocity:false,breaker:false},bestTimes={velocity:null},hits={velocity:0};
 const setBaseVisible=v=>{baseRig.visible=v&&hero.userData.modelState!=='ready';if(hero.userData.nightweaver)hero.userData.nightweaver.visible=v};
 const showVariant=id=>{for(const [k,v] of Object.entries(variants))v.visible=k===id;setBaseVisible(!id)};
 function resetRealm(id){completed[id]=false;elapsed=0;finishTime=null;dashTimer=spinTimer=punchTimer=0;hurtCooldown=.8;combo=score=0;comboTimer=0;if(id==='velocity'){speedCheckpoint=0;hits.velocity=0;for(const r of speedRings){r.on=false;r.g.visible=true}}if(id==='breaker'){for(const t of [...smashables,...guards]){t.on=false;t.g.visible=true;t.hp=t.maxHp;t.g.scale.setScalar(1)}}}
 function enter(d,position){active=d.id;resetRealm(active);showVariant(active);position.set(d.start.x,heightAt(d.start.x,d.start.z),d.start.z);burst(position,d.color);onHaptic([30,30,55]);onToast(d.id==='velocity'?'Volt Runner active · clear 24 gold gates in order. Boost, Spin Dash, springs and clean lines decide your time.':'Brick Titan active · demolish 12 towers and 6 guards. Towers take multiple punches; chain hits for bigger combos.',5600)}
 function leave(position){active=null;showVariant(null);position.set(cx,hubY+.1,cz-2);burst(position,0xcaa6ff);onHaptic(25);onToast('Returned to the Nexus fork as Nightweaver.',3000)}
 function travelToHub(position){leave(position);return true}
 function chooseRealm(id,position){const d=defs.find(x=>x.id===id);if(!d)return false;enter(d,position);return true}
 function restart(position){if(!active)return false;return chooseRealm(active,position)}
 function nearestPortal(position){let best=null,bd=7.5;for(const p of portals){const d=dist2(position,p.p);if(d<bd){best=p;bd=d}}return best}
 function nearestReturn(position){if(!active)return null;const p=returnPads.find(x=>x.id===active);if(p&&dist2(position,p)<6)return p;if(active==='velocity'&&completed.velocity&&dist2(position,speedGate.position)<6)return {id:'finish'};return null}
 const targets=()=>[...smashables,...guards];
 function nearestSmash(position){if(active!=='breaker')return null;let best=null,bd=7;for(const t of targets()){if(t.on)continue;const d=Math.hypot(position.x-t.g.position.x,position.z-t.g.position.z);if(d<bd){best=t;bd=d}}return best}
 function emitDebris(target){for(let i=0;i<debris.length;i++){const d=debris[i];d.life=.65+(i%4)*.08;d.g.visible=true;d.g.position.copy(target.g.position).add(new T.Vector3((i%3-1)*.3,2+(i%5)*.2,((i*2)%3-1)*.3));d.v.set(Math.sin(i*2.2)*7,5+(i%5),Math.cos(i*2.2)*7)}}
 function smash(target){punchTimer=.38;target.hp--;combo=comboTimer>0?combo+1:1;comboTimer=2.6;score+=75*combo;onHaptic([18,20,36]);emitDebris(target);target.g.scale.multiplyScalar(.98);burst(target.g.position,target.kind==='guard'?0xff5e75:0xffb45e);if(target.hp<=0){target.on=true;target.g.visible=false;score+=200*combo}const done=targets().filter(t=>t.on).length,total=targets().length;if(done===total){completed.breaker=true;finishTime=elapsed;onToast('BREAKER CITY CLEARED · '+score+' points · return to Nexus when ready.',4600)}else onToast((target.kind==='guard'?'GUARD ':'TOWER ')+(target.on?'DOWN':'HIT')+' · '+done+'/'+total+' · COMBO ×'+combo,1200)}
 function interact(position){const ret=nearestReturn(position);if(ret){leave(position);return true}if(!active){const p=nearestPortal(position);if(p){enter(p,position);return true}return false}if(active==='velocity'){spinTimer=SPIN_DURATION;dashTimer=Math.max(dashTimer,SPIN_DURATION);onHaptic(15);return true}const target=nearestSmash(position);if(target){smash(target);return true}if(active==='breaker'){punchTimer=.28;onHaptic(10);return true}return false}
 function actionLabel(position){if(nearestReturn(position))return 'Return';if(!active&&nearestPortal(position))return 'Enter';if(active==='velocity')return 'SPIN DASH';if(nearestSmash(position))return 'SMASH';if(active==='breaker')return 'PUNCH';return null}
 function surfaceHeight(x,z,base){return base}
 function resolveCollision(position,radius=.5){if(active!=='breaker')return false;let moved=false;for(const t of targets()){if(t.on)continue;const r=t.kind==='guard'?1.45:4,dx=position.x-t.g.position.x,dz=position.z-t.g.position.z,d=Math.hypot(dx,dz),min=r+radius;if(d<min){const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;position.x=t.g.position.x+nx*min;position.z=t.g.position.z+nz*min;moved=true}}return moved}
 function speedMultiplier(){if(active!=='velocity')return 1;return dashTimer>0?3.4:2.15}
 function jumpVelocity(base=9){return active==='velocity'?9.2:active==='breaker'?7.8:base}
 function respawnVelocity(position){const cp=speedCheckpoints[speedCheckpoint]||speedCheckpoints[0];position.set(cp.x,cp.y+.15,cp.z);dashTimer=spinTimer=0;hits.velocity++;hurtCooldown=1;onHaptic([75,40,75]);onToast('Circuit recovery · checkpoint restored.',1900);return true}
 function updateAvatar(time,moving,boosting){
  const v=active?variants[active]:null;if(!v)return;const l=v.userData.limbs;if(!l)return;const rate=active==='velocity'?(boosting?20:15):7.5,ph=time*rate,walk=moving?1:0,amp=(active==='velocity'?.9:.48)*walk,s=Math.sin(ph),ease=.22;
  l.lA.rotation.x+=(s*amp-l.lA.rotation.x)*ease;l.rA.rotation.x+=(-s*amp-l.rA.rotation.x)*ease;l.lL.rotation.x+=(-s*amp-l.lL.rotation.x)*ease;l.rL.rotation.x+=(s*amp-l.rL.rotation.x)*ease;l.torso.rotation.y+=(-s*amp*.08-l.torso.rotation.y)*ease;if(punchTimer>0){l.lA.rotation.x=-1.65;l.rA.rotation.x=-1.65}
  if(active==='velocity'&&spinTimer>0){const phase=1-spinTimer/SPIN_DURATION,a=-phase*Math.PI*2*SPIN_TURNS;v.rotation.x=a;v.position.y=SPIN_PIVOT_Y*(1-Math.cos(a));v.position.z=-SPIN_PIVOT_Y*Math.sin(a)}else{v.rotation.x=0;v.position.y=0;v.position.z=0}if(l.trail)l.trail.visible=active==='velocity'&&moving&&(boosting||dashTimer>0);
 }
 function update({time,dt,position,moving=false,boosting=false}){
  let resetVertical=false,bounceVelocity=0;root.visible=!!active||dist2(position,{x:cx,z:cz})<430;for(const id of Object.keys(variants))variants[id].visible=active===id;
  if(active&&finishTime===null)elapsed+=dt;hurtCooldown=Math.max(0,hurtCooldown-dt);spinTimer=Math.max(0,spinTimer-dt);punchTimer=Math.max(0,punchTimer-dt);dashTimer=Math.max(0,dashTimer-dt);comboTimer=Math.max(0,comboTimer-dt);if(comboTimer<=0)combo=0;
  for(const p of portals){p.g.userData.ring.rotation.z+=dt*.40;p.g.userData.halo.rotation.z-=dt*.24;p.g.userData.inner.material.opacity=.16+.08*Math.sin(time*2.4+p.p.x*.01)}for(const p of returnPads)p.halo.rotation.z+=dt*.9;
  if(transformFxLife>0){transformFxLife-=dt;const t=1-transformFxLife/.7;transformFx.scale.setScalar(.5+t*4);transformFx.material.opacity=Math.max(0,(1-t)*.8);if(transformFxLife<=0)transformFx.visible=false}
  for(const d of debris)if(d.life>0){d.life-=dt;d.g.position.addScaledVector(d.v,dt);d.v.y-=18*dt;d.g.rotation.x+=dt*4;d.g.rotation.z+=dt*2.4;if(d.life<=0)d.g.visible=false}
  if(active==='velocity'){
   const next=speedRings.findIndex(r=>!r.on);for(const r of speedRings){r.g.material.emissiveIntensity=r.on?0:(r.index===next?1.6:.15);r.g.rotation.z+=dt*(r.index===next?2.1:.8)}
   for(const p of speedPads)if(dist2(position,p)<4.5)dashTimer=Math.max(dashTimer,.75);
   for(const spring of springs){spring.cooldown=Math.max(0,spring.cooldown-dt);if(spring.cooldown<=0&&dist2(position,spring)<2.4){spring.cooldown=1;bounceVelocity=15;dashTimer=Math.max(dashTimer,.8);onHaptic([18,18,32])}}
   if(hurtCooldown<=0&&spikes.some(s=>dist2(position,s)<1.7))resetVertical=respawnVelocity(position);
   const n=speedRings.findIndex(r=>!r.on),target=n<0?null:speedRings[n];
   if(target&&Math.hypot(position.x-target.x,position.z-target.z)<3.1){target.on=true;target.g.visible=false;onHaptic(10);const count=speedRings.filter(r=>r.on).length;if(count===7)speedCheckpoint=1;if(count===13)speedCheckpoint=2;if(count===19)speedCheckpoint=3;if(count===speedRings.length){completed.velocity=true;finishTime=elapsed;bestTimes.velocity=bestTimes.velocity==null?elapsed:Math.min(bestTimes.velocity,elapsed);onToast('VELOCITY COMPLETE · '+elapsed.toFixed(1)+'s · RANK '+rankFor(elapsed),4200)}}
   if(heightAt(position.x,position.z)<-.6||dist2(position,{x:cx,z:cz})>island.radius*1.08)resetVertical=respawnVelocity(position);
  }
  if(active==='breaker'){
   for(const [i,g] of guards.entries())if(!g.on){const a=time*.45+g.phase;g.g.position.x=g.homeX+Math.sin(a)*5.5;g.g.position.z=g.homeZ+Math.cos(a*.83)*4.2;g.g.position.y=heightAt(g.g.position.x,g.g.position.z);g.x=g.g.position.x;g.z=g.g.position.z;g.g.rotation.y=a;g.g.userData.tip.material.opacity=.55+.45*Math.sin(time*5+i);if(hurtCooldown<=0&&dist2(position,g.g.position)<2.2){hurtCooldown=1.1;combo=0;comboTimer=0;const dx=position.x-g.g.position.x,dz=position.z-g.g.position.z,m=Math.hypot(dx,dz)||1;position.x+=dx/m*3.8;position.z+=dz/m*3.8;onHaptic([40,30,50]);onToast('Guard impact · combo broken.',1500)}}
  }
  updateAvatar(time,moving,boosting);const near=!active?nearestPortal(position):null;return {active,hint:actionLabel(position)||'',status:active?statusText():(near?near.name+' · become '+near.character:null),resetVertical,bounceVelocity};
 }
 function statusText(){if(active==='velocity'){const count=speedRings.filter(r=>r.on).length,t=finishTime??elapsed;return 'Volt Runner · '+count+'/24 gates · CP '+(speedCheckpoint+1)+'/4 · '+t.toFixed(1)+'s'+(completed.velocity?' · RANK '+rankFor(t):'')}if(active==='breaker'){const done=targets().filter(t=>t.on).length;return 'Brick Titan · '+done+'/'+targets().length+' targets · Score '+score+(combo?' · ×'+combo:'')}return null}
 function guidance(){if(active==='velocity')return speedRings.find(r=>!r.on)||{name:'Finish Gate',x:speedGate.position.x,z:speedGate.position.z};if(active==='breaker'){const t=targets().filter(x=>!x.on).sort((a,b)=>dist2(hero.position,a.g.position)-dist2(hero.position,b.g.position))[0];return t?{name:t.kind==='guard'?'Security Guard':'Demolition Target',x:t.g.position.x,z:t.g.position.z}:null}return null}
 function isTransformed(){return !!active}
 function stats(){return {completed:{...completed},bestTimes:{...bestTimes},hits:{...hits},score,combo,speedCheckpoint}}
 return {destination:{id:MULTIVERSE_ISLAND_ID,name:'Nexus Isle',shortName:'NEXUS',x:cx,z:cz,icon:'◎',category:'OFFSHORE · TWO PLAYABLE DISTRICTS',description:'Two large separated districts: Velocity District for high-speed time trials and Breaker City for destruction combat.'},surfaceHeight,resolveCollision,speedMultiplier,jumpVelocity,interact,actionLabel,update,statusText,guidance,isTransformed,travelToHub,chooseRealm,restart,stats,activeRealm:()=>active,completed:()=>({...completed}),portals,returnPads,speedRings,speedPads,speedCheckpoints,springs,spikes,speedGate,smashables,guards,variants,root};
}
