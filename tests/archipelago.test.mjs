import test from 'node:test';
import assert from 'node:assert/strict';
import {ISLANDS,islandHeight,islandSurfaceHeight,archipelagoHeight} from '../src/core/archipelago.js';
import {terrainHeight,boatCanTravel} from '../src/core/world.js';

test('offshore terrain is solid, finite, and reachable from open water',()=>{
  for(const island of ISLANDS){
    assert.ok(terrainHeight(island.x,island.z)>3,island.name);
    assert.equal(boatCanTravel(island.x,island.z),false,island.name);
    assert.equal(boatCanTravel(island.x,island.z+island.radius*1.3),true,island.name);
    let land=false;
    // The south approach must cross shallow water before walkable land.
    for(let r=island.radius*1.3;r>=0;r-=.5){
      const h=terrainHeight(island.x,island.z+r);
      assert.ok(Number.isFinite(h));
      if(h>-.7){land=true;assert.ok(h<1,'No impassable shore step');break}
    }
    assert.ok(land);
  }
});

test('island height joins the ocean below the waterline',()=>{
  for(const island of ISLANDS)for(let a=0;a<Math.PI*2;a+=.1){
    assert.ok(islandHeight(island,island.x+Math.cos(a)*island.radius*1.16,island.z+Math.sin(a)*island.radius*1.16)<0);
  }
});

test('Tideglass inlet stays navigable from the open sea',()=>{
  const c=ISLANDS[0];
  for(let u=80;u<180;u+=2)assert.equal(boatCanTravel(c.x+u,c.z),true);
  assert.ok(terrainHeight(c.x,c.z)>3);
});

test('all regions leave truly long-distance sailing unbounded',()=>{
  // The full-scale South Padre terrain reaches past 80k world units; sample far beyond every landmass.
  for(let a=0;a<Math.PI*2;a+=.07)assert.equal(boatCanTravel(Math.cos(a)*150000,Math.sin(a)*150000),true);
});

test('Veilwater terrace has a real height drop beneath the waterfall',()=>{
  const i=ISLANDS[2];
  assert.ok(terrainHeight(i.x-15,i.z)-terrainHeight(i.x+5,i.z)>8);
});

test('sea arch allows the central passage but blocks its rock pillars',()=>{
  const i=ISLANDS[2],x=i.x-148,z=i.z+15;
  assert.equal(boatCanTravel(x,z),true);
  assert.equal(boatCanTravel(x,z-16),false);
  assert.equal(boatCanTravel(x,z+16),false);
});

test('offshore seafloor fades radially without square support-boundary seams',()=>{
  for(const i of ISLANDS){
    for(const sign of [-1,1]){
      const edge=i.x+sign*i.radius*1.6;
      assert.ok(Math.abs(archipelagoHeight(edge-.001,i.z)-archipelagoHeight(edge+.001,i.z))<.01);
    }
    for(let a=0;a<Math.PI*2;a+=.2){
      const x=i.x+Math.cos(a)*i.radius*1.55,z=i.z+Math.sin(a)*i.radius*1.55;
      assert.equal(islandHeight(i,x,z),-80);
    }
  }
});

test('surface queries match terrain grid vertices and stay continuous across triangles',()=>{
  const i=ISLANDS[2],step=i.radius*2.35/76,left=i.x-i.radius*2.35/2,top=i.z-i.radius*2.35/2;
  for(let n=25;n<50;n++){
    const x=left+n*step,z=top+38*step;
    assert.ok(Math.abs(islandSurfaceHeight(i,x,z)-islandHeight(i,x,z))<1e-8);
    assert.ok(Math.abs(islandSurfaceHeight(i,x-.0001,z)-islandSurfaceHeight(i,x+.0001,z))<.01);
  }
});