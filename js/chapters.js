// 2장 이후: 몬스터, 던전, 습격, 장 진행, 이야기, 엔딩, 엔딩 후(무한 심연·환생)
"use strict";

// ---------- 몬스터 ----------
// 기본 체형: [hp, atk, def, spd, mag] Lv1 기준
const ARCH = {
  grunt: [46, 10, 5, 10, 2], archer: [36, 10, 3, 11, 2], caster: [38, 5, 3, 9, 10], tank: [92, 11, 11, 7, 2],
  fast: [40, 11, 3, 15, 2], brute: [112, 15, 8, 7, 1], elite: [165, 16, 10, 9, 6], boss: [400, 18, 12, 9, 8],
};
// [id, 이름, 그림 키, 체형, 사거리, 기술, 추가 속성]
const MON_LIST = [
  ["owlbear", "올빼미곰", "beasts_5", "brute", "melee", ["m_charge"], { beast: true }],
  ["alpha_wolf", "우두머리 늑대", "beasts_6", "elite", "melee", ["m_howl", "m_bite"], { beast: true }],
  ["slime", "초록 슬라임", "forest_1", "tank", "melee", [], { beast: true }],
  ["mushroom", "독버섯 걸음이", "forest_2", "caster", "magic", ["m_poison"]],
  ["mandrake", "비명 맨드레이크", "forest_3", "caster", "magic", ["m_fear"]],
  ["beetle", "뿔 딱정벌레", "forest_4", "tank", "melee", ["m_guard"], { beast: true }],
  ["mantis", "살인 사마귀", "forest_5", "fast", "melee", ["m_bite"], { beast: true }],
  ["treant", "성난 나무정령", "forest_6", "elite", "melee", ["m_mend", "m_quake"]],
  ["skeleton", "해골 병사", "undead_1", "grunt", "melee", []],
  ["skel_archer", "해골 궁수", "undead_2", "archer", "ranged", []],
  ["zombie", "썩은 시체", "undead_3", "brute", "melee", ["m_poison"]],
  ["ghost", "떠도는 유령", "undead_4", "caster", "magic", ["m_drain"]],
  ["wight", "망령 기사", "undead_5", "elite", "melee", ["m_guard", "m_bite"]],
  ["lich", "리치", "undead_6", "elite", "magic", ["m_silence", "m_drain"]],
  ["orc", "오크 전사", "orcs_1", "grunt", "melee", []],
  ["orc_berserker", "오크 광전사", "orcs_2", "brute", "melee", ["m_bite"]],
  ["orc_shaman", "오크 주술사", "orcs_3", "caster", "magic", ["m_hex", "m_mend"]],
  ["troll", "동굴 트롤", "orcs_4", "brute", "melee", ["m_mend"]],
  ["ogre", "쌍두 오우거", "orcs_5", "elite", "melee", ["m_quake"]],
  ["orc_warlord", "오크 대족장", "orcs_6", "boss", "melee", ["m_charge", "m_howl", "m_quake"], { boss: true }],
  ["salamander", "불도마뱀", "elementals_1", "caster", "magic", ["m_firebolt"], { beast: true }],
  ["ice_wisp", "얼음 도깨비불", "elementals_2", "caster", "magic", ["m_frost"]],
  ["stone_golem", "돌 골렘", "elementals_3", "tank", "melee", ["m_guard"]],
  ["iron_golem", "강철 골렘", "elementals_4", "tank", "melee", ["m_guard", "m_quake"]],
  ["lava_elem", "용암 정령", "elementals_5", "elite", "magic", ["m_fire"]],
  ["frost_giant", "서리 거인", "elementals_6", "elite", "melee", ["m_frost", "m_charge"]],
  ["imp", "임프", "demons_1", "caster", "magic", ["m_firebolt"]],
  ["hellhound", "지옥견", "demons_2", "fast", "melee", ["m_bite"], { beast: true }],
  ["gargoyle", "가고일", "demons_3", "tank", "melee", ["m_guard"]],
  ["shadow_fiend", "그림자 마귀", "demons_4", "caster", "magic", ["m_drain", "m_fear"]],
  ["demon_knight", "마족 기사", "demons_5", "elite", "melee", ["m_charge"]],
  ["demon_captain", "마족 장교", "demons_6", "elite", "melee", ["m_howl", "m_fire"]],
  ["lizardman", "도마뱀인간", "dragons_1", "grunt", "melee", []],
  ["wyvern", "와이번", "dragons_2", "fast", "ranged", ["m_bite"], { beast: true }],
  ["drake", "불 드레이크", "dragons_3", "caster", "magic", ["m_firebolt"], { beast: true }],
  ["basilisk", "바실리스크", "dragons_4", "brute", "melee", ["m_fear"], { beast: true }],
  ["young_dragon", "어린 용", "dragons_5", "elite", "magic", ["m_fire"], { beast: true }],
  ["elder_dragon", "고룡", "dragons_6", "boss", "magic", ["m_fire", "m_charge"], { beast: true, boss: true }],
  ["flying_sword", "떠도는 검", "memory_1", "fast", "melee", []],
  ["living_armor", "빈 갑옷", "memory_2", "tank", "melee", ["m_guard"]],
  ["mimic", "보물상자 미믹", "memory_3", "brute", "melee", ["m_bite"]],
  ["spellbook", "홀린 마도서", "memory_4", "caster", "magic", ["m_silence"]],
  ["phantom", "기억의 망령", "memory_5", "caster", "magic", ["m_drain"]],
  ["crystal_guard", "수정 수호자", "memory_6", "elite", "melee", ["m_guard", "m_quake"]],
  ["headlight", "전조등 망령", "rift_1", "caster", "magic", ["m_fear"]],
  ["concrete", "콘크리트 골렘", "rift_2", "tank", "melee", ["m_guard", "m_quake"]],
  ["static", "잡음 그림자", "rift_3", "fast", "melee", ["m_bite"]],
  ["neon", "네온 뱀", "rift_4", "caster", "magic", ["m_frost"]],
  ["clock_angel", "시계 천사", "rift_5", "elite", "magic", ["m_mend", "m_silence"]],
  ["suit", "얼굴 없는 정장", "rift_6", "elite", "ranged", ["m_fear", "m_drain"]],
  // 보스
  ["spider_queen", "거미 여왕", "bosses_a_2", "boss", "ranged", ["m_web", "m_poison", "m_bite"], { boss: true }],
  ["lich_lord", "리치 군주", "bosses_a_3", "boss", "magic", ["m_silence", "m_drain", "m_fire"], { boss: true }],
  ["troll_chief", "트롤 족장", "bosses_a_4", "boss", "melee", ["m_charge", "m_mend", "m_quake"], { boss: true }],
  ["fire_wyrm", "화염 비룡", "bosses_a_5", "boss", "magic", ["m_fire", "m_firebolt", "m_charge"], { boss: true, beast: true }],
  ["frost_queen", "서리 여왕", "bosses_a_6", "boss", "magic", ["m_frost", "m_silence", "m_mend"], { boss: true }],
  ["ancient_dragon", "태고의 용", "bosses_b_1", "boss", "magic", ["m_fire", "m_charge", "m_quake"], { boss: true, beast: true, hp: 1.4 }],
  ["demon_general", "마족 장군", "bosses_b_2", "boss", "melee", ["m_fire", "m_charge", "m_howl"], { boss: true, hp: 1.2 }],
  ["memory_guard", "기억의 수호자", "bosses_b_3", "boss", "melee", ["m_guard", "m_quake", "m_silence"], { boss: true }],
  ["abyss_lord", "심연의 군주", "bosses_b_4", "boss", "magic", ["m_drain", "m_fear", "m_fire"], { boss: true, hp: 1.5 }],
  ["gatekeeper", "귀환의 문지기", "bosses_b_5", "boss", "melee", ["m_shatter", "m_charge", "m_guard"], { boss: true, hp: 1.3 }],
  ["mirror_sejin", "거울의 세진", "bosses_b_6", "boss", "melee", ["m_mirror", "m_shatter", "m_drain"], { boss: true, hp: 1.6 }],
  // 3장 결투
  ["aldric", "기사단장 알드릭", "npc_b_4", "boss", "melee", ["m_guard", "m_charge"], { boss: true, flip: true, hp: 0.7 }],
  ["royal_knight", "왕국 기사", "knight_2", "elite", "melee", ["m_guard"], { flip: true }],
];
for (const [id, name, art, arch, range, skills, extra = {}] of MON_LIST) {
  const base = ARCH[arch].slice();
  if (extra.hp) base[0] = Math.round(base[0] * extra.hp);
  MONSTERS[id] = { name, icon: "👾", range, base, skills, beast: !!extra.beast, boss: !!extra.boss, flip: !!extra.flip };
  if (typeof MON_ART !== "undefined") MON_ART[id] = art;
}
Object.assign(SKILLS, {
  m_bite: { name: "물어뜯기", kind: "atk", pow: 1.6, tgt: "single", rng: "melee", cd: 2 },
  m_guard: { name: "단단해지기", kind: "buff", tgt: "self", buff: { def: 0.5 }, taunt: 2, turns: 2, cd: 4 },
  m_poison: { name: "독", kind: "atk", pow: 0.9, dot: 0.3, tgt: "single", rng: "any", turns: 3, cd: 3, fx: "dark" },
  m_fear: { name: "공포", kind: "debuff", tgt: "single", rng: "any", buff: { atk: -0.3 }, turns: 3, cd: 4, fx: "dark" },
  m_firebolt: { name: "화염탄", kind: "atk", pow: 1.5, mag: true, tgt: "single", rng: "any", cd: 2, fx: "fire" },
  m_fire: { name: "불바다", kind: "atk", pow: 0.85, mag: true, tgt: "all", rng: "any", cd: 4, fx: "fire" },
  m_frost: { name: "서리 폭풍", kind: "atk", pow: 1.0, mag: true, tgt: "col", rng: "any", cd: 3, fx: "magic" },
  m_silence: { name: "침묵의 저주", kind: "debuff", tgt: "backrow", rng: "any", silence: 2, buff: { atk: -0.1 }, turns: 2, cd: 5, fx: "dark" },
  m_drain: { name: "생기 흡수", kind: "atk", pow: 1.5, mag: true, drain: 0.5, tgt: "single", rng: "any", cd: 3, fx: "dark" },
  m_shatter: { name: "문의 파동", kind: "atk", pow: 1.1, mag: true, tgt: "all", rng: "any", cd: 4, fx: "holy" },
  m_mirror: { name: "거울 지휘", kind: "buff", tgt: "allies", buff: { atk: 0.4, spd: 0.2 }, turns: 3, cd: 5 },
  // 세진·서윤
  otherpanel: { name: "개척자의 창", kind: "passive", desc: "아군 능력 +27%. 지휘 게이지가 37% 빨리 찬다." },
  riftblade: { name: "균열의 칼날", kind: "atk", pow: 1.5, mag: true, tgt: "col", rng: "any", cd: 3, fx: "magic" },
});
Object.assign(JOBS, {
  pioneer: { name: "이계의 개척자", line: "hero", tier: 4, role: "지휘", range: "melee", weapon: "sword", mods: [1.1, 1.2, 1.1, 1.6, 1.5, 1.2], skills: ["otherpanel"], next: [], lv: 0 },
  riftwatcher: { name: "균열 감시자", line: "warrior", tier: 3, role: "근딜/마딜", range: "melee", weapon: "sword", mods: [1.5, 1.2, 1.3, 1.4, 1.2, 1.1], skills: ["riftblade", "counter"], next: [], lv: 0 },
});
if (typeof HERO_ART !== "undefined") HERO_ART.pioneer = 6;
ITEMS.phone = { name: "금 간 스마트폰", slot: "acc", spd: 3, crit: 8, res: 8, price: 0, otherworld: true };
ITEMS.notebook = { name: "현자의 수첩", slot: "acc", mag: 14, res: 10, price: 0, otherworld: true };

// ---------- 던전 ----------
const fl = (lv, pool, n = [3, 4]) => ({ lv, pool, n });
Object.assign(DUNGEONS, {
  mine: { name: "버려진 광산", bg: "mine", unlock: (G) => G.chapter >= 2, floors: [
    fl(10, ["bat", "spider", "slime", "zombie"]), fl(12, ["spider", "zombie", "skeleton", "stone_golem"]),
    fl(14, ["skeleton", "skel_archer", "stone_golem", "spider"], [3, 5]), fl(16, ["zombie", "ghost", "stone_golem", "spider", "skel_archer"], [4, 5]),
    { lv: 18, boss: [["spider_queen", 0, 2], ["spider", 0, 0], ["spider", 0, 4], ["spider", 1, 1], ["spider", 1, 3]], flag: "mineboss" },
  ] },
  crypt: { name: "망자의 묘", bg: "crypt", unlock: (G) => G.flags.mineboss, floors: [
    fl(18, ["skeleton", "skel_archer", "ghost", "zombie"], [4, 5]), fl(20, ["ghost", "wight", "skel_archer", "zombie"], [4, 5]),
    fl(22, ["wight", "lich", "skeleton", "ghost"], [4, 5]),
    { lv: 24, boss: [["lich_lord", 1, 2], ["wight", 0, 1], ["wight", 0, 3], ["lich", 1, 0], ["skel_archer", 1, 4]], flag: "ch2clear" },
  ] },
  swamp: { name: "독안개 늪", bg: "swamp", unlock: (G) => G.chapter >= 3, floors: [
    fl(24, ["orc", "mushroom", "mandrake", "orc_shaman"], [4, 5]), fl(26, ["orc", "orc_berserker", "orc_shaman", "mantis"], [4, 5]),
    fl(28, ["orc_berserker", "troll", "orc_shaman", "beetle"], [4, 5]), fl(30, ["troll", "ogre", "orc_berserker", "treant"], [4, 5]),
    { lv: 32, boss: [["troll_chief", 0, 2], ["troll", 0, 0], ["troll", 0, 4], ["orc_shaman", 1, 1], ["orc_shaman", 1, 3]], flag: "swampboss" },
  ] },
  duel: { name: "알드릭의 결투", bg: "village", unlock: (G) => G.chapter === 3 && G.seen.aldric && !G.flags.duelwon, floors: [
    { lv: 30, boss: [["aldric", 0, 2], ["royal_knight", 0, 1], ["royal_knight", 0, 3]], flag: "duelwon" },
  ] },
  volcano: { name: "화산 동굴", bg: "volcano", unlock: (G) => G.chapter >= 4, floors: [
    fl(34, ["salamander", "imp", "hellhound", "lizardman"], [4, 5]), fl(37, ["drake", "salamander", "lava_elem", "lizardman"], [4, 5]),
    fl(40, ["lava_elem", "drake", "hellhound", "basilisk"], [4, 5]),
    { lv: 45, boss: [["fire_wyrm", 0, 2], ["lava_elem", 0, 0], ["lava_elem", 0, 4], ["drake", 1, 1], ["drake", 1, 3]], flag: "key1" },
  ] },
  ice: { name: "얼음 성채", bg: "ice", unlock: (G) => G.chapter >= 4, floors: [
    fl(34, ["ice_wisp", "stone_golem", "wyvern", "living_armor"], [4, 5]), fl(37, ["ice_wisp", "iron_golem", "frost_giant", "wyvern"], [4, 5]),
    fl(40, ["frost_giant", "iron_golem", "ice_wisp", "spellbook"], [4, 5]),
    { lv: 45, boss: [["frost_queen", 1, 2], ["frost_giant", 0, 1], ["frost_giant", 0, 3], ["ice_wisp", 1, 0], ["ice_wisp", 1, 4]], flag: "key2" },
  ] },
  rift: { name: "세계의 균열", bg: "rift", unlock: (G) => G.chapter >= 5, floors: [
    fl(48, ["headlight", "static", "concrete", "imp"], [4, 5]), fl(51, ["neon", "static", "concrete", "shadow_fiend"], [4, 5]),
    fl(54, ["suit", "clock_angel", "demon_knight", "neon"], [4, 5]), fl(57, ["demon_knight", "demon_captain", "suit", "concrete"], [4, 5]),
    { lv: 60, boss: [["demon_general", 0, 2], ["demon_knight", 0, 0], ["demon_knight", 0, 4], ["demon_captain", 1, 1], ["clock_angel", 1, 3]], flag: "ch5clear" },
  ] },
  ruins: { name: "고대 유적", bg: "ruins", unlock: (G) => G.chapter >= 6, floors: [
    fl(61, ["living_armor", "phantom", "spellbook", "flying_sword"], [4, 5]), fl(64, ["wyvern", "flying_sword", "crystal_guard", "phantom", "living_armor"], [4, 5]),
    fl(67, ["young_dragon", "living_armor", "clock_angel", "static", "flying_sword"], [4, 5]), fl(70, ["crystal_guard", "young_dragon", "suit", "phantom", "wyvern"], [4, 5]),
    { lv: 74, phases: [
      [["gatekeeper", 0, 2], ["crystal_guard", 0, 0], ["crystal_guard", 0, 4], ["phantom", 1, 1], ["phantom", 1, 3]],
      [["gatekeeper", 0, 2], ["memory_guard", 0, 4], ["clock_angel", 1, 1]],
      [["gatekeeper", 0, 2]],
    ], boss: true, flag: "final" },
  ] },
  abyss: { name: "무한 심연", bg: "abyss", unlock: (G) => G.flags.ending, endless: true },
});
for (const d of Object.values(DUNGEONS)) for (const f of d.floors || []) if (f.phases) f.boss = f.phases[0];

// 무한 심연: 층마다 강해지고 10층마다 보스
const ABYSS_POOL = ["crystal_guard", "young_dragon", "demon_knight", "suit", "clock_angel", "lava_elem", "frost_giant", "wight", "lich", "ogre",
  "phantom", "concrete", "flying_sword", "living_armor", "static", "neon", "wyvern", "hellhound", "imp", "skeleton", "orc_berserker", "spellbook"];
const ABYSS_BOSS = ["ancient_dragon", "lich_lord", "demon_general", "memory_guard", "mirror_sejin", "frost_queen", "fire_wyrm", "spider_queen", "troll_chief", "abyss_lord"];
function floorOf(did, fi) {
  const D = DUNGEONS[did];
  if (!D.endless) return D.floors[fi];
  const lv = 76 + fi * 4;
  if ((fi + 1) % 10 === 0) {
    const b = ABYSS_BOSS[Math.floor(fi / 10) % ABYSS_BOSS.length];
    return { lv, boss: [[b, 0, 2], [pick(ABYSS_POOL), 0, 0], [pick(ABYSS_POOL), 0, 4], [pick(ABYSS_POOL), 1, 1], [pick(ABYSS_POOL), 1, 3]], abyssBoss: b };
  }
  return { lv, pool: ABYSS_POOL, n: [4, 6] };
}
function floorCount(did) { const D = DUNGEONS[did]; return D.endless ? (G.dungeon[did] || 0) + 1 : D.floors.length; }

// ---------- 습격 ----------
// 장 시작일(G.chStart)에서 며칠 뒤인지
const R_ = (day, lv, pool, n = 5) => ({ day, lv, pool, n });
Object.assign(RAIDS, {
  2: [R_(5, 12, ["bat", "spider", "zombie"], 4), R_(11, 15, ["skeleton", "zombie", "spider", "skel_archer"]), R_(17, 18, ["skeleton", "skel_archer", "ghost", "zombie"]), R_(23, 21, ["wight", "ghost", "skel_archer", "zombie"]), R_(29, 24, ["wight", "lich", "skeleton", "ghost"])],
  3: [R_(5, 26, ["orc", "orc_shaman", "mantis"]), R_(11, 28, ["orc", "orc_berserker", "orc_shaman"]), R_(17, 30, ["orc_berserker", "troll", "orc_shaman"]),
    { day: 24, siege: true, waves: [R_(0, 30, ["orc", "orc_berserker", "orc_shaman"], 6), R_(0, 32, ["troll", "orc_berserker", "orc_shaman", "ogre"], 6), { lv: 34, boss: [["orc_warlord", 0, 2], ["ogre", 0, 0], ["ogre", 0, 4], ["orc_shaman", 1, 1], ["orc_shaman", 1, 3]] }] }],
  4: [R_(6, 36, ["salamander", "imp", "hellhound"]), R_(13, 39, ["ice_wisp", "stone_golem", "wyvern"]), R_(20, 42, ["drake", "lava_elem", "hellhound"]), R_(27, 45, ["frost_giant", "iron_golem", "ice_wisp"]), R_(34, 47, ["basilisk", "drake", "lava_elem", "wyvern"])],
  5: [R_(5, 50, ["headlight", "static", "concrete"]), R_(11, 53, ["neon", "static", "suit"]), R_(17, 56, ["demon_knight", "shadow_fiend", "concrete"]), R_(23, 59, ["suit", "clock_angel", "demon_captain"]), R_(29, 62, ["demon_knight", "demon_captain", "neon", "suit"])],
  6: [R_(6, 64, ["crystal_guard", "phantom", "living_armor"]), R_(14, 67, ["young_dragon", "wyvern", "suit"]), R_(22, 70, ["demon_knight", "clock_angel", "young_dragon"]), R_(30, 73, ["elder_dragon", "crystal_guard", "phantom"])],
});

// ---------- 장 ----------
const CHAPTERS = {
  1: { name: "고블린의 숲", days: 30, goal: "고블린 왕 토벌" },
  2: { name: "버려진 광산과 망자의 묘", days: 32, goal: (G) => G.flags.mineboss ? "망자의 묘 최심부 조사" : "버려진 광산 재개" },
  3: { name: "오크 대침공과 왕국의 눈", days: 36, goal: (G) => G.seen.siegeDone ? "" : `${G.chStart + 24 - G.day > 0 ? G.chStart + 24 - G.day + "일 뒤" : "오늘 밤"} 오크 대공세를 막아라` },
  4: { name: "불과 얼음의 열쇠", days: 40, goal: (G) => `열쇠 조각 ${(G.flags.key1 ? 1 : 0) + (G.flags.key2 ? 1 : 0)}/2 · 화산 동굴과 얼음 성채` },
  5: { name: "균열", days: 36, goal: "균열 너머의 마족 장군 토벌" },
  6: { name: "귀환의 문", days: 36, goal: "고대 유적 최심부, 귀환의 문으로" },
  7: { name: "끝나지 않는 등불", days: 0, goal: (G) => `무한 심연 ${G.dungeon.abyss || 0}층 돌파 · 환생으로 더 강해지기` },
};
function chapterGoal() {
  const C = CHAPTERS[G.chapter];
  if (!C) return null;
  const g = typeof C.goal === "function" ? C.goal(G) : C.goal;
  const left = C.days ? G.chStart + C.days + (G.chapter === 1 ? 1 : 0) - G.day : null;
  return g ? { title: g, sub: C.days ? (left > 0 ? `${left}일 남음` : "기한이 지났어요. 서두르세요!") : "엔딩 후 · 끝없이 이어지는 이야기" } : null;
}
function startChapter(n) {
  G.chapter = n; G.chStart = G.day; G.story = "ch" + n;
  G.fame += 15;
  log(`제${n}장 「${CHAPTERS[n].name}」 시작`);
}

// 층 돌파 뒤 처리. 보여 줄 장면 id 목록을 돌려준다
function onFloorClear(did, fi) {
  const F = floorOf(did, fi);
  const first = fi >= (G.dungeon[did] || 0);
  if (first) { G.dungeon[did] = fi + 1; G.fame += 2; }
  const out = [];
  if (F.flag && !G.flags[F.flag]) { G.flags[F.flag] = true; out.push(F.flag); }
  if (F.boss && did === "goblin_forest" && !G.flags.ch1clear) { G.flags.ch1clear = true; out.push("ch1clear"); }
  if (F.abyssBoss && first) { out.push("abyss_boss"); G.flags.abyssBoss = F.abyssBoss; }
  return out;
}

// ---------- 이야기 ----------
Object.assign(SCENES, {
  ch2intro: { bg: "mine", lines: [
    ["", "고블린 왕이 쓰러진 지 며칠. 등불골에 오랜만에 웃음이 돌았다."],
    ["보린", "세진 군, 마을 뒤편 산에 버려진 은광이 있네. 20년 전 갑자기 광부들이 하나둘 사라져서 닫았지."],
    ["가렌", "어릴 때 들었지. 광산 밑에서 죽은 자들이 걸어 나온다고."],
    ["세진", "광산을 다시 열면 철과 은이 나오고, 마을이 숨을 쉬겠죠."],
    ["세진(속)", "그리고… 리나가 준 자동차 키. 이 세계 어딘가에 나 말고도 「건너온」 사람이 있었다."],
    ["*", "제2장 「버려진 광산과 망자의 묘」 — 목표: 광산을 되찾고 그 아래를 조사"],
  ] },
  mineboss: { bg: "mine", lines: [
    ["", "거미 여왕이 쓰러지자, 광산 가장 깊은 벽이 무너져 내렸다."],
    ["", "그 너머로 이어지는 돌계단. 차가운 바람과 함께 촛농 냄새가 올라왔다."],
    ["가렌", "광산이 묘지랑 이어져 있었다고…? 광부들이 사라진 이유가 이거였군."],
    ["", "계단 입구, 누군가 서 있었다. 깊은 후드를 쓴 여행자. 후드 아래로 희미한 청록빛이 일렁였다."],
    ["???", "…또 한 명 왔구나. 이번에는 살아서."],
    ["세진", "누구세요? 지금 「또」라고—"],
    ["???", "묘의 끝에서 글을 하나 보게 될 거다. 끝까지 읽으려 하지 마. 그게 네 마음을 망칠 테니까."],
    ["", "눈을 깜빡인 사이, 여행자는 사라지고 없었다."],
    ["*", "「망자의 묘」가 열렸어요."],
  ] },
  ch2clear: { bg: "crypt", art: "story_09_tomb", lines: [
    ["", "리치 군주가 재가 되어 흩어진 뒤, 묘의 가장 안쪽에 작은 석관이 남았다."],
    ["", "뚜껑에 새겨진 문양은— 산과 등불. 등불골의 문장이었다."],
    ["세진", "이건…"],
    ["", "석관 위에 놓인 것은 플라스틱 볼펜 한 자루와 낡은 수첩. 첫 장에 삐뚤빼뚤한 한글이 적혀 있었다."],
    ["*", "「2003년 7월, 장마. 나는 산을 넘다 미끄러졌고, 눈을 떠 보니 달이 두 개였다.」"],
    ["*", "「이 마을에 등불을 남긴다. 다음에 올 누군가가 길을 잃지 않도록.」"],
    ["*", "「돌아가는 길은 샘 아래에 —」"],
    ["", "그 뒤 페이지는 찢겨 나가 있었다."],
    ["세진(속)", "등불의 현자는… 한국 사람이었어. 100년 전에 이곳에 왔는데, 날짜는 2003년."],
    ["세진(속)", "시간이 다르게 흐른다. 그렇다면, 돌아갈 수만 있다면—"],
    ["*", "「이계의 볼펜」과 「현자의 수첩」을 얻었다. 세진이 「군사」로 전직했다."],
  ] },
  ch3intro: { bg: "village", lines: [
    ["", "광산이 다시 돌아가자 등불골은 눈에 띄게 커졌다. 그리고 커진 마을은 눈에 띄기 마련이었다."],
    ["한스", "세진 형님! 척후가 돌아왔어요! 남쪽 늪에 오크 깃발이… 수백 개예요!"],
    ["보린", "오크 대족장이 늪지 부족을 하나로 묶었다는 소문이 사실이었군."],
    ["세진", "성벽, 망루, 병사. 남은 시간 안에 할 수 있는 건 다 하죠. 늪에 먼저 들어가서 놈들 숫자도 줄이고요."],
    ["*", "제3장 「오크 대침공과 왕국의 눈」 — 목표: 24일 뒤 밤의 오크 대공세를 막아라"],
  ] },
  aldric: { bg: "village", lines: [
    ["", "말발굽 소리와 함께 은빛 갑옷의 기사들이 마을로 들어왔다."],
    ["알드릭", "왕국 기사단장 알드릭이다. 국왕 폐하의 명으로 오크 토벌을 지원하러 왔다."],
    ["알드릭", "…라고 들었는데. 이게 그 「이방인 영주」의 마을인가? 농부에게 창을 쥐여 준 오합지졸이로군."],
    ["가렌", "뭐라고, 이 깡통이—"],
    ["알드릭", "불만이면 실력으로 말해라. 내 기사 둘과 나, 셋을 상대로 버텨 보든가."],
    ["세진(속)", "자존심 싸움이지만… 이기면 기사단이 우리를 다르게 볼 거다."],
    ["*", "원정 목록에 「알드릭의 결투」가 생겼어요. 이기면 3장 끝에 알드릭이 동료가 돼요."],
  ] },
  duelwon: { bg: "village", art: "story_13_duel", lines: [
    ["", "알드릭의 목검이 바닥을 굴렀다. 광장이 한순간 조용해졌다."],
    ["알드릭", "…하. 농부의 창에 기사가 밀리다니. 내가 틀렸다."],
    ["알드릭", "세진, 그대에게 할 말이 있다. 오크를 물리친 뒤에… 단둘이."],
    ["", "기사단이 마을을 보는 눈빛이 달라졌다."],
  ] },
  siege: { bg: "village_wall", art: "story_12_siege", lines: [
    ["", "그날 밤. 남쪽 지평선이 횃불로 붉게 물들었다."],
    ["보린", "온다…!"],
    ["세진", "성벽에 궁수, 문 앞에 창병! 세 번 밀려온다. 첫 물결에 힘을 다 쓰지 마!"],
    ["*", "오크 대공세: 3연속 방어전. 체력은 전투 사이에 회복되지 않아요."],
  ] },
  siegelose: { bg: "night", lines: [
    ["", "성문이 부서지고, 마을 일부가 불탔다. 오크들은 약탈을 마치고 물러났지만, 대족장의 웃음소리는 사라지지 않았다."],
    ["보린", "아직 끝나지 않았네. 놈들은 다시 올 걸세. 그때는…"],
    ["*", "5일 뒤 밤, 오크 대공세가 다시 와요."],
  ] },
  ch3clear: { bg: "festival", lines: [
    ["", "오크 대족장이 쓰러지자, 늪의 북소리가 멎었다. 새벽빛 아래 성벽 위에서 마을 사람들이 서로를 끌어안았다."],
    ["알드릭", "왕국은 오늘 일을 기억할 것이다. 국왕 폐하께 등불골을 정식 영지로 인정해 달라고 아뢰겠다."],
    ["", "보름 뒤, 왕도에서 사자가 왔다. 세진을 등불골의 영주로 임명한다는 칙서였다. 세무관 세리는 횡령으로 파직되었다."],
    ["알드릭", "그리고 그대에게만 보여 줄 것이 있다. 궁정마법사 발토르의 서재에서 나온 명단이다."],
    ["*", "「소환 실험 기록 — 실패 37. 대상 행방불명.」 그 아래 빼곡한 이름들 사이에, 낯선 글씨가 하나 있었다. 「한세진」."],
    ["세진(속)", "…나는 사고로 온 게 아니었어. 누군가 나를 불렀다."],
    ["*", "세진이 「영주」가 되었다."],
  ] },
  aldricjoin: { bg: "village", lines: [
    ["알드릭", "명단을 본 이상 왕도로 돌아갈 수 없다. 내 검을 이 마을에 맡기겠다, 영주."],
    ["*", "기사단장 알드릭이 동료가 되었다."],
  ] },
  ch4intro: { bg: "village", lines: [
    ["", "영주가 된 지 한 달. 세진은 매일 밤 현자의 수첩을 들여다보았다."],
    ["세진(속)", "「돌아가는 길은 샘 아래에」. 마을 우물에도, 숲의 샘에도 아무것도 없었다."],
    ["", "그날, 마을 어귀에 후드를 쓴 여행자가 다시 나타났다."],
    ["???", "샘을 찾고 있구나. 문을 열려면 열쇠가 셋 필요하다. 하나는 불 속에, 하나는 얼음 속에."],
    ["세진", "그리고 마지막 하나는요?"],
    ["???", "…이미 네 마을에 있다. 화산 동굴에서 기다리마."],
    ["*", "제4장 「불과 얼음의 열쇠」 — 목표: 화산 동굴과 얼음 성채에서 열쇠 조각을 찾아라"],
  ] },
  seoyun: { bg: "volcano", art: "story_14_seoyun", lines: [
    ["", "용암빛이 일렁이는 동굴 입구. 여행자가 천천히 후드를 벗었다."],
    ["", "회색이 섞인 짧은 검은 머리. 눈썹을 가로지르는 흉터. 마흔 중반쯤의— 한국인 여성이었다."],
    ["서윤", "한서윤. 20년 전, 퇴근길 지하철역 계단에서 굴렀지. 눈을 떠 보니 여기였어."],
    ["세진", "…20년이요."],
    ["서윤", "처음 10년은 돌아가려고 미쳐 있었어. 그러다 알았지. 누군가 소환을 할 때마다 두 세계 사이가 찢어진다는 걸."],
    ["서윤", "발토르. 궁정마법사가 북쪽 마족을 막겠다고 용사를 부르고 또 불렀어. 실패한 사람들은 대부분 숲이나 바다에 떨어져 죽었고."],
    ["서윤", "넌 운이 좋았던 거야. 그리고 균열은— 곧 이 마을 하늘에 열린다."],
  ] },
  key1: { bg: "volcano", lines: [
    ["", "화염 비룡의 둥지 깊은 곳, 용암 속에서 붉게 빛나는 금속 조각이 떠올랐다."],
    ["*", "「불의 열쇠 조각」을 얻었다."],
  ] },
  key2: { bg: "ice", lines: [
    ["", "서리 여왕이 부서지자, 얼음 왕좌 안에 갇혀 있던 푸른 금속 조각이 흘러내렸다."],
    ["*", "「얼음의 열쇠 조각」을 얻었다."],
  ] },
  lina_key: { bg: "room", art: "story_15_key", lines: [
    ["", "두 열쇠 조각을 맞추자, 가운데가 비어 있었다. 정확히— 자동차 키 하나가 들어갈 모양으로."],
    ["서윤", "세 번째 열쇠는 네가 리나에게 받은 그거야. 리나의 집안은 등불의 현자의 후손이고."],
    ["리나", "아저씨… 그거 쓰면, 아저씨 집에 갈 수 있는 거예요?"],
    ["세진", "…그럴지도 몰라."],
    ["리나", "그럼… 그럼 가요. 아저씨 엄마가 기다리실 거잖아요."],
    ["", "리나는 웃고 있었지만, 열쇠를 쥔 작은 손은 하얗게 질려 있었다."],
  ] },
  lina_promise: { bg: "room", lines: [
    ["세진", "리나. 열쇠는 내가 맡아 둘게. 대신 약속하자. 문을 열어도, 말없이 떠나지는 않을게."],
    ["리나", "…새끼손가락 걸어요."],
    ["", "마르타가 문가에서 조용히 눈가를 훔쳤다. 마을 사람들은 영주가 리나와 한 약속을 오래도록 이야기했다."],
    ["*", "리나와 약속했다. 마을 사기가 크게 올랐다."],
  ] },
  lina_take: { bg: "room", lines: [
    ["세진", "…고마워, 리나. 꼭 필요한 거라서."],
    ["", "열쇠를 받아 든 순간, 리나가 등을 돌려 뛰어나갔다. 그날 밤, 리나는 집에 돌아오지 않고 교회에서 잠들었다."],
    ["*", "열쇠를 얻었다. 마을 사기가 떨어졌다."],
  ] },
  ch5intro: { bg: "village", art: "story_10_rift", lines: [
    ["", "그날 밤, 하늘이 갈라졌다."],
    ["", "등불골 위로 거대한 청록색 균열이 열리고, 그 사이로 신호등과 버스 정류장 표지판, 아스팔트 덩어리가 쏟아져 내렸다."],
    ["한스", "저, 저게 뭐예요?! 하늘에서 쇳덩이가…!"],
    ["세진(속)", "…신호등. 우리 동네 사거리의 그 신호등이야."],
    ["서윤", "시작됐어. 발토르가 마지막 소환을 했어. 이번엔 세계가 버티지 못해."],
  ] },
  spring: { bg: "spring", art: "story_16_spring", lines: [
    ["", "균열의 빛이 마을 우물 아래로 스며들었다. 땅이 울리고, 우물 바닥이 무너졌다."],
    ["", "그 아래— 거대한 동굴 속에서 하늘색 샘이 빛기둥을 뿜고 있었다."],
    ["샘의 정령", "오랜만이구나, 이계의 아이야. 등불을 남긴 그 사람은 나를 「윤회의 샘」이라 불렀단다."],
    ["샘의 정령", "내 물에 몸을 담그면 처음으로 돌아가지만, 쌓아 온 힘의 일부는 남는다. 몇 번이고 다시 강해질 수 있지."],
    ["세진(속)", "「돌아가는 길은 샘 아래에」. 이 샘이 시작이구나."],
    ["*", "「윤회의 샘」을 지을 수 있게 됐어요. 레벨 20 이상의 동료를 환생시켜 더 강하게 키울 수 있어요."],
    ["서윤", "균열 너머에서 마족 장군이 넘어오고 있어. 이번엔 나도 같이 싸운다."],
    ["*", "균열 감시자 서윤이 동료가 되었다."],
  ] },
  valtor: { bg: "dusk", art: "story_17_valtor", lines: [
    ["", "왕도에서 온 밀사의 안내로, 세진은 궁정마법사 발토르와 마주했다."],
    ["발토르", "…자네가 37번째로군. 살아 있었다니."],
    ["발토르", "변명은 하지 않겠네. 북쪽 마족 장군의 군대가 국경을 넘으면 왕국은 한 달을 못 버텨. 나는 이계의 힘이 필요했어."],
    ["발토르", "그 대가로 몇 명이 죽었는지 매일 밤 센다네. 서른여섯."],
    ["세진", "그리고 이제 하늘이 찢어졌어요."],
    ["발토르", "알고 있네. 그래서 부탁하러 왔어. 균열 너머의 마족 장군을 함께 막아 주게. 끝나면 내 목을 자네에게 주지."],
  ] },
  valtor_ally: { bg: "dusk", lines: [
    ["세진", "목은 필요 없어요. 살아서 갚으세요. 왕국 마법사들을 마을 방어에 보내 주시고요."],
    ["발토르", "…자네는 정말 이상한 영주로군."],
    ["*", "발토르와 손을 잡았다. 왕국 지원으로 금화와 석재가 들어왔다."],
  ] },
  valtor_refuse: { bg: "dusk", lines: [
    ["세진", "당신 손은 잡을 수 없어요. 이건 우리 마을이 끝냅니다."],
    ["발토르", "…그렇군. 그게 맞겠지."],
    ["*", "발토르의 제안을 거절했다. 마을 사람들의 신뢰가 깊어졌다."],
  ] },
  ch5clear: { bg: "rift", lines: [
    ["", "마족 장군의 불타는 날개가 꺾이고, 균열이 한숨처럼 좁아졌다."],
    ["", "무너진 잔해 속에서 무언가가 빛났다. 액정이 깨진 스마트폰. 잠금 화면에 희미하게 날짜가 떠 있었다."],
    ["세진(속)", "…사고 난 그날 밤 11시 41분. 내 휴대폰이다. 시간이 멈춰 있어."],
    ["서윤", "균열은 잠시 닫혔을 뿐이야. 완전히 닫으려면 귀환의 문까지 가야 해. 고대 유적 가장 깊은 곳에."],
    ["", "그때, 세진의 눈앞에 떠오르는 상태창이 청록색으로 일렁이며 모양을 바꿨다."],
    ["*", "「관리 권한 확장. 직업: 이계의 개척자」"],
    ["*", "「금 간 스마트폰」을 얻었다. 세진이 「이계의 개척자」가 되었다."],
  ] },
  ch6intro: { bg: "ruins", art: "story_11_gate", lines: [
    ["", "고대 유적. 부서진 기둥 사이로 청록색 룬이 맥박처럼 깜빡였다."],
    ["서윤", "20년 동안 몇 번이나 여기까지 왔어. 하지만 문지기를 넘지 못했지."],
    ["세진", "이번엔 혼자가 아니잖아요."],
    ["*", "제6장 「귀환의 문」 — 목표: 고대 유적 최심부의 귀환의 문으로"],
  ] },
  final: { bg: "ruins", lines: [
    ["", "세 번 무너지고 세 번 일어선 문지기가 마침내 무릎을 꿇었다. 문의 틈에서 쏟아지는 빛이 유적을 하얗게 채웠다."],
    ["문지기", "…이계의 아이여. 열쇠는 맞았다. 이제 묻겠다."],
    ["문지기", "그대는 돌아갈 것인가. 남을 것인가."],
  ] },
  end_return: { bg: "city", art: "ending_return", lines: [
    ["", "세진은 동료들 한 명 한 명과 눈을 맞추고, 문 안으로 걸어 들어갔다."],
    ["", "…경적 소리. 젖은 아스팔트 냄새. 트럭은 세진의 코앞에서 멈춰 있었다."],
    ["운전자", "괜찮아요?! 갑자기 튀어나와서—"],
    ["", "밤 11시 41분. 아무 일도 없었던 것처럼, 세진은 집으로 돌아왔다."],
    ["", "다음 날, 세진은 사직서를 냈다. 그리고 책상 앞에 앉아 그림을 그리기 시작했다. 산골 마을과, 그곳의 사람들을."],
    ["*", "귀환 엔딩"],
    ["", "…1년 뒤. 비 오는 밤, 세진의 방 서랍 속 볼펜이 청록색으로 빛났다."],
    ["서윤", "(볼펜 너머로 들리는 목소리) 세진, 심연이 열렸어. 네가 필요해."],
  ] },
  end_stay: { bg: "festival", art: "ending_stay", lines: [
    ["세진", "…돌아가지 않을게요. 여기 내 사람들이 있으니까."],
    ["", "세진은 열쇠를 문에 꽂고, 반대로 돌렸다. 문이 닫히며 하늘의 균열도 따라 닫혔다."],
    ["", "10년 뒤, 등불골은 왕국에서 가장 큰 도시가 되었다. 사람들은 그곳을 「이방인이 켠 등불」이라 불렀다."],
    ["*", "잔류 엔딩"],
    ["", "…하지만 닫힌 문 아래, 유적의 더 깊은 곳에서 끝없는 계단이 새로 모습을 드러냈다."],
  ] },
  end_true: { bg: "festival", art: "ending_true", lines: [
    ["세진", "둘 다요. 돌아가는 것도, 남는 것도."],
    ["", "세진은 볼펜과 수첩, 그리고 휴대폰을 문 앞에 내려놓았다. 상태창이 청록색으로 타오르며, 100년 전 현자가 남긴 마지막 페이지를 띄웠다."],
    ["*", "「돌아가는 길은 샘 아래에 — 그리고 등불 하나로 충분하다. 두 세계를 이어 줄 등불 하나.」"],
    ["", "문 한가운데에 커다란 등불이 켜졌다. 한쪽에는 등불골의 노을, 다른 쪽에는 서울의 야경."],
    ["서윤", "…20년 만이네. 집에 가는 길이 보여."],
    ["리나", "아저씨! 이제 왔다 갔다 할 수 있는 거예요?"],
    ["세진", "응. 약속 지켰지?"],
    ["*", "진 엔딩 — 두 세계를 잇는 등불"],
    ["", "…등불의 빛이 닿은 유적 아래, 끝없는 심연으로 내려가는 계단이 열렸다."],
  ] },
  postgame: { bg: "abyss", lines: [
    ["샘의 정령", "이야기는 끝났지만, 등불은 꺼지지 않는단다."],
    ["샘의 정령", "심연은 끝이 없고, 내 물은 몇 번이고 그대들을 다시 태어나게 하지. 어디까지 강해질 수 있는지 보여 주렴."],
    ["*", "엔딩 후 콘텐츠: 「무한 심연」이 열렸어요. 10층마다 보스가 나오고, 레벨은 9999까지 올라요. 「윤회의 샘」에서 환생하면 더 강하게 다시 키울 수 있어요."],
  ] },
  abyss_boss: { bg: "abyss", lines: [
    ["", "심연의 문지기가 쓰러졌다. 더 깊은 곳에서 무언가가 웃고 있다."],
  ] },
  late: { bg: "village", lines: [
    ["보린", "약속한 날이 지났네… 마을 사람들이 불안해하고 있어."],
    ["", "그래도 아직 늦지 않았다. 등불은 꺼지지 않았다."],
  ] },
});
// 마지막 보스(거울의 세진)를 처음 잡았을 때
SCENES.mirror = { bg: "abyss", lines: [
  ["거울의 세진", "…돌아가지도, 남지도 못한 나. 네가 고르지 않은 쪽의 나다."],
  ["거울의 세진", "강해져라. 나보다 더."],
  ["*", "숨겨진 보스 「거울의 세진」을 쓰러뜨렸다."],
] };

// ---------- 장면 부수효과 ----------
const _sceneEffect = sceneEffect;
sceneEffect = function (id) {
  _sceneEffect(id);
  const h = heroU();
  if (id === "ch2clear") { G.inv.pen = (G.inv.pen || 0) + 1; G.inv.notebook = (G.inv.notebook || 0) + 1; if (h) promote(h, "strategist"); }
  if (id === "ch3clear") { if (h) promote(h, "lord"); G.morale = Math.min(100, G.morale + 15); }
  if (id === "aldricjoin") {
    const u = newUnit({ job: "knight", line: "warrior", slot: 0, name: "알드릭", lv: 34, potBonus: 1, traits: { personality: "loyal", hobby: "train", origin: "fallen", quirk: "lefty" } });
    u.art = "npc_c_4"; u.jobs = ["warrior", "knight"]; G.roster.push(ensureProfile(u)); autoForm(u.id);
  }
  if (id === "spring") {
    G.flags.spring = true;
    const u = newUnit({ job: "riftwatcher", line: "warrior", slot: 3, name: "서윤", lv: 52, potBonus: 2, traits: { personality: "calm", hobby: "read", origin: "wander", quirk: "dream" } });
    u.art = "npc_c_3"; u.race = "인간"; u.jobs = ["riftwatcher"];
    ensureProfile(u); u.prof.age = 46; u.prof.rel = "single"; u.prof.note = "20년 전 지하철역 계단에서 굴러 이 세계로 왔다. 귀환을 포기하고 균열을 지켜 왔다.";
    G.roster.push(u); autoForm(u.id);
  }
  if (id === "lina_promise") G.morale = Math.min(100, G.morale + 20);
  if (id === "lina_take") G.morale = Math.max(0, G.morale - 15);
  if (id === "valtor_ally") { G.res.gold += 900; G.flags.valtor = true; }
  if (id === "valtor_refuse") { G.morale = Math.min(100, G.morale + 15); G.fame += 10; }
  if (id === "ch5clear") { G.inv.phone = (G.inv.phone || 0) + 1; if (h) promote(h, "pioneer"); }
  if (id === "late") G.morale = Math.max(0, G.morale - 10);
};

// 하루가 시작될 때의 장 이벤트
const _dayEvents = dayEvents;
dayEvents = function () {
  const out = _dayEvents();
  const once = (id, cond) => { if (cond && !G.seen[id]) { G.seen[id] = true; out.push(id); } };
  const d = G.day - G.chStart;
  if (G.chapter === 3) once("aldric", d >= 8);
  if (G.chapter === 4) once("seoyun", G.dungeon.volcano >= 1 || d >= 10);
  if (G.chapter === 5) once("valtor", d >= 12);
  const C = CHAPTERS[G.chapter];
  if (G.chapter >= 2 && C && C.days) once("late" + G.chapter, d > C.days);
  return out;
};
SCENES.late2 = SCENES.late3 = SCENES.late4 = SCENES.late5 = SCENES.late6 = SCENES.late;
const _se2 = sceneEffect;
sceneEffect = function (id) { _se2(/^late\d$/.test(id) ? "late" : id); };

// ---------- 장 진행 ----------
// 보스·이벤트 장면이 끝난 뒤 다음 장으로 넘어가는 흐름. done은 허브로 돌아갈 때 부른다
function afterScenes(ids, done) {
  const next = [];
  for (const id of ids) {
    if (id === "ch1clear") { startChapter(2); next.push("ch2intro"); }
    if (id === "ch2clear") { startChapter(3); next.push("ch3intro"); }
    if (id === "ch5clear") { startChapter(6); next.push("ch6intro"); }
    if ((id === "key1" || id === "key2") && G.flags.key1 && G.flags.key2 && !G.seen.lina_key) { G.seen.lina_key = true; return choiceLina(done); }
  }
  if (next.length) return playScenes(next, done);
  done();
}
function choiceLina(done) {
  playScenes(["lina_key"], () => showResult("리나의 열쇠", ["어떻게 할까요?"], [
    { label: "약속하고 맡아 둔다", fn: () => playScenes(["lina_promise"], () => { G.flags.linaPromise = true; startChapter(5); playScenes(["ch5intro", "spring"], done); }) },
    { label: "그냥 받아 간다", ghost: true, fn: () => playScenes(["lina_take"], () => { startChapter(5); playScenes(["ch5intro", "spring"], done); }) },
  ]));
}
function choiceValtor(done) {
  showResult("발토르의 제안", ["궁정마법사와 손을 잡을까요?"], [
    { label: "손을 잡는다", fn: () => playScenes(["valtor_ally"], done) },
    { label: "거절한다", ghost: true, fn: () => playScenes(["valtor_refuse"], done) },
  ]);
}
// 진 엔딩 조건
function trueEndReady() {
  const relics = ["pen", "notebook", "phone"].every((k) => G.inv[k] || G.roster.some((u) => u.acc.includes(k)));
  const lover = G.roster.some((u) => u.loveStage >= 4);
  return { relics, lover, hall: G.bld.hall >= 5, promise: !!G.flags.linaPromise };
}
function endingChoice(done) {
  const t = trueEndReady();
  const ok = t.relics && t.lover && t.hall && t.promise;
  const btns = [
    { label: "돌아간다", fn: () => finishStory("end_return", done) },
    { label: "남는다", fn: () => finishStory("end_stay", done) },
  ];
  if (ok) btns.unshift({ label: "✦ 두 세계를 잇는다", fn: () => finishStory("end_true", done) });
  const hint = ok ? "세 번째 길이 보인다." : `세 번째 길의 조건: 이계 유물 3종 ${t.relics ? "✓" : "✗"} · 연인 ${t.lover ? "✓" : "✗"} · 촌장의 집 Lv5 ${t.hall ? "✓" : "✗"} · 리나와의 약속 ${t.promise ? "✓" : "✗"}`;
  showResult("귀환의 문", ["돌아갈 것인가, 남을 것인가.", `<small>${hint}</small>`], btns);
}
function finishStory(endId, done) {
  G.flags.ending = endId; G.endings = G.endings || {}; G.endings[endId] = true;
  playScenes([endId, "postgame"], () => { startChapter(7); save(); done(); });
}

// ---------- 환생(윤회의 샘) ----------
function rebirthCost(u) { return 200 + u.lv * 15 + (u.reb || 0) * 300; }
function canRebirth(u) { return G.bld.spring > 0 && u.lv >= 20; }
function rebirth(u) {
  const keep = 0.08 + G.bld.spring * 0.02;
  u.reb = (u.reb || 0) + 1;
  u.rebBonus = u.rebBonus || {};
  for (const k of STATS) u.rebBonus[k] = (u.rebBonus[k] || 0) + Math.round(u.st[k] * keep);
  // 가장 낮은 잠재력 하나가 한 등급 오른다
  const low = STATS.filter((k) => u.pot[k] < 7).sort((a, b) => u.pot[a] - u.pot[b])[0];
  if (low) u.pot[low]++;
  const J = JOBS[u.job];
  STATS.forEach((k, i) => (u.st[k] = Math.round((7 + rnd(0, 4)) * J.mods[i] + 2) + u.rebBonus[k]));
  u.lv = 1; u.exp = 0; u.hp = maxHp(u);
  return low;
}
