// 동료 생성, 능력치, 성장, 잠재력, 전직, 고유 무기
"use strict";

const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function weightedGrade(bonus = 0, wide = false) {
  // F E D C B A S ★
  const w = wide ? [10, 14, 20, 22, 15, 10, 7, 2] : [4, 12, 22, 29, 18, 10, 4.5, 0.5];
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  let g = 0;
  for (; g < w.length; g++) { r -= w[g]; if (r <= 0) break; }
  return clamp(g + bonus, 0, 7);
}

let UID = 1;
// 동료·후보와 겹치지 않는 이름
function freshName(gender) {
  const used = typeof G !== "undefined" && G ? new Set([...G.roster, ...(G.volunteers || []), ...(G.migrants || [])].map((u) => u.name)) : new Set();
  const free = NAMES[gender].filter((n) => !used.has(n));
  return pick(free.length ? free : NAMES[gender]);
}
function usedLooks() {
  if (typeof G === "undefined" || !G) return new Set();
  return new Set([...(G.roster || []), ...(G.volunteers || []), ...(G.migrants || [])].filter((u) => !u.hero && !u.art).map((u) => u.line + ":" + u.slot));
}
function newUnit(opts = {}) {
  const job = opts.job || "warrior";
  const J = JOBS[job];
  // 마을 주민은 숨은 적성 계열의 인물(계열+칸)로 태어난다
  let lineId = opts.line || J.line;
  let slot = opts.slot;
  if (slot == null) {
    // 같은 그림(계열+칸)인 사람이 이미 있으면 피한다
    const lines = job === "villager" && lineId === "villager" ? Object.keys(FIRST_JOB) : [lineId];
    const all = lines.flatMap((l) => LINES[l].slots.map((s, i) => [l, i, s]));
    let cands = all.filter(([, , s]) => !opts.race || s[1] === opts.race);
    if (!cands.length) cands = all;
    const used = usedLooks();
    const fresh = cands.filter(([l, i]) => !used.has(l + ":" + i));
    [lineId, slot] = pick(fresh.length ? fresh : cands);
  } else if (job === "villager" && lineId === "villager") lineId = pick(Object.keys(FIRST_JOB));
  let line = LINES[lineId];
  const [gender, race] = line.slots[slot];
  const u = {
    id: opts.id || "u" + Date.now().toString(36) + (UID++),
    name: opts.name || freshName(gender),
    gender, race, line: lineId, slot, job,
    jobs: [job], lv: 1, exp: 0,
    st: {}, pot: {}, revealed: {},
    bloom: opts.bloom || pick(["early", "normal", "normal", "normal", "late"]),
    traits: {
      personality: pick(TRAITS.personality).id,
      hobby: pick(TRAITS.hobby).id,
      origin: pick(TRAITS.origin).id,
      quirk: chance(opts.quirkChance ?? 0.18) ? pick(TRAITS.quirk).id : null,
    },
    weapon: newWeapon(J.weapon, 0),
    armor: null, acc: [null, null],
    injured: 0, fatigue: 0, bond: 0, days: 0, kills: 0, battles: 0,
    hero: !!opts.hero,
    wage: opts.wage ?? 0,
  };
  for (const k of STATS) {
    u.pot[k] = weightedGrade(opts.potBonus || 0, !!opts.wide);
    u.revealed[k] = 0;
  }
  if (opts.pot) Object.assign(u.pot, opts.pot);
  const q = traitOf(u, "quirk");
  if (q && q.pot) for (const k in q.pot) u.pot[k] = clamp(u.pot[k] + q.pot[k], 0, 7);
  STATS.forEach((k, i) => (u.st[k] = Math.round((7 + rnd(0, 4)) * J.mods[i] + 2)));
  const o = traitOf(u, "origin");
  if (o && o.stat) for (const k in o.stat) u.st[k] += o.stat[k];
  if (opts.traits) Object.assign(u.traits, opts.traits);
  const startLv = opts.lv || 1;
  while (u.lv < startLv) levelUp(u, true);
  u.hp = maxHp(u);
  return u;
}

function traitOf(u, kind) {
  const id = u.traits[kind];
  return id ? TRAITS[kind].find((t) => t.id === id) : null;
}
function traitMod(u, key) {
  let v = 0;
  for (const kind of ["personality", "hobby", "origin", "quirk"]) {
    const t = traitOf(u, kind);
    if (t && t.mod && t.mod[key]) v += t.mod[key];
  }
  return v;
}

function expNeed(lv) { return Math.round(14 + 7 * Math.pow(lv, 1.45)); }

function growth(u, k) {
  const i = STATS.indexOf(k);
  let g = JOBS[u.job].mods[i] * GRADE_MULT[u.pot[k]] * BLOOM[u.bloom].curve(u.lv);
  if (k === "int") g *= 1 + traitMod(u, "growInt");
  return g;
}

function levelUp(u, quiet) {
  u.lv++;
  const gains = {};
  for (const k of STATS) {
    const g = growth(u, k) * rnd(0.75, 1.3) * 1.25;
    const whole = Math.floor(g) + (chance(g - Math.floor(g)) ? 1 : 0);
    u.st[k] += whole;
    gains[k] = whole;
  }
  return gains;
}

function gainExp(u, amount) {
  amount = Math.round(amount * (1 + traitMod(u, "exp")));
  u.exp += amount;
  const ups = [];
  while (u.exp >= expNeed(u.lv) && u.lv < 9999) {
    u.exp -= expNeed(u.lv);
    ups.push(levelUp(u));
  }
  return ups;
}

// ---------- 무기: 상점에서 사거나 전투에서 얻어 장착하고, 대장간에서 강화한다 ----------
// 종류가 지금 직업의 무기와 맞아야 제 힘을 낸다(맞지 않으면 60%)
const WEAPON_KIND = { sword: "검", axe: "도끼", spear: "창", dagger: "단검", bow: "활", crossbow: "석궁", staff: "지팡이", mace: "철퇴", fist: "건틀릿", tool: "연장", book: "마도서" };
const WEAPON_GRADE = [
  { name: "낡은", pow: 8, price: 20 }, { name: "쇠", pow: 12, price: 70 }, { name: "강철", pow: 17, price: 180 },
  { name: "미스릴", pow: 24, price: 420 }, { name: "용린", pow: 33, price: 900 }, { name: "이계의", pow: 44, price: 1800 },
];
const GRADE_NAME = ["일반", "고급", "희귀", "영웅", "전설", "이계"];
let WID = 1;
function newWeapon(kind, grade) { return { id: "w" + Date.now().toString(36) + WID++, kind, grade, plus: 0, name: null }; }
function weaponFits(u, w) { return !!w && w.kind === JOBS[u.job].weapon; }
function weaponPow(w) { return WEAPON_GRADE[w.grade].pow * (1 + w.plus * 0.07) + w.plus; }
function weaponAtk(u) { const w = u.weapon; if (!w) return 3; return weaponPow(w) * (weaponFits(u, w) ? 1 : 0.6); }
function weaponLabel(w) { return (w.name ? `「${w.name}」 ` : "") + `${WEAPON_GRADE[w.grade].name} ${WEAPON_KIND[w.kind]}` + (w.plus ? ` +${w.plus}` : ""); }
function weaponName(u) { return u.weapon ? weaponLabel(u.weapon) : "맨손"; }
function weaponPrice(w) { return Math.round(WEAPON_GRADE[w.grade].price * (1 + w.plus * 0.15)); }
function forgeCost(u) {
  const p = u.weapon.plus + 1;
  const disc = 1 - traitMod(u, "forge");
  return { gold: Math.round(22 * Math.pow(p, 1.35) * (1 + u.weapon.grade * 0.35) * disc) };
}
function forgeChance(u) { return Math.max(0.3, 1 - u.weapon.plus * 0.03); }
// 적 레벨로 떨어지는 무기 등급
function dropGrade(lv, boss) {
  const g = lv < 8 ? pick([0, 0, 1]) : lv < 20 ? pick([1, 1, 2]) : lv < 35 ? pick([2, 2, 3]) : lv < 55 ? pick([3, 3, 4]) : lv < 75 ? pick([3, 4, 4]) : pick([4, 4, 5]);
  return Math.min(lv >= 60 ? 5 : 4, g + (boss ? 1 : 0));
}

// 파생 능력치(전투 외 표시용 + 전투 초기값)
function maxHp(u) {
  let h = 38 + u.st.vit * 5 + u.st.str + u.lv * 3;
  h *= 1 + traitMod(u, "hp");
  if (u.armor) h += (ITEMS[u.armor]?.hp || 0);
  for (const a of u.acc) if (a) h += ITEMS[a]?.hp || 0;
  return Math.round(h);
}
function derived(u) {
  const J = JOBS[u.job];
  const wAtk = weaponAtk(u);
  const isMag = J.range === "magic" || J.range === "heal";
  const items = [u.armor, ...u.acc].filter(Boolean).map((id) => ITEMS[id] || {});
  const sum = (k) => items.reduce((a, it) => a + (it[k] || 0), 0);
  return {
    hp: maxHp(u),
    atk: Math.round(u.st.str * 1.5 + (isMag ? wAtk * 0.4 : wAtk) + sum("atk")),
    mag: Math.round(u.st.int * 1.5 + (isMag ? wAtk : 0) + sum("mag")),
    def: Math.round(u.st.vit * 0.9 + u.st.str * 0.2 + sum("def")),
    res: Math.round(u.st.spi * 0.9 + u.st.int * 0.2 + sum("res")),
    heal: Math.round(u.st.spi * 1.4 + (J.range === "heal" ? wAtk : wAtk * 0.3)),
    spd: Math.round(10 + u.st.agi * 0.45 + sum("spd")),
    acc: Math.round(92 + u.st.agi * 0.25 + u.st.luk * 0.15),
    eva: clamp(Math.round(u.st.agi * 0.35 + u.st.luk * 0.15 + sum("eva") + traitMod(u, "eva") * 100), 0, 60),
    crit: clamp(Math.round(4 + u.st.luk * 0.35 + u.st.agi * 0.1 + traitMod(u, "crit") * 100 + sum("crit")), 0, 75),
  };
}

function power(u) {
  const d = derived(u);
  return Math.round(d.hp * 0.3 + Math.max(d.atk, d.mag, d.heal) * 2 + d.def + d.res + d.spd * 2);
}

// 습득 스킬: 거쳐 온 직업 전부(환생 후 계승은 추후)
function unitSkills(u) {
  const s = [];
  for (const j of u.jobs) for (const id of JOBS[j].skills) if (!s.includes(id)) s.push(id);
  return s;
}

// 다음 직업 후보. 마을 주민은 적성 계열의 1차 직업 하나
function nextJobs(u) {
  if (u.hero) return [];
  if (u.job === "villager") return FIRST_JOB[u.line] ? [FIRST_JOB[u.line]] : [];
  return JOBS[u.job].next;
}
// 전직을 막는 이유(없으면 null)
function promoteBlock(u, to) {
  const J = JOBS[u.job];
  if (u.lv < J.lv) return `Lv${J.lv} 필요`;
  const b = JOBS[to].bld;
  if (b && typeof G !== "undefined" && G && !G.bld[b]) return `${BUILDINGS[b].name} 필요`;
  return null;
}
function canPromote(u) {
  return nextJobs(u).some((j) => !promoteBlock(u, j));
}
// 적성은 Lv3이 되거나 세진이 통솔자 이상이면 보인다
function aptKnown(u) {
  if (u.job !== "villager") return true;
  const h = typeof heroU === "function" ? heroU() : null;
  return u.lv >= 3 || (h && JOBS[h.job].tier >= 1);
}
function promote(u, to) {
  u.job = to;
  if (!u.jobs.includes(to)) u.jobs.push(to);
  // 같은 계열로 바뀌면 외형 슬롯 유지, 평민은 새 계열로 슬롯 재배정(같은 성별)
  const line = JOBS[to].line;
  if (line !== u.line) {
    const opts = LINES[line].slots.map((s, i) => [s, i]).filter(([s]) => s[0] === u.gender);
    const [s, i] = pick(opts);
    u.line = line; u.slot = i; u.race = s[1];
  }
  // 무기 종류가 바뀌는 전직: 새 직업의 기본 무기를 받고, 쓰던 무기는 무기고로
  const kind = JOBS[to].weapon;
  if (!u.weapon || u.weapon.kind !== kind) {
    if (u.weapon && typeof G !== "undefined" && G && G.arms) G.arms.push(u.weapon);
    u.weapon = newWeapon(kind, clamp(JOBS[to].tier - 1, 0, 3));
  }
  // 전직 보너스: 마을 주민에서 1차로 갈 때 크게
  const bonus = JOBS[to].tier === 1 ? 4 : 2;
  for (const k of STATS) u.st[k] += Math.round(bonus * JOBS[to].mods[STATS.indexOf(k)]);
}

// 잠재력 공개 단계: 0 ??? / 1 대략 / 2 등급 / 3 정확
function revealLevel(u, k) {
  if (u.hero) return 3;
  const h = typeof heroU === "function" ? heroU() : null;
  const heroTier = h ? JOBS[h.job].tier : 0;
  let r = Math.max(u.revealed[k], heroTier >= 3 ? 2 : heroTier >= 1 ? 1 : 0);
  if (heroTier >= 2 && u.days >= 20) r = Math.max(r, 2);
  return r;
}
function potText(u, k) {
  const g = u.pot[k];
  const r = revealLevel(u, k);
  if (r === 0) return "???";
  if (r === 1) return g <= 2 ? "낮음" : g <= 4 ? "보통" : "높음";
  if (r === 2) return GRADES[g];
  return `${GRADES[g]} (×${GRADE_MULT[g]})`;
}

// 방어구·장신구
const ITEMS = {
  leather: { name: "가죽 갑옷", slot: "armor", def: 4, price: 40 },
  chain: { name: "사슬 갑옷", slot: "armor", def: 9, eva: -2, price: 120 },
  robe: { name: "마법사 로브", slot: "armor", def: 2, res: 6, mag: 3, price: 80 },
  plate: { name: "판금 갑옷", slot: "armor", def: 16, spd: -2, price: 300 },
  ring_str: { name: "구리 반지", slot: "acc", atk: 4, price: 50 },
  amulet: { name: "사파이어 부적", slot: "acc", res: 5, mag: 3, price: 70 },
  charm: { name: "깃털 부적", slot: "acc", eva: 4, spd: 1, price: 60 },
  coin: { name: "행운의 동전", slot: "acc", crit: 5, price: 80 },
  belt: { name: "튼튼한 허리띠", slot: "acc", hp: 30, price: 60 },
  pen: { name: "이계의 볼펜", slot: "acc", atk: 10, mag: 10, crit: 5, price: 0, otherworld: true },
};
