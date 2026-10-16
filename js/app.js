const opening = document.getElementById('opening');
const openingVideo = document.getElementById('openingVideo');
const sealButton = document.getElementById('sealButton');
const tapText = document.getElementById('tapText');
const invitation = document.getElementById('invitation');
const bgm = document.getElementById('bgm');
const floatingDecor = document.querySelector('.floating-decor');
const musicToggle = document.getElementById('musicToggle');
const musicLabel = document.getElementById('musicLabel');

let musicOn = true;
let openingStarted = false;


/* =========================================================
   MUSIC CONTROL
========================================================= */

function updateMusicControl() {
  if (!musicToggle) return;

  musicToggle.classList.toggle('off', !musicOn);
  musicToggle.setAttribute('aria-pressed', String(musicOn));
  musicToggle.setAttribute(
    'aria-label',
    musicOn ? 'Turn music off' : 'Turn music on'
  );

  if (musicLabel) {
    musicLabel.textContent = musicOn ? 'Music On' : 'Music Off';
  }
}


musicToggle?.addEventListener('click', async () => {

  if (musicOn) {

    bgm.pause();
    musicOn = false;

  } else {

    musicOn = true;

    try {
      await bgm.play();
    } catch (e) {
      musicOn = false;
    }

  }

  updateMusicControl();

});


updateMusicControl();



/* =========================================================
   ENTER WEDDING INVITATION
========================================================= */

function enterInvitation() {

  opening.classList.add('hide');

  invitation.classList.add('show');

  invitation.setAttribute('aria-hidden', 'false');

  floatingDecor.classList.add('active');

  if (musicToggle) {
    musicToggle.classList.add('visible');
  }

  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });

}



/* =========================================================
   OPENING VIDEO
   CLICK / TAP ANYWHERE TO PLAY
========================================================= */

function startOpening() {

  // Prevent multiple clicks from restarting the video
  if (openingStarted) return;

  openingStarted = true;


  // Disable old seal button
  if (sealButton) {
    sealButton.disabled = true;
  }


  // Hide tap text
  if (tapText) {
    tapText.style.opacity = '0';
    tapText.style.pointerEvents = 'none';
  }


  /* -------------------------
     START BACKGROUND MUSIC
  ------------------------- */

  try {

    bgm.loop = true;

    bgm.currentTime = 0;

    bgm.volume = 0.55;

    if (musicOn) {

      const musicPromise = bgm.play();

      if (musicPromise !== undefined) {

        musicPromise.catch(() => {
          // Browser may block audio in some situations
        });

      }

    }

  } catch (e) {

    console.log('Background music could not start:', e);

  }


  /* -------------------------
     START OPENING VIDEO
  ------------------------- */

  try {

    openingVideo.currentTime = 0;

    const videoPromise = openingVideo.play();

    if (videoPromise !== undefined) {

      videoPromise.catch((error) => {

        console.log('Opening video could not start:', error);

        // Allow another tap if playback failed
        openingStarted = false;

      });

    }

  } catch (e) {

    console.log('Opening video error:', e);

    openingStarted = false;

  }

}



/* =========================================================
   CLICK ANYWHERE ON OPENING SCREEN
========================================================= */

opening?.addEventListener('click', startOpening);



/* =========================================================
   TOUCH SUPPORT
========================================================= */

// Pointer event gives good mobile/tablet support.
// Click remains as the main activation event.

opening?.addEventListener('pointerdown', () => {

  if (!openingStarted) {
    startOpening();
  }

});



/* =========================================================
   KEYBOARD ACCESSIBILITY
========================================================= */

opening?.addEventListener('keydown', (e) => {

  if (e.key === 'Enter' || e.key === ' ') {

    e.preventDefault();

    startOpening();

  }

});



/* =========================================================
   WHEN OPENING VIDEO FINISHES
========================================================= */

openingVideo?.addEventListener('ended', enterInvitation);



/* =========================================================
   EVENT VIDEOS
   AUTOPLAY WHEN VISIBLE
========================================================= */

const videoObserver =
  new IntersectionObserver(
    entries => {

      entries.forEach(
        entry => {

          const video =
            entry.target;


          if (
            entry.isIntersecting
          ) {

            video.muted = true;

            video.loop = true;

            video
              .play()
              .catch(() => {});

          } else {

            video.pause();

          }

        }
      );

    },
    {
      threshold: 0.45
    }
  );



document
  .querySelectorAll(
    '.lazy-video'
  )
  .forEach(
    video =>
      videoObserver.observe(video)
  );



/* =========================================================
   SECTION SCROLL REVEAL
========================================================= */

const revealObserver =
  new IntersectionObserver(
    entries => {

      entries.forEach(
        entry => {

          if (
            entry.isIntersecting
          ) {

            entry.target
              .classList
              .add('in-view');

          }

        }
      );

    },
    {
      threshold: 0.12
    }
  );



document
  .querySelectorAll(
    '.reveal'
  )
  .forEach(
    element =>
      revealObserver.observe(
        element
      )
  );

/* =========================================================
   VENUE MAP + WISHES
   Everything below lives inside one function so it can't
   clash with the variables above.
========================================================= */

(() => {

  /* ---------------------------------------------------------
     SETTINGS
     Paste your Google Apps Script web-app URL here to collect
     wishes from every guest (see README.md, step by step).
     Left empty, wishes are only saved on the visitor's own
     device, which is fine for previewing the design.
  --------------------------------------------------------- */
  const WISHES_ENDPOINT = '';

  /* ---------------------------------------------------------
     EMAIL
     Quickest option: put the couple's email here and every
     wish is mailed to it through FormSubmit.co (free; the very
     first wish triggers one confirmation email you must click).
     Do NOT fill this if you use the Apps Script above, which
     already emails you (set NOTIFY_EMAIL in Code.gs).
  --------------------------------------------------------- */
  const WISHES_EMAIL = '';

  const VENUE = {
    name: 'Kurinjii Mahal',
    address: 'Kurinjii Mahal, Muthanampalayam, Tiruppur',
    query: 'Kurinjii Mahal Muthanampalayam Tiruppur',
    link: 'https://maps.app.goo.gl/NVXcCCZq2K7c6fYa9?g_st=aw'
  };

  const STICKERS = ['🌸', '💐', '✨', '❤️', '🙏', '🎊', '🪔'];
  const WISH_STORE = 'rt-wedding-wishes-v1';
  const WISH_LAST = 'rt-wedding-wish-last';
  const WISH_PAGE = 6;
  const WISH_COOLDOWN = 20000;

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wait = ms =>
    new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms));


  /* ---------------------------------------------------------
     TOAST
  --------------------------------------------------------- */

  const toastEl = document.getElementById('toast');
  let toastTimer;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }


  /* ---------------------------------------------------------
     MAP: load the live map only when the guest taps it
  --------------------------------------------------------- */

  const mapFrame = document.getElementById('mapFrame');
  const mapFacade = document.getElementById('mapFacade');
  const copyAddress = document.getElementById('copyAddress');
  const shareWhatsapp = document.getElementById('shareWhatsapp');

  mapFacade?.addEventListener('click', () => {

    mapFacade.disabled = true;

    const cta = mapFacade.querySelector('.map-facade-cta');
    if (cta) cta.textContent = 'Loading map…';

    const iframe = document.createElement('iframe');
    iframe.title = `Map showing ${VENUE.address}`;
    iframe.src =
      `https://maps.google.com/maps?q=${encodeURIComponent(VENUE.query)}&z=16&output=embed`;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;

    iframe.addEventListener('load', () => mapFacade.remove());

    mapFrame.appendChild(iframe);

  });


  copyAddress?.addEventListener('click', async () => {

    try {

      await navigator.clipboard.writeText(VENUE.address);

    } catch (err) {

      const temp = document.createElement('textarea');
      temp.value = VENUE.address;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();

      try { document.execCommand('copy'); } catch (e) {}

      temp.remove();

    }

    showToast('Address copied');

  });


  if (shareWhatsapp) {

    const text =
      `Ramesh Kumar & Tamil Selvi's wedding\n` +
      `Reception: Sat 14 Nov, 7:45 PM\n` +
      `Wedding: Sun 15 Nov, 7:45 AM\n` +
      `${VENUE.address}\n${VENUE.link}`;

    shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(text)}`;

  }


  /* ---------------------------------------------------------
     WISHES: elements
  --------------------------------------------------------- */

  const wishCard = document.getElementById('wishCard');
  const wishForm = document.getElementById('wishForm');
  const wishName = document.getElementById('wishName');
  const wishRelation = document.getElementById('wishRelation');
  const wishMessage = document.getElementById('wishMessage');
  const wishCount = document.getElementById('wishCount');
  const wishError = document.getElementById('wishError');
  const wishSend = document.getElementById('wishSend');
  const wishSendLabel = document.getElementById('wishSendLabel');
  const wishThanks = document.getElementById('wishThanks');
  const thanksTitle = document.getElementById('thanksTitle');
  const thanksSticker = document.getElementById('thanksSticker');
  const seeWish = document.getElementById('seeWish');
  const writeAnother = document.getElementById('writeAnother');
  const wishWall = document.getElementById('wishWall');
  const wishWallHead = document.getElementById('wishWallHead');
  const wishTotal = document.getElementById('wishTotal');
  const wishMore = document.getElementById('wishMore');
  const wishBurst = document.getElementById('wishBurst');

  if (!wishForm || !wishWall) return;

  let wishes = [];
  let shown = WISH_PAGE;


  /* ---------------------------------------------------------
     WISHES: helpers
  --------------------------------------------------------- */

  function cleanText(value, max) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function makeId() {
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function readLocal() {
    try {
      const list = JSON.parse(localStorage.getItem(WISH_STORE) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocal(wish) {
    try {
      localStorage.setItem(
        WISH_STORE,
        JSON.stringify([wish, ...readLocal()].slice(0, 50))
      );
    } catch (e) {}
  }

  function normalize(raw) {

    if (!raw) return null;

    const name = cleanText(raw.name, 40);
    const message = cleanText(raw.message, 300);

    if (!name || !message) return null;

    return {
      id: String(raw.id || makeId()).slice(0, 64),
      name,
      relation: cleanText(raw.relation, 20),
      sticker: STICKERS.includes(raw.sticker) ? raw.sticker : '🌸',
      message,
      ts: Number(raw.ts) || 0
    };

  }


  /* ---------------------------------------------------------
     WISHES: wall
  --------------------------------------------------------- */

  const noteObserver = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        noteObserver.unobserve(entry.target);
      }

    });

  }, { threshold: 0.15 });


  function buildNote(wish, index, stagger, fresh) {

    const variant = [...wish.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 4;

    const note = document.createElement('article');
    note.className = `wish-note v${variant}` + (fresh ? ' fresh' : '');
    note.style.setProperty('--tilt', index % 3 === 2 ? '0deg' : (index % 2 ? '.6deg' : '-.6deg'));
    note.style.setProperty('--d', `${stagger * 0.08}s`);
    note.dataset.id = wish.id;

    const sticker = document.createElement('span');
    sticker.className = 'wish-sticker';
    sticker.setAttribute('aria-hidden', 'true');
    sticker.textContent = wish.sticker;

    const head = document.createElement('div');
    head.className = 'wish-head';

    const avatar = document.createElement('span');
    avatar.className = 'wish-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = ([...wish.name][0] || '♥').toUpperCase();

    const who = document.createElement('div');
    who.className = 'wish-who';

    const name = document.createElement('span');
    name.className = 'wish-name';
    name.textContent = wish.name;
    who.appendChild(name);

    if (wish.relation) {
      const tag = document.createElement('span');
      tag.className = 'wish-tag';
      tag.textContent = wish.relation;
      who.appendChild(tag);
    }

    head.append(avatar, who);

    const text = document.createElement('p');
    text.textContent = wish.message;

    note.append(sticker, head, text);

    noteObserver.observe(note);

    return note;

  }


  function updateWallMeta() {

    const total = wishes.length;

    wishTotal.textContent =
      total ? `${total} ${total === 1 ? 'wish' : 'wishes'}` : '';

    wishMore.hidden = shown >= total;

  }


  function renderWall() {

    wishWall.textContent = '';

    if (!wishes.length) {

      const empty = document.createElement('p');
      empty.className = 'wish-empty';
      empty.textContent = 'No wishes yet. Yours can be the first.';
      wishWall.appendChild(empty);

    } else {

      wishes.slice(0, shown).forEach((wish, i) => {
        wishWall.appendChild(buildNote(wish, i, i % WISH_PAGE));
      });

    }

    updateWallMeta();

  }


  function showMoreWishes() {

    const from = shown;
    shown += WISH_PAGE;

    wishes.slice(from, shown).forEach((wish, i) => {
      wishWall.appendChild(buildNote(wish, from + i, i));
    });

    updateWallMeta();

  }


  function addFreshWish(wish) {

    wishes.unshift(wish);
    shown += 1;

    wishWall.querySelector('.wish-empty')?.remove();
    wishWall.prepend(buildNote(wish, 0, 0, true));

    updateWallMeta();

  }


  async function loadWishes() {

    let remote = [];

    if (WISHES_ENDPOINT) {

      try {

        const res = await fetch(`${WISHES_ENDPOINT}?t=${Date.now()}`);
        const data = await res.json();

        remote = Array.isArray(data.wishes) ? data.wishes : [];

      } catch (e) {

        console.warn('Could not load wishes:', e);

      }

    }

    const ids = new Set(remote.map(w => String(w.id)));
    const local = readLocal().filter(w => !ids.has(String(w.id)));

    wishes = [...remote, ...local]
      .map(normalize)
      .filter(Boolean)
      .sort((a, b) => b.ts - a.ts);

    renderWall();

  }


  wishMore.addEventListener('click', showMoreWishes);


  /* ---------------------------------------------------------
     WISHES: form behaviour
  --------------------------------------------------------- */

  function updateCount() {
    wishCount.textContent = `${wishMessage.value.length} / 300`;
  }

  wishMessage.addEventListener('input', () => {
    updateCount();
    clearError();
  });

  wishName.addEventListener('input', clearError);


  function clearError() {
    wishError.textContent = '';
    wishForm.querySelectorAll('.field.invalid')
      .forEach(f => f.classList.remove('invalid'));
  }

  function fail(input, message) {

    const field = input.closest('.field');

    wishError.textContent = message;
    field.classList.add('invalid');

    field.classList.remove('shake');
    void field.offsetWidth;
    field.classList.add('shake');

    input.focus();

  }


  document.querySelectorAll('.chip').forEach(chip => {

    chip.addEventListener('click', () => {

      const current = wishMessage.value.trim();
      const next = current ? `${current} ${chip.dataset.text}` : chip.dataset.text;

      if (next.length > 300) {
        showToast('Message is full');
        return;
      }

      wishMessage.value = next;
      updateCount();
      clearError();

      chip.classList.remove('added');
      void chip.offsetWidth;
      chip.classList.add('added');

    });

  });


  function sparkBurst(cx, cy, count) {

    if (reduceMotion || !wishBurst) return;

    const glyphs = ['♥', '✦', '✿', '✧', '🌸', '✨', '♥'];
    const pieces = [];

    for (let i = 0; i < count; i++) {

      const piece = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 190;

      piece.className = 'burst-piece';
      piece.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      piece.style.left = `${cx}px`;
      piece.style.top = `${cy}px`;
      piece.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
      piece.style.setProperty('--y', `${Math.sin(angle) * dist + 50}px`);
      piece.style.setProperty('--r', `${Math.random() * 540 - 270}deg`);
      piece.style.setProperty('--d', `${1.4 + Math.random() * 1.2}s`);
      piece.style.setProperty('--delay', `${Math.random() * 0.15}s`);

      wishBurst.appendChild(piece);
      pieces.push(piece);

    }

    setTimeout(() => pieces.forEach(p => p.remove()), 3200);

  }


  async function postWish(wish) {

    const jobs = [];

    if (WISHES_ENDPOINT) {

      // Apps Script accepts text/plain without a CORS preflight.
      jobs.push(
        fetch(WISHES_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(wish)
        })
      );

    }

    if (WISHES_EMAIL) {

      jobs.push(
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(WISHES_EMAIL)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `New wedding wish from ${wish.name}`,
            _template: 'table',
            _captcha: 'false',
            Name: wish.name,
            Relation: wish.relation || '-',
            Sticker: wish.sticker,
            Wish: wish.message
          })
        }).then(res => {
          if (!res.ok) throw new Error('email failed');
        })
      );

    }

    if (jobs.length) {

      const results = await Promise.allSettled(jobs);

      if (!results.some(r => r.status === 'fulfilled')) return false;

    }

    saveLocal(wish);

    return true;

  }


  wishForm.addEventListener('submit', async e => {

    e.preventDefault();

    // Hidden field only bots fill in
    if (wishForm.elements.website.value) return;

    clearError();

    const name = cleanText(wishName.value, 40);
    const message = cleanText(wishMessage.value, 300);
    const relation = cleanText(wishRelation.value, 20);
    const sticker = STICKERS.includes(wishForm.elements.sticker.value)
      ? wishForm.elements.sticker.value
      : '🌸';

    if (!name) {
      fail(wishName, 'Please add your name.');
      return;
    }

    if (message.length < 3) {
      fail(wishMessage, 'Write a few words for the couple.');
      return;
    }

    let last = 0;
    try { last = Number(localStorage.getItem(WISH_LAST)) || 0; } catch (err) {}

    if (Date.now() - last < WISH_COOLDOWN) {
      fail(wishMessage, 'Please wait a few seconds before sending another wish.');
      return;
    }

    const wish = { id: makeId(), name, relation, sticker, message, ts: Date.now() };

    wishSend.disabled = true;
    wishSendLabel.textContent = 'Sending…';

    wishCard.style.minHeight = `${wishCard.offsetHeight}px`;
    wishCard.classList.add('sealing');

    const sending = postWish(wish);

    await wait(1000);

    const rect = wishCard.getBoundingClientRect();
    sparkBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 46);

    const ok = await sending;

    await wait(600);

    wishCard.classList.remove('sealing');

    if (!ok) {

      wishCard.style.minHeight = '';
      wishSend.disabled = false;
      wishSendLabel.textContent = 'Send Wishes';
      fail(wishMessage, 'Could not send right now. Check your connection and try again.');
      return;

    }

    try { localStorage.setItem(WISH_LAST, String(Date.now())); } catch (err) {}

    thanksTitle.textContent = `Thank you, ${name}`;
    thanksSticker.textContent = sticker;
    wishForm.hidden = true;
    wishThanks.hidden = false;
    wishCard.classList.add('done');

    addFreshWish(wish);

  });


  writeAnother.addEventListener('click', () => {

    wishMessage.value = '';
    wishRelation.value = '';
    updateCount();

    wishThanks.hidden = true;
    wishForm.hidden = false;
    wishCard.classList.remove('done');
    wishCard.style.minHeight = '';

    wishSend.disabled = false;
    wishSendLabel.textContent = 'Send Wishes';

    wishMessage.focus({ preventScroll: true });

  });


  seeWish.addEventListener('click', () => {

    wishWallHead.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });

  });


  updateCount();
  loadWishes();

})();



/* =========================================================
   GALLERY + LIGHTBOX
========================================================= */

(() => {

  const grid = document.getElementById('galleryGrid');
  const box = document.getElementById('lightbox');

  if (!grid || !box) return;

  const lbImg = document.getElementById('lbImg');
  const lbCount = document.getElementById('lbCount');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const root = document.documentElement;

  let current = 0;
  let opener = null;
  let swapTimer;


  // Lightbox follows what the guest sees on screen: top to bottom, left to right
  const items = () => [...grid.querySelectorAll('.gallery-item')].sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : ra.left - rb.left;
  });


  /* Use each photo's real shape, and drop any file that is missing */

  function prepare(item) {

    const img = item.querySelector('img');

    const ready = () => {

      if (img.naturalWidth && img.naturalHeight) {
        item.style.setProperty(
          '--ar',
          (img.naturalWidth / img.naturalHeight).toFixed(4)
        );
      }

      // Photos marked data-auto choose portrait or landscape from the real file
      if (item.hasAttribute('data-auto') && img.naturalWidth && img.naturalHeight) {
        const land = img.naturalWidth / img.naturalHeight > 1.1;
        item.classList.toggle('is-land', land);
        item.classList.toggle('is-port', !land);
      }

      item.classList.add('loaded');

    };

    if (img.complete) {
      img.naturalWidth ? ready() : item.remove();
      return;
    }

    img.addEventListener('load', ready, { once: true });
    img.addEventListener('error', () => item.remove(), { once: true });

  }

  items().forEach(prepare);


  /* Lightbox */

  function show(index) {

    const list = items();

    if (!list.length) return;

    current = (index + list.length) % list.length;

    const src = list[current].querySelector('img');

    clearTimeout(swapTimer);
    lbImg.classList.add('swap');

    swapTimer = setTimeout(() => {

      lbImg.src = src.currentSrc || src.src;
      lbImg.alt = src.alt;
      lbImg.classList.remove('swap');

    }, 120);

    lbCount.textContent =
      `${String(current + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;

    const multiple = list.length > 1;
    lbPrev.hidden = !multiple;
    lbNext.hidden = !multiple;

    // Warm the neighbours so next/previous feels instant
    [current - 1, current + 1].forEach(i => {
      const n = list[(i + list.length) % list.length].querySelector('img');
      new Image().src = n.currentSrc || n.src;
    });

  }


  function open(index, trigger) {

    opener = trigger || null;

    box.hidden = false;
    root.classList.add('lb-open');

    lbImg.classList.remove('swap');
    show(index);

    requestAnimationFrame(() => box.classList.add('open'));

    lbClose.focus({ preventScroll: true });

  }


  function close() {

    box.classList.remove('open');
    root.classList.remove('lb-open');

    setTimeout(() => { box.hidden = true; }, 300);

    if (opener) opener.focus({ preventScroll: true });

  }


  grid.addEventListener('click', e => {

    const item = e.target.closest('.gallery-item');

    if (item) open(items().indexOf(item), item);

  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => show(current - 1));
  lbNext.addEventListener('click', () => show(current + 1));

  // Tap the dark area around the photo to close
  box.addEventListener('click', e => {
    if (e.target === box) close();
  });


  document.addEventListener('keydown', e => {

    if (box.hidden) return;

    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {

      // Keep keyboard focus inside the viewer
      const focusable = [lbClose, lbPrev, lbNext].filter(b => !b.hidden);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }

    }

  });


  /* Swipe left / right on touch screens */

  let touchX = null;

  box.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
  }, { passive: true });

  box.addEventListener('touchend', e => {

    if (touchX === null) return;

    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;

    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));

  }, { passive: true });

})();



/* =========================================================
   WEDDING COUNTDOWN
   Muhurtham: Sunday 15 November 2026, 7:45 AM IST
========================================================= */

(() => {

  const target = new Date('2026-11-15T07:45:00+05:30').getTime();

  const parts = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    mins: document.getElementById('mins'),
    secs: document.getElementById('secs')
  };

  const done = document.getElementById('countdownDone');
  const box = document.getElementById('countdown');

  if (!parts.days || !box) return;

  const pad = n => String(n).padStart(2, '0');

  function tick() {

    let diff = Math.max(0, target - Date.now());

    const d = Math.floor(diff / 86400000); diff %= 86400000;
    const h = Math.floor(diff / 3600000);  diff %= 3600000;
    const m = Math.floor(diff / 60000);    diff %= 60000;
    const s = Math.floor(diff / 1000);

    parts.days.textContent = pad(d);
    parts.hours.textContent = pad(h);
    parts.mins.textContent = pad(m);
    parts.secs.textContent = pad(s);

    if (target - Date.now() <= 0) {
      done.hidden = false;
      clearInterval(timer);
    }

  }

  const timer = setInterval(tick, 1000);
  tick();

})();


/* =========================================================
   SAVE THE DATE
   - the picture fades in when the section opens
   - scratch the plate to reveal the date and the countdown
========================================================= */

(() => {

  const section = document.getElementById('saveDate');

  if (!section) return;

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------------------------------------------------------
     PICTURE
     Fades in the first time the section scrolls into view
  --------------------------------------------------------- */

  const photoObserver = new IntersectionObserver(entries => {

    if (entries[0].isIntersecting) {
      section.classList.add('photo-open');
      photoObserver.disconnect();
    }

  }, { threshold: 0.3 });

  photoObserver.observe(section);


  /* ---------------------------------------------------------
     SCRATCH TO REVEAL
  --------------------------------------------------------- */

  const plate = document.getElementById('sdPlate');
  const canvas = document.getElementById('sdScratch');
  const confetti = document.getElementById('sdConfetti');

  if (!plate || !canvas) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let dpr = 1;
  let drawing = false;
  let last = null;
  let revealed = false;
  let lastCheck = 0;
  let paintedWidth = 0;

  function paintCover() {

    const rect = plate.getBoundingClientRect();

    if (!rect.width) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    paintedWidth = rect.width;

    const w = canvas.width;
    const h = canvas.height;

    ctx.globalCompositeOperation = 'source-over';

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e9cf9f');
    g.addColorStop(.5, '#f6e3bd');
    g.addColorStop(1, '#e4c78f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // fine foil speckle
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = Math.random() > .5
        ? 'rgba(255,255,255,.35)'
        : 'rgba(150,105,40,.18)';
      ctx.fillRect(Math.random() * w, Math.random() * h, dpr * 1.4, dpr * 1.4);
    }

    ctx.strokeStyle = 'rgba(160,115,40,.55)';
    ctx.lineWidth = dpr;
    ctx.strokeRect(7 * dpr, 7 * dpr, w - 14 * dpr, h - 14 * dpr);

    ctx.fillStyle = '#7a5a2a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `600 ${12 * dpr}px Montserrat, 'Segoe UI', sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${3 * dpr}px`;
    ctx.fillText('SCRATCH TO REVEAL', w / 2, h / 2 - 8 * dpr);

    ctx.font = `italic 500 ${15 * dpr}px 'Cormorant Garamond', Georgia, serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillText('swipe across the card', w / 2, h / 2 + 14 * dpr);

  }

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
    .then(paintCover);

  paintCover();

  new ResizeObserver(() => {

    if (revealed || drawing) return;

    if (Math.abs(plate.getBoundingClientRect().width - paintedWidth) > 1) paintCover();

  }).observe(plate);


  function point(e) {

    const r = canvas.getBoundingClientRect();

    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };

  }

  function scratch(from, to) {

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 40 * dpr;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

  }

  function clearedShare() {

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    let total = 0;

    for (let i = 3; i < data.length; i += 64) {
      total++;
      if (data[i] < 40) clear++;
    }

    return clear / total;

  }

  canvas.addEventListener('pointerdown', e => {

    if (revealed) return;

    drawing = true;
    last = point(e);

    scratch(last, { x: last.x + .1, y: last.y });

    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}

  });

  canvas.addEventListener('pointermove', e => {

    if (!drawing || revealed) return;

    const p = point(e);

    scratch(last, p);
    last = p;

    const now = performance.now();

    if (now - lastCheck > 160) {
      lastCheck = now;
      if (clearedShare() > .42) reveal();
    }

  });

  const stop = () => {

    if (!drawing) return;

    drawing = false;

    if (!revealed && clearedShare() > .42) reveal();

  };

  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  // Keyboard users can reveal with Enter or Space
  canvas.addEventListener('keydown', e => {

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      reveal();
    }

  });


  function reveal() {

    if (revealed) return;

    revealed = true;
    drawing = false;

    section.classList.add('is-revealed');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;

    petals();

  }


  function petals() {

    if (reduceMotion || !confetti) return;

    const s = section.getBoundingClientRect();
    const p = plate.getBoundingClientRect();

    const cx = p.left - s.left + p.width / 2;
    const cy = p.top - s.top + p.height / 2;

    const glyphs = ['✿', '❀', '✦', '❁', '•', '✧'];
    const colors = ['#e9709a', '#f4a5be', '#e8b53a', '#d4466f', '#f3c340', '#b8863a'];

    const pieces = [];

    for (let i = 0; i < 70; i++) {

      const piece = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 190;

      piece.className = 'sd-petal';
      piece.textContent = glyphs[i % glyphs.length];
      piece.style.left = `${cx}px`;
      piece.style.top = `${cy}px`;
      piece.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      piece.style.setProperty('--dy', `${Math.sin(angle) * dist * .6 + 120 + Math.random() * 160}px`);
      piece.style.setProperty('--r', `${Math.random() * 600 - 300}deg`);
      piece.style.setProperty('--s', `${12 + Math.random() * 14}px`);
      piece.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
      piece.style.setProperty('--d', `${2.2 + Math.random() * 1.8}s`);
      piece.style.setProperty('--dl', `${Math.random() * .35}s`);

      confetti.appendChild(piece);
      pieces.push(piece);

    }

    setTimeout(() => pieces.forEach(el => el.remove()), 4600);

  }

})();
