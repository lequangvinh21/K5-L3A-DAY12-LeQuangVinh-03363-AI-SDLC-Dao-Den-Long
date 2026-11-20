const hz = 60;
export const islandRadius = 34;
const defaults = () => ({move: [0, 0], cam_yaw_deg: 0, interact: false, pulse: false, jump: false});
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const roundPos = pos => pos.map(v => Number(v.toFixed(3)));

function generator(seed) {
  let n = seed >>> 0;
  return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export class Night {
  constructor(tuning, seed, scene = {}) {
    this.t = tuning;
    this.random = generator(seed);
    this.tick = this.score = this.verticalSpeed = this.nextPulse = this.nextHit = 0;
    this.input = defaults();
    this.state = 'playing';
    this.duration = scene.time_left_s ?? tuning.night1_duration_s;
    this.player = {flames: tuning.flames, carried: 0, ...scene.player, pos: [...(scene.player?.pos ?? [0,0,0])]};
    this.lanterns = Array.from({length: tuning.lantern_count_night1}, (_, i) => {
      const angle = 2 * Math.PI * i / tuning.lantern_count_night1;
      const id = 'L' + (i + 1);
      const override = scene.lanterns?.find(l => l.id === id);
      const deposited = override?.deposited ?? 0;
      const lit = override?.lit ?? (deposited >= tuning.lantern_cost);
      return {id, pos: [...(override?.pos ?? [22*Math.sin(angle),0,22*Math.cos(angle)])],
        lit, deposited: override?.deposited ?? (lit ? tuning.lantern_cost : 0)};
    });
    this.autoMotes = scene.random_motes ?? true;
    this.autoShades = scene.random_shades ?? true;
    const motes = scene.motes ?? (this.autoMotes ? Array.from({length: 45}, () => this.point()) : []);
    this.moteId = 0;
    this.motes = motes.map(pos => ({id: 'M' + ++this.moteId, pos: [...pos]}));
    this.shadeId = 0;
    this.shades = [];
    const shades = scene.shades ?? (this.autoShades ? [{pos: [28,1,-10]}] : []);
    this.usedIds = new Set(shades.map(s => s.id).filter(Boolean));
    for (const s of shades) this.addShade(s.pos, s.id);
  }
  point() {
    const r = 30 * Math.sqrt(this.random()), a = 2*Math.PI*this.random();
    return [r*Math.cos(a),0,r*Math.sin(a)];
  }
  addShade(pos, id) {
    if (!id) {
      do { id = 'S' + ++this.shadeId; } while (this.usedIds.has(id));
    }
    this.usedIds.add(id);
    this.shades.push({id, pos: [...pos], state: 'chase', wake: 0});
    return id;
  }
  get timeLeft() { return Math.max(0, this.duration - this.tick / hz); }
  step(frame = {}) {
    if (this.state !== 'playing') return [];
    const prev = this.input, input = {...prev, ...frame};
    this.input = input;
    this.tick++;
    const t = this.t, p = this.player, events = [];
    const emit = (name, data) => events.push({type: 'event', tick: this.tick, name, data});
    const yaw = input.cam_yaw_deg * Math.PI/180;
    const [x,z] = input.move;
    const stride = t.player_speed / hz / Math.max(1, Math.hypot(x,z));
    p.pos[0] += (x*Math.cos(yaw) + z*Math.sin(yaw))*stride;
    p.pos[2] += (-x*Math.sin(yaw) + z*Math.cos(yaw))*stride;
    const r = Math.hypot(p.pos[0],p.pos[2]);
    if ((x || z) && r > islandRadius) {
      p.pos[0] *= islandRadius/r;
      p.pos[2] *= islandRadius/r;
    }
    if (input.jump && !prev.jump && p.pos[1] === 0) this.verticalSpeed = 7;
    this.verticalSpeed -= 19/hz;
    p.pos[1] = Math.max(0, p.pos[1] + this.verticalSpeed/hz);
    if (!p.pos[1]) this.verticalSpeed = 0;

    this.motes = this.motes.filter(m => {
      if (p.carried >= t.carry_capacity || distance(p.pos,m.pos) > t.pickup_radius) return true;
      this.score += t.score.per_mote;
      emit('mote_picked', {carried: ++p.carried});
      return false;
    });
    if (input.interact && !prev.interact && p.carried) {
      const l = this.lanterns.filter(l => !l.lit && distance(p.pos,l.pos) <= t.interact_radius)
        .sort((a,b) => distance(p.pos,a.pos) - distance(p.pos,b.pos))[0];
      if (l) {
        const amount = Math.min(p.carried, t.lantern_cost - l.deposited);
        l.deposited += amount;
        p.carried -= amount;
        emit('deposit', {lantern_id:l.id, amount, deposited:l.deposited});
        if (l.deposited >= t.lantern_cost) {
          l.lit = true;
          this.score += t.score.per_lantern;
          emit('lantern_lit', {lantern_id:l.id});
        }
      }
    }
    if (input.pulse && !prev.pulse && p.carried >= t.pulse_cost && this.tick >= this.nextPulse) {
      p.carried -= t.pulse_cost;
      this.nextPulse = this.tick + hz*t.pulse_cooldown_s;
      const stunned_ids = [];
      for (const s of this.shades) {
        const d = distance(s.pos,p.pos);
        if (d > t.pulse_radius) continue;
        s.pos[0] += (d ? (s.pos[0]-p.pos[0])/d : 1)*t.pulse_push_m;
        s.pos[2] += (d ? (s.pos[2]-p.pos[2])/d : 0)*t.pulse_push_m;
        s.wake = this.tick + hz*t.pulse_stun_s;
        stunned_ids.push(s.id);
      }
      this.score += stunned_ids.length*t.score.per_stun;
      emit('pulse', {stunned_ids});
    }
    for (const s of this.shades) {
      s.state = this.tick < s.wake ? 'stunned' : 'chase';
      const d = distance(p.pos,s.pos);
      if (s.state === 'chase' && d) {
        const step = Math.min(d, t.shade_speed/hz)/d;
        s.pos[0] += (p.pos[0]-s.pos[0])*step;
        s.pos[2] += (p.pos[2]-s.pos[2])*step;
      }
      for (const l of this.lanterns) {
        if (!l.lit) continue;
        const gap = distance(s.pos,l.pos);
        if (gap >= t.safe_radius) continue;
        s.pos[0] = l.pos[0] + t.safe_radius*(gap ? (s.pos[0]-l.pos[0])/gap : 1);
        s.pos[2] = l.pos[2] + t.safe_radius*(gap ? (s.pos[2]-l.pos[2])/gap : 0);
      }
      const safe = this.lanterns.some(l => l.lit && distance(p.pos,l.pos) <= t.safe_radius);
      if (!safe && s.state === 'chase' && distance(p.pos,s.pos) <= t.shade_hit_radius && this.tick >= this.nextHit && p.flames > 0) {
        this.nextHit = this.tick + t.invuln_s*hz;
        const dropped = Math.floor(p.carried*t.hit_drop_ratio);
        p.carried -= dropped;
        emit('player_hit', {by:'shade', flames:--p.flames, dropped});
      }
    }
    if (this.autoMotes && this.tick % 90 === 0 && this.motes.length < 45)
      this.motes.push({id:'M'+ ++this.moteId, pos:this.point()});
    if (this.autoShades && this.tick % 900 === 0 && this.shades.length < 5) {
      const pos = this.point();
      pos[1] = 1;
      emit('shade_spawned', {id:this.addShade(pos)});
    }
    let reason;
    if (this.lanterns.every(l => l.lit)) {
      reason = 'all_lit';
      this.score += Math.floor(this.timeLeft)*t.score.per_second_left + p.flames*t.score.per_flame_left;
    } else if (p.flames <= 0) reason = 'no_flames';
    else if (!this.timeLeft) reason = 'dawn';
    if (reason) {
      this.state = reason === 'all_lit' ? 'won' : 'lost';
      emit('game_over', {result:this.state, reason});
    }
    return events;
  }
  snapshot() {
    const point = o => ({...o, pos:roundPos(o.pos)});
    return {type:'snapshot',tick:this.tick,sim_tick:this.tick,state:this.state,time_left_s:this.timeLeft,
      score:this.score,player:point(this.player),lanterns:this.lanterns.map(point),
      shades:this.shades.map(({id,pos,state}) => point({id,pos,state})),
      motes_active:this.motes.length,motes:this.motes.map(point)};
  }
}
