// Curated compositions in world coordinates. Keep navigation corridors deliberately empty.
const p=(asset,x,z,height,yaw=0,extra={})=>({asset,x,z,height,yaw,...extra});
const nature=n=>'environment/nature/'+n;
const urban=n=>'environment/urban/'+n;
const ruin=n=>'environment/ruins/'+n;
export const ENVIRONMENT_REGIONS=[
 {id:'home',x:0,z:0,radius:150,items:[
  ...[[-10,9],[10,-9],[-10,-9]].map(([x,z])=>p(urban('Bench'),x,z,1.25,Math.atan2(-x,-z))),
  ...[-42,-27,27,43].flatMap(z=>[p(urban('StreetLights'),5.5,z,5.8),p(urban('FireHydrant'),-5.3,z+2,1)]),
  p(urban('TownSign'),6,52,2.8,Math.PI),
  ...[[-58,18],[-60,-10],[20,61],[57,18],[57,-22],[-22,-60]].flatMap(([x,z],i)=>[
   p(nature('CommonTree_1'),x,z,7+i%3, i),
   p(nature('Bush_Common_Flowers'),x+3,z+2,1.2,i+.7),
   p(nature('Flower_3_Group'),x-2,z+1,.6,i)]),
  p(urban('Crate_Wooden'),-13,-10,1.1,.15),
 ]},
 {id:'launch',x:-65,z:-40,radius:60,items:[
  ...[-13,-7,0,7,13].map(z=>p(urban('PlasticBarrier'),-83,-40+z,1.2,Math.PI/2)),
  ...[-13,-6,7,14].map(z=>p(urban('TrafficCone_1'),-47,-40+z,.85)),
  p(urban('StreetLights'),-79,-58,8,Math.PI/2),
  p(urban('StreetLights'),-49,-58,8,-Math.PI/2),
  p(urban('Pipes'),-85,-59,1.5,.3),
  p(urban('Pallet'),-82,-63,.35,0),
  p(urban('Crate_Wooden'),-82,-63,1.3,0,{offset:.35}),
  p(urban('TownSign'),-47,-20,2.7,Math.PI),
 ]},
 {id:'tideglass',x:720,z:350,radius:145,items:[
  ...[[-46,-24],[-29,-38],[-12,-52],[-58,10],[-34,28],[5,52],[24,46]].flatMap(([u,v],i)=>[
   p(nature('TwistedTree_1'),720+u,350+v,6+i%3,i*.9),
   p(nature('Bush_Common_Flowers'),724+u,352+v,1.1,i),
   p(nature('Flower_3_Group'),717+u,351+v,.65,i)]),
  ...[[-66,-18],[-56,42],[29,58],[42,-50]].map(([u,v],i)=>p(nature('Rock_Medium_1'),720+u,350+v,1.7,i,{solid:true})),
  p(urban('Bench'),717,370,1.25,Math.PI/2),
  p(urban('Crate_Wooden'),737,371,1.1,.2),
  p(urban('Pallet'),739,373,.25,.2),
 ]},
 {id:'ember',x:470,z:-670,radius:125,items:[
  // Arrival gateway flanks the southern path, with a clear central opening.
  p(ruin('Arch'),474.6,-607,8,0,{arch:true}),
  p(ruin('Column_Broken2'),459,-610,3.8,.2,{solid:true}),
  p(ruin('Column_Broken'),481,-605,2.1,.8,{solid:true}),
  // East settlement: a ruined court open towards the approach.
  ...[[488,-638,0],[494,-638,0],[497,-644,Math.PI/2],[497,-650,Math.PI/2]].map(([x,z,a],i)=>p(ruin('Wall_Modular'),x,z,4.5-i*.5,a,{wall:true})),
  p(ruin('Arch'),485,-648,6.5,Math.PI/2,{arch:true}),
  p(ruin('Column'),489,-655,5,0,{solid:true}),
  p(ruin('Column_Broken2'),496,-657,2.8,.6,{solid:true}),
  p(ruin('WallRocks'),488,-639,1.4,Math.PI/2),
  p(ruin('Column_Broken'),491,-650,1.5,1.2),
  // West reading court: low enclosing fragments and a sea-facing opening.
  p(ruin('Wall_Modular'),440,-651,3.7,Math.PI/2,{wall:true}),
  p(ruin('Wall_Modular'),440,-657,2.7,Math.PI/2,{wall:true}),
  p(ruin('Wall_Modular'),447,-662,3.4,0,{wall:true}),
  p(ruin('Column_Broken2'),450,-649,3.4,.4,{solid:true}),
  p(ruin('Column_Broken'),444,-654,1.4,2),
  p(ruin('WallRocks'),442,-660,1.2,0),
  // Summit perimeter: fragments frame, never replace, the original observatory.
  p(ruin('Column_Broken2'),449,-685,3.2,.3,{solid:true}),
  p(ruin('Wall_Modular'),488,-687,2.8,.4,{wall:true}),
  p(ruin('Column_Broken'),485,-691,1.4,.9),
  ...[[-25,47],[26,20],[-32,-8],[16,-30],[-44,20]].map(([u,v],i)=>p(nature('Rock_Medium_1'),470+u,-670+v,1.7,i,{solid:true})),
  ...[[-18,46],[28,24],[-34,-10],[18,-29],[-29,23]].map(([u,v],i)=>p(nature('Grass_Common_Short'),470+u,-670+v,.65,i)),
 ]},
 {id:'veil',x:-650,z:420,radius:140,items:[
  // Leave the east-west cascade strip and the southern stone path open.
  ...[[-55,-31],[-42,-45],[-25,-37],[-7,-47],[15,-40],[33,-27],[46,-6],[45,18],[28,37],[-18,40],[-38,26],[-55,10]].flatMap(([u,v],i)=>[
   p(nature(i%3?'CommonTree_1':'TwistedTree_1'),-650+u,420+v,8+i%3,i*.8,{solid:true}),
   p(nature('Fern_1'),-646+u,422+v,1.3,i),
   p(nature('Bush_Common_Flowers'),-653+u,418+v,1.3,i),
   p(nature('Grass_Common_Short'),-650+u,424+v,.75,i)]),
  ...[[-23,-9],[-14,10],[0,-10],[12,10],[23,-8]].flatMap(([u,v],i)=>[
   p(nature('Fern_1'),-650+u,420+v,1.4,i),
   p(nature('Rock_Medium_1'),-647+u,422+v,1.5,i)]),
 ]}
];
export const WILDLIFE=[
 {species:'ShibaInu',region:'home',x:-12,z:12,height:.85,radius:1.2,phase:0},
 {species:'ShibaInu',region:'tideglass',x:714,z:374,height:.85,radius:2.2,phase:1.7},
 {species:'Deer',region:'veil',x:-679,z:446,height:1.8,radius:3,phase:2.4},
 {species:'Deer',region:'veil',x:-682,z:438,height:1.55,radius:2.5,phase:4.2},
 {species:'Fox',region:'veil',x:-615,z:395,height:.75,radius:2,phase:.8},
 {species:'Fox',region:'ember',x:435,z:-645,height:.75,radius:1.8,phase:3.5},
];
