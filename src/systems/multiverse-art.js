import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original procedural scenery for the two remaining Nexus Isle districts.
export function addRealmScenery(root,{cx,cz,heightAt,trackPoints,city,smashables,velocityPortal,breakerPortal}){
 const art=new T.Group(),cache=new Map(),cube=new T.BoxGeometry(1,1,1);
 const material=c=>{if(!cache.has(c))cache.set(c,new T.MeshStandardMaterial({color:c,roughness:.8,metalness:.05}));return cache.get(c)};
 const mesh=(g,c,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);art.add(m);return m};
 const box=(c,x,y,z,w,h,d)=>mesh(cube,c,x,y,z,w,h,d);

 // Central fork with separate colored approaches to each district.
 for(const [portal,color] of [[velocityPortal,0x36cde8],[breakerPortal,0xe78f3b]]){
  const ax=cx,az=cz-5,bx=portal.p.x,bz=portal.p.z,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),steps=Math.ceil(len/5);
  for(let i=0;i<steps;i++){const t=(i+.5)/steps,x=ax+dx*t,z=az+dz*t,y=heightAt(x,z)+.05,p=box(i%2?0x26334e:0x303d58,x,y,z,4.5,.10,len/steps+.15);p.rotation.y=Math.atan2(dx,dz)}
  for(const side of[-1,1]){const x=portal.p.x+side*6,z=portal.p.z,y=heightAt(x,z);mesh(new T.CylinderGeometry(.24,.32,5,7),color,x,y+2.5,z);mesh(new T.OctahedronGeometry(.42),color,x,y+5.4,z)}
 }

 // Velocity District: continuous checker ribbon, luminous rails, arch gates and palms.
 for(let i=1;i<trackPoints.length;i++){
  const a=trackPoints[i-1],b=trackPoints[i],dx=b.x-a.x,dz=b.z-a.z,dy=(b.y??heightAt(b.x,b.z))-(a.y??heightAt(a.x,a.z)),len=Math.hypot(dx,dz),steps=Math.ceil(len/2.7),ux=dx/len,uz=dz/len,yaw=Math.atan2(dx,dz),pitch=-Math.atan2(dy,len);
  for(let j=0;j<steps;j++){
   const t=(j+.5)/steps,x=a.x+dx*t,z=a.z+dz*t,base=(a.y??heightAt(a.x,a.z))+dy*t,y=base+.07,tile=box((i+j)%2?0xb8753e:0xe6b66f,x,y,z,11,.14,len/steps+.22);tile.rotation.order='YXZ';tile.rotation.y=yaw;tile.rotation.x=pitch;
   for(const side of[-1,1]){const rail=box(side<0?0x3ed4e5:0x2c9fc5,x+uz*side*5.75,y+.18,z-ux*side*5.75,.26,.28,len/steps+.18);rail.rotation.order='YXZ';rail.rotation.y=yaw;rail.rotation.x=pitch}
  }
 }
 for(let i=0;i<9;i++){const p=trackPoints[Math.min(trackPoints.length-1,i*3)],x=p.x-8-(i%2)*4,z=p.z+10-(i%3)*5,y=heightAt(x,z);mesh(new T.CylinderGeometry(.30,.46,5.5,7),0x7b5534,x,y+2.75,z);for(let j=0;j<5;j++){const a=j/5*Math.PI*2,m=mesh(new T.ConeGeometry(1.15,4.6,4),0x2d9d61,x+Math.sin(a)*1.5,y+5.5,z+Math.cos(a)*1.5);m.rotation.z=.9;m.rotation.y=a}}
 for(const p of [trackPoints[5],trackPoints[12],trackPoints[19]]){const y=heightAt(p.x,p.z);for(const side of[-1,1])box(0x34486b,p.x+side*5.2,y+3,p.z,.55,6,.55);box(0x46dff0,p.x,y+6,p.z,10.8,.35,.55)}

 // Breaker City: streets, sidewalks, high-rises, lamps and barricades.
 for(let lane=-2;lane<=2;lane++){const x=city.x+lane*13,y=heightAt(x,city.z);box(0x2e313b,x,y+.05,city.z,7,.10,58);for(let z=-24;z<=24;z+=8)box(0xe8d36a,x,y+.12,city.z+z,.22,.05,3.2)}
 for(let row=-2;row<=2;row++){const z=city.z+row*14,y=heightAt(city.x,z);box(0x363943,city.x,y+.05,z,58,.10,6)}
 for(const side of[-1,1])for(let i=0;i<5;i++){const x=city.x+side*(34+i%2*7),z=city.z-28+i*14,y=heightAt(x,z),h=10+(i%3)*4;box(i%2?0x495168:0x5a435f,x,y+h/2,z,8,h,9);for(let f=0;f<3;f++)box(0xf4c978,x-side*4.05,y+2.2+f*2.6,z,.10,.8,5)}
 for(let i=0;i<10;i++){const side=i%2?-1:1,x=city.x+side*25,z=city.z-28+(i>>1)*14,y=heightAt(x,z);mesh(new T.CylinderGeometry(.11,.16,4.2,6),0x495064,x,y+2.1,z);mesh(new T.SphereGeometry(.22,7,5),0xffd176,x,y+4.35,z)}
 for(const p of [{x:city.x-22,z:city.z-30},{x:city.x+22,z:city.z+30}]){const y=heightAt(p.x,p.z);for(let i=-2;i<=2;i++){const b=box(i%2?0xf0aa37:0x3b4356,p.x+i*1.6,y+.55,p.z,1.4,1.1,.8);b.rotation.y=.15*i}}
 for(const t of smashables){const h=t.height||7;mesh(new T.CylinderGeometry(.08,.08,2.2,6),0x44495b,t.x,t.g.position.y+h+1.1,t.z);mesh(new T.SphereGeometry(.16,6,4),0xff786c,t.x,t.g.position.y+h+2.25,t.z)}

 // Batch static scenery by material to keep mobile draw calls bounded.
 art.updateMatrixWorld(true);const batches=new Map();
 art.traverse(m=>{
  if(!m.isMesh)return;
  let g=m.geometry.clone().applyMatrix4(m.matrixWorld);
  // Three.js cannot combine indexed and non-indexed primitives in one batch.
  if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat}
  const signature=Object.keys(g.attributes).sort().map(name=>{
   const a=g.getAttribute(name);return name+':'+a.itemSize+':'+Number(a.normalized)+':'+a.array.constructor.name;
  }).join('|');
  const key=m.material.uuid+'|'+signature,entry=batches.get(key)||{material:m.material,geometries:[]};
  entry.geometries.push(g);batches.set(key,entry);
 });
 for(const {material,geometries} of batches.values()){
  const merged=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);
  if(merged){
   const obj=new T.Mesh(merged,material);obj.receiveShadow=true;root.add(obj);
   if(geometries.length>1)for(const g of geometries)g.dispose();
  }else{
   // Unexpected geometry layouts must not silently erase district scenery.
   for(const g of geometries){const obj=new T.Mesh(g,material);obj.receiveShadow=true;root.add(obj)}
  }
 }
 const sources=new Set();art.traverse(m=>{if(m.isMesh)sources.add(m.geometry)});for(const g of sources)g.dispose();
}

export function realmSign(root,text,x,y,z,color='#ffffff',width=15){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');if(!ctx)return null;
 ctx.fillStyle='rgba(9,16,35,.88)';ctx.fillRect(0,0,768,128);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(4,4,760,120);ctx.fillStyle=color;ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64,735);
 const texture=new T.CanvasTexture(c),s=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));s.position.set(x,y,z);s.scale.set(width,width/6,1);root.add(s);return s;
}
