import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const DAY_FORGE_FLEET=Object.freeze([
  {id:'day-forge-blacktide',name:'Blacktide Pirate Galleon',type:'boat',category:'ships',filename:'blacktide_pirate_galleon.glb',targetLength:40,spawnRole:'west-harbor-water',boardRadius:27,markerHeight:18,cameraDistance:34,cameraHeight:8},
  {id:'day-forge-wraithmoor',name:'Wraithmoor Ghost Frigate',type:'boat',category:'ships',filename:'wraithmoor_ghost_frigate.glb',targetLength:38,spawnRole:'west-harbor-water',boardRadius:26,markerHeight:17,cameraDistance:32,cameraHeight:8},
  {id:'day-forge-sunmarque',name:'Sunmarque Tropical Mega Cruiser',type:'boat',category:'ships',filename:'sunmarque_tropical_mega_cruiser.glb',targetLength:75,spawnRole:'west-harbor-water',boardRadius:45,markerHeight:24,cameraDistance:58,cameraHeight:16},
  {id:'day-forge-tidereign',name:'Tidereign Grand Ocean Liner',type:'boat',category:'ships',filename:'tidereign_grand_ocean_liner.glb',targetLength:70,spawnRole:'west-harbor-water',boardRadius:42,markerHeight:23,cameraDistance:55,cameraHeight:14},
  {id:'day-forge-dreadbanner',name:'Dreadbanner Pirate Brigantine',type:'boat',category:'ships',filename:'dreadbanner_pirate_brigantine.glb',targetLength:32,spawnRole:'west-harbor-water',boardRadius:23,markerHeight:16,cameraDistance:28,cameraHeight:7},
  {id:'day-forge-nighthawk',name:'Nighthawk Stealth Interceptor',type:'plane',category:'aircraft',filename:'nighthawk_stealth_interceptor.glb',targetLength:17,spawnRole:'lax-apron',boardRadius:13,markerHeight:9,cameraDistance:24,cameraHeight:4},
  {id:'day-forge-vanguard',name:'Vanguard Tiltrotor Assault Transport',type:'plane',category:'aircraft',filename:'vanguard_tiltrotor_assault_transport.glb',targetLength:22,spawnRole:'lax-apron',boardRadius:15,markerHeight:10,cameraDistance:29,cameraHeight:5},
  {id:'day-forge-swingwraith',name:'Swingwraith Swing-Wing Strike Fighter',type:'plane',category:'aircraft',filename:'swingwraith_swing_wing_strike_fighter.glb',targetLength:18,spawnRole:'lax-apron',boardRadius:13,markerHeight:9,cameraDistance:25,cameraHeight:4},
  {id:'day-forge-skywatch',name:'Skywatch Airborne Early Warning',type:'plane',category:'aircraft',filename:'skywatch_airborne_early_warning.glb',targetLength:22,spawnRole:'lax-apron',boardRadius:15,markerHeight:10,cameraDistance:29,cameraHeight:5},
  {id:'day-forge-crushtitan',name:'Crushtitan Monster Truck',type:'car',category:'ground',filename:'crushtitan_monster_truck.glb',targetLength:7.5,spawnRole:'town-road',boardRadius:10,markerHeight:7,cameraDistance:13,cameraHeight:4}
]);

const KEEP_ATTRIBUTES=new Set(['position','normal','uv','color','tangent']);
function attributeSignature(geometry){
  return Object.keys(geometry.attributes).sort().map(name=>{
    const a=geometry.getAttribute(name);
    return `${name}:${a.itemSize}:${a.normalized?1:0}:${a.array.constructor.name}`;
  }).join(',');
}

function mergeStaticByMaterial(source){
  source.updateMatrixWorld(true);const batches=new Map();
  source.traverse(o=>{
    if(!o.isMesh)return;
    const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.length!==1)return;
    const material=materials[0];let geometry=o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);
    if(geometry.index)geometry=geometry.toNonIndexed();if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();
    for(const attr of Object.keys(geometry.attributes))if(!KEEP_ATTRIBUTES.has(attr))geometry.deleteAttribute(attr);
    const key=material.uuid+'|'+attributeSignature(geometry);
    if(!batches.has(key))batches.set(key,{material,geometries:[]});batches.get(key).geometries.push(geometry);
  });
  const mergedRoot=new T.Group();
  for(const {material,geometries} of batches.values()){
    const merged=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);
    if(merged){const mesh=new T.Mesh(merged,material.clone());mesh.castShadow=false;mesh.receiveShadow=false;mergedRoot.add(mesh);continue}
    // Never drop geometry if an unexpected accessor mismatch survives grouping.
    for(const geometry of geometries){const mesh=new T.Mesh(geometry,material.clone());mesh.castShadow=false;mesh.receiveShadow=false;mergedRoot.add(mesh)}
  }
  return mergedRoot.children.length?mergedRoot:source.clone(true);
}

export function prepareDayForgeVisual(source,entry){
  const visual=mergeStaticByMaterial(source);visual.updateMatrixWorld(true);
  let bounds=new T.Box3().setFromObject(visual),size=bounds.getSize(new T.Vector3());
  if(!Number.isFinite(size.x+size.y+size.z)||Math.max(size.x,size.y,size.z)<1e-5)throw new Error('model has empty bounds');
  // Muse exports are Y-up with forward -Z; holders in Skyreach use +Z.
  visual.rotation.y=Math.PI;visual.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(visual);size=bounds.getSize(new T.Vector3());
  const scale=entry.targetLength/Math.max(size.z,.001),center=bounds.getCenter(new T.Vector3());
  // Three.js composes T*R*S, so centering offsets must already include scale.
  visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  visual.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)if(m)m.fog=false}});
  const root=new T.Group();root.add(visual);
  if(entry.type==='boat')root.position.y=-Math.min(2.2,entry.targetLength*.026);
  return root;
}

export function createDayForgeFleet({register,loader=new GLTFLoader(),harbor,airport,terrainHeight,fallbackFactory}){
  const fleet=[];
  const shipAngleOffsets=[-.48,-.24,0,.24,.48],shipRadialOffsets=[76,118,180,138,88];
  const placeShip=(index)=>{
    const base=Math.atan2(harbor.z,harbor.x),angle=base+shipAngleOffsets[index];
    let radius=Math.hypot(harbor.x,harbor.z)+shipRadialOffsets[index];
    while(terrainHeight(Math.cos(angle)*radius,Math.sin(angle)*radius)>-2)radius+=8;
    return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,heading:Math.PI/2-angle};
  };
  const apron=[[-44,-25],[-18,24],[14,-24],[43,24]];
  let planeIndex=0,shipIndex=0;
  for(const entry of DAY_FORGE_FLEET){
    const holder=new T.Group(),isShip=entry.type==='boat';
    const spawn=isShip?placeShip(shipIndex++):entry.type==='plane'?(()=>{const [x,z]=apron[planeIndex++];return {x:airport.x+x*airport.scale,y:airport.elevation+1.2,z:airport.z+z*airport.scale,heading:Math.PI/2}})():{x:0,y:terrainHeight(0,46),z:46,heading:Math.PI};
    const vehicle=register(holder,{...entry,dayForge:true,ch:entry.cameraHeight,dist:entry.cameraDistance,max:entry.type==='boat'?30:entry.type==='plane'?90:40,...(entry.type==='plane'?{pt:0,rl:0}:{})});
    holder.position.set(spawn.x,spawn.y??(isShip?0:terrainHeight(spawn.x,spawn.z)),spawn.z);vehicle.h=spawn.heading;holder.rotation.y=spawn.heading;
    const fallback=fallbackFactory?.(entry)||(()=>{const g=new T.Group(),mat=new T.MeshStandardMaterial({color:entry.type==='boat'?0x28768b:entry.type==='plane'?0xd1d8dc:0xd6472f,roughness:.72});const hull=new T.Mesh(new T.BoxGeometry(entry.targetLength*.22,entry.type==='boat'?2:1.5,entry.targetLength),mat);hull.position.y=entry.type==='boat'?1:1.2;g.add(hull);return g})();
    holder.add(fallback);holder.userData.visual=fallback;holder.userData.modelState='loading';fleet.push(vehicle);
    loader.load(new URL(`assets/day-forge/${entry.filename}`,document.baseURI).href,gltf=>{
      try{const visual=prepareDayForgeVisual(gltf.scene,entry);if(holder.userData.visual)holder.remove(holder.userData.visual);holder.add(visual);holder.userData.visual=visual;holder.userData.model=entry.filename;holder.userData.modelState='ready'}
      catch(error){console.warn(`${entry.name} model processing failed; using fallback`,error);holder.userData.modelState='fallback'}
    },undefined,error=>{console.warn(`${entry.name} model failed; using fallback`,error);holder.userData.modelState='fallback'});
  }
  return fleet;
}
