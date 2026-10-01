import * as T from 'three';
import {SOUTH_PADRE as R,spiLandHeight} from '../core/south-padre.js';
import {terrainHeight} from '../core/world.js';

export function createSouthPadreRegion(scene,obstacles){
 const group=new T.Group();group.name='South Padre Island + Port Isabel';scene.add(group);
 const mats={road:new T.MeshLambertMaterial({color:0x343b40}),sand:new T.MeshLambertMaterial({color:0xd6c493,flatShading:true}),town:new T.MeshLambertMaterial({color:0xe8b995,flatShading:true}),roof:new T.MeshLambertMaterial({color:0x934f42,flatShading:true}),white:new T.MeshLambertMaterial({color:0xf3eee0}),red:new T.MeshLambertMaterial({color:0xc83d32}),green:new T.MeshLambertMaterial({color:0x54a66a,flatShading:true}),trunk:new T.MeshLambertMaterial({color:0x77563a})};
 const box=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o};
 // Detailed continuous mainland/island ground patch, sampled from shared collision heights.
 const geo=new T.PlaneGeometry(1100,250,220,50);geo.rotateX(-Math.PI/2);const a=geo.attributes.position,col=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i)+1450,z=a.getZ(i),landH=spiLandHeight(x,z),h=landH??-8;a.setXYZ(i,x,h,z);const c=new T.Color(h<0?0xd6c493:h<3?0xd6c493:0x5da66a);col.push(c.r,c.g,c.b)}
 geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.computeVertexNormals();const land=new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,flatShading:true}));land.receiveShadow=true;group.add(land);
 // Causeway deck follows the analytic route profile; overlapping spans avoid gaps at ramps.
 const dummy=new T.Object3D(),points=R.route,span=points.at(-1).x-points[0].x,deckGeo=new T.BoxGeometry(span/120+1,.75,14),deckMesh=new T.InstancedMesh(deckGeo,mats.road,121),piers=new T.InstancedMesh(new T.BoxGeometry(2,1,2),new T.MeshLambertMaterial({color:0x737b7b}),32);let decks=0,pierCount=0;
 for(let n=0;n<=120;n++){const x=points[0].x+span*n/120,y=terrainHeight(x,0);dummy.position.set(x,y,0);dummy.updateMatrix();deckMesh.setMatrixAt(decks++,dummy.matrix);if(y>4&&n%4===0){dummy.position.set(x,y/2,0);dummy.scale.set(1,y,1);dummy.updateMatrix();piers.setMatrixAt(pierCount++,dummy.matrix);dummy.scale.set(1,1,1)}}
 deckMesh.count=decks;piers.count=pierCount;group.add(deckMesh,piers);
 // Port Isabel's compact waterfront town, repeated geometry batched by InstancedMesh.
 const houseGeo=new T.BoxGeometry(1,1,1),roofGeo=new T.ConeGeometry(1,1,4),houses=[];
 for(let row=0;row<5;row++)for(let col=0;col<7;col++){const x=R.portIsabel.center.x-44+col*14,z=-38+row*19;if(Math.abs(z)<10)continue;const w=7+(row+col)%3,h=5+(col%3)*1.3,d=8;houses.push({x,z,w,h,d});}
 const buildings=new T.InstancedMesh(houseGeo,mats.town,houses.length),roofMesh=new T.InstancedMesh(roofGeo,mats.roof,houses.length);
 houses.forEach((v,i)=>{dummy.position.set(v.x,2.2+v.h/2,v.z);dummy.scale.set(v.w,v.h,v.d);dummy.updateMatrix();buildings.setMatrixAt(i,dummy.matrix);dummy.position.set(v.x,2.2+v.h+.7,v.z);dummy.scale.set(v.w*.72,1.4,v.d*.72);dummy.rotation.set(0,Math.PI/4,0);dummy.updateMatrix();roofMesh.setMatrixAt(i,dummy.matrix);obstacles.push({x:v.x,z:v.z,r:Math.max(v.w,v.d)*.7})});
 buildings.castShadow=roofMesh.castShadow=true;group.add(buildings,roofMesh);
 // Iconic Port Isabel lighthouse: white/red tapered low-poly bands and lantern.
 const tower=new T.Group();tower.position.set(R.lighthouse.x,2.2,R.lighthouse.z);group.add(tower);
 for(let n=0;n<5;n++){const m=new T.Mesh(new T.CylinderGeometry(3.1-n*.25,3.35-n*.25,5.2,10),mats.white);m.position.y=2.6+n*5.1;m.castShadow=true;tower.add(m)}
 const lantern=new T.Mesh(new T.CylinderGeometry(1.8,2,2,8),new T.MeshLambertMaterial({color:0x39464b}));lantern.position.y=29;tower.add(lantern);const lamp=new T.Mesh(new T.SphereGeometry(1,8,6),new T.MeshBasicMaterial({color:0xffe79a}));lamp.position.y=29;tower.add(lamp);obstacles.push({x:R.lighthouse.x,z:R.lighthouse.z,r:4});
 // Dense south-city blocks taper into a sparse protected northern dune/wetland landscape.
 const city=[];for(let row=0;row<6;row++)for(let col=0;col<5;col++){const x=1660+col*17,z=-40+row*16;if(x>1815)continue;const h=6+(row+col)%5*2;city.push({x,z,h})}
 const cityMesh=new T.InstancedMesh(houseGeo,mats.town,city.length),cityRoofMesh=new T.InstancedMesh(houseGeo,mats.roof,city.length);city.forEach((v,i)=>{dummy.position.set(v.x,2.5+v.h/2,v.z);dummy.scale.set(10,v.h,9);dummy.updateMatrix();cityMesh.setMatrixAt(i,dummy.matrix);dummy.position.set(v.x,2.5+v.h+.5,v.z);dummy.scale.set(10.7,1,9.7);dummy.updateMatrix();cityRoofMesh.setMatrixAt(i,dummy.matrix)});group.add(cityMesh,cityRoofMesh);
 const palmGeo=new T.ConeGeometry(2.3,5,5),palmLeaves=new T.IcosahedronGeometry(3,0),trunks=new T.InstancedMesh(new T.CylinderGeometry(.35,.48,5,5),mats.trunk,42),leaves=new T.InstancedMesh(palmLeaves,mats.green,42);let count=0;
 for(let i=0;i<42;i++){const x=1515+(i%7)*44,z=-42+Math.floor(i/7)*17;if(x>1830&&i%3)continue;const y=terrainHeight(x,z);dummy.position.set(x,y+2.5,z);dummy.updateMatrix();trunks.setMatrixAt(count,dummy.matrix);dummy.position.set(x,y+6,z);dummy.scale.set(1.5,1,1.5);dummy.updateMatrix();leaves.setMatrixAt(count++,dummy.matrix)}
 trunks.count=leaves.count=count;group.add(trunks,leaves);palmGeo.dispose();
 let visible=true;return {group,update({position}){const near=Math.hypot(position.x-1450,position.z)<1000;if(near!==visible){visible=near;group.visible=near}},status(){return {visible:group.visible,buildings:houses.length,routeSegments:R.route.length-1,destination:R.destination.name}}};
}