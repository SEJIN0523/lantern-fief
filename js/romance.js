// 동료 프로필(나이·키·신체·관계·사연)과 여성 동료와의 연애
"use strict";

// ---------- 프로필 ----------
const RACE_BODY = {
  // 키 범위(여, 남), 나이 범위, 겉보기 나이로 표시하는 장수 종족
  "인간": { hf: [154, 171], hm: [166, 186], age: [19, 34] },
  "엘프": { hf: [161, 176], hm: [172, 188], age: [19, 29], long: [90, 320] },
  "다크엘프": { hf: [160, 175], hm: [172, 188], age: [19, 29], long: [80, 260] },
  "늑대 수인": { hf: [162, 177], hm: [175, 192], age: [19, 30] },
  "젖소 수인": { hf: [166, 181], hm: [178, 194], age: [20, 32], cupBonus: 3 },
  "곰 수인": { hf: [167, 182], hm: [180, 198], age: [20, 33] },
  "고양이 수인": { hf: [150, 164], hm: [165, 178], age: [19, 28] },
  "여우 수인": { hf: [155, 168], hm: [168, 182], age: [19, 29] },
  "토끼 수인": { hf: [148, 161], hm: [163, 176], age: [19, 27] },
  "하플링": { hf: [118, 130], hm: [120, 134], age: [25, 60] },
  "노움": { hf: [112, 124], hm: [114, 126], age: [40, 120] },
};
const CUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const SEASONS = ["봄", "여름", "가을", "겨울"];

const REL = {
  single: { name: "독신" }, married: { name: "유부녀", gain: 0.7 }, widow: { name: "미망인" },
  engaged: { name: "약혼자 있음", gain: 0.8 }, divorced: { name: "이혼" },
};
const REL_NOTE = {
  single: ["연애 경험이 없다. 남자와 단둘이 있으면 말수가 줄어든다.", "첫사랑에 크게 데인 뒤로 연애를 피해 왔다.", "인기는 많았지만 진지한 연애는 해 본 적이 없다.", "일에만 몰두하느라 연애할 틈이 없었다."],
  married: ["남편은 왕도로 돈을 벌러 떠난 지 3년째. 편지가 끊겼다.", "술에 절어 사는 남편 대신 혼자 집안을 꾸려 왔다.", "정략결혼한 남편은 아내에게 관심이 없다.", "남편과 사이가 나쁘지는 않지만, 설렘이 사라진 지 오래다.", "모험가인 남편이 던전에서 실종됐다. 아직 사망 확인은 없다."],
  widow: ["남편을 고블린 습격으로 잃었다.", "병으로 남편을 먼저 보냈다. 아직 반지를 빼지 못했다."],
  engaged: ["고향에 부모가 정한 약혼자가 있다. 얼굴도 두 번밖에 못 봤다.", "출세한 약혼자가 기다리고 있지만, 마음이 가지 않는다."],
  divorced: ["바람피운 남편과 헤어지고 고향을 떠났다.", "가문 사정으로 이혼당하고 쫓겨나다시피 나왔다."],
};
const DREAMS = ["작은 빵집을 여는 것", "세상에서 가장 강해지는 것", "고향 마을에 학교를 세우는 것", "바다를 직접 보는 것", "잃어버린 동생을 찾는 것", "귀족들 앞에서 노래하는 것", "자기 이름이 붙은 무기를 갖는 것", "따뜻한 가정을 꾸리는 것", "아무도 굶지 않는 마을", "전설 속 용을 한 번 보는 것"];
const FOODS = ["사과 파이", "매운 고기 스튜", "꿀 바른 빵", "구운 생선", "버섯 수프", "치즈", "과일주", "달콤한 우유죽", "훈제 소시지", "베리 타르트"];

// 선물: 상점에서 사서 건넨다. 성격마다 좋아하는 것이 다르다
const GIFTS = {
  flower: { name: "들꽃 다발", price: 8 },
  sweets: { name: "꿀과자", price: 12 },
  ribbon: { name: "비단 리본", price: 15 },
  novel: { name: "연애 소설", price: 20 },
  wine: { name: "과일주", price: 18 },
  whet: { name: "고급 숫돌", price: 25 },
  hairpin: { name: "은 머리핀", price: 35 },
  perfume: { name: "향수", price: 45 },
  ring: { name: "약속의 반지", price: 300, oath: true },
};
const GIFT_ART = { flower: "items_consumable_12", sweets: "items_consumable_5", ribbon: "items_material_8", novel: "items_consumable_14", wine: "items_consumable_11", whet: "items_forge_1", hairpin: "items_accessory_11", perfume: "items_consumable_23", ring: "items_accessory_3" };

function ensureProfile(u) {
  if (u.prof) return u;
  const R = RACE_BODY[u.race] || RACE_BODY["인간"];
  const f = u.gender === "f";
  const p = {};
  if (u.hero) { p.age = 28; p.height = 176; }
  else {
    p.age = rint(...R.age) + (f ? 0 : rint(0, 12));
    if (R.long) p.realAge = rint(...R.long);
    p.height = rint(...(f ? R.hf : R.hm));
  }
  p.birthday = `${pick(SEASONS)} ${rint(1, 28)}일`;
  p.food = pick(FOODS);
  p.dream = pick(DREAMS);
  if (f) {
    // 가슴은 크게, 몸은 가늘게
    const ci = clamp(rint(3, 8) + (R.cupBonus || 0) + (chance(0.15) ? 1 : 0), 0, CUPS.length - 1);
    const under = rint(64, 71) + Math.round((p.height - 160) * 0.15);
    p.cup = CUPS[ci];
    p.bwh = [under + 10 + ci * 2.5 | 0, rint(54, 60), rint(84, 92) + (u.race === "젖소 수인" ? 4 : 0)];
    const married = u.line === "villager" ? 0.35 : 0.12;
    const r = Math.random();
    p.rel = r < married ? "married" : r < married + 0.07 ? "widow" : r < married + 0.14 ? "engaged" : r < married + 0.2 ? "divorced" : "single";
    p.note = pick(REL_NOTE[p.rel]);
    const keys = Object.keys(GIFTS).filter((k) => !GIFTS[k].oath);
    const likes = [...keys].sort(() => Math.random() - 0.5);
    p.likes = likes.slice(0, 2); p.dislike = likes[likes.length - 1];
  } else {
    p.rel = u.hero ? "single" : chance(0.25) ? "married" : "single";
  }
  // 1장 시작 동료 엘마는 남편이 떠난 유부녀
  if (u.name === "엘마" && u.line === "villager") { p.rel = "married"; p.note = REL_NOTE.married[0]; }
  u.prof = p;
  u.love = u.love || 0; u.loveStage = u.loveStage || 0;
  return u;
}

// ---------- 호감도 ----------
const LOVE_STAGES = [
  { name: "낯섦", at: 0, bonus: 0 }, { name: "친근", at: 15, bonus: 0.02 }, { name: "호감", at: 35, bonus: 0.04 },
  { name: "연정", at: 60, bonus: 0.07 }, { name: "연인", at: 85, bonus: 0.12 }, { name: "서약", at: 100, bonus: 0.18 },
];
const canRomance = (u) => u && u.gender === "f" && !u.hero && ensureProfile(u);
const toneOf = (u) => ({ coward: "shy", calm: "shy", loner: "shy", lazy: "shy", optimist: "bright", chatty: "bright", kind: "bright", diligent: "bright" }[u.traits.personality] || "bold");

function addLove(u, v) {
  if (!canRomance(u)) return [];
  const g = REL[u.prof.rel].gain || 1;
  const mul = v > 0 ? g * (traitMod(u, "bond") ? 1.5 : 1) : 1;
  // 고백 전에는 84에서 멈춘다
  const cap = u.loveStage >= 4 ? 100 : 84;
  u.love = clamp(Math.round((u.love + v * mul) * 10) / 10, 0, cap);
  const ups = [];
  while (u.loveStage < 3 && u.love >= LOVE_STAGES[u.loveStage + 1].at) { u.loveStage++; ups.push(u.loveStage); }
  return ups;
}
// 출전하면 호감 단계만큼 능력 보너스(주인공이 지휘하는 전투)
function loveBattleBonus(B) {
  if (!B.hero) return;
  for (const c of B.units) {
    if (c.side !== "A" || !c.unit.loveStage) continue;
    const k = 1 + LOVE_STAGES[c.unit.loveStage].bonus;
    for (const s of ["atk", "mag", "def", "res", "heal"]) c[s] = Math.round(c[s] * k);
  }
}
// 전투가 끝나면: 세진과 함께 이긴 여성 동료의 호감 상승
function romanceAfterBattle(B) {
  if (!B.win || !B.hero) return [];
  const ups = [];
  for (const c of B.units) if (c.side === "A" && canRomance(c.unit)) for (const s of addLove(c.unit, 1.5)) ups.push([c.unit, s]);
  return ups;
}

// ---------- 대사 ----------
const TALK = {
  shy: [
    ["…아, 세진 씨. 무슨 일이세요?", "저, 저는 괜찮아요. 신경 써 주셔서… 고마워요.", "말을 거는 사람이 별로 없어서요. 조금 놀랐어요."],
    ["세진 씨랑 얘기하면 이상하게 마음이 편해요.", "오늘도… 와 주셨네요. 기다린 건 아니에요. 정말로요.", "가끔 세진 씨 고향 얘기를 듣고 싶어요."],
    ["…곁에 있어 주세요. 오늘은 조금만 더.", "당신 목소리를 들으면 잠이 잘 와요.", "이렇게 손을 잡고 있으면… 아무것도 무섭지 않아요."],
  ],
  bright: [
    ["세진 씨! 오늘 날씨 좋죠? 같이 산책할래요?", "마을이 조금씩 나아지고 있어요. 세진 씨 덕분이에요!", "뭐든 시켜 주세요. 저 힘 세요!"],
    ["세진 씨 얼굴 보니까 피곤이 싹 가셨어요!", "오늘 점심 같이 먹어요. 제가 만들었어요!", "있잖아요, 세진 씨는 좋아하는 사람 있어요? …그냥 궁금해서요!"],
    ["오늘도 사랑해요! 내일도, 모레도요.", "당신이 웃으면 저도 웃게 돼요. 이상하죠?", "우리 나중에 집은 언덕 위에 짓자요. 창이 큰 걸로!"],
  ],
  bold: [
    ["뭐야, 할 말 있어? 짧게 해.", "흥, 영주님께서 직접 납시었네.", "훈련 상대가 필요하면 불러. 봐주진 않을 거야."],
    ["…너, 생각보다 괜찮은 녀석이네.", "다음 원정도 내가 앞에 설게. 너는 뒤에서 지휘나 해.", "딱히 기다린 건 아니야. 마침 여기 있었을 뿐이지."],
    ["너 말고 다른 녀석한테 등을 맡길 생각은 없어.", "…가끔은 이렇게 기대도 되지?", "누가 너를 건드리면 내가 가만 안 둬. 알지?"],
  ],
};
const TALK_MARRIED = [
  "…남편이 있는 몸인데, 이렇게 자꾸 당신을 찾게 돼요.",
  "그 사람은 이런 얘기를 들어 준 적이 없었어요.",
  "마을 사람들 눈이 있으니까… 조금만 떨어져서 걸어요.",
  "반지를 빼 둔 날이 점점 많아지고 있어요.",
];
const TALK_HOBBY = {
  cook: "오늘 저녁은 제가 만들게요. 좋아하는 거 있어요?", fish: "냇가에 큰 송어가 있어요. 다음에 같이 가요.",
  sing: "새 노래를 하나 배웠어요. 들어 볼래요?", read: "이 책 재밌어요. 다 읽으면 빌려줄게요.",
  gamble: "주사위 한 판 어때요? 지면 내일 밥 사기.", smith: "무기 손질은 제가 할게요. 손 이리 줘 봐요.",
  garden: "밭에 새싹이 났어요! 보러 갈래요?", drink: "오늘 밤 한잔 어때요? 둘이서만.",
  animal: "마구간에 새끼 양이 태어났어요. 너무 귀여워요!", train: "아침 훈련 같이 해요. 땀 흘리면 개운해요.",
  craft: "이거 제가 깎은 거예요. 세진 씨 주려고요.",
};

function talkLine(u) {
  const tier = u.loveStage >= 4 ? 2 : u.loveStage >= 2 ? 1 : 0;
  if (u.prof.rel === "married" && u.loveStage >= 2 && u.loveStage < 5 && chance(0.4)) return pick(TALK_MARRIED);
  if (chance(0.25) && TALK_HOBBY[u.traits.hobby]) return TALK_HOBBY[u.traits.hobby];
  return pick(TALK[toneOf(u)][tier]);
}

// 단계가 오를 때의 장면
function loveScene(u, stage) {
  const n = u.name, t = toneOf(u), m = u.prof.rel === "married";
  const S = {
    1: { shy: [[n, "저기… 이거, 받아 주세요. 지난번에 고마웠어요."]], bright: [[n, "세진 씨! 우리 이제 친구 맞죠? 그렇죠?"]], bold: [[n, "…너, 이름 제대로 불러도 되지? 세진."]] },
    2: { shy: [[n, "요즘… 자꾸 세진 씨를 눈으로 찾게 돼요."], ["세진(속)", "얼굴이 빨개졌다. 나도 모르게 시선을 피했다."]], bright: [[n, "있잖아요, 세진 씨 옆에 있으면 하루가 너무 빨리 가요!"]], bold: [[n, "네가 다치면… 이상하게 화가 나. 그러니까 조심해."]] },
    3: m
      ? { all: [["", "늦은 밤, 우물가. 그녀가 왼손의 반지를 만지작거리고 있었다."], [n, "저 결혼한 몸이에요. 알아요. 그런데…"], [n, "당신을 생각하면 가슴이 아파요. 이러면 안 되는데."], ["세진(속)", "대답할 말을 찾지 못했다. 그녀의 손이 내 소매를 살짝 잡았다."]] }
      : { shy: [["", "노을이 지는 목책 위. 그녀가 한참을 망설이다 입을 열었다."], [n, "세진 씨는… 언젠가 원래 세계로 돌아가는 거죠?"], [n, "그날이 안 오면 좋겠다고 생각해 버렸어요. …나쁜 사람이죠, 저."]], bright: [[n, "세진 씨! 저, 아무래도 세진 씨를 좋아하는 것 같아요!"], [n, "…방금 거 못 들은 걸로 해 주세요! 아니, 들었으면 좋겠어요!"]], bold: [[n, "…야. 나 요즘 이상해."], [n, "네 생각만 나. 훈련을 해도, 싸워도. 책임져."]] },
    4: m
      ? { all: [[n, "남편에게 편지를 썼어요. 이제 기다리지 않겠다고."], [n, "손가락질받아도 괜찮아요. 당신 곁에 있고 싶어요."], ["*", `${n}과(와) 연인이 되었다.`]] }
      : { all: [["세진", "좋아해. 이 세계에 와서 처음으로, 여기 남고 싶다는 생각이 들었어."], [n, toneOf(u) === "bold" ? "…바보. 내가 먼저 말하려고 했는데." : "…네. 저도요. 처음부터 쭉."], ["*", `${n}과(와) 연인이 되었다.`]] },
    5: { all: [["", "등불골의 작은 예배당. 마을 사람 몇이 조용히 지켜보고 있었다."], [n, m ? "이번에는 제가 고른 사람이에요. 끝까지 함께할게요." : "어느 세계에 있든, 당신 곁이 제 자리예요."], ["*", `${n}과(와) 평생을 함께하기로 서약했다. 전투에서 서로를 지키는 힘이 강해진다.`]] },
  }[stage];
  return { bg: stage >= 5 ? "festival" : stage >= 3 ? "dusk" : "village", lines: S.all || S[t], uid: u.id };
}
function playLoveScenes(ups, done) {
  if (!ups.length) return done && done();
  const [u, s] = ups.shift();
  log(`${u.name}: 호감 단계 「${LOVE_STAGES[s].name}」`);
  playScene(loveScene(u, s), () => playLoveScenes(ups, done));
}

// ---------- 행동 ----------
function loveTalk(u) {
  if (u.talkDay === G.day) return toast("오늘은 이미 이야기를 나눴어요");
  u.talkDay = G.day;
  const line = talkLine(u);
  const ups = addLove(u, rint(3, 5)).map((s) => [u, s]);
  save();
  playScene({ bg: "village", lines: [[u.name, line]], uid: u.id }, () => playLoveScenes(ups, () => { save(); showHub(); showDetail(u); }));
}
function loveGift(u, gid) {
  if (u.giftDay === G.day) return toast("선물은 하루에 한 번이에요");
  if (!G.inv[gid]) return toast("가진 선물이 없어요");
  G.inv[gid]--; u.giftDay = G.day;
  const liked = u.prof.likes.includes(gid), bad = u.prof.dislike === gid;
  u.prof.known = u.prof.known || [];
  if ((liked || bad) && !u.prof.known.includes(gid)) u.prof.known.push(gid);
  const ups = addLove(u, liked ? 9 : bad ? -3 : 4).map((s) => [u, s]);
  const line = liked ? { shy: "이거… 제가 좋아하는 거 어떻게 아셨어요?", bright: "우와! 이거 제일 좋아하는 거예요! 고마워요!", bold: "…흥. 나쁘지 않네. 아니, 사실 꽤 좋아." }[toneOf(u)]
    : bad ? { shy: "아… 고, 고마워요. (조금 곤란해 보인다)", bright: "음… 마음만 받을게요! 헤헤.", bold: "이건 별로야. 다음엔 제대로 골라 와." }[toneOf(u)]
    : { shy: "고마워요. 소중히 할게요.", bright: "선물이에요? 고마워요!", bold: "주는 거면 받지 뭐." }[toneOf(u)];
  save();
  playScene({ bg: "village", lines: [[u.name, line]], uid: u.id }, () => playLoveScenes(ups, () => { save(); showHub(); showDetail(u); }));
}
function loveConfess(u) {
  if (u.loveStage !== 3 || u.love < 84) return toast("아직 마음이 충분히 깊지 않아요");
  u.loveStage = 4; save();
  playLoveScenes([[u, 4]], () => { save(); showHub(); showDetail(u); });
}
function loveOath(u) {
  if (u.loveStage !== 4 || u.love < 100) return toast("호감도가 가득 차야 해요");
  if (!G.inv.ring) return toast("약속의 반지가 필요해요 (상점)");
  G.inv.ring--; u.loveStage = 5; save();
  playLoveScenes([[u, 5]], () => { save(); showHub(); showDetail(u); });
}

// ---------- 화면 ----------
function giftIc(id) {
  return `<span class="itx ${id === "ring" ? "g4" : "g1"}">선물</span>`;
}
function loveTag(u) {
  if (!u.loveStage || u.gender !== "f") return "";
  return `<span class="tag love">♥ ${LOVE_STAGES[u.loveStage].name}</span>`;
}
function detailProfile(u, hireFrom) {
  ensureProfile(u);
  const p = u.prof, f = u.gender === "f";
  const row = (k, v, wide) => `<div class="pf-row${wide ? " wide" : ""}"><span>${k}</span><b>${v}</b></div>`;
  const age = p.realAge ? `겉보기 ${p.age}세 <small>(실제 ${p.realAge}세)</small>` : `${p.age}세`;
  const known = p.known || [];
  const likeTxt = f ? (u.loveStage >= 2 ? p.likes.map((g) => GIFTS[g].name).join(", ") : p.likes.map((g) => (known.includes(g) ? GIFTS[g].name : "???")).join(", ")) : "";
  const prof = `<h4 class="sub">프로필</h4><div class="pf pf2">
    ${row("나이", age)}${row("키", p.height + "cm")}${row("생일", p.birthday)}
    ${row("관계", (u.hero ? "독신" : f ? REL[p.rel].name : p.rel === "married" ? "기혼" : "독신"))}
    ${f ? row("신체", `B${p.bwh[0]}(${p.cup}) · W${p.bwh[1]} · H${p.bwh[2]}`, true) : ""}
    ${row("좋아하는 음식", p.food, true)}${row("꿈", p.dream, true)}
    ${f && p.note ? `<p class="pf-note">${esc(p.note)}</p>` : ""}
  </div>`;
  if (!canRomance(u) || hireFrom) return prof;
  // 연애는 맨 위: 버튼을 스크롤 없이 바로 누를 수 있게
  const st = LOVE_STAGES[u.loveStage];
  const next = LOVE_STAGES[u.loveStage + 1];
  const talked = u.talkDay === G.day, gifted = u.giftDay === G.day;
  const gifts = Object.keys(GIFTS).filter((g) => G.inv[g] > 0 && !GIFTS[g].oath);
  const love = `<div class="love-box">
    <div class="love-head"><b>세진과의 관계 · ${st.name}</b><span>♥ ${Math.floor(u.love)}</span></div>
    <div class="love-bar"><i style="width:${u.love}%"></i></div>
    <small>${next ? `다음 「${next.name}」 ${next.at}` : "서약을 맺었어요"} · 출전하면 능력 +${Math.round(st.bonus * 100)}%${REL[p.rel].gain ? ` · ${REL[p.rel].name}라 마음이 쉽게 열리지 않아요` : ""}</small>
    <div class="love-acts">
      <button class="btn ${talked ? "" : "gold"}" ${talked ? "disabled" : ""} data-act="lovetalk" data-arg="${u.id}">💬 ${talked ? "오늘 대화함" : "대화하기"}</button>
      ${u.loveStage === 3 && u.love >= 84 ? `<button class="btn gold" data-act="loveconfess" data-arg="${u.id}">💌 고백하기</button>` : ""}
      ${u.loveStage === 4 && u.love >= 100 ? `<button class="btn gold" data-act="loveoath" data-arg="${u.id}">💍 서약하기 ${G.inv.ring ? "" : "(반지 필요)"}</button>` : ""}
    </div>
    <div class="gift-row">${gifted ? '<small>오늘은 선물을 줬어요.</small>' : gifts.length ? gifts.map((g) => `<button class="btn sm" data-act="lovegift" data-arg="${u.id}:${g}">${giftIc(g)} ${GIFTS[g].name} ×${G.inv[g]}</button>`).join("") : '<small>가진 선물이 없어요 (마을 → 상점)</small>'}</div>
    <small>좋아하는 선물: ${likeTxt}</small>
  </div>`;
  return love + prof;
}
function renderGiftShop() {
  return Object.entries(GIFTS).filter(([, g]) => !g.oath || G.bld.hall >= 2).map(([id, g]) => `
    <div class="shop-it"><span class="shop-ic">${giftIc(id)}</span><div><b>${g.name}</b><small>${g.oath ? "연인에게 서약을 청할 때 필요해요" : "선물"}</small></div><small class="own">보유 ${G.inv[id] || 0}</small><button class="btn sm" data-act="buygift" data-arg="${id}">💰${g.price}</button></div>`).join("");
}
