import fs from 'node:fs';
import {Night} from './core.js';
const {tuning} = JSON.parse(fs.readFileSync(new URL('../game.contract.json',import.meta.url)));
const integer = Number.isSafeInteger;
const uint = n => integer(n) && n >= 0;
const object = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const vector = (v,n) => Array.isArray(v) && v.length === n && v.every(Number.isFinite);
const bool = v => typeof v === 'boolean';
const optional = (o,k,test) => !(k in o) || test(o[k]);
const list = test => a => Array.isArray(a) && a.every(test);
const unique = (a,key) => new Set(a.map(o => o[key])).size === a.length;
function scenario(s,night) {
  return object(s) && optional(s,'player',p => object(p) && optional(p,'pos',v => vector(v,3)) &&
    optional(p,'carried',uint) && optional(p,'flames',uint) && ['successful_lights','invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks'].every(k=>optional(p,k,uint))) &&
    optional(s,'time_left_s',v => Number.isFinite(v) && v >= 0) &&
    ['random_drifters','wind_enabled'].every(k=>optional(s,k,bool)) &&
    optional(s,'drifters',list(o=>object(o)&&vector(o.pos,3)&&optional(o,'state',v=>['idle','chase','flee'].includes(v))&&optional(o,'stolen',uint)&&optional(o,'state_ticks_left',uint))) &&
    optional(s,'charms',list(o=>object(o)&&optional(o,'pos',v=>vector(v,3))&&optional(o,'available',bool)&&optional(o,'respawn_ticks',uint))) &&
    optional(s,'random_motes',bool) && optional(s,'random_shades',bool) &&
    optional(s,'motes',list(v => vector(v,3))) &&
    optional(s,'shades',a => list(o => object(o) && vector(o.pos,3) && optional(o,'state',v=>['spawning','wander','chase','recoil','stunned','drain'].includes(v)) && optional(o,'state_ticks_left',uint) && optional(o,'target_lantern_id',v=>typeof v==='string') && optional(o,'id',v => typeof v === 'string' && v.length > 0))(a) && unique(a.filter(s => s.id),'id')) &&
    optional(s,'lanterns',a => list(o => object(o) && /^L[1-7]$/.test(o.id) && Number(o.id.slice(1))<=night+4 && optional(o,'pos',v => vector(v,3)) &&
      optional(o,'lit',bool) && optional(o,'ever_lit',bool) && optional(o,'fuel',v=>Number.isFinite(v)&&v>=0&&v<=tuning.fuel_max) && optional(o,'deposited',v => uint(v) && v <= tuning.lantern_cost))(a) && unique(a,'id'));
}
function inputs(o) {
  return object(o) && Array.isArray(o.frames) && o.frames.every((f,i) => object(f) && uint(f.tick) &&
    (!i || f.tick > o.frames[i-1].tick) && optional(f,'move',v => vector(v,2) && v.every(n => Math.abs(n)<=1)) &&
    optional(f,'cam_yaw_deg',Number.isFinite) && ['jump','interact','pulse','dash','pause'].every(k => optional(f,k,bool)));
}
function loadFile(path, valid) {
  try {
    const value = JSON.parse(fs.readFileSync(path,'utf8').replace(/^\uFEFF/,''));
    if (!valid(value)) throw Error('invalid structure');
    return value;
  } catch (cause) { throw Object.assign(Error(path + ': ' + cause.message), {exitCode:2}); }
}
function run(argv) {
  const args = new Map();
  const keys = ['--seed','--night','--ticks','--out','--snapshot-every','--inputs','--scenario'];
  for (let i=0; i<argv.length; i+=2) {
    if (!keys.includes(argv[i]) || args.has(argv[i]) || !argv[i+1]) throw Error('Invalid argument: '+argv[i]);
    args.set(argv[i],argv[i+1]);
  }
  const number = (k,fallback) => {
    const v = args.get(k) ?? fallback;
    if (!/^-?\d+$/.test(v) || !integer(Number(v))) throw Error('Expected integer: '+k);
    return Number(v);
  };
  const seed = number('--seed'), ticks = number('--ticks'), interval = number('--snapshot-every',10);
  const night=number('--night');
  if (![1,2,3].includes(night) || ticks < 0 || interval < 1 || !args.get('--out')) throw Error('Invalid run parameters');
  const scene = args.has('--scenario') ? loadFile(args.get('--scenario'),s=>scenario(s,night)) : {};
  const frames = args.has('--inputs') ? loadFile(args.get('--inputs'),inputs).frames : [];
  const game = new Night(tuning,seed,scene,night);
  const fd = fs.openSync(args.get('--out'),'w');
  const write = record => fs.writeSync(fd,JSON.stringify(record)+'\n');
  try {
    write(game.snapshot());
    write({type:'event',tick:0,name:'night_start',data:{night}});
    let cursor = 0;
    while (game.tick < ticks && ['playing','paused'].includes(game.state)) {
      const frame = frames[cursor]?.tick === game.tick ? frames[cursor++] : {};
      for (const event of game.step(frame)) write(event);
      if (game.tick % interval === 0) write(game.snapshot());
    }
    write({type:'end',ticks:game.tick,state:game.state,score:game.score});
  } finally { fs.closeSync(fd); }
}
try { run(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = error.exitCode ?? 1; }
