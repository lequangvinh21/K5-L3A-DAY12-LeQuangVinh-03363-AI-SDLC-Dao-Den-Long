import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readBoard,saveScore} from '../src/leaderboard.js';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
export async function serve(port=0){
  if(!fs.existsSync(path.join(root,'index.html')))throw Error('Thiếu dist/. Chạy npm run build.');
  const server=http.createServer(async(req,res)=>{
    try{
      const u=new URL(req.url,'http://localhost');
      if(u.pathname==='/api/leaderboard'){
        res.setHeader('Content-Type','application/json');
        if(req.method==='GET')return res.end(JSON.stringify(readBoard()));
        if(req.method!=='POST'||req.headers.origin!=='http://'+req.headers.host||!(req.headers['content-type']||'').startsWith('application/json')){res.writeHead(403);return res.end();}
        let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)throw Error('Body too large');}
        return res.end(JSON.stringify(saveScore(JSON.parse(body))));
      }
      const file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
      if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    }catch(e){res.writeHead(400);res.end(JSON.stringify({error:e.message}));}
  });
  await new Promise((resolve,reject)=>server.once('error',reject).listen(port,'127.0.0.1',resolve));
  return {server,url:'http://127.0.0.1:'+server.address().port};
}
