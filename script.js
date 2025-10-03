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


// Autoplay muted → unmute pada gesture (scroll/klik/tap/keydown)
// Dengan Web Audio unlock agar iOS/Chrome iOS lebih nurut.
document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;

  // Mulai muted (umumnya lolos di semua browser)
  audio.play().catch(()=>{});

  const AC  = window.AudioContext || window.webkitAudioContext;
  let ctx   = null;
  let src   = null;
  let tried = false;

  async function unlock(persist=false){
    if (tried) return;              // cegah double-run
    tried = true;

    try{
      // Siapkan Web Audio graph (sekali saja)
      if (AC && !ctx){
        ctx = new AC();
        if (ctx.state === 'suspended') await ctx.resume();
        try{
          src = ctx.createMediaElementSource(audio);
          src.connect(ctx.destination);
        }catch(e){
          // kalau sudah pernah dihubungkan pada reload, abaikan
        }
      }

      // Unmute + "nudge" iOS
      audio.muted = false;
      try { audio.currentTime += 0.000001; } catch(e){}

      // Fade-in halus
      audio.volume = 0;
      await audio.play();                 // kalau tetap diblokir, akan melempar
      const iv = setInterval(() => {
        audio.volume = Math.min(1, audio.volume + 0.12);
        if (audio.volume >= 1) clearInterval(iv);
      }, 70);

      if (persist) localStorage.setItem('musicAllowed','1');
    }catch(e){
      // Gagal (device benar2 strict) → izinkan coba lagi di gesture berikutnya
      tried = false;
    }
  }

  // Gesture apa pun => unmute (tanpa tombol, tanpa overlay)
  const events = ['scroll','wheel','pointerdown','touchstart','click','keydown'];
  const handler = () => unlock(true);
  events.forEach(ev => document.addEventListener(ev, handler, { once:true, passive:true }));

  // Kalau user sudah pernah mengizinkan, coba langsung unmute otomatis
  if (localStorage.getItem('musicAllowed') === '1'){
    unlock(false);
  } else {
    // Nudge kecil: beberapa browser jadi mengizinkan setelah jeda
    setTimeout(() => unlock(false), 900);
  }

  // Desktop sering lebih longgar → coba lagi saat full load
  window.addEventListener('load', () => { if (localStorage.getItem('musicAllowed') === '1') unlock(false); });
});



