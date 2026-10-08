const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(a,b,t)=>a+(b-a)*clamp(t,0,1);
export const VEHICLE_TUNING=Object.freeze({
 car:Object.freeze({accel:30,reverseAccel:15,brake:57,coast:7,drag:.004,turn:1.45,steerResponse:5,maxReverse:12,roll:.055}),
 boat:Object.freeze({accel:16,reverseAccel:6,brake:17,coast:2.2,drag:.0025,turn:.88,steerResponse:2.4,maxReverse:7,roll:.042}),
 submarine:Object.freeze({accel:14,reverseAccel:8,brake:18,coast:2.6,drag:.003,turn:.75,steerResponse:2.3,maxReverse:9,roll:.035}),
 plane:Object.freeze({accel:22,brake:26,coast:7,drag:.00075,turn:.9,steerResponse:3,maxReverse:0,roll:.26})
});
export function updateVehicleKinematics(state,{type,dt,throttle=0,steer=0,boost=false,jet=false,jetProfile=null,tailwind=1,max=40,airborne=false}={}){
 const t=VEHICLE_TUNING[type]||VEHICLE_TUNING.car;
 const d=clamp(Number(dt)||0,0,.05),input=clamp(throttle,-1,1),s=clamp(steer,-1,1);
 const velocity=Number.isFinite(state.sp)?state.sp:0;
 const response=1-Math.exp(-t.steerResponse*d);
 state.steer=approach(state.steer||0,s,response);
 const accelerating=input>0,reverse=input<0&&velocity<=1;
 let acceleration=0;
 if(accelerating)acceleration=t.accel*(boost?1.55:1)+((jet&&jetProfile?.acceleration)||0);
 else if(input<0)acceleration=reverse?-t.reverseAccel:-t.brake;
 else if(velocity!==0)acceleration=-Math.sign(velocity)*t.coast;
 const friction=t.drag*velocity*Math.abs(velocity);
 let next=velocity+(acceleration-friction)*d*tailwind;
 if(input===0&&Math.sign(next)!==Math.sign(velocity))next=0;
 const maxSpeed=(jet&&jetProfile?.maxSpeed)||max;
 state.sp=clamp(next,-t.maxReverse,maxSpeed*Math.max(.5,tailwind));
 const speedFraction=clamp(Math.abs(state.sp)/Math.max(1,maxSpeed),0,1);
 const lowSpeedSteer=type==='plane'?(airborne?1:.45):(.17+.83*clamp(Math.abs(state.sp)/9,0,1));
 const jetSteer=jet?(jetProfile?.steerFactor||.6):1;
 const yawRate=t.turn*lowSpeedSteer*(type==='car'?1-.45*speedFraction:1)*jetSteer*state.steer;
 state.h=(Number.isFinite(state.h)?state.h:0)-yawRate*d*Math.sign(state.sp||1);
 return {speed:state.sp,steer:state.steer,yawRate,rollTarget:clamp(-yawRate*Math.abs(state.sp)*t.roll/18,-.32,.32)};
}
export function updatePlaneAttitude(state,{dt,pitchInput=0,steer=0,airborne=false,groundY=0,maxClimb=.34,maxDive=-.27}={}){
 const d=clamp(dt,0,.05),speed=Math.max(0,state.sp||0);
 const desired=airborne?clamp(pitchInput*.4,maxDive,maxClimb):speed>=24?clamp(pitchInput*.22,0,.22):0;
 state.pt=approach(state.pt||0,desired,1-Math.exp(-d*(airborne?1.7:2.6)));
 state.rl=approach(state.rl||0,airborne?-steer*.65:0,1-Math.exp(-d*3));
 const oldAltitude=state.y??groundY;
 const lift=airborne?Math.sin(state.pt)*speed:Math.max(0,Math.sin(state.pt)*speed-1.5);
 state.y=clamp(oldAltitude+lift*d,groundY+1.3,600);
 return {airborne:state.y-groundY>2.5,pitch:state.pt,roll:state.rl,verticalSpeed:lift};
}
export function smoothRide(current,target,dt,rate=5){return current+(target-current)*(1-Math.exp(-Math.max(0,dt)*rate))}
export function dynamicCameraProfile({type='foot',speed=0,boost=false,baseDistance=9}={}){
 const velocity=clamp(Math.abs(speed)/80,0,1),spacecraft=type==='rocket'||type==='alien';
 const extra=spacecraft?0:(type==='plane'?baseDistance*.65:baseDistance*.45)*velocity;
 return {distance:baseDistance+extra,followRate:spacecraft?4:type==='plane'?4.2:5.8,
   fov:spacecraft?72+velocity*7:65+velocity*10+(boost?4:0),
   heightOffset:type==='boat'?1.3:type==='submarine'?.8:0,
   lookAhead:spacecraft?0:(type==='plane'?11:6)*velocity};
}
