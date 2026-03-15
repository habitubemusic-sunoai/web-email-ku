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
      <style>
        @keyframes shine-once {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes shine-infinite {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .kilau-sekali {
          background: linear-gradient(120deg, #1f2937 40%, #60a5fa 50%, #1f2937 60%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shine-once 2.5s ease-in-out 1;
        }
        .kilau-terus {
          background: linear-gradient(120deg, #6b7280 40%, #f59e0b 50%, #6b7280 60%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shine-infinite 3s linear infinite;
        }
      </style>
    </head>
    <body class="bg-gray-50 text-gray-800 font-sans flex flex-col min-h-screen">
      
      <div class="bg-gray-900 text-gray-200 text-xs sm:text-sm px-4 py-2 flex justify-between items-center shadow-md">
        <div id="lokasiTimezone">Memuat lokasi...</div>
        <div id="jamRealtime" class="font-mono font-bold text-blue-400">00:00:00</div>
      </div>

      <div class="max-w-3xl mx-auto p-4 mt-6 flex-grow w-full">
        
        <div class="flex flex-col items-center mb-8">
          <h1 class="text-4xl sm:text-5xl font-extrabold mb-2 text-center kilau-sekali tracking-wider">HABI UNLIMITED MAIL</h1>
          <p class="text-gray-500 mb-6 font-medium">Email Sementara Anda:</p>
          
          <div class="w-full max-w-lg bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div class="flex flex-col gap-3 mb-4">
              <input type="text" id="emailBox" class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none text-center bg-gray-50 text-blue-600 font-bold" readonly>
              <button onclick="salin()" class="bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Salin 📋
              </button>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-center gap-3">
              <button onclick="generateRandom()" class="border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-2 px-6 rounded-xl transition-colors">
                Ganti Nama (Cewek Jatim)
              </button>
              <button onclick="aktifkanNotif()" id="btnNotif" class="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold py-2 px-6 rounded-xl transition-colors text-sm">
                🔔 Izinkan Notif Suara
              </button>
            </div>
            <p class="text-xs text-center text-gray-400 mt-3">*Klik tombol notif agar bunyi saat ada pesan masuk</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="font-bold text-xl text-gray-800">Kotak masuk</h2>
            <span class="bg-gray-800 text-white rounded-full px-4 py-1 text-sm font-bold shadow-sm" id="count">0</span>
          </div>
          
          <div id="inbox" class="divide-y divide-gray-100">
            <div class="p-12 text-center text-gray-500">
              <p class="text-xl mb-2 font-medium">Kotak masuk kosong</p>
              <p class="text-sm">Menunggu email masuk... (Auto refresh 1 detik)</p>
            </div>
          </div>
        </div>
      </div>

      <footer class="mt-auto py-6 bg-white border-t border-gray-200 text-center">
        <p class="text-gray-700 font-bold mb-1">Dibuat oleh Habi mail unlimited</p>
        <p class="text-sm font-bold kilau-terus">Copyright &copy; <span id="tahun"></span> HABI. All Rights Reserved.</p>
      </footer>

      <script>
        // Database Nama Cewek Jatim
        const namaDepan = ['siti', 'ayu', 'dewi', 'sri', 'indah', 'ratna', 'fitri', 'endang', 'tari', 'wulan', 'rina', 'putri', 'ning', 'yani', 'nisa', 'nurul', 'dwi', 'tri'];
        const namaBelakang = ['ningsih', 'wati', 'sari', 'astuti', 'rahayu', 'kusuma', 'lestari', 'susanti', 'wahyuni', 'maharani', 'agustin', 'purwanti'];
        
        let lastPesanCount = 0;
        const notifSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        function aktifkanNotif() {
          if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                document.getElementById('btnNotif').innerText = "🔔 Notif Aktif";
                document.getElementById('btnNotif').classList.add('bg-blue-500', 'text-white');
              }
            });
          } else {
            alert("Notifikasi & Suara sudah aktif di perangkat ini.");
          }
        }

        function generateRandom() {
          const d = namaDepan[Math.floor(Math.random() * namaDepan.length)];
          const b = namaBelakang[Math.floor(Math.random() * namaBelakang.length)];
          const angka = Math.floor(Math.random() * 9999);
          document.getElementById('emailBox').value = d + '.' + b + angka + '@habisuno.my.id';
        }

        function salin() {
          const kotak = document.getElementById('emailBox');
          kotak.select();
          kotak.setSelectionRange(0, 99999);
          navigator.clipboard.writeText(kotak.value);
        }

        function updateWaktu() {
          const now = new Date();
          const opsiJam = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
          document.getElementById('jamRealtime').innerText = now.toLocaleTimeString('id-ID', opsiJam);
          
          const opsiTgl = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
          const tglStr = now.toLocaleDateString('id-ID', opsiTgl);
          
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          document.getElementById('lokasiTimezone').innerText = tglStr + " | " + tz;
          document.getElementById('tahun').innerText = now.getFullYear();
        }

        window.onload = () => {
          generateRandom();
          updateWaktu();
          setInterval(updateWaktu, 1000);
          
          if(Notification.permission === "granted") {
             document.getElementById('btnNotif').innerText = "🔔 Notif Aktif";
             document.getElementById('btnNotif').classList.add('bg-blue-500', 'text-white');
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
                  const emailBaru = pesan[0];
                  new Notification("HABI Mail: Pesan Baru!", { 
                    body: "Subjek: " + emailBaru.subject,
                    icon: "https://cdn-icons-png.flaticon.com/512/732/732200.png"
                  });
                }
              }
              lastPesanCount = pesan.length;
            }
            
            if (pesan.length === 0) return;
            
            inbox.innerHTML = pesan.map(p => \`
              <div class="p-6 hover:bg-gray-50 transition-colors">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                  <h3 class="font-bold text-lg text-gray-900">\${p.subject}</h3>
                  <span class="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-bold">\${p.waktu}</span>
                </div>
                <div class="text-sm text-gray-600 mb-4"><strong>Dari:</strong> \${p.from} <br> <strong>Kepada:</strong> \${p.to}</div>
                <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 text-sm text-gray-200 whitespace-pre-wrap overflow-x-auto shadow-inner">\${p.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              </div>
            \`).join('');
          } catch (e) {
            console.error('Gagal memuat pesan');
          }
        }
        
        muatPesan();
        setInterval(muatPesan, 1000); // REFRESH SETIAP 1 DETIK
      </script>
    </body>
    </html>`;
    
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
