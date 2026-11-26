// 2026-11-26 (Shir: sounds): effects play, the separate "צלילים" switch silences only them, mute silences all.
import { test } from "node:test";
import assert from "node:assert/strict";

let started = 0;
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
const node = () => ({ connect: (x) => x ?? node(), gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, frequency: {}, start: () => started++, stop() {} });
globalThis.window = { AudioContext: class { constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; } createOscillator() { return node(); } createGain() { return node(); } resume() {} } };

const { sfx, setSfxOff, isSfxOff, setMuted } = await import("../src/game/audio.js");

test("effects play, the sounds switch and mute silence them", () => {
  started = 0; sfx.correct(); assert.equal(started, 3);
  started = 0; sfx.coin(); sfx.stage(); assert.equal(started, 6);
  setSfxOff(true); assert.equal(isSfxOff(), true); assert.equal(store.get("lc_sfx_off"), "1");
  started = 0; sfx.correct(); sfx.wrong(); assert.equal(started, 0);
  setSfxOff(false); setMuted(true);
  started = 0; sfx.star(); assert.equal(started, 0);
  setMuted(false); started = 0; sfx.star(); assert.equal(started, 4);
});
