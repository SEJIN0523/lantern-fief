// 화면: 타이틀, 대화, 마을 허브(마을/동료/편성/원정), 동료 상세
"use strict";

const app = document.getElementById("app");
let TAB = "village";
let SUB = "build"; // 마을 탭 안의 하위 메뉴
let DTAB = "stat"; // 동료 상세 탭
let SHOPTAB = "weapon"; // 상점: 무기 / 방어구·장신구 / 선물
let SEL = null; // 편성에서 고른 동료
let HUB_VIEW = ""; // Preserve scroll only while refreshing the same menu.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n)));
const sign = (v) => (v >= 0 ? "+" + v : String(v));

// ---------- 주인공 이름 ----------
// 대사·글은 "세진"으로 써 두고, 화면에 넣는 순간 정한 이름으로 바꾼다(받침에 맞춰 조사도)
const HERO_TOKEN = "세진";
function heroName() { return (typeof G !== "undefined" && G && G.heroName) || HERO_TOKEN; }
function hasBatchim(ch) { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0; }
const JOSA = { "이에요": ["이에요", "예요"], "이야": ["이야", "야"], "이라": ["이라", "라"], "으로": ["으로", "로"], "이": ["이", "가"], "은": ["은", "는"], "을": ["을", "를"], "과": ["과", "와"], "아": ["아", "야"] };
// "과(와)" 같은 두 갈래 조사는 앞 글자 받침에 맞춰 하나로
const JOSA2 = { "과(와)": ["과", "와"], "와(과)": ["과", "와"], "을(를)": ["을", "를"], "를(을)": ["을", "를"], "은(는)": ["은", "는"], "는(은)": ["은", "는"], "이(가)": ["이", "가"], "가(이)": ["이", "가"] };
function hn(s) {
  if (typeof s !== "string") return s;
  const n = heroName();
  if (n !== HERO_TOKEN && s.includes(HERO_TOKEN)) {
    const b = hasBatchim(n[n.length - 1]);
    s = s.replace(/세진(이에요|이야|이라|으로|이|은|을|과|아)?/g, (m, j) => n + (j ? JOSA[j][b ? 0 : 1] : ""));
  }
  if (s.includes("(")) s = s.replace(/([가-힣])(과\(와\)|와\(과\)|을\(를\)|를\(을\)|은\(는\)|는\(은\)|이\(가\)|가\(이\))/g, (m, c, j) => c + JOSA2[j][hasBatchim(c) ? 0 : 1]);
  return s;
}
// 화면에 글을 넣는 두 통로(innerHTML, textContent)에서 한 번에 바꾼다
for (const [proto, prop] of [[Element.prototype, "innerHTML"], [Node.prototype, "textContent"]]) {
  const d = Object.getOwnPropertyDescriptor(proto, prop);
  Object.defineProperty(proto, prop, { ...d, set(v) { d.set.call(this, hn(v)); } });
}
function askHeroName(done) {
  const m = document.createElement("div");
  m.className = "modal center"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "주인공 이름");
  m.innerHTML = `<div class="sheet small name-sheet"><h2>주인공의 이름</h2>
    <p class="dim">낯선 세계에 떨어진 당신의 이름을 정해 주세요.</p>
    <input id="hero-name" maxlength="6" placeholder="세진" autocomplete="off">
    <button class="btn gold wide" id="hero-ok">이 이름으로 시작</button></div>`;
  document.body.appendChild(m);
  const inp = m.querySelector("#hero-name");
  inp.value = ""; setTimeout(() => inp.focus(), 50);
  const go = () => { const n = inp.value.trim().replace(/[<>&"]/g, "").slice(0, 6) || HERO_TOKEN; m.remove(); done(n); };
  m.querySelector("#hero-ok").onclick = go;
  inp.onkeydown = (e) => { if (e.key === "Enter") go(); };
}

// UI 아이콘: Codex 아이콘 시트가 있으면 그림, 없으면 이모지
const ICON = {
  gold: ["ui_icons_a_1", "💰"], food: ["ui_icons_a_2", "🍞"], wood: ["ui_icons_a_3", "🪵"], stone: ["ui_icons_a_4", "🪨"],
  pop: ["ui_icons_a_5", "👥"], morale: ["ui_icons_a_6", "🚩"], village: ["ui_icons_a_7", "🏘️"], party: ["ui_icons_a_8", "🛡️"],
  form: ["ui_icons_a_9", "⚔️"], expe: ["ui_icons_a_10", "🗺️"], moon: ["ui_icons_a_11", "🌙"], atk: ["ui_icons_a_13", "🗡️"],
  def: ["ui_icons_a_14", "🛡️"], mag: ["ui_icons_a_15", "✨"], spd: ["ui_icons_a_16", "👢"], hp: ["ui_icons_a_17", "❤️"],
  pot: ["ui_icons_a_18", "⭐"], lock: ["ui_icons_a_19", "🔒"], quest: ["ui_icons_a_21", "📜"], bell: ["ui_icons_a_22", "🔔"],
  build: ["ui_icons_a_23", "🔨"], lantern: ["ui_icons_b_1", "🏮"], boss: ["ui_icons_b_2", "👑"], skull: ["ui_icons_b_3", "💀"],
  injury: ["ui_icons_b_4", "🩹"], tired: ["ui_icons_b_5", "💤"], lvup: ["ui_icons_b_6", "⬆️"], forge: ["ui_icons_b_7", "⚒️"],
  chest: ["ui_icons_b_9", "🎁"], book: ["ui_icons_b_17", "📖"], armor: ["ui_icons_b_18", "🥋"], ring: ["ui_icons_b_19", "💍"],
  weapon: ["ui_icons_b_20", "🗡️"], status: ["ui_icons_b_21", "🔷"], rest: ["ui_icons_b_24", "🔥"], shop: ["ui_icons_a_24", "🛍️"],
  recruit: ["ui_icons_b_12", "🤝"], log: ["ui_icons_a_21", "📜"], worker: ["ui_icons_a_5", "👷"],
};
const UI_GLYPHS = {"gold": "M12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8", "food": "M6 11c-5-6 3-10 6-6 4-4 11 0 6 6v9H6ZM9 13v4m6-4v4", "wood": "m5 19 14-14m-9 0 9 9M4 15l5 5M4 15l-1 6 6-1M14 4l6 6", "stone": "m3 17 4-10 9-3 5 10-6 7H6ZM7 7l5 8 9-1M12 15l3 6", "pop": "M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m0 3a5 5 0 0 1 5 5v1", "morale": "M5 22V3m0 1h14l-3 4 3 4H5", "village": "m2 11 10-8 10 8M5 9v12h14V9M10 21v-7h4v7", "party": "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6ZM12 7v9m-4-5h8", "form": "m4 3 12 12m4-12L8 15M2 18l4 4m12 0 4-4M4 20l5-5m6 0 5 5M4 3v5h5m11-5v5h-5", "expe": "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16m6-14v16", "moon": "M20 16A9 9 0 0 1 8 4a9 9 0 1 0 12 12Z", "build": "m14 3 7 7-4 4-4-4-9 11-3-3 11-9-3-3Z", "worker": "M3 11h18M5 11V9a7 7 0 0 1 14 0v2M8 4v4m8-4v4M6 14a6 6 0 0 0 12 0", "recruit": "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2m3-13v8m-4-4h8", "shop": "M4 9h16l-1 12H5ZM8 9V7a4 4 0 0 1 8 0v2", "log": "M5 3h14v18H5ZM8 7h8m-8 5h8m-8 5h5", "quest": "M5 3h14v18H5ZM9 7h6m-6 4h6m-6 4h3", "bell": "M4 17h16l-2-4V9a6 6 0 0 0-12 0v4Zm6 3h4", "lock": "M5 10h14v11H5ZM8 10V7a4 4 0 0 1 8 0v3m-4 5v2", "boss": "m3 6 4 4 5-7 5 7 4-4-2 14H5Z", "lantern": "M9 4a3 3 0 0 1 6 0M7 6h10l3 5-2 10H6L4 11ZM4 11h16M10 11l-1 10m5-10 1 10"};
// 아이콘은 쓰지 않는다: 낮은 품질의 그림보다 글씨가 낫다. 뜻은 옆의 글자가 전한다
function ic() { return ""; }

function toast(msg) {
  const t = document.createElement("div");
  t.setAttribute("role", "status"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// Presentation-only background library. ART images always take priority.
const UI_BACKGROUNDS = {
  "city": {
    "src": "art/ui/backgrounds/rain-city.webp",
    "alt": "비 내리는 도시의 횡단보도"
  },
  "awakening": {
    "src": "art/ui/backgrounds/twin-moon-forest.webp",
    "alt": "두 달이 떠 있는 이세계의 숲"
  },
  "thicket": {
    "src": "art/ui/backgrounds/forest-thicket.webp",
    "alt": "큰 나무와 수풀이 우거진 숲길"
  },
  "room": {
    "src": "art/ui/backgrounds/cottage-room.webp",
    "alt": "햇빛이 드는 마을 회복실"
  },
  "village": {
    "src": "art/ui/backgrounds/village-morning.webp",
    "alt": "아침 햇살이 비치는 등불골"
  },
  "village_wall": {
    "src": "art/ui/backgrounds/palisade-night.webp",
    "alt": "등불 아래의 야간 목책"
  },
  "night": {
    "src": "art/ui/backgrounds/palisade-night.webp",
    "alt": "달빛 아래의 마을 입구"
  },
  "guild": {
    "src": "art/ui/backgrounds/guild-hall.webp",
    "alt": "모험가 길드 출장소"
  },
  "tavern": {
    "src": "art/ui/backgrounds/tavern-evening.webp",
    "alt": "따뜻한 불빛의 마을 주점"
  },
  "smithy": {
    "src": "art/ui/backgrounds/smithy-forge.webp",
    "alt": "화로가 켜진 마을 대장간"
  },
  "mine": {
    "src": "art/ui/backgrounds/abandoned-mine.webp",
    "alt": "버려진 광산의 갱도"
  },
  "graveyard": {
    "src": "art/ui/backgrounds/moonlit-graveyard.webp",
    "alt": "달빛과 안개가 감도는 묘지"
  },
  "festival": {
    "src": "art/ui/backgrounds/village-festival.webp",
    "alt": "등불이 걸린 마을 축제"
  }
};
function locationBanner(kind, label) {
  return `<div class="location-banner">${scenery(kind)}<span>${esc(label)}</span></div>`;
}
function sceneBackdrop(sc, line) {
  // Change scenery when the clear scene moves from forest to the village feast.
  if (sc === SCENES.ch1clear) return line >= 3 ? "festival" : "forest";
  if (sc === SCENES.raidwin) return "festival";
  if (sc === SCENES.guildtip) return "guild";
  return ({story_02_forest:"awakening",story_03_goblins:"thicket",story_04_shield:"thicket"})[sc.art] || sc.bg;
}

// 풍경(그림이 없을 때 CSS로 그리는 산과 하늘)
function scenery(kind) {
  const villageLv = Math.min(5, Math.max(1, G ? G.bld.hall : 1));
  const key = kind === "village" ? "village_" + villageLv : typeof ART !== "undefined" && ART["bg_" + kind] ? "bg_" + kind : kind;
  if (typeof ART !== "undefined" && ART[key]) return `<img class="scn-img" src="${ART[key]}" alt="">`;
  if (kind === "forest") return `<img class="scn-img forest-landscape" src="art/ui/forest-clearing.webp" alt="고요한 숲의 공터">`;
  const bg = UI_BACKGROUNDS[kind];
  if (bg) return `<img class="scn-img background-${kind}" src="${bg.src}" alt="${bg.alt}" decoding="async">`;
  if (kind === "dusk") return `<img class="scn-img village-landscape" src="art/ui/lantern-village.webp" alt="등불이 켜진 산골 마을">`;
  return `<div class="scn scn-${kind}"><i class="m1"></i><i class="m2"></i><i class="m3"></i>${kind === "village" ? `<i class="houses" style="--n:${villageLv}"></i>` : ""}</div>`;
}

// ---------- 타이틀 ----------
function showTitle() {
  const art = typeof ART !== "undefined" && ART.story_08_title ? `<img class="title-bg" src="${ART.story_08_title}" alt="">` : `<div class="title-bg">${scenery("dusk")}</div>`;
  app.innerHTML = `<div class="title">${art}<div class="title-shade"></div>
    <div class="title-logo"><div class="title-kicker">작은 불빛에서 시작되는 이야기</div><div class="title-seal">${ic("lantern")}</div><h1>등불 영지</h1><h2>이계의 영주</h2><div class="title-rule" aria-hidden="true">◆</div></div><p class="title-copy">낯선 세계의 작은 마을,<br>당신이 지켜 갈 하나의 등불.</p>
    <div class="title-btns">
      ${hasSave() ? `<button class="btn gold big" data-act="continue"><span>이야기 이어가기</span><span aria-hidden="true">→</span></button>` : ""}
      <button class="btn ${hasSave() ? "" : "gold"} big" data-act="newgame"><span>새로운 이야기</span><span aria-hidden="true">→</span></button>
      <button class="btn big" data-act="savemenu" data-arg="title"><span>불러오기 · 백업</span><span aria-hidden="true">→</span></button>
    </div>
    <p class="title-save">진행 상황은 이 기기에 자동 저장됩니다</p><p class="ver">CHAPTER 01 <span>◆</span> v0.2 · 체험판</p></div>`;
}

// ---------- 저장 · 불러오기 ----------
function showSaveMenu(from) {
  closeModal(true);
  const inGame = from !== "title" && G;
  const when = (t) => { if (!t) return ""; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const desc = (i) => i ? `<b>${i.ch} · ${i.day}일째</b><small>동료 ${i.n}명 · 최고 Lv${i.lv}${i.t ? " · " + when(i.t) : ""}</small>` : `<b class="dim">비어 있음</b>`;
  const auto = slotInfo("auto");
  const rows = [1, 2, 3].map((n) => {
    const i = slotInfo(n);
    return `<div class="sv"><span class="sv-n">${n}</span><div class="sv-tx">${desc(i)}</div><div class="sv-bt">
      ${inGame ? `<button class="btn sm gold" data-act="saveslot" data-arg="${n}">저장</button>` : ""}
      ${i ? `<button class="btn sm" data-act="loadslot" data-arg="${n}">불러오기</button><button class="btn sm ghost" data-act="delslot" data-arg="${n}" aria-label="${n}번 칸 지우기">✕</button>` : ""}</div></div>`;
  }).join("");
  const m = document.createElement("div");
  m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "저장과 불러오기");
  m.innerHTML = `<div class="sheet small save-sheet"><button class="x" data-act="close">✕</button>
    <h2>저장 · 불러오기</h2>
    <h4 class="sub">자동 저장 <small>진행하면 저절로 저장</small></h4>
    <div class="sv auto"><span class="sv-n">A</span><div class="sv-tx">${desc(auto)}</div><div class="sv-bt">${auto && !inGame ? `<button class="btn sm gold" data-act="loadslot" data-arg="auto">이어하기</button>` : ""}</div></div>
    <h4 class="sub">저장 칸</h4>${rows}
    <h4 class="sub">백업 <small>다른 기기로 옮기거나 보관</small></h4>
    <div class="sv-backup">
      ${inGame ? `<button class="btn" data-act="exportsave">코드 복사</button><button class="btn" data-act="downloadsave">파일로 받기</button>` : ""}
      <button class="btn" data-act="importsave">코드 붙여넣기</button>
      <label class="btn">파일 열기<input type="file" accept=".json,.txt,application/json,text/plain" id="save-file" hidden></label>
    </div></div>`;
  document.body.appendChild(m);
  m.querySelector("#save-file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((t) => { try { importCode(t); closeModal(); toast("불러왔어요"); showHub(); } catch (err) { toast("세이브 파일을 읽을 수 없어요"); } });
  };
}

// ---------- 대화 ----------
function playScenes(ids, done) {
  ids = [...ids];
  const next = () => {
    if (!ids.length) { save(); done && done(); return; }
    const id = ids.shift();
    sceneEffect(id);
    playScene(SCENES[id], next);
  };
  next();
}
// 이야기 속 NPC 그림 (art/npc, art/monsters)
const NPC_ART = { "보린": "npc_a_1", "리나": "npc_a_2", "마르타": "npc_a_3", "세리": "npc_b_3", "고블린": "goblins_1" };
function speakerArt(who, sc) {
  // 상반신을 잘라 둔 그림(bust_키)이 있으면 액자 속 상반신, 없으면 전신
  const has = (k) => typeof ART !== "undefined" && ART[k];
  const face = (k) => `<div class="sc-face"><img src="${ART["bust_" + k]}" alt=""></div>`;
  const nk = NPC_ART[who];
  if (nk) return has("bust_" + nk) ? face(nk) : has(nk) ? `<img class="spr talk" src="${ART[nk]}" alt="">` : "";
  if (!G) return "";
  const byId = sc && sc.uid ? unitById(sc.uid) : null;
  const u = who === "세진" ? heroU() : byId && byId.name === who ? byId : G.roster.find((x) => x.name === who);
  if (!u) return "";
  // 사고 직후(프롤로그 1~4)의 세진은 정장 차림
  if (u.hero && sc && /^story_0[1-4]/.test(sc.art || "") && has("bust_sejin_1")) return face("sejin_1");
  return has("bust_" + artKey(u)) ? face(artKey(u)) : unitSprite(u, "talk");
}
function playScene(sc, done) {
  let i = 0;
  const customArt = sc.art && typeof ART !== "undefined" && ART[sc.art];
  let backdrop = sceneBackdrop(sc, 0);
  const art = customArt ? `<img class="sc-art" src="${ART[sc.art]}" alt="">` : `<div class="sc-art" id="scene-backdrop">${scenery(backdrop)}</div>`;
  app.innerHTML = `<div class="scene">${art}<div class="sc-who" id="scwho"></div><div class="sc-box" id="scbox"><div class="sc-name" id="scname"></div><div class="sc-text" id="sctext"></div><div class="sc-next">▼</div></div><button class="sc-skip" id="scskip">건너뛰기 ▶▶</button></div>`;
  const show = () => {
    const kind = sceneBackdrop(sc, i);
    if (!customArt && kind !== backdrop) {
      document.getElementById("scene-backdrop").innerHTML = scenery(kind);
      backdrop = kind;
    }
    const [who, text] = sc.lines[i];
    const inner = who.endsWith("(속)");
    const name = who === "*" || who === "" ? "" : who.replace("(속)", "");
    document.getElementById("scbox").className = "sc-box" + (who === "*" ? " sys" : who === "" ? " narr" : "");
    const nm = document.getElementById("scname");
    nm.textContent = name; nm.style.display = name ? "" : "none";
    const tx = document.getElementById("sctext");
    tx.textContent = inner ? `(${text})` : text;
    tx.classList.toggle("inner", inner);
    const who2 = document.getElementById("scwho");
    who2.innerHTML = name ? speakerArt(name, sc) : "";
    who2.classList.toggle("has-face", !!who2.querySelector(".sc-face"));
  };
  show();
  let ended = false;
  const end = () => { if (!ended) { ended = true; done(); } };
  app.querySelector(".scene").onclick = (e) => {
    if (ended) return;
    if (e.target.id === "scskip") { end(); return; }
    i++;
    if (i >= sc.lines.length) end(); else show();
  };
}

// ---------- 허브 ----------
function showHub() {
  if (!G.form.length) autoForm();
  const r = G.res, inc = dailyIncome();
  const soon = raidSoon(), tonight = raidTonight();
  const stat = (name, v, sub, cls = "") => `<div class="res ${cls}"><span class="res-name">${name}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
  const view = TAB + (TAB === "village" ? ":" + SUB : "");
  const scroll = HUB_VIEW === view ? document.querySelector(".tab-body")?.scrollTop || 0 : 0;
  HUB_VIEW = view;
  app.innerHTML = `<div class="hub">
    <header class="banner-v">${scenery("village")}
      <div class="village-heading"><small>등불 영지</small><h1 class="${(CHAPTERS[G.chapter] || {}).name && CHAPTERS[G.chapter].name.length > 8 ? "long" : ""}">${G.chapter ? (G.chapter >= 7 ? "엔딩 후 · " : "제" + G.chapter + "장 · ") + CHAPTERS[G.chapter].name : "프롤로그"}</h1></div><div class="plaque"><b>${G.day}</b><span>일째</span></div><button class="save-btn" data-act="savemenu" aria-label="저장 · 불러오기">저장</button>
    </header>
    <div class="resbar">${stat("금화", fmt(r.gold), `<span class="${inc.gold < 0 ? "neg" : "pos"}">${sign(inc.gold)}</span> /일`, "gold")}${stat("주민", G.pop, "모집 가능")}${stat("사기", G.morale, G.morale >= 70 ? "높음" : G.morale >= 40 ? "보통" : "낮음")}${stat("명성", G.fame, "이주민")}</div>
    ${tonight ? `<div class="alert red">${ic("bell")} 오늘 밤 습격이 옵니다! 편성을 확인하세요.</div>` : soon ? `<div class="alert">${ic("bell")} 척후 보고: ${soon.day - G.day}일 뒤 밤, 몬스터 습격 (Lv${soon.lv} 정도)</div>` : ""}
    <main class="tab-body" aria-label="${({village:"마을 운영",party:"동료 목록",form:"출전 편성",expe:"원정 지도"})[TAB]}">${renderTab()}</main>
    <nav class="tabs" aria-label="주 메뉴">
      ${tabBtn("village", "마을")}${tabBtn("party", "동료")}
      <button data-act="endday" class="moon"><span class="moon-txt">밤</span><span>하루 마치기</span></button>
      ${tabBtn("form", "편성")}${tabBtn("expe", "원정")}
    </nav>
  </div>`;
  const tb = document.querySelector(".tab-body");
  if (tb) tb.scrollTop = scroll;
}
function tabBtn(k, n) { return `<button data-tab="${k}" aria-current="${TAB === k ? "page" : "false"}" class="${TAB === k ? "on" : ""}"><span>${n}</span></button>`; }

function renderTab() {
  if (TAB === "village") return renderVillage();
  if (TAB === "party") return renderParty();
  if (TAB === "form") return renderForm();
  if (TAB === "expe") return renderExpe();
  return "";
}

function panel(title, body, extra = "") { return `<section class="panel"><h3 class="ptitle">${title}${extra ? `<small>${extra}</small>` : ""}</h3>${body}</section>`; }

function renderVillage() {
  const cg = chapterGoal();
  const goal = cg ? `<div class="goal">${ic("quest")}<div><span class="eyebrow">제${G.chapter}장 · ${CHAPTERS[G.chapter].name}</span><b>${cg.title}</b><small>${cg.sub}</small>${G.chapter === 1 && G.seen.tax && !G.seen.taxdone ? `<small>세금 💰150 · 20일째까지</small>` : ""}</div></div>` : "";
  const subs = [["build", "건설", "build"], ["recruit", "모집", "recruit"], ["shop", "상점", "shop"], ["log", "기록", "log"]];
  const seg = `<div class="seg village-seg">${subs.map(([k, n, i]) => `<button data-act="sub" aria-pressed="${SUB === k}" data-arg="${k}" class="${SUB === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  let body = "";
  if (SUB === "build") body = renderBuild();
  if (SUB === "recruit") body = renderRecruit();
  if (SUB === "shop") body = renderShop();
  if (SUB === "log") body = panel("마을 기록", `<div class="log">${G.log.slice(0, 20).map((l) => `<p><small>${l.d}일</small>${esc(l.m)}</p>`).join("") || `<p class="dim">아직 기록이 없어요.</p>`}</div>`);
  return seg + (SUB === "build" ? goal : "") + body;
}

function uiCost(cost) {
  return cost.gold ? `<span class="cost-part ${G.res.gold < cost.gold ? "neg" : ""}">금화 ${fmt(cost.gold)}</span>` : "";
}
const bldArt = (id) => (id === "training" ? "barracks" : id);
function buildingGlyph(id) {
  return `<div class="bld-crest bld-${id}"><b>${BUILDINGS[id].name[0]}</b></div>`;
}
function renderBuild() {
  const list = Object.entries(BUILDINGS).filter(([, b]) => !b.unlock || G.flags[b.unlock]);
  const parked = ([id, b]) => G.bld[id] >= b.max || (id !== "hall" && G.bld[id] >= G.bld.hall);
  const mini = list.filter(parked).map(([id, b]) => {
    const lv = G.bld[id];
    const k = `bld_${bldArt(id)}_${Math.max(1, lv)}`;
    const art = typeof ART !== "undefined" && ART[k] ? `<img src="${ART[k]}" alt="">` : buildingGlyph(id);
    return `<div class="bmini ${lv ? "" : "unbuilt"}" title="${b.desc}"><span class="bmini-art">${art}</span><b>${b.name}</b><small>${lv >= b.max ? "최대" : lv ? "Lv." + lv : "미건설"}</small></div>`;
  }).join("");
  const tiles = list.filter((e) => !parked(e)).map(([id, b]) => {
    const lv = G.bld[id];
    const why = canBuild(id);
    const max = lv >= b.max;
    const pips = Array.from({ length: b.max }, (_, i) => `<i class="${i < lv ? "on" : ""}"></i>`).join("");
    const art = typeof ART !== "undefined" && ART[`bld_${bldArt(id)}_${Math.max(1, lv)}`] ? `<img src="${ART[`bld_${bldArt(id)}_${Math.max(1, lv)}`]}" alt="">` : `<span>${buildingGlyph(id)}</span>`;
    return `<div class="tile ${lv ? "" : "unbuilt"} ${!why ? "ready" : ""}">
      <div class="tile-art">${art}</div>
      <div class="tile-info"><div class="tile-heading"><b>${b.name}</b><span class="tile-level">${lv ? "Lv." + lv : "미건설"}</span></div><div class="pips" aria-hidden="true">${pips}</div><p>${b.desc}</p></div>
      <div class="tile-action">${max ? `<div class="tile-max">최대 레벨</div>` : `<button class="btn sm bbtn ${why ? "" : "gold"}" data-act="build" data-arg="${id}" ${why ? "disabled" : ""} aria-label="${b.name} ${lv ? "증축" : "건설"}"><b>${lv ? "증축" : "건설"}</b><span class="cost">${uiCost(buildCost(id))}</span></button>`}</div>
      ${why && why !== "자원 부족" && why !== "오늘은 이미 공사했어요" && !max ? `<small class="why">${why}</small>` : ""}
    </div>`;
  }).join("");
  // 오늘 공사를 마쳤으면 카드마다 쓰지 않고 위에 한 번만
  const done = G.built[G.day] ? `<div class="bld-done">${ic("build", "sm")}오늘 공사를 마쳤어요. 내일 다시 지을 수 있어요.</div>` : "";
  return panel("건물", done + `<div class="tiles">${tiles}</div>` + (mini ? `<h4 class="sub">촌장의 집을 올리면 증축 <small>최대 레벨 포함</small></h4><div class="bminis">${mini}</div>` : ""), "하루에 한 번 공사");
}


function renderRecruit() {
  const volReady = G.day - G.volDay >= 3;
  const vols = G.volunteers.map((u, i) => recruitCard(u, "vol", i)).join("");
  const migs = G.migrants.map((u, i) => recruitCard(u, "mig", i)).join("");
  const migNext = Math.max(0, migrantInterval() - (G.day - G.migDay));
  return panel("마을 자원자", (vols || "") + (volReady ? `<button class="btn wide" data-act="vol">${vols ? "다른 자원자 찾기" : "자원자 찾기"}</button>` : `<p class="dim">${3 - (G.day - G.volDay)}일 뒤 새 자원자가 나서요.</p>`), `${crew().length}/${rosterCap()}명 · 무료`) +
    panel("이주민", migs || `<p class="dim">${G.fame < 5 ? "마을의 명성이 오르면(습격 격퇴, 원정 승리) 다른 종족 이주민이 찾아와요." : `${migNext}일 뒤 새 이주민이 올 거예요.`}</p>`, `명성 ${G.fame}`) +
    "";
}
function aptText(u) {
  return aptKnown(u) ? `${LINES[u.line].name} 적성` : "적성 ???";
}
function recruitCard(u, from, i) {
  return `<div class="rc" role="group" data-act="peek" data-arg="${from}:${i}"><div class="por" style="--lc:${LINES[u.line].color}">${unitBust(u)}</div>
    <div class="rc-tx"><b>${esc(u.name)}</b><small>${u.race} · ${JOBS[u.job].name} Lv${u.lv} · ${aptText(u)}</small>
    <div class="tags"><span class="tag">${traitOf(u, "personality").name}</span><span class="tag">${traitOf(u, "hobby").name}</span>${u.traits.quirk ? `<span class="tag gold">${traitOf(u, "quirk").name}</span>` : ""}</div>
    <small>${u.price ? `맞이하기 금화 ${u.price} · ` : ""}마을 사람 1명</small></div>
    <button class="btn sm gold" data-act="hire" data-arg="${from}:${i}">합류</button></div>`;
}

function renderShop() {
  const items = Object.entries(ITEMS).filter(([, it]) => it.price && it.price <= 80 + G.bld.hall * 60).map(([id, it]) => `
    <div class="shop-it"><span class="shop-ic">${itemIc(id, it.slot)}</span><div><b class="gname g${itemGrade(it)}">${it.name}</b><small>${itemStatText(it)}</small></div><small class="own">보유 ${G.inv[id] || 0}</small><button class="btn sm" data-act="buy" data-arg="${id}">금화 ${it.price}</button></div>`).join("");
  const seg = `<div class="seg shop-seg">${[["weapon", "무기"], ["gear", "방어구·장신구"], ["gift", "선물"]].map(([k, n]) => `<button data-act="shoptab" data-arg="${k}" class="${SHOPTAB === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  if (SHOPTAB === "gift") return seg + panel("선물", renderGiftShop(), "동료에게 건네면 호감이 올라요");
  if (SHOPTAB === "weapon") return seg + renderWeaponShop();
  return seg + panel("떠돌이 상인", items, "촌장의 집 레벨이 오르면 품목이 늘어요");
}
// 무기 상점: 동료들이 쓰는 종류만, 등급은 촌장의 집·대장간 레벨까지. 아래에 무기고(팔기)
function shopWeaponGrade() { return Math.min(3, Math.floor((G.bld.hall + G.bld.smithy) / 2)); }
function renderWeaponShop() {
  // 지금 쓰는 무기 + 다음 전직 때 쓸 무기
  const kinds = [...new Set(crew().flatMap((u) => [JOBS[u.job].weapon, ...(u.job !== "villager" || aptKnown(u) ? nextJobs(u).map((j) => JOBS[j].weapon) : [])]))].filter((k) => k !== "tool" || crew().some((u) => u.job === "villager"));
  const top = shopWeaponGrade();
  const buy = kinds.map((k) => `<div class="wshop-row"><span class="wshop-k">${weaponTag({ kind: k, grade: 0 })}<b>${WEAPON_KIND[k]}</b></span><div class="wshop-gs">${WEAPON_GRADE.slice(0, top + 1).map((g, i) => `<button class="btn sm wbuy g${i}" data-act="buyw" data-arg="${k}:${i}" ${G.res.gold < g.price ? "disabled" : ""}><b>${g.name}</b><small>힘 ${g.pow} · 금화 ${g.price}</small></button>`).join("")}</div></div>`).join("");
  const arms = G.arms.map((w) => `<div class="shop-it"><span class="shop-ic">${weaponTag(w)}</span><div><b class="gname g${w.grade}">${esc(weaponLabel(w))}</b><small>${GRADE_NAME[w.grade]} · 힘 ${Math.round(weaponPow(w))}</small></div><span></span><button class="btn sm" data-act="sellw" data-arg="${w.id}">팔기 ${Math.round(weaponPrice(w) * 0.4)}</button></div>`).join("");
  return panel("무기 상인", buy || '<p class="dim">동료가 없어요.</p>', top < 3 ? "촌장의 집·대장간을 올리면 좋은 무기가 들어와요" : "") +
    panel("무기고", arms || '<p class="dim">남는 무기가 없어요. 전투에서 이기면 가끔 무기를 얻어요.</p>', `${G.arms.length}자루`);
}
// 장비 아이콘: items 시트 칸이 있으면 그림, 없으면 UI 아이콘
// 장비 그림(아이템 시트 칸). 무기는 종류별 시트(items_weapon_1~11)가 들어오면 그것을 쓴다
const ITEM_ART = { leather: "items_armor_2", chain: "items_armor_3", robe: "items_armor_6", plate: "items_armor_5", ring_str: "items_accessory_1", amulet: "items_accessory_4", charm: "items_accessory_7", coin: "items_accessory_8", belt: "items_armor_23", pen: "items_otherworld_1", phone: "items_otherworld_3", notebook: "items_otherworld_16" };
const WEAPON_ORDER = ["sword", "axe", "spear", "dagger", "bow", "crossbow", "staff", "mace", "fist", "tool", "book"];
const WEAPON_ART_FALLBACK = { sword: "ui_icons_b_20", book: "ui_icons_b_17" };
const artOf = (k) => (k && typeof ART !== "undefined" && ART[k] ? ART[k] : null);
function iconBox(src, g, label) { return `<span class="iic g${g}" title="${label}"><img src="${src}" alt="${label}"></span>`; }
function itemGrade(it) { return it.otherworld ? 5 : it.price <= 50 ? 0 : it.price <= 100 ? 1 : it.price <= 200 ? 2 : 3; }
function gradeTag(g) { return `<span class="gtag g${g}">${GRADE_NAME[g]}</span>`; }
// 아이템 자리: 종류를 글씨로, 등급을 색으로
function itemIc(id, slot) {
  const it = ITEMS[id], g = it ? itemGrade(it) : 0, label = slot === "armor" ? "방어구" : "장신구";
  const src = artOf(ITEM_ART[id]) || (!id ? artOf(slot === "armor" ? "items_armor_1" : "items_accessory_2") : null);
  return src ? iconBox(src, g, label) + (id ? "" : "") : `<span class="itx g${g}">${label}</span>`;
}
function weaponTag(w) {
  // 시트 1~11번은 기본 모습, 13~23번은 같은 무기의 좋은 모습(희귀 등급부터)
  const n = WEAPON_ORDER.indexOf(w.kind) + 1;
  const src = artOf("items_weapon_" + (w.grade >= 2 ? n + 12 : n)) || artOf("items_weapon_" + n) || artOf(WEAPON_ART_FALLBACK[w.kind]);
  return src ? iconBox(src, w.grade, WEAPON_KIND[w.kind]) : `<span class="itx g${w.grade}">${WEAPON_KIND[w.kind]}</span>`;
}
function itemStatText(it) {
  const n = { atk: "공격", mag: "마공", def: "방어", res: "저항", hp: "HP", eva: "회피", crit: "치명", spd: "속도" };
  return Object.entries(it).filter(([k]) => n[k]).map(([k, v]) => `${n[k]}${v > 0 ? "+" : ""}${v}`).join(" ");
}

function hpBar(u) {
  const pct = u.injured ? 30 : 100;
  return `<div class="mbar hp"><i style="width:${pct}%"></i></div>`;
}
function renderParty() {
  // 주인공은 동료 목록이 아니라 위쪽 지휘관 칸에
  const h = heroU();
  const cmdr = h ? `<button class="cmdr" data-act="detail" data-arg="${h.id}"><span class="cmdr-face">${unitFace(h)}</span><span class="cmdr-tx"><small>지휘관</small><b>${esc(h.name)}</b><small>${JOBS[h.job].name} · 아군 능력 +${Math.round(HERO_AURA[JOBS[h.job].tier] * 100)}%</small></span><span class="cmdr-go">보기</span></button>` : "";
  const cards = crew().map((u) => {
    const st = u.injured ? `<span class="tag red">${ic("injury", "sm")}부상 ${u.injured}일</span>` : u.fatigue >= 3 ? `<span class="tag">${ic("tired", "sm")}지침</span>` : "";
    const promo = canPromote(u) ? `<span class="tag gold">${ic("lvup", "sm")}전직</span>` : "";
    return `<div class="cc" role="button" tabindex="0" data-act="detail" data-arg="${u.id}">
      <div class="cc-art" style="--lc:${LINES[u.line].color}">${unitBust(u)}<span class="lv">Lv${u.lv}</span></div>
      <div class="cc-tx"><b>${esc(u.name)}</b><small>${JOBS[u.job].name}</small>
      <div class="mbar xp"><i style="width:${(u.exp / expNeed(u.lv)) * 100}%"></i></div>
      <div class="tags">${st}${promo}${loveTag(u)}</div><small class="pw">전투력 ${fmt(power(u))}</small></div></div>`;
  }).join("");
  return cmdr + panel("동료", `<div class="cards">${cards || '<p class="dim">아직 동료가 없어요. 마을 → 모집에서 데려올 수 있어요.</p>'}</div>`, `${crew().length}/${rosterCap()}명`);
}

function renderForm() {
  const at = (col, lane) => G.form.find((f) => f.col === col && f.lane === lane);
  let grid = "";
  for (let lane = 0; lane < 5; lane++) {
    for (const col of [1, 0]) {
      const f = at(col, lane);
      const u = f && unitById(f.id);
      grid += `<div role="button" tabindex="0" aria-label="${col === 0 ? '전열' : '후열'} ${lane + 1}줄 ${u ? esc(u.name) : '빈 칸'}" class="cell ${col === 0 ? "front" : "back"} ${u && SEL === u.id ? "sel" : ""} ${u ? "full" : ""}" data-act="cell" data-arg="${col}:${lane}">${u ? `<div class="cell-u" style="--lc:${LINES[u.line].color}">${unitFace(u)}</div><div class="cell-t"><b>${esc(u.name)}</b><small>Lv${u.lv} · ${JOBS[u.job].name}</small></div>${u.injured ? `<em>${ic("injury", "sm")}</em>` : ""}` : `<span class="plus">＋</span>`}</div>`;
    }
  }
  const bench = G.roster.filter((u) => !u.hero && !G.form.some((f) => f.id === u.id)).map((u) => `<button class="bc ${SEL === u.id ? "on" : ""}" data-act="pickunit" data-arg="${u.id}"><div class="bc-art" style="--lc:${LINES[u.line].color}">${unitFace(u)}</div><span class="bc-t"><b>${esc(u.name)}</b><small>Lv${u.lv} · ${JOBS[u.job].name}</small></span></button>`).join("");
  const tp = formUnits().reduce((a, f) => a + power(f.unit), 0);
  return panel("편성", `
    <div class="fwrap"><div class="fgrid"><div class="fh">후열</div><div class="fh">전열 ▶ 적</div>${grid}</div></div>
    <p class="hint">${SEL ? "놓을 칸을 누르세요. 같은 칸을 다시 누르면 편성에서 빠져요." : "칸을 눌러 동료를 고른 뒤 다른 칸을 누르면 옮겨요. 근접 직업은 전열에서만 공격해요. 「수호」 직업은 같은 줄 후열을 지켜요."}</p>
    <h4 class="sub">대기 중</h4><div class="bench">${bench || '<p class="dim">대기 중인 동료가 없어요.</p>'}</div>`, `${G.form.length}/5명 · 전투력 ${fmt(tp)}`);
}

let DISP_SEL = [], DISP_SPOT = 0;
function renderDispatch() {
  const spots = dispatchSpots();
  if (!spots.length) return "";
  if (G.dispatch) {
    const us = G.dispatch.ids.map(unitById).filter(Boolean);
    const F = floorOf(G.dispatch.did, G.dispatch.fi);
    return panel("파견", `<div class="disp-on"><div class="disp-faces">${us.map((u) => `<span class="disp-f">${unitFace(u)}</span>`).join("")}</div>
      <div><b>${DUNGEONS[G.dispatch.did].name} ${G.dispatch.fi + 1}층</b><small>Lv${F.lv} · 오늘 밤 돌아와요</small></div>
      <button class="btn sm ghost" data-act="dispcancel">취소</button></div>`, "남은 동료의 하루 원정");
  }
  const cands = dispatchCands();
  DISP_SEL = DISP_SEL.filter((id) => cands.some((u) => u.id === id));
  if (DISP_SPOT >= spots.length) DISP_SPOT = 0;
  const chips = cands.map((u) => `<button class="disp-c ${DISP_SEL.includes(u.id) ? "on" : ""}" data-act="disppick" data-arg="${u.id}"><span class="disp-f">${unitFace(u)}</span><small>${esc(u.name)} ${u.lv}</small></button>`).join("");
  return panel("파견", cands.length ? `<div class="seg disp-spots">${spots.map((s, i) => `<button data-act="dispspot" data-arg="${i}" class="${DISP_SPOT === i ? "on" : ""}">${s.name}<small>Lv${s.lv}</small></button>`).join("")}</div>
    <div class="disp-cands">${chips}</div>
    <button class="btn wide ${DISP_SEL.length ? "gold" : ""}" data-act="dispgo" ${DISP_SEL.length ? "" : "disabled"}>${DISP_SEL.length ? `${DISP_SEL.length}명 파견 보내기` : "보낼 동료를 고르세요"}</button>` : '<p class="dim">편성에 없는 동료가 없어요.</p>', "남은 동료의 하루 원정");
}
function renderExpe() {
  const tp = formUnits().reduce((a, f) => a + power(f.unit), 0);
  const open = Object.entries(DUNGEONS).filter(([id, d]) => !d.unlock || (typeof d.unlock === "function" ? d.unlock(G) : G.chapter >= d.unlock) || G.dungeon[id]).reverse();
  return open.map(([id, d]) => {
    const cleared = G.dungeon[id] || 0;
    const lo = Math.max(0, cleared - 4);
    const idx = d.endless ? Array.from({ length: cleared - lo + 1 }, (_, k) => lo + k) : d.floors.map((f, i) => i);
    const nodes = idx.map((i) => {
      const f = floorOf(id, i);
      const lock = i > cleared;
      const lv = f.boss ? f.lv + 3 : f.lv + 1;
      return `<button class="node ${lock ? "lock" : i < cleared ? "done" : "next"} ${f.boss ? "boss" : ""}" data-act="expe" data-arg="${id}:${i}" ${lock ? "disabled" : ""}>
        <span class="node-ic">${lock ? ic("lock", "sm") : f.boss ? ic("boss") : i + 1}</span><small>Lv${lv}</small></button>`;
    }).join(`<i class="path"></i>`);
    const done = !d.endless && cleared >= d.floors.length;
    return `<section class="dun ${done ? "cleared" : ""}"><div class="dun-art">${scenery(d.bg)}<h3>${d.name}${done ? " ✓" : ""}${d.endless ? ` · 최고 ${cleared}층` : ""}</h3></div>
      <div class="nodes">${nodes}</div>
      <p class="hint">원정은 하루가 걸려요. 일반 층은 3연전(체력 유지), 보스 층은 1전. 전투 사이에 돌아올 수 있어요.</p></section>`;
  }).join("") + renderDispatch() + panel("출전 파티", `<div class="mini-party">${formUnits().map((f) => `<div class="mp"><div class="mp-art" style="--lc:${LINES[f.unit.line].color}">${unitFace(f.unit)}</div><small><b>${esc(f.unit.name)}</b> Lv${f.unit.lv}${f.unit.fatigue >= 3 ? " · 지침" : ""}</small></div>`).join("") || '<p class="dim">편성된 동료가 없어요.</p>'}</div>`, `전투력 ${fmt(tp)}`);
}

// ---------- 동료 상세 ----------
function showDetail(u, hireFrom) {
  closeModal(true);
  const d = derived(u);
  const J = JOBS[u.job];
  const m = document.createElement("div");
  m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "동료 상세");
  m.dataset.uid = u.id;
  const tabs = u.hero ? [["cmd", "지휘"], ["prof", "프로필"]]
    : [["stat", "능력"], ["trait", "특성"], ["prof", u.gender === "f" && !hireFrom ? "관계" : "프로필"], ["weapon", "무기"], ["gear", "장비"], ["skill", canPromote(u) && !hireFrom ? "전직 ★" : "기술"]];
  if (u.hero && DTAB !== "prof") DTAB = "cmd";
  if (!u.hero && DTAB === "cmd") DTAB = "stat";
  const body = DTAB === "cmd" ? detailCommand(u) : DTAB === "stat" ? detailStats(u, d) : DTAB === "trait" ? detailTraits(u) : DTAB === "prof" ? detailProfile(u, hireFrom) : DTAB === "weapon" ? detailWeapon(u, hireFrom) : DTAB === "gear" ? detailGear(u, hireFrom) : detailSkills(u, hireFrom);
  m.innerHTML = `<div class="sheet dt">
    <div class="dt-hero" style="--lc:${LINES[u.line].color}">
      <button class="x" data-act="close">✕</button>
      ${!hireFrom && !u.hero && crew().length > 1 && G.roster.includes(u) ? `<div class="dt-nav"><button data-act="dtnav" data-arg="${u.id}:-1" aria-label="이전 동료">‹</button><span>${crew().indexOf(u) + 1}/${crew().length}</span><button data-act="dtnav" data-arg="${u.id}:1" aria-label="다음 동료">›</button></div>` : ""}
      <button class="dt-art" data-act="fullview" data-arg="${u.id}" aria-label="전신 보기">${unitBust(u)}<span class="dt-zoom">전신</span></button>
      <div class="dt-id"><div class="dt-name"><h2>${esc(u.name)}</h2><span class="job">${J.name}</span></div>
        <p>${u.race} · ${u.gender === "m" ? "남" : "여"} · ${J.role}${u.job === "villager" ? " · " + aptText(u) : ""}</p>
        ${u.hero ? `<small class="dt-pw">전장 밖에서 지휘 · 아군 능력 <b>+${Math.round(HERO_AURA[J.tier] * 100)}%</b> · 지휘한 전투 ${u.battles}</small>` : `<div class="dt-lv"><b>Lv${u.lv}</b><div class="mbar xp"><i style="width:${(u.exp / expNeed(u.lv)) * 100}%"></i></div><small>${u.exp}/${expNeed(u.lv)}</small></div>
        <small class="dt-pw">전투력 <b>${fmt(power(u))}</b> · 전투 ${u.battles} · 처치 ${u.kills}</small>`}
        ${!hireFrom && canPromote(u) && DTAB !== "skill" ? `<button class="btn sm gold dt-promo" data-act="dtab" data-arg="skill:${u.id}">${ic("lvup", "sm")}전직할 수 있어요 →</button>` : ""}</div>
    </div>
    <div class="seg dseg">${tabs.map(([k, n]) => `<button data-act="dtab" data-arg="${k}:${u.id}${hireFrom ? ":" + hireFrom : ""}" class="${DTAB === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="dt-body">${body}
    ${hireFrom ? "" : !u.hero ? `<button class="btn ghost danger dt-dismiss" data-act="dismiss" data-arg="${u.id}">내보내기</button>` : ""}</div>
  </div>`;
  document.body.appendChild(m);
  // 좌우로 밀어서 이전·다음 동료
  if (!hireFrom && !u.hero && G.roster.includes(u)) {
    let sx = null, sy = 0;
    const sh = m.querySelector(".sheet");
    sh.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener("touchend", (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ACT.dtnav(`${u.id}:${dx < 0 ? 1 : -1}`);
    });
  }
}
function statBar(label, v, max, icon) { return `<div class="sbar"><span>${ic(icon, "sm")}${label}</span><div class="mbar"><i style="width:${Math.min(100, (v / max) * 100)}%"></i></div><b>${v}</b></div>`; }
function detailStats(u, d) {
  const top = Math.max(...STATS.map((k) => u.st[k]), 20);
  const reb = typeof canRebirth === "function" && G.bld.spring && G.roster.includes(u)
    ? (canRebirth(u) ? `<button class="btn gold wide" data-act="rebirth" data-arg="${u.id}">환생 · 금화 ${rebirthCost(u)}${u.reb ? ` · 현재 ${u.reb}회` : ""}</button>` : `<p class="dim">Lv20부터 윤회의 샘에서 환생할 수 있어요.${u.reb ? ` (환생 ${u.reb}회)` : ""}</p>`) : "";
  // 기본 능력 6칸(값·잠재력·막대), 전투 능력 10칸
  const tiles = STATS.map((k) => `<div class="st"><span>${STAT_NAME[k]}</span><em class="pot g${revealLevel(u, k) >= 2 ? u.pot[k] : "x"}">${potText(u, k).replace(/[()]/g, "")}</em><b>${u.st[k]}</b><div class="mbar"><i style="width:${(u.st[k] / top) * 100}%"></i></div></div>`).join("");
  const cb = [["HP", d.hp], ["공격", d.atk], ["마공", d.mag], ["회복", d.heal], ["방어", d.def], ["저항", d.res], ["속도", d.spd], ["회피", d.eva + "%"], ["치명", d.crit + "%"], ["명중", d.acc]].map(([n, v]) => `<div class="cbt"><span>${n}</span><b>${v}</b></div>`).join("");
  const bloom = revealLevel(u, "int") >= 3 || u.hero ? BLOOM[u.bloom].name : "???";
  return `<h4 class="sub">기본 능력 <small>개화 · ${bloom}</small></h4><div class="st-grid">${tiles}</div>
    ${heroU() && JOBS[heroU().job].tier === 0 && !u.hero ? `<p class="dim st-hint">세진의 「인물 파악」이 성장하면 잠재력이 보여요.</p>` : ""}
    <h4 class="sub">전투 능력</h4><div class="cb-grid">${cb}</div>${reb}`;
}
// 주인공 지휘 탭: 능력치·레벨 없이, 직업 단계에 따른 지휘 효과만
const HERO_PATH = [["stranger", "프롤로그"], ["tactician", "1장을 마치면"], ["strategist", "2장을 마치면"], ["lord", "3장을 마치면"], ["pioneer", "5장을 마치면"]];
function detailCommand(u) {
  const J = JOBS[u.job];
  const gauge = has({ skills: unitSkills(u).map((id) => ({ id })) }, "otherpanel") ? 11 : unitSkills(u).includes("rally") ? 10.5 : 8;
  const sk = unitSkills(u).map((id) => SKILLS[id]).filter(Boolean).map((s) => `<div class="skc"><b>${s.name}</b>${s.desc ? `<small>${s.desc}</small>` : ""}</div>`).join("");
  const path = HERO_PATH.map(([j, when]) => `<div class="hp-step ${j === u.job ? "now" : (u.jobs || []).includes(j) ? "done" : ""}"><b>${JOBS[j].name}</b><small>아군 +${Math.round(HERO_AURA[JOBS[j].tier] * 100)}% · ${when}</small></div>`).join("");
  return `<div class="cmd-sum"><div><small>아군 능력</small><b>+${Math.round(HERO_AURA[J.tier] * 100)}%</b></div><div><small>지휘 게이지</small><b>${Math.ceil(100 / gauge)}번 행동</b></div><div><small>지휘 명령</small><b>3가지</b></div></div>
    <h4 class="sub">지휘 명령 <small>게이지가 차면 전투 화면에서 고른다</small></h4>${Object.values(COMMANDS).map((c) => `<div class="skc"><b>${c.name}</b><small>${c.desc}</small></div>`).join("")}
    <h4 class="sub">익힌 지휘 기술</h4>${sk}
    <h4 class="sub">지휘관의 길 <small>이야기가 진행되면 오른다</small></h4><div class="hero-path">${path}</div>`;
}
function detailTraits(u) {
  const row = (kind, label) => { const t = traitOf(u, kind); return t ? `<div class="trait"><span class="tk">${label}</span><div><b>${t.name}</b><small>${t.desc}</small></div></div>` : ""; };
  return row("personality", "성격") + row("hobby", "취미") + row("origin", "출신") + row("quirk", "특이") || '<p class="dim">특성이 없어요.</p>';
}
// 무기 탭: 지금 무기 · 강화 · 무기고에서 바꾸기
function detailWeapon(u, hireFrom) {
  const w = u.weapon, kind = JOBS[u.job].weapon, cap = G.bld.smithy * 10;
  const cur = w ? `<div class="wcard"><div class="wcard-h">${weaponTag(w)}<b class="gname g${w.grade}">${esc(weaponLabel(w))}</b>${gradeTag(w.grade)}</div>
      <small>공격 ${Math.round(weaponAtk(u))}${weaponFits(u, w) ? "" : ` · <span class="neg">${JOBS[u.job].name}에게 맞지 않는 ${WEAPON_KIND[w.kind]} (힘 60%)</span>`}</small>
      ${hireFrom ? "" : `<button class="btn sm ghost" data-act="unequipw" data-arg="${u.id}">빼기</button>`}</div>`
    : `<div class="wcard"><b>맨손</b><small>${JOBS[u.job].name}은(는) ${WEAPON_KIND[kind]}을(를) 써요.</small></div>`;
  const fc = w ? forgeCost(u) : null;
  const forge = hireFrom || !w ? "" : !G.bld.smithy ? '<p class="dim">대장간을 지으면 강화할 수 있어요. +20, +40, +60에서 각성해 이름을 지을 수 있어요.</p>'
    : w.plus >= cap ? `<p class="dim">대장간 레벨을 올리면 더 강화할 수 있어요 (상한 +${cap}).</p>`
    : `<button class="btn gold wide" data-act="forge" data-arg="${u.id}">강화 +${w.plus + 1} · ${costText(fc)} · 성공 ${Math.round(forgeChance(u) * 100)}%</button>`;
  const arms = [...G.arms].sort((a, b) => (b.kind === kind) - (a.kind === kind) || weaponPow(b) - weaponPow(a));
  const list = hireFrom ? "" : `<h4 class="sub">무기고 <small>${G.arms.length}자루 · 맞는 종류가 위</small></h4><div class="warms">${arms.map((x) => {
    const fit = x.kind === kind, atk = Math.round(weaponPow(x) * (fit ? 1 : 0.6)), diff = atk - Math.round(weaponAtk(u));
    return `<button class="warm ${fit ? "" : "unfit"}" data-act="equipw" data-arg="${u.id}:${x.id}">${weaponTag(x)}<span><b class="gname g${x.grade}">${esc(weaponLabel(x))}</b><small>공격 ${atk} <span class="${diff >= 0 ? "pos" : "neg"}">(${diff >= 0 ? "+" : ""}${diff})</span>${fit ? "" : " · 맞지 않음"}</small></span></button>`;
  }).join("") || '<p class="dim">무기고가 비었어요. 마을 → 상점 → 무기에서 사거나, 전투에서 얻을 수 있어요.</p>'}</div>`;
  return cur + forge + list;
}
function detailGear(u, hireFrom) {
  const slot = (s, i) => {
    const cur = s === "armor" ? u.armor : u.acc[i];
    return `<button class="eq" ${hireFrom ? "disabled" : ""} data-act="equip" data-arg="${u.id}:${s}:${i}"><span>${itemIc(cur, s)}</span><div><b class="${cur ? "gname g" + itemGrade(ITEMS[cur]) : ""}">${cur ? ITEMS[cur].name : "비어 있음"}</b><small>${cur ? itemStatText(ITEMS[cur]) : s === "armor" ? "방어구" : "장신구"}</small></div></button>`;
  };
  return `<h4 class="sub">장비</h4><div class="eqs">${slot("armor", 0)}${slot("acc", 0)}${slot("acc", 1)}</div>`;
}
function detailSkills(u, hireFrom) {
  const J = JOBS[u.job];
  const sk = unitSkills(u).map((id) => { const s = SKILLS[id]; return `<div class="skc"><b>${s.name}</b><span class="tag ${s.kind === "passive" ? "" : "gold"}">${s.kind === "passive" ? "패시브" : `MP ${mpCost(s)} · 쿨 ${s.cd}`}</span>${s.desc ? `<small>${s.desc}</small>` : ""}</div>`; }).join("") || '<p class="dim">아직 익힌 기술이 없어요.</p>';
  const mana = `<div class="mp-info"><span>마나</span><b>최대 100 · 시작 50 · 매 턴 +${mpRegen(u)}</b><small>성향: ${MP_STYLE_NAME[mpStyle(u)]} — ${traitOf(u, "personality").name}</small></div>`;
  const nx = nextJobs(u);
  const shown = (j) => u.job !== "villager" || aptKnown(u);
  const promo = !nx.length || hireFrom ? "" : `<h4 class="sub">전직</h4><div class="promo">${nx.map((j) => {
    if (!shown(j)) return `<p class="dim">Lv3이 되면 이 사람의 적성이 드러나요.</p>`;
    const why = promoteBlock(u, j);
    return `<button class="btn ${why ? "" : "gold"}" ${why ? "disabled" : ""} data-act="promote" data-arg="${u.id}:${j}"><b>${JOBS[j].name}</b><small>${why ? why + " · " : ""}${JOBS[j].role} · ${JOBS[j].skills.map((s) => SKILLS[s].name).join(", ")}</small></button>`;
  }).join("")}</div>`;
  return mana + sk + promo;
}
// 전신 보기: 큰 그림 + 지나온 모습 썸네일
function showFullView(u, idx) {
  closeModal(true);
  const looks = lookHistory(u);
  if (idx == null) idx = Math.max(0, looks.findIndex((l) => l.now));
  const L = looks[idx];
  const m = document.createElement("div");
  m.className = "modal center"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "전신 보기");
  m.innerHTML = `<div class="sheet small fullview" style="--lc:${LINES[u.line].color}">
    <button class="x" data-act="${G.roster.includes(u) ? "detail" : "close"}" data-arg="${u.id}" aria-label="닫기">✕</button>
    <h2>${esc(u.name)} <small>${L ? L.label : ""}${L && L.now ? " · 지금" : ""}</small></h2>
    <div class="fv-stage">${L ? `<img class="spr" src="${ART[L.key]}" alt="">` : unitSprite(u)}</div>
    ${looks.length > 1 ? `<h4 class="sub">지나온 모습 <small>${idx + 1}/${looks.length}</small></h4><div class="fv-thumbs">${looks.map((l, i) => `<button class="fv-t ${i === idx ? "on" : ""}" data-act="fullpick" data-arg="${u.id}:${i}"><img class="spr" src="${ART[l.key]}" alt=""><small>${l.label}</small></button>`).join("")}</div>` : ""}
  </div>`;
  document.body.appendChild(m);
}
function closeModal(silent) { document.querySelectorAll(".modal").forEach((m) => m.remove()); }

function showEquipPicker(u, slot, i) {
  const own = Object.entries(G.inv).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].slot === slot);
  const m = document.createElement("div");
  m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "동료 상세");
  m.innerHTML = `<div class="sheet small"><button class="x" data-act="close">✕</button><h3 class="ptitle">${slot === "armor" ? "방어구" : "장신구"} 고르기</h3>
    <button class="btn wide" data-act="equipset" data-arg="${u.id}:${slot}:${i}:">빼기</button>
    ${own.map(([id, n]) => `<button class="btn wide" data-act="equipset" data-arg="${u.id}:${slot}:${i}:${id}">${ITEMS[id].name} ×${n} <small>${itemStatText(ITEMS[id])}</small></button>`).join("") || '<p class="dim">가진 장비가 없어요. 마을 → 상점에서 살 수 있어요.</p>'}</div>`;
  document.body.appendChild(m);
}

// ---------- 결과 ----------
function showResult(title, lines, buttons) {
  const m = document.createElement("div");
  m.className = "modal center";
  m.innerHTML = `<div class="sheet small result"><h2>${title}</h2>${lines.filter(Boolean).map((l) => `<p>${l}</p>`).join("")}<div class="rbtns">${buttons.map((b, i) => `<button data-ri="${i}" class="btn ${b.ghost ? "" : "gold"}">${b.label}</button>`).join("")}</div></div>`;
  document.body.appendChild(m);
  let timer = null;
  m.onclick = (e) => {
    const b = e.target.closest("[data-ri]");
    if (!b) return;
    clearInterval(timer);
    m.remove();
    buttons[+b.dataset.ri].fn();
  };
  // 전투 뒤 결과창: 자동 진행이 켜져 있으면 첫 버튼(계속 전진·확인)을 3초 뒤 저절로 누른다
  if (typeof BV !== "undefined" && BV.auto && document.querySelector(".battle")) {
    const first = m.querySelector('[data-ri="0"]');
    const label = first.textContent;
    let n = 3;
    first.textContent = `${label} (${n})`;
    timer = setInterval(() => {
      if (!m.isConnected) return clearInterval(timer);
      n--;
      if (n > 0) first.textContent = `${label} (${n})`;
      else { clearInterval(timer); first.click(); }
    }, 1000);
  }
}
function rewardLines(B, rw) {
  const out = [`${ic("lvup", "sm")} 경험치 +${rw.exp} (1인당) · ${ic("gold", "sm")} +${rw.gold}`];
  if (rw.drop) out.push(`<b class="gname g${rw.drop.grade}">전리품: ${esc(weaponLabel(rw.drop))}</b> <small>(${GRADE_NAME[rw.drop.grade]} · 무기고로)</small>`);
  if (rw.bench) out.push(`<small>마을에 남은 동료 경험치 +${rw.bench}</small>`);
  for (const u of G.roster) {
    if (rw.ups[u.id]) out.push(`<b class="up">▲ ${esc(u.name)} Lv${u.lv}</b>${canPromote(u) ? " · 전직 가능!" : ""}`);
  }
  if (rw.injured.length) out.push(`${ic("injury", "sm")} 부상: ${rw.injured.map((id) => esc(unitById(id).name)).join(", ")}`);
  return out;
}

// Keyboard activation follows the same click delegation as touch.
document.addEventListener("keydown", (e) => {
  const t = e.target.closest('[role="button"][data-act]');
  if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); t.click(); }
});
