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
    
    // API Tarik Pesan
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
    
    // API Hapus Pesan
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

    // API SINKRONISASI DOMAIN GLOBAL UNTUK SEMUA HP
    if (u.pathname === "/api/domains" && req.method === "GET") {
      try {
        let doms = [{d: "habisuno.my.id", t: "Bawaan Sistem Master", locked: true, ts: 0, isNew: false}];
        const ext = await env.DB.get("DOMAINS_GLOBAL");
        if(ext) { 
           let parsed = JSON.parse(ext); 
           if(Array.isArray(parsed) && parsed.length > 0) doms = parsed; 
        }
        return new Response(JSON.stringify(doms), {headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}});
      } catch(err) { return new Response("[]", {headers: {'Content-Type': 'application/json'}}); }
    }

    if (u.pathname === "/api/domains" && req.method === "POST") {
      try {
        const body = await req.json();
        let doms = [{d: "habisuno.my.id", t: "Bawaan Sistem Master", locked: true, ts: 0, isNew: false}];
        const ext = await env.DB.get("DOMAINS_GLOBAL");
        if(ext) { let parsed = JSON.parse(ext); if(Array.isArray(parsed) && parsed.length > 0) doms = parsed; }
        
        if (body.action === "add" && body.domain) {
          if(!doms.find(x => x.d === body.domain)) {
             doms.push({d: body.domain, t: body.time, locked: false, ts: Date.now(), isNew: true});
          }
        } else if (body.action === "del" && body.domain && body.domain !== "habisuno.my.id") {
          doms = doms.filter(x => x.d !== body.domain);
        }
        await env.DB.put("DOMAINS_GLOBAL", JSON.stringify(doms));
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
"    /* SPLASH SCREEN YOUTUBE STYLE */\n" +
"    #splashScreen { position: fixed; inset: 0; background: #ffffff; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.5s ease-out; }\n" +
"    .splash-logo { animation: splash-pulse 1.5s ease-in-out infinite alternate; }\n" +
"    @keyframes splash-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }\n" +
"    \n" +
"    /* PERBAIKAN ANIMASI LOGO: 100% Statik di akhir, tidak ada kilau sisa */\n" +
"    .logo-container { \n" +
"       display: inline-block; \n" +
"       -webkit-mask-image: linear-gradient(-75deg, rgba(0,0,0,1) 40%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,1) 60%); \n" +
"       -webkit-mask-size: 300%; \n" +
"       animation: shine-logo 7s ease-in-out 1 forwards, pro-glow 3s ease-in-out 7s 1 forwards; \n" +
"    }\n" +
"    @keyframes shine-logo { 0% { -webkit-mask-position: 200%; } 100% { -webkit-mask-position: -100%; } }\n" +
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
"\n" +
"  \n" +
"  <div id='splashScreen'>\n" +
"     <h1 class='text-6xl font-google splash-logo'>\n" +
"        <span style='color: #4285F4'>H</span><span style='color: #EA4335'>a</span><span style='color: #FBBC05'>b</span><span style='color: #4285F4'>i</span>\n" +
"        <span style='color: #34A853' class='ml-2'>M</span><span style='color: #EA4335'>a</span><span style='color: #FBBC05'>i</span><span style='color: #4285F4'>l</span>\n" +
"     </h1>\n" +
"     <p class='mt-4 text-gray-400 font-bold tracking-widest text-[10px] uppercase'>Memuat Layanan Profesional...</p>\n" +
"  </div>\n" +
"\n" +
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
"    <div class='glass p-6 rounded-2xl shadow-sm mb-6 border-t-4 border-red-600'>\n" +
"      <div class='flex items-center mb-2'>\n" +
"         <input type='text' id='emUser' class='w-1/2 p-4 rounded-l-xl border-y border-l border-gray-200 text-right bg-gray-50 text-gray-800 font-bold focus:outline-none' readonly>\n" +
"         <span class='bg-gray-50 border-y border-gray-200 text-gray-400 p-4 font-bold'>@</span>\n" +
"         <div onclick='bukaModalDaftarDomain()' class='w-1/2 p-4 rounded-r-xl border-y border-r border-gray-200 text-left bg-gray-50 text-red-600 font-bold cursor-pointer flex justify-between items-center hover:bg-gray-100 transition'>\n" +
"            <span id='teksDomainAktif' class='truncate'>habisuno.my.id</span>\n" +
"            <span class='text-[10px] ml-2 text-gray-400'>▼</span>\n" +
"         </div>\n" +
"      </div>\n" +
"      <div id='statusDomain' class='text-[10px] font-bold mb-4 bg-gray-100 p-2 rounded-lg border border-gray-200 transition-all'>Sedang mengecek status jaringan domain...</div>\n" +
"      <input type='hidden' id='emFull'>\n" +
"      \n" +
"      <div class='flex flex-col gap-3'>\n" +
"        <button onclick='salinEmail()' class='w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 uppercase text-sm transition'>Salin Alamat Email 📋</button>\n" +
"        <div class='flex gap-2'>\n" +
"          <button onclick='gr(true)' class='flex-[2] bg-white border border-gray-300 text-gray-600 font-bold py-3 rounded-xl active:scale-95 uppercase text-xs hover:bg-gray-50 transition'>Ganti Nama Identitas</button>\n" +
"          <button onclick='bukaTutorialMaster()' class='flex-1 bg-green-600 text-white font-bold py-3 rounded-xl active:scale-95 uppercase text-[10px] hover:bg-green-700 transition shadow-md'>📚 Tutorial</button>\n" +
"        </div>\n" +
"      </div>\n" +
"    </div>\n" +
"\n" +
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
"  <div id='modalDaftarDomain' class='fixed inset-0 bg-black/60 z-50 hidden flex flex-col items-center justify-end sm:justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-gray-50 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md mx-auto pop-up-anim shadow-2xl border-t-4 border-blue-500 overflow-hidden flex flex-col max-h-[85vh]'>\n" +
"      <div class='p-5 bg-white border-b border-gray-200 flex justify-between items-center'>\n" +
"        <h3 class='text-lg font-bold text-gray-800'>Pilih Domain Publik</h3>\n" +
"        <button onclick='tutupModalDaftarDomain()' class='text-gray-400 hover:text-red-500 font-bold text-2xl'>&times;</button>\n" +
"      </div>\n" +
"      <div class='px-4 pt-3 pb-1 bg-white'>\n" +
"        <p class='text-[10px] text-gray-500 leading-relaxed'>Semua domain ini disumbangkan oleh komunitas dan bisa dinikmati bersama secara Global.</p>\n" +
"      </div>\n" +
"      <div id='listDomainContainer' class='p-4 overflow-y-auto space-y-3 flex-grow bg-gray-50'>\n" +
"        \n" +
"      </div>\n" +
"      <div class='p-5 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]'>\n" +
"        <button onclick='bukaModalTambahDomain(); tutupModalDaftarDomain();' class='w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl uppercase text-xs shadow-md transition'>+ Sumbang Domain Baru</button>\n" +
"      </div>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  \n" +
"  <div id='modalMaster' class='fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-white p-8 rounded-[2rem] shadow-2xl max-w-xs w-full text-center mx-4 pop-up-anim border-t-4 border-blue-600 relative overflow-hidden'>\n" +
"      <div class='absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 pointer-events-none'></div>\n" +
"      <div class='w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm relative z-10'>\n" +
"         <span class='text-4xl' id='ikonMaster'>📋</span>\n" +
"      </div>\n" +
"      <h3 id='modalTitle' class='text-2xl font-extrabold text-gray-800 mb-2 font-estetik'>Sukses!</h3>\n" +
"      <p id='modalDesc' class='text-xs text-gray-600 mb-8 font-medium leading-relaxed px-2'>Aksi berhasil.</p>\n" +
"      <button onclick='tutupModalMaster()' class='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest shadow-md transition relative z-10'>Tutup Notifikasi</button>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  \n" +
"  <div id='modalTambahDomain' class='fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-white p-6 rounded-[2rem] max-w-sm w-full text-left mx-4 pop-up-anim shadow-2xl border-t-4 border-gray-800'>\n" +
"      <h3 class='text-xl font-extrabold text-gray-800 mb-1 border-b pb-3 border-gray-100'>Sumbang Domain Global</h3>\n" +
"      <p class='text-[10px] text-gray-500 mt-3 mb-4 leading-relaxed'>Tambahkan domain nganggur Anda agar bisa digunakan oleh seluruh pengguna Habi Mail di dunia.</p>\n" +
"      \n" +
"      <div class='bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5 shadow-sm'>\n" +
"        <input type='text' id='inputNewDomain' placeholder='Contoh: domainku.com' class='w-full p-4 rounded-xl border border-gray-300 text-center text-sm font-bold mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400'>\n" +
"        <button onclick='tambahDomainGlobal()' class='w-full bg-gray-800 hover:bg-gray-900 text-white font-extrabold py-4 rounded-xl text-xs uppercase shadow-md transition transform active:scale-95'>Integrasikan Domain</button>\n" +
"      </div>\n" +
"      \n" +
"      <button onclick='tutupModalTambahDomain()' class='w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl text-xs uppercase'>Batal</button>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  \n" +
"  <div id='modalTutorialFull' class='fixed inset-0 bg-black/60 z-50 hidden flex flex-col items-center justify-end sm:justify-center backdrop-blur-sm transition-all duration-300'>\n" +
"    <div class='bg-gray-50 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md mx-auto pop-up-anim shadow-2xl border-t-4 border-green-500 overflow-hidden flex flex-col max-h-[90vh]'>\n" +
"      <div class='p-5 bg-white border-b border-gray-200 flex justify-between items-center'>\n" +
"        <h3 class='text-lg font-bold text-gray-800'>Tutorial Master Cloudflare</h3>\n" +
"        <button onclick='tutupTutorialMaster()' class='text-gray-400 hover:text-red-500 font-bold text-2xl'>&times;</button>\n" +
"      </div>\n" +
"      <div class='p-5 overflow-y-auto space-y-4 flex-grow bg-white text-[11px] text-gray-700 leading-relaxed font-medium'>\n" +
"         <p class='text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100'>PERHATIAN: Domain yang ditambahkan di web ini TIDAK AKAN BISA menerima email jika pemilik domain belum menyambungkan rutenya di Cloudflare.</p>\n" +
"         \n" +
"         <div class='bg-gray-50 p-4 rounded-xl border border-gray-100'>\n" +
"            <b class='text-blue-600 text-sm block mb-1'>Langkah 1: Siapkan Domain</b>\n" +
"            Beli domain di provider pilihan Anda (Niagahoster, Hostinger, dll). Masuk ke pengaturan provider, lalu ubah Name Server (NS) bawaan menjadi Name Server (NS) Cloudflare milik Anda. Tunggu hingga domain aktif di Cloudflare.\n" +
"         </div>\n" +
"         \n" +
"         <div class='bg-gray-50 p-4 rounded-xl border border-gray-100'>\n" +
"            <b class='text-blue-600 text-sm block mb-1'>Langkah 2: Aktifkan Email Routing</b>\n" +
"            Login ke Cloudflare. Klik domain Anda yang baru ditambahkan. Di deretan menu sebelah kiri, cari dan klik menu <b>Email</b>, lalu pilih <b>Email Routing</b>. Ikuti petunjuk di layar dan klik tombol aktivasi otomatis sampai statusnya berubah menjadi tulisan hijau (Routing Enabled).\n" +
"         </div>\n" +
"         \n" +
"         <div class='bg-gray-50 p-4 rounded-xl border border-gray-100'>\n" +
"            <b class='text-blue-600 text-sm block mb-1'>Langkah 3: Atur Jaring Penangkap</b>\n" +
"            Masih di halaman Email Routing, perhatikan deretan tab di atas, lalu klik tab <b>Routing Rules</b>. Scroll ke paling bawah layar, temukan bagian bernama <b>Catch-all address</b>, lalu klik tulisan <i>Edit</i> di pojok kanannya.\n" +
"         </div>\n" +
"         \n" +
"         <div class='bg-yellow-50 p-4 rounded-xl border border-yellow-200'>\n" +
"            <b class='text-red-600 text-sm block mb-2'>Langkah 4: Sambungkan ke Habi Mail (PENTING!)</b>\n" +
"            Di menu Catch-all tersebut, atur seperti ini:\n" +
"            <ul class='list-disc pl-4 mt-2 space-y-1'>\n" +
"              <li>Pada kolom <i>Action</i>: Klik dan pilih <span class='bg-white font-bold px-1 rounded border'>Send to a Worker</span></li>\n" +
"              <li>Pada kolom <i>Destination</i>: Akan muncul daftar Worker Cloudflare Anda. <b>Pilih nama Worker tempat Anda menginstal kode Habi Mail ini (misal: pilih <i>web-email-ku</i>)</b>.</li>\n" +
"              <li>Pastikan tombol saklar <i>Status</i> menyala (Active/Hijau).</li>\n" +
"              <li>Klik tombol <b>Save</b> (Simpan).</li>\n" +
"            </ul>\n" +
"         </div>\n" +
"         \n" +
"         <div class='bg-green-50 p-4 rounded-xl border border-green-200 text-green-800 font-bold'>\n" +
"            ⏳ ESTIMASI SELESAI: Setelah disimpan, butuh waktu sekitar 5 - 15 menit agar DNS merambat ke seluruh dunia. Setelah itu, domain Anda 100% siap dipakai menerima kode verifikasi 24 jam nonstop dari aplikasi mana saja!\n" +
"         </div>\n" +
"      </div>\n" +
"      <div class='p-5 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]'>\n" +
"        <button onclick='tutupTutorialMaster()' class='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl uppercase text-xs shadow-md transition'>Saya Sudah Paham</button>\n" +
"      </div>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <footer class='mt-auto py-8 bg-gray-100 text-center border-t border-gray-200 shadow-inner relative z-0'>\n" +
"    <p class='text-[10px] font-bold tracking-[0.4em] uppercase kilau-footer'>Copyright &copy; 2026 HABI MAIL UNLIMITED</p>\n" +
"  </footer>\n" +
"\n" +
"  <script>\n" +
"    // Logika Splash Screen YouTube Style (Muncul max 3 kali, jeda 20 menit)\n" +
"    function initSplash() {\n" +
"      let splash = document.getElementById('splashScreen');\n" +
"      let fCount = parseInt(localStorage.getItem('habi_flash_count') || '0');\n" +
"      let fTime = parseInt(localStorage.getItem('habi_flash_time') || '0');\n" +
"      let now = Date.now();\n" +
"      if (now - fTime > 1200000) { fCount = 0; localStorage.setItem('habi_flash_time', now.toString()); }\n" +
"      if (fCount < 3) {\n" +
"        setTimeout(() => { splash.style.opacity = '0'; setTimeout(() => splash.style.display = 'none', 500); }, 2000);\n" +
"        localStorage.setItem('habi_flash_count', (fCount + 1).toString());\n" +
"        if(fCount === 0) localStorage.setItem('habi_flash_time', now.toString());\n" +
"      } else { splash.style.display = 'none'; }\n" +
"    }\n" +
"    initSplash();\n" +
"\n" +
"    // Algoritma Nama Anti-Spam Super (Acak nama + 5 angka acak + ID Waktu)\n" +
"    const nD=['Zahra','Kania','Nabila','Kirana','Salsabila','Aurel','Nadhira','Cantika','Arsy','Syafira','Tiara','Almira','Dinda','Citra','Lestari'];\n" +
"    const nB=['Maharani','Larasati','Widya','Puspa','Kirani','Azzahra','Maheswari','Kusuma','Anggraini','Pertiwi','Ningrum','Sari'];\n" +
"    let curMsgs=[]; let listDomObj = [];\n" +
"    \n" +
"    async function loadDomains() {\n" +
"       try {\n" +
"         const r = await fetch('/api/domains?_=' + Date.now());\n" +
"         const data = await r.json();\n" +
"         let now = Date.now();\n" +
"         listDomObj = data.map(x => {\n" +
"            if(x.isNew && (now - (x.ts || 0) > 300000)) x.isNew = false;\n" +
"            return x;\n" +
"         });\n" +
"         renderMenuDaftarDomain();\n" +
"         if(!localStorage.getItem('he')) { gr(); } else { updateFullEmailFromLocal(); }\n" +
"       } catch(e) {}\n" +
"    }\n" +
"    \n" +
"    function renderMenuDaftarDomain() {\n" +
"       const container = document.getElementById('listDomainContainer');\n" +
"       let html = '';\n" +
"       listDomObj.forEach(item => {\n" +
"          let badgeNew = item.isNew ? '<span class=\"bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded badge-new absolute top-3 right-3 shadow-md\">NEW</span>' : '';\n" +
"          let btnHapus = !item.locked ? '<button onclick=\"hapusDomainGlobal(\\''+item.d+'\\')\" class=\"text-[9px] font-bold text-red-500 hover:text-white hover:bg-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-200 uppercase transition\">Hapus Global</button>' : '';\n" +
"          let lockIco = item.locked ? '<span class=\"text-[10px] ml-2 text-gray-400\">🔒 Master</span>' : '';\n" +
"          \n" +
"          // ID unik untuk wadah status agar bisa diupdate asynchronous tanpa lag\n" +
"          let statusId = 'status_dom_' + item.d.replace(/[^a-zA-Z0-9]/g, '');\n" +
"          \n" +
"          html += '<div class=\"bg-white border border-gray-200 rounded-2xl p-5 relative shadow-sm hover:border-blue-400 hover:shadow-md transition-all\">' +\n" +
"             badgeNew +\n" +
"             '<div class=\"font-extrabold text-gray-800 text-sm mb-1\">' + item.d + lockIco + '</div>' +\n" +
"             '<div class=\"text-[9px] text-gray-500 font-medium mb-3 bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100\">⌚ Ditambahkan: ' + item.t + '</div>' +\n" +
"             '<div id=\"'+statusId+'\" class=\"text-[9px] font-bold text-gray-400 mb-4\">Mengecek jaringan...</div>' +\n" +
"             '<div class=\"flex justify-between items-center\">' +\n" +
"                btnHapus +\n" +
"                '<button onclick=\"pilihDomainUi(\\''+item.d+'\\')\" class=\"text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg uppercase shadow-md transition ml-auto\">Gunakan Ini</button>' +\n" +
"             '</div>' +\n" +
"          '</div>';\n" +
"       });\n" +
"       container.innerHTML = html;\n" +
"       // Cek status satu per satu setelah render\n" +
"       listDomObj.forEach(item => { cekStatusList(item.d, 'status_dom_' + item.d.replace(/[^a-zA-Z0-9]/g, '')); });\n" +
"    }\n" +
"\n" +
"    async function cekStatusList(dom, elId) {\n" +
"       const el = document.getElementById(elId);\n" +
"       if(!el) return;\n" +
"       if(dom === 'habisuno.my.id') { el.innerHTML = '🟢 Terhubung & Siap dipakai'; el.className = 'text-[9px] font-bold text-green-600 mb-4'; return; }\n" +
"       try {\n" +
"          const res = await fetch('https://cloudflare-dns.com/dns-query?name='+dom+'&type=MX', {headers: {'accept': 'application/dns-json'}});\n" +
"          const data = await res.json();\n" +
"          let terhubung = data.Answer && data.Answer.some(r => r.data.includes('cloudflare.net'));\n" +
"          if(terhubung) { el.innerHTML = '🟢 Terhubung & Siap dipakai'; el.className = 'text-[9px] font-bold text-green-600 mb-4'; }\n" +
"          else { el.innerHTML = '🔴 Belum Disetting Cloudflare'; el.className = 'text-[9px] font-bold text-red-500 mb-4'; }\n" +
"       } catch(e) { el.innerHTML = '🟡 Gagal mengecek'; }\n" +
"    }\n" +
"\n" +
"    function pilihDomainUi(dom) {\n" +
"       document.getElementById('teksDomainAktif').innerText = dom;\n" +
"       updateFullEmail();\n" +
"       tutupModalDaftarDomain();\n" +
"    }\n" +
"\n" +
"    function gr(m=false){\n" +
"       if(!m&&localStorage.getItem('he')){ updateFullEmailFromLocal(); return; }\n" +
"       // Anti-Spam: Kombinasi nama + 5 digit angka acak + millisecond terakhir\n" +
"       let rndNum = Math.floor(Math.random() * 99999) + Date.now().toString().slice(-3);\n" +
"       const usr = nD[Math.floor(Math.random()*nD.length)]+'.'+nB[Math.floor(Math.random()*nB.length)]+rndNum;\n" +
"       document.getElementById('emUser').value = usr;\n" +
"       updateFullEmail();\n" +
"    }\n" +
"    \n" +
"    function updateFullEmail() {\n" +
"       const usr = document.getElementById('emUser').value;\n" +
"       const dom = document.getElementById('teksDomainAktif').innerText || 'habisuno.my.id';\n" +
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
"          document.getElementById('teksDomainAktif').innerText = pts[1];\n" +
"          document.getElementById('emFull').value = full;\n" +
"          cekStatusDomain(pts[1]);\n" +
"       } else { gr(true); }\n" +
"    }\n" +
"\n" +
"    async function cekStatusDomain(dom) {\n" +
"       const stUI = document.getElementById('statusDomain');\n" +
"       stUI.innerHTML = 'Sedang mengecek status jaringan domain...';\n" +
"       stUI.className = 'text-[10px] font-bold mb-4 bg-gray-100 text-gray-600 p-3 rounded-xl border border-gray-200';\n" +
"       if(dom === 'habisuno.my.id') {\n" +
"          stUI.innerHTML = 'Status: 🟢 Terhubung & Aman Menerima Pesan';\n" +
"          stUI.className = 'text-[10px] font-bold mb-4 bg-green-50 text-green-700 p-3 rounded-xl border border-green-200';\n" +
"          return;\n" +
"       }\n" +
"       try {\n" +
"          const res = await fetch('https://cloudflare-dns.com/dns-query?name='+dom+'&type=MX', {headers: {'accept': 'application/dns-json'}});\n" +
"          const data = await res.json();\n" +
"          let terhubung = false;\n" +
"          if(data.Answer) terhubung = data.Answer.some(r => r.data.includes('cloudflare.net'));\n" +
"          if(terhubung) {\n" +
"             stUI.innerHTML = 'Status: 🟢 Terhubung & Siap Menerima Kode Verifikasi';\n" +
"             stUI.className = 'text-[10px] font-bold mb-4 bg-green-50 text-green-700 p-3 rounded-xl border border-green-200';\n" +
"          } else {\n" +
"             stUI.innerHTML = 'Status: 🔴 Belum Terhubung - <span onclick=\"bukaTutorialMaster()\" class=\"underline text-blue-600 cursor-pointer\">Lihat Solusi Disini</span>';\n" +
"             stUI.className = 'text-[10px] font-bold mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-200';\n" +
"          }\n" +
"       } catch(e) { stUI.innerHTML = 'Status: 🟡 Cek koneksi internet Anda.'; }\n" +
"    }\n" +
"\n" +
"    function showModalMaster(title, desc, icon='📋') {\n" +
"      document.getElementById('modalTitle').innerText = title;\n" +
"      document.getElementById('modalDesc').innerText = desc;\n" +
"      document.getElementById('ikonMaster').innerText = icon;\n" +
"      document.getElementById('modalMaster').classList.remove('hidden');\n" +
"    }\n" +
"    function tutupModalMaster() { document.getElementById('modalMaster').classList.add('hidden'); }\n" +
"\n" +
"    function salinEmail(){\n" +
"      navigator.clipboard.writeText(document.getElementById('emFull').value);\n" +
"      showModalMaster('Alamat Email Disalin!', 'Identitas anonim Anda siap digunakan. Bebas dari pelacakan dan 100% aman dari spam.', '🛡️');\n" +
"    }\n" +
"    \n" +
"    function bukaModalDaftarDomain() { document.getElementById('modalDaftarDomain').classList.remove('hidden'); }\n" +
"    function tutupModalDaftarDomain() { document.getElementById('modalDaftarDomain').classList.add('hidden'); }\n" +
"    function bukaModalTambahDomain() { document.getElementById('modalTambahDomain').classList.remove('hidden'); }\n" +
"    function tutupModalTambahDomain() { document.getElementById('modalTambahDomain').classList.add('hidden'); }\n" +
"    function bukaTutorialMaster() { document.getElementById('modalTutorialFull').classList.remove('hidden'); }\n" +
"    function tutupTutorialMaster() { document.getElementById('modalTutorialFull').classList.add('hidden'); }\n" +
"\n" +
"    async function tambahDomainGlobal() {\n" +
"       let val = document.getElementById('inputNewDomain').value.trim().toLowerCase();\n" +
"       let ada = listDomObj.find(x => x.d === val);\n" +
"       if(val && !ada) { \n" +
"          const hriStr = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];\n" +
"          const blnStr = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];\n" +
"          let n = new Date();\n" +
"          let tStr = hriStr[n.getDay()]+', '+n.getDate()+' '+blnStr[n.getMonth()]+' '+n.getFullYear()+' | Pukul '+n.toLocaleTimeString('id-ID',{hour12:false}).replace(/\\./g,':');\n" +
"          \n" +
"          await fetch('/api/domains', {method:'POST', body:JSON.stringify({action:'add', domain:val, time:tStr})});\n" +
"          await loadDomains(); \n" +
"          \n" +
"          document.getElementById('teksDomainAktif').innerText = val;\n" +
"          updateFullEmail();\n" +
"          document.getElementById('inputNewDomain').value='';\n" +
"          tutupModalTambahDomain();\n" +
"          showModalMaster('Integrasi Berhasil!', 'Domain publik \"'+val+'\" telah mengudara di server Habi Mail. Semua pengguna di dunia kini bisa melihat dan memakainya.', '🚀');\n" +
"       }\n" +
"    }\n" +
"    async function hapusDomainGlobal(val) {\n" +
"       if(val === 'habisuno.my.id') { showModalMaster('Akses Ditolak', 'Domain master sistem tidak bisa dihapus!', '❌'); return; }\n" +
"       if(!confirm('Yakin hapus '+val+' untuk SEMUA pengguna global?')) return;\n" +
"       \n" +
"       await fetch('/api/domains', {method:'POST', body:JSON.stringify({action:'del', domain:val})});\n" +
"       if(document.getElementById('teksDomainAktif').innerText === val) {\n" +
"          document.getElementById('teksDomainAktif').innerText = 'habisuno.my.id';\n" +
"          updateFullEmail();\n" +
"       }\n" +
"       await loadDomains();\n" +
"       showModalMaster('Terhapus', 'Domain '+val+' telah ditarik dari peredaran global.', '🗑️');\n" +
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
"             '<button onclick=\"hp(\\'' + p.id + '\\')\" class=\"text-[9px] font-bold text-gray-500 hover:text-red-600 uppercase transition\">Hapus Manual</button>' +\n" +
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
"    window.onload = () => { \n" +
"      const hriStr = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];\n" +
"      const blnStr = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];\n" +
"      loadDomains();\n" +
"      deteksiHP();\n" +
"      setInterval(() => { \n" +
"        const n = new Date(); \n" +
"        document.getElementById('waktuLengkap').innerText = hriStr[n.getDay()] + ', ' + n.getDate() + ' ' + blnStr[n.getMonth()] + ' ' + n.getFullYear() + ' | ' + n.toLocaleTimeString('id-ID', {hour12:true}).replace(/\\./g,':'); \n" +
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
