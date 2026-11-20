let context,volume=.45,beat=0;
export function setVolume(v){volume=v;}
export function unlock(){context??=new AudioContext();context.resume();}
const cues={mote_picked:880,lantern_lit:660,pulse:180,player_hit:92,jump:390,dash:520,
  won:780,lost:130,shade_spawned:100,count:440,wind:260,charm_picked:990,drifter_steal:145};
function tone(freq,length,level,type='sine'){
  if(!context||!volume||context.state!=='running')return;
  const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
  osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume*level),now+.025);
  gain.gain.exponentialRampToValueAtTime(.0001,now+length);
  osc.connect(gain);gain.connect(context.destination);osc.start();osc.stop(now+length);
}
export function cue(name){if(cues[name])tone(cues[name],.26,.16,name==='player_hit'?'triangle':'sine');}
export function music(){tone([220,261.63,329.63,293.66,246.94,196][beat++%6],1.4,.09);}
