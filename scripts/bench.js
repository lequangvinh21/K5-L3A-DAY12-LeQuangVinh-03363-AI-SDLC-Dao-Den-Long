import fs from 'node:fs';
import os from 'node:os';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright-core';
import {serve} from './server.js';
const start=performance.timeOrigin;
const {values}=parseArgs({options:{seed:{type:'string'},duration:{type:'string'},out:{type:'string'}}});
const seed=Number(values.seed),seconds=Number(values.duration);
if(!Number.isSafeInteger(seed)||!(seconds>0)||!values.out)throw Error('Use --seed INT --duration SECONDS --out FILE');
const {url,server}=await serve();let browser;
try{
  const executablePath=process.env.CHROME_PATH;
  browser=await chromium.launch({headless:false,...(executablePath?{executablePath}:{channel:'chrome'}),
    args:['--disable-gpu-vsync','--disable-frame-rate-limit','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--window-size=1280,720']});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  await page.goto(url+'/?bench='+seed+'&duration='+seconds);
  await page.waitForFunction(()=>window.lanternMeasurements,undefined,{timeout:(seconds+60)*1000,polling:250});
  const {samples,renderer,first}=await page.evaluate(()=>({...window.lanternMeasurements,first:window.lanternFirstFrame}));
  const sorted=samples.slice().sort((a,b)=>a-b),n=sorted.length,k=Math.ceil(n*.01);
  const sum=a=>a.reduce((p,c)=>p+c,0);
  const report={contract_version:'1.3',avg_fps:1000*n/sum(samples),p1_low_fps:1000*k/sum(sorted.slice(-k)),
    frame_ms_p95:sorted[Math.ceil(.95*n)-1],frames:n,load_ms:Math.round(first-start),peak_mem_mb:null,vsync_off:true,
    renderer:renderer+' / Chrome '+browser.version(),os:os.type()+' '+os.release()+' '+os.arch()};
  fs.writeFileSync(values.out,JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();server.close();}
