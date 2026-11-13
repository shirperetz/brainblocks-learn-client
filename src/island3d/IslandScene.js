// 2026-11-13 (Shir: "exactly like this, I loved the 3D"): the child's island as a live low-poly 3D
// scene. Built from a fixed seed (the child's id), so it is always the same island; the places to
// build (slots) are found on its grass the same way every time. The page tells it what is built.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const SKY = 0x8fd6ff;
const C = { sea: 0x1e9fe0, sand: 0xf3d79a, grass: 0x6cc84a, grass2: 0x4fae3c, rock: 0x8d94a6, peak: 0xa7adbb, leaf: 0x2f9a3f };

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

export class IslandScene {
  constructor(container, { seed, phone = false, onPick }) {
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
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.1);
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
      if (level >= 4) {
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
    } else if (kind === "stall") {
      add(new THREE.BoxGeometry(2.4, 1.1, 1.4), mat(0xc98b4c), 0, 0.55, 0);
      for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.6, 0.12, 1.8), mat(k % 2 ? 0xffffff : 0xff5f8f), -0.9 + k * 0.6, 2.0, 0);
      add(new THREE.BoxGeometry(0.1, 1.9, 0.1), mat(0x8a5a2b), -1.1, 1.0, 0.7);
      add(new THREE.BoxGeometry(0.1, 1.9, 0.1), mat(0x8a5a2b), 1.1, 1.0, 0.7);
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
    } else if (kind === "lighthouse") {
      for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.9 - k * 0.08, 1.0 - k * 0.08, 1.4, 12), mat(k % 2 ? 0xe2483a : 0xffffff), 0, 0.7 + k * 1.4, 0);
      add(new THREE.CylinderGeometry(0.75, 0.75, 0.8, 12), mat(0xffe08a, { emissive: 0xffb000, emissiveIntensity: 0.9 }), 0, 6.1, 0);
      add(new THREE.ConeGeometry(0.95, 0.9, 12), mat(0xe2483a), 0, 6.95, 0);
    } else if (kind === "tree" || kind === "palm") {
      this.tree(g, 0, 0, 0, kind === "palm");
    } else if (kind === "flowers") {
      for (let k = 0; k < 7; k++) add(new THREE.SphereGeometry(0.32, 6, 5), mat([0xff6fa0, 0xffd36e, 0xa77bff, 0xffffff][k % 4]), Math.cos(k) * 1.1, 0.4, Math.sin(k) * 1.1);
      add(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 16), mat(0x4fae3c), 0, 0.08, 0);
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
    } else if (kind === "boat") {
      add(new THREE.BoxGeometry(3.4, 0.8, 1.4), mat(0xffffff), 0, 0.5, 0);
      add(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 6), mat(0x8a5a2b), 0, 2.2, 0);
      const sail = add(new THREE.ConeGeometry(1.2, 2.6, 3), mat(0x7cc3ff), 0.5, 2.3, 0);
      sail.scale.z = 0.12;
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
