import * as T from 'three';
import {addRealmScenery,realmSign} from './multiverse-art.js';

export const MULTIVERSE_ISLAND_ID='multiverse-nexus';
export const MULTIVERSE_REALMS=Object.freeze([
  {id:'jump',name:'Jump Kingdom',character:'Redcap Rover',theme:'precision platforming'},
  {id:'velocity',name:'Velocity Circuit',character:'Volt Runner',theme:'high-speed ring run'},
  {id:'breaker',name:'Breaker City',character:'Brick Titan',theme:'destruction challenge'}
]);

const dist2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mat=(color,emissive=0,intensity=.5)=>new T.MeshStandardMaterial({color,roughness:.55,metalness:.08,emissive,emissiveIntensity:intensity});
const basic=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1,blending:opacity<1?T.AdditiveBlending:T.NormalBlending});
const box=(parent,w,h,d,material,x=0,y=0,z=0)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
const cyl=(parent,r1,r2,h,material,x=0,y=0,z=0,seg=10)=>{const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};

function makePortal(color,label){
  const g=new T.Group();
  const ring=new T.Mesh(new T.TorusGeometry(4.2,.42,10,42),mat(color,color,.9));ring.castShadow=true;g.add(ring);
  const inner=new T.Mesh(new T.CircleGeometry(3.75,36),new T.MeshBasicMaterial({color,transparent:true,opacity:.22,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));inner.position.z=-.08;g.add(inner);
  const halo=new T.Mesh(new T.TorusGeometry(4.85,.08,6,48),basic(color,.58));halo.position.z=.03;g.add(halo);
  const plinth=new T.Mesh(new T.CylinderGeometry(5.2,6,.8,18),mat(0x24223c));plinth.position.y=-4.15;g.add(plinth);
  g.userData={ring,inner,halo,label};return g;
}
function limbBox(parent,w,h,d,material,x,y,z){
  const pivot=new T.Group();pivot.position.set(x,y,z);parent.add(pivot);
  const mesh=box(pivot,w,h,d,material,0,-h*.5,0);return {pivot,mesh};
}
function buildRedcap(){
  const g=new T.Group(),skin=mat(0xd9a574),red=mat(0xc92f3f),teal=mat(0x2357bb),gold=mat(0xf0b84b),dark=mat(0x24273a);
  for(const x of[-.13,.13]){box(g,.13,.22,.06,mat(0xffffff),x,2.3,.35);box(g,.06,.12,.07,dark,x,2.29,.39)}
  const nose=new T.Mesh(new T.SphereGeometry(.13,8,6),skin);nose.position.set(0,2.2,.43);g.add(nose);
  const torso=box(g,.85,.95,.44,red,0,1.55,0);box(g,.58,.58,.47,teal,0,1.36,.02);
  const head=new T.Mesh(new T.SphereGeometry(.38,12,8),skin);head.position.y=2.28;g.add(head);
  const helmet=new T.Mesh(new T.SphereGeometry(.42,12,8,0,Math.PI*2,0,Math.PI*.58),red);helmet.position.y=2.46;g.add(helmet);
  box(g,.48,.08,.42,red,0,2.37,.24);box(g,.22,.10,.08,dark,0,2.18,.36);
  const lA=limbBox(g,.22,.75,.24,red,-.56,1.92,0),rA=limbBox(g,.22,.75,.24,red,.56,1.92,0);
  box(lA.pivot,.30,.22,.30,gold,0,-.78,0);box(rA.pivot,.30,.22,.30,gold,0,-.78,0);
  const lL=limbBox(g,.29,.86,.32,teal,-.23,1.05,0),rL=limbBox(g,.29,.86,.32,teal,.23,1.05,0);
  box(lL.pivot,.38,.20,.52,dark,0,-.92,.10);box(rL.pivot,.38,.20,.52,dark,0,-.92,.10);
  g.userData.limbs={lA:lA.pivot,rA:rA.pivot,lL:lL.pivot,rL:rL.pivot,torso};return g;
}
function buildVolt(){
  const g=new T.Group(),blue=mat(0x176bc1,0x063f7f,.35),cyan=mat(0x54efff,0x22d9ff,1),white=mat(0xf4f7f7),orange=mat(0xe73439);
  const torso=new T.Mesh(new T.SphereGeometry(.5,12,9),blue);torso.scale.set(.82,1.18,.68);torso.position.y=1.5;g.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(.48,12,9),blue);head.position.y=2.25;g.add(head);
  for(let i=0;i<5;i++){const spike=new T.Mesh(new T.ConeGeometry(.20,.85,6),blue);spike.rotation.x=Math.PI/2+.2;spike.rotation.z=(i-2)*.16;spike.position.set((i-2)*.10,2.30,-.48-(2-Math.abs(i-2))*.10);g.add(spike)}
  const tan=mat(0xf0ca99);box(g,.56,.28,.11,white,0,2.28,.43);for(const x of[-.13,.13])box(g,.07,.17,.13,mat(0x153826),x,2.26,.47);box(g,.39,.2,.18,tan,0,2.06,.44);box(g,.38,.48,.12,tan,0,1.50,.34);
  const lA=limbBox(g,.18,.72,.20,blue,-.50,1.87,0),rA=limbBox(g,.18,.72,.20,blue,.50,1.87,0);
  box(lA.pivot,.28,.22,.28,white,0,-.76,0);box(rA.pivot,.28,.22,.28,white,0,-.76,0);
  const lL=limbBox(g,.22,.87,.25,blue,-.21,1.08,0),rL=limbBox(g,.22,.87,.25,blue,.21,1.08,0);
  box(lL.pivot,.36,.20,.62,orange,0,-.90,.13);box(rL.pivot,.36,.20,.62,orange,0,-.90,.13);
  const trail=new T.Mesh(new T.ConeGeometry(.36,2.2,8,1,true),new T.MeshBasicMaterial({color:0x42e9ff,transparent:true,opacity:.20,blending:T.AdditiveBlending,depthWrite:false}));trail.rotation.x=-Math.PI/2;trail.position.set(0,1.08,-1.15);trail.visible=false;g.add(trail);
  g.userData.limbs={lA:lA.pivot,rA:rA.pivot,lL:lL.pivot,rL:rL.pivot,torso,trail};return g;
}
function buildBreaker(){
  const g=new T.Group(),skin=mat(0xa95f3a),orange=mat(0xd85b2a),navy=mat(0x23344d),cream=mat(0xe3b66f),dark=mat(0x2a1e20);
  const torso=box(g,1.28,1.08,.62,orange,0,1.52,0);box(g,1.05,.34,.66,navy,0,1.12,0);
  const head=new T.Mesh(new T.BoxGeometry(.62,.60,.54),skin);head.position.y=2.33;g.add(head);
  for(const x of[-.14,.14]){box(g,.14,.14,.06,mat(0xffffff),x,2.4,.29);box(g,.06,.09,.07,dark,x,2.4,.33)}box(g,.32,.07,.07,dark,0,2.18,.30);
  for(let i=-2;i<=2;i++){const hair=new T.Mesh(new T.ConeGeometry(.12,.34,5),dark);hair.position.set(i*.12,2.70,-.05+Math.abs(i)*.02);g.add(hair)}
  const lA=limbBox(g,.34,.86,.38,skin,-.82,2.00,0),rA=limbBox(g,.34,.86,.38,skin,.82,2.00,0);
  box(lA.pivot,.52,.44,.52,cream,0,-.96,.02);box(rA.pivot,.52,.44,.52,cream,0,-.96,.02);
  const lL=limbBox(g,.38,.84,.42,navy,-.30,1.02,0),rL=limbBox(g,.38,.84,.42,navy,.30,1.02,0);
  box(lL.pivot,.48,.22,.62,dark,0,-.89,.12);box(rL.pivot,.48,.22,.62,dark,0,-.89,.12);
  g.userData.limbs={lA:lA.pivot,rA:rA.pivot,lL:lL.pivot,rL:rL.pivot,torso};return g;
}
function makeCheckpoint(root,x,y,z,color){
  const g=new T.Group();g.position.set(x,y,z);
  cyl(g,.10,.15,3.2,mat(0x55445f),0,1.6,0,6);
  const flag=new T.Mesh(new T.PlaneGeometry(1.5,.8),basic(color,.85));flag.position.set(.75,2.65,0);flag.rotation.y=-Math.PI/2;g.add(flag);
  const halo=new T.Mesh(new T.TorusGeometry(1.05,.07,6,22),basic(color,.6));halo.rotation.x=Math.PI/2;halo.position.y=.10;g.add(halo);
  root.add(g);return {g,halo,x,y,z,on:false};
}
function segmentDistance(px,pz,ax,az,bx,bz){
  const vx=bx-ax,vz=bz-az,wx=px-ax,wz=pz-az,c=vx*vx+vz*vz,t=c?clamp((wx*vx+wz*vz)/c,0,1):0;
  return Math.hypot(px-(ax+vx*t),pz-(az+vz*t));
}
function makeGuard(){
  const g=new T.Group(),body=mat(0x6347a8,0x391a7d,.35),eye=basic(0xff5e75),metal=mat(0x30374b);
  const shell=new T.Mesh(new T.SphereGeometry(1.25,10,7),body);shell.scale.y=.72;shell.position.y=1.45;g.add(shell);
  box(g,1.35,.16,.12,eye,0,1.60,1.05);
  for(const sx of[-1,1]){cyl(g,.18,.22,1.25,metal,sx*.82,.55,0,6);box(g,.56,.22,.80,metal,sx*.82,-.05,.14)}
  const antenna=cyl(g,.06,.06,.65,metal,0,2.45,0,6);const tip=new T.Mesh(new T.SphereGeometry(.13,7,5),eye);tip.position.set(0,2.83,0);g.add(tip);
  g.userData.tip=tip;return g;
}

export function createMultiverseIsle(scene,obstacles,{island,heightAt,hero,baseRig,onToast=()=>{},onHaptic=()=>{}}){
  const root=new T.Group();root.name='MultiverseIsle';scene.add(root);
  const cx=island.x,cz=island.z,hubY=heightAt(cx,cz),stone=mat(0x25233a),metal=mat(0x424863);
  const hub=new T.Mesh(new T.CylinderGeometry(25,28,.9,28),stone);hub.position.set(cx,hubY+.42,cz);hub.receiveShadow=true;root.add(hub);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=cx+Math.sin(a)*22,z=cz+Math.cos(a)*22,y=heightAt(x,z);cyl(root,.7,1.0,5.5,metal,x,y+2.7,z,8);const orb=new T.Mesh(new T.OctahedronGeometry(.55),new T.MeshBasicMaterial({color:i%2?0x79f4ff:0xffc96b}));orb.position.set(x,y+5.9,z);root.add(orb)}
  const crown=new T.Mesh(new T.TorusGeometry(13,.18,6,64),basic(0x9befff,.55));crown.rotation.x=Math.PI/2;crown.position.set(cx,hubY+6.5,cz);root.add(crown);

  const defs=[
    {id:'jump',name:'Jump Kingdom',character:'Redcap Rover',color:0xf04a57,p:{x:cx-16,z:cz+7},start:{x:cx-105,z:cz+22},build:buildRedcap},
    {id:'velocity',name:'Velocity Circuit',character:'Volt Runner',color:0x30d9ff,p:{x:cx,z:cz-18},start:{x:cx-87,z:cz-57},build:buildVolt},
    {id:'breaker',name:'Breaker City',character:'Brick Titan',color:0xff9b38,p:{x:cx+16,z:cz+7},start:{x:cx+100,z:cz+5},build:buildBreaker}
  ];
  const portals=defs.map(d=>{const g=makePortal(d.color,d.name),y=heightAt(d.p.x,d.p.z);g.position.set(d.p.x,y+5,d.p.z);g.rotation.y=Math.atan2(cx-d.p.x,cz-d.p.z);root.add(g);return {...d,g,y}});
  for(const p of portals)realmSign(root,p.name,p.p.x,p.y+11,p.p.z,'#'+p.color.toString(16),17);
  realmSign(root,'MULTIVERSE NEXUS',cx,hubY+14,cz,'#b7f7ff',28);
  const variants={};for(const d of defs){const v=d.build();v.visible=false;v.scale.setScalar(.98);hero.add(v);variants[d.id]=v}

  const transformFx=new T.Mesh(new T.SphereGeometry(1,16,10),new T.MeshBasicMaterial({color:0xc7f8ff,transparent:true,opacity:0,wireframe:true,blending:T.AdditiveBlending,depthWrite:false}));
  transformFx.visible=false;scene.add(transformFx);let transformFxLife=0;
  const burstTransform=(position,color)=>{transformFx.position.copy(position).add(new T.Vector3(0,1.4,0));transformFx.material.color.setHex(color);transformFx.scale.setScalar(.5);transformFx.material.opacity=.85;transformFx.visible=true;transformFxLife=.7};

  // Jump Kingdom: true raised surfaces, collectible route, checkpoints and rotating sweep hazards.
  const platforms=[],jumpTokens=[],jumpCheckpoints=[],jumpHazards=[];
  const jumpBase={x:cx-105,z:cz+22},jumpLayout=[
    [0,0,16,14,0],[16,-6,10,10,1.2],[29,-1,9,9,2.2],[41,8,9,9,3.3],[53,1,11,10,4.1],
    [65,-10,10,10,3.2],[78,-3,11,11,2.2],[89,8,12,12,1.3]
  ];
  for(let i=0;i<jumpLayout.length;i++){
    const [ox,oz,w,d,raise]=jumpLayout[i],x=jumpBase.x+ox,z=jumpBase.z+oz,ground=heightAt(x,z),top=13+raise+.55;
    const m=box(root,w,1.1,d,mat(i%2?0xb83b55:0xd4a94f),x,top-.55,z);m.receiveShadow=true;platforms.push({x,z,w,d,top,index:i});
    if(i>0&&i<7){const token=new T.Mesh(new T.OctahedronGeometry(.65),mat(0xffef76,0xffb327,1.2));token.position.set(x,top+2.2,z);root.add(token);jumpTokens.push({g:token,x,z,y:top+2.2,on:false})}
    if([0,3,6].includes(i))jumpCheckpoints.push(makeCheckpoint(root,x,top,z,0x74f0a7));
    if([2,4,6].includes(i)){
      const hg=new T.Group();hg.position.set(x,top+.58,z);const bar=box(hg,w*.72,.18,.24,mat(0xff5c68,0xff1d39,1.2),w*.36,0,0);const pivot=new T.Mesh(new T.CylinderGeometry(.42,.52,1.15,8),mat(0x3d3347));pivot.position.y=-.35;hg.add(pivot);root.add(hg);
      jumpHazards.push({g:hg,x,z,y:top+.58,r:w*.72,speed:.75+i*.07,phase:i*1.7});
    }
  }
  // Decorative skyline makes the platforming realm read as a distinct toy kingdom.
  for(let i=0;i<5;i++){const x=jumpBase.x+15+i*19,z=jumpBase.z+22+(i%2)*7,y=heightAt(x,z);const tower=cyl(root,2.3,2.8,7+i%3*2,mat(i%2?0xe36d6b:0x6a91d7),x,y+3.5+i%3,z,10);const roof=new T.Mesh(new T.ConeGeometry(3.1,3.3,8),mat(0xf1c75b));roof.position.set(x,y+8.1+i%3*2,z);root.add(roof)}
  const goalArch=makePortal(0xffdf63,'Jump finish');goalArch.position.set(jumpBase.x+97,heightAt(jumpBase.x+97,jumpBase.z+8)+3.2,jumpBase.z+8);goalArch.scale.setScalar(.66);root.add(goalArch);

  // Velocity Circuit: visible track ribbon, ordered rings, checkpoints and timed run.
  const speedRings=[],speedPads=[],speedTrack=[],speedCheckpoints=[];
  for(let i=0;i<14;i++){
    const a=-2.15+i/13*4.25,r=103+Math.sin(i*.9)*9,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r,y=heightAt(x,z)+2.4;
    const ring=new T.Mesh(new T.TorusGeometry(2.2,.24,8,24),mat(0xffcd37,0xffaa13,.95));ring.position.set(x,y,z);ring.rotation.y=a;root.add(ring);speedRings.push({g:ring,x,z,y,on:false,index:i});
    const track=box(root,6,.10,3,mat(i%2?0x152b52:0x1d3c67,0x0a63a6,.18),x,heightAt(x,z)+.08,z);track.rotation.y=a;speedTrack.push(track);
    if(i%4===1){const pad=box(root,5,.16,9,mat(0x2a76e8,0x31eaff,.9),x,heightAt(x,z)+.18,z);pad.rotation.y=a;speedPads.push({g:pad,x,z,index:i})}
    if([0,5,10].includes(i))speedCheckpoints.push(makeCheckpoint(root,x,heightAt(x,z),z,0x4feaff));
  }
  for(let i=0;i<6;i++){const a=-2.0+i*.7,r=84,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r,y=heightAt(x,z);const p1=cyl(root,.32,.42,6,mat(0x27385b),x,y+3,z,8);const orb=new T.Mesh(new T.SphereGeometry(.52,8,6),basic(0x56efff,.9));orb.position.set(x,y+6.4,z);root.add(orb)}
  const speedGate=makePortal(0x30d9ff,'Velocity finish');speedGate.position.set(speedRings.at(-1).x,heightAt(speedRings.at(-1).x,speedRings.at(-1).z)+3.1,speedRings.at(-1).z);speedGate.scale.setScalar(.62);root.add(speedGate);

  // Breaker City: physical cabinets plus patrolling smashable security guards.
  const smashables=[],guards=[],arcadeX=cx+100,arcadeZ=cz+25;
  for(let i=0;i<9;i++){
    const row=Math.floor(i/3),col=i%3,x=arcadeX+(col-1)*10,z=arcadeZ+(row-1)*10,y=heightAt(x,z),g=new T.Group();g.position.set(x,y,z);
    box(g,6,6,6,mat([0xef5350,0x7e57c2,0x42a5f5][col],0x221122,.25),0,3,0);box(g,4.8,.35,.25,basic(0xffd56a),0,4.7,3.14);box(g,.35,3.8,.25,basic(0x7df9ff),0,2.6,3.14);root.add(g);smashables.push({kind:'cabinet',g,x,z,on:false});
  }
  for(let i=0;i<4;i++){
    const a=i/4*Math.PI*2,x=arcadeX+Math.sin(a)*16,z=arcadeZ+Math.cos(a)*14,y=heightAt(x,z),g=makeGuard();g.position.set(x,y,z);root.add(g);
    guards.push({kind:'guard',g,x,z,homeX:x,homeZ:z,on:false,phase:i*1.4,radius:3.0});
  }
  for(const side of[-1,1]){const x=arcadeX+side*21,z=arcadeZ,y=heightAt(x,z);box(root,3,13,34,metal,x,y+6.5,z)}
  const marquee=box(root,34,3,2,mat(0x2a2240,0x7e3fd8,.5),arcadeX,heightAt(arcadeX,arcadeZ-19)+10,arcadeZ-19);box(root,26,.25,.3,basic(0xffb640),arcadeX,heightAt(arcadeX,arcadeZ-19)+10,arcadeZ-17.95);

  const returnPads=defs.map(d=>{const x=d.start.x-(d.id==='jump'?4:0),z=d.start.z-(d.id==='jump'?3:d.id==='breaker'?8:12),y=d.id==='jump'?platforms[0].top:heightAt(x,z);const g=new T.Mesh(new T.CylinderGeometry(3.8,4.3,.3,18),mat(0xb67cff,0x6f32d8,.75));g.position.set(x,y+.18,z);root.add(g);const halo=new T.Mesh(new T.TorusGeometry(3.4,.12,6,28),basic(0xe7c2ff,.75));halo.rotation.x=Math.PI/2;halo.position.set(x,y+.42,z);root.add(halo);return{id:d.id,g,halo,x,z}});

  addRealmScenery(root,{cx,cz,heightAt,platforms,rings:speedRings,smashables});
  realmSign(root,'JUMP KINGDOM',cx-66,24,cz+53,'#ffe19b',26);
  realmSign(root,'VELOCITY CIRCUIT',cx,22,cz+123,'#72f3ff',28);
  realmSign(root,'BREAKER CITY',arcadeX,27,arcadeZ-20,'#ffba6a',25);
  for(const p of returnPads)realmSign(root,'RETURN TO NEXUS',p.x,p.g.position.y+3.5,p.z,'#dec4ff',12);

  const coins=[],enemies=[],springs=[],spikes=[],questionBlocks=[];
  for(const p of platforms.slice(1,-1)){
    for(const side of[-1,1]){const g=new T.Mesh(new T.TorusGeometry(.35,.10,6,12),mat(0xffd64e,0xc27a00,.6));g.position.set(p.x+side*2,p.top+1.1,p.z);root.add(g);coins.push({g,x:g.position.x,z:g.position.z,y:g.position.y,on:false})}
  }
  for(const i of[1,3,5]){
    const p=platforms[i],g=new T.Group(),body=new T.Mesh(new T.SphereGeometry(.7,10,7),mat(0x98603e));body.scale.y=.72;body.position.y=.5;g.add(body);
    for(const x of[-.22,.22]){box(g,.22,.28,.10,mat(0xffffff),x,.65,.57);box(g,.07,.12,.12,mat(0x1e1720),x,.62,.62);box(g,.42,.15,.55,mat(0x3e2531),x,.08,.1)}
    g.position.set(p.x,p.top,p.z);root.add(g);enemies.push({g,p,index:i,on:false});
    const q=box(root,1.3,1.3,1.3,mat(0xffbb36,0x9d5a00,.3),p.x-2,p.top+3.35,p.z+1.6);questionBlocks.push({g:q,p,on:false});realmSign(root,'?',q.position.x,q.position.y,q.position.z+.68,'#ffffff',1.1);
  }
  for(const i of[3,8]){
    const r=speedRings[i],g=cyl(root,1.2,1.2,.4,mat(0xe13e4c),r.x,heightAt(r.x,r.z)+.3,r.z,12);
    const coil=new T.Mesh(new T.TorusGeometry(.8,.14,6,16),mat(0xffda62));coil.rotation.x=Math.PI/2;coil.position.copy(g.position).add(new T.Vector3(0,.35,0));root.add(coil);springs.push({g,x:r.x,z:r.z,cooldown:0});
  }
  for(const i of[4,9,12]){const r=speedRings[i],x=r.x+4,z=r.z,y=heightAt(x,z);const g=new T.Group();g.position.set(x,y,z);for(const d of[-.6,0,.6]){const spike=new T.Mesh(new T.ConeGeometry(.28,1.1,6),mat(0xc6dbea));spike.position.set(d,.55,0);g.add(spike)}root.add(g);spikes.push({g,x,z,y})}
  const debris=[];for(let i=0;i<20;i++){const g=box(root,.6,.6,.6,mat(i%2?0xe4a26b:0x91d7e4));g.visible=false;debris.push({g,life:0,v:new T.Vector3()})}
  const SPIN_DURATION=1.2,SPIN_TURNS=4,SPIN_PIVOT_Y=1.35;
  let hurtCooldown=0,spinTimer=0,punchTimer=0,elapsed=0,finishTime=null,coinScore=0;
  let active=null,dashTimer=0,jumpCheckpoint=0,speedCheckpoint=0,realmStartedAt=0,combo=0,comboTimer=0,score=0;
  const completed={jump:false,velocity:false,breaker:false},bestTimes={velocity:null},hits={jump:0,velocity:0};
  function setBaseVisible(visible){baseRig.visible=visible&&hero.userData.modelState!=='ready';if(hero.userData.nightweaver)hero.userData.nightweaver.visible=visible}
  function showVariant(id){for(const [k,v] of Object.entries(variants))v.visible=k===id;setBaseVisible(!id)}
  function resetRealm(id){
    completed[id]=false;elapsed=0;finishTime=null;hurtCooldown=1;spinTimer=punchTimer=0;coinScore=0;
    for(const b of questionBlocks){b.on=false;b.g.material.color.setHex(0xffbb36)}
    for(const c of coins){c.on=false;c.g.visible=true}for(const e of enemies){e.on=false;e.g.visible=true}
    for(const spring of springs)spring.cooldown=0;
    if(id==='jump'){for(const t of jumpTokens){t.on=false;t.g.visible=true}jumpCheckpoint=0;hits.jump=0}
    if(id==='velocity'){for(const r of speedRings){r.on=false;r.g.visible=true;r.g.material.emissiveIntensity=r.index===0?.95:.18}speedCheckpoint=0;dashTimer=0;hits.velocity=0}
    if(id==='breaker'){for(const b of [...smashables,...guards]){b.on=false;b.g.visible=true;b.g.scale.setScalar(1)}combo=score=0;comboTimer=0}
  }
  function enter(d,position){
    active=d.id;resetRealm(active);showVariant(active);realmStartedAt=performance.now?.()??0;
    const y=surfaceHeight(d.start.x,d.start.z,heightAt(d.start.x,d.start.z),Infinity,0);position.set(d.start.x,y,d.start.z);burstTransform(position,d.color);
    onHaptic([30,30,55]);onToast(d.character+' active · '+(d.id==='jump'?'JUMP + BOOST across the platforms. Stomp walkers, hit gold blocks from below, collect six stars.':d.id==='velocity'?'Follow gold rings in order. BOOST to run, E / SPIN DASH to accelerate. Red springs bounce; avoid spikes.':'SMASH the nine city towers and four guards. Keep moving to avoid guards; chain hits for combos.'),5600);
  }
  function leave(position){
    active=null;showVariant(null);position.set(cx,hubY+.1,cz+10);burstTransform(position,0xcaa6ff);onHaptic(25);onToast('Returned to the Multiverse Nexus as Nightweaver.',3200)
  }
  function nearestPortal(position){let best=null,bd=7;for(const p of portals){const d=dist2(position,p.p);if(d<bd){best=p;bd=d}}return best}
  function nearestReturn(position){
    if(!active)return null;const p=returnPads.find(p=>p.id===active);if(p&&dist2(position,p)<6)return p;
    if(active==='jump'&&completed.jump&&dist2(position,goalArch.position)<6)return {id:'jump-finish',x:goalArch.position.x,z:goalArch.position.z};
    if(active==='velocity'&&completed.velocity&&dist2(position,speedGate.position)<6)return {id:'velocity-finish',x:speedGate.position.x,z:speedGate.position.z};
    return null;
  }
  function smashTargets(){return [...smashables,...guards]}
  function nearestSmash(position){if(active!=='breaker')return null;let best=null,bd=6.2;for(const b of smashTargets()){if(b.on)continue;const d=dist2(position,b);if(d<bd){best=b;bd=d}}return best}
  function smash(block){
    block.on=true;block.g.visible=false;punchTimer=.4;burstTransform(block.g.position,0xffb45e);
    debris.forEach((d,i)=>{d.life=.9;d.g.visible=true;d.g.position.copy(block.g.position).add(new T.Vector3(0,2,0));d.v.set(Math.sin(i*2.4)*6,4+(i%4),Math.cos(i*2.4)*6)});
    combo=comboTimer>0?combo+1:1;comboTimer=2.8;score+=100*combo;onHaptic([20,20,40]);
    const n=smashTargets().filter(b=>b.on).length,total=smashTargets().length;
    if(n===total){completed.breaker=true;finishTime=elapsed;onToast('BREAKER ARCADE CLEARED · SCORE '+score+' · return pad ready.',4800)}
    else onToast((block.kind==='guard'?'GUARD DOWN ':'SMASH ')+n+'/'+total+' · COMBO ×'+combo,1300);
  }
  function interact(position){
    const ret=nearestReturn(position);if(ret){leave(position);return true}
    if(!active){const p=nearestPortal(position);if(p){enter(p,position);return true}return false}
    if(active==='velocity'){spinTimer=SPIN_DURATION;dashTimer=SPIN_DURATION;onHaptic(15);return true}
    const block=nearestSmash(position);if(block){smash(block);return true}
    return false;
  }
  function actionLabel(position){if(nearestReturn(position))return 'Return';if(!active&&nearestPortal(position))return 'Enter';if(active==='velocity')return 'SPIN DASH';if(active==='breaker')return 'SMASH';return null}
  function surfaceHeight(x,z,base,playerY=Infinity,verticalSpeed=0,previousY=playerY){
    if(active!=='jump')return base;let top=base;
    for(const p of platforms){
      if(Math.abs(x-p.x)>p.w*.5||Math.abs(z-p.z)>p.d*.5)continue;
      // Only treat a raised platform as ground when the player is already on/above its top.
      // This avoids the old X/Z-only snap that pulled the player through the underside.
      if(Math.max(playerY,previousY)>=p.top-.22&&verticalSpeed<=2.5)top=Math.max(top,p.top);
    }
    return top;
  }
  function resolveCollision(position,radius=.5){
    if(active!=='breaker')return false;let moved=false;
    for(const b of smashTargets()){
      if(b.on)continue;const br=b.kind==='guard'?1.45:3.65,dx=position.x-b.g.position.x,dz=position.z-b.g.position.z,d=Math.hypot(dx,dz),min=br+radius;
      if(d<min){const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;position.x=b.g.position.x+nx*min;position.z=b.g.position.z+nz*min;moved=true}
    }return moved;
  }
  function speedMultiplier(){if(active!=='velocity')return 1;return dashTimer>0?3.0:1.9}
  function jumpVelocity(base=9){return active==='jump'?10.8:active==='velocity'?8.6:active==='breaker'?7.7:base}
  function respawn(position,id){
    hurtCooldown=1.6;
    let point;
    if(id==='jump'){point=jumpCheckpoints[jumpCheckpoint]||jumpCheckpoints[0];hits.jump++}
    else{point=speedCheckpoints[speedCheckpoint]||speedCheckpoints[0];hits.velocity++;dashTimer=0}
    position.set(point.x,point.y+.15,point.z);onHaptic([80,45,80]);onToast(id==='jump'?'Checkpoint restored · try the jump again.':'Circuit recovery · last checkpoint restored.',2200);return true;
  }
  function updateAvatar(time,moving,boosting){
    const v=active?variants[active]:null;if(!v)return;const l=v.userData.limbs;if(!l)return;
    const rate=active==='velocity'?(boosting?18:13):active==='breaker'?7:10,ph=time*rate,walk=moving?1:0,amp=(active==='breaker'?.45:active==='velocity'?.85:.65)*walk,s=Math.sin(ph),ease=.22;
    l.lA.rotation.x+=(s*amp-l.lA.rotation.x)*ease;l.rA.rotation.x+=(-s*amp-l.rA.rotation.x)*ease;l.lL.rotation.x+=(-s*amp-l.lL.rotation.x)*ease;l.rL.rotation.x+=(s*amp-l.rL.rotation.x)*ease;l.torso.rotation.y+=(-s*amp*.08-l.torso.rotation.y)*ease;if(punchTimer>0){l.lA.rotation.x=-1.7;l.rA.rotation.x=-1.7}if(active==='velocity'&&spinTimer>0){const phase=1-spinTimer/SPIN_DURATION,a=-phase*Math.PI*2*SPIN_TURNS;v.rotation.x=a;v.position.y=SPIN_PIVOT_Y*(1-Math.cos(a));v.position.z=-SPIN_PIVOT_Y*Math.sin(a)}else{v.rotation.x=0;v.position.y=0;v.position.z=0}
    if(l.trail)l.trail.visible=active==='velocity'&&moving&&(boosting||dashTimer>0);
  }
  function update({time,dt,position,moving=false,boosting=false,verticalSpeed=0}){
    let resetVertical=false,bounceVelocity=0;
    root.visible=!!active||dist2(position,{x:cx,z:cz})<430;
    for(const id of Object.keys(variants))variants[id].visible=active===id;
    hurtCooldown=Math.max(0,hurtCooldown-dt);spinTimer=Math.max(0,spinTimer-dt);punchTimer=Math.max(0,punchTimer-dt);
    if(active&&finishTime===null)elapsed+=dt;
    for(const d of debris)if(d.life>0){d.life-=dt;d.g.position.addScaledVector(d.v,dt);d.v.y-=18*dt;d.g.rotation.x+=dt*4;d.g.visible=d.life>0}

    for(const p of portals){p.g.userData.ring.rotation.z+=dt*.38;p.g.userData.halo.rotation.z-=dt*.22;p.g.userData.inner.material.opacity=.16+.09*Math.sin(time*2.2+p.p.x*.01)}
    for(const r of returnPads)r.halo.rotation.z+=dt*.9;
    if(transformFxLife>0){transformFxLife-=dt;const t=1-transformFxLife/.7;transformFx.scale.setScalar(.5+t*4);transformFx.material.opacity=Math.max(0,(1-t)*.8);if(transformFxLife<=0)transformFx.visible=false}
    jumpTokens.forEach((t,i)=>{if(!t.on){t.g.rotation.y+=dt*1.7;t.g.position.y=t.y+Math.sin(time*2+i)*.25}});
    jumpCheckpoints.forEach((c,i)=>{c.halo.rotation.z+=dt*.7;c.g.scale.setScalar(i===jumpCheckpoint?1.08:1)});
    speedCheckpoints.forEach((c,i)=>{c.halo.rotation.z-=dt*.9;c.g.scale.setScalar(i===speedCheckpoint?1.08:1)});
    dashTimer=Math.max(0,dashTimer-dt);comboTimer=Math.max(0,comboTimer-dt);if(comboTimer<=0)combo=0;

    if(active==='jump'){
      for(let i=0;i<jumpCheckpoints.length;i++)if(dist2(position,jumpCheckpoints[i])<3.2&&Math.abs(position.y-jumpCheckpoints[i].y)<1.1&&i>jumpCheckpoint){jumpCheckpoint=i;onHaptic(18);onToast('CHECKPOINT '+(i+1)+'/'+jumpCheckpoints.length,1400)}
      for(const h of jumpHazards){
        const angle=time*h.speed+h.phase;h.g.rotation.y=angle;const bx=h.x+Math.cos(angle)*h.r,bz=h.z-Math.sin(angle)*h.r;
        if(hurtCooldown<=0&&Math.abs(position.y-h.y)<1.25&&segmentDistance(position.x,position.z,h.x,h.z,bx,bz)<.75){resetVertical=respawn(position,'jump');break}
      }
      for(const t of jumpTokens)if(!t.on&&Math.hypot(position.x-t.x,position.y-t.g.position.y,position.z-t.z)<2.3){
        t.on=true;t.g.visible=false;onHaptic(18);const n=jumpTokens.filter(x=>x.on).length;onToast('PRISM '+n+'/'+jumpTokens.length,900);
        if(n===jumpTokens.length){completed.jump=true;finishTime=elapsed;onToast('JUMP KINGDOM CLEARED · finish gate unlocked.',4200)}
      }
      for(const c of coins)if(!c.on){c.g.rotation.y+=dt*3;if(Math.hypot(position.x-c.x,position.y+1-c.y,position.z-c.z)<1.2){c.on=true;c.g.visible=false;coinScore++;onHaptic(9)}}
      for(const b of questionBlocks)if(!b.on&&verticalSpeed>0&&Math.hypot(position.x-b.g.position.x,position.z-b.g.position.z)<1.25&&position.y+2.5>b.g.position.y-.65&&position.y<b.g.position.y){b.on=true;b.g.material.color.setHex(0x805736);coinScore+=5;bounceVelocity=-1;onToast('GOLD BLOCK · +5 coins',1000)}
      for(const e of enemies)if(!e.on){
        e.g.position.x=e.p.x+Math.sin(time*1.1+e.index)*2;e.g.rotation.y=Math.cos(time*1.1+e.index)>0?Math.PI/2:-Math.PI/2;
        if(dist2(position,e.g.position)<1.2&&Math.abs(position.y-e.p.top)<2){
          if(verticalSpeed<0&&position.y>e.p.top+.6){e.on=true;e.g.visible=false;bounceVelocity=9;coinScore+=3;onToast('STOMP! +3 coins',1000)}
          else if(hurtCooldown<=0){resetVertical=respawn(position,'jump')}
        }
      }
      if(position.y<12.75||heightAt(position.x,position.z)<-.2||dist2(position,{x:cx,z:cz})>island.radius*1.05)resetVertical=respawn(position,'jump');
    }

    if(active==='velocity'){
      for(const p of speedPads)if(dist2(position,p)<4.5)dashTimer=.55;
      const nextIndex=speedRings.findIndex(r=>!r.on);
      for(const r of speedRings){
        r.g.material.emissiveIntensity=r.on?0:(r.index===nextIndex?1.45:.16);
        if(!r.on&&r.index===nextIndex&&Math.hypot(position.x-r.x,position.z-r.z)<3.2){
          r.on=true;r.g.visible=false;onHaptic(12);const n=speedRings.filter(x=>x.on).length;
          if(n===5)speedCheckpoint=1;if(n===10)speedCheckpoint=2;
          if(n===speedRings.length){completed.velocity=true;finishTime=elapsed;bestTimes.velocity=bestTimes.velocity==null?elapsed:Math.min(bestTimes.velocity,elapsed);onToast('VELOCITY CIRCUIT CLEARED · '+elapsed.toFixed(1)+'s · finish gate unlocked.',4500)}
          else if(n%4===0)onToast('RINGS '+n+'/'+speedRings.length+' · keep the line.',1200);
        }
      }
      for(const spring of springs){spring.cooldown=Math.max(0,spring.cooldown-dt);if(spring.cooldown<=0&&dist2(position,spring)<2&&position.y<heightAt(spring.x,spring.z)+1){spring.cooldown=1.3;bounceVelocity=11;dashTimer=.9;onHaptic(20)}}
      for(const spike of spikes)if(hurtCooldown<=0&&dist2(position,spike)<1.3&&position.y<spike.y+1){resetVertical=respawn(position,'velocity');onToast('Spikes! Checkpoint restored.',1500)}
      if(heightAt(position.x,position.z)<-.5||dist2(position,{x:cx,z:cz})>island.radius*1.08)resetVertical=respawn(position,'velocity');
    }

    if(active==='breaker'){
      guards.forEach((b,i)=>{if(b.on)return;const a=time*.55+b.phase;b.g.position.x=b.homeX+Math.sin(a)*4.4;b.g.position.z=b.homeZ+Math.cos(a*.83)*3.4;b.g.position.y=heightAt(b.g.position.x,b.g.position.z);b.x=b.g.position.x;b.z=b.g.position.z;b.g.rotation.y=a;b.g.userData.tip.material.opacity=.55+.45*Math.sin(time*5+i);if(hurtCooldown<=0&&dist2(position,b.g.position)<2.4){hurtCooldown=1.2;combo=0;comboTimer=0;position.x+=Math.sin(a)*3;position.z+=Math.cos(a)*3;onHaptic(50);onToast('Guard hit! Combo lost — SMASH from arm’s reach.',1600)}});
    }

    updateAvatar(time,moving,boosting);
    const hint=actionLabel(position)||'',near=!active?nearestPortal(position):null;
    return {active,hint,bounceVelocity,status:active?statusText():(near?near.name+' · become '+near.character:null),resetVertical};
  }
  function statusText(){
    if(!active)return null;
    if(active==='jump')return 'Redcap Rover · Prisms '+jumpTokens.filter(t=>t.on).length+'/'+jumpTokens.length+' · CP '+(jumpCheckpoint+1)+'/'+jumpCheckpoints.length+' · Coins '+coinScore+' · Hits '+hits.jump;
    if(active==='velocity'){const n=speedRings.filter(r=>r.on).length;return 'Volt Runner · Rings '+n+'/'+speedRings.length+' · '+(finishTime??elapsed).toFixed(1)+'s'+(completed.velocity?' · CLEAR':'')}
    return 'Brick Titan · '+smashTargets().filter(b=>b.on).length+'/'+smashTargets().length+' · Score '+score+(combo?' · ×'+combo:'');
  }
  function restart(position){if(active)enter(defs.find(d=>d.id===active),position)}
  function travelToHub(position){leave(position)}
  function chooseRealm(id,position){const d=defs.find(d=>d.id===id);if(d)enter(d,position)}
  function guidance(){if(active==='jump'){const t=jumpTokens.find(t=>!t.on);return t?{...t,name:'Next star'}:{...goalArch.position,name:'Finish portal'}}if(active==='velocity'){const t=speedRings.find(t=>!t.on);return t?{...t,name:'Next ring '+(t.index+1)}:{...speedGate.position,name:'Finish portal'}}if(active==='breaker'){const b=smashTargets().find(b=>!b.on);return b?{...b,name:b.kind==='guard'?'Security guard':'City tower'}:returnPads.find(p=>p.id==='breaker')}return null}
  function isTransformed(){return !!active}
  function stats(){return {completed:{...completed},bestTimes:{...bestTimes},hits:{...hits},score,combo,jumpCheckpoint,speedCheckpoint,elapsed,finishTime,coinScore}}
  return {
    destination:{id:MULTIVERSE_ISLAND_ID,name:'Multiverse Nexus',shortName:'NEXUS',x:cx,z:cz,icon:'◎',category:'OFFSHORE · CHARACTER REALMS',description:'Three portal trials: Jump Kingdom, Velocity Circuit, and Breaker City. More realms can be added later.'},
    restart,travelToHub,chooseRealm,guidance,coins,enemies,questionBlocks,springs,spikes,
    surfaceHeight,resolveCollision,speedMultiplier,jumpVelocity,interact,actionLabel,update,statusText,isTransformed,stats,
    activeRealm:()=>active,completed:()=>({...completed}),portals,returnPads,platforms,jumpTokens,jumpCheckpoints,jumpHazards,goalArch,speedRings,speedPads,speedCheckpoints,speedGate,smashables,guards,variants,root
  };
}
