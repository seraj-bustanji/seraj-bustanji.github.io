/* ============================================================
   Universal UI — modes, cards, cluster HUD, fallback, EmailJS
   (classic script; runs before the app.js module executes)
============================================================ */
(function () {
    "use strict";
    const $ = (s, r = document) => r.querySelector(s);
    const body = document.body;
    body.classList.add("mode-intro");

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- section headers (readable + reused by cards) ---------- */
    function makeHeader(title, sub) {
        const wrap = document.createElement("div");
        wrap.className = "sec-head";
        const eb = document.createElement("span"); eb.className = "eyebrow"; eb.textContent = sub || "";
        const h = document.createElement("h2"); h.textContent = title || "";
        wrap.append(eb, h); return wrap;
    }
    document.querySelectorAll(".r-section").forEach((sec) => {
        const inner = sec.querySelector(".sec-inner");
        if (inner) sec.insertBefore(makeHeader(sec.dataset.title, sec.dataset.sub), inner);
    });

    /* ---------- modes ---------- */
    function setMode(mode) {
        body.classList.remove("mode-intro", "mode-universe", "mode-readable");
        body.classList.add("mode-" + mode);
        ["hud", "hudHint"].forEach((id) => { const el = document.getElementById(id); if (el) el.removeAttribute("hidden"); });
        if (mode === "readable") window.scrollTo({ top: 0, behavior: "auto" });
    }
    function enterUniverse() {
        if (!window.__universe) return notify("Interactive mode isn't ready yet.", "info");
        setMode("universe"); window.__universe.start();
    }
    function enterReadable(hash) {
        closePanel(true); setMode("readable");
        if (hash) requestAnimationFrame(() => { const t = $(hash); if (t) t.scrollIntoView({ behavior: "auto", block: "start" }); });
    }

    /* ---------- intro handshake ---------- */
    const introLoad = document.getElementById("introLoad"), introActions = document.getElementById("introActions");
    const enterBtn = document.getElementById("enterBtn"), readBtn = document.getElementById("readBtn");
    let settled = false;
    function ready() { if (settled) return; settled = true; if (introLoad) introLoad.hidden = true; if (introActions) introActions.hidden = false; }
    function failed() {
        if (settled) return; settled = true;
        if (introLoad) introLoad.hidden = true; if (introActions) introActions.hidden = false;
        if (enterBtn) enterBtn.hidden = true;
        if (readBtn) readBtn.querySelector("span").textContent = "Continue as a page";
        const hint = document.querySelector(".intro-hint");
        if (hint) hint.textContent = "Interactive 3D isn't available here — the page has everything.";
    }
    window.addEventListener("universe:ready", ready);
    window.addEventListener("universe:fail", failed);
    setTimeout(() => { if (!settled) failed(); }, 12000);

    enterBtn && enterBtn.addEventListener("click", enterUniverse);
    readBtn && readBtn.addEventListener("click", () => enterReadable("#r-home"));
    const toReadable = document.getElementById("toReadable");
    toReadable && toReadable.addEventListener("click", () => enterReadable());
    const toUniverse = document.getElementById("toUniverse");
    toUniverse && toUniverse.addEventListener("click", () => window.__universe ? enterUniverse() : notify("Interactive mode isn't available here.", "info"));
    const brandHome = document.getElementById("brandHome");
    brandHome && brandHome.addEventListener("click", (e) => { e.preventDefault(); window.__universe && window.__universe.goOverview(); });

    /* ---------- cluster HUD ---------- */
    const clusterHud = document.getElementById("clusterHud");
    const clusterTitle = document.getElementById("clusterTitle");
    const backBtn = document.getElementById("backBtn");
    let inCluster = false;
    backBtn && backBtn.addEventListener("click", () => window.__universe && window.__universe.goOverview());
    function showCluster(title) { inCluster = true; if (clusterTitle) clusterTitle.textContent = title; if (clusterHud) clusterHud.hidden = false; }
    function hideCluster() { inCluster = false; if (clusterHud) clusterHud.hidden = true; }

    /* ---------- centered card ---------- */
    const panel = document.getElementById("panel"), scrim = document.getElementById("panelScrim");
    const panelBody = document.getElementById("panelBody"), panelClose = document.getElementById("panelClose");

    const SUB = { about: "Who I am", journey: "The role", skills: "The stack", work: "The build", contact: "Let's build" };

    function cloneInner(hub) { const s = document.getElementById("r-" + hub); return s ? s.querySelector(".sec-inner").cloneNode(true) : null; }

    function openCard(spec) {
        if (!panel) return;
        const sec = document.getElementById("r-" + spec.hub);
        let content, title, sub = SUB[spec.hub] || "";

        if (spec.overview || spec.index == null) {
            content = cloneInner(spec.hub);
            title = sec ? sec.dataset.title : "";
        } else {
            const sel = spec.hub === "journey" ? ".tl" : spec.hub === "work" ? ".work-card" : ".skill-card";
            const items = sec ? sec.querySelectorAll(".sec-inner " + sel) : [];
            const item = items[spec.index];
            content = document.createElement("div");
            if (item) content.appendChild(item.cloneNode(true));
            const h3 = item ? item.querySelector("h3") : null;
            title = h3 ? h3.textContent : (sec ? sec.dataset.title : "");
            sub = spec.hub === "journey" ? "Career step" : spec.hub === "work" ? "Selected work" : "Capability";
        }
        if (!content) return;
        content.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));

        panelBody.innerHTML = "";
        panelBody.append(makeHeader(title, sub), content);
        panelBody.querySelectorAll(".meter").forEach((m, i) => setTimeout(() => m.classList.add("in"), 120 + i * 70));

        panel.hidden = false; scrim.hidden = false;
        requestAnimationFrame(() => { panel.classList.add("open"); scrim.classList.add("open"); });
        panel.scrollTop = 0;
        window.dispatchEvent(new Event("universe:panel-open"));
    }
    function closePanel(silent) {
        if (panel && !panel.hidden) {
            panel.classList.remove("open"); scrim.classList.remove("open");
            setTimeout(() => { panel.hidden = true; scrim.hidden = true; }, 480);
            window.dispatchEvent(new Event("universe:panel-close"));
        }
        if (!silent && !inCluster && window.__universe) window.__universe.goOverview();
    }
    function setActive(id) { document.querySelectorAll(".hud-link").forEach((l) => l.classList.toggle("active", l.dataset.node === id)); }

    panelClose && panelClose.addEventListener("click", () => closePanel(false));
    scrim && scrim.addEventListener("click", () => closePanel(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (panel && !panel.hidden) closePanel(false); else if (inCluster) window.__universe && window.__universe.goOverview(); } });

    document.querySelectorAll(".hud-link").forEach((b) => {
        b.addEventListener("click", () => { window.__universe ? window.__universe.focusNode(b.dataset.node) : openCard({ hub: b.dataset.node, overview: true }); });
    });

    window.SITE = { openCard, closePanel: () => closePanel(true), setActive, showCluster, hideCluster };

    /* ---------- readable: meters + anchors ---------- */
    const meterObs = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); meterObs.unobserve(en.target); } }), { threshold: 0.4 });
    document.querySelectorAll(".readable .meter").forEach((m) => meterObs.observe(m));
    document.querySelectorAll('.readable a[href^="#r-"]').forEach((a) => {
        a.addEventListener("click", (e) => { const t = $(a.getAttribute("href")); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    });

    /* ============================================================
       EmailJS — delegated so any (cloned) .contact-form works
    ============================================================ */
    const PUBLIC_KEY = "tkj6MNMDakdT_BDLv", SERVICE_ID = "service_7vpeux7", TEMPLATE_ID = "template_x279ifr";
    if (typeof emailjs !== "undefined") emailjs.init({ publicKey: PUBLIC_KEY });

    document.addEventListener("submit", async (e) => {
        const form = e.target;
        if (!form.classList || !form.classList.contains("contact-form")) return;
        e.preventDefault();
        if (typeof emailjs === "undefined") return notify("Email service unavailable. Disable any ad-blocker and reload.", "error");
        const val = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
        const name = val("name"), email = val("email"), subject = val("subject"), message = val("message");
        if (!name || !email || !message) return notify("Please fill in all required fields.", "error");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return notify("Please enter a valid email address.", "error");

        const btn = form.querySelector('button[type="submit"]'), original = btn.innerHTML;
        btn.innerHTML = "<span>Sending…</span>"; btn.disabled = true;
        try {
            const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID,
                { from_name: name, from_email: email, reply_to: email, subject: subject || "Portfolio Contact", message, to_name: "Seraj" },
                { publicKey: PUBLIC_KEY });
            if (res && res.status === 200) { notify("Message sent. I'll get back to you soon.", "success"); form.reset(); }
            else notify("Failed to send. Please try again.", "error");
        } catch (err) {
            const detail = (err && (err.text || err.message)) || "";
            notify(/allowed origin|cors|api/i.test(detail)
                ? "Email service blocked this domain. Add it under EmailJS → Security → Allowed Origins."
                : `Failed to send. ${detail || "Please try again later."}`, "error");
        } finally { btn.innerHTML = original; btn.disabled = false; }
    });

    /* ---------- notifications ---------- */
    function notify(message, type = "info") {
        document.querySelectorAll(".notification").forEach((n) => n.remove());
        const note = document.createElement("div"); note.className = "notification " + type;
        const icon = type === "success" ? "fa-check" : type === "error" ? "fa-xmark" : "fa-circle-info";
        note.innerHTML = `<span class="notification-icon"><i class="fas ${icon}"></i></span><span>${message}</span>`;
        document.body.appendChild(note);
        requestAnimationFrame(() => note.classList.add("show"));
        setTimeout(() => { note.classList.remove("show"); setTimeout(() => note.remove(), 400); }, 4500);
    }
    window.__notify = notify;

    console.log("%cSeraj Albustanji", "font-family:sans-serif;font-size:30px;background:linear-gradient(90deg,#5eead4,#38bdf8);-webkit-background-clip:text;color:transparent;font-weight:700;");
    console.log("%cEngineering Manager · Data Scientist — welcome to the universe.", "color:#6b7688;font-size:13px;");
})();
