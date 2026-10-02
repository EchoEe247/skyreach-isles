// South Padre/Port Isabel gameplay contract aligned to the user-supplied GLB.
// Source GLB dimensions are meter-scale. 1.5 scene units represent one source meter relative to Nightweaver.
export const HUMAN_SCALE=1.5;
const GEO_SCALE=18.75;
const BRIDGE_Y_SCALE=23.8/26.43;
const LIGHTHOUSE_Y_SCALE=21.95/25.83;
const BASE_ORIGIN=Object.freeze({x:1072,z:0});
const ORIGIN=Object.freeze({x:2200,z:0});
const expand=(x,z)=>Object.freeze({x:ORIGIN.x+(x-BASE_ORIGIN.x)*GEO_SCALE,z:ORIGIN.z+(z-BASE_ORIGIN.z)*GEO_SCALE});
const routePoint=(x,z,y,name)=>Object.freeze({...expand(x,z),y,name});
const baseShoreline=[
 [-65.9,1477.2,76.0],[-219.6,1444.0,51.0],[-373.3,1409.1,50.6],[-527.0,1390.6,47.4],
 [-680.8,1372.5,51.6],[-834.5,1360.4,52.3],[-988.2,1351.9,53.2],[-1141.9,1328.2,51.3],
 [-1295.6,1309.6,50.3],[-1449.3,1277.5,50.9],[-1603.0,1245.0,49.9],[-1756.8,1207.9,55.2],
 [-1910.5,1176.1,53.8],[-2064.2,1141.9,58.5],[-2217.9,1107.1,55.0],[-2371.6,1076.0,55.3],
 [-2525.3,1029.6,53.0],[-2679.0,992.0,52.6],[-2832.8,944.2,56.2],[-2986.5,902.7,55.4],
 [-3140.2,861.7,59.6],[-3293.9,821.4,56.1],[-3447.6,780.5,57.1],[-3601.3,739.6,52.0],
 [-3755.0,699.7,53.4],[-3908.8,658.2,51.8],[-4062.5,633.4,53.0],[-4216.2,596.7,55.6],
 [-4369.9,583.2,51.4]
];
const destination=expand(1458,-107),lighthouse=expand(1105.9,-8),padreBlvd=expand(1409,-373),peak=expand(1247.5,-23.1),bayProbe=expand(1260,90);
const carSpawn=Object.freeze({x:2157.757568359375,z:16.341095581054674,y:1.8082950711250305});

export const SOUTH_PADRE=Object.freeze({
 id:'south-padre-port-isabel',
 name:'South Padre Island & Port Isabel',
 model:Object.freeze({
   path:'assets/regions/south-padre-island.glb',
   sourceSha256:'3b76f4ff571914e727ba34763642e3dec165a1d3cb18c12540773e1b3947b251',
   scale:Object.freeze({x:HUMAN_SCALE,y:HUMAN_SCALE,z:HUMAN_SCALE}),
   // Preserve source geometry while offsetting full-scale Port Isabel east of the main island.
   position:Object.freeze({x:9990.443359375,y:0,z:564.39}),
   bridgeYScale:BRIDGE_Y_SCALE,
   lighthouseYScale:LIGHTHOUSE_Y_SCALE,
   sourceTriangles:724219,
   loadRadius:3500,
   visibilityRadius:18000
 }),
 destination:Object.freeze({
   id:'south-padre-island',name:'South Padre Island',shortName:'SPI',x:destination.x,z:destination.z,icon:'☀',
   category:'TEXAS COAST · ISLAND',
   description:'Drive across the Queen Isabella Memorial Causeway into the full-size-feeling South Padre environment, then follow Padre Boulevard north.'
 }),
 portDestination:Object.freeze({
   id:'port-isabel-causeway',name:'Port Isabel · Causeway Start',shortName:'PORT ISABEL',x:carSpawn.x,z:carSpawn.z,icon:'◆',
   category:'TEXAS COAST · DRIVE START',
   description:'Your Port Isabel sports car is parked here. Board it and drive continuously onto the Queen Isabella Memorial Causeway and South Padre Island.'
 }),
 portIsabel:Object.freeze({center:Object.freeze({x:ORIGIN.x,z:ORIGIN.z}),halfX:850,halfZ:780,elevation:1.75}),
 carSpawn,
 lighthouse:Object.freeze(lighthouse),padreBlvd:Object.freeze(padreBlvd),
 causeway:Object.freeze({peak:Object.freeze({...peak}),peakHeight:23.8*HUMAN_SCALE,realPeakMeters:23.8,realPeakFeet:78}),
 route:Object.freeze([
   Object.freeze({x:carSpawn.x,z:carSpawn.z,y:carSpawn.y,name:'Port Isabel Road'}),
   routePoint(1119.5,3.1,5.55*HUMAN_SCALE*BRIDGE_Y_SCALE,'West approach'),
   routePoint(1167.5,-5.1,6.53*HUMAN_SCALE*BRIDGE_Y_SCALE,'Causeway west'),
   routePoint(1207.5,-13.8,16.61*HUMAN_SCALE*BRIDGE_Y_SCALE,'Causeway rise'),
   routePoint(1247.5,-23.1,26.43*HUMAN_SCALE*BRIDGE_Y_SCALE,'Causeway peak'),
   routePoint(1287.5,-32.5,21.65*HUMAN_SCALE*BRIDGE_Y_SCALE,'Causeway descent'),
   routePoint(1327.5,-41.6,7.62*HUMAN_SCALE*BRIDGE_Y_SCALE,'Causeway east'),
   routePoint(1367.5,-49.9,6.53*HUMAN_SCALE*BRIDGE_Y_SCALE,'East approach'),
   routePoint(1407.5,-55.9,2.03*HUMAN_SCALE*BRIDGE_Y_SCALE,'South Padre landing'),
   routePoint(1458,-107,1.85*HUMAN_SCALE,'Padre Boulevard')
 ]),
 bayProbe:Object.freeze(bayProbe),
 shoreline:Object.freeze(baseShoreline.map(([z,c,h])=>Object.freeze([ORIGIN.z+(z-BASE_ORIGIN.z)*GEO_SCALE,ORIGIN.x+(c-BASE_ORIGIN.x)*GEO_SCALE,h*GEO_SCALE])))
});

export function spiProximity(position){
 const shorelineDistances=SOUTH_PADRE.shoreline.map(([z,c])=>Math.hypot(position.x-c,position.z-z));
 const distance=Math.min(Math.hypot(position.x-ORIGIN.x,position.z-ORIGIN.z),Math.hypot(position.x-destination.x,position.z-destination.z),...SOUTH_PADRE.route.map(p=>Math.hypot(position.x-p.x,position.z-p.z)),...shorelineDistances);
 const outsideMainIsland=Math.hypot(position.x,position.z)>500;
 return Object.freeze({distance,near:outsideMainIsland&&distance<SOUTH_PADRE.model.visibilityRadius,visibilityRadius:SOUTH_PADRE.model.visibilityRadius,clearFogNear:12000,clearFogFar:79000,weatherFogNear:350,weatherFogFar:6500});
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

function routeY(x,z){
 const pts=SOUTH_PADRE.route;
 let best=null;
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/l2,0,1),px=a.x+dx*t,pz=a.z+dz*t,d=Math.hypot(x-px,z-pz);
  if(!best||d<best.d)best={a,b,t,d};
 }
 if(!best||best.d>=26)return null;
 const deck=best.a.y+(best.b.y-best.a.y)*smooth(0,1,best.t);
 if(best.d<15.5)return deck;
 // Keep the physical bridge footprint aligned with the visible ~31-unit deck.
 // Over land, a short verge blends into terrain; over open bay, no invisible
 // drivable shoulder is created outside the causeway.
 const land=spiLandHeight(x,z);
 if(land===null)return null;
 return deck+(land-deck)*smooth(15.5,26,best.d);
}

function shorelineAt(z){
 const rows=SOUTH_PADRE.shoreline;
 if(z>rows[0][0]||z<rows.at(-1)[0])return null;
 for(let i=0;i<rows.length-1;i++){
  const a=rows[i],b=rows[i+1];
  if(z<=a[0]&&z>=b[0]){
   const t=(a[0]-z)/(a[0]-b[0]);
   return {center:a[1]+(b[1]-a[1])*t,half:a[2]+(b[2]-a[2])*t};
  }
 }
 return null;
}

export function spiRouteHeight(x,z){return routeY(x,z)}
export function isSpiRoute(x,z){return routeY(x,z)!==null}

export function spiLandHeight(x,z){
 const p=SOUTH_PADRE.portIsabel,dx=(x-p.center.x)/p.halfX,dz=(z-p.center.z)/p.halfZ;
 const angle=Math.atan2(dz,dx),radius=Math.hypot(dx,dz),edgeScale=.98+.025*Math.sin(angle*3+.6)+.015*Math.cos(angle*5-1.1);
 if(radius<edgeScale){
  const edge=(edgeScale-radius)*Math.min(p.halfX,p.halfZ);
  return edge<14?-.9+(p.elevation+.9)*smooth(0,14,edge):p.elevation;
 }
 const shore=shorelineAt(z);
 if(!shore)return null;
 const edge=shore.half-Math.abs(x-shore.center);
 if(edge<=0)return null;
 const elevation=2.15+.28*Math.sin(z*.0008);
 return edge<22?-.9+(elevation+.9)*smooth(0,22,edge):elevation;
}

export function spiTerrainHeight(x,z){
 const r=routeY(x,z);if(r!==null)return r;
 return spiLandHeight(x,z);
}
