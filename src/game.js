import {benchmarkNight,benchmarkActors,frameMeter} from './benchmark.js';
import {bindings,actionFor,keyName,prefs,accessibilityControls} from './preferences.js';
import {scoresList,scoreForm} from './scores-ui.js';
import * as THREE from 'three';
import manifest from '../game.contract.json';
import {maps,ground} from './maps.js';
import {cue,music,unlock,setVolume} from './sound.js';
import {Night} from './core.js';

const $ = selector => document.querySelector(selector);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1430);
scene.fog = new THREE.FogExp2(0x1b2350,.013);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
$('#world').append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(52,1,.1,200);
function resize() {
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
}
resize(); window.addEventListener('resize',resize);
const sky = new THREE.HemisphereLight(0xffe2d4,0x797393,1.6);
scene.add(sky);
const moonlight = new THREE.DirectionalLight(0xffdaac,2.0);
moonlight.position.set(10,30,-20); scene.add(moonlight);
function material(color, glow = false) {
  return glow ? new THREE.MeshBasicMaterial({color}) : new THREE.MeshStandardMaterial({color,flatShading:true});
}
function shape(parent,geo,mat,x=0,y=0,z=0) {
  const mesh = new THREE.Mesh(geo,mat);
  mesh.position.set(x,y,z); parent.add(mesh); return mesh;
}
function cylinder(top,bottom,height,sides=12) { return new THREE.CylinderGeometry(top,bottom,height,sides); }
const sphere = new THREE.IcosahedronGeometry(1,1);
const wood = material(0x6b4a2f), gold = material(0xfff6c2,true);
const haloCanvas=document.createElement('canvas');
haloCanvas.width=haloCanvas.height=64;
const brush=haloCanvas.getContext('2d');
const glow=brush.createRadialGradient(32,32,0,32,32,32);
glow.addColorStop(0,'rgba(255,229,138,.95)');glow.addColorStop(.24,'rgba(255,229,138,.5)');glow.addColorStop(1,'rgba(255,160,50,0)');
brush.fillStyle=glow;brush.fillRect(0,0,64,64);
const haloMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
function halo(parent,size,y=0){
  const sprite=new THREE.Sprite(haloMat);sprite.scale.setScalar(size);sprite.position.y=y;parent.add(sprite);return sprite;
}
let terrain;
function landscape(n){
  if(terrain){scene.remove(terrain);terrain.traverse(o=>o.geometry?.dispose());}
  terrain=new THREE.Group();scene.add(terrain);
  const land=material(0x2f5d50),sand=material(0xc9b48a),sea=material(0x12384a);
  for(const [x,r] of maps[n].islands){
    shape(terrain,cylinder(r,r-3,3,72),sand,x,-1.65);
    shape(terrain,cylinder(r,r,.2,72),land,x,-.1);
    for(let i=0;i<10;i++){
      const a=i*2.39996;
      const cloud=shape(terrain,new THREE.IcosahedronGeometry(1),sea,x+(r+5)*Math.cos(a),-4,(r+5)*Math.sin(a));
      cloud.scale.set(8,3,7);
    }
  }
  if(n===2) shape(terrain,new THREE.BoxGeometry(18,.25,4),wood,35,-.12,0);
  if(n===3){
    const outline=new THREE.Shape();outline.absarc(0,0,24,0,Math.PI,false);outline.absarc(0,0,12,Math.PI,0,true);outline.closePath();
    const shelf=shape(terrain,new THREE.ExtrudeGeometry(outline,{depth:3,bevelEnabled:false,curveSegments:48}),land,0,3,0);
    shelf.rotation.x=Math.PI/2;
    shape(terrain,cylinder(8,8,6,64),land,0,3,0);shape(terrain,cylinder(2,2,8,24),wood,0,10,0);
    for(const a of [Math.PI/6,5*Math.PI/6]){
      const group=new THREE.Group();terrain.add(group);group.rotation.y=-a;group.position.set(27*Math.cos(a),1.4,27*Math.sin(a));
      shape(group,new THREE.BoxGeometry(Math.hypot(6,3),.2,3),sand).rotation.z=-Math.atan(.5);
    }
  }
  for(const [x,y,z] of maps[n].pads)shape(terrain,cylinder(1,1,.12),material(0xf2c14e),x,y+.06,z);
}
const hero = new THREE.Group();scene.add(hero);
shape(hero,cylinder(.5,.78,1.2),material(0xe8e2d0),0,.75);
shape(hero,sphere,material(0xe5bc92),0,1.65).scale.setScalar(.46);
shape(hero,new THREE.ConeGeometry(.98,.65,16),material(0xe8bb79),0,2.13);
shape(hero,cylinder(.025,.025,.5),wood,.66,1.73);
shape(hero,sphere,gold,.83,1.39).scale.set(.17,.23,.17);
halo(hero,1.3,1.39).position.x=.83;
shape(hero,cylinder(.54,.56,.19),material(0xc8102e),0,1.37);
const lanternNodes = new Map(), moteNodes = new Map(), shadeNodes = new Map();
let accessible=localStorage.getItem('lantern-accessible')==='true';
document.body.classList.toggle('accessible',accessible);
const enemyAccent=material(accessible?0x00b3ff:0x7a3cff,true);
const outlineMaterial=enemyAccent.clone();outlineMaterial.side=THREE.BackSide;
const gaugeBack=material(0x1b2350,true),gaugeFill=material(0xffe9b0,true);
const dormant = material(0x5b5f6e),paper = material(0xffb347,true);
function lamp() {
  const group = new THREE.Group();scene.add(group);
  shape(group,cylinder(.65,.9,.3),wood,0,.15);
  shape(group,cylinder(.12,.19,2.4),wood,0,1.4);
  group.userData.paper = shape(group,cylinder(.65,.55,1,8),dormant,0,2.8);
  const torn=new THREE.BufferGeometry();
  torn.setAttribute('position',new THREE.Float32BufferAttribute([-.20,.32,.61,-.09,-.14,.61,-.04,.20,.61, -.09,-.14,.61,.06,-.29,.61,-.04,.20,.61],3));
  group.userData.tear=shape(group,torn,material(0x120a1a,true),0,2.8);
  group.userData.tear.material.side=THREE.DoubleSide;
  const gauge=new THREE.Group();group.add(gauge);gauge.position.y=4.12;
  shape(gauge,new THREE.BoxGeometry(1.65,.22,.04),gaugeBack);
  const fill=shape(gauge,new THREE.BoxGeometry(1.55,.13,.02),gaugeFill,0,0,.04);
  group.userData.gauge=gauge;group.userData.fill=fill;
  group.userData.glow=halo(group,5,2.8);
  shape(group,sphere,material(0xffe9b0,true),0,2.8).scale.setScalar(.16);
  shape(group,new THREE.ConeGeometry(.94,.56,8),wood,0,3.55);
  return group;
}
function sync(objects,nodes,create,update) {
  const ids = new Set();
  for (const item of objects) {
    ids.add(item.id);
    if(!nodes.has(item.id)) nodes.set(item.id,create());
    const mesh=nodes.get(item.id);
    mesh.position.set(...item.pos);update(mesh,item);
  }
  for(const [id,node] of nodes) if(!ids.has(id)){scene.remove(node);nodes.delete(id);}
}
const keys=new Set(),actions=new Set(),drifterNodes=new Map(),charmNodes=new Map();
const params=new URLSearchParams(location.search),bench=params.has('bench');
let campaignSeed=0,shadeNotice=null,actorBatch,benchStart;
const meter=bench?frameMeter(Number(params.get('duration'))):null;
let game,yaw=0,accumulator=0,last=performance.now(),pulseAt=-100,screen,total=0;
let sensitivity=Number(localStorage.getItem('lantern-sensitivity')??1);
let volume=Number(localStorage.getItem('lantern-volume')??.45);setVolume(volume);
const ring=shape(scene,new THREE.TorusGeometry(1,.035,6,72),gold);ring.rotation.x=Math.PI/2;
const dialog=$('dialog');
function panel(id,label,title,description,buttons){
  screen=id;keys.clear();actions.clear();$('#eyebrow').textContent=label;$('h1').textContent=title;
  $('dialog p').textContent=description;$('#controls').replaceChildren();$('#buttons').replaceChildren();
  $('footer').textContent=[['forward','Tiến'],['back','Lùi'],['left','Trái'],['right','Phải'],['jump','Nhảy'],['dash','Lướt'],['interact','Nạp'],['pulse','Tỏa sáng'],['pause','Dừng']].map(([key,text])=>keyName(bindings[key])+' '+text).join(' · ');
  for(const [caption,action] of buttons){
    const b=document.createElement('button');b.textContent=caption;b.onclick=action;$('#buttons').append(b);
  }
  if(!dialog.open)dialog.showModal();
}
function start(n){
  game=bench?benchmarkNight(manifest.tuning,Number(params.get('bench'))):new Night(manifest.tuning,campaignSeed+n-1,{},n);
  shadeNotice=null;
  landscape(n);yaw=0;pulseAt=-100;last=performance.now();accumulator=0;
}
function intro(n){
  start(n);const words=['Giữ ít nhất ba đèn sáng tới bình minh. Đèn yếu cần châm dầu, Mây nhé.','Qua cầu tre, con sẽ tìm thấy bùa gió.','Theo dốc lên tháp chuông trước khi trời sáng.'];
  panel('intro','ÔNG ĐĂNG · ĐÊM '+n,maps[n].name,words[n-1],[['Vào đảo',()=>{unlock();screen='play';dialog.close();}]]);
}
function menu(){panel('menu','BIỂN MÂY · BA HÒN ĐẢO','Đảo Đèn Lồng','Cùng Mây giữ đèn sáng tới bình minh qua ba đêm giữa biển mây.',[['Bắt đầu',()=>{total=0;campaignSeed=Math.floor(Math.random()*4294967296);intro(1);}],['Bảng xếp hạng',()=>{panel('scores','ĐIỂM CAO','Bảng xếp hạng','Top 10 trên máy này',[['Về menu',menu]]);scoresList($('#controls'));}],['Cài đặt',()=>settings(menu)]]);}
function togglePause(){
  game.step({pause:false});game.step({pause:true});
}
function resume(){togglePause();screen='play';dialog.close();}
function pauseMenu(){panel('pause','ĐÊM '+game.night,'Tạm dừng',maps[game.night].name,[['Tiếp tục',resume],['Chơi lại Đêm',()=>intro(game.night)],['Cài đặt',()=>settings(pauseMenu)],['Về menu',menu]]);}
function settings(back){
  panel('settings','TÙY CHỌN','Cài đặt','Kéo chuột trên đảo để xoay góc nhìn.',[['Trở về',back]]);
  accessibilityControls($('#controls'));
  const option=document.createElement('label'),box=document.createElement('input');
  option.textContent='Bảng màu dễ phân biệt';box.type='checkbox';box.checked=accessible;
  box.onchange=()=>{accessible=box.checked;localStorage.setItem('lantern-accessible',String(accessible));
    document.body.classList.toggle('accessible',accessible);
    enemyAccent.color.setHex(accessible?0x00b3ff:0x7a3cff);outlineMaterial.color.copy(enemyAccent.color);};
  option.append(box);$('#controls').append(option);
  for(const [name,key,min,max,value,apply] of [['Âm lượng','volume',0,1,volume,v=>setVolume(volume=v)],['Độ nhạy chuột','sensitivity',.2,3,sensitivity,v=>sensitivity=v]]){
    const label=document.createElement('label'),input=document.createElement('input');label.textContent=name;
    input.type='range';input.min=min;input.max=max;input.step=.05;input.value=value;
    input.oninput=()=>{apply(+input.value);localStorage.setItem('lantern-'+key,input.value);};label.append(input);$('#controls').append(label);
  }
}
dialog.addEventListener('cancel',e=>{e.preventDefault();if(screen==='pause')resume();});
window.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea')||screen==='settings')return;
  if(e.code===bindings.pause||e.code==='Escape'){
    if(e.repeat)return;e.preventDefault();
    if(screen==='play'){game.step({pause:true});pauseMenu();}else if(screen==='pause')resume();return;
  }
  if(screen!=='play')return;
  const action=actionFor(e.code);
  if(action||['KeyQ','KeyR'].includes(e.code)){e.preventDefault();keys.add(e.code);if(!e.repeat&&action)actions.add(action);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();actions.clear();});
renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons===1&&screen==='play')yaw-=e.movementX*.25*sensitivity;});
function step(){
  yaw+=(Number(keys.has('KeyQ'))-Number(keys.has('KeyR')))*1.5;
  const frame={move:[Number(keys.has(bindings.left))-Number(keys.has(bindings.right)),Number(keys.has(bindings.forward))-Number(keys.has(bindings.back))],cam_yaw_deg:yaw,pause:false};
  for(const action of ['jump','dash','interact','pulse'])frame[action]=actions.has(action);
  if(frame.jump&&game.player.grounded)cue('jump');actions.clear();
  for(const e of game.step(frame)){
    cue(e.name);if(e.name==='shade_spawned')shadeNotice={pos:[...game.shades.find(s=>s.id===e.data.id).pos],until:game.sim+180};if(e.name==='pulse')pulseAt=game.sim;
    if(e.name==='game_over'){
      cue(game.state);const n=game.night,won=game.state==='won';if(won)total+=game.score;
      panel('result','ĐÊM '+n+' · '+maps[n].name,won?(n===3?'Bình Minh':'Đảo đón bình minh'):'Đêm đã khép lại',
        'Điểm Đêm '+game.score+' · Tổng điểm '+total,[[won?(n===3?'Về menu':'Đêm kế tiếp'):'Chơi lại Đêm',()=>won&&n===3?menu():intro(won?n+1:n)]]);
      if(!won||n===3)scoreForm($('#controls'),{score:total,nights_won:won?3:n-1,seed:campaignSeed});
    }
  }
  if(game.sim%90===1)music();
  if(game.timeLeft<=10&&game.sim%60===0)cue('count');
  if(game.night===3&&game.sim%1800===1680)cue('wind');
}
const shadow=material(0x120a1a),stunned=material(0x3a3450),silk=material(0x8fa3b8),red=material(0xc8102e),trim=material(0xf2c14e);
const leaves=new THREE.Group();scene.add(leaves);
for(let i=0;i<12;i++){const leaf=shape(leaves,sphere,trim);leaf.scale.set(.22,.04,.08);}
function draw(now){
  accumulator+=Math.min((now-last)/1000,.2);last=now;
  while(accumulator>=1/60){if(bench){game.sim++;for(const s of game.shades){game.wander(s);game.shelter(s);}}else if(screen==='play')step();accumulator-=1/60;}
  const p=game.player,[x,y,z]=p.pos,a=yaw*Math.PI/180;
  hero.position.set(x,y,z);hero.rotation.y=Math.atan2(game.face[0],game.face[1]);
  camera.position.set(x-13*Math.sin(a),y+10,z-13*Math.cos(a));camera.lookAt(x+2*Math.sin(a),y+1,z+2*Math.cos(a));if(bench){benchStart??=now;const orbit=(now-benchStart)*2*Math.PI/15000;camera.position.set(30*Math.cos(orbit),15,-30*Math.sin(orbit));camera.lookAt(0,0,0);}camera.updateMatrixWorld();
  sync(game.lanterns,lanternNodes,lamp,(node,l)=>{const u=node.userData,low=l.lit&&l.oil<manifest.tuning.low_fuel_threshold*60;
    const on=prefs.reduced||!low || game.sim%60<30;
    u.paper.material=l.lit&&on?paper:dormant;u.paper.scale.y=l.lit?1:.8;
    u.tear.visible=!l.lit;u.tear.rotation.y=a+Math.PI;
    u.glow.visible=l.lit&&on;u.gauge.visible=l.lit&&on;u.gauge.quaternion.copy(camera.quaternion);
    const fraction=l.oil/(60*manifest.tuning.fuel_max);u.fill.scale.x=fraction;u.fill.position.x=(fraction-1)*.775;});
  if(bench)actorBatch(camera);else {
  sync(game.motes,moteNodes,()=>{const node=shape(scene,sphere,gold);halo(node,8);return node;},(node,m)=>{
    node.position.y+=.8+.16*Math.sin(game.sim/24+Number(m.id.slice(1)));node.scale.setScalar(.22);
  });
  sync(game.shades,shadeNodes,()=>{const node=shape(scene,sphere,shadow);const edge=shape(node,sphere,outlineMaterial);edge.scale.setScalar(1.06);for(const x of [-.32,.32])shape(node,sphere,enemyAccent,x,.13,.88).scale.set(.12,.15,.09);return node;},(node,s)=>{
    node.rotation.y=Math.atan2(x-s.pos[0],z-s.pos[2]);node.scale.set(.85,1,.85);node.material=s.state==='stunned'?stunned:shadow;
  });
  }
  sync(game.drifters,drifterNodes,()=>shape(scene,sphere,silk),node=>{node.scale.set(1.1,.18,.4);node.position.y+=1;});
  sync(game.charms,charmNodes,()=>{const node=shape(scene,new THREE.BoxGeometry(.6,.85,.12),trim);shape(node,new THREE.BoxGeometry(.51,.76,.15),red);return node;},(node,c)=>{node.visible=!c.left;node.position.y+=.7;});
  leaves.visible=!prefs.reduced&&game.night===3&&(game.sim%1800>=1680||game.wind.active);
  if(leaves.visible)leaves.children.forEach((leaf,i)=>leaf.position.set(x+(game.sim/10+i*2)%12-6,y+1+i%3,z+i%5-2));
  ring.visible=game.sim-pulseAt<20;ring.position.set(x,y+.2,z);ring.scale.setScalar(.1+5*Math.min(1,(game.sim-pulseAt)/20));
  const lit=game.lanterns.filter(l=>l.lit).length;
  sky.intensity=.15+.55*lit/game.lanterns.length;
  if(!bench || game.sim===0 || !$('#night').textContent){
  $('#night').textContent='ĐÊM 0'+game.night+' · '+maps[game.night].name;$('#life').textContent='♥'.repeat(p.flames);
  const secs=Math.ceil(game.timeLeft);$('#clock').textContent=(accessible&&secs<=30?'⚠ ':'')+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');$('#clock').classList.toggle('danger',secs<=30);
  $('#points').textContent=game.score+' điểm';$('#lights').textContent='◆ '+lit+'/'+game.lanterns.length+' · Mục tiêu '+Math.ceil(game.lanterns.length*manifest.tuning.win_ratio);
  $('#bag').textContent='▰'.repeat(p.carried)+'▱'.repeat(Math.max(0,game.capacity-p.carried))+' '+p.carried+'/'+game.capacity;
  $('#cool').textContent='⇢ Lướt '+(p.dc&&!p.charm?(p.dc/60).toFixed(1)+'s':'✓')+'　✧ Tỏa sáng '+(p.pc?(p.pc/60).toFixed(1)+'s':'✓');
  const nearest=game.lanterns.filter(l=>!l.lit).sort((l,r)=>Math.hypot(l.pos[0]-x,l.pos[2]-z)-Math.hypot(r.pos[0]-x,r.pos[2]-z))[0];
  const target=game.interactionTarget();
  $('#hint').textContent=target?(target.lit?keyName(bindings.interact)+' — Châm dầu ('+Math.floor(target.oil/60)+'/100)':keyName(bindings.interact)+' — Nạp ánh sáng ('+target.deposited+'/'+(target.ever_lit?5:10)+')'):p.charm?'Bùa Gió · '+Math.ceil(p.charm/60)+'s':'';
  const arrow=$('#arrow');arrow.textContent='';
  if(nearest){const v=new THREE.Vector3(...nearest.pos).project(camera);
    if(Math.abs(v.x)>1||Math.abs(v.y)>1||v.z>1){arrow.textContent='➤ '+nearest.id;arrow.style.transform='rotate('+Math.atan2(-v.y*(v.z>1?-1:1),v.x*(v.z>1?-1:1))+'rad)';}}
  const warnings=[];
  const marker=$('#spawn-arrow');marker.hidden=true;
  if(shadeNotice&&game.sim<shadeNotice.until){
    warnings.push('Bóng Mực xuất hiện');const dx=shadeNotice.pos[0]-x,dz=shadeNotice.pos[2]-z;
    const theta=Math.atan2(-(dx*Math.sin(a)+dz*Math.cos(a)),-dx*Math.cos(a)+dz*Math.sin(a));
    marker.hidden=false;marker.style.left=(50+46*Math.cos(theta))+'%';marker.style.top=(50+42*Math.sin(theta))+'%';
    marker.style.transform='translate(-50%,-50%) rotate('+theta+'rad)';
  }
  if(game.night===3&&game.sim%1800>=1680)warnings.push('Gió sắp thổi');
  if(secs<=10)warnings.push('Bình minh trong '+secs+' giây');
  const low=game.lanterns.filter(l=>l.lit&&l.oil<1800);if(low.length)warnings.push('Đèn sắp cạn dầu: '+low.map(l=>l.id).join(', '));
  const notice=warnings.length?'⚠ '+warnings.join(' · '):'';
  if($('#captions').textContent!==notice)$('#captions').textContent=notice;
  }
  renderer.render(scene,camera);if(bench)meter(now);requestAnimationFrame(draw);
}
start(1);
if(bench){screen='bench';actorBatch=benchmarkActors(scene,game,sphere,{shadow,outline:outlineMaterial,eye:enemyAccent,gold},haloMat.map);}
else menu();
requestAnimationFrame(draw);
