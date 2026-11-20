import * as THREE from 'three';
import {Night} from './core.js';

export function benchmarkNight(tuning,seed){
  // Uniform area via stratified radius and a seed-dependent golden-angle spiral.
  let phase=(seed>>>0)*2.399963229728653;
  function points(n,y){phase+=.71;return Array.from({length:n},(_,i)=>{
    const r=39*Math.sqrt((i+.5)/n),a=phase+i*2.399963229728653;
    return [r*Math.cos(a),y,r*Math.sin(a)];
  });}
  return new Night(tuning,seed,{random_motes:false,random_shades:false,motes:points(100,0),
    shades:points(200,.8).map(pos=>({pos,state:'wander'})),
    lanterns:['L1','L2','L3'].map(id=>({id,lit:true,fuel:100}))});
}
export function benchmarkActors(scene,game,sphere,materials,haloTexture){
  const dummy=new THREE.Object3D();
  function batch(n,geo,mat){const m=new THREE.InstancedMesh(geo,mat,n);m.frustumCulled=false;scene.add(m);return m;}
  const body=batch(200,sphere,materials.shadow),rim=batch(200,sphere,materials.outline);
  const eyes=batch(400,sphere,materials.eye),cores=batch(100,sphere,materials.gold);
  const halos=batch(100,new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial({map:haloTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  function put(m,i,x,y,z,sx,sy,sz){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}
  return camera=>{
    dummy.quaternion.identity();
    game.shades.forEach((s,i)=>{
      const [x,y,z]=s.pos,a=Math.atan2(-x,-z);
      put(body,i,x,y,z,.85,1,.85);put(rim,i,x,y,z,.901,1.06,.901);
      for(let side=0;side<2;side++){const dx=side?.272:-.272;
        put(eyes,2*i+side,x+Math.cos(a)*dx+.748*Math.sin(a),y+.13,z-Math.sin(a)*dx+.748*Math.cos(a),.102,.15,.077);}
    });
    game.motes.forEach((m,i)=>{const [x,y,z]=m.pos;put(cores,i,x,y+.8+.16*Math.sin(game.sim/24+i+1),z,.22,.22,.22);});
    dummy.quaternion.copy(camera.quaternion);
    game.motes.forEach((m,i)=>{const [x,y,z]=m.pos;put(halos,i,x,y+.8+.16*Math.sin(game.sim/24+i+1),z,1.76,1.76,1);});
    for(const mesh of [body,rim,eyes,cores,halos])mesh.instanceMatrix.needsUpdate=true;
  };
}
export function frameMeter(seconds){
  let first,prev,elapsed=0,started=false;const samples=[];
  return now=>{
    if(first===undefined){first=now;window.lanternFirstFrame=Date.now();return;}
    if(!started){if(now-first>=3000){started=true;prev=now;}return;}
    if(window.lanternMeasurements)return;
    samples.push(now-prev);prev=now;
    elapsed+=samples.at(-1);
    if(elapsed>=seconds*1000)window.lanternMeasurements={samples:[...samples],renderer:'Three.js r'+THREE.REVISION+' / WebGL2'};
  };
}
