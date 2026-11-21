// 2026-11-21 (Shir: "more crazy things for the islands the children build with their coins - invest"):
// the wonders - a dragon that flies around, a carousel, a Ferris wheel, a roller coaster with a moving
// car, a volcano, a tree house, a wizard's tower, a dinosaur, a unicorn, a rainbow, a treasure chest,
// a robot, an observatory, an ice-cream shop, a helicopter and a UFO. Low-poly like the rest of the
// island, every one with a small, calm animation (the scene stops animating with reduced motion).
import * as THREE from "three";

/** Builds [kind] into group [g]; false when it is not a wonder. */
export function buildWonder(kind, level, g, add, mat, anims) {
  const piece = (parent, geo, m, px, py, pz) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(px, py, pz);
    o.castShadow = true;
    parent.add(o);
    return o;
  };
  const group = (px = 0, py = 0, pz = 0) => {
    const x = new THREE.Group();
    x.position.set(px, py, pz);
    g.add(x);
    return x;
  };
  const glow = (c, e = c, i = 0.9) => mat(c, { emissive: e, emissiveIntensity: i });
  const gold = mat(0xf4c542, { metalness: 0.5, roughness: 0.35, emissive: 0x6a4a00, emissiveIntensity: 0.25 });

  switch (kind) {
    case "dragon": {
      // 1 an egg in a nest, 2 a small dragon sitting, 3 a dragon flying in circles over the island
      add(new THREE.CylinderGeometry(1.1, 1.3, 0.35, 10), mat(0x8a6a3a), 0, 0.18, 0);
      if (level === 1) {
        const egg = add(new THREE.SphereGeometry(0.55, 12, 10), mat(0x6fd3a0), 0, 0.85, 0);
        egg.scale.y = 1.3;
        for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.1, 6, 4), mat(0xffd36e), Math.cos(k * 1.3) * 0.38, 0.7 + (k % 2) * 0.4, Math.sin(k * 1.3) * 0.38);
        anims.push((t) => (egg.rotation.z = Math.sin(t * 3) * 0.08));
        return true;
      }
      const body = level >= 3 ? group(0, 0, 0) : group(0, 0.35, 0);
      const d = new THREE.Group();
      body.add(d);
      const skin = mat(level >= 3 ? 0xd94b3a : 0x3fae6b), belly = mat(0xffd36e), wing = mat(level >= 3 ? 0x8f2a20 : 0x2d7a4b);
      const s = level >= 3 ? 1.25 : 0.8;
      piece(d, new THREE.SphereGeometry(0.7 * s, 10, 8), skin, 0, 0.8 * s, 0).scale.set(1.4, 1, 1);
      piece(d, new THREE.SphereGeometry(0.45 * s, 8, 6), belly, 0.25 * s, 0.7 * s, 0.3 * s);
      const neck = piece(d, new THREE.CylinderGeometry(0.22 * s, 0.32 * s, 0.9 * s, 8), skin, 0.8 * s, 1.3 * s, 0);
      neck.rotation.z = -0.6;
      piece(d, new THREE.SphereGeometry(0.38 * s, 8, 6), skin, 1.2 * s, 1.75 * s, 0).scale.set(1.3, 0.9, 0.9);
      for (const z of [-0.15, 0.15]) {
        piece(d, new THREE.ConeGeometry(0.08 * s, 0.35 * s, 5), belly, 1.05 * s, 2.1 * s, z * s);
        piece(d, new THREE.SphereGeometry(0.06 * s, 6, 4), mat(0x1f2a44), 1.45 * s, 1.85 * s, z * s);
      }
      const tail = piece(d, new THREE.ConeGeometry(0.25 * s, 1.4 * s, 6), skin, -1.3 * s, 0.6 * s, 0);
      tail.rotation.z = Math.PI / 2 + 0.3;
      const wings = [-1, 1].map((side) => {
        const w = new THREE.Group();
        w.position.set(-0.1 * s, 1.2 * s, side * 0.45 * s);
        d.add(w);
        const m = piece(w, new THREE.ConeGeometry(0.9 * s, 0.1, 3), wing, 0, 0, side * 0.7 * s);
        m.rotation.x = Math.PI / 2;
        m.scale.set(1.3, 1, 1);
        return { w, side };
      });
      if (level >= 3) {
        const fire = piece(d, new THREE.ConeGeometry(0.22, 0.9, 7), glow(0xff7a1a, 0xff4000, 1), 1.95 * s, 1.75 * s, 0);
        fire.rotation.z = -Math.PI / 2;
        anims.push((t) => {
          const a = t * 0.35;
          d.position.set(Math.cos(a) * 9, 7 + Math.sin(t * 1.2) * 0.8, Math.sin(a) * 9);
          d.rotation.y = -a - Math.PI / 2;
          wings.forEach(({ w, side }) => (w.rotation.x = side * Math.sin(t * 6) * 0.6));
          fire.visible = Math.sin(t * 0.9) > 0.6;
          fire.scale.y = 0.8 + Math.abs(Math.sin(t * 14)) * 0.5;
        });
      } else {
        anims.push((t) => {
          wings.forEach(({ w, side }) => (w.rotation.x = side * (0.2 + Math.sin(t * 2) * 0.25)));
          d.rotation.y = Math.sin(t * 0.5) * 0.4;
        });
      }
      return true;
    }
    case "carousel": {
      add(new THREE.CylinderGeometry(2.2, 2.3, 0.3, 20), mat(0xf6e7c8), 0, 0.15, 0);
      const spin = group(0, 0.3, 0);
      piece(spin, new THREE.CylinderGeometry(0.15, 0.15, 2.8, 8), gold, 0, 1.4, 0);
      piece(spin, new THREE.ConeGeometry(2.4, 1.1, 16), mat(0xe2483a), 0, 3.3, 0);
      piece(spin, new THREE.SphereGeometry(0.22, 8, 6), gold, 0, 3.95, 0);
      const colors = [0xffffff, 0xffd36e, 0x9fd8ff, 0xffb3d1, 0xb9f2a1, 0xd7b8ff];
      const horses = [];
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI * 2) / 6;
        const x = Math.cos(a) * 1.6, z = Math.sin(a) * 1.6;
        piece(spin, new THREE.CylinderGeometry(0.04, 0.04, 2.7, 5), gold, x, 1.4, z);
        const h = piece(spin, new THREE.BoxGeometry(0.7, 0.35, 0.25), mat(colors[k]), x, 1.1, z);
        h.rotation.y = -a;
        horses.push(h);
      }
      anims.push((t) => {
        spin.rotation.y = t * 0.6;
        horses.forEach((h, k) => (h.position.y = 1.1 + Math.sin(t * 2 + k) * 0.25));
      });
      return true;
    }
    case "ferris": {
      add(new THREE.BoxGeometry(3, 0.3, 1.6), mat(0x8d94a6), 0, 0.15, 0);
      for (const z of [-0.6, 0.6]) {
        for (const x of [-1, 1]) {
          const leg = add(new THREE.BoxGeometry(0.15, 4.2, 0.15), mat(0xe8e2d4), x * 0.95, 2.1, z);
          leg.rotation.z = x * 0.24;
        }
      }
      const wheel = group(0, 4, 0);
      const ring = piece(wheel, new THREE.TorusGeometry(2.6, 0.08, 6, 32), mat(0xe8e2d4), 0, 0, 0);
      ring.rotation.y = 0;
      const cabins = [];
      const cc = [0xe2483a, 0x3a6fd8, 0xffc93a, 0x2fbf71, 0xa77bff, 0xff7a3a, 0x58c3ff, 0xff6fa0];
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI * 2) / 8;
        const spoke = piece(wheel, new THREE.BoxGeometry(0.05, 2.6, 0.05), mat(0xc9ced9), Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0);
        spoke.rotation.z = a - Math.PI / 2;
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), mat(cc[k]));
        c.castShadow = true;
        wheel.add(c);
        cabins.push({ c, a });
      }
      anims.push((t) => {
        const r = t * 0.25;
        wheel.rotation.z = r;
        cabins.forEach(({ c, a }) => {
          c.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6 - 0.3, 0);
          c.rotation.z = -r; // cabins stay upright
        });
      });
      return true;
    }
    case "coaster": {
      // a looping track on posts, a red car riding along it
      add(new THREE.BoxGeometry(5, 0.2, 3.4), mat(0xd8cfb8), 0, 0.1, 0);
      const pts = [];
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * 2.2, 1.4 + Math.sin(a * 2) * 1.0 + Math.max(0, Math.sin(a)) * 1.6, Math.sin(a) * 1.4));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      add(new THREE.TubeGeometry(curve, 120, 0.09, 6, true), mat(0xe2483a), 0, 0, 0);
      for (let k = 0; k < 12; k++) {
        const p = curve.getPointAt(k / 12);
        add(new THREE.CylinderGeometry(0.05, 0.05, p.y, 5), mat(0xc9ced9), p.x, p.y / 2, p.z);
      }
      const car = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.4), mat(0xffc93a));
      car.castShadow = true;
      g.add(car);
      const car2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.4), mat(0x3a6fd8));
      car2.castShadow = true;
      g.add(car2);
      anims.push((t) => {
        [car, car2].forEach((c, i) => {
          const u = (t * 0.12 + i * 0.03) % 1;
          const p = curve.getPointAt(u), q = curve.getPointAt((u + 0.01) % 1);
          c.position.set(p.x, p.y + 0.25, p.z);
          c.lookAt(q.x, q.y + 0.25, q.z);
        });
      });
      return true;
    }
    case "volcano": {
      const rock = mat(0x6b5a4e), dark = mat(0x3b302a);
      add(new THREE.CylinderGeometry(0.9, 2.8, 3.2, 10), rock, 0, 1.6, 0);
      add(new THREE.CylinderGeometry(0.75, 0.95, 0.3, 10), dark, 0, 3.25, 0);
      const lava = add(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 10), glow(0xff5a1a, 0xff3000, 1), 0, 3.38, 0);
      for (let k = 0; k < 3; k++) {
        const stream = add(new THREE.BoxGeometry(0.25, 2.4, 0.12), glow(0xff7a1a, 0xff4000, 0.9), Math.cos(k * 2.1) * 1.4, 2.0, Math.sin(k * 2.1) * 1.4);
        stream.rotation.z = Math.cos(k * 2.1) * 0.55;
        stream.rotation.x = -Math.sin(k * 2.1) * 0.55;
      }
      const puffs = [];
      for (let k = 0; k < (level >= 2 ? 6 : 4); k++) puffs.push(add(new THREE.SphereGeometry(0.45, 7, 5), mat(0xdadde3, { transparent: true, opacity: 0.8 }), 0, 4, 0));
      anims.push((t) => {
        lava.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.3;
        puffs.forEach((p, k) => {
          const u = (t * 0.25 + k / puffs.length) % 1;
          p.position.set(Math.sin(k * 2 + t * 0.3) * u * 0.8, 3.6 + u * 3.5, Math.cos(k * 2) * u * 0.6);
          p.scale.setScalar(0.5 + u * 1.3);
          p.material.opacity = 0.85 * (1 - u);
        });
      });
      return true;
    }
    case "treehouse": {
      const bark = mat(0x7a4f2a), leaf = mat(0x3f9d4a), plank = mat(0xc98b4c);
      add(new THREE.CylinderGeometry(0.35, 0.5, 3.4, 8), bark, 0, 1.7, 0);
      add(new THREE.BoxGeometry(2.2, 0.15, 2.2), plank, 0, 2.6, 0);
      add(new THREE.BoxGeometry(1.5, 1.1, 1.3), plank, 0, 3.25, 0);
      add(new THREE.ConeGeometry(1.25, 0.8, 4), mat(0xb5532f), 0, 4.2, 0).rotation.y = Math.PI / 4;
      add(new THREE.BoxGeometry(0.4, 0.4, 0.05), glow(0xffd36e, 0x6a4a00, 0.5), 0.3, 3.3, 0.66);
      for (let k = 0; k < 4; k++) add(new THREE.SphereGeometry(1.1, 7, 6), leaf, Math.cos(k * 1.6) * 1.3, 4.3 + (k % 2) * 0.5, Math.sin(k * 1.6) * 1.3);
      // a rope ladder
      for (let y = 0.4; y < 2.6; y += 0.35) add(new THREE.BoxGeometry(0.5, 0.05, 0.05), plank, 0.9, y, 0.9);
      if (level >= 2) {
        add(new THREE.BoxGeometry(0.08, 0.08, 3.4), mat(0xd9cfb0), 1.2, 2.55, -1.4).rotation.x = 0.2; // zip line
        add(new THREE.BoxGeometry(0.06, 1.6, 0.06), plank, -1.6, 1.8, 0);
        const swing = add(new THREE.BoxGeometry(0.6, 0.08, 0.3), mat(0xe2483a), -1.6, 1.0, 0);
        anims.push((t) => (swing.position.z = Math.sin(t * 1.8) * 0.4));
      }
      return true;
    }
    case "wizard": {
      const stone = mat(0x8b85a8), roof = mat(0x4b2c8c);
      const h = level >= 2 ? 6 : 4.6;
      add(new THREE.CylinderGeometry(0.9, 1.15, h, 10), stone, 0, h / 2, 0);
      add(new THREE.ConeGeometry(1.25, 2.2, 10), roof, 0, h + 1.1, 0);
      for (let k = 0; k < 6; k++) add(new THREE.OctahedronGeometry(0.1), glow(0xfff2a8), Math.cos(k) * 1.05, h + 0.6 + (k % 3) * 0.4, Math.sin(k) * 1.05);
      for (const y of [1.5, h - 1.2]) add(new THREE.BoxGeometry(0.35, 0.55, 0.06), glow(0xc6a8ff, 0x7a4bff, 0.7), 0, y, 1.05);
      const orb = add(new THREE.SphereGeometry(0.35, 14, 10), glow(0x7ad7ff, 0x2aa7ff, 1), 0, h + 2.9, 0);
      const ring = add(new THREE.TorusGeometry(0.6, 0.04, 6, 24), glow(0xffd36e, 0xffa000, 0.8), 0, h + 2.9, 0);
      anims.push((t) => {
        orb.position.y = h + 2.9 + Math.sin(t * 1.5) * 0.3;
        ring.position.y = orb.position.y;
        ring.rotation.x = t * 1.2;
        ring.rotation.y = t * 0.7;
        orb.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.3;
      });
      return true;
    }
    case "dino": {
      const skin = mat(0x6cbf5a), spot = mat(0x3f8f3a);
      const d = group(0, 0, 0);
      piece(d, new THREE.SphereGeometry(1, 10, 8), skin, 0, 1.4, 0).scale.set(1.5, 1, 1);
      for (const [x, z] of [[-0.8, -0.5], [-0.8, 0.5], [0.7, -0.5], [0.7, 0.5]]) piece(d, new THREE.CylinderGeometry(0.22, 0.26, 1, 6), skin, x, 0.5, z);
      const neck = new THREE.Group();
      neck.position.set(1.2, 1.7, 0);
      d.add(neck);
      piece(neck, new THREE.CylinderGeometry(0.22, 0.35, 2.2, 8), skin, 0.5, 1, 0).rotation.z = -0.45;
      piece(neck, new THREE.SphereGeometry(0.38, 8, 6), skin, 1.05, 2.1, 0).scale.set(1.4, 0.9, 0.9);
      for (const z of [-0.18, 0.18]) piece(neck, new THREE.SphereGeometry(0.06, 6, 4), mat(0x1f2a44), 1.35, 2.25, z);
      const tail = piece(d, new THREE.ConeGeometry(0.4, 2.2, 7), skin, -2.1, 1.2, 0);
      tail.rotation.z = Math.PI / 2 - 0.2;
      for (let k = 0; k < 5; k++) piece(d, new THREE.ConeGeometry(0.15, 0.35, 4), spot, -0.9 + k * 0.45, 2.45 - Math.abs(k - 2) * 0.08, 0);
      anims.push((t) => {
        neck.rotation.z = Math.sin(t * 0.8) * 0.15;
        tail.rotation.y = Math.sin(t * 1.2) * 0.25;
      });
      return true;
    }
    case "unicorn": {
      const white = mat(0xffffff), mane = [0xff6fa0, 0xffd36e, 0x7ad7ff, 0xa77bff];
      const u = group(0, 0, 0);
      piece(u, new THREE.BoxGeometry(1.5, 0.7, 0.6), white, 0, 1.2, 0);
      for (const [x, z] of [[-0.55, -0.2], [-0.55, 0.2], [0.55, -0.2], [0.55, 0.2]]) piece(u, new THREE.BoxGeometry(0.16, 0.9, 0.16), white, x, 0.45, z);
      const head = piece(u, new THREE.BoxGeometry(0.45, 0.75, 0.4), white, 0.85, 1.75, 0);
      head.rotation.z = -0.4;
      piece(u, new THREE.ConeGeometry(0.08, 0.6, 6), gold, 1.05, 2.35, 0).rotation.z = -0.4;
      mane.forEach((c, k) => piece(u, new THREE.BoxGeometry(0.14, 0.3, 0.45), mat(c), 0.55 - k * 0.14, 1.75 - k * 0.05, 0));
      mane.forEach((c, k) => piece(u, new THREE.BoxGeometry(0.4, 0.1, 0.12), mat(c), -0.95 - k * 0.05, 1.3 - k * 0.12, 0));
      if (level >= 2) {
        // a rainbow arching over it
        const colors = [0xe2483a, 0xff9f1a, 0xffd36e, 0x2fbf71, 0x3a6fd8, 0xa77bff];
        colors.forEach((c, k) => add(new THREE.TorusGeometry(2.6 - k * 0.18, 0.09, 6, 30, Math.PI), mat(c), 0, 0.1, -1));
      }
      anims.push((t) => {
        u.position.y = Math.abs(Math.sin(t * 1.5)) * 0.25;
        u.rotation.y = Math.sin(t * 0.4) * 0.5;
      });
      return true;
    }
    case "rainbow": {
      const colors = [0xe2483a, 0xff9f1a, 0xffd36e, 0x2fbf71, 0x3a6fd8, 0xa77bff];
      colors.forEach((c, k) => add(new THREE.TorusGeometry(2.8 - k * 0.2, 0.1, 6, 32, Math.PI), mat(c), 0, 0.1, 0));
      for (const x of [-2.6, 2.6]) for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(0.45, 7, 5), mat(0xffffff), x + (k - 1) * 0.35, 0.35, (k - 1) * 0.2);
      return true;
    }
    case "chest": {
      const wood = mat(0x8a5a2b);
      add(new THREE.BoxGeometry(1.6, 0.8, 1), wood, 0, 0.4, 0);
      add(new THREE.BoxGeometry(1.7, 0.1, 1.1), gold, 0, 0.82, 0);
      const lid = new THREE.Group();
      lid.position.set(0, 0.85, -0.5);
      g.add(lid);
      piece(lid, new THREE.BoxGeometry(1.6, 0.35, 1), wood, 0, 0.17, 0.5);
      const coins = [];
      for (let k = 0; k < 7; k++) coins.push(add(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12), gold, (k - 3) * 0.2, 0.9, 0));
      const gem = add(new THREE.OctahedronGeometry(0.18), glow(0x7ad7ff, 0x2aa7ff, 0.8), 0, 1.1, 0);
      anims.push((t) => {
        lid.rotation.x = -0.6 - Math.max(0, Math.sin(t * 0.8)) * 0.6;
        gem.rotation.y = t * 1.5;
        coins.forEach((c, k) => (c.position.y = 0.9 + Math.abs(Math.sin(t * 2 + k)) * 0.12));
      });
      return true;
    }
    case "robot": {
      const metal = mat(0xb9c2d3, { metalness: 0.5, roughness: 0.4 });
      add(new THREE.BoxGeometry(1, 1.2, 0.7), metal, 0, 1.6, 0);
      for (const x of [-0.25, 0.25]) add(new THREE.BoxGeometry(0.25, 1, 0.3), metal, x, 0.5, 0);
      add(new THREE.BoxGeometry(0.8, 0.65, 0.65), metal, 0, 2.6, 0);
      for (const x of [-0.18, 0.18]) add(new THREE.SphereGeometry(0.09, 8, 6), glow(0x7ad7ff, 0x2aa7ff, 1), x, 2.65, 0.33);
      add(new THREE.BoxGeometry(0.4, 0.4, 0.05), glow(0x2fbf71, 0x1a8f4a, 0.8), 0, 1.7, 0.36);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), metal, 0, 3.1, 0);
      const bulb = add(new THREE.SphereGeometry(0.1, 8, 6), glow(0xe2483a, 0xff2000, 1), 0, 3.35, 0);
      const arm = new THREE.Group();
      arm.position.set(0.6, 2, 0);
      g.add(arm);
      piece(arm, new THREE.BoxGeometry(0.2, 0.9, 0.2), metal, 0.1, 0.4, 0);
      add(new THREE.BoxGeometry(0.2, 0.9, 0.2), metal, -0.65, 1.6, 0);
      anims.push((t) => {
        arm.rotation.z = 0.4 + Math.sin(t * 3) * 0.5; // waving hello
        bulb.material.emissiveIntensity = Math.sin(t * 4) > 0 ? 1 : 0.2;
      });
      return true;
    }
    case "observatory": {
      const wall = mat(0xf1ead8);
      add(new THREE.CylinderGeometry(1.6, 1.7, 2, 14), wall, 0, 1, 0);
      const dome = group(0, 2, 0);
      piece(dome, new THREE.SphereGeometry(1.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd7dbe4, { metalness: 0.4, roughness: 0.4 }), 0, 0, 0);
      const scope = piece(dome, new THREE.CylinderGeometry(0.18, 0.25, 2.2, 10), mat(0x2d4a7a), 0.6, 1.2, 0);
      scope.rotation.z = -0.7;
      for (let k = 0; k < 5; k++) add(new THREE.OctahedronGeometry(0.12), glow(0xfff2a8), Math.cos(k * 1.3) * 2.4, 4.2 + (k % 2) * 0.6, Math.sin(k * 1.3) * 2.4);
      anims.push((t) => (dome.rotation.y = t * 0.2));
      return true;
    }
    case "icecream": {
      add(new THREE.BoxGeometry(2.2, 1.4, 1.6), mat(0xfff0f6), 0, 0.7, 0);
      for (let k = 0; k < 5; k++) add(new THREE.BoxGeometry(0.44, 0.1, 1.8), mat(k % 2 ? 0xff6fa0 : 0xffffff), -0.88 + k * 0.44, 1.75, 0.15);
      add(new THREE.BoxGeometry(1.6, 0.5, 0.05), glow(0x9fd8ff, 0x3a8fd8, 0.4), 0, 0.95, 0.81);
      const cone = add(new THREE.ConeGeometry(0.35, 1, 10), mat(0xd9a05b), 0, 2.6, 0);
      cone.rotation.x = Math.PI;
      const scoops = [0xff6fa0, 0xfff2a8, 0x8a5a2b].map((c, k) => add(new THREE.SphereGeometry(0.33, 10, 8), mat(c), 0, 3.2 + k * 0.38, 0));
      anims.push((t) => scoops.forEach((s, k) => (s.position.x = Math.sin(t * 1.5 + k) * 0.04)));
      return true;
    }
    case "helicopter": {
      add(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 20), mat(0x6b7280), 0, 0.06, 0);
      add(new THREE.TorusGeometry(1.1, 0.06, 4, 24), mat(0xffd36e), 0, 0.14, 0).rotation.x = Math.PI / 2;
      const h = group(0, 0, 0);
      piece(h, new THREE.SphereGeometry(0.75, 12, 10), mat(0xe2483a), 0, 0.9, 0).scale.set(1.4, 1, 1);
      piece(h, new THREE.SphereGeometry(0.5, 10, 8), mat(0x9fd8ff, { metalness: 0.3 }), 0.55, 1, 0);
      piece(h, new THREE.BoxGeometry(1.8, 0.18, 0.18), mat(0xe2483a), -1.5, 1.05, 0);
      for (const z of [-0.5, 0.5]) piece(h, new THREE.BoxGeometry(1.6, 0.06, 0.06), mat(0x1f2a44), 0, 0.2, z);
      const rotor = new THREE.Group();
      rotor.position.set(0, 1.8, 0);
      h.add(rotor);
      piece(rotor, new THREE.BoxGeometry(3.4, 0.04, 0.2), mat(0x1f2a44), 0, 0, 0);
      piece(rotor, new THREE.BoxGeometry(0.2, 0.04, 3.4), mat(0x1f2a44), 0, 0, 0);
      anims.push((t) => {
        rotor.rotation.y = t * 14;
        const lift = Math.max(0, Math.sin(t * 0.25));
        h.position.y = lift * 3;
        h.rotation.y = lift * 0.8;
      });
      return true;
    }
    case "ufo": {
      const u = group(0, 0, 0);
      piece(u, new THREE.SphereGeometry(1.7, 20, 8), mat(0xc9ced9, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0).scale.y = 0.25;
      piece(u, new THREE.SphereGeometry(0.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7ad7ff, { transparent: true, opacity: 0.75 }), 0, 0.25, 0);
      const alien = piece(u, new THREE.SphereGeometry(0.3, 10, 8), mat(0x6cbf5a), 0, 0.5, 0);
      const lights = [];
      for (let k = 0; k < 8; k++) lights.push(piece(u, new THREE.SphereGeometry(0.11, 6, 4), glow(0xffd36e, 0xffa000, 1), Math.cos(k * 0.785) * 1.5, -0.05, Math.sin(k * 0.785) * 1.5));
      const beam = piece(u, new THREE.ConeGeometry(1.2, 4, 16, 1, true), mat(0xbfffd9, { transparent: true, opacity: 0.25, emissive: 0x4fffa0, emissiveIntensity: 0.4, side: THREE.DoubleSide }), 0, -2.1, 0);
      anims.push((t) => {
        u.position.set(Math.sin(t * 0.4) * 1.2, 5.5 + Math.sin(t * 1.1) * 0.5, Math.cos(t * 0.3) * 1.2);
        u.rotation.y = t * 0.8;
        lights.forEach((l, k) => (l.material.emissiveIntensity = (Math.sin(t * 5 + k) + 1) / 2));
        beam.visible = Math.sin(t * 0.5) > 0;
        alien.position.y = 0.5 + Math.sin(t * 2) * 0.05;
      });
      return true;
    }
    default:
      return false;
  }
}
