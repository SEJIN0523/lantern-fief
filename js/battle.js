// 전투 엔진(화면과 분리). 진형: 각 진영 col 0 전열 / 1 후열, lane 0~4
"use strict";

const HERO_AURA = [0.05, 0.08, 0.11, 0.15, 0.27];

// ---------- 마나: 동료만 쓴다(몬스터는 대기 시간만) ----------
// 기술 비용: 쿨이 긴 큰 기술일수록, 전체 대상이면 더 든다
function mpCost(sk) {
  if (sk.mp != null) return sk.mp;
  return Math.min(45, 6 + (sk.cd || 2) * 5 + (sk.tgt === "all" ? 6 : 0));
}
// 성격에 따른 마나 쓰는 버릇: big = 모아서 큰 기술, small = 작은 기술을 자주
const MP_STYLE = { hot: "big", brave: "big", bluff: "big", greedy: "big", optimist: "big", calm: "small", coward: "small", diligent: "small", kind: "small", loyal: "small" };
const MP_STYLE_NAME = { big: "큰 기술 위주 (마나를 모았다가 크게)", small: "작은 기술 위주 (마나를 아껴 자주)", mid: "균형 (쓸 수 있는 가장 큰 기술)" };
function mpStyle(u) { return MP_STYLE[u.traits && u.traits.personality] || "mid"; }
function mpRegen(u) { return 10 + Math.min(10, Math.floor((u.st.spi || 0) / 6)); }

function mkFromUnit(u, col, lane, opts) {
  const d = derived(u);
  const J = JOBS[u.job];
  const c = {
    side: "A", unit: u, id: u.id, name: u.name, col, lane,
    maxHp: d.hp, hp: d.hp, atk: d.atk, mag: d.mag, def: d.def, res: d.res, heal: d.heal,
    spd: d.spd, acc: d.acc, eva: d.eva, crit: d.crit,
    range: J.range, skills: unitSkills(u).map((id) => ({ id, cd: 0 })),
    buffs: [], taunt: 0, shield: 0, dots: [], silence: 0, alive: true, ct: 0, endured: false,
    maxMp: 100, mp: 50, mpRegen: mpRegen(u), mpStyle: mpStyle(u),
  };
  // 피로 3 이상이면 지침
  if (u.fatigue >= 3) { c.atk = Math.round(c.atk * 0.85); c.mag = Math.round(c.mag * 0.85); c.def = Math.round(c.def * 0.85); }
  // 연속 전투: 이전 전투의 체력 비율을 이어받음
  const carried = opts.carry && opts.carry[u.id];
  if (carried != null) c.hp = Math.max(1, Math.round(c.maxHp * Math.min(1, carried + traitMod(u, "startHp"))));
  return c;
}

function mkMonster(id, lv, col, lane, idx) {
  const M = MONSTERS[id];
  const [hp, atk, def, spd, mag] = M.base;
  const g = lv - 1;
  // Lv20을 넘으면 성장을 조금씩 누그러뜨린다(후반 보스가 권장 레벨에서 잡히도록)
  const damp = 1 / (1 + Math.max(0, g - 20) * 0.007);
  return {
    side: "E", mon: id, id: "e" + idx, name: M.name, icon: M.icon, col, lane, lv, boss: !!M.boss, beast: !!M.beast,
    maxHp: Math.round(hp * 1.3 * (1 + 0.34 * g) * damp), hp: 0,
    atk: Math.round(atk * 1.75 * (1 + 0.21 * g) * damp), mag: Math.round(mag * 1.75 * (1 + 0.21 * g) * damp),
    def: Math.round(def * (1 + 0.18 * g)), res: Math.round(def * 0.8 * (1 + 0.18 * g)),
    heal: Math.round(mag * 1.4 * (1 + 0.2 * g)),
    spd: Math.round(spd * (1 + 0.03 * g)), acc: 92 + g, eva: Math.min(25, 3 + Math.round(spd * 0.3)), crit: 5,
    range: M.range, skills: M.skills.map((s) => ({ id: s, cd: 2 })),
    buffs: [], taunt: 0, shield: 0, dots: [], silence: 0, alive: true, ct: 0,
  };
}

function createBattle(party, enemies, opts = {}) {
  const B = { units: [], log: [], turn: 0, cmd: 0, tactic: "all", over: false, win: false, opts, gold: 0 };
  for (const p of party) B.units.push(mkFromUnit(p.unit, p.col, p.lane, opts));
  enemies.forEach((e, i) => { const m = mkMonster(e.id, e.lv, e.col, e.lane, i); m.hp = m.maxHp; B.units.push(m); });
  const heroC = B.units.find((c) => c.side === "A" && c.unit.hero);
  B.hero = heroC || null;
  B.aura = heroC ? HERO_AURA[JOBS[heroC.unit.job].tier] : 0;
  if (typeof loveBattleBonus === "function") loveBattleBonus(B);
  B.lonerOK = party.length <= 3;
  for (const c of B.units) {
    c.ct = (1000 / c.spd) * rnd(0.3, 1.0);
    if (c.side === "A" && traitMod(c.unit, "openTaunt")) c.taunt = 1;
  }
  return B;
}

const alive = (B, side) => B.units.filter((c) => c.alive && c.side === side);
const foe = (c) => (c.side === "A" ? "E" : "A");
const has = (c, sk) => c.skills.some((s) => s.id === sk);

function buffSum(c, k) { return c.buffs.reduce((a, b) => a + (b.stat === k ? b.v : 0), 0); }

function statOf(B, c, k) {
  let v = c[k];
  let m = 1 + buffSum(c, k);
  if (c.side === "A") {
    const u = c.unit;
    if (k === "atk" || k === "mag") {
      m += B.aura;
      if (c.col === 0) m += traitMod(u, "frontAtk");
      if (B.lonerOK) m += traitMod(u, "loner");
      if (B.hero && B.hero.alive && c !== B.hero) m += traitMod(u, "withHero");
      if (has(c, "kingsorder")) m += 0.08;
    }
    if (k === "def" || k === "res") {
      if (alive(B, "A").some((x) => has(x, "defaura"))) m += 0.1;
      if (B.opts.wall) m += B.opts.wall;
    }
    if (k === "eva") {
      if (c.col === 1) v += traitMod(u, "backEva") * 100;
      if (has(c, "innerpeace")) v += 10;
    }
    if (k === "acc" && c.col === 0) {
      v += traitMod(u, "frontAcc") * 100;
      if (c.range === "ranged") v -= 15;
    }
    if (B.opts.night) m += traitMod(u, "night");
    if (B.opts.forest) m += traitMod(u, "forest");
  }
  if ((k === "atk") && has(c, "frenzy")) m += 0.5 * (1 - c.hp / c.maxHp);
  return Math.max(0, v * Math.max(0.2, m));
}

// 근접으로 닿는 적: 전열(없으면 후열)
function frontTargets(B, c) {
  const es = alive(B, foe(c));
  const front = es.filter((e) => e.col === 0);
  return front.length ? front : es;
}
function pickTarget(B, c, list, sk) {
  const taunters = list.filter((e) => e.taunt > 0);
  if (taunters.length) return pick(taunters);
  if (c.side === "A" && B.tactic === "boss") {
    const top = list.reduce((a, b) => (b.maxHp > a.maxHp ? b : a));
    return top;
  }
  // 근접: 같은 줄 우선, 그다음 가까운 줄
  if (!sk || sk.rng === "melee") {
    list = [...list].sort((a, b) => Math.abs(a.lane - c.lane) - Math.abs(b.lane - c.lane) || a.hp - b.hp);
    return chance(0.75) ? list[0] : pick(list);
  }
  // 원거리: 체력 낮은 적 선호
  const w = list.map((e) => 1 + (1 - e.hp / e.maxHp) * 2 + (c.side === "E" && e.col === 1 ? 0.3 : 0));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
  return list[0];
}

// 수호: 같은 줄 전열에 수호 패시브가 있으면 후열 대상 공격을 대신 받음
function guardRedirect(B, t) {
  if (t.col !== 1) return null;
  const g = B.units.find((x) => x.alive && x.side === t.side && x.col === 0 && x.lane === t.lane && has(x, "guard"));
  return g || null;
}

function areaTargets(B, c, sk, primary) {
  const es = alive(B, foe(c));
  switch (sk.tgt) {
    case "lane": return es.filter((e) => e.lane === primary.lane);
    case "col": { const col = primary.col; return es.filter((e) => e.col === col); }
    case "cross": return es.filter((e) => (e.col === primary.col && Math.abs(e.lane - primary.lane) <= 1) || (e.lane === primary.lane));
    case "all": return es;
    case "backrow": { const b = es.filter((e) => e.col === 1); return b.length ? b : es; }
    default: return [primary];
  }
}

function dealDamage(B, c, t, pow, sk, ev) {
  const mag = !!(sk && sk.mag) || c.range === "magic" || (!sk && c.range === "heal");
  const hitP = mag ? 0.97 : clamp((statOf(B, c, "acc") - statOf(B, t, "eva")) / 100, 0.35, 0.99);
  if (!chance(hitP)) {
    ev.push({ id: t.id, miss: true });
    // 흘려치기: 회피 시 반격
    if (has(t, "riposte") && chance(0.5) && t.alive) ev.counters.push([t, c]);
    return 0;
  }
  const atk = mag ? statOf(B, c, "mag") : statOf(B, c, "atk");
  const def = (mag ? statOf(B, t, "res") : statOf(B, t, "def")) * (1 - ((sk && sk.pen) || 0));
  let dmg = atk * pow * (100 / (100 + def * 2.2)) * rnd(0.9, 1.1);
  const critP = (statOf(B, c, "crit") / 100) + ((sk && sk.crit) || 0);
  const crit = chance(critP);
  if (crit) dmg *= 1.6;
  if (t.side === "A" && c.beast) dmg *= 1 - traitMod(t.unit, "beastDef");
  if (sk && sk.holy && (t.mon === "skeleton" || t.undead)) dmg *= 2;
  dmg = Math.max(1, Math.round(dmg));
  let absorbed = 0;
  if (t.shield > 0) { absorbed = Math.min(t.shield, dmg); t.shield -= absorbed; dmg -= absorbed; }
  t.hp -= dmg;
  if (t.hp <= 0 && t.side === "A" && !t.endured && traitMod(t.unit, "endure")) { t.hp = 1; t.endured = true; }
  const r = { id: t.id, dmg, crit, absorbed };
  ev.push(r);
  if (t.hp <= 0) { t.hp = 0; t.alive = false; r.dead = true; if (c.side === "A") c.unit.kills++; }
  else {
    if (t.side === "A" && traitMod(t.unit, "rage") && chance(0.2)) t.buffs.push({ stat: "atk", v: 0.3, t: 2 }, { stat: "def", v: -0.2, t: 2 });
    if (!mag && !(sk && sk.rng === "any")) {
      if (has(t, "counter") && chance(0.2 + (t.side === "A" ? traitMod(t.unit, "counter") : 0))) ev.counters.push([t, c]);
      if (has(t, "reflect")) { const back = Math.max(1, Math.round(dmg * 0.15)); c.hp = Math.max(0, c.hp - back); ev.reflect = (ev.reflect || 0) + back; if (c.hp <= 0) c.alive = false; }
    }
  }
  if (sk && sk.drain) { const h = Math.round(dmg * sk.drain); c.hp = Math.min(c.maxHp, c.hp + h); ev.drain = (ev.drain || 0) + h; }
  if (sk && sk.dot && t.alive) t.dots.push({ v: Math.round(atk * sk.dot), t: sk.turns || 3 });
  return dmg;
}

function healAmt(B, c, pow) {
  let h = (c.heal || c.mag) * pow * rnd(0.92, 1.08);
  if (c.side === "A") h *= 1 + traitMod(c.unit, "healPow");
  return Math.round(h);
}

function readySkills(c) {
  if (c.silence > 0) return [];
  return c.skills.filter((s) => s.cd <= 0 && SKILLS[s.id].kind !== "passive" && (c.mp == null || c.mp >= mpCost(SKILLS[s.id]))).map((s) => s.id);
}

// 행동 결정
function decide(B, c) {
  const allies = alive(B, c.side);
  const dead = B.units.filter((x) => !x.alive && x.side === c.side);
  const ready = readySkills(c);
  const hurt = allies.filter((a) => a.hp / a.maxHp < (B.tactic === "safe" && c.side === "A" ? 0.7 : 0.55)).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  const meleeBlocked = c.col === 1 && c.range === "melee";

  for (const id of ready) {
    const sk = SKILLS[id];
    if (sk.kind === "revive" && dead.length) return { sk: id, t: pick(dead) };
    if (sk.kind === "heal" && hurt.length) return { sk: id, t: hurt[0] };
    if (sk.kind === "shield" && allies.some((a) => a.hp / a.maxHp < 0.8 && a.shield <= 0)) return { sk: id, t: allies.filter((a) => a.shield <= 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] };
  }
  for (const id of ready) {
    const sk = SKILLS[id];
    if (sk.kind === "buff") {
      const key = Object.keys(sk.buff)[0];
      if (sk.tgt === "self" && (c.col === 0 || sk.taunt == null) && !c.buffs.some((b) => b.src === id)) return { sk: id, t: c };
      if (sk.tgt !== "self" && !allies.some((a) => a.buffs.some((b) => b.src === id))) return { sk: id, t: c };
    }
    if (sk.kind === "debuff") {
      const es = alive(B, foe(c));
      const targetable = es.filter((e) => !e.buffs.some((b) => b.src === id));
      if (targetable.length) {
        const t = targetable.reduce((a, b) => (b.maxHp > a.maxHp ? b : a));
        return { sk: id, t };
      }
    }
  }
  if (B.tactic !== "save" || c.side === "E") {
    let atks = ready.filter((id) => SKILLS[id].kind === "atk" && !(SKILLS[id].rng === "melee" && meleeBlocked));
    if (c.mp != null && atks.length) {
      const cost = (id) => mpCost(SKILLS[id]);
      atks.sort((a, b) => (c.mpStyle === "small" ? cost(a) - cost(b) : cost(b) - cost(a)));
      // 큰 기술 성향: 대기 중인 가장 큰 공격 기술을 쓸 마나가 모일 때까지 작은 기술을 참는다
      if (c.mpStyle === "big") {
        const top = Math.max(...c.skills.filter((s) => s.cd <= 0 && SKILLS[s.id].kind === "atk").map((s) => cost(s.id)));
        if (top > c.mp) atks = [];
      }
    }
    for (const id of atks) {
      const sk = SKILLS[id];
      const list = sk.rng === "melee" ? frontTargets(B, c) : alive(B, foe(c));
      if (!list.length) break;
      return { sk: id, t: pickTarget(B, c, list, sk) };
    }
  }
  // 기본 행동
  if (c.range === "heal" && hurt.length) return { basicHeal: true, t: hurt[0] };
  if (meleeBlocked) return { wait: true };
  const list = c.range === "melee" || c.range === "reach" ? frontTargets(B, c) : alive(B, foe(c));
  if (!list.length) return { wait: true };
  return { basic: true, t: pickTarget(B, c, list, c.range === "melee" || c.range === "reach" ? null : { rng: "any" }) };
}

function nextActor(B) {
  let best = null;
  for (const c of B.units) if (c.alive && (!best || c.ct < best.ct)) best = c;
  return best;
}

// 한 번의 행동을 실행하고 이벤트를 돌려준다
function step(B) {
  if (B.over) return null;
  const c = nextActor(B);
  const spdNow = Math.max(3, statOf(B, c, "spd"));
  c.ct += 1000 / spdNow;
  B.turn++;
  const out = { actor: c.id, side: c.side, kind: "act", hits: [], counters: [] };
  out.hits.counters = out.counters;

  // 턴 시작: 지속 피해, 재생
  let tick = 0;
  for (const d of c.dots) { tick += d.v; d.t--; }
  c.dots = c.dots.filter((d) => d.t > 0);
  if (tick) { c.hp = Math.max(0, c.hp - tick); out.dot = tick; if (c.hp <= 0) { c.alive = false; out.dotDead = true; return finish(B, out); } }
  if (c.mp != null) c.mp = Math.min(c.maxMp, c.mp + c.mpRegen);
  if (has(c, "innerpeace")) { const r = Math.round(c.maxHp * 0.03); c.hp = Math.min(c.maxHp, c.hp + r); }

  const act = decide(B, c);
  if (act.wait) {
    out.kind = "wait";
  } else if (act.basicHeal) {
    const h = healAmt(B, c, 1.0);
    act.t.hp = Math.min(act.t.maxHp, act.t.hp + h);
    out.kind = "heal"; out.heals = [{ id: act.t.id, amt: h }];
  } else if (act.basic) {
    out.kind = c.range === "magic" || c.range === "heal" ? "magic" : c.range === "ranged" ? "shoot" : "melee";
    if (c.range === "heal") out.fx = "holy";
    out.target = act.t.id;
    let t = act.t;
    const g = guardRedirect(B, t);
    if (g) { out.guard = g.id; t = g; out.target = g.id; }
    if (c.range === "reach") {
      for (const x of alive(B, foe(c)).filter((e) => e.lane === t.lane)) dealDamage(B, c, x, x === t ? 1 : 0.6, { pen: 0 }, out.hits);
    } else dealDamage(B, c, t, g ? 0.8 : 1, null, out.hits);
  } else {
    const sk = SKILLS[act.sk];
    const slot = c.skills.find((s) => s.id === act.sk);
    slot.cd = sk.cd + 1;
    if (c.mp != null) c.mp -= mpCost(sk);
    out.skill = act.sk;
    out.kind = sk.kind;
    out.target = act.t.id;
    if (sk.kind === "atk") {
      out.fx = sk.fx || (c.range === "magic" ? "magic" : null);
      let primary = act.t;
      if (sk.tgt === "single") { const g = guardRedirect(B, primary); if (g) { primary = g; out.guard = g.id; out.target = g.id; } }
      const hits = sk.hits || 1;
      for (let i = 0; i < hits; i++) {
        if (sk.tgt === "random") {
          const list = sk.rng === "melee" ? frontTargets(B, c) : alive(B, foe(c));
          if (!list.length) break;
          dealDamage(B, c, pick(list), sk.pow, sk, out.hits);
        } else {
          const ts = areaTargets(B, c, sk, primary).filter((x) => x.alive);
          if (!ts.length) break;
          for (const x of ts) dealDamage(B, c, x, sk.pow, sk, out.hits);
        }
      }
      if (sk.gold && c.side === "A") { B.gold += sk.gold * (B.opts.lvl || 1); out.gold = sk.gold; }
    } else if (sk.kind === "heal") {
      const ts = sk.tgt === "allies" ? alive(B, c.side) : [act.t];
      out.heals = ts.map((t) => { const h = healAmt(B, c, sk.pow); t.hp = Math.min(t.maxHp, t.hp + h); return { id: t.id, amt: h }; });
    } else if (sk.kind === "shield") {
      const ts = sk.tgt === "allies" ? alive(B, c.side) : [act.t];
      out.shields = ts.map((t) => { const v = healAmt(B, c, sk.pow); t.shield = v; return { id: t.id, amt: v }; });
    } else if (sk.kind === "revive") {
      const t = act.t; t.alive = true; t.hp = Math.round(t.maxHp * sk.pow); t.ct = c.ct;
      out.heals = [{ id: t.id, amt: t.hp, revive: true }];
    } else if (sk.kind === "buff") {
      let ts = sk.tgt === "self" ? [c] : sk.tgt === "frontallies" ? alive(B, c.side).filter((a) => a.col === 0) : alive(B, c.side);
      if (!ts.length) ts = [c];
      for (const t of ts) for (const k in sk.buff) t.buffs.push({ stat: k, v: sk.buff[k], t: sk.turns, src: act.sk });
      if (sk.taunt) c.taunt = sk.taunt;
      out.buffed = ts.map((t) => t.id);
    } else if (sk.kind === "debuff") {
      const ts = sk.tgt === "backrow" ? areaTargets(B, c, sk, act.t) : [act.t];
      for (const t of ts) {
        for (const k in sk.buff) t.buffs.push({ stat: k, v: sk.buff[k], t: sk.turns, src: act.sk });
        if (sk.silence) t.silence = sk.silence;
      }
      out.debuffed = ts.map((t) => t.id);
    }
  }
  // 반격
  for (const [who, tgt] of out.counters) {
    if (!who.alive || !tgt.alive) continue;
    const ev = []; ev.counters = [];
    dealDamage(B, who, tgt, 0.8, null, ev);
    out.counterHits = (out.counterHits || []).concat(ev.map((e) => ({ ...e, by: who.id })));
  }
  // 턴 끝: 쿨다운, 버프 감소
  for (const s of c.skills) if (s.cd > 0) s.cd--;
  c.buffs.forEach((b) => b.t--);
  c.buffs = c.buffs.filter((b) => b.t > 0);
  if (c.taunt > 0) c.taunt--;
  if (c.silence > 0) c.silence--;
  if (c.side === "A" && B.hero && B.hero.alive) {
    B.cmd = Math.min(100, B.cmd + (has(B.hero, "otherpanel") ? 11 : has(B.hero, "rally") ? 10.5 : 8));
  }
  return finish(B, out);
}

function finish(B, out) {
  if (!alive(B, "E").length) { B.over = true; B.win = true; }
  else if (!alive(B, "A").length || B.turn > 400) { B.over = true; B.win = false; }
  out.over = B.over; out.win = B.win;
  return out;
}

// 세진의 지휘 스킬
const COMMANDS = {
  focus: { name: "집중 공격!", desc: "아군 공격 +30% (2턴)" },
  hold: { name: "전열 사수!", desc: "아군 방어 +40% (2턴)" },
  aid: { name: "응급 처치!", desc: "아군 체력 25% 회복" },
};
function useCommand(B, id) {
  if (B.cmd < 100 || !B.hero || !B.hero.alive) return null;
  B.cmd = 0;
  const as = alive(B, "A");
  const out = { kind: "command", cmd: id, actor: B.hero.id, side: "A", hits: [], counters: [] };
  if (id === "focus") as.forEach((a) => { a.buffs.push({ stat: "atk", v: 0.3, t: 2, src: "cmd" }); a.buffs.push({ stat: "mag", v: 0.3, t: 2, src: "cmd" }); });
  if (id === "hold") as.forEach((a) => { a.buffs.push({ stat: "def", v: 0.4, t: 2, src: "cmd" }); a.buffs.push({ stat: "res", v: 0.4, t: 2, src: "cmd" }); });
  if (id === "aid") out.heals = as.map((a) => { const h = Math.round(a.maxHp * 0.25); a.hp = Math.min(a.maxHp, a.hp + h); return { id: a.id, amt: h }; });
  out.buffed = id !== "aid" ? as.map((a) => a.id) : null;
  return out;
}

// 결과 처리: 경험치, 부상
function battleRewards(B) {
  const es = B.units.filter((c) => c.side === "E");
  const as = B.units.filter((c) => c.side === "A");
  const killed = es.filter((e) => !e.alive);
  let exp = killed.reduce((a, e) => a + e.lv * 6 + 4 + (e.boss ? e.lv * 40 : 0), 0);
  let gold = killed.reduce((a, e) => a + Math.round(e.lv * 2.5 + 2 + (e.boss ? 120 : 0)), 0) + B.gold;
  if (!B.win) { exp = Math.round(exp * 0.5); gold = Math.round(gold * 0.3); }
  const share = Math.round((exp / Math.max(1, as.length)) * 2.1);
  const res = { exp: share, gold, ups: {}, injured: [] };
  for (const c of as) {
    const u = c.unit;
    u.battles++;
    const ups = gainExp(u, share);
    if (ups.length) res.ups[u.id] = ups.length;
    if (!c.alive && !B.win) { u.injured = Math.max(u.injured, u.hero ? 1 : 2); res.injured.push(u.id); }
  }
  for (const c of as) if (c.unit.traits.personality === "greedy") gold = Math.round(gold * 1.05);
  res.gold = gold;
  return res;
}
