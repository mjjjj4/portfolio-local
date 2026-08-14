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
  const durations = [6000, 6000];

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
    clearTimeout(timer);
    timer = setTimeout(function() { next(); startTimer(); }, durations[current] ?? 6000);
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

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Prev/next arrows and the "X / Y" counter don't belong over a video:
    // arrows collide with the native scrub bar and swipe-to-seek, and
    // counting through a single video makes no sense.
    lightbox.classList.toggle('lightbox--video', item.type === 'video');

    if (item.type === 'video') {
      const vid = document.createElement('video');
      vid.src = item.src;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true; // keep playback in-page so OUR fill/zoom applies,
                               // instead of iOS handing off to its native player
      vid.style.maxWidth = '90vw';
      vid.style.maxHeight = '88vh';
      mediaWrap.appendChild(vid);

      // On mobile: default to a cropped, screen-filling view (like pinching
      // a video to zoom in), with a toggle to go back to seeing the whole
      // frame letterboxed. iOS's native fullscreen player has this same
      // fit/fill toggle built in via pinch/double-tap, but there's no API to
      // set which one it starts in — so instead of handing off to native
      // fullscreen, we fill the lightbox itself and control the mode here.
      if (isMobile) {
        let filled = true;

        const zoomBtn = document.createElement('button');
        zoomBtn.type = 'button';
        zoomBtn.className = 'lightbox__zoom-toggle';

        function applyFill(state) {
          filled = state;
          mediaWrap.classList.toggle('lightbox__media-wrap--fill', filled);
          vid.classList.toggle('lightbox__video--cover', filled);
          zoomBtn.setAttribute('aria-label', filled ? 'Zoom out to see full video' : 'Zoom in to fill screen');
          zoomBtn.innerHTML = filled
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16" y2="16"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16" y2="16"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>';
        }

        zoomBtn.addEventListener('click', e => {
          e.stopPropagation();
          applyFill(!filled);
        });

        mediaWrap.appendChild(zoomBtn);
        applyFill(true);
      }
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
