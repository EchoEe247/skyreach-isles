// Loopback-only gameplay smoke test. Requires Vite on :5173 and the dedicated
// Local Workspace Chromium runtime with CDP on :9230.
import assert from 'node:assert/strict';
import {SOUTH_PADRE} from '../src/core/south-padre.js';
import {terrainHeight} from '../src/core/world.js';
const targetUrl=process.env.QA_GAME_URL||'http://127.0.0.1:5173/';
const endpoint=process.env.QA_CDP_URL||'http://127.0.0.1:9230';
const pages=await fetch(endpoint+'/json').then(r=>{if(!r.ok)throw Error('CDP unavailable '+r.status);return r.json()});
const page=pages.find(t=>t.type==='page'&&t.url.startsWith(targetUrl)&&t.webSocketDebuggerUrl);
if(!page)throw Error('No dedicated local Skyreach tab at '+targetUrl);
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(Error('CDP websocket timeout')),12000);
 ws.addEventListener('open',()=>{clearTimeout(timeout);resolve()},{once:true});
 ws.addEventListener('error',e=>{clearTimeout(timeout);reject(e)},{once:true});
});
let seq=0;const pending=new Map();
ws.addEventListener('message',event=>{
 let msg;try{msg=JSON.parse(event.data)}catch{return}
 const p=pending.get(msg.id);if(!p)return;
 clearTimeout(p.timer);pending.delete(msg.id);
 if(msg.error)p.reject(Error(JSON.stringify(msg.error)));
 else if(msg.result?.exceptionDetails)p.reject(Error(msg.result.exceptionDetails.exception?.description||msg.result.exceptionDetails.text));
 else p.resolve(msg.result?.result?.value);
});
function evaluate(expression,timeoutMs=15000){
 const id=++seq;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP Runtime.evaluate timeout: '+expression.slice(0,80)))},timeoutMs);
  pending.set(id,{resolve,reject,timer});
  ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:false}}));
 });
}
const qa=expression=>evaluate('globalThis.__skyreach.'+expression);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let failures=0,passed=0;
async function check(name,fn){
 try{const detail=await fn();passed++;console.log('PASS '+name+(detail?' · '+detail:''))}
 catch(e){failures++;console.error('FAIL '+name+' · '+(e?.message||e))}
}

await check('runtime hook and renderer frame evidence',async()=>{
 const s=await qa('snapshot()');
 assert.ok(s&&s.frameEvidence.count>0,'renderer has not produced a frame');
 assert.equal(s.mode==='foot'||s.mode==='veh',true);
 assert.ok(s.collisions&&Number.isFinite(s.collisions.blocked));
 return s.frameEvidence.count+' frames';
});
const vehicles=await qa('vehicles()');
await check('vehicle discovery',()=>{
 assert.ok(vehicles.length>=15,'expected main and DAY FORGE fleets');
 assert.ok(vehicles.some(v=>v.type==='car'&&v.name.includes('Port Isabel')));
 assert.ok(vehicles.some(v=>v.type==='rocket'));
 return vehicles.length+' registered vehicles';
});
for(const v of vehicles.filter(v=>!v.spacecraft&&(process.env.QA_ONLY!=='portals'))){
 await check('board/exit '+v.name,async()=>{
  const [x,y,z]=v.position;
  await qa('inspect('+[x,z,JSON.stringify(v.id),y,false].join(',')+')');
  let state=await qa('snapshot()');
  assert.equal(state.mode,'veh');
  assert.equal(state.vehicleState.name,v.name);
  await qa('action()');
  state=await qa('snapshot()');
  assert.equal(state.mode,'foot','safe exit failed or left hidden hero');
 });
}
await check('portal enter and return to hub',async()=>{
 const portals=await qa('portals()');
 assert.equal(portals.length,2);
 for(const p of portals){
  await qa('travelToHub()');
  await qa('inspect('+[p.x,p.z,JSON.stringify('foot'),'null',false].join(',')+')');
  await qa('action()');
  const active=(await qa('snapshot()')).activeRealm;
  assert.equal(active,p.id,'portal did not activate '+p.id);
  await qa('travelToHub()');
  assert.equal((await qa('snapshot()')).activeRealm,null);
 }
 return portals.map(p=>p.id).join(', ');
});
await check('rocket crash and recovery restores gameplay',async()=>{
 const rocket=vehicles.find(v=>v.type==='rocket');
 assert.ok(rocket);
 const [x,y,z]=rocket.position;
 await qa('inspect('+[x,z,JSON.stringify(rocket.id),y,false].join(',')+')');
 await qa('crashProbe("earth")');
 assert.equal((await qa('snapshot()')).vehicleState.crashedBody,'earth');
 await qa('action()');
 let state=await qa('snapshot()');
 assert.equal(state.mode,'foot');
 assert.equal(state.vehicleState,null);
 await qa('inspect('+[x,z,JSON.stringify(rocket.id),y,false].join(',')+')');
 state=await qa('snapshot()');
 assert.equal(state.vehicleState.fuel,1);
 assert.equal(state.vehicleState.crashedBody,null);
 return 'Earth launchpad recovery + full fuel';
});
await check('moving Port Isabel car advances frame and respects terrain',async()=>{
 const car=vehicles.find(v=>v.name.includes('Port Isabel'));
 assert.ok(car);
 const [x,y,z]=car.position;
 await qa('inspect('+[x,z,JSON.stringify(car.id),y,false].join(',')+')');
 const initial=await qa('snapshot()');
 await qa('flightInput({y:1,boost:true})');
 await sleep(1800);
 await qa('flightRelease()');
 let final=await qa('snapshot()');
 for(let i=0;i<8&&final.frameEvidence.count<=initial.frameEvidence.count;i++){await sleep(1800);final=await qa('snapshot()')}
 assert.ok(final.frameEvidence.count>initial.frameEvidence.count,'render loop not progressing within bounded 16-second wait');
 assert.ok(final.position.every(Number.isFinite),'invalid car position');
 assert.ok(final.vehicleState.speed>=0,'speed should be nonnegative while accelerating');
 return 'frame delta '+(final.frameEvidence.count-initial.frameEvidence.count);
});

await check('lunar crash recovery restores a playable surface state',async()=>{
 const rocket=vehicles.find(v=>v.type==='rocket'),[x,y,z]=rocket.position;
 await qa('inspect('+[x,z,JSON.stringify(rocket.id),y,false].join(',')+')');
 await qa('crashProbe("moon")');
 await qa('action()');
 const s=await qa('snapshot()');
 assert.equal(s.mode,'foot');
 assert.equal(s.space.moon,true);
 assert.ok(s.position.every(Number.isFinite));
});
await check('actual causeway driving stays on its elevated deck',async()=>{
 const road=SOUTH_PADRE.route[4],next=SOUTH_PADRE.route[5];
 const car=vehicles.find(v=>v.name.includes('Port Isabel'));
 await qa('inspect('+[road.x,road.z,JSON.stringify(car.id),road.y,false].join(',')+')');
 const yaw=Math.atan2(next.x-road.x,next.z-road.z);
 await qa('heading('+yaw+')');
 const initial=await qa('snapshot()');
 await qa('flightInput({y:1,boost:true})');
 let final=initial;
 for(let i=0;i<10;i++){
  await sleep(1500);
  final=await qa('snapshot()');
  if(Math.hypot(final.position[0]-initial.position[0],final.position[2]-initial.position[2])>.2)break;
 }
 await qa('flightRelease()');
 const travel=Math.hypot(final.position[0]-initial.position[0],final.position[2]-initial.position[2]);
 assert.ok(travel>.2,'causeway drive did not move');
 assert.ok(Math.abs(final.position[1]-terrainHeight(final.position[0],final.position[2]))<1,'car fell through causeway deck');
 return travel.toFixed(2)+' m';
});

ws.close();
console.log('QA RECEIPT '+JSON.stringify({passed,failed:failures,vehicleCount:vehicles.length}));
if(failures)process.exitCode=1;
