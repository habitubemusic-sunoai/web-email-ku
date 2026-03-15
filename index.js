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
      <title>Email Sementara - Habisuno</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 text-gray-800 font-sans">
      <div class="max-w-3xl mx-auto p-4 mt-8">
        
        <div class="flex flex-col items-center mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-900">Email Sementara Anda:</h1>
          
          <div class="w-full max-w-lg bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div class="flex flex-col sm:flex-row gap-3 mb-6">
              <input type="text" id="emailBox" class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none text-center sm:text-left bg-gray-50 text-gray-700 font-medium" readonly>
              <button onclick="salin()" class="bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Salin 📋
              </button>
            </div>
            
            <div class="flex justify-center gap-4">
              <button onclick="generateRandom()" class="border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-2 px-8 rounded-full transition-colors">
                Ganti Acak
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="font-bold text-xl text-gray-800">Kotak masuk</h2>
            <span class="bg-gray-800 text-white rounded-full px-4 py-1 text-sm font-bold shadow-sm" id="count">0</span>
          </div>
          
          <div id="inbox" class="divide-y divide-gray-100">
            <div class="p-12 text-center text-gray-500">
              <p class="text-xl mb-2 font-medium">Kotak masuk kosong</p>
              <p class="text-sm">Menunggu email masuk...</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        // Fungsi untuk mengacak nama email
        function generateRandom() {
          const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          document.getElementById('emailBox').value = result + '@habisuno.my.id';
        }

        // Fungsi menyalin email ke clipboard HP
        function salin() {
          const kotak = document.getElementById('emailBox');
          kotak.select();
          kotak.setSelectionRange(0, 99999);
          navigator.clipboard.writeText(kotak.value);
          alert('Alamat email berhasil disalin!');
        }

        // Langsung acak email saat web pertama dibuka
        window.onload = generateRandom;

        // Fungsi untuk mengambil riwayat pesan dari database Cloudflare
        async function muatPesan() {
          try {
            const res = await fetch('/api/pesan');
            const pesan = await res.json();
            const inbox = document.getElementById('inbox');
            document.getElementById('count').innerText = pesan.length;
            
            if (pesan.length === 0) {
              return; // Biarkan tulisan "kosong" jika belum ada pesan
            }
            
            inbox.innerHTML = pesan.map(p => \`
              <div class="p-6 hover:bg-gray-50 transition-colors">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                  <h3 class="font-bold text-lg text-gray-900">\${p.subject}</h3>
                  <span class="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">\${p.waktu}</span>
                </div>
                <div class="text-sm text-gray-600 mb-4"><strong>Dari:</strong> \${p.from} <br> <strong>Kepada:</strong> \${p.to}</div>
                <div class="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto shadow-inner">\${p.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              </div>
            \`).join('');
          } catch (e) {
            console.error('Gagal memuat pesan');
          }
        }
        
        // Cek email baru setiap 5 detik secara otomatis
        muatPesan();
        setInterval(muatPesan, 5000);
      </script>
    </body>
    </html>`;
    
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
