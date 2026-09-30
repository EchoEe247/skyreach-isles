import {terrainHeight} from '../core/world.js';

export function createAtlas({places,vehicles,destinations=[],onSelect,onOpen}) {
  const toggle=document.createElement('button');
  toggle.id='atlas-toggle';toggle.className='g';toggle.type='button';toggle.textContent='Explore';
  toggle.setAttribute('aria-label','Open island chart');document.getElementById('ui').append(toggle);
  const panel=document.createElement('section');panel.id='atlas-panel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Chart of Skyreach');
  panel.innerHTML=`<div class="atlas-head"><div><small>SKYREACH • FIELD NOTES</small><h2>Beyond the horizon</h2></div><button type="button" class="atlas-close" aria-label="Close chart">×</button></div>
    <div class="atlas-body"><div class="atlas-map-wrap"><canvas id="atlas-chart" width="520" height="520" aria-label="Island map; choose a destination below"></canvas><div class="atlas-legend">N ↑ &nbsp; · &nbsp; Gold: your course &nbsp; · &nbsp; White: you</div></div><div id="atlas-places"></div></div>
    <div class="atlas-footer">Choose a shore. Follow your curiosity.<button type="button" id="atlas-clear">Clear course</button></div>`;
  document.body.append(panel);
  const base=document.createElement('canvas');base.width=base.height=440;
  const b=base.getContext('2d'),im=b.createImageData(440,440),extent=2200;
  for(let n=0;n<440*440;n++){
    const x=((n%440)/440-.5)*extent,z=((n/440|0)/440-.5)*extent,h=terrainHeight(x,z);
    const c=h<0?[17,48+Math.max(0,12+h)*2,65+Math.max(0,12+h)*2]:h<2?[195,189,146]:[66+h*.9,103+h*.7,91+h*.3];
    im.data.set([...c.map(Math.round),255],n*4);
  }b.putImageData(im,0,0);
  const entries=document.getElementById('atlas-places');
  const listed=[...places.slice(5),...places.slice(0,5)];
  const destinationCards=destinations.map((p,n)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='atlas-place atlas-destination';btn.dataset.destination=p.id||p.name;
    btn.innerHTML='<span class="atlas-number">'+(p.icon||'◆')+'</span><span><strong>'+p.name+'</strong><small>'+(p.description||'Set a course to this destination.')+'</small><em>'+(p.category||'DESTINATION')+'</em></span>';
    btn.onclick=()=>{onSelect(p);close();};entries.append(btn);return btn;
  });
  const cards=listed.map(p=>{
    const n=places.indexOf(p);
    const btn=document.createElement('button');btn.type='button';btn.className='atlas-place';
    const isNew=n>=5;
    btn.innerHTML='<span class="atlas-number">'+String(n+1).padStart(2,'0')+'</span><span><strong>'+p.name+'</strong><small>'+(p.description||'A familiar landmark on the home island.')+'</small><em>'+(isNew?'OFFSHORE · LAND & EXPLORE':'HOME ISLAND')+'</em></span>';
    btn.onclick=()=>{onSelect(p);close();};entries.append(btn);return btn;
  });
  const boatBtn=document.createElement('button');boatBtn.type='button';boatBtn.className='atlas-place atlas-boat';
  boatBtn.innerHTML='<span class="atlas-number">↗</span><span><strong>Find my speedboat</strong><small>Plot a course to wherever you last left it.</small></span>';
  boatBtn.onclick=()=>{const boat=vehicles.find(v=>v.type==='boat');onSelect({name:'Your speedboat',get x(){return boat.g.position.x},get z(){return boat.g.position.z}});close()};entries.prepend(boatBtn);
  function close(){panel.hidden=true;onOpen(false);toggle.focus()}
  function open(){panel.hidden=false;onOpen(true);cards.forEach((c,n)=>c.classList.toggle('visited',!!listed[n].on));destinationCards.forEach((c,n)=>c.classList.toggle('selected',destinations[n]===lastTarget));draw(lastPosition,lastTarget);panel.querySelector('.atlas-close').focus()}
  toggle.onclick=()=>panel.hidden?open():close();
  panel.querySelector('.atlas-close').onclick=close;
  panel.querySelector('#atlas-clear').onclick=()=>{onSelect(null);close()};
  addEventListener('keydown',e=>{
    if(e.code==='Escape'&&!panel.hidden){e.preventDefault();close()}
    if(e.code==='KeyM'&&!e.repeat){e.preventDefault();panel.hidden?open():close()}
    if(e.code==='Tab'&&!panel.hidden){
      const buttons=[...panel.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
  });
  let lastPosition={x:0,z:0},lastTarget=null;
  const chart=panel.querySelector('canvas'),ctx=chart.getContext('2d');
  function draw(position,target){
    ctx.drawImage(base,0,0,520,520);
    ctx.strokeStyle='rgba(180,219,206,.12)';ctx.lineWidth=1;
    for(let n=1;n<8;n++){ctx.beginPath();ctx.moveTo(n*65,0);ctx.lineTo(n*65,520);ctx.moveTo(0,n*65);ctx.lineTo(520,n*65);ctx.stroke()}
    const point=p=>[(p.x/extent+.5)*520,(p.z/extent+.5)*520];
    if(target){const[a,b]=point(position),[c,d]=point(target);ctx.setLineDash([5,5]);ctx.strokeStyle='#edc77e';ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();ctx.setLineDash([])}
    for(const p of places){
      const[x,y]=point(p);ctx.fillStyle=p===target?'#edc77e':'#bed6c9';ctx.beginPath();ctx.arc(x,y,p===target?6:3,0,Math.PI*2);ctx.fill();
      if(places.indexOf(p)>=5){ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#f6ecd4';ctx.fillText(p.name,x,y-16)}
    }
    for(const p of destinations){
      const[x,y]=point(p);ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=p===target?'#ffd487':'#ff9b38';ctx.fillRect(-4,-4,8,8);ctx.restore();
      ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd7a0';ctx.fillText(p.shortName||p.name,x,y-13);
    }
    const[x,y]=point(position);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
  }
  return {
    update(position,target){lastPosition=position;lastTarget=target;if(!panel.hidden)draw(position,target)},
    drawRadar(context,position,heading,target,markers=[]){
      const size=120,span=660;
      context.fillStyle='#123344';context.fillRect(0,0,size,size);
      context.drawImage(base,((-.5*extent-position.x)/span+.5)*size,((-.5*extent-position.z)/span+.5)*size,extent/span*size,extent/span*size);
      const pt=p=>[(p.x-position.x)/span*size+60,(p.z-position.z)/span*size+60];
      for(const p of places){const[x,y]=pt(p);context.fillStyle=p.on?'#aac8b5':'#e7cc8d';context.fillRect(x-2,y-2,4,4)}
      for(const p of destinations){const[x,y]=pt(p);context.fillStyle='#ff9b38';context.save();context.translate(x,y);context.rotate(Math.PI/4);context.fillRect(-3,-3,6,6);context.restore()}
      for(const v of vehicles){const[x,y]=pt(v.g.position);context.fillStyle=v.type==='boat'?'#6fe7f1':v.type==='car'?'#ef7556':v.type==='rocket'?'#ff9b38':'#f5d27a';context.fillRect(x-2,y-2,4,4)}
      for(const marker of markers){if(marker.on)continue;const[x,y]=pt(marker);context.fillStyle=marker.color||'#8ff7ff';context.beginPath();context.arc(x,y,2,0,Math.PI*2);context.fill()}
      if(target){
        let[x,y]=pt(target);const dx=x-60,dy=y-60,r=Math.hypot(dx,dy);
        if(r>49){x=60+dx/r*49;y=60+dy/r*49}
        context.strokeStyle='#ffd487';context.lineWidth=2;context.beginPath();context.arc(x,y,4,0,Math.PI*2);context.stroke();
      }
      context.save();context.translate(60,60);context.rotate(Math.PI-heading);context.fillStyle='#fff';context.beginPath();context.moveTo(0,-6);context.lineTo(4,4);context.lineTo(-4,4);context.closePath();context.fill();context.restore();
      context.font='bold 10px system-ui';context.fillStyle='#fff';context.textAlign='center';context.fillText('N',60,12);
    }
  };
}
