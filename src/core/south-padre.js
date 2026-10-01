// South Padre/Port Isabel gameplay contract aligned to the user-supplied GLB.
// Horizontal geography is compressed 12.5x; vertical bridge/building scale stays close to real height.
export const SOUTH_PADRE=Object.freeze({
 id:'south-padre-port-isabel',
 name:'South Padre Island & Port Isabel',
 model:Object.freeze({
   path:'assets/regions/south-padre-island.glb',
   sourceSha256:'3b76f4ff571914e727ba34763642e3dec165a1d3cb18c12540773e1b3947b251',
   scale:Object.freeze({x:.08,y:.9005,z:.08}),
   position:Object.freeze({x:1487.4903125,y:0,z:30.1008}),
   sourceTriangles:724219,
   loadRadius:760,
   visibilityRadius:5600
 }),
 destination:Object.freeze({
   id:'south-padre-island',name:'South Padre Island',shortName:'SPI',x:1458,z:-107,icon:'☀',
   category:'TEXAS COAST · ISLAND',
   description:'Drive across the Queen Isabella Memorial Causeway into the uploaded South Padre Island environment, then follow Padre Boulevard north.'
 }),
 portDestination:Object.freeze({
   id:'port-isabel-causeway',name:'Port Isabel · Causeway Start',shortName:'PORT ISABEL',x:1075,z:0,icon:'◆',
   category:'TEXAS COAST · DRIVE START',
   description:'Board the sports car in Port Isabel and drive continuously onto the Queen Isabella Memorial Causeway and South Padre Island.'
 }),
 portIsabel:Object.freeze({center:Object.freeze({x:1070,z:0}),halfX:52,halfZ:48,elevation:.8}),
 lighthouse:Object.freeze({x:1105.9,z:-8}),
 padreBlvd:Object.freeze({x:1409,z:-373}),
 causeway:Object.freeze({peak:Object.freeze({x:1247.5,z:-23.1}),peakHeight:23.8,realPeakFeet:78}),
 // Road/deck centerline sampled from the uploaded model's Queen Isabella asphalt.
 route:Object.freeze([
   Object.freeze({x:1072,z:0,y:.8,name:'Port Isabel Road'}),
   Object.freeze({x:1119.5,z:3.1,y:5.9,name:'West approach'}),
   Object.freeze({x:1167.5,z:-5.1,y:5.9,name:'Causeway west'}),
   Object.freeze({x:1207.5,z:-13.8,y:14.8,name:'Causeway rise'}),
   Object.freeze({x:1247.5,z:-23.1,y:23.8,name:'Causeway peak'}),
   Object.freeze({x:1287.5,z:-32.5,y:19.5,name:'Causeway descent'}),
   Object.freeze({x:1327.5,z:-41.6,y:6.9,name:'Causeway east'}),
   Object.freeze({x:1367.5,z:-49.9,y:5.9,name:'East approach'}),
   Object.freeze({x:1407.5,z:-55.9,y:5.2,name:'South Padre landing'}),
   Object.freeze({x:1458,z:-107,y:2.8,name:'Padre Boulevard'})
 ]),
 bayProbe:Object.freeze({x:1260,z:90}),
 // Curved barrier-island shoreline sampled from the uploaded terrain mesh.
 // Each row is [worldZ, centerX, halfWidth].
 shoreline:Object.freeze([
  [-65.9,1477.2,76.0],[-219.6,1444.0,51.0],[-373.3,1409.1,50.6],[-527.0,1390.6,47.4],
  [-680.8,1372.5,51.6],[-834.5,1360.4,52.3],[-988.2,1351.9,53.2],[-1141.9,1328.2,51.3],
  [-1295.6,1309.6,50.3],[-1449.3,1277.5,50.9],[-1603.0,1245.0,49.9],[-1756.8,1207.9,55.2],
  [-1910.5,1176.1,53.8],[-2064.2,1141.9,58.5],[-2217.9,1107.1,55.0],[-2371.6,1076.0,55.3],
  [-2525.3,1029.6,53.0],[-2679.0,992.0,52.6],[-2832.8,944.2,56.2],[-2986.5,902.7,55.4],
  [-3140.2,861.7,59.6],[-3293.9,821.4,56.1],[-3447.6,780.5,57.1],[-3601.3,739.6,52.0],
  [-3755.0,699.7,53.4],[-3908.8,658.2,51.8],[-4062.5,633.4,53.0],[-4216.2,596.7,55.6],
  [-4369.9,583.2,51.4]
 ])
});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

function routeY(x,z){
 const pts=SOUTH_PADRE.route;
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/l2,0,1),px=a.x+dx*t,pz=a.z+dz*t,d=Math.hypot(x-px,z-pz);
  if(d<14){
   const deck=a.y+(b.y-a.y)*smooth(0,1,t),ground=1.0;
   return d<7?deck:deck+(ground-deck)*smooth(7,14,d);
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
  return edge<6?-.9+(p.elevation+.9)*smooth(0,6,edge):p.elevation;
 }
 const shore=shorelineAt(z);
 if(!shore)return null;
 const edge=shore.half-Math.abs(x-shore.center);
 if(edge<=0)return null;
 const elevation=1.15+.18*Math.sin(z*.006);
 return edge<7?-.9+(elevation+.9)*smooth(0,7,edge):elevation;
}

export function spiTerrainHeight(x,z){
 const r=routeY(x,z);if(r!==null)return r;
 return spiLandHeight(x,z);
}
