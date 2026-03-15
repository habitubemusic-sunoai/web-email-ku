export default {
  async email(message, env) {
    let rawEmail = "";
    const reader = message.raw.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawEmail += new TextDecoder().decode(value);
    }

    let bodyText = "Isi pesan tidak terbaca";
    try {
      if (rawEmail.includes("Content-Type: text/plain")) {
        bodyText = rawEmail.split("Content-Type: text/plain")[1].split("--")[0].trim();
      } else {
        bodyText = rawEmail.split("\n\n").slice(1).join("\n").trim().substring(0, 500);
      }
    } catch (e) { bodyText = "Pesan diterima (Format HTML/Kompleks)"; }

    const data = {
      to: message.to,
      from: message.from,
      subject: message.headers.get("subject") || "Tanpa Judul",
      body: bodyText,
      waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };
    await env.DB.put(Date.now().toString(), JSON.stringify(data), { expirationTtl: 86400 });
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/pesan") {
      const { keys } = await env.DB.list();
      let emails = [];
      for (let key of keys) {
        const val = await env.DB.get(key.name);
        if (val) emails.push(JSON.parse(val));
      }
      return new Response(JSON.stringify(emails.reverse()), {headers: {'Content-Type': 'application/json'}});
    }

    const html = `<!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HABI UNLIMITED MAIL</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Righteous&family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 50%, #f8fafc 100%); }
        .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
        @keyframes kilau-logo { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .logo-keren { font-family: 'Righteous', cursive; background: linear-gradient(110deg, #1e3a8a 30%, #60a5fa 50%, #1e3a8a 70%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: kilau-logo 5s ease-in-out 1; }
        @keyframes kilau-lambat { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .text-kilau { background: linear-gradient(110deg, #4b5563 30%, #f59e0b 50%, #4b5563 70%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: kilau-lambat 5s linear infinite; }
      </style>
    </head>
    <body class="text-gray-800 flex flex-col min-h-screen">
      <div class="bg-gray-900 text-gray-200 text-xs sm:text-sm px-4 py-2 flex justify-between items-center shadow-md">
        <div id="lokasiTeks">📍 Jember, Jawa Timur</div>
        <div id="jamRealtime" class="font-mono font-bold text-blue-400">00:00:00</div>
      </div>
      <div class="max-w-3xl mx-auto p-4 mt-8 flex-grow w-full">
        <div class="flex flex-col items-center mb-8 text-center">
          <h1 class="text-4xl sm:text-5xl font-extrabold mb-2 logo-keren">HABI UNLIMITED MAIL</h1>
          <p class="text-gray-500 mb-6 font-medium uppercase tracking-widest text-xs">Layanan Email Sementara Premium</p>
          <div class="w-full max-w-lg glass-card p-6 rounded-3xl shadow-xl">
            <input type="text" id="emailBox" class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl text-center bg-gray-50 text-blue-600 font-bold mb-4" readonly>
            <button onclick="salin()" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mb-3 shadow-lg active:scale-95 transition">SALIN EMAIL 📋</button>
            <div class="flex gap-2">
              <button onclick="generateRandom(true)" class="flex-1 border-2 border-red-500 text-red-500 font-bold py-2 rounded-xl bg-white text-xs">GANTI NAMA</button>
              <button onclick="aktifkanNotif()" id="btnNotif" class="flex-1 border-2 border-indigo-500 text-indigo-500 font-bold py-2 rounded-xl bg-white text-xs">🔔 NOTIF</button>
            </div>
          </div>
        </div>
        <div class="glass-card rounded-3xl shadow-xl overflow-hidden mb-8">
          <div class="bg-white/50 px-6 py-4 border-b flex justify-between items-center text-gray-700">
            <h2 class="font-bold text-xl">📥 Kotak Masuk</h2>
            <div class="flex items-center gap-2"><span class="text-[10px] text-green-500 animate-pulse font-bold uppercase">Live Sync 🟢</span><span class="bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-bold" id="count">0</span></div>
          </div>
          <div id="inbox" class="p-6 divide-y divide-gray-100">
            <p class="text-center text-gray-400 py-10">Menunggu email masuk...</p>
          </div>
        </div>
        <div class="glass-card rounded-3xl p-8 text-center shadow-lg border-t-4 border-t-blue-500">
          <h3 class="text-xl font-bold mb-3 text-gray-800">Tentang HABI Unlimited Mail</h3>
          <p class="text-sm text-gray-600 mb-6 leading-relaxed">Selamat datang di layanan email sementara terbaik. Dibuat khusus oleh <strong>Habi</strong> untuk privasi Anda. Ingin tambah domain baru? Hubungi saya:</p>
          <a href="https://wa.me/6285119821813" target="_blank" class="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105">Chat WA Habi</a>
        </div>
      </div>
      <footer class="mt-auto py-8 bg-gray-900 text-center">
        <p class="text-xs font-bold text-kilau uppercase tracking-widest">Copyright &copy; 2026 HABI UNLIMITED MAIL. All Rights Reserved.</p>
      </footer>
      <script>
        const namaDepan = ['siti', 'ayu', 'dewi', 'sri', 'indah', 'ratna', 'fitri', 'wulan', 'rina', 'putri', 'nisa'];
        const namaBelakang = ['ningsih', 'wati', 'sari', 'astuti', 'rahayu', 'lestari', 'susanti', 'wahyuni', 'agustin'];
        let lastCount = 0;
        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        function generateRandom(manual = false) {
          if(!manual && localStorage.getItem('habiEmail')) { document.getElementById('emailBox').value = localStorage.getItem('habiEmail'); return; }
          const email = namaDepan[Math.floor(Math.random()*namaDepan.length)] + '.' + namaBelakang[Math.floor(Math.random()*namaBelakang.length)] + Math.floor(Math.random()*999) + '@habisuno.my.id';
          document.getElementById('emailBox').value = email;
          localStorage.setItem('habiEmail', email);
        }
        function salin() { navigator.clipboard.writeText(document.getElementById('emailBox').value); alert('Email disalin!'); }
        function aktifkanNotif() { Notification.requestPermission().then(p => { if(p === 'granted') { sound.play(); document.getElementById('btnNotif').innerText = "🔔 AKTIF"; }}); }
        function updateWaktu() {
          const now = new Date();
          let h = now.getHours(); const m = String(now.getMinutes()).padStart(2,'0'); const s = String(now.getSeconds()).padStart(2,'0');
          const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
          document.getElementById('jamRealtime').innerText = h + ':' + m + ':' + s + ' ' + ampm;
        }
        async function muatPesan() {
          try {
            const res = await fetch('/api/pesan');
            const data = await res.json();
            document.getElementById('count').innerText = data.length;
            if (data.length > lastCount) {
              if (lastCount !== 0) { sound.play(); if(Notification.permission==='granted') new Notification("Habi Mail: Pesan Baru!"); }
              lastCount = data.length;
              renderPesan(data);
            }
          } catch (e) {}
        }
        function renderPesan(pesan) {
          const container = document.getElementById('inbox');
          if (pesan.length === 0) return;
          container.innerHTML = pesan.map(p => \`
            <div class="py-6 transition-all">
              <div class="flex justify-between mb-2"><h3 class="font-bold text-blue-900 text-lg">\${p.subject}</h3><span class="text-[10px] font-bold text-blue-400 bg-blue-50 px-2 py-1 rounded">\${p.waktu}</span></div>
              <div class="text-[10px] text-gray-500 mb-3">Dari: <b>\${p.from}</b></div>
              <div class="bg-gray-800 p-4 rounded-2xl text-xs text-gray-100 shadow-inner whitespace-pre-wrap leading-relaxed">\${p.body}</div>
            </div>
          \`).join('');
        }
        window.onload = () => { generateRandom(); updateWaktu(); setInterval(updateWaktu, 1000); setInterval(muatPesan, 1000); };
      </script>
    </body>
    </html>\`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
