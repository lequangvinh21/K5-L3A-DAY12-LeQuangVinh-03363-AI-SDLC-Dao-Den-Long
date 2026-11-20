import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {Night} from '../src/core.js';
const {tuning:t}=JSON.parse(fs.readFileSync('game.contract.json'));
const game = scene => new Night(t,11,{random_shades:false,random_motes:false,...scene});
test('yaw, normalisation, retained input, jump edge and 60 Hz',()=>{
  const g=game();
  g.step({move:[0,1],cam_yaw_deg:90,jump:true});
  assert.ok(g.player.pos[1]>0);
  for(let i=1;i<60;i++)g.step();
  assert.ok(Math.abs(g.player.pos[0]-t.player_speed)<1e-9);
  assert.ok(Math.abs(g.player.pos[2])<1e-9);
  assert.equal(g.player.pos[1],0);
  assert.equal(g.timeLeft,t.night1_duration_s-1);
  const diagonal=game();diagonal.step({move:[1,1]});
  assert.ok(Math.abs(Math.hypot(...diagonal.player.pos)-t.player_speed/60)<1e-9);
});
test('inclusive pickup, capacity, partial deposit and held interact',()=>{
  const g=game({player:{carried:t.carry_capacity-1},motes:[[t.pickup_radius,0,0],[0,0,0]],
    lanterns:[{id:'L1',pos:[t.interact_radius,0,0]},{id:'L2',pos:[1,0,0]}]});
  assert.equal(g.step().length,1);assert.equal(g.motes.length,1);
  assert.equal(g.step({interact:true}).find(e=>e.name==='deposit').data.lantern_id,'L2');
  assert.equal(g.step().some(e=>e.name==='deposit'),false);
  const partial=game({player:{carried:1},lanterns:[{id:'L1',pos:[0,0,0]}]});
  partial.step({interact:true});assert.equal(partial.lanterns[0].deposited,1);
  assert.equal(partial.lanterns[0].lit,false);
});
test('pulse spends light, pushes, stuns and obeys cooldown',()=>{
  const g=game({player:{carried:4},shades:[{id:'Ink',pos:[t.pulse_radius,.8,0]}]});
  assert.deepEqual(g.step({pulse:true})[0].data.stunned_ids,['Ink']);
  for(let k=1;k<15;k++)g.step();
  assert.ok(Math.abs(g.shades[0].pos[0]-t.pulse_radius-t.pulse_push_m)<1e-8);
  assert.equal(g.shades[0].state,'stunned');assert.equal(g.score,t.score.per_stun);
  g.step({pulse:false});g.step({pulse:true});assert.equal(g.player.carried,1);
  while(g.tick<=t.pulse_stun_s*60)g.step();
  assert.equal(g.shades[0].state,'wander');g.step();assert.equal(g.shades[0].state,'chase');
});
test('hit drops, invulnerability, shelter and both loss reasons',()=>{
  const g=game({player:{carried:5,flames:2},shades:[{pos:[0,1,0]}]});
  assert.deepEqual(g.step()[0].data,{by:'shade',flames:1,dropped:2});
  for(let i=0;i<89;i++)g.step();
  assert.equal(g.step().at(-1).data.reason,'no_flames');
  const safe=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true}],shades:[{pos:[0,1,0]}]});
  safe.step();assert.equal(safe.player.flames,t.flames);assert.ok(safe.shades[0].pos[0]>=t.safe_radius);
  assert.equal(game({time_left_s:1/60}).step().at(-1).data.reason,'dawn');
});
test('official CLI writes deterministic snapshots, events and end; rejects invalid files',ctx=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lantern-test-'));
  ctx.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const out=path.join(dir,'out.jsonl');
  const run=(...opts)=>spawnSync(process.execPath,['src/headless.js','--seed','7','--night','1','--ticks','65','--out',out,...opts],{encoding:'utf8'});
  const args=['--scenario','tests/last-light.json','--inputs','tests/deposit.json','--snapshot-every','1'];
  assert.equal(run(...args).status,0);
  const raw=fs.readFileSync(out,'utf8');
  const records=raw.trim().split('\n').map(JSON.parse);
  assert.equal(records[0].tick,0);assert.equal(records[0].score,0);
  assert.deepEqual(records.filter(r=>r.type==='event').map(r=>[r.tick,r.name]),[[0,'night_start'],[1,'mote_picked'],[2,'deposit'],[2,'lantern_lit']]);
  assert.deepEqual(records.at(-1),{type:'end',ticks:65,state:'playing',score:105});
  assert.equal(run(...args).status,0);assert.equal(fs.readFileSync(out,'utf8'),raw);
  assert.equal(run().status,0);const seeded=fs.readFileSync(out,'utf8');
  assert.equal(run().status,0);assert.equal(fs.readFileSync(out,'utf8'),seeded);
  const bad=path.join(dir,'bad.json');fs.writeFileSync(bad,'{"frames":[{"tick":1},{"tick":1}]}');
  const invalid=run('--inputs',bad);assert.equal(invalid.status,2);assert.ok(invalid.stderr);
  fs.writeFileSync(bad,'{"motes":[[0,1]]}');assert.equal(run('--scenario',bad).status,2);
});
