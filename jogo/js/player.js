// A anjinha mensageira: câmera atrás dela, virar gira a câmera junto.
import * as THREE from 'three';
import { angelModel, setWings, terrainHeight, animateChar } from './world.js';
import { sfx } from './audio.js';

const TURN = 1.9;        // rad/s no teclado / joystick
const DRAG_TURN = 0.0032; // por pixel arrastado
export const FLY_CEIL = 30; // altura máxima de voo (acima do chão do vale)

export class Player {
  constructor(scene, world) {
    this.world = world;
    this.model = angelModel(); scene.add(this.model);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#1a2050', transparent: true, opacity: 0.3, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; scene.add(sh); this.shadow = sh;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.grounded = true; this.facing = Math.PI; this.t = 0; this.flapT = 0; this.hspeed = 0; this.turnVel = 0; this.walk = 0;
  }
  place(x, z, facing = Math.PI) {
    this.pos.set(x, terrainHeight(x, z), z); this.vel.set(0, 0, 0); this.facing = facing; this.grounded = true;
    this.sync(0);
  }
  update(dt, inp, locked) {
    this.t += dt;
    let mx = 0, my = 0, jp = false, jh = false, drag = 0;
    if (!locked) { mx = inp.move.x; my = inp.move.y; jp = inp.jumpPressed; jh = inp.jumpHeld; drag = inp.camDX; }
    // virar: A/D, setas, joystick (eixo X) ou arrastar. Com aceleração suave para não ficar sensível.
    const dz = v => (Math.abs(v) < 0.18 ? 0 : Math.sign(v) * ((Math.abs(v) - 0.18) / 0.82) ** 1.6);
    mx = dz(mx); my = Math.abs(my) < 0.15 ? 0 : my;
    this.turnVel += (mx * TURN - this.turnVel) * (1 - Math.exp(-7 * dt));
    this.facing -= this.turnVel * dt + Math.max(-60, Math.min(60, drag)) * DRAG_TURN;
    const fx = Math.sin(this.facing), fz = Math.cos(this.facing);
    const speed = !this.grounded ? 8 : my >= 0 ? 6 : 3;
    const k = 1 - Math.exp(-(this.grounded ? 7 : 4) * dt);
    this.vel.x += (fx * my * speed - this.vel.x) * k; this.vel.z += (fz * my * speed - this.vel.z) * k;

    // voo: cada toque no Espaço/Enter bate as asas e sobe mais; segurando, plana
    if (jp) {
      if (this.grounded) { this.vel.y = 8.6; this.grounded = false; this.flapT = 0.35; sfx.jump(); }
      else { this.vel.y = Math.min(11, Math.max(this.vel.y, 0) + 6.5); this.flapT = 0.4; sfx.flap(); }
    }
    this.vel.y -= 16 * dt;
    this.gliding = !this.grounded && jh && this.vel.y < -1.2;
    if (this.gliding) this.vel.y = -1.2;
    // teto de voo: freia suavemente perto do limite
    if (this.pos.y > FLY_CEIL - 3 && this.vel.y > 0) this.vel.y *= Math.max(0, (FLY_CEIL - this.pos.y) / 3);
    if (this.pos.y > FLY_CEIL) { this.pos.y = FLY_CEIL; this.vel.y = Math.min(this.vel.y, 0); }

    const wasGrounded = this.grounded;
    this.pos.addScaledVector(this.vel, dt);
    this.world.collide(this.pos, 0.42);
    const r = Math.hypot(this.pos.x, this.pos.z); if (r > 70) { this.pos.x *= 70 / r; this.pos.z *= 70 / r; }
    const g = this.world.groundAt(this.pos.x, this.pos.z, this.pos.y);
    if (this.pos.y <= g || (wasGrounded && this.vel.y <= 0 && this.pos.y - g < 0.4)) {
      this.pos.y = g; if (this.vel.y < 0) this.vel.y = 0; this.grounded = true;
    } else this.grounded = false;
    this.hspeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded) this.walk += this.hspeed * dt * 2.2;
    this.sync(dt);
  }
  sync(dt) {
    const m = this.model, t = this.t;
    const hover = 0.1 + Math.sin(t * 3) * 0.05;
    m.position.set(this.pos.x, this.pos.y + hover, this.pos.z);
    m.rotation.y = this.facing;
    m.rotation.x = this.grounded ? Math.min(this.hspeed * 0.015, 0.08) : Math.min(0.35, this.hspeed * 0.04);
    this.flapT = Math.max(0, this.flapT - dt);
    let a;
    if (this.flapT > 0) a = 0.3 + Math.sin(t * 30) * 0.7;
    else if (this.gliding) a = 0.05 + Math.sin(t * 4) * 0.05;
    else if (!this.grounded) a = 0.4 + Math.sin(t * 12) * 0.4;
    else a = 0.6 + Math.sin(t * 2.5) * 0.12 + (this.hspeed > 1 ? Math.sin(t * 10) * 0.12 : 0);
    setWings(m, a);
    animateChar(m, t, dt, { speed: this.grounded ? this.hspeed : 0, phase: this.walk, air: !this.grounded });
    const g = this.world.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.01);
    this.shadow.position.set(this.pos.x, g + 0.04, this.pos.z);
    this.shadow.scale.setScalar(Math.max(0.35, 1 - (this.pos.y - g) * 0.12));
  }
}
