export default {
  async email(m, e) {
    let r = "";
    const rd = m.raw.getReader();
    while (true) { const { done, value } = await rd.read(); if (done) break; r += new TextDecoder().decode(value); }
    let b = r.includes("Content-Type: text/plain") ? r.split("Content-Type: text/plain")[1].split("--")[0].trim() : "Format HTML/Kompleks diterima";
    const d = {
      id: Date.now().toString(),
      f: m.from || "Sistem",
      s: m.headers.get("subject") || "Tanpa Judul",
      b: b || "Isi Kosong",
      t: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    };
    await e.DB.put(d.id, JSON.stringify(d), { expirationTtl: 28800 });
  },

  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/pesan") {
      const { keys } = await env.DB.list();
      let ems = [];
      for (let k of keys) { const v = await env.DB.get(k.name); if (v) { try { ems.push(JSON.parse(v)); } catch(err) {} } }
      // Pastikan paling baru (ID terbesar/Waktu terbaru) ada di paling atas
      return new Response(JSON.stringify(ems.sort((a,b) => b.id - a.id).reverse()), {headers: {'Content-Type': 'application/json'}});
    }
    if (u.pathname === "/api/del" && req.method === "POST") {
      const { id } = await req.json();
      await env.DB.delete(id);
      return new Response("OK");
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HABI MAIL UNLIMITED</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@700&family=Poppins:wght@400;600;800&family=Playfair+Display:ital,wght@1,700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); }
    .glass { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); }
    .g-blue { color: #4285F4; } .g-red { color: #EA4335; } .g-yellow { color: #FBBC05; } .g-green { color: #34A853; }
    .logo-font { font-family: 'Product Sans', sans-serif; font-weight: 700; font-size: 2.8rem; letter-spacing: -1.5px; }
    @keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    .kilau-awal { background: linear-gradient(110deg, transparent 40%, #fff 50%, transparent 60%); background-size: 200% auto; animation: shine 5s ease-in-out 1; }
    .kilau-footer { background: linear-gradient(110deg, #64748b 40%, #ffffff 50%, #64748b 60%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: shine 5s linear infinite; }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
    .wa-shake { animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) 12; }
    .font-estetik { font-family: 'Playfair Display', serif; }
    .badge-new { animation: pulse 1.5s infinite; background: #EA4335; color: white; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <div class="bg-gray-900 text-blue-300 text-[10px] px-4 py-2 flex justify-between font-bold shadow-md">
    <div id="loc">📍 Jember, Jawa Timur</div>
    <div id="jam">00:00:00</div>
  </div>

  <div class="max-w-2xl mx-auto p-4 mt-8 flex-grow w-full text-center">
    <div class="mb-10 kilau-awal inline-block px-4">
      <span class="logo-font g-blue">H</span><span class="logo-font g-red">a</span><span class="logo-font g-yellow">b</span><span class="logo-font g-blue">i</span>
      <span class="logo-font g-green ml-2">M</span><span class="logo-font g-red">a</span><span class="logo-font g-blue">i</span><span class="logo-font g-yellow">l</span>
    </div>

    <div class="glass p-8 rounded-[2.5rem] shadow-2xl mb-8 border-t-4 border-blue-500">
      <input type="text" id="em" class="w-full p-4 rounded-2xl border-2 border-blue-50 text-center bg-white text-blue-700 font-bold mb-5 shadow-inner" readonly>
      <button onclick="sl()" class="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 mb-4 uppercase">Salin Alamat Email 📋</button>
      <div class="flex gap-3">
        <button onclick="gr(true)" class="flex-1 bg-white border-2 border-red-400 text-red-500 font-bold py-3 rounded-2xl text-[10px] uppercase">Ganti Nama</button>
        <button onclick="an()" id="bn" class="flex-1 bg-white border-2 border-indigo-400 text-indigo-500 font-bold py-3 rounded-2xl text-[10px] uppercase">🔔 Notif HP</button>
      </div>
    </div>

    <div class="glass rounded-[2.5rem] shadow-2xl overflow-hidden mb-10 text-left">
      <div class="bg-white/50 px-8 py-5 border-b flex justify-between items-center font-bold">
        <h2 class="text-gray-800 text-sm">📥 KOTAK PESAN</h2>
        <div class="flex items-center gap-3">
          <button onclick="chk()" class="text-[9px] bg-white border border-gray-300 px-3 py-1 rounded-full active:bg-gray-100 uppercase">Refresh 🔄</button>
          <span class="bg-blue-600 text-white rounded-full px-4 py-1 text-sm shadow-md" id="ct">0</span>
        </div>
      </div>
      <div id="ib" class="p-6 space-y-6 min-h-[250px]"><p class="text-center text-gray-400 py-16 text-sm italic">Menunggu pesan masuk...</p></div>
    </div>

    <div class="glass rounded-[2.5rem] p-8 text-center shadow-lg border-t-4 border-green-500 mb-10">
      <h3 class="text-2xl font-extrabold mb-4 text-gray-800">Definisi Kebebasan Tanpa Batas</h3>
      <p class="text-sm text-gray-600 mb-6 leading-relaxed font-medium">
        <span class="font-estetik text-lg text-blue-600">"HABI MAIL UNLIMITED"</span> bukan sekadar email sementara. Kami adalah tameng privasi Anda di dunia digital. Nikmati akses pendaftaran akun massal, verifikasi instan, dan <span class="text-blue-600 font-bold">keamanan data mutlak</span> tanpa jejak spam.
        <br><br>
        <span class="block mt-4 italic font-semibold text-gray-500">Pesan otomatis terhapus dalam 8 jam demi menjaga kerahasiaan Anda.</span>
      </p>
      <a href="https://wa.me/6285119821813" target="_blank" class="wa-shake bg-green-500 text-white font-bold py-3 px-10 rounded-full shadow-xl inline-block text-xs uppercase tracking-widest">Hubungi Pengembang</a>
    </div>
  </div>

  <footer class="mt-auto py-8 bg-gray-900 text-center">
    <p class="text-[10px] font-bold tracking-[0.4em] uppercase kilau-footer">Copyright &copy; 2026 HABI MAIL UNLIMITED. All Rights Reserved.</p>
  </footer>

  <script>
    const nD=['siti','ayu','dewi','sri','indah','ratna','fitri','wulan','rina','putri'];
    const nB=['ningsih','wati','sari','astuti','rahayu','lestari','susanti','wahyuni'];
    let lc=0; const sd=new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    function gr(m=false){if(!m&&localStorage.getItem('he')){document.getElementById('em').value=localStorage.getItem('he');return;}const e=nD[Math.floor(Math.random()*nD.length)]+'.'+nB[Math.floor(Math.random()*nB.length)]+Math.floor(Math.random()*999)+'@habisuno.my.id';document.getElementById('em').value=e;localStorage.setItem('he',e);}
    function sl(){navigator.clipboard.writeText(document.getElementById('em').value);alert('Email disalin!');}
    function an(){Notification.requestPermission().then(p=>{if(p==='granted'){sd.play();document.getElementById('bn').innerText="✅ NOTIF AKTIF";}});}
    async function hp(id){if(!confirm('Hapus pesan?'))return;const r=await fetch('/api/del',{method:'POST',body:JSON.stringify({id})});if(r.ok){lc=0;chk();}}
    async function chk() {
      try {
        const r = await fetch('/api/pesan'); const d = await r.json();
        document.getElementById('ct').innerText = d.length;
        if (d.length !== lc) {
          if (d.length > lc && lc !== 0) { sd.play(); if(Notification.permission==='granted') new Notification("HABI MAIL: "+d[0].s,{body:"Dari: "+d[0].f}); }
          lc = d.length;
          if(d.length === 0){ document.getElementById('ib').innerHTML='<p class="text-center py-20 text-gray-400 italic">Kotak pesan kosong</p>'; return; }
          document.getElementById('ib').innerHTML = d.map((p, index) => \`
            <div class="bg-white/80 p-6 rounded-3xl border border-gray-100 shadow-sm relative transition-all">
              <div class="flex justify-between items-center mb-2">
                <div class="text-[8px] font-bold text-blue-500 uppercase tracking-widest">\${p.t}</div>
                \${index === 0 && d.length > 0 ? '<span class="badge-new">NEW</span>' : ''}
              </div>
              <div class="font-bold text-gray-900 text-base mb-1">\${p.s}</div>
              <div class="text-[10px] text-gray-500 mb-4">Dari: <b>\${p.f}</b></div>
              <div class="bg-gray-800 p-5 rounded-2xl text-[12px] text-gray-200 leading-relaxed whitespace-pre-wrap mb-4 shadow-inner">\${p.b}</div>
              <button onclick="hp('\${p.id}')" class="text-[9px] font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl uppercase">Hapus Manual</button>
            </div>\`).join('');
        }
      } catch (e) {}
    }
    window.onload = () => { gr(); setInterval(() => { document.getElementById('jam').innerText = new Date().toLocaleTimeString('id-ID', {hour12:true}).replace(/\\./g,':'); chk(); }, 1000); };
  </script>
</body>
</html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
