export default {
  async email(message, env) {
    let raw = "";
    const reader = message.raw.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += new TextDecoder().decode(value);
    }
    let body = raw.includes("Content-Type: text/plain") ? raw.split("Content-Type: text/plain")[1].split("--")[0].trim() : "Pesan diterima";
    const data = {
      from: message.from,
      subject: message.headers.get("subject") || "Tanpa Judul",
      body: body,
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
      <title>HABI MAIL</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Righteous&family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 50%, #f8fafc 100%); }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5); }
        @keyframes k { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .logo { font-family: 'Righteous', cursive; background: linear-gradient(110deg, #1e3a8a 30%, #60a5fa 50%, #1e3a8a 70%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: k 5s ease-in-out 1; }
        .kilau { background: linear-gradient(110deg, #4b5563 30%, #fff 50%, #4b5563 70%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: k 5s linear infinite; }
      </style>
    </head>
    <body class="text-gray-800 min-h-screen flex flex-col">
      <div class="bg-gray-900 text-blue-400 text-[10px] px-4 py-2 flex justify-between font-bold">
        <div id="loc">📍 Jember, Jawa Timur</div>
        <div id="jam">00:00:00</div>
      </div>
      <div class="max-w-xl mx-auto p-4 mt-6 w-full flex-grow">
        <div class="text-center mb-8">
          <h1 class="text-4xl logo">HABI UNLIMITED MAIL</h1>
          <p class="text-gray-400 text-[10px] tracking-widest mt-1">PREMIUM TEMP MAIL</p>
        </div>
        <div class="glass p-6 rounded-3xl shadow-xl mb-6 text-center">
          <input type="text" id="em" class="w-full p-4 rounded-2xl border-2 border-blue-100 text-center bg-white text-blue-700 font-bold mb-4 shadow-inner" readonly>
          <button onclick="sl()" class="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mb-3 shadow-lg active:scale-95 transition">SALIN EMAIL 📋</button>
          <div class="flex gap-2">
            <button onclick="gr(true)" class="flex-1 border-2 border-red-500 text-red-500 font-bold py-2 rounded-xl bg-white text-xs">GANTI NAMA</button>
            <button onclick="an()" id="bn" class="flex-1 border-2 border-indigo-500 text-indigo-500 font-bold py-2 rounded-xl bg-white text-xs">🔔 NOTIF</button>
          </div>
        </div>
        <div class="glass rounded-3xl shadow-xl overflow-hidden mb-8">
          <div class="bg-white/50 px-6 py-4 border-b flex justify-between items-center font-bold">
            <h2>📥 KOTAK MASUK</h2>
            <div class="flex items-center gap-2"><span class="text-[10px] text-green-500 animate-pulse">LIVE 🟢</span><span class="bg-blue-600 text-white rounded-full px-3 py-1 text-xs" id="ct">0</span></div>
          </div>
          <div id="ib" class="p-6 space-y-4 text-center text-gray-400 text-xs">Menunggu email masuk...</div>
        </div>
        <div class="glass rounded-3xl p-6 text-center shadow-lg border-t-4 border-t-blue-500">
          <p class="text-xs text-gray-600 mb-4">Dibuat oleh <b>Habi</b>. Ingin tambah domain baru? Hubungi:</p>
          <a href="https://wa.me/6285119821813" target="_blank" class="bg-green-500 text-white font-bold py-2 px-6 rounded-full text-sm shadow-md">Chat WA Habi</a>
        </div>
      </div>
      <footer class="mt-auto py-6 bg-gray-900 text-center text-[10px] font-bold kilau uppercase">
        Copyright &copy; 2026 HABI UNLIMITED MAIL. All Rights Reserved.
      </footer>
      <script>
        const df = ['siti','ayu','dewi','sri','indah','ratna','fitri','wulan','rina','putri'];
        const bl = ['ningsih','wati','sari','astuti','rahayu','lestari','susanti'];
        let lc = 0; const sd = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        function gr(m = false) {
          if(!m && localStorage.getItem('he')) { document.getElementById('em').value = localStorage.getItem('he'); return; }
          const e = df[Math.floor(Math.random()*df.length)] + '.' + bl[Math.floor(Math.random()*bl.length)] + Math.floor(Math.random()*999) + '@habisuno.my.id';
          document.getElementById('em').value = e; localStorage.setItem('he', e);
        }
        function sl() { navigator.clipboard.writeText(document.getElementById('em').value); alert('Disalin!'); }
        function an() { Notification.requestPermission().then(p => { if(p==='granted') { sd.play(); document.getElementById('bn').innerText = "🔔 AKTIF"; }}); }
        function uw() {
          const n = new Date(); let h = n.getHours(); const m = String(n.getMinutes()).padStart(2,'0'); const s = String(n.getSeconds()).padStart(2,'0');
          const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
          document.getElementById('jam').innerText = h + ':' + m + ':' + s + ' ' + ap;
        }
        async function mp() {
          try {
            const r = await fetch('/api/pesan'); const d = await r.json();
            document.getElementById('ct').innerText = d.length;
            if (d.length > lc) {
              if (lc !== 0) { sd.play(); if(Notification.permission==='granted') new Notification("Habi Mail: Pesan Baru!"); }
              lc = d.length;
              document.getElementById('ib').innerHTML = d.map(p => \`
                <div class="text-left border-b border-gray-100 pb-4">
                  <div class="flex justify-between font-bold text-blue-900 text-sm"><span>\${p.subject}</span><span class="text-[9px] text-gray-400">\${p.waktu}</span></div>
                  <div class="text-[9px] text-gray-500 mb-2">Dari: \${p.from}</div>
                  <div class="bg-gray-800 p-3 rounded-xl text-[11px] text-gray-200 whitespace-pre-wrap">\${p.body}</div>
                </div>
              \`).join('');
            }
          } catch (e) {}
        }
        window.onload = () => { gr(); uw(); setInterval(uw, 1000); setInterval(mp, 1000); };
      </script>
    </body>
    </html>\`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
