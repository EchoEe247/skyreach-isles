import * as T from 'three';
import {createRng} from '../core/math.js';
import {MOON_RENDER_BASE_Y,MOON_RADIUS_M} from '../core/celestial.js';

export const LUNAR_GRAVITY_MPS2=1.62;
export const MOON_TILE_SIZE=2200;
export const MOON_TILE_HALF=MOON_TILE_SIZE/2;
const RECENTER_DISTANCE=520,CELL=320;

const fract=x=>x-Math.floor(x);
const hash=(x,z,s=0)=>fract(Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453123);
function craterContribution(x,z){
  const gx=Math.floor(x/CELL),gz=Math.floor(z/CELL);let h=0;
  for(let iz=-1;iz<=1;iz++)for(let ix=-1;ix<=1;ix++){
    const cx=gx+ix,cz=gz+iz,count=hash(cx,cz,1)>.42?1:0;
    if(!count)continue;
    const px=(cx+(.12+.76*hash(cx,cz,2)))*CELL,pz=(cz+(.12+.76*hash(cx,cz,3)))*CELL,r=28+hash(cx,cz,4)*125,d=2.5+hash(cx,cz,5)*12.5,q=Math.hypot(x-px,z-pz)/r;
    if(q<1)h-=d*(1-q*q);
    else if(q<1.24)h+=d*.22*(1-(q-1)/.24);
  }
  return h;
}
export function moonHeightAt(x,z){
  return -1.5+Math.sin(x*.013)*1.15+Math.cos(z*.017)*.88+Math.sin((x+z)*.007)*.76+Math.sin((x-z)*.0023)*1.2+craterContribution(x,z);
}
export function createMoonAlbedoCanvas(size=512){
  const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),img=ctx.createImageData(size,size),d=img.data;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const gx=(x/size-.5)*120000,gz=(y/size-.5)*60000,h=moonHeightAt(gx,gz),grain=(hash(x,y,9)-.5)*12,v=Math.max(76,Math.min(192,139+h*3.2+grain)),i=(y*size+x)*4;
    d[i]=v;d[i+1]=v*.985;d[i+2]=v*.94;d[i+3]=255;
  }
  ctx.putImageData(img,0,0);return c;
}

export function createMoonSurface(scene){
  const rng=createRng(19690720),group=new T.Group();group.visible=false;group.position.y=MOON_RENDER_BASE_Y;scene.add(group);
  const geo=new T.PlaneGeometry(MOON_TILE_SIZE,MOON_TILE_SIZE,104,104);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=new Float32Array(pos.count*3),color=new T.Color();
  const terrainMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});const terrain=new T.Mesh(geo,terrainMaterial);terrain.receiveShadow=true;group.add(terrain);
  const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x77746e,roughness:1}),240),o=new T.Object3D();rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
  const pad=new T.Mesh(new T.CylinderGeometry(42,42,.7,32),new T.MeshStandardMaterial({color:0x45484b,roughness:.82,metalness:.18}));group.add(pad);
  const ring=new T.Mesh(new T.TorusGeometry(31,.45,8,48),new T.MeshBasicMaterial({color:0x62e7ff}));ring.rotation.x=Math.PI/2;group.add(ring);
  const beaconMat=new T.MeshBasicMaterial({color:0x7ff7ff}),beacons=[];for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const b=new T.Mesh(new T.SphereGeometry(.8,8,6),beaconMat);group.add(b);beacons.push([b,a])}
  let centerX=0,centerZ=0;
  function rebuild(cx=centerX,cz=centerZ){
    centerX=cx;centerZ=cz;group.position.x=cx;group.position.z=cz;if(terrainMaterial.map){const uSpan=MOON_TILE_SIZE/(2*Math.PI*MOON_RADIUS_M),vSpan=MOON_TILE_SIZE/(Math.PI*MOON_RADIUS_M);terrainMaterial.map.repeat.set(uSpan,vSpan);terrainMaterial.map.offset.set(.5+cx/(2*Math.PI*MOON_RADIUS_M)-uSpan/2,.5-cz/(Math.PI*MOON_RADIUS_M)-vSpan/2);terrainMaterial.map.needsUpdate=true}if(terrainMaterial.bumpMap){const uSpan=MOON_TILE_SIZE/(2*Math.PI*MOON_RADIUS_M),vSpan=MOON_TILE_SIZE/(Math.PI*MOON_RADIUS_M);terrainMaterial.bumpMap.repeat.set(uSpan,vSpan);terrainMaterial.bumpMap.offset.set(.5+cx/(2*Math.PI*MOON_RADIUS_M)-uSpan/2,.5-cz/(Math.PI*MOON_RADIUS_M)-vSpan/2);terrainMaterial.bumpMap.needsUpdate=true}
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),lz=pos.getZ(i),wx=cx+lx,wz=cz+lz,h=moonHeightAt(wx,wz);pos.setY(i,h);
      const shade=.43+Math.max(-.13,Math.min(.17,h*.008+Math.sin(wx*.02)*.025));color.setRGB(shade,shade*.98,shade*.93);col.set([color.r,color.g,color.b],i*3);
    }
    pos.needsUpdate=true;geo.setAttribute('color',new T.BufferAttribute(col,3));geo.computeVertexNormals();
    let n=0;for(let i=0;i<520&&n<240;i++){const lx=(rng()-.5)*(MOON_TILE_SIZE-120),lz=(rng()-.5)*(MOON_TILE_SIZE-120),wx=cx+lx,wz=cz+lz;if(Math.hypot(wx,wz)<75)continue;const s=.35+rng()*2.5;o.position.set(lx,moonHeightAt(wx,wz)+s*.45,lz);o.scale.set(s,Math.max(.3,s*(.5+rng()*.5)),s);o.rotation.set(rng()*1.5,rng()*6.28,rng());o.updateMatrix();rocks.setMatrixAt(n++,o.matrix)}
    rocks.count=n;rocks.instanceMatrix.needsUpdate=true;
    const padLocalX=-cx,padLocalZ=-cz,padVisible=Math.hypot(cx,cz)<MOON_TILE_HALF-90,padY=moonHeightAt(0,0)+.1;pad.visible=ring.visible=padVisible;pad.position.set(padLocalX,padY,padLocalZ);ring.position.set(padLocalX,padY+.45,padLocalZ);
    beacons.forEach(([b,a])=>{b.visible=padVisible;b.position.set(padLocalX+Math.cos(a)*36,padY+1.2,padLocalZ+Math.sin(a)*36)});
  }
  rebuild(0,0);
  const ensureCentered=(x,z,force=false)=>{if(force||Math.hypot(x-centerX,z-centerZ)>RECENTER_DISTANCE)rebuild(Math.round(x/300)*300,Math.round(z/300)*300);return {x:centerX,z:centerZ}};
  const contains=(x,z,margin=0)=>Math.abs(x-centerX)<=MOON_TILE_HALF-margin&&Math.abs(z-centerZ)<=MOON_TILE_HALF-margin;
  const setSurfaceMaps=(albedo,dem)=>{if(albedo){terrainMaterial.map=albedo.clone();terrainMaterial.map.wrapS=terrainMaterial.map.wrapT=T.RepeatWrapping;terrainMaterial.map.colorSpace=T.SRGBColorSpace}if(dem){terrainMaterial.bumpMap=dem.clone();terrainMaterial.bumpMap.wrapS=terrainMaterial.bumpMap.wrapT=T.RepeatWrapping;terrainMaterial.bumpScale=3.2}terrainMaterial.needsUpdate=true;rebuild(centerX,centerZ)};
  return {group,heightAt:moonHeightAt,padY:moonHeightAt(0,0),walkRadius:MOON_TILE_HALF,contains,ensureCentered,setSurfaceMaps,center:()=>({x:centerX,z:centerZ}),setVisible:v=>group.visible=!!v};
}