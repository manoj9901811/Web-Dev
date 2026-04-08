/**
 * script.js — Lumière Studio
 *
 * Sections:
 *  1. Sticky Header (scroll-triggered, slide-in/out)
 *  2. Mobile Navigation (hamburger toggle)
 *  3. Image Carousel (drag + button navigation)
 *  4. Zoom-on-Hover (lens + preview panel)
 *  5. Scroll Reveal (IntersectionObserver)
 *  6. Contact Form (basic validation + feedback)
 *  7. Smooth Anchor Scroll
 *  8. Initialisation
 */

'use strict';

/* ─────────────────────────────────────────────
   1. STICKY HEADER
   Shows after scrolling past the first viewport;
   hides when user scrolls back toward the top.
───────────────────────────────────────────── */
function initStickyHeader() {
  const header     = document.getElementById('stickyHeader');
  const primaryNav = document.getElementById('primaryNav');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let isVisible   = false;
  let ticking     = false;
  const THRESHOLD = window.innerHeight;

  function updateHeader() {
    const currentY   = window.scrollY;
    const pastFold   = currentY > THRESHOLD;
    const scrollingUp = currentY < lastScrollY;
    const shouldShow = pastFold && (scrollingUp || currentY > THRESHOLD + 200);

    if (shouldShow !== isVisible) {
      isVisible = shouldShow;
      header.classList.toggle('is-visible', isVisible);
    }

    // Tint primary nav after 80px of scroll
    if (primaryNav) {
      if (currentY > 80) {
        primaryNav.style.background      = 'rgba(13,13,11,0.85)';
        primaryNav.style.backdropFilter  = 'blur(12px)';
      } else {
        primaryNav.style.background      = 'transparent';
        primaryNav.style.backdropFilter  = 'none';
      }
    }

    lastScrollY = currentY;
    ticking     = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   2. MOBILE NAVIGATION
───────────────────────────────────────────── */
function initMobileNav() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  function toggleMenu(open) {
    const isOpen = (open !== undefined) ? open : !hamburger.classList.contains('is-open');
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      mobileMenu.style.display = 'flex';
      requestAnimationFrame(() => mobileMenu.classList.add('is-open'));
    } else {
      mobileMenu.classList.remove('is-open');
      mobileMenu.addEventListener('transitionend', () => {
        if (!mobileMenu.classList.contains('is-open')) mobileMenu.style.display = '';
      }, { once: true });
    }

    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu());
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
}

/* ─────────────────────────────────────────────
   3. IMAGE CAROUSEL
   Supports: prev/next buttons, touch+mouse drag,
   dot navigation, keyboard arrows.
───────────────────────────────────────────── */
function initCarousel() {
  const track         = document.getElementById('carouselTrack');
  const prevBtn       = document.getElementById('carouselPrev');
  const nextBtn       = document.getElementById('carouselNext');
  const dotsContainer = document.getElementById('carouselDots');
  if (!track) return;

  const items        = Array.from(track.querySelectorAll('.carousel__item'));
  const count        = items.length;
  let currentIndex   = 0;

  // Build dots
  items.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll('.carousel__dot'));

  function getItemWidth() {
    if (!items[0]) return 0;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
    return items[0].offsetWidth + gap;
  }

  function goTo(index, instant) {
    currentIndex = Math.max(0, Math.min(index, count - 1));
    const offset = currentIndex * getItemWidth();

    if (instant) {
      track.style.transition = 'none';
    } else {
      track.style.transition = '';
    }
    track.style.transform = 'translateX(-' + offset + 'px)';

    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === currentIndex);
      d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === count - 1;
  }

  prevBtn && prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });

  // Drag support
  let pointerStart = 0;
  let isDragging   = false;
  let startOffset  = 0;

  function onDown(e) {
    isDragging   = true;
    pointerStart = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startOffset  = currentIndex * getItemWidth();
    track.style.transition = 'none';
    track.style.cursor = 'grabbing';
  }

  function onMove(e) {
    if (!isDragging) return;
    const x     = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const delta = pointerStart - x;
    track.style.transform = 'translateX(-' + (startOffset + delta) + 'px)';
  }

  function onUp(e) {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = '';
    const x     = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const delta = pointerStart - x;
    const threshold = getItemWidth() * 0.25;
    goTo(Math.abs(delta) > threshold ? (delta > 0 ? currentIndex + 1 : currentIndex - 1) : currentIndex);
  }

  track.addEventListener('mousedown',  onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup',   onUp);
  track.addEventListener('touchstart', onDown, { passive: true });
  track.addEventListener('touchmove',  onMove, { passive: true });
  track.addEventListener('touchend',   onUp);
  track.querySelectorAll('img').forEach(img => img.addEventListener('dragstart', e => e.preventDefault()));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goTo(currentIndex, true), 120);
  }, { passive: true });

  goTo(0);
}

/* ─────────────────────────────────────────────
   4. ZOOM ON HOVER
   Tracks cursor with a circular lens overlay and
   shows a magnified preview popup panel.
───────────────────────────────────────────── */
function initZoom() {
  var ZOOM_FACTOR = 3;

  document.querySelectorAll('[data-zoom]').forEach(function(wrap) {
    var img        = wrap.querySelector('img');
    var lens       = wrap.querySelector('.zoom-lens');
    var preview    = wrap.querySelector('.zoom-preview');
    var previewImg = wrap.querySelector('.zoom-preview__img');
    if (!img || !lens || !preview || !previewImg) return;

    wrap.addEventListener('mousemove', function(e) {
      var rect    = wrap.getBoundingClientRect();
      var imgRect = img.getBoundingClientRect();

      // Cursor position relative to image
      var x    = e.clientX - imgRect.left;
      var y    = e.clientY - imgRect.top;
      var imgW = imgRect.width;
      var imgH = imgRect.height;

      // Lens — position relative to wrap
      var lensX = e.clientX - rect.left;
      var lensY = e.clientY - rect.top;
      lens.style.left = lensX + 'px';
      lens.style.top  = lensY + 'px';

      // Fraction across image
      var fracX = Math.max(0, Math.min(x / imgW, 1));
      var fracY = Math.max(0, Math.min(y / imgH, 1));

      // Background position for zoom preview
      var previewSize = 220;
      var bgW  = imgW * ZOOM_FACTOR;
      var bgH  = imgH * ZOOM_FACTOR;
      var bgPX = fracX * bgW - previewSize / 2;
      var bgPY = fracY * bgH - previewSize / 2;

      previewImg.style.backgroundSize     = (ZOOM_FACTOR * 100) + '%';
      previewImg.style.backgroundPosition = '-' + bgPX + 'px -' + bgPY + 'px';

      // Position preview panel
      var panelW = 220;
      var rawLeft = lensX - panelW / 2;
      var clampLeft = Math.max(0, Math.min(rawLeft, rect.width - panelW));
      preview.style.left      = clampLeft + 'px';
      preview.style.translate = 'none';

      // Flip below if close to top of viewport
      if (imgRect.top < 260) {
        preview.style.top    = 'calc(100% + 16px)';
        preview.style.bottom = 'auto';
      } else {
        preview.style.bottom = 'calc(100% + 16px)';
        preview.style.top    = 'auto';
      }
    });
  });
}

/* ─────────────────────────────────────────────
   5. SCROLL REVEAL
───────────────────────────────────────────── */
function initScrollReveal() {
  var selectors = [
    '.section-header',
    '.work-card',
    '.about__text',
    '.about__visual',
    '.testimonial__inner',
    '.contact__text',
    '.contact__form',
  ];

  selectors.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(el) {
      el.classList.add('reveal');
    });
  });

  var statsRow = document.querySelector('.about__stats');
  if (statsRow) statsRow.classList.add('reveal-group');

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-group').forEach(function(el) {
    observer.observe(el);
  });
}

/* ─────────────────────────────────────────────
   6. CONTACT FORM
───────────────────────────────────────────── */
function initContactForm() {
  var form = document.querySelector('.contact__form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn   = form.querySelector('button[type="submit"]');
    var name  = (form.querySelector('#name')  || {}).value  || '';
    var email = (form.querySelector('#email') || {}).value  || '';
    var msg   = (form.querySelector('#message') || {}).value || '';

    if (!name.trim() || !email.trim() || !msg.trim()) {
      showFeedback(form, 'Please fill in all fields.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showFeedback(form, 'Please enter a valid email address.', 'error');
      return;
    }

    btn.textContent = 'Sending\u2026';
    btn.disabled    = true;

    setTimeout(function() {
      showFeedback(form, '\u2713 Message sent! We\u2019ll be in touch soon.', 'success');
      form.reset();
      btn.textContent = 'Send Message';
      btn.disabled    = false;
    }, 1200);
  });
}

function showFeedback(form, message, type) {
  var fb = form.querySelector('.form-feedback');
  if (!fb) {
    fb = document.createElement('p');
    fb.className = 'form-feedback';
    fb.style.cssText = [
      'font-size:0.85rem',
      'padding:0.75em 1em',
      'border-radius:2px',
      'margin-top:0.5rem',
      'transition:opacity 0.4s',
    ].join(';');
    form.appendChild(fb);
  }
  fb.textContent = message;
  fb.style.background = type === 'success' ? 'rgba(100,180,100,0.12)' : 'rgba(200,80,80,0.12)';
  fb.style.border     = '1px solid ' + (type === 'success' ? 'rgba(100,180,100,0.3)' : 'rgba(200,80,80,0.3)');
  fb.style.color      = type === 'success' ? '#8ecf8e' : '#cf8e8e';
  fb.style.opacity    = '1';
  setTimeout(function() { fb.style.opacity = '0'; }, 5000);
}

/* ─────────────────────────────────────────────
   7. SMOOTH ANCHOR SCROLL (with nav offset)
───────────────────────────────────────────── */
function initSmoothScroll() {
  var OFFSET = 72;
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var id     = link.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────
   8. INIT
───────────────────────────────────────────── */
function init() {
  initStickyHeader();
  initMobileNav();
  initCarousel();
  initZoom();
  initScrollReveal();
  initContactForm();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}