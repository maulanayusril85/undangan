// ==============================
// Countdown sederhana
// ==============================
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


// ==============================
// Scroll-reveal sederhana (IntersectionObserver)
// ==============================
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


// ==============================
// Event split: aktifkan animasi saat section #event terlihat
// ==============================
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


// ==============================
// Love Verse: fade-up foto & kartu (1 detik)
// ==============================
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


// ==============================
// Reveal video card (pakai IntersectionObserver)
// ==============================
(function(){
  const sec = document.getElementById('video');
  if(!sec) return;
  const target = sec.querySelector('.fadeup');
  if (!target) return;
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((es)=>{
      if(es.some(e=> e.isIntersecting)){ target.classList.add('show'); io.disconnect(); }
    }, {threshold:.22});
    io.observe(sec);
  }else{
    target.classList.add('show');
  }
})();


// ==============================
// Video: Play/pause + auto-pause ketika keluar layar
// ==============================
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


// ==============================
// Masonry Grid: hitung row-span per item (rasio gambar)
// ==============================
document.addEventListener('DOMContentLoaded', function(){
  const grid = document.getElementById('mGrid');
  if(!grid) return;

  function fit(item){
    const cs  = getComputedStyle(grid);
    const row = parseFloat(cs.getPropertyValue('--row')) || 8;
    const gap = parseFloat(cs.getPropertyValue('gap'))   || 12;
    const content = item.querySelector('img, picture, video, .inner') || item;
    const h = content.getBoundingClientRect().height;
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


// ==============================
// Isi nama tamu dari URL ?to=/ ?nama=/ ?invite=
// ==============================
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


// ==============================
// Lock di hero; "Lihat Undangan" => unmute audio + unlock + scroll ke #home
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  const html   = document.documentElement;
  const body   = document.body;
  const btn    = document.getElementById('openInvite');   // pastikan tombol punya id="openInvite"
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
    }catch(e){ /* ignore kalau sudah tersambung */ }
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


// ==============================
// Auto-pause audio ketika tab tidak terlihat, resume saat kembali
// ==============================
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

  // Page Visibility API
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForBackground();
    else                 resumeFromBackground();
  });

  // Safari/iOS tambahan
  window.addEventListener('pagehide', pauseForBackground);
  window.addEventListener('pageshow', () => { if (!document.hidden) resumeFromBackground(); });

  // (opsional) fokus/blur
  window.addEventListener('blur',  () => { if (document.hidden) pauseForBackground(); });
  window.addEventListener('focus', () => { if (!document.hidden) resumeFromBackground(); });
})();


// ==============================
// Guestbook (Google Apps Script) — single module
// ==============================
(function(){
  // PAKAI URL /exec MILIKMU
  const API_URL = 'https://script.google.com/macros/s/AKfycbyYDYF8DbKVDmdO1VCzKrjhSjl9VfmHNsZY7Gb2COP_0cpoBFviIMP3FmGi0pGwqz7z/exec';

  // Ambil elemen
  const el = {
    form:  document.getElementById('guestbookForm'),
    name:  document.getElementById('gbName'),
    status:document.getElementById('gbStatus'),
    count: document.getElementById('gbCount'),
    msg:   document.getElementById('gbMsg'),
    send:  document.getElementById('gbSend'),
    stat:  document.getElementById('gbStatusText'),
    len:   document.getElementById('gbLen'),
    list:  document.getElementById('gbList'),
    badge: document.getElementById('gbBadge')
  };
  if (!el.form || !el.list) return;

  // Prefill nama dari ?to= / ?nama= / ?invite=
  (function(){
    const p = new URLSearchParams(location.search);
    let raw = p.get('to') || p.get('nama') || p.get('invite') || '';
    raw = raw.replace(/\+/g,' ').trim().replace(/\s+/g,' ');
    if (raw) el.name.value = raw.slice(0,64);
  })();

  // Hitung panjang pesan (maks 300)
  function updLen(){
    const v = el.msg.value.slice(0,300);
    if (v !== el.msg.value) el.msg.value = v;
    if (el.len) el.len.textContent = String(v.length);
  }
  el.msg.addEventListener('input', updLen); updLen();

  // Waktu relatif sederhana (selalu "… lalu")
  function rel(ts){
    const t = new Date(ts).getTime();
    if (isNaN(t)) return '';
    let d = Math.round((Date.now() - t)/1000);
    if (d < 0 && Math.abs(d) < 90) d = 0;
    if (d < 90) return 'baru saja';
    const m = Math.round(d/60);   if (m < 60)  return `${m} menit lalu`;
    const h = Math.round(m/60);   if (h < 24)  return `${h} jam lalu`;
    const a = Math.round(h/24);   if (a < 30)  return `${a} hari lalu`;
    const mo= Math.round(a/30);   return `${mo} bulan lalu`;
  }

  // Avatar inisial + warna
  const palette = ['#845EC2','#D65DB1','#FF6F91','#FF9671','#FFC75F','#0081CF','#00C9A7','#4D8076'];
  function avatar(name='Tamu'){
    const ini = name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
    const h = Array.from(name).reduce((a,c)=>a+c.charCodeAt(0),0);
    return { ini, color: palette[h % palette.length] };
  }

  // Render list
  function render(items){
    if (el.badge){
      el.badge.textContent = items.length ? `${items.length} Ucapan` : 'Belum ada ucapan';
    }
    el.list.innerHTML = items.map(it=>{
      const nm   = String(it.name || 'Tamu');
      const av   = avatar(nm);
      const when = it.ts ? rel(it.ts) : '';
      const st   = it.status ? ` · ${String(it.status)}` : '';
      const ct   = it.count  ? ` · ${Number(it.count)} org` : '';
      const msg  = String(it.message ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
      return `
        <article class="gb-card">
          <div class="gb-ava" style="background:${av.color}">${av.ini}</div>
          <div>
            <div class="gb-head">
              <h4 class="gb-name">${nm}</h4>
              <div class="gb-meta">${when}${st}${ct}</div>
            </div>
            <p class="gb-msg">${msg}</p>
          </div>
        </article>`;
    }).join('') || '<p class="muted" style="text-align:center">Belum ada ucapan.</p>';

    // Jika kamu pakai sistem .reveal, pastikan terlihat
    el.list.classList.add('show');
  }

  // Loader
  function showLoading(){
    el.list.innerHTML = '<p class="muted" style="text-align:center">Memuat…</p>';
    el.list.classList.add('show');
  }
  function showError(){
    el.list.innerHTML = '<p class="muted" style="text-align:center">Tidak bisa memuat pesan.</p>';
    el.list.classList.add('show');
  }

  // GET data dari GAS
  async function load(){
    try{
      showLoading();
      const res = await fetch(API_URL, { cache:'no-store' });
      if (!res.ok) { showError(); return; }
      const json = await res.json();
      render(Array.isArray(json.items) ? json.items : []);
    }catch(e){
      showError();
      console.warn('Guestbook GET error:', e);
    }
  }

  // Load awal + refresh ketika kembali ke tab
  load();
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) load(); });

  // Submit (POST) — TANPA header custom (hindari preflight CORS)
  el.form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if (!el.name.value.trim() || !el.msg.value.trim() || !el.status.value || !el.count.value){
      if (el.stat) el.stat.textContent = 'Lengkapi semua kolom.';
      return;
    }

    const body = new URLSearchParams({
      name: el.name.value.trim(),
      status: el.status.value,
      count: el.count.value,
      message: el.msg.value.trim(),
      ua: navigator.userAgent
    });

    el.send.disabled = true;
    el.send.textContent = 'Mengirim…';
    if (el.stat) el.stat.textContent = '';

    try{
      const res = await fetch(API_URL, { method:'POST', body, cache:'no-store' });
      let ok = false;
      if (res.type === 'opaque'){ ok = true; }
      else if (res.ok){
        const data = await res.json().catch(()=>({ok:true}));
        ok = data?.ok !== false;
      }
      if (ok){
        if (el.stat) el.stat.textContent = 'Terkirim, terima kasih! 🙏';
        el.form.reset(); updLen();
        load(); // refresh list
      }else{
        if (el.stat) el.stat.textContent = 'Gagal mengirim. Coba lagi.';
      }
    }catch(err){
      if (el.stat) el.stat.textContent = 'Gangguan jaringan. Coba lagi.';
      console.warn('Guestbook POST error:', err);
    }finally{
      el.send.disabled = false;
      el.send.textContent = 'Kirim';
    }
  });
})();
