export default {
  async email(message, env) {
    let raw = "";
    const reader = message.raw.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += new TextDecoder().decode(value);
    }
    let body = raw.includes("Content-Type: text/plain") ? raw.split("Content-Type: text/plain")[1].split("--")[0].trim() : "Cek email masuk";
    
    const data = {
      id: Date.now().toString(),
      from: message.from,
      subject: message.headers.get("subject") || "Pesan Baru",
      body: body,
      waktu: new Date().toLocaleString("id-ID", { 
        timeZone: "Asia/Jakarta",
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    };
    // Auto hapus dalam 8 jam (28800 detik)
    await env.DB.put(data.id, JSON.stringify(data), { expirationTtl: 28800 });
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
      return new Response(JSON.stringify(emails.sort((a,b) => b.id - a.id)), {headers: {'Content-Type': 'application/json'}});
    }
    if (url.pathname === "/api/hapus" && request.method === "POST") {
      const { id } = await request.json();
      await env.DB.delete(id);
      return new Response("OK");
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
    body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); }
    .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5); }
    .logo { font-family: 'Righteous', cursive; background: linear-gradient(110deg, #1e3a8a 30%, #60a5fa 50%, #1e3a8a 70%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: k 5s ease-in-out infinite; }
    @keyframes k { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  </style>
</head>
<body class="min-h-screen flex flex-col text-gray-800">
  <div class="bg-gray-900 text-blue-400 text-[10px] px-4 py-2 flex justify-between font-bold shadow-lg">
    <div>📍 Jember, Jawa Timur</div>
    <div id="jam">00:00:00</div>
  </div>

  <div class="max-w-xl mx-auto p-4 mt-6 w-full flex-grow">
    <div class="text-center mb-6">
      <h1 class="text-4xl logo">HABI UNLIMITED MAIL</h1>
      <p class="text-gray-400 text-[9px] tracking-[0.2em] font-bold mt-1 uppercase">Notifikasi & Auto-Sync Aktif</p>
    </div>

    <div class="glass p-6 rounded-[2rem] shadow-xl mb-6 text-center border-b-4 border-blue-500">
      <input type="text" id="em" class="w-full p-4 rounded-2xl border-2 border-blue-100 text-center bg-white text-blue-700 font-bold mb-4 shadow-inner text-sm" readonly>
      <div class="flex gap-2 mb-3">
        <button onclick="sl()" class="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition">SALIN EMAIL</button>
        <button onclick="gr(true)" class="flex-1 bg-white border-2 border-red-500 text-red-500 font-bold py-4 rounded-2xl active:scale-95 transition text-xs">GANTI</button>
      </div>
      <button onclick="an()" id="bn" class="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-200 text-xs">🔔 IZINKAN NOTIFIKASI HP</button>
    </div>

    <div class="glass rounded-[2rem] shadow-xl overflow-hidden mb-6">
      <div class="bg-white/50 px-6 py-4 border-b flex justify-between items-center font-bold">
        <h2 class="text-sm">📥 KOTAK PESAN</h2>
        <div class="flex items-center gap-2 text-[10px]">
          <span class="text-green-500 animate-pulse">AUTO-SYNC 🟢</span>
          <span class="bg-blue-600 text-white rounded-full px-2 py-0.5" id="ct">0</span>
        </div>
      </div>
      <div id="ib" class="p-4 space-y-4 min-h-[200px]">
        <p class="text-center text-gray-400 text-xs py-10">Menunggu pesan masuk...</p>
      </div>
    </div>
  </div>

  <footer class="p-6 bg-gray-900 text-center">
    <a href="https://wa.me/6285119821813" target="_blank" class="inline-block bg-green-500 text-white font-bold py-2 px-6 rounded-full text-xs mb-4 shadow-lg">Chat WA Habi</a>
    <p class="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Copyright &copy; 2026 HABI UNLIMITED MAIL</p>
  </footer>

  <script>
    let lc = 0; const sd = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    function gr(m=false){if(!m&&localStorage.getItem('he')){document.getElementById('em').value=localStorage.getItem('he');return;}const e='user'+Math.floor(Math.random()*9999)+'@habisuno.my.id';document.getElementById('em').value=e;localStorage.setItem('he',e);}
    function sl(){navigator.clipboard.writeText(document.getElementById('em').value);alert('Disalin!');}
    function an(){Notification.requestPermission().then(p=>{if(p==='granted'){sd.play();document.getElementById('bn').innerText="✅ NOTIFIKASI HP AKTIF";}});}
    
    async function hp(id){
      if(confirm('Hapus pesan ini?')){
        await fetch('/api/hapus',{method:'POST',body:JSON.stringify({id})});
        lc=0; mp();
      }
    }

    async function mp() {
      try {
        const r = await fetch('/api/pesan'); const d = await r.json();
        document.getElementById('ct').innerText = d.length;
        if (d.length !== lc) {
          if (d.length > lc && lc !== 0) {
            sd.play();
            if(Notification.permission==='granted') new Notification("Pesan Baru: "+d[0].subject,{body:"Dari: "+d[0].from});
          }
          lc = d.length;
          if(d.length === 0){ document.getElementById('ib').innerHTML='<p class="text-center text-gray-400 text-xs py-10">Kotak masuk kosong</p>'; return; }
          document.getElementById('ib').innerHTML = d.map(p => \`
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative transition-all">
              <div class="text-[9px] font-bold text-blue-500 mb-1 uppercase tracking-tighter">\${p.waktu}</div>
              <div class="font-bold text-gray-900 text-sm mb-1">\${p.subject}</div>
              <div class="text-[10px] text-gray-500 mb-2">Dari: \${p.from}</div>
              <div class="bg-gray-50 p-3 rounded-xl text-xs text-gray-700 mb-3 whitespace-pre-wrap">\${p.body}</div>
              <button onclick="hp('\${p.id}')" class="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg">HAPUS MANUAL</button>
            </div>
          \`).join('');
        }
      } catch (e) {}
    }

    window.onload = () => {
      gr();
      setInterval(() => {
        const n = new Date();
        document.getElementById('jam').innerText = n.toLocaleTimeString('id-ID');
        mp(); // Cek pesan otomatis tiap detik (Auto-Sync)
      }, 1000);
    };
  </script>
</body>
</html>\`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
