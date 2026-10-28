// 흐름 제어: 버튼 동작, 원정, 밤과 습격
"use strict";

let PEEK = null; // 영입 전에 들여다보는 동료
const LOVE_Q = []; // 전투 뒤에 보여 줄 호감 단계 장면

function startNewGame() {
  newGame();
  playScenes(["p1", "p2", "p3", "p4", "p5", "p6", "p7"], tutorialBattle);
}

function tutorialBattle() {
  startChapter1();
  const party = formUnits();
  const B = createBattle(party, [{ id: "goblin", lv: 1, col: 0, lane: 1 }, { id: "goblin", lv: 1, col: 0, lane: 3 }], { forest: false });
  playBattle(B, { title: "고블린 정찰대", bg: "village" }).then(() => {
    const rw = battleRewards(B);
    for (const u of G.roster) u.injured = 0;
    G.res.gold += rw.gold;
    playScenes(["p8"], () => { TAB = "village"; save(); showHub(); });
  });
}

// 원정: 일반 층 3연전, 보스 1전
async function runExpedition(did, fi) {
  const party = formUnits();
  if (!party.length) return toast("편성된 동료가 없어요");
  const D = DUNGEONS[did], F = floorOf(did, fi);
  const total = F.phases ? F.phases.length : F.boss ? 1 : 3;
  const fname = D.endless ? `${fi + 1}층` : F.boss ? "보스" : fi + 1 + "층";
  let after = [];
  const carry = {};
  let won = 0, gold = 0;
  for (let n = 0; n < total; n++) {
    const alive = formUnits().filter((f) => carry[f.unit.id] == null || carry[f.unit.id] > 0);
    if (!alive.length) break;
    const B = createBattle(alive, floorEnemies(did, fi, n), { carry, forest: D.bg === "forest" });
    await playBattle(B, { title: `${D.name} ${F.phases ? `최종전 ${n + 1}단계` : fname} (${n + 1}/${total})`, bg: D.bg });
    const rw = battleRewards(B);
    LOVE_Q.push(...romanceAfterBattle(B));
    gold += rw.gold;
    G.res.gold += rw.gold;
    for (const c of B.units.filter((x) => x.side === "A")) carry[c.unit.id] = c.alive ? c.hp / c.maxHp : 0;
    if (!B.win) {
      await new Promise((r) => showResult("패배…", [...rewardLines(B, rw), "동료들이 쓰러진 동료를 업고 마을로 돌아왔어요."], [{ label: "마을로", fn: r }]));
      break;
    }
    won++;
    if (n < total - 1) {
      const msg = F.phases ? "문지기가 다시 일어선다! 체력은 회복되지 않아요." : "다음 전투로 갈까요? 체력은 회복되지 않아요.";
      const go = await new Promise((r) => showResult(`승리! (${n + 1}/${total})`, [...rewardLines(B, rw), msg], [{ label: "계속 전진", fn: () => r(true) }, { label: "돌아가기", ghost: true, fn: () => r(false) }]));
      if (!go) break;
    } else {
      after = onFloorClear(did, fi);
      const more = D.endless || fi + 1 < D.floors.length;
      await new Promise((r) => showResult(F.boss ? "보스 토벌!" : `${fname} 돌파!`, [...rewardLines(B, rw), more && !F.boss ? `다음 층이 열렸어요.` : ""], [{ label: "마을로", fn: r }]));
      if (after.length) await new Promise((r) => playScenes(after, r));
      if (F.abyssBoss === "mirror_sejin" && !G.seen.mirror) { G.seen.mirror = true; await new Promise((r) => playScenes(["mirror"], r)); }
    }
  }
  for (const f of party) { f.unit.busyToday = true; f.unit.fatigue += 1; }
  log(`${D.name} ${fname} 원정: ${won}승, 💰${gold}`);
  if (won) G.fame += 1;
  // 장 진행(다음 장, 선택지, 엔딩)이 끝나면 밤으로
  if (after.includes("final")) return endingChoice(night);
  afterScenes(after, night);
}

// 밤: 습격 판정 → 하루 마감 → 다음 날 이벤트
async function night() {
  await new Promise((r) => playLoveScenes(LOVE_Q.splice(0), r));
  const raid = raidTonight();
  if (raid) {
    G.seen[raidKey(raid)] = true;
    const { party, carry } = raidParty();
    let win = false;
    if (raid.siege) await new Promise((r) => playScenes(["siege"], r));
    const waves = raid.siege ? raid.waves : [raid];
    for (let w = 0; w < waves.length && party.length; w++) {
      const W = waves[w];
      const foes = W.boss ? W.boss.map(([id, col, lane]) => ({ id, lv: W.lv, col, lane })) : rollEnemies(W.pool, W.n, W.lv);
      const alive = party.filter((f) => carry[f.unit.id] == null || carry[f.unit.id] > 0);
      if (!alive.length) break;
      const B = createBattle(alive, foes, { night: true, wall: G.bld.palisade * 0.08, carry });
      await playBattle(B, { title: raid.siege ? `🔥 오크 대공세 ${w + 1}/${waves.length}` : "🌙 밤 습격", bg: "village_wall" });
      const rw = battleRewards(B);
      LOVE_Q.push(...romanceAfterBattle(B));
      G.res.gold += rw.gold;
      for (const c of B.units.filter((x) => x.side === "A")) carry[c.unit.id] = c.alive ? c.hp / c.maxHp : 0;
      win = B.win;
      await new Promise((r) => showResult(win ? (raid.siege && w < waves.length - 1 ? `${w + 1}번째 물결 격퇴!` : "습격 격퇴!") : "습격을 막지 못했어요", rewardLines(B, rw), [{ label: "확인", fn: r }]));
      if (!win) break;
    }
    if (raid.siege) {
      if (win) {
        G.seen.siegeDone = true;
        await new Promise((r) => playScenes(G.flags.duelwon ? ["ch3clear", "aldricjoin"] : ["ch3clear"], r));
        startChapter(4);
        await new Promise((r) => playScenes(["ch4intro"], r));
      } else {
        G.siegeRetry = (G.siegeRetry || 0) + 5; delete G.seen[raidKey(raid)];
        await new Promise((r) => playScenes(["siegelose"], r));
      }
    }
    if (win) { G.morale = Math.min(100, G.morale + 6); G.fame += 5; log("밤 습격을 막아냈다"); }
    else {
      const keep = 0.75 + G.bld.palisade * 0.04;
      for (const k of ["gold", "food", "wood"]) G.res[k] = Math.round(G.res[k] * keep);
      G.morale = Math.max(0, G.morale - 15); if (G.pop > 10) G.pop--;
      log("밤 습격에 마을이 약탈당했다");
    }
    await new Promise((r) => playScenes([win ? "raidwin" : "raidlose"], r));
    await new Promise((r) => playLoveScenes(LOVE_Q.splice(0), r));
  }
  endDay();
  const evs = dayEvents();
  const done = () => (evs.includes("valtor") ? choiceValtor(showHub) : showHub());
  if (evs.length) playScenes(evs, done); else showHub();
}

// 버튼
const ACT = {
  newgame() { if (hasSave() && !confirm("저장된 게임을 지우고 새로 시작할까요?")) return; startNewGame(); },
  continue() { if (load()) showHub(); },
  savemenu(from) { showSaveMenu(from); },
  saveslot(n) {
    if (slotInfo(+n) && !confirm(`${n}번 칸에 덮어쓸까요?`)) return;
    if (saveSlot(+n)) { toast(`${n}번 칸에 저장했어요`); showSaveMenu(); } else toast("저장할 수 없어요 (저장 공간 부족)");
  },
  loadslot(n) {
    const inGame = !!document.querySelector(".hub");
    if (inGame && !confirm("지금 진행 중인 게임은 저장 칸에 저장하지 않았다면 사라져요. 불러올까요?")) return;
    if (loadSlot(n === "auto" ? "auto" : +n)) { closeModal(); toast("불러왔어요"); showHub(); } else toast("불러올 수 없어요");
  },
  delslot(n) { if (confirm(`${n}번 칸을 지울까요?`)) { deleteSlot(+n); showSaveMenu(document.querySelector(".hub") ? "" : "title"); } },
  exportsave() {
    const code = exportCode();
    (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast("백업 코드를 복사했어요"), () => prompt("아래 코드를 길게 눌러 복사하세요", code));
  },
  downloadsave() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exportCode()], { type: "text/plain" }));
    a.download = `등불영지_${G.day}일째.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  importsave() {
    const code = prompt("백업 코드를 붙여 넣으세요");
    if (!code) return;
    try { importCode(code); closeModal(); toast("불러왔어요"); showHub(); } catch (e) { toast("코드를 읽을 수 없어요"); }
  },
  endday() {
    if (raidTonight() && !G.form.length) { if (!confirm("편성된 동료가 없어요. 이대로 습격을 맞을까요?")) return; }
    night();
  },
  build(id) { if (build(id)) { save(); showHub(); } },
  wk(arg) {
    const [k, d] = arg.split(":"); const v = +d;
    if (v > 0 && (freeVillagers() < 1 || G.workers[k] >= workerCap(k))) return toast("더 배치할 수 없어요");
    if (v < 0 && G.workers[k] <= 0) return;
    G.workers[k] += v; save(); showHub();
  },
  hire(arg) {
    const [from, i] = arg.split(":");
    const u = (from === "mig" ? G.migrants : G.volunteers)[+i];
    const err = hire(u, from);
    if (err) return toast(err);
    save(); closeModal(); showHub();
  },
  peek(arg) { const [from, i] = arg.split(":"); PEEK = (from === "mig" ? G.migrants : G.volunteers)[+i]; DTAB = "stat"; showDetail(PEEK, from); },
  sub(k) { SUB = k; showHub(); },
  dtab(arg) { const [k, id, from] = arg.split(":"); DTAB = k; showDetail(from ? PEEK : unitById(id), from); },
  vol() { refreshVolunteers(); save(); showHub(); },
  barracks() {
    const u = barracksRecruit();
    const err = hire(u, "barracks");
    if (err) return toast(err);
    save(); showHub();
  },
  buy(id) {
    const it = ITEMS[id];
    if (G.res.gold < it.price) return toast("금화가 부족해요");
    G.res.gold -= it.price; G.inv[id] = (G.inv[id] || 0) + 1;
    toast(it.name + " 구입"); save(); showHub();
  },
  detail(id) { const u = unitById(id); DTAB = canPromote(u) ? "skill" : "stat"; showDetail(u); },
  close() { closeModal(); showHub(); },
  forge(id) {
    const u = unitById(id), c = forgeCost(u);
    if (!canAfford(c)) return toast("재료가 부족해요");
    pay(c);
    if (chance(forgeChance(u))) {
      u.weapon.plus++;
      toast(`강화 성공! +${u.weapon.plus}`);
      if ([20, 40, 60].includes(u.weapon.plus) && !u.weapon.name) {
        const nm = prompt("무기가 각성했어요! 이름을 지어 주세요.", u.name + "의 맹세");
        if (nm) u.weapon.name = nm.slice(0, 12);
      }
    } else toast("강화 실패… 재료만 사라졌어요");
    save(); closeModal(); showDetail(u);
  },
  promote(arg) {
    const [id, to] = arg.split(":");
    const u = unitById(id);
    if (promoteBlock(u, to)) return toast(promoteBlock(u, to));
    if (!confirm(`${u.name}을(를) ${JOBS[to].name}(으)로 전직할까요?`)) return;
    promote(u, to); log(`${u.name} → ${JOBS[to].name} 전직`); save(); closeModal(); showDetail(u);
  },
  equip(arg) { const [id, slot, i] = arg.split(":"); showEquipPicker(unitById(id), slot, +i); },
  equipset(arg) {
    const [id, slot, i, item] = arg.split(":");
    const u = unitById(id);
    const cur = slot === "armor" ? u.armor : u.acc[+i];
    if (cur) G.inv[cur] = (G.inv[cur] || 0) + 1;
    if (item) G.inv[item]--;
    if (slot === "armor") u.armor = item || null; else u.acc[+i] = item || null;
    save(); closeModal(); showDetail(u);
  },
  dismiss(id) {
    const u = unitById(id);
    if (!confirm(`${u.name}을(를) 내보낼까요? 되돌릴 수 없어요.`)) return;
    G.roster = G.roster.filter((x) => x !== u); G.form = G.form.filter((f) => f.id !== id);
    G.pop++;
    save(); closeModal(); showHub();
  },
  pickunit(id) { SEL = SEL === id ? null : id; showHub(); },
  cell(arg) {
    const [col, lane] = arg.split(":").map(Number);
    const here = G.form.find((f) => f.col === col && f.lane === lane);
    if (SEL && here && here.id === SEL) { G.form = G.form.filter((f) => f !== here); SEL = null; }
    else if (SEL) {
      const mine = G.form.find((f) => f.id === SEL);
      if (here && mine) { here.col = mine.col; here.lane = mine.lane; }
      else if (here) G.form = G.form.filter((f) => f !== here);
      if (mine) { mine.col = col; mine.lane = lane; }
      else if (G.form.length < 5 || here) G.form.push({ id: SEL, col, lane });
      else toast("최대 5명이에요");
      SEL = null;
    } else if (here) { SEL = here.id; }
    save(); showHub();
  },
  lovetalk(id) { closeModal(true); loveTalk(unitById(id)); },
  lovegift(arg) { const [id, g] = arg.split(":"); closeModal(true); loveGift(unitById(id), g); },
  loveconfess(id) { closeModal(true); loveConfess(unitById(id)); },
  loveoath(id) { closeModal(true); loveOath(unitById(id)); },
  buygift(id) {
    const g = GIFTS[id];
    if (G.res.gold < g.price) return toast("금화가 부족해요");
    G.res.gold -= g.price; G.inv[id] = (G.inv[id] || 0) + 1;
    toast(g.name + " 구입"); save(); showHub();
  },
  expe(arg) { const [did, fi] = arg.split(":"); runExpedition(did, +fi); },
  rebirth(id) {
    const u = unitById(id), c = rebirthCost(u);
    if (G.res.gold < c) return toast("금화가 부족해요");
    if (!confirm(`${u.name}을(를) 환생시킬까요? Lv1로 돌아가지만 능력 일부가 남고 잠재력 하나가 오릅니다. (💰${c})`)) return;
    G.res.gold -= c;
    const k = rebirth(u);
    log(`${u.name} ${u.reb}번째 환생`);
    toast(`환생 완료! ${k ? STAT_NAME[k] + " 잠재력 상승" : ""}`);
    save(); closeModal(); showDetail(u);
  },
};

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]");
  if (t) { TAB = t.dataset.tab; SEL = null; showHub(); return; }
  const a = e.target.closest("[data-act]");
  if (!a) return;
  // 카드 안의 버튼이 카드 클릭보다 먼저
  const fn = ACT[a.dataset.act];
  if (fn) { e.stopPropagation(); fn(a.dataset.arg); }
});

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
// 안드로이드 뒤로 버튼: 앱을 끄지 않고 창 닫기 → 마을 탭으로 → 두 번 누르면 종료
let backArmed = 0;
function trapBack() { try { history.pushState({ fief: 1 }, ""); } catch (e) {} }
window.addEventListener("popstate", () => {
  if (document.querySelector(".modal")) { closeModal(); if (document.querySelector(".hub")) showHub(); trapBack(); return; }
  if (document.querySelector(".scene, .battle")) { trapBack(); return; }
  if (document.querySelector(".hub") && (TAB !== "village" || SUB !== "build")) { TAB = "village"; SUB = "build"; showHub(); trapBack(); return; }
  if (Date.now() - backArmed < 2000) { history.back(); return; }
  backArmed = Date.now(); toast("한 번 더 누르면 종료돼요"); trapBack();
});
trapBack();
showTitle();
