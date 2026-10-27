# 배경 라이브러리

이미지: `art/ui/backgrounds/` · 등록: `js/ui.js`의 `UI_BACKGROUNDS`.
내장 image_gen으로 12종 제작 후 WebP로 저장. 인물·글자 없는 세로 배경.
기존 `ART`에 해당 그림이 등록되면 해당 그림을 우선 사용한다.

| 키 | 용도 | 파일 |
|---|---|---|
| `city` | 비 내리는 도시의 횡단보도 | `rain-city.webp` |
| `awakening` | 두 달이 떠 있는 이세계의 숲 | `twin-moon-forest.webp` |
| `thicket` | 큰 나무와 수풀이 우거진 숲길 | `forest-thicket.webp` |
| `room` | 햇빛이 드는 마을 회복실 | `cottage-room.webp` |
| `village` | 아침 햇살이 비치는 등불골 | `village-morning.webp` |
| `village_wall` | 등불 아래의 야간 목책 | `palisade-night.webp` |
| `night` | 달빛 아래의 마을 입구 | `palisade-night.webp` |
| `guild` | 모험가 길드 출장소 | `guild-hall.webp` |
| `tavern` | 따뜻한 불빛의 마을 주점 | `tavern-evening.webp` |
| `smithy` | 화로가 켜진 마을 대장간 | `smithy-forge.webp` |
| `mine` | 버려진 광산의 갱도 | `abandoned-mine.webp` |
| `graveyard` | 달빛과 안개가 감도는 묘지 | `moonlit-graveyard.webp` |
| `festival` | 등불이 걸린 마을 축제 | `village-festival.webp` |

프롤로그: 도시 → 두 달의 숲 → 수풀(구출/방어) → 회복실 → 낮의 마을.
습격: `village_wall` 전장, 패배 후 `night`, 승리 후 `festival`.
1장 클리어: 처음 세 줄은 기존 숲 배경, 네 번째 줄부터 축제 배경으로 전환.
모집은 길드, 상점은 주점, 동료 장비 탭은 대장간 배너를 사용한다.
광산(`mine`)과 묘지(`graveyard`)는 후속 콘텐츠용으로 준비했으며, 현재 던전이나 진행 조건을 추가하지 않는다.

추가 화면에서는 `scenery("mine")`, 전투에서는 `bg: "mine"`처럼 사용할 수 있다.
전체 선다운로드 없이 해당 화면에서 이미지를 불러오며, 기존 서비스워커가 방문한 art/ 경로를 캐시한다.
대사·날짜 이벤트·상태·전투 수치·저장 형식은 변경하지 않는다.
