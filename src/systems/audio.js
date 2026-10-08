const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

export function computeAudioMix(state={}){
  const mode=state.mode||'foot',speed=Math.abs(state.speed||0),alt=Math.max(0,state.altitude||0),vacuum=!!state.vacuum,throttle=cl(state.throttle||0);
  const slip=cl(Math.abs(state.slip||0)),underwater=!!state.underwater,wet=cl(state.rain||0),ocean=cl(state.ocean||0),coast=cl(state.coast||0),town=cl(state.town||0),day=cl(state.daylight??1),night=1-day,rain=cl(state.rain||0),weatherWind=cl(state.weatherWind||0),storm=cl(state.storm||0);
  return {
    waterfall:vacuum?0:cl((state.waterfall||0)*.20,0,.20),
    wind:vacuum||underwater?0:cl(.025+speed/180+alt/900+(mode==='plane'?.08:0)+weatherWind*.11+storm*.05,0,.52),
    rain:vacuum||underwater?0:cl(rain*.16+storm*.04,0,.22),
    ocean:vacuum||underwater?0:cl(ocean*.095+(mode==='boat'?.09:0),0,.20),
    surf:vacuum||underwater?0:cl(coast*.12,0,.13),
    land:vacuum?0:cl((1-ocean)*(1-town)*.035,0,.04),
    town:vacuum?0:cl(town*.025,0,.03),
    car:mode==='car'||mode==='rover'?cl((mode==='rover'?.023:.055)+speed/420,0,.14):0,
    road:mode==='car'?cl(speed/500+slip*.055+wet*.02,0,.125):0,
    boat:mode==='boat'||mode==='submarine'?cl((underwater?.027:.07)+speed/320,0,.145):0,
    wake:mode==='boat'?cl(speed/160,0,.18):0,
    plane:mode==='plane'?cl(.07+speed/500,0,.18):0,
    jet:mode==='plane'?cl(.04+speed/360+alt/3000,0,.22):0,
    rocket:mode==='rocket'?cl(.025+throttle*.22,0,.24):0,
    alien:mode==='alien'?cl(.018+throttle*.19,0,.21):0,
    cabin:underwater?cl(.018+speed/1400,0,.06):(mode==='rocket'||mode==='alien'||mode==='rover')&&vacuum?cl(.008+throttle*.07,0,.08):0,
    day,night
  };
}

function makeNoise(ctx,seconds=3){
  const b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*seconds),ctx.sampleRate),d=b.getChannelData(0);
  let brown=0;
  for(let i=0;i<d.length;i++){const w=Math.random()*2-1;brown=(brown+.02*w)/1.02;d[i]=cl(w*.62+brown*.7,-1,1)}
  return b;
}

function loopingNoise(ctx,buffer,type,freq,q=0.7){
  const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;
  const filter=ctx.createBiquadFilter();filter.type=type;filter.frequency.value=freq;filter.Q.value=q;
  const gain=ctx.createGain();gain.gain.value=0;
  src.connect(filter);filter.connect(gain);src.start();
  return {src,filter,gain};
}

function oscillator(ctx,type,freq){
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.value=freq;gain.gain.value=0;osc.connect(gain);osc.start();
  return {osc,gain};
}

export function createWorldAudio(){
  let ctx=null,master=null,noise=null,layers=null,engines=null,started=false,paused=false,stepClock=0,wildClock=2;

  const target=(param,value,time=.08)=>{
    if(!ctx)return;
    param.setTargetAtTime(value,ctx.currentTime,time);
  };

  function start(){
    if(started){paused=false;ctx?.resume?.();return}
    try{
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      const compressor=ctx.createDynamicsCompressor();
      compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=3.5;compressor.attack.value=.012;compressor.release.value=.28;
      master=ctx.createGain();master.gain.value=.72;master.connect(compressor);compressor.connect(ctx.destination);
      noise=makeNoise(ctx,4);

      layers={
        wind:loopingNoise(ctx,noise,'bandpass',1050,.45),
        rain:loopingNoise(ctx,noise,'highpass',1350,.35),
        waterfall:loopingNoise(ctx,noise,'lowpass',1800,.6),
        ocean:loopingNoise(ctx,noise,'lowpass',520,.5),
        surf:loopingNoise(ctx,noise,'bandpass',720,.6),
        land:loopingNoise(ctx,noise,'highpass',1250,.3),
        town:loopingNoise(ctx,noise,'bandpass',380,.45),
        road:loopingNoise(ctx,noise,'bandpass',240,.8),
        wake:loopingNoise(ctx,noise,'highpass',430,.35),
        jet:loopingNoise(ctx,noise,'bandpass',760,.5),
        cabin:loopingNoise(ctx,noise,'lowpass',180,.7)
      };
      Object.values(layers).forEach(x=>x.gain.connect(master));

      engines={
        car1:oscillator(ctx,'sawtooth',55),car2:oscillator(ctx,'square',110),
        boat1:oscillator(ctx,'sawtooth',38),boat2:oscillator(ctx,'sine',76),
        plane1:oscillator(ctx,'sawtooth',90),plane2:oscillator(ctx,'sine',310),
        rocket1:oscillator(ctx,'sawtooth',42),rocket2:oscillator(ctx,'sine',84),alien1:oscillator(ctx,'triangle',118),alien2:oscillator(ctx,'sine',236)
      };
      Object.values(engines).forEach(x=>x.gain.connect(master));
      started=true;paused=false;
      ctx.resume?.();
    }catch{}
  }

  function transient(surface='grass',strength=1){
    if(!ctx||ctx.state==='suspended')return;
    const now=ctx.currentTime,src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    src.buffer=noise;
    const profile={
      grass:['bandpass',1150,.055,.13],
      sand:['lowpass',850,.07,.16],
      stone:['highpass',520,.045,.10],
      wood:['bandpass',380,.055,.12],
      water:['bandpass',980,.075,.18]
    }[surface]||['bandpass',900,.05,.12];
    filter.type=profile[0];filter.frequency.value=profile[1];
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(profile[2]*strength,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+profile[3]);
    src.connect(filter);filter.connect(gain);gain.connect(master);src.start(now,Math.random()*2.5);src.stop(now+profile[3]+.03);
    if(surface==='stone'||surface==='wood'){
      const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=surface==='wood'?125:170;
      g.gain.setValueAtTime(.022*strength,now);g.gain.exponentialRampToValueAtTime(.0001,now+.08);o.connect(g);g.connect(master);o.start(now);o.stop(now+.09);
    }
  }

  function chirp(night=false){
    if(!ctx||ctx.state==='suspended')return;
    const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
    o.type='sine';
    if(night){o.frequency.setValueAtTime(3900,now);o.frequency.exponentialRampToValueAtTime(3150,now+.16)}
    else{o.frequency.setValueAtTime(1750+Math.random()*550,now);o.frequency.exponentialRampToValueAtTime(2850+Math.random()*700,now+.20)}
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(night?.025:.035,now+.018);g.gain.exponentialRampToValueAtTime(.0001,now+(night?.18:.28));
    o.connect(g);if(pan){pan.pan.value=Math.random()*1.6-.8;g.connect(pan);pan.connect(master)}else g.connect(master);
    o.start(now);o.stop(now+.32);
  }

  function update(state){
    if(!started||!ctx||paused)return;
    if(ctx.state==='suspended')ctx.resume?.();
    const mix=computeAudioMix(state),speed=Math.abs(state.speed||0),mode=state.mode||'foot';
    target(layers.wind.gain.gain,mix.wind,.16);target(layers.wind.filter.frequency,700+speed*18+(state.altitude||0)*.8,.2);target(layers.rain.gain.gain,mix.rain,.18);
    target(layers.waterfall.gain.gain,mix.waterfall,.25);target(layers.ocean.gain.gain,mix.ocean,.2);target(layers.surf.gain.gain,mix.surf,.22);
    target(layers.land.gain.gain,mix.land,.3);target(layers.town.gain.gain,mix.town,.3);
    target(layers.road.gain.gain,mix.road,.08);target(layers.wake.gain.gain,mix.wake,.08);target(layers.jet.gain.gain,mix.jet,.1);target(layers.cabin.gain.gain,mix.cabin,.12);
    target(layers.wake.filter.frequency,430+speed*32,.1);target(layers.jet.filter.frequency,650+speed*10,.1);

    target(engines.car1.gain.gain,mix.car,.07);target(engines.car2.gain.gain,mix.car*.22,.07);
    target(engines.car1.osc.frequency,48+speed*3.0,.06);target(engines.car2.osc.frequency,96+speed*6.0,.06);
    target(engines.boat1.gain.gain,mix.boat,.08);target(engines.boat2.gain.gain,mix.boat*.26,.08);
    target(engines.boat1.osc.frequency,34+speed*1.7,.08);target(engines.boat2.osc.frequency,68+speed*3.4,.08);
    target(engines.plane1.gain.gain,mix.plane*.72,.08);target(engines.plane2.gain.gain,mix.plane*.19,.08);
    target(engines.plane1.osc.frequency,72+speed*2.2,.08);target(engines.plane2.osc.frequency,255+speed*5.8,.08);
    target(engines.rocket1.gain.gain,mix.rocket,.06);target(engines.rocket2.gain.gain,mix.rocket*.36,.06);
    target(engines.rocket1.osc.frequency,38+(state.throttle||0)*32,.08);target(engines.rocket2.osc.frequency,76+(state.throttle||0)*64,.08);
    target(engines.alien1.gain.gain,mix.alien,.06);target(engines.alien2.gain.gain,mix.alien*.42,.06);
    target(engines.alien1.osc.frequency,105+(state.throttle||0)*95,.08);target(engines.alien2.osc.frequency,210+(state.throttle||0)*190,.08);

    if(mode==='foot'&&state.walking&&state.grounded){
      stepClock+=(state.dt||0)*(state.sprinting?2.75:1.9);
      if(stepClock>=1){stepClock-=1;transient(state.surface,state.sprinting?1.15:1)}
    }else stepClock=Math.min(stepClock,.3);

    wildClock-=state.dt||0;
    if(wildClock<=0&&!state.vacuum&&mode==='foot'&&(state.town||0)<.75&&(state.rain||0)<.35){
      const night=mix.night>.58;
      if((night&&mix.night>.58)||(!night&&mix.day>.32&&(state.ocean||0)<.72))chirp(night);
      wildClock=night?1.7+Math.random()*3.8:3.5+Math.random()*7.5;
    }
  }

  const suspend=()=>{paused=true;try{if(ctx&&ctx.state==='running')ctx.suspend()}catch{}};
  const resume=()=>{paused=false;try{if(started&&ctx&&ctx.state==='suspended')ctx.resume()}catch{}};
  return {start,update,suspend,resume,impact:(surface='stone',strength=.5)=>transient(surface,Math.min(1,Math.max(.05,strength)))};
}
