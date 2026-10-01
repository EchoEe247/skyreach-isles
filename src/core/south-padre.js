// South Padre/Port Isabel gameplay contract aligned to the user-supplied GLB.
// The first integration used 0.08 horizontal scale with 0.9005 vertical scale, which
// made cars/player gigantic and buildings pencil-thin. Geometry is now 0.32 uniform;
// only the bridge gets a vertical override so its roadway peak still reads at ~23.8 m.
const GEO_SCALE=4;
const ORIGIN=Object.freeze({x:1072,z:0});
const expand=(x,z)=>Object.freeze({x:ORIGIN.x+(x-ORIGIN.x)*GEO_SCALE,z:ORIGIN.z+(z-ORIGIN.z)*GEO_SCALE});
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

export const SOUTH_PADRE=Object.freeze({
 id:'south-padre-port-isabel',
 name:'South Padre Island & Port Isabel',
 model:Object.freeze({
   path:'assets/regions/south-padre-island.glb',
   sourceSha256:'3b76f4ff571914e727ba34763642e3dec165a1d3cb18c12540773e1b3947b251',
   scale:Object.freeze({x:.32,y:.32,z:.32}),
   // Keeps the Port Isabel route origin fixed while increasing the model 4x horizontally.
   position:Object.freeze({x:2733.96125,y:0,z:120.4032}),
   bridgeYScale:2.8140625,
   sourceTriangles:724219,
   loadRadius:2200,
   visibilityRadius:22000
 }),
 destination:Object.freeze({
   id:'south-padre-island',name:'South Padre Island',shortName:'SPI',x:destination.x,z:destination.z,icon:'☀',
   category:'TEXAS COAST · ISLAND',
   description:'Drive across the Queen Isabella Memorial Causeway into the full-size-feeling South Padre environment, then follow Padre Boulevard north.'
 }),
 portDestination:Object.freeze({
   id:'port-isabel-causeway',name:'Port Isabel · Causeway Start',shortName:'PORT ISABEL',x:ORIGIN.x,z:ORIGIN.z,icon:'◆',
   category:'TEXAS COAST · DRIVE START',
   description:'Board the sports car in Port Isabel and drive continuously onto the Queen Isabella Memorial Causeway and South Padre Island.'
 }),
 portIsabel:Object.freeze({center:Object.freeze({x:ORIGIN.x,z:ORIGIN.z}),halfX:208,halfZ:192,elevation:.8}),
 lighthouse:Object.freeze(lighthouse),padreBlvd:Object.freeze(padreBlvd),
 causeway:Object.freeze({peak:Object.freeze({...peak}),peakHeight:23.8,realPeakFeet:78}),
 route:Object.freeze([
   routePoint(1072,0,.8,'Port Isabel Road'),
   routePoint(1119.5,3.1,5.9,'West approach'),
   routePoint(1167.5,-5.1,5.9,'Causeway west'),
   routePoint(1207.5,-13.8,14.8,'Causeway rise'),
   routePoint(1247.5,-23.1,23.8,'Causeway peak'),
   routePoint(1287.5,-32.5,19.5,'Causeway descent'),
   routePoint(1327.5,-41.6,6.9,'Causeway east'),
   routePoint(1367.5,-49.9,5.9,'East approach'),
   routePoint(1407.5,-55.9,5.2,'South Padre landing'),
   routePoint(1458,-107,2.8,'Padre Boulevard')
 ]),
 bayProbe:Object.freeze(bayProbe),
 shoreline:Object.freeze(baseShoreline.map(([z,c,h])=>Object.freeze([z*GEO_SCALE,ORIGIN.x+(c-ORIGIN.x)*GEO_SCALE,h*GEO_SCALE])))
});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

function routeY(x,z){
 const pts=SOUTH_PADRE.route;
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/l2,0,1),px=a.x+dx*t,pz=a.z+dz*t,d=Math.hypot(x-px,z-pz);
  if(d<24){
   const deck=a.y+(b.y-a.y)*smooth(0,1,t),ground=.8;
   return d<11?deck:deck+(ground-deck)*smooth(11,24,d);
  }
 }
 return null;
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
 const p=SOUTH_PADRE.portIsabel;
 const dx=Math.abs(x-p.center.x),dz=Math.abs(z-p.center.z);
 if(dx<p.halfX&&dz<p.halfZ){
  const edge=Math.min(p.halfX-dx,p.halfZ-dz);
  return edge<10?-.9+(p.elevation+.9)*smooth(0,10,edge):p.elevation;
 }
 const shore=shorelineAt(z);
 if(!shore)return null;
 const edge=shore.half-Math.abs(x-shore.center);
 if(edge<=0)return null;
 const elevation=.72+.12*Math.sin(z*.0015);
 return edge<14?-.9+(elevation+.9)*smooth(0,14,edge):elevation;
}

export function spiTerrainHeight(x,z){
 const r=routeY(x,z);if(r!==null)return r;
 return spiLandHeight(x,z);
}
