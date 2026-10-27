// 전투 화면: 정지 이미지를 WAAPI 애니메이션으로 움직인다
"use strict";

const MON_ART = {
  goblin: "goblins_1", goblin_archer: "goblins_2", goblin_shaman: "goblins_3", hobgoblin: "goblins_4", wolf_rider: "goblins_5", goblin_chief: "goblins_6",
  wolf: "beasts_1", boar: "beasts_2", spider: "beasts_3", bat: "beasts_4", goblin_king: "bosses_a_1",
};
const HERO_ART = { stranger: 2, tactician: 3, strategist: 4, lord: 5 };

function artKey(u) {
  if (u.hero) return "sejin_" + (HERO_ART[u.job] || 2);
  return `${u.job}_${u.slot + 1}`;
}
function unitSprite(u, cls = "") {
  const k = artKey(u);
  if (typeof ART !== "undefined" && ART[k]) return `<img class="spr ${cls}" src="${ART[k]}" alt="">`;
  const color = LINES[u.line]?.color || "#777";
  const skin = { "다크엘프": "#7b86a8", "곰 수인": "#b5875a" }[u.race] || "#f0c9a0";
  const hair = u.hero ? "#222" : ["#6b4426", "#222", "#c8502a", "#e8c050", "#ddd", "#888"][u.slot % 6];
  return `<div class="ph ${cls}" style="--c:${color};--s:${skin};--h:${hair}"><i class="ph-b"></i><i class="ph-h"></i><b class="ph-w">${WEAPON_ICON[JOBS[u.job].weapon] || ""}</b>${u.hero ? '<i class="ph-g"></i>' : ""}</div>`;
}
function monSprite(id, cls = "") {
  const k = MON_ART[id];
  if (typeof ART !== "undefined" && ART[k]) return `<img class="spr ${cls}" src="${ART[k]}" alt="">`;
  return `<div class="mon ${cls}${MONSTERS[id].boss ? " boss" : ""}">${MONSTERS[id].icon}</div>`;
}

const BV = { speed: 1, skip: false, pendingCmd: null, el: null };
const wait = (ms) => new Promise((r) => setTimeout(r, BV.skip ? 0 : ms / BV.speed));

function slotPos(side, col, lane) {
  // 아군 왼쪽(후열 더 왼쪽), 적 오른쪽(후열 더 오른쪽). 줄마다 살짝 어긋나게
  const x = side === "A" ? (col === 0 ? 34 : 15) + lane * 1.2 : (col === 0 ? 66 : 85) - lane * 1.2;
  const y = 22 + lane * 15;
  return { x, y };
}

function renderField(B, opts) {
  const units = B.units.map((c) => {
    const p = slotPos(c.side, c.col, c.lane);
    const spr = c.side === "A" ? unitSprite(c.unit) : monSprite(c.mon);
    return `<div class="bu ${c.side === "E" ? "foe" : ""}${c.boss ? " big" : ""}" id="bu-${c.id}" style="left:${p.x}%;top:${p.y}%;z-index:${10 + c.lane}">
      <div class="bu-body">${spr}</div>
      <div class="bu-hp"><i style="width:${(c.hp / c.maxHp) * 100}%"></i><s style="width:0"></s></div>
      <div class="bu-nm">${c.side === "E" ? c.name + " Lv" + c.lv : c.name}</div>
    </div>`;
  }).join("");
  return `<div class="field bg-${opts.bg || "forest"}" id="field">${bgArt(opts.bg)}<div class="field-floor"></div>${units}<div id="fxl"></div><div class="banner" id="banner"></div></div>`;
}
function bgArt(bg) {
  const k = "bg_" + (bg || "forest");
  return typeof ART !== "undefined" && ART[k] ? `<img class="field-bg" src="${ART[k]}" alt="">` : "";
}

function updateBars(B) {
  for (const c of B.units) {
    const el = document.getElementById("bu-" + c.id);
    if (!el) continue;
    el.querySelector(".bu-hp i").style.width = (c.hp / c.maxHp) * 100 + "%";
    el.querySelector(".bu-hp s").style.width = Math.min(100, (c.shield / c.maxHp) * 100) + "%";
    el.classList.toggle("dead", !c.alive);
    el.classList.toggle("taunt", c.taunt > 0);
  }
  const ord = document.getElementById("order");
  if (ord && !BV.skip) {
    const q = B.units.filter((c) => c.alive).sort((a, b) => a.ct - b.ct).slice(0, 8);
    ord.innerHTML = q.map((c, i) => `<div class="oi ${c.side === "E" ? "foe" : ""} ${i === 0 ? "now" : ""}">${c.side === "A" ? unitSprite(c.unit) : monSprite(c.mon)}</div>`).join("");
  }
  const g = document.getElementById("cmdg");
  if (g) {
    g.style.width = B.cmd + "%";
    document.querySelectorAll(".cmd-btn").forEach((b) => (b.disabled = !(B.cmd >= 100 && B.hero && B.hero.alive)));
  }
}

function center(id) {
  const f = document.getElementById("field").getBoundingClientRect();
  const r = document.getElementById("bu-" + id).querySelector(".bu-body").getBoundingClientRect();
  return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2, w: r.width };
}
function body(id) { return document.getElementById("bu-" + id)?.querySelector(".bu-body"); }

function anim(el, frames, ms, opts = {}) {
  if (!el || BV.skip) return Promise.resolve();
  return el.animate(frames, { duration: ms / BV.speed, easing: opts.ease || "ease-out", fill: opts.fill || "none" }).finished.catch(() => {});
}

function popText(id, text, cls) {
  if (BV.skip) return;
  const p = center(id);
  const d = document.createElement("div");
  d.className = "pop " + (cls || "");
  d.textContent = text;
  d.style.left = p.x + rnd(-10, 10) + "px";
  d.style.top = p.y - p.w * 0.3 + "px";
  document.getElementById("fxl").appendChild(d);
  d.animate([{ transform: "translate(-50%,0) scale(.6)", opacity: 0 }, { transform: "translate(-50%,-18px) scale(1.15)", opacity: 1, offset: 0.25 }, { transform: "translate(-50%,-46px) scale(1)", opacity: 0 }], { duration: 950 / BV.speed, easing: "ease-out" }).finished.then(() => d.remove());
}

function fxAt(id, kind) {
  if (BV.skip) return Promise.resolve();
  const p = center(id);
  const d = document.createElement("div");
  d.className = "fx fx-" + kind;
  d.style.left = p.x + "px"; d.style.top = p.y + "px";
  document.getElementById("fxl").appendChild(d);
  return d.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1.4)", opacity: 0 }], { duration: 420 / BV.speed }).finished.then(() => d.remove());
}

function projectile(fromId, toId, kind) {
  if (BV.skip) return Promise.resolve();
  const a = center(fromId), b = center(toId);
  const d = document.createElement("div");
  d.className = "proj proj-" + kind;
  d.textContent = kind === "arrow" ? "➶" : "";
  document.getElementById("fxl").appendChild(d);
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const midY = Math.min(a.y, b.y) - (kind === "arrow" ? 30 : 10);
  return d.animate([
    { left: a.x + "px", top: a.y + "px", transform: `translate(-50%,-50%) rotate(${ang - 20}deg)` },
    { left: (a.x + b.x) / 2 + "px", top: midY + "px", transform: `translate(-50%,-50%) rotate(${ang}deg)`, offset: 0.5 },
    { left: b.x + "px", top: b.y + "px", transform: `translate(-50%,-50%) rotate(${ang + 20}deg)` },
  ], { duration: 360 / BV.speed, easing: "linear" }).finished.then(() => d.remove());
}

function banner(text, cls) {
  if (BV.skip) return;
  const b = document.getElementById("banner");
  b.textContent = text; b.className = "banner show " + (cls || "");
  clearTimeout(banner.t);
  banner.t = setTimeout(() => (b.className = "banner"), 900 / BV.speed);
}

async function showHits(B, hits, attackerSide) {
  const tasks = [];
  for (const h of hits) {
    const el = body(h.id);
    if (h.miss) {
      popText(h.id, "MISS", "miss");
      const dir = attackerSide === "A" ? 1 : -1;
      tasks.push(anim(el, [{ transform: "translateX(0)" }, { transform: `translateX(${18 * dir}px)`, opacity: 0.5 }, { transform: "translateX(0)" }], 300));
      continue;
    }
    popText(h.id, (h.crit ? "💥" : "") + h.dmg, h.crit ? "crit" : "dmg");
    if (h.absorbed) popText(h.id, "🛡" + h.absorbed, "shield");
    tasks.push(fxAt(h.id, h.crit ? "crit" : "hit"));
    tasks.push(anim(el, [{ filter: "brightness(3)", transform: "translateX(0)" }, { filter: "brightness(1)", transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], 260));
    if (h.crit) shakeField();
  }
  updateBars(B);
  await Promise.all(tasks);
  for (const h of hits) if (h.dead) deathAnim(h.id, B);
}
function shakeField() {
  anim(document.getElementById("field"), [{ transform: "translate(0,0)" }, { transform: "translate(-5px,3px)" }, { transform: "translate(5px,-3px)" }, { transform: "translate(0,0)" }], 220);
}
function deathAnim(id, B) {
  const c = B.units.find((x) => x.id === id);
  const el = body(id);
  if (c.side === "A") anim(el, [{ transform: "rotate(0)", opacity: 1 }, { transform: "rotate(-75deg) translateY(20%)", opacity: 0.45 }], 500, { fill: "forwards" });
  else anim(el, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(30%) scale(.9)", opacity: 0 }], 520, { fill: "forwards" });
}

async function playEvent(B, ev) {
  if (!ev) return;
  const c = B.units.find((x) => x.id === ev.actor);
  const el = body(ev.actor);
  if (!BV.skip) document.querySelectorAll(".bu.act").forEach((x) => x.classList.remove("act"));
  document.getElementById("bu-" + ev.actor)?.classList.add("act");
  if (ev.dot) { popText(ev.actor, ev.dot, "dot"); updateBars(B); await wait(250); if (ev.dotDead) { deathAnim(ev.actor, B); return; } }
  const sk = ev.skill ? SKILLS[ev.skill] : null;
  if (sk) banner(sk.name, ev.side === "E" ? "foe" : "");
  const dir = ev.side === "A" ? 1 : -1;

  if (ev.kind === "command") {
    banner(COMMANDS[ev.cmd].name, "cmd");
    await anim(el, [{ transform: "scale(1)" }, { transform: "scale(1.25)", filter: "drop-shadow(0 0 12px #5ff)" }, { transform: "scale(1)" }], 520);
    for (const id of ev.buffed || []) { fxAt(id, "buff"); popText(id, "▲", "buff"); }
    for (const h of ev.heals || []) { fxAt(h.id, "heal"); popText(h.id, "+" + h.amt, "heal"); }
    updateBars(B); await wait(350); return;
  }
  if (ev.kind === "wait") { popText(ev.actor, "…", "miss"); await wait(220); return; }

  if (ev.kind === "melee" || (ev.kind === "atk" && sk && sk.rng === "melee")) {
    const a = center(ev.actor), t = center(ev.target);
    const dx = (t.x - a.x) - dir * t.w * 0.55, dy = t.y - a.y;
    await anim(el, [{ transform: "translate(0,0)" }, { transform: `translate(${dx * 0.85}px,${dy * 0.85}px) rotate(${6 * dir}deg)` }], 210, { ease: "ease-in" });
    fxAt(ev.target, "slash");
    const back = anim(el, [{ transform: `translate(${dx * 0.85}px,${dy * 0.85}px) rotate(${6 * dir}deg)` }, { transform: "translate(0,0)" }], 260);
    await showHits(B, ev.hits, ev.side);
    await back;
  } else if (ev.kind === "shoot" || (ev.kind === "atk" && !(sk && sk.mag) && c.range !== "magic")) {
    await anim(el, [{ transform: "translateX(0)" }, { transform: `translateX(${-10 * dir}px) rotate(${-4 * dir}deg)` }, { transform: "translateX(0)" }], 200);
    const ts = [...new Set(ev.hits.map((h) => h.id))];
    await Promise.all(ts.slice(0, 5).map((id) => projectile(ev.actor, id, "arrow")));
    await showHits(B, ev.hits, ev.side);
  } else if (ev.kind === "magic" || ev.kind === "atk") {
    await anim(el, [{ transform: "translateY(0)", filter: "none" }, { transform: "translateY(-12px)", filter: "drop-shadow(0 0 10px #8cf)" }], 260);
    const kind = (sk && sk.fx) || "magic";
    const ts = [...new Set(ev.hits.map((h) => h.id))];
    await Promise.all(ts.slice(0, 6).map((id) => projectile(ev.actor, id, kind)));
    ts.forEach((id) => fxAt(id, kind));
    anim(el, [{ transform: "translateY(-12px)" }, { transform: "translateY(0)" }], 200);
    await showHits(B, ev.hits, ev.side);
  } else if (ev.kind === "heal" || ev.kind === "revive") {
    await anim(el, [{ filter: "none" }, { filter: "drop-shadow(0 0 10px #8f8)" }, { filter: "none" }], 300);
    for (const h of ev.heals) {
      fxAt(h.id, "heal");
      popText(h.id, (h.revive ? "부활 " : "+") + h.amt, "heal");
      if (h.revive) anim(body(h.id), [{ transform: "rotate(-75deg)", opacity: 0.4 }, { transform: "rotate(0)", opacity: 1 }], 400, { fill: "forwards" });
    }
    updateBars(B); await wait(300);
  } else if (ev.kind === "shield") {
    for (const s of ev.shields) { fxAt(s.id, "barrier"); popText(s.id, "🛡" + s.amt, "shield"); }
    updateBars(B); await wait(350);
  } else if (ev.kind === "buff") {
    await anim(el, [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], 300);
    for (const id of ev.buffed) { fxAt(id, "buff"); popText(id, "▲", "buff"); }
    updateBars(B); await wait(300);
  } else if (ev.kind === "debuff") {
    for (const id of ev.debuffed) { await projectile(ev.actor, id, "dark"); fxAt(id, "dark"); popText(id, "▼", "debuff"); }
    await wait(250);
  }
  if (ev.counterHits) {
    for (const h of ev.counterHits) {
      const ce = body(h.by);
      await anim(ce, [{ transform: "translateX(0)" }, { transform: `translateX(${-14 * dir}px)` }, { transform: "translateX(0)" }], 200);
      popText(h.by, "반격", "buff");
      await showHits(B, [h], ev.side === "A" ? "E" : "A");
    }
  }
  if (ev.reflect) popText(ev.actor, ev.reflect, "dot");
  if (ev.drain) popText(ev.actor, "+" + ev.drain, "heal");
  updateBars(B);
  await wait(140);
}

// 전투 실행. 화면을 그리고 끝나면 B를 돌려준다
function playBattle(B, opts) {
  return new Promise((resolve) => {
    BV.skip = false; BV.pendingCmd = null;
    B.tactic = G.tactic;
    const cmdBtns = B.hero ? Object.entries(COMMANDS).map(([id, c]) => `<button class="cmd-btn" data-cmd="${id}" disabled><b>${c.name}</b><small>${c.desc}</small></button>`).join("") : "";
    app.innerHTML = `<div class="battle">
      <div class="b-top"><span class="b-title">${opts.title || "전투"}</span><span class="b-spd">${[1, 2, 4].map((s) => `<button data-spd="${s}" class="${BV.speed === s ? "on" : ""}">${s}x</button>`).join("")}<button data-skip="1">결과 ▶▶</button></span></div>
      <div class="order" id="order"></div>
      ${renderField(B, opts)}
      <div class="b-ctl">
        ${B.hero ? `<div class="cmd"><div class="cmd-head"><span>세진의 지휘</span><div class="cmd-bar"><i id="cmdg"></i></div></div><div class="cmd-row">${cmdBtns}</div></div>` : `<div class="hint">세진이 파티에 없으면 지휘를 쓸 수 없어요.</div>`}
        <div class="seg tac">${[["all", "전원 공격"], ["boss", "강적 집중"], ["safe", "생존 우선"], ["save", "기술 아끼기"]].map(([k, n]) => `<button data-tac="${k}" class="${B.tactic === k ? "on" : ""}">${n}</button>`).join("")}</div>
      </div>
    </div>`;
    const root = app.querySelector(".battle");
    root.onclick = (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.spd) { BV.speed = +t.dataset.spd; root.querySelectorAll("[data-spd]").forEach((b) => b.classList.toggle("on", b === t)); }
      if (t.dataset.skip) BV.skip = true;
      if (t.dataset.cmd) { BV.pendingCmd = t.dataset.cmd; t.disabled = true; }
      if (t.dataset.tac) { B.tactic = G.tactic = t.dataset.tac; root.querySelectorAll("[data-tac]").forEach((b) => b.classList.toggle("on", b === t)); }
    };
    updateBars(B);
    (async () => {
      await wait(500);
      // 전투 시작 연출: 아군과 적이 안쪽으로 걸어 들어온다
      for (const c of B.units) anim(body(c.id), [{ transform: `translateX(${c.side === "A" ? -40 : 40}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], 450);
      await wait(500);
      while (!B.over) {
        if (BV.pendingCmd) { const ev = useCommand(B, BV.pendingCmd); BV.pendingCmd = null; await playEvent(B, ev); }
        const ev = step(B);
        if (BV.skip) { updateBars(B); continue; }
        await playEvent(B, ev);
      }
      updateBars(B);
      BV.skip = false;
      banner(B.win ? "승리!" : "패배…", B.win ? "win" : "foe");
      await wait(1100);
      resolve(B);
    })();
  });
}
