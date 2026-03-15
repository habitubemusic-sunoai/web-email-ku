export default {
  async email(m, e) {
    let r = "";
    const rd = m.raw.getReader();
    while (true) { const { done, value } = await rd.read(); if (done) break; r += new TextDecoder().decode(value); }
    let b = r.includes("Content-Type: text/plain") ? r.split("Content-Type: text/plain")[1].split("--")[0].trim() : "Format email ini hanya mendukung teks biasa.";
    const d = {
      id: Date.now().toString(),
      f: m.from,
      s: m.headers.get("subject") || "Tanpa Judul",
      b: b,
      t: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    await e.DB.put(d.id, JSON.stringify(d), { expirationTtl: 28800 });
  },

  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/pesan") {
      const { keys } = await env.DB.list();
      let ems = [];
      for (let k of keys) { const v = await env.DB.get(k.name); if (v) ems.push(JSON.parse(v)); }
      return new Response(JSON.stringify(ems.sort((a,b) => b.id - a.id)), {headers: {'Content-Type': 'application/json'}});
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
  <title>HABI MAIL</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: sans-serif; background: #f0f4f8; }
    .glass { background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
  </style>
</head>
<body class="p-4">
  <div class="max-w-xl mx-auto">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-blue-800">HABI UNLIMITED MAIL</h1>
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auto-Sync & Notif HP Aktif</p>
    </div>

    <div class="glass p-6 mb-6 text-center border-b-4 border-blue-500">
      <input type="text" id="em" class="w-full p-3 rounded-lg border border-gray-200 text-center font-bold text-blue-600 mb-4" readonly>
      <div class="flex gap-2 mb-4">
        <button onclick="sl()" class="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg">SALIN EMAIL</button>
        <button onclick="gr(true)" class="bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-xl">GANTI</button>
      </div>
      <button onclick="an()" id="bn" class="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg border border-indigo-100 text-[10px]">🔔 IZINKAN NOTIFIKASI HP</button>
    </div>

    <div class="glass overflow-hidden">
      <div class="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 class="font-bold text-sm">📥 KOTAK PESAN <span class="text-green-500 animate-pulse ml-2">🟢</span></h2>
        <span id="ct" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">0</span>
      </div>
      <div id="ib" class="p-4 space-y-4 min-h-[200px] text-xs">
        <p class="text-center text-gray-400 py-10">Menunggu pesan masuk...</p>
      </div>
    </div>
  </div>

  <div class="text-center mt-8 space-y-2">
    <a href="https://wa.me/6285119821813" class="inline-block bg-green-500 text-white text-xs font-bold py-2 px-6 rounded-full shadow-md">Chat WA Habi</a>
    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 HABI UNLIMITED MAIL</p>
  </div>

  <script>
    let lc = 0; const sd = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    function gr(m=false){if(!m&&localStorage.getItem('he')){document.getElementById('em').value=localStorage.getItem('he');return;}const e='user'+Math.floor(Math.random()*9999)+'@habisuno.my.id';document.getElementById('em').value=e;localStorage.setItem('he',e);}
    function sl(){navigator.clipboard.writeText(document.getElementById('em').value);alert('Disalin!');}
    function an(){Notification.requestPermission().then(p=>{if(p==='granted'){sd.play();document.getElementById('bn').innerText="✅ NOTIFIKASI HP AKTIF";}});}
    
    async function hp(id){
      if(confirm('Hapus pesan?')){ await fetch('/api/del',{method:'POST',body:JSON.stringify({id})}); lc=0; chk(); }
    }

    async function chk() {
      try {
        const r = await fetch('/api/pesan'); const d = await r.json();
        document.getElementById('ct').innerText = d.length;
        if (d.length !== lc) {
          if (d.length > lc && lc !== 0) {
            sd.play();
            if(Notification.permission==='granted') new Notification("Pesan: "+d[0].s,{body:"Dari: "+d[0].f});
          }
          lc = d.length;
          if(d.length === 0){ document.getElementById('ib').innerHTML='<p class="text-center py-10">Kosong</p>'; return; }
          document.getElementById('ib').innerHTML = d.map(p => \`
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
              <div class="text-[8px] font-bold text-blue-500 mb-1">\${p.t}</div>
              <div class="font-bold text-gray-900 mb-1">\${p.s}</div>
              <div class="text-[9px] text-gray-500 mb-2">Dari: \${p.f}</div>
              <div class="bg-white p-3 rounded-lg border border-gray-100 mb-3 whitespace-pre-wrap">\${p.b}</div>
              <button onclick="hp('\${p.id}')" class="text-[9px] font-bold text-red-500 uppercase tracking-widest">Hapus Manual</button>
            </div>
          \`).join('');
        }
      } catch (e) {}
    }

    window.onload = () => { gr(); setInterval(chk, 1000); };
  </script>
</body>
</html>\`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
