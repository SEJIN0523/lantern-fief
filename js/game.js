// 게임 상태와 마을 운영(하루 진행, 건설, 영입, 습격, 원정)
"use strict";

const SAVE_KEY = "lantern_fief_v1";
let G = null;

function heroU() { return G ? G.roster.find((u) => u.hero) : null; }
function unitById(id) { return G.roster.find((u) => u.id === id); }

function newGame(name) {
  G = {
    v: 1, day: 1, chapter: 0, story: "prologue",
    res: { gold: 120 },
    pop: 22, morale: 50, fame: 0,
    workers: { farm: 4, lumber: 3, quarry: 0 },
    bld: { hall: 1, lodging: 1, training: 0, smithy: 0, palisade: 0, spring: 0 },
    arms: [],
    chStart: 0, migrants: [], migDay: 0,
    built: {},
    roster: [], form: [], tactic: "all",
    dungeon: { goblin_forest: 0 },
    offers: [], offersDay: 0, volunteers: [], volDay: -99,
    inv: {}, flags: {}, log: [], raids: [], seen: {},
    heroName: name || "세진",
  };
  const hero = newUnit({ job: "stranger", line: "hero", slot: 0, hero: true, name: name || "세진", traits: { personality: "calm", hobby: "read", origin: "wander", quirk: "keeneye" }, pot: { str: 2, vit: 3, agi: 3, int: 5, spi: 5, luk: 4 }, bloom: "late" });
  hero.origin = "이계";
  G.roster.push(hero);
  return G;
}

function save() {
  try { G.savedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* 저장 불가 환경 */ }
}
function load() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (!s) return false;
    G = JSON.parse(s);
    migrate();
    return true;
  } catch (e) { return false; }
}
// 예전 세이브 보정
function migrate() {
  if (G.bld.training == null) G.bld.training = Math.max(G.bld.barracks || 0, G.bld.guild || 0, G.bld.church || 0, G.bld.magetower || 0, G.bld.tavern || 0);
  for (const k of Object.keys(G.bld)) if (!BUILDINGS[k]) delete G.bld[k];
  if (G.res.wood != null || G.res.food != null || G.res.stone != null) { G.res.gold += Math.round((G.res.wood || 0) + (G.res.stone || 0) * 1.5 + (G.res.food || 0) * 0.5); G.res = { gold: G.res.gold }; }
  G.arms = G.arms || [];
  for (const u of G.roster) if (!u.weapon || u.weapon.kind == null) { const old = u.weapon || {}; u.weapon = { ...newWeapon(JOBS[u.job].weapon, clamp(JOBS[u.job].tier, 0, 4)), plus: old.plus || 0, name: old.name || null }; }
  for (const k in BUILDINGS) G.bld[k] = G.bld[k] || 0;
  G.chStart = G.chStart || 0; G.migrants = G.migrants || []; G.migDay = G.migDay || 0; G.dispatch = G.dispatch || null;
  G.heroName = G.heroName || "세진";
  G.form = G.form.filter((f) => { const u = G.roster.find((x) => x.id === f.id); return u && !u.hero; });
  G.offers = [];
  for (const u of G.roster) {
    // 예전 평민 계열 → 적성 계열로
    if (u.line === "villager") {
      const opts = Object.keys(FIRST_JOB).flatMap((l) => LINES[l].slots.map((s, i) => [l, i, s]).filter(([, , s]) => s[0] === u.gender && s[1] === "인간"));
      const [l, i] = u.name === "한스" ? ["soldier", 0] : u.name === "엘마" ? ["cleric", 2] : pick(opts);
      u.line = l; u.slot = i;
    }
    ensureProfile(u);
  }
  const names = new Set();
  for (const u of G.roster) {
    if (names.has(u.name) && !u.hero && !u.art) {
      const free = NAMES[u.gender].filter((n) => !names.has(n) && !G.roster.some((x) => x.name === n));
      if (free.length) u.name = pick(free);
    }
    names.add(u.name);
  }
  const seen = new Set();
  for (const u of G.roster) {
    if (u.hero || u.art) continue;
    const k = u.line + ":" + u.slot;
    if (seen.has(k)) {
      const used = new Set([...seen, ...G.roster.map((x) => x.line + ":" + x.slot)]);
      const alt = LINES[u.line].slots.findIndex((s, i) => !used.has(u.line + ":" + i) && s[0] === u.gender && s[1] === u.race);
      if (alt >= 0) u.slot = alt;
    }
    seen.add(u.line + ":" + u.slot);
  }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

// ---------- 수동 저장 칸 3개 + 백업 코드 ----------
const SLOT_KEY = (n) => SAVE_KEY + "_slot" + n;
function saveSummary(g) {
  const ch = g.chapter ? (g.chapter >= 7 ? "엔딩 후" : "제" + g.chapter + "장") : "프롤로그";
  const lv = g.roster.length ? Math.max(...g.roster.map((u) => u.lv)) : 1;
  return { ch, day: g.day, n: g.roster.length, lv };
}
function slotInfo(n) {
  try {
    const s = localStorage.getItem(n === "auto" ? SAVE_KEY : SLOT_KEY(n));
    if (!s) return null;
    const g = JSON.parse(s);
    return { ...saveSummary(g), t: g.savedAt || 0 };
  } catch (e) { return null; }
}
function saveSlot(n) {
  try { G.savedAt = Date.now(); localStorage.setItem(SLOT_KEY(n), JSON.stringify(G)); save(); return true; } catch (e) { return false; }
}
// 불러온 판은 자동 저장에도 바로 덮어써서 이어하기가 그 판을 가리키게
function loadText(s) {
  const g = JSON.parse(s);
  if (!g || !Array.isArray(g.roster) || typeof g.day !== "number") throw new Error("세이브 형식이 아니에요");
  G = g; migrate(); save();
}
function loadSlot(n) {
  try { const s = localStorage.getItem(n === "auto" ? SAVE_KEY : SLOT_KEY(n)); if (!s) return false; loadText(s); return true; } catch (e) { return false; }
}
function deleteSlot(n) { try { localStorage.removeItem(SLOT_KEY(n)); } catch (e) {} }
function anySave() { return hasSave() || [1, 2, 3].some((n) => slotInfo(n)); }
// 다른 기기로 옮길 때 쓰는 글자 코드 (UTF-8 → base64)
function exportCode() { return "FIEF1:" + btoa(unescape(encodeURIComponent(JSON.stringify(G)))); }
function importCode(code) {
  code = code.trim();
  const json = code.startsWith("{") ? code : decodeURIComponent(escape(atob(code.replace(/^FIEF1:/, "").replace(/\s+/g, ""))));
  loadText(json);
}

function log(msg) { G.log.unshift({ d: G.day, m: msg }); if (G.log.length > 60) G.log.pop(); }

// 수용 인원과 일꾼
function rosterCap() { return 3 + G.bld.lodging * 2; }
function workerCap(b) { return G.bld[b] ? 3 + G.bld[b] * 2 : 0; }
function freeVillagers() { return G.pop; }

function canAfford(cost) { return Object.entries(cost).every(([k, v]) => (G.res[k] || 0) >= v); }
function pay(cost) { for (const [k, v] of Object.entries(cost)) G.res[k] -= v; }
function costText(cost) {
  return cost.gold ? `금화 ${cost.gold}` : "";
}

function buildCost(id) { return BUILDINGS[id].cost(G.bld[id] + 1); }
function canBuild(id) {
  const b = BUILDINGS[id];
  const lv = G.bld[id];
  if (lv >= b.max) return "최대 레벨";
  if (id !== "hall" && lv >= G.bld.hall) return "촌장의 집 레벨 부족";
  if (G.built[G.day]) return "오늘은 이미 공사했어요";
  if (!canAfford(buildCost(id))) return "금화 부족";
  return null;
}
function build(id) {
  if (canBuild(id)) return false;
  pay(buildCost(id));
  G.bld[id]++;
  G.built = { [G.day]: true };
  log(`${BUILDINGS[id].name} ${G.bld[id]}레벨 완공`);
  return true;
}

// 하루 생산과 유지비
function dailyIncome() {
  // 마을 세금(주민 수)과 촌장의 집, 동료 급여
  const r = { gold: 4 + Math.floor(G.pop / 4) + G.bld.hall * 4 - G.roster.reduce((a, u) => a + (u.wage || 0), 0) };
  for (const u of G.roster) r.gold += traitMod(u, "gold1");
  return r;
}

// 영입
function refreshVolunteers() {
  G.volunteers = [0, 1].map(() => { const u = newUnit({ job: "villager", race: "인간", wide: true }); u.wage = 0; u.price = 0; return u; });
  G.volDay = G.day;
}
// 이주민: 명성이 오르면 다른 종족 가족이 찾아온다. 마을 인구도 늘어난다
function migrantInterval() { return Math.max(3, 7 - G.bld.training); }
function refreshMigrants() {
  if (G.fame < 5) return;
  const n = G.fame >= 60 ? 3 : G.fame >= 25 ? 2 : 1;
  G.migrants = Array.from({ length: n }, () => {
    const u = newUnit({ job: "villager", wide: true, potBonus: G.fame >= 80 ? 1 : 0, lv: rint(1, 1 + Math.floor(G.chapter * 1.5)) });
    u.wage = 0; u.price = 10 + u.lv * 4;
    return u;
  });
  G.pop += rint(1, 3);
  G.migDay = G.day;
  log(`이주민 ${n}가족이 마을에 도착했다`);
}
// 주인공은 싸우지 않고 지휘만 한다: 숙소 인원·편성·파견은 동료만 센다
function crew() { return G.roster.filter((u) => !u.hero); }
function canRecruit() { return crew().length < rosterCap(); }
function hire(u, from) {
  if (!canRecruit()) return "숙소가 가득 찼어요";
  if (G.res.gold < (u.price || 0)) return "금화가 부족해요";
  if (from === "vol" || from === "barracks" || from === "mig") { if (freeVillagers() < 1) return "남는 마을 사람이 없어요"; G.pop--; }
  G.res.gold -= u.price || 0;
  G.roster.push(ensureProfile(u));
  if (from === "mig") G.migrants = G.migrants.filter((x) => x !== u);
  if (from === "vol") G.volunteers = G.volunteers.filter((x) => x !== u);
  log(`${u.name}(${u.job === "villager" ? u.race + " 주민" : JOBS[u.job].name}) 합류`);
  autoForm(u.id);
  return null;
}
function barracksRecruit() {
  const u = newUnit({ job: "spearman", line: "soldier", lv: Math.max(1, G.bld.training), traits: { personality: pick(["brave", "loyal", "diligent", "calm", "optimist"]) } });
  u.wage = 1; u.price = 20;
  return u;
}

// 편성: 비어 있으면 자동 채움
function formUnits() { return G.form.map((f) => ({ ...f, unit: unitById(f.id) })).filter((f) => f.unit && !f.unit.hero && !f.unit.injured); }
// 마을 방어전: 부상자도 체력 50%로 싸운다
function raidParty() {
  const party = G.form.map((f) => ({ ...f, unit: unitById(f.id) })).filter((f) => f.unit && !f.unit.hero);
  const carry = {};
  for (const f of party) if (f.unit.injured) carry[f.unit.id] = 0.5;
  return { party, carry };
}
// onlyId를 주면 그 동료만 빈 칸에 넣는다(직접 뺀 동료를 다시 채우지 않도록)
function autoForm(onlyId) {
  G.form = G.form.filter((f) => unitById(f.id) && !unitById(f.id).hero);
  if (G.form.length >= 5) return;
  const used = new Set(G.form.map((f) => f.id));
  const taken = new Set(G.form.map((f) => f.col + ":" + f.lane));
  for (const u of G.roster) {
    if (G.form.length >= 5) break;
    if (u.hero || used.has(u.id) || u.injured || (onlyId && u.id !== onlyId)) continue;
    const J = JOBS[u.job];
    const wantBack = u.hero || ["ranged", "magic", "heal"].includes(J.range);
    const order = wantBack ? [1, 0] : [0, 1];
    let placed = false;
    for (const col of order) {
      for (const lane of [2, 1, 3, 0, 4]) {
        if (!taken.has(col + ":" + lane)) { G.form.push({ id: u.id, col, lane }); taken.add(col + ":" + lane); placed = true; break; }
      }
      if (placed) break;
    }
  }
}

// 습격 일정(장별)
const RAIDS = {
  1: [
    { day: 4, lv: 1, pool: ["goblin", "goblin"], n: 3 },
    { day: 9, lv: 3, pool: ["goblin", "goblin_archer", "wolf"], n: 4 },
    { day: 14, lv: 5, pool: ["wolf", "wolf", "goblin_archer"], n: 4 },
    { day: 20, lv: 7, pool: ["wolf_rider", "goblin", "goblin_shaman", "hobgoblin"], n: 4 },
    { day: 26, lv: 9, pool: ["wolf_rider", "hobgoblin", "goblin_archer", "goblin_shaman"], n: 5 },
  ],
};
// 1장은 1일째 기준, 2장부터는 장 시작일(G.chStart) 기준
function raidKey(r) { return G.chapter === 1 ? "raid" + r.day : `raid${G.chapter}_${r.day}`; }
function raidDay(r) { return (G.chapter === 1 ? 0 : G.chStart) + r.day + (r.retry || 0); }
function raidList() {
  const list = RAIDS[G.chapter] || [];
  // 공성전에 지면 5일 뒤 다시 온다
  return list.map((r) => (r.siege && G.siegeRetry ? { ...r, retry: G.siegeRetry } : r));
}
function raidTonight() { return raidList().find((r) => raidDay(r) === G.day && !G.seen[raidKey(r)]); }
function raidSoon() { const r = raidList().find((r) => raidDay(r) > G.day && raidDay(r) - G.day <= 2 && !G.seen[raidKey(r)]); return r && { ...r, day: raidDay(r), lv: r.lv || r.waves[2].lv }; }

function rollEnemies(pool, n, lv) {
  const slots = [];
  for (let c = 0; c < 2; c++) for (let l = 0; l < 5; l++) slots.push([c, l]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const id = pick(pool);
    const want = MONSTERS[id].range === "melee" ? 0 : 1;
    let cand = slots.filter((s) => s[0] === want);
    if (!cand.length) cand = slots;
    const s = pick(cand);
    slots.splice(slots.indexOf(s), 1);
    out.push({ id, lv, col: s[0], lane: s[1] });
  }
  return out;
}
function floorEnemies(did, fi, phase = 0) {
  const F = typeof floorOf === "function" ? floorOf(did, fi) : DUNGEONS[did].floors[fi];
  if (F.phases) return F.phases[phase].map(([id, col, lane]) => ({ id, lv: F.lv + phase * 2, col, lane }));
  if (F.boss) return F.boss.map(([id, col, lane]) => ({ id, lv: F.lv, col, lane }));
  return rollEnemies(F.pool, rint(F.n[0], F.n[1]), F.lv + rint(0, 1));
}

// 하루 마감
// ---------- 파견: 편성에 없는 동료를 이미 깬 층으로 하루 보낸다 ----------
function dispatchSpots() {
  const out = [];
  for (const [id, D] of Object.entries(DUNGEONS)) {
    if (D.endless || id === "duel") continue;
    for (let i = 0; i < (G.dungeon[id] || 0) && i < D.floors.length; i++) {
      const F = floorOf(id, i);
      if (!F.boss) out.push({ did: id, fi: i, lv: F.lv, name: `${D.name} ${i + 1}층` });
    }
  }
  return out.sort((a, b) => b.lv - a.lv).slice(0, 3);
}
function dispatchCands() { return G.roster.filter((u) => !u.hero && !u.injured && !G.form.some((f) => f.id === u.id)); }
function resolveDispatch() {
  const D = G.dispatch;
  G.dispatch = null;
  if (!D) return;
  const us = D.ids.map(unitById).filter((u) => u && !G.form.some((f) => f.id === u.id));
  if (!us.length) return;
  const F = floorOf(D.did, D.fi);
  const avg = us.reduce((a, u) => a + u.lv, 0) / us.length;
  const gap = Math.max(0, F.lv - avg);
  // 층보다 약하면 얻는 것이 줄고 다칠 수 있다. 인원이 적을수록 1인당 몫이 크다
  const k = Math.max(0.3, 1 - gap * 0.12) * (us.length <= 2 ? 1.2 : 1);
  const exp = Math.round((F.lv * 6 + 4) * 2.4 * k);
  const gold = Math.round((F.lv * 3 + 6) * us.length * k);
  const hurt = [];
  for (const u of us) {
    gainExp(u, exp);
    u.busyToday = true; u.fatigue += 1;
    if (gap > 0 && chance(Math.min(0.6, gap * 0.08))) { u.injured = Math.max(u.injured, 2); hurt.push(u.name); }
  }
  G.res.gold += gold;
  const msg = `파견대 귀환 (${us.map((u) => u.name).join(", ")}): 경험치 +${exp}, 💰${gold}${hurt.length ? ` · 부상 ${hurt.join(", ")}` : ""}`;
  log(msg);
  if (typeof toast === "function") toast(msg);
}

function endDay() {
  resolveDispatch();
  const inc = dailyIncome();
  for (const k in inc) G.res[k] = Math.max(0, G.res[k] + inc[k]);
  if (G.res.gold <= 0) { G.morale = Math.max(0, G.morale - 5); log("금고가 바닥나 급여가 밀렸어요. 사기가 떨어집니다."); }
  const restBonus = 1 + Math.floor(G.bld.lodging / 2);
  for (const u of G.roster) {
    u.days++;
    if (u.injured > 0) u.injured = Math.max(0, u.injured - (G.bld.lodging >= 2 ? 2 : 1) * (traitMod(u, "injury") ? 2 : 1));
    if (!u.busyToday) u.fatigue = Math.max(0, u.fatigue - restBonus - traitMod(u, "rest"));
    if (!u.busyToday && traitMod(u, "idleExp")) gainExp(u, 4 + u.lv);
    if (!u.busyToday && G.bld.training) gainExp(u, G.bld.training * 2 + Math.floor(u.lv / 4));
    u.busyToday = false;
  }
  G.day++;
  if (G.day - G.migDay >= migrantInterval()) refreshMigrants();
  if (G.day - G.volDay >= 3) refreshVolunteers();
  save();
}
