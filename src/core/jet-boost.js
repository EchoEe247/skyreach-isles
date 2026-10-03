export const JET_BOOST_PROFILES=Object.freeze({
  car:Object.freeze({acceleration:180,maxSpeed:150,steerFactor:.55}),
  boat:Object.freeze({acceleration:130,maxSpeed:110,steerFactor:.62}),
  submarine:Object.freeze({acceleration:95,maxSpeed:75,steerFactor:.65}),
  plane:Object.freeze({acceleration:150,maxSpeed:240,steerFactor:.62})
});

export function jetBoostProfile(vehicle){
  if(!vehicle||vehicle.spacecraft)return null;
  return JET_BOOST_PROFILES[vehicle.type]||null;
}

export function jetBoostEligible(vehicle){
  return !!jetBoostProfile(vehicle);
}
