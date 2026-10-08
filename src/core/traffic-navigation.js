// A bounded, deterministic navigation planner for low-speed town traffic.
// Runs at world construction, never inside the animation frame.
const neighbors=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const len=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function minHeap(){
 const q=[];
 return {
  get size(){return q.length},
  push(n){q.push(n);let i=q.length-1;while(i){const j=(i-1)>>1;if(q[j].f<=n.f)break;q[i]=q[j];i=j}q[i]=n},
  pop(){if(!q.length)return null;const result=q[0],last=q.pop();if(!q.length)return result;let i=0;while(true){let j=i*2+1;if(j>=q.length)break;if(j+1<q.length&&q[j+1].f<q[j].f)j++;if(q[j].f>=last.f)break;q[i]=q[j];i=j}q[i]=last;return result}
 };
}
export function segmentPassable(a,b,canTravel,step=1){
 const distance=len(a,b),count=Math.max(1,Math.ceil(distance/Math.max(.25,step)));
 for(let i=0;i<=count;i++){const t=i/count;if(!canTravel(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false}
 return true;
}
export function planTrafficLeg(start,end,canTravel,{step=3,extent=90,maxExplored=18000}={}){
 const n=Math.floor(extent*2/step)+1,toIndex=(x,z)=>z*n+x,toPoint=(i)=>({x:-extent+i%n*step,z:-extent+Math.floor(i/n)*step});
 const nearest=(p)=>{
  const x=Math.max(0,Math.min(n-1,Math.round((p.x+extent)/step))),z=Math.max(0,Math.min(n-1,Math.round((p.z+extent)/step)));
  for(let radius=0;radius<15;radius++)for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
   const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=n||zz>=n)continue;
   const at=toPoint(toIndex(xx,zz));if(canTravel(at.x,at.z))return toIndex(xx,zz);
  }
  return -1;
 };
 const first=nearest(start),last=nearest(end);
 if(first<0||last<0)return null;
 if(first===last)return [toPoint(first)];
 const size=n*n,g=new Float64Array(size).fill(Infinity),prev=new Int32Array(size).fill(-1),closed=new Uint8Array(size),open=minHeap();
 g[first]=0;open.push({i:first,f:len(toPoint(first),toPoint(last))});let visits=0;
 while(open.size&&visits++<maxExplored){
  const {i}=open.pop();if(closed[i])continue;closed[i]=1;if(i===last)break;
  const a=toPoint(i),ix=i%n,iz=Math.floor(i/n);
  for(const [dx,dz] of neighbors){
   const x=ix+dx,z=iz+dz;if(x<0||z<0||x>=n||z>=n)continue;
   const j=toIndex(x,z);if(closed[j])continue;
   const b=toPoint(j);
   if(!segmentPassable(a,b,canTravel,step*.5))continue;
   const dist=Math.hypot(dx,dz)*step,trial=g[i]+dist;
   if(trial>=g[j])continue;
   g[j]=trial;prev[j]=i;open.push({i:j,f:trial+len(b,toPoint(last))});
  }
 }
 if(prev[last]<0)return null;
 const points=[];let at=last;while(at!==first&&at>=0){points.push(toPoint(at));at=prev[at]}
 points.push(toPoint(first));points.reverse();
 // Only remove a corner if the exact swept path remains clear.
 const smooth=[points[0]];
 for(let i=0;i<points.length-1;){
  let next=i+1;
  for(let j=points.length-1;j>i+1;j--){if(segmentPassable(points[i],points[j],canTravel,.85)){next=j;break}}
  smooth.push(points[next]);i=next;
 }
 return smooth;
}
export function buildTrafficLoop(guides,canTravel,config={}){
 if(guides.length<3)return {points:[],valid:false,unreachable:guides.length};
 const paths=[],broken=[];
 for(let i=0;i<guides.length;i++){
  const part=planTrafficLeg(guides[i],guides[(i+1)%guides.length],canTravel,config);
  if(!part||part.length<2){broken.push(i);continue}
  for(let j=0;j<part.length-1;j++)paths.push(part[j]);
 }
 if(broken.length)return {points:[],valid:false,unreachable:broken.length};
 // Consecutive segments must be connected even when anchors snap to grid.
 const points=paths.filter((p,i)=>!i||len(paths[i-1],p)>.25);
 return {points,valid:points.length>=4,unreachable:0};
}
