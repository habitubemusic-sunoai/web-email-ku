export default {
  async email(message, env) {
    let rawEmail = "";
    const reader = message.raw.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawEmail += new TextDecoder().decode(value);
    }

    // Membersihkan isi email agar hanya pesan intinya saja
    let cleanBody = rawEmail;
    try {
      if (rawEmail.includes("Content-Type: text/plain")) {
        let parts = rawEmail.split("Content-Type: text/plain");
        if (parts[1]) {
          cleanBody = parts[1].split("--")[0].trim();
        }
      }
    } catch (e) {
      cleanBody = "Pesan diterima (Format Kompleks)";
    }

    const data = {
      to: message.to,
      from: message.from,
      subject: message.headers.get("subject") || "Tanpa Judul",
      body: cleanBody,
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
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); }
        .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5); }
        @keyframes kilau { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .logo-keren { font-family: 'Montserrat', sans-serif; background: linear-gradient(110deg, #1e3a8a 20%, #60a5fa 50%, #1e3a8a 80%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: kilau 5s linear infinite; }
      </style>
    </head>
    <body class="min-h-screen flex flex-col">
      <div class="bg-gray-900 text-blue-400 p-2 text-center text-[10px] font-bold tracking-widest shadow-lg" id="topInfo">SISTEM AKTIF | MEMUAT DATA...</div>

      <div class="max-w-2xl mx-auto p-4 w-full flex-grow mt-6">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-black logo-keren">HABI UNLIMITED MAIL</h1>
          <p class="text-[10px] text-gray-400 tracking-widest uppercase">Premium Temp Mail System</p>
        </div>

        <div class="glass-card p-6 rounded-3xl shadow-xl mb-6">
          <input type="text" id="emailBox" class="w-full p-4 rounded-2xl bg-white border-2 border-blue-100 text-center font-bold text-blue-700 mb-4" readonly>
          <div class="flex gap-2">
            <button onclick="salin()" class="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition">SALIN</button>
            <button onclick="generateRandom(true)" class="flex-1 border-2 border-red-400 text-red-500 font-bold py-3 rounded-xl active:scale-95 transition text-sm">ACAK NAMA</button>
          </div>
          <button onclick="aktifkanNotif()" id="btnNotif" class="w-full mt-3 py-2 text-[10px] font-bold text-indigo-500 border border-indigo-200 rounded-lg">🔔 AKTIFKAN NOTIFIKASI & SUARA</button>
        </div>

        <div class="glass-card rounded-3xl shadow-xl overflow-hidden">
          <div class="p-4 bg-white/50 border-b flex justify-between items-center text-gray-700">
            <h2 class="font-bold text-sm flex items-center gap-2">📥 KOTAK MASUK <span class="text-[10px] text-green-500 animate-pulse">LIVE 🟢</span></h2>
            <span id="count" class="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-bold">0</span>
          </div>
          <div id="inbox" class="p-4 space-y-4">
            <p class="text-center text-gray-400 text-xs py-10 tracking-widest">Menunggu pesan masuk...</p>
          </div>
        </div>
      </div>

      <footer class="p-6 text-center text-[9px] font-bold text-gray-400 tracking-widest uppercase">
        Dibuat Oleh Habi Mail Unlimited &copy; 2026
      </footer>

      <script>
        const namaDepan = ['siti', 'ayu', 'dewi', 'sri', 'indah', 'ratna', 'fitri', 'nisa', 'nurul', 'putri', 'wulan', 'rina'];
        const namaBelakang = ['ningsih', 'wati', 'sari', 'astuti', 'rahayu', 'lestari', 'susanti', 'wahyuni', 'agustin'];
        let lastCount = 0;
        const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

        function generateRandom(manual = false) {
          if(!manual && localStorage.getItem('habiEmail')) { document.getElementById('emailBox').value = localStorage.getItem('habiEmail'); return; }
          const mail = namaDepan[Math.floor(Math.random()*namaDepan.length)] + '.' + namaBelakang[Math.floor(Math.random()*namaBelakang.length)] + Math.floor(Math.random()*999) + '@habisuno.my.id';
          document.getElementById('emailBox').value = mail;
          localStorage.setItem('habiEmail', mail);
        }

        function salin() { navigator.clipboard.writeText(document.getElementById('emailBox').value); alert('Email disalin!'); }
        
        function aktifkanNotif() { 
          Notification.requestPermission().then(p => { if(p === 'granted') { beep.play(); document.getElementById('btnNotif').innerText = "NOTIFIKASI AKTIF ✅"; }});
        }

        async function cekPesan() {
          try {
            const res = await fetch('/api/pesan');
            const data = await res.json();
            document.getElementById('count').innerText = data.length;
            
            if (data.length > lastCount) {
              const baru = data[0];
              if (lastCount !== 0) {
                beep.play().catch(e => {});
                if (Notification.permission === 'granted') {
                  new Notification("HABI MAIL: Pesan Baru!", { body: "Dari: " + baru.from });
                }
              }
              lastCount = data.length;
              renderPesan(data);
            }
          } catch (e) {}
        }

        function renderPesan(pesan) {
          const container = document.getElementById('inbox');
          if (pesan.length === 0) return;
          container.innerHTML = pesan.map(p => \`
            <div class="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm transition-all">
              <div class="flex justify-between items-start mb-2">
                <div class="font-bold text-blue-900 text-xs">\${p.subject}</div>
                <div class="text-[8px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded">\${p.waktu}</div>
              </div>
              <div class="text-[9px] text-gray-500 mb-3">Dari: <b>\${p.from}</b></div>
              <div class="text-[11px] text-gray-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 leading-relaxed whitespace-pre-wrap">\${p.body}</div>
            </div>
          \`).join('');
        }

        window.onload = () => {
          generateRandom();
          setInterval(cekPesan, 1000);
          if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(p => {
                document.getElementById('topInfo').innerText = "JEMBER, JAWA TIMUR | LIVE SYNC ACTIVE";
             });
          }
        }
      </script>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
