import fs from 'node:fs';
import {Night} from '../src/core.js';
import {performance} from 'node:perf_hooks';
import {parseArgs} from 'node:util';
const {values}=parseArgs({options:{seed:{type:'string'},nights:{type:'string'},out:{type:'string'}}});
const count=Number(values.nights),seed=Number(values.seed);
if(!Number.isSafeInteger(count)||count<1||!Number.isSafeInteger(seed)||!values.out)throw Error('Use --seed INT --nights N --out FILE');
const {tuning}=JSON.parse(fs.readFileSync(new URL('../game.contract.json',import.meta.url)));
const rss=()=>process.memoryUsage.rss()/1048576;
const started=performance.now(),results=[];let crashes=0,start;
for(let i=0;i<count;i++){
  let rng=(seed+i)>>>0;
  function random(){rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;}
  try{
    const game=new Night(tuning,seed+i,{},1+i%3);
    if(i===0)start=rss();
    let move;
    while(game.state==='playing'&&game.sim<game.duration*60){
      if(game.sim%30===0){const angle=random()*Math.PI*2;move=[Math.cos(angle),Math.sin(angle)];}
      game.step({move,jump:random()<.05,dash:random()<.03,pulse:random()<.02,interact:random()<.10});
    }
    results.push(game.state);
  }catch(e){crashes++;results.push('crashed');console.error(e.message);}
}
const report={nights:count,crashes,results,mem_start_mb:start,mem_end_mb:rss(),duration_s:(performance.now()-started)/1000};
fs.writeFileSync(values.out,JSON.stringify(report,null,2)+'\n');
if(crashes)process.exitCode=1;
