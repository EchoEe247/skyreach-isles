import * as T from 'three';
import {moveDiscSwept,overlapsDisc} from '../core/collision.js';
import {terrainHeight} from '../core/world.js';
import {buildTrafficLoop,segmentPassable} from '../core/traffic-navigation.js';
import {angleDelta} from '../core/math.js';
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
 if(m<1.4){actor.next=(actor.next+1)%route.length;actor.stopped=false;return true}
 const playerDist=player?distance(actor,player):Infinity;
 const stop=playerDist<(actor.radius||1.6)+3+Math.min(4,Math.abs(actor.currentSpeed||0)*.3);
 const v=stop?0:Math.max(0,actor.speed||7);
 const response=Math.min(1,Math.max(0,dt)*(stop?3.8:1.4));
 actor.currentSpeed=(actor.currentSpeed||0)+(v-(actor.currentSpeed||0))*response;
 const step=Math.min(m,Math.max(0,dt)*actor.currentSpeed);
 const oldX=actor.x,oldZ=actor.z,p={x:actor.x,z:actor.z};
 const hit=moveDiscSwept(p,dx/m*step,dz/m*step,{radius:actor.radius||1.6,canOccupy:(x,z)=>canTravel(x,z)&&(!player||Math.hypot(x-player.x,z-player.z)>actor.radius+1.8),maxStep:.75});
 actor.x=p.x;actor.z=p.z;actor.distanceTravelled=(actor.distanceTravelled||0)+Math.hypot(p.x-oldX,p.z-oldZ);
 actor.heading=Math.atan2(dx,dz);
 actor.stopped=stop||hit.blocked;
 if(hit.blocked){actor.wait=(actor.wait||0)+dt}
 else actor.wait=0;
 return hit.moved;
}
export function createTownTraffic(scene,colliders,terrainAt=terrainHeight){
 const colors=[0xf09b4b,0x6dbbcd,0xcacaca,0x7e8ac5],vehicles=[];
 const clearance=(x,z)=>terrainAt(x,z)>-.3&&!overlapsDisc(x,z,1.5,colliders);
 const initial=buildTrafficLoop(TRAFFIC_LOOP,clearance,{extent:88,step:2.5});
 const safeRing=radius=>Array.from({length:36},(_,i)=>({x:Math.sin(i*Math.PI/18)*radius,z:Math.cos(i*Math.PI/18)*radius}));
 let route=initial.valid?initial.points:[];
 if(route.length<8){for(const radius of [65,70,76,82]){const candidate=safeRing(radius);if(candidate.every((p,i)=>segmentPassable(p,candidate[(i+1)%candidate.length],clearance,.7))){route=candidate;break}}}
 if(route.length<8)route=initial.points.length?initial.points:TRAFFIC_LOOP;
 const routeValid=route.length>=8&&route.every((p,i)=>segmentPassable(p,route[(i+1)%route.length],clearance,.7));

 const body=new T.BoxGeometry(1.9,.72,4),windows=new T.BoxGeometry(1.6,.7,2);
 for(let i=0;i<4;i++){
  const group=new T.Group(),paint=new T.MeshLambertMaterial({color:colors[i]});
  const chassis=new T.Mesh(body,paint);chassis.position.y=.85;group.add(chassis);
  const roof=new T.Mesh(windows,new T.MeshLambertMaterial({color:0x273b4b}));roof.position.set(0,1.45,-.25);group.add(roof);
  const lights=new T.Mesh(new T.BoxGeometry(1.65,.17,.08),new T.MeshBasicMaterial({color:0xfff4a3}));lights.position.set(0,.94,2.04);group.add(lights);
  const begin=Math.floor(route.length*i/4),start=route[begin];const state={x:start.x,z:start.z,next:(begin+1)%route.length,speed:6+i*1.15,radius:1.25,heading:0,wait:0,stopped:false};
  scene.add(group);vehicles.push({group,state});
 }
 function update({dt=0,position={x:0,z:0},enabled=true,daylight=1}={}){
  for(const {group,state} of vehicles){
   const visible=enabled&&distance(state,position)<175;group.visible=visible;
   if(!visible)continue;
   const safe=(x,z)=>terrainAt(x,z)>-.3&&!overlapsDisc(x,z,state.radius,colliders)&&!vehicles.some(v=>v.state!==state&&Math.hypot(x-v.state.x,z-v.state.z)<2.7);
   routeStep(state,dt,route,safe,position);
   group.position.set(state.x,terrainAt(state.x,state.z),state.z);group.rotation.y+=angleDelta(state.heading-group.rotation.y)*(1-Math.exp(-Math.max(0,dt)*5));
   const lamps=group.children[2];lamps.material.color.setHex(daylight<.45?0xfff0a2:0x8c8b71);
  }
 }
 return {update,vehicles,stats:()=>({routeValid,routePoints:route.length,unreachable:initial.unreachable,cars:vehicles.length,visible:vehicles.filter(v=>v.group.visible).length,stopped:vehicles.filter(v=>v.state.stopped).length,totalDistance:vehicles.reduce((sum,v)=>sum+(v.state.distanceTravelled||0),0),actors:vehicles.map(v=>({x:v.state.x,z:v.state.z,next:v.state.next,stopped:v.state.stopped,distance:v.state.distanceTravelled||0}))})};
}
