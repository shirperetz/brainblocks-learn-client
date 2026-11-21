// 2026-11-13 (Shir: "exactly like this, I loved the 3D"): the child's island as a live low-poly 3D
// scene. Built from a fixed seed (the child's id), so it is always the same island; the places to
// build (slots) are found on its grass the same way every time. The page tells it what is built.
import * as THREE from "three";
import { buildWonder } from "./wonders";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 2026-11-13 (Shir: "and if I bought everything?" -> a new island in another season; the 4 looks she saw)
export const SEASONS = {
  summer: { sky: 0x8fd6ff, sea: 0x1e9fe0, sand: 0xf3d79a, grass: 0x6cc84a, grass2: 0x4fae3c, rock: 0x8d94a6, peak: 0xa7adbb, leaf: 0x2f9a3f, sun: 0xfff1d6 },
  snow: { sky: 0xcfe3f2, sea: 0x3b7fb0, sand: 0xe9eef5, grass: 0xf2f6fb, grass2: 0xdfe8f2, rock: 0x7f8798, peak: 0xffffff, leaf: 0x2f6e4f, sun: 0xeaf2ff },
  desert: { sky: 0xffd9a0, sea: 0x24a7c9, sand: 0xf0c27a, grass: 0xd9a65a, grass2: 0xc48e45, rock: 0xa86b3c, peak: 0xc98a52, leaf: 0x6f8a2f, sun: 0xffe2b0 },
  sunset: { sky: 0xff9c7a, sea: 0x3a5fa8, sand: 0xe8b98a, grass: 0x5aa84a, grass2: 0x3f8a3c, rock: 0x7d6f8a, peak: 0x9a8aa8, leaf: 0x2f7a3f, sun: 0xffb27a },
};
let C = SEASONS.summer;

function mulberry(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise2(seed) {
  const g = new Map();
  const r = mulberry(seed);
  const at = (x, y) => {
    const k = x * 7919 + y;
    if (!g.has(k)) g.set(k, r());
    return g.get(k);
  };
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85, ...o });

export const SLOT_COUNT = 32;
/** 2026-11-14: what the class island builds (ClassIslandService.SEQUENCE). */
const CLASS_KINDS = new Set(["school", "library", "fountain", "playground", "lighthouse", "clocktower", "stadium", "statue", "pond", "balloon"]);

export class IslandScene {
  constructor(container, { seed, phone = false, onPick, season = "summer" }) {
    C = SEASONS[season] ?? SEASONS.summer;
    const SKY = C.sky;
    this.container = container;
    this.onPick = onPick;
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(r.domElement);
    this.renderer = r;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 80, 170);
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    this.camera.position.set(34, 30, 38);
    const ctl = new OrbitControls(this.camera, r.domElement);
    ctl.target.set(0, 2, 0);
    ctl.enableDamping = true;
    ctl.autoRotate = !this.reduce;
    ctl.autoRotateSpeed = 0.4;
    ctl.maxPolarAngle = Math.PI * 0.46;
    ctl.minDistance = 18;
    ctl.maxDistance = 85;
    ctl.enablePan = false;
    this.controls = ctl;
    scene.add(new THREE.HemisphereLight(0xcfeaff, 0x5a7a3a, 0.9));
    const sun = new THREE.DirectionalLight(C.sun, 2.1);
    sun.position.set(30, 45, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(phone ? 1024 : 2048, phone ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40 });
    scene.add(sun);
    this.world = new THREE.Group();
    this.builds = new THREE.Group();
    scene.add(this.world, this.builds);
    this.makeIsland(seed);
    this.mills = [];
    this.anims = []; // 2026-11-13: (t) => void - fountains, fire, lanterns, animals
    this.selected = null;

    // a tap (not a drag) picks the nearest place on the island
    let down = null;
    r.domElement.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
    r.domElement.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 600) return;
      this.pick(e);
    });
    this.resize = this.resize.bind(this);
    addEventListener("resize", this.resize);
    this.resize();
    const clock = new THREE.Clock();
    r.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      if (!this.reduce) {
        this.mills.forEach((m) => (m.rotation.z = t * 1.2));
        this.anims.forEach((f) => f(t));
        if (this.water) this.water.position.y = 0.35 + Math.sin(t * 0.8) * 0.06;
        if (this.marker) this.marker.position.y = this.marker.userData.y + Math.sin(t * 3) * 0.25;
      }
      ctl.update();
      r.render(scene, this.camera);
    });
  }

  makeIsland(seed) {
    const rnd = mulberry(seed);
    const n = noise2(seed), n2 = noise2(seed + 7);
    const R = 22, seg = 70;
    const geo = new THREE.PlaneGeometry(56, 56, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const heights = [];
    const lobe = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), d = Math.hypot(x, z), a = Math.atan2(z, x);
      const edge = R * (0.82 + 0.12 * Math.sin(a * 2 + lobe[0]) + 0.08 * Math.sin(a * 3 + lobe[1]) + 0.06 * n(x * 0.12, z * 0.12));
      let h = d < edge ? 1.6 + (1 - d / edge) * 2.2 + n(x * 0.09, z * 0.09) * 2.4 : -2 - (d - edge) * 0.6;
      const mx = Math.cos(lobe[2]) * 9, mz = Math.sin(lobe[2]) * 9, md = Math.hypot(x - mx, z - mz);
      if (md < 8 && d < edge) h += (1 - md / 8) ** 1.6 * (8 + n2(x * 0.2, z * 0.2) * 4);
      if (d < edge && d > edge - 2.6) h = Math.min(h, 0.9 + (edge - d) * 0.5);
      pos.setY(i, h);
      heights.push(h);
    }
    const ng = geo.toNonIndexed();
    const p2 = ng.attributes.position;
    const cols = [];
    const c = new THREE.Color();
    for (let i = 0; i < p2.count; i += 3) {
      const y = (p2.getY(i) + p2.getY(i + 1) + p2.getY(i + 2)) / 3;
      c.set(y < 1.4 ? C.sand : y < 5.5 ? (rnd() < 0.5 ? C.grass : C.grass2) : y < 9 ? C.rock : C.peak);
      if (y < 0) c.set(C.sand).multiplyScalar(0.8);
      for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
    }
    ng.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    ng.computeVertexNormals();
    const land = new THREE.Mesh(ng, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
    land.receiveShadow = land.castShadow = true;
    this.world.add(land);
    this.land = land;
    const water = new THREE.Mesh(new THREE.CircleGeometry(150, 64), new THREE.MeshStandardMaterial({ color: C.sea, transparent: true, opacity: 0.88, roughness: 0.25, metalness: 0.1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.35;
    water.receiveShadow = true;
    this.world.add(water);
    this.water = water;

    const heightAt = (x, z) => {
      const ix = Math.round(((x + 28) / 56) * seg), iz = Math.round(((z + 28) / 56) * seg);
      return heights[Math.max(0, Math.min(seg, iz)) * (seg + 1) + Math.max(0, Math.min(seg, ix))];
    };
    // the places to build: flat grass, apart from each other, nearest to the middle first
    const spots = [];
    for (let t = 0; t < 8000 && spots.length < SLOT_COUNT; t++) {
      const a = rnd() * 6.28, d = 3 + rnd() * 15, x = Math.cos(a) * d, z = Math.sin(a) * d, y = heightAt(x, z);
      const flat = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y) < 0.9;
      if (y > 1.6 && y < 5 && flat && spots.every((s) => Math.hypot(s.x - x, s.z - z) > 4.1)) spots.push({ x, y, z, rot: rnd() * 6.28 });
    }
    spots.sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
    this.spots = spots;
    // a few wild trees, never on a building place
    for (let t = 0; t < 40; t++) {
      const a = rnd() * 6.28, d = 3 + rnd() * 17, x = Math.cos(a) * d, z = Math.sin(a) * d, y = heightAt(x, z);
      if (y > 1.4 && y < 6.5 && spots.every((s) => Math.hypot(s.x - x, s.z - z) > 3.4)) this.tree(this.world, x, y, z, rnd() < 0.3, rnd);
    }
  }

  tree(group, x, y, z, palm, rnd = Math.random) {
    const add = (geo, m, px, py, pz) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(px, py, pz);
      o.castShadow = o.receiveShadow = true;
      group.add(o);
      return o;
    };
    if (palm) {
      add(new THREE.CylinderGeometry(0.15, 0.22, 2.4, 6), mat(0x8a5a2b), x, y + 1.2, z);
      for (let k = 0; k < 5; k++) {
        const l = add(new THREE.ConeGeometry(0.35, 2, 4), mat(C.leaf), x + Math.cos(k * 1.26) * 0.7, y + 2.4, z + Math.sin(k * 1.26) * 0.7);
        l.rotation.set(Math.sin(k * 1.26) * 1.2, 0, -Math.cos(k * 1.26) * 1.2);
      }
    } else {
      add(new THREE.CylinderGeometry(0.15, 0.2, 0.9, 6), mat(0x8a5a2b), x, y + 0.45, z);
      const s = 0.8 + rnd() * 0.6;
      add(new THREE.ConeGeometry(0.9 * s, 1.8 * s, 7), mat(C.leaf), x, y + 1.2 + 0.6 * s, z);
    }
  }

  /** builds: [{slot, kind, level}], open: how many places are the child's. */
  setBuildings(builds, open) {
    this.builds.clear();
    this.mills = [];
    this.anims = [];
    this.marker = null;
    const bySlot = new Map(builds.map((b) => [b.slot, b]));
    this.spots.forEach((s, i) => {
      const b = bySlot.get(i);
      if (b) this.building(b, s);
      else if (i < open) this.plot(s, i === this.selected);
    });
    if (this.selected != null && this.spots[this.selected]) {
      const s = this.spots[this.selected];
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), mat(0x2fbf55, { emissive: 0x0f5a24 }));
      m.rotation.x = Math.PI;
      m.userData.y = s.y + (bySlot.has(this.selected) ? 9 : 3.4);
      m.position.set(s.x, m.userData.y, s.z);
      this.builds.add(m);
      this.marker = m;
    }
  }

  select(slot) {
    this.selected = slot;
    if (slot != null && this.spots[slot]) {
      this.controls.autoRotate = false;
      this.controls.target.lerp(new THREE.Vector3(this.spots[slot].x, 2, this.spots[slot].z), 0.5);
    }
  }

  plot(s, on) {
    const g = new THREE.Group();
    g.position.set(s.x, s.y + 0.05, s.z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.95, 32), new THREE.MeshBasicMaterial({ color: on ? 0xffd36e : 0xffffff, transparent: true, opacity: 0.9 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    g.add(ring);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16), mat(0xffc93a, { emissive: 0x8a5a00, emissiveIntensity: 0.6, roughness: 0.5 }));
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 1.2;
    coin.castShadow = true;
    g.add(coin);
    this.builds.add(g);
  }

  building({ kind, level }, s) {
    const g = new THREE.Group();
    g.position.set(s.x, s.y - 0.1, s.z);
    g.rotation.y = s.rot;
    if (kind === "boat" || kind === "ship") {
      // boats float in the sea, out from their place on the island
      const a = Math.atan2(s.z, s.x);
      g.position.set(Math.cos(a) * 27, 0.35, Math.sin(a) * 27);
      g.rotation.y = -a;
    }
    this.builds.add(g);
    const add = (geo, m, px, py, pz) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(px, py, pz);
      o.castShadow = o.receiveShadow = true;
      g.add(o);
      return o;
    };
    const light = mat(0xffd36e, { emissive: 0x6a4a00 });
    if (kind === "house") {
      if (level >= 5) {
        // the golden palace: white walls, a golden dome, golden towers, waving flags
        const wall = mat(0xfaf6ee), gold = mat(0xf4c542, { metalness: 0.4, roughness: 0.35, emissive: 0x5a3c00, emissiveIntensity: 0.25 });
        add(new THREE.BoxGeometry(5.2, 0.8, 5.2), mat(0xe8dcc4), 0, 0.4, 0);
        add(new THREE.BoxGeometry(3.4, 3.6, 3.4), wall, 0, 2.6, 0);
        add(new THREE.SphereGeometry(1.7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 4.4, 0);
        add(new THREE.ConeGeometry(0.25, 1, 8), gold, 0, 6.5, 0);
        for (const [x, z] of [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]]) {
          add(new THREE.CylinderGeometry(0.6, 0.7, 4.2, 12), wall, x, 2.5, z);
          add(new THREE.SphereGeometry(0.7, 12, 8), gold, x, 4.9, z);
          add(new THREE.CylinderGeometry(0.03, 0.03, 1, 4), mat(0x5c3a17), x, 5.9, z);
          const flag = add(new THREE.BoxGeometry(0.05, 0.4, 0.7), mat(0x6f4fd8), x, 6.15, z + 0.35);
          this.anims.push((t) => (flag.rotation.y = Math.sin(t * 3 + x) * 0.35));
        }
        add(new THREE.BoxGeometry(1.1, 1.8, 0.1), gold, 0, 1.7, 1.71);
        for (const x of [-1.1, 1.1]) add(new THREE.BoxGeometry(0.5, 0.7, 0.1), light, x, 3, 1.71);
      } else if (level >= 4) {
        // the castle: a keep, four towers with pointed roofs, walls and flags
        const stone = mat(0xd9d4c7), dark = mat(0xb9b2a2), roof = mat(0x6f4fd8);
        add(new THREE.BoxGeometry(4.6, 0.9, 4.6), dark, 0, 0.45, 0);
        add(new THREE.BoxGeometry(2.6, 4.2, 2.6), stone, 0, 2.1, 0);
        add(new THREE.ConeGeometry(2.1, 1.8, 4), roof, 0, 5.1, 0).rotation.y = Math.PI / 4;
        for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) {
          add(new THREE.CylinderGeometry(0.75, 0.85, 3.4, 10), stone, x, 1.7, z);
          add(new THREE.ConeGeometry(0.95, 1.5, 10), roof, x, 4.15, z);
          add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), mat(0x5c3a17), x, 5.3, z);
          add(new THREE.BoxGeometry(0.05, 0.35, 0.55), mat(0xe2483a), x, 5.55, z + 0.28);
        }
        add(new THREE.BoxGeometry(0.9, 1.4, 0.1), mat(0x8a5a2b), 0, 0.7, 2.31);
        add(new THREE.BoxGeometry(0.5, 0.5, 0.1), light, -0.6, 2.8, 1.31);
        add(new THREE.BoxGeometry(0.5, 0.5, 0.1), light, 0.6, 2.8, 1.31);
      } else if (level === 1) {
        add(new THREE.ConeGeometry(1.8, 2.4, 4), mat(0xf0a030), 0, 1.2, 0).rotation.y = Math.PI / 4;
        add(new THREE.BoxGeometry(0.7, 1.1, 0.1), mat(0x8a5a2b), 0, 0.55, 1.05);
      } else {
        const w = level === 3 ? 3.8 : 3.2, h = level === 3 ? 3.6 : 2.2;
        add(new THREE.BoxGeometry(w, h, 2.6), mat(0xf6ead2), 0, h / 2, 0);
        add(new THREE.ConeGeometry(w * 0.82, 1.8, 4), mat(0xe2483a), 0, h + 0.9, 0).rotation.y = Math.PI / 4;
        add(new THREE.BoxGeometry(0.5, 1.2, 0.5), mat(0xb7bcc8), 0.8, h + 1.2, 0.4);
        add(new THREE.BoxGeometry(0.7, 1.1, 0.1), mat(0x8a5a2b), 0, 0.55, 1.31);
        add(new THREE.BoxGeometry(0.6, 0.6, 0.1), light, -0.9, 1.4, 1.31);
        add(new THREE.BoxGeometry(0.6, 0.6, 0.1), light, 0.9, 1.4, 1.31);
        if (level === 3) {
          add(new THREE.BoxGeometry(0.6, 0.6, 0.1), light, -0.9, 2.7, 1.31);
          add(new THREE.BoxGeometry(0.6, 0.6, 0.1), light, 0.9, 2.7, 1.31);
          add(new THREE.BoxGeometry(2.6, 0.15, 0.9), mat(0xc98b4c), 0, 2.1, 1.7);
        }
      }
    } else if (kind === "farm") {
      add(new THREE.BoxGeometry(4.4, 0.25, 3.2), mat(0x8d6a3e), 0, 0.12, 0);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) add(new THREE.SphereGeometry(0.35, 6, 5), mat((i + j) % 2 ? 0x5fc24a : 0xff7a3a), i * 1.3, 0.5, j * 0.9);
      if (level >= 2) {
        add(new THREE.BoxGeometry(2, 1.8, 1.6), mat(0xc4553d), -2.8, 0.9, 0);
        add(new THREE.ConeGeometry(1.5, 1, 4), mat(0x7a3a2a), -2.8, 2.3, 0).rotation.y = Math.PI / 4;
      }
      if (level >= 3) {
        // a coop and chickens behind a little fence
        add(new THREE.BoxGeometry(1.2, 0.9, 1), mat(0xf6ead2), 2.9, 0.45, -1.1);
        add(new THREE.ConeGeometry(0.95, 0.6, 4), mat(0xc4553d), 2.9, 1.2, -1.1).rotation.y = Math.PI / 4;
        for (let k = 0; k < 4; k++) {
          const x = 2.4 + (k % 2) * 1.1, z = 0.4 + Math.floor(k / 2) * 0.9;
          add(new THREE.SphereGeometry(0.22, 6, 5), mat(0xffffff), x, 0.25, z);
          add(new THREE.SphereGeometry(0.12, 6, 5), mat(0xffffff), x + 0.18, 0.45, z);
          add(new THREE.BoxGeometry(0.06, 0.08, 0.06), mat(0xe2483a), x + 0.18, 0.58, z);
        }
        for (let k = 0; k < 5; k++) add(new THREE.BoxGeometry(0.08, 0.5, 0.08), mat(0xc98b4c), 1.9 + k * 0.5, 0.25, 1.6);
        add(new THREE.BoxGeometry(2.2, 0.06, 0.06), mat(0xc98b4c), 2.9, 0.4, 1.6);
      }
    } else if (kind === "stall") {
      add(new THREE.BoxGeometry(2.4, 1.1, 1.4), mat(0xc98b4c), 0, 0.55, 0);
      for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.6, 0.12, 1.8), mat(k % 2 ? 0xffffff : 0xff5f8f), -0.9 + k * 0.6, 2.0, 0);
      add(new THREE.BoxGeometry(0.1, 1.9, 0.1), mat(0x8a5a2b), -1.1, 1.0, 0.7);
      add(new THREE.BoxGeometry(0.1, 1.9, 0.1), mat(0x8a5a2b), 1.1, 1.0, 0.7);
      if (level >= 2) {
        // two more stalls in other colours
        for (const [x, col] of [[-2.8, 0x5b9bff], [2.8, 0xffd36e]]) {
          add(new THREE.BoxGeometry(2, 1, 1.3), mat(0xc98b4c), x, 0.5, 0);
          add(new THREE.BoxGeometry(2.2, 0.12, 1.6), mat(col), x, 1.85, 0);
          for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(0.2, 6, 5), mat([0xff7a3a, 0x5fc24a, 0xe2483a][k]), x - 0.5 + k * 0.5, 1.15, 0.3);
        }
      }
    } else if (kind === "mill") {
      const s2 = level >= 2 ? 1.35 : 1;
      add(new THREE.CylinderGeometry(0.9 * s2, 1.3 * s2, 3.6 * s2, 8), mat(0xf3e6cf), 0, 1.8 * s2, 0);
      add(new THREE.ConeGeometry(1.2 * s2, 1.2 * s2, 8), mat(0xe2483a), 0, 4.2 * s2, 0);
      const m = new THREE.Group();
      m.position.set(0, 3.4 * s2, 1.1 * s2);
      g.add(m);
      for (let k = 0; k < 4; k++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.6 * s2, 0.08), mat(0xfff6e6));
        b.position.y = 1.3 * s2;
        b.castShadow = true;
        const p = new THREE.Group();
        p.rotation.z = (k * Math.PI) / 2;
        p.add(b);
        m.add(p);
      }
      this.mills.push(m);
      if (level >= 3) {
        // a bakery beside the mill, with a smoking chimney
        add(new THREE.BoxGeometry(2.4, 1.6, 2), mat(0xf0d3a0), -3, 0.8, 0);
        add(new THREE.ConeGeometry(1.9, 1.1, 4), mat(0x8a5a2b), -3, 2.15, 0).rotation.y = Math.PI / 4;
        add(new THREE.BoxGeometry(0.4, 1.2, 0.4), mat(0x9a8a7a), -2.4, 2.4, -0.4);
        add(new THREE.SphereGeometry(0.3, 6, 5), mat(0xe8e8e8), -2.4, 3.3, -0.4);
        add(new THREE.BoxGeometry(0.6, 0.5, 0.1), light, -3, 0.9, 1.01);
      }
    } else if (kind === "lighthouse") {
      for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.9 - k * 0.08, 1.0 - k * 0.08, 1.4, 12), mat(k % 2 ? 0xe2483a : 0xffffff), 0, 0.7 + k * 1.4, 0);
      add(new THREE.CylinderGeometry(0.75, 0.75, 0.8, 12), mat(0xffe08a, { emissive: 0xffb000, emissiveIntensity: 0.9 }), 0, 6.1, 0);
      add(new THREE.ConeGeometry(0.95, 0.9, 12), mat(0xe2483a), 0, 6.95, 0);
      if (level >= 2) {
        add(new THREE.BoxGeometry(1.8, 1.3, 1.6), mat(0xffffff), 2, 0.65, 0);
        add(new THREE.ConeGeometry(1.4, 0.9, 4), mat(0xe2483a), 2, 1.75, 0).rotation.y = Math.PI / 4;
        add(new THREE.BoxGeometry(0.45, 0.45, 0.1), light, 2, 0.75, 0.81);
      }
    } else if (kind === "tree" || kind === "palm") {
      this.tree(g, 0, 0, 0, kind === "palm");
      if (kind === "tree" && level >= 3) {
        // the giant: a second, wider crown and a swing
        add(new THREE.ConeGeometry(1.8, 2.6, 8), mat(C.leaf), 0, 3.2, 0);
        add(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), mat(0x5c3a17), 0.9, 1.6, 0.3);
        add(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), mat(0x5c3a17), 0.9, 1.6, -0.3);
        add(new THREE.BoxGeometry(0.3, 0.06, 0.7), mat(0xc98b4c), 0.9, 1.0, 0);
      }
      if (kind === "palm" && level >= 2) {
        for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(0.18, 6, 5), mat(0x6b4423), Math.cos(k * 2.1) * 0.3, 2.25, Math.sin(k * 2.1) * 0.3);
        add(new THREE.BoxGeometry(1.4, 0.06, 0.5), mat(0xff7a3a), 1.2, 0.6, 0);
      }
      if (kind === "tree" && level >= 2) {
        for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.16, 6, 5), mat(0xe2483a), Math.cos(k) * 0.75, 1.5 + (k % 3) * 0.35, Math.sin(k) * 0.75);
      }
    } else if (kind === "flowers") {
      for (let k = 0; k < 7; k++) add(new THREE.SphereGeometry(0.32, 6, 5), mat([0xff6fa0, 0xffd36e, 0xa77bff, 0xffffff][k % 4]), Math.cos(k) * 1.1, 0.4, Math.sin(k) * 1.1);
      add(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 16), mat(0x4fae3c), 0, 0.08, 0);
      if (level >= 2) {
        for (let k = 0; k < 8; k++) add(new THREE.SphereGeometry(0.28, 6, 5), mat([0xff6fa0, 0xffd36e, 0xa77bff, 0xff7a3a][k % 4]), Math.cos(k * 0.8) * 2.1, 0.35, Math.sin(k * 0.8) * 2.1);
        add(new THREE.BoxGeometry(1.4, 0.12, 0.45), mat(0x8a5a2b), 0, 0.5, -2.6);
        add(new THREE.BoxGeometry(1.4, 0.5, 0.1), mat(0x8a5a2b), 0, 0.8, -2.8);
      }
    } else if (kind === "ship") {
      const big = level >= 2;
      add(new THREE.BoxGeometry(6, 1.3, 2.2), mat(0x8a5a2b), 0, 0.7, 0);
      add(new THREE.BoxGeometry(6.2, 0.25, 2.4), mat(0xc98b4c), 0, 1.45, 0);
      const masts = big ? [-1.5, 1.2] : [0];
      masts.forEach((mx, i) => {
        add(new THREE.CylinderGeometry(0.1, 0.12, 5, 6), mat(0x5c3a17), mx, 3.9, 0);
        const sail = add(new THREE.BoxGeometry(0.08, 2.4, 2.2), mat(0xfff6e6), mx + 0.2, 4.0, 0);
        sail.rotation.y = 0.15;
        if (i === masts.length - 1) add(new THREE.BoxGeometry(0.05, 0.5, 0.9), mat(0xe2483a), mx, 6.6, 0.45);
      });
      if (level >= 3) {
        // 2026-11-21: the pirate ship - black sails over the white ones, a skull flag, cannons, a treasure chest
        masts.forEach((mx) => add(new THREE.BoxGeometry(0.1, 2.5, 2.3), mat(0x2b2b33), mx + 0.25, 4.0, 0).rotation.y = 0.15);
        const flag = add(new THREE.BoxGeometry(0.05, 0.6, 1), mat(0x111111), masts[masts.length - 1], 6.7, 0.5);
        add(new THREE.SphereGeometry(0.14, 8, 6), mat(0xffffff), masts[masts.length - 1] + 0.04, 6.75, 0.5);
        this.anims.push((t) => (flag.rotation.y = Math.sin(t * 3) * 0.3));
        for (const x of [-2, 0, 2]) for (const z of [-1.15, 1.15]) add(new THREE.CylinderGeometry(0.12, 0.14, 0.6, 8), mat(0x1f2a44), x, 1.1, z).rotation.x = Math.PI / 2;
        add(new THREE.BoxGeometry(0.7, 0.45, 0.45), mat(0x8a5a2b), -2.4, 1.8, 0);
        add(new THREE.BoxGeometry(0.75, 0.08, 0.5), mat(0xf4c542, { metalness: 0.5, emissive: 0x6a4a00, emissiveIntensity: 0.3 }), -2.4, 2.05, 0);
      }
    } else if (kind === "boat") {
      add(new THREE.BoxGeometry(3.4, 0.8, 1.4), mat(0xffffff), 0, 0.5, 0);
      add(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 6), mat(0x8a5a2b), 0, 2.2, 0);
      const sail = add(new THREE.ConeGeometry(1.2, 2.6, 3), mat(0x7cc3ff), 0.5, 2.3, 0);
      sail.scale.z = 0.12;
      if (level >= 2) {
        // fishing boat: a net and a few fish in it (level 2)
        add(new THREE.BoxGeometry(1.2, 0.05, 1.0), mat(0xd9cfb0, { transparent: true, opacity: 0.8 }), -1, 0.95, 0);
        for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(0.15, 6, 4), mat(0xff9a3a), -1.3 + k * 0.3, 1.05, 0.1 * k);
      }
    } else {
      this.extra(kind, level, g, add, light);
    }
    // 2026-11-14 (the class island): a third round of weeks crowns a building with a golden flag
    if (level >= 3 && CLASS_KINDS.has(kind)) {
      add(new THREE.BoxGeometry(0.08, 2, 0.08), mat(0x9aa3b5), 1.6, 1, 1.6);
      add(new THREE.BoxGeometry(0.8, 0.45, 0.04), mat(0xf4c542, { metalness: 0.5, emissive: 0x6a4a00, emissiveIntensity: 0.3 }), 2.02, 1.75, 1.6);
    }
  }

  /** 2026-11-13: the new things (school, well, fountain, playground, pond, animals, season things). */
  extra(kind, level, g, add, light) {
    // 2026-11-21: the wonders (dragon, roller coaster, volcano, UFO...) - island3d/wonders.js
    if (buildWonder(kind, level, g, add, mat, this.anims)) return;
    const wood = mat(0xc98b4c), dark = mat(0x5c3a17);
    const fence = (w, d) => {
      for (let k = 0; k <= 6; k++) {
        const x = -w / 2 + (w * k) / 6;
        add(new THREE.BoxGeometry(0.08, 0.5, 0.08), wood, x, 0.25, -d / 2);
        add(new THREE.BoxGeometry(0.08, 0.5, 0.08), wood, x, 0.25, d / 2);
      }
      add(new THREE.BoxGeometry(w, 0.06, 0.06), wood, 0, 0.4, -d / 2);
      add(new THREE.BoxGeometry(w, 0.06, 0.06), wood, 0, 0.4, d / 2);
    };
    const quad = (x, z, body, head, scale = 1, dz = 0) => {
      const a = new THREE.Group();
      a.position.set(x, 0, z);
      a.scale.setScalar(scale);
      g.add(a);
      const part = (geo, m, px, py, pz) => {
        const o = new THREE.Mesh(geo, m);
        o.position.set(px, py, pz);
        o.castShadow = true;
        a.add(o);
        return o;
      };
      part(new THREE.BoxGeometry(1, 0.55, 0.5), body, 0, 0.6, 0);
      part(new THREE.BoxGeometry(0.4, 0.4, 0.38), head, 0.65, 0.85, 0);
      for (const [lx, lz] of [[-0.35, -0.18], [0.35, -0.18], [-0.35, 0.18], [0.35, 0.18]]) part(new THREE.BoxGeometry(0.12, 0.35, 0.12), head, lx, 0.18, lz);
      this.anims.push((t) => (a.position.y = Math.abs(Math.sin(t * 1.6 + x + z + dz)) * 0.08));
      return part;
    };
    if (kind === "school") {
      add(new THREE.BoxGeometry(4, 2, 2.4), mat(0xffe3a3), 0, 1, 0);
      add(new THREE.ConeGeometry(3, 1.2, 4), mat(0x3a6fd8), 0, 2.6, 0).rotation.y = Math.PI / 4;
      for (const x of [-1.3, 0, 1.3]) add(new THREE.BoxGeometry(0.6, 0.6, 0.1), light, x, 1.2, 1.21);
      add(new THREE.BoxGeometry(0.7, 1, 0.1), mat(0x8a5a2b), 0, 0.5, 1.22);
      if (level >= 2) {
        add(new THREE.BoxGeometry(0.9, 1.6, 0.9), mat(0xffe3a3), 0, 3.6, 0);
        add(new THREE.ConeGeometry(0.8, 0.9, 4), mat(0x3a6fd8), 0, 4.85, 0).rotation.y = Math.PI / 4;
        const bell = add(new THREE.ConeGeometry(0.25, 0.4, 10), mat(0xf4c542, { metalness: 0.5 }), 0, 3.6, 0.46);
        this.anims.push((t) => (bell.rotation.z = Math.sin(t * 2) * 0.25));
        add(new THREE.BoxGeometry(2.4, 0.05, 1.6), mat(0x4fae3c), 3.2, 0.06, 0);
        add(new THREE.BoxGeometry(0.06, 0.9, 0.9), mat(0xffffff), 4.3, 0.5, 0);
      }
    } else if (kind === "well") {
      add(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 14), mat(0x9a9488), 0, 0.4, 0);
      add(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 14), mat(0x1e9fe0), 0, 0.75, 0);
      add(new THREE.BoxGeometry(0.1, 1.4, 0.1), wood, -0.8, 1.3, 0);
      add(new THREE.BoxGeometry(0.1, 1.4, 0.1), wood, 0.8, 1.3, 0);
      add(new THREE.ConeGeometry(1.3, 0.7, 4), mat(0xc4553d), 0, 2.3, 0).rotation.y = Math.PI / 4;
      add(new THREE.CylinderGeometry(0.15, 0.12, 0.25, 8), wood, 0, 1.2, 0);
    } else if (kind === "fountain") {
      add(new THREE.CylinderGeometry(1.6, 1.7, 0.5, 20), mat(0xe8e2d4), 0, 0.25, 0);
      add(new THREE.CylinderGeometry(1.4, 1.4, 0.05, 20), mat(0x58c3ff, { transparent: true, opacity: 0.85 }), 0, 0.5, 0);
      add(new THREE.CylinderGeometry(0.2, 0.25, 1.4, 10), mat(0xe8e2d4), 0, 1, 0);
      if (level >= 2) {
        add(new THREE.CylinderGeometry(0.8, 0.6, 0.25, 16), mat(0xe8e2d4), 0, 1.7, 0);
        add(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 10), mat(0xe8e2d4), 0, 2.2, 0);
      }
      const top = level >= 2 ? 2.7 : 1.8;
      for (let k = 0; k < 6; k++) {
        const drop = add(new THREE.SphereGeometry(0.12, 6, 4), mat(0x8fd6ff, { emissive: 0x2a7fbf, emissiveIntensity: 0.3 }), 0, top, 0);
        const a = (k / 6) * Math.PI * 2;
        this.anims.push((t) => {
          const f = (t * 0.9 + k / 6) % 1;
          drop.position.set(Math.cos(a) * f * 1.2, top + Math.sin(f * Math.PI) * 0.8 - f * (top - 0.6), Math.sin(a) * f * 1.2);
        });
      }
    } else if (kind === "playground") {
      add(new THREE.BoxGeometry(3.6, 0.06, 2.8), mat(0xf3d79a), 0, 0.05, 0);
      add(new THREE.BoxGeometry(0.8, 1.6, 0.8), mat(0xff6f6f), -1, 0.8, 0);
      const slide = add(new THREE.BoxGeometry(0.6, 0.08, 2), mat(0xffd36e), -1, 0.9, 1.1);
      slide.rotation.x = 0.6;
      for (const x of [0.6, 1.6]) add(new THREE.BoxGeometry(0.08, 1.6, 0.08), mat(0x3a6fd8), x, 0.8, -0.6);
      add(new THREE.BoxGeometry(1.1, 0.08, 0.08), mat(0x3a6fd8), 1.1, 1.6, -0.6);
      const seat = add(new THREE.BoxGeometry(0.5, 0.06, 0.3), mat(0x5fc24a), 1.1, 0.5, -0.6);
      this.anims.push((t) => (seat.position.z = -0.6 + Math.sin(t * 2) * 0.2));
    } else if (kind === "pond") {
      add(new THREE.CylinderGeometry(1.7, 1.7, 0.1, 20), mat(0x9a9488), 0, 0.05, 0);
      add(new THREE.CylinderGeometry(1.5, 1.5, 0.06, 20), mat(0x2aa8e0, { transparent: true, opacity: 0.9 }), 0, 0.12, 0);
      for (let k = 0; k < 3; k++) {
        const fish = add(new THREE.SphereGeometry(0.14, 6, 4), mat(0xff8a2a), 0, 0.12, 0);
        this.anims.push((t) => fish.position.set(Math.cos(t * 0.8 + k * 2.1) * 0.9, 0.12, Math.sin(t * 0.8 + k * 2.1) * 0.9));
      }
      if (level >= 2) {
        for (let k = 0; k < 2; k++) {
          const duck = new THREE.Group();
          g.add(duck);
          const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat(0xffffff));
          const h = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0xffffff));
          const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), mat(0xff9a3a));
          h.position.set(0.22, 0.2, 0);
          beak.position.set(0.36, 0.2, 0);
          duck.add(b, h, beak);
          this.anims.push((t) => {
            const a = -t * 0.4 + k * Math.PI;
            duck.position.set(Math.cos(a) * 0.6, 0.25, Math.sin(a) * 0.6);
            duck.rotation.y = -a + Math.PI;
          });
        }
      }
    } else if (kind === "sheep") {
      const wool = mat(0xf7f5ee), face = mat(0x3a3a3a);
      const n = level >= 2 ? 4 : 2;
      for (let k = 0; k < n; k++) quad(-1 + (k % 2) * 1.6, -0.6 + Math.floor(k / 2) * 1.2, wool, face, 0.9, k);
      if (level >= 2) fence(4, 3.2);
    } else if (kind === "cow") {
      const spot = mat(0xffffff), black = mat(0x2a2a2a);
      const part = quad(0, 0.6, spot, black, 1.2);
      part(new THREE.BoxGeometry(0.3, 0.3, 0.52), black, -0.1, 0.65, 0);
      if (level >= 2) {
        quad(0.4, -0.9, mat(0x8a5a2b), black, 1.1, 2);
        add(new THREE.BoxGeometry(2, 1.6, 1.5), mat(0xc4553d), -2.4, 0.8, 0);
        add(new THREE.ConeGeometry(1.5, 0.9, 4), mat(0x7a3a2a), -2.4, 2.05, 0).rotation.y = Math.PI / 4;
      }
    } else if (kind === "horse") {
      const brown = mat(0x8a5a2b), mane = mat(0x3a2410);
      const part = quad(0, 0, brown, brown, 1.35);
      part(new THREE.BoxGeometry(0.1, 0.3, 0.4), mane, 0.5, 1.1, 0);
      if (level >= 2) {
        add(new THREE.BoxGeometry(2.2, 1.7, 1.6), mat(0xa46a33), -2.4, 0.85, 0);
        add(new THREE.BoxGeometry(2.4, 0.15, 1.8), mat(0x6b4423), -2.4, 1.78, 0);
        fence(3, 2.6);
      }
    } else if (kind === "snowman") {
      const snow = mat(0xffffff), coal = mat(0x222222);
      const one = (x, z, sc) => {
        add(new THREE.SphereGeometry(0.6 * sc, 12, 10), snow, x, 0.55 * sc, z);
        add(new THREE.SphereGeometry(0.42 * sc, 12, 10), snow, x, 1.4 * sc, z);
        add(new THREE.SphereGeometry(0.3 * sc, 12, 10), snow, x, 2.0 * sc, z);
        add(new THREE.ConeGeometry(0.07 * sc, 0.35 * sc, 6), mat(0xff8a2a), x + 0.3 * sc, 2.0 * sc, z).rotation.z = -Math.PI / 2;
        add(new THREE.CylinderGeometry(0.22 * sc, 0.22 * sc, 0.35 * sc, 10), coal, x, 2.4 * sc, z);
      };
      one(0, 0, 1);
      if (level >= 2) {
        one(-1.2, 0.6, 0.75);
        one(1.1, 0.7, 0.6);
      }
    } else if (kind === "igloo") {
      add(new THREE.SphereGeometry(1.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xeef6ff), 0, 0, 0);
      add(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12, 1, false, 0, Math.PI), mat(0xeef6ff), 0, 0.3, 1.5).rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.6, 0.6, 0.1), mat(0x1f2a44), 0, 0.3, 2.05);
    } else if (kind === "penguin") {
      for (let k = 0; k < 3; k++) {
        const p = new THREE.Group();
        p.position.set(-0.8 + k * 0.8, 0, (k % 2) * 0.5);
        g.add(p);
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mat(0x1f2433));
        body.scale.y = 1.4;
        body.position.y = 0.5;
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(0xffffff));
        belly.scale.y = 1.3;
        belly.position.set(0, 0.45, 0.12);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 6), mat(0xff9a3a));
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.85, 0.32);
        p.add(body, belly, beak);
        this.anims.push((t) => (p.rotation.z = Math.sin(t * 4 + k) * 0.12));
      }
    } else if (kind === "cactus") {
      const green = mat(0x3f9a4a);
      add(new THREE.CylinderGeometry(0.3, 0.35, 2.2, 8), green, 0, 1.1, 0);
      add(new THREE.CylinderGeometry(0.18, 0.2, 0.8, 8), green, 0.5, 1.3, 0).rotation.z = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.18, 0.2, 0.7, 8), green, 0.75, 1.6, 0);
      add(new THREE.CylinderGeometry(0.18, 0.2, 0.6, 8), green, -0.45, 1.0, 0).rotation.z = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.18, 0.2, 0.6, 8), green, -0.65, 1.3, 0);
      if (level >= 2) for (const [x, y] of [[0, 2.3], [0.75, 2.0], [-0.65, 1.65]]) add(new THREE.SphereGeometry(0.17, 8, 6), mat(0xff6fa0), x, y, 0);
    } else if (kind === "camel") {
      const sand = mat(0xd9a65a);
      const part = quad(0, 0, sand, sand, 1.4);
      part(new THREE.SphereGeometry(0.28, 8, 6), sand, -0.2, 1.0, 0);
      part(new THREE.SphereGeometry(0.28, 8, 6), sand, 0.25, 1.0, 0);
      part(new THREE.BoxGeometry(0.18, 0.5, 0.18), sand, 0.6, 1.1, 0);
    } else if (kind === "pyramid") {
      const p = add(new THREE.ConeGeometry(3, 3.6, 4), mat(0xf0c27a), 0, 1.8, 0);
      p.rotation.y = Math.PI / 4;
      const cap = add(new THREE.ConeGeometry(0.5, 0.6, 4), mat(0xf4c542, { metalness: 0.5, emissive: 0x5a3c00, emissiveIntensity: 0.4 }), 0, 3.35, 0);
      cap.rotation.y = Math.PI / 4;
    } else if (kind === "lantern") {
      const n = level >= 2 ? 6 : 2;
      for (let k = 0; k < n; k++) {
        const x = -1.5 + (k % 3) * 1.5, z = k < 3 ? -0.7 : 0.7;
        add(new THREE.CylinderGeometry(0.06, 0.08, 2, 6), dark, x, 1, z);
        const lamp = add(new THREE.BoxGeometry(0.35, 0.4, 0.35), mat(0xffd36e, { emissive: 0xffa000, emissiveIntensity: 1 }), x, 2.15, z);
        this.anims.push((t) => (lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 2 + k) * 0.25));
      }
    } else if (kind === "balloon") {
      // a hot-air balloon floating up and down above its place
      const b = new THREE.Group();
      g.add(b);
      const piece = (geo, m, px, py, pz) => {
        const o = new THREE.Mesh(geo, m);
        o.position.set(px, py, pz);
        o.castShadow = true;
        b.add(o);
        return o;
      };
      const big = level >= 2 ? 1.3 : 1;
      const colors = [0xe2483a, 0xffd36e, 0x3a6fd8, 0x5fc24a];
      for (let k = 0; k < 8; k++) {
        const seg = piece(new THREE.SphereGeometry(1.6 * big, 4, 12, (k * Math.PI) / 4, Math.PI / 4), mat(colors[k % (level >= 2 ? 4 : 2)]), 0, 5 * big, 0);
        seg.scale.y = 1.15;
      }
      piece(new THREE.BoxGeometry(0.8 * big, 0.6 * big, 0.8 * big), mat(0x8a5a2b), 0, 2.6 * big, 0);
      for (const [x, z] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) piece(new THREE.CylinderGeometry(0.02, 0.02, 1.4 * big, 4), mat(0x5c3a17), x * big, 3.4 * big, z * big);
      this.anims.push((t) => {
        b.position.y = 1 + Math.sin(t * 0.7) * 0.6;
        b.rotation.y = t * 0.15;
      });
    } else if (kind === "rocket") {
      const r = new THREE.Group();
      g.add(r);
      const piece = (geo, m, px, py, pz) => {
        const o = new THREE.Mesh(geo, m);
        o.position.set(px, py, pz);
        o.castShadow = true;
        r.add(o);
        return o;
      };
      piece(new THREE.BoxGeometry(3, 0.3, 3), mat(0x8d94a6), 0, 0.15, 0);
      piece(new THREE.CylinderGeometry(0.7, 0.8, 3.6, 16), mat(0xf5f5f5), 0, 2.2, 0);
      piece(new THREE.ConeGeometry(0.7, 1.4, 16), mat(0xe2483a), 0, 4.7, 0);
      piece(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16), mat(0x58c3ff, { emissive: 0x2a7fbf, emissiveIntensity: 0.5 }), 0, 3, 0.72).rotation.x = Math.PI / 2;
      for (let k = 0; k < 3; k++) {
        const fin = piece(new THREE.BoxGeometry(0.1, 1.1, 0.8), mat(0xe2483a), Math.cos((k * 2 * Math.PI) / 3) * 0.8, 0.95, Math.sin((k * 2 * Math.PI) / 3) * 0.8);
        fin.rotation.y = -(k * 2 * Math.PI) / 3;
      }
      const flame = piece(new THREE.ConeGeometry(0.4, 0.8, 10), mat(0xffa000, { emissive: 0xff6000, emissiveIntensity: 1 }), 0, 0.15, 0);
      flame.rotation.x = Math.PI;
      this.anims.push((t) => (flame.scale.y = 0.7 + Math.abs(Math.sin(t * 12)) * 0.5));
    } else if (kind === "library") {
      // 2026-11-14 (the class island): a library - columns, steps, books in the windows; grows a wing
      const stone = mat(0xf1ead8), roof = mat(0x8f3b2e);
      add(new THREE.BoxGeometry(4.2, 0.3, 2.8), mat(0xd8cfb8), 0, 0.15, 0);
      add(new THREE.BoxGeometry(3.6, 2, 2.2), stone, 0, 1.3, -0.1);
      for (const x of [-1.4, -0.47, 0.47, 1.4]) add(new THREE.CylinderGeometry(0.16, 0.18, 2, 10), stone, x, 1.3, 1.15);
      add(new THREE.BoxGeometry(3.8, 0.3, 2.6), stone, 0, 2.45, 0);
      const pd = add(new THREE.CylinderGeometry(0.01, 2.1, 0.9, 3), roof, 0, 3.05, 0.1);
      pd.rotation.z = Math.PI / 2;
      pd.rotation.y = Math.PI / 2;
      pd.scale.set(1, 1, 0.55);
      const books = [0xe45f4f, 0x3a6fd8, 0x2fbf71, 0xffc93a];
      books.forEach((c, k) => add(new THREE.BoxGeometry(0.12, 0.45, 0.1), mat(c), -0.25 + k * 0.17, 1.4, 1.02));
      if (level >= 2) {
        add(new THREE.BoxGeometry(1.6, 1.6, 2), stone, 2.6, 1.1, -0.1);
        add(new THREE.ConeGeometry(1.3, 0.8, 4), roof, 2.6, 2.3, -0.1).rotation.y = Math.PI / 4;
        add(new THREE.BoxGeometry(0.6, 0.6, 0.1), light, 2.6, 1.3, 0.91);
      }
    } else if (kind === "clocktower") {
      const brick = mat(0xc9714e), cap = mat(0x2d4a7a);
      const h = level >= 2 ? 6.2 : 5;
      add(new THREE.BoxGeometry(1.6, h, 1.6), brick, 0, h / 2, 0);
      add(new THREE.ConeGeometry(1.35, 1.6, 4), cap, 0, h + 0.8, 0).rotation.y = Math.PI / 4;
      const face = add(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 24), mat(0xfffbe8), 0, h - 0.9, 0.82);
      face.rotation.x = Math.PI / 2;
      const hand = add(new THREE.BoxGeometry(0.06, 0.45, 0.04), mat(0x1f2a44), 0, h - 0.9, 0.88);
      const hand2 = add(new THREE.BoxGeometry(0.06, 0.3, 0.04), mat(0x1f2a44), 0, h - 0.9, 0.89);
      this.anims.push((t) => {
        hand.rotation.z = -t * 0.6;
        hand2.rotation.z = -t * 0.05;
        hand.position.set(Math.sin(t * 0.6) * 0.2, h - 0.9 + Math.cos(t * 0.6) * 0.2, 0.88);
      });
      add(new THREE.BoxGeometry(0.6, 1, 0.1), mat(0x6b3b1f), 0, 0.5, 0.81);
    } else if (kind === "stadium") {
      add(new THREE.CylinderGeometry(2.8, 3, 0.3, 28), mat(0xe8e2d4), 0, 0.15, 0);
      add(new THREE.CylinderGeometry(2.1, 2.1, 0.05, 28), mat(0x4fae3c), 0, 0.32, 0);
      add(new THREE.BoxGeometry(2.6, 0.02, 0.06), mat(0xffffff), 0, 0.36, 0);
      const rows = level >= 2 ? 3 : 2;
      for (let r = 0; r < rows; r++) {
        const ring = add(new THREE.TorusGeometry(2.35 + r * 0.32, 0.16, 6, 28), mat([0xe45f4f, 0x3a6fd8, 0xffc93a][r]), 0, 0.5 + r * 0.32, 0);
        ring.rotation.x = Math.PI / 2;
      }
      const ball = add(new THREE.SphereGeometry(0.22, 10, 8), mat(0xffffff), 0, 0.55, 0);
      this.anims.push((t) => ball.position.set(Math.sin(t * 1.3) * 1.3, 0.55 + Math.abs(Math.sin(t * 2.6)) * 0.4, Math.cos(t * 0.9) * 0.6));
      for (const x of [-2.1, 2.1]) {
        add(new THREE.BoxGeometry(0.06, 3, 0.06), mat(0x9aa3b5), x, 1.8, -2.2);
        add(new THREE.BoxGeometry(0.5, 0.3, 0.2), light, x, 3.3, -2.2);
      }
    } else if (kind === "statue") {
      // the class's statue: a pedestal and a golden dolphin-like arc, a star on top
      const gold = mat(0xf4c542, { metalness: 0.6, roughness: 0.35, emissive: 0x6a4a00, emissiveIntensity: 0.25 });
      add(new THREE.BoxGeometry(1.6, 1, 1.6), mat(0xe8e2d4), 0, 0.5, 0);
      add(new THREE.BoxGeometry(1.9, 0.15, 1.9), mat(0xd8cfb8), 0, 1.05, 0);
      const arc = add(new THREE.TorusGeometry(0.75, 0.22, 8, 20, Math.PI * 1.2), gold, 0, 1.9, 0);
      arc.rotation.z = -0.3;
      const star = add(new THREE.OctahedronGeometry(0.35), gold, 0, level >= 2 ? 3.2 : 2.9, 0);
      this.anims.push((t) => (star.rotation.y = t));
    } else if (kind === "site") {
      // this week's building, under construction: level = 0 (empty lot) .. 5 (done)
      const stage = Math.max(0, Math.min(5, level));
      add(new THREE.BoxGeometry(3.6, 0.1, 3.6), mat(0xc9b28a), 0, 0.05, 0);
      for (const [x, z] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) add(new THREE.BoxGeometry(0.1, 0.5, 0.1), mat(0xff9f43), x, 0.25, z);
      if (stage >= 1) add(new THREE.BoxGeometry(3, 0.35, 3), mat(0x9a9488), 0, 0.27, 0);
      const wall = mat(0xffe3a3);
      for (let f = 0; f < Math.min(2, Math.max(0, stage - 1)); f++) add(new THREE.BoxGeometry(2.6, 1.1, 2.6), wall, 0, 1 + f * 1.15, 0);
      if (stage >= 4) add(new THREE.ConeGeometry(2.1, 1, 4), mat(0x3a6fd8), 0, 3.3, 0).rotation.y = Math.PI / 4;
      if (stage < 5) {
        // a crane that turns
        add(new THREE.BoxGeometry(0.25, 5, 0.25), mat(0xffc93a), 2.2, 2.5, -2.2);
        const arm = new THREE.Group();
        arm.position.set(2.2, 5, -2.2);
        g.add(arm);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 0.2), mat(0xffc93a));
        beam.position.x = -1.4;
        beam.castShadow = true;
        arm.add(beam);
        const hook = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat(0xc4553d));
        hook.position.set(-2.8, -1.2, 0);
        arm.add(hook);
        this.anims.push((t) => (arm.rotation.y = Math.sin(t * 0.5) * 0.8));
      } else {
        add(new THREE.BoxGeometry(0.06, 1.4, 0.06), mat(0x9aa3b5), 0, 4.4, 0);
        add(new THREE.BoxGeometry(0.7, 0.4, 0.04), mat(0xe45f4f), 0.37, 4.9, 0);
      }
    } else if (kind === "campfire") {
      for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.22, 6, 4), mat(0x8d94a6), Math.cos(k * 1.26) * 0.6, 0.1, Math.sin(k * 1.26) * 0.6);
      add(new THREE.BoxGeometry(1, 0.15, 0.15), dark, 0, 0.15, 0).rotation.y = 0.6;
      add(new THREE.BoxGeometry(1, 0.15, 0.15), dark, 0, 0.15, 0).rotation.y = -0.6;
      const fire = add(new THREE.ConeGeometry(0.35, 0.9, 7), mat(0xff7a1a, { emissive: 0xff4000, emissiveIntensity: 1 }), 0, 0.6, 0);
      const fire2 = add(new THREE.ConeGeometry(0.2, 0.6, 7), mat(0xffd36e, { emissive: 0xffa000, emissiveIntensity: 1 }), 0, 0.55, 0);
      this.anims.push((t) => {
        fire.scale.y = 1 + Math.sin(t * 9) * 0.15;
        fire2.scale.y = 1 + Math.cos(t * 11) * 0.2;
      });
      for (const z of [-1.4, 1.4]) add(new THREE.BoxGeometry(1.6, 0.3, 0.4), wood, 0, 0.15, z);
    }
  }

  pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(p, this.camera);
    const hit = ray.intersectObjects([this.land, ...this.builds.children], true)[0];
    if (!hit) return;
    let best = null;
    let bestD = 3.2;
    this.spots.forEach((s, i) => {
      const d = Math.hypot(s.x - hit.point.x, s.z - hit.point.z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    this.onPick?.(best);
  }

  /** Where a place is on the screen (client px) - used by the page tests to tap it. */
  screenOf(slot) {
    const s = this.spots[slot];
    if (!s) return null;
    const v = new THREE.Vector3(s.x, s.y + 0.3, s.z).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // a tall phone screen sees less of the sides: start further back so the whole island fits
    if (!this.placed) {
      this.placed = true;
      const far = w / h < 0.8 ? 1.9 : 1;
      this.camera.position.set(34 * far, 30 * far, 38 * far);
      this.controls.maxDistance = 85 * far;
    }
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    removeEventListener("resize", this.resize);
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
