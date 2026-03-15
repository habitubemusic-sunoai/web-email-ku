export default {
  async email(message, env) {
    let rawEmail = "";
    const reader = message.raw.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawEmail += new TextDecoder().decode(value);
    }
    const data = {
      to: message.to,
      from: message.from,
      subject: message.headers.get("subject") || "Tanpa Judul",
      body: rawEmail,
      waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };
    // 86400 = 24 Jam. Pesan otomatis hancur setelah 1 hari.
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
      <link href="https://fonts.googleapis.com/css2?family=Righteous&family=Poppins:wght@400;500;600;800&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Poppins', sans-serif; 
          background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 50%, #f8fafc 100%);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        /* Animasi Kilau Logo 5 Detik (Sekali) */
        @keyframes kilau-logo {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .logo-keren {
          font-family: 'Righteous', cursive;
          background: linear-gradient(110deg, #1e3a8a 30%, #3b82f6 50%, #1e3a8a 70%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: kilau-logo 5s ease-in-out 1;
        }

        /* Animasi Kilau Copyright Lambat (Terus Menerus) */
        @keyframes kilau-lambat {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .text-kilau {
          background: linear-gradient(110deg, #64748b 30%, #f59e0b 50%, #64748b 70%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: kilau-lambat 3s linear infinite;
        }
      </style>
    </head>
    <body class="text-gray-800 flex flex-col min-h-screen">
      
      <div class="bg-gray-900 text-gray-200 text-xs sm:text-sm px-4 py-2 flex flex-col sm:flex-row justify-between items-center shadow-lg border-b border-gray-800">
        <div id="lokasiTeks" class="mb-1 sm:mb-0">Memuat lokasi...</div>
        <div id="jamRealtime" class="font-mono font-bold text-blue-400 tracking-widest">00:00:00</div>
      </div>

      <div class="max-w-4xl mx-auto p-4 mt-8 flex-grow w-full">
        
        <div class="flex flex-col items-center mb-10">
          <h1 class="text-4xl sm:text-5xl font-extrabold mb-2 text-center logo-keren drop-shadow-sm">HABI UNLIMITED MAIL</h1>
          <p class="text-gray-500 mb-8 font-semibold tracking-wide uppercase text-sm">Layanan Email Sementara Premium</p>
          
          <div class="w-full max-w-xl glass-card p-6 sm:p-8 rounded-3xl shadow-xl">
            <div class="flex flex-col gap-4 mb-5">
              <input type="text" id="emailBox" class="w-full px-5 py-4 text-xl border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-300 text-center bg-white text-blue-700 font-bold shadow-inner" readonly>
              <button onclick="salin()" class="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md transform hover:scale-[1.02]">
                Salin Alamat Email 📋
              </button>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-center gap-3 mt-2">
              <button onclick="generateRandom(true)" class="border-2 border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500 font-bold py-3 px-6 rounded-xl transition-all shadow-sm bg-white">
                Ganti Nama (Cewek Jatim)
              </button>
              <button onclick="aktifkanNotif()" id="btnNotif" class="border-2 border-indigo-400 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-500 font-bold py-3 px-6 rounded-xl transition-all shadow-sm bg-white text-sm">
                🔔 Izinkan Notif Suara
              </button>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-3xl shadow-xl overflow-hidden mb-10">
          <div class="bg-white/50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 class="font-bold text-2xl text-gray-800 flex items-center gap-2">
              📥 Kotak Masuk
            </h2>
            <span class="bg-blue-600 text-white rounded-full px-4 py-1.5 text-sm font-bold shadow-md" id="count">0</span>
          </div>
          <div id="inbox" class="divide-y divide-gray-100 bg-white/40">
            <div class="p-16 text-center text-gray-500">
              <div class="text-5xl mb-4 opacity-30">📭</div>
              <p class="text-2xl mb-2 font-semibold text-gray-700">Kotak masuk kosong</p>
              <p class="text-sm">Menunggu email masuk... (Otomatis terhapus dalam 24 Jam)</p>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-3xl shadow-lg p-8 sm:p-10 mb-8 text-center border-t-4 border-t-blue-500">
          <h3 class="text-3xl font-bold mb-4 text-gray-800">Tentang HABI Unlimited Mail</h3>
          <p class="text-gray-600 mb-8 leading-relaxed text-lg max-w-2xl mx-auto">
            Selamat datang di layanan email sementara (Temp Mail) paling tangguh dan anti-banned. Layanan eksklusif ini dirancang khusus oleh <strong>Habi</strong> untuk memastikan privasi Anda aman dan mempermudah pendaftaran akun tanpa gangguan spam.
            <br><br>
            Punya ide atau ingin menambahkan domain baru khusus untuk keperluan Anda? Jangan ragu untuk menghubungi saya langsung!
          </p>
          
          <a href="https://wa.me/6285119821813" target="_blank" class="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full transition-all shadow-xl transform hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
            Chat Habi via WA
          </a>
        </div>

      </div>

      <footer class="mt-auto py-8 bg-gray-900 border-t-4 border-gray-800 text-center">
        <p class="text-sm font-bold text-kilau tracking-wide uppercase">
          Copyright &copy; <span id="tahun"></span> HABI UNLIMITED MAIL. All Rights Reserved.
        </p>
      </footer>

      <script>
        // Data Nama
        const namaDepan = ['siti', 'ayu', 'dewi', 'sri', 'indah', 'ratna', 'fitri', 'endang', 'tari', 'wulan', 'rina', 'putri', 'ning', 'yani', 'nisa', 'nurul', 'dwi', 'tri'];
        const namaBelakang = ['ningsih', 'wati', 'sari', 'astuti', 'rahayu', 'kusuma', 'lestari', 'susanti', 'wahyuni', 'maharani', 'agustin', 'purwanti'];
        
        let lastPesanCount = 0;
        const notifSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        function aktifkanNotif() {
          if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                document.getElementById('btnNotif').innerText = "🔔 Notif Aktif";
                document.getElementById('btnNotif').classList.replace('text-indigo-500', 'text-white');
                document.getElementById('btnNotif').classList.replace('border-indigo-400', 'border-indigo-600');
                document.getElementById('btnNotif').classList.add('bg-indigo-500');
              }
            });
          } else {
            alert("Notifikasi & Suara sudah aktif!");
          }
        }

        // Fungsi Generate Email dengan Sistem Penyimpanan Permanen (Anti-Reset saat di-refresh)
        function generateRandom(isManual = false) {
          // Jika tidak dipencet manual & sudah ada email tersimpan, pakai yang lama
          if (!isManual && localStorage.getItem('habiTempEmail')) {
            document.getElementById('emailBox').value = localStorage.getItem('habiTempEmail');
            return;
          }
          
          // Buat email baru
          const d = namaDepan[Math.floor(Math.random() * namaDepan.length)];
          const b = namaBelakang[Math.floor(Math.random() * namaBelakang.length)];
          const angka = Math.floor(Math.random() * 9999);
          const emailBaru = d + '.' + b + angka + '@habisuno.my.id';
          
          document.getElementById('emailBox').value = emailBaru;
          // Simpan permanen di HP
          localStorage.setItem('habiTempEmail', emailBaru);
        }

        function salin() {
          const kotak = document.getElementById('emailBox');
          kotak.select();
          kotak.setSelectionRange(0, 99999);
          navigator.clipboard.writeText(kotak.value);
        }

        function updateWaktu() {
          const now = new Date();
          const opsiJam = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
          document.getElementById('jamRealtime').innerText = now.toLocaleTimeString('id-ID', opsiJam).replace(/\./g, ':');
          document.getElementById('tahun').innerText = now.getFullYear();
        }

        function lacakLokasi() {
          fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(res => res.json())
            .then(data => {
              const now = new Date();
              const opsiTgl = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
              document.getElementById('lokasiTeks').innerText = now.toLocaleDateString('id-ID', opsiTgl) + " | " + data.city + ", " + data.region;
            })
            .catch(() => {
              const now = new Date();
              document.getElementById('lokasiTeks').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + " | Jember, Jawa Timur";
            });
        }

        window.onload = () => {
          generateRandom();
          updateWaktu();
          lacakLokasi();
          setInterval(updateWaktu, 1000);
          
          if(Notification.permission === "granted") {
             document.getElementById('btnNotif').innerText = "🔔 Notif Aktif";
             document.getElementById('btnNotif').classList.replace('text-indigo-500', 'text-white');
             document.getElementById('btnNotif').classList.add('bg-indigo-500');
          }
        };

        async function muatPesan() {
          try {
            const res = await fetch('/api/pesan');
            const pesan = await res.json();
            const inbox = document.getElementById('inbox');
            document.getElementById('count').innerText = pesan.length;
            
            if (pesan.length > lastPesanCount) {
              if (lastPesanCount !== 0) {
                notifSound.play().catch(e => console.log('Suara diblokir browser'));
                if (Notification.permission === "granted") {
                  new Notification("HABI Mail: Pesan Baru Masuk!", { 
                    body: "Dari: " + pesan[0].from,
                    icon: "https://cdn-icons-png.flaticon.com/512/732/732200.png"
                  });
                }
              }
              lastPesanCount = pesan.length;
            }
            
            if (pesan.length === 0) return;
            
            inbox.innerHTML = pesan.map(p => \`
              <div class="p-6 sm:p-8 hover:bg-white transition-colors">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                  <h3 class="font-bold text-xl text-gray-900">\${p.subject}</h3>
                  <span class="text-xs text-blue-700 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full font-bold shadow-sm mt-2 sm:mt-0">\${p.waktu}</span>
                </div>
                <div class="text-sm text-gray-600 mb-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span class="inline-block mb-1"><strong>Dari:</strong> \${p.from}</span> <br> 
                  <span class="inline-block"><strong>Kepada:</strong> \${p.to}</span>
                </div>
                <div class="bg-gray-800 p-5 rounded-2xl border border-gray-700 text-sm text-gray-100 whitespace-pre-wrap overflow-x-auto shadow-inner leading-relaxed">\${p.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              </div>
            \`).join('');
          } catch (e) {
            console.error('Gagal memuat pesan');
          }
        }
        
        muatPesan();
        setInterval(muatPesan, 1000);
      </script>
    </body>
    </html>`;
    
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
