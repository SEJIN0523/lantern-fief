// 게임 데이터: 능력치, 직업, 스킬, 특성, 몬스터, 건물
"use strict";

const STATS = ["str", "vit", "agi", "int", "spi", "luk"];
const STAT_NAME = { str: "근력", vit: "체력", agi: "민첩", int: "지력", spi: "정신", luk: "행운" };
const GRADES = ["F", "E", "D", "C", "B", "A", "S", "★"];
const GRADE_MULT = [0.55, 0.7, 0.85, 1.0, 1.15, 1.32, 1.5, 1.8];
const BLOOM = {
  early: { name: "조숙형", curve: (lv) => (lv < 25 ? 1.35 : lv < 50 ? 0.9 : 0.75) },
  normal: { name: "평범형", curve: () => 1 },
  late: { name: "대기만성형", curve: (lv) => (lv < 30 ? 0.75 : lv < 60 ? 1.25 : 1.45) },
};

// 계열별 외형 슬롯(Codex 시트의 칸 번호 1~6과 같은 사람)
const LINES = {
  warrior: { name: "전사", color: "#b0563a", slots: [["m", "인간"], ["m", "인간"], ["f", "인간"], ["f", "엘프"], ["f", "늑대 수인"], ["f", "젖소 수인"]] },
  soldier: { name: "병사", color: "#5c7a3a", slots: [["m", "인간"], ["m", "인간"], ["f", "인간"], ["f", "인간"], ["f", "곰 수인"], ["f", "인간"]] },
  rogue: { name: "도적", color: "#5a4a7a", slots: [["m", "인간"], ["m", "하플링"], ["f", "인간"], ["f", "다크엘프"], ["f", "고양이 수인"], ["f", "인간"]] },
  archer: { name: "궁수", color: "#3f7a5a", slots: [["m", "인간"], ["m", "엘프"], ["f", "인간"], ["f", "엘프"], ["f", "여우 수인"], ["f", "인간"]] },
  mage: { name: "마법사", color: "#3a5aa0", slots: [["m", "인간"], ["m", "노움"], ["f", "인간"], ["f", "인간"], ["f", "엘프"], ["f", "인간"]] },
  cleric: { name: "성직자", color: "#c0a050", slots: [["m", "인간"], ["m", "인간"], ["f", "인간"], ["f", "인간"], ["f", "토끼 수인"], ["f", "젖소 수인"]] },
  villager: { name: "평민", color: "#8a7a60", slots: [["m", "인간"], ["m", "인간"], ["f", "인간"], ["f", "인간"], ["f", "인간"], ["f", "인간"]] },
  hero: { name: "이방인", color: "#2a6a8a", slots: [["m", "인간"]] },
};

// 무기 종류 → 이모지(임시 그림용)
const WEAPON_ICON = { sword: "🗡️", axe: "🪓", spear: "🔱", dagger: "🔪", bow: "🏹", crossbow: "🏹", staff: "🪄", mace: "🔨", fist: "👊", tool: "⛏️", book: "📘" };

// mods: 성장 가중치(근 체 민 지 정 행). range: melee 근접 / reach 관통 / ranged 원거리 / magic 마법 / heal 회복
const JOBS = {
  stranger: { name: "자경단장", line: "hero", tier: 0, role: "지휘", range: "melee", weapon: "sword", mods: [0.7, 0.8, 0.8, 1.1, 1.0, 1.0], skills: ["command"], next: ["tactician"], lv: 5 },
  tactician: { name: "통솔자", line: "hero", tier: 1, role: "지휘", range: "melee", weapon: "sword", mods: [0.8, 0.9, 0.9, 1.2, 1.1, 1.0], skills: ["analyze"], next: ["strategist"], lv: 30 },
  strategist: { name: "군사", line: "hero", tier: 2, role: "지휘", range: "melee", weapon: "sword", mods: [0.9, 1.0, 1.0, 1.3, 1.2, 1.0], skills: ["rally"], next: ["lord"], lv: 60 },
  lord: { name: "영주", line: "hero", tier: 3, role: "지휘", range: "melee", weapon: "sword", mods: [1.0, 1.1, 1.0, 1.4, 1.3, 1.1], skills: ["kingsorder"], next: [] },

  // 마을 주민: 모두 여기서 시작해 숨은 적성(계열)의 1차 직업으로 전직한다
  villager: { name: "마을 주민", line: "villager", tier: 0, role: "만능", range: "melee", weapon: "tool", mods: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0], skills: [], next: [], lv: 5 },

  warrior: { bld: "smithy", name: "전사", line: "warrior", tier: 1, role: "근딜/방탱", range: "melee", weapon: "sword", mods: [1.2, 1.15, 0.9, 0.6, 0.7, 0.9], skills: ["bash"], next: ["knight", "swordsman", "berserker"] },
  knight: { name: "기사", line: "warrior", tier: 2, role: "방탱", range: "melee", weapon: "sword", mods: [1.1, 1.4, 0.8, 0.6, 0.9, 0.9], skills: ["guard", "shieldup"], next: ["fortressknight", "paladin"] },
  swordsman: { name: "검사", line: "warrior", tier: 2, role: "근딜", range: "melee", weapon: "sword", mods: [1.4, 1.0, 1.15, 0.6, 0.7, 1.0], skills: ["twincut", "counter"], next: ["swordsaint"] },
  berserker: { name: "광전사", line: "warrior", tier: 2, role: "근딜", range: "melee", weapon: "axe", mods: [1.55, 1.25, 0.9, 0.4, 0.5, 0.9], skills: ["frenzy", "whirl"], next: ["warlord"] },
  fortressknight: { name: "성채기사", line: "warrior", tier: 3, role: "방탱", range: "melee", weapon: "mace", mods: [1.1, 1.7, 0.7, 0.6, 1.0, 0.9], skills: ["bulwark", "reflect"], next: [] },
  paladin: { name: "성기사", line: "warrior", tier: 3, role: "방탱/힐", range: "melee", weapon: "sword", mods: [1.2, 1.45, 0.8, 0.8, 1.3, 1.0], skills: ["holyshield"], next: [] },
  swordsaint: { name: "검성", line: "warrior", tier: 3, role: "근딜", range: "melee", weapon: "sword", mods: [1.7, 1.0, 1.35, 0.6, 0.8, 1.1], skills: ["issen"], next: [] },
  warlord: { name: "전쟁군주", line: "warrior", tier: 3, role: "근딜/버프", range: "melee", weapon: "axe", mods: [1.7, 1.35, 0.9, 0.5, 0.8, 0.9], skills: ["warcry"], next: [] },

  spearman: { bld: "barracks", name: "창병", line: "soldier", tier: 1, role: "관통", range: "reach", weapon: "spear", mods: [1.1, 1.1, 1.0, 0.6, 0.8, 0.9], skills: ["thrust"], next: ["phalanx", "halberdier", "sapper"] },
  phalanx: { name: "방진병", line: "soldier", tier: 2, role: "방탱", range: "reach", weapon: "spear", mods: [1.0, 1.5, 0.8, 0.6, 1.0, 0.8], skills: ["guard", "spearwall"], next: ["guardcaptain"] },
  halberdier: { name: "미늘창병", line: "soldier", tier: 2, role: "근딜", range: "reach", weapon: "spear", mods: [1.45, 1.15, 0.95, 0.5, 0.7, 0.9], skills: ["sweep"], next: ["dragoon"] },
  sapper: { name: "공병", line: "soldier", tier: 2, role: "특수", range: "reach", weapon: "tool", mods: [1.1, 1.15, 1.0, 1.1, 0.8, 1.0], skills: ["barricade", "snare"], next: ["siegeengineer"] },
  guardcaptain: { name: "근위대장", line: "soldier", tier: 3, role: "방탱/버프", range: "reach", weapon: "spear", mods: [1.15, 1.6, 0.8, 0.7, 1.2, 1.0], skills: ["defaura", "holdline"], next: [] },
  dragoon: { name: "용기병", line: "soldier", tier: 3, role: "근딜", range: "reach", weapon: "spear", mods: [1.65, 1.2, 1.2, 0.5, 0.8, 0.9], skills: ["jump"], next: [] },
  siegeengineer: { name: "공성기술자", line: "soldier", tier: 3, role: "특수", range: "reach", weapon: "tool", mods: [1.2, 1.2, 0.9, 1.4, 0.9, 1.0], skills: ["turret"], next: [] },

  thief: { bld: "tavern", name: "도적", line: "rogue", tier: 1, role: "근딜/회피", range: "melee", weapon: "dagger", mods: [1.0, 0.85, 1.35, 0.7, 0.7, 1.3], skills: ["steal"], next: ["duelist", "assassin", "scout"] },
  duelist: { name: "결투가", line: "rogue", tier: 2, role: "회탱", range: "melee", weapon: "dagger", mods: [1.1, 1.0, 1.55, 0.6, 0.8, 1.2], skills: ["taunt", "riposte"], next: ["bladedancer"] },
  assassin: { name: "암살자", line: "rogue", tier: 2, role: "근딜", range: "ranged", weapon: "dagger", mods: [1.35, 0.8, 1.45, 0.6, 0.6, 1.2], skills: ["vital"], next: ["nightblade"] },
  scout: { name: "척후병", line: "rogue", tier: 2, role: "특수", range: "ranged", weapon: "dagger", mods: [1.0, 0.9, 1.5, 0.9, 0.8, 1.4], skills: ["expose"], next: ["pathfinder"] },
  bladedancer: { name: "칼날무희", line: "rogue", tier: 3, role: "회탱", range: "melee", weapon: "dagger", mods: [1.3, 1.1, 1.8, 0.6, 0.9, 1.3], skills: ["bladedance"], next: [] },
  nightblade: { name: "그림자칼날", line: "rogue", tier: 3, role: "근딜", range: "ranged", weapon: "dagger", mods: [1.6, 0.9, 1.7, 0.6, 0.6, 1.3], skills: ["shadowstrike"], next: [] },
  pathfinder: { name: "길잡이", line: "rogue", tier: 3, role: "특수", range: "ranged", weapon: "dagger", mods: [1.2, 1.0, 1.7, 1.0, 1.0, 1.5], skills: ["gale"], next: [] },

  archer: { bld: "guild", name: "궁수", line: "archer", tier: 1, role: "원딜", range: "ranged", weapon: "bow", mods: [1.1, 0.85, 1.25, 0.7, 0.8, 1.1], skills: ["aimshot"], next: ["ranger", "hunter", "crossbowman"] },
  ranger: { name: "레인저", line: "archer", tier: 2, role: "원딜", range: "ranged", weapon: "bow", mods: [1.3, 0.9, 1.45, 0.7, 0.8, 1.1], skills: ["volley"], next: ["hawkeye"] },
  hunter: { name: "사냥꾼", line: "archer", tier: 2, role: "디버프", range: "ranged", weapon: "bow", mods: [1.25, 1.0, 1.3, 0.8, 0.8, 1.2], skills: ["bleedshot"], next: ["monsterhunter"] },
  crossbowman: { name: "석궁병", line: "archer", tier: 2, role: "원딜", range: "ranged", weapon: "crossbow", mods: [1.45, 1.0, 1.0, 0.7, 0.8, 1.0], skills: ["pierce"], next: ["siegearcher"] },
  hawkeye: { name: "매의 눈", line: "archer", tier: 3, role: "원딜", range: "ranged", weapon: "bow", mods: [1.6, 0.9, 1.65, 0.7, 0.9, 1.3], skills: ["snipe"], next: [] },
  monsterhunter: { name: "마물 사냥꾼", line: "archer", tier: 3, role: "원딜/디버프", range: "ranged", weapon: "bow", mods: [1.5, 1.1, 1.4, 0.8, 0.9, 1.3], skills: ["weakspot"], next: [] },
  siegearcher: { name: "공성사수", line: "archer", tier: 3, role: "원딜", range: "ranged", weapon: "crossbow", mods: [1.75, 1.1, 1.0, 0.7, 0.8, 1.0], skills: ["barrage"], next: [] },

  mage: { bld: "magetower", name: "견습 마법사", line: "mage", tier: 1, role: "마딜", range: "magic", weapon: "staff", mods: [0.5, 0.75, 0.9, 1.4, 1.1, 1.0], skills: ["fireball"], next: ["elementalist", "warlock", "barriermage"] },
  elementalist: { name: "원소술사", line: "mage", tier: 2, role: "마딜", range: "magic", weapon: "staff", mods: [0.5, 0.8, 0.95, 1.7, 1.2, 1.0], skills: ["burst"], next: ["archmage"] },
  warlock: { name: "흑마법사", line: "mage", tier: 2, role: "디버프", range: "magic", weapon: "staff", mods: [0.5, 0.85, 0.9, 1.55, 1.3, 1.0], skills: ["curse"], next: ["darkmage"] },
  barriermage: { name: "결계술사", line: "mage", tier: 2, role: "마탱", range: "magic", weapon: "staff", mods: [0.5, 1.0, 0.85, 1.45, 1.45, 1.0], skills: ["barrier"], next: ["grandbarrier"] },
  archmage: { name: "대마법사", line: "mage", tier: 3, role: "마딜", range: "magic", weapon: "staff", mods: [0.5, 0.85, 1.0, 2.0, 1.35, 1.0], skills: ["meteor"], next: [] },
  darkmage: { name: "암흑마도사", line: "mage", tier: 3, role: "마딜/디버프", range: "magic", weapon: "staff", mods: [0.5, 0.95, 0.95, 1.85, 1.45, 1.0], skills: ["drain"], next: [] },
  grandbarrier: { name: "대결계사", line: "mage", tier: 3, role: "마탱", range: "magic", weapon: "staff", mods: [0.5, 1.2, 0.85, 1.6, 1.75, 1.0], skills: ["grandward"], next: [] },

  acolyte: { bld: "church", name: "견습 사제", line: "cleric", tier: 1, role: "힐", range: "heal", weapon: "mace", mods: [0.7, 0.9, 0.85, 1.0, 1.4, 1.0], skills: ["heal"], next: ["priest", "monk", "inquisitor"] },
  priest: { name: "사제", line: "cleric", tier: 2, role: "힐", range: "heal", weapon: "staff", mods: [0.6, 0.95, 0.9, 1.1, 1.7, 1.1], skills: ["massheal"], next: ["highpriest"] },
  monk: { name: "수도승", line: "cleric", tier: 2, role: "회탱/근딜", range: "melee", weapon: "fist", mods: [1.3, 1.1, 1.4, 0.6, 1.1, 1.0], skills: ["flurry", "innerpeace"], next: ["grandmaster"] },
  inquisitor: { name: "심판관", line: "cleric", tier: 2, role: "방탱/근딜", range: "melee", weapon: "mace", mods: [1.3, 1.3, 0.85, 0.8, 1.2, 0.9], skills: ["judgement", "guard"], next: ["grandinquisitor"] },
  highpriest: { name: "대사제", line: "cleric", tier: 3, role: "힐", range: "heal", weapon: "staff", mods: [0.6, 1.05, 0.9, 1.2, 2.0, 1.2], skills: ["revive"], next: [] },
  grandmaster: { name: "권성", line: "cleric", tier: 3, role: "근딜", range: "melee", weapon: "fist", mods: [1.6, 1.2, 1.6, 0.6, 1.2, 1.0], skills: ["kiblast"], next: [] },
  grandinquisitor: { name: "이단심문관", line: "cleric", tier: 3, role: "근딜/디버프", range: "melee", weapon: "mace", mods: [1.55, 1.4, 0.9, 0.9, 1.35, 0.9], skills: ["seal"], next: [] },
};
// 계열별 1차 직업
const FIRST_JOB = { warrior: "warrior", soldier: "spearman", rogue: "thief", archer: "archer", mage: "mage", cleric: "acolyte" };
// 전직 레벨: 1차→2차 20, 2차→3차 50
for (const id in JOBS) if (JOBS[id].lv == null) JOBS[id].lv = JOBS[id].tier === 1 ? 20 : JOBS[id].tier === 2 ? 50 : 0;

// 스킬. kind: atk/heal/buff/debuff/shield/revive/passive
// tgt: single(단일) lane(한 줄 전후열) col(적 전열 전체) cross(십자) all(전체) self ally allies frontallies
// rng: melee(전열만) any(아무 칸)
const SKILLS = {
  command: { name: "지휘", kind: "passive", desc: "같은 파티 아군 공격 +5%. 지휘 게이지가 찬다." },
  analyze: { name: "인물 파악", kind: "passive", desc: "동료의 잠재력이 더 잘 보인다. 지휘 오라 +3%." },
  rally: { name: "재정비", kind: "passive", desc: "지휘 게이지 충전 +30%." },
  kingsorder: { name: "영주의 명", kind: "passive", desc: "아군 전 능력 +8%." },

  bash: { name: "강타", kind: "atk", pow: 1.6, tgt: "single", rng: "melee", cd: 3 },
  guard: { name: "수호", kind: "passive", desc: "같은 줄 후열 아군이 받는 공격을 대신 받는다." },
  shieldup: { name: "방패 올리기", kind: "buff", tgt: "self", buff: { def: 0.6 }, taunt: 2, turns: 2, cd: 4 },
  twincut: { name: "연속베기", kind: "atk", pow: 0.85, hits: 2, tgt: "single", rng: "melee", cd: 3 },
  counter: { name: "반격 태세", kind: "passive", desc: "근접 공격을 받으면 20% 확률로 반격." },
  frenzy: { name: "광폭", kind: "passive", desc: "잃은 체력에 비례해 공격력 최대 +50%." },
  whirl: { name: "대회전", kind: "atk", pow: 0.9, tgt: "col", rng: "melee", cd: 4 },
  bulwark: { name: "방벽", kind: "buff", tgt: "frontallies", buff: { def: 0.35 }, turns: 3, cd: 5 },
  reflect: { name: "가시 갑주", kind: "passive", desc: "받은 근접 피해의 15%를 되돌린다." },
  holyshield: { name: "신성 방패", kind: "heal", pow: 1.2, tgt: "ally", cd: 3 },
  issen: { name: "일섬", kind: "atk", pow: 3.0, tgt: "single", rng: "melee", cd: 4 },
  warcry: { name: "전쟁 함성", kind: "buff", tgt: "allies", buff: { atk: 0.25 }, turns: 3, cd: 5 },

  thrust: { name: "찌르기", kind: "atk", pow: 1.25, tgt: "lane", rng: "melee", cd: 2 },
  spearwall: { name: "창벽", kind: "buff", tgt: "self", buff: { def: 0.5 }, taunt: 2, turns: 2, cd: 4 },
  sweep: { name: "휩쓸기", kind: "atk", pow: 1.5, tgt: "lane", rng: "melee", cd: 3 },
  barricade: { name: "바리케이드", kind: "buff", tgt: "frontallies", buff: { def: 0.3 }, turns: 3, cd: 4 },
  snare: { name: "올가미", kind: "debuff", tgt: "single", rng: "any", buff: { spd: -0.3 }, turns: 3, cd: 3 },
  defaura: { name: "방어 오라", kind: "passive", desc: "아군 전체 방어 +10%." },
  holdline: { name: "전열 사수", kind: "buff", tgt: "frontallies", buff: { def: 0.45 }, turns: 3, cd: 5 },
  jump: { name: "도약", kind: "atk", pow: 2.2, tgt: "single", rng: "any", cd: 4 },
  turret: { name: "포탑 사격", kind: "atk", pow: 0.65, tgt: "all", rng: "any", cd: 4 },

  steal: { name: "훔치기", kind: "atk", pow: 1.0, tgt: "single", rng: "melee", cd: 3, gold: 3 },
  taunt: { name: "도발", kind: "buff", tgt: "self", buff: { eva: 0.3 }, taunt: 2, turns: 2, cd: 4 },
  riposte: { name: "흘려치기", kind: "passive", desc: "회피하면 50% 확률로 반격." },
  vital: { name: "급소 찌르기", kind: "atk", pow: 2.0, crit: 0.5, tgt: "single", rng: "any", cd: 3 },
  expose: { name: "약점 간파", kind: "debuff", tgt: "single", rng: "any", buff: { def: -0.3 }, turns: 3, cd: 3 },
  bladedance: { name: "칼날 춤", kind: "atk", pow: 0.55, hits: 4, tgt: "random", rng: "melee", cd: 3 },
  shadowstrike: { name: "그림자 습격", kind: "atk", pow: 2.6, tgt: "single", rng: "any", cd: 3 },
  gale: { name: "질풍", kind: "buff", tgt: "allies", buff: { spd: 0.2 }, turns: 3, cd: 5 },

  aimshot: { name: "조준 사격", kind: "atk", pow: 1.6, tgt: "single", rng: "any", cd: 3 },
  volley: { name: "연사", kind: "atk", pow: 0.65, hits: 3, tgt: "random", rng: "any", cd: 3 },
  bleedshot: { name: "덫 사격", kind: "atk", pow: 1.0, dot: 0.35, tgt: "single", rng: "any", turns: 3, cd: 3 },
  pierce: { name: "관통 볼트", kind: "atk", pow: 1.4, pen: 0.5, tgt: "lane", rng: "any", cd: 3 },
  snipe: { name: "저격", kind: "atk", pow: 3.0, crit: 0.3, tgt: "single", rng: "any", cd: 4 },
  weakspot: { name: "약점 노출", kind: "debuff", tgt: "single", rng: "any", buff: { def: -0.4 }, turns: 3, cd: 3 },
  barrage: { name: "일제 사격", kind: "atk", pow: 1.1, tgt: "col", rng: "any", cd: 4 },

  fireball: { name: "파이어볼", kind: "atk", pow: 1.6, mag: true, tgt: "single", rng: "any", cd: 2, fx: "fire" },
  burst: { name: "원소 폭발", kind: "atk", pow: 1.15, mag: true, tgt: "cross", rng: "any", cd: 3, fx: "fire" },
  curse: { name: "저주", kind: "debuff", tgt: "single", rng: "any", buff: { atk: -0.3 }, turns: 3, cd: 3, fx: "dark" },
  barrier: { name: "보호막", kind: "shield", pow: 1.6, tgt: "ally", cd: 3, fx: "barrier" },
  meteor: { name: "메테오", kind: "atk", pow: 1.3, mag: true, tgt: "all", rng: "any", cd: 5, fx: "fire" },
  drain: { name: "생명력 흡수", kind: "atk", pow: 1.8, mag: true, drain: 0.5, tgt: "single", rng: "any", cd: 3, fx: "dark" },
  grandward: { name: "대결계", kind: "shield", pow: 1.2, tgt: "allies", cd: 5, fx: "barrier" },

  heal: { name: "치유", kind: "heal", pow: 1.5, tgt: "ally", cd: 1 },
  massheal: { name: "광역 치유", kind: "heal", pow: 0.85, tgt: "allies", cd: 3 },
  flurry: { name: "연타", kind: "atk", pow: 0.6, hits: 3, tgt: "single", rng: "melee", cd: 3 },
  innerpeace: { name: "명경지수", kind: "passive", desc: "회피 +10%, 매 턴 체력 3% 회복." },
  judgement: { name: "심판의 철퇴", kind: "atk", pow: 1.8, holy: true, tgt: "single", rng: "melee", cd: 3, fx: "holy" },
  revive: { name: "부활", kind: "revive", pow: 0.35, tgt: "dead", cd: 6, fx: "holy" },
  kiblast: { name: "기공파", kind: "atk", pow: 2.0, tgt: "lane", rng: "melee", cd: 3 },
  seal: { name: "봉인", kind: "debuff", tgt: "single", rng: "any", silence: 2, buff: { atk: -0.2 }, turns: 2, cd: 4, fx: "holy" },

  // 몬스터 스킬
  m_charge: { name: "돌진", kind: "atk", pow: 1.9, tgt: "lane", rng: "melee", cd: 3 },
  m_howl: { name: "울부짖기", kind: "buff", tgt: "allies", buff: { atk: 0.25 }, turns: 3, cd: 5 },
  m_hex: { name: "주술", kind: "atk", pow: 1.2, mag: true, tgt: "single", rng: "any", cd: 2, fx: "dark" },
  m_mend: { name: "주술 치유", kind: "heal", pow: 1.0, tgt: "ally", cd: 3 },
  m_web: { name: "거미줄", kind: "debuff", tgt: "backrow", rng: "any", buff: { spd: -0.35 }, turns: 2, cd: 4 },
  m_quake: { name: "땅울림", kind: "atk", pow: 1.0, tgt: "all", rng: "any", cd: 4 },
};

// 특성
const TRAITS = {
  personality: [
    { id: "brave", name: "용감함", desc: "전열이면 공격 +10%", mod: { frontAtk: 0.1 } },
    { id: "coward", name: "겁쟁이", desc: "후열이면 회피 +15%, 전열이면 명중 -10%", mod: { backEva: 0.15, frontAcc: -0.1 } },
    { id: "calm", name: "냉정함", desc: "치명 +5%", mod: { crit: 0.05 } },
    { id: "hot", name: "다혈질", desc: "맞으면 20% 확률로 분노(공격↑ 방어↓)", mod: { rage: 0.2 } },
    { id: "kind", name: "상냥함", desc: "회복량 +15%", mod: { healPow: 0.15 } },
    { id: "bluff", name: "허세꾼", desc: "전투 시작 시 도발", mod: { openTaunt: 1 } },
    { id: "lazy", name: "게으름", desc: "속도 -5%, 피로 회복 +", mod: { spd: -0.05, rest: 1 } },
    { id: "diligent", name: "노력가", desc: "경험치 +20%", mod: { exp: 0.2 } },
    { id: "optimist", name: "낙천가", desc: "부상 회복 2배", mod: { injury: 0.5 } },
    { id: "loyal", name: "충직함", desc: "주인공을 믿고 따른다: 전투에서 전 능력 +5%", mod: { withHero: 0.05 } },
    { id: "greedy", name: "탐욕스러움", desc: "전리품 금화 +20%, 급여 +", mod: { gold: 0.2, wage: 0.3 } },
    { id: "loner", name: "고독을 즐김", desc: "파티 3명 이하면 능력 +15%", mod: { loner: 0.15 } },
    { id: "chatty", name: "수다쟁이", desc: "친밀도 상승 2배", mod: { bond: 1 } },
  ],
  hobby: [
    { id: "cook", name: "요리", desc: "원정 중 식사로 시작 체력 +5%", mod: { startHp: 0.05 } },
    { id: "fish", name: "낚시", desc: "마을 식량 +1/일", mod: { food: 1 } },
    { id: "sing", name: "노래", desc: "주점 수입 +, 아군 사기 +", mod: { gold1: 2 } },
    { id: "read", name: "독서", desc: "지력 성장 +10%", mod: { growInt: 0.1 } },
    { id: "gamble", name: "도박", desc: "행운 +, 치명 +3%", mod: { crit: 0.03 } },
    { id: "smith", name: "대장일", desc: "무기 강화 비용 -15%", mod: { forge: 0.15 } },
    { id: "garden", name: "원예", desc: "농장 식량 +1/일", mod: { food: 1 } },
    { id: "drink", name: "술", desc: "피로 회복 +", mod: { rest: 1 } },
    { id: "animal", name: "동물 돌보기", desc: "짐승에게 받는 피해 -10%", mod: { beastDef: 0.1 } },
    { id: "train", name: "훈련광", desc: "쉬는 날에도 경험치 획득", mod: { idleExp: 1 } },
    { id: "craft", name: "손재주", desc: "함정 피해 무시, 목재 +1/일", mod: { wood: 1 } },
  ],
  origin: [
    { id: "farm", name: "농가 출신", desc: "체력 +3", stat: { vit: 3 } },
    { id: "noble", name: "귀족의 서자", desc: "지력·정신 +2, 급여 +", stat: { int: 2, spi: 2 }, mod: { wage: 0.3 } },
    { id: "orphan", name: "전쟁 고아", desc: "근력 +3", stat: { str: 3 } },
    { id: "wander", name: "떠돌이", desc: "민첩 +3", stat: { agi: 3 } },
    { id: "mountain", name: "산사람", desc: "체력 +2, 숲에서 능력 +5%", stat: { vit: 2 }, mod: { forest: 0.05 } },
    { id: "slum", name: "도시 빈민가", desc: "민첩 +2, 행운 +2", stat: { agi: 2, luk: 2 } },
    { id: "temple", name: "신전 고아원", desc: "정신 +3", stat: { spi: 3 } },
    { id: "fallen", name: "몰락한 기사 가문", desc: "체력·근력 +2", stat: { vit: 2, str: 2 } },
  ],
  quirk: [
    { id: "manabody", name: "마력 체질", desc: "지력 잠재력 +1등급", pot: { int: 1 } },
    { id: "lucky", name: "불사신 같은 운", desc: "전투당 1회 치명상에서 체력 1로 버팀", mod: { endure: 1 } },
    { id: "giant", name: "거구", desc: "HP +20%, 회피 -5%", mod: { hp: 0.2, eva: -0.05 } },
    { id: "lefty", name: "왼손잡이 검객", desc: "반격 확률 +15%", mod: { counter: 0.15 } },
    { id: "nighteye", name: "밤눈", desc: "야간 습격에서 능력 +10%", mod: { night: 0.1 } },
    { id: "keeneye", name: "눈썰미", desc: "동료 잠재력 힌트가 빨리 열림", mod: { reveal: 1 } },
    { id: "forestchild", name: "숲의 아이", desc: "드루이드 적성(히든)", mod: { forest: 0.1 } },
    { id: "dream", name: "이상한 꿈", desc: "가끔 낯선 도시의 꿈을 꾼다", mod: {} },
  ],
};

// 몬스터. stats: [hp, atk, def, spd, mag] Lv1 기준, 레벨당 성장 비율 적용
const MONSTERS = {
  goblin: { name: "고블린", icon: "👺", range: "melee", base: [42, 9, 4, 9, 2], skills: [], beast: false },
  goblin_archer: { name: "고블린 궁수", icon: "👺", range: "ranged", base: [34, 9, 3, 10, 2], skills: [] },
  goblin_shaman: { name: "고블린 주술사", icon: "🧙", range: "magic", base: [36, 5, 3, 9, 9], skills: ["m_hex", "m_mend"] },
  hobgoblin: { name: "홉고블린", icon: "👹", range: "melee", base: [80, 12, 9, 7, 2], skills: [] },
  wolf: { name: "숲늑대", icon: "🐺", range: "melee", base: [46, 11, 4, 14, 1], skills: [], beast: true },
  wolf_rider: { name: "늑대 기수", icon: "🐺", range: "melee", base: [70, 14, 6, 13, 2], skills: ["m_charge"], beast: true },
  boar: { name: "흉포한 멧돼지", icon: "🐗", range: "melee", base: [95, 13, 8, 8, 1], skills: ["m_charge"], beast: true },
  spider: { name: "거대 거미", icon: "🕷️", range: "ranged", base: [55, 10, 5, 12, 4], skills: ["m_web"], beast: true },
  bat: { name: "동굴 박쥐", icon: "🦇", range: "ranged", base: [30, 8, 2, 16, 1], skills: [], beast: true },
  goblin_chief: { name: "고블린 족장", icon: "👹", range: "melee", base: [150, 15, 10, 9, 3], skills: ["m_howl"] },
  goblin_king: { name: "고블린 왕", icon: "👑", range: "melee", base: [360, 17, 12, 9, 4], skills: ["m_charge", "m_howl", "m_quake"], boss: true },
};

// 던전. floors: 층별 몬스터 풀과 레벨
const DUNGEONS = {
  goblin_forest: {
    name: "고블린의 숲", bg: "forest", unlock: 0,
    floors: [
      { lv: 1, pool: ["goblin", "goblin", "wolf"], n: [2, 3] },
      { lv: 3, pool: ["goblin", "goblin_archer", "wolf"], n: [3, 4] },
      { lv: 5, pool: ["goblin", "goblin_archer", "goblin_shaman", "hobgoblin"], n: [3, 4] },
      { lv: 7, pool: ["hobgoblin", "goblin_archer", "goblin_shaman", "wolf_rider", "boar"], n: [3, 5] },
      { lv: 9, boss: [["goblin_king", 0, 2], ["goblin_chief", 0, 0], ["goblin_chief", 0, 4], ["goblin_shaman", 1, 1], ["goblin_archer", 1, 3]] },
    ],
  },
};

// 건물. cost(lv): 다음 레벨 비용
const BUILDINGS = {
  hall: { name: "촌장의 집", icon: "🏠", max: 5, desc: "마을의 중심. 레벨이 다른 건물의 상한.", cost: (l) => ({ wood: 20 * l, stone: 10 * (l - 1), gold: 40 * l }) },
  palisade: { name: "목책과 망루", icon: "🪵", max: 5, desc: "밤 습격 때 아군 방어 +8%/레벨, 패배 피해 감소.", cost: (l) => ({ wood: 15 + 15 * l, stone: 8 * (l - 1), gold: 10 * l }) },
  lodging: { name: "숙소", icon: "🛏️", max: 5, desc: "동료 수용 인원 +2/레벨, 피로 회복.", cost: (l) => ({ wood: 20 + 10 * l, gold: 20 * l }) },
  farm: { name: "농장", icon: "🌾", max: 5, desc: "일꾼 1명당 식량 +레벨.", cost: (l) => ({ wood: 10 + 10 * l, gold: 10 * l }) },
  lumber: { name: "벌목장", icon: "🪓", max: 5, desc: "일꾼 1명당 목재 +레벨.", cost: (l) => ({ wood: 5 + 8 * l, gold: 10 * l }) },
  quarry: { name: "채석장", icon: "⛏️", max: 5, desc: "일꾼 1명당 석재 +레벨.", cost: (l) => ({ wood: 20 + 10 * l, gold: 20 * l }) },
  guild: { name: "사냥꾼 오두막", icon: "🏹", max: 5, desc: "궁수 전직. 이주민이 더 자주 찾아온다.", cost: (l) => ({ wood: 25 * l, stone: 5 * l, gold: 30 * l }) },
  barracks: { name: "병영", icon: "🛡️", max: 5, desc: "창병 전직과 훈련(대기 동료 경험치).", cost: (l) => ({ wood: 25 * l, stone: 5 * l, gold: 30 * l }) },
  smithy: { name: "대장간", icon: "⚒️", max: 5, desc: "전사 전직. 고유 무기 강화, 레벨마다 강화 상한 +10.", cost: (l) => ({ wood: 15 * l, stone: 15 * l, gold: 40 * l }) },
  church: { name: "교회", icon: "⛪", max: 5, desc: "견습 사제 전직. 부상 회복 속도 +.", cost: (l) => ({ wood: 25 * l, stone: 15 * l, gold: 40 * l }) },
  tavern: { name: "주점", icon: "🍺", max: 5, desc: "도적 전직. 금화 수입 +, 사기 +.", cost: (l) => ({ wood: 20 * l, gold: 30 * l }) },
  magetower: { name: "마탑", icon: "🔮", max: 5, desc: "견습 마법사 전직. 레벨마다 마법 계열 경험치 +10%.", cost: (l) => ({ wood: 20 * l, stone: 20 * l, gold: 50 * l }) },
  spring: { name: "윤회의 샘", icon: "💧", max: 5, unlock: "spring", desc: "환생. 레벨이 높을수록 환생 때 남는 힘이 커진다.", cost: (l) => ({ stone: 60 * l, gold: 150 * l }) },
};

const NAMES = {
  m: ["레온", "가렌", "브란", "토린", "카일", "에릭", "로완", "도윈", "하르", "미겔", "세드릭", "바론", "오웬", "레녹", "아론", "루크", "다미안", "콘라드", "피닉", "베일", "그레고", "울프", "테오", "이반", "마르코", "한스", "알빈", "케인", "로이", "제드"],
  f: ["엘레나", "리안", "세라", "미아", "카렌", "아리아", "로제", "니나", "이리스", "헬가", "소피", "루나", "베라", "클레어", "에일린", "다프네", "실비아", "노라", "마야", "유리아", "셀린", "티나", "오델", "카야", "프레야", "에바", "레아", "아멜", "로나", "시엘"],
};
