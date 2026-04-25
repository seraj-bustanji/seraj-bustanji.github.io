/* ============================================
   Seraj Albustanji — Portfolio
============================================ */

// ----- Page loader -----
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => loader.classList.add('hide'), 600);
    }
    document.getElementById('footerYear').textContent = new Date().getFullYear();
});

// ----- Custom cursor -----
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

if (cursorDot && cursorRing && !isCoarsePointer) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    const animateRing = () => {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(animateRing);
    };
    animateRing();

    const hoverables = 'a, button, .magnetic, input, textarea, .skill-card, .project-card, .timeline-card, .about-facts li, .contact-list li';
    document.querySelectorAll(hoverables).forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
    });
}

// ----- Magnetic buttons -----
if (!isCoarsePointer) {
    document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
        });
    });
}

// ----- Scroll progress -----
const scrollProgress = document.getElementById('scrollProgress');
function updateScrollProgress() {
    const scrolled = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const pct = (scrolled / height) * 100;
    if (scrollProgress) scrollProgress.style.width = pct + '%';
}

// ----- Navbar scrolled state + active link -----
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 60) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
}

function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop - 200;
        if (window.scrollY >= top) current = section.id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === current);
    });
}

window.addEventListener('scroll', () => {
    updateScrollProgress();
    updateNavbar();
    updateActiveLink();
}, { passive: true });

// ----- Mobile nav -----
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// ----- Smooth anchor scroll (extra easing on top of CSS smooth) -----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ----- Stat counter -----
const counters = document.querySelectorAll('.stat-number');
const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(eased * target);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target;
    };
    requestAnimationFrame(tick);
};
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.4 });
counters.forEach(c => counterObserver.observe(c));

// ----- Reveal on scroll: timeline + skill meters -----
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.timeline-item').forEach(el => revealObserver.observe(el));

const meterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-meter').forEach((m, i) => {
                setTimeout(() => m.classList.add('in'), i * 80);
            });
            meterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });
document.querySelectorAll('.skill-card').forEach(el => meterObserver.observe(el));

// ----- Skill card spotlight -----
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
    });
});

// ----- Particle network in hero -----
(function particleNetwork() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth < 720;

    let width, height;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
        const count = isMobile ? 30 : Math.min(80, Math.floor((width * height) / 16000));
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.4 + 0.6
            });
        }
    }

    function step() {
        ctx.clearRect(0, 0, width, height);

        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const f = (120 - dist) / 120;
                p.x += (dx / dist) * f * 1.2;
                p.y += (dy / dist) * f * 1.2;
            }

            ctx.beginPath();
            ctx.fillStyle = 'rgba(15, 15, 15, 0.35)';
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    ctx.strokeStyle = `rgba(15, 15, 15, ${0.12 * (1 - dist / 130)})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(step);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    window.addEventListener('resize', () => { resize(); spawn(); });
    resize();
    spawn();
    step();
})();

// ----- Hero parallax tilt on scroll (subtle) -----
const heroSection = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    if (!heroSection) return;
    const y = window.scrollY;
    if (y < window.innerHeight) {
        heroSection.style.setProperty('--shift', y * 0.1 + 'px');
    }
}, { passive: true });

// ----- EmailJS contact form -----
const EMAILJS_PUBLIC_KEY = 'tkj6MNMDakdT_BDLv';
const EMAILJS_SERVICE_ID = 'service_7vpeux7';
const EMAILJS_TEMPLATE_ID = 'template_x279ifr';

if (typeof emailjs !== 'undefined') {
    // EmailJS v4 init signature
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
} else {
    console.warn('EmailJS SDK failed to load. Check the script tag and your network/ad-blocker.');
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (typeof emailjs === 'undefined') {
            return showNotification('Email service unavailable. Disable any ad-blocker and reload.', 'error');
        }

        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const subject = document.getElementById('userSubject').value.trim();
        const message = document.getElementById('userMessage').value.trim();

        if (!name || !email || !message) {
            return showNotification('Please fill in all required fields.', 'error');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showNotification('Please enter a valid email address.', 'error');
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending…</span>';
        submitBtn.disabled = true;

        try {
            const params = {
                from_name: name,
                from_email: email,
                reply_to: email,
                subject: subject || 'Portfolio Contact',
                message,
                to_name: 'Seraj'
            };

            const res = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                params,
                { publicKey: EMAILJS_PUBLIC_KEY }
            );

            if (res && res.status === 200) {
                showNotification("Message sent. I'll get back to you soon.", 'success');
                contactForm.reset();
            } else {
                console.error('EmailJS unexpected response:', res);
                showNotification('Failed to send. Please try again.', 'error');
            }
        } catch (err) {
            console.error('EmailJS error:', err);
            const detail = (err && (err.text || err.message)) || '';
            const friendly = /allowed origin|cors|api/i.test(detail)
                ? 'Email service blocked this domain. Add it under EmailJS → Account → Security → Allowed Origins.'
                : `Failed to send. ${detail || 'Please try again later.'}`;
            showNotification(friendly, 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    });
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const note = document.createElement('div');
    note.className = `notification ${type}`;
    const icon = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-xmark' : 'fa-circle-info';
    note.innerHTML = `
        <span class="notification-icon"><i class="fas ${icon}"></i></span>
        <span>${message}</span>
    `;
    document.body.appendChild(note);
    requestAnimationFrame(() => note.classList.add('show'));
    setTimeout(() => {
        note.classList.remove('show');
        setTimeout(() => note.remove(), 400);
    }, 4500);
}

// Console signature
console.log('%cSeraj Albustanji', 'font-family: serif; font-size: 28px; background: linear-gradient(90deg, #d4ff3a, #8b5cf6); -webkit-background-clip: text; color: transparent; font-weight: bold;');
console.log('%cEngineering Manager · Data Scientist · Builder', 'color: #a1a1ac; font-size: 13px;');
