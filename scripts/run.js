import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {readBoard} from '../src/leaderboard.js';
import {serve} from './server.js';
const args=process.argv.slice(2);
if(args[0]==='--export-leaderboard'&&args.length===2){
  fs.writeFileSync(args[1],JSON.stringify(readBoard(),null,2)+'\n');
}else{
  if(args.length)throw Error('Expected --export-leaderboard <file> or no arguments');
  const {url}=await serve(Number(process.env.PORT)||5173);
  console.log('Đảo Đèn Lồng · '+url);
  const open=process.platform==='darwin'?['open',url]:process.platform==='win32'?['rundll32','url.dll,FileProtocolHandler',url]:['xdg-open',url];
  const proc=spawn(open[0],open.slice(1),{stdio:'ignore',detached:true});proc.on('error',()=>console.log('Mở '+url+' trong trình duyệt.'));proc.unref();
}
