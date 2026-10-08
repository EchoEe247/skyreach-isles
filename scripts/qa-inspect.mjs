// Bounded development-only QA inspector for the dedicated localhost CDP game tab.
// Run against Vite on port 5173 and local Chromium CDP on port 9230.
const targetUrl=process.env.QA_GAME_URL||'http://127.0.0.1:5173/';
const endpoint=process.env.QA_CDP_URL||'http://127.0.0.1:9230';
let page;
for(let attempt=0;attempt<12&&!page;attempt++){
 const pages=await fetch(endpoint+'/json').then(r=>{if(!r.ok)throw Error('CDP unavailable '+r.status);return r.json()});
 page=pages.find(t=>t.type==='page'&&t.url.startsWith(targetUrl)&&t.webSocketDebuggerUrl);
 if(!page)await new Promise(resolve=>setTimeout(resolve,600));
}
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
const expression=process.argv[2]||'globalThis.__skyreach.snapshot()';
const result=await evaluate(expression,18000);
console.log(JSON.stringify(result,null,2));ws.close();
