#!/bin/sh
set -eu
out=${1:-docs/proof/phase-2}
mkdir -p "$out"
node --test > "$out/tests-linux.tap"
node src/headless.js --night 2 --seed 73 --ticks 25 --snapshot-every 1 --scenario tests/phase2-bridge.json --inputs tests/phase2-actions.json --out "$out/bridge.jsonl"
node --input-type=module - "$out" <<'JS'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dao-benchmark-'));
try{
  const file=path.join(temp,'full.jsonl'),start=performance.now();
  const args=['src/headless.js','--night','3','--seed','73','--ticks','21600','--scenario','docs/proof/phase-2/benchmark-scene.json','--out',file];
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr);
  const seconds=(performance.now()-start)/1000;
  const end=JSON.parse(fs.readFileSync(file,'utf8').trimEnd().split('\n').at(-1));
  const report={platform:process.platform,cpu:os.cpus()[0].model,node:process.version,args,seconds,end};
  fs.writeFileSync(path.join(process.argv[2],'headless-performance.json'),JSON.stringify(report,null,2)+'\n');
  if(end.ticks!==21600||seconds>30)throw Error('Performance budget exceeded or night ended early');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
JS
