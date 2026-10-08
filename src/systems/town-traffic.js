import * as T from 'three';
import {moveDiscSwept,overlapsDisc} from '../core/collision.js';
import {terrainHeight} from '../core/world.js';
export const TRAFFIC_LOOP=Object.freeze([
 {x:-10,z:-55},{x:-10,z:-19},{x:-17,z:-10},{x:-55,z:-10},
 {x:-55,z:10},{x:-17,z:10},{x:-10,z:19},{x:-10,z:55},
 {x:10,z:55},{x:10,z:19},{x:17,z:10},{x:55,z:10},
 {x:55,z:-10},{x:17,z:-10},{x:10,z:-19},{x:10,z:-55}
]);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function routeStep(actor,dt,route,canTravel,player=null){
 if(!route?.length)return false;
 const target=route[actor.next%route.length],dx=target.x-actor.x,dz=target.z-actor.z,m=Math.hypot(dx,dz);
 if(m<2){actor.next=(actor.next+1)%route.length;return true}
 const playerDist=player?distance(actor,player):Infinity;
 const stop=playerDist<(actor.radius||1.6)+3;
 const v=stop?0:Math.max(0,actor.speed||7);
 const step=Math.min(m,Math.max(0,dt)*v);
 const p={x:actor.x,z:actor.z};
 const hit=moveDiscSwept(p,dx/m*step,dz/m*step,{radius:actor.radius||1.6,canOccupy:canTravel,maxStep:.75});
 actor.x=p.x;actor.z=p.z;
 actor.heading=Math.atan2(dx,dz);
 actor.stopped=stop||hit.blocked;
 if(hit.blocked){actor.wait=(actor.wait||0)+dt;if(actor.wait>3){actor.wait=0;actor.next=(actor.next+1)%route.length}}
 else actor.wait=0;
 return hit.moved;
}
export function createTownTraffic(scene,colliders,terrainAt=terrainHeight){
 const colors=[0xf09b4b,0x6dbbcd,0xcacaca,0x7e8ac5],vehicles=[];
 const body=new T.BoxGeometry(1.9,.72,4),windows=new T.BoxGeometry(1.6,.7,2);
 for(let i=0;i<4;i++){
  const group=new T.Group(),paint=new T.MeshLambertMaterial({color:colors[i]});
  const chassis=new T.Mesh(body,paint);chassis.position.y=.85;group.add(chassis);
  const roof=new T.Mesh(windows,new T.MeshLambertMaterial({color:0x273b4b}));roof.position.set(0,1.45,-.25);group.add(roof);
  const lights=new T.Mesh(new T.BoxGeometry(1.65,.17,.08),new T.MeshBasicMaterial({color:0xfff4a3}));lights.position.set(0,.94,2.04);group.add(lights);
  const state={x:TRAFFIC_LOOP[(i*4)%TRAFFIC_LOOP.length].x,z:TRAFFIC_LOOP[(i*4)%TRAFFIC_LOOP.length].z,next:(i*4+1)%TRAFFIC_LOOP.length,speed:6+i*1.15,radius:1.25,heading:0,wait:0,stopped:false};
  scene.add(group);vehicles.push({group,state});
 }
 function update({dt=0,position={x:0,z:0},enabled=true,daylight=1}={}){
  for(const {group,state} of vehicles){
   const visible=enabled&&distance(state,position)<175;group.visible=visible;
   if(!visible)continue;
   const safe=(x,z)=>terrainAt(x,z)>-.3&&!overlapsDisc(x,z,state.radius,colliders);
   routeStep(state,dt,TRAFFIC_LOOP,safe,position);
   group.position.set(state.x,terrainAt(state.x,state.z),state.z);group.rotation.y=state.heading;
   const lamps=group.children[2];lamps.material.color.setHex(daylight<.45?0xfff0a2:0x8c8b71);
  }
 }
 return {update,vehicles,stats:()=>({cars:vehicles.length,visible:vehicles.filter(v=>v.group.visible).length,stopped:vehicles.filter(v=>v.state.stopped).length})};
}
