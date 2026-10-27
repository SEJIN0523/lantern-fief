"""Codex 시트를 잘라 art/ 아래 webp로 저장하고 js/art.js를 만든다.

사용: python tools/slice_art.py [원본 폴더=design/output]
- 마젠타(#FF00FF) 배경을 지우고 칸별로 자른다
- 캐릭터·몬스터·건물: 발(맨 아래)을 그림 아래 가운데에 맞춘다. 같은 시트 안의 크기 비율은 유지
- 아이콘·효과: 내용만 잘라 정사각형 가운데에 둔다
- 배경·마을·스토리: 크기만 줄인다
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "design" / "output"
OUT = ROOT / "art"

# 재생성 대기 중이라 아직 쓰지 않는 시트 ("시트" 전체 또는 "시트#칸")
SKIP = set()

# 다른 칸보다 작게 그려진 인물 보정: "시트#칸": 배율
CELL_SCALE = {"jobs/civ_soldier#6": 1.29}

# 건물 시트 → 게임 건물 id (위 줄 A, 아래 줄 B)
BUILDINGS = {
    "bld_01": ("hall", "lodging"), "bld_02": ("smithy", "tavern"), "bld_03": ("church", "guild"),
    "bld_04": ("barracks", "farm"), "bld_05": ("ranch", "market"), "bld_06": ("appraiser", "lab"),
    "bld_07": ("bath", "magetower"), "bld_08": ("palisade", "warehouse"), "bld_09": ("council", "spring"),
}

ART = {}


def remove_magenta(rgb):
    """RGB 배열 → 알파 배열. 테두리와 이어진 마젠타 + 완전한 마젠타 + 가장자리 번짐을 지운다."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    mag = np.minimum(r, b) - g
    loose = (r > 140) & (b > 140) & (mag > 70)
    strict = (r > 225) & (b > 225) & (g < 50)
    lab, _ = ndimage.label(loose)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge)) | strict
    # 가장자리 2px 띠에서 마젠타 기운이 남은 픽셀
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    bg |= band & (mag > 35) & (r > 90) & (b > 90)
    fg = ~bg
    # 작은 부스러기 제거
    lab, n = ndimage.label(fg)
    if n:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        fg &= np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 40])
    # 남은 가장자리 픽셀의 분홍 기운 빼기
    rim = fg & ndimage.binary_dilation(~fg, iterations=1)
    out = rgb.copy()
    pink = rim & (mag > 15)
    out[..., 0][pink] = np.minimum(r, g + 40)[pink]
    out[..., 2][pink] = np.minimum(b, g + 40)[pink]
    return out, (fg * 255).astype(np.uint8)


def save(img, rel, key):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=88, method=4)
    ART[key] = "art/" + rel.replace("\\", "/")


def cells(im, cols, rows):
    w, h = im.width // cols, im.height // rows
    for i in range(cols * rows):
        x, y = (i % cols) * w, (i // cols) * h
        yield i + 1, im.crop((x, y, x + w, y + h))


def keyed(cell):
    rgb = np.array(cell.convert("RGB"))
    rgb, a = remove_magenta(rgb)
    # 옆 칸에서 넘어온 무기 끝 같은 조각을 버리고 본체 덩어리만 남긴다
    fg = a > 0
    lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=8))
    if n > 1:
        area = ndimage.sum(fg, lab, range(1, n + 1))
        main = int(np.argmax(area)) + 1
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        keep = [i + 1 for i, s in enumerate(area) if i + 1 == main or (s >= area.max() * 0.12 and i + 1 not in edge)]
        a = np.where(np.isin(lab, keep), a, 0).astype(np.uint8)
    return rgb, a


def foot_anchor(cell, size):
    """발을 아래 가운데에 맞춘 정사각형(필요하면 가로로 넓게) RGBA."""
    rgb, a = keyed(cell)
    ys, xs = np.nonzero(a)
    if not len(ys):
        return None
    top, bot = ys.min(), ys.max()
    low = ys >= bot - max(4, (bot - top) * 0.12)
    fx = int(np.median(xs[low]))
    S = cell.height
    half = max(S // 2, fx - xs.min() + 2, xs.max() - fx + 2)
    body = Image.fromarray(np.dstack([rgb, a]), "RGBA").crop((xs.min(), top, xs.max() + 1, bot + 1))
    im = Image.new("RGBA", (half * 2, S))
    im.paste(body, (half - (fx - xs.min()), S - 2 - body.height))
    scale = size / S
    return im.resize((max(1, round(im.width * scale)), size), Image.LANCZOS)


def longest_run(row):
    """한 줄에서 가장 긴 불투명 구간 (시작, 끝)."""
    best, start = (0, 0), None
    for x, v in enumerate(np.append(row, 0)):
        if v and start is None:
            start = x
        elif not v and start is not None:
            if x - start > best[1] - best[0]:
                best = (start, x)
            start = None
    return best


def face_crop(cell, size):
    """얼굴(전투 행동 순서)과 상반신(대화창): 발 위쪽에서 머리를 찾아 정사각형으로 자른다. 지팡이·활 끝은 가늘어서 건너뛴다."""
    rgb, a = keyed(cell)
    ys, xs = np.nonzero(a)
    if not len(ys):
        return None
    S = cell.height
    top, bot = ys.min(), ys.max()
    low = ys >= bot - max(4, (bot - top) * 0.12)
    fx = np.median(xs[low])
    head, cx = None, []
    for y in range(top, bot):
        # 발 근처 열에서 가장 긴 구간만 본다 (옆으로 든 무기 제외)
        x0 = int(max(0, fx - S * 0.2)); x1 = int(min(a.shape[1], fx + S * 0.2))
        r0, r1 = longest_run(a[y, x0:x1] > 0)
        if r1 - r0 >= S * 0.09:
            if head is None:
                head = y
            cx.append(x0 + (r0 + r1) / 2)
            if y - head > S * 0.12:
                break
    if head is None:
        return None
    c = float(np.median(cx))
    im = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    # 얼굴: 머리만 / 상반신: 머리부터 가슴께까지
    out = []
    for ratio, px in ((0.4, size), (0.62, size * 3 // 2)):
        side = int((bot - head) * ratio)
        y0 = int(head - side * 0.08)
        out.append(im.crop((int(c - side / 2), y0, int(c + side / 2), y0 + side)).resize((px, px), Image.LANCZOS))
    return out


def centered(cell, size, margin=0.06):
    rgb, a = keyed(cell)
    ys, xs = np.nonzero(a)
    if not len(ys):
        return None
    im = Image.fromarray(np.dstack([rgb, a]), "RGBA").crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(im.size) * (1 + margin * 2))
    sq = Image.new("RGBA", (side, side))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return sq.resize((size, size), Image.LANCZOS)


def sheet(cat, name, mode, cols, rows, size, keyfn, faces=False):
    src = SRC / cat / f"{name}.png"
    if not src.exists() or f"{cat}/{name}" in SKIP:
        return
    im = Image.open(src).convert("RGB")
    for n, cell in cells(im, cols, rows):
        if f"{cat}/{name}#{n}" in SKIP:
            continue
        key = keyfn(n)
        if key is None:
            continue
        k = CELL_SCALE.get(f"{cat}/{name}#{n}")
        if k:
            # 발 기준으로 키운 뒤 같은 크기로 다시 자른다
            w, h = cell.size
            big = cell.resize((round(w * k), round(h * k)), Image.NEAREST)
            cell = big.crop(((big.width - w) // 2, big.height - h, (big.width - w) // 2 + w, big.height))
        out = foot_anchor(cell, size) if mode == "foot" else centered(cell, size)
        if out is not None:
            save(out, f"{cat}/{key}.webp", key)
        if faces:
            f = face_crop(cell, 160)
            if f is not None:
                save(f[0], f"faces/{key}.webp", "face_" + key)
                save(f[1], f"busts/{key}.webp", "bust_" + key)


def scene(cat, name, width, key=None):
    src = SRC / cat / f"{name}.png"
    if not src.exists() or f"{cat}/{name}" in SKIP:
        return
    im = Image.open(src).convert("RGB")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    save(im, f"{cat}/{name}.webp", key or name)


def main():
    for p in sorted((SRC / "jobs").glob("*.png")):
        sheet("jobs", p.stem, "foot", 3, 2, 256, lambda n, s=p.stem: f"{s}_{n}", faces=True)
    for p in sorted((SRC / "npc").glob("*.png")):
        sheet("npc", p.stem, "foot", 3, 2, 256, lambda n, s=p.stem: f"{s}_{n}", faces=True)
    for p in sorted((SRC / "monsters").glob("*.png")):
        sheet("monsters", p.stem, "foot", 3, 2, 256, lambda n, s=p.stem: f"{s}_{n}", faces=True)
    for name, (a, b) in BUILDINGS.items():
        sheet("buildings", name, "foot", 3, 2, 256, lambda n, a=a, b=b: f"bld_{a if n <= 3 else b}_{(n - 1) % 3 + 1}")
    for cat in ("items", "ui"):
        for p in sorted((SRC / cat).glob("*.png")):
            if p.stem == "worldmap":
                continue
            sheet(cat, p.stem, "center", 6, 4, 128, lambda n, s=p.stem: f"{s}_{n}")
    for p in sorted((SRC / "fx").glob("*.png")):
        sheet("fx", p.stem, "center", 6, 4, 192, lambda n, s=p.stem: f"{s}_{n}")
    for p in sorted((SRC / "bg").glob("*.png")):
        scene("bg", p.stem, 1152)
    for p in sorted((SRC / "village").glob("*.png")):
        scene("village", p.stem, 768)
    for p in sorted((SRC / "story").glob("*.png")):
        scene("story", p.stem, 768)
    scene("ui", "worldmap", 1152)

    body = ",\n".join(f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in sorted(ART.items()))
    (ROOT / "js" / "art.js").write_text(
        "// tools/slice_art.py가 생성. 그림이 없는 키는 게임이 임시 그림을 쓴다\n"
        f"const ART = {{\n{body}\n}};\n", encoding="utf-8")
    print(f"{len(ART)} images")


if __name__ == "__main__":
    main()
