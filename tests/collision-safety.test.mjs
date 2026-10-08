import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {overlapsDisc,depenetrateDisc,moveDiscSwept} from '../src/core/collision.js';
import {boatHullCanTravel,chooseSafeExit,spacecraftExitDecision,resetSpacecraftDamage} from '../src/core/vehicle-safety.js';
import {vehicleBoardDistance} from '../src/core/swimming.js';
import {terrainHeight} from '../src/core/world.js';
import {SOUTH_PADRE,spiLandHeight} from '../src/core/south-padre.js';

const pos=(x,z)=>({x,z});

test('high-speed car movement cannot tunnel across circular buildings',()=>{
 const p=pos(0,0),buildings=[{x:5,z:0,r:1}];
 const res=moveDiscSwept(p,22,0,{radius:1,colliders:buildings,maxStep:.75});
 assert.equal(res.blocked,true);
 assert.ok(p.x<=3.001,p.x+' jumped across the obstacle');
 assert.equal(overlapsDisc(p.x,p.z,1,buildings),false);
});
test('blocked movement can slide along a building without penetrating',()=>{
 const p=pos(0,0),colliders=[{x:5,z:0,r:2}];
 moveDiscSwept(p,10,7,{radius:.65,colliders,maxStep:.5});
 assert.ok(p.z>0,'sliding should preserve possible forward movement');
 assert.equal(overlapsDisc(p.x,p.z,.65,colliders),false);
});
test('swept movement cannot jump over a narrow impassable water gap',()=>{
 const p=pos(0,0),walkable=(x)=>x<5||x>8;
 const r=moveDiscSwept(p,15,0,{canOccupy:walkable,maxStep:.65});
 assert.equal(r.blocked,true);
 assert.ok(p.x<5,p.x+' crossed forbidden gap');
});
test('high-speed world movement remains stable for equivalent substeps',()=>{
 const a=pos(0,0),b=pos(0,0);
 moveDiscSwept(a,20,10,{maxStep:.6});
 for(let i=0;i<20;i++)moveDiscSwept(b,1,.5,{maxStep:.6});
 assert.ok(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.z-b.z)<1e-8);
});
test('exact-center and overlapping collider penetrations resolve deterministically',()=>{
 const p=pos(5,0),b=[{x:5,z:0,r:3},{x:7,z:0,r:.8}];
 assert.equal(depenetrateDisc(p,.5,b),true);
 assert.equal(overlapsDisc(p.x,p.z,.5,b),false);
});
test('nonfinite positions fail closed instead of poisoning collision state',()=>{
 const p=pos(0,0);
 const r=moveDiscSwept(p,Number.NaN,4);
 assert.equal(r.blocked,true);
 assert.deepEqual(p,pos(0,0));
 assert.equal(overlapsDisc(Number.NaN,0,1,[]),true);
});
test('South Padre causeway deck supports vehicle progress but blocks bay shortcuts',()=>{
 const [a,b]=SOUTH_PADRE.route.slice(4,6),dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
 const cx=a.x+dx*.4,cz=a.z+dz*.4,nx=-dz/len,nz=dx/len;
 assert.equal(spiLandHeight(cx,cz),null);
 const road=pos(cx,cz),ok=moveDiscSwept(road,dx/len*8,dz/len*8,{canOccupy:(x,z)=>terrainHeight(x,z)>=-.4,maxStep:.8});
 assert.equal(ok.blocked,false);
 const shoulder=pos(cx+nx*10,cz+nz*10);
 const offRoad=moveDiscSwept(shoulder,nx*18,nz*18,{canOccupy:(x,z)=>terrainHeight(x,z)>=-.4,maxStep:.7});
 assert.equal(offRoad.blocked,true);
 assert.ok(Math.hypot(shoulder.x-cx,shoulder.z-cz)<17,'vehicle left raised causeway');
});
test('large boat hull checks nose and both sides, not just center',()=>{
 const water=(_x,z)=>z<10;
 assert.equal(boatHullCanTravel(0,0,0,20,water),true);
 assert.equal(boatHullCanTravel(0,6,0,20,water),false);
 assert.equal(boatHullCanTravel(0,0,0,75,(_x,z)=>z<15),false);
});
test('boat boarding allows water access but rejects elevated bridges and aircraft',()=>{
 const boat={type:'boat',g:{position:{x:1,y:0,z:2}}};
 const near={x:2,y:-1,z:3},overhead={x:2,y:25,z:3};
 assert.ok(vehicleBoardDistance(boat,near)<3);
 assert.equal(vehicleBoardDistance(boat,overhead),Infinity);
 assert.equal(vehicleBoardDistance({...boat,dayForge:true},overhead),Infinity);
});
test('disembark searches for solid ground outside obstacles',()=>{
 const result=chooseSafeExit({x:0,z:0,heading:0,radius:4,type:'car',
  groundAt:()=>4,surfaceAt:()=> 'stone',blocked:(_x,z)=>z>0});
 assert.ok(result&&result.z<=0);
 assert.equal(result.swimming,false);
});
test('boats and surfaced submarines can exit to water, cars cannot',()=>{
 const opts={x:0,z:0,groundAt:()=>-5,surfaceAt:()=> 'water'};
 assert.equal(chooseSafeExit({...opts,type:'car'}),null);
 assert.equal(chooseSafeExit({...opts,type:'boat'}).swimming,true);
 assert.equal(chooseSafeExit({...opts,type:'submarine'}).swimming,true);
});
test('crashed and flying spacecraft cannot exit as safely landed',()=>{
 assert.equal(spacecraftExitDecision({crashedBody:'earth',celestial:null,altitude:0,atmospheric:true}),'recover');
 assert.equal(spacecraftExitDecision({celestial:{crashedBody:'moon',landedBody:null}}),'recover');
 assert.equal(spacecraftExitDecision({celestial:{landedBody:'moon'}}),'moon');
 assert.equal(spacecraftExitDecision({celestial:null,atmospheric:true,altitude:0,verticalSpeed:0,horizontalSpeed:0}),'earth');
 assert.equal(spacecraftExitDecision({celestial:null,atmospheric:true,altitude:40,verticalSpeed:80}),'blocked');
});
test('crash recovery restores fuel, stability and thrust control',()=>{
 const craft={fuel:0,heat:1.5,autoThrottle:1,sp:80,crashedBody:'earth',pitch:.3,pitchRate:.4,yawRate:.5,verticalSpeed:-80,horizontalSpeed:25};
 resetSpacecraftDamage(craft);
 assert.equal(craft.fuel,1);
 for(const property of ['heat','autoThrottle','sp','pitch','pitchRate','yawRate','verticalSpeed','horizontalSpeed'])assert.equal(craft[property],0);
 assert.equal(craft.crashedBody,null);
});
test('gameplay paths use swept movement, safe exits and collision instrumentation',()=>{
 const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 for(const mode of ['foot','flight','car','boat','submarine','plane'])assert.ok(source.includes("trackedMove('"+mode+"'"),mode+' missing swept movement');
 assert.match(source,/boatHullCanTravel\(/);
 assert.match(source,/chooseSafeExit\(/);
 assert.match(source,/spacecraftExitDecision\(/);
 assert.match(source,/resetSpacecraftDamage\(/);
 assert.match(source,/landingGround=Math\.max\(0,tripleForge\.planeGroundHeight\(p\.x,p\.z,p\.y\)/);
 assert.match(source,/frameEvidence:/);
 assert.match(source,/collisions:\{blocked:/);
});
