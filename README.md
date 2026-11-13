# Markas Agent: BinaLab · Meney Gaming

Dashboard 3D untuk AI agent dua bisnes Danial. Ada satu hab **Command** (Nadi), bangunan **BinaLab** (studio perisian) dan bangunan **Meney Gaming** (kedai gaming). Setiap agent dipaparkan sebagai pekerja di pejabat. Mereka menaip bila sibuk, berjalan bila senggang, dan "!" merah muncul bila perlu keputusan Danial.

**Live:** https://office-ai-agent-tawny.vercel.app
**Semakan backend:** https://office-ai-agent-tawny.vercel.app/api/health

---

## 1. Guna dashboard

| Butang / tindakan | Fungsi |
|---|---|
| **Data contoh / ● Hidup** (kanan atas) | Tukar antara simulasi dan status sebenar. Mod Hidup minta **kod akses** sekali (`MARKAS_VIEW_CODE`). |
| **✨ Cantik / ⚡ Laju** | Kualiti grafik. Laju = tanpa bayang-bayang, untuk phone yang berat (bertukar sendiri kalau perlu). |
| Tab **Semua / Command / BinaLab / Meney** | Zum ke pejabat. Boleh juga tekan terus bangunan atau papan tanda. |
| Tekan pekerja / chip di bawah | Panel detail: sedang buat, report terakhir, aktiviti terkini, perlu keputusan. |
| **✓ Tandakan selesai** | Padam "perlu keputusan" (disimpan di server dalam mod Hidup). |

Jam dan cuaca ikut **waktu Malaysia** dan **cuaca sebenar Pasir Tumboh**. Untuk uji, tambah pada URL:
`?jam=21` (malam), `?jam=19` (senja), `?cuaca=hujan`, `?cuaca=ribut`, `?cuaca=mendung`.

---

## 2. Jalankan di komputer (untuk developer)

```bash
npm install
```

```bash
npm run dev
```

Buka alamat yang keluar (biasanya http://localhost:5173). Mod Data contoh berfungsi terus.
`/api` hanya berfungsi di Vercel (atau dengan `vercel dev`).

```bash
npm run build
```

Setiap `git push` ke `main` akan dideploy automatik oleh Vercel.

---

## 3. Tambah, buang atau namakan semula agent

Semua dalam **satu fail sahaja: `markas.config.js`**. Penerangan setiap medan ada di atas fail itu.

Contoh tambah agent baru di pejabat Meney:

```js
{ id: "hana", nama: "Hana", pejabat: "meney", peranan: "Kutipan & bayaran", warna: "#F2C14E",
  rambut: "tudung", warnaRambut: "#F4A6B8",
  tugas: ["Semak bayaran tertunggak", "Hantar peringatan invois"] },
```

- `id`: huruf kecil, tanpa jarak. Ia juga digunakan oleh agent bila hantar status.
- Meja, kerusi dan saiz bangunan akan disusun sendiri ikut bilangan agent.
- Kalau ada kesilapan (ID berulang, pejabat tiada), header tunjuk **"⚠ semak markas.config.js"**. Dashboard tak akan crash.
- Teks whiteboard BinaLab dan papan promo Meney: medan `papanPesan` pada pejabat.

---

## 4. Hantar status dari agent

Setiap agent (Apps Script, skrip, n8n, Claude, apa-apa) hantar **POST** ke `/api/status`:

```
POST https://office-ai-agent-tawny.vercel.app/api/status
Authorization: Bearer <MARKAS_AGENT_KEY>
Content-Type: application/json

{
  "agent": "bina",                         // wajib, mesti ada dalam markas.config.js
  "sedang": "Kira ringkasan pipeline",     // apa sedang buat (maks 200 aksara)
  "sibuk": true,                           // true = sibuk (menaip), false = sedia
  "report": "Pipeline MY: ...",            // pilihan: report terakhir (maks 4000 aksara)
  "keputusan": "Setuju diskaun 15%?"       // pilihan: perlu keputusan Danial; null = padam
}
```

Medan yang tidak dihantar akan kekal dengan nilai lama. Contoh dari Terminal Mac (kunci ditanya secara tersembunyi):

```bash
read -s "KUNCI?Tampal MARKAS_AGENT_KEY, kemudian tekan Enter: "
```

```bash
curl -X POST https://office-ai-agent-tawny.vercel.app/api/status -H "Authorization: Bearer $KUNCI" -H "Content-Type: application/json" -d '{"agent":"riza","sedang":"Ujian","sibuk":false}'
```

Jawapan `{"ok":true,...}` = berjaya. Dashboard mod Hidup kemas kini dalam ~20 saat.

| Alamat | Kunci | Fungsi |
|---|---|---|
| `POST /api/status` | `Authorization: Bearer MARKAS_AGENT_KEY` | Agent hantar status |
| `GET /api/status` | `x-markas-code: MARKAS_VIEW_CODE` | Dashboard baca semua status |
| `GET /api/log?agent=bina` | `x-markas-code` | 50 aktiviti terakhir |
| `POST /api/decision` `{"agent":"kai"}` | `x-markas-code` | Tandakan keputusan selesai |
| `GET /api/health` | tiada | Semak backend sedia + cadangan kunci rawak |

---

## 5. Agent yang sudah hidup

| Agent | Di mana | Apa | Panduan |
|---|---|---|---|
| **Bina** | Google Apps Script (akaun Danial) | Setiap hari 8:00 pagi: ringkasan tracker prospek MY + Global | `agents/bina/CARA-PASANG.md` |

Agent lain masih guna data contoh sehingga disambung.

---

## 6. Rahsia dan keselamatan

- Semua rahsia disimpan **di Vercel → Settings → Environment Variables** sahaja (lihat `.env.example`):
  - `MARKAS_AGENT_KEY`: untuk agent hantar status
  - `MARKAS_VIEW_CODE`: kod akses dashboard
  - `KV_REST_API_URL`, `KV_REST_API_TOKEN`: diisi automatik oleh Upstash
- Tukar kunci: buka `/api/health`, salin `cadanganKunciRawak`, Edit di Vercel, kemudian **Redeploy**. Ingat kemas kini kunci dalam Script Properties agent juga.
- Jangan commit ID Sheet, data prospek, data pelanggan atau kunci. **Repo ini public.**
- Agent hanya hantar **ringkasan**. Data mentah kekal di sumbernya (Google Sheet, Firebase POS).

---

## 7. Struktur projek

```
markas.config.js     pejabat + agent (satu-satunya tempat untuk ubah)
index.html           kerangka halaman
src/main.js          sambung semua bahagian + gelung animasi
src/scene/           dunia 3D: bangunan, perabot, pekerja, cuaca, siang/malam
src/ui/ui.js         tab, roster, panel detail, gelembung, notis
src/live/live.js     mod Hidup: baca /api, kod akses
src/sim/             data contoh, pekerja berjalan, pelanggan Meney
api/                 backend (Vercel Functions + Upstash Redis)
agents/bina/         skrip Apps Script agent Bina + panduan
logos/               logo BinaLab dan Meney (SVG)
prototaip/           prototaip asal (rujukan sahaja)
```

Teknologi: Vite, three.js 0.187, Vercel Functions, Upstash Redis (pelan percuma).
