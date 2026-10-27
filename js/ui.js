// 화면: 타이틀, 대화, 마을 허브(마을/동료/편성/원정), 동료 상세
"use strict";

const app = document.getElementById("app");
let TAB = "village";
let SEL = null; // 편성에서 고른 동료

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n)));

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// ---------- 타이틀 ----------
function showTitle() {
  const titleArt = typeof ART !== "undefined" && ART.story_08_title ? `<img class="title-art" src="${ART.story_08_title}" alt="">` : `<div class="title-art ph-title">🏮</div>`;
  app.innerHTML = `<div class="title">${titleArt}
    <h1>등불 영지</h1><h2>이계의 영주</h2>
    <div class="title-btns">
      ${hasSave() ? `<button class="big" data-act="continue">이어하기</button>` : ""}
      <button class="big ${hasSave() ? "ghost" : ""}" data-act="newgame">새 게임</button>
    </div>
    <p class="ver">v0.1 · 1장 체험판</p></div>`;
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
function playScene(sc, done) {
  let i = 0;
  const art = sc.art && typeof ART !== "undefined" && ART[sc.art] ? `<img class="sc-art" src="${ART[sc.art]}" alt="">` : "";
  app.innerHTML = `<div class="scene bg-${sc.bg}">${art}<div class="sc-box" id="scbox"><div class="sc-name" id="scname"></div><div class="sc-text" id="sctext"></div><div class="sc-next">▼</div></div><button class="sc-skip" id="scskip">건너뛰기</button></div>`;
  const show = () => {
    const [who, text] = sc.lines[i];
    const box = document.getElementById("scbox");
    box.className = "sc-box" + (who === "*" ? " sys" : who === "" ? " narr" : "");
    const inner = who.endsWith("(속)");
    document.getElementById("scname").textContent = who === "*" || who === "" ? "" : inner ? who.replace("(속)", "") : who;
    const tx = document.getElementById("sctext");
    tx.textContent = inner ? `(${text})` : text;
    tx.classList.toggle("inner", inner);
  };
  show();
  const root = app.querySelector(".scene");
  root.onclick = (e) => {
    if (e.target.id === "scskip") { done(); return; }
    i++;
    if (i >= sc.lines.length) done(); else show();
  };
}

// ---------- 허브 ----------
function showHub() {
  if (!G.form.length) autoForm();
  const r = G.res, inc = dailyIncome();
  const soon = raidSoon();
  const sign = (v) => (v >= 0 ? "+" + v : v);
  app.innerHTML = `<div class="hub">
    <header class="hud">
      <div class="hud-row"><b>${G.day}일째</b><span>${G.chapter ? G.chapter + "장" : "프롤로그"}</span><span class="mor">사기 ${G.morale}</span><span>👥 ${G.pop}</span></div>
      <div class="hud-row res">
        <span>💰${fmt(r.gold)}<small>${sign(inc.gold)}</small></span><span>🍞${fmt(r.food)}<small class="${inc.food < 0 ? "neg" : ""}">${sign(inc.food)}</small></span>
        <span>🪵${fmt(r.wood)}<small>${sign(inc.wood)}</small></span><span>🪨${fmt(r.stone)}<small>${sign(inc.stone)}</small></span>
      </div>
      ${soon ? `<div class="warn">⚠ 척후 보고: ${soon.day - G.day === 0 ? "오늘 밤" : soon.day - G.day + "일 뒤 밤"} 몬스터 습격 (Lv${soon.lv} 정도)</div>` : ""}
      ${raidTonight() ? `<div class="warn red">⚠ 오늘 밤 습격이 옵니다! 편성을 확인하세요.</div>` : ""}
    </header>
    <main class="tab-body">${renderTab()}</main>
    <nav class="tabs">
      ${[["village", "🏘️", "마을"], ["party", "🧑‍🤝‍🧑", "동료"], ["form", "⚔️", "편성"], ["expe", "🗺️", "원정"]].map(([k, ic, n]) => `<button data-tab="${k}" class="${TAB === k ? "on" : ""}">${ic}<span>${n}</span></button>`).join("")}
      <button data-act="endday" class="endday">🌙<span>하루 마치기</span></button>
    </nav>
  </div>`;
}

function renderTab() {
  if (TAB === "village") return renderVillage();
  if (TAB === "party") return renderParty();
  if (TAB === "form") return renderForm();
  if (TAB === "expe") return renderExpe();
  return "";
}

function renderVillage() {
  const goal = G.chapter === 1 && !G.flags.ch1clear ? `<div class="card goal">🎯 1장 목표: 30일째까지 고블린 왕 토벌 <small>(${Math.max(0, 30 - G.day + 1)}일 남음)</small>${G.seen.tax && !G.seen.taxdone ? `<br>💰 세금 150 — 20일째까지` : ""}</div>` : "";
  const blds = Object.entries(BUILDINGS).map(([id, b]) => {
    const lv = G.bld[id];
    const why = canBuild(id);
    const max = lv >= b.max;
    return `<div class="bld ${lv ? "" : "off"}"><div class="bld-ic">${b.icon}</div><div class="bld-tx"><b>${b.name}</b> <small>Lv${lv}</small><p>${b.desc}</p>${max ? "" : `<p class="cost">${costText(buildCost(id))}${why && why !== "자원 부족" ? ` · <span class="red">${why}</span>` : ""}</p>`}</div>
      ${max ? "" : `<button data-act="build" data-arg="${id}" ${why ? "disabled" : ""} title="${why || ""}">${lv ? "증축" : "건설"}</button>`}</div>`;
  }).join("");
  const wk = [["farm", "🌾 농장", "food"], ["lumber", "🪓 벌목장", "wood"], ["quarry", "⛏️ 채석장", "stone"]].map(([k, n]) => `
    <div class="wk"><span>${n}</span><button data-act="wk" data-arg="${k}:-1">−</button><b>${G.workers[k]}</b>/<small>${workerCap(k)}</small><button data-act="wk" data-arg="${k}:1" ${!G.bld[k] ? "disabled" : ""}>＋</button></div>`).join("");
  const offers = G.bld.guild ? G.offers.map((u, i) => recruitCard(u, "guild", i)).join("") || `<p class="dim">오늘은 찾아온 모험가가 없어요. (3일마다 새로 와요)</p>` : `<p class="dim">모험가 길드를 지으면 모험가를 고용할 수 있어요.</p>`;
  const volReady = G.day - G.volDay >= 4;
  const vols = G.volunteers.map((u, i) => recruitCard(u, "vol", i)).join("");
  const shop = Object.entries(ITEMS).filter(([, it]) => it.price && it.price <= 80 + G.bld.hall * 60).map(([id, it]) => `<div class="shop-it"><span>${it.name}</span><small>${itemStatText(it)}</small><button data-act="buy" data-arg="${id}">💰${it.price}</button></div>`).join("");
  return `${goal}
    <section><h3>건물 <small>(하루에 한 번 공사)</small></h3>${blds}</section>
    <section><h3>일꾼 배치 <small>남는 사람 ${freeVillagers()}</small></h3>${wk}</section>
    <section><h3>동료 모집 <small>${G.roster.length}/${rosterCap()}명</small></h3>
      <h4>📜 모험가 길드</h4>${offers}
      <h4>🙋 마을 자원자 <small>(평민, 무료, 잠재력은 제각각)</small></h4>${vols || (volReady ? `<button data-act="vol">자원자 찾기</button>` : `<p class="dim">${4 - (G.day - G.volDay)}일 뒤 다시 찾을 수 있어요.</p>`)}
      ${G.bld.barracks ? `<h4>🛡️ 병영</h4><button data-act="barracks">창병 모집 (💰20, 마을 사람 1명)</button>` : ""}
    </section>
    <section><h3>상점</h3>${shop}</section>
    <section><h3>기록</h3><div class="log">${G.log.slice(0, 10).map((l) => `<p><small>${l.d}일</small> ${esc(l.m)}</p>`).join("") || `<p class="dim">아직 기록이 없어요.</p>`}</div></section>`;
}
function itemStatText(it) {
  const n = { atk: "공격", mag: "마공", def: "방어", res: "저항", hp: "HP", eva: "회피", crit: "치명", spd: "속도" };
  return Object.entries(it).filter(([k]) => n[k]).map(([k, v]) => `${n[k]}${v > 0 ? "+" : ""}${v}`).join(" ");
}
function recruitCard(u, from, i) {
  return `<div class="rc" data-act="peek" data-arg="${from}:${i}">${unitSprite(u, "mini")}<div><b>${esc(u.name)}</b> <small>${u.race} · ${JOBS[u.job].name} Lv${u.lv}</small>
    <p>${traitOf(u, "personality").name} · ${traitOf(u, "hobby").name}${u.traits.quirk ? " · ✨" + traitOf(u, "quirk").name : ""}</p>
    <p class="dim">고용 💰${u.price} · 일당 ${u.wage}</p></div><button data-act="hire" data-arg="${from}:${i}">고용</button></div>`;
}

function renderParty() {
  return `<section><h3>동료 <small>${G.roster.length}/${rosterCap()}</small></h3>${G.roster.map((u) => {
    const d = derived(u);
    const st = u.injured ? `<span class="tag red">부상 ${u.injured}일</span>` : u.fatigue >= 3 ? `<span class="tag">지침</span>` : "";
    const promo = canPromote(u) ? `<span class="tag gold">전직 가능</span>` : "";
    return `<div class="pc" data-act="detail" data-arg="${u.id}">${unitSprite(u, "mini")}<div class="pc-tx"><b>${esc(u.name)}</b> ${st}${promo}<br><small>${JOBS[u.job].name} Lv${u.lv} · 전투력 ${fmt(power(u))}</small>
      <div class="bar"><i style="width:${(u.exp / expNeed(u.lv)) * 100}%"></i></div><small class="dim">HP ${d.hp} · 공 ${Math.max(d.atk, d.mag)} · 방 ${d.def} · 속 ${d.spd}</small></div></div>`;
  }).join("")}</section>`;
}

function renderForm() {
  const at = (col, lane) => G.form.find((f) => f.col === col && f.lane === lane);
  let grid = "";
  for (let lane = 0; lane < 5; lane++) {
    for (const col of [1, 0]) {
      const f = at(col, lane);
      const u = f && unitById(f.id);
      grid += `<div class="cell ${col === 0 ? "front" : "back"} ${u && SEL === u.id ? "sel" : ""}" data-act="cell" data-arg="${col}:${lane}">${u ? unitSprite(u, "mini") + `<small>${esc(u.name)}</small>${u.injured ? '<em class="red">부상</em>' : ""}` : ""}</div>`;
    }
  }
  const bench = G.roster.filter((u) => !G.form.some((f) => f.id === u.id)).map((u) => `<button class="chip ${SEL === u.id ? "on" : ""}" data-act="pickunit" data-arg="${u.id}">${esc(u.name)} <small>${JOBS[u.job].name} Lv${u.lv}${u.injured ? " · 부상" : ""}</small></button>`).join("");
  return `<section><h3>편성 <small>${G.form.length}/5명</small></h3>
    <p class="dim">왼쪽 열이 후열, 오른쪽 열이 전열이에요(적은 오른쪽에서 와요). 근접 직업이 후열에 서면 공격하지 못해요. 기사·방진병 같은 "수호" 직업은 같은 줄 후열 아군을 지켜줘요.</p>
    <div class="fgrid"><div class="fh">후열</div><div class="fh">전열</div>${grid}</div>
    <p class="dim">${SEL ? "놓을 칸을 누르세요. 같은 동료를 다시 누르면 선택이 풀려요." : "칸을 누르면 그 동료를 빼거나 옮길 수 있어요. 아래에서 동료를 골라 빈 칸에 넣으세요."}</p>
    <div class="bench">${bench || '<p class="dim">대기 중인 동료가 없어요.</p>'}</div></section>`;
}

function renderExpe() {
  return Object.entries(DUNGEONS).map(([id, d]) => {
    const cleared = G.dungeon[id] || 0;
    const floors = d.floors.map((f, i) => {
      const lock = i > cleared;
      const lv = f.boss ? f.lv + 3 : f.lv + 1;
      return `<button class="floor ${lock ? "lock" : ""} ${f.boss ? "boss" : ""}" data-act="expe" data-arg="${id}:${i}" ${lock ? "disabled" : ""}>${f.boss ? "👑 보스" : i + 1 + "층"}<small>권장 Lv${lv}</small>${i < cleared ? "<em>✔</em>" : ""}</button>`;
    }).join("");
    return `<section><h3>${d.name}</h3><p class="dim">원정은 하루가 걸려요. 일반 층은 3번 연속 전투(체력 유지), 보스 층은 1번이에요. 전투 사이에 돌아올 수 있어요.</p><div class="floors">${floors}</div></section>`;
  }).join("") + `<section><h3>출전 파티</h3>${formUnits().map((f) => `<span class="chip">${esc(f.unit.name)} Lv${f.unit.lv}${f.unit.fatigue >= 3 ? " (지침)" : ""}</span>`).join("") || '<p class="dim">편성된 동료가 없어요.</p>'}</section>`;
}

// ---------- 동료 상세 ----------
function showDetail(u, hireFrom) {
  const d = derived(u);
  const J = JOBS[u.job];
  const traitRow = (kind, label) => { const t = traitOf(u, kind); return t ? `<div class="tr"><b>${label}</b> ${t.name}<small>${t.desc}</small></div>` : ""; };
  const stats = STATS.map((k) => `<tr><td>${STAT_NAME[k]}</td><td>${u.st[k]}</td><td class="pot g${revealLevel(u, k) >= 2 ? u.pot[k] : "x"}">${potText(u, k)}</td></tr>`).join("");
  const skills = unitSkills(u).map((id) => { const s = SKILLS[id]; return `<div class="sk"><b>${s.name}</b> <small>${s.kind === "passive" ? "패시브" : "쿨 " + s.cd}</small>${s.desc ? `<small>${s.desc}</small>` : ""}</div>`; }).join("") || '<p class="dim">아직 익힌 기술이 없어요.</p>';
  const fc = forgeCost(u);
  const forgeCap = G.bld.smithy * 10;
  const promo = canPromote(u) ? J.next.map((j) => `<button data-act="promote" data-arg="${u.id}:${j}">${JOBS[j].name}<small>${JOBS[j].role}</small></button>`).join("") : "";
  const slotBtn = (slot, i) => {
    const cur = slot === "armor" ? u.armor : u.acc[i];
    return `<button class="eq" data-act="equip" data-arg="${u.id}:${slot}:${i}">${slot === "armor" ? "🥋" : "💍"} ${cur ? ITEMS[cur].name : "비어 있음"}</button>`;
  };
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="sheet">
    <button class="x" data-act="close">✕</button>
    <div class="dt-top">${unitSprite(u, "big")}<div><h2>${esc(u.name)}</h2><p>${u.race} · ${u.gender === "m" ? "남" : "여"} · ${J.name} <small>(${J.role})</small></p>
      <p>Lv ${u.lv} <small>경험치 ${u.exp}/${expNeed(u.lv)}</small></p><div class="bar"><i style="width:${(u.exp / expNeed(u.lv)) * 100}%"></i></div>
      <p class="dim">개화: ${revealLevel(u, "int") >= 3 || u.hero ? BLOOM[u.bloom].name : "???"} · 전투 ${u.battles} · 처치 ${u.kills}</p></div></div>
    <div class="dt-grid">
      <table class="st"><tr><th>능력</th><th>값</th><th>잠재력</th></tr>${stats}</table>
      <div class="drv">HP ${d.hp}<br>공격 ${d.atk}<br>마공 ${d.mag}<br>방어 ${d.def}<br>저항 ${d.res}<br>회복력 ${d.heal}<br>속도 ${d.spd}<br>회피 ${d.eva}%<br>치명 ${d.crit}%</div>
    </div>
    ${heroU() && JOBS[heroU().job].tier === 0 && !u.hero ? '<p class="dim">💡 세진의 인물 파악이 성장하면 잠재력이 보이기 시작해요.</p>' : ""}
    <h3>특성</h3>${traitRow("personality", "성격")}${traitRow("hobby", "취미")}${traitRow("origin", "출신")}${traitRow("quirk", "특이")}
    <h3>고유 무기</h3><div class="wpn"><b>${esc(weaponName(u))}</b> <small>무기 공격 ${Math.round(weaponAtk(u))}</small>
      ${hireFrom ? "" : G.bld.smithy ? (u.weapon.plus >= forgeCap ? `<p class="dim">대장간 레벨을 올리면 더 강화할 수 있어요 (상한 +${forgeCap}).</p>` : `<button data-act="forge" data-arg="${u.id}">강화 ${costText(fc)} · 성공 ${Math.round(forgeChance(u) * 100)}%</button>`) : '<p class="dim">대장간을 지으면 강화할 수 있어요.</p>'}</div>
    ${hireFrom ? "" : `<h3>장비</h3><div class="eqs">${slotBtn("armor", 0)}${slotBtn("acc", 0)}${slotBtn("acc", 1)}</div>`}
    <h3>기술</h3>${skills}
    ${promo ? `<h3>전직</h3><div class="promo">${promo}</div>` : J.next.length && !hireFrom ? `<p class="dim">Lv${J.lv}에 전직할 수 있어요: ${J.next.map((j) => JOBS[j].name).join(" / ")}</p>` : ""}
    ${!hireFrom && !u.hero ? `<button class="ghost danger" data-act="dismiss" data-arg="${u.id}">내보내기</button>` : ""}
  </div>`;
  document.body.appendChild(m);
}
function closeModal() { document.querySelectorAll(".modal").forEach((m) => m.remove()); }

function showEquipPicker(u, slot, i) {
  const own = Object.entries(G.inv).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].slot === slot);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="sheet small"><button class="x" data-act="close">✕</button><h3>${slot === "armor" ? "방어구" : "장신구"} 고르기</h3>
    <button data-act="equipset" data-arg="${u.id}:${slot}:${i}:">빼기</button>
    ${own.map(([id, n]) => `<button data-act="equipset" data-arg="${u.id}:${slot}:${i}:${id}">${ITEMS[id].name} ×${n} <small>${itemStatText(ITEMS[id])}</small></button>`).join("") || '<p class="dim">가진 장비가 없어요. 상점에서 살 수 있어요.</p>'}</div>`;
  document.body.appendChild(m);
}

// ---------- 결과 ----------
function showResult(title, lines, buttons) {
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="sheet small result"><h2>${title}</h2>${lines.map((l) => `<p>${l}</p>`).join("")}<div class="rbtns">${buttons.map((b, i) => `<button data-ri="${i}" class="${b.ghost ? "ghost" : ""}">${b.label}</button>`).join("")}</div></div>`;
  document.body.appendChild(m);
  m.onclick = (e) => {
    const b = e.target.closest("[data-ri]");
    if (!b) return;
    m.remove();
    buttons[+b.dataset.ri].fn();
  };
}
function rewardLines(B, rw) {
  const out = [`경험치 +${rw.exp} (1인당) · 💰+${rw.gold}`];
  for (const c of B.units.filter((x) => x.side === "A")) {
    const u = c.unit;
    if (rw.ups[u.id]) out.push(`⬆ ${esc(u.name)} 레벨 업! → Lv${u.lv}${canPromote(u) ? " (전직 가능)" : ""}`);
  }
  if (rw.injured.length) out.push(`🩹 부상: ${rw.injured.map((id) => esc(unitById(id).name)).join(", ")}`);
  return out;
}
