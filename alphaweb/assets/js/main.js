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

      card.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" }
        ],
        {
          duration: 340,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)"
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

    // Ignore clicks inside the expanded details panel (e.g. clicking text, tabs, etc.)
    if (event.target.closest(".solution-expand")) return;

    const shouldExpand = !card.classList.contains("is-expanded");
    animateSolutionLayout(() => {
      closeOtherSolutionCards(card);
      setSolutionCardExpanded(card, shouldExpand);
    });
  });
});

// Interactivity for solution tabs and accordions
const initSolutionTabs = () => {
  const tabWrappers = document.querySelectorAll(".solution-tab-wrapper");
  tabWrappers.forEach((wrapper) => {
    const buttons = Array.from(wrapper.querySelectorAll(".tab-toggle-btn"));
    const panels = Array.from(wrapper.querySelectorAll(".tab-panel"));

    buttons.forEach((btn, index) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent card from toggling open/close

        const isActive = btn.classList.contains("is-active");
        const isMobile = window.innerWidth <= 768;

        if (isActive && isMobile) {
          // In mobile accordion mode, clicking an active header collapses it
          btn.classList.remove("is-active");
          panels[index].classList.remove("is-active");
          btn.setAttribute("aria-selected", "false");
          panels[index].setAttribute("aria-hidden", "true");
        } else {
          // Standard tab activation
          buttons.forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
          panels.forEach((p) => {
            p.classList.remove("is-active");
            p.setAttribute("aria-hidden", "true");
          });

          btn.classList.add("is-active");
          panels[index].classList.add("is-active");
          btn.setAttribute("aria-selected", "true");
          panels[index].setAttribute("aria-hidden", "false");
        }
      });
    });
  });
};

initSolutionTabs();

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

const initCookieBanner = () => {
  const storageKey = "atsCookieConsent";
  if (localStorage.getItem(storageKey) === "accepted") return;

  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie notice");
  banner.innerHTML = `
    <p>
      เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นเพื่อให้เว็บไซต์ทำงานได้อย่างเหมาะสม และอาจใช้ข้อมูลการใช้งานเพื่อปรับปรุงประสบการณ์ของผู้เข้าชม
      อ่านรายละเอียดเพิ่มเติมได้ที่ <a href="privacy-policy.html">Privacy Policy</a>
    </p>
    <div class="cookie-actions">
      <button class="button button-primary" type="button" data-accept-cookies>ยอมรับ</button>
      <a class="button button-ghost" href="privacy-policy.html">อ่านนโยบาย</a>
    </div>
  `;

  document.body.append(banner);
  banner.querySelector("[data-accept-cookies]")?.addEventListener("click", () => {
    localStorage.setItem(storageKey, "accepted");
    banner.hidden = true;
  });
};

initCookieBanner();

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

// ==========================================================================
// Company Profile PDF Modal Logic
// ==========================================================================

const PDF_URL = 'assets/pdf/company-profile.pdf';

const initPdfModal = () => {
  // 1. Inject Modal HTML markup
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = `
    <div class="pdf-modal-overlay" id="pdf-modal">
      <div class="pdf-modal-content" id="pdf-modal-content">
        <button class="pdf-modal-close" id="pdf-close-btn" aria-label="Close modal">&times;</button>
        <h3 style="margin: 0; color: #fff; font-size: 1.1rem; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">ALPHA TECHNO SOFT</h3>
        <p style="margin: -8px 0 8px; color: #8a99ad; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;" data-translate data-th="Company Profile" data-en="Company Profile">Company Profile</p>
        <div class="pdf-preview-container">
          <div class="pdf-loading-spinner" id="pdf-loading-indicator" data-translate data-th="กำลังโหลดหน้าปก..." data-en="Loading cover page...">Loading cover page...</div>
          <canvas class="pdf-preview-canvas" id="pdf-preview-canvas" style="display: none;"></canvas>
        </div>
        <button class="pdf-download-btn" id="pdf-download-btn" data-translate data-th="⬇ ดาวน์โหลด Company Profile" data-en="⬇ Download Company Profile">
          <span>⬇</span> Download Company Profile
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  const modal = document.getElementById("pdf-modal");
  const modalContent = document.getElementById("pdf-modal-content");
  const closeBtn = document.getElementById("pdf-close-btn");
  const downloadBtn = document.getElementById("pdf-download-btn");
  const canvas = document.getElementById("pdf-preview-canvas");
  const indicator = document.getElementById("pdf-loading-indicator");

  let pdfjsLoaded = false;
  let pdfRendered = false;

  const openModal = async () => {
    modal.classList.add("is-active");
    document.body.style.overflow = "hidden"; // Prevent background scroll

    if (pdfRendered) return;

    try {
      const isEn = document.documentElement.lang === "en";
      indicator.textContent = isEn ? "Loading preview..." : "กำลังโหลดตัวอย่างพรีวิว...";
      indicator.classList.add("pdf-loading-spinner");
      
      // If opening directly via file://, browser security blocks PDF.js fetch.
      if (window.location.protocol === "file:") {
        throw new Error("Local file protocol (file://) detected. Browser security rules block PDF.js from loading local files.");
      }

      // Lazily load PDF.js script
      if (!pdfjsLoaded) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        pdfjsLoaded = true;
      }

      const pdfjs = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
      
      // Bypass cross-origin worker restriction using a Blob URL wrapper
      const workerUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      try {
        const blob = new Blob([`importScripts("${workerUrl}");`], { type: "application/javascript" });
        pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      } catch (workerErr) {
        console.warn("Could not create blob worker, falling back to direct URL:", workerErr);
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      }

      // Render cover page
      const loadingTask = pdfjs.getDocument(PDF_URL);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const context = canvas.getContext("2d");
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Calculate ideal width (e.g. 480px) and scale accordingly
      const targetWidth = 480;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale: scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };

      await page.render(renderContext).promise;
      
      // Show canvas, hide indicator
      indicator.style.display = "none";
      canvas.style.display = "block";
      pdfRendered = true;
    } catch (err) {
      console.error("Error loading or rendering PDF:", err);
      const isEn = document.documentElement.lang === "en";
      if (window.location.protocol === "file:") {
        indicator.textContent = isEn
          ? "Browser blocked local preview (CORS/file://). Please upload to a server to preview, but you can still download the PDF below."
          : "เบราว์เซอร์บล็อกการพรีวิวไฟล์แบบโลคอล (CORS/file://) กรุณาอัปโหลดขึ้นเซิร์ฟเวอร์เพื่อดูพรีวิว (แต่ยังสามารถดาวน์โหลด PDF ได้จากปุ่มด้านล่าง)";
      } else {
        indicator.textContent = isEn
          ? "Failed to load preview. You can still download the PDF below."
          : "ไม่สามารถโหลดตัวอย่างพรีวิวได้ คุณยังคงสามารถดาวน์โหลด PDF ได้จากปุ่มด้านล่าง";
      }
      indicator.classList.remove("pdf-loading-spinner");
    }
  };

  const closeModal = () => {
    modal.classList.remove("is-active");
    document.body.style.overflow = ""; // Restore scroll
  };

  // Attach modal trigger listeners to all nav CTA buttons
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-download-profile]");
    if (trigger) {
      e.preventDefault();
      openModal();
    }
  });

  // Close modal events
  closeBtn.addEventListener("click", closeModal);
  
  modal.addEventListener("click", (e) => {
    // Close modal when clicking on backdrop/overlay (outside content box)
    if (!modalContent.contains(e.target)) {
      closeModal();
    }
  });

  // Download button handler
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = PDF_URL;
    link.download = "company-profile.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

const loadScript = (url) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Start PDF Modal logic on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPdfModal);
} else {
  initPdfModal();
}

// ==========================================================================
// Easter Egg - Hover Scan Controller
// ==========================================================================
const initHoverScan = () => {
  const shield = document.getElementById("easter-egg-shield");
  if (!shield) return;

  const progressCircle  = shield.querySelector(".scan-progress-circle");
  const scanOverlay     = shield.querySelector(".scan-overlay");
  const scanLine        = shield.querySelector(".scan-line");
  const statusBox       = shield.querySelector(".scan-status-box");
  const clearBadge      = shield.querySelector(".scan-clear-badge");
  const threats         = [...shield.querySelectorAll(".scan-threat")];
  const CIRCUMFERENCE   = 2 * Math.PI * 46; // r=46 ตาม SVG viewBox
  
  let scanInterval      = null;
  let scanlineInterval  = null;
  let startTime         = null;
  let scanlinePos       = 15;
  let scanlineDir       = 1;

  const statusText = shield.querySelector(".scan-status-text");
  
  let scanTimer = null;
  let textTimers = [];
  let resetTimer = null;
  
  let isScanning = false;
  let isClear = false;

  const startScan = () => {
    if (isScanning || isClear) return;

    isScanning = true;
    shield.classList.add("is-scanning");
    
    startTime = Date.now();
    scanOverlay.classList.add("is-active");
    statusBox.classList.add("is-active");

    // Initial status text
    statusText.textContent = "Initializing scan...";

    // Schedule status text stages
    textTimers.push(setTimeout(() => { statusText.textContent = "Analyzing threats..."; }, 800));
    textTimers.push(setTimeout(() => { statusText.textContent = "Checking integrity..."; }, 1600));
    textTimers.push(setTimeout(() => { statusText.textContent = "Verifying identity..."; }, 2400));

    // Update progress ring stroke-dasharray every 16ms
    scanInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const drawLength = Math.min((elapsed / 3000) * CIRCUMFERENCE, CIRCUMFERENCE);
      progressCircle.style.strokeDasharray = `${drawLength} ${CIRCUMFERENCE}`;
    }, 16);

    // Update scanline position every 30ms (bounce between 15% and 83%)
    scanlineInterval = setInterval(() => {
      scanlinePos += scanlineDir * 1.5;
      if (scanlinePos >= 83) {
        scanlinePos = 83;
        scanlineDir = -1;
      } else if (scanlinePos <= 15) {
        scanlinePos = 15;
        scanlineDir = 1;
      }
      scanLine.style.top = `${scanlinePos}%`;
    }, 30);

    // Complete scan at 3 seconds
    scanTimer = setTimeout(() => {
      completeScan();
    }, 3000);
  };

  const completeScan = () => {
    isScanning = false;
    isClear = true;
    
    shield.classList.remove("is-scanning");
    shield.classList.add("is-clear");

    clearInterval(scanInterval);
    clearInterval(scanlineInterval);
    
    scanOverlay.classList.remove("is-active");
    statusBox.classList.add("is-clear");
    progressCircle.classList.add("is-clear");
    
    progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    
    statusText.textContent = "✓ You are clear";
    clearBadge.classList.add("is-visible");

    // Fly out threats with delay i * 100ms
    threats.forEach((threat, i) => {
      textTimers.push(setTimeout(() => {
        if (isClear) {
          threat.classList.add("is-flying");
        }
      }, i * 100));
    });

    // Cooldown reset after 3.5 seconds
    resetTimer = setTimeout(() => {
      resetScan();
    }, 3500);
  };

  const cancelScan = () => {
    // If the scan is complete (isClear is true), we do NOT cancel it on mouse leave.
    // It will reset automatically after the 3.5s cooldown.
    if (isClear) return;

    resetScan();
  };

  const resetScan = () => {
    isScanning = false;
    isClear = false;

    // Clear all scheduled timers and intervals
    if (scanTimer) clearTimeout(scanTimer);
    if (resetTimer) clearTimeout(resetTimer);
    if (scanInterval) clearInterval(scanInterval);
    if (scanlineInterval) clearInterval(scanlineInterval);
    
    textTimers.forEach(t => clearTimeout(t));
    textTimers = [];

    // Reset scanline state
    scanlinePos = 15;
    scanlineDir = 1;

    // Reset DOM classes
    shield.classList.remove("is-scanning");
    shield.classList.remove("is-clear");
    
    scanOverlay.classList.remove("is-active");
    
    statusBox.classList.remove("is-active");
    statusBox.classList.remove("is-clear");
    
    clearBadge.classList.remove("is-visible");
    
    threats.forEach(threat => {
      threat.classList.remove("is-flying");
    });
    
    progressCircle.classList.remove("is-clear");
    progressCircle.style.strokeDasharray = "0 9999";
    progressCircle.style.stroke = "";
    scanLine.style.top = "20%";

    // Reset text
    statusText.textContent = "";
  };

  // Desktop events
  shield.addEventListener("mouseenter", startScan);
  shield.addEventListener("mouseleave", cancelScan);

  // Mobile/Touch events
  shield.addEventListener("touchstart", (e) => {
    // Prevent mouse event emulation and default scrolling behaviors
    e.preventDefault();
    startScan();
  }, { passive: false });

  shield.addEventListener("touchend", cancelScan);
  shield.addEventListener("touchcancel", cancelScan);
};

// Scroll Reveal Animation using Intersection Observer
const initScrollReveal = () => {
  const revealElements = document.querySelectorAll(".reveal");
  if (!revealElements.length) return;

  const observerOptions = {
    root: null, // viewport
    rootMargin: "0px",
    threshold: 0.15 // trigger when 15% visible
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        obs.unobserve(entry.target); // animate once
      }
    });
  }, observerOptions);

  revealElements.forEach((el) => observer.observe(el));
};

// Language Toggle & Content Translation Controller
function applyLang(lang) {
  document.documentElement.setAttribute("lang", lang === "th" ? "th" : "en");
  
  const elements = document.querySelectorAll("[data-th]");
  elements.forEach((el) => {
    const thVal = el.getAttribute("data-th");
    const enVal = el.getAttribute("data-en");
    
    if (thVal !== null && enVal !== null) {
      if (el.tagName === "IMG") {
        el.setAttribute("alt", lang === "en" ? enVal : thVal);
      } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", lang === "en" ? enVal : thVal);
      } else if (el.tagName === "META") {
        el.setAttribute("content", lang === "en" ? enVal : thVal);
      } else {
        el.textContent = lang === "en" ? enVal : thVal;
      }
    }
  });

  // Update header button active state
  const langToggleBtn = document.getElementById("langToggle");
  if (langToggleBtn) {
    const thText = langToggleBtn.querySelector(".lang-th");
    const enText = langToggleBtn.querySelector(".lang-en");
    const thFlag = langToggleBtn.querySelector(".flag-th-icon");
    const enFlag = langToggleBtn.querySelector(".flag-en-icon");
    if (thText && enText) {
      if (lang === "en") {
        thText.classList.remove("active");
        enText.classList.add("active");
        if (thFlag) thFlag.classList.remove("active");
        if (enFlag) enFlag.classList.add("active");
      } else {
        enText.classList.remove("active");
        thText.classList.add("active");
        if (enFlag) enFlag.classList.remove("active");
        if (thFlag) thFlag.classList.add("active");
      }
    }
  }

  updateHeaderClock();
}

function updateHeaderClock() {
  const clockEl = document.getElementById("headerDateTime");
  if (!clockEl) return;
  
  try {
    const now = new Date();
    const lang = document.documentElement.getAttribute("lang") || "th";
    
    if (lang === "th") {
      const dateFormatter = new Intl.DateTimeFormat('th-TH', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      const timeFormatter = new Intl.DateTimeFormat('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Remove 'วัน' prefix and 'ที่' preposition from the Thai date
      let dateStr = dateFormatter.format(now);
      dateStr = dateStr.replace(/^วัน/, '').replace(/ที่\s*/, ' ');
      
      clockEl.innerHTML = `<span class="header-date">${dateStr}</span><span class="header-time">${timeFormatter.format(now)} น.</span>`;
    } else {
      const dateFormatter = new Intl.DateTimeFormat('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      clockEl.innerHTML = `<span class="header-date">${dateFormatter.format(now)}</span><span class="header-time">${timeFormatter.format(now)}</span>`;
    }
  } catch (err) {
    console.error("Error updating header clock:", err);
    // Bulletproof fallback in case Intl.DateTimeFormat is unsupported or fails
    try {
      const now = new Date();
      const lang = document.documentElement.getAttribute("lang") || "th";
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      if (lang === "th") {
        const yearBE = now.getFullYear() + 543;
        const daysTH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const monthsTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const dayName = daysTH[now.getDay()];
        const monthName = monthsTH[now.getMonth()];
        const dateStr = `${dayName} ${now.getDate()} ${monthName} ${yearBE}`;
        clockEl.innerHTML = `<span class="header-date">${dateStr}</span><span class="header-time">${hh}:${mm}:${ss} น.</span>`;
      } else {
        const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = daysEN[now.getDay()];
        const monthName = monthsEN[now.getMonth()];
        const dateStr = `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`;
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');
        clockEl.innerHTML = `<span class="header-date">${dateStr}</span><span class="header-time">${formattedHours}:${mm}:${ss} ${ampm}</span>`;
      }
    } catch (fallbackErr) {
      console.error("Clock fallback failed:", fallbackErr);
    }
  }
}

function initLangToggle() {
  const langToggleBtn = document.getElementById("langToggle");
  let currentLang = "th";
  try {
    currentLang = localStorage.getItem("lang") || "th";
  } catch (e) {
    console.warn("localStorage read blocked/failed:", e);
  }
  
  applyLang(currentLang);
  
  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      const currentElementLang = document.documentElement.getAttribute("lang") || "th";
      const nextLang = currentElementLang === "th" ? "en" : "th";
      try {
        localStorage.setItem("lang", nextLang);
      } catch (e) {
        console.warn("localStorage write blocked/failed:", e);
      }
      applyLang(nextLang);
    });
  }

  updateHeaderClock();
  setInterval(updateHeaderClock, 1000);
}

// Start initialization logic on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initHoverScan();
    initScrollReveal();
    initLangToggle();
  });
} else {
  initHoverScan();
  initScrollReveal();
  initLangToggle();
}




