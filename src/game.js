import * as THREE from 'three';
import manifest from '../game.contract.json';
import {Night,islandRadius} from './core.js';

const $ = selector => document.querySelector(selector);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x555074);
scene.fog = new THREE.FogExp2(0x494662,.013);
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
const wood = material(0x724b48), gold = material(0xffcf72,true);
shape(scene,cylinder(islandRadius+0.1,29,6,80),material(0x625b67),0,-3.24);
shape(scene,cylinder(islandRadius+.15,islandRadius+.15,.26,80),material(0x385455),0,-.13);
const tuft = new THREE.ConeGeometry(.14,.45,3);
const grass = new THREE.InstancedMesh(tuft,material(0x557363),520);
const placement = new THREE.Object3D();
for(let i=0;i<grass.count;i++){
  const angle=i*2.39996, r=33*Math.sqrt(i/grass.count);
  placement.position.set(r*Math.cos(angle),.18,r*Math.sin(angle));
  placement.rotation.z=.25*Math.sin(i);placement.updateMatrix();grass.setMatrixAt(i,placement.matrix);
}
scene.add(grass);
const haloCanvas=document.createElement('canvas');
haloCanvas.width=haloCanvas.height=64;
const brush=haloCanvas.getContext('2d');
const glow=brush.createRadialGradient(32,32,0,32,32,32);
glow.addColorStop(0,'rgba(255,231,155,.95)');glow.addColorStop(.24,'rgba(255,184,80,.5)');glow.addColorStop(1,'rgba(255,160,50,0)');
brush.fillStyle=glow;brush.fillRect(0,0,64,64);
const haloMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
function halo(parent,size,y=0){
  const sprite=new THREE.Sprite(haloMat);sprite.scale.setScalar(size);sprite.position.y=y;parent.add(sprite);return sprite;
}
const cloudMat = material(0xc9bace);
for(let i=0;i<80;i++){
  const a=i*2.39996, r=42+(i%9)*4;
  const cloud=shape(scene,sphere,cloudMat,r*Math.cos(a),-5-i%4,r*Math.sin(a));
  cloud.scale.set(8+i%5,3+i%3,8);
}
for(let i=0;i<28;i++){
  const a=i*2.39996,r=30+i%3,x=r*Math.cos(a),z=r*Math.sin(a);
  shape(scene,cylinder(.24,.4,2),wood,x,1,z);
  shape(scene,new THREE.ConeGeometry(1.8,3.5,7),material(i%2?0x485e62:0x516f69),x,3,z);
}
const hero = new THREE.Group();scene.add(hero);
shape(hero,cylinder(.5,.78,1.2),material(0xd97c4e),0,.75);
shape(hero,sphere,material(0xe5bc92),0,1.65).scale.setScalar(.46);
shape(hero,new THREE.ConeGeometry(.98,.65,16),material(0xe8bb79),0,2.13);
shape(hero,cylinder(.025,.025,.5),wood,.66,1.73);
shape(hero,sphere,gold,.83,1.39).scale.set(.17,.23,.17);
halo(hero,1.3,1.39).position.x=.83;
const lanternNodes = new Map(), moteNodes = new Map(), shadeNodes = new Map();
const dormant = material(0x897987),paper = material(0xffb34e,true);
function lamp() {
  const group = new THREE.Group();scene.add(group);
  shape(group,cylinder(.65,.9,.3),wood,0,.15);
  shape(group,cylinder(.12,.19,2.4),wood,0,1.4);
  group.userData.paper = shape(group,cylinder(.65,.55,1,8),dormant,0,2.8);
  group.userData.glow=halo(group,5,2.8);
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
const keys = new Set(), actions = new Set();
const bindings = {Space:'jump',KeyE:'interact',KeyF:'pulse'};
let game, yaw, accumulator, last, message, until, pulseAt;
const ring = shape(scene,new THREE.TorusGeometry(1,.025,6,80),gold);
ring.rotation.x=Math.PI/2;
function restart() {
  game=new Night(manifest.tuning,Math.floor(Math.random()*4294967296));
  yaw=0;accumulator=0;last=performance.now();until=210;message='Nhặt đom đóm vàng và mang về năm đèn lớn.';pulseAt=-100;
  keys.clear();actions.clear();if($('dialog').open) $('dialog').close();
}
$('button').onclick=restart;
window.addEventListener('keydown',e=>{
  if($('dialog').open || !['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyR',...Object.keys(bindings)].includes(e.code))return;
  e.preventDefault();keys.add(e.code);if(!e.repeat && bindings[e.code])actions.add(bindings[e.code]);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();actions.clear();});
function step() {
  yaw+=(Number(keys.has('KeyQ'))-Number(keys.has('KeyR')))*1.5;
  const frame={move:[Number(keys.has('KeyA'))-Number(keys.has('KeyD')),Number(keys.has('KeyW'))-Number(keys.has('KeyS'))],
    cam_yaw_deg:yaw};
  for(const action of Object.values(bindings)) frame[action]=actions.has(action);
  actions.clear();
  for(const e of game.step(frame)){
    if(e.name==='pulse') pulseAt=game.tick;
    if(e.name==='player_hit'||e.name==='lantern_lit'){
      message=e.name==='player_hit'?'Bóng Mực chạm Mây · mất một ngọn lửa':'Đèn đã sáng · vùng sáng bảo vệ Mây';
      until=game.tick+100;
    }
    if(e.name==='game_over'){
      $('h2').textContent=game.state==='won'?'Đảo Bến bừng sáng':'Đêm đã khép lại';
      $('dialog p').textContent=({all_lit:'Cả năm đèn đã sáng',dawn:'Bình minh đã đến',no_flames:'Mây đã cạn lửa'})[e.data.reason]+' · '+game.score+' điểm';
      $('dialog').showModal();
    }
  }
}
const shadow=material(0x33304d), stunned=material(0xbfa7e6);
function draw(now) {
  accumulator+=Math.min((now-last)/1000,.2);last=now;
  while(accumulator>=1/60){if(game.state==='playing')step();accumulator-=1/60;}
  const [x,y,z]=game.player.pos;
  hero.position.set(x,y,z);
  const a=yaw*Math.PI/180;
  camera.position.set(x-13*Math.sin(a),y+10,z-13*Math.cos(a));
  camera.lookAt(x+2*Math.sin(a),y+1,z+2*Math.cos(a));
  sync(game.lanterns,lanternNodes,lamp,(node,l)=>{node.userData.paper.material=l.lit?paper:dormant;node.userData.glow.visible=l.lit;});
  sync(game.motes,moteNodes,()=>{const node=shape(scene,sphere,gold);halo(node,8);return node;},(node,m)=>{
    node.position.y+=.8+.18*Math.sin(now/400+Number(m.id.slice(1)));node.scale.setScalar(.22);
  });
  sync(game.shades,shadeNodes,()=>shape(scene,sphere,shadow),(node,s)=>{
    node.position.y+=.3*Math.sin(now/500);node.scale.set(.85,1.1,.85);node.material=s.state==='stunned'?stunned:shadow;
  });
  ring.visible=game.tick-pulseAt<26;
  ring.position.set(x,.2,z);ring.scale.setScalar(.1+manifest.tuning.pulse_radius*Math.min(1,(game.tick-pulseAt)/25));
  const lit=game.lanterns.filter(l=>l.lit).length;
  sky.intensity=.95+lit*.30;scene.background.setHSL(.70,.23,.19+.035*lit);
  const seconds=Math.ceil(game.timeLeft);
  $('#clock').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  $('#points').textContent=game.score+' điểm';
  $('#bag').textContent=game.player.carried+' / '+manifest.tuning.carry_capacity+' đom đóm';
  $('#life').textContent='♥'.repeat(game.player.flames);
  $('#lights').textContent=game.lanterns.map(l=>l.lit?'◆':'◇').join(' ')+'  '+lit+'/5';
  const near=game.lanterns.find(l=>!l.lit && Math.hypot(l.pos[0]-x,l.pos[2]-z)<=manifest.tuning.interact_radius);
  $('#hint').textContent=near?'E · Nạp đèn '+near.id+' ('+near.deposited+'/'+manifest.tuning.lantern_cost+')':game.tick<until?message:'';
  renderer.render(scene,camera);requestAnimationFrame(draw);
}
restart();requestAnimationFrame(draw);
