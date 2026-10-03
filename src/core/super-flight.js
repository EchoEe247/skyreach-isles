export const SUPER_FLIGHT=Object.freeze({
  cruiseSpeed:30,
  boostSpeed:70,
  verticalSpeed:24,
  boostVerticalSpeed:34,
  groundClearance:2.2,
  maxAltitude:420
});

export function superFlightEligible({mode='foot',onMoon=false,transformed=false,swimming=false,active=false}={}){
  return mode==='foot'&&!onMoon&&!transformed&&(active||!swimming);
}

export function superFlightVelocity({stickX=0,stickY=0,yaw=0,climb=false,dive=false,boost=false}={}){
  let dx=Math.sin(yaw)*stickY-Math.cos(yaw)*stickX;
  let dz=Math.cos(yaw)*stickY+Math.sin(yaw)*stickX;
  const magnitude=Math.hypot(dx,dz);
  const input=Math.min(1,magnitude);
  if(magnitude>.0001){dx/=magnitude;dz/=magnitude}
  const speed=(boost?SUPER_FLIGHT.boostSpeed:SUPER_FLIGHT.cruiseSpeed)*input;
  const vertical=((climb?1:0)-(dive?1:0))*(boost?SUPER_FLIGHT.boostVerticalSpeed:SUPER_FLIGHT.verticalSpeed);
  return {
    x:dx*speed,
    y:vertical,
    z:dz*speed,
    horizontalSpeed:speed,
    totalSpeed:Math.hypot(speed,vertical),
    targetYaw:magnitude>.05?Math.atan2(dx,dz):null
  };
}

export function clampSuperFlightY(y,groundY){
  return Math.min(SUPER_FLIGHT.maxAltitude,Math.max(groundY+SUPER_FLIGHT.groundClearance,y));
}
