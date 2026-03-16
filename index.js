export default {
  async email(m, e) {
    try {
      let r = "";
      const rd = m.raw.getReader();
      while (true) { const { done, value } = await rd.read(); if (done) break; r += new TextDecoder().decode(value); }
      
      let b = "Format pesan gambar/kompleks.";
      try {
        let parts = r.split(/Content-Type:\s*text\/plain/i);
        if (parts.length > 1) {
          let chunk = parts[1].split(/--[a-zA-Z0-9_-]+/)[0];
          let bodyParts = chunk.split(/\r?\n\r?\n/);
          let headers = bodyParts[0];
          b = bodyParts.slice(1).join("\n").trim();
          
          if (headers.match(/base64/i)) {
             try { b = decodeURIComponent(escape(atob(b.replace(/\s/g, '')))); } catch(err) { b = atob(b.replace(/\s/g, '')); }
          } else if (headers.match(/quoted-printable/i)) {
             b = b.replace(/=\r?\n/g, '').replace(/=([A-F0-9]{2})/ig, function(match, p1) { return String.fromCharCode(parseInt(p1, 16)); });
          }
        }
      } catch (err) {}

      const d = {
        id: Date.now().toString(),
        f: m.from || "Sistem",
        to: m.to || "Anda",
        s: m.headers.get("subject") || "Tanpa Judul",
        b: b,
        t: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      };

      let all = [];
      try { const ext = await e.DB.get("INBOX_HABI"); if(ext) all = JSON.parse(ext); } catch(err) {}
      
      const now = Date.now();
      all = all.filter(msg => (now - parseInt(msg.id)) < 420000); 
      all.unshift(d); 
      
      await e.DB.put("INBOX_HABI", JSON.stringify(all));
    } catch (fatal) { console.log("Gagal", fatal); }
  },

  async fetch(req, env) {
    const u = new URL(req.url);
    
    if (u.pathname === "/api/pesan") {
      try {
        let all = [];
        const ext = await env.DB.get("INBOX_HABI");
        if(ext) all = JSON.parse(ext);
        const now = Date.now();
        all = all.filter(msg => (now - parseInt(msg.id)) < 420000);
        return new Response(JSON.stringify(all), {headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}});
      } catch (err) { return new Response("[]", {headers: {'Content-Type': 'application/json'}}); }
    }
    
    if (u.pathname === "/api/del" && req.method === "POST") {
      try {
        const { id } = await req.json();
        let all = [];
        const ext = await env.DB.get("INBOX_HABI");
        if(ext) all = JSON.parse(ext);
        all = all.filter(msg => msg.id !== id);
        await env.DB.put("INBOX_HABI", JSON.stringify(all));
        return new Response("OK");
      } catch (err) { return new Response("Error"); }
    }

    const ip = req.headers.get('cf-connecting-ip') || 'IP Tidak Terdeteksi';
    const isp = (req.cf && req.cf.asOrganization) ? req.cf.asOrganization : 'ISP Tidak Terdeteksi';

    const html = "<!DOCTYPE html>\n" +
"<html lang='id'>\n" +
"<head>\n" +
"  <meta charset='UTF-8'>\n" +
"  <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
"  <title>HABI MAIL UNLIMITED</title>\n" +
"  <script src='https://cdn.tailwindcss.com'></script>\n" +
"  <link href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&family=Product+Sans:wght@700&family=Poppins:wght@400;500;600;700&display=swap' rel='stylesheet'>\n" +
"  <style>\n" +
"    body { font-family: 'Poppins', sans-serif; background: #f0f0f0; }\n" +
"    .glass { background: #ffffff; border: 1px solid #e5e5e5; }\n" +
"    .font-google { font-family: 'Product Sans', Arial, sans-serif; font-weight: 700; letter-spacing: -2px; }\n" +
"    .font-estetik { font-family: 'Playfair Display', serif; }\n" +
"    \n" +
"    /* Animasi Logo: Kilau 7s, lalu Glowing Pro 3s, lalu statik */\n" +
"    .logo-container { \n" +
"       display: inline-block; \n" +
"       -webkit-mask-image: linear-gradient(-75deg, rgba(0,0,0,1) 30%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,1) 70%); \n" +
"       -webkit-mask-size: 200%; \n" +
"       animation: shine-logo 7s ease-in-out 1 forwards, pro-glow 3s ease-in-out 7s 1 forwards; \n" +
"    }\n" +
"    @keyframes shine-logo { 0% { -webkit-mask-position: 200%; } 100% { -webkit-mask-position: -200%; } }\n" +
"    @keyframes pro-glow { 0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(234, 67, 53, 0)); } 50% { transform: scale(1.03); filter: drop-shadow(0 0 10px rgba(66, 133, 244, 0.4)); } 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(0, 0, 0, 0)); } }\n" +
"    \n" +
"    .kilau-footer { background: linear-gradient(110deg, #64748b 40%, #000000 50%, #64748b 60%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: shine-infinite 4s linear infinite; }\n" +
"    @keyframes shine-infinite { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }\n" +
"    \n" +
"    .badge-new { animation: pulse 1.5s infinite; }\n" +
"    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }\n" +
"    .pop-up-anim { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }\n" +
"    @keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }\n" +
"  </style>\n" +
"</head>\n" +
"<body class='min-h-screen flex flex-col text-gray-800'>\n" +
"  \n" +
"  <div class='bg-gray-900 text-gray-300 text-[9px] px-4 py-2 flex justify-between font-bold shadow-sm uppercase'>\n" +
"    <div id='waktuLengkap'>Memuat Waktu...</div>\n" +
"    <div>📍 Jember, Jawa Timur</div>\n" +
"  </div>\n" +
"  <div class='bg-gray-800 text-white text-[8px] px-4 py-1.5 flex justify-between items-center shadow-inner tracking-widest uppercase'>\n" +
"    <div>📱 <span id='namaDevice' class='text-red-400'>Mendeteksi...</span></div>\n" +
"    <div class='text-right'>🌐 IP: <span class='text-red-400'>" + ip + "</span> | ISP: <span class='text-red-400'>" + isp + "</span></div>\n" +
"  </div>\n" +
"\n" +
"  <div class='max-w-2xl mx-auto p-4 mt-6 flex-grow w-full text-center'>\n" +
"    <div class='mb-6'>\n" +
"      <div class='logo-container'>\n" +
"        <h1 class='text-5xl font-google'>\n" +
"          <span style='color: #4285F4'>H</span><span style='color: #EA4335'>a</span><span style='color: #FBBC05'>b</span><span style='color: #4285F4'>i</span>\n" +
"          <span style='color: #34A853' class='ml-2'>M</span><span style='color: #EA4335'>a</span><span style='color: #FBBC05'>i</span><span style='color: #4285F4'>l</span>\n" +
"        </h1>\n" +
"      </div>\n" +
"      <p class='text-gray-500 text-[10px] tracking-[0.2em] font-bold uppercase mt-2'>Layanan Email Sementara Profesional</p>\n" +
"    </div>\n" +
"\n" +
"    \n" +
"    <div class='glass p-6 rounded-2xl shadow-sm mb-6 border-t-4 border-red-600'>\n" +
"      <div class='flex items-center mb-2'>\n" +
"         <input type='text' id='emUser' class='w-1/2 p-3 rounded-l-xl border-y border-l border-gray-200 text-right bg-gray-50 text-gray-800 font-bold focus:outline-none' readonly>\n" +
"         <span class='bg-gray-50 border-y border-gray-200 text-gray-400 p-3 font-bold'>@</span>\n" +
"         <select id='emDomain' onchange='updateFullEmail()' class='w-1/2 p-3 rounded-r-xl border-y border-r border-gray-200 text-left bg-gray-50 text-red-600 font-bold focus:outline-none cursor-pointer appearance-none'></select>\n" +
"      </div>\n" +
"      \n" +
"      <div id='statusDomain' class='text-[10px] font-bold mb-4 bg-gray-100 p-2 rounded-lg border border-gray-200 transition-all'>\n" +
"         Sedang mengecek status jaringan domain...\n" +
"      </div>\n" +
"\n" +
"      <input type='hidden' id='emFull'>\n" +
"      <div class='flex flex-col gap-3'>\n" +
"        <button onclick='salinEmail()' class='w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 uppercase text-sm transition'>Salin Alamat Email 📋</button>\n" +
"        <div class='flex gap-2'>\n" +
"          <button onclick='gr(true)' class='flex-[2] bg-white border border-gray-300 text-gray-600 font-bold py-3 rounded-xl active:scale-95 uppercase text-xs hover:bg-gray-50 transition'>Ganti Nama</button>\n" +
"          <button onclick='bukaModalDomain()' class='flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl active:scale-95 uppercase text-[10px] hover:bg-gray-900 transition'>🌐 Domain</button>\n" +
"        </div>\n" +
"      </div>\n" +
"    </div>\n" +
"\n" +
"    \n" +
"    <div class='glass rounded-2xl shadow-sm overflow-hidden mb-8 text-left'>\n" +
"      <div class='bg-white px-6 py-4 border-b flex justify-between items-center'>\n" +
"        <h2 class='text-gray-800 text-sm font-bold'>📥 KOTAK MASUK</h2>\n" +
"        <div class='flex items-center gap-3'>\n" +
"          <span class='text-[9px] text-gray-500 font-bold uppercase badge-new'>Otomatis Masuk 🟢</span>\n" +
"          <div class='relative'>\n" +
"            <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' fill='#606060' viewBox='0 0 16 16'><path d='M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.252 3 8.188 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 2.188.32 4.252 1.22 6z'/></svg>\n" +
"            <span id='ct' class='absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 rounded-full border border-white'>0</span>\n" +
"          </div>\n" +
"        </div>\n" +
"      </div>\n" +
"      <div id='ib' class='p-4 space-y-4 min-h-[200px] bg-gray-50'>\n" +
"        <p class='text-center text-gray-500 py-10 text-xs'>Belum ada pesan masuk. Menunggu...</p>\n" +
"      </div>\n" +
"    </div>\n" +
"\n" +
"    \n" +
"    <div class='glass rounded-2xl p-8 text-center shadow-sm border-t-4 border-gray-800 mb-8'>\n" +
"      <h3 class='text-2xl font-extrabold mb-4 text-gray-800 font-estetik'>Definisi Kebebasan Tanpa Batas</h3>\n" +
"      <p class='text-sm text-gray-600 mb-8 leading-relaxed font-medium'>\n" +
"        <span class='text-red-600 font-bold'>HABI MAIL UNLIMITED</span> adalah tameng privasi andalan Anda di dunia digital. Nikmati kemudahan pendaftaran akun massal secara anonim, hindari spam, dan lindungi data pribadi Anda. \n" +
"        <br><br>\n" +
"        <span class='italic text-gray-500 text-xs'>Pesan yang masuk akan terhapus otomatis secara permanen dalam hitungan mundur 7 Menit demi kerahasiaan Anda.</span>\n" +
"      </p>\n" +
"      <div class='relative inline-block'>\n" +
"        <span class='absolute -top-3 -right-3 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full badge-new border-2 border-white z-10'>NEW</span>\n" +
"        <a href='https://wa.me/6285119821813' target='_blank' class='bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-10 rounded-full shadow-md inline-flex items-center gap-2 text-xs uppercase tracking-widest transition'>\n" +
"          <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'><path d='M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z'/></svg>\n" +
"          Chat Habi Mail\n" +
"        </a>\n" +
"      </div>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  \n" +
"  <div id='modalMaster' class='fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-white p-8 rounded-[2rem] shadow-2xl max-w-xs w-full text-center mx-4 pop-up-anim border-t-4 border-red-600'>\n" +
"      <h1 class='text-2xl font-google mb-4'><span style='color:#4285F4'>H</span><span style='color:#EA4335'>a</span><span style='color:#FBBC05'>b</span><span style='color:#4285F4'>i</span> <span style='color:#34A853'>M</span><span style='color:#EA4335'>a</span><span style='color:#FBBC05'>i</span><span style='color:#4285F4'>l</span></h1>\n" +
"      <h3 id='modalTitle' class='text-xl font-bold text-gray-800 mb-2'>Sukses!</h3>\n" +
"      <p id='modalDesc' class='text-xs text-gray-600 mb-6 font-medium leading-relaxed'>Aksi berhasil dilakukan.</p>\n" +
"      <button onclick='tutupModalMaster()' class='w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition'>Tutup Peringatan</button>\n" +
"      <p class='text-[8px] text-gray-400 mt-5'>&copy; HABI MAIL UNLIMITED</p>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  \n" +
"  <div id='modalDomain' class='fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-white p-6 rounded-[2rem] max-w-sm w-full text-center mx-4 pop-up-anim shadow-2xl border-t-4 border-gray-800 overflow-y-auto max-h-[90vh]'>\n" +
"      <h3 class='text-xl font-bold text-gray-800 mb-2'>Kelola Domain Custom</h3>\n" +
"      <p class='text-[10px] text-gray-500 mb-4'>Tambahkan domain pribadi Anda ke sistem kami secara permanen.</p>\n" +
"      \n" +
"      <input type='text' id='inputNewDomain' placeholder='Contoh: domainku.com' class='w-full p-3 rounded-xl border border-gray-300 text-center text-xs font-bold mb-3 focus:outline-none focus:border-blue-500'>\n" +
"      <div class='flex gap-2 mb-4'>\n" +
"         <button onclick='tambahDomain()' class='flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-[10px] uppercase shadow-md hover:bg-blue-700 transition'>Tambah Permanen</button>\n" +
"         <button onclick='hapusDomain()' class='flex-1 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-xl text-[10px] uppercase hover:bg-red-100 transition'>Hapus</button>\n" +
"      </div>\n" +
"      \n" +
"      <button onclick='bukaTutorial()' class='w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 rounded-xl text-[10px] uppercase mb-4 hover:bg-green-100 transition'>📚 Cara Setting Cloudflare (Wajib)</button>\n" +
"      <button onclick='tutupModalDomain()' class='w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl text-xs uppercase shadow-md transition'>Tutup Menu</button>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  \n" +
"  <div id='modalTutorial' class='fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-white p-6 rounded-[2rem] max-w-sm w-full text-left mx-4 pop-up-anim shadow-2xl border-t-4 border-blue-500 overflow-y-auto max-h-[85vh]'>\n" +
"      <h3 class='text-lg font-bold text-gray-800 mb-2 border-b pb-2'>Panduan Setting Cloudflare</h3>\n" +
"      <p class='text-[10px] text-red-600 font-bold mb-3 bg-red-50 p-2 rounded'>PENTING: Domain yang baru Anda tambahkan WAJIB disetting di Cloudflare Anda sendiri agar bisa menerima pesan.</p>\n" +
"      \n" +
"      <div class='text-[10px] text-gray-700 space-y-3 font-medium leading-relaxed'>\n" +
"         <p><b class='text-blue-600'>Langkah 1:</b> Login ke dashboard Cloudflare Anda dan pilih domain yang baru saja Anda tambahkan.</p>\n" +
"         <p><b class='text-blue-600'>Langkah 2:</b> Di menu sebelah kiri, cari dan klik menu <b>Email</b>, lalu pilih <b>Email Routing</b>.</p>\n" +
"         <p><b class='text-blue-600'>Langkah 3:</b> Ikuti proses aktifkan Email Routing sampai statusnya berubah hijau (Routing Enabled).</p>\n" +
"         <p><b class='text-blue-600'>Langkah 4:</b> Buka tab <b>Routing Rules</b>, scroll ke bawah ke bagian <b>Catch-all address</b>.</p>\n" +
"         <p><b class='text-blue-600'>Langkah 5 (Terpenting):</b> Edit Catch-All. Pilih Action: <span class='bg-gray-200 px-1 rounded'>Send to a Worker</span>, dan Destination: pilih Worker tujuan Anda. Pastikan Status: Active.</p>\n" +
"      </div>\n" +
"      \n" +
"      <button onclick='tutupTutorial()' class='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-5 rounded-xl text-xs uppercase shadow-md transition'>Saya Mengerti</button>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <footer class='mt-auto py-8 bg-gray-100 text-center border-t border-gray-200'>\n" +
"    <p class='text-[10px] font-bold tracking-[0.4em] uppercase kilau-footer'>Copyright &copy; 2026 HABI MAIL UNLIMITED</p>\n" +
"  </footer>\n" +
"\n" +
"  <script>\n" +
"    const nD=['Zahra','Kania','Nabila','Kirana','Salsabila','Aurel','Nadhira','Cantika','Arsy','Syafira'];\n" +
"    const nB=['Maharani','Larasati','Widya','Puspa','Kirani','Azzahra','Maheswari','Kusuma','Anggraini'];\n" +
"    let curMsgs=[]; let listDomain=[\"habisuno.my.id\"];\n" +
"    \n" +
"    function loadDomains() {\n" +
"       let loc = localStorage.getItem('custom_domains');\n" +
"       if(loc) { listDomain = [\"habisuno.my.id\", ...JSON.parse(loc)]; }\n" +
"       renderDomainDropdown();\n" +
"    }\n" +
"    \n" +
"    function renderDomainDropdown() {\n" +
"       const sel = document.getElementById('emDomain');\n" +
"       let html = ''; listDomain.forEach(d => { html += '<option value=\"'+d+'\">'+d+'</option>'; });\n" +
"       sel.innerHTML = html;\n" +
"       if(!localStorage.getItem('he')) { gr(); } else { updateFullEmailFromLocal(); }\n" +
"    }\n" +
"\n" +
"    function gr(m=false){\n" +
"       if(!m&&localStorage.getItem('he')){ updateFullEmailFromLocal(); return; }\n" +
"       const usr = nD[Math.floor(Math.random()*nD.length)]+'.'+nB[Math.floor(Math.random()*nB.length)]+Math.floor(Math.random()*999);\n" +
"       document.getElementById('emUser').value = usr;\n" +
"       updateFullEmail();\n" +
"    }\n" +
"    \n" +
"    function updateFullEmail() {\n" +
"       const usr = document.getElementById('emUser').value;\n" +
"       const dom = document.getElementById('emDomain').value || 'habisuno.my.id';\n" +
"       if(usr) {\n" +
"          const full = usr + '@' + dom;\n" +
"          document.getElementById('emFull').value = full;\n" +
"          localStorage.setItem('he', full);\n" +
"          cekStatusDomain(dom);\n" +
"       }\n" +
"    }\n" +
"    \n" +
"    function updateFullEmailFromLocal() {\n" +
"       const full = localStorage.getItem('he');\n" +
"       if(full && full.includes('@')) {\n" +
"          const pts = full.split('@');\n" +
"          document.getElementById('emUser').value = pts[0];\n" +
"          if(!listDomain.includes(pts[1])) { \n" +
"             let loc = JSON.parse(localStorage.getItem('custom_domains') || '[]');\n" +
"             loc.push(pts[1]); localStorage.setItem('custom_domains', JSON.stringify(loc)); loadDomains();\n" +
"          }\n" +
"          document.getElementById('emDomain').value = pts[1];\n" +
"          document.getElementById('emFull').value = full;\n" +
"          cekStatusDomain(pts[1]);\n" +
"       } else { gr(true); }\n" +
"    }\n" +
"\n" +
"    // Cek Status MX Cloudflare Live!\n" +
"    async function cekStatusDomain(dom) {\n" +
"       const stUI = document.getElementById('statusDomain');\n" +
"       stUI.innerHTML = 'Sedang mengecek status jaringan domain...';\n" +
"       stUI.className = 'text-[10px] font-bold mb-4 bg-gray-100 text-gray-600 p-2 rounded-lg border border-gray-200';\n" +
"       if(dom === 'habisuno.my.id') {\n" +
"          stUI.innerHTML = 'Status: 🟢 Berhasil tersambung & siap menerima pesan';\n" +
"          stUI.className = 'text-[10px] font-bold mb-4 bg-green-50 text-green-700 p-2 rounded-lg border border-green-200';\n" +
"          return;\n" +
"       }\n" +
"       try {\n" +
"          const res = await fetch('https://cloudflare-dns.com/dns-query?name='+dom+'&type=MX', {headers: {'accept': 'application/dns-json'}});\n" +
"          const data = await res.json();\n" +
"          let terhubung = false;\n" +
"          if(data.Answer) {\n" +
"             terhubung = data.Answer.some(r => r.data.includes('cloudflare.net'));\n" +
"          }\n" +
"          if(terhubung) {\n" +
"             stUI.innerHTML = 'Status: 🟢 Berhasil tersambung & siap menerima pesan';\n" +
"             stUI.className = 'text-[10px] font-bold mb-4 bg-green-50 text-green-700 p-2 rounded-lg border border-green-200';\n" +
"          } else {\n" +
"             stUI.innerHTML = 'Status: 🔴 Belum terhubung perbaiki - <a href=\"#\" onclick=\"bukaTutorial()\" class=\"underline text-blue-600\">Lihat Tutorial</a>';\n" +
"             stUI.className = 'text-[10px] font-bold mb-4 bg-red-50 text-red-600 p-2 rounded-lg border border-red-200';\n" +
"          }\n" +
"       } catch(e) {\n" +
"          stUI.innerHTML = 'Status: 🟡 Gagal mengecek jaringan, pastikan Cloudflare sudah disetting.';\n" +
"       }\n" +
"    }\n" +
"\n" +
"    // Modal Master Controller\n" +
"    function showModalMaster(title, desc) {\n" +
"      document.getElementById('modalTitle').innerText = title;\n" +
"      document.getElementById('modalDesc').innerText = desc;\n" +
"      document.getElementById('modalMaster').classList.remove('hidden');\n" +
"    }\n" +
"    function tutupModalMaster() { document.getElementById('modalMaster').classList.add('hidden'); }\n" +
"\n" +
"    function salinEmail(){\n" +
"      navigator.clipboard.writeText(document.getElementById('emFull').value);\n" +
"      showModalMaster('Tersalin Sempurna!', 'Alamat email '+document.getElementById('emFull').value+' siap beraksi. Gunakan untuk mendaftar akun tanpa takut spam menghantui.');\n" +
"    }\n" +
"    \n" +
"    function bukaModalDomain() { document.getElementById('modalDomain').classList.remove('hidden'); }\n" +
"    function tutupModalDomain() { document.getElementById('modalDomain').classList.add('hidden'); }\n" +
"    function bukaTutorial() { document.getElementById('modalTutorial').classList.remove('hidden'); }\n" +
"    function tutupTutorial() { document.getElementById('modalTutorial').classList.add('hidden'); }\n" +
"\n" +
"    function tambahDomain() {\n" +
"       let val = document.getElementById('inputNewDomain').value.trim().toLowerCase();\n" +
"       if(val && !listDomain.includes(val)) { \n" +
"          let loc = JSON.parse(localStorage.getItem('custom_domains') || '[]');\n" +
"          loc.push(val); localStorage.setItem('custom_domains', JSON.stringify(loc));\n" +
"          loadDomains(); \n" +
"          document.getElementById('emDomain').value = val;\n" +
"          updateFullEmail();\n" +
"          document.getElementById('inputNewDomain').value='';\n" +
"          showModalMaster('Domain Tersimpan!', 'Domain '+val+' berhasil ditambahkan ke perangkat Anda. Pastikan Anda telah menyetting Cloudflare-nya agar bisa menerima pesan.');\n" +
"       }\n" +
"    }\n" +
"    function hapusDomain() {\n" +
"       let val = document.getElementById('emDomain').value;\n" +
"       if(val === 'habisuno.my.id') { showModalMaster('Akses Ditolak', 'Domain utama sistem tidak bisa dihapus!'); return; }\n" +
"       let loc = JSON.parse(localStorage.getItem('custom_domains') || '[]');\n" +
"       loc = loc.filter(d => d !== val);\n" +
"       localStorage.setItem('custom_domains', JSON.stringify(loc));\n" +
"       loadDomains();\n" +
"       updateFullEmail();\n" +
"       showModalMaster('Terhapus', 'Domain '+val+' telah dihapus dari daftar permanen Anda.');\n" +
"    }\n" +
"    \n" +
"    async function hp(id){await fetch('/api/del',{method:'POST',body:JSON.stringify({id})}); chk();}\n" +
"\n" +
"    async function chk() {\n" +
"      try {\n" +
"        const curFull = document.getElementById('emFull').value;\n" +
"        const r = await fetch('/api/pesan?_=' + new Date().getTime()); const d = await r.json();\n" +
"        curMsgs = d.filter(msg => msg.to.toLowerCase() === curFull.toLowerCase() || msg.to === \"Anda\"); \n" +
"        renderMsgs();\n" +
"      } catch (e) {}\n" +
"    }\n" +
"\n" +
"    function renderMsgs() {\n" +
"      let now = Date.now();\n" +
"      let validMsgs = curMsgs.filter(function(p) { return Math.floor((now - parseInt(p.id))/1000) < 420; });\n" +
"      document.getElementById('ct').innerText = validMsgs.length;\n" +
"      if(validMsgs.length === 0){ document.getElementById('ib').innerHTML='<p class=\"text-center text-gray-500 py-10 text-xs\">Belum ada pesan masuk. Menunggu...</p>'; return; }\n" +
"      \n" +
"      document.getElementById('ib').innerHTML = validMsgs.map(function(p, i) {\n" +
"        let age = Math.floor((now - parseInt(p.id)) / 1000);\n" +
"        let left = 420 - age;\n" +
"        let min = Math.floor(left / 60);\n" +
"        let sec = left % 60;\n" +
"        let timeStr = '0' + min + ':' + (sec < 10 ? '0'+sec : sec);\n" +
"        let nw = i === 0 ? '<span class=\"bg-red-600 text-white text-[8px] px-2 py-0.5 rounded font-bold badge-new\">NEW</span>' : '';\n" +
"        \n" +
"        return '<div class=\"bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative transition-all\">' +\n" +
"          '<div class=\"flex justify-between items-center mb-3\">' +\n" +
"             '<div class=\"text-[9px] font-bold text-gray-500 uppercase tracking-widest\">' + p.t + '</div>' + nw +\n" +
"          '</div>' +\n" +
"          '<div class=\"font-bold text-gray-900 text-sm mb-1\">' + p.s + '</div>' +\n" +
"          '<div class=\"text-[10px] text-gray-500 mb-4\">Dari: <b>' + p.f + '</b></div>' +\n" +
"          '<div class=\"bg-gray-100 p-4 rounded-xl text-[12px] text-gray-800 mb-4 border border-gray-200 whitespace-pre-wrap leading-relaxed overflow-x-auto\">' + p.b + '</div>' +\n" +
"          '<div class=\"flex justify-between items-center\">' +\n" +
"             '<span class=\"text-[9px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100\">⏳ Sisa: ' + timeStr + '</span>' +\n" +
"             '<button onclick=\"hp(\\'' + p.id + '\\')\" class=\"text-[9px] font-bold text-gray-500 hover:text-red-600 uppercase transition\">Hapus Langsung</button>' +\n" +
"          '</div>' +\n" +
"        '</div>';\n" +
"      }).join('');\n" +
"    }\n" +
"\n" +
"    function deteksiHP() {\n" +
"      let ua = navigator.userAgent;\n" +
"      let b = 'Desktop/Lainnya';\n" +
"      if (/vivo|V19|V20|V21|V22|V23|V25|V27|Y\\d{2}/i.test(ua)) b = 'Vivo';\n" +
"      else if (/OPPO|CPH|Reno/i.test(ua)) b = 'Oppo';\n" +
"      else if (/Samsung|SM-|GT-/i.test(ua)) b = 'Samsung';\n" +
"      else if (/Xiaomi|Redmi|Poco|MI\\s/i.test(ua)) b = 'Xiaomi';\n" +
"      else if (/Infinix|X6/i.test(ua)) b = 'Infinix';\n" +
"      else if (/Realme|RMX/i.test(ua)) b = 'Realme';\n" +
"      else if (/iPhone/i.test(ua)) b = 'iPhone';\n" +
"      else if (/iPad/i.test(ua)) b = 'iPad';\n" +
"      else if (/Android/i.test(ua)) b = 'Android';\n" +
"      else if (/Windows/i.test(ua)) b = 'Windows PC';\n" +
"      else if (/Macintosh/i.test(ua)) b = 'Mac OS';\n" +
"      document.getElementById('namaDevice').innerText = b;\n" +
"    }\n" +
"\n" +
"    const hri = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];\n" +
"    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];\n" +
"    \n" +
"    window.onload = () => { \n" +
"      loadDomains();\n" +
"      deteksiHP();\n" +
"      setInterval(() => { \n" +
"        const n = new Date(); \n" +
"        document.getElementById('waktuLengkap').innerText = hri[n.getDay()] + ', ' + n.getDate() + ' ' + bln[n.getMonth()] + ' ' + n.getFullYear() + ' | ' + n.toLocaleTimeString('id-ID', {hour12:true}).replace(/\\./g,':'); \n" +
"        renderMsgs(); \n" +
"      }, 1000); \n" +
"      setInterval(chk, 5000);\n" +
"    };\n" +
"  </script>\n" +
"</body>\n" +
"</html>";
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
