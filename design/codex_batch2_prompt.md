C:\CLAUDE\FIEF 에 있는 모바일 게임 「등불 영지 — 이계의 영주」의 추가 그림을 만들어 줘. 처음 보는 작업이라고 생각하고 아래를 끝까지 읽은 뒤 시작해 줘.

## 작업 범위
- 그림 파일만 새로 만든다. 코드(js, css, html)와 기존 그림은 건드리지 않는다.
- 저장 위치: C:\CLAUDE\FIEF\design\output\ 아래 지정한 경로에 바로 저장한다. 같은 이름이 있으면 덮어쓴다.
- 목록 전체(시트 6장 + 장면 9장 = 15장)를 멈추지 말고 한 번에 만든다.
- 다 만들면 아래 「마지막 확인」을 하고, 만든 파일 목록과 확인 결과를 짧게 알려 줘.

## 꼭 먼저 볼 참고 그림
- 화풍 기준: C:\CLAUDE\FIEF\design\output\jobs\warrior.png (도트 그래픽, 진한 1px 외곽선, 색당 2~3단 명암, 따뜻한 흙빛 팔레트, 머리:몸 = 1:3.5 정도의 SD 비율)
- 인물 얼굴 기준(아래 시트마다 해당 파일을 열어서 같은 사람으로 그릴 것):
  - civ_warrior.png → design\output\jobs\warrior.png
  - civ_soldier.png → design\output\jobs\spearman.png
  - civ_rogue.png → design\output\jobs\thief.png
  - civ_archer.png → design\output\jobs\archer.png
  - civ_mage.png → design\output\jobs\mage.png
  - civ_cleric.png → design\output\jobs\acolyte.png
- 주인공 세진: design\output\jobs\sejin.png (20대 후반 한국인 남성, 짧고 약간 헝클어진 검은 머리, 안경 없음, 수염 없음, 마른 체형)
- 등장인물: design\output\npc\npc_a.png, npc_b.png, npc_c.png (촌장 보린, 리나, 마르타, 기사단장 알드릭, 서윤, 궁정마법사 발토르 등)

---------------------------------------------------------------
# PART 1 — 평민 복장 시트 6장 (design\output\jobs\civ_<계열>.png)

게임 설정: 동료는 모두 마을 사람으로 들어와서, 나중에 각 계열의 1차 직업(전사·창병·도적·궁수·견습 마법사·견습 사제)으로 전직한다. 이 시트는 「전직하기 전의 같은 사람」이다. 전직 후 그림(참고 파일)과 얼굴·종족·피부색·머리색·머리 모양·체형이 완전히 같아야 하고, 옷과 들고 있는 물건만 다르다.

SHEET FORMAT (exactly like the reference sheets):
- Canvas exactly 1536x1024, 3 columns x 2 rows = 6 cells of 512x512. Cell order: top-left = slot 1, top-middle = slot 2, top-right = slot 3, bottom-left = slot 4, bottom-middle = slot 5, bottom-right = slot 6.
- Slot N on civ_<line>.png is the SAME person as slot N on that line's reference sheet listed above. Open the reference sheet and copy each face, race, ears/horns/tail, skin tone, hair color and hairstyle exactly.
- One full-body figure per cell, centered, same scale as the reference (a human adult is about 80% of the cell height), feet on the same baseline in each row, nothing crossing cell borders. Halflings and gnomes stay clearly shorter.
- Background: solid flat #FF00FF magenta everywhere, no gradient, no floor, no ground shadow. Never use magenta, hot pink or purple-pink inside the figures.
- No text, no labels, no UI, no frames. All figures face RIGHT. All are adults.
- Pose: calm natural standing pose, similar on all 6 cells (small natural differences are fine).

OUTFIT (the point of this sheet):
- Plain rural fantasy village clothes, NOT adventurer gear: linen or cotton shirts, simple vests, aprons, rolled sleeves, work trousers, simple boots, a headscarf or straw hat for some. Earthy colors (cream, brown, faded green, muted blue).
- Each person holds one everyday village object that hints at their future line, NOT a real weapon:
  - civ_warrior: a wooden practice sword or a woodcutter's hatchet
  - civ_soldier: a pitchfork or a long wooden staff
  - civ_rogue: a small kitchen knife in a belt sheath and a coin pouch
  - civ_archer: a hunting sling or a small homemade short bow with a few arrows
  - civ_mage: an old book or a candle in a holder
  - civ_cleric: a basket of herbs or a small wooden prayer charm
- Women: slim, slender bodies (slim arms and legs, narrow waist, not chubby, not muscular) with a very large, full bust, like on the reference sheets. Their village clothes are light and a little revealing in a cute rustic way: off-shoulder peasant blouses with a low neckline showing cleavage, laced corset bodices, short skirts or short shorts, bare shoulders and thighs. No nudity: chest and hips stay covered.
- Men: simple, clean village clothes fitted to their build.
- Beastfolk keep fully human faces with only animal ears, horns and tail (no muzzle, no fur on face or body).

---------------------------------------------------------------
# PART 2 — 이야기 장면 9장 (design\output\story\<파일>.png)

FORMAT: canvas exactly 1024x1536 portrait, full cinematic pixel art scene in the same style and palette, no text, no letters, no UI. Characters must look exactly like their reference sheets (Sejin from sejin.png slot 5 "lord" outfit unless noted, NPCs from npc_*.png). Women follow the same body rule as above.

- story_12_siege.png — 3장: 밤의 공성전. 등불골의 돌 성벽 위, 횃불 아래에서 마을 사람들과 동료들이 활과 창으로 방어하고, 성벽 아래로 수많은 오크 무리와 거대한 트롤이 몰려온다. 세진(통솔자 복장, sejin.png slot 3)이 성벽 위에서 손을 뻗어 지휘한다. 주황 횃불과 푸른 밤하늘 대비.
- story_13_duel.png — 3장: 마을 광장에서 왕국 기사단장 알드릭(npc_b slot 4, 화려한 왕실 갑옷)과 마을 동료 전사가 목검으로 결투하고, 주변에 마을 사람들과 기사들이 둘러서서 지켜본다. 낮, 긴장감.
- story_14_seoyun.png — 4장: 화산 동굴 입구, 붉은 용암빛 속에서 후드를 벗은 서윤(npc_c slot 2, 40대 중반 한국인 여성, 회색 줄이 섞인 짧은 검은 머리, 눈썹 흉터, 낡은 여행용 코트에 은은한 청록색 선)이 세진(sejin.png slot 4 군사 복장)을 마주 보고 이야기한다. 서윤의 손에 금이 간 청록색 수정 조각.
- story_15_key.png — 4장: 리나(npc_c slot 5, 약초 가방을 멘 10살 소녀, 완전히 옷을 입은 아이)가 작은 손으로 녹슨 자동차 키를 꼭 쥐고 있고, 세진(군사 복장)이 무릎을 꿇어 눈높이를 맞추고 있다. 따뜻한 오두막 안, 창으로 들어오는 저녁빛. 리나의 엄마 마르타가 뒤에서 지켜본다.
- story_16_spring.png — 5장: 마을 지하 동굴에서 「윤회의 샘」이 깨어난다. 둥근 샘물이 밝은 하늘색으로 빛나며 빛기둥이 솟고, 샘의 정령(npc_b slot 6, 빛나는 물로 된 여인)이 떠오른다. 세진(영주 복장)과 동료들이 놀라서 바라본다. 하늘이 갈라진 균열의 청록색 빛이 천장 틈으로 비친다.
- story_17_valtor.png — 5장: 왕성의 어두운 마법 실험실, 바닥의 거대한 소환 마법진 위에 금이 간 소환 수정이 떠 있고, 지친 궁정마법사 발토르(npc_c slot 1, 50대, 은실 자수의 긴 검은 로브)가 무릎을 꿇은 채 세진(영주 복장)을 올려다본다. 벽에는 실패한 소환자들의 초상화 여러 장(얼굴은 흐릿하게).
- ending_return.png — 귀환 엔딩: 현대 한국의 사무실, 밤. 정장 차림의 세진(sejin.png slot 1의 얼굴과 정장, 다치지 않은 깨끗한 모습)이 책상 앞에서 한 장의 그림을 들여다보며 미소 짓는다. 그림 속에는 판타지 동료들(기사, 궁수, 마법사, 사제, 도적)과 산골 마을이 그려져 있다. 창밖은 도시 야경, 책상 위에 볼펜 한 자루.
- ending_stay.png — 잔류 엔딩: 해 질 녘, 커다란 요새 도시로 자란 등불골(산과 등불 문장 깃발, 높은 성벽, 언덕 위의 성)을 내려다보는 언덕 위에서 영주 복장의 세진이 동료들과 함께 서 있다. 하늘의 균열은 닫혀 있고, 리나와 마을 사람들이 손을 흔든다.
- ending_true.png — 진 엔딩: 거대한 고대 석문(귀환의 문)이 열려 있고, 문 한쪽에는 판타지 마을의 노을, 다른 쪽에는 한국 도시의 야경이 보인다. 문 한가운데에 큰 등불이 떠서 두 세계를 따뜻한 빛으로 잇는다. 세진(개척자 복장, sejin.png slot 6, 은은한 청록색 선이 흐르는 영주 코트)과 서윤, 동료들이 문 앞에 서 있다.

---------------------------------------------------------------
# 마지막 확인
- civ_*.png 6장: 각각 1536x1024, 3x2 격자, 칸 밖으로 넘친 것 없음, 배경이 균일한 #FF00FF, 인물 안에 마젠타·분홍 없음, 모두 오른쪽을 봄.
- 각 civ 시트의 칸 N 인물이 참고 시트의 칸 N과 같은 사람인지 나란히 놓고 비교(얼굴, 종족, 귀·뿔·꼬리, 피부색, 머리색, 머리 모양). 다르면 다시 그린다.
- 장면 9장: 각각 1024x1536 세로, 글자 없음, 세진은 안경 없음.
- 문제가 있는 파일은 다시 만든 뒤 알려 줘.
