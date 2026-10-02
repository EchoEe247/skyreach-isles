import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const TRIPLE_FORGE_DESTINATIONS=Object.freeze([
  {id:'skyhold',name:'Skyhold · Floating Sky Palace',shortName:'SKYHOLD',x:-280,z:-220,icon:'♜',category:'AIRBORNE · LAND & EXPLORE',description:'A floating palace above the cloud line. Approach by aircraft and land on the illuminated palace plaza.'},
  {id:'grovekeep',name:'Grovekeep · Titan Tree Fortress',shortName:'GROVEKEEP',x:-360,z:780,icon:'♣',category:'OFFSHORE · CLIMB & EXPLORE',description:'A colossal fortified tree on an artificial isle, with a climbable helical ramp and elevated war decks.'},
  {id:'arachne-sentinel',name:'Arachne Sentinel',shortName:'ARACHNE',x:-432,z:858,icon:'⚔',category:'AI WILDS · BOSS ENCOUNTER',description:'A reactor-powered sentinel spider guarding the outer Grovekeep platform. Close in and strike its core.'}
]);

const SKY={x:-280,z:-220,baseY:150,radius:36};
const GROVE={x:-360,z:780,y:3.1,radius:47};
const ARENA={x:-432,z:858,y:3.15,radius:28};
const HOUND_DOCK={x:18,z:61};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const point=o=>o?.position||o;
const dist=(a,b)=>{a=point(a);b=point(b);return Math.hypot(a.x-b.x,a.z-b.z)};
const KEEP=new Set(['position','normal','uv','color','tangent']);

function signature(g){
  return Object.keys(g.attributes).sort().map(k=>{
    const a=g.getAttribute(k);return k+':'+a.itemSize+':'+(a.normalized?1:0)+':'+a.array.constructor.name;
  }).join(',');
}

function mergeStaticByMaterial(source){
  source.updateMatrixWorld(true);const batches=new Map();
  source.traverse(o=>{
    if(!o.isMesh)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.length!==1)return;
    let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();if(!g.getAttribute('normal'))g.computeVertexNormals();
    for(const k of Object.keys(g.attributes))if(!KEEP.has(k))g.deleteAttribute(k);
    const mat=mats[0],key=mat.uuid+'|'+signature(g);if(!batches.has(key))batches.set(key,{mat,geos:[]});batches.get(key).geos.push(g);
  });
  const out=new T.Group();
  for(const {mat,geos} of batches.values()){
    const g=geos.length===1?geos[0]:mergeGeometries(geos,false);
    if(!g)continue;
    const m=mat.clone();if('emissiveIntensity' in m)m.emissiveIntensity=Math.min(4,Math.max(.2,m.emissiveIntensity||1));
    const mesh=new T.Mesh(g,m);mesh.castShadow=false;mesh.receiveShadow=false;out.add(mesh);
  }
  return out.children.length?out:source.clone(true);
}

function prepareVisual(source,targetSpan,{faceForward=false}={}){
  source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const span=Math.max(size.x,size.z,size.y*.65,.001),scale=targetSpan/span;
  const visual=mergeStaticByMaterial(source);visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  if(faceForward)visual.rotation.y=Math.PI;
  visual.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});
  return {visual,scale,bounds};
}

function fallback(color,kind='orb'){
  const g=new T.Group(),mat=new T.MeshStandardMaterial({color,roughness:.55,metalness:.25,emissive:color,emissiveIntensity:.12});
  if(kind==='hound'){
    const body=new T.Mesh(new T.BoxGeometry(2.8,1.4,4.2),mat);body.position.y=1.5;g.add(body);
    const head=new T.Mesh(new T.BoxGeometry(1.5,1.3,1.6),mat);head.position.set(0,1.8,2.4);g.add(head);
    for(const x of[-.9,.9])for(const z of[-1.35,1.35]){const l=new T.Mesh(new T.BoxGeometry(.45,1.6,.45),mat);l.position.set(x,.65,z);g.add(l)}
  }else if(kind==='spider'){
    const core=new T.Mesh(new T.SphereGeometry(2.1,10,8),mat);core.position.y=2.4;g.add(core);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,leg=new T.Mesh(new T.BoxGeometry(.45,.45,5.2),mat);leg.position.set(Math.sin(a)*3.2,1.5,Math.cos(a)*3.2);leg.rotation.y=-a;g.add(leg)}
  }else{
    const m=new T.Mesh(new T.IcosahedronGeometry(3,1),mat);m.position.y=3;g.add(m);
  }
  return g;
}

function bridgeGeometry(scene){
  const dx=ARENA.x-GROVE.x,dz=ARENA.z-GROVE.z,len=Math.hypot(dx,dz),a=Math.atan2(dx,dz);
  const mat=new T.MeshStandardMaterial({color:0x59616b,roughness:.92,metalness:.08}),rail=new T.MeshStandardMaterial({color:0x9b7b45,roughness:.72,metalness:.25});
  const deck=new T.Mesh(new T.BoxGeometry(5.6,.7,len),mat);deck.position.set((GROVE.x+ARENA.x)/2,3,(GROVE.z+ARENA.z)/2);deck.rotation.y=a;scene.add(deck);
  for(const side of[-1,1]){const r=new T.Mesh(new T.BoxGeometry(.18,1.1,len),rail);r.position.copy(deck.position);r.position.x+=Math.cos(a)*side*2.55;r.position.z-=Math.sin(a)*side*2.55;r.position.y=3.65;r.rotation.y=a;scene.add(r)}
}

function distanceToBridge(x,z){
  const ax=GROVE.x,az=GROVE.z,bx=ARENA.x,bz=ARENA.z,dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=clamp(((x-ax)*dx+(z-az)*dz)/l2,0,1);
  return Math.hypot(x-(ax+dx*t),z-(az+dz*t));
}

function savedState(){
  try{return JSON.parse(localStorage.getItem('skyreach-triple-forge-v1')||'{}')}catch{return {}}
}
function writeState(v){try{localStorage.setItem('skyreach-triple-forge-v1',JSON.stringify(v))}catch{}}

export function createTripleForgeExpansion(scene,{heightAt,onToast=()=>{},onHaptic=()=>{}}={}){
  const loader=new GLTFLoader(),state=savedState();
  const modelState={skyhold:'deferred',grovekeep:'deferred',arachne:'deferred',steelhound:'deferred'};
  const holders={};
  let skySurfaceY=SKY.baseY+19,houndFollow=!!state.houndFollow,bossHp=state.arachneDefeated?0:10,bossHit=0,bossAttack=0,bossAngle=0;

  const rockMat=new T.MeshStandardMaterial({color:0x596253,roughness:.96}),stoneMat=new T.MeshStandardMaterial({color:0x73747a,roughness:.9}),glowMat=new T.MeshStandardMaterial({color:0x3bd7ff,emissive:0x3bd7ff,emissiveIntensity:1.8,roughness:.35});
  const groveRock=new T.Mesh(new T.CylinderGeometry(GROVE.radius-2,GROVE.radius+8,7,32),rockMat);groveRock.position.set(GROVE.x,-.35,GROVE.z);scene.add(groveRock);
  const arena=new T.Mesh(new T.CylinderGeometry(ARENA.radius,ARENA.radius+2,2.5,32),stoneMat);arena.position.set(ARENA.x,1.9,ARENA.z);scene.add(arena);
  const arenaRing=new T.Mesh(new T.TorusGeometry(ARENA.radius-2,.32,8,48),glowMat);arenaRing.position.set(ARENA.x,ARENA.y+.12,ARENA.z);arenaRing.rotation.x=Math.PI/2;scene.add(arenaRing);
  bridgeGeometry(scene);

  const landingPad=new T.Mesh(new T.CylinderGeometry(20,20,.7,32),new T.MeshStandardMaterial({color:0x7c8795,roughness:.62,metalness:.24}));
  landingPad.position.set(SKY.x,skySurfaceY-.35,SKY.z);scene.add(landingPad);
  const landingRing=new T.Mesh(new T.TorusGeometry(15,.45,8,40),glowMat);landingRing.position.set(SKY.x,skySurfaceY+.08,SKY.z);landingRing.rotation.x=Math.PI/2;scene.add(landingRing);

  function holder(name,pos){
    const g=new T.Group();g.name=name;g.position.set(pos.x,pos.y||0,pos.z);scene.add(g);holders[name]=g;return g;
  }
  const sky=holder('Skyhold',{x:SKY.x,y:SKY.baseY,z:SKY.z}),grove=holder('Grovekeep',{x:GROVE.x,y:GROVE.y,z:GROVE.z});
  const boss=holder('Arachne',{x:ARENA.x,y:ARENA.y,z:ARENA.z}),hound=holder('Steelhound',{x:HOUND_DOCK.x,y:heightAt(HOUND_DOCK.x,HOUND_DOCK.z),z:HOUND_DOCK.z});
  hound.visible=true;

  function load(key,url,targetSpan,target,{faceForward=false,onReady=null,kind='orb',color=0x55ccff}={}){
    if(modelState[key]!=='deferred')return;modelState[key]='loading';
    const fb=fallback(color,kind);target.add(fb);target.userData.fallback=fb;
    loader.load(new URL(url,document.baseURI).href,gltf=>{
      try{
        const source=gltf.scene,plaza=source.getObjectByName('plaza'),plazaBounds=plaza?new T.Box3().setFromObject(plaza):null;
        const prepared=prepareVisual(source,targetSpan,{faceForward});target.remove(fb);target.add(prepared.visual);target.userData.visual=prepared.visual;modelState[key]='ready';
        if(onReady)onReady({source,prepared,plazaBounds});
      }catch(e){console.warn(key+' processing failed',e);modelState[key]='fallback'}
    },undefined,e=>{console.warn(key+' load failed',e);modelState[key]='fallback'});
  }

  function preload(id){
    if(!id||id==='skyhold')load('skyhold','assets/triple-forge/building/skyhold.glb',82,sky,{color:0xd8b85d,onReady:({prepared,plazaBounds})=>{
      if(plazaBounds){const local=(plazaBounds.max.y-prepared.bounds.min.y)*prepared.scale;skySurfaceY=SKY.baseY+local;landingPad.position.y=skySurfaceY-.35;landingRing.position.y=skySurfaceY+.08}
    }});
    if(!id||id==='grovekeep')load('grovekeep','assets/triple-forge/building/grovekeep.glb',74,grove,{color:0x6b8d55});
    if(!id||id==='arachne-sentinel')load('arachne','assets/triple-forge/ai/arachne.glb',13,boss,{faceForward:true,kind:'spider',color:0xa757ff});
    if(!id||id==='steelhound')load('steelhound','assets/triple-forge/ai/steelhound.glb',6.4,hound,{faceForward:true,kind:'hound',color:0xd79b42});
  }
  preload('steelhound');

  const ray=new T.Raycaster(),origin=new T.Vector3(),down=new T.Vector3(0,-1,0);
  function meshSurface(root,x,z,currentY,floor){
    if(!root.userData.visual)return null;root.updateMatrixWorld(true);
    const oy=Math.max(floor+2.5,Number.isFinite(currentY)?currentY+2.4:floor+12);
    origin.set(x,oy,z);ray.set(origin,down);ray.far=Math.max(10,oy-floor+4);
    const hits=ray.intersectObject(root.userData.visual,true);
    for(const h of hits)if(h.point.y>=floor-.5&&h.point.y<=oy+.05)return h.point.y;
    return null;
  }

  function staticGround(x,z){
    const dg=Math.hypot(x-GROVE.x,z-GROVE.z),da=Math.hypot(x-ARENA.x,z-ARENA.z);
    if(dg<GROVE.radius)return GROVE.y;
    if(da<ARENA.radius)return ARENA.y;
    if(distanceToBridge(x,z)<2.8)return 3.15;
    return null;
  }

  function surfaceHeight(x,z,base,currentY=base,verticalSpeed=0){
    let out=base;const staticY=staticGround(x,z);if(staticY!==null)out=Math.max(out,staticY);
    if(Math.hypot(x-GROVE.x,z-GROVE.z)<GROVE.radius&&modelState.grovekeep==='ready'){
      const y=meshSurface(grove,x,z,currentY,GROVE.y);if(y!==null&&y<=currentY+3.2)out=Math.max(out,y);
    }
    if(Math.hypot(x-SKY.x,z-SKY.z)<SKY.radius&&currentY>skySurfaceY-14){
      out=Math.max(out,skySurfaceY);
      if(modelState.skyhold==='ready'){const y=meshSurface(sky,x,z,currentY,skySurfaceY-1);if(y!==null&&y<=currentY+3.2)out=Math.max(out,y)}
    }
    return out;
  }

  function surfaceType(x,z,y=0){
    if(Math.hypot(x-SKY.x,z-SKY.z)<SKY.radius&&y>skySurfaceY-14)return 'stone';
    if(staticGround(x,z)!==null)return distanceToBridge(x,z)<2.8?'wood':'stone';
    return null;
  }
  function walkable(x,z,y=0){return surfaceType(x,z,y)!==null}
  function waterBlocked(x,z){return Math.hypot(x-GROVE.x,z-GROVE.z)<GROVE.radius+2||Math.hypot(x-ARENA.x,z-ARENA.z)<ARENA.radius+2}
  function planeGroundHeight(x,z,y){
    if(Math.hypot(x-SKY.x,z-SKY.z)<20&&y>skySurfaceY-18)return skySurfaceY;
    return null;
  }

  function interact(position){
    const dh=dist(position,hound);
    if(dh<4.8){
      houndFollow=!houndFollow;writeState({houndFollow,arachneDefeated:bossHp<=0});
      onHaptic(25);onToast(houndFollow?'STEELHOUND linked · it will rejoin you whenever you return on foot.':'STEELHOUND holding position.',3400);return true;
    }
    const db=dist(position,boss);
    if(db<7.2&&bossHp>0){
      if(bossHit>0)return true;
      const assist=houndFollow&&hound.visible&&dist(hound,boss)<9?2:1;bossHp=Math.max(0,bossHp-assist);bossHit=.28;onHaptic(assist>1?[24,20,48]:32);
      if(bossHp<=0){
        writeState({houndFollow,arachneDefeated:true});onToast('ARACHNE DISABLED · reactor offline. Grovekeep perimeter secured.',5200);
      }else onToast('ARACHNE reactor hit · '+bossHp+'/10'+(assist>1?' · STEELHOUND assist':''),1900);
      return true;
    }
    return false;
  }

  function hint(position){
    if(dist(position,hound)<4.8)return houndFollow?'Stay':'Follow';
    if(bossHp>0&&dist(position,boss)<7.2)return bossHit>0?'Recharging':'Strike';
    return null;
  }

  function resolveCollision(position,radius=.5){
    let moved=false;
    const push=(x,z,r)=>{
      const dx=position.x-x,dz=position.z-z,d=Math.hypot(dx,dz),min=r+radius;if(d>=min)return;
      const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;position.x=x+nx*min;position.z=z+nz*min;moved=true;
    };
    if(Math.hypot(position.x-GROVE.x,position.z-GROVE.z)<GROVE.radius)push(GROVE.x,GROVE.z,4.2);
    if(bossHp>0)push(boss.position.x,boss.position.z,3.2);
    return moved;
  }

  function update({time=0,dt=0,position,mode='foot',earthActive=true}={}){
    if(!earthActive){sky.visible=grove.visible=boss.visible=hound.visible=false;landingPad.visible=landingRing.visible=groveRock.visible=arena.visible=arenaRing.visible=false;return}
    sky.visible=grove.visible=groveRock.visible=arena.visible=arenaRing.visible=landingPad.visible=landingRing.visible=true;
    if(Math.hypot(position.x-SKY.x,position.z-SKY.z)<420)preload('skyhold');
    if(Math.hypot(position.x-GROVE.x,position.z-GROVE.z)<300){preload('grovekeep');preload('arachne-sentinel')}
    landingRing.rotation.z=time*.35;arenaRing.rotation.z=-time*.22;
    if(bossHit>0)bossHit=Math.max(0,bossHit-dt);
    if(bossHp<=0){boss.visible=modelState.arachne!=='deferred';boss.rotation.z+=(Math.PI/2-boss.rotation.z)*Math.min(1,dt*3)}
    else{
      boss.visible=true;const engaged=dist(position,ARENA)<58;bossAngle+=dt*(engaged?.48:.15);
      const rr=engaged?8:5;boss.position.x=ARENA.x+Math.sin(bossAngle)*rr;boss.position.z=ARENA.z+Math.cos(bossAngle)*rr;boss.position.y=ARENA.y+.08+Math.sin(time*3)*.08;boss.rotation.y=bossAngle+Math.PI;
      if(engaged&&mode==='foot'&&dist(position,boss)<4.7){
        bossAttack-=dt;if(bossAttack<=0){bossAttack=1.35;const dx=position.x-boss.position.x,dz=position.z-boss.position.z,m=Math.hypot(dx,dz)||1;position.x+=dx/m*3.8;position.z+=dz/m*3.8;onHaptic([38,24,45]);onToast('ARACHNE impact · get outside the leg sweep.',1400)}
      }else bossAttack=Math.max(0,bossAttack-dt);
    }
    if(houndFollow){
      if(mode!=='foot'){hound.visible=false}
      else{
        hound.visible=true;let d=dist(position,hound);
        if(d>32){const a=Math.atan2(position.x-hound.position.x,position.z-hound.position.z);hound.position.set(position.x-Math.sin(a)*3,heightAt(position.x,position.z),position.z-Math.cos(a)*3);d=3}
        if(d>3.3){const dx=position.x-hound.position.x,dz=position.z-hound.position.z,m=Math.hypot(dx,dz)||1,s=Math.min(9,d*1.8);hound.position.x+=dx/m*s*dt;hound.position.z+=dz/m*s*dt;hound.rotation.y=Math.atan2(dx,dz);hound.position.y=surfaceHeight(hound.position.x,hound.position.z,heightAt(hound.position.x,hound.position.z),position.y,0)+Math.abs(Math.sin(time*7))*.08}
        else hound.position.y=surfaceHeight(hound.position.x,hound.position.z,heightAt(hound.position.x,hound.position.z),position.y,0);
      }
    }else{hound.visible=true;hound.position.x+=(HOUND_DOCK.x-hound.position.x)*Math.min(1,dt*2);hound.position.z+=(HOUND_DOCK.z-hound.position.z)*Math.min(1,dt*2);hound.position.y=heightAt(hound.position.x,hound.position.z)}
    if(hound.visible)hound.rotation.z=Math.sin(time*5)*.012;
  }

  function guidance(position){
    if(bossHp>0&&dist(position,ARENA)<65)return {name:'Arachne Reactor '+bossHp+'/10',x:boss.position.x,z:boss.position.z};
    return null;
  }

  return {
    destinations:TRIPLE_FORGE_DESTINATIONS,
    preload,update,interact,hint,resolveCollision,surfaceHeight,surfaceType,walkable,waterBlocked,planeGroundHeight,guidance,
    status:()=>({models:{...modelState},skySurfaceY,houndFollow,bossHp}),
    points:{skyhold:SKY,grovekeep:GROVE,arena:ARENA,houndDock:HOUND_DOCK}
  };
}
