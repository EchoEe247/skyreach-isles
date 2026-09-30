import * as T from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import "./style.css";
import "./atlas.css";
import {ISLANDS} from "./core/archipelago.js";
import {advanceSunAngle,lightingAt} from "./core/daylight.js";
import {createIslandScenery} from "./systems/island-scenery.js";
import {createAtlas} from "./systems/atlas.js";
import {createRng,clamp as cl,lerp as lp,angleDelta as ad} from "./core/math.js";
import {loadProgress,saveProgress,loadSettings,saveSettings} from "./core/storage.js";
import {applyRendererQuality,nextQuality,qualityLabel} from "./core/quality.js";
import {distance2D,nearestPending,relativeBearing,haptic} from "./systems/exploration.js";
import {terrainHeight,boatCanTravel} from "./core/world.js";
import {createWorldAudio} from "./systems/audio.js";
const $=id=>document.getElementById(id),v3=(x,y,z)=>new T.Vector3(x,y,z);
const rnd=createRng(7);
const hf=terrainHeight;
const settings=loadSettings();let quality=settings.quality;const worldAudio=createWorldAudio();const R=new T.WebGLRenderer({antialias:true});applyRendererQuality(R,quality);R.shadowMap.type=T.PCFSoftShadowMap;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.15;document.body.prepend(R.domElement);
const S=new T.Scene(),C=new T.PerspectiveCamera(65,innerWidth/innerHeight,.5,2100);S.fog=new T.Fog(0xbfe3f0,150,1400);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix()});
const M=(c,e,i)=>new T.MeshLambertMaterial({color:c,flatShading:true,emissive:e||0,emissiveIntensity:i||.5});
const box=(p,w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x||0,y||0,z||0);o.castShadow=true;p.add(o);return o};
const cyl=(p,r1,r2,h,m,x,y,z,seg)=>{const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg||8),m);o.position.set(x||0,y||0,z||0);o.castShadow=true;p.add(o);return o};
// lights & sky
const hemi=new T.HemisphereLight(0xbfd8ff,0x4a5a3a,.6),sun=new T.DirectionalLight(0xffe0b0,1);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.bias=-.0006;Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,far:300});const ambient=new T.AmbientLight(0xb5c7e2,.25),moonlight=new T.DirectionalLight(0xb5d4ff,.5);S.add(hemi,sun,sun.target,ambient,moonlight,moonlight.target);
const skyU={top:{value:new T.Color()},bot:{value:new T.Color()}};
const dome=new T.Mesh(new T.SphereGeometry(900,24,12),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,vertexShader:'varying float y;void main(){y=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top,bot;varying float y;void main(){gl_FragColor=vec4(mix(bot,top,pow(max(y,0.),.55)),1.);}'}));S.add(dome);
const sunM=new T.Mesh(new T.SphereGeometry(30,12,8),new T.MeshBasicMaterial({color:0xffe2a0,fog:false})),moonM=new T.Mesh(new T.SphereGeometry(20,12,8),new T.MeshBasicMaterial({color:0xdfe8ff,fog:false}));S.add(sunM,moonM);const gc=document.createElement('canvas');gc.width=gc.height=128;{const x=gc.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,230,170,1)');g.addColorStop(.25,'rgba(255,190,110,.35)');g.addColorStop(1,'rgba(255,160,80,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
const glow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(gc),blending:T.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));glow.scale.set(700,700,1);S.add(glow);
const sp=new Float32Array(1200);for(let i=0;i<400;i++){const a=rnd()*6.28,e=Math.acos(rnd());sp.set([Math.sin(e)*Math.cos(a)*850,Math.cos(e)*850,Math.sin(e)*Math.sin(a)*850],i*3)}
const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));const stars=new T.Points(sg,new T.PointsMaterial({size:2.5,sizeAttenuation:false,transparent:true,fog:false,depthWrite:false}));S.add(stars);
const cD=new T.Color(0x2a7fd6),cDh=new T.Color(0xbfe3f0),cN=new T.Color(0x172b4b),cNh=new T.Color(0x476381),cO=new T.Color(0xff8a4c),tmp=new T.Color();
// terrain
const tg=new T.PlaneGeometry(900,900,180,180);tg.rotateX(-Math.PI/2);const pa=tg.attributes.position,col=new Float32Array(pa.count*3),cc=new T.Color();
for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i),h=hf(x,z),d=Math.hypot(x,z),n=Math.sin(x*.21)*Math.cos(z*.17),sl=Math.abs(hf(x+4,z)-h)+Math.abs(hf(x,z+4)-h);pa.setY(i,h);
 if(h<-.3)cc.setHex(0xb5a577);else if(h<.9)cc.setHex(0xe6d6a0);else if(d<58)cc.setHex(0xa7b07c);else if(h<17)cc.setHex(0x5f9b4a).lerp(tmp.setHex(0x3f7a3a),h/17);else if(h<26)cc.setHex(0x8b8478);else cc.setHex(0xf4f7fa);
 if(h>.9&&h<26&&d>58&&sl>3.4)cc.setHex(0x86806f);cc.offsetHSL(0,0,n*.03+Math.sin(x*.07)*Math.cos(z*.06)*.04);col.set([cc.r,cc.g,cc.b],i*3)}
tg.setAttribute('color',new T.BufferAttribute(col,3));tg.computeVertexNormals();const nc=document.createElement('canvas');nc.width=nc.height=64;const nx=nc.getContext('2d');nx.fillStyle='#e6e6e6';nx.fillRect(0,0,64,64);for(let i=0;i<500;i++){const v=170+rnd()*85|0;nx.fillStyle='rgb('+v+','+v+','+v+')';nx.fillRect(rnd()*64,rnd()*64,3,3)}const nt=new T.CanvasTexture(nc);nt.wrapS=nt.wrapT=T.RepeatWrapping;nt.repeat.set(120,120);
const ter=new T.Mesh(tg,new T.MeshLambertMaterial({vertexColors:true,map:nt}));ter.receiveShadow=true;S.add(ter);
const wc=document.createElement('canvas');wc.width=wc.height=128;const wx=wc.getContext('2d');wx.fillStyle='#808080';wx.fillRect(0,0,128,128);for(let i=0;i<300;i++){wx.fillStyle=rnd()<.5?'rgba(255,255,255,.22)':'rgba(0,0,0,.22)';wx.beginPath();wx.arc(rnd()*128,rnd()*128,3+rnd()*9,0,6.3);wx.fill()}
const wt=new T.CanvasTexture(wc),RP=420;wt.wrapS=wt.wrapT=T.RepeatWrapping;wt.repeat.set(RP,RP);
const water=new T.Mesh(new T.PlaneGeometry(3000,3000,100,100),new T.MeshPhongMaterial({color:0x1e9ab5,transparent:false,opacity:1,shininess:180,specular:0xffd9a0,bumpMap:wt,bumpScale:1.6}));water.rotation.x=-Math.PI/2;S.add(water);
const waterTime={value:0};
water.material.onBeforeCompile=shader=>{
 shader.uniforms.worldTime=waterTime;
 shader.vertexShader='uniform float worldTime;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec2 sea=(modelMatrix*vec4(position,1.)).xz;
 transformed.z+=sin(sea.x*.075+sea.y*.038+worldTime*1.2)*.17+sin(sea.y*.12-sea.x*.02-worldTime*1.7)*.09;`);
};

// town
const ctex=(fn)=>{const c=document.createElement('canvas');c.width=c.height=64;fn(c.getContext('2d'));const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t};
const wm=ctex(x=>{x.fillStyle='#fff';x.fillRect(0,0,64,64);x.fillStyle='#3a4a66';for(let i=0;i<4;i++)for(let j=0;j<4;j++)x.fillRect(i*16+4,j*16+4,8,9)});
const we=ctex(x=>{x.fillStyle='#000';x.fillRect(0,0,64,64);for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(rnd()<.65){x.fillStyle='#ffc46b';x.fillRect(i*16+4,j*16+4,8,9)}});
const bm=[0xf2d0a4,0xe8a598,0xa8c8d8,0xc9b8e0,0xd9e2a0,0xf5f0e0].map(c=>new T.MeshLambertMaterial({color:c,map:wm,emissive:0xffffff,emissiveMap:we,emissiveIntensity:0})),roofM=M(0xb5533c),BL=[{x:0,z:0,r:4.5}];
const stone=M(0xb8b4a8);const plaza=new T.Mesh(new T.CylinderGeometry(15,15,.2,24),stone);plaza.position.y=6.05;plaza.receiveShadow=true;S.add(plaza);
[[6,110],[110,6]].forEach(([w,d])=>{const r=new T.Mesh(new T.BoxGeometry(w,.12,d),M(0x55565e));r.position.y=6.04;r.receiveShadow=true;S.add(r)});
const fo=new T.Group();fo.position.y=6;cyl(fo,4,4.2,.9,stone,0,.45,0,16);cyl(fo,3.4,3.4,.95,M(0x38b6c4,0x38b6c4,.6),0,.5,0,16);cyl(fo,.5,.7,3,stone,0,1.5,0);S.add(fo);
for(let n=0,k=0;n<400&&k<34;n++){const a=rnd()*6.28,r=22+rnd()*34,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<9||Math.abs(z)<9||r<20)continue;
 const w=6+rnd()*5,d=6+rnd()*5,h=8+rnd()*rnd()*22,rr=Math.max(w,d)/2+.5;if(BL.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+rr+3))continue;
 const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(w+d)/16,uv.getY(i)*h/8);
 const b=new T.Mesh(g,bm[k%6]);b.position.set(x,6+h/2,z);b.castShadow=b.receiveShadow=true;S.add(b);const sx=Math.abs(x)>Math.abs(z);box(S,sx?.3:1.6,2.8,sx?1.6:.3,M(0x5a3a22),x-(sx?Math.sign(x)*(w/2+.05):0),7.4,z-(sx?0:Math.sign(z)*(d/2+.05)));box(S,w+.5,1,d+.5,stone,x,6.5,z);
 if(k%3){const c=new T.Mesh(new T.ConeGeometry(1,3.5,4),roofM);c.rotation.y=Math.PI/4;c.scale.set(w*.75,1,d*.75);c.position.set(x,6+h+1.75,z);c.castShadow=true;S.add(c)}else box(S,w+.6,.6,d+.6,roofM,x,6+h+.3,z);
 BL.push({x,z,r:rr});k++}
const lampM=M(0xfff0c0,0xffd27a,0);for(let i=0;i<14;i++){const a=i/14*6.28,x=Math.cos(a)*17,z=Math.sin(a)*17,y=hf(x,z);cyl(S,.12,.15,4,M(0x333340),x,y+2,z);const l=new T.Mesh(new T.SphereGeometry(.4,8,6),lampM);l.position.set(x,y+4.2,z);S.add(l)}
// trees
const N=900,pn=[0,1,2].map(i=>new T.InstancedMesh(new T.ConeGeometry(2.6-i*.6,4.2,7),M(0xffffff),N)),bl=new T.InstancedMesh(new T.IcosahedronGeometry(2.6,1),new T.MeshLambertMaterial({color:0xffffff}),N),km=new T.InstancedMesh(new T.CylinderGeometry(.28,.42,3,5),M(0x6b4a2f),N),rk=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),M(0x8a857a),260),o=new T.Object3D();let pc=0,bc_=0,kc=0,rc_=0;
const put=(m,n,x,y,z,sx,sy,sz,c)=>{o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.y=rnd()*6;o.updateMatrix();m.setMatrixAt(n,o.matrix);if(c)m.setColorAt(n,c)};
for(let i=0;i<3000&&pc+bc_<N;i++){const x=(rnd()-.5)*700,z=(rnd()-.5)*700,h=hf(x,z);if(h<1.3||h>22||Math.hypot(x,z)<64)continue;const sc=.7+rnd()*.9;
 if(h<9&&rnd()<.6){put(bl,bc_++,x,h+4.2*sc,z,sc,sc*.85,sc,cc.setHex(0x4f9a3a).offsetHSL((rnd()-.5)*.1,0,(rnd()-.5)*.1));put(km,kc++,x,h+1.5*sc,z,sc,sc,sc)}
 else{const c=cc.setHex(0x2f7a3c).offsetHSL((rnd()-.5)*.08,0,(rnd()-.5)*.1);for(let k=0;k<3;k++)put(pn[k],pc,x,h+sc*(2.6+k*1.9),z,sc,sc,sc,c);pc++;put(km,kc++,x,h+1.5*sc,z,sc,sc,sc)}}
for(let i=0;i<1500&&rc_<260;i++){const x=(rnd()-.5)*700,z=(rnd()-.5)*700,h=hf(x,z);if(h<-.2||Math.hypot(x,z)<62)continue;put(rk,rc_++,x,h+.2,z,.6+rnd()*1.6,.5+rnd(),.6+rnd()*1.6,cc.setHex(0x8a857a).offsetHSL(0,0,(rnd()-.5)*.15))}
pn.forEach(m=>m.count=pc);bl.count=bc_;km.count=kc;rk.count=rc_;rk.castShadow=true;[...pn,bl,km,rk].forEach(m=>{m.computeBoundingSphere();m.frustumCulled=true;S.add(m)});
const cloudM=new T.MeshLambertMaterial({color:0xffffff,emissive:0xcfd8e8,emissiveIntensity:.45,transparent:true,opacity:.85}),clouds=[];for(let i=0;i<22;i++){const g=new T.Group();for(let j=0;j<4;j++){const m=new T.Mesh(new T.IcosahedronGeometry(10+rnd()*8,1),cloudM);m.position.set(j*14-20,rnd()*4,rnd()*8);m.scale.y=.55;g.add(m)}g.position.set((rnd()-.5)*900,110+rnd()*50,(rnd()-.5)*900);S.add(g);clouds.push(g)}
// characters
function human(skin,shirt,pants,hair,scarf){const g=new T.Group(),b=new T.Group();g.add(b);box(b,.7,.9,.4,M(shirt),0,1.45,0);const hd=new T.Mesh(new T.IcosahedronGeometry(.32,1),M(skin));hd.position.y=2.15;hd.castShadow=true;b.add(hd);box(b,.66,.22,.62,M(hair),0,2.36,-.02);box(b,.08,.06,.04,M(0x111111),-.11,2.19,.29);box(b,.08,.06,.04,M(0x111111),.11,2.19,.29);box(b,.07,.09,.08,M(skin),0,2.13,.32);box(b,.15,.15,.15,M(skin),0,1.95,0);box(b,.74,.1,.44,M(0x222222),0,1.02,0);
 g.l=[-1,1].map(s=>{const p=new T.Group();p.position.set(s*.17,1,0);box(p,.28,.95,.3,M(pants),0,-.47,0);box(p,.3,.14,.44,M(0x1c1c1c),0,-.95,.06);b.add(p);return p});g.a=[-1,1].map(s=>{const p=new T.Group();p.position.set(s*.5,1.85,0);box(p,.22,.8,.24,M(shirt),0,-.4,0);box(p,.2,.2,.2,M(skin),0,-.85,0);b.add(p);return p});
 if(scarf){box(b,.78,.18,.5,M(scarf,scarf,.6),0,1.93,0);g.t=box(b,.28,.12,1.1,M(scarf,scarf,.8),0,1.9,-.7);box(b,.5,.7,.25,M(0x8a5a2b),0,1.5,-.32)}return g}
const anim=(g,ph,a)=>{g.l[0].rotation.x=Math.sin(ph)*a;g.l[1].rotation.x=-Math.sin(ph)*a;g.a[0].rotation.x=-Math.sin(ph)*a*.9;g.a[1].rotation.x=Math.sin(ph)*a*.9};
const hero=human(0xf1c8a0,0x1e2a4a,0x2b2b3a,0x3a2418,0xff7a2f);S.add(hero);hero.rotation.y=Math.PI;const P=v3(0,hf(0,12),12);
const nm=['Mara','Odd','Juno','Bram','Tilda','Pip','Kessa','Old Rui'],ln=['Golden hour again. Best light on the isles.','The lighthouse keeper swears the beacons sing.','That red car? Take it. Nobody remembers who owns it.','Planes need a long run. Hold Boost and pull up.','The eastern beacon is out past the hills.','I saw a boat tied at the west shore.','Mind the fountain, it bites.','Beacons on peaks. Fly, don\'t climb.'];
const skins=[0xf1c8a0,0xc68a5f,0x8d5a3b,0xe9b98a],cols=[0xd9534f,0x4a90a4,0xe8b04a,0x7d5ba6,0x5a9e6f,0xd98cb3];
const NP=[];for(let i=0;i<24;i++){const g=human(skins[i%4],cols[i%6],0x3b3f52,[0x2a1a10,0xc8a04a,0x999999][i%3]);const a=rnd()*6.28,r=10+rnd()*40;g.position.set(Math.cos(a)*r,6,Math.sin(a)*r);g.ph=rnd()*9;g.scale.setScalar(.92+rnd()*.16);g.tg=g.position.clone();g.w=0;g.n=i%8;g.sp=1.4+rnd()*1.2;S.add(g);NP.push(g)}
// vehicles
const V=[];function reg(g,o){g.rotation.order='YXZ';Object.assign(o,{g,sp:0,h:0});const mk=new T.Mesh(new T.ConeGeometry(1.4,3.2,4),new T.MeshBasicMaterial({color:o.type=='car'?0xff5a3a:o.type=='boat'?0x38e0ff:0xffd23a,fog:false,depthTest:false,transparent:true,opacity:.9}));mk.rotation.x=Math.PI;mk.renderOrder=9;g.add(mk);o.mk=mk;S.add(g);V.push(o);return o}
const CAR_COLORS=[0xd9342b,0xffc233,0x3a86d9,0x53b96a,0xf2f2f2];
function fallbackCar(color){const g=new T.Group();box(g,2,.7,4.2,M(color),0,.8,0);box(g,1.7,.6,2,new T.MeshPhongMaterial({color:0x101828,shininess:150,specular:0x99aabb}),0,1.4,-.3);box(g,.2,.15,.3,M(0x222222),-1.1,1.15,.7);box(g,.2,.15,.3,M(0x222222),1.1,1.15,.7);box(g,2.05,.25,.25,M(0x222222),0,.55,2.1);box(g,2.05,.25,.25,M(0x222222),0,.55,-2.1);[[-1,1.4],[1,1.4],[-1,-1.4],[1,-1.4]].forEach(([x,z])=>{const w=cyl(g,.45,.45,.4,M(0x222222),x*1.05,.45,z,10);w.rotation.z=Math.PI/2});box(g,.5,.25,.1,M(0xfff2b0,0xfff2b0,1),-.6,.9,2.1);box(g,.5,.25,.1,M(0xfff2b0,0xfff2b0,1),.6,.9,2.1);box(g,1.6,.2,.1,M(0xff2222,0xff2222,1),0,.9,-2.1);return g}
function sportsCarClone(source,color,traffic=false){const model=source.clone(true),paint=new Map();const recolor=m=>{if(!m||String(m.name).toLowerCase()!='paint')return m;if(!paint.has(m)){const c=m.clone();c.color.setHex(color);paint.set(m,c)}return paint.get(m)};model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(recolor):recolor(o.material);o.castShadow=!traffic;o.receiveShadow=!traffic});return model}
function replaceCarVisual(holder,source,color,traffic=false){if(holder.userData.visual)holder.remove(holder.userData.visual);const visual=sportsCarClone(source,color,traffic);holder.add(visual);holder.userData.visual=visual}
const car=new T.Group(),carVisual=fallbackCar(CAR_COLORS[0]);car.add(carVisual);car.userData.visual=carVisual;
const cV=reg(car,{name:'car',type:'car',ch:2.5,dist:10,max:40});car.position.set(9,hf(9,14),14);
function fallbackBoat(){const g=new T.Group();box(g,2.6,1,6,M(0xf3f0e6),0,.3,0);const bw=new T.Mesh(new T.ConeGeometry(1.8,3,4),M(0xf3f0e6));bw.rotation.set(Math.PI/2,0,Math.PI/4);bw.scale.set(.75,1,.5);bw.position.set(0,.3,4.4);g.add(bw);box(g,2.6,.3,6,M(0x1f6f8b),0,.9,0).scale.set(1.02,1,1.02);box(g,1.8,1.4,2,M(0xffffff),0,1.7,-.8);box(g,1.9,.5,2.1,M(0x1a2233),0,2,-.8);return g}
function replaceBoatVisual(holder,source){if(holder.userData.visual)holder.remove(holder.userData.visual);const visual=source.clone(true);visual.rotation.y=-Math.PI/2;visual.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});holder.add(visual);holder.userData.visual=visual}
const boat=new T.Group(),boatFallback=fallbackBoat();boatFallback.visible=false;boat.add(boatFallback);boat.userData.visual=boatFallback;boat.userData.modelState='loading';
const bV=reg(boat,{name:'boat',type:'boat',ch:3,dist:14,max:30});let ba=.8,br=150;while(hf(Math.cos(ba)*br,Math.sin(ba)*br)>-1.5)br+=2;const bx=Math.cos(ba)*br,bz=Math.sin(ba)*br;boat.position.set(bx,0,bz);bV.h=Math.atan2(Math.cos(ba),Math.sin(ba));
const dkc=Math.cos(ba),dks=Math.sin(ba),dock=box(S,3.4,.3,30,M(0x8a6a43),dkc*(br-16),.5,dks*(br-16));dock.rotation.y=bV.h;
for(let i=0;i<8;i++)for(const s of[-1,1]){const u=br-30+i*4,pp=cyl(S,.2,.2,3,M(0x5a4530),dkc*u-dks*s*1.6,-.6,dks*u+dkc*s*1.6,6)}
const dk=(x,z)=>{const u=x*dkc+z*dks,w=-x*dks+z*dkc;return Math.abs(w)<1.7&&u>br-31&&u<br-1},gr=(x,z)=>dk(x,z)?Math.max(hf(x,z),.6):islandScenery.surfaceHeight(x,z);
const surfaceAt=(x,z)=>{const h=hf(x,z),d=Math.hypot(x,z);if(dk(x,z)||Math.abs(x-islandScenery.jetty.x)<14&&Math.abs(z-islandScenery.jetty.z)<2.2)return 'wood';if(h<-.2)return 'water';if(h<1)return 'sand';if(d<16||(d<65&&(Math.abs(x)<4||Math.abs(z)<4)))return 'stone';return 'grass'};
function fallbackPlane(){const g=new T.Group(),fu=cyl(g,.6,.35,6,M(0xf6f1e4),0,0,0,10);fu.rotation.x=Math.PI/2;box(g,11,.15,1.6,M(0xd9342b),0,.2,.3);box(g,.15,1.4,1.2,M(0xd9342b),0,.8,-2.8);box(g,3.5,.12,.8,M(0xd9342b),0,.2,-2.8);const cp=new T.Mesh(new T.SphereGeometry(.55,8,6),M(0x1a2233,0x335577,.4));cp.position.set(0,.5,.6);g.add(cp);const prop=new T.Group();prop.position.z=3.1;box(prop,3,.2,.1,M(0x222222),0,0,0);box(prop,.2,3,.1,M(0x222222),0,0,0);g.add(prop);return {g,prop}}
function replacePlaneVisual(holder,source){if(holder.userData.visual)holder.remove(holder.userData.visual);const visual=source.clone(true);visual.scale.setScalar(.3);visual.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});holder.add(visual);holder.userData.visual=visual}
const pl=new T.Group(),planeFallback=fallbackPlane(),prop=planeFallback.prop;planeFallback.g.visible=false;pl.add(planeFallback.g);pl.userData.visual=planeFallback.g;pl.userData.modelState='loading';
const pV=reg(pl,{name:'plane',type:'plane',ch:2.5,dist:18,max:90,pt:0,rl:0});pl.position.set(0,7.3,-26);pV.h=Math.PI;pl.rotation.y=Math.PI;
const TR=CAR_COLORS.slice(1).map((c,i)=>{const q=new T.Group(),visual=fallbackCar(c);q.add(visual);q.userData.visual=visual;q.rotation.order='YXZ';q.sg=i%2?1:-1;q.ax=i<2?0:1;q.u=q.sg*(20+i*8);q.dir=1;S.add(q);return q});
const hl=new T.SpotLight(0xfff0c8,0,90,.5,.5);hl.position.set(0,1,2.2);hl.target.position.set(0,.5,22);car.add(hl,hl.target);
const carModelUrl=new URL('assets/vehicles/sports_car.glb',document.baseURI).href;
new GLTFLoader().load(carModelUrl,gltf=>{replaceCarVisual(car,gltf.scene,CAR_COLORS[0]);TR.forEach((q,i)=>replaceCarVisual(q,gltf.scene,CAR_COLORS[i+1],true));car.userData.model='sports_car.glb';TR.forEach(q=>q.userData.model='sports_car.glb')},undefined,e=>{console.warn('sports car model failed; using fallback',e);if(started)toast('Detailed car model could not load. Using fallback.',3500)});
const speedboatModelUrl=new URL('assets/boats/speedboat.glb',document.baseURI).href;
new GLTFLoader().load(speedboatModelUrl,gltf=>{replaceBoatVisual(boat,gltf.scene);boat.userData.model='speedboat.glb';boat.userData.modelState='ready'},undefined,e=>{console.warn('speedboat model failed; using fallback',e);boatFallback.visible=true;boat.userData.modelState='fallback';if(started)toast('Detailed boat model could not load. Using fallback.',3500)});
const airlinerModelUrl=new URL('assets/aircraft/airliner.glb',document.baseURI).href;
new GLTFLoader().load(airlinerModelUrl,gltf=>{replacePlaneVisual(pl,gltf.scene);pl.userData.model='airliner.glb';pl.userData.modelState='ready'},undefined,e=>{console.warn('airliner model failed; using fallback',e);planeFallback.g.visible=true;pl.userData.modelState='fallback';if(started)toast('Detailed airplane model could not load. Using fallback.',3500)});
// lighthouse
const lh=new T.Group();let la=3.6,lr=150;while(hf(Math.cos(la)*lr,Math.sin(la)*lr)>.5)lr+=2;lh.position.set(Math.cos(la)*(lr-4),hf(Math.cos(la)*(lr-4),Math.sin(la)*(lr-4)),Math.sin(la)*(lr-4));
for(let i=0;i<4;i++)cyl(lh,3-i*.4,3.4-i*.4,8,M(i%2?0xd9342b:0xf6f1e4),0,i*8+4,0,10);const lamp=new T.Mesh(new T.SphereGeometry(2,10,8),new T.MeshBasicMaterial({color:0xfff0b0}));lamp.position.y=34;lh.add(lamp);
const beam=new T.Group();beam.position.y=34;const bc=new T.Mesh(new T.ConeGeometry(6,50,10,1,true),new T.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));bc.rotation.x=-Math.PI/2;bc.position.z=25;beam.add(bc);lh.add(beam);S.add(lh);BL.push({x:lh.position.x,z:lh.position.z,r:4});
// beacons
let lit=0;const BC=[];for(let i=0;i<6;i++){let a=i*1.05+.3,r=[170,110,205][i%3],x,z;const pk=i==1||i==4;if(pk){let bh=-9;for(let t=0;t<200;t++){const xx=(rnd()-.5)*500,zz=(rnd()-.5)*500,h=hf(xx,zz);if(h>bh&&Math.hypot(xx,zz)>90){bh=h;x=xx;z=zz}}}else{while(hf(Math.cos(a)*r,Math.sin(a)*r)<1.2)r-=4;x=Math.cos(a)*r;z=Math.sin(a)*r}
 const m=new T.MeshBasicMaterial({color:0x38e0ff,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,fog:false}),g=new T.Group();g.position.set(x,hf(x,z),z);const bm2=new T.Mesh(new T.CylinderGeometry(1.4,1.4,90,10,1,true),m);bm2.position.y=45;g.add(bm2);const ba2=cyl(g,2,2.6,1.2,stone,0,.6,0,8);S.add(g);BC.push({g,m,x,z,on:0})}
const RG=[];for(let i=0;i<8;i++){const a=i*.785+.2,r=95+(i%2)*55,x=Math.cos(a)*r,z=Math.sin(a)*r,m=new T.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false,fog:false}),g=new T.Mesh(new T.TorusGeometry(9,.8,8,28),m);g.position.set(x,Math.max(hf(x,z),0)+38+(i%3)*22,z);g.rotation.y=-a;S.add(g);RG.push({g,m,x,z,on:0})}let rc=0;
const savedProgress=loadProgress();BC.forEach((b,i)=>{if(savedProgress.beacons[i]){b.on=1;b.m.color.setHex(0xffc24a);lit++}});RG.forEach((q,i)=>{if(savedProgress.rings[i]){q.on=1;q.m.color.setHex(0x7dff9a);rc++}});
const XR=[],shardRnd=createRng(77),shardMat=new T.MeshPhongMaterial({color:0x8ff7ff,emissive:0x2bd9ff,emissiveIntensity:1.1,shininess:120,specular:0xffffff});
for(let i=0;i<10;i++){let x=0,z=0,h=0;for(let t=0;t<400;t++){const a=shardRnd()*6.28,r=82+shardRnd()*185;x=Math.cos(a)*r;z=Math.sin(a)*r;h=hf(x,z);if(h>1.2&&h<24)break}const g=new T.Group(),gem=new T.Mesh(new T.OctahedronGeometry(1.15,0),shardMat),halo=new T.Mesh(new T.TorusGeometry(1.85,.08,6,24),new T.MeshBasicMaterial({color:0xb7fbff,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false}));halo.rotation.x=Math.PI/2;g.add(gem,halo);g.position.set(x,h+2.4,z);g.baseY=h+2.4;S.add(g);XR.push({g,x,z,on:0})}
let sc=0;XR.forEach((q,i)=>{if(savedProgress.shards[i]){q.on=1;q.g.visible=false;sc++}});
const peakB=BC.reduce((a,b)=>hf(b.x,b.z)>hf(a.x,a.z)?b:a,BC[0]);
const LM=[
 {name:'Old Town',x:0,z:0,r:24,on:0},
 {name:'Skyreach Airstrip',x:pl.position.x,z:pl.position.z,r:22,on:0},
 {name:'West Harbor',x:dkc*(br-16),z:dks*(br-16),r:22,on:0},
 {name:'Ember Lighthouse',x:lh.position.x,z:lh.position.z,r:22,on:0},
 {name:'Cloudbreak Peak',x:peakB.x,z:peakB.z,r:18,on:0},
 ...ISLANDS.map(i=>({...i,r:i.radius*.8,on:0}))
];
const islandScenery=createIslandScenery(S,BL);
let dc=0;LM.forEach((l,i)=>{if(savedProgress.discoveries[i]){l.on=1;dc++}});
$('cnt').textContent=lit+'/6';$('rg').textContent='Sky rings '+rc+'/8';$('shards').textContent='Skyshards '+sc+'/10';$('discoveries').textContent='Places '+dc+'/8';
const persistProgress=()=>saveProgress({beacons:BC.map(b=>!!b.on),rings:RG.map(q=>!!q.on),shards:XR.map(q=>!!q.on),discoveries:LM.map(l=>!!l.on)});
const tailwind=()=>sc===10?1.12:1;
const GL=[];for(let i=0;i<14;i++){const g=new T.Group(),p1=new T.Group(),p2=new T.Group();box(p1,1.6,.06,.5,M(0xffffff),.8,0,0);box(p2,1.6,.06,.5,M(0xffffff),-.8,0,0);g.add(p1,p2);g.p=[p1,p2];g.c=[[lh.position.x,lh.position.z],[bx,bz],[0,0]][i%3];g.r=15+rnd()*35;g.a=rnd()*6.28;g.y=28+rnd()*30;S.add(g);GL.push(g)}
const pcv=document.createElement('canvas');pcv.width=pcv.height=64;{const x=pcv.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}
const ptx=new T.CanvasTexture(pcv),PT=[];for(let i=0;i<60;i++){const q=new T.Sprite(new T.SpriteMaterial({map:ptx,transparent:true,depthWrite:false,opacity:0}));q.life=0;q.visible=false;S.add(q);PT.push(q)}let pi=0;
const puff=(x,y,z,c,sz,vy)=>{const q=PT[pi++%60];q.position.set(x,y,z);q.material.color.setHex(c);q.sz=sz;q.life=1;q.vy=vy;q.visible=true};
// input
const keys={};let jx=0,jy=0,jid=null,jumpF=0,boostF=0,yaw=Math.PI,pitch=.35,off=0,started=0,mode='foot',cur=null,dragId=null,lx=0,ly=0;
let atlasOpen=false,selectedWaypoint=null;
function releaseInput(){Object.keys(keys).forEach(k=>delete keys[k]);jx=jy=jumpF=boostF=0;jid=dragId=null;$('knob').style.transform=''}
const atlas=createAtlas({places:LM,vehicles:V,onSelect:p=>{selectedWaypoint=p;if(p)toast('Course set: '+p.name,2800)},onOpen:open=>{atlasOpen=open;releaseInput()}});
addEventListener('blur',releaseInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInput()});
addEventListener('keydown',e=>{if(atlasOpen||!started)return;keys[e.code]=1;if(e.code=='KeyE'&&!e.repeat)act()});addEventListener('keyup',e=>keys[e.code]=0);
const joy=$('joy'),knob=$('knob');function mv(e){const r=joy.getBoundingClientRect();let dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}jx=dx;jy=-dy;knob.style.transform=`translate(${dx*40}px,${dy*40}px)`}
joy.onpointerdown=e=>{jid=e.pointerId;joy.setPointerCapture(jid);mv(e)};joy.onpointermove=e=>{if(e.pointerId==jid)mv(e)};joy.onpointerup=joy.onpointercancel=()=>{jid=null;jx=jy=0;knob.style.transform=''};
const hold=(id,f)=>{const el=$(id);el.onpointerdown=e=>{f(1);el.setPointerCapture(e.pointerId)};el.onpointerup=el.onpointercancel=()=>f(0)};hold('jump',v=>jumpF=v);hold('boost',v=>boostF=v);$('act').onpointerdown=act;
const qualityBtn=$('quality');const renderQuality=()=>qualityBtn.textContent='Quality '+qualityLabel(quality);renderQuality();qualityBtn.onpointerdown=e=>{e.stopPropagation();quality=nextQuality(quality);settings.quality=quality;saveSettings(settings);applyRendererQuality(R,quality);renderQuality();toast('Quality '+qualityLabel(quality),1800)};
const cv=R.domElement;cv.onpointerdown=e=>{dragId=e.pointerId;lx=e.clientX;ly=e.clientY};cv.onpointermove=e=>{if(e.pointerId!=dragId)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;if(mode=='foot')yaw-=dx*.006;else off-=dx*.006;pitch=cl(pitch+dy*.004,.05,1.2)};cv.onpointerup=cv.onpointercancel=()=>dragId=null;
$('start').onpointerdown=()=>{$('start').style.display='none';started=1;worldAudio.start();toast('Tap Explore to chart the offshore islands. Find your boat, sail to a new shore, and step ashore.',6000)};
let tt;function toast(m,ms){const t=$('toast');t.textContent=m;t.classList.add('s');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('s'),ms||2500)}
function objectiveFeedback(pattern=35){const ui=$('ui');ui.classList.remove('objective-pulse');void ui.offsetWidth;ui.classList.add('objective-pulse');haptic(pattern)}
function col2(p,r){for(const b of BL){const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz),m=b.r+r;if(d<m&&d>.01){p.x=b.x+dx/d*m;p.z=b.z+dz/d*m}}}
function setMode(m,c){mode=m;cur=c;$('act').textContent=m=='foot'?'Board':'Exit';$('jump').style.display=m=='foot'?'flex':'none';$('boost').textContent=c?.type=='plane'?'Throttle':'Boost';$('mode').textContent=c?'Driving the '+c.name:'On foot';$('spd').textContent=''}
function act(){if(!started||atlasOpen)return;if(mode=='foot'){let b=null,bd=9;for(const v of V){const d=v.g.position.distanceTo(P);if(d<bd){bd=d;b=v}}if(b){hero.visible=false;setMode('veh',b);haptic(20);toast(b.type=='plane'?'Hold Throttle, then push the stick up to lift off':b.type=='boat'?'Sail out to the sea beacons':'Drive. Hold Boost for speed',3500)}else toast('Walk up to a vehicle to board')}
 else{const g=cur.g.position;if(cur.type=='plane'&&(g.y-hf(g.x,g.z)>3||cur.sp>6)){toast('Land and slow down first');return}
 for(let a=0;a<6.3;a+=1.05){const x=g.x+Math.sin(cur.h+a)*4,z=g.z+Math.cos(cur.h+a)*4,h=gr(x,z);if(h>.3||cur.type=='boat'){P.set(x,Math.max(h,-.7),z);hero.visible=true;cur.sp=0;setMode('foot',null);return}}toast('No solid ground nearby. Head to shore.')}}
// update
let ang=.35,mc=$('map').getContext('2d');
const clock=new T.Clock();let fov=65;
function loop(){requestAnimationFrame(loop);const rawDt=Math.min(clock.getDelta(),.05),dt=atlasOpen||document.hidden?0:rawDt,tm_=clock.elapsedTime;
 if(started)ang=advanceSunAngle(ang,dt);const light=lightingAt(ang),sy=light.altitude,dir=v3(Math.cos(ang),sy,.3).normalize(),k=light.daylight,du=light.twilight;
 skyU.top.value.copy(cN).lerp(cD,k);skyU.bot.value.copy(cNh).lerp(cDh,k).lerp(cO,du*.85);S.fog.color.copy(skyU.bot.value);hemi.intensity=light.hemisphere;hemi.groundColor.setHex(0x70899d).lerp(tmp.setHex(0x899483),k);ambient.intensity=light.ambient;sun.intensity=light.sun;moonlight.intensity=light.moon;sun.color.setHSL(.09,.7,.6+.3*k);water.material.color.setHSL(.53,.62,light.waterLightness);
 bm.forEach(m=>m.emissiveIntensity=(1-k)*1.1);lampM.emissiveIntensity=(1-k)*2;stars.material.opacity=1-k;bc.material.opacity=(1-k)*.3;beam.rotation.y=tm_*.8;
 const jX=(!started||atlasOpen)?0:cl(jx+(keys.KeyD?1:0)-(keys.KeyA?1:0),-1,1),jY=(!started||atlasOpen)?0:cl(jy+(keys.KeyW?1:0)-(keys.KeyS?1:0),-1,1),bo=!atlasOpen&&started&&(boostF||keys.ShiftLeft),ju=!atlasOpen&&started&&(jumpF||keys.Space);
 cloudM.emissiveIntensity=.08+.4*k;clouds.forEach(c=>{c.position.x+=dt*3;while(c.position.x-P.x>500)c.position.x-=1000;while(c.position.x-P.x<-500)c.position.x+=1000;while(c.position.z-P.z>500)c.position.z-=1000;while(c.position.z-P.z<-500)c.position.z+=1000});
 V.forEach(v=>{v.mk.visible=mode=='foot';v.mk.position.y=9+Math.sin(tm_*3)*.6});hl.intensity=(mode=='veh'&&cur===cV&&k<.6)?2.4*(1-k):0;PT.forEach(s=>{if(s.life>0){s.life-=dt*1.1;s.position.y+=s.vy*dt;s.scale.setScalar(s.sz*(2-s.life));s.material.opacity=Math.max(0,s.life)*.55;if(s.life<=0)s.visible=false}});
 TR.forEach(q=>{q.u+=q.dir*9*dt;const a=Math.abs(q.u);if(a>52||a<17){q.dir*=-1;q.u=q.sg*cl(a,17,52)}const v=q.dir;q.rotation.y=q.ax?v*Math.PI/2:v>0?0:Math.PI;q.position.set(q.ax?q.u:-1.5*v,6.06,q.ax?1.5*v:q.u)});
 GL.forEach(g=>{g.a+=dt*.35;g.position.set(g.c[0]+Math.cos(g.a)*g.r,g.y+Math.sin(g.a*2)*2,g.c[1]+Math.sin(g.a)*g.r);g.rotation.y=-g.a;const f=Math.sin(tm_*7+g.r)*.5;g.p[0].rotation.z=f;g.p[1].rotation.z=-f});
 RG.forEach((q,i)=>{if(!q.on)q.m.opacity=.6+Math.sin(tm_*3+i)*.25;if(!q.on&&mode=='veh'&&cur.type=='plane'&&P.distanceTo(q.g.position)<10){q.on=1;q.m.color.setHex(0x7dff9a);rc++;persistProgress();$('rg').textContent='Sky rings '+rc+'/8';objectiveFeedback([25,35,25]);toast(rc==8?'All rings flown. Sky master.':'Ring '+rc+' of 8',2500)}});
 XR.forEach((q,i)=>{if(q.on)return;q.g.rotation.y+=dt*1.7;q.g.children[1].rotation.z+=dt*.8;q.g.position.y=q.g.baseY+Math.sin(tm_*2.2+i)*.45;const reach=mode=='veh'&&cur?.type=='plane'?7:4.2;if(distance2D(q,P)<reach){q.on=1;q.g.visible=false;sc++;persistProgress();$('shards').textContent='Skyshards '+sc+'/10';objectiveFeedback([35,35,70]);toast(sc===10?'All Skyshards found. Tailwind unlocked: faster sprint and vehicles.':'Skyshard '+sc+' of 10',3200)}});
 LM.forEach((l,i)=>{if(!started||l.on)return;if(distance2D(l,P)<l.r&&Math.abs(P.y-hf(l.x,l.z))<35){l.on=1;dc++;persistProgress();$('discoveries').textContent='Places '+dc+'/8';objectiveFeedback(45);toast('Discovered: '+l.name+(dc===8?' — atlas complete.':''),3000)}});
 // NPCs
 let near=null,nd=5;NP.forEach(n=>{const d=n.tg.clone().sub(n.position);d.y=0;if(n.w>0)n.w-=dt;else if(d.length()<1){n.w=1+rnd()*4;const a=rnd()*6.28,r=8+rnd()*44;n.tg.set(Math.cos(a)*r,6,Math.sin(a)*r)}else{d.normalize();n.position.addScaledVector(d,n.sp*dt);n.rotation.y+=ad(Math.atan2(d.x,d.z)-n.rotation.y)*Math.min(1,dt*6);n.ph+=dt*n.sp*5;col2(n.position,.5)}
  anim(n,n.w>0?0:n.ph,n.w>0?0:.7);n.position.y=hf(n.position.x,n.position.z);const pd=n.position.distanceTo(P);if(mode=='foot'&&pd<nd){nd=pd;near=n}});
 if(near&&near!=NP.last){NP.last=near;toast(nm[near.n]+': '+ln[near.n],3200)}if(!near)NP.last=null;
 if(!started){yaw+=dt*.1}
 if(mode=='foot'){const sp_=(bo?11:6.5)*(P.y<-.3?.55:1)*tailwind(),dx=Math.sin(yaw)*jY-Math.cos(yaw)*jX,dz=Math.cos(yaw)*jY+Math.sin(yaw)*jX,m=Math.hypot(dx,dz);let mv_=0;
  if(m>.05){const kk=Math.min(1,m)/m,nx=P.x+dx*kk*sp_*dt,nz=P.z+dz*kk*sp_*dt;if(hf(nx,nz)>-6||dk(nx,nz)){P.x=nx;P.z=nz}hero.rotation.y+=ad(Math.atan2(dx,dz)-hero.rotation.y)*Math.min(1,dt*12);mv_=1}
  col2(P,.5);hero.vy=(hero.vy||0)-25*dt;P.y+=hero.vy*dt;const g=Math.max(gr(P.x,P.z),-.7),og=P.y<=g+.05;if(P.y<g){P.y=g;hero.vy=0}if(ju&&og)hero.vy=9;
  hero.ph=(hero.ph||0)+dt*(bo?14:9)*mv_;anim(hero,hero.ph,og?mv_*(bo?1.1:.7):.8);if(hero.t)hero.t.rotation.x=Math.sin(tm_*6)*.25-.1-mv_*.3;hero.position.copy(P)}
 else{const c=cur,g=c.g,p=g.position;let sc=0;
  if(c.type=='car'){c.sp+=jY*(bo?44:26)*tailwind()*dt;c.sp-=c.sp*(jY?.5:1.6)*dt;c.h-=jX*cl(Math.abs(c.sp)/7,0,1)*1.7*dt*Math.sign(c.sp||1);const ox=p.x,oz=p.z;p.x+=Math.sin(c.h)*c.sp*dt;p.z+=Math.cos(c.h)*c.sp*dt;if(hf(p.x,p.z)<-.4){p.x=ox;p.z=oz;c.sp*=-.3}col2(p,2.3);const fy=hf(p.x+Math.sin(c.h)*2,p.z+Math.cos(c.h)*2),by=hf(p.x-Math.sin(c.h)*2,p.z-Math.cos(c.h)*2);p.y=hf(p.x,p.z);g.rotation.x=-Math.atan((fy-by)/4);g.rotation.z=-jX*c.sp*.004;sc=c.sp}
  else if(c.type=='boat'){c.sp+=jY*(bo?36:20)*tailwind()*dt;c.sp-=c.sp*.6*dt;c.h-=jX*cl(Math.abs(c.sp)/6,0,1)*1.2*dt;const ox=p.x,oz=p.z;p.x+=Math.sin(c.h)*c.sp*dt;p.z+=Math.cos(c.h)*c.sp*dt;if(!boatCanTravel(p.x,p.z)){p.x=ox;p.z=oz;c.sp*=-.3}p.y=Math.sin(tm_*1.7)*.18-.1;g.rotation.x=Math.sin(tm_*1.3)*.03-c.sp*.004;g.rotation.z=-jX*.12+Math.sin(tm_*1.1)*.03;sc=c.sp}
  else{const gy=Math.max(0,hf(p.x,p.z)),air=p.y-gy>2.5;c.sp+=(bo?30*tailwind():-10)*dt;c.sp=cl(c.sp,air?34:0,90*tailwind());if(!air)c.sp-=(bo?0:12)*dt;c.sp=Math.max(air?34:0,c.sp);
   const ptg=(!air&&c.sp<28)?0:jY*.75;c.pt+=(ptg-c.pt)*Math.min(1,dt*2.5);c.h-=jX*(air?1.05:(c.sp>1?.5:0))*dt;c.rl+=(jX*.75-c.rl)*Math.min(1,dt*3);
   p.x+=Math.sin(c.h)*Math.cos(c.pt)*c.sp*dt;p.z+=Math.cos(c.h)*Math.cos(c.pt)*c.sp*dt;p.y+=Math.sin(c.pt)*c.sp*dt;if(p.y<gy+1.3){p.y=gy+1.3;if(c.pt<0)c.pt=0}p.y=Math.min(p.y,260);g.rotation.x=-c.pt;g.rotation.z=air?c.rl:0;prop.rotation.z+=(c.sp*.4+8)*dt;sc=c.sp}
  if(c.type=='car'&&Math.abs(c.sp)>9&&rnd()<.6)puff(p.x-Math.sin(c.h)*2+(rnd()-.5)*2,p.y+.3,p.z-Math.cos(c.h)*2+(rnd()-.5)*2,0xb9b09a,2.5,.8);if(c.type=='boat'&&Math.abs(c.sp)>3&&rnd()<.8)puff(p.x-Math.sin(c.h)*3+(rnd()-.5)*2,.15,p.z-Math.cos(c.h)*3+(rnd()-.5)*2,0xffffff,2.4,.2);
  g.rotation.y=c.h;$('spd').textContent=Math.round(Math.abs(sc)*3.6)+' km/h';P.copy(p);
  yaw+=ad(c.h+off-yaw)*Math.min(1,dt*(c.type=='plane'?4:3));if(!dragId)off*=Math.pow(.05,dt);fov=lp(fov,65+Math.abs(sc)*.25,dt*3)}
 C.fov=lp(C.fov,mode=='foot'?65:fov,.1);C.updateProjectionMatrix();
 const dist=mode=='foot'?7:cur.dist,ch=mode=='foot'?2:cur.ch,tg_=v3(P.x,P.y+ch,P.z),cd=Math.cos(pitch)*dist,want=v3(P.x-Math.sin(yaw)*cd,P.y+ch+Math.sin(pitch)*dist,P.z-Math.cos(yaw)*cd);
 want.y=Math.max(want.y,Math.max(0,hf(want.x,want.z))+1.2);C.position.lerp(want,1-Math.exp(-dt*(started?9:40)));C.lookAt(tg_);
 sun.position.copy(tg_).addScaledVector(dir,120);sun.target.position.copy(tg_);moonlight.position.copy(tg_).addScaledVector(dir,-120);moonlight.target.position.copy(tg_);dome.position.copy(C.position);sunM.position.copy(C.position).addScaledVector(dir,800);moonM.position.copy(C.position).addScaledVector(dir,-800);sunM.visible=sy>-.1;glow.position.copy(sunM.position);glow.material.opacity=cl(sy*4+.5,0,1)*.9;moonM.visible=sy<.1;stars.position.copy(C.position);water.position.set(C.position.x,0,C.position.z);wt.offset.set(C.position.x*RP/3000+tm_*.012,-C.position.z*RP/3000+tm_*.009);
 BC.forEach((b,i)=>{b.m.opacity=(b.on?.75:.45)+Math.sin(tm_*3+i)*.12;if(!b.on){const r=mode=='foot'?5:mode=='veh'&&cur.type=='plane'?22:10;if(Math.hypot(P.x-b.x,P.z-b.z)<r&&(mode!='veh'||cur.type!='plane'||P.y<hf(b.x,b.z)+70)){b.on=1;b.m.color.setHex(0xffc24a);lit++;persistProgress();$('cnt').textContent=lit+'/6';objectiveFeedback([45,45,90]);toast(lit==6?'Skyreach is lit. The isles are yours to roam.':'Beacon lit. '+(6-lit)+' to go.',3500)}}});
 const nav=selectedWaypoint?{item:selectedWaypoint,distance:distance2D(selectedWaypoint,P)}:nearestPending(BC,P)||nearestPending(XR,P),navArrow=$('navArrow'),navText=$('navText'),heading=mode=='foot'?hero.rotation.y:(cur?.h??yaw);if(nav){const isBeacon=BC.includes(nav.item);navArrow.style.transform='rotate('+relativeBearing(P,nav.item,heading)+'rad)';navText.textContent=(selectedWaypoint?selectedWaypoint.name+' · ':isBeacon?'Beacon ':'Skyshard ')+(nav.distance>=1000?(nav.distance/1000).toFixed(1)+'km':Math.round(nav.distance)+'m')}else{navArrow.style.transform='rotate(0rad)';navText.textContent='Compass clear ✓'}
 atlas.drawRadar(mc,P,heading,selectedWaypoint,[...BC.map(b=>({...b,color:"#ffc24a"})),...RG.map(q=>({...q,color:"#ffd23a"})),...XR.filter(q=>distance2D(q,P)<95)]);atlas.update(P,selectedWaypoint);
 waterTime.value=tm_;
 islandScenery.update({time:tm_,dt,daylight:k,position:P,boat:mode==='veh'&&cur?.type==='boat',speed:cur?.sp||0,heading:cur?.h||0,quality});
 const ah=hf(P.x,P.z),ar=Math.hypot(P.x,P.z),audioMode=mode=='veh'?(cur?.type||'foot'):'foot',audioSpeed=mode=='veh'?Math.abs(cur?.sp||0):Math.hypot(jX,jY)*(bo?11:6.5),audioOcean=cl((1.2-ah)/5,0,1),audioCoast=cl(1-Math.abs(ah)/4.5,0,1),audioTown=cl(1-ar/90,0,1),audioAlt=audioMode=='plane'?Math.max(0,P.y-ah):0;
 worldAudio.update({dt,waterfall:cl(1-Math.hypot(P.x-(ISLANDS[2].x-5),P.z-ISLANDS[2].z)/90,0,1),mode:audioMode,speed:audioSpeed,walking:mode=='foot'&&Math.hypot(jX,jY)>.08,sprinting:!!bo,grounded:mode=='foot'&&Math.abs(P.y-Math.max(gr(P.x,P.z),-.7))<.15,surface:surfaceAt(P.x,P.z),ocean:audioOcean,coast:audioCoast,town:audioTown,daylight:k,altitude:audioAlt});
 R.render(S,C)}
if(import.meta.env.PROD&&'serviceWorker' in navigator){addEventListener('load',async()=>{const hadController=!!navigator.serviceWorker.controller;let reloading=false;if(hadController)navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()},{once:true});try{const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});reg.update().catch(()=>{})}catch{}})}
if(import.meta.env.DEV){
 globalThis.__skyreach={
  snapshot:()=>({position:P.toArray(),mode,atlasOpen,waypoint:selectedWaypoint?.name,places:LM.map(l=>({name:l.name,on:l.on})),models:{boat:boat.userData.modelState,plane:pl.userData.modelState},angle:ang,lighting:lightingAt(ang),drawCalls:R.info.render.calls,triangles:R.info.render.triangles}),
  inspect:(x,z,vehicle='foot',y=null)=>{releaseInput();started=1;$('start').style.display='none';if(vehicle==='foot'){setMode('foot',null);P.set(x,y??Math.max(gr(x,z),-.7),z);hero.visible=true}else{const v=V.find(v=>v.type===vehicle);v.g.position.set(x,y??Math.max(0,hf(x,z))+1,z);v.sp=0;v.h=0;P.copy(v.g.position);hero.visible=false;setMode('veh',v)}yaw=Math.PI;pitch=.45;C.position.set(P.x,P.y+7,P.z+14);C.lookAt(P.x,P.y+2,P.z);hero.position.copy(P);R.render(S,C)},
  hour:a=>ang=a,
  frame:(x,y,z,tx,ty,tz)=>{atlasOpen=true;C.position.set(x,y,z);C.lookAt(tx,ty,tz);R.render(S,C)},
  render:()=>R.render(S,C)
 };
}
setMode('foot',null);loop();
