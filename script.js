/**
 * Mangalam HDPE Pipes — Main JavaScript
 * Handles: sticky banner, sticky header, image carousel with zoom,
 *          applications slider, process tabs, testimonial auto-scroll,
 *          mobile hamburger menu.
 */

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const siteHeader      = document.getElementById('siteHeader');
const stickyBanner    = document.getElementById('stickyBanner');
const bannerClose     = document.getElementById('bannerClose');
const hamburger       = document.getElementById('hamburger');
const primaryNav      = document.getElementById('primaryNav');

// Hero carousel
const carouselStage   = document.getElementById('carouselStage');
const carouselPrev    = document.getElementById('carouselPrev');
const carouselNext    = document.getElementById('carouselNext');
const carouselThumbs  = document.getElementById('carouselThumbs');

// Applications slider
const appsTrack       = document.getElementById('appsTrack');
const appsPrev        = document.getElementById('appsPrev');
const appsNext        = document.getElementById('appsNext');

// Testimonials (auto-scroll via CSS animation — duplicate for seamless loop)
const testimonialsTrack = document.getElementById('testimonialsTrack');

/* ============================================================
   STICKY BANNER & HEADER
   ============================================================ */

let bannerVisible = false;
let bannerDismissed = false;
const BANNER_THRESHOLD = 80; // px scrolled before banner appears

/**
 * Update header position and banner visibility based on scroll position.
 * Banner appears after scrolling past the first fold.
 * Header shifts down to sit below the banner when banner is visible.
 */
function onScroll() {
  const scrollY = window.scrollY;

  // Scrolled state (shadow)
  siteHeader.classList.toggle('scrolled', scrollY > 10);

  // Show banner once user scrolls past threshold (and hasn't dismissed it)
  if (!bannerDismissed) {
    if (scrollY > BANNER_THRESHOLD && !bannerVisible) {
      stickyBanner.classList.add('visible');
      siteHeader.classList.add('banner-active');
      bannerVisible = true;
    } else if (scrollY <= BANNER_THRESHOLD && bannerVisible) {
      stickyBanner.classList.remove('visible');
      siteHeader.classList.remove('banner-active');
      bannerVisible = false;
    }
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // run once on page load

/* Dismiss banner */
bannerClose.addEventListener('click', () => {
  stickyBanner.classList.remove('visible');
  siteHeader.classList.remove('banner-active');
  bannerDismissed = true;
  bannerVisible = false;
});

/* ============================================================
   HAMBURGER / MOBILE MENU
   ============================================================ */
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
  primaryNav.classList.toggle('open', isOpen);
  // Prevent body scroll when menu is open
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

/* Close nav when a link inside it is clicked */
primaryNav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    primaryNav.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ============================================================
   HERO IMAGE CAROUSEL WITH ZOOM
   ============================================================ */
const slides = Array.from(carouselStage.querySelectorAll('.carousel-slide'));
const thumbBtns = Array.from(carouselThumbs.querySelectorAll('.thumb'));
let currentSlide = 0;
let autoplayTimer = null;

/**
 * Show a slide by index. Updates aria attributes and thumbnail states.
 * @param {number} idx - Target slide index
 */
function goToSlide(idx) {
  const prev = currentSlide;

  // Clamp index
  currentSlide = ((idx % slides.length) + slides.length) % slides.length;

  // Update slides
  slides[prev].classList.remove('active');
  slides[currentSlide].classList.add('active');

  // Update thumbnails
  thumbBtns[prev].classList.remove('active');
  thumbBtns[prev].setAttribute('aria-selected', 'false');
  thumbBtns[currentSlide].classList.add('active');
  thumbBtns[currentSlide].setAttribute('aria-selected', 'true');

  // Keep active thumb in view
  thumbBtns[currentSlide].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

/** Restart autoplay timer */
function restartAutoplay() {
  clearInterval(autoplayTimer);
  autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 4500);
}

// Arrow controls
carouselPrev.addEventListener('click', () => { goToSlide(currentSlide - 1); restartAutoplay(); });
carouselNext.addEventListener('click', () => { goToSlide(currentSlide + 1); restartAutoplay(); });

// Thumbnail controls
thumbBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    goToSlide(parseInt(btn.dataset.slide, 10));
    restartAutoplay();
  });
});

// Keyboard navigation for carousel
carouselStage.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft')  { goToSlide(currentSlide - 1); restartAutoplay(); }
  if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); restartAutoplay(); }
});

// Touch swipe support
(function setupSwipe() {
  let startX = 0;
  carouselStage.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
  carouselStage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? goToSlide(currentSlide + 1) : goToSlide(currentSlide - 1);
      restartAutoplay();
    }
  }, { passive: true });
})();

// Start autoplay
restartAutoplay();

/* ============================================================
   ZOOM EFFECT — tracks mouse position within each slide
   The CSS transforms the zoom-img based on --zoom-x / --zoom-y
   custom properties set here.
   ============================================================ */
slides.forEach((slide) => {
  slide.addEventListener('mousemove', (e) => {
    const rect = slide.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top)  / rect.height) * 100;
    slide.style.setProperty('--zoom-x', `${xPct}%`);
    slide.style.setProperty('--zoom-y', `${yPct}%`);
    // Apply transform-origin to zoom image so zoom follows cursor
    const zoomImg = slide.querySelector('.zoom-img');
    if (zoomImg) zoomImg.style.transformOrigin = `${xPct}% ${yPct}%`;
  });
});

/* ============================================================
   APPLICATIONS SLIDER
   ============================================================ */
(function setupAppsSlider() {
  const cardWidth   = 300; // must match CSS .app-card width
  const cardGap     = 20;
  const step        = cardWidth + cardGap;
  let appsOffset    = 0;
  const totalCards  = appsTrack.querySelectorAll('.app-card').length;
  const maxOffset   = (totalCards - 1) * step;

  appsNext.addEventListener('click', () => {
    if (appsOffset < maxOffset) {
      appsOffset += step;
    } else {
      appsOffset = 0; // loop back
    }
    appsTrack.style.transform = `translateX(-${appsOffset}px)`;
  });

  appsPrev.addEventListener('click', () => {
    if (appsOffset > 0) {
      appsOffset -= step;
    } else {
      appsOffset = maxOffset; // loop to end
    }
    appsTrack.style.transform = `translateX(-${appsOffset}px)`;
  });
})();

/* ============================================================
   PROCESS TABS
   ============================================================ */
(function setupProcessTabs() {
  const tabBtns   = document.querySelectorAll('.process-tab-btn');
  const tabPanels = document.querySelectorAll('.process-tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Update buttons
      tabBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panels
      tabPanels.forEach((panel) => {
        panel.classList.remove('active');
      });
      const targetPanel = document.querySelector(`[data-panel="${target}"]`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
})();

/* ============================================================
   TESTIMONIALS SEAMLESS AUTO-SCROLL
   Duplicates cards so the CSS marquee-style animation loops.
   ============================================================ */
(function setupTestimonialLoop() {
  if (!testimonialsTrack) return;
  // Clone all children for seamless infinite scroll
  const cards = Array.from(testimonialsTrack.children);
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    testimonialsTrack.appendChild(clone);
  });
})();

/* ============================================================
   SMOOTH SCROLL for anchor links (polyfill for older browsers)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');

    // ✅ STOP default jump for "#"
    if (href === "#") {
      e.preventDefault();
      return;
    }

    const targetId = href.slice(1);
    const target = document.getElementById(targetId);

    if (!target) return;

    e.preventDefault();

    const offsetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) -
      16;

    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  });
});
/* ============================================================
   CATALOGUE FORM — simple validation feedback
   ============================================================ */
(function setupCatalogueForm() {
  const form = document.querySelector('.catalogue-form');
  if (!form) return;
  const emailInput = form.querySelector('input[type="email"]');
  const submitBtn  = form.querySelector('.btn');

  submitBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.style.borderColor = '#ef4444';
      emailInput.focus();
      emailInput.placeholder = 'Please enter a valid email';
      return;
    }
    emailInput.style.borderColor = '';
    submitBtn.textContent = '✔ Sent!';
    submitBtn.disabled = true;
    emailInput.value = '';
    setTimeout(() => {
      submitBtn.textContent = 'Request Catalogue';
      submitBtn.disabled = false;
    }, 3000);
  });
})();

/* ============================================================
   CONTACT FORM — simple validation feedback
   ============================================================ */
(function setupContactForm() {
  const contactBtn = document.querySelector('.btn-dark.btn-full');
  if (!contactBtn) return;
  contactBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.contact-form-box .input-field');
    let valid = true;
    inputs.forEach((inp) => {
      if (!inp.value.trim()) {
        inp.style.borderColor = '#ef4444';
        valid = false;
      } else {
        inp.style.borderColor = '';
      }
    });
    if (valid) {
      contactBtn.textContent = '✔ Request Sent!';
      contactBtn.disabled = true;
      inputs.forEach((inp) => { inp.value = ''; });
      setTimeout(() => {
        contactBtn.textContent = 'Request Custom Quote';
        contactBtn.disabled = false;
      }, 3000);
    }
  });
})();

/* ============================================================
   INTERSECTION OBSERVER — animate sections on scroll
   ============================================================ */
(function setupScrollAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.55s ease, transform 0.55s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
    .reveal-delay-1 { transition-delay: 0.1s; }
    .reveal-delay-2 { transition-delay: 0.2s; }
    .reveal-delay-3 { transition-delay: 0.3s; }
    .reveal-delay-4 { transition-delay: 0.4s; }
    .reveal-delay-5 { transition-delay: 0.5s; }
  `;
  document.head.appendChild(style);

  // Add reveal classes to target elements
  const targets = document.querySelectorAll(
    '.feature-card, .faq-item, .portfolio-card, .app-card, .specs-table, .testimonial-card'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal', `reveal-delay-${(i % 5) + 1}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, { threshold: 0.12 });

  targets.forEach((el) => observer.observe(el));
})();