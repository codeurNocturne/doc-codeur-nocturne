// Codeur Nocturne · guide landing page.
// No dependencies, no network calls, no HTML strings: the page runs under a
// strict CSP with Trusted Types, so the DOM is only built with createElement.
"use strict";

(() => {
  // GitHub Pages cannot send frame-ancestors, so refuse to run inside a frame.
  if (window.top !== window.self) {
    try {
      window.top.location.replace(window.self.location.href);
    } catch {
      document.documentElement.hidden = true;
    }
    return;
  }

  const root = document.documentElement;
  root.classList.add("js");

  const PAGES = 45;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ua = navigator.userAgent;
  const inApp = /TikTok|musical_ly|Bytedance/i.test(ua) ? "TikTok"
    : /Instagram/i.test(ua) ? "Instagram"
    : /FBAN|FBAV|FB_IAB/i.test(ua) ? "Facebook"
    : "";

  /* ---------- Reader ---------- */

  const reader = document.getElementById("reader");
  const shell = reader.querySelector(".reader-shell");
  const scroller = document.getElementById("reader-scroll");
  const pages = document.getElementById("reader-pages");
  const counter = document.getElementById("reader-now");
  const zoomBtn = reader.querySelector("[data-zoom]");
  let built = false;
  let opener = null;
  let closing = false;

  function build() {
    const loader = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        img.src = img.dataset.src;
        loader.unobserve(img);
      }
    }, { root: scroller, rootMargin: "120% 0px" });

    // The page crossing the middle of the reader is the current one.
    const tracker = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) counter.textContent = entry.target.dataset.page;
      }
    }, { root: scroller, rootMargin: "-45% 0px -55% 0px" });

    for (let n = 1; n <= PAGES; n++) {
      const item = document.createElement("li");
      item.id = `page-${n}`;
      item.dataset.page = String(n);
      const img = document.createElement("img");
      img.width = 1200;
      img.height = 1698;
      img.alt = `Page ${n} sur ${PAGES}`;
      img.decoding = "async";
      img.dataset.src = `assets/pages/p${String(n).padStart(2, "0")}.webp`;
      item.append(img);
      pages.append(item);
      loader.observe(img);
      tracker.observe(item);
    }
    built = true;
  }

  function goTo(n) {
    const item = document.getElementById(`page-${n}`);
    if (!item) return;
    scroller.scrollTop = item.offsetTop - parseFloat(getComputedStyle(scroller).paddingTop);
    scroller.scrollLeft = 0;
    counter.textContent = String(n);
  }

  // The reader grows out of whatever opened it (the guide in the hand, a chapter...).
  function growFrom(trigger) {
    if (reduceMotion.matches || !trigger || !shell.animate) return;
    const from = trigger.getBoundingClientRect();
    const to = shell.getBoundingClientRect();
    if (!from.width || !to.width) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = Math.max(from.width / to.width, 0.08);
    shell.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }

  function openReader(page, trigger) {
    if (!built) build();
    if (!reader.open) {
      opener = trigger || document.activeElement;
      reader.showModal();
      // An entry in the history lets the phone's back button close the reader.
      history.pushState({ reader: true }, "", "#lire");
      growFrom(trigger);
    }
    goTo(Math.min(Math.max(page, 1), PAGES));
    scroller.focus({ preventScroll: true });
  }

  function closeReader() {
    if (!reader.open || closing) return;
    if (reduceMotion.matches || !shell.animate) {
      reader.close();
      return;
    }
    closing = true;
    const out = shell.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(14px) scale(0.98)" }],
      { duration: 170, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    );
    out.finished.then(() => {
      closing = false;
      reader.close();
      out.cancel();
    });
  }

  reader.addEventListener("close", () => {
    if (history.state && history.state.reader) history.back();
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  reader.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeReader();
  });
  reader.addEventListener("click", (event) => {
    if (event.target === reader) closeReader();
  });
  reader.querySelector("[data-close]").addEventListener("click", closeReader);
  window.addEventListener("popstate", () => {
    if (reader.open) closeReader();
  });

  zoomBtn.addEventListener("click", () => {
    const zoomed = zoomBtn.getAttribute("aria-pressed") !== "true";
    const ratio = scroller.scrollTop / Math.max(scroller.scrollHeight, 1);
    reader.classList.toggle("is-zoomed", zoomed);
    zoomBtn.setAttribute("aria-pressed", String(zoomed));
    zoomBtn.setAttribute("aria-label", zoomed ? "Revenir à la taille normale" : "Agrandir les pages");
    scroller.scrollTop = ratio * scroller.scrollHeight;
    scroller.scrollLeft = 0;
  });

  // Any [data-read] link opens the reader; without JavaScript it opens the PDF.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-read]");
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openReader(Number(link.dataset.read) || 1, link);
  });

  // Shareable links: #lire or #page-30 open the reader on load.
  const match = /^#(?:lire|page-(\d{1,2}))$/.exec(location.hash);
  if (match) {
    history.replaceState(null, "", location.pathname + location.search);
    openReader(Number(match[1]) || 1, null);
  }

  /* ---------- Feedback on buttons ---------- */

  const timers = new WeakMap();
  function flash(button) {
    button.classList.add("is-done");
    clearTimeout(timers.get(button));
    timers.set(button, setTimeout(() => button.classList.remove("is-done"), 3000));
  }

  const inAppTip = inApp
    ? `Dans l’application ${inApp}, le téléchargement peut bloquer. Lis le guide ici, ou ouvre la page dans ton navigateur : menu (les trois points), puis « Ouvrir dans le navigateur ».`
    : "";

  for (const link of document.querySelectorAll("[data-download]")) {
    link.addEventListener("click", () => {
      flash(link);
      const note = link.closest("[data-actions]")?.querySelector("[data-note]");
      if (note && inAppTip) note.textContent = inAppTip;
    });
  }

  const inAppNote = document.querySelector("[data-inapp-note]");
  if (inAppNote && inAppTip) inAppNote.textContent = inAppTip;

  /* ---------- Copy link ---------- */

  function copyFallback(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.className = "sprite";
    document.body.append(field);
    field.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    field.remove();
    return ok;
  }

  const copyBtn = document.querySelector("[data-copy]");
  if (copyBtn) {
    copyBtn.hidden = false;
    copyBtn.addEventListener("click", async () => {
      const url = location.origin + location.pathname;
      let ok = false;
      try {
        await navigator.clipboard.writeText(url);
        ok = true;
      } catch {
        ok = copyFallback(url);
      }
      const note = copyBtn.closest("[data-actions]").querySelector("[data-note]");
      if (ok) {
        flash(copyBtn);
        note.textContent = inAppTip ? "Lien copié. Colle-le dans ton navigateur." : "Lien copié.";
      } else {
        note.textContent = `Copie impossible ici. Le lien : ${url}`;
      }
    });
  }

  /* ---------- The 3 errors ---------- */

  const errors = [...document.querySelectorAll("[data-err]")];
  const score = document.querySelector("[data-score]");
  const scoreWrap = document.querySelector("[data-score-wrap]");
  const done = document.querySelector("[data-done]");

  for (const button of errors) {
    button.addEventListener("click", () => {
      const fixed = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(fixed));
      const count = errors.filter((b) => b.getAttribute("aria-pressed") === "true").length;
      score.textContent = String(count);
      scoreWrap.classList.toggle("is-progress", count > 0);
      done.hidden = count !== errors.length;
    });
  }

  /* ---------- The guide in the hand follows the pointer (desktop only) ---------- */

  const hero = document.querySelector(".hero");
  const tilt = document.querySelector(".doc-tilt");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (hero && tilt && finePointer.matches && !reduceMotion.matches) {
    let x = 0;
    let y = 0;
    let frame = 0;
    const apply = () => {
      frame = 0;
      tilt.style.setProperty("--tx", (x * 16).toFixed(2));
      tilt.style.setProperty("--ty", (y * -12).toFixed(2));
    };
    hero.addEventListener("pointermove", (event) => {
      const box = hero.getBoundingClientRect();
      x = (event.clientX - box.left) / box.width - 0.5;
      y = (event.clientY - box.top) / box.height - 0.5;
      if (!frame) frame = requestAnimationFrame(apply);
    });
    hero.addEventListener("pointerleave", () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    });
  }

  /* ---------- The pages fan out when the last section comes into view ---------- */

  const stack = document.querySelector(".stack");
  if (stack && "IntersectionObserver" in window) {
    const fan = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      stack.classList.add("is-in");
      fan.disconnect();
    }, { threshold: 0.6 });
    fan.observe(stack);
  }
})();
