export default {
  async email(m, e) {
    let r = "";
    const rd = m.raw.getReader();
    while (true) { const { done, value } = await rd.read(); if (done) break; r += new TextDecoder().decode(value); }
    let b = r.includes("Content-Type: text/plain") ? r.split("Content-Type: text/plain")[1].split("--")[0].trim() : "Format pesan tidak didukung sepenuhnya.";
    const d = {
      id: Date.now().toString(),
      f: m.from || "Sistem",
      s: m.headers.get("subject") || "Tanpa Judul",
      b: b || "Isi Kosong",
      t: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    };
    await e.DB.put(d.id, JSON.stringify(d), { expirationTtl: 420 }); // 420 detik = 7 menit
  },

  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/pesan") {
      const { keys } = await env.DB.list();
      let ems = [];
      for (let k of keys) { const v = await env.DB.get(k.name); if (v) { try { ems.push(JSON.parse(v)); } catch(err) {} } }
      return new Response(JSON.stringify(ems.sort(function(a,b){return b.id - a.id})), {headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}});
    }
    if (u.pathname === "/api/del" && req.method === "POST") {
      const { id } = await req.json();
      await env.DB.delete(id);
      return new Response("OK");
    }

    // Mendapatkan IP & ISP Asli dari Cloudflare
    const ip = req.headers.get('cf-connecting-ip') || 'IP Tidak Terdeteksi';
    const isp = (req.cf && req.cf.asOrganization) ? req.cf.asOrganization : 'ISP Tidak Terdeteksi';
    
    // Mendeteksi Merek Perangkat dari User-Agent
    const ua = req.headers.get('user-agent') || '';
    let dev = 'Desktop/Lainnya';
    if (/Vivo|V19|V20|V21|V22|V23|Y\d{2}/i.test(ua)) dev = 'Vivo';
    else if (/Oppo|CPH/i.test(ua)) dev = 'Oppo';
    else if (/Samsung|SM-/i.test(ua)) dev = 'Samsung';
    else if (/Xiaomi|Redmi|Poco|MI\s/i.test(ua)) dev = 'Xiaomi';
    else if (/Infinix|X6/i.test(ua)) dev = 'Infinix';
    else if (/Realme|RMX/i.test(ua)) dev = 'Realme';
    else if (/iPhone/i.test(ua)) dev = 'iPhone';
    else if (/iPad/i.test(ua)) dev = 'iPad';
    else if (/Android/i.test(ua)) dev = 'Android Lainnya';
    else if (/Windows/i.test(ua)) dev = 'Windows PC';

    const html = "<!DOCTYPE html>\n" +
"<html lang='id'>\n" +
"<head>\n" +
"  <meta charset='UTF-8'>\n" +
"  <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
"  <title>HABI MAIL</title>\n" +
"  <script src='https://cdn.tailwindcss.com'></script>\n" +
"  <link href='https://fonts.googleapis.com/css2?family=Product+Sans:wght@700&family=Poppins:wght@400;500;600;700&display=swap' rel='stylesheet'>\n" +
"  <style>\n" +
"    body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); }\n" +
"    .glass { background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255,255,255,0.5); }\n" +
"    .font-google { font-family: 'Product Sans', Arial, sans-serif; font-weight: 700; letter-spacing: -1px; }\n" +
"    @keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }\n" +
"    .kilau-logo { background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%); background-size: 200% auto; animation: shine 7s ease-in-out 1 forwards; }\n" +
"    @keyframes pulse-fast { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }\n" +
"    .anim-pulse { animation: pulse-fast 1s infinite; }\n" +
"  </style>\n" +
"</head>\n" +
"<body class='min-h-screen flex flex-col'>\n" +
"  <div class='bg-gray-900 text-blue-300 text-[9px] px-4 py-2 flex justify-between font-bold shadow-sm uppercase'>\n" +
"    <div id='hariJam'>Memuat Waktu...</div>\n" +
"    <div>📍 Jember, Jawa Timur</div>\n" +
"  </div>\n" +
"  <div class='bg-blue-900 text-white text-[8px] px-4 py-1 flex justify-between items-center shadow-inner uppercase tracking-wider'>\n" +
"    <div>📱 " + dev + "</div>\n" +
"    <div class='text-right'>🌐 IP: " + ip + " | ISP: " + isp + "</div>\n" +
"  </div>\n" +
"\n" +
"  <div class='max-w-2xl mx-auto p-4 mt-6 flex-grow w-full text-center'>\n" +
"    <div class='mb-8 relative inline-block kilau-logo px-4 py-2'>\n" +
"      <h1 class='text-5xl font-google'>\n" +
"        <span style='color: #4285F4'>H</span><span style='color: #EA4335'>a</span><span style='color: #FBBC05'>b</span><span style='color: #4285F4'>i</span>\n" +
"        <span style='color: #34A853' class='ml-2'>M</span><span style='color: #EA4335'>a</span><span style='color: #FBBC05'>i</span><span style='color: #4285F4'>l</span>\n" +
"      </h1>\n" +
"    </div>\n" +
"\n" +
"    <div class='glass p-8 rounded-3xl shadow-xl mb-6 border-t-4 border-blue-500'>\n" +
"      <input type='text' id='em' class='w-full p-4 rounded-xl border-2 border-blue-100 text-center bg-gray-50 text-blue-700 font-bold mb-4' readonly>\n" +
"      <div class='flex gap-2 mb-4'>\n" +
"        <button onclick='sl()' class='flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 uppercase text-xs'>Salin Alamat Email 📋</button>\n" +
"        <button onclick='gr(true)' class='flex-1 bg-white border-2 border-red-500 text-red-500 font-bold py-3 rounded-xl active:scale-95 uppercase text-[10px]'>Ganti Nama</button>\n" +
"      </div>\n" +
"      <div class='bg-red-50 text-red-600 border border-red-200 rounded-lg p-2 text-[10px] font-bold uppercase flex justify-between items-center'>\n" +
"         <span>⏳ Waktu Tersisa:</span>\n" +
"         <span id='timer' class='text-lg font-black'>07:00</span>\n" +
"      </div>\n" +
"    </div>\n" +
"\n" +
"    <div class='glass rounded-3xl shadow-xl overflow-hidden mb-8 text-left'>\n" +
"      <div class='bg-white px-6 py-4 border-b flex justify-between items-center font-bold'>\n" +
"        <h2 class='text-gray-800 text-sm'>📥 KOTAK MASUK</h2>\n" +
"        <div class='flex items-center gap-2'>\n" +
"          <span class='text-[9px] text-green-500 font-bold uppercase anim-pulse'>Auto-Sync 🟢</span>\n" +
"          <span class='bg-gray-800 text-white rounded-full px-3 py-1 text-xs' id='ct'>0</span>\n" +
"        </div>\n" +
"      </div>\n" +
"      <div id='ib' class='p-5 space-y-4 min-h-[200px] bg-gray-50'>\n" +
"        <p class='text-center text-gray-400 py-10 text-xs'>Kotak masuk kosong. Menunggu pesan...</p>\n" +
"      </div>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <script>\n" +
"    const nD=['siti','ayu','dewi','sri','indah','ratna','fitri','wulan','rina','putri'];\n" +
"    const nB=['ningsih','wati','sari','astuti','rahayu','lestari','susanti','wahyuni'];\n" +
"    let lc=0; let tLeft=420;\n" +
"    function gr(m=false){if(!m&&localStorage.getItem('he')){document.getElementById('em').value=localStorage.getItem('he');return;}const e=nD[Math.floor(Math.random()*nD.length)]+'.'+nB[Math.floor(Math.random()*nB.length)]+Math.floor(Math.random()*999)+'@habisuno.my.id';document.getElementById('em').value=e;localStorage.setItem('he',e); tLeft=420;}\n" +
"    function sl(){navigator.clipboard.writeText(document.getElementById('em').value);alert('Email disalin!');}\n" +
"    async function hp(id){if(!confirm('Hapus pesan ini?'))return;const r=await fetch('/api/del',{method:'POST',body:JSON.stringify({id})});if(r.ok){lc=0;chk();}}\n" +
"    \n" +
"    function upTmr() {\n" +
"      if(tLeft <= 0) { gr(true); tLeft = 420; lc = 0; document.getElementById('ib').innerHTML = ''; document.getElementById('ct').innerText = '0'; return; }\n" +
"      let m = Math.floor(tLeft / 60); let s = tLeft % 60;\n" +
"      document.getElementById('timer').innerText = '0' + m + ':' + (s < 10 ? '0'+s : s);\n" +
"      tLeft--;\n" +
"    }\n" +
"\n" +
"    async function chk() {\n" +
"      try {\n" +
"        const r = await fetch('/api/pesan?_=' + new Date().getTime()); const d = await r.json();\n" +
"        document.getElementById('ct').innerText = d.length;\n" +
"        if (d.length !== lc) {\n" +
"          lc = d.length;\n" +
"          if(d.length === 0){ document.getElementById('ib').innerHTML='<p class=\"text-center text-gray-400 py-10 text-xs\">Kotak masuk kosong. Menunggu pesan...</p>'; return; }\n" +
"          document.getElementById('ib').innerHTML = d.map(function(p, i) {\n" +
"            let nw = i === 0 ? '<span class=\"bg-red-500 text-white text-[8px] px-2 py-0.5 rounded font-bold anim-pulse\">NEW</span>' : '';\n" +
"            return '<div class=\"bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative\">' +\n" +
"              '<div class=\"flex justify-between items-center mb-2\"><div class=\"text-[9px] font-bold text-blue-500 uppercase\">' + p.t + '</div>' + nw + '</div>' +\n" +
"              '<div class=\"font-bold text-gray-900 text-sm mb-1\">' + p.s + '</div>' +\n" +
"              '<div class=\"text-[10px] text-gray-500 mb-3\">Dari: <b>' + p.f + '</b></div>' +\n" +
"              '<div class=\"bg-gray-50 p-3 rounded-xl text-[11px] text-gray-700 mb-3 border border-gray-100 whitespace-pre-wrap\">' + p.b + '</div>' +\n" +
"              '<button onclick=\"hp(\\'' + p.id + '\\')\" class=\"text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg uppercase\">Hapus Manual</button>' +\n" +
"            '</div>';\n" +
"          }).join('');\n" +
"        }\n" +
"      } catch (e) {}\n" +
"    }\n" +
"\n" +
"    const hri = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];\n" +
"    window.onload = () => { \n" +
"      gr(); \n" +
"      setInterval(() => { \n" +
"        const n = new Date(); \n" +
"        document.getElementById('hariJam').innerText = hri[n.getDay()] + ', ' + n.toLocaleTimeString('id-ID', {hour12:true}).replace(/\\./g,':'); \n" +
"        upTmr();\n" +
"        chk(); \n" +
"      }, 1000); \n" +
"    };\n" +
"  </script>\n" +
"</body>\n" +
"</html>";
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
