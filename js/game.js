// 게임 상태와 마을 운영(하루 진행, 건설, 영입, 습격, 원정)
"use strict";

const SAVE_KEY = "lantern_fief_v1";
let G = null;

function heroU() { return G ? G.roster.find((u) => u.hero) : null; }
function unitById(id) { return G.roster.find((u) => u.id === id); }

function newGame() {
  G = {
    v: 1, day: 1, chapter: 0, story: "prologue",
    res: { gold: 60, food: 40, wood: 30, stone: 0 },
    pop: 22, morale: 50, fame: 0,
    workers: { farm: 4, lumber: 3, quarry: 0 },
    bld: { hall: 1, palisade: 0, lodging: 1, farm: 1, lumber: 1, quarry: 0, guild: 0, barracks: 0, smithy: 0, church: 0, tavern: 0 },
    built: {},
    roster: [], form: [], tactic: "all",
    dungeon: { goblin_forest: 0 },
    offers: [], offersDay: 0, volunteers: [], volDay: -99,
    inv: {}, flags: {}, log: [], raids: [], seen: {},
  };
  const hero = newUnit({ job: "stranger", line: "hero", slot: 0, hero: true, name: "세진", traits: { personality: "calm", hobby: "read", origin: "wander", quirk: "keeneye" }, pot: { str: 2, vit: 3, agi: 3, int: 5, spi: 5, luk: 4 }, bloom: "late" });
  hero.origin = "이계";
  G.roster.push(hero);
  return G;
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* 저장 불가 환경 */ }
}
function load() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (!s) return false;
    G = JSON.parse(s);
    return true;
  } catch (e) { return false; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

function log(msg) { G.log.unshift({ d: G.day, m: msg }); if (G.log.length > 60) G.log.pop(); }

// 수용 인원과 일꾼
function rosterCap() { return 3 + G.bld.lodging * 2; }
function workerCap(b) { return G.bld[b] ? 3 + G.bld[b] * 2 : 0; }
function freeVillagers() { return G.pop - G.workers.farm - G.workers.lumber - G.workers.quarry; }

function canAfford(cost) { return Object.entries(cost).every(([k, v]) => (G.res[k] || 0) >= v); }
function pay(cost) { for (const [k, v] of Object.entries(cost)) G.res[k] -= v; }
function costText(cost) {
  const ic = { gold: "💰", food: "🍞", wood: "🪵", stone: "🪨" };
  return Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => `${ic[k]}${v}`).join(" ");
}

function buildCost(id) { return BUILDINGS[id].cost(G.bld[id] + 1); }
function canBuild(id) {
  const b = BUILDINGS[id];
  const lv = G.bld[id];
  if (lv >= b.max) return "최대 레벨";
  if (id !== "hall" && lv >= G.bld.hall) return "촌장의 집 레벨 부족";
  if (G.built[G.day]) return "오늘은 이미 공사했어요";
  if (!canAfford(buildCost(id))) return "자원 부족";
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
  const w = G.workers;
  const r = {
    food: w.farm * (1 + G.bld.farm) - Math.ceil(G.pop * 0.3) - G.roster.length,
    wood: w.lumber * (1 + G.bld.lumber),
    stone: w.quarry * (G.bld.quarry ? 1 + G.bld.quarry : 0),
    gold: 4 + Math.floor(G.pop / 4) + G.bld.tavern * 6 - G.roster.reduce((a, u) => a + (u.wage || 0), 0),
  };
  for (const u of G.roster) { r.food += traitMod(u, "food"); r.wood += traitMod(u, "wood"); r.gold += traitMod(u, "gold1"); }
  return r;
}

// 영입
function refreshOffers() {
  if (!G.bld.guild) { G.offers = []; return; }
  const lines = ["warrior", "rogue", "archer", "mage", "cleric"];
  const first = { warrior: "warrior", rogue: "thief", archer: "archer", mage: "mage", cleric: "acolyte" };
  G.offers = [];
  for (let i = 0; i < 3; i++) {
    const line = pick(lines);
    const lv = rint(1, 2 + G.bld.guild * 2);
    const u = newUnit({ job: first[line], lv, potBonus: G.bld.guild >= 3 ? 1 : 0 });
    u.wage = Math.round((2 + lv * 0.5) * (1 + traitMod(u, "wage")));
    u.price = 25 + lv * 12;
    G.offers.push(u);
  }
  G.offersDay = G.day;
}
function refreshVolunteers() {
  G.volunteers = [0, 1].map(() => { const u = newUnit({ job: "villager", wide: true }); u.wage = 0; u.price = 0; return u; });
  G.volDay = G.day;
}
function canRecruit() { return G.roster.length < rosterCap(); }
function hire(u, from) {
  if (!canRecruit()) return "숙소가 가득 찼어요";
  if (G.res.gold < (u.price || 0)) return "금화가 부족해요";
  if (from === "vol" || from === "barracks") { if (freeVillagers() < 1) return "남는 마을 사람이 없어요"; G.pop--; }
  G.res.gold -= u.price || 0;
  G.roster.push(u);
  if (from === "guild") G.offers = G.offers.filter((x) => x !== u);
  if (from === "vol") G.volunteers = G.volunteers.filter((x) => x !== u);
  log(`${u.name}(${JOBS[u.job].name}) 합류`);
  autoForm(u.id);
  return null;
}
function barracksRecruit() {
  const u = newUnit({ job: "spearman", line: "soldier", lv: Math.max(1, G.bld.barracks), traits: { personality: pick(["brave", "loyal", "diligent", "calm", "optimist"]) } });
  u.wage = 1; u.price = 20;
  return u;
}

// 편성: 비어 있으면 자동 채움
function formUnits() { return G.form.map((f) => ({ ...f, unit: unitById(f.id) })).filter((f) => f.unit && !f.unit.injured); }
// 마을 방어전: 부상자도 체력 50%로 싸운다
function raidParty() {
  const party = G.form.map((f) => ({ ...f, unit: unitById(f.id) })).filter((f) => f.unit);
  const carry = {};
  for (const f of party) if (f.unit.injured) carry[f.unit.id] = 0.5;
  return { party, carry };
}
// onlyId를 주면 그 동료만 빈 칸에 넣는다(직접 뺀 동료를 다시 채우지 않도록)
function autoForm(onlyId) {
  G.form = G.form.filter((f) => unitById(f.id));
  if (G.form.length >= 5) return;
  const used = new Set(G.form.map((f) => f.id));
  const taken = new Set(G.form.map((f) => f.col + ":" + f.lane));
  for (const u of G.roster) {
    if (G.form.length >= 5) break;
    if (used.has(u.id) || u.injured || (onlyId && u.id !== onlyId)) continue;
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
    { day: 4, lv: 2, pool: ["goblin", "goblin"], n: 3 },
    { day: 9, lv: 4, pool: ["goblin", "goblin_archer", "wolf"], n: 4 },
    { day: 14, lv: 6, pool: ["wolf", "wolf", "goblin_archer"], n: 4 },
    { day: 20, lv: 8, pool: ["wolf_rider", "goblin", "goblin_shaman", "hobgoblin"], n: 5 },
    { day: 26, lv: 10, pool: ["wolf_rider", "hobgoblin", "goblin_archer", "goblin_shaman"], n: 5 },
  ],
};
function raidTonight() { return (RAIDS[G.chapter] || []).find((r) => r.day === G.day && !G.seen["raid" + r.day]); }
function raidSoon() { return (RAIDS[G.chapter] || []).find((r) => r.day > G.day && r.day - G.day <= 2); }

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
function floorEnemies(did, fi) {
  const F = DUNGEONS[did].floors[fi];
  if (F.boss) return F.boss.map(([id, col, lane]) => ({ id, lv: F.lv, col, lane }));
  return rollEnemies(F.pool, rint(F.n[0], F.n[1]), F.lv + rint(0, 1));
}

// 하루 마감
function endDay() {
  const inc = dailyIncome();
  for (const k in inc) G.res[k] = Math.max(0, G.res[k] + inc[k]);
  if (G.res.food <= 0) { G.morale = Math.max(0, G.morale - 8); log("식량이 바닥났어요. 사기가 떨어집니다."); }
  const restBonus = 1 + Math.floor(G.bld.lodging / 2);
  for (const u of G.roster) {
    u.days++;
    if (u.injured > 0) u.injured = Math.max(0, u.injured - (G.bld.church ? 2 : 1) * (traitMod(u, "injury") ? 2 : 1));
    if (!u.busyToday) u.fatigue = Math.max(0, u.fatigue - restBonus - traitMod(u, "rest"));
    if (!u.busyToday && traitMod(u, "idleExp")) gainExp(u, 4 + u.lv);
    if (!u.busyToday && G.bld.barracks) gainExp(u, G.bld.barracks * 2);
    u.busyToday = false;
  }
  G.day++;
  if (G.day - G.offersDay >= 3) refreshOffers();
  save();
}
