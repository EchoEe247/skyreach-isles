export function autoNavPermission(craft,target='moon'){
 if(!craft?.spacecraft)return {ok:false,reason:'Board a spacecraft to use AUTO NAV.'};
 if(craft.crashedBody||craft.celestial?.crashedBody)return {ok:false,reason:'Recover the spacecraft after impact before engaging AUTO NAV.'};
 if(!Number.isFinite(craft.fuel)||craft.fuel<=.005)return {ok:false,reason:'No usable fuel. Recover at a launch site or lunar base.'};
 if(craft.celestial?.landedBody===target)return {ok:false,reason:'Already landed at the selected destination. Select the other target.'};
 if(target==='earth'&&!craft.celestial&&(craft.altitude||0)<1000)return {ok:false,reason:'Already on Earth. Launch toward the Moon first.'};
 return {ok:true,reason:''};
}
export function autoNavPhase(craft,target){
 if(craft?.crashedBody||craft?.celestial?.crashedBody)return 'RECOVERY';
 if(!craft?.celestial)return target==='moon'?'ASCENT':'ATMOSPHERIC FLIGHT';
 const altitude=target==='moon'?craft.celestial.moonAltitude:craft.celestial.earthAltitude;
 if(craft.celestial.landedBody===target)return 'LANDED';
 if(altitude<10000)return 'FINAL APPROACH';
 if(altitude<500000)return 'BRAKING';
 return 'TRANSIT';
}
// A landed spacecraft receives a safe-service reset only at an actual,
// low-speed base landing, never on a crash or a mid-flight staging transition.
export function landedBaseService(craft,body,previousBody=null){
 if(!craft?.spacecraft||!['earth','moon'].includes(body)||body===previousBody)return false;
 if(craft.crashedBody||craft.celestial?.crashedBody)return false;
 const landing=craft.celestial?.landedBody||craft.landedBody;
 if(landing!==body)return false;
 craft.fuel=1;craft.heat=0;craft.autoThrottle=0;
 return true;
}

export function warpDisplay(requested,effective,{atmospheric=false}={}){
 const selected=[1,10,50,100,400].includes(requested)?requested:1;
 const active=atmospheric?1:Math.max(1,Math.min(selected,Math.round(Number(effective)||1)));
 const limited=active<selected;
 return {
  requested:selected,
  effective:active,
  limited,
  label:limited?'TIME ×'+selected+' (×'+active+')':'TIME ×'+selected,
  reason:atmospheric?'High warp begins after the 100 km space transition.':
    limited?'Time warp is automatically limited near a planet or landing.':'Requested warp is active.'
 };
}

// Flight state is not a Three.js object; visual effects live on the vehicle's
// scene graph. Rockets without optional FX must remain safe at the Karman handoff.
export function getVehicleVisualFx(vehicle){
 return vehicle?.g?.userData?.fx??null;
}
