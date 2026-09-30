import {smoothstep} from './math.js';

// Stable coordinates are also the chart/navigation contract.
export const ISLANDS = [
  {id:'tideglass', name:'Tideglass Cove', x:720, z:350, radius:132, height:19,
    color:0x83b36c, sand:0xe9d7a4, kind:'cove',
    description:'A sheltered turquoise inlet, palms leaning over pale sand, and a weathered fishing jetty.'},
  {id:'ember', name:'Ember Ruins', x:470, z:-670, radius:112, height:27,
    color:0x8b9b61, sand:0xcac6aa, kind:'ruins',
    description:'Climb the old stone path to a broken observatory above the sea.'},
  {id:'veil', name:'Veilwater Island', x:-650, z:420, radius:125, height:32,
    color:0x628675, sand:0x969e97, kind:'falls',
    description:'A spring spills from a basalt terrace. Offshore, a sea arch frames the horizon.'}
];

export function islandHeight(island, x, z) {
  const u=x-island.x, v=z-island.z;
  const a=Math.atan2(v,u), r=Math.hypot(u,v);
  const edge=island.radius*(1+.07*Math.sin(a*3+island.x)+.045*Math.sin(a*5));
  const f=1-r/edge;
  if(f<=0) return -8;
  let h=-3+island.height*smoothstep(0, .85, f);
  h+=(Math.sin(u*.085)*Math.cos(v*.065)*1.4)*smoothstep(0,.4,f);
  if(island.kind==='cove') {
    const inlet=Math.exp(-((u-65)**2/3800+v*v/1600));
    h-=inlet*24;
  }
  if(island.kind==='falls') {
    // A narrow terrace makes a real lip for the waterfall at local x=-8.
    h-=13*smoothstep(-13,-5,u)*smoothstep(0,.45,f);
  }
  return h;
}

export function archipelagoHeight(x,z) {
  let h=-80;
  for(const island of ISLANDS) {
    if(Math.abs(x-island.x)>island.radius*1.15||Math.abs(z-island.z)>island.radius*1.15)continue;
    h=Math.max(h,islandHeight(island,x,z));
  }
  return h;
}
