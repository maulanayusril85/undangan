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

// ===== Guestbook: kirim & tampil =====
(function(){
  const API_URL = 'https://script.google.com/macros/s/AKfycbyXueBLG5ztKAT6v20-RhIde_5Xferknj26wf3nDoyt5BPJ6Z_YCYOZRFeUWfwlaC4q/exec';  // <-- ganti ini

  const form   = document.getElementById('guestbookForm');
  const nameEl = document.getElementById('gbName');
  const statusEl = document.getElementById('gbStatus');
  const countEl  = document.getElementById('gbCount');
  const msgEl  = document.getElementById('gbMsg');
  const sendBtn= document.getElementById('gbSend');
  const statEl = document.getElementById('gbStatusText');
  const lenEl  = document.getElementById('gbLen');
  const listEl = document.getElementById('gbList');
  const badge  = document.getElementById('gbBadge');
  if(!form || !listEl) return;

  // Prefill nama dari ?to= / ?nama= / ?invite=
  (function(){
    const p = new URLSearchParams(location.search);
    let raw = p.get('to') || p.get('nama') || p.get('invite') || '';
    raw = raw.replace(/\+/g,' ').trim().replace(/\s+/g,' ');
    if (raw) nameEl.value = raw.slice(0,64);
  })();

  // Counter pesan
  function updLen(){
    const v = msgEl.value.slice(0,300);
    if (v !== msgEl.value) msgEl.value = v;
    if (lenEl) lenEl.textContent = String(v.length);
  }
  msgEl.addEventListener('input', updLen); updLen();

  // Waktu relatif
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  function relativeTime(date){
    const now = Date.now();
    const diff = (new Date(date)).getTime() - now;
    const abs = Math.abs(diff);
    const mins = Math.round(abs / 60000);
    if (mins < 60) return rtf.format(Math.sign(diff)*mins, 'minute');
    const hours = Math.round(mins/60);
    if (hours < 24) return rtf.format(Math.sign(diff)*hours, 'hour');
    const days = Math.round(hours/24);
    if (days < 30) return rtf.format(Math.sign(diff)*days, 'day');
    const months = Math.round(days/30);
    return rtf.format(Math.sign(diff)*months, 'month');
  }

  // Avatar warna + inisial
  const palette = ['#845EC2','#D65DB1','#FF6F91','#FF9671','#FFC75F','#0081CF','#00C9A7','#4D8076'];
  function avatar(name){
    const n = (name||'Tamu').trim();
    const ini = n.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
    const h = Array.from(n).reduce((a,c)=>a+c.charCodeAt(0),0);
    const color = palette[h % palette.length];
    return { ini, color };
  }

  // Render list
  function render(items){
    badge.textContent = items.length;
    listEl.innerHTML = items.map(it=>{
      const av = avatar(it.name);
      const when = it.ts ? relativeTime(it.ts) : '';
      const status = it.status ? ` · ${it.status}` : '';
      const count = it.count ? ` · ${it.count} org` : '';
      const safeMsg = (it.message||'').replace(/</g,'&lt;');
      return `
        <article class="gb-card">
          <div class="gb-ava" style="background:${av.color}">${av.ini}</div>
          <div>
            <div class="gb-head">
              <h4 class="gb-name">${it.name}</h4>
              <div class="gb-meta">${when}${status}${count}</div>
            </div>
            <p class="gb-msg">${safeMsg}</p>
          </div>
        </article>`;
    }).join('') || '<p class="muted text-center">Belum ada pesan.</p>';
  }

  // Load awal
  async function load(){
    try{
      const res = await fetch(API_URL, { cache: 'no-store' });
      const json = await res.json();
      render((json && json.items) ? json.items : []);
    }catch(e){
      console.warn('Gagal memuat guestbook', e);
      listEl.innerHTML = '<p class="muted text-center">Tidak bisa memuat pesan.</p>';
    }
  }
  load();

  // Submit
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if (!nameEl.value.trim() || !msgEl.value.trim() || !statusEl.value || !countEl.value){
      statEl.textContent = 'Lengkapi semua kolom.';
      return;
    }

    const data = new URLSearchParams({
      name: nameEl.value.trim(),
      status: statusEl.value,
      count: countEl.value,
      message: msgEl.value.trim(),
      ua: navigator.userAgent
    });

    sendBtn.disabled = true;
    sendBtn.textContent = 'Mengirim…';
    statEl.textContent = '';

    try{
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString()
      });
      const json = await res.json();
      if (json.ok){
        statEl.textContent = 'Terkirim, terima kasih! 🙏';
        form.reset(); updLen();
        load(); // refresh list
      }else{
        statEl.textContent = 'Gagal mengirim. Coba lagi.';
      }
    }catch(err){
      statEl.textContent = 'Gangguan jaringan. Coba lagi.';
    }finally{
      sendBtn.disabled = false;
      sendBtn.textContent = 'Kirim';
    }
  });
})();



form.addEventListener('submit', async (e)=>{
  e.preventDefault();

  if (!nameEl.value.trim() || !msgEl.value.trim() || !statusEl.value || !countEl.value){
    statEl.textContent = 'Lengkapi semua kolom.';
    return;
  }

  // payload untuk kedua backend (Apps Script / Web3Forms)
  const payload = {
    name:   nameEl.value.trim(),
    status: statusEl.value,
    count:  countEl.value,
    message:msgEl.value.trim(),
    ua: navigator.userAgent
  };

  // Siapkan body
  const body = new URLSearchParams(payload); // <— simple request (tanpa header)
  sendBtn.disabled = true;
  sendBtn.textContent = 'Mengirim…';
  statEl.textContent = '';

  // Helper: sukses UI
  const onOK = (msg='Terkirim, terima kasih! 🙏')=>{
    statEl.textContent = msg;
    form.reset(); 
    if (typeof updLen === 'function') updLen();
    setTimeout(load, 300); // refresh list
  };

  try{
    // ==== Percobaan utama (CORS normal) ====
    const res = await fetch(API_URL, {
      method: 'POST',
      body,              // TANPA header 'Content-Type' agar tidak preflight
      credentials: 'omit',
      cache: 'no-store'
    });

    // Kalau balas JSON, baca; jika tidak (opaque), anggap OK
    let ok = false;
    if (res.type === 'opaque') {
      ok = true;                      // no-cors, tapi server menerima
      console.debug('Guestbook POST opaque; assume OK');
    } else if (res.ok) {
      try {
        const data = await res.json();
        ok = data?.ok !== false && data?.success !== false;
        console.debug('Guestbook POST JSON:', data);
      } catch {
        ok = true;                    // balasan non-JSON tapi status OK
      }
    }

    if (ok) onOK();
    else {
      console.warn('Guestbook POST not OK:', res.status, res.statusText);
      statEl.textContent = 'Gagal mengirim. Coba lagi.';
    }

  } catch (err){
    console.warn('Guestbook POST error:', err);

    // ==== Fallback agresif: no-cors ====
    try{
      await fetch(API_URL, { method:'POST', body, mode:'no-cors' });
      onOK('Terkirim (diproses)…');   // kita tidak bisa baca respons, tapi server menerima
    }catch(err2){
      console.error('Guestbook POST fallback failed:', err2);
      statEl.textContent = 'Gangguan jaringan. Coba lagi.';
    }
  } finally{
    sendBtn.disabled = false;
    sendBtn.textContent = 'Kirim';
  }
});


// ====== Guestbook: LOAD & RENDER dari Google Apps Script ======
(function(){
  const API_URL = 'PASTE_URL_EXEC_APPS_SCRIPT_KAMU_DI_SINI'; // <— ganti ini

  const form     = document.getElementById('guestbookForm');
  const nameEl   = document.getElementById('gbName');
  const statusEl = document.getElementById('gbStatus');
  const countEl  = document.getElementById('gbCount');
  const msgEl    = document.getElementById('gbMsg');
  const sendBtn  = document.getElementById('gbSend');
  const statEl   = document.getElementById('gbStatusText');
  const lenEl    = document.getElementById('gbLen');

  const listEl   = document.getElementById('gbList');
  const badge    = document.getElementById('gbBadge');

  if (!form || !listEl) return;

  // Prefill nama dari ?to= / ?nama= / ?invite=
  (function(){
    const p = new URLSearchParams(location.search);
    let raw = p.get('to') || p.get('nama') || p.get('invite') || '';
    raw = raw.replace(/\+/g,' ').trim().replace(/\s+/g,' ');
    if (raw) nameEl.value = raw.slice(0,64);
  })();

  // Counter pesan
  function updLen(){
    const v = msgEl.value.slice(0,300);
    if (v !== msgEl.value) msgEl.value = v;
    if (lenEl) lenEl.textContent = String(v.length);
  }
  msgEl.addEventListener('input', updLen); updLen();

  // Helper UI
  function showLoading(){ listEl.innerHTML = '<p class="muted" style="text-align:center">Memuat…</p>'; }
  function showError(){   listEl.innerHTML = '<p class="muted" style="text-align:center">Tidak bisa memuat pesan.</p>'; }

  // Waktu relatif (untuk meta)
  const rtf = new Intl.RelativeTimeFormat('id', { numeric:'auto' });
  function rel(dateStr){
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return '';
    const diff = t - Date.now();
    const mins = Math.round(Math.abs(diff)/60000);
    if (mins < 60)  return rtf.format(Math.sign(diff)*mins, 'minute');
    const hrs = Math.round(mins/60);
    if (hrs < 24)   return rtf.format(Math.sign(diff)*hrs, 'hour');
    const days = Math.round(hrs/24);
    if (days < 30)  return rtf.format(Math.sign(diff)*days, 'day');
    const mons = Math.round(days/30);
    return rtf.format(Math.sign(diff)*mons, 'month');
  }

  // Avatar warna + inisial
  const palette = ['#845EC2','#D65DB1','#FF6F91','#FF9671','#FFC75F','#0081CF','#00C9A7','#4D8076'];
  function avatar(name){
    const n = (name||'Tamu').trim();
    const ini = n.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
    const h = Array.from(n).reduce((a,c)=>a+c.charCodeAt(0),0);
    return { ini, color: palette[h % palette.length] };
  }

  function render(items){
    if (badge) badge.textContent = items.length;
    listEl.innerHTML = items.map(it=>{
      const av = avatar(it.name);
      const when = it.ts ? rel(it.ts) : '';
      const status = it.status ? ` · ${it.status}` : '';
      const count  = it.count  ? ` · ${it.count} org` : '';
      const safeMsg = String(it.message||'').replace(/</g,'&lt;');
      return `
        <article class="gb-card">
          <div class="gb-ava" style="background:${av.color}">${av.ini}</div>
          <div>
            <div class="gb-head">
              <h4 class="gb-name">${it.name || 'Tamu'}</h4>
              <div class="gb-meta">${when}${status}${count}</div>
            </div>
            <p class="gb-msg">${safeMsg}</p>
          </div>
        </article>`;
    }).join('') || '<p class="muted" style="text-align:center">Belum ada pesan.</p>';
  }

  async function load(){
    if (!API_URL){ showError(); console.warn('API_URL kosong'); return; }
    try{
      showLoading();
      const res = await fetch(API_URL, { cache:'no-store' });
      if (!res.ok){ showError(); console.warn('GET not ok', res.status); return; }
      const json = await res.json();
      console.debug('Guestbook GET:', json);
      const items = (json && json.items) ? json.items : [];
      render(items);
    }catch(e){
      console.warn('Guestbook GET error:', e);
      showError();
    }
  }

  // Load awal + refresh saat kembali ke tab
  load();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

  // SUBMIT — kirim ke Apps Script (tanpa header custom, hindari preflight)
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if (!nameEl.value.trim() || !msgEl.value.trim() || !statusEl.value || !countEl.value){
      if (statEl) statEl.textContent = 'Lengkapi semua kolom.';
      return;
    }

    const body = new URLSearchParams({
      name: nameEl.value.trim(),
      status: statusEl.value,
      count: countEl.value,
      message: msgEl.value.trim(),
      ua: navigator.userAgent
    });

    sendBtn.disabled = true;
    sendBtn.textContent = 'Mengirim…';
    if (statEl) statEl.textContent = '';

    try{
      const res = await fetch(API_URL, { method:'POST', body, cache:'no-store' });
      let ok = false;
      if (res.type === 'opaque'){ ok = true; }
      else if (res.ok){
        const data = await res.json().catch(()=>({ok:true}));
        ok = data?.ok !== false;
      }
      if (ok){
        if (statEl) statEl.textContent = 'Terkirim, terima kasih! 🙏';
        form.reset(); updLen();
        load();  // refresh list setelah kirim
      }else{
        if (statEl) statEl.textContent = 'Gagal mengirim. Coba lagi.';
      }
    }catch(err){
      if (statEl) statEl.textContent = 'Gangguan jaringan. Coba lagi.';
      console.warn('POST error:', err);
    }finally{
      sendBtn.disabled = false;
      sendBtn.textContent = 'Kirim';
    }
  });
})();

