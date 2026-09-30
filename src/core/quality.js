const presets={
  low:{pixelRatio:1,shadows:false,label:'Low'},
  medium:{pixelRatio:1.25,shadows:true,label:'Medium'},
  high:{pixelRatio:1.5,shadows:true,label:'High'}
};

export function autoQuality(){
  const memory=navigator.deviceMemory||0;
  const cores=navigator.hardwareConcurrency||0;
  if((memory&&memory<=4)||(cores&&cores<=4))return 'low';
  return 'medium';
}

export function resolvedQuality(key){
  return key==='auto'?autoQuality():(presets[key]?key:'medium');
}

export function qualityConfig(key){
  return presets[resolvedQuality(key)];
}

export function applyRendererQuality(renderer,key){
  const config=qualityConfig(key);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,config.pixelRatio));
  renderer.shadowMap.enabled=config.shadows;
  renderer.setSize(innerWidth,innerHeight);
  return config;
}

export function nextQuality(key){
  const order=['auto','low','medium','high'];
  return order[(Math.max(0,order.indexOf(key))+1)%order.length];
}

export function qualityLabel(key){
  return key==='auto'?'Auto ('+qualityConfig(key).label+')':qualityConfig(key).label;
}
