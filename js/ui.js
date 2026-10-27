// 화면: 타이틀, 대화, 마을 허브(마을/동료/편성/원정), 동료 상세
"use strict";

const app = document.getElementById("app");
let TAB = "village";
let SUB = "build"; // 마을 탭 안의 하위 메뉴
let DTAB = "stat"; // 동료 상세 탭
let SEL = null; // 편성에서 고른 동료
let HUB_VIEW = ""; // Preserve scroll only while refreshing the same menu.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n)));
const sign = (v) => (v >= 0 ? "+" + v : String(v));

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
function ic(name, cls = "") {
  const [k, e] = ICON[name] || ["", name];
  if (typeof ART !== "undefined" && ART[k]) return `<img class="ic ${cls}" src="${ART[k]}" alt="">`;
  if (UI_GLYPHS[name]) return `<svg class="ic glyph ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${UI_GLYPHS[name]}"/></svg>`;
  return `<span class="ic ${cls}" aria-hidden="true">${e}</span>`;
}

function toast(msg) {
  const t = document.createElement("div");
  t.setAttribute("role", "status"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// 풍경(그림이 없을 때 CSS로 그리는 산과 하늘)
function scenery(kind) {
  const villageLv = Math.min(5, Math.max(1, G ? G.bld.hall : 1));
  const key = kind === "village" ? "village_" + villageLv : typeof ART !== "undefined" && ART["bg_" + kind] ? "bg_" + kind : kind;
  if (typeof ART !== "undefined" && ART[key]) return `<img class="scn-img" src="${ART[key]}" alt="">`;
  if (kind === "forest") return `<img class="scn-img forest-landscape" src="art/ui/forest-clearing.webp" alt="고요한 숲의 공터">`;
  if (kind === "village" || kind === "dusk") return `<img class="scn-img village-landscape" src="art/ui/lantern-village.webp" alt="등불이 켜진 산골 마을">`;
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
    </div>
    <p class="title-save">진행 상황은 이 기기에 자동 저장됩니다</p><p class="ver">CHAPTER 01 <span>◆</span> v0.2 · 체험판</p></div>`;
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
function speakerArt(who) {
  if (!G) return "";
  if (who === "세진") { const h = heroU(); return h ? unitSprite(h, "talk") : ""; }
  const u = G.roster.find((x) => x.name === who);
  return u ? unitSprite(u, "talk") : "";
}
function playScene(sc, done) {
  let i = 0;
  const art = sc.art && typeof ART !== "undefined" && ART[sc.art] ? `<img class="sc-art" src="${ART[sc.art]}" alt="">` : `<div class="sc-art">${scenery(sc.bg)}</div>`;
  app.innerHTML = `<div class="scene">${art}<div class="sc-who" id="scwho"></div><div class="sc-box" id="scbox"><div class="sc-name" id="scname"></div><div class="sc-text" id="sctext"></div><div class="sc-next">▼</div></div><button class="sc-skip" id="scskip">건너뛰기 ▶▶</button></div>`;
  const show = () => {
    const [who, text] = sc.lines[i];
    const inner = who.endsWith("(속)");
    const name = who === "*" || who === "" ? "" : who.replace("(속)", "");
    document.getElementById("scbox").className = "sc-box" + (who === "*" ? " sys" : who === "" ? " narr" : "");
    const nm = document.getElementById("scname");
    nm.textContent = name; nm.style.display = name ? "" : "none";
    const tx = document.getElementById("sctext");
    tx.textContent = inner ? `(${text})` : text;
    tx.classList.toggle("inner", inner);
    document.getElementById("scwho").innerHTML = name ? speakerArt(name) : "";
  };
  show();
  app.querySelector(".scene").onclick = (e) => {
    if (e.target.id === "scskip") { done(); return; }
    i++;
    if (i >= sc.lines.length) done(); else show();
  };
}

// ---------- 허브 ----------
function showHub() {
  if (!G.form.length) autoForm();
  const r = G.res, inc = dailyIncome();
  const soon = raidSoon(), tonight = raidTonight();
  const resNames = { gold: "금화", food: "식량", wood: "목재", stone: "석재" };
  const res = (k) => `<div class="res" aria-label="${resNames[k]} ${fmt(r[k])}, 하루 ${sign(inc[k])}"><span class="res-ic">${ic(k)}</span><span class="res-name">${resNames[k]}</span><b>${fmt(r[k])}</b><small class="${inc[k] < 0 ? "neg" : "pos"}">${sign(inc[k])}<span>/일</span></small></div>`;
  const view = TAB + (TAB === "village" ? ":" + SUB : "");
  const scroll = HUB_VIEW === view ? document.querySelector(".tab-body")?.scrollTop || 0 : 0;
  HUB_VIEW = view;
  app.innerHTML = `<div class="hub">
    <header class="banner-v">${scenery("village")}
      <div class="village-heading"><small>등불 영지</small><h1>${G.chapter ? "제" + G.chapter + "장 · 고블린의 숲" : "프롤로그"}</h1></div><div class="plaque"><b>${G.day}</b><span>일째</span></div>
      <div class="vstat"><span>${ic("pop")} 주민 <b>${G.pop}</b></span><span>${ic("morale")} 사기 <b>${G.morale}</b></span></div>
    </header>
    <div class="resbar">${res("gold")}${res("food")}${res("wood")}${res("stone")}</div>
    ${tonight ? `<div class="alert red">${ic("bell")} 오늘 밤 습격이 옵니다! 편성을 확인하세요.</div>` : soon ? `<div class="alert">${ic("bell")} 척후 보고: ${soon.day - G.day}일 뒤 밤, 몬스터 습격 (Lv${soon.lv} 정도)</div>` : ""}
    <main class="tab-body" aria-label="${({village:"마을 운영",party:"동료 목록",form:"출전 편성",expe:"원정 지도"})[TAB]}">${renderTab()}</main>
    <nav class="tabs" aria-label="주 메뉴">
      ${tabBtn("village", "마을")}${tabBtn("party", "동료")}
      <button data-act="endday" class="moon"><span class="moon-ic">${ic("moon")}</span><span>하루 마치기</span></button>
      ${tabBtn("form", "편성")}${tabBtn("expe", "원정")}
    </nav>
  </div>`;
  const tb = document.querySelector(".tab-body");
  if (tb) tb.scrollTop = scroll;
}
function tabBtn(k, n) { return `<button data-tab="${k}" aria-current="${TAB === k ? "page" : "false"}" class="${TAB === k ? "on" : ""}">${ic(k)}<span>${n}</span></button>`; }

function renderTab() {
  if (TAB === "village") return renderVillage();
  if (TAB === "party") return renderParty();
  if (TAB === "form") return renderForm();
  if (TAB === "expe") return renderExpe();
  return "";
}

function panel(title, body, extra = "") { return `<section class="panel"><h3 class="ptitle">${title}${extra ? `<small>${extra}</small>` : ""}</h3>${body}</section>`; }

function renderVillage() {
  const goal = G.chapter === 1 && !G.flags.ch1clear ? `<div class="goal">${ic("quest")}<div><span class="eyebrow">현재 목표</span><b>고블린 왕 토벌</b><small>30일째까지 · ${Math.max(0, 31 - G.day)}일 남음</small>${G.seen.tax && !G.seen.taxdone ? `<small>세금 💰150 · 20일째까지</small>` : ""}</div></div>` : "";
  const subs = [["build", "건설", "build"], ["work", "일꾼", "worker"], ["recruit", "모집", "recruit"], ["shop", "상점", "shop"], ["log", "기록", "log"]];
  const seg = `<div class="seg village-seg">${subs.map(([k, n, i]) => `<button data-act="sub" aria-pressed="${SUB === k}" data-arg="${k}" class="${SUB === k ? "on" : ""}">${ic(i, "sm")}${n}</button>`).join("")}</div>`;
  let body = "";
  if (SUB === "build") body = renderBuild();
  if (SUB === "work") body = renderWork();
  if (SUB === "recruit") body = renderRecruit();
  if (SUB === "shop") body = renderShop();
  if (SUB === "log") body = panel("마을 기록", `<div class="log">${G.log.slice(0, 20).map((l) => `<p><small>${l.d}일</small>${esc(l.m)}</p>`).join("") || `<p class="dim">아직 기록이 없어요.</p>`}</div>`);
  return seg + goal + body;
}

function uiCost(cost) {
  return Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => `<span class="cost-part ${G.res[k] < v ? "neg" : ""}">${ic(k, "sm")}${fmt(v)}</span>`).join("");
}
function buildingGlyph(id) {
  const symbol = {hall:"village",palisade:"party",lodging:"village",farm:"food",lumber:"wood",quarry:"stone",guild:"quest",barracks:"form",smithy:"build",church:"lantern",tavern:"shop"}[id];
  return `<div class="bld-crest bld-${id}">${ic(symbol)}</div>`;
}
function renderBuild() {
  const tiles = Object.entries(BUILDINGS).map(([id, b]) => {
    const lv = G.bld[id];
    const why = canBuild(id);
    const max = lv >= b.max;
    const pips = Array.from({ length: b.max }, (_, i) => `<i class="${i < lv ? "on" : ""}"></i>`).join("");
    const art = typeof ART !== "undefined" && ART[`bld_${id}_${Math.max(1, lv)}`] ? `<img src="${ART[`bld_${id}_${Math.max(1, lv)}`]}" alt="">` : `<span>${buildingGlyph(id)}</span>`;
    return `<div class="tile ${lv ? "" : "unbuilt"} ${!why ? "ready" : ""}">
      <div class="tile-art">${art}</div>
      <div class="tile-info"><div class="tile-heading"><b>${b.name}</b><span class="tile-level">${lv ? "Lv." + lv : "미건설"}</span></div><div class="pips" aria-hidden="true">${pips}</div><p>${b.desc}</p></div>
      <div class="tile-action">${max ? `<div class="tile-max">최대 레벨</div>` : `<div class="cost">${uiCost(buildCost(id))}</div><button class="btn sm ${why ? "" : "gold"}" data-act="build" data-arg="${id}" ${why ? "disabled" : ""} aria-label="${b.name} ${lv ? "증축" : "건설"}">${lv ? "증축" : "건설"}</button>`}</div>
      ${why && why !== "자원 부족" && !max ? `<small class="why">${why}</small>` : ""}
    </div>`;
  }).join("");
  return panel("건물", `<div class="tiles">${tiles}</div>`, "하루에 한 번 공사");
}

function renderWork() {
  const inc = dailyIncome();
  const rows = [["farm", "농장", "food"], ["lumber", "벌목장", "wood"], ["quarry", "채석장", "stone"]].map(([k, n, r]) => `
    <div class="wk"><span class="wk-ic">${ic(r)}</span><div class="wk-tx"><b>${n}</b><small>${G.bld[k] ? `1명당 +${1 + G.bld[k]} / 일` : "건물이 없어요"}</small></div>
      <button class="btn sm" data-act="wk" data-arg="${k}:-1">−</button><b class="wk-n">${G.workers[k]}<small>/${workerCap(k)}</small></b><button class="btn sm" data-act="wk" data-arg="${k}:1" ${!G.bld[k] ? "disabled" : ""}>＋</button></div>`).join("");
  return panel("일꾼 배치", `${rows}<div class="wk-sum">남는 마을 사람 <b>${freeVillagers()}</b>명 · 식량 ${sign(inc.food)}/일</div>`);
}

function renderRecruit() {
  const offers = G.bld.guild ? G.offers.map((u, i) => recruitCard(u, "guild", i)).join("") || `<p class="dim">오늘은 찾아온 모험가가 없어요. 3일마다 새로 와요.</p>` : `<p class="dim">모험가 길드를 지으면 모험가를 고용할 수 있어요.</p>`;
  const volReady = G.day - G.volDay >= 4;
  const vols = G.volunteers.map((u, i) => recruitCard(u, "vol", i)).join("");
  return panel("모험가 길드", offers, `${G.roster.length}/${rosterCap()}명`) +
    panel("마을 자원자", vols || (volReady ? `<button class="btn" data-act="vol">자원자 찾기</button>` : `<p class="dim">${4 - (G.day - G.volDay)}일 뒤 다시 찾을 수 있어요.</p>`), "평민 · 무료 · 잠재력 제각각") +
    (G.bld.barracks ? panel("병영", `<button class="btn" data-act="barracks">창병 모집 · 💰20 · 마을 사람 1명</button>`) : "");
}
function recruitCard(u, from, i) {
  return `<div class="rc" role="group" data-act="peek" data-arg="${from}:${i}"><div class="por" style="--lc:${LINES[u.line].color}">${unitSprite(u, "mini")}</div>
    <div class="rc-tx"><b>${esc(u.name)}</b><small>${u.race} · ${JOBS[u.job].name} Lv${u.lv}</small>
    <div class="tags"><span class="tag">${traitOf(u, "personality").name}</span><span class="tag">${traitOf(u, "hobby").name}</span>${u.traits.quirk ? `<span class="tag gold">${traitOf(u, "quirk").name}</span>` : ""}</div>
    <small>고용 💰${u.price} · 일당 ${u.wage}</small></div>
    <button class="btn sm gold" data-act="hire" data-arg="${from}:${i}">고용</button></div>`;
}

function renderShop() {
  const items = Object.entries(ITEMS).filter(([, it]) => it.price && it.price <= 80 + G.bld.hall * 60).map(([id, it]) => `
    <div class="shop-it"><span class="shop-ic">${ic(it.slot === "armor" ? "armor" : "ring")}</span><div><b>${it.name}</b><small>${itemStatText(it)}</small></div><small class="own">보유 ${G.inv[id] || 0}</small><button class="btn sm" data-act="buy" data-arg="${id}">💰${it.price}</button></div>`).join("");
  return panel("떠돌이 상인", items, "촌장의 집 레벨이 오르면 품목이 늘어요");
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
  const cards = G.roster.map((u) => {
    const st = u.injured ? `<span class="tag red">${ic("injury", "sm")}부상 ${u.injured}일</span>` : u.fatigue >= 3 ? `<span class="tag">${ic("tired", "sm")}지침</span>` : "";
    const promo = canPromote(u) ? `<span class="tag gold">${ic("lvup", "sm")}전직</span>` : "";
    return `<div class="cc" role="button" tabindex="0" data-act="detail" data-arg="${u.id}">
      <div class="cc-art" style="--lc:${LINES[u.line].color}">${unitSprite(u)}<span class="lv">Lv${u.lv}</span></div>
      <div class="cc-tx"><b>${esc(u.name)}</b><small>${JOBS[u.job].name}</small>
      <div class="mbar xp"><i style="width:${(u.exp / expNeed(u.lv)) * 100}%"></i></div>
      <div class="tags">${st}${promo}</div><small class="pw">전투력 ${fmt(power(u))}</small></div></div>`;
  }).join("");
  return panel("동료", `<div class="cards">${cards}</div>`, `${G.roster.length}/${rosterCap()}명`);
}

function renderForm() {
  const at = (col, lane) => G.form.find((f) => f.col === col && f.lane === lane);
  let grid = "";
  for (let lane = 0; lane < 5; lane++) {
    for (const col of [1, 0]) {
      const f = at(col, lane);
      const u = f && unitById(f.id);
      grid += `<div role="button" tabindex="0" aria-label="${col === 0 ? '전열' : '후열'} ${lane + 1}줄 ${u ? esc(u.name) : '빈 칸'}" class="cell ${col === 0 ? "front" : "back"} ${u && SEL === u.id ? "sel" : ""} ${u ? "full" : ""}" data-act="cell" data-arg="${col}:${lane}">${u ? `<div class="cell-u">${unitSprite(u)}</div><small>${esc(u.name)}</small>${u.injured ? `<em>${ic("injury", "sm")}</em>` : ""}` : `<span class="plus">＋</span>`}</div>`;
    }
  }
  const bench = G.roster.filter((u) => !G.form.some((f) => f.id === u.id)).map((u) => `<button class="bc ${SEL === u.id ? "on" : ""}" data-act="pickunit" data-arg="${u.id}"><div class="bc-art" style="--lc:${LINES[u.line].color}">${unitSprite(u)}</div><b>${esc(u.name)}</b><small>${JOBS[u.job].name} ${u.lv}</small></button>`).join("");
  const tp = formUnits().reduce((a, f) => a + power(f.unit), 0);
  return panel("편성", `
    <div class="fwrap"><div class="fgrid"><div class="fh">후열</div><div class="fh">전열 ▶ 적</div>${grid}</div></div>
    <p class="hint">${SEL ? "놓을 칸을 누르세요. 같은 칸을 다시 누르면 편성에서 빠져요." : "칸을 눌러 동료를 고른 뒤 다른 칸을 누르면 옮겨요. 근접 직업은 전열에서만 공격해요. 「수호」 직업은 같은 줄 후열을 지켜요."}</p>
    <h4 class="sub">대기 중</h4><div class="bench">${bench || '<p class="dim">대기 중인 동료가 없어요.</p>'}</div>`, `${G.form.length}/5명 · 전투력 ${fmt(tp)}`);
}

function renderExpe() {
  const tp = formUnits().reduce((a, f) => a + power(f.unit), 0);
  return Object.entries(DUNGEONS).map(([id, d]) => {
    const cleared = G.dungeon[id] || 0;
    const nodes = d.floors.map((f, i) => {
      const lock = i > cleared;
      const lv = f.boss ? f.lv + 3 : f.lv + 1;
      return `<button class="node ${lock ? "lock" : i < cleared ? "done" : "next"} ${f.boss ? "boss" : ""}" data-act="expe" data-arg="${id}:${i}" ${lock ? "disabled" : ""}>
        <span class="node-ic">${lock ? ic("lock", "sm") : f.boss ? ic("boss") : i + 1}</span><small>Lv${lv}</small></button>`;
    }).join(`<i class="path"></i>`);
    return `<section class="dun"><div class="dun-art">${scenery(d.bg)}<h3>${d.name}</h3></div>
      <div class="nodes">${nodes}</div>
      <p class="hint">원정은 하루가 걸려요. 일반 층은 3연전(체력 유지), 보스 층은 1전. 전투 사이에 돌아올 수 있어요.</p></section>`;
  }).join("") + panel("출전 파티", `<div class="mini-party">${formUnits().map((f) => `<div class="mp"><div class="mp-art" style="--lc:${LINES[f.unit.line].color}">${unitSprite(f.unit)}</div><small>${esc(f.unit.name)} ${f.unit.lv}${f.unit.fatigue >= 3 ? " 💤" : ""}</small></div>`).join("") || '<p class="dim">편성된 동료가 없어요.</p>'}</div>`, `전투력 ${fmt(tp)}`);
}

// ---------- 동료 상세 ----------
function showDetail(u, hireFrom) {
  closeModal(true);
  const d = derived(u);
  const J = JOBS[u.job];
  const m = document.createElement("div");
  m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "동료 상세");
  m.dataset.uid = u.id;
  const tabs = [["stat", "능력"], ["trait", "특성"], ["gear", "장비"], ["skill", "기술"]];
  const body = DTAB === "stat" ? detailStats(u, d) : DTAB === "trait" ? detailTraits(u) : DTAB === "gear" ? detailGear(u, hireFrom) : detailSkills(u, hireFrom);
  m.innerHTML = `<div class="sheet">
    <div class="dt-hero" style="--lc:${LINES[u.line].color}">
      <button class="x" data-act="close">✕</button>
      <div class="dt-art">${unitSprite(u)}</div>
      <div class="dt-id"><h2>${esc(u.name)}</h2><p>${u.race} · ${u.gender === "m" ? "남" : "여"}</p>
        <div class="job">${J.name}<small>${J.role}</small></div>
        <p class="lvl">Lv <b>${u.lv}</b> <small>${u.exp}/${expNeed(u.lv)}</small></p><div class="mbar xp"><i style="width:${(u.exp / expNeed(u.lv)) * 100}%"></i></div>
        <small>전투력 ${fmt(power(u))} · 전투 ${u.battles} · 처치 ${u.kills}</small></div>
    </div>
    <div class="seg dseg">${tabs.map(([k, n]) => `<button data-act="dtab" data-arg="${k}:${u.id}${hireFrom ? ":" + hireFrom : ""}" class="${DTAB === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="dt-body">${body}</div>
    ${hireFrom ? "" : !u.hero ? `<button class="btn ghost danger" data-act="dismiss" data-arg="${u.id}">내보내기</button>` : ""}
  </div>`;
  document.body.appendChild(m);
}
function statBar(label, v, max, icon) { return `<div class="sbar"><span>${ic(icon, "sm")}${label}</span><div class="mbar"><i style="width:${Math.min(100, (v / max) * 100)}%"></i></div><b>${v}</b></div>`; }
function detailStats(u, d) {
  const top = Math.max(...STATS.map((k) => u.st[k]), 20);
  const rows = STATS.map((k) => `<div class="srow"><span>${STAT_NAME[k]}</span><div class="mbar"><i style="width:${(u.st[k] / top) * 100}%"></i></div><b>${u.st[k]}</b><span class="pot g${revealLevel(u, k) >= 2 ? u.pot[k] : "x"}">${potText(u, k)}</span></div>`).join("");
  const big = Math.max(d.atk, d.mag, d.heal, d.def, 30);
  return `<h4 class="sub">기본 능력 <small>잠재력</small></h4>${rows}
    <p class="dim">개화: ${revealLevel(u, "int") >= 3 || u.hero ? BLOOM[u.bloom].name : "???"}${heroU() && JOBS[heroU().job].tier === 0 && !u.hero ? " · 세진의 「인물 파악」이 성장하면 잠재력이 보여요." : ""}</p>
    <h4 class="sub">전투 능력</h4>
    ${statBar("HP", d.hp, Math.max(d.hp, 200), "hp")}${statBar("공격", d.atk, big, "atk")}${statBar("마공", d.mag, big, "mag")}${statBar("회복", d.heal, big, "mag")}${statBar("방어", d.def, big, "def")}${statBar("저항", d.res, big, "def")}
    <div class="minis"><span>${ic("spd", "sm")}속도 ${d.spd}</span><span>회피 ${d.eva}%</span><span>치명 ${d.crit}%</span><span>명중 ${d.acc}</span></div>`;
}
function detailTraits(u) {
  const row = (kind, label) => { const t = traitOf(u, kind); return t ? `<div class="trait"><span class="tk">${label}</span><div><b>${t.name}</b><small>${t.desc}</small></div></div>` : ""; };
  return row("personality", "성격") + row("hobby", "취미") + row("origin", "출신") + row("quirk", "특이") || '<p class="dim">특성이 없어요.</p>';
}
function detailGear(u, hireFrom) {
  const fc = forgeCost(u);
  const cap = G.bld.smithy * 10;
  const slot = (s, i) => {
    const cur = s === "armor" ? u.armor : u.acc[i];
    return `<button class="eq" ${hireFrom ? "disabled" : ""} data-act="equip" data-arg="${u.id}:${s}:${i}"><span>${ic(s === "armor" ? "armor" : "ring")}</span><div><b>${cur ? ITEMS[cur].name : "비어 있음"}</b><small>${cur ? itemStatText(ITEMS[cur]) : s === "armor" ? "방어구" : "장신구"}</small></div></button>`;
  };
  return `<div class="wpn"><div class="wpn-ic">${ic("weapon")}</div><div><b>${esc(weaponName(u))}</b><small>무기 공격 ${Math.round(weaponAtk(u))} · 이 동료만의 무기예요. 전직하면 같은 문양으로 다시 벼려져요.</small></div></div>
    ${hireFrom ? "" : G.bld.smithy ? (u.weapon.plus >= cap ? `<p class="dim">대장간 레벨을 올리면 더 강화할 수 있어요 (상한 +${cap}).</p>` : `<button class="btn gold wide" data-act="forge" data-arg="${u.id}">${ic("forge", "sm")} 강화 +${u.weapon.plus + 1} · ${costText(fc)} · 성공 ${Math.round(forgeChance(u) * 100)}%</button>`) : '<p class="dim">대장간을 지으면 강화할 수 있어요. +20, +40, +60에서 각성해 이름을 지을 수 있어요.</p>'}
    <h4 class="sub">장비</h4><div class="eqs">${slot("armor", 0)}${slot("acc", 0)}${slot("acc", 1)}</div>`;
}
function detailSkills(u, hireFrom) {
  const J = JOBS[u.job];
  const sk = unitSkills(u).map((id) => { const s = SKILLS[id]; return `<div class="skc"><b>${s.name}</b><span class="tag ${s.kind === "passive" ? "" : "gold"}">${s.kind === "passive" ? "패시브" : "쿨 " + s.cd}</span>${s.desc ? `<small>${s.desc}</small>` : ""}</div>`; }).join("") || '<p class="dim">아직 익힌 기술이 없어요.</p>';
  const promo = canPromote(u) && !hireFrom ? `<h4 class="sub">전직</h4><div class="promo">${J.next.map((j) => `<button class="btn gold" data-act="promote" data-arg="${u.id}:${j}"><b>${JOBS[j].name}</b><small>${JOBS[j].role} · ${JOBS[j].skills.map((s) => SKILLS[s].name).join(", ")}</small></button>`).join("")}</div>` : J.next.length ? `<p class="dim">Lv${J.lv}에 전직: ${J.next.map((j) => JOBS[j].name).join(" / ")}</p>` : "";
  return sk + promo;
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
  m.onclick = (e) => {
    const b = e.target.closest("[data-ri]");
    if (!b) return;
    m.remove();
    buttons[+b.dataset.ri].fn();
  };
}
function rewardLines(B, rw) {
  const out = [`${ic("lvup", "sm")} 경험치 +${rw.exp} (1인당) · ${ic("gold", "sm")} +${rw.gold}`];
  for (const c of B.units.filter((x) => x.side === "A")) {
    const u = c.unit;
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
