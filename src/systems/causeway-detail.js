import * as T from 'three';
import {SOUTH_PADRE,spiRouteHeight,spiProximity} from '../core/south-padre.js';
// Instanced, deck-conforming edge reflectors (two draw calls).
// Never place props inside the centerline vehicle lane or over unsupported water.
export function causewayPostPositions(route=SOUTH_PADRE.route,spacing=37,offset=14.1){
 const positions=[];
 for(let k=0;k<route.length-1;k++){
  const a=route[k],b=route[k+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  if(len<1)continue;
  const vx=dx/len,vz=dz/len,perpX=-vz,perpZ=vx;
  for(let d=spacing*.5;d<len-spacing*.3;d+=spacing){
   const x=a.x+vx*d,z=a.z+vz*d;
   for(const side of [-1,1]){
    const px=x+perpX*offset*side,pz=z+perpZ*offset*side,deck=spiRouteHeight(px,pz);
    if(Number.isFinite(deck))positions.push({x:px,y:deck,z:pz,side});
   }
  }
 }
 return positions;
}
export function createCausewayDetail(scene){
 const posts=causewayPostPositions(),geometry=new T.BoxGeometry(.32,1.45,.32),reflect=new T.BoxGeometry(.38,.26,.4);
 const poles=new T.InstancedMesh(geometry,new T.MeshLambertMaterial({color:0xaab3bc}),posts.length);
 const heads=new T.InstancedMesh(reflect,new T.MeshBasicMaterial({color:0xffb95b}),posts.length);
 const dummy=new T.Object3D();
 posts.forEach((p,i)=>{
  dummy.position.set(p.x,p.y+.75,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);
  dummy.position.y=p.y+1.34;dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);
 });
 poles.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
 poles.computeBoundingSphere();heads.computeBoundingSphere();
 const root=new T.Group();root.add(poles,heads);root.visible=false;scene.add(root);
 return {update(position){root.visible=spiProximity(position).near},status:()=>({posts:posts.length,visible:root.visible}),root,posts};
}
