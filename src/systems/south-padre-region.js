import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOUTH_PADRE as R,spiLandHeight,spiRouteHeight} from '../core/south-padre.js';

const material=(color)=>new T.MeshLambertMaterial({color,flatShading:true});

function addFallback(group){
 const fallback=new T.Group();fallback.name='SPI loading fallback';group.add(fallback);
 const roadMat=material(0x353b3e),sandMat=material(0xd7c692),townMat=material(0xd6aa86);
 // Port Isabel loading pad.
 const outline=new T.Shape();outline.moveTo(-1,-.72);outline.lineTo(.62,-.72);outline.lineTo(1,-.22);outline.lineTo(.74,.72);outline.lineTo(-.72,.86);outline.lineTo(-1,.28);outline.closePath();
 const port=new T.Mesh(new T.ShapeGeometry(outline),townMat);port.scale.set(R.portIsabel.halfX,R.portIsabel.halfZ,1);port.rotation.x=-Math.PI/2;
 port.position.set(R.portIsabel.center.x,R.portIsabel.elevation-.2,R.portIsabel.center.z);fallback.add(port);
 // Keep the streaming fallback close to the same smooth vertical profile as the
 // collision route so the car does not appear to float through a straight chord.
 for(let i=0;i<R.route.length-1;i++){
  const a=R.route[i],b=R.route[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(len/120));
  for(let s=0;s<steps;s++){
   const t0=s/steps,t1=(s+1)/steps,x0=a.x+dx*t0,z0=a.z+dz*t0,x1=a.x+dx*t1,z1=a.z+dz*t1;
   const y0=spiRouteHeight(x0,z0)??a.y,y1=spiRouteHeight(x1,z1)??b.y,sx=x1-x0,sz=z1-z0,sl=Math.hypot(sx,sz),dy=y1-y0;
   const deck=new T.Mesh(new T.BoxGeometry(sl+.8,.9,31),roadMat);
   deck.position.set((x0+x1)/2,(y0+y1)/2-.2,(z0+z1)/2);
   deck.rotation.y=-Math.atan2(sz,sx);
   deck.rotation.z=Math.atan2(dy,sl);
   fallback.add(deck);
  }
 }
 // Very cheap island ribbon so the route stays visually grounded while the GLB streams.
 const points=R.shoreline,geo=new T.BufferGeometry(),verts=[],idx=[];
 for(let i=0;i<points.length;i++){
  const [z,c,h]=points[i],y=Math.max(.1,spiLandHeight(c,z)??.8)-.15;
  verts.push(c-h,y,z,c+h,y,z);
  if(i){const k=i*2;idx.push(k-2,k-1,k,k-1,k+1,k)}
 }
 geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();
 const ribbon=new T.Mesh(geo,sandMat);fallback.add(ribbon);
 return fallback;
}

function addContext(group,obstacles=[]){
 // Lightweight game-context dressing, not survey-accurate Port Isabel geometry.
 const dummy=new T.Object3D(),sites=[[-610,-420],[-420,-520],[-170,-480],[120,-505],[390,-430],[610,-285],[-650,260],[-430,490],[-170,520],[130,505],[410,445],[650,250]];
 const buildings=new T.InstancedMesh(new T.BoxGeometry(24,9,18),material(0xc9b28e),sites.length);
 sites.forEach(([x,z],i)=>{const sx=1+(i%3)*.14;dummy.position.set(R.portIsabel.center.x+x,6.2,R.portIsabel.center.z+z);dummy.rotation.set(0,i*.23,0);dummy.scale.set(sx,1+(i%4)*.08,1);dummy.updateMatrix();buildings.setMatrixAt(i,dummy.matrix);obstacles.push({x:R.portIsabel.center.x+x,z:R.portIsabel.center.z+z,r:Math.hypot(12*sx,9)})});
 buildings.instanceMatrix.needsUpdate=true;group.add(buildings);
 const palmSites=[[-720,-180],[-620,-500],[-380,-650],[-90,-620],[250,-640],[580,-470],[730,-120],[-720,140],[-590,520],[-310,650],[20,620],[330,620],[610,460],[735,130],[-420,40],[430,-20]];
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.45,.65,8,6),material(0x7a5a3b),palmSites.length),crowns=new T.InstancedMesh(new T.IcosahedronGeometry(3.2,1),material(0x557b54),palmSites.length);
 palmSites.forEach(([x,z],i)=>{dummy.position.set(R.portIsabel.center.x+x,5.7,R.portIsabel.center.z+z);dummy.rotation.set(0,i*.8,0);dummy.scale.set(.8,1.2,.8);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=11.2;dummy.scale.set(1.5,.65,1.5);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix)});
 trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;group.add(trunks,crowns);
 return sites.length;
}

function regionDistance(position){
 const px=position.x,pz=position.z;
 let best=Math.hypot(px-R.portIsabel.center.x,pz-R.portIsabel.center.z);
 best=Math.min(best,Math.hypot(px-R.destination.x,pz-R.destination.z));
 for(const p of R.route)best=Math.min(best,Math.hypot(px-p.x,pz-p.z));
 for(const [z,c] of R.shoreline)best=Math.min(best,Math.hypot(px-c,pz-z));
 return best;
}

export function createSouthPadreRegion(scene,obstacles,{onToast=()=>{}}={}){
 const group=new T.Group();group.name='South Padre Island + Port Isabel';scene.add(group);
 const fallback=addFallback(group),modelHolder=new T.Group(),contextColliders=addContext(group,obstacles);modelHolder.name='Uploaded South Padre GLB';group.add(modelHolder);
 let state='deferred',requested=false,model=null,meshCount=0,triangleCount=0,vegetation=[],jetties=[];
 const loader=new GLTFLoader();

 function requestModel(){
  if(requested)return;requested=true;state='loading';
  loader.load(new URL(R.model.path,document.baseURI).href,gltf=>{
   model=gltf.scene;
   model.name='South Padre Island Texas — user supplied';
   model.scale.set(R.model.scale.x,R.model.scale.y,R.model.scale.z);
   model.position.set(R.model.position.x,R.model.position.y,R.model.position.z);
   const bridge=model.getObjectByName('Bridge_QueenIsabella');
   if(bridge)bridge.scale.y=R.model.bridgeYScale;
   const lighthouseParts=['Port_Isabel__concrete','Port_Isabel__lighthouse','Port_Isabel__glass','Port_Isabel__dark'];
   lighthouseParts.forEach(name=>{const part=model.getObjectByName(name);if(part)part.scale.y=R.model.lighthouseYScale});
   model.updateMatrixWorld(true);
   model.traverse(o=>{
    if(!o.isMesh)return;
    meshCount++;
    const pos=o.geometry?.getAttribute?.('position'),index=o.geometry?.index;
    triangleCount+=index?index.count/3:(pos?pos.count/3:0);
    o.castShadow=false;o.receiveShadow=false;
    const n=o.name||'';
    if(n==='Terrain__vc'){
     const mats=Array.isArray(o.material)?o.material:[o.material];
     for(const m of mats)if(m?.color){m.color.multiply(new T.Color(0xffefc7));if('roughness' in m)m.roughness=1}
    }
    if(n.startsWith('Water'))o.visible=false; // use Skyreach's animated ocean instead of a duplicate flat ocean.
    if(n.startsWith('Vegetation'))vegetation.push(o);
    if(n.startsWith('Jetties'))jetties.push(o);
    if(o.material){
     const mats=Array.isArray(o.material)?o.material:[o.material];
     for(const m of mats){if(m){m.side=T.FrontSide;if(m.emissiveIntensity>2)m.emissiveIntensity=2}}
    }
   });
   modelHolder.add(model);fallback.visible=false;state='ready';
   onToast('South Padre Island loaded · Port Isabel → causeway → island is ready to drive.',3500);
  },undefined,e=>{
   console.warn('South Padre GLB failed; using route fallback',e);state='fallback';fallback.visible=true;
   onToast('South Padre detailed model could not load. Drive route fallback remains available.',4200);
  });
 }

 let visible=true,lastDetail=null;
 return {
  group,
  update({position,quality='auto'}){
   const distance=regionDistance(position),near=distance<R.model.visibilityRadius;
   if(near!==visible){visible=near;group.visible=near}
   if(distance<R.model.loadRadius)requestModel();
   if(model&&state==='ready'){
    // The uploaded source is 724k triangles. On Auto/Low/Medium we retain the exact
    // terrain, Port Isabel, roads, bridge, buildings and landmarks while culling its
    // heaviest repeated vegetation and jetty decoration. High restores them.
    const full=quality==='high';
    if(full!==lastDetail){
     vegetation.forEach(o=>o.visible=full);
     jetties.forEach(o=>o.visible=full);
     lastDetail=full;
    }
   }
  },
  preload:requestModel,
  status(){return {
   state,visible:group.visible,source:R.model.path,sourceSha256:R.model.sourceSha256,
   meshCount,triangleCount,vegetationMeshes:vegetation.length,jettiesMeshes:jetties.length,contextColliders,
   fallbackVisible:fallback.visible,routeSegments:R.route.length-1,
   destination:R.destination.name,port:R.portDestination.name,
   bridgePeak:R.causeway.peakHeight
  }}
 };
}
