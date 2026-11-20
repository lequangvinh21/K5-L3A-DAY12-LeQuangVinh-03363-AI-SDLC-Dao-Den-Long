import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function boardFile(){
  return process.env.LANTERN_BOARD_FILE || path.join(os.homedir(),'.dao-den-long','leaderboard.json');
}
export function rank(entries){
  return entries.slice().sort((a,b)=>b.score-a.score || Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10);
}
export function readBoard(file=boardFile()){
  try {return {entries:rank(JSON.parse(fs.readFileSync(file,'utf8')).entries)};}
  catch(e){if(e.code==='ENOENT')return {entries:[]};throw e;}
}
export function saveScore(input,file=boardFile()){
  const {name,score,nights_won,seed}=input;
  if(typeof name!=='string'||!/^[A-Za-z0-9_]{3,12}$/.test(name)||![score,nights_won,seed].every(Number.isSafeInteger)||score<0||nights_won<0||nights_won>3)
    throw new Error('Tên cần 3–12 chữ cái ASCII, số hoặc dấu gạch dưới; kiểm tra dữ liệu điểm.');
  const entry={name,score,nights_won,seed,achieved_at:new Date().toISOString()};
  const board={entries:rank([...readBoard(file).entries,entry])};
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const tmp=file+'.'+process.pid+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(board,null,2));fs.renameSync(tmp,file);return board;
}
