import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {terrainHeight} from '../core/world.js';
import {ENVIRONMENT_REGIONS,WILDLIFE} from '../core/environment-layout.js';

// Region demand-loading keeps the first frame independent of distant islands.
export function createEnvironmentAssets(scene,obstacles){
 const loader=new GLTFLoader(),cache=new Map(),animals=[],errors=[];
 const regions=ENVIRONMENT_REGIONS.map(r=>({...r,group:new T.Group(),state:'idle',count:0}));
 const load=key=>{
  if(!cache.has(key))cache.set(key,loader.loadAsync(new URL('assets/'+key+'.glb',document.baseURI).href));
  return cache.get(key);
 };
 const normalize=g=>{
  g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g),size=b.getSize(new T.Vector3());
  return {b,size,s:1/Math.max(.001,size.y),cx:(b.min.x+b.max.x)/2,cz:(b.min.z+b.max.z)/2};
 };
 function solid(p,width,depth){
  if(p.arch){
   const a=p.yaw||0,span=width*.41;
   for(const sign of [-1,1])obstacles.push({x:p.x+Math.cos(a)*span*sign,z:p.z-Math.sin(a)*span*sign,r:Math.min(.9,width*.09)});
  }else if(p.wall){
   const a=p.yaw||0,r=Math.max(.3,depth*.45);
   for(let x=-width*.45;x<=width*.45;x+=r*1.5)obstacles.push({x:p.x+Math.cos(a)*x,z:p.z-Math.sin(a)*x,r});
  }else if(p.solid){
   const tree=p.asset.includes('Tree');obstacles.push({x:p.x,z:p.z,r:tree?.45:Math.min(1.8,Math.min(width,depth)*.35)});
  }
 }
 async function populate(region){
  region.state='loading';scene.add(region.group);region.group.name='enrichment-'+region.id;
  const byAsset=new Map();
  for(const p of region.items){
   if(terrainHeight(p.x,p.z)<.5)continue;
   // Existing buildings and parked car have priority over decorative town props.
   if(region.id==='home'&&(obstacles.some(b=>Math.hypot(p.x-b.x,p.z-b.z)<b.r+1)||Math.hypot(p.x-9,p.z-14)<4))continue;
   if(!byAsset.has(p.asset))byAsset.set(p.asset,[]);byAsset.get(p.asset).push(p);
  }
  await Promise.all([...byAsset].map(async([key,points])=>{
   try{
    const gltf=await load(key),root=gltf.scene,{b,size,s,cx,cz}=normalize(root),meshes=[];
    root.traverse(o=>{if(o.isMesh)meshes.push(o)});
    // One instance batch per source mesh and region; no per-prop material clones.
    for(const mesh of meshes){
     const geo=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
     geo.translate(-cx,-b.min.y,-cz);geo.scale(s,s,s);
     const batch=new T.InstancedMesh(geo,mesh.material,points.length),dummy=new T.Object3D();
     batch.castShadow=false;batch.receiveShadow=true;
     points.forEach((p,i)=>{
      dummy.position.set(p.x,terrainHeight(p.x,p.z)+(p.offset||0)-.04,p.z);
      dummy.rotation.set(0,p.yaw||0,0);dummy.scale.setScalar(p.height);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
     });batch.computeBoundingSphere();region.group.add(batch);
    }
    for(const p of points)solid(p,size.x*s*p.height,size.z*s*p.height);
    region.count+=points.length;
   }catch(e){errors.push(key+': '+e.message);console.warn('Environment asset unavailable',key,e)}
  }));
  await Promise.all(WILDLIFE.filter(a=>a.region===region.id).map(async a=>{
   try{
    const gltf=await load('animals/'+a.species),model=cloneSkeleton(gltf.scene),n=normalize(model),rig=new T.Group();
    model.scale.multiplyScalar(a.height*n.s);model.position.set(-n.cx*a.height*n.s,-n.b.min.y*a.height*n.s,-n.cz*a.height*n.s);
    model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});
    rig.add(model);rig.position.set(a.x,terrainHeight(a.x,a.z),a.z);region.group.add(rig);
    const mixer=new T.AnimationMixer(model),clips={};
    for(const name of ['Idle','Eating','Walk']){
     const clip=gltf.animations.find(c=>c.name===name);if(clip)clips[name]=mixer.clipAction(clip);
    }
    clips.Idle?.play();animals.push({...a,rig,mixer,clips,action:'Idle',elapsed:0,angle:a.phase,region});
   }catch(e){errors.push(a.species+': '+e.message)}
  }));
  region.state='ready';
 }
 let checkClock=1;
 return {
  update({position,dt,time}){
   checkClock+=dt;
   if(checkClock>.4){
    checkClock=0;
    for(const r of regions){
     const distance=Math.hypot(position.x-r.x,position.z-r.z);
     r.group.visible=distance<r.radius+450&&position.y<1200;
     if(r.state==='idle'&&distance<r.radius+350&&position.y<500)void populate(r);
    }
   }
   for(const a of animals){
    const distance=Math.hypot(position.x-a.x,position.z-a.z);
    a.rig.visible=a.region.group.visible&&distance<140&&Math.abs(position.y-terrainHeight(a.x,a.z))<100;
    if(!a.rig.visible){a.elapsed=0;continue}
    a.elapsed+=dt;if(a.elapsed<(distance<45?1/30:.15))continue;
    const delta=a.elapsed;a.elapsed=0;
    const phase=(time+a.phase*7)%26,walking=phase<10;
    if(walking)a.angle+=delta*.22;
    const x=a.x+Math.cos(a.angle)*a.radius,z=a.z+Math.sin(a.angle)*a.radius;
    a.rig.position.set(x,terrainHeight(x,z),z);
    if(walking)a.rig.rotation.y=-a.angle;
    const next=walking?'Walk':phase<20?'Eating':'Idle';
    if(next!==a.action){a.clips[a.action]?.fadeOut(.3);a.clips[next]?.reset().fadeIn(.3).play();a.action=next}
    a.mixer.update(delta);
   }
  },
  status:()=>({regions:regions.map(r=>({id:r.id,state:r.state,objects:r.count,visible:r.group.visible})),animals:animals.map(a=>({species:a.species,region:a.region.id,visible:a.rig.visible,action:a.action,time:a.mixer.time})),errors})
 };
}
