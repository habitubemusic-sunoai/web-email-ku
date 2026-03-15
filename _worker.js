export default {
  async email(message, env) {
    // Menangkap email masuk dan membaca isinya
    let rawEmail = "";
    const reader = message.raw.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawEmail += new TextDecoder().decode(value);
    }
    
    // Menyusun data email
    const data = {
      to: message.to,
      from: message.from,
      subject: message.headers.get("subject") || "Tanpa Judul",
      body: rawEmail,
      waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };
    
    // Menyimpan ke database KV (Otomatis terhapus dalam 24 jam)
    await env.DB.put(Date.now().toString(), JSON.stringify(data), { expirationTtl: 86400 });
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Jalur API untuk mengambil daftar pesan dari database
    if (url.pathname === "/api/pesan") {
      const { keys } = await env.DB.list();
      let emails = [];
      for (let key of keys) {
        const val = await env.DB.get(key.name);
        if (val) emails.push(JSON.parse(val));
      }
      return new Response(JSON.stringify(emails.reverse()), {headers: {'Content-Type': 'application/json'}});
    }

    // Tampilan Antarmuka Website (UI)
    const html = `<!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Sementara - Habisuno</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 font-sans p-4">
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mt-4">
        <h1 class="text-2xl font-bold text-center mb-6 text-gray-800">Email Sementara Anda</h1>
        
        <div class="flex border-2 border-gray-300 rounded-lg overflow-hidden mb-6">
          <input type="text" id="emailBox" value="bebas@habisuno.my.id" class="w-full px-3 py-3 text-lg outline-none bg-gray-50 text-gray-600" readonly>
          <button onclick="salin()" class="bg-blue-600 text-white px-5 font-bold hover:bg-blue-700 active:bg-blue-800 transition">Salin</button>
        </div>

        <h2 class="text-lg font-bold mb-3 border-b-2 pb-2 text-gray-700">Kotak Masuk (<span id="count">0</span>)</h2>
        <div id="inbox" class="space-y-4">
          <p class="text-center text-gray-500 text-sm mt-4">Menunggu email masuk...</p>
        </div>
      </div>

      <script>
        function salin() {
          const kotak = document.getElementById('emailBox');
          kotak.select();
          kotak.setSelectionRange(0, 99999);
          navigator.clipboard.writeText(kotak.value);
          alert('Berhasil disalin!');
        }

        async function muatPesan() {
          try {
            const res = await fetch('/api/pesan');
            const pesan = await res.json();
            const inbox = document.getElementById('inbox');
            document.getElementById('count').innerText = pesan.length;
            
            if (pesan.length === 0) {
              inbox.innerHTML = '<p class="text-center text-gray-500 text-sm mt-4">Menunggu email masuk...</p>';
              return;
            }
            
            inbox.innerHTML = pesan.map(p => \`
              <div class="border rounded-lg p-4 bg-gray-50 shadow-sm">
                <div class="font-bold text-gray-800 mb-1">\${p.subject}</div>
                <div class="text-xs text-gray-500 mb-2">Dari: \${p.from} <br> Waktu: \${p.waktu}</div>
                <div class="text-sm bg-white p-2 border rounded overflow-x-auto text-gray-700 h-32 overflow-y-auto">\${p.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              </div>
            \`).join('');
          } catch (e) {
            console.error('Gagal memuat pesan');
          }
        }
        
        muatPesan();
        setInterval(muatPesan, 5000);
      </script>
    </body>
    </html>`;
    
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
