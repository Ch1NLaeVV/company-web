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
