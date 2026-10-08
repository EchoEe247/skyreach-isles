const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const JOURNEY_STOPS=Object.freeze([
 Object.freeze({id:'causeway',title:'Cross the causeway',hint:'Drive the Port Isabel sports car across Queen Isabella Causeway to Padre Boulevard',target:'south-padre-island'}),
 Object.freeze({id:'takeoff',title:'Take to the skies',hint:'Launch an aircraft from the LAX runway',target:'lax-airport'}),
 Object.freeze({id:'nexus',title:'Reach Nexus Isle',hint:'Explore the two portal districts on Nexus Isle',target:'nexus-isle'}),
 Object.freeze({id:'moon',title:'Reach the Moon',hint:'Pilot the SLS or an alien spacecraft to the lunar surface',target:'nasa-launch-complex'}),
 Object.freeze({id:'earth',title:'Return home',hint:'Bring your spacecraft back to Earth safely',target:'nasa-launch-complex'})
]);
export function advanceJourney(current,{position,mode,vehicle,onMoon=false,celestialLanded=null,realm=null,causeway,airport,nexus}={}){
 const index=clamp(Math.floor(Number(current)||0),0,JOURNEY_STOPS.length);
 if(index>=JOURNEY_STOPS.length||!position)return index;
 const distance=(p)=>p?Math.hypot(position.x-p.x,position.z-p.z):Infinity;
 let completed=false;
 switch(JOURNEY_STOPS[index].id){
  case 'causeway': completed=vehicle==='car'&&mode==='veh'&&distance(causeway)<100;break;
  case 'takeoff':completed=vehicle==='plane'&&mode==='veh'&&position.y-(airport?.y||0)>22&&distance(airport)<420;break;
  case 'nexus':completed=!!realm||distance(nexus)<75;break;
  case 'moon':completed=onMoon||celestialLanded==='moon';break;
  case 'earth':completed=!onMoon&&celestialLanded==='earth';break;
 }
 return completed?index+1:index;
}
export function journeyProgress(stage){
 const index=clamp(Math.floor(Number(stage)||0),0,JOURNEY_STOPS.length);
 return {index,total:JOURNEY_STOPS.length,complete:index>=JOURNEY_STOPS.length,stop:JOURNEY_STOPS[index]||null};
}
