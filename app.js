/* ============================================================
   Systems Universe — nested galaxy map
============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const fail = () => window.dispatchEvent(new Event("universe:fail"));
function webglOK() {
    try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
    catch { return false; }
}
if (!webglOK()) fail();
else { try { boot(); } catch (e) { console.error("Universe boot failed:", e); fail(); } }

function boot() {
    const canvas = document.getElementById("scene");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = () => window.innerWidth, H = () => window.innerHeight;
    const lowPower = Math.min(W(), H()) < 700 || navigator.hardwareConcurrency <= 4;
    const COL = { teal: 0x5eead4, cyan: 0x38bdf8, violet: 0xa78bfa, white: 0xdffdf6 };

    /* ---------- renderer ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    renderer.setSize(W(), H());
    renderer.setClearColor(0x04050a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04050a, 0.006);

    const camera = new THREE.PerspectiveCamera(58, W() / H(), 0.1, 500);
    camera.position.set(0, 6, 46);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.enablePan = false; controls.minDistance = 3; controls.maxDistance = 260;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.28;
    controls.rotateSpeed = 0.62; controls.zoomSpeed = 1.5;

    /* ---------- bloom (restrained) ---------- */
    let composer = null, bloom = null;
    try {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.55, 0.7, 0.24);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
        composer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    } catch (e) { console.warn("Bloom unavailable:", e); composer = null; }

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0x6f83aa, 0.5));
    const key = new THREE.PointLight(0x5eead4, 1.8, 220); key.position.set(20, 30, 30); scene.add(key);
    const rim = new THREE.PointLight(0xa78bfa, 1.2, 220); rim.position.set(-32, -12, -22); scene.add(rim);

    /* ---------- textures ---------- */
    const softTex = (() => {
        const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.28, "rgba(255,255,255,0.45)"); grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    })();
    function halo(color, size, opacity) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity }));
        s.scale.set(size, size, 1); return s;
    }

    /* ---------- starfield (galaxy dust) ---------- */
    function starLayer(count, radMin, radMax, size, color, opacity) {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = radMin + Math.random() * (radMax - radMin), t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.7; pos[i * 3 + 2] = r * Math.cos(p);
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: softTex, transparent: true, opacity, depthWrite: false })));
    }
    starLayer(lowPower ? 900 : 2200, 60, 260, 0.45, 0x8fa6c2, 0.7);
    starLayer(lowPower ? 300 : 700, 40, 180, 0.9, 0x5eead4, 0.35);
    starLayer(lowPower ? 200 : 500, 40, 180, 0.8, 0xa78bfa, 0.28);

    /* faint nebula clouds */
    [[COL.teal, 95, -46, 12, -70], [COL.violet, 95, 54, -30, -80], [COL.cyan, 70, 4, 40, -60]].forEach(([c, s, x, y, z]) => {
        const n = halo(c, s, 0.035); n.position.set(x, y, z); scene.add(n);
    });

    /* ---------- graph data ---------- */
    const HUBS = [
        { id: "about",   label: "About",   drill: false, pos: [-17, 7, 3],   sats: ["Amman", "B.Sc.", "Award"] },
        { id: "journey", label: "Journey", drill: true,  pos: [15, 10, -7],  sats: ["Engineering Manager", "Engineering Lead", "Senior SWE", "Software Engineer", "AI Eng Lead", "Data Scientist"] },
        { id: "skills",  label: "Skills",  drill: true,  pos: [19, -6, 8],    sats: ["Engineering", "Enterprise", "Data & AI", "Cloud", "Leadership", "Delivery"] },
        { id: "work",    label: "Work",    drill: true,  pos: [-13, -10, -9], sats: ["Enterprise CRM", "Integrated ERP", "Central Mgmt", "Mobile App", "AI Models", "Cloud → GCP"] },
        { id: "contact", label: "Contact", drill: false, pos: [-2, 15, 12],   sats: ["Email", "GitHub", "Remote"] },
    ];

    const pickable = [], hubObjs = [], labels = [], satMeshes = [], edgeList = [];
    const coreEdges = [], satEdges = [];
    const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

    function labelEl(text, kind, cls) {
        const el = document.createElement("div");
        el.className = "node-label" + (cls ? " " + cls : "");
        el.textContent = text; document.body.appendChild(el); return el;
    }

    /* ---------- core ---------- */
    const core = new THREE.Group();
    core.add(new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), new THREE.MeshBasicMaterial({ color: COL.white })));
    const coreBall = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 1),
        new THREE.MeshStandardMaterial({ color: 0x07201d, emissive: COL.teal, emissiveIntensity: 1.9, metalness: 0.5, roughness: 0.3, flatShading: true }));
    coreBall.userData = { id: "core", type: "core" }; core.add(coreBall);
    const coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(3.1, 1), new THREE.MeshBasicMaterial({ color: COL.teal, wireframe: true, transparent: true, opacity: 0.16 }));
    core.add(coreWire);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.03, 12, 100), new THREE.MeshBasicMaterial({ color: COL.cyan, transparent: true, opacity: 0.8 }));
    ring1.rotation.x = Math.PI / 2.4; core.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.0, 0.02, 12, 100), new THREE.MeshBasicMaterial({ color: COL.violet, transparent: true, opacity: 0.7 }));
    ring2.rotation.x = Math.PI / 3; ring2.rotation.y = Math.PI / 5; core.add(ring2);
    core.add(halo(COL.teal, 9, 0.3));
    scene.add(core); pickable.push(coreBall);
    const coreLbl = labelEl("Seraj Albustanji", "core", "hub core");
    coreLbl.addEventListener("click", () => goOverview());
    labels.push({ el: coreLbl, obj: coreBall, kind: "core" });

    /* ---------- hubs + satellites ---------- */
    HUBS.forEach((h) => {
        const hubPos = V(h.pos);
        const g = new THREE.Group(); g.position.copy(hubPos);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x07161f, emissive: COL.teal, emissiveIntensity: 1.35, metalness: 0.4, roughness: 0.4 }));
        mesh.userData = { id: h.id, type: "hub", drill: h.drill, baseEmissive: 1.35 };
        g.add(mesh); g.add(halo(COL.teal, 4, 0.26)); scene.add(g);
        pickable.push(mesh);
        hubObjs.push({ id: h.id, mesh, group: g, basePos: hubPos.clone(), drill: h.drill });
        const hubLbl = labelEl(h.label, "hub", "hub");
        hubLbl.addEventListener("click", () => onHub(h.id));
        labels.push({ el: hubLbl, obj: mesh, kind: "hub", hub: h.id });

        coreEdges.push(0, 0, 0, hubPos.x, hubPos.y, hubPos.z);
        edgeList.push({ a: new THREE.Vector3(0, 0, 0), b: hubPos.clone() });

        h.sats.forEach((name, si) => {
            const ang = (si / h.sats.length) * Math.PI * 2, rad = 4.2 + (si % 2) * 1.3;
            const off = new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad * 0.7, Math.sin(ang * 1.7) * 2.3);
            const sp = hubPos.clone().add(off);
            const col = si % 2 ? COL.violet : COL.cyan;
            const sm = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20),
                new THREE.MeshStandardMaterial({ color: 0x07161f, emissive: col, emissiveIntensity: 1.2, roughness: 0.45 }));
            sm.position.copy(sp);
            sm.userData = { id: h.id, type: "sat", name, hub: h.id, index: si, drill: h.drill, phase: Math.random() * Math.PI * 2, base: sp.clone(), baseEmissive: 1.2 };
            scene.add(sm);
            const sg = halo(col, 1.6, 0.3); sg.position.copy(sp); scene.add(sg);
            pickable.push(sm); satMeshes.push({ mesh: sm, glow: sg });
            satEdges.push(hubPos.x, hubPos.y, hubPos.z, sp.x, sp.y, sp.z);
            edgeList.push({ a: hubPos.clone(), b: sp.clone() });
            if (h.drill) {
                const sl = labelEl(name, "sat", "sat");
                sl.addEventListener("click", () => onSat(h.id, si));
                labels.push({ el: sl, obj: sm, kind: "sat", hub: h.id });
            }
        });
        if (h.drill) {
            const overText = h.id === "journey" ? "Full career path" : h.id === "skills" ? "All skills" : "All projects";
            const ol = labelEl(overText, "over", "over");
            ol.addEventListener("click", () => openCard({ hub: h.id, overview: true }));
            labels.push({ el: ol, obj: mesh, kind: "over", hub: h.id });
        }
    });

    function lineSeg(arr, color, opacity) {
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arr), 3));
        return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    }
    scene.add(lineSeg(coreEdges, COL.teal, 0.22));
    scene.add(lineSeg(satEdges, COL.cyan, 0.1));

    /* ---------- pulses ---------- */
    const PULSES = lowPower ? 40 : 90;
    const pulsePos = new Float32Array(PULSES * 3), pulseState = [];
    for (let i = 0; i < PULSES; i++) pulseState.push({ edge: edgeList[Math.floor(Math.random() * edgeList.length)], t: Math.random(), speed: 0.1 + Math.random() * 0.2 });
    const pulseGeo = new THREE.BufferGeometry(); pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    scene.add(new THREE.Points(pulseGeo, new THREE.PointsMaterial({ color: 0x7ff0da, size: 0.42, map: softTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));

    const hoverLabel = labelEl("", "", ""); hoverLabel.style.opacity = "0";

    /* ---------- state ---------- */
    let level = "overview", activeHub = null, panelOpen = false;

    /* ---------- interaction ---------- */
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let hovered = null, downXY = null;
    const setPointer = (e) => { pointer.x = (e.clientX / W()) * 2 - 1; pointer.y = -(e.clientY / H()) * 2 + 1; };
    canvas.addEventListener("pointerdown", (e) => { downXY = [e.clientX, e.clientY]; });
    canvas.addEventListener("pointermove", (e) => { setPointer(e); if (!panelOpen) hover(); });
    canvas.addEventListener("pointerup", (e) => {
        if (!downXY) return;
        const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]); downXY = null;
        if (moved > 6 || panelOpen) return;
        setPointer(e); ray.setFromCamera(pointer, camera);
        const hit = ray.intersectObjects(pickable, false)[0]; if (!hit) return;
        const d = hit.object.userData;
        if (d.type === "core") goOverview();
        else if (d.type === "hub") { if (level === "cluster" && d.id === activeHub) openCard({ hub: d.id, overview: true }); else onHub(d.id); }
        else if (d.type === "sat" && d.drill && d.hub === activeHub) onSat(d.hub, d.index);
        else if (d.type === "sat" && level === "overview") onHub(d.hub);
    });

    function hover() {
        ray.setFromCamera(pointer, camera);
        // only satellites of active cluster are interactive as sats
        const hit = ray.intersectObjects(pickable, false)[0];
        let obj = hit ? hit.object : null;
        if (obj && obj.userData.type === "sat" && !(level === "cluster" && obj.userData.hub === activeHub)) {
            // in overview, hovering a sat highlights its hub instead
        }
        canvas.style.cursor = obj ? "pointer" : "grab";
        if (obj === hovered) return;
        if (hovered && hovered.material && hovered.userData.baseEmissive) hovered.material.emissiveIntensity = hovered.userData.baseEmissive;
        hovered = obj;
        const showHover = obj && obj.userData.type === "sat" && !(level === "cluster" && obj.userData.hub === activeHub);
        if (showHover) { hoverLabel.textContent = obj.userData.name; hoverLabel.style.opacity = "1"; }
        else hoverLabel.style.opacity = "0";
    }

    /* ---------- camera fly ---------- */
    const tween = { active: false, camTo: new THREE.Vector3(), tgtTo: new THREE.Vector3(), t: 0 };
    function flyTo(target, dist) {
        const dir = target.clone().normalize(); if (dir.lengthSq() < 0.001) dir.set(0, 0.3, 1).normalize();
        tween.tgtTo.copy(target); tween.camTo.copy(target).add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, 1.5, 0));
        tween.t = 0; tween.active = true; controls.autoRotate = false;
    }

    /* ---------- navigation ---------- */
    function onHub(id) {
        const h = hubObjs.find((x) => x.id === id);
        if (!h) return;
        if (h.drill) enterCluster(id);
        else { flyTo(h.basePos.clone(), 9); openCard({ hub: id, overview: true }); }
    }
    function onSat(hubId, index) { openCard({ hub: hubId, index }); }

    function enterCluster(id) {
        const h = hubObjs.find((x) => x.id === id); if (!h) return;
        level = "cluster"; activeHub = id;
        window.SITE && window.SITE.closePanel();
        flyTo(h.basePos.clone(), 13);
        window.SITE && window.SITE.setActive(id);
        window.SITE && window.SITE.showCluster(HUBS.find((x) => x.id === id).label);
    }
    function goOverview() {
        level = "overview"; activeHub = null;
        window.SITE && window.SITE.closePanel();
        window.SITE && window.SITE.hideCluster();
        window.SITE && window.SITE.setActive(null);
        tween.tgtTo.set(0, 0, 0); tween.camTo.set(0, 6, 46); tween.t = 0; tween.active = true;
        setTimeout(() => { if (!panelOpen && !reduce) controls.autoRotate = true; }, 1400);
    }

    // used by HUD nav to jump straight to any hub
    function goOverviewSilently() { level = "overview"; activeHub = null; window.SITE && window.SITE.hideCluster(); }

    window.addEventListener("universe:panel-open", () => { panelOpen = true; hoverLabel.style.opacity = "0"; });
    window.addEventListener("universe:panel-close", () => { panelOpen = false; });

    /* ---------- labels ---------- */
    const tmp = new THREE.Vector3();
    function labelVisible(L) {
        if (L.kind === "sat" || L.kind === "over") return level === "cluster" && L.hub === activeHub;
        return level === "overview"; // hub + core labels
    }
    function updateLabels() {
        for (const L of labels) {
            const want = labelVisible(L);
            if (!want) { if (L.el.style.opacity !== "0") { L.el.style.opacity = "0"; L.el.style.pointerEvents = "none"; } continue; }
            L.obj.getWorldPosition(tmp); tmp.project(camera);
            const behind = tmp.z > 1;
            const x = (tmp.x * 0.5 + 0.5) * W(), y = (-tmp.y * 0.5 + 0.5) * H();
            const off = L.kind === "core" ? 38 : L.kind === "over" ? 46 : 26;
            L.el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y - off}px)`;
            const dim = panelOpen ? "0.2" : "1";
            L.el.style.opacity = behind ? "0" : dim;
            L.el.style.pointerEvents = behind || panelOpen ? "none" : "auto";
        }
        if (hoverLabel.style.opacity !== "0" && hovered) {
            hovered.getWorldPosition(tmp); tmp.project(camera);
            const x = (tmp.x * 0.5 + 0.5) * W(), y = (-tmp.y * 0.5 + 0.5) * H();
            hoverLabel.style.transform = `translate(-50%,-50%) translate(${x}px, ${y - 22}px)`;
        }
    }

    /* ---------- card content requests ---------- */
    function openCard(spec) { window.SITE && window.SITE.openCard(spec); }

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime(), d = 0.016;
        coreWire.rotation.y = t * 0.12; coreWire.rotation.x = t * 0.06; coreBall.rotation.y = -t * 0.1;
        ring1.rotation.z = t * 0.4; ring2.rotation.z = -t * 0.3;
        for (const s of satMeshes) { const u = s.mesh.userData; s.mesh.position.y = u.base.y + Math.sin(t * 0.8 + u.phase) * 0.22; s.glow.position.copy(s.mesh.position); }
        if (hovered) { hovered.scale.setScalar(1.16 + Math.sin(t * 6) * 0.05); if (hovered.userData.baseEmissive) hovered.material.emissiveIntensity = hovered.userData.baseEmissive * 1.8; }
        pickable.forEach((m) => { if (m !== hovered) m.scale.setScalar(1); });
        for (let i = 0; i < PULSES; i++) {
            const p = pulseState[i]; p.t += p.speed * d;
            if (p.t > 1) { p.t = 0; p.edge = edgeList[Math.floor(Math.random() * edgeList.length)]; }
            const e = p.edge, k = p.t;
            pulsePos[i * 3] = e.a.x + (e.b.x - e.a.x) * k; pulsePos[i * 3 + 1] = e.a.y + (e.b.y - e.a.y) * k; pulsePos[i * 3 + 2] = e.a.z + (e.b.z - e.a.z) * k;
        }
        pulseGeo.attributes.position.needsUpdate = true;
        if (tween.active) {
            tween.t = Math.min(tween.t + 0.02, 1); const e = 1 - Math.pow(1 - tween.t, 3);
            camera.position.lerp(tween.camTo, 0.06 + e * 0.02); controls.target.lerp(tween.tgtTo, 0.09);
            if (tween.t >= 1 && camera.position.distanceTo(tween.camTo) < 0.6) tween.active = false;
        }
        controls.update(); updateLabels();
        composer ? composer.render() : renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
        camera.aspect = W() / H(); camera.updateProjectionMatrix();
        renderer.setSize(W(), H()); if (composer) composer.setSize(W(), H());
    });

    function start() { if (reduce) return; camera.position.set(0, 3, 82); tween.tgtTo.set(0, 0, 0); tween.camTo.set(0, 6, 44); tween.t = 0; tween.active = true; }

    window.__universe = {
        focusNode: (id) => { goOverviewSilently(); onHub(id); },
        goOverview, start,
        setBloom: (s, r, th) => { if (bloom) { if (s != null) bloom.strength = s; if (r != null) bloom.radius = r; if (th != null) bloom.threshold = th; } },
        setExposure: (v) => { renderer.toneMappingExposure = v; },
        setZoom: (v) => { controls.zoomSpeed = v; },
        setRange: (min, max) => { if (min != null) controls.minDistance = min; if (max != null) controls.maxDistance = max; },
        setFog: (d) => { scene.fog.density = d; },
    };

    let p = 0; const bar = document.getElementById("introBar");
    const step = setInterval(() => { p = Math.min(p + Math.random() * 24 + 12, 100); if (bar) bar.style.width = p + "%"; if (p >= 100) { clearInterval(step); window.dispatchEvent(new Event("universe:ready")); } }, 120);
}
