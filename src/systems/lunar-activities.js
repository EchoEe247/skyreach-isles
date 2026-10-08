import * as T from 'three';
import {MOON_RENDER_BASE_Y} from '../core/celestial.js';
export const LUNAR_SITES=Object.freeze([
 {id:'outpost',name:'ECHO-1 Outpost',x:128,z:86,range:13},
 {id:'meteor',name:'Meteor Impact',x:-250,z:190,range:10},
 {id:'signal',name:'Buried Transmitter',x:315,z:-240,range:10},
 {id:'ridge',name:'Silent Ridge',x:-340,z:-285,range:13}
]);
export function createLunarActivities(scene,{heightAt,load=()=>[],save=()=>{}}){
 const group=new T.Group();group.position.y=MOON_RENDER_BASE_Y;group.visible=false;scene.add(group);
 const standard=(color,emissive=0)=>new T.MeshStandardMaterial({color,roughness:.75,metalness:.15,emissive,emissiveIntensity:emissive?.4:0});
 const grey=standard(0xadb8c4),dark=standard(0x3d4c62),blue=standard(0x65c2df,0x19495a),yellow=standard(0xf0c967);
 const add=(parent,geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m};
 const at=(x,z)=>heightAt(x,z);
 const dome=add(group,new T.SphereGeometry(9,16,10,0,Math.PI*2,0,Math.PI*.55),grey,128,at(128,86)+1,86);
 add(group,new T.CylinderGeometry(9,9,.8,20),dark,128,at(128,86)+.2,86);
 for(const side of [-1,1]){
  add(group,new T.BoxGeometry(10,.25,5),blue,128+side*15,at(128+side*15,86)+2,86);
  for(let i=0;i<2;i++)add(group,new T.CylinderGeometry(.12,.12,3,6),grey,128+side*15+(i?3:-3),at(128+side*15,86)+.6,86+(i?1.6:-1.6));
 }
 add(group,new T.CylinderGeometry(1.5,1.8,12,8),grey,147,at(147,99)+6,99);
 const beacon=add(group,new T.SphereGeometry(.9,8,6),blue,147,at(147,99)+12.7,99);
 // Fixed features are deliberately tied to the sampled terrain, rather than
 // floating above the continuously regenerated lunar mesh.
 const rocks=add(group,new T.IcosahedronGeometry(8,1),standard(0x554f4b),-250,at(-250,190)+2,190);
 rocks.scale.set(1.5,.55,1.25);
 add(group,new T.CylinderGeometry(1.1,1.9,4.5,8),dark,315,at(315,-240)+2.2,-240);
 const transmitter=add(group,new T.TorusGeometry(2,.28,6,18),blue,315,at(315,-240)+4.9,-240);transmitter.rotation.x=Math.PI/3;
 for(let i=0;i<7;i++){const x=-340+Math.sin(i*2.4)*10,z=-285+Math.cos(i*1.75)*8;
  add(group,new T.DodecahedronGeometry(1,0),grey,x,at(x,z)+1.5,z).scale.set(1.3,2.6,1.1)}
 const rover=new T.Group(),body=add(rover,new T.BoxGeometry(4.5,.85,7.2),yellow,0,1.35,0);
 const metal=standard(0x758498),glass=new T.MeshPhysicalMaterial({color:0x356b85,metalness:.3,roughness:.19,transparent:true,opacity:.91}),headlight=new T.MeshBasicMaterial({color:0xe3faff});
 add(rover,new T.BoxGeometry(3.25,1.05,3.4),grey,0,2.22,-.8);
 add(rover,new T.BoxGeometry(3.3,.08,3.45),blue,0,2.76,-.8);
 add(rover,new T.BoxGeometry(3.28,.6,.08),glass,0,2.25,1.02);
 for(const side of [-1,1]){
  add(rover,new T.BoxGeometry(.13,.58,2.8),glass,side*1.65,2.2,-.82);
  add(rover,new T.BoxGeometry(.15,.14,5.6),metal,side*2.17,1.83,.12);
  add(rover,new T.BoxGeometry(.88,.18,3.5),blue,side*3.14,2.4,-1.95);
  add(rover,new T.BoxGeometry(.34,.4,.12),headlight,side*1.52,1.48,3.66);
  add(rover,new T.BoxGeometry(.28,.2,.12),new T.MeshBasicMaterial({color:0xfb6450}),side*1.7,1.42,-3.66);
 }
 const wheels=[];
 for(const x of [-2.65,2.65])for(const z of [-2.48,0,2.48]){
  const support=add(rover,new T.BoxGeometry(.9,.14,.15),metal,x*.72,.97,z);
  const wheel=add(rover,new T.CylinderGeometry(.88,.88,.58,12),dark,x,.84,z);wheel.rotation.z=Math.PI/2;
  const hub=add(rover,new T.CylinderGeometry(.35,.35,.61,12),metal,x,.84,z);hub.rotation.z=Math.PI/2;
  wheels.push(wheel);
 }
 add(rover,new T.BoxGeometry(2.1,.45,1.5),dark,0,1.85,-3.0);
 const mast=add(rover,new T.CylinderGeometry(.09,.1,2.2,7),metal,1.3,3.86,-1.7);
 const dish=add(rover,new T.SphereGeometry(.45,10,8),headlight,1.3,5.0,-1.7);dish.scale.set(1,.45,.55);
 add(rover,new T.BoxGeometry(1.45,.35,.7),glass,0,2.95,2.25);
 for(let i=0;i<6;i++)add(rover,new T.BoxGeometry(.14,.06,1.6),yellow,-1.8+i*.72,1.81,-2.95);
 rover.position.set(49,MOON_RENDER_BASE_Y+at(49,4),4);rover.name='Lunar Rover';
 scene.add(rover);
 let visited=new Set(load().filter(x=>LUNAR_SITES.some(s=>s.id===x))),lastScan=null;
 const nearest=position=>{
  let best=null,d=Infinity;for(const s of LUNAR_SITES){
   const gap=Math.hypot(position.x-s.x,position.z-s.z);
   if(gap<Math.max(7,s.range)&&gap<d){best=s;d=gap}
  }
  return best;
 };
 return {group,rover,sites:LUNAR_SITES,
  update({visible=false,time=0,speed=0,onRover=false}={}){
   group.visible=visible;rover.visible=visible||onRover;
   beacon.material.emissiveIntensity=.25+Math.sin(time*2.7)*.15;
   if(onRover)for(const wheel of wheels)wheel.rotation.x-=speed*.02;
  },
  near:nearest,
  scan(position){const s=nearest(position);if(!s)return null;if(!visited.has(s.id)){visited.add(s.id);save([...visited]);lastScan=s.id}return {...s,complete:true}},
  stats:()=>({visited:visited.size,total:LUNAR_SITES.length,lastScan,ids:[...visited],wheels:wheels.length,rover:rover.position.toArray()})
 };
}
