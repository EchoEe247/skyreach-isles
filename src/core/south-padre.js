// Mobile-friendly South Texas reconstruction. Horizontal distances are deliberately compressed for playability.
export const SOUTH_PADRE=Object.freeze({
 id:'south-padre-port-isabel',name:'South Padre Island & Port Isabel',
 destination:Object.freeze({id:'south-padre-island',name:'South Padre Island',shortName:'SPI',x:1690,z:0,icon:'☀',category:'TEXAS COAST · ISLAND',description:'South Padre Island beyond the Queen Isabella Memorial Causeway, with Padre Boulevard, south-city development, beaches, and a quieter north end.'}),
 portDestination:Object.freeze({id:'port-isabel-causeway',name:'Port Isabel · Causeway Start',shortName:'PORT ISABEL',x:1108,z:14,icon:'◆',category:'TEXAS COAST · DRIVE START',description:'Start the continuous drive here: board the parked sports car, follow the road onto the Queen Isabella Memorial Causeway, then continue onto South Padre Island.'}),
 portIsabel:Object.freeze({center:Object.freeze({x:1070,z:0}),radius:155,elevation:2.2}),
 island:Object.freeze({center:Object.freeze({x:1740,z:0}),length:470,width:94,elevation:2.5}),
 lighthouse:Object.freeze({x:1012,z:-55}),padreBlvd:Object.freeze({x:1590,z:0}),
 causeway:Object.freeze({peak:Object.freeze({x:1395,z:0}),peakHeight:23.8,realPeakFeet:78}),
 route:Object.freeze([{x:1145,z:0,name:'Port Isabel Road'},{x:1245,z:0,name:'West ramp'},{x:1395,z:0,name:'Causeway peak'},{x:1545,z:0,name:'East ramp'},{x:1630,z:0,name:'Padre Boulevard'}]),
 bayProbe:Object.freeze({x:1400,z:125})
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function routeY(x,z){
 const pts=SOUTH_PADRE.route;
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),px=a.x+dx*t,pz=a.z+dz*t;
  if(Math.hypot(x-px,z-pz)<13){const distance=Math.hypot(x-px,z-pz);let y=2.2;
   if(i===1)y=2.2+21.6*smooth(0,1,t);
   else if(i===2)y=23.8-21.6*smooth(0,1,t);
   return distance<6?y:y+(2.2-y)*smooth(6,13,distance);
  }
 }
 return null;
}
export function spiRouteHeight(x,z){return routeY(x,z)}
export function isSpiRoute(x,z){return routeY(x,z)!==null}

// Physical land only. This intentionally excludes the bridge deck so renderers can
// keep Laguna Madre visible beneath the elevated causeway.
export function spiLandHeight(x,z){
 const p=SOUTH_PADRE.portIsabel.center,dp=Math.hypot(x-p.x,z-p.z);
 if(dp<SOUTH_PADRE.portIsabel.radius)return SOUTH_PADRE.portIsabel.elevation;
 const island=SOUTH_PADRE.island,dx=x-island.center.x,dz=z-island.center.z;
 if(Math.abs(dx)<island.length/2&&Math.abs(dz)<island.width/2){
  const edge=Math.min(island.length/2-Math.abs(dx),island.width/2-Math.abs(dz));
  return edge<8?-1+3.5*smooth(0,8,edge):island.elevation;
 }
 return null;
}

export function spiTerrainHeight(x,z){
 const r=routeY(x,z);if(r!==null)return r;
 return spiLandHeight(x,z);
}
