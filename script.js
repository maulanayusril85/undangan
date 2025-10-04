// ===== Guestbook (Google Apps Script) — single module, bersih =====
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
