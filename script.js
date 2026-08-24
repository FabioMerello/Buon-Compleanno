/* =========================================================
   Rosa scroll-driven + reveal on scroll
   ========================================================= */

(function () {
  "use strict";

  const stage = document.getElementById("roseStage");
  const petalsOuter = Array.from(document.querySelectorAll("#petalsOuter .petal"));
  const petalsMid = Array.from(document.querySelectorAll("#petalsMid .petal"));
  const petalsCore = Array.from(document.querySelectorAll("#petalsCore .petal"));
  const leaves = Array.from(document.querySelectorAll(".leaf"));
  const stemPath = document.getElementById("stemPath");
  const glow = document.querySelector(".glow");
  const hint = document.getElementById("scrollHint");
  const rose = document.getElementById("rose");

  /* ---- gambo: disegno progressivo ---- */
  let stemLen = 0;
  if (stemPath) {
    stemLen = stemPath.getTotalLength();
    stemPath.style.strokeDasharray = stemLen;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);          // easeOutCubic
  // progresso di una fase [start,end] dentro [0,1]
  const phase = (p, s, e) => clamp((p - s) / (e - s), 0, 1);

  /* angoli di apertura per ogni petalo (gradi) */
  const outerAngles = [-62, 62, -30, 30];
  const midAngles = [-38, 38, 0];

  let target = 0;
  let current = 0;

  function computeProgress() {
    if (!stage) return 0;
    const rect = stage.getBoundingClientRect();
    const scrollable = stage.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 1;
    return clamp(-rect.top / scrollable, 0, 1);
  }

  function render(p) {
    // FASE 1 (0 → .28) gambo cresce
    const pStem = ease(phase(p, 0, 0.28));
    if (stemPath) stemPath.style.strokeDashoffset = stemLen * (1 - pStem);

    // FASE 2 (.18 → .40) foglie
    const pLeaf = ease(phase(p, 0.18, 0.42));
    leaves.forEach((l, i) => {
      const dir = i === 0 ? -1 : 1;
      l.style.transform =
        "scale(" + pLeaf.toFixed(3) + ") rotate(" + (dir * (1 - pLeaf) * 25).toFixed(2) + "deg)";
      l.style.opacity = pLeaf.toFixed(3);
    });

    // FASE 3 (.30 → .58) cuore del bocciolo
    const pCore = ease(phase(p, 0.30, 0.58));
    petalsCore.forEach((el, i) => {
      const s = 0.35 + pCore * 0.65;
      el.style.transform = "scale(" + s.toFixed(3) + ") rotate(" + ((i - 1) * pCore * 8).toFixed(2) + "deg)";
      el.style.opacity = clamp(pCore * 1.4, 0, 1).toFixed(3);
    });

    // FASE 4 (.42 → .78) petali medi si aprono
    const pMid = ease(phase(p, 0.42, 0.80));
    petalsMid.forEach((el, i) => {
      const a = midAngles[i] * pMid;
      const s = 0.55 + pMid * 0.45;
      el.style.transform =
        "rotate(" + a.toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
      el.style.opacity = clamp(pMid * 1.5, 0, 1).toFixed(3);
    });

    // FASE 5 (.58 → 1) petali esterni: apertura ampia
    const pOut = ease(phase(p, 0.58, 1));
    petalsOuter.forEach((el, i) => {
      const a = outerAngles[i] * pOut;
      const s = 0.6 + pOut * 0.4;
      el.style.transform =
        "rotate(" + a.toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
      el.style.opacity = clamp(pOut * 1.6, 0, 1).toFixed(3);
    });

    // respiro generale + luce
    if (rose) {
      const zoom = 0.86 + p * 0.18;
      const lift = (1 - p) * 4;
      rose.style.transform = "scale(" + zoom.toFixed(3) + ") translateY(" + lift.toFixed(2) + "%)";
    }
    if (glow) glow.style.opacity = (0.25 + p * 0.75).toFixed(3);
    if (hint) hint.style.opacity = (1 - clamp(p * 3, 0, 1)).toFixed(3);
  }

  /* loop con smoothing per uno scorrimento fluido */
  function loop() {
    target = computeProgress();
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.0005) current = target;
    render(current);
    requestAnimationFrame(loop);
  }

  render(0);
  requestAnimationFrame(loop);

  /* ---- reveal delle sezioni ---- */
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = (i * 90) + "ms";
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }
})();
