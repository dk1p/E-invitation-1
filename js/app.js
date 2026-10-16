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
   SAVE THE DATE: scratch-to-reveal + live countdown
   Target date/time is the data-target attribute on
   #countdown in index.html (ISO format, with timezone).
========================================================= */

(() => {

  const section = document.getElementById('countdown');
  const plaque = document.getElementById('cdPlaque');
  const canvas = document.getElementById('cdScratch');
  const confettiCanvas = document.getElementById('cdConfetti');
  const timer = document.getElementById('cdTimer');
  const note = document.getElementById('cdNote');

  if (!section || !plaque || !canvas || !timer) return;

  const target = new Date(section.dataset.target).getTime();
  if (!Number.isFinite(target)) return;

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const units = {
    days: document.getElementById('cdDays'),
    hours: document.getElementById('cdHours'),
    mins: document.getElementById('cdMins'),
    secs: document.getElementById('cdSecs')
  };

  const ctx = canvas.getContext('2d');
  const CELL = 12;          // coverage grid size (px)
  const REVEAL_AT = 0.5;    // share of the foil to scratch before it clears

  let w = 0, h = 0, cols = 0, rows = 0, cells, covered = 0;
  let brush = 24;
  let revealed = false, drawing = false, last = null, tickId;


  /* ---------------------------------------------------------
     FOIL
  --------------------------------------------------------- */

  function paintFoil() {

    w = plaque.offsetWidth;
    h = plaque.offsetHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e6c27a');
    g.addColorStop(.25, '#f8e7bd');
    g.addColorStop(.5, '#d9b565');
    g.addColorStop(.75, '#f4dca5');
    g.addColorStop(1, '#cfa755');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 1;
    for (let x = -h; x < w; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.stroke();
    }

    for (let i = 0, n = Math.round(w * h / 60); i < n; i++) {
      ctx.fillStyle = Math.random() < .5
        ? 'rgba(255,255,255,.22)'
        : 'rgba(120,80,20,.10)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
    }

    const cx = w / 2, cy = h / 2, rad = Math.min(h * .42, 56);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    glow.addColorStop(0, 'rgba(255,244,214,.9)');
    glow.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6b4a32';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 11px Montserrat, sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillText('\u273F', cx, cy - 20);
    ctx.fillText('SCRATCH TO', cx, cy - 4);
    ctx.fillText('REVEAL', cx, cy + 12);

    brush = Math.max(18, h * .2);
    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
    cells = new Uint8Array(cols * rows);
    covered = 0;
  }


  /* ---------------------------------------------------------
     SCRATCHING
  --------------------------------------------------------- */

  function mark(x, y) {

    const x0 = Math.max(0, Math.floor((x - brush) / CELL));
    const x1 = Math.min(cols - 1, Math.floor((x + brush) / CELL));
    const y0 = Math.max(0, Math.floor((y - brush) / CELL));
    const y1 = Math.min(rows - 1, Math.floor((y + brush) / CELL));

    for (let r = y0; r <= y1; r++) {
      for (let c = x0; c <= x1; c++) {

        const i = r * cols + c;
        if (cells[i]) continue;

        const dx = c * CELL + CELL / 2 - x;
        const dy = r * CELL + CELL / 2 - y;

        if (dx * dx + dy * dy <= brush * brush) {
          cells[i] = 1;
          covered++;
        }

      }
    }
  }

  function scratch(from, to) {

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brush * 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (brush / 2)));

    for (let s = 1; s <= steps; s++) {
      mark(
        from.x + (to.x - from.x) * s / steps,
        from.y + (to.y - from.y) * s / steps
      );
    }

    if (covered / cells.length >= REVEAL_AT) reveal();
  }

  const point = e => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener('pointerdown', e => {
    if (revealed) return;
    drawing = true;
    last = point(e);
    canvas.setPointerCapture?.(e.pointerId);
    scratch(last, last);
  });

  canvas.addEventListener('pointermove', e => {
    if (!drawing || revealed) return;
    const p = point(e);
    scratch(last, p);
    last = p;
  });

  const stop = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  // Keyboard users can reveal without scratching
  canvas.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      reveal();
    }
  });


  /* ---------------------------------------------------------
     REVEAL
  --------------------------------------------------------- */

  function reveal() {

    if (revealed) return;
    revealed = true;
    drawing = false;

    plaque.classList.add('is-revealed');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    setTimeout(() => { canvas.hidden = true; }, reduceMotion ? 0 : 1000);

    launchConfetti();

    setTimeout(() => {
      timer.classList.add('is-on');
      tick();
      tickId = setInterval(tick, 1000);
    }, reduceMotion ? 0 : 450);
  }


  /* ---------------------------------------------------------
     COUNTDOWN
  --------------------------------------------------------- */

  function setUnit(el, value) {

    const text = String(value).padStart(2, '0');
    if (el.textContent === text) return;

    el.textContent = text;

    if (!reduceMotion && el.animate) {
      el.animate(
        [
          { opacity: .25, transform: 'translateY(-5px)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: 280, easing: 'ease-out' }
      );
    }
  }

  function tick() {

    const diff = Math.max(0, target - Date.now());

    setUnit(units.days, Math.floor(diff / 864e5));
    setUnit(units.hours, Math.floor(diff / 36e5) % 24);
    setUnit(units.mins, Math.floor(diff / 6e4) % 60);
    setUnit(units.secs, Math.floor(diff / 1e3) % 60);

    if (diff === 0) {
      clearInterval(tickId);
      if (note) note.hidden = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (revealed && !document.hidden) tick();
  });


  /* ---------------------------------------------------------
     CONFETTI
  --------------------------------------------------------- */

  function launchConfetti() {

    if (reduceMotion || !confettiCanvas) return;

    const c = confettiCanvas;
    const cx = c.getContext('2d');
    const W = section.offsetWidth;
    const H = section.offsetHeight;
    const dp = Math.min(window.devicePixelRatio || 1, 2);

    c.width = W * dp;
    c.height = H * dp;
    cx.setTransform(dp, 0, 0, dp, 0, 0);

    const colors = [
      '#caa34a', '#e8c46a', '#d89aa2', '#e7a3ad',
      '#8aa56a', '#fff3dc', '#b9525f'
    ];

    const pieces = Array.from({ length: 110 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * .5,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      vx: (Math.random() - .5) * .8,
      vy: 1.2 + Math.random() * 1.8,
      rot: Math.random() * 6.28,
      vr: (Math.random() - .5) * .2,
      ph: Math.random() * 6.28,
      color: colors[(Math.random() * colors.length) | 0],
      round: Math.random() < .3
    }));

    (function frame() {

      cx.clearRect(0, 0, W, H);
      let alive = 0;

      for (const p of pieces) {

        p.y += p.vy;
        p.ph += .05;
        p.x += p.vx + Math.sin(p.ph) * .6;
        p.rot += p.vr;

        if (p.y > H + 20) continue;
        alive++;

        cx.save();
        cx.globalAlpha = p.y > H * .85 ? Math.max(0, (H - p.y) / (H * .15)) : 1;
        cx.translate(p.x, p.y);
        cx.rotate(p.rot);
        cx.scale(1, Math.cos(p.ph));
        cx.fillStyle = p.color;

        if (p.round) {
          cx.beginPath();
          cx.arc(0, 0, p.h / 2, 0, Math.PI * 2);
          cx.fill();
        } else {
          cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        cx.restore();
      }

      if (alive) requestAnimationFrame(frame);
      else cx.clearRect(0, 0, W, H);

    })();
  }


  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */

  (document.fonts?.ready || Promise.resolve()).then(paintFoil);

  // Repaint only if the plaque really changes size before it is scratched
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (revealed || drawing) return;
      if (plaque.offsetWidth !== w || plaque.offsetHeight !== h) paintFoil();
    }).observe(plaque);
  }

})();
