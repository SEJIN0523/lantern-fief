// 16칸 픽셀 아이콘. 본체 색만 등급에 따라 바꾼다.
"use strict";

const GRADE_NAMES = ["일반", "고급", "희귀", "영웅", "전설", "이계"];
const ICON_COLORS = {
  l: "var(--g1)", b: "var(--g2)", s: "var(--g3)",
  w: "#dcb580", v: "#95643e", u: "#513726", "*": "#fff4d5",
};

// 글자 하나가 한 픽셀. 외곽에 상하좌우 한 칸의 윤곽을 덧댄다.
function pixelSvg(pattern, colors = ICON_COLORS) {
  const rows = pattern.split("/");
  const width = Math.max(...rows.map((r) => r.length));
  const ox = 1 + Math.floor((14 - width) / 2), oy = 1 + Math.floor((14 - rows.length) / 2);
  const cells = new Map();
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== ".") cells.set(`${x + ox},${y + oy}`, c);
  }));
  const paths = {};
  const add = (color, x, y) => { paths[color] = (paths[color] || "") + `M${x} ${y}h1v1h-1z`; };
  for (const key of [...cells.keys()]) {
    const [x, y] = key.split(",").map(Number);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const k = `${x + dx},${y + dy}`;
      if (!cells.has(k)) cells.set(k, "o");
    }
  }
  // 윤곽을 확장하는 동안 다시 순회하지 않도록 본체만 따로 그린다.
  for (const [key, c] of cells) {
    const [x, y] = key.split(",").map(Number);
    if (x >= 0 && y >= 0 && x < 16 && y < 16) add(c === "o" ? "#10161c" : colors[c], x, y);
  }
  return Object.entries(paths).map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join("");
}

const ITEM_PIXELS = {
  sword: "..........ll/.........lls/........lls/.......lls/......lls/.....lls/..w.lls/...wbs/....w/..uv.w/.uv...w/uu",
  axe: ".......llbb/......llbbs/....w.llbbs/....v..bss/....v..ss/...wv/...vu/..wv/..vu/.wv/.vu/vu",
  spear: "......l/.....llb/.....lbs/.....lbs/......s/.....wv/.....vu/....wv/....vu/...wv/...vu/..wv/..vu",
  dagger: "........ll/.......lls/......lls/.....lls/....lls/...wbs/....w/..uv.w/.uv/uu",
  bow: "....lb/.....lb/..w...bs/..v....bs/..v.....s/..v....bs/..v...bs/..v..bs/..v.bs/..vbs/..bs/.bs",
  crossbow: "......l/......b/...l..b..b/..lb..b..bs/.lb...b...bs/lb....b....bs/..wvvvsvvvu/...uuusuuu/.....wv/.....vu/....wv/....vu",
  staff: ".....lll/....l*bb/....lbss/.....bs/.....vu/....wv/....vu/...wv/...vu/..wv/..vu/.wv/.vu",
  mace: ".....ll/....llbb/...llbbss/...lbbsss/....bsss/.....ss/....wv/....vu/...wv/...vu/..wv/..vu/.vu",
  fist: "..ll.ll.ll/...b..b..b/.llbllbllb/.lbblbblbs/llbbbbbbbs/lbbbbbbbss/.bbbbbbss/..bbbbss/..wwvvu/..vvvuu",
  tool: "....llbbb/..llbb..bs/.lb..v...s/lb...v/....wv/....vu/...wv/...vu/..wv/..vu/.wv/.vu",
  book: "llllllllll/lbbbbbbbbs/lbllllllbs/lbbbbbbbbs/lbllllbbbs/lbbbbbbbbs/lblllbbbbs/lbbbbbbbbs/lsssssssss/wwwwwwwwwu/vvvvvvvvuu",
  armor: "..ll....bb/.lllb..bbbs/llbbbbbbbbss/lbbbbbbbbbss/...bbbbss/...bbbbss/...bbbbss/...bbbbss/..lbbbbbss/..ssssssss",
  acc: ".....l/....l*b/.....s/...llbbb/..lb...bs/.lb.....bs/.lb.....bs/.lb.....bs/..bs...ss/...bssss",
  gift: "..ll...lb/..lbl.lbbs/...bbbbb/llllllbbbbb/lbbbbbbssss/..bbbbsbs/..bbbbsbs/..bbbbsbs/..bbbbsbs/..sssssss",
  otherworld: ".llllllll/.lbbbbbbbs/.lblllbbbs/.lbblbbbbs/.lbbslbbbs/.lbbblbbbs/.lbbblsbbs/.lbbbbssbs/.lbb*bbbbs/.sssssssss/..........*/.........lll/..........b",
  empty: "ll.ll.ll.ll/l........s/........../l........s/........../l........s/........../l........s/........../ss.ss.ss.ss",
};

// UI는 밝은 면·기본·그림자의 세 색과 작은 반짝임으로 통일한다.
const UI_PIXELS = {
  gold: ".......llll/......l*bbbs/......lbbbbss/......bsssss/..llll.bbbbss/.l*bbbs.ssss/.lbbbbss/..bsssss..lll/..bbbbss.l*bbs/...ssss..lbbss/.........bsss",
  food: "...lllllll/..ll*llllbb/.llllllbbbbs/.llllwllbbbs/.llllvllbbbs/.llblvllbbbs/.lbblvlbbbbs/..bbsvbbbss/..bbbvbbbss/..bssssssss",
  wood: "......wwwvv/.....wwvvvvu/....wwvvvvuu/...wwvvvvuu/..wwvvvvuu/.wwvvvvuu/wwvvvvuu/wvwwwuu/vwvvvu/uvwvuu/.uuuu",
  stone: ".....llll/....llllbb/...llllbbbb/..llllbbbbbbs/.lllbbbbbbbss/.llbbbbbbbsss/..bbbbbbbssss/...sssssssss",
  pop: "..ll....ll/..lb....lb/..bs....bs/........../.llbb..llbb/llbbbsllbbbs/lbbbbbssbbbs/lbbbbbssbbbs/.ssss..ssss",
  morale: "wlllllllll/vlbbbbbbbs/vlbbbbbbs/vlbbbbbss/vsssssss/v/v/v/v/v/u",
  village: "...lll/..llbbs....l/.llbbbss..lbs/llbbbbss.llbbs/..wwvvu.llbbss/..wvvvu..wvuu/..wvuvu..wuuu/..wvuvu..wuuu/..uuuuu..uuuu",
  party: "..llllllll/llbbbbbbbbss/lbbbbbbbbsss/lbbbbbbbbsss/lbbbllbbbsss/.bbbllbbsss/.bbllllbsss/..bbllbsss/...bllsss/....bsss/.....ss",
  form: "l..........l/lb........lb/.lb......lb/..lb....lb/...lb..lb/....lbbb/....bbss/...vssssv/..wv....wv/.vu......vu/uu........uu",
  expe: "llll....llll/l*bbllllbbbs/lbbbllbbbbbs/lbbbllbblbbs/lbblslblbbbs/lblbslbbbsbs/lbbbslbbbsss/lbbbslbbbsss/lbbbssbbbbss/llll..ssssss",
  moon: "....lllll/...lllll/..lllll/.lllll/.lllll/.lllllb/.lllllb....l/..llllbb..lb/...llllbbbbs/....bbbbsss/.....sssss",
  mag: ".....l/....lll/...llllb/..llllbbs/lll*llbbbs/..llbbbss/...lbbss/....bss/.....s.....l/..........lll/...........b",
  spd: "..lllll/..lbbbs/..lbbbs/..lbbbs/..lbbbs/..lbbbblll/..lbbbbbbbs/.lbbbbbbbss/.ssssssssss",
  hp: ".lll..lll/ll*lbllbbs/lbbbbbbbbss/lbbbbbbbbss/.bbbbbbbss/..bbbbbss/...bbbss/....bss/.....s",
  pot: ".....l/.....l/....llb/....llb/llllllllbbbs/.llllbbbbss/..llbbbbss/...lbbbss/..llbsbbs/..lbs..bss/.ls......s",
  lock: "...lllll/..ll...bs/..lb...bs/..lb...bs/.lllllllll/.lbbbbbbbs/.lbbssbbbs/.lbbssbbbs/.lbbbsbbbs/.sssssssss",
  quest: "lllllllllll/l*lllllllbb/.llllllbbbs/.llbbblbbbs/.llllllbbbs/.llbbbbbbbs/.llllllbbbs/.llllllllbs/.ssssssssss/........ss",
  bell: ".....ll/....llbb/...llbbbs/...lbbbbs/...lbbbbs/..llbbbbbbs/.llbbbbbbbss/llllllllbbsss/.....bs/.....ss",
  build: "....ll/..llllbbb/..llbbbsss/....bss/....wv/....vu/...wv/...vu/..wv/..vu/.vu",
  lantern: "....lll/...l..bs/...l..bs/..llllllll/..bbbbbbss/.wwllllvvuu/.wvllllsvuu/.wvll*lsvuu/.wvllllsvuu/.wvllllsvuu/.wvvvvvvvuu/..vvvvvvuu",
  boss: "l.....l.....l/lb...llb...lb/lbb.lllbb.lbbs/lbbbllllbbbbs/lbbbbbbbbbbss/.bbbbbbbbbss/.lllllllllss/.sssssssssss",
  skull: "...llllll/..llllllll/.ll*lllllbbs/.lllssllssbs/.lllssllssbs/.lllllsllbbs/..llbbbbbss/...lssbss/....lbbb/....ssss",
  injury: ".......lll/......llbbs/.....llbbss/....llbbss/...llsbss/..llbbsb/..lbbss/...bss",
  tired: "llllll/....lb/...lb/..lb/.lb/llllll/........llll/...........b/..........b/.........b/........llll",
  lvup: ".....ll/....llll/...llllbb/..llllbbbb/.llllllbbbs/....llbs/....llbs/....llbs/....llbs/....bbss",
  forge: "..llbb...ll/..lbbss.lbb/....ss.llbs/....wvllbs/.....vbs/.....vv/....wvvv/...wv..vu/..wv....vu/.vu......u",
  chest: "..llllllll/..l*bbbbbs/.llllllllbs/.lbbbbbbbss/.lbbllbbbss/.lbbbsbbbss/.lbbbbbbbss/.ssssssssss",
  status: ".....ll/....llll/...llllbb/..lllbbbbb/.lllbbbbbss/..lbbbbbss/...bbbbss/....bbss/.....ss",
  rest: ".....l/.....ll/...l.llb/...llllbb/..llllbbb/..lll*bbb/.lll**bbb/.ll***bbss/..l**bbss/...bbbss/.wwvvvvvvu/wwvvvvvvvuu",
  shop: "....llll/...l...bs/...l...bs/.llllllllll/.lbbbbbbbbs/.lbbbbbbbbs/..lbbbbbbss/..lbbbbbbss/..sssssssss",
  recruit: "..lll/..lbbs/..bbss/........l/.llll..lll/llbbbbs.l/lbbbbbs/lbbbbbs/.sssss",
  log: "llllllllll/l*llllllbs/lbbbbbbbbs/lblllllbbs/lbbbbbbbbs/lblllllbbs/lbbbbbbbbs/lblllbbbbs/lsssssssss",
  worker: "....lll/...llllbb/..llllbbbs/..llbbbbbss/.llllllllbss/....wwwvv/....wvvuu/....uuu/..llbbbbb/..lbbbbbss/..lbbbbbss",
};

const UI_PALETTES = {
  gold: ["#ffe39a", "#e5aa3b", "#916020"], food: ["#ffe0a0", "#cb8d49", "#80502f"],
  wood: ["#e2bd86", "#a67449", "#65432f"], stone: ["#d7dde0", "#94a7ae", "#526773"],
  hp: ["#ffb3a1", "#db665b", "#86383e"], injury: ["#fff0c8", "#d8b682", "#8d6848"],
  mag: ["#e1c0ff", "#ac7ed8", "#634d91"], status: ["#b8fff2", "#58c3bb", "#326e83"],
};
const ITEM_ICONS = Object.fromEntries(Object.entries(ITEM_PIXELS).map(([k, p]) => [k, pixelSvg(p)]));
const PIXEL_UI_ICONS = Object.fromEntries(Object.entries({
  ...UI_PIXELS, atk: ITEM_PIXELS.sword, def: UI_PIXELS.party, book: ITEM_PIXELS.book,
  armor: ITEM_PIXELS.armor, ring: ITEM_PIXELS.acc, weapon: ITEM_PIXELS.sword,
}).map(([k, p]) => {
  const [l, b, s] = UI_PALETTES[k] || ["#ffe0a0", "#c69b57", "#75603e"];
  return [k, pixelSvg(p, { ...ICON_COLORS, l, b, s })];
}));

function pixelIcon(name, cls = "", library = PIXEL_UI_ICONS) {
  if (!library[name]) return "";
  const safe = cls.replace(/[^a-z0-9 _-]/gi, "");
  return `<svg class="ic pixel-ic ${safe}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${library[name]}</svg>`;
}
function itemGrade(it) {
  if (it?.otherworld) return 5;
  if (Number.isInteger(it?.grade) && it.grade >= 0 && it.grade <= 5) return it.grade;
  const price = Number(it?.price) || 0;
  return price <= 50 ? 0 : price <= 100 ? 1 : price <= 200 ? 2 : 3;
}
function weaponGrade(u) {
  const plus = Number(u?.weapon?.plus) || 0;
  return plus < 10 ? 0 : plus < 20 ? 1 : plus < 40 ? 2 : plus < 60 ? 3 : 4;
}
function giftGrade(id) {
  if (id === "ring") return 4;
  const price = GIFTS[id]?.price || 0;
  return price <= 30 ? 0 : price <= 80 ? 1 : 2;
}
function gradeText(grade) {
  return `<small class="grade-label grade-${grade}">${GRADE_NAMES[grade]}</small>`;
}
function itemIcon(type, grade = 0) {
  const g = type === "empty" ? 0 : Number.isInteger(grade) && grade >= 0 && grade <= 5 ? grade : 0;
  const key = ITEM_ICONS[type] ? type : "empty";
  return `<span class="icon-slot grade-${g}${key === "empty" ? " empty-slot" : ""}">${pixelIcon(key, "item-ic", ITEM_ICONS)}</span>`;
}
