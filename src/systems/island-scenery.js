import * as T from 'three';
import {ISLANDS, islandHeight} from '../core/archipelago.js';
import {terrainHeight} from '../core/world.js';
import {createRng} from '../core/math.js';

export function createIslandScenery(scene, obstacles) {
  const random=createRng(93026);
  const stone=new T.MeshLambertMaterial({color:0x999788,flatShading:true});
  const darkStone=new T.MeshLambertMaterial({color:0x46545a,flatShading:true});
  const wood=new T.MeshLambertMaterial({color:0x87735a});
  const pale=new T.MeshLambertMaterial({color:0xcfcbb5,flatShading:true});
  const foamUniforms={time:{value:0}};
  const foamMaterial=new T.ShaderMaterial({
    uniforms:foamUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float time;
    void main(){float pulse=.5+.5*sin(time*1.4+vUv.x*58.);float edge=pow(sin(vUv.y*3.14159),2.);
    float broken=smoothstep(.15,.7,.5+.5*sin(vUv.x*211.+sin(vUv.x*37.)*3.));
    gl_FragColor=vec4(.83,.96,.94,edge*(.16+.32*pulse)*broken);}`
  });
  const add=(geometry,material,x,y,z,scale)=>{
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(x,y,z); if(scale)mesh.scale.set(...scale);
    scene.add(mesh);return mesh;
  };
  const rockGeometry=new T.DodecahedronGeometry(1,0);
  const palms=[],rocks=[],pathPoints=[];
  const dummy=new T.Object3D();
  const ground=(i,x,z)=>islandHeight(i,x,z);

  function coastline(cx,cz,radius,height) {
    const points=[];
    for(let n=0;n<=192;n++){
      const a=n/192*Math.PI*2;
      let outer=radius*1.2,inner=0;
      // Find the first shore from the sea (also follows the open cove).
      for(let r=outer;r>=0;r-=2){
        if(height(cx+Math.cos(a)*r,cz+Math.sin(a)*r)>0){inner=r;outer=r+2;break}
      }
      for(let k=0;k<8;k++){const r=(inner+outer)/2;if(height(cx+Math.cos(a)*r,cz+Math.sin(a)*r)>0)inner=r;else outer=r}
      points.push({a,r:(inner+outer)/2});
    }
    const positions=[],uv=[],indices=[];
    points.forEach(({a,r},n)=>{
      for(const d of [1.2,5.2]){positions.push(cx+Math.cos(a)*(r+d),.12,cz+Math.sin(a)*(r+d));uv.push(n/192,d===1.2?0:1)}
      if(n<192){const b=n*2;indices.push(b,b+1,b+2,b+1,b+3,b+2)}
    });
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    scene.add(new T.Mesh(g,foamMaterial));
  }

  for(const island of ISLANDS) {
    const size=island.radius*2.35, geometry=new T.PlaneGeometry(size,size,76,76);
    geometry.rotateX(-Math.PI/2);
    const p=geometry.attributes.position,colors=[];
    const green=new T.Color(island.color),sand=new T.Color(island.sand),rock=new T.Color(0x667479);
    for(let n=0;n<p.count;n++){
      const x=p.getX(n)+island.x,z=p.getZ(n)+island.z,h=ground(island,x,z);
      p.setXYZ(n,x,h,z);
      const slope=Math.abs(ground(island,x+1,z)-ground(island,x-1,z))+Math.abs(ground(island,x,z+1)-ground(island,x,z-1));
      const c=(h<2?sand:slope>2.2?rock:green).clone();
      c.multiplyScalar(.93+random()*.13);colors.push(c.r,c.g,c.b);
    }
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,new T.MeshLambertMaterial({vertexColors:true}));mesh.receiveShadow=true;scene.add(mesh);
    coastline(island.x,island.z,island.radius,(x,z)=>ground(island,x,z));
    if(island.kind!=='nexus'){
      for(let n=0;n<95;n++){
        const a=random()*Math.PI*2,r=Math.sqrt(random())*island.radius;
        const x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r,h=ground(island,x,z);
        if(h<1||h>island.height-4)continue;
        if(island.kind==='cove'&&h<13)palms.push({x,z,y:h,s:.8+random()*.6,a});
        else rocks.push({x,z,y:h,s:.6+random()*1.8,a});
      }
      // A walkable approach from the south shore to the island's centre.
      for(let n=0;n<40;n++){
        const z=island.z+island.radius*.82*(1-n/39),x=island.x+Math.sin(n*.16)*5;
        const h=ground(island,x,z);if(h>1.4)pathPoints.push({x,y:h+.055,z});
      }
    }
  }
  coastline(0,0,380,terrainHeight);

  const rockMesh=new T.InstancedMesh(rockGeometry,stone,rocks.length);
  rocks.forEach((p,n)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.s,p.s*.6,p.s*.85);dummy.rotation.set(.1,p.a,.15);dummy.updateMatrix();rockMesh.setMatrixAt(n,dummy.matrix)});
  scene.add(rockMesh);
  // Palms share two instanced draw calls, including their bent trunks.
  const trunks=new T.InstancedMesh(new T.CylinderGeometry(.22,.38,1,6),wood,palms.length*3);
  const leafGeometry=new T.ConeGeometry(1,1,4);leafGeometry.translate(0,.5,0);
  const leaves=new T.InstancedMesh(leafGeometry,new T.MeshLambertMaterial({color:0x367f55,side:T.DoubleSide}),palms.length*6);
  palms.forEach((p,n)=>{
    for(let k=0;k<3;k++){
      dummy.position.set(p.x+Math.sin(p.a)*k*k*.23,p.y+(k+.5)*2*p.s,p.z+Math.cos(p.a)*k*k*.23);
      dummy.scale.set(p.s,2.2*p.s,p.s);dummy.rotation.set(Math.cos(p.a)*.13,0,-Math.sin(p.a)*.13);dummy.updateMatrix();trunks.setMatrixAt(n*3+k,dummy.matrix);
    }
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3+p.a;
      dummy.position.set(p.x+Math.sin(p.a)*1.3,p.y+6*p.s,p.z+Math.cos(p.a)*1.3);
      dummy.scale.set(.75*p.s,4.6*p.s,.18*p.s);dummy.rotation.set(Math.cos(a)*1.8,a,Math.sin(a)*1.8);dummy.updateMatrix();leaves.setMatrixAt(n*6+k,dummy.matrix);
    }
  });scene.add(trunks,leaves);
  const path=new T.InstancedMesh(new T.CylinderGeometry(1.15,1.2,.14,6),pale,pathPoints.length);
  pathPoints.forEach((p,n)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(1,1,.7);dummy.rotation.set(0,n*.7,0);dummy.updateMatrix();path.setMatrixAt(n,dummy.matrix)});scene.add(path);

  // Broken observatory: an open, accessible ring of columns and fallen masonry.
  const ruin=ISLANDS[1],cy=terrainHeight(ruin.x,ruin.z);
  add(new T.CylinderGeometry(12,13,1.2,24),stone,ruin.x,cy-.3,ruin.z);
  const ring=new T.Mesh(new T.TorusGeometry(9,.28,6,48),new T.MeshBasicMaterial({color:0xc9b780}));
  ring.rotation.x=-Math.PI/2;ring.position.set(ruin.x,cy+.34,ruin.z);scene.add(ring);
  for(let n=0;n<9;n++){
    const a=n/10*Math.PI*2,x=ruin.x+Math.sin(a)*10,z=ruin.z+Math.cos(a)*10,h=n%3===0?3.2:7;
    add(new T.CylinderGeometry(.7,.88,h,8),pale,x,cy+h/2,z);
    add(new T.BoxGeometry(2.1,.6,2.1),stone,x,cy+h,z);
    obstacles.push({x,z,r:.85});
    if(n<5){const block=add(new T.BoxGeometry(6,.65,1.6),pale,ruin.x+Math.sin(a+.3)*10,cy+7.6,ruin.z+Math.cos(a+.3)*10);block.rotation.y=a+.3}
  }
  for(let n=0;n<7;n++){
    const a=n*2.4,r=15+random()*9;
    const x=ruin.x+Math.cos(a)*r,z=ruin.z+Math.sin(a)*r;
    const block=add(new T.CylinderGeometry(.65,.7,3,8),stone,x,terrainHeight(x,z)+.6,z);
    block.rotation.z=Math.PI/2;block.rotation.y=a;
  }
  // Navigation landmark on the plinth; no extra collectible checklist.
  const dial=add(new T.TorusGeometry(2.4,.14,6,40),new T.MeshPhongMaterial({color:0xc9a761,shininess:60}),ruin.x,cy+2,ruin.z);
  dial.rotation.x=.6;
  add(new T.CylinderGeometry(.6,.9,1.5,8),stone,ruin.x,cy+1,ruin.z);

  // Fishing jetty is placed from the actual cove shore, not a guessed height.
  const cove=ISLANDS[0];let shore=cove.x;
  while(terrainHeight(shore,cove.z)>0&&shore<cove.x+150)shore+=1;
  const jetty={x:shore+5,z:cove.z,y:.9,halfX:14,halfZ:2.2};
  add(new T.BoxGeometry(28,.24,4.4),wood,jetty.x,.8,jetty.z);
  for(let n=-12;n<=12;n+=4)for(const side of [-1,1]){
    add(new T.CylinderGeometry(.18,.22,4,6),wood,jetty.x+n,-.4,jetty.z+side*1.9);
  }
  for(let n=0;n<3;n++){
    const crate=add(new T.BoxGeometry(1.2,1.2,1.2),wood,shore-3-n*1.4,1.5,cove.z+1);
    crate.rotation.y=n*.2;
  }

  // Basalt sea arch outside Veilwater: open passage wide enough for the boat.
  const falls=ISLANDS[2],ax=falls.x-148,az=falls.z+15;
  for(const side of [-1,1]){
    add(new T.DodecahedronGeometry(1,1),darkStone,ax,8,az+side*16,[8,15,7]);
  }
  add(new T.DodecahedronGeometry(1,1),darkStone,ax,21,az,[8,7,23]);


  // A terrain-conforming cascade with soft, irregular edges and a grounded pool.
  const streamPositions=[],streamUvs=[],streamIndices=[],rows=80,columns=8;
  for(let n=0;n<=rows;n++){
    const t=n/rows,x=falls.x-25+t*42,centre=falls.z+Math.sin(t*7)*.45;
    const halfWidth=2.25+Math.sin(t*11)*.28;
    for(let j=0;j<=columns;j++){
      const u=j/columns,z=centre+(u*2-1)*halfWidth;
      streamPositions.push(x,terrainHeight(x,z)+.09,z);streamUvs.push(u,t);
      if(n<rows&&j<columns){const v=n*(columns+1)+j;streamIndices.push(v,v+columns+1,v+1,v+1,v+columns+1,v+columns+2)}
    }
  }
  const waterfallUniforms={time:{value:0},daylight:{value:1}};
  const waterfallMat=new T.ShaderMaterial({uniforms:waterfallUniforms,transparent:true,side:T.DoubleSide,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float time;uniform float daylight;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 flow=vec2(vUv.x*24.,vUv.y*14.-time*1.9);
        float n=noise(flow)*.65+noise(flow*2.3)*.35;
        float ribbons=smoothstep(.43,.8,n);
        float irregular=.045*noise(vec2(vUv.y*25.,time*.45));
        float edge=smoothstep(irregular,.16+irregular,vUv.x)*smoothstep(irregular,.16+irregular,1.-vUv.x);
        edge*=smoothstep(0.,.08,vUv.y)*smoothstep(0.,.12,1.-vUv.y);
        vec3 colour=mix(vec3(.26,.53,.57),vec3(.81,.9,.91),ribbons);
        colour*=.52+.48*daylight;
        gl_FragColor=vec4(colour,edge*(.5+ribbons*.35));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const streamG=new T.BufferGeometry();streamG.setAttribute('position',new T.Float32BufferAttribute(streamPositions,3));streamG.setAttribute('uv',new T.Float32BufferAttribute(streamUvs,2));streamG.setIndex(streamIndices);streamG.computeVertexNormals();scene.add(new T.Mesh(streamG,waterfallMat));

  // A shallow puddle follows the same terrain triangles, avoiding a floating disc.
  const poolX=falls.x+13,poolG=new T.CircleGeometry(5.5,40,0,Math.PI*2);
  poolG.rotateX(-Math.PI/2);
  const pp=poolG.attributes.position;
  for(let n=0;n<pp.count;n++){const x=pp.getX(n)+poolX,z=pp.getZ(n)+falls.z;pp.setXYZ(n,x,terrainHeight(x,z)+.065,z)}
  poolG.computeVertexNormals();
  const pool=new T.Mesh(poolG,new T.MeshPhongMaterial({color:0x4e969f,transparent:true,opacity:.42,shininess:80,depthWrite:false}));scene.add(pool);
  const mistCanvas=document.createElement('canvas');mistCanvas.width=mistCanvas.height=64;
  const mistContext=mistCanvas.getContext('2d'),gradient=mistContext.createRadialGradient(32,32,1,32,32,31);
  gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.35,'rgba(255,255,255,.35)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  mistContext.fillStyle=gradient;mistContext.fillRect(0,0,64,64);
  const mistTexture=new T.CanvasTexture(mistCanvas);
  const sprayPositions=new Float32Array(48*3);
  const sprayG=new T.BufferGeometry();sprayG.setAttribute('position',new T.BufferAttribute(sprayPositions,3));
  const spray=new T.Points(sprayG,new T.PointsMaterial({map:mistTexture,color:0xcce0e3,size:1.3,transparent:true,opacity:.22,depthWrite:false}));scene.add(spray);

  // Wet boulders break up the cascade's base and its silhouette.
  for(let n=0;n<12;n++){
    const x=falls.x-9+(n%4)*6,z=falls.z+(n%2?1:-1)*(4.2+random()*2.4);
    add(rockGeometry,darkStone,x,terrainHeight(x,z)+.3,z,[1+random(),.7+random(),1+random()]);
  }

  // Small dolphin pod, on a wholly ocean-side route near Tideglass.
  const dolphins=[];
  const dolphinMat=new T.MeshLambertMaterial({color:0x617e8c});
  for(let n=0;n<3;n++){
    const g=new T.Group();
    const body=new T.Mesh(new T.SphereGeometry(1,12,8),dolphinMat);body.scale.set(.45,.45,1.65);g.add(body);
    const nose=new T.Mesh(new T.SphereGeometry(1,8,6),dolphinMat);nose.scale.set(.2,.17,.65);nose.position.set(0,-.02,1.65);g.add(nose);
    const fin=new T.Mesh(new T.ConeGeometry(.45,.95,3),dolphinMat);fin.scale.z=.5;fin.position.set(0,.55,-.15);g.add(fin);
    for(const s of [-1,1]){const fluke=new T.Mesh(new T.SphereGeometry(1,6,4),dolphinMat);fluke.scale.set(.65,.08,.3);fluke.position.set(s*.43,0,-1.55);fluke.rotation.z=s*.2;g.add(fluke)}
    scene.add(g);dolphins.push(g);
  }
  // Near-field fireflies: one draw call; invisible in daylight.
  const flyData=new Float32Array(72*3),flyG=new T.BufferGeometry();flyG.setAttribute('position',new T.BufferAttribute(flyData,3));
  const flyMat=new T.PointsMaterial({map:mistTexture,color:0xd8ffc4,size:.13,transparent:true,opacity:0,depthWrite:false});
  const flies=new T.Points(flyG,flyMat);scene.add(flies);

  // Bounded wake pool; the foam stays behind instead of following the hull.
  const wake=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xe2f6f1,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}),64);
  wake.frustumCulled=false;const wakeData=Array.from({length:64},()=>({life:0,x:0,z:0,a:0}));let wakeIndex=0,wakeClock=0;scene.add(wake);

  return {
    jetty,
    surfaceHeight(x,z){if(Math.hypot(x-ruin.x,z-ruin.z)<12)return Math.max(terrainHeight(x,z),cy+.3);return Math.abs(x-jetty.x)<jetty.halfX&&Math.abs(z-jetty.z)<jetty.halfZ?Math.max(terrainHeight(x,z),jetty.y):terrainHeight(x,z)},
    update({time,dt,daylight,position,boat,speed,heading,quality}){
      foamUniforms.time.value=time;waterfallUniforms.time.value=time;waterfallUniforms.daylight.value=daylight;spray.material.opacity=.12+.10*daylight;
      const nearFalls=Math.hypot(position.x-falls.x,position.z-falls.z)<260;
      spray.visible=nearFalls;
      if(nearFalls){for(let n=0;n<48;n++){const t=(time*.7+n/48)%1;sprayPositions[n*3]=falls.x-3+Math.sin(n*5.7)*t*5;sprayPositions[n*3+1]=terrainHeight(falls.x-3,falls.z)+.25+Math.sin(t*Math.PI)*1.6;sprayPositions[n*3+2]=falls.z+Math.cos(n*3)*t*4}sprayG.attributes.position.needsUpdate=true}
      dolphins.forEach((g,n)=>{
        const a=time*.095+n*.1,leap=Math.max(0,Math.sin(time*1.6-n*.8));
        g.position.set(cove.x+205+Math.cos(a)*40+n*3,-.8+leap*2.8,cove.z+Math.sin(a)*72+n*4);
        g.rotation.set(-Math.cos(time*1.6-n*.8)*leap*.55,Math.atan2(-Math.sin(a)*40,Math.cos(a)*72),0);
      });
      flies.visible=daylight<.3&&quality!=='low'&&terrainHeight(position.x,position.z)>1;
      if(flies.visible){
        flyMat.opacity=(.3-daylight)*2;
        for(let n=0;n<72;n++){const a=n*2.399;const x=position.x+Math.cos(a)*(5+n%22),z=position.z+Math.sin(a)*(5+n%22);flyData[n*3]=x+Math.sin(time+n)*.7;flyData[n*3+1]=Math.max(0,terrainHeight(x,z))+1.5+Math.sin(time*.7+n)*.8;flyData[n*3+2]=z}flyG.attributes.position.needsUpdate=true;
      }
      wakeClock+=dt;
      if(boat&&Math.abs(speed)>3&&wakeClock>.07){
        wakeClock=0;
        for(const side of [-1,1]){
          Object.assign(wakeData[wakeIndex++%64],{life:1,x:position.x-Math.sin(heading)*4+Math.cos(heading)*side,z:position.z-Math.cos(heading)*4-Math.sin(heading)*side,a:heading+side*.32});
        }
      }
      wakeData.forEach((w,n)=>{
        w.life=Math.max(0,w.life-dt*.24);const s=w.life>0?(1-w.life)*5+1:0;
        dummy.position.set(w.x,.16,w.z);dummy.rotation.set(-Math.PI/2,0,-w.a);dummy.scale.set(s*w.life,s*2,1);dummy.updateMatrix();wake.setMatrixAt(n,dummy.matrix);
      });wake.instanceMatrix.needsUpdate=true;
    }
  };
}
