import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {saveScore,readBoard} from '../src/leaderboard.js';
import {benchmarkNight} from '../src/benchmark.js';
const {tuning}=JSON.parse(fs.readFileSync('game.contract.json'));
test('benchmark scenario uses 200 wanderers, 100 motes, and three full lamps',()=>{
  const a=benchmarkNight(tuning,42),b=benchmarkNight(tuning,42);
  assert.deepEqual(a.snapshot(),b.snapshot());
  assert.equal(a.shades.length,200);assert.ok(a.shades.every(s=>s.state==='wander'));
  assert.equal(a.motes.length,100);assert.deepEqual(a.lanterns.filter(l=>l.lit).map(l=>l.oil),[6000,6000,6000]);
  assert.deepEqual(a.player.pos,[0,0,0]);assert.equal(a.autoShades,false);assert.equal(a.autoMotes,false);
});
test('disk leaderboard validates names, retains top ten, sorts ties by date, and exports after restart',ctx=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lantern-board-'));ctx.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'scores.json'),out=path.join(dir,'export.json');
  fs.writeFileSync(file,JSON.stringify({entries:[{name:'Late',score:100,nights_won:1,seed:7,achieved_at:'2026-01-01T13:00:00+07:00'},
  {name:'Early',score:100,nights_won:1,seed:7,achieved_at:'2026-01-01T05:00:00Z'}]}));
  for(let i=0;i<12;i++)saveScore({name:'P_'+i,score:i,nights_won:1,seed:i},file);
  assert.throws(()=>saveScore({name:'x',score:0,nights_won:0,seed:1},file));
  assert.equal(readBoard(file).entries.length,10);assert.deepEqual(readBoard(file).entries.slice(0,2).map(e=>e.name),['Early','Late']);
  const proc=spawnSync(process.execPath,['scripts/run.js','--export-leaderboard',out],{env:{...process.env,LANTERN_BOARD_FILE:file}});
  assert.equal(proc.status,0);assert.deepEqual(JSON.parse(fs.readFileSync(out)),readBoard(file));
});
