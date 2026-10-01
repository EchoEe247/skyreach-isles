import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original, low-poly homage scenery. All art is made here; no downloaded franchise assets.
export function addRealmScenery(root,{cx,cz,heightAt,platforms,rings,smashables}){
 const art=new T.Group(),cache=new Map();
 const material=c=>{if(!cache.has(c))cache.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));return cache.get(c)};
 function mesh(g,c,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(g,material(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);art.add(m);return m}
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,10,7);
 function box(c,x,y,z,w,h,d){return mesh(cube,c,x,y,z,w,h,d)}
 function pipe(x,z){let y=heightAt(x,z);mesh(new T.CylinderGeometry(1.5,1.5,4,12),0x15994b,x,y+2,z);mesh(new T.CylinderGeometry(1.85,1.85,.65,12),0x24cd67,x,y+4,z);mesh(new T.CircleGeometry(1.4,12),0x093c25,x,y+4.34,z).rotation.x=-Math.PI/2}
 // Grass-topped brick platforms, pipes, striped mushrooms and a castle finish.
 for(const p of platforms){
  box(0x71c444,p.x,p.top+.025,p.z,p.w,.08,p.d);
  for(let k=0;k<Math.floor(p.w/2);k++)box(k%2?0xc47746:0x945534,p.x-p.w/2+1+k*2,p.top-.6,p.z+p.d/2+.02,1.87,.86,.10);
 }
 for(let i=0;i<6;i++){
  const x=cx-111+i*18,z=cz+43+(i%2)*7;pipe(x,z);
  const y=heightAt(x-6,z+5);
  mesh(new T.CylinderGeometry(.3,.45,2,8),0xffebcb,x-6,y+1,z+5);
  mesh(sphere,i%2?0xffb82e:0xec444f,x-6,y+2.1,z+5,1.55,.65,1.55);
  mesh(sphere,0xfff6d9,x-6.5,y+2.6,z+5,.25,.1,.25);
 }
 const gx=cx-8,gz=cz+34,gy=heightAt(gx,gz);
 box(0xe7cfa4,gx,gy+3.5,gz,12,7,5);
 box(0x563b55,gx,gy+2.6,gz-2.55,2.8,5,.15);
 for(const d of[-7,7]){mesh(new T.CylinderGeometry(2.3,2.4,11,10),0xeedcb5,gx+d,gy+5.5,gz);mesh(new T.ConeGeometry(3,4,10),0xd94658,gx+d,gy+13,gz)}
 // Continuous bank-free running ribbon follows sampled terrain; alternating tiles read as a checker track.
 for(let i=1;i<rings.length;i++){
  const a=rings[i-1],b=rings[i],distance=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(distance/3);
  const dx=(b.x-a.x)/distance,dz=(b.z-a.z)/distance;
  for(let j=0;j<steps;j++){
   const t=(j+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=heightAt(x,z)+.08;
   const tile=box((i+j)%2?0xac743c:0xe4b575,x,y,z,10,.14,distance/steps+.2);tile.rotation.y=Math.atan2(dx,dz);
   for(const side of[-1,1]){const edge=box(0x61bf57,x+dz*side*5.2,y+.13,z-dx*side*5.2,.65,.22,distance/steps+.3);edge.rotation.y=tile.rotation.y}
  }
 }
 for(let i=0;i<7;i++){
  const r=rings[i*2],x=r.x*.0+cx+(r.x-cx)*1.18,z=cz+(r.z-cz)*1.18,y=heightAt(x,z);
  mesh(new T.CylinderGeometry(.4,.65,6,7),0x925b35,x,y+3,z);
  for(let j=0;j<5;j++){const a=j/5*Math.PI*2,m=mesh(new T.ConeGeometry(1.2,5,4),0x24995e,x+Math.sin(a)*1.7,y+6,z+Math.cos(a)*1.7);m.rotation.z=.9;m.rotation.y=a}
 }
 // Each smash target becomes a little city tower with windows and rooftop detail.
 for(let i=0;i<smashables.length;i++){
  const b=smashables[i],h=6+(i%3)*2;b.g.children.forEach(c=>c.visible=false);
  const wall=new T.Mesh(new T.BoxGeometry(6,h,6),material([0xaf6b50,0x756ca7,0x6593a5][i%3]));wall.position.y=h/2;b.g.add(wall);
  for(let floor=0;floor<3;floor++)for(const x of[-1.6,1.6]){
   const w=new T.Mesh(new T.BoxGeometry(1.1,1.05,.09),material(floor%2?0xffe5a2:0x91e3eb));w.position.set(x,1.3+floor*2,3.05);b.g.add(w);
  }
  const roof=new T.Mesh(new T.BoxGeometry(6.5,.4,6.5),material(0x35344a));roof.position.y=h;b.g.add(roof);
 }
 for(const side of[-1,1]){
  const x=cx+100+side*28,z=cz+25,y=heightAt(x,z);
  for(let i=0;i<4;i++){const h=13+(i%3)*4;box(i%2?0x493959:0x354466,x,y+h/2,z-24+i*15,8,h,10);for(let f=0;f<4;f++)box(0xffd391,x-side*4.05,y+2+f*3,z-24+i*15,.1,.8,5)}
 }
 // Batch static scenery by material to keep mobile draw calls bounded.
 art.updateMatrixWorld(true);const batches=new Map();
 art.traverse(m=>{if(!m.isMesh)return;const g=m.geometry.clone().applyMatrix4(m.matrixWorld);const list=batches.get(m.material)||[];list.push(g);batches.set(m.material,list)});
 for(const [m,geometries]of batches){const merged=mergeGeometries(geometries,false);if(merged){const obj=new T.Mesh(merged,m);obj.receiveShadow=true;root.add(obj)}for(const g of geometries)g.dispose()}
 const sources=new Set();art.traverse(m=>{if(m.isMesh)sources.add(m.geometry)});for(const g of sources)g.dispose();
}

export function realmSign(root,text,x,y,z,color='#ffffff',width=15){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');if(!ctx)return null;
 ctx.fillStyle='rgba(9,16,35,.88)';ctx.fillRect(0,0,768,128);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(4,4,760,120);ctx.fillStyle=color;ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64,735);
 const texture=new T.CanvasTexture(c),s=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));s.position.set(x,y,z);s.scale.set(width,width/6,1);root.add(s);return s;
}
