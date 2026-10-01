import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOUTH_PADRE as R,spiLandHeight,spiRouteHeight} from '../core/south-padre.js';

const material=(color)=>new T.MeshLambertMaterial({color,flatShading:true});

function addFallback(group){
 const fallback=new T.Group();fallback.name='SPI loading fallback';group.add(fallback);
 const roadMat=material(0x353b3e),sandMat=material(0xd7c692),townMat=material(0xd6aa86);
 // Port Isabel loading pad.
 const port=new T.Mesh(new T.BoxGeometry(R.portIsabel.halfX*2,.45,R.portIsabel.halfZ*2),townMat);
 port.position.set(R.portIsabel.center.x,R.portIsabel.elevation-.25,R.portIsabel.center.z);fallback.add(port);
 // Lightweight causeway deck exactly follows the shared collision centerline.
 for(let i=0;i<R.route.length-1;i++){
  const a=R.route[i],b=R.route[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),dy=b.y-a.y;
  const deck=new T.Mesh(new T.BoxGeometry(len+.8,.7,13),roadMat);
  deck.position.set((a.x+b.x)/2,(a.y+b.y)/2-.2,(a.z+b.z)/2);
  deck.rotation.y=-Math.atan2(dz,dx);
  deck.rotation.z=Math.atan2(dy,len);
  fallback.add(deck);
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
 const fallback=addFallback(group),modelHolder=new T.Group();modelHolder.name='Uploaded South Padre GLB';group.add(modelHolder);
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
   model.updateMatrixWorld(true);
   model.traverse(o=>{
    if(!o.isMesh)return;
    meshCount++;
    const pos=o.geometry?.getAttribute?.('position'),index=o.geometry?.index;
    triangleCount+=index?index.count/3:(pos?pos.count/3:0);
    o.castShadow=false;o.receiveShadow=false;
    const n=o.name||'';
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
   meshCount,triangleCount,vegetationMeshes:vegetation.length,jettiesMeshes:jetties.length,
   fallbackVisible:fallback.visible,routeSegments:R.route.length-1,
   destination:R.destination.name,port:R.portDestination.name,
   bridgePeak:R.causeway.peakHeight
  }}
 };
}
