import * as T from 'three';
import {createRng} from '../core/math.js';
import {MOON_RENDER_BASE_Y} from '../core/celestial.js';

export function createMoonSurface(scene){
  const rng=createRng(19690720),group=new T.Group();group.visible=false;group.position.y=MOON_RENDER_BASE_Y;scene.add(group);
  const craters=[];for(let i=0;i<34;i++)craters.push({x:(rng()-.5)*1500,z:(rng()-.5)*1500,r:22+rng()*120,d:2+rng()*13});
  const heightAt=(x,z)=>{let h=-1.5+Math.sin(x*.013)*1.2+Math.cos(z*.017)*.9+Math.sin((x+z)*.007)*.8;for(const c of craters){const d=Math.hypot(x-c.x,z-c.z)/c.r;if(d<1)h-=c.d*(1-d*d);else if(d<1.24)h+=c.d*.22*(1-(d-1)/.24)}return h};
  const geo=new T.PlaneGeometry(1900,1900,120,120);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,col=new Float32Array(p.count*3),c=new T.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=heightAt(x,z);p.setY(i,h);const shade=.43+Math.max(-.12,Math.min(.16,h*.008+Math.sin(x*.02)*.025));c.setRGB(shade,shade*.98,shade*.93);col.set([c.r,c.g,c.b],i*3)}
  geo.setAttribute('color',new T.BufferAttribute(col,3));geo.computeVertexNormals();const terrain=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));terrain.receiveShadow=true;group.add(terrain);
  const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x77746e,roughness:1}),260),o=new T.Object3D();let n=0;
  for(let i=0;i<500&&n<260;i++){const x=(rng()-.5)*1700,z=(rng()-.5)*1700;if(Math.hypot(x,z)<75)continue;const s=.35+rng()*2.5;o.position.set(x,heightAt(x,z)+s*.45,z);o.scale.set(s,Math.max(.3,s*(.5+rng()*.5)),s);o.rotation.set(rng()*1.5,rng()*6.28,rng());o.updateMatrix();rocks.setMatrixAt(n++,o.matrix)}
  rocks.count=n;rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
  const pad=new T.Mesh(new T.CylinderGeometry(42,42,.7,32),new T.MeshStandardMaterial({color:0x45484b,roughness:.82,metalness:.18}));pad.position.set(0,heightAt(0,0)+.1,0);group.add(pad);
  const ring=new T.Mesh(new T.TorusGeometry(31,.45,8,48),new T.MeshBasicMaterial({color:0x62e7ff}));ring.rotation.x=Math.PI/2;ring.position.set(0,pad.position.y+.45,0);group.add(ring);
  const beaconMat=new T.MeshBasicMaterial({color:0x7ff7ff});for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const b=new T.Mesh(new T.SphereGeometry(.8,8,6),beaconMat);b.position.set(Math.cos(a)*36,pad.position.y+1.2,Math.sin(a)*36);group.add(b)}
  return {group,heightAt,padY:heightAt(0,0),setVisible:v=>group.visible=!!v};
}
