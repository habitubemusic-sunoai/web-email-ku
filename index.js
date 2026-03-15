export default {
  async email(m, e) {
    let r = "";
    const rd = m.raw.getReader();
    while (true) { const { done, value } = await rd.read(); if (done) break; r += new TextDecoder().decode(value); }
    let b = r.includes("Content-Type: text/plain") ? r.split("Content-Type: text/plain")[1].split("--")[0].trim() : "Format HTML tidak dapat ditampilkan sepenuhnya.";
    const d = {
      id: Date.now().toString(),
      f: m.from || "Sistem",
      s: m.headers.get("subject") || "Tanpa Judul",
      b: b || "Isi Kosong",
      // Waktu lengkap: Jam, Detik, Menit, Hari, Tanggal, Tahun
      t: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    };
    // 7 Menit = 420 Detik. Pesan otomatis hancur setelah 7 Menit.
    await e.DB.put(d.id, JSON.stringify(d), { expirationTtl: 420 });
  },

  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/pesan") {
      const { keys } = await env.DB.list();
      let ems = [];
      for (let k of keys) { const v = await env.DB.get(k.name); if (v) { try { ems.push(JSON.parse(v)); } catch(err) {} } }
      // Sort newest first (Urutan pesan baru paling atas)
      return new Response(JSON.stringify(ems.sort((a,b) => b.id - a.id)), {headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate'}});
    }
    if (u.pathname === "/api/del" && req.method === "POST") {
      const { id } = await req.json();
      await env.DB.delete(id);
      return new Response("OK");
    }

    // Pendeteksi IP, ISP, dan Perangkat
    const ip = req.headers.get('cf-connecting-ip') || 'IP Tidak Terdeteksi';
    const isp = (req.cf && req.cf.asOrganization) ? req.cf.asOrganization : 'ISP Tidak Terdeteksi';
    const ua = req.headers.get('user-agent') || '';
    let dev = 'Desktop/Lainnya';
    if(ua.includes('Android')) dev = 'Android';
    else if(ua.includes('iPhone') || ua.includes('iPad')) dev = 'Apple iOS';
    else if(ua.includes('Windows')) dev = 'Windows PC';
    else if(ua.includes('Mac OS')) dev = 'Mac OS';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HABI MAIL</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@400;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); }
    .glass { background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255,255,255,0.5); }
    .font-google { font-family: 'Product Sans', Arial, sans-serif; font-weight: 700; letter-spacing: -1px; }
    .badge-new { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <div class="bg-gray-900 text-blue-300 text-[10px] px-4 py-2 flex justify-between font-bold shadow-sm">
    <div id="loc">📍 Jember, Jawa Timur</div>
    <div id="jam">00:00:00</div>
  </div>

  <div class="bg-blue-900 text-white text-[9px] px-4 py-1.5 flex justify-between items-center shadow-inner tracking-widest uppercase">
    <div>📱 Perangkat: <span class="text-blue-200">${dev}</span></div>
    <div class="text-right">🌐 IP: <span class="text-blue-200">${ip}</span> | ISP: <span class="text-blue-200">${isp}</span></div>
  </div>

  <div class="max-w-2xl mx-auto p-4 mt-6 flex-grow w-full text-center">
    
    <div class="mb-8">
      <h1 class="text-5xl font-google">
        <span style="color: #4285F4">H</span><span style="color: #EA4335">a</span><span style="color: #FBBC05">b</span><span style="color: #4285F4">i</span>
        <span style="color: #34A853" class="ml-2">M</span><span style="color: #EA4335">a</span><span style="color: #FBBC05">i</span><span style="color: #4285F4">l</span>
      </h1>
      <p class="text-gray-400 text-[10px] tracking-[0.2em] font-bold uppercase mt-2">Layanan Email Sementara</p>
    </div>

    <div class="glass p-8 rounded-3xl shadow-xl mb-8 border-t-4 border-blue-500">
      <input type="text" id="em" class="w-full p-4 rounded-xl border-2 border-blue-100 text-center bg-gray-50 text-blue-700 font-bold mb-5" readonly>
      <button onclick="sl()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 mb-4 uppercase text-sm">Salin Alamat Email 📋</button>
      <div class="flex gap-3">
        <button onclick="gr(true)" class="w-full bg-white border-2 border-red-500 text-red-500 font-bold py-3 rounded-xl hover:bg-red-50 transition uppercase text-xs">Ganti Nama Email</button>
      </div>
    </div>

    <div class="glass rounded-3xl shadow-xl overflow-hidden mb-10 text-left">
      <div class="bg-white px-6 py-5 border-b flex justify-between items-center font-bold">
        <h2 class="text-gray-800 text-sm flex items-center gap-2">📥 KOTAK MASUK</h2>
        <div class="flex items-center gap-3">
          <span class="text-[9px] text-green-500 font-bold badge-new uppercase">Auto-Sync 🟢</span>
          <span class="bg-gray-800 text-white rounded-full px-3 py-1 text-xs" id="ct">0</span>
        </div>
      </div>
      <div id="ib" class="p-6 space-y-4 min-h-[200px] bg-gray-50">
        <p class="text-center text-gray-500 py-12 text-sm">Kotak masuk kosong. Menunggu pesan...</p>
      </div>
    </div>

    <div class="glass rounded-3xl p-8 text-center shadow-md border-t-4 border-green-500 mb-10">
      <h3 class="text-xl font-bold mb-3 text-gray-800">Layanan Anti-Spam Terbaik</h3>
      <p class="text-sm text-gray-600 mb-6 leading-relaxed">
        Lindungi privasi utama Anda dari email promosi dan spam. Gunakan Habi Mail untuk mendaftar layanan sementara. Pesan akan terhapus secara otomatis dalam waktu <b>7 Menit</b> untuk keamanan maksimal.
      </p>
      <a href="https://wa.me/6285119821813" target="_blank" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg inline-flex items-center gap-2 text-xs uppercase transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
        Hubungi Habi
      </a>
    </div>
  </div>

  <footer class="mt-auto py-6 bg-gray-900 text-center">
    <p class="text-[10px] text-gray-400 font-bold uppercase">Copyright &copy; 2026 HABI MAIL. All Rights Reserved.</p>
  </footer>

  <script>
    const nD=['siti','ayu','dewi','sri','indah','ratna','fitri','wulan','rina','putri'];
    const nB=['ningsih','wati','sari','astuti','rahayu','lestari','susanti','wahyuni'];
    let lc=0;
    
    function gr(m=false){if(!m&&localStorage.getItem('he')){document.getElementById('em').value=localStorage.getItem('he');return;}const e=nD[Math.floor(Math.random()*nD.length)]+'.'+nB[Math.floor(Math.random()*nB.length)]+Math.floor(Math.random()*999)+'@habisuno.my.id';document.getElementById('em').value=e;localStorage.setItem('he',e);}
    function sl(){navigator.clipboard.writeText(document.getElementById('em').value);alert('Email disalin!');}
    async function hp(id){if(!confirm('Hapus pesan ini?'))return;const r=await fetch('/api/del',{method:'POST',body:JSON.stringify({id})});if(r.ok){lc=0;chk();}}
    
    async function chk() {
      try {
        const r = await fetch('/api/pesan?_=' + new Date().getTime()); 
        const d = await r.json();
        document.getElementById('ct').innerText = d.length;
        
        if (d.length !== lc) {
          lc = d.length;
          if(d.length === 0){ document.getElementById('ib').innerHTML='<p class="text-center text-gray-500 py-12 text-sm">Kotak masuk kosong. Menunggu pesan...</p>'; return; }
          document.getElementById('ib').innerHTML = d.map((p, i) => \`
            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative transition-all">
              <div class="flex justify-between items-center mb-2">
                <div class="text-[9px] font-bold text-blue-500 uppercase">\${p.t}</div>
                \${i === 0 ? '<span class="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded badge-new">NEW</span>' : ''}
              </div>
              <div class="font-bold text-gray-900 text-base mb-1">\${p.s}</div>
              <div class="text-[11px] text-gray-600 mb-4">Dari: <b>\${p.f}</b></div>
              <div class="bg-gray-50 p-4 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 border border-gray-100">\${p.b}</div>
              <button onclick="hp('\${p.id}')" class="text-[10px] font-bold text-red-500 bg-red-50 px-4 py-2 rounded-lg uppercase border border-red-100">Hapus Pesan</button>
            </div>\`).join('');
        }
      } catch (e) {}
    }
    window.onload = () => { 
      gr(); 
      setInterval(() => { 
        document.getElementById('jam').innerText = new Date().toLocaleTimeString('id-ID', {hour12:false}).replace(/\\./g,':'); 
        chk(); 
      }, 1000); 
    };
  </script>
</body>
</html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
