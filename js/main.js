/* ============================================================
   MADELYN JANZ PORTFOLIO — main.js
   Handles: nav scroll, hamburger, slideshow, scroll reveal,
            gallery lightbox, category page logic
   ============================================================ */

/* ---- Nav: scroll class + hamburger ---- */
(function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
})();

/* ---- Scroll reveal ---- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ---- Slideshow ---- */
(function initSlideshow() {
  const slideshow = document.querySelector('.slideshow');
  if (!slideshow) return;

  const slides = Array.from(slideshow.querySelectorAll('.slide'));
  const dots   = Array.from(slideshow.querySelectorAll('.slideshow__dot'));
  const nextBtn = slideshow.querySelector('.slideshow__next');

  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, 8000);
  }

  // Init
  goTo(0);
  startTimer();

  nextBtn?.addEventListener('click', () => { next(); startTimer(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startTimer(); });
  });

  // Touch/swipe support
  let touchStartX = 0;
  slideshow.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  slideshow.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); startTimer(); }
  }, { passive: true });
})();

/* ---- Lightbox ---- */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const mediaWrap = lightbox.querySelector('.lightbox__media-wrap');
  const closeBtn  = lightbox.querySelector('.lightbox__close');
  const prevBtn   = lightbox.querySelector('.lightbox__arrow--prev');
  const nextBtn   = lightbox.querySelector('.lightbox__arrow--next');
  const counter   = lightbox.querySelector('.lightbox__counter');

  let items = [];   // { src, type: 'image'|'video' }
  let current = 0;

  function openLightbox(galleryItems, startIndex) {
    items = galleryItems;
    current = startIndex;
    render();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    // Stop any playing video
    const vid = mediaWrap.querySelector('video');
    if (vid) vid.pause();
  }

  function render() {
    const item = items[current];
    if (!item) return;

    // Stop previous video
    const oldVid = mediaWrap.querySelector('video');
    if (oldVid) oldVid.pause();

    mediaWrap.innerHTML = '';

    if (item.type === 'video') {
      const vid = document.createElement('video');
      vid.src = item.src;
      vid.controls = true;
      vid.autoplay = true;
      vid.style.maxWidth = '90vw';
      vid.style.maxHeight = '88vh';
      mediaWrap.appendChild(vid);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || '';
      mediaWrap.appendChild(img);
    }

    if (counter) counter.textContent = `${current + 1} / ${items.length}`;
  }

  function goNext() { current = (current + 1) % items.length; render(); }
  function goPrev() { current = (current - 1 + items.length) % items.length; render(); }

  closeBtn?.addEventListener('click', closeLightbox);
  nextBtn?.addEventListener('click', goNext);
  prevBtn?.addEventListener('click', goPrev);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft')  goPrev();
  });

  // Touch/swipe in lightbox
  let touchX = 0;
  lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
  }, { passive: true });

  // Wire up gallery items on this page
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item[data-src]'));
  if (!galleryItems.length) return;

  const dataset = galleryItems.map(el => ({
    src:  el.dataset.src,
    type: el.dataset.type || 'image',
    alt:  el.dataset.alt  || ''
  }));

  galleryItems.forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(dataset, i));
  });

  // Expose for external use (e.g., dynamically added items)
  window.openLightbox = openLightbox;
})();
