export function overlapsDisc(x,z,radius,colliders=[]){
 if(!Number.isFinite(x)||!Number.isFinite(z))return true;
 return colliders.some(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)&&Number.isFinite(b.r)&&Math.hypot(x-b.x,z-b.z)<radius+b.r-1e-6);
}
export function depenetrateDisc(position,radius,colliders=[],maxPasses=8){
 let moved=false;
 for(let pass=0;pass<maxPasses;pass++){
  let again=false;
  for(const b of colliders){
   const dx=position.x-b.x,dz=position.z-b.z,d=Math.hypot(dx,dz),min=radius+b.r;
   if(d>=min-1e-6)continue;
   position.x=b.x+(d>1e-8?dx/d:1)*min;
   position.z=b.z+(d>1e-8?dz/d:0)*min;
   moved=again=true;
  }
  if(!again)break;
 }
 return moved;
}

export function moveDiscSwept(position,dx,dz,{radius=0,colliders=[],canOccupy=()=>true,extraResolve=null,maxStep=1}={}){
 if(!Number.isFinite(dx)||!Number.isFinite(dz)||!Number.isFinite(position?.x)||!Number.isFinite(position?.z))return {moved:false,blocked:true,steps:0};
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/Math.max(.25,maxStep))),sx=dx/steps,sz=dz/steps;
 let moved=false,blocked=false;
 const attempt=(ax,az)=>{
  if(!ax&&!az)return true;
  const nx=position.x+ax,nz=position.z+az;
  if(!canOccupy(nx,nz)||overlapsDisc(nx,nz,radius,colliders))return false;
  const oldX=position.x,oldZ=position.z;
  position.x=nx;position.z=nz;
  if(extraResolve)extraResolve(position);
  if(!Number.isFinite(position.x)||!Number.isFinite(position.z)||!canOccupy(position.x,position.z)||overlapsDisc(position.x,position.z,radius,colliders)){
   position.x=oldX;position.z=oldZ;return false;
  }
  moved=true;return true;
 };
 for(let i=0;i<steps;i++){
  if(attempt(sx,sz))continue;
  blocked=true;
  if(Math.abs(sx)>=Math.abs(sz)){attempt(sx,0);attempt(0,sz)}
  else{attempt(0,sz);attempt(sx,0)}
 }
 return {moved,blocked,steps};
}
