const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll(".site-nav > a, .nav-dropdown-link, .nav-dropdown-menu a")];
const navDropdownLink = document.querySelector(".nav-dropdown-link");
const servicePages = new Set([
  "services.html",
  "network-infrastructure.html",
  "cyber-security.html",
  "cloud.html",
  "endpoint.html",
  "data-security.html",
  "design-solution.html"
]);

const closeMobileNav = () => {
  nav?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMobileNav);
  });
}

if (header) {
  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

const syncActiveNav = () => {
  const getPageName = (pathname) => pathname.split("/").filter(Boolean).pop()?.toLowerCase() || "index.html";
  const currentPage = getPageName(window.location.pathname);
  const getLinkUrl = (link) => {
    try {
      return new URL(link.getAttribute("href") || "", window.location.href);
    } catch {
      return null;
    }
  };

  const offset = (header?.offsetHeight || 0) + 36;
  const targets = navLinks
    .map((link) => {
      const url = getLinkUrl(link);
      const isSamePage = url && getPageName(url.pathname) === currentPage;
      const id = isSamePage && url.hash ? decodeURIComponent(url.hash.slice(1)) : "";
      const target = id ? document.getElementById(id) : null;
      return target ? { id, link, top: target.offsetTop } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top);

  let active = null;

  if (targets.length) {
    active = targets[0];
    const marker = window.scrollY + offset;

    for (const target of targets) {
      if (target.top <= marker) {
        active = target;
      }
    }

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
      active = targets[targets.length - 1];
    }
  } else {
    const currentPageLink = navLinks.find((link) => {
      const url = getLinkUrl(link);
      return url && getPageName(url.pathname) === currentPage && !url.hash;
    });
    active = currentPageLink ? { link: currentPageLink } : null;
  }

  const submenuLinks = [...document.querySelectorAll(".nav-dropdown-menu a")];
  const topNavLinks = [...document.querySelectorAll(".site-nav > a")];

  topNavLinks.forEach((link) => {
    const url = getLinkUrl(link);
    const isActive = link === active?.link;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  submenuLinks.forEach((link) => {
    const url = getLinkUrl(link);
    const isActive = url && getPageName(url.pathname) === currentPage;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const isServiceSection = servicePages.has(currentPage);
  const isServicesOverview = currentPage === "services.html";
  navDropdownLink?.classList.toggle("is-active", isServiceSection);
  if (isServicesOverview) {
    navDropdownLink?.setAttribute("aria-current", "page");
  } else if (isServiceSection) {
    navDropdownLink?.setAttribute("aria-current", "true");
  } else {
    navDropdownLink?.removeAttribute("aria-current");
  }
};

syncActiveNav();
window.addEventListener("scroll", syncActiveNav, { passive: true });
window.addEventListener("resize", syncActiveNav);
window.addEventListener("hashchange", syncActiveNav);

const solutionCards = Array.from(document.querySelectorAll("[data-solution]"));
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const setSolutionCardExpanded = (card, shouldExpand) => {
  const panel = card.querySelector("[data-solution-details]");
  const button = card.querySelector("[data-open-solution]");
  const closeButton = card.querySelector("[data-close-solution]");
  const buttonText = button?.querySelector(".view-more-text");
  if (!panel || !button) return;

  card.classList.toggle("is-expanded", shouldExpand);
  button.setAttribute("aria-expanded", String(shouldExpand));
  panel.setAttribute("aria-hidden", String(!shouldExpand));
  closeButton?.setAttribute("aria-hidden", String(!shouldExpand));
  closeButton?.setAttribute("tabindex", shouldExpand ? "0" : "-1");

  if (buttonText) {
    buttonText.textContent = shouldExpand ? "Close details" : "View more";
  }
};

const closeOtherSolutionCards = (activeCard) => {
  solutionCards.forEach((card) => {
    if (card !== activeCard) {
      setSolutionCardExpanded(card, false);
    }
  });
};

const animateSolutionLayout = (updateLayout) => {
  if (!solutionCards.length || reducedMotionQuery.matches) {
    updateLayout();
    return;
  }

  const firstRects = new Map(solutionCards.map((card) => [card, card.getBoundingClientRect()]));
  updateLayout();

  requestAnimationFrame(() => {
    solutionCards.forEach((card) => {
      const firstRect = firstRects.get(card);
      const lastRect = card.getBoundingClientRect();
      const deltaX = firstRect.left - lastRect.left;
      const deltaY = firstRect.top - lastRect.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      const endScale = card.classList.contains("is-expanded") ? 1.02 : 1;
      card.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px) scale(${endScale})` },
          { transform: `translate(0, 0) scale(${endScale})` }
        ],
        {
          duration: 420,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
        }
      );
    });
  });
};

solutionCards.forEach((card) => {
  const panel = card.querySelector("[data-solution-details]");
  if (!panel) return;

  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    if (event.target.closest("[data-close-solution]")) {
      event.stopPropagation();
      animateSolutionLayout(() => {
        setSolutionCardExpanded(card, false);
      });
      return;
    }

    const shouldExpand = !card.classList.contains("is-expanded");
    animateSolutionLayout(() => {
      closeOtherSolutionCards(card);
      setSolutionCardExpanded(card, shouldExpand);
    });
  });
});

const contactForm = document.querySelector("[data-contact-form]");
if (contactForm) {
  const nextUrl = contactForm.querySelector("[data-next-url]");
  if (nextUrl && window.location.protocol !== "file:") {
    nextUrl.value = `${window.location.origin}/thank-you.html`;
  }

  contactForm.addEventListener("submit", () => {
    const status = contactForm.querySelector("[data-form-status]");
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (status) {
      status.textContent = "กำลังส่งข้อมูลไปยังอีเมลบริษัท...";
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = "0.72";
    }
  });
}

const canvas = document.getElementById("network-canvas");
const ctx = canvas?.getContext("2d");
let points = [];
let frameId = 0;

const createPoints = () => {
  if (!canvas) return;

  const count = Math.max(42, Math.floor((canvas.width * canvas.height) / 32000));
  points = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35
  }));
};

const resizeCanvas = () => {
  if (!canvas) return;

  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  createPoints();
};

const animateNetwork = () => {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(55, 216, 255, 0.82)";
  ctx.strokeStyle = "rgba(55, 216, 255, 0.18)";
  ctx.lineWidth = window.devicePixelRatio || 1;

  points.forEach((point, index) => {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
    if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
    ctx.fill();

    for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
      const next = points[nextIndex];
      const dx = point.x - next.x;
      const dy = point.y - next.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 170) {
        ctx.globalAlpha = 1 - distance / 170;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  });

  frameId = requestAnimationFrame(animateNetwork);
};

if (canvas && ctx) {
  resizeCanvas();
  animateNetwork();
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(frameId));
}

// Modern Particles Animation System
const particlesContainers = document.querySelectorAll("[data-particles]");
const cloudParticles = [];
const matrixChars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

const createParticles = (container) => {
  if (!container || reducedMotionQuery.matches) return;

  const isMatrix = container.hasAttribute("data-matrix");
  const isCloud = container.hasAttribute("data-endpoint") || container.hasAttribute("data-cloud");
  const particleCount = isMatrix ? 30 : isCloud ? 20 : 15;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    if (isMatrix) {
      particle.className = "matrix-column";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${8 + Math.random() * 12}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;

      let text = "";
      const charCount = 5 + Math.floor(Math.random() * 15);
      for (let j = 0; j < charCount; j++) {
        text += matrixChars[Math.floor(Math.random() * matrixChars.length)] + "\n";
      }
      particle.textContent = text;
    } else {
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = "-10px";
      particle.style.width = `${3 + Math.random() * 6}px`;
      particle.style.height = particle.style.width;
      particle.style.animationDuration = `${6 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * 8}s`;

      if (isCloud) {
        particle.style.background = "radial-gradient(circle, rgba(135, 206, 250, 0.8), transparent)";
        particle.style.filter = "blur(1px)";
      }
    }

    container.appendChild(particle);
    cloudParticles.push(particle);
  }
};

// Pulse rings for network pages
const createPulseRings = (container) => {
  if (!container || reducedMotionQuery.matches) return;

  for (let i = 0; i < 3; i++) {
    const ring = document.createElement("div");
    ring.className = "pulse-ring";
    ring.style.left = `${20 + Math.random() * 60}%`;
    ring.style.top = `${20 + Math.random() * 60}%`;
    ring.style.animationDelay = `${i * 0.7}s`;
    container.appendChild(ring);
  }
};

// Cloud orbs for cloud pages
const createCloudOrbs = (container) => {
  if (!container || reducedMotionQuery.matches) return;

  for (let i = 0; i < 4; i++) {
    const orb = document.createElement("div");
    orb.className = "cloud-orb";
    const size = 80 + Math.random() * 120;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.left = `${Math.random() * 100}%`;
    orb.style.top = `${Math.random() * 100}%`;
    orb.style.animationDelay = `${Math.random() * 5}s`;
    orb.style.animationDuration = `${10 + Math.random() * 8}s`;
    container.appendChild(orb);
  }
};

// Initialize particles on all containers
particlesContainers.forEach((container) => {
  createParticles(container);

  if (container.hasAttribute("data-pulse")) {
    createPulseRings(container);
  }

  if (container.hasAttribute("data-cloud")) {
    createCloudOrbs(container);
  }
});

// Floating animation for cloud orbs
const animateCloudOrbs = () => {
  const orbs = document.querySelectorAll(".cloud-orb");
  orbs.forEach((orb) => {
    const currentLeft = parseFloat(orb.style.left) || 0;
    const currentTop = parseFloat(orb.style.top) || 0;

    orb.style.left = `${currentLeft + Math.sin(Date.now() * 0.001) * 0.5}%`;
    orb.style.top = `${currentTop + Math.cos(Date.now() * 0.0008) * 0.3}%`;
  });

  if (!reducedMotionQuery.matches) {
    requestAnimationFrame(animateCloudOrbs);
  }
};

if (document.querySelector(".cloud-orb") && !reducedMotionQuery.matches) {
  animateCloudOrbs();
}

// Connection lines effect for endpoint pages
const endpointContainer = document.querySelector("[data-endpoint]");
if (endpointContainer && !reducedMotionQuery.matches) {
  const createConnectionLine = () => {
    const line = document.createElement("div");
    line.style.position = "absolute";
    line.style.width = "2px";
    line.style.height = "50px";
    line.style.background = "linear-gradient(to bottom, transparent, rgba(255, 149, 0, 0.6), transparent)";
    line.style.left = `${Math.random() * 100}%`;
    line.style.top = `${Math.random() * 100}%`;
    line.style.transform = `rotate(${Math.random() * 360}deg)`;
    line.style.opacity = "0";
    line.style.transition = "opacity 0.5s ease";

    endpointContainer.appendChild(line);

    setTimeout(() => {
      line.style.opacity = "0.6";
    }, 100);

    setTimeout(() => {
      line.style.opacity = "0";
      setTimeout(() => line.remove(), 500);
    }, 2000);
  };

  setInterval(createConnectionLine, 800);
}

// Data flow effect for data security pages
const dataContainer = document.querySelector(".page-data .particles-container");
if (dataContainer && !reducedMotionQuery.matches) {
  const createDataPacket = () => {
    const packet = document.createElement("div");
    packet.style.position = "absolute";
    packet.style.width = "6px";
    packet.style.height = "6px";
    packet.style.background = "var(--cyan)";
    packet.style.borderRadius = "2px";
    packet.style.boxShadow = "0 0 10px var(--cyan)";
    packet.style.left = `${Math.random() * 100}%`;
    packet.style.top = `${Math.random() * 100}%`;
    packet.style.animation = "floatUp 4s ease-out forwards";

    dataContainer.appendChild(packet);

    setTimeout(() => packet.remove(), 4000);
  };

  setInterval(createDataPacket, 500);
}

// Mouse parallax effect for hero sections
const heroSections = document.querySelectorAll(".infra-hero, .page-hero, .hero");
heroSections.forEach((hero) => {
  hero.addEventListener("mousemove", (e) => {
    if (reducedMotionQuery.matches) return;

    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const aurora = hero.querySelector(".aurora");
    const particles = hero.querySelector(".particles-container");

    if (aurora) {
      aurora.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
    }

    if (particles) {
      particles.style.transform = `translate(${x * -15}px, ${y * -15}px)`;
    }
  });
});

// Intersection Observer for reveal animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, observerOptions);

document.querySelectorAll(".infra-service-card, .infra-product-card, .project-card").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  revealObserver.observe(el);
});

// Add styles for reveal animation
const revealStyles = document.createElement("style");
revealStyles.textContent = `
  .is-visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(revealStyles);
