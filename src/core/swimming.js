export const SWIM_SURFACE_Y=-1.05;

export function isSwimmingSurface(surface,onMoon=false){
  return !onMoon&&surface==='water';
}

export function swimSpeed(boosting=false,stroking=false){
  if(stroking)return 6.6;
  return boosting?5.8:4.2;
}

export function boatExitRadius(vehicle){
  if(vehicle?.type!=='boat'||!vehicle?.dayForge)return 4;
  return Math.max(8,Math.min(48,(vehicle.boardRadius??12)*.92));
}

export function vehicleBoardDistance(vehicle,position){
  const p=vehicle?.g?.position;
  if(!p||!position)return Infinity;
  if(vehicle.type==='boat'){
    const maxRise=vehicle.dayForge?14:4;
    if(position.y-p.y>maxRise||position.y-p.y< -3)return Infinity;
    return Math.hypot(p.x-position.x,p.z-position.z);
  }
  return Math.hypot(p.x-position.x,p.y-position.y,p.z-position.z);
}
