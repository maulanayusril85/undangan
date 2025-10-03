// Countdown sederhana
(function(){
  const el = document.getElementById('countdown');
  const t = document.getElementById('eventDate');
  if(!el || !t) return;
  const pad = n => String(n).padStart(2,'0');
  function render(){
    const target = new Date(t.getAttribute('datetime')).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    el.innerHTML = ['', '', '', ''].map((_,i)=>`
      <div class="cell">
        <div class="num">${[d,h,m,s].map(pad)[i]}</div>
        <div class="lbl">${['Hari','Jam','Menit','Detik'][i]}</div>
      </div>
    `).join('');
  }
  render(); setInterval(render, 1000);
})();

// Scroll-reveal sederhana (IntersectionObserver)
(function(){
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !items.length){
    // Fallback: tampilkan semua
    items.forEach(el => el.classList.add('show'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
  // Tampilkan elemen di atas fold cepat
  window.addEventListener('load', ()=>{
    items.forEach(el=>{
      const rect = el.getBoundingClientRect();
      if(rect.top < window.innerHeight * 0.9) el.classList.add('show');
    });
  });
})();



// Event split: aktifkan animasi saat section #event terlihat
(function(){
  const section = document.getElementById('event');
  if(!section) return;
  const boxes = section.querySelectorAll('.event-box');

  function reveal(){
    boxes.forEach((el, i) => {
      setTimeout(() => el.classList.add('is-visible'), i * 120); // stagger
    });
  }

  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      if (entries.some(e => e.isIntersecting)) {
        reveal();
        io.disconnect(); // hanya sekali
      }
    }, { threshold: .25 });
    io.observe(section);
  } else {
    reveal(); // fallback browser lama
  }
})();


// Love Verse: fade-up foto & kartu (1 detik)
(function(){
  const sec = document.getElementById('love-verse');
  if(!sec) return;

  const targets = sec.querySelectorAll('.fadeup'); // foto + kartu
  const reveal = () => targets.forEach((el,i)=> setTimeout(()=> el.classList.add('show'), i*1000));

  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      if (entries.some(e=> e.isIntersecting)) { reveal(); io.disconnect(); }
    }, { threshold: .45 });
    io.observe(sec);
  } else {
    reveal();
  }
})();

// Reveal video card (pakai IntersectionObserver)
(function(){
  const sec = document.getElementById('video');
  if(!sec) return;
  const target = sec.querySelector('.fadeup');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((es)=>{
      if(es.some(e=> e.isIntersecting)){ target.classList.add('show'); io.disconnect(); }
    }, {threshold:.22});
    io.observe(sec);
  }else{
    target.classList.add('show');
  }
})();

// Play/pause + auto-pause ketika keluar layar
(function(){
  const card = document.getElementById('videoCard');
  const video = document.getElementById('weddingVideo');
  const ctrl  = document.getElementById('videoCtrl');
  if(!video || !ctrl || !card) return;

  const updateUI = () => {
    if(video.paused) card.classList.remove('is-playing');
    else card.classList.add('is-playing');
  };

  ctrl.addEventListener('click', ()=>{
    if(video.paused) video.play(); else video.pause();
  });
  video.addEventListener('play',  updateUI);
  video.addEventListener('pause', updateUI);
  updateUI();

  // pause saat keluar viewport (hemat baterai)
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((es)=>{
      es.forEach(e=>{ if(!e.isIntersecting) video.pause(); });
    }, {threshold:.2});
    io.observe(card);
  }
})();


// Masonry Grid: hitung row-span per item (rasio gambar), aman meski dipanggil cepat
document.addEventListener('DOMContentLoaded', function(){
  const grid = document.getElementById('mGrid');
  if(!grid) return;

  function metrics(){
    const cs  = getComputedStyle(grid);
    const row = parseFloat(cs.getPropertyValue('--row')) || 8;
    const gap = parseFloat(cs.getPropertyValue('gap'))   || 12;
    return { row, gap };
  }

  function fit(item){
    const cs  = getComputedStyle(grid);
    const row = parseFloat(cs.getPropertyValue('--row')) || 8;
    const gap = parseFloat(cs.getPropertyValue('gap'))   || 12;

    // pakai tinggi KONTEN (img), bukan figure, supaya tak ikut border/padding
    const content = item.querySelector('img, picture, video, .inner') || item;
    const h = content.getBoundingClientRect().height;

    // epsilon kecil untuk hindari overspan 1px akibat pembulatan/DPR
    const epsilon = 0.5;
    const span = Math.max(1, Math.round((h + gap) / (row + gap)));


    item.style.gridRowEnd = `span ${span}`;
  }


  function layout(){
    grid.querySelectorAll('.m-item').forEach(fit);
  }

  // Pasang listener ke setiap IMG
  grid.querySelectorAll('img').forEach(img => {
    const item = img.closest('.m-item');
    if (img.complete && img.naturalWidth) {
      fit(item);
    } else {
      img.addEventListener('load',  () => fit(item), { once:true });
      img.addEventListener('error', () => fit(item), { once:true });
      // Safari kadang "cached but not complete": nudge kecil
      setTimeout(() => { if (!img.complete) { const s=img.src; img.src=''; img.src=s; } }, 400);
    }
  });

  // Relayout saat resize (debounce)
  let t; window.addEventListener('resize', ()=>{ clearTimeout(t); t=setTimeout(layout, 120); });

  // Kick awal + tandai grid siap (aktifkan auto-rows var(--row))
  layout();
  grid.classList.add('is-ready');

  // Pastikan setelah semuanya load (termasuk poster, font) kita rapikan lagi
  window.addEventListener('load', layout);
});

// Isi nama tamu dari URL ?to=/ ?nama=/ ?invite=
(function(){
  const els = document.querySelectorAll('#inviteName, .invite-name');
  if(!els.length) return;

  const p = new URLSearchParams(location.search);
  let raw = p.get('to') || p.get('nama') || p.get('invite') || "";

  // WA/Chrome kadang kirim + sbg spasi → normalkan
  raw = raw.replace(/\+/g, ' ').trim().replace(/\s+/g,' ');

  // batasi panjang & fallback
  const name = (raw.slice(0, 64)) || "Tamu Undangan";

  els.forEach(el => el.textContent = name);
})();


// Lock di hero; "Lihat Undangan" => unmute audio + unlock + scroll ke #home
document.addEventListener('DOMContentLoaded', () => {
  const html   = document.documentElement;
  const body   = document.body;
  const btn    = document.getElementById('openInvite');
  const audio  = document.getElementById('bgMusic');
  const target = document.getElementById('home');

  if (!btn || !audio || !target) return;

  // 1) Kunci scroll & siapkan audio muted agar ready
  html.classList.add('is-locked');
  body.classList.add('is-locked');
  audio.play().catch(()=>{}); // warm-up muted (lolos policy)

  // (opsional) siapkan Web Audio agar iOS lebih patuh
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx, node;
  function connectGraph(){
    if (!AC || ctx) return;
    ctx = new AC();
    try{
      node = ctx.createMediaElementSource(audio);
      node.connect(ctx.destination);
    }catch(e){ /* ignore kalau sudah pernah tersambung */ }
  }

  async function openInvite(e){
    e.preventDefault();               // cegah langsung lompat anchor
    connectGraph();
    if (ctx && ctx.state === 'suspended') { try{ await ctx.resume(); }catch(e){} }

    try{
      // 2) Unmute + fade-in
      audio.muted  = false;
      audio.volume = 0;
      await audio.play();             // gesture klik -> diizinkan
      const iv = setInterval(() => {
        audio.volume = Math.min(1, audio.volume + 0.15);
        if (audio.volume >= 1) clearInterval(iv);
      }, 70);
    }catch(err){
      // kalau gagal, biarkan tetap muted; user tetap bisa lanjut
      console.warn('Gagal memulai audio:', err);
    }

    // 3) Buka kunci & scroll halus ke #home
    html.classList.remove('is-locked');
    body.classList.remove('is-locked');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btn.addEventListener('click', openInvite, { passive: false });
});


// ===== Auto-pause ketika tab tidak terlihat, auto-resume saat kembali =====
(function(){
  const audio = document.getElementById('bgMusic');
  if (!audio) return;

  let pausedByAuto = false;   // penanda: dipause karena background, bukan karena user

  function pauseForBackground(){
    if (!audio.paused) {
      audio.pause();
      pausedByAuto = true;
    }
  }
  function resumeFromBackground(){
    if (pausedByAuto) {
      audio.play().catch(()=>{}); // iOS biasanya mengizinkan setelah ada gesture sebelumnya
      pausedByAuto = false;
    }
  }

  // Page Visibility API (semua browser modern, termasuk iOS/Chrome iOS)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForBackground();
    else                 resumeFromBackground();
  });

  // Safari/iOS tambahan: pagehide/pageshow
  window.addEventListener('pagehide', pauseForBackground);
  window.addEventListener('pageshow', () => { if (!document.hidden) resumeFromBackground(); });

  // (opsional) jika jendela kehilangan fokus → pause ringan
  window.addEventListener('blur',  () => { if (document.hidden) pauseForBackground(); });
  window.addEventListener('focus', () => { if (!document.hidden) resumeFromBackground(); });
})();


// Reveal on scroll (global)
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;

  if(!('IntersectionObserver' in window)){
    els.forEach(el => el.classList.add('show'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('show');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  els.forEach(el => io.observe(el));
})();

// ===== Pesan & Kesan (tanpa login) — Web3Forms =====
(function(){
  const form   = document.getElementById('guestbookForm');
  if(!form) return;

  const nameEl = document.getElementById('gbName');
  const msgEl  = document.getElementById('gbMsg');
  const btn    = document.getElementById('gbSubmit');
  const stat   = document.getElementById('gbStatus');
  const count  = document.getElementById('gbCount');

  // 1) Prefill nama dari URL ?to= / ?nama= / ?invite=
  (function(){
    const p = new URLSearchParams(location.search);
    let raw = p.get('to') || p.get('nama') || p.get('invite') || '';
    raw = raw.replace(/\+/g,' ').trim().replace(/\s+/g,' ');
    if(raw) nameEl.value = raw.slice(0, 64);
  })();

  // 2) Hitung karakter (maks 300)
  function updateCount(){
    const max = 300;
    const v = msgEl.value.slice(0, max);
    if (v !== msgEl.value){ msgEl.value = v; }
    if (count) count.textContent = String(v.length);
  }
  msgEl.addEventListener('input', updateCount); updateCount();

  // 3) Submit via fetch (AJAX)
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    // validasi sederhana
    if (!nameEl.value.trim() || !msgEl.value.trim()){
      stat.textContent = 'Nama dan pesan wajib diisi.';
      return;
    }

    // siapkan payload
    const data = new FormData(form);
    // tambahan metadata (opsional)
    data.append('from_site', location.origin + location.pathname);

    // UI state
    btn.disabled = true;
    btn.textContent = 'Mengirim…';
    stat.textContent = '';

    try{
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data
      });
      const json = await res.json();

      if (json.success){
        stat.textContent = 'Terima kasih! Pesanmu sudah terkirim 🙏';
        form.reset(); updateCount();
      } else {
        stat.textContent = 'Gagal mengirim. Coba lagi sebentar.';
        console.warn(json);
      }
    }catch(err){
      stat.textContent = 'Terjadi gangguan jaringan. Coba lagi.';
      console.error(err);
    }finally{
      btn.disabled = false;
      btn.textContent = 'Kirim';
    }
  });
})();


