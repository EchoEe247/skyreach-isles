#!/usr/bin/env python3
from pathlib import Path
import json, struct, sys

MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
EXT = "KHR_materials_emissive_strength"

def repair(path: Path):
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError(f"{path}: too short")
    magic, version, total = struct.unpack_from("<III", data, 0)
    if magic != MAGIC or version != 2 or total != len(data):
        raise ValueError(f"{path}: invalid GLB header")
    chunks, off, changed, fixed = [], 12, False, 0
    while off < len(data):
        n, typ = struct.unpack_from("<II", data, off)
        payload = data[off+8:off+8+n]
        if len(payload) != n:
            raise ValueError(f"{path}: truncated chunk")
        if typ == JSON_CHUNK:
            doc = json.loads(payload.rstrip(b" \t\r\n\x00").decode("utf-8"))
            for mat in doc.get("materials", []):
                ef = mat.get("emissiveFactor")
                if not isinstance(ef, list) or len(ef) != 3:
                    continue
                mx = max(float(v) for v in ef)
                if mx <= 1.0 + 1e-9:
                    continue
                exts = mat.setdefault("extensions", {})
                existing = exts.get(EXT, {}).get("emissiveStrength", 1.0)
                strength = float(existing) * mx
                mat["emissiveFactor"] = [float(v) / mx for v in ef]
                exts[EXT] = {"emissiveStrength": strength}
                fixed += 1
                changed = True
            if changed:
                used = doc.setdefault("extensionsUsed", [])
                if EXT not in used:
                    used.append(EXT)
                payload = json.dumps(doc, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
                payload += b" " * ((4 - len(payload) % 4) % 4)
        chunks.append((typ, payload))
        off += 8 + n
    if changed:
        body = b"".join(struct.pack("<II", len(payload), typ) + payload for typ, payload in chunks)
        out = struct.pack("<III", MAGIC, version, 12 + len(body)) + body
        path.write_bytes(out)
    return fixed, changed

def main():
    paths = [Path(a) for a in sys.argv[1:]]
    if not paths:
        paths = sorted(Path("public/assets/day-forge").glob("*.glb"))
    total = 0
    for p in paths:
        fixed, changed = repair(p)
        total += fixed
        print(f"{p.name}: {'repaired' if changed else 'already valid'} ({fixed} material(s))")
    print(f"total repaired materials: {total}")

if __name__ == "__main__":
    main()
