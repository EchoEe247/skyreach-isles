import * as T from 'three';
import {createRng} from '../core/math.js';
import {weatherAt,lightningAt,worldEventAt} from '../core/living-world.js';

function makeFerry(){
  const g=new T.Group(),hull=new T.Mesh(new T.BoxGeometry(2.4,.7,5.8),new T.MeshLambertMaterial({color:0xe9e2d2}));
  hull.position.y=.35;g.add(hull);
  const cabin=new T.Mesh(new T.BoxGeometry(1.7,.8,2.1),new T.MeshLambertMaterial({color:0x35586b}));
  cabin.position.set(0,1,-.65);g.add(cabin);
  const stripe=new T.Mesh(new T.BoxGeometry(2.45,.18,4.8),new T.MeshLambertMaterial({color:0xd95d48}));
  stripe.position.set(0,.55,.15);g.add(stripe);
  return g;
}

export function createLivingWorld(scene,{heightAt=()=>0,routes=[],eventPositions={}}={}){
  const random=createRng(260930);
  const count=260,positions=new Float32Array(count*3);
  for(let i=0;i<count;i++)positions.set([(random()-.5)*120,random()*76,(random()-.5)*120],i*3);
  const rainGeometry=new T.BufferGeometry();
  rainGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
  const rainMaterial=new T.PointsMaterial({color:0xcde8ff,size:.22,transparent:true,opacity:0,depthWrite:false});
  const rain=new T.Points(rainGeometry,rainMaterial);rain.visible=false;scene.add(rain);

  const marker=new T.Group();
  const markerMat=new T.MeshBasicMaterial({color:0xffb24a,transparent:true,opacity:.78,blending:T.AdditiveBlending,depthWrite:false,fog:false});
  const ring=new T.Mesh(new T.TorusGeometry(3.5,.18,6,28),markerMat);ring.rotation.x=Math.PI/2;ring.position.y=1.1;marker.add(ring);
  const column=new T.Mesh(new T.CylinderGeometry(.45,1.4,18,8,1,true),markerMat);column.position.y=9;marker.add(column);
  marker.visible=false;scene.add(marker);

  const cargo=new T.Group();
  for(let i=0;i<4;i++){const q=new T.Mesh(new T.BoxGeometry(1.5,1.2,1.35),new T.MeshLambertMaterial({color:i%2?0x8b623f:0xa8794c}));q.position.set((i%2)*1.6,(i>>1)*.28,(i>>1)*1.4);q.rotation.y=i*.35;cargo.add(q)}
  cargo.visible=false;scene.add(cargo);

  const rescue=makeFerry();rescue.scale.setScalar(.9);rescue.visible=false;scene.add(rescue);
  const flare=new T.PointLight(0xff6b3a,0,55,2);flare.position.set(0,3,0);rescue.add(flare);

  let resolvedEventId=null;
  const ferries=routes.slice(0,2).map((route,i)=>{
    const g=makeFerry();g.scale.setScalar(.8);scene.add(g);
    return {g,route,offset:i*.47,speed:.014+i*.003};
  });

  function eventPosition(event){
    const p=eventPositions[event?.id];
    return p||event||{x:0,z:0};
  }

  function update({time=0,dt=0,position={x:0,y:0,z:0},weatherOverride=null}={}){
    const weather=weatherOverride||weatherAt(time),lightning=lightningAt(time,weather);
    rain.visible=weather.rain>.04;
    rain.material.opacity=.12+.58*weather.rain;
    rain.position.set(position.x,Math.max(0,position.y-8),position.z);
    if(rain.visible){
      const p=rainGeometry.attributes.position;
      const fall=(24+weather.wind*25)*dt;
      for(let i=0;i<p.count;i++){
        let y=p.getY(i)-fall;
        if(y<-5)y+=82;
        p.setY(i,y);
      }
      p.needsUpdate=true;
    }

    ferries.forEach((f,i)=>{
      const route=f.route;if(!route||route.length<2){f.g.visible=false;return}
      f.g.visible=true;
      const legs=route.length-1,phase=((time*f.speed+f.offset)%2+2)%2;
      const u=phase<=1?phase:2-phase,total=u*legs,seg=Math.min(legs-1,Math.floor(total)),t=total-seg;
      const a=route[seg],b=route[seg+1],x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
      f.g.position.set(x,.12+Math.sin(time*1.5+i)*.08,z);
      f.g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)+(phase>1?Math.PI:0);
      f.g.rotation.z=Math.sin(time*1.2+i)*.025;
    });

    const eventBase=worldEventAt(time);
    if(!eventBase)resolvedEventId=null;
    const event=eventBase?{...eventBase,...eventPosition(eventBase)}:null,resolved=!!event&&resolvedEventId===event.id;
    cargo.visible=false;rescue.visible=false;marker.visible=!!event&&!resolved;
    if(event&&!resolved){
      const y=Math.max(.1,heightAt(event.x,event.z)+.25);
      marker.position.set(event.x,y,event.z);marker.rotation.y=time*.45;
      ring.rotation.z=time*.3;
      if(event.id==='drifting-cargo'){cargo.visible=true;cargo.position.set(event.x,y,event.z)}
      if(event.id==='stranded-boat'){rescue.visible=true;rescue.position.set(event.x,.15,event.z);rescue.rotation.y=.7;flare.intensity=1.8+Math.sin(time*6)*1.2}
      else flare.intensity=0;
    }else flare.intensity=0;
    return {weather,event,lightning,ferries:ferries.length,resolved};
  }

  const resolveEvent=id=>{if(id)resolvedEventId=id};
  return {update,resolveEvent,rain,marker,ferries};
}
