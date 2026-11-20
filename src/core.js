import {maps,ground} from './maps.js';
const hz=60, radians=a=>a*Math.PI/180;
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const dir=(a,b)=>{const d=dist(a,b);return d?[(b[0]-a[0])/d,(b[2]-a[2])/d]:[1,0];};
const close=(a,b,r)=>dist(a,b)<=r && Math.abs(a[1]-b[1])<=1.5;
const rounded=p=>p.map(v=>Number(v.toFixed(3)));
export class Night {
  constructor(t,seed,s={},night=1){
    this.night=night;this.map=maps[night];this.t=t;this.seed=seed>>>0;
    this.tick=0;this.sim=0;this.score=0;this.state='playing';
    this.duration=s.time_left_s??t['night'+night+'_duration_s'];
    this.input={move:[0,0],cam_yaw_deg:0};this.face=[0,1];this.dashLeft=0;this.wait=0;
    this.spawn=night===3?[0,0,-27]:[0,0,0];
    const p=s.player??{};
    this.player={pos:[...(p.pos??this.spawn)],vel:[0,0,0],carried:p.carried??0,flames:p.flames??3,
      inv:p.invuln_ticks??0,dc:p.dash_cd_ticks??0,pc:p.pulse_cd_ticks??0,charm:p.charm_ticks??0};
    this.player.grounded=this.player.pos[1]===ground(night,this.player.pos[0],this.player.pos[2]);
    this.wind={active:false,dir_deg:0};this.windEnabled=s.wind_enabled??true;
    this.lanterns=this.map.lamps.map((pos,i)=>{
      const id='L'+(i+1),l=s.lanterns?.find(o=>o.id===id)??{};
      return {id,pos:[...(l.pos??pos)],lit:l.lit??(l.deposited===10),deposited:l.deposited??(l.lit?10:0)};
    });
    this.autoMotes=s.random_motes??true;this.autoShades=s.random_shades??true;this.autoDrifters=s.random_drifters??true;
    this.motes=[];this.mid=0;
    if(s.motes)for(const m of s.motes)this.mote(m.pos??m,m.kind??'random',m.ttl_ticks??480);
    else if(this.autoMotes)for(let i=0;i<20;i++)this.spawnMote();
    this.shades=(s.shades??[]).map((o,i)=>({id:o.id??'S'+(i+1),pos:[...o.pos],state:o.state??'chase',left:o.state_ticks_left??0,push:0,away:[1,0]}));
    this.sid=0;this.did=0;
    this.drifters=(s.drifters??[]).map((o,i)=>({id:o.id??'D'+(i+1),pos:[...o.pos],state:o.state??'idle',stolen:o.stolen??0,left:o.state_ticks_left??240}));
    this.charms=(s.charms??this.map.charms.map(pos=>({pos}))).map((c,i)=>({id:c.id??'C'+(i+1),pos:[...(c.pos??this.map.charms[i]??[0,0,0])],left:c.respawn_ticks??Math.round((c.respawn_s??(c.available===false?45:0))*hz)}));
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  pick(a){return a[Math.floor(this.random()*a.length)];}
  get timeLeft(){return Math.max(0,this.duration-this.sim/hz);}
  mote(pos,kind='random',ttl=480){this.motes.push({id:'M'+ ++this.mid,pos:[...pos],kind,ttl:kind==='random'?null:ttl});}
  spawnMote(){
    if(this.motes.filter(m=>m.kind==='random').length>=30)return;
    const points=this.map.motes.filter(pos=>!this.motes.some(m=>dist(m.pos,pos)<.01));
    if(points.length)this.mote(this.pick(points));
  }
  emit(name,data={}){this.events.push({type:'event',tick:this.tick,name,data});}
  damage(by){
    const p=this.player, lost=by==='fall'?p.carried:Math.floor(p.carried/2);
    p.carried-=lost;p.flames--;p.inv=90;
    if(by==='shade')for(let i=0;i<lost;i++){
      const a=this.random()*Math.PI*2,r=1.5+this.random();
      this.mote([p.pos[0]+r*Math.cos(a),p.pos[1],p.pos[2]+r*Math.sin(a)],'dropped');
    }
    this.emit('player_hit',{by,flames:p.flames,dropped:by==='shade'?lost:0,...(by==='fall'?{lost}: {})});
  }
  movePlayer(edge){
    const p=this.player,i=this.input;
    if(this.wait){
      if(--this.wait===0){p.pos=[...this.spawn];p.vel=[0,0,0];p.grounded=true;p.inv=90;this.launch=null;this.dashLeft=0;}
      return;
    }
    const yaw=radians(i.cam_yaw_deg),[x,z]=i.move,norm=Math.max(1,Math.hypot(x,z));
    const dx=(x*Math.cos(yaw)+z*Math.sin(yaw))/norm,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))/norm;
    if(x||z)this.face=dir([0,0,0],[dx,0,dz]);
    if(edge('jump')&&p.grounded){p.vel[1]=7;p.grounded=false;}
    const pad=this.map.pads.find(v=>dist(v,p.pos)<=1 && Math.abs(v[1]-p.pos[1])<.1);
    if(pad && p.grounded){
      this.launch=dir(pad,[pad[3],0,pad[4]]).map(v=>v*(this.night===2?24:8));
      p.vel[1]=this.night===2?14:12;p.grounded=false;
    }
    if(edge('dash') && !this.dashLeft && (!p.dc||p.charm)){
      this.dashLeft=12;this.dashDir=[...this.face];p.dc=p.charm?0:90;this.emit('dash');
    }
    const speed=p.charm?7.2:6;
    const vel=this.dashLeft?this.dashDir.map(v=>14*v):this.launch??[dx*speed,dz*speed];
    p.vel[0]=vel[0];p.vel[2]=vel[1];
    if(this.wind.active){p.vel[0]+=2*Math.cos(radians(this.wind.dir_deg));p.vel[2]+=2*Math.sin(radians(this.wind.dir_deg));}
    const [ox,oy,oz]=p.pos;let nx=ox+p.vel[0]/hz,nz=oz+p.vel[2]/hz;
    let floor=ground(this.night,nx,nz);
    if(floor>oy+.22 || (this.night===3 && Math.hypot(nx,nz)<2 && oy<14)){
      nx=ox;nz=oz;floor=ground(this.night,nx,nz);p.vel[0]=p.vel[2]=0;
    }
    let ny=oy;
    if(!this.dashLeft){p.vel[1]-=20/hz;ny+=p.vel[1]/hz;}
    else this.dashLeft--;
    p.grounded=oy>=floor-.22 && ny<=floor && p.vel[1]<=0;
    if(p.grounded){ny=floor;p.vel[1]=0;this.launch=null;}
    p.pos=[nx,ny,nz];
    if(ny< -10){this.damage('fall');this.wait=60;p.vel=[0,0,0];}
  }
  nudge(s,v,amount){
    const x=s.pos[0]+v[0]*amount,z=s.pos[2]+v[1]*amount;
    const h=ground(this.night,x,z),old=ground(this.night,s.pos[0],s.pos[2]);
    if(!Number.isFinite(h)||h>s.pos[1]+.22||(this.night===3&&Math.hypot(x,z)<2))return;
    s.pos[0]=x;s.pos[2]=z;if(Number.isFinite(old))s.pos[1]+=h-old;
  }
  shelter(s){
    for(const l of this.lanterns)if(l.lit && dist(l.pos,s.pos)<6){
      const [x,z]=dir(l.pos,s.pos);s.pos[0]=l.pos[0]+6*x;s.pos[2]=l.pos[2]+6*z;
    }
  }
  step(frame={}){
    if(['won','lost'].includes(this.state))return [];
    const previous=this.input;this.input={...previous,...frame};
    const edge=k=>this.input[k]&&!previous[k];
    this.events=[];this.tick++;
    if(edge('pause')){
      this.state=this.state==='playing'?'paused':'playing';
      this.emit(this.state==='paused'?'paused':'resumed');
    }
    if(this.state==='paused')return this.events;
    this.sim++;
    const p=this.player;
    for(const key of ['dc','pc','inv','charm'])p[key]=Math.max(0,p[key]-1);
    for(const c of this.charms)c.left=Math.max(0,c.left-1);
    this.motes=this.motes.filter(m=>m.ttl===null||--m.ttl>0);
    for(const s of this.shades)if(s.left>0 && --s.left===0){s.state='wander';s.push=0;}
    if(this.night===3&&this.windEnabled){
      if(this.sim%1800===1680)this.wind.dir_deg=Math.floor(this.random()*360);
      this.wind.active=this.sim>=1800 && this.sim%1800<300;
    }
    this.movePlayer(edge);
    if(!this.wait){
      this.motes=this.motes.filter(m=>{
        if(p.carried>=10||!close(p.pos,m.pos,1))return true;
        this.emit('mote_picked',{carried:++p.carried});return false;
      });
      for(const c of this.charms)if(!c.left&&close(p.pos,c.pos,1)){
        c.left=2700;p.charm=600;this.emit('charm_picked',{charm_id:c.id,charm_ticks:600});
      }
      if(edge('interact')&&p.carried){
        const l=this.lanterns.filter(l=>!l.lit&&dist(l.pos,p.pos)<=2).sort((a,b)=>dist(a.pos,p.pos)-dist(b.pos,p.pos)||a.id.localeCompare(b.id))[0];
        if(l){const amount=Math.min(10-l.deposited,p.carried);p.carried-=amount;l.deposited+=amount;this.score+=10*amount;
          this.emit('deposit',{lantern_id:l.id,amount,deposited:l.deposited});
          if(l.deposited===10){l.lit=true;this.score+=100;this.emit('lantern_lit',{lantern_id:l.id});}
        }
      }
    }
    for(const s of this.shades)this.shelter(s);
    if(!this.wait && edge('pulse') && !p.pc && p.carried>=3){
      p.carried-=3;p.pc=180;
      const inPulse=o=>Math.hypot(p.pos[0]-o.pos[0],p.pos[1]+.8-o.pos[1],p.pos[2]-o.pos[2])<=5;
      const targets=this.shades.filter(inPulse);
      this.emit('pulse',{stunned_ids:targets.map(s=>s.id)});
      for(const s of targets){s.state='stunned';s.left=120;s.push=15;s.away=dir(p.pos,s.pos);this.score+=5;}
      for(const d of this.drifters.filter(inPulse)){
        if(d.state==='chase'){d.state='flee';d.left=240;}
        else if(d.state==='flee'&&d.stolen){this.emit('drifter_drop',{drifter_id:d.id,amount:d.stolen});
          for(let j=0;j<d.stolen;j++)this.mote(d.pos,'dropped');d.stolen=0;d.left=120;}
      }
    }
    for(const s of this.shades){
      const distance=dist(s.pos,p.pos);
      if(s.state==='stunned'){if(s.push>0){this.nudge(s,s.away,4/15);s.push--;}}
      else if(s.state==='recoil')this.nudge(s,s.away,2/60);
      else if(s.state!=='spawning'){
        if(distance<=12)s.state='chase';else if(distance>18)s.state='wander';
        if(s.state==='chase')this.nudge(s,dir(s.pos,p.pos),Math.min(distance,(this.night===3?4.5:4)/hz));
        else {const angle=this.sim/150+s.id.length;this.nudge(s,[Math.cos(angle),Math.sin(angle)],1/hz);}
      }
      this.shelter(s);
    }
    for(const d of this.drifters){
      if(d.state==='flee'){const [x,z]=dir(p.pos,d.pos);d.pos[0]+=7*x/hz;d.pos[2]+=7*z/hz;if(--d.left<=0)d.state='removed';continue;}
      d.state=p.carried>=5 && dist(p.pos,d.pos)<=15?'chase':'idle';
      const [x,z]=d.state==='chase'?dir(d.pos,p.pos):[Math.cos(this.sim/90),Math.sin(this.sim/90)];
      const speed=d.state==='chase'?7:2;d.pos[0]+=x*speed/hz;d.pos[2]+=z*speed/hz;
    }
    this.drifters=this.drifters.filter(d=>d.state!=='removed');
    if(!this.wait){
      for(const d of this.drifters)if(d.state==='chase'&&dist(d.pos,p.pos)<=1.2){
        d.stolen=Math.min(3,p.carried);p.carried-=d.stolen;d.state='flee';d.left=240;
        this.emit('drifter_steal',{drifter_id:d.id,amount:d.stolen,carried:p.carried});
      }
      const safe=this.lanterns.some(l=>l.lit&&dist(p.pos,l.pos)<=6);
      if(!safe&&!p.inv){
        const s=this.shades.filter(s=>['chase','wander'].includes(s.state)&&close(s.pos,p.pos,1)).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}))[0];
        if(s){this.damage('shade');s.state='recoil';s.left=60;s.away=dir(p.pos,s.pos);this.nudge(s,s.away,2/60);}
      }
    }
    if(this.autoMotes && this.sim%240===0)this.spawnMote();
    if(this.autoShades && this.sim>=300 && (this.sim-300)%this.map.period===0){
      const spots=this.map.mist.filter(pos=>dist(pos,p.pos)>=15 && !this.shades.some(s=>dist(s.pos,pos)<1));
      for(let i=0;i<(this.sim===300?2:1)&&spots.length&&this.shades.length<this.map.cap;i++){
        const [pos]=spots.splice(Math.floor(this.random()*spots.length),1);
        let id;do{id='S'+ ++this.sid;}while(this.shades.some(s=>s.id===id));
        this.shades.push({id,pos:[pos[0],pos[1]+.8,pos[2]],state:'spawning',left:1,push:0,away:[1,0]});this.emit('shade_spawned',{id});
      }
    }
    if(this.autoDrifters&&this.night>1&&this.sim%1200===0&&this.drifters.length<2){
      let id;do{id='D'+ ++this.did;}while(this.drifters.some(d=>d.id===id));
      this.drifters.push({id,pos:[...this.pick(this.map.mist)],state:'idle',left:0,stolen:0});
    }
    const reason=p.flames<=0?'no_flames':this.lanterns.every(l=>l.lit)?'all_lit':this.timeLeft===0?'dawn':null;
    if(reason){this.state=reason==='all_lit'?'won':'lost';if(this.state==='won')this.score+=2*Math.floor(this.timeLeft)+50*p.flames;
      this.emit('game_over',{result:this.state,reason});}
    return this.events;
  }
  snapshot(){
    const p=this.player;
    return {type:'snapshot',night:this.night,tick:this.tick,sim_tick:this.sim,state:this.state,time_left_s:this.timeLeft,score:this.score,wind:{...this.wind},
      player:{pos:rounded(p.pos),vel:rounded(p.vel),grounded:p.grounded,flames:p.flames,carried:p.carried,invuln:p.inv>0,dash_cd_s:p.dc/hz,pulse_cd_s:p.pc/hz,charm_s:p.charm/hz},
      lanterns:this.lanterns.map(l=>({...l,pos:rounded(l.pos)})),shades:this.shades.map(s=>({id:s.id,pos:rounded(s.pos),state:s.state})),
      motes_active:this.motes.length,motes:this.motes.map(m=>({id:m.id,pos:rounded(m.pos),kind:m.kind,ttl_s:m.ttl===null?null:m.ttl/hz})),
      drifters:this.drifters.map(d=>({id:d.id,pos:rounded(d.pos),state:d.state,stolen:d.stolen})),
      charms:this.charms.map(c=>({id:c.id,available:c.left===0,respawn_s:c.left/hz}))};
  }
}
