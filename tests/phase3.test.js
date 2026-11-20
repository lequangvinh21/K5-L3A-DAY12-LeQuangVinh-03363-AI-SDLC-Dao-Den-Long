import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Night} from '../src/core.js';
const {tuning}=JSON.parse(fs.readFileSync('game.contract.json'));
const night=(s,n=1)=>new Night(tuning,7,{random_shades:false,random_motes:false,random_drifters:false,...s},n);
test('extinction precedes same-tick relight; capacity, score and pause',()=>{
  const g=night({player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:1/60}]});
  assert.equal(g.capacity,10);
  assert.deepEqual(g.step({interact:true}).map(e=>e.name),['lantern_out','deposit','lantern_lit']);
  assert.equal(g.events.at(-1).data.relight,true);assert.equal(g.score,65);assert.equal(g.capacity,12);
  const l=g.snapshot().lanterns[0];assert.equal(l.relit_count,1);assert.equal(l.fuel,100);
  g.step({pause:true});g.step();assert.equal(g.lanterns[0].oil,6000);
});
test('refuel ceilings and caps, nearest then lexical id, no initial credit',()=>{
  const g=night({player:{carried:6,successful_lights:8},lanterns:[{id:'L1',pos:[1,0,0],lit:true,fuel:85},{id:'L2',pos:[-1,0,0]}]});
  assert.equal(g.capacity,20);assert.equal(g.score,0);
  assert.deepEqual(g.step({interact:true})[0].data,{lantern_id:'L1',amount:2,fuel:100});
  assert.equal(g.score,10);assert.equal(g.player.carried,4);
  assert.equal(g.interactionTarget().id,'L2');
});
test('60 active drain ticks stack exactly with passive burn and emit per shade',()=>{
  const g=night({player:{pos:[24,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:25}],
    shades:['A','B'].map(id=>({id,pos:[0,.8,0],state:'drain',target_lantern_id:'L1'}))});
  for(let i=0;i<60;i++)g.step();
  assert.equal(g.snapshot().lanterns[0].fuel,14);
  assert.deepEqual(g.events.filter(e=>e.name==='fuel_drain').map(e=>e.data.shade_id),['A','B']);
});
test('pulse rewards drain at activation; safe threshold uses unrounded units',()=>{
  const g=night({player:{carried:3},lanterns:[{id:'L1',pos:[1,0,0],lit:true,fuel:20}],shades:[{pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]});
  g.step({pulse:true});assert.equal(g.score,15);assert.equal(g.shades[0].state,'stunned');
  const safe=night({player:{pos:[25,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:30+1/60}],shades:[{pos:[0,0,0],state:'wander'}]});
  safe.step();assert.equal(safe.safeLamp(safe.lanterns[0]),true);safe.step();assert.equal(safe.safeLamp(safe.lanterns[0]),false);
});
test('dawn quotas for all islands, no early win, flames have priority',()=>{
  for(const [n,count] of [[1,3],[2,4],[3,5]]){
    const lamps=Array.from({length:count},(_,i)=>({id:'L'+(i+1),lit:true,fuel:61}));
    const g=night({time_left_s:2/60,lanterns:lamps},n);
    g.step();assert.equal(g.state,'playing');assert.equal(g.step().at(-1).data.reason,'dawn_survived');
    assert.equal(g.score,count*(50+60)+150);
    const fail=night({time_left_s:1/60,lanterns:lamps.slice(1)},n);assert.equal(fail.step().at(-1).data.reason,'dawn');
    const dead=night({time_left_s:1/60,player:{flames:0},lanterns:lamps},n);assert.equal(dead.step().at(-1).data.reason,'no_flames');
  }
});
test('wanderer selects nearest weak lamp and leaves drain on restored shelter',()=>{
  const g=night({player:{pos:[22,0,0]},shades:[{pos:[0,.8,0],state:'wander'}],lanterns:[{id:'L1',pos:[1,0,0],lit:true,fuel:20},{id:'L2',pos:[-1,0,0],lit:true,fuel:25}]});
  g.step();assert.equal(g.shades[0].state,'drain');assert.equal(g.shades[0].target,'L1');
  g.player.pos=[1,0,0];g.player.carried=2;g.step({interact:true});assert.notEqual(g.shades[0].state,'drain');
  assert.ok(Math.hypot(g.shades[0].pos[0]-1,g.shades[0].pos[2])>=6);assert.equal(g.player.flames,3);
});
