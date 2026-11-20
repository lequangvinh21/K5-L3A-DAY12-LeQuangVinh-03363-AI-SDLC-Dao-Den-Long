import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Night} from '../src/core.js';
import {maps,ground} from '../src/maps.js';
const {tuning}=JSON.parse(readFileSync('game.contract.json'));
const scene=(s={},n=1)=>new Night(tuning,73,{random_motes:false,random_shades:false,random_drifters:false,...s},n);
function steps(g,n){for(let i=0;i<n;i++)g.step();}
test('three maps, spawn rings, schedule, wind and timer',()=>{
  for(const n of [1,2,3]){
    const g=new Night(tuning,9,{},n);
    assert.equal(g.lanterns.length,n+4);assert.equal(g.motes.length,20);
    assert.equal(new Set(g.motes.map(m=>m.pos.join(','))).size,20);
    steps(g,240);assert.equal(g.motes.length,21);steps(g,60);assert.equal(g.shades.length,2);
    steps(g,900);assert.equal(g.drifters.length,n===1?0:1);
    if(n===3){steps(g,600);assert.equal(g.wind.active,true);steps(g,300);assert.equal(g.wind.active,false);}
  }
  assert.equal(ground(2,35,0),0);assert.equal(ground(2,35,4),-Infinity);
  assert.equal(ground(3,0,5),6);assert.equal(ground(3,0,13),3);assert.ok(Math.abs(ground(3,27*Math.cos(Math.PI/6),13.5)-1.5)<1e-10);
});
test('pause freezes sim, cooldowns, charm, schedule and time',()=>{
  const g=scene({player:{charm_ticks:120,dash_cd_ticks:30}});
  assert.equal(g.step({pause:true})[0].name,'paused');steps(g,300);
  assert.equal(g.sim,0);assert.equal(g.timeLeft,300);assert.equal(g.player.charm,120);
  g.step({pause:false});assert.equal(g.step({pause:true})[0].name,'resumed');assert.equal(g.sim,1);
});
test('charm refresh, fixed dash distance, airborne dash and delayed respawn',()=>{
  const g=scene({player:{pos:[35,0,0]}},2);assert.equal(g.step()[0].name,'charm_picked');
  assert.equal(g.player.charm,600);assert.equal(g.charms[0].left,2700);
  g.step({jump:true});const height=g.player.pos[1],z=g.player.pos[2];
  assert.equal(g.step({dash:true})[0].name,'dash');steps(g,11);
  assert.equal(g.player.pos[1],height);assert.ok(Math.abs(g.player.pos[2]-z-2.8)<1e-9);
  g.step({dash:false});assert.equal(g.step({dash:true})[0].name,'dash');
  g.player.pos=[0,0,0];steps(g,2700);assert.equal(g.player.charm,0);assert.equal(g.charms[0].left,0);
});
test('wind drifter steals before shade, pulse recovers stolen motes',()=>{
  const g=scene({player:{carried:10},drifters:[{id:'D1',pos:[0,.8,0]}],shades:[{pos:[0,.8,0]}]},2);
  const events=g.step();assert.deepEqual(events.map(e=>e.name),['drifter_steal','player_hit']);assert.equal(g.player.carried,4);
  const next=g.step({pulse:true});assert.ok(next.some(e=>e.name==='drifter_drop'&&e.data.amount===3));
  assert.equal(g.drifters[0].stolen,0);assert.ok(g.motes.some(m=>m.kind==='dropped'));
});
test('jump pads, fall penalty through immunity and respawn',()=>{
  const g=scene({player:{pos:[20,0,18]}},2);g.step();assert.ok(g.player.vel[1]>13);steps(g,90);
  assert.ok(g.player.pos[0]>42&&g.player.grounded);
  const drop=scene({player:{pos:[42,-10.1,0],invuln_ticks:80,carried:7}});
  assert.equal(drop.step()[0].data.lost,7);steps(drop,60);assert.deepEqual(drop.player.pos,[0,0,0]);assert.equal(drop.player.inv,90);
});
test('score on deposit only, no_flames precedes victory, victory precedes dawn',()=>{
  const won=scene({time_left_s:1/60,lanterns:maps[1].lamps.map((_,i)=>({id:'L'+(i+1),lit:true}))});
  assert.equal(won.step().at(-1).data.reason,'all_lit');
  const lost=scene({player:{flames:0},lanterns:won.lanterns});assert.equal(lost.step().at(-1).data.reason,'no_flames');
});
