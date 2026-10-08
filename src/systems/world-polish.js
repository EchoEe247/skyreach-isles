import * as T from 'three';
import {terrainHeight} from '../core/world.js';
import {overlapsDisc} from '../core/collision.js';
import {createRng} from '../core/math.js';
import {ISLANDS,islandSurfaceHeight} from '../core/archipelago.js';
// Scene props use instancing, exact terrain sampling and a collision-clearance
// envelope: no additional per-frame mesh allocations or collider pollution.
export function groundedDetailPositions({heightAt=terrainHeight,colliders=[],seed=2741,count=170}={}){
 const rng=createRng(seed),props=[];
 for(let i=0;i<count*10&&props.length<count;i++){
  const angle=rng()*Math.PI*2,r=66+rng()*240,x=Math.cos(angle)*r,z=Math.sin(angle)*r,y=heightAt(x,z);
  if(!Number.isFinite(y)||y<1||y>26||overlapsDisc(x,z,2.5,colliders))continue;
  props.push({x,z,y,scale:.4+rng()*.9,rotation:rng()*6.28});
 }
 return props;
}
export function createWorldPolish(scene,obstacles,{heightAt=terrainHeight}={}){
 const stones=groundedDetailPositions({heightAt,colliders:obstacles,count:150});
 const mesh=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshLambertMaterial({color:0x8a8c79}),stones.length);
 const obj=new T.Object3D();
 stones.forEach((p,i)=>{obj.position.set(p.x,p.y+p.scale*.19,p.z);obj.rotation.set(.07,p.rotation,.11);obj.scale.set(p.scale,p.scale*.32,p.scale*.66);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix)});
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);
 // A single color-per-instance vegetation batch gives offshore islands distinct
 // foliage palettes without adding an individual draw call for each plant.
 const biomeRng=createRng(4419),tufts=[];
 const palettes={tideglass:0x5bbf79,ember:0x8f9a54,veil:0x498973,'multiverse-nexus':0x457887};
 for(const island of ISLANDS){
  for(let i=0;i<270;i++){
   const a=biomeRng()*Math.PI*2,r=Math.sqrt(biomeRng())*island.radius*.95,x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r;
   const y=islandSurfaceHeight(island,x,z);
   if(!Number.isFinite(y)||y<1||overlapsDisc(x,z,2,obstacles))continue;
   tufts.push({x,y,z,size:.55+biomeRng()*.85,angle:biomeRng()*6.28,color:palettes[island.id]});
  }
 }
 const grasses=new T.InstancedMesh(new T.ConeGeometry(.42,1.6,3),new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}),tufts.length);
 const tint=new T.Color();
 tufts.forEach((p,i)=>{obj.position.set(p.x,p.y+p.size*.55,p.z);obj.rotation.set(0,p.angle,0);obj.scale.set(p.size,p.size,p.size);obj.updateMatrix();grasses.setMatrixAt(i,obj.matrix);tint.setHex(p.color).offsetHSL(0,0,(biomeRng()-.5)*.12);grasses.setColorAt(i,tint)});
 grasses.instanceMatrix.needsUpdate=true;grasses.instanceColor.needsUpdate=true;grasses.computeBoundingSphere();grasses.castShadow=false;scene.add(grasses);
 const rng=createRng(950),shore=[],surfMat=new T.MeshBasicMaterial({color:0xb6e4df,transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide});
 // Shore streaks are placed only where terrain actually meets ocean.
 for(let i=0;i<800&&shore.length<70;i++){
  const a=rng()*Math.PI*2,r=90+rng()*320,x=Math.cos(a)*r,z=Math.sin(a)*r,y=heightAt(x,z);
  if(Math.abs(y)>.35||overlapsDisc(x,z,2,obstacles))continue;
  shore.push({x,z,a});
 }
 const streaks=new T.InstancedMesh(new T.PlaneGeometry(2.8,.24),surfMat,shore.length);
 shore.forEach((p,i)=>{obj.position.set(p.x,.09,p.z);obj.rotation.set(-Math.PI/2,0,p.a);obj.scale.set(.7+rng()*1.9,1,1);obj.updateMatrix();streaks.setMatrixAt(i,obj.matrix)});
 streaks.instanceMatrix.needsUpdate=true;streaks.computeBoundingSphere();scene.add(streaks);
 const glow=new T.SpriteMaterial({color:0xffc97f,transparent:true,opacity:.1,depthWrite:false,depthTest:true});
 const halo=new T.Sprite(glow);halo.scale.set(7,7,1);halo.position.set(0,11,0);scene.add(halo);
 function update({position,daylight=1,rain=0,time=0,active=true}={}){
  const near=active&&Math.hypot(position.x,position.z)<700&&position.y<500;
  mesh.visible=near;streaks.visible=near;halo.visible=near&&daylight<.6;grasses.visible=active&&position.y<800&&ISLANDS.some(i=>Math.hypot(position.x-i.x,position.z-i.z)<i.radius+360);
  surfMat.opacity=.13+Math.max(0,rain)*.14;
  glow.opacity=near?Math.max(0,(.6-daylight)*.55):0;
  halo.position.y=11+Math.sin(time*1.7)*.15;
 }
 return {update,stats:()=>({grounded:stones.length,foam:shore.length,biomePlants:tufts.length,grassVisible:grasses.visible,visible:mesh.visible})};
}
