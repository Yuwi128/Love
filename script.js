"use strict";
/* ========== SETTINGS ========== */
const WEB3FORMS_KEY = "aeb8d03f-99ae-4e9a-b321-ee0b92fae1fa";
const DATE_KINDS = ["🎬 Movies","🧺 Picnic","☕ Coffee","🍝 Dinner","🌳 Walk in the park","🎮 Arcade"];
const YEARS = [2026, 2027];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const NO_LINES = ["No","Are you sure? 🥺","Really?","Think again 💭","Pretty please? 🥹","Last chance… 😢","Just press Yes 😘"];
const FLOWERS = ["🌸","🌷","🌹","🌼","🌺","🌻","💮","💐","💐","🦋","🦋"];
const small = matchMedia("(max-width:600px)").matches;
const FLOWER_COUNT = small ? 16 : 28;      // fewer on phones = smoother
const DODGE_RADIUS = 150, DODGE_PUSH = 130, DODGE_EASE = 0.14;
const SPARK_COUNT = small ? 40 : 70;
const SPARK_COLORS = ["#ffd166","#ffe08a","#ff9ec4","#ff5c93","#ffffff"];
const CURSOR_SPARKS = true;

/* ========== HELPERS ========== */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
const answers = { kind: "" };
const pointer = { x: -9999, y: -9999, active: false };

function show(id) {
  document.querySelectorAll("section").forEach(s => s.classList.toggle("on", s.id === id));
  window.scrollTo(0, 0);
}

function trackPointer() {
  addEventListener("pointermove", e => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    if (CURSOR_SPARKS && !calm) cursorBurst(e.clientX, e.clientY);
  }, { passive: true });
  addEventListener("pointerdown", e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; }, { passive: true });
  const leave = () => { pointer.active = false; pointer.x = pointer.y = -9999; };
  addEventListener("pointercancel", leave);
  addEventListener("pointerup", e => { if (e.pointerType !== "mouse") leave(); });
  document.addEventListener("mouseleave", leave);
}

/* ========== FLOWERS ========== */
const flowers = [];
function growGarden() {
  const garden = $("garden");
  for (let i = 0; i < FLOWER_COUNT; i++) {
    const f = document.createElement("div");
    f.className = "flower";
    const p = document.createElement("span");
    p.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    f.appendChild(p);
    f.style.left = rand(0, 94) + "vw";
    f.style.fontSize = rand(small ? 20 : 22, small ? 40 : 54) + "px";
    if (calm) {
      f.style.animation = "none"; f.style.bottom = rand(0, 90) + "vh"; p.style.animation = "none";
    } else {
      f.style.animationDuration = rand(12, 26) + "s";
      f.style.animationDelay = -rand(0, 26) + "s";
      p.style.animationDuration = rand(2.5, 5) + "s";
      p.style.animationDelay = -rand(0, 4) + "s";
    }
    garden.appendChild(f);
    flowers.push({ el: f, ox: 0, oy: 0 });
  }
}
function dodgeCursor() {
  for (const f of flowers) {
    let tx = 0, ty = 0;
    if (pointer.active) {
      const r = f.el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - f.ox - pointer.x;
      const dy = r.top + r.height / 2 - f.oy - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < DODGE_RADIUS) {
        const force = (DODGE_RADIUS - dist) / DODGE_RADIUS;
        tx = dx / dist * force * DODGE_PUSH; ty = dy / dist * force * DODGE_PUSH;
      }
    }
    f.ox += (tx - f.ox) * DODGE_EASE; f.oy += (ty - f.oy) * DODGE_EASE;
    if (Math.abs(f.ox) < .05 && Math.abs(f.oy) < .05 && !tx && !ty) { f.ox = f.oy = 0; f.el.style.translate = ""; }
    else f.el.style.translate = f.ox.toFixed(1) + "px " + f.oy.toFixed(1) + "px";
  }
}

/* ========== SPARKS ========== */
const sparkCanvas = $("sparks"), sctx = sparkCanvas.getContext("2d");
let sparks = [], W = 0, H = 0, dpr = 1;
function resizeSparks() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  sparkCanvas.width = W * dpr; sparkCanvas.height = H * dpr;
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function newSpark(atCursor, x, y) {
  const s = {
    x: atCursor ? x : rand(0, W), y: atCursor ? y : rand(0, H),
    r: atCursor ? rand(1, 2.6) : rand(1, 3.2),
    vx: rand(-.25, .25), vy: -rand(.25, 1.1),
    color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    life: 0, maxLife: atCursor ? rand(30, 60) : rand(160, 420),
    phase: rand(0, Math.PI * 2), twinkle: rand(.04, .12), burst: atCursor
  };
  if (atCursor) { const a = rand(0, Math.PI * 2), sp = rand(.4, 1.8); s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp - .3; }
  return s;
}
let lastBurst = 0;
function cursorBurst(x, y) {
  const now = performance.now();
  if (now - lastBurst < 35 || sparks.length > SPARK_COUNT + 160) return;
  lastBurst = now;
  for (let i = 0; i < 2; i++) sparks.push(newSpark(true, x, y));
}
function drawSpark(s, alpha) {
  const glow = s.r * 5;
  const g = sctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow);
  g.addColorStop(0, s.color); g.addColorStop(.25, s.color); g.addColorStop(1, "rgba(255,255,255,0)");
  sctx.globalAlpha = alpha * .55; sctx.fillStyle = g;
  sctx.beginPath(); sctx.arc(s.x, s.y, glow, 0, Math.PI * 2); sctx.fill();
  sctx.globalAlpha = alpha; sctx.fillStyle = s.color;
  sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); sctx.fill();
  sctx.strokeStyle = s.color; sctx.lineWidth = .8;
  const len = s.r * 3 * alpha;
  sctx.beginPath();
  sctx.moveTo(s.x - len, s.y); sctx.lineTo(s.x + len, s.y);
  sctx.moveTo(s.x, s.y - len); sctx.lineTo(s.x, s.y + len);
  sctx.stroke();
}
function stepSparks() {
  sctx.clearRect(0, 0, W, H);
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life++;
    s.x += s.vx + Math.sin((s.life + s.phase * 20) * .03) * .15;
    s.y += s.vy;
    if (s.burst) { s.vx *= .96; s.vy *= .96; }
    const t = s.life / s.maxLife;
    const fade = t < .15 ? t / .15 : 1 - (t - .15) / .85;
    const alpha = Math.max(0, fade) * (.6 + .4 * Math.sin(s.life * s.twinkle + s.phase));
    if (t >= 1 || s.y < -20 || s.x < -20 || s.x > W + 20) {
      if (s.burst) sparks.splice(i, 1);
      else { sparks[i] = newSpark(false); sparks[i].y = H + 10; }
      continue;
    }
    drawSpark(s, alpha);
  }
  sctx.globalAlpha = 1;
}
function startSparks() {
  resizeSparks();
  addEventListener("resize", resizeSparks);
  for (let i = 0; i < SPARK_COUNT; i++) { const s = newSpark(false); s.life = Math.floor(rand(0, s.maxLife)); sparks.push(s); }
  if (calm) stepSparks();
}

/* ========== MAGIC ========== */
const shootingStars = [];
function drawShootingStars() {
  if (!calm && shootingStars.length < 2 && Math.random() < .006)
    shootingStars.push({ x: rand(0, W * .75), y: rand(0, H * .35), vx: rand(8, 12), vy: rand(3, 5.5), life: 0, max: 50 });
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    s.life++; s.x += s.vx; s.y += s.vy;
    const a = Math.sin(s.life / s.max * Math.PI);
    const tx = s.x - s.vx * 9, ty = s.y - s.vy * 9;
    const g = sctx.createLinearGradient(s.x, s.y, tx, ty);
    g.addColorStop(0, "rgba(255,214,102,1)"); g.addColorStop(.4, "rgba(255,158,196,.6)"); g.addColorStop(1, "rgba(255,158,196,0)");
    sctx.globalAlpha = a; sctx.strokeStyle = g; sctx.lineWidth = 2.4; sctx.lineCap = "round";
    sctx.beginPath(); sctx.moveTo(s.x, s.y); sctx.lineTo(tx, ty); sctx.stroke();
    sctx.fillStyle = "#fff6d6"; sctx.beginPath(); sctx.arc(s.x, s.y, 2.6, 0, Math.PI * 2); sctx.fill();
    if (s.life >= s.max) shootingStars.splice(i, 1);
  }
  sctx.globalAlpha = 1;
}

let glowEl = null, gx = -999, gy = -999;
function createGlow() {
  glowEl = document.createElement("div");
  glowEl.id = "glow"; glowEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(glowEl);
}
function moveGlow() {
  if (pointer.active) {
    if (gx < -900) { gx = pointer.x; gy = pointer.y; }
    gx += (pointer.x - gx) * .2; gy += (pointer.y - gy) * .2;
    glowEl.style.opacity = "1";
    glowEl.style.transform = "translate(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px)";
  } else { glowEl.style.opacity = "0"; gx = -999; }
}

const CONFETTI = ["🌸","🌷","🌹","🌼","🌺","💐","🦋","✨"];
function confetti(x, y, n) {
  if (small) n = Math.ceil(n * .7);
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
    el.style.left = x + "px"; el.style.top = y + "px"; el.style.fontSize = rand(18, 36) + "px";
    document.body.appendChild(el);
    const a = rand(0, Math.PI * 2), d = rand(100, small ? 220 : 340);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 60, rot = rand(-200, 200);
    const anim = el.animate([
      { transform: "translate(-50%,-50%) scale(.2) rotate(0deg)", opacity: 0 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1) rotate(${rot}deg)`, opacity: 1, offset: .45 },
      { transform: `translate(calc(-50% + ${dx * 1.1}px),calc(-50% + ${dy + 220}px)) scale(.8) rotate(${rot * 1.5}deg)`, opacity: 0 }
    ], { duration: rand(1400, 2400), easing: "cubic-bezier(.2,.8,.3,1)" });
    anim.onfinish = () => el.remove();
  }
}
function celebrate(x, y, n = 26, sparksN = 40) {
  if (calm) return;
  confetti(x, y, n);
  for (let i = 0; i < sparksN; i++) {
    const s = newSpark(true, x, y);
    s.vx *= 3.5; s.vy *= 3.5; s.maxLife = rand(40, 90); s.r = rand(1.5, 3.4);
    sparks.push(s);
  }
}

/* ========== LOOP ========== */
function loop() {
  if (!document.hidden) {
    if (!calm) { stepSparks(); drawShootingStars(); }
    dodgeCursor(); moveGlow();
  }
  requestAnimationFrame(loop);
}

/* ========== STEP 1 ========== */
function setupQuestion() {
  const yes = $("yes"), no = $("no");
  let tries = 0, lastTry = 0;
  function dodge(e) {
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    if (now - lastTry < 300) return;
    lastTry = now; tries++;
    // cap the growth so "Yes" never gets bigger than the screen
    const maxScale = Math.min(18, (innerWidth * 1.15) / yes.offsetWidth);
    yes.style.transform = "scale(" + Math.min(1 + tries * .5, maxScale) + ")";
    no.textContent = NO_LINES[Math.min(tries, NO_LINES.length - 1)];
    no.classList.add("fly");
    no.style.left = Math.max(8, rand(0, innerWidth - no.offsetWidth - 16)) + "px";
    no.style.top = Math.max(8, rand(0, innerHeight - no.offsetHeight - 16)) + "px";
  }
  ["pointerenter","pointerdown","touchstart","click","focus"].forEach(t => no.addEventListener(t, dodge, { passive: false }));
  yes.addEventListener("click", () => {
    const r = yes.getBoundingClientRect();
    celebrate(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight), 30, 50);
    no.style.display = "none";
    yes.style.transform = "";
    show("s2");
  });
}

/* ========== STEP 2 ========== */
function setupChoices() {
  const box = $("chips");
  DATE_KINDS.forEach(kind => {
    const chip = document.createElement("button");
    chip.type = "button"; chip.className = "chip"; chip.textContent = kind;
    chip.setAttribute("aria-pressed", "false");
    chip.onclick = () => {
      const r = chip.getBoundingClientRect();
      celebrate(r.left + r.width / 2, r.top + r.height / 2, 6, 18);
      answers.kind = kind;
      box.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c === chip));
    };
    box.appendChild(chip);
  });
  $("next").onclick = () => {
    if (!answers.kind) { $("err1").textContent = "Pick a kind of date 💭"; return; }
    $("err1").textContent = "";
    show("s2b");
  };
}

/* ========== STEP 3 ========== */
function setupDateAndTime() {
  const mo = $("mo"), dy = $("dy"), yr = $("yr");
  MONTHS.forEach((name, i) => mo.add(new Option(name, i)));
  YEARS.forEach(y => yr.add(new Option(y, y)));
  function fillDays() {
    const keep = +dy.value || 1;
    const total = new Date(+yr.value, +mo.value + 1, 0).getDate();
    dy.innerHTML = "";
    for (let d = 1; d <= total; d++) dy.add(new Option(d, d));
    dy.value = Math.min(keep, total);
  }
  mo.onchange = yr.onchange = fillDays;
  const today = new Date();
  yr.value = YEARS.includes(today.getFullYear()) ? today.getFullYear() : YEARS[0];
  mo.value = today.getMonth();
  fillDays();
  dy.value = today.getDate();

  $("back").onclick = () => show("s2");
  const fail = t => { $("err").textContent = t; };

  $("send").onclick = () => {
    const time = $("t").value;
    if (!time) return fail("Please choose a time ⏰");
    const [hour, minute] = time.split(":").map(Number);
    const when = new Date(+yr.value, +mo.value, +dy.value, hour, minute);
    if (when < new Date()) return fail("Please pick a day and time that haven’t passed yet 📅");
    $("err").textContent = "";
    show("s3");
    [0, 450, 900, 1500].forEach(ms => setTimeout(() =>
      celebrate(rand(innerWidth * .25, innerWidth * .75), rand(innerHeight * .25, innerHeight * .6), 22, 40), ms));
    sendEmail({
      "Date idea": answers.kind,
      "Day and time": when.toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      "Her note": $("n").value.trim() || "(none)"
    });
  };
}

/* ========== EMAIL (Web3Forms) ========== */
async function sendEmail(details) {
  if (!WEB3FORMS_KEY) return;
  const message = "I said YES! 💖\n" + Object.entries(details).map(([k, v]) => k + ": " + v).join("\n");
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: "Your date answer 💖", from_name: "Be My Date page", ...details, message })
    });
  } catch (err) { console.error("Email did not send:", err); }
}

/* ========== START ========== */
trackPointer(); growGarden(); startSparks(); createGlow();
setupQuestion(); setupChoices(); setupDateAndTime();
requestAnimationFrame(loop);
