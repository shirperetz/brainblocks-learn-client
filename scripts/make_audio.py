"""Builds the game's spoken Hebrew lines into public/audio/<key>.wav (2026-11-10).

Source text: src/game/clips.json. Voice: Katrine's local BlueTTS worker (127.0.0.1:8098, runs with
katrine-server) - nothing leaves the PC. With --verify, every clip is transcribed back by Katrine's
local Whisper worker (127.0.0.1:8097) and the text is printed next to the original for a by-ear check.

Run (Katrine server up):  python scripts/make_audio.py [--only key1,key2] [--verify]
"""
import json
import sys
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIPS = json.loads((ROOT / "src/game/clips.json").read_text(encoding="utf-8"))
OUT = ROOT / "public/audio"
TTS = "http://127.0.0.1:8098/synthesize"
STT = "http://127.0.0.1:8097/transcribe"


def post(url, data, timeout=60):
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def to_16k_pcm(path):
    """WAV (any rate, 16-bit mono) -> raw 16 kHz 16-bit PCM, by linear interpolation."""
    with wave.open(str(path)) as w:
        rate, frames = w.getframerate(), w.readframes(w.getnframes())
    import array
    src = array.array("h", frames)
    n = int(len(src) * 16000 / rate)
    out = array.array("h", [0] * n)
    for i in range(n):
        x = i * rate / 16000
        j = int(x)
        f = x - j
        a = src[j] if j < len(src) else 0
        b = src[j + 1] if j + 1 < len(src) else a
        out[i] = int(a + (b - a) * f)
    return out.tobytes()


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    verify = "--verify" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    for key, text in CLIPS.items():
        if only and key not in only:
            continue
        wav = post(TTS, text.encode("utf-8"))
        path = OUT / f"{key}.wav"
        path.write_bytes(wav)
        line = f"{key}\t{len(wav)}B\t{text}"
        if verify:
            heard = post(STT, to_16k_pcm(path)).decode("utf-8").strip()
            line += f"\t=> {heard}"
        print(line, flush=True)


if __name__ == "__main__":
    main()
