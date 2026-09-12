(() => {
  const book = document.getElementById("book");
  const openBtn = document.getElementById("openBtn");
  const pages = [...document.querySelectorAll(".page")];
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const dots = document.getElementById("dots");
  const sheet = document.getElementById("sheet");
  const flower = document.getElementById("flower");
  const soundBtn = document.querySelector(".sound-btn");
  const ending = document.getElementById("ending");
  const petals = document.getElementById("petals");
  const theme = document.getElementById("theme");

  const LAST_NOTE = 3;
  const END_PAGE = 4;

  const endings = {
    yes: [
      "അത് മതി ❤️",
      "ഇനി ഞാൻ ശ്രദ്ധിക്കാം.",
      "നിന്നോട് നേരിട്ട് സംസാരിച്ച്",
      "ഇതൊക്കെ ശരിയാക്കണം.",
      { text: "സോറി വൈഷ്ണേ.", cls: "sign" },
      { text: "അഖിൽ", cls: "sign" },
    ],
    later: [
      "ശരി വൈഷ്ണേ ❤️",
      "ഇപ്പോഴും ദേഷ്യമുണ്ടെങ്കിൽ",
      "ഞാൻ മനസ്സിലാക്കുന്നു.",
      "ഇപ്പോൾ തന്നെ സംസാരിക്കണം എന്ന്",
      "ഞാൻ നിർബന്ധിക്കില്ല.",
      "ദേഷ്യം മാറുമ്പോൾ സംസാരിക്കാം.",
      { text: "ഒരിക്കൽ കൂടി സോറി.", cls: "sign" },
      { text: "അഖിൽ", cls: "sign" },
    ],
  };

  let index = 0;
  let opened = false;
  let finished = false;
  let soundOn = false;
  let audio;

  for (let i = 0; i <= LAST_NOTE; i += 1) {
    dots.appendChild(document.createElement("span"));
  }

  function rustle() {
    if (!soundOn) return;
    try {
      audio = audio || new AudioContext();
      const now = audio.currentTime;
      const buffer = audio.createBuffer(1, audio.sampleRate * 0.18, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);
      source.start(now);
    } catch {
      /* ignore */
    }
  }

  function showPage(next) {
    if (next === index || next < 0 || next >= pages.length) return;
    const current = pages[index];
    const incoming = pages[next];

    current.classList.remove("is-active");
    current.classList.add("is-leaving");
    incoming.hidden = false;
    incoming.classList.add("is-entering");

    window.setTimeout(() => {
      current.hidden = true;
      current.classList.remove("is-leaving");
      incoming.classList.remove("is-entering");
      incoming.classList.add("is-active");
    }, 380);

    index = next;
    rustle();
    syncNav();
  }

  function syncNav() {
    const atEnd = index >= END_PAGE;
    const atAsk = index >= LAST_NOTE;
    prevBtn.disabled = index === 0 || atEnd;
    nextBtn.disabled = atAsk || finished;
    document.querySelector(".nav").hidden = atEnd;
    flower.hidden = atEnd;

    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle("is-on", i === Math.min(index, LAST_NOTE));
    });
  }

  function openBook() {
    if (opened) return;
    opened = true;
    rustle();
    book.classList.add("is-open");
    window.setTimeout(() => {
      pages[0].classList.add("is-active");
    }, 420);
    syncNav();
  }

  function writeEnding(kind) {
    ending.innerHTML = "";
    endings[kind].forEach((item, i) => {
      const p = document.createElement("p");
      if (typeof item === "string") {
        p.textContent = item;
      } else {
        p.textContent = item.text;
        p.className = item.cls;
      }
      p.style.animationDelay = `${i * 0.42}s`;
      ending.appendChild(p);
    });
  }

  function rainPetals() {
    for (let i = 0; i < 18; i += 1) {
      const petal = document.createElement("i");
      petal.className = "petal";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDuration = `${2.4 + Math.random() * 2.2}s`;
      petal.style.animationDelay = `${Math.random() * 0.8}s`;
      petal.style.background = Math.random() > 0.5 ? "#c45c65" : "#d9a0a6";
      petals.appendChild(petal);
      window.setTimeout(() => petal.remove(), 5000);
    }
  }

  function choose(kind) {
    if (finished) return;
    finished = true;
    writeEnding(kind);
    showPage(END_PAGE);
    if (kind === "yes") rainPetals();
  }

  openBtn.addEventListener("click", openBook);
  document.querySelector(".cover").addEventListener("click", openBook);
  prevBtn.addEventListener("click", () => showPage(index - 1));
  nextBtn.addEventListener("click", () => showPage(index + 1));

  document.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => choose(btn.dataset.choice));
  });

  const SOFT_VOLUME = 0.22;
  let themeStarted = false;

  function markSound(on) {
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.querySelector(".sound-label").textContent = on ? "ഓൺ" : "ശബ്ദം";
  }

  function fadeInTheme() {
    theme.volume = 0;
    const step = () => {
      if (theme.paused) return;
      theme.volume = Math.min(SOFT_VOLUME, theme.volume + 0.02);
      if (theme.volume < SOFT_VOLUME) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function playThemeOnce() {
    if (themeStarted) return;
    try {
      theme.loop = false;
      await theme.play();
      themeStarted = true;
      fadeInTheme();
      markSound(true);
    } catch {
      /* browser blocked autoplay until a tap */
    }
  }

  function waitThenPlay() {
    const pageReady =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    const songReady = Promise.race([
      theme.readyState >= 3
        ? Promise.resolve()
        : new Promise((resolve) => theme.addEventListener("canplaythrough", resolve, { once: true })),
      new Promise((resolve) => window.setTimeout(resolve, 2500)),
    ]);
    Promise.all([pageReady, songReady]).then(playThemeOnce);
  }

  waitThenPlay();
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.target.closest(".sound-btn")) return;
      playThemeOnce();
    },
    { once: true }
  );

  soundBtn.addEventListener("click", async () => {
    if (!themeStarted) {
      await playThemeOnce();
      return;
    }
    theme.muted = !theme.muted;
    markSound(!theme.muted);
  });

  let touchX = null;
  sheet.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });

  sheet.addEventListener("touchend", (e) => {
    if (touchX == null || finished) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0 && index < LAST_NOTE) showPage(index + 1);
    if (dx > 0 && index > 0 && index <= LAST_NOTE) showPage(index - 1);
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (!opened || finished) return;
    if (e.key === "ArrowRight" && index < LAST_NOTE) showPage(index + 1);
    if (e.key === "ArrowLeft" && index > 0 && index <= LAST_NOTE) showPage(index - 1);
  });

  let drag = null;
  flower.addEventListener("pointerdown", (e) => {
    flower.setPointerCapture(e.pointerId);
    const rect = flower.getBoundingClientRect();
    const parent = sheet.getBoundingClientRect();
    drag = {
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
      parent,
    };
    flower.style.cursor = "grabbing";
  });

  flower.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = e.clientX - drag.parent.left - drag.ox;
    const y = e.clientY - drag.parent.top - drag.oy;
    flower.style.right = "auto";
    flower.style.left = `${Math.max(8, Math.min(x, drag.parent.width - 60))}px`;
    flower.style.top = `${Math.max(4, Math.min(y, drag.parent.height - 60))}px`;
  });

  flower.addEventListener("pointerup", () => {
    drag = null;
    flower.style.cursor = "grab";
  });

  syncNav();

  const params = new URLSearchParams(location.search);
  if (params.has("open") || params.has("page") || params.has("end")) {
    openBook();
    const jump = Number(params.get("page") || 0);
    if (jump > 0 && jump <= LAST_NOTE) {
      pages[0].hidden = true;
      pages[0].classList.remove("is-active");
      pages[jump].hidden = false;
      pages[jump].classList.add("is-active");
      index = jump;
      syncNav();
    }
    if (params.get("end") === "yes") choose("yes");
    if (params.get("end") === "later") choose("later");
  }
})();
