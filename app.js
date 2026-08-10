/* ============================================================
   Systems Universe — colorful nested galaxy map
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

    /* ---------- per-cluster palettes ---------- */
    const PAL = {
        about:   { hub: 0xffb454, sat: 0xffd27a },  // amber / gold
        journey: { hub: 0x5eead4, sat: 0x38bdf8 },  // teal / cyan
        skills:  { hub: 0xa78bfa, sat: 0xc4b5fd },  // violet
        work:    { hub: 0x60a5fa, sat: 0x818cf8 },  // blue / indigo
        contact: { hub: 0xf472b6, sat: 0xfb7185 },  // magenta / rose
    };
    const CORE_COL = 0x8ef7e4;
    const css = (hex) => "#" + (hex & 0xffffff).toString(16).padStart(6, "0");
    const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

    /* ---------- renderer ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    renderer.setSize(W(), H());
    renderer.setClearColor(0x03040a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03040a, 0.006);

    const camera = new THREE.PerspectiveCamera(58, W() / H(), 0.1, 600);
    camera.position.set(0, 6, 46);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.enablePan = false; controls.minDistance = 3; controls.maxDistance = 260;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.26;
    controls.rotateSpeed = 0.62; controls.zoomSpeed = 1.5;

    /* ---------- bloom ---------- */
    let composer = null, bloom = null;
    try {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.62, 0.72, 0.2);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
        composer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    } catch (e) { console.warn("Bloom unavailable:", e); composer = null; }

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0x2a3a52, 0.7));
    const key = new THREE.PointLight(0xfff1dd, 2.4, 320); key.position.set(34, 22, 24); scene.add(key);
    const fill = new THREE.PointLight(0x4a6a9a, 0.8, 320); fill.position.set(-36, -16, -26); scene.add(fill);

    /* ---------- textures ---------- */
    function radialTex() {
        const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.28, "rgba(255,255,255,0.45)"); grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    }
    function flareTex() {
        const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
        g.translate(64, 64);
        let grd = g.createRadialGradient(0, 0, 0, 0, 0, 34);
        grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.4, "rgba(255,255,255,0.35)"); grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd; g.beginPath(); g.arc(0, 0, 34, 0, Math.PI * 2); g.fill();
        for (let k = 0; k < 2; k++) {
            const lg = g.createLinearGradient(-62, 0, 62, 0);
            lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,0.9)"); lg.addColorStop(1, "rgba(255,255,255,0)");
            g.fillStyle = lg; g.rotate(Math.PI / 2 * k); g.fillRect(-62, -1.1, 124, 2.2);
        }
        return new THREE.CanvasTexture(c);
    }
    const softTex = radialTex(), starFlare = flareTex();
    function halo(color, size, opacity) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity }));
        s.scale.set(size, size, 1); return s;
    }

    /* ---------- procedural celestial bodies ---------- */
    function planetTex(hex, type) {
        const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const g = cv.getContext("2d");
        const base = new THREE.Color(hex);
        const dark = base.clone().multiplyScalar(0.42); g.fillStyle = "#" + dark.getHexString(); g.fillRect(0, 0, 512, 256);
        if (type === "gas") {
            for (let y = 0; y < 256; y += 2) {
                const n = Math.sin(y * 0.05) * 0.5 + Math.sin(y * 0.19 + 1.3) * 0.28 + (Math.random() - 0.5) * 0.12;
                const c = base.clone(); c.offsetHSL(0.01 * Math.sin(y * 0.03), 0, n * 0.2);
                g.fillStyle = "#" + c.getHexString(); g.globalAlpha = 0.75; g.fillRect(0, y, 512, 2);
            }
            g.globalAlpha = 1;
            for (let i = 0; i < 6; i++) { const c = base.clone(); c.offsetHSL(0, 0, 0.12); g.fillStyle = "#" + c.getHexString(); g.globalAlpha = 0.25; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 256, 30 + Math.random() * 40, 10 + Math.random() * 14, 0, 0, Math.PI * 2); g.fill(); }
            g.globalAlpha = 1;
        } else {
            for (let i = 0; i < 380; i++) {
                const c = base.clone(); c.offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.34);
                g.fillStyle = "#" + c.getHexString(); g.globalAlpha = 0.5;
                const r = 4 + Math.random() * 24; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 256, r, r * (0.6 + Math.random() * 0.6), Math.random() * 3, 0, Math.PI * 2); g.fill();
            }
            g.globalAlpha = 1;
        }
        for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"; g.fillRect(Math.random() * 512, Math.random() * 256, 1.6, 1.6); }
        const tex = new THREE.CanvasTexture(cv); tex.wrapS = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; return tex;
    }
    function atmosphere(radius, hex, power, strength) {
        const mat = new THREE.ShaderMaterial({
            uniforms: { c: { value: new THREE.Color(hex) }, p: { value: power }, s: { value: strength } },
            vertexShader: "varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix*mv; }",
            fragmentShader: "uniform vec3 c; uniform float p; uniform float s; varying vec3 vN; varying vec3 vP; void main(){ vec3 v = normalize(-vP); float f = pow(1.0 - max(dot(vN, v), 0.0), p) * s; gl_FragColor = vec4(c, f); }",
            transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
        });
        const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), mat); m.raycast = () => {}; return m;
    }
    function ringMesh(inner, outer, hex, tilt) {
        const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 72),
            new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.32, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.rotation.x = Math.PI / 2 + tilt; m.raycast = () => {}; return m;
    }

    /* ---------- starfield (realistic colors + twinkle) ---------- */
    const STAR_COLS = [0xffffff, 0xdae6ff, 0xbcd0ff, 0xfff3d0, 0xffe0a8, 0xffc79a, 0xff9d86];
    const starLayers = [];
    function starLayer(count, rMin, rMax, size, opacity) {
        const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = rMin + Math.random() * (rMax - rMin), t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.75; pos[i * 3 + 2] = r * Math.cos(p);
            const [cr, cg, cb] = rgb(STAR_COLS[Math.floor(Math.pow(Math.random(), 2.2) * STAR_COLS.length)]);
            col[i * 3] = cr; col[i * 3 + 1] = cg; col[i * 3 + 2] = cb;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: softTex, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
        scene.add(pts); starLayers.push({ pts, base: opacity, tw: Math.random() * Math.PI * 2 });
    }
    starLayer(lowPower ? 1000 : 2400, 70, 300, 0.5, 0.85);
    starLayer(lowPower ? 500 : 1100, 50, 240, 0.9, 0.6);
    starLayer(lowPower ? 220 : 460, 45, 200, 1.5, 0.4);

    /* bright hero stars with diffraction flares */
    const heroStars = [];
    const heroCols = [0xffffff, 0xbcd0ff, 0xfff3d0, 0x9fe8ff, 0xffd0e0];
    for (let i = 0; i < (lowPower ? 6 : 12); i++) {
        const col = heroCols[i % heroCols.length];
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starFlare, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
        const r = 60 + Math.random() * 150, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
        sp.position.set(r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t) * 0.8, r * Math.cos(p));
        const s = 5 + Math.random() * 6; sp.scale.set(s, s, 1);
        scene.add(sp); heroStars.push({ sp, base: s, phase: Math.random() * Math.PI * 2, rate: 0.6 + Math.random() * 1.2 });
    }

    /* ---------- colorful nebulae ---------- */
    const nebGroup = new THREE.Group(); scene.add(nebGroup);
    [[0x6d28d9, 140, -55, 16, -85], [0x0ea5e9, 130, 58, -34, -95], [0xdb2777, 110, 12, 46, -75],
     [0x0d9488, 120, -32, -42, -90], [0xf59e0b, 90, 42, 26, -105], [0x4338ca, 130, -62, -22, -100],
     [0x9333ea, 100, 22, -52, -80], [0x2563eb, 110, -12, 58, -115]].forEach(([c, s, x, y, z]) => {
        const n = halo(c, s, 0.06); n.position.set(x, y, z); nebGroup.add(n);
    });

    /* ---------- graph data ---------- */
    const HUBS = [
        { id: "about",   label: "About",   drill: false, pos: [-17, 7, 3],   sats: ["Amman", "B.Sc.", "Award"] },
        { id: "journey", label: "Journey", drill: true,  pos: [15, 10, -7],  sats: ["Engineering Manager", "Engineering Lead", "Senior SWE", "Software Engineer", "AI Eng Lead", "Data Scientist"] },
        { id: "skills",  label: "Skills",  drill: true,  pos: [19, -6, 8],    sats: ["Languages", "Data & DBs", "Cloud & DevOps", "Architecture", "Data & AI", "Leadership"] },
        { id: "work",    label: "Work",    drill: true,  pos: [-13, -10, -9], sats: ["ERP Platform", "Prodest Infra", "Lead Lifecycle", "SEO Engine", "R&D Workspace", "Locust AI"] },
        { id: "contact", label: "Contact", drill: false, pos: [-2, 15, 12],   sats: ["Email", "GitHub", "Remote"] },
    ];

    const pickable = [], hubObjs = [], labels = [], satMeshes = [], edgeList = [];
    const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

    function labelEl(text, cls, c1, c2) {
        const el = document.createElement("div");
        el.className = "node-label" + (cls ? " " + cls : "");
        el.textContent = text;
        if (c1 != null) el.style.setProperty("--lc", css(c1));
        if (c2 != null) el.style.setProperty("--lc2", css(c2));
        document.body.appendChild(el); return el;
    }

    /* ---------- core ---------- */
    const core = new THREE.Group();
    const sunTex = planetTex(0x9ff5e6, "gas");
    const coreBall = new THREE.Mesh(new THREE.SphereGeometry(2.1, 48, 48),
        new THREE.MeshStandardMaterial({ map: sunTex, emissiveMap: sunTex, emissive: CORE_COL, emissiveIntensity: 1.5, roughness: 1, metalness: 0 }));
    coreBall.userData = { id: "core", type: "core" }; core.add(coreBall);
    core.add(atmosphere(2.75, 0x9ff5e6, 2.4, 1.3));
    core.add(halo(0x8ef7e4, 10, 0.42)); core.add(halo(0xa78bfa, 14, 0.16));
    const rings = [];
    [[4.1, 0x5eead4, 2.4], [5.0, 0xa78bfa, 3.0], [4.6, 0xf472b6, 1.7]].forEach(([rad, col, tilt]) => {
        const r = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.028, 12, 120), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7 }));
        r.rotation.x = Math.PI / tilt; r.rotation.y = Math.random() * Math.PI; core.add(r); rings.push(r);
    });
    scene.add(core); pickable.push(coreBall);
    const coreLbl = labelEl("Seraj Albustanji", "hub core", CORE_COL);
    coreLbl.addEventListener("click", () => goOverview());
    labels.push({ el: coreLbl, obj: coreBall, kind: "core" });

    /* ---------- hubs + satellites + colored edges ---------- */
    const coreEdgePos = [], coreEdgeCol = [], satEdgePos = [], satEdgeCol = [];
    function pushEdge(posArr, colArr, a, b, ca, cb) {
        posArr.push(a.x, a.y, a.z, b.x, b.y, b.z);
        const A = rgb(ca), B = rgb(cb); colArr.push(A[0], A[1], A[2], B[0], B[1], B[2]);
    }

    HUBS.forEach((h) => {
        const pal = PAL[h.id], hubPos = V(h.pos);
        const g = new THREE.Group(); g.position.copy(hubPos);
        const ptype = (h.id === "work" || h.id === "contact") ? "rocky" : "gas";
        const ptex = planetTex(pal.hub, ptype);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.25, 48, 48),
            new THREE.MeshStandardMaterial({ map: ptex, emissiveMap: ptex, emissive: pal.hub, emissiveIntensity: 0.42, roughness: 0.9, metalness: 0.1 }));
        mesh.rotation.z = (Math.random() - 0.5) * 0.7;
        mesh.userData = { id: h.id, type: "hub", drill: h.drill, baseEmissive: 0.42, spin: 0.05 + Math.random() * 0.05 };
        g.add(mesh);
        g.add(atmosphere(1.55, pal.hub, 3.4, 0.9));
        g.add(halo(pal.hub, 3.4, 0.18));
        if (h.id === "about" || h.id === "work") g.add(ringMesh(1.7, 2.7, pal.sat, (Math.random() - 0.5) * 0.5));
        scene.add(g);
        pickable.push(mesh);
        hubObjs.push({ id: h.id, mesh, group: g, basePos: hubPos.clone(), drill: h.drill });
        const hubLbl = labelEl(h.label, "hub", pal.hub);
        hubLbl.addEventListener("click", () => onHub(h.id));
        labels.push({ el: hubLbl, obj: mesh, kind: "hub", hub: h.id });

        pushEdge(coreEdgePos, coreEdgeCol, new THREE.Vector3(0, 0, 0), hubPos, CORE_COL, pal.hub);
        edgeList.push({ a: new THREE.Vector3(0, 0, 0), b: hubPos.clone(), col: new THREE.Color(pal.hub) });

        h.sats.forEach((name, si) => {
            const ang = (si / h.sats.length) * Math.PI * 2, rad = 4.2 + (si % 2) * 1.3;
            const off = new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad * 0.7, Math.sin(ang * 1.7) * 2.3);
            const sp = hubPos.clone().add(off);
            const scol = si % 2 ? pal.sat : pal.hub;
            const mtex = planetTex(scol, si % 2 ? "rocky" : "gas");
            const sm = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 28),
                new THREE.MeshStandardMaterial({ map: mtex, emissiveMap: mtex, emissive: scol, emissiveIntensity: 0.55, roughness: 0.92, metalness: 0.08 }));
            sm.position.copy(sp);
            sm.userData = { id: h.id, type: "sat", name, hub: h.id, index: si, drill: h.drill, phase: Math.random() * Math.PI * 2, base: sp.clone(), baseEmissive: 0.55, spin: 0.15 + Math.random() * 0.2 };
            scene.add(sm);
            const sg = halo(scol, 1.35, 0.24); sg.position.copy(sp); scene.add(sg);
            pickable.push(sm); satMeshes.push({ mesh: sm, glow: sg });
            pushEdge(satEdgePos, satEdgeCol, hubPos, sp, pal.hub, scol);
            edgeList.push({ a: hubPos.clone(), b: sp.clone(), col: new THREE.Color(scol) });
            if (h.drill) {
                const sl = labelEl(name, "sat", pal.hub);
                sl.addEventListener("click", () => onSat(h.id, si));
                labels.push({ el: sl, obj: sm, kind: "sat", hub: h.id });
            }
        });
        if (h.drill) {
            const overText = h.id === "journey" ? "Full career path" : h.id === "skills" ? "All skills" : "All projects";
            const ol = labelEl(overText, "over", pal.hub, pal.sat);
            ol.addEventListener("click", () => openCard({ hub: h.id, overview: true }));
            labels.push({ el: ol, obj: mesh, kind: "over", hub: h.id });
        }
    });

    function lineSeg(posArr, colArr, opacity) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
        geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colArr), 3));
        return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity }));
    }
    scene.add(lineSeg(coreEdgePos, coreEdgeCol, 0.3));
    scene.add(lineSeg(satEdgePos, satEdgeCol, 0.13));

    /* ---------- colored pulses ---------- */
    const PULSES = lowPower ? 42 : 96;
    const pulsePos = new Float32Array(PULSES * 3), pulseCol = new Float32Array(PULSES * 3), pulseState = [];
    for (let i = 0; i < PULSES; i++) {
        const edge = edgeList[Math.floor(Math.random() * edgeList.length)];
        pulseState.push({ edge, t: Math.random(), speed: 0.1 + Math.random() * 0.2 });
        pulseCol[i * 3] = edge.col.r; pulseCol[i * 3 + 1] = edge.col.g; pulseCol[i * 3 + 2] = edge.col.b;
    }
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    pulseGeo.setAttribute("color", new THREE.BufferAttribute(pulseCol, 3));
    scene.add(new THREE.Points(pulseGeo, new THREE.PointsMaterial({ size: 0.5, map: softTex, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));

    const hoverLabel = labelEl("", "", null); hoverLabel.style.opacity = "0";

    /* ---------- state + interaction ---------- */
    let level = "overview", activeHub = null, panelOpen = false;
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
        const hit = ray.intersectObjects(pickable, false)[0];
        const obj = hit ? hit.object : null;
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
    function onHub(id) {
        const h = hubObjs.find((x) => x.id === id); if (!h) return;
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
    function goOverviewSilently() { level = "overview"; activeHub = null; window.SITE && window.SITE.hideCluster(); }
    window.addEventListener("universe:panel-open", () => { panelOpen = true; hoverLabel.style.opacity = "0"; });
    window.addEventListener("universe:panel-close", () => { panelOpen = false; });

    /* ---------- labels ---------- */
    const tmp = new THREE.Vector3();
    function labelVisible(L) {
        if (L.kind === "sat" || L.kind === "over") return level === "cluster" && L.hub === activeHub;
        return level === "overview";
    }
    function updateLabels() {
        for (const L of labels) {
            if (!labelVisible(L)) { if (L.el.style.opacity !== "0") { L.el.style.opacity = "0"; L.el.style.pointerEvents = "none"; } continue; }
            L.obj.getWorldPosition(tmp); tmp.project(camera);
            const behind = tmp.z > 1;
            const x = (tmp.x * 0.5 + 0.5) * W(), y = (-tmp.y * 0.5 + 0.5) * H();
            const off = L.kind === "core" ? 38 : L.kind === "over" ? 46 : 26;
            L.el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y - off}px)`;
            L.el.style.opacity = behind ? "0" : (panelOpen ? "0.2" : "1");
            L.el.style.pointerEvents = behind || panelOpen ? "none" : "auto";
        }
        if (hoverLabel.style.opacity !== "0" && hovered) {
            hovered.getWorldPosition(tmp); tmp.project(camera);
            const x = (tmp.x * 0.5 + 0.5) * W(), y = (-tmp.y * 0.5 + 0.5) * H();
            hoverLabel.style.transform = `translate(-50%,-50%) translate(${x}px, ${y - 22}px)`;
        }
    }

    function openCard(spec) { window.SITE && window.SITE.openCard(spec); }

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime(), d = 0.016;
        coreBall.rotation.y = t * 0.05;
        rings[0].rotation.z = t * 0.4; rings[1].rotation.z = -t * 0.3; rings[2].rotation.z = t * 0.22;
        for (const ho of hubObjs) ho.mesh.rotation.y = t * (ho.mesh.userData.spin || 0.05);
        nebGroup.rotation.y = t * 0.01; nebGroup.rotation.z = t * 0.006;
        for (const s of starLayers) s.pts.material.opacity = s.base * (0.8 + Math.sin(t * 0.7 + s.tw) * 0.2);
        for (const hs of heroStars) { const k = 1 + Math.sin(t * hs.rate + hs.phase) * 0.28; hs.sp.scale.set(hs.base * k, hs.base * k, 1); hs.sp.material.opacity = 0.6 + Math.sin(t * hs.rate + hs.phase) * 0.35; }
        for (const s of satMeshes) { const u = s.mesh.userData; s.mesh.position.y = u.base.y + Math.sin(t * 0.8 + u.phase) * 0.22; s.mesh.rotation.y = t * (u.spin || 0.2); s.glow.position.copy(s.mesh.position); }
        if (hovered) { hovered.scale.setScalar(1.16 + Math.sin(t * 6) * 0.05); if (hovered.userData.baseEmissive) hovered.material.emissiveIntensity = hovered.userData.baseEmissive * 1.8; }
        pickable.forEach((m) => { if (m !== hovered) m.scale.setScalar(1); });
        for (let i = 0; i < PULSES; i++) {
            const p = pulseState[i]; p.t += p.speed * d;
            if (p.t > 1) { p.t = 0; p.edge = edgeList[Math.floor(Math.random() * edgeList.length)]; pulseCol[i * 3] = p.edge.col.r; pulseCol[i * 3 + 1] = p.edge.col.g; pulseCol[i * 3 + 2] = p.edge.col.b; pulseGeo.attributes.color.needsUpdate = true; }
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
        setFog: (dn) => { scene.fog.density = dn; },
    };

    let p = 0; const bar = document.getElementById("introBar");
    const step = setInterval(() => { p = Math.min(p + Math.random() * 24 + 12, 100); if (bar) bar.style.width = p + "%"; if (p >= 100) { clearInterval(step); window.dispatchEvent(new Event("universe:ready")); } }, 120);
}
