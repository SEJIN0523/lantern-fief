// 전투 화면: 정지 이미지를 WAAPI 애니메이션으로 움직인다
"use strict";

const MON_ART = {
  goblin: "goblins_1", goblin_archer: "goblins_2", goblin_shaman: "goblins_3", hobgoblin: "goblins_4", wolf_rider: "goblins_5", goblin_chief: "goblins_6",
  wolf: "beasts_1", boar: "beasts_2", spider: "beasts_3", bat: "beasts_4", goblin_king: "bosses_a_1",
};
const HERO_ART = { stranger: 2, tactician: 3, strategist: 4, lord: 5 };

function artKey(u) {
  if (u.art) return u.art;
  // 주인공: 리나를 구하다 다친 붕대 모습은 첫 닷새, 상처가 아물면 조끼 차림
  if (u.hero) return "sejin_" + (u.job === "stranger" && typeof G !== "undefined" && G.day > 5 ? 3 : HERO_ART[u.job] || 2);
  // 마을 주민: 평민 복장 시트(civ_계열)가 있으면 그것, 없으면 적성 계열의 1차 직업 그림
  if (u.job === "villager" && FIRST_JOB[u.line]) {
    const civ = `civ_${u.line}_${u.slot + 1}`;
    return typeof ART !== "undefined" && ART[civ] ? civ : `${FIRST_JOB[u.line]}_${u.slot + 1}`;
  }
  return `${u.job}_${u.slot + 1}`;
}
function unitSprite(u, cls = "") {
  const k = artKey(u);
  if (typeof ART !== "undefined" && ART[k]) return `<img class="spr ${cls}" src="${ART[k]}" alt="">`;
  const color = LINES[u.line]?.color || "#777";
  const skin = { "다크엘프": "#7b86a8", "곰 수인": "#b5875a" }[u.race] || "#f0c9a0";
  const hair = u.hero ? "#222" : ["#6b4426", "#222", "#c8502a", "#e8c050", "#ddd", "#888"][u.slot % 6];
  return `<div class="ph ${cls}" style="--c:${color};--s:${skin};--h:${hair}"><i class="ph-b"></i><i class="ph-h"></i><b class="ph-w">${WEAPON_ICON[JOBS[u.job].weapon] || ""}</b></div>`;
}
// 지나온 모습: 평민 복장 → 거친 직업 순서, 세진은 사고 직후 · 회복 중부터
function lookHistory(u) {
  const out = [], seen = new Set();
  const add = (key, label) => { if (typeof ART !== "undefined" && ART[key] && !seen.has(key)) { seen.add(key); out.push({ key, label }); } };
  if (u.art) { add(u.art, JOBS[u.job].name); return out; }
  if (u.hero) {
    add("sejin_1", "사고 직후");
    add("sejin_2", "리나를 구하다 다친 몸");
    for (const j of u.jobs || [u.job]) add("sejin_" + (j === "stranger" ? 3 : HERO_ART[j] || 2), JOBS[j].name);
  } else {
    const jobs = u.jobs && u.jobs.length ? u.jobs : [u.job];
    for (const j of jobs) {
      if (j === "villager") add(`civ_${u.line}_${u.slot + 1}`, "마을 주민");
      else add(`${j}_${u.slot + 1}`, JOBS[j].name);
    }
  }
  const cur = artKey(u);
  if (!seen.has(cur)) add(cur, JOBS[u.job].name);
  out.forEach((o) => (o.now = o.key === cur));
  return out;
}

// 편성 칸·대기 명단: 얼굴, 없으면 전신
function unitFace(u) {
  const k = "face_" + artKey(u);
  return typeof ART !== "undefined" && ART[k] ? `<img class="spr face" src="${ART[k]}" alt="">` : unitSprite(u);
}
// 동료 카드·상세: 가슴께 초상, 없으면 전신
function unitBust(u) {
  const k = "bust_" + artKey(u);
  return typeof ART !== "undefined" && ART[k] ? `<img class="spr bust" src="${ART[k]}" alt="">` : unitSprite(u);
}
function monSprite(id, cls = "") {
  const k = MON_ART[id];
  if (typeof ART !== "undefined" && ART[k]) return `<img class="spr ${cls}${MONSTERS[id].flip ? " flipx" : ""}" src="${ART[k]}" alt="">`;
  return `<div class="mon ${cls}${MONSTERS[id].boss ? " boss" : ""}">${MONSTERS[id].icon}</div>`;
}

const BV = { speed: 1, skip: false, pendingCmd: null, el: null, paused: false, auto: (() => { try { return localStorage.getItem("fief_auto") === "1"; } catch (e) { return false; } })() };
// 일시정지 중에는 시간이 흐르지 않는 대기
const wait = (ms) => new Promise((r) => {
  if (BV.skip) return r();
  let left = ms / BV.speed, last = performance.now();
  const tick = () => {
    const now = performance.now();
    if (!BV.paused) left -= now - last;
    last = now;
    if (left <= 0 || BV.skip) r(); else setTimeout(tick, Math.min(40, left));
  };
  setTimeout(tick, Math.min(40, left));
});
function battleAnims() { const b = document.querySelector(".battle"); return b ? b.getAnimations({ subtree: true }) : []; }
function setPaused(on) {
  BV.paused = on;
  battleAnims().forEach((a) => { try { if (on && a.playState === "running") a.pause(); else if (!on && a.playState === "paused") a.play(); } catch (e) {} });
  const btn = document.querySelector("[data-pause]");
  if (btn) { btn.textContent = on ? "▶ 계속" : "⏸ 정지"; btn.classList.toggle("on", on); }
  document.querySelector(".battle")?.classList.toggle("paused", on);
}

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
    return `<div class="bu ${c.side === "E" ? "foe" : ""}${c.boss ? " big" : ""}" id="bu-${c.id}" data-z="${10 + c.lane}" style="left:${p.x}%;top:${p.y}%;z-index:${10 + c.lane}">
      <div class="bu-body">${spr}</div>
      <div class="bu-hp"><i style="width:${(c.hp / c.maxHp) * 100}%"></i><s style="width:0"></s></div>${c.mp != null ? `<div class="bu-mp"><i style="width:${c.mp}%"></i></div>` : ""}
      <div class="bu-nm">${c.side === "E" ? c.name + " Lv" + c.lv : c.name}</div>
    </div>`;
  }).join("");
  return `<div class="field bg-${opts.bg || "forest"}" id="field">${bgArt(opts.bg)}<div class="field-floor"></div>${dustLayer()}${units}<div id="fxl"></div><div class="banner" id="banner"></div></div>`;
}
function bgArt(bg) {
  const k = "bg_" + (bg || "forest");
  return typeof ART !== "undefined" && ART[k] ? `<img class="field-bg" src="${ART[k]}" alt="">` : `<div class="battle-scenery">${scenery(bg || "forest")}</div>`;
}
// 떠다니는 먼지 입자
function dustLayer() {
  return `<div class="dust" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${20 + ((i * 53) % 70)}%;animation-delay:${-(i * 0.9).toFixed(1)}s;animation-duration:${7 + (i % 5)}s"></i>`).join("")}</div>`;
}

function updateBars(B) {
  for (const c of B.units) {
    const el = document.getElementById("bu-" + c.id);
    if (!el) continue;
    el.querySelector(".bu-hp i").style.width = (c.hp / c.maxHp) * 100 + "%";
    el.querySelector(".bu-hp s").style.width = Math.min(100, (c.shield / c.maxHp) * 100) + "%";
    const mp = el.querySelector(".bu-mp i"); if (mp) mp.style.width = (c.mp / c.maxMp) * 100 + "%";
    el.classList.toggle("dead", !c.alive);
    el.classList.toggle("taunt", c.taunt > 0);
  }
  const ord = document.getElementById("order");
  if (ord && !BV.skip) {
    const q = B.units.filter((c) => c.alive).sort((a, b) => a.ct - b.ct).slice(0, 8);
    ord.innerHTML = q.map((c, i) => `<div class="oi ${c.side === "E" ? "foe" : ""} ${i === 0 ? "now" : ""}">${orderArt(c)}</div>`).join("");
  }
  const g = document.getElementById("cmdg");
  if (g) {
    g.style.width = B.cmd + "%";
    document.querySelectorAll(".cmd-btn").forEach((b) => (b.disabled = !(B.cmd >= 100 && B.hero && B.hero.alive)));
  }
}

// 행동 순서 줄: 동료는 얼굴, 몬스터는 전신
function orderArt(c) {
  if (c.side === "E") return monSprite(c.mon);
  const k = "face_" + artKey(c.unit);
  return typeof ART !== "undefined" && ART[k] ? `<img class="spr oface" src="${ART[k]}" alt="">` : unitSprite(c.unit);
}
function center(id) {
  // 전투 화면이 사라졌거나 전장에 없는 유닛(지휘관)이면 가운데로
  const fe = document.getElementById("field"), ue = document.getElementById("bu-" + id);
  if (!fe || !ue) return { x: 0, y: 0, w: 0 };
  const f = fe.getBoundingClientRect();
  const r = ue.querySelector(".bu-body").getBoundingClientRect();
  return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2, w: r.width };
}
function foot(id) {
  const f = document.getElementById("field").getBoundingClientRect();
  const r = document.getElementById("bu-" + id).querySelector(".bu-body").getBoundingClientRect();
  return { x: r.left - f.left + r.width / 2, y: r.bottom - f.top - r.height * 0.05, w: r.width };
}
function body(id) { return document.getElementById("bu-" + id)?.querySelector(".bu-body"); }
const hasArt = (k) => typeof ART !== "undefined" && ART[k];
// 스크립트로 건 움직임만 지운다 (CSS 숨쉬기 애니메이션은 유지)
function clearAnims(el) { el?.getAnimations().forEach((x) => { if (!(window.CSSAnimation && x instanceof CSSAnimation)) x.cancel(); }); }
// 행동마다 시작 전에: 끝났거나 멈춘 채 남은 움직임을 지워 모두 제자리로 (쓰러짐 자세는 .dead 클래스가 맡음)
function resetPoses() {
  document.querySelectorAll("#field .bu-body").forEach((el) => el.getAnimations().forEach((x) => {
    if (!(window.CSSAnimation && x instanceof CSSAnimation) && x.playState !== "running") x.cancel();
  }));
}

function anim(el, frames, ms, opts = {}) {
  if (!el || BV.skip) return Promise.resolve();
  return el.animate(frames, { duration: ms / BV.speed, easing: opts.ease || "ease-out", fill: opts.fill || "none" }).finished.catch(() => {});
}

// ---------- 효과음: WebAudio로 짧은 톤을 즉석 생성 (기본 꺼짐) ----------
const SFX = { on: false, ctx: null };
try { SFX.on = localStorage.getItem("fief_sfx") === "1"; } catch (e) {}
function tone(freq, ms, type = "triangle", vol = 0.12, slide = 0) {
  if (!SFX.on || BV.skip) return;
  try {
    SFX.ctx = SFX.ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t = SFX.ctx.currentTime, o = SFX.ctx.createOscillator(), g = SFX.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + ms / 1000);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
    o.connect(g).connect(SFX.ctx.destination); o.start(t); o.stop(t + ms / 1000);
  } catch (e) {}
}
const SND = {
  hit: () => tone(180, 90, "triangle", 0.14, -80),
  crit: () => { tone(120, 160, "square", 0.1, -60); tone(520, 120, "triangle", 0.08); },
  swing: () => tone(420, 60, "triangle", 0.05, -200),
  shoot: () => tone(900, 80, "sine", 0.05, -500),
  magic: () => tone(660, 260, "sine", 0.07, 300),
  heal: () => { tone(740, 160, "sine", 0.06); setTimeout(() => tone(990, 200, "sine", 0.05), 90); },
  miss: () => tone(300, 70, "sine", 0.04, 200),
  cmd: () => { tone(523, 120, "sine", 0.07); setTimeout(() => tone(784, 220, "sine", 0.07), 110); },
};

// ---------- 숫자: 굵은 글자 + 테두리, 34px 떠오르며 사라짐 ----------
function popText(id, text, cls) {
  if (BV.skip) return;
  const p = center(id);
  const d = document.createElement("div");
  d.className = "pop " + (cls || "");
  d.textContent = text;
  d.style.left = p.x + rnd(-10, 10) + "px";
  d.style.top = p.y - p.w * 0.3 + "px";
  (document.getElementById("fxl") || document.body).appendChild(d);
  const big = cls === "crit";
  d.animate([
    { transform: `translate(-50%,0) scale(${big ? 1.9 : 0.6})`, opacity: 0 },
    { transform: `translate(-50%,-10px) scale(${big ? 1.25 : 1.12})`, opacity: 1, offset: 0.18 },
    { transform: "translate(-50%,-16px) scale(1)", opacity: 1, offset: 0.6 },
    { transform: "translate(-50%,-34px) scale(1)", opacity: 0 },
  ], { duration: (big ? 1150 : 900) / BV.speed, easing: "ease-out" }).finished.then(() => d.remove());
}

// ---------- 효과 그림: fx 시트가 있으면 그림, 없으면 CSS ----------
const FX_ART = {
  slash: "fx_a_1", twin: "fx_a_2", cleave: "fx_a_3", thrust: "fx_a_4", flurry: "fx_a_8", punch: "fx_a_9", block: "fx_a_10",
  hit: "fx_a_11", crit: "fx_a_13", dust: "fx_a_14", claw: "fx_a_15", counter: "fx_a_16", taunt: "fx_a_17", death: "fx_a_23",
  fire: "fx_b_2", holy: "fx_b_9", heal: "fx_b_10", revive: "fx_b_11", barrier: "fx_b_12", poison: "fx_b_13",
  dark: "fx_b_14", magic: "fx_b_4", buff: "fx_b_20", debuff: "fx_b_21", cmd: "fx_b_24",
};
const ORB_ART = { fire: "fx_b_1", dark: "fx_b_15", arrow: "fx_a_5", bolt: "fx_a_7" };
const CIRCLE_ART = { magic: "fx_b_17", fire: "fx_b_18", dark: "fx_b_18", holy: "fx_b_19", heal: "fx_b_19", barrier: "fx_b_17" };
const RING_COLOR = { fire: "#ff9a3a", dark: "#b070ff", holy: "#ffe680", heal: "#8ff0a0" };

function fxAt(id, kind, o = {}) {
  if (BV.skip) return Promise.resolve();
  const p = o.foot ? foot(id) : center(id);
  const k = FX_ART[kind];
  const d = document.createElement(hasArt(k) ? "img" : "div");
  if (hasArt(k)) { d.src = ART[k]; d.className = "fxi"; d.style.width = (o.size || 1) * p.w + "px"; }
  else d.className = "fx fx-" + kind;
  d.style.left = p.x + "px"; d.style.top = p.y + "px";
  const flip = o.flip ? " scaleX(-1)" : "";
  (document.getElementById("fxl") || document.body).appendChild(d);
  const frames = o.rise
    ? [{ transform: `translate(-50%,-50%) scale(.6)${flip}`, opacity: 0 }, { transform: `translate(-50%,-70%) scale(1)${flip}`, opacity: 1, offset: 0.3 }, { transform: `translate(-50%,-110%) scale(1.05)${flip}`, opacity: 0 }]
    : [{ transform: `translate(-50%,-50%) scale(.35)${flip}`, opacity: 1 }, { transform: `translate(-50%,-50%) scale(1)${flip}`, opacity: 1, offset: 0.45 }, { transform: `translate(-50%,-50%) scale(1.2)${flip}`, opacity: 0 }];
  return d.animate(frames, { duration: (o.ms || 420) / BV.speed, easing: "ease-out" }).finished.then(() => d.remove());
}

// 발밑 마법진: 커졌다가 줄어든다
function magicCircle(id, kind) {
  if (BV.skip) return Promise.resolve();
  const p = foot(id), k = CIRCLE_ART[kind] || CIRCLE_ART.magic;
  const d = document.createElement(hasArt(k) ? "img" : "div");
  if (hasArt(k)) d.src = ART[k];
  d.className = "mcircle mc-" + kind;
  d.style.left = p.x + "px"; d.style.top = p.y + "px"; d.style.width = p.w * 1.15 + "px";
  (document.getElementById("fxl") || document.body).appendChild(d);
  return d.animate([
    { transform: "translate(-50%,-50%) scaleY(.38) scale(.2) rotate(0deg)", opacity: 0 },
    { transform: "translate(-50%,-50%) scaleY(.38) scale(1.05) rotate(90deg)", opacity: 1, offset: 0.35 },
    { transform: "translate(-50%,-50%) scaleY(.38) scale(1) rotate(160deg)", opacity: 1, offset: 0.75 },
    { transform: "translate(-50%,-50%) scaleY(.38) scale(.6) rotate(200deg)", opacity: 0 },
  ], { duration: 620 / BV.speed, easing: "ease-out" }).finished.then(() => d.remove());
}

// 대상에게 퍼지는 고리
function ring(id, color) {
  if (BV.skip) return;
  const p = center(id);
  const d = document.createElement("div");
  d.className = "ring"; d.style.left = p.x + "px"; d.style.top = p.y + "px"; d.style.borderColor = color;
  (document.getElementById("fxl") || document.body).appendChild(d);
  d.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1.6)", opacity: 0 }], { duration: 420 / BV.speed, easing: "ease-out" }).finished.then(() => d.remove());
}

// 회복: 위로 떠오르는 십자
function cross(id) {
  if (BV.skip) return;
  const p = center(id);
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("i");
    d.className = "hcross"; d.textContent = "✚";
    d.style.left = p.x + (i - 1) * p.w * 0.25 + "px"; d.style.top = p.y + "px";
    (document.getElementById("fxl") || document.body).appendChild(d);
    d.animate([{ transform: "translate(-50%,0)", opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: "translate(-50%,-40px)", opacity: 0 }], { duration: 800 / BV.speed, delay: (i * 110) / BV.speed, fill: "backwards" }).finished.then(() => d.remove());
  }
}

// 투사체: 화살은 직선 + 빛 꼬리, 마법은 빛 구체
function projectile(fromId, toId, kind) {
  if (BV.skip) return Promise.resolve();
  const a = center(fromId), b = center(toId);
  const k = ORB_ART[kind];
  const d = document.createElement(hasArt(k) ? "img" : "div");
  if (hasArt(k)) { d.src = ART[k]; d.className = "proj proj-img proj-" + kind; }
  else { d.className = "proj proj-" + kind; d.textContent = kind === "arrow" || kind === "bolt" ? "➶" : ""; }
  const fl = document.getElementById("fxl");
  fl.appendChild(d);
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const straight = kind === "arrow" || kind === "bolt";
  const midY = (a.y + b.y) / 2 - (straight ? 6 : 18);
  const trail = setInterval(() => {
    const r = d.getBoundingClientRect(), f = fl.getBoundingClientRect();
    const t = document.createElement("i");
    t.className = "trail trail-" + kind;
    t.style.left = r.left - f.left + r.width / 2 + "px"; t.style.top = r.top - f.top + r.height / 2 + "px";
    fl.appendChild(t);
    t.animate([{ opacity: 0.9, transform: "translate(-50%,-50%) scale(1)" }, { opacity: 0, transform: "translate(-50%,-50%) scale(.2)" }], { duration: 260 / BV.speed }).finished.then(() => t.remove());
  }, 28);
  return d.animate([
    { left: a.x + "px", top: a.y + "px", transform: `translate(-50%,-50%) rotate(${ang}deg) scale(.7)` },
    { left: (a.x + b.x) / 2 + "px", top: midY + "px", transform: `translate(-50%,-50%) rotate(${ang}deg) scale(1)`, offset: 0.5 },
    { left: b.x + "px", top: b.y + "px", transform: `translate(-50%,-50%) rotate(${ang}deg) scale(1)` },
  ], { duration: (straight ? 260 : 380) / BV.speed, easing: straight ? "linear" : "ease-in" }).finished.then(() => { clearInterval(trail); d.remove(); });
}

function banner(text, cls) {
  if (BV.skip) return;
  const b = document.getElementById("banner");
  if (!b) return;
  b.textContent = text; b.className = "banner show " + (cls || "");
  clearTimeout(banner.t);
  banner.t = setTimeout(() => (b.className = "banner"), 900 / BV.speed);
}

// 히트스톱: 전장의 모든 움직임을 잠깐 멈춘다
async function hitStop(ms) {
  if (BV.skip) return;
  // 돌고 있는 것만 멈춘다. 이미 끝난 움직임을 다시 play() 하면 처음부터 재생돼 위치가 어긋난다
  const list = document.getElementById("field").getAnimations({ subtree: true }).filter((a) => a.playState === "running");
  list.forEach((a) => a.pause());
  await new Promise((r) => setTimeout(r, ms));
  if (BV.paused) return; // 일시정지가 걸렸으면 풀 때 한꺼번에 다시 돈다
  list.forEach((a) => { try { if (a.playState === "paused") a.play(); } catch (e) {} });
}
function flashField(color) {
  const f = document.getElementById("field");
  if (!f || BV.skip) return;
  const d = document.createElement("div");
  d.className = "flash"; d.style.background = color;
  f.appendChild(d);
  d.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 220 / BV.speed }).finished.then(() => d.remove());
}
function shakeField() {
  anim(document.getElementById("field"), [{ transform: "translate(0,0)" }, { transform: "translate(-6px,3px)" }, { transform: "translate(5px,-3px)" }, { transform: "translate(-3px,2px)" }, { transform: "translate(0,0)" }], 180);
}

async function showHits(B, hits, attackerSide) {
  const tasks = [];
  const dir = attackerSide === "A" ? 1 : -1;
  // 강공격: 히트스톱 → 흔들림 + 주황 플래시
  if (hits.some((h) => h.crit && !h.miss)) { SND.crit(); await hitStop(85); shakeField(); flashField("#ffb347"); }
  else if (hits.some((h) => !h.miss)) SND.hit();
  for (const h of hits) {
    const el = body(h.id);
    if (h.miss) {
      popText(h.id, "MISS", "miss"); SND.miss();
      fxAt(h.id, "dust", { foot: true, size: 0.7, ms: 380 });
      tasks.push(anim(el, [{ transform: "translateX(0)" }, { transform: `translateX(${16 * dir}px) skewX(${-8 * dir}deg)`, opacity: 0.5 }, { transform: "translateX(0)" }], 300));
      continue;
    }
    popText(h.id, (h.crit ? "✦" : "") + h.dmg, h.crit ? "crit" : "dmg");
    if (h.absorbed) { popText(h.id, "🛡" + h.absorbed, "shield"); fxAt(h.id, "block", { size: 0.8 }); }
    tasks.push(fxAt(h.id, h.crit ? "crit" : "hit", { size: h.crit ? 1.3 : 0.8 }));
    // 하얗게 번쩍 + 넉백: 9px 두 번 흔들림 → 13px 밀림 → 제자리
    const k = h.crit ? 1.5 : 1;
    tasks.push(anim(el, [
      { transform: "translateX(0)", filter: "brightness(0) invert(1)" },
      { transform: `translateX(${9 * dir * k}px)`, filter: "brightness(0) invert(1)", offset: 0.15 },
      { transform: `translateX(${-4 * dir}px)`, filter: "brightness(1.6)", offset: 0.3 },
      { transform: `translateX(${9 * dir * k}px)`, filter: "brightness(1)", offset: 0.45 },
      { transform: `translateX(${13 * dir * k}px)`, filter: "brightness(1)", offset: 0.65 },
      { transform: "translateX(0)", filter: "brightness(1)" },
    ], 380));
  }
  updateBars(B);
  await Promise.all(tasks);
  for (const h of hits) if (h.dead) deathAnim(h.id, B);
}
function deathAnim(id, B) {
  const c = B.units.find((x) => x.id === id);
  const el = body(id);
  fxAt(id, "death", { rise: true, size: 0.9, ms: 700 });
  if (c.side === "A") anim(el, [{ transform: "rotate(0)", opacity: 1 }, { transform: "rotate(-75deg) translateY(20%)", opacity: 0.45 }], 500);
  else anim(el, [{ transform: "translateY(0)", opacity: 1, filter: "brightness(1)" }, { transform: "translateY(0)", filter: "brightness(0) invert(1)", opacity: 0.9, offset: 0.2 }, { transform: "translateY(10%) scale(.92)", opacity: 0, filter: "brightness(0) invert(1)" }], 560);
}

// 무기별 베기 모양: 검 = 호, 창 = 찌르기, 도끼·둔기 = 내려찍기
function slashKind(c, sk) {
  if (sk && (sk.hits || 1) > 1) return "twin";
  if (c.side === "E") return MONSTERS[c.mon].beast ? "claw" : "slash";
  return { axe: "cleave", mace: "cleave", tool: "cleave", spear: "thrust", dagger: "flurry", fist: "punch" }[JOBS[c.unit.job].weapon] || "slash";
}
function shotKind(c) {
  return c.side === "A" && JOBS[c.unit.job].weapon === "crossbow" ? "bolt" : "arrow";
}

async function playEvent(B, ev) {
  if (!ev) return;
  resetPoses();
  const c = B.units.find((x) => x.id === ev.actor);
  const el = body(ev.actor);
  // 행동하는 유닛을 맨 앞으로, 끝나면 줄 순서로 복귀
  if (!BV.skip) document.querySelectorAll(".bu.act").forEach((x) => { x.classList.remove("act"); x.style.zIndex = x.dataset.z; });
  const ue = document.getElementById("bu-" + ev.actor);
  if (ue) { ue.classList.add("act"); if (!BV.skip) ue.style.zIndex = 80; }
  if (ev.dot) { popText(ev.actor, ev.dot, "dot"); fxAt(ev.actor, "poison", { size: 0.8 }); updateBars(B); await wait(250); if (ev.dotDead) { deathAnim(ev.actor, B); return; } }
  const sk = ev.skill ? SKILLS[ev.skill] : null;
  if (sk) banner(sk.name, ev.side === "E" ? "foe" : "");
  const dir = ev.side === "A" ? 1 : -1;

  if (ev.kind === "command") {
    banner(COMMANDS[ev.cmd].name, "cmd"); SND.cmd();
    flashField("#66e6ee");
    const ch = document.querySelector(".cmd-face");
    if (ch) anim(ch, [{ transform: "scale(1)" }, { transform: "scale(1.2)", filter: "drop-shadow(0 0 10px #5ff)" }, { transform: "scale(1)" }], 520);
    await wait(420);
    for (const id of ev.buffed || []) { fxAt(id, "buff", { rise: true, size: 0.9 }); popText(id, "▲", "buff"); }
    for (const h of ev.heals || []) { fxAt(h.id, "heal", { size: 0.9 }); popText(h.id, "+" + h.amt, "heal"); }
    updateBars(B); await wait(350); return;
  }
  if (ev.kind === "wait") { popText(ev.actor, "…", "miss"); await wait(220); return; }

  if (ev.kind === "melee" || (ev.kind === "atk" && sk && sk.rng === "melee")) {
    // 뒤로 9px 반동 → 대상 앞까지 돌진 → 베기 → 330ms에 복귀
    const a = center(ev.actor), t = center(ev.target);
    const dx = (t.x - a.x) - dir * t.w * 0.5, dy = t.y - a.y;
    const T = 1060, at = (ms) => ms / T;
    const move = anim(el, [
      { transform: "translate(0,0) rotate(0)", offset: 0, easing: "ease-out" },
      { transform: `translate(${-9 * dir}px,0) rotate(${-4 * dir}deg)`, offset: at(130), easing: "ease-in" },
      { transform: `translate(${dx}px,${dy}px) rotate(${7 * dir}deg)`, offset: at(350), easing: "ease-out" },
      { transform: `translate(${dx + 6 * dir}px,${dy}px) rotate(${-3 * dir}deg)`, offset: at(470) },
      { transform: `translate(${dx + 6 * dir}px,${dy}px) rotate(${-3 * dir}deg)`, offset: at(730), easing: "ease-in-out" },
      { transform: "translate(0,0) rotate(0)", offset: 1 },
    ], T, { ease: "linear" });
    try {
      await wait(130);
      fxAt(ev.actor, "dust", { foot: true, size: 0.6, ms: 360, flip: dir < 0 });
      SND.swing();
      await wait(220);
      fxAt(ev.target, slashKind(c, sk), { size: 1.15, ms: 320, flip: dir < 0 });
      await Promise.all([showHits(B, ev.hits, ev.side), move]);
    } finally { clearAnims(el); }
  } else if (ev.kind === "shoot" || (ev.kind === "atk" && !(sk && sk.mag) && c.range !== "magic")) {
    // 활을 6° 젖힘 → 직선으로 날아가는 화살 + 빛 꼬리
    await anim(el, [{ transform: "translateX(0) rotate(0)" }, { transform: `translateX(${-6 * dir}px) rotate(${-6 * dir}deg)` }], 160, { fill: "forwards" });
    SND.shoot();
    anim(el, [{ transform: `translateX(${-6 * dir}px) rotate(${-6 * dir}deg)` }, { transform: "translateX(0) rotate(0)" }], 200).then(() => clearAnims(el));
    const ts = [...new Set(ev.hits.map((h) => h.id))];
    await Promise.all(ts.slice(0, 5).map((id, i) => wait(i * 60).then(() => projectile(ev.actor, id, shotKind(c)))));
    await showHits(B, ev.hits, ev.side);
  } else if (ev.kind === "magic" || ev.kind === "atk") {
    // 발밑 마법진 → 빛 구체 → 대상에서 폭발과 고리
    const kind = (sk && sk.fx) || ev.fx || "magic";
    SND.magic();
    await Promise.all([magicCircle(ev.actor, kind), anim(el, [{ transform: "translateY(0)", filter: "none" }, { transform: "translateY(-10px)", filter: "drop-shadow(0 0 10px #8cf)" }], 360, { fill: "forwards" })]);
    const ts = [...new Set(ev.hits.map((h) => h.id))];
    await Promise.all(ts.slice(0, 6).map((id) => projectile(ev.actor, id, kind)));
    ts.forEach((id) => { fxAt(id, kind, { size: 1.1, ms: 480 }); ring(id, RING_COLOR[kind] || "#7fd8ff"); });
    anim(el, [{ transform: "translateY(-10px)" }, { transform: "translateY(0)" }], 200).then(() => clearAnims(el));
    await showHits(B, ev.hits, ev.side);
  } else if (ev.kind === "heal" || ev.kind === "revive") {
    // 발밑 문양 → 빛 덩어리 → 대상 고리 + 떠오르는 십자 + 초록 숫자
    SND.heal();
    await Promise.all([magicCircle(ev.actor, "heal"), anim(el, [{ filter: "none" }, { filter: "drop-shadow(0 0 10px #8f8)" }, { filter: "none" }], 420)]);
    await Promise.all(ev.heals.filter((h) => h.id !== ev.actor).slice(0, 5).map((h) => projectile(ev.actor, h.id, "heal")));
    for (const h of ev.heals) {
      ring(h.id, RING_COLOR.heal);
      fxAt(h.id, h.revive ? "revive" : "heal", { rise: true, size: 0.9, ms: 700 });
      cross(h.id);
      popText(h.id, (h.revive ? "부활 " : "+") + h.amt, "heal");
      if (h.revive) anim(body(h.id), [{ transform: "rotate(-75deg)", opacity: 0.4 }, { transform: "rotate(0)", opacity: 1 }], 400);
    }
    updateBars(B); await wait(320);
  } else if (ev.kind === "shield") {
    await magicCircle(ev.actor, "barrier");
    for (const s of ev.shields) { fxAt(s.id, "barrier", { size: 1.1, ms: 600 }); popText(s.id, "🛡" + s.amt, "shield"); }
    updateBars(B); await wait(350);
  } else if (ev.kind === "buff") {
    await anim(el, [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], 300);
    if (sk && sk.taunt) fxAt(ev.actor, "taunt", { size: 1.3, ms: 520 });
    for (const id of ev.buffed) { fxAt(id, "buff", { rise: true, size: 0.9, ms: 600 }); popText(id, "▲", "buff"); }
    updateBars(B); await wait(300);
  } else if (ev.kind === "debuff") {
    await magicCircle(ev.actor, "dark");
    for (const id of ev.debuffed) { await projectile(ev.actor, id, "dark"); fxAt(id, "debuff", { rise: true, size: 0.9, ms: 600 }); popText(id, "▼", "debuff"); }
    await wait(250);
  }
  if (ev.counterHits) {
    for (const h of ev.counterHits) {
      const ce = body(h.by);
      fxAt(h.by, "counter", { size: 0.9, ms: 300 });
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
    BV.skip = false; BV.pendingCmd = null; BV.paused = false;
    B.tactic = G.tactic;
    const cmdBtns = B.hero ? Object.entries(COMMANDS).map(([id, c]) => `<button class="cmd-btn" data-cmd="${id}" disabled><b>${c.name}</b><small>${c.desc}</small></button>`).join("") : "";
    app.innerHTML = `<div class="battle">
      <div class="b-top"><span class="b-title"><small>영지를 위한 전투</small>${esc(opts.title || "전투")}</span><span class="b-spd">${[1, 2, 4].map((s) => `<button data-spd="${s}" class="${BV.speed === s ? "on" : ""}">${s}x</button>`).join("")}<button data-sfx="1" class="${SFX.on ? "on" : ""}" aria-label="효과음">${SFX.on ? "🔊" : "🔇"}</button><button data-skip="1">결과 ▶▶</button></span></div>
      <div class="order-label"><span>행동 순서</span><span class="b-tog"><button data-pause="1">⏸ 정지</button><button data-auto="1" class="${BV.auto ? "on" : ""}">${BV.auto ? "자동 진행 ON" : "자동 진행 OFF"}</button></span></div><div class="order" id="order" aria-label="행동 순서"></div>
      ${renderField(B, opts)}
      <div class="b-ctl">
        ${B.hero ? `<div class="cmd"><div class="cmd-head"><span class="cmd-who"><span class="cmd-face">${unitFace(B.hero.unit)}</span>세진의 지휘</span><div class="cmd-bar"><i id="cmdg"></i></div></div><div class="cmd-row">${cmdBtns}</div></div>` : ""}
        <div class="tactic-label">전투 방침</div><div class="seg tac">${[["all", "전원 공격"], ["boss", "강적 집중"], ["safe", "생존 우선"], ["save", "기술 아끼기"]].map(([k, n]) => `<button data-tac="${k}" class="${B.tactic === k ? "on" : ""}">${n}</button>`).join("")}</div>
      </div>
    </div>`;
    const root = app.querySelector(".battle");
    root.onclick = (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.spd) { BV.speed = +t.dataset.spd; root.querySelectorAll("[data-spd]").forEach((b) => b.classList.toggle("on", b === t)); }
      if (t.dataset.skip) { BV.skip = true; setPaused(false); }
      if (t.dataset.pause) setPaused(!BV.paused);
      if (t.dataset.auto) {
        BV.auto = !BV.auto; t.textContent = BV.auto ? "자동 진행 ON" : "자동 진행 OFF"; t.classList.toggle("on", BV.auto);
        try { localStorage.setItem("fief_auto", BV.auto ? "1" : "0"); } catch (e) {}
      }
      if (t.dataset.sfx) {
        SFX.on = !SFX.on; t.textContent = SFX.on ? "🔊" : "🔇"; t.classList.toggle("on", SFX.on);
        try { localStorage.setItem("fief_sfx", SFX.on ? "1" : "0"); } catch (e) {}
        SND.cmd();
      }
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
        while (BV.paused && !BV.skip) await new Promise((r) => setTimeout(r, 80));
        if (!document.getElementById("field")) BV.skip = true; // 화면이 바뀌었으면 결과만 계산
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
