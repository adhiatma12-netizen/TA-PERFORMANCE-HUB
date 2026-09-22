export interface PipelineStep {
  step: number;
  title: string;
  description: string;
  codeSnippet?: string;
}

export interface KeyColumnDetail {
  column: string;
  fieldName: string;
  note: string;
  targetPage: string;
  targetComponent: string;
  rawDataType: string;
  cleanedDataType: string;
  formula: string;
  transformationLogic: string;
  steps: PipelineStep[];
  sampleRaw: string;
  sampleOutput: string;
  evaluationGuide: string;
}

export interface SpreadsheetSourceItem {
  id: string;
  title: string;
  module: 'AUTH' | 'BISNIS' | 'ASSURANCE' | 'PROVISIONING' | 'TEKNISI' | 'QE';
  moduleLabel: string;
  spreadsheetId: string;
  sheetName: string;
  gid?: string;
  range?: string;
  editUrl: string;
  csvUrl: string;
  description: string;
  updateFrequency: string;
  keyColumns: KeyColumnDetail[];
  status: 'ONLINE' | 'ACTIVE';
}

export const SPREADSHEET_SOURCES: SpreadsheetSourceItem[] = [
  {
    id: 'src-auth',
    title: 'Database Akun & Hak Akses User (Otentikasi PCC)',
    module: 'AUTH',
    moduleLabel: 'Autentikasi & Previlage',
    spreadsheetId: '1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE',
    sheetName: 'list user',
    gid: '0',
    editUrl: 'https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/edit#gid=0',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/gviz/tq?tqx=out:csv&sheet=list%20user',
    description: 'Menyimpan daftar kredensial resmi pengguna (USER, PASWORD) dan penentuan PREVILAGE (OWNER / USER) yang mengatur hak akses halaman Kelola Data.',
    updateFrequency: 'Real-time saat login / On-Demand Sync',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Kolom A',
        fieldName: 'USER',
        note: 'Nomor akun / NIK / ID login pengguna',
        targetPage: 'Halaman Login & Brand Bar Utama',
        targetComponent: 'Input Form Akun Login & Profil Pengguna di Brand Bar',
        rawDataType: 'Text / Alphanumeric String (e.g. "25890026", "23049182")',
        cleanedDataType: 'Trimmed Lowercase String untuk Matching Akun',
        formula: 'row[0].trim() -> cocokkan dengan input username pengguna',
        transformationLogic: 'Membaca sel Kolom A pada setiap baris CSV, membuang spasi kosong di awal/akhir, lalu memvalidasi apakah cocok dengan ID yang dimasukkan saat login (pencocokan case-insensitive).',
        steps: [
          {
            step: 1,
            title: '1. Ingesti Endpoint GViz CSV',
            description: 'Aplikasi memanggil URL GViz Google Sheets sheet=list user dan memecah teks respon menjadi baris-baris array via parser CSV.',
            codeSnippet: 'fetch(".../gviz/tq?tqx=out:csv&sheet=list user")'
          },
          {
            step: 2,
            title: '2. Ekstraksi Indeks Baris [0]',
            description: 'Mengabaikan baris pertama (header "USER"), membaca string ID pengguna dan menjalankan sanitasi .trim().',
            codeSnippet: 'const user = (row[0] || "").trim();'
          },
          {
            step: 3,
            title: '3. Verifikasi Identitas Akun',
            description: 'Memeriksa keberadaan user di database: accounts.find(a => a.user.toLowerCase() === inputUser.toLowerCase()).',
            codeSnippet: 'if (!foundAccount) throw new Error("Akun tidak ditemukan");'
          },
          {
            step: 4,
            title: '4. Penyajian di Dashboard',
            description: 'ID pengguna yang terverifikasi disimpan di localStorage dan ditampilkan pada lencana profil di pojok kanan atas layar.',
            codeSnippet: '<span>{currentUser}</span>'
          }
        ],
        sampleRaw: '"25890026"',
        sampleOutput: '"25890026" (Muncul di kanan atas brand bar & status aktif)',
        evaluationGuide: 'Jika seorang user gagal login, periksa apakah ada spasi tersembunyi atau tanda petik di Kolom A sheet "list user". Pastikan ID terdaftar di baris data setelah header.'
      },
      {
        column: 'Kolom B',
        fieldName: 'PASWORD',
        note: 'Kata sandi otentikasi (bisa kosong jika akun no-pass)',
        targetPage: 'Halaman Login',
        targetComponent: 'Password Input Field & Validator Kredensial',
        rawDataType: 'String / Empty Cell',
        cleanedDataType: 'Plaintext String / Blank Value',
        formula: 'if (account.password === "") allowDirectLogin() else verifyExact(input, password)',
        transformationLogic: 'Membaca sandi pada Kolom B. Jika sel bernilai kosong di Google Sheets, sistem mengizinkan login tanpa password untuk kemudahan akses operasional lapangan. Jika terisi, wajib verifikasi karakter persis.',
        steps: [
          {
            step: 1,
            title: '1. Ekstraksi Nilai Kolom B',
            description: 'Membaca elemen array baris indeks ke-1 row[1] dari sheet "list user".',
            codeSnippet: 'const password = (row[1] || "").trim();'
          },
          {
            step: 2,
            title: '2. Evaluasi Kebijakan Kata Sandi Kosong',
            description: 'Mendeteksi apakah akun ini bertipe "no-password". Jika string kosong, sistem meloloskan verifikasi sandi.',
            codeSnippet: 'const isNoPassword = !password || password.length === 0;'
          },
          {
            step: 3,
            title: '3. Komparasi String Sandi',
            description: 'Jika sandi terdefinisi, mencocokkan input pengguna secara persis (case-sensitive).',
            codeSnippet: 'if (!isNoPassword && inputPassword !== password) return false;'
          },
          {
            step: 4,
            title: '4. Penerbitan Status Otentikasi',
            description: 'Setelah lolos, sistem menyimpan sesi login dan mengarahkan pengguna ke halaman utama.',
            codeSnippet: 'onLoginSuccess(user, role);'
          }
        ],
        sampleRaw: '"" (Sel Kosong) atau "Telkom2026!"',
        sampleOutput: '"Akses Diizinkan / Sukses Masuk"',
        evaluationGuide: 'Jika ingin membebaskan akun dari kewajiban mengisi password, cukup kosongkan sel di Kolom B (jangan ketik spasi kosong atau tanda strip).'
      },
      {
        column: 'Kolom C',
        fieldName: 'PREVILAGE',
        note: 'Nilai "OWNER" mengaktifkan halaman Kelola Data, "USER" menyembunyikan halaman ini',
        targetPage: 'Navigasi Bar Utama (App.tsx) & Halaman Kelola Data',
        targetComponent: 'Tombol Tab Navigasi "Kelola Data" & Hak Akses Panel Kontrol',
        rawDataType: 'Text String ("OWNER", "USER", atau Kosong)',
        cleanedDataType: 'Uppercase Keyword String ("OWNER" | "USER")',
        formula: 'const isOwner = (row[2] || "USER").trim().toUpperCase() === "OWNER"',
        transformationLogic: 'Mengekstrak hak istimewa pengguna dari Kolom C. Jika bernilai "OWNER", tab "Kelola Data" dimunculkan tepat di sebelah kanan tab "Performansi Teknisi" lengkap dengan badge OWNER emas. Jika "USER", tab disembunyikan dan dicegah aksesnya secara otomatis.',
        steps: [
          {
            step: 1,
            title: '1. Ingesti Kolom C dari Sheet "list user"',
            description: 'Membaca sel kolom ketiga row[2] dari spreadsheet kredensial.',
            codeSnippet: 'const previlage = (row[2] || "USER").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Normalisasi & Penyimpanan Sesi Role',
            description: 'Menyimpan role pengguna ke localStorage/sessionStorage dengan kunci "telkom_akses_auth_role".',
            codeSnippet: 'localStorage.setItem("telkom_akses_auth_role", role);'
          },
          {
            step: 3,
            title: '3. Evaluasi Kondisional Render di App.tsx',
            description: 'Variabel isOwner = currentUserRole === "OWNER" mengendalikan visibilitas tombol tab di bar navigasi.',
            codeSnippet: '{isOwner && <button id="tab-kelola-data">Kelola Data</button>}'
          },
          {
            step: 4,
            title: '4. Pengamanan Pengalihan Otomatis (Security Guard)',
            description: 'Jika user non-owner mencoba mengakses state "kelola-data", sistem seketika me-redirect kembali ke tab "business".',
            codeSnippet: 'if (!isOwner && activeTab === "kelola-data") setActiveTab("business");'
          }
        ],
        sampleRaw: '"OWNER"',
        sampleOutput: '"Menu Kelola Data Muncul di Navigasi + Badge OWNER Emas"',
        evaluationGuide: 'Cek baris user di Kolom C. Pastikan tertulis persis "OWNER" untuk memberikan wewenang pengawasan data, atau "USER" untuk membatasi tampilan hanya pada dashboard reguler.'
      }
    ]
  },
  {
    id: 'src-bc',
    title: 'Billing & Collection (BC) - Finansial & Portofolio Bisnis',
    module: 'BISNIS',
    moduleLabel: 'Performansi Bisnis',
    spreadsheetId: '1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE',
    sheetName: 'BC',
    gid: '0',
    editUrl: 'https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/edit#gid=0',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/gviz/tq?tqx=out:csv&sheet=BC',
    description: 'Sumber data transaksi pembukuan, realisasi pendapatan (Revenue), beban pokok pendapatan (COGS), portofolio bisnis, dan nama program proyek Telkom Akses.',
    updateFrequency: 'Bulanan / Otomatis di-update via GViz CSV',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Kolom A',
        fieldName: 'BULAN',
        note: 'Bulan pelaporan akuntansi (Januari s.d. Desember)',
        targetPage: 'Performansi Bisnis & Profitabilitas',
        targetComponent: 'Filter Periode Bulan (Juli, dsb.) & Penentu Subset Data',
        rawDataType: 'Text String Nama Bulan (e.g. "Juli", "Agustus", "September")',
        cleanedDataType: 'Standardized Month Name String',
        formula: 'rows.filter(r => r[0].toLowerCase() === activeMonth.toLowerCase())',
        transformationLogic: 'Menyaring ribuan baris pembukuan finansial sehingga hanya transaksi pada bulan yang dipilih pada dropdown filter periode yang masuk dalam akumulasi performansi finansial.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Kolom Bulan',
            description: 'Setiap baris sheet "BC" diekstrak kolom pertamanya row[0].',
            codeSnippet: 'const bulanTransaksi = row[0].trim();'
          },
          {
            step: 2,
            title: '2. Filter Sinkronisasi State Aktif',
            description: 'Membandingkan nama bulan transaksi dengan state activeMonth di dashboard utama.',
            codeSnippet: 'const isMatch = bulanTransaksi.toLowerCase() === activeMonth.toLowerCase();'
          },
          {
            step: 3,
            title: '3. Pembentukan Dataset Bulanan',
            description: 'Baris yang cocok diteruskan ke akumulator omzet, beban pokok, dan portofolio.',
            codeSnippet: 'const currentMonthRows = bcRows.filter(r => isMatch);'
          },
          {
            step: 4,
            title: '4. Penyajian di Header & Grafik',
            description: 'Nilai bulan ditampilkan pada keterangan periode "Periode Juli 2026" dan sumbu X diagram tren.',
            codeSnippet: '<p>Periode: {activeMonth} {activeYear}</p>'
          }
        ],
        sampleRaw: '"Juli"',
        sampleOutput: '"Periode Aktif: Juli 2026"',
        evaluationGuide: 'Pastikan penulisan nama bulan seragam menggunakan ejaan Bahasa Indonesia (e.g. "Juli", bukan "July" atau angka "7") agar data tidak terlewat saat penyaringan.'
      },
      {
        column: 'Kolom G',
        fieldName: 'Amount in Local Currency',
        note: 'Nominal nilai transaksi finansial Rupiah',
        targetPage: 'Performansi Bisnis & Profitabilitas',
        targetComponent: 'Kartu KPI Total Revenue, Kartu COGS, Laba Kotor & Grafik Finansial',
        rawDataType: 'Numeric String / Format Rupiah (e.g. "184250000000", "184,250,000,000")',
        cleanedDataType: 'Float Miliar IDR (e.g. 184.25)',
        formula: 'SUM(CleanNumber(row[6])) / 1.000.000.000 (Konversi ke Miliar IDR)',
        transformationLogic: 'Membersihkan format mata uang, membuang tanda kutip dan pemisah ribuan, mengonversi string menjadi angka desimal, lalu membagi dengan 1 Miliar untuk penyajian ringkas dalam format "Rp ... M".',
        steps: [
          {
            step: 1,
            title: '1. Ekstraksi & Pembersihan String Angka',
            description: 'Mengambil row[6] dan membersihkan karakter selain digit, minus, dan titik.',
            codeSnippet: 'const cleanNum = parseFloat(row[6].replace(/[^0-9.-]+/g, "")) || 0;'
          },
          {
            step: 2,
            title: '2. Pengelompokan Kategori Akun (Kolom P)',
            description: 'Jika Kolom P == "REVENUE", nilai dijumlahkan ke totalRevenue. Jika Kolom P == "COGS", dijumlahkan ke totalCogs.',
            codeSnippet: 'if (isRevenue) totalRev += cleanNum; else if (isCogs) totalCogs += cleanNum;'
          },
          {
            step: 3,
            title: '3. Konversi Skala Miliar Rupiah & Laba',
            description: 'Nilai dibagi 1.000.000.000 untuk mendapatkan angka Miliar; Laba Kotor dihitung dari Total Revenue - COGS.',
            codeSnippet: 'const revMiliar = totalRev / 1e9; const grossProfit = revMiliar - cogsMiliar;'
          },
          {
            step: 4,
            title: '4. Penyajian di Komponen StatCard',
            description: 'Format angka disajikan ke pengguna sebagai "Rp 184.3 M" lengkap dengan persentase pencapaian terhadap target.',
            codeSnippet: '<StatCard title="Total Revenue" value={`Rp ${revMiliar.toFixed(1)} M`} />'
          }
        ],
        sampleRaw: '"184250000000"',
        sampleOutput: '"Rp 184.3 M (Realisasi 98.5% terhadap Target)"',
        evaluationGuide: 'Periksa jika ada sel dengan format error (#VALUE!, #REF!) atau teks deskripsi di Kolom G. Nilai tersebut akan terabaikan atau menjadi 0.'
      },
      {
        column: 'Kolom P',
        fieldName: 'Group Akun',
        note: 'Klasifikasi akun finansial ("REVENUE" atau "COGS")',
        targetPage: 'Performansi Bisnis & Profitabilitas',
        targetComponent: 'Pemisah Klasifikasi Pendapatan vs Beban Pokok & Margin Usaha',
        rawDataType: 'Text Category String ("REVENUE" / "COGS")',
        cleanedDataType: 'Standardized Uppercase Category ("REVENUE" | "COGS")',
        formula: 'if (row[15] == "REVENUE") masuk Pendapatan else if (row[15] == "COGS") masuk Beban',
        transformationLogic: 'Berfungsi sebagai saklar penentu agregasi. Nilai "REVENUE" mengakumulasi total omzet perusahaan, sedangkan "COGS" mengakumulasi beban pokok produksi/pekerjaan.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Klasifikasi Akun',
            description: 'Mengambil teks dari kolom ke-16 row[15] pada baris transaksi.',
            codeSnippet: 'const groupAkun = (row[15] || "").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Pengalokasian Agregasi Finansial',
            description: 'Memisahkan arus kas masuk (Revenue) dengan biaya pokok langsung (COGS).',
            codeSnippet: 'const isRevenue = groupAkun.includes("REV"); const isCogs = groupAkun.includes("COGS");'
          },
          {
            step: 3,
            title: '3. Perhitungan Rasio Margin Profitabilitas',
            description: 'Menghitung Net Margin % = ((Revenue - COGS) / Revenue) * 100.',
            codeSnippet: 'const margin = ((rev - cogs) / rev) * 100;'
          },
          {
            step: 4,
            title: '4. Penyajian di Dashboard',
            description: 'Nilai disajikan pada kartu KPI Gross Profit dan Margin EBITDA di dashboard bisnis.',
            codeSnippet: '<div className="text-emerald-600 font-bold">Margin: {margin.toFixed(1)}%</div>'
          }
        ],
        sampleRaw: '"REVENUE"',
        sampleOutput: '"Terakumulasi ke KPI Pendapatan Usaha Bruto"',
        evaluationGuide: 'Pastikan nama grup akun tidak salah ketik (e.g. "REV" atau "BEBAN") tanpa standar, agar baris tidak terlewat dari perhitungan finansial.'
      },
      {
        column: 'Kolom Q',
        fieldName: 'Fortofolio',
        note: 'Segmen portofolio bisnis (Connectivity, CME, IT Services, dll)',
        targetPage: 'Performansi Bisnis & Profitabilitas',
        targetComponent: 'Grafik Donut Portofolio Breakdown & Tabel Segmen Kontribusi',
        rawDataType: 'Text String Nama Segmen Portofolio',
        cleanedDataType: 'Standardized Portfolio Name String',
        formula: 'groupBy(row[16]) -> sum(Amount) / totalRevenue * 100',
        transformationLogic: 'Mengelompokkan transaksi pendapatan ke dalam masing-masing lini portofolio usaha Telkom Akses untuk melihat portofolio mana yang paling menguntungkan dan mendominasi pendapatan.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Nama Portofolio',
            description: 'Membaca string kategori portofolio dari kolom ke-17 row[16].',
            codeSnippet: 'const protoName = (row[16] || "Lainnya").trim();'
          },
          {
            step: 2,
            title: '2. Grouping & Agregasi Nilai per Kategori',
            description: 'Mengumpulkan total Rupiah dari setiap jenis portofolio ke dalam object dictionary.',
            codeSnippet: 'portfolioTotals[protoName] = (portfolioTotals[protoName] || 0) + amount;'
          },
          {
            step: 3,
            title: '3. Hitung Kontribusi Persentase',
            description: 'Menghitung persentase kontribusi setiap portofolio terhadap total omzet regional.',
            codeSnippet: 'const percent = (portfolioTotals[protoName] / totalRev) * 100;'
          },
          {
            step: 4,
            title: '4. Rendering Diagram Donut Recharts',
            description: 'Menampilkan data ke dalam visual diagram lingkaran dengan kode warna representatif.',
            codeSnippet: '<Pie data={portfolioData} dataKey="value" nameKey="name" />'
          }
        ],
        sampleRaw: '"Connectivity"',
        sampleOutput: '"Connectivity: Rp 88.5 M (48.1% Pangsa Portofolio)"',
        evaluationGuide: 'Jika muncul segmen anomali di grafik donut, cek apakah ada spasi berlebih atau variasi kapitalisasi nama portofolio di Google Sheets.'
      },
      {
        column: 'Kolom R',
        fieldName: 'Nama Program',
        note: 'Inisiatif proyek spesifik yang sedang berjalan',
        targetPage: 'Performansi Bisnis & Profitabilitas',
        targetComponent: 'Tabel Rincian Program Proyek & Utilisasi Budget',
        rawDataType: 'Text String Nama Inisiatif / Program Proyek',
        cleanedDataType: 'Clean Project Name String',
        formula: 'groupBy(row[17]) -> hitung serapan anggaran & status realisasi',
        transformationLogic: 'Mengekstrak inisiatif proyek khusus (seperti Modernisasi OLT, Penarikan Kabel Feeder, Rollout B2B) ke dalam tabel rincian proyek untuk pengawasan utilisasi budget.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Nama Inisiatif',
            description: 'Mengekstrak string nama program dari row[17].',
            codeSnippet: 'const programName = (row[17] || "Operasional Reguler").trim();'
          },
          {
            step: 2,
            title: '2. Agregasi Pengeluaran per Proyek',
            description: 'Mengelompokkan transaksi berdasarkan program untuk melihat total anggaran terpakai.',
            codeSnippet: 'programExpenses[programName] += cleanAmount;'
          },
          {
            step: 3,
            title: '3. Evaluasi Terhadap Alokasi Pagu',
            description: 'Membandingkan realisasi dengan pagu anggaran proyek.',
            codeSnippet: 'const burnRate = (programExpenses[programName] / budgetTarget) * 100;'
          },
          {
            step: 4,
            title: '4. Tampilan Tabel Proyek',
            description: 'Menyajikan baris tabel berisi nama program, nilai realisasi, dan progress bar penyerapan.',
            codeSnippet: '<tr><td>{programName}</td><td>Rp {spent} M</td></tr>'
          }
        ],
        sampleRaw: '"Modernisasi Jaringan STO Madiun"',
        sampleOutput: '"Baris Tabel: Modernisasi STO Madiun (Realisasi: Rp 12.4 M)"',
        evaluationGuide: 'Pastikan penamaan program seragam agar pengeluaran untuk proyek yang sama tidak terbelah menjadi baris berbeda.'
      }
    ]
  },
  {
    id: 'src-assurance',
    title: 'Rekap Tiket Gangguan Jaringan (Assurance & MTTR)',
    module: 'ASSURANCE',
    moduleLabel: 'Performansi Assurance',
    spreadsheetId: '1zCLSNsVjczGp7tFe6UMnrQh5QYtXKccgvXApPsQw5Hw',
    sheetName: 'REKAP TIKET',
    gid: '0',
    editUrl: 'https://docs.google.com/spreadsheets/d/1zCLSNsVjczGp7tFe6UMnrQh5QYtXKccgvXApPsQw5Hw/edit#gid=0',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1zCLSNsVjczGp7tFe6UMnrQh5QYtXKccgvXApPsQw5Hw/gviz/tq?tqx=out:csv&sheet=REKAP%20TIKET',
    description: 'Menyimpan ribuan rekaman tiket gangguan pelanggan secara komprehensif, pencapaian SLA 3 jam, durasi MTTR per tiket, flag HVC, dan distribusi STO.',
    updateFrequency: 'Harian / Real-time Live Sync',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Kolom B',
        fieldName: 'TYPE TIKET',
        note: 'Klasifikasi tipe tiket: "REGULER" atau "SQM"',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'Filter Tipe Tiket & Diagram Donut Distribusi Gangguan',
        rawDataType: 'Text Category String ("REGULER" | "SQM")',
        cleanedDataType: 'Standardized Uppercase ("REGULER" | "SQM")',
        formula: 'groupBy(row[1]) -> hitung rasio tiket komplain reaktif vs proaktif',
        transformationLogic: 'Memisahkan keluhan gangguan fisik pelanggan langsung ("REGULER") dengan tiket proaktif degradasi redaman optik ("SQM" - Service Quality Management).',
        steps: [
          {
            step: 1,
            title: '1. Ekstraksi Tipe Tiket',
            description: 'Membaca sel kolom ke-2 row[1] pada baris rekaman tiket gangguan.',
            codeSnippet: 'const typeTiket = (row[1] || "").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Klasifikasi Reaktif vs Proaktif',
            description: 'Mengelompokkan tiket ke kategori REGULER atau SQM.',
            codeSnippet: 'if (typeTiket.includes("SQM")) countSQM++; else countReguler++;'
          },
          {
            step: 3,
            title: '3. Perhitungan Proporsi Gangguan',
            description: 'Menghitung persentase kontribusi tiket SQM terhadap total gangguan witel.',
            codeSnippet: 'const sqmRatio = (countSQM / totalTiket) * 100;'
          },
          {
            step: 4,
            title: '4. Render Visual Donut Chart',
            description: 'Menyajikan perbandingan proporsi tiket pada diagram lingkaran interaktif.',
            codeSnippet: '<PieChart data={[{ name: "REGULER", value: 65 }, { name: "SQM", value: 35 }]} />'
          }
        ],
        sampleRaw: '"REGULER"',
        sampleOutput: '"REGULER: 65% (806 Tiket) | SQM: 35% (434 Tiket)"',
        evaluationGuide: 'Pastikan tipe tiket terisi dengan benar (REGULER atau SQM) agar proporsi tiket penanganan proaktif tidak menjadi 0.'
      },
      {
        column: 'Kolom C',
        fieldName: 'SEKTOR',
        note: 'Teritori sektor (e.g. MADIUN_1, MADIUN_3)',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'Tabel Evaluasi Sektor & Heatmap Teritorial Wilayah',
        rawDataType: 'Text Sektor Code (e.g. "MADIUN_1", "MADIUN_2", "MADIUN_3")',
        cleanedDataType: 'Clean Sektor String',
        formula: 'groupBy(row[2]) -> hitung volume tiket & rata-rata MTTR per sektor teritori',
        transformationLogic: 'Memetakan sebaran gangguan ke sektor operasional spesifik untuk mengetahui sektor mana yang mengalami insiden terbanyak dan membutuhkan perkuatan armada teknisi.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Kode Sektor',
            description: 'Mengekstrak nilai teritori sektor dari row[2].',
            codeSnippet: 'const sektor = (row[2] || "UNKNOWN").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Akumulasi Metrik per Sektor',
            description: 'Menghitung jumlah tiket dan total jam TTR untuk sektor terkait.',
            codeSnippet: 'sektorStats[sektor].count++; sektorStats[sektor].totalTTR += ttr;'
          },
          {
            step: 3,
            title: '3. Hitung MTTR per Sektor',
            description: 'Menghitung rata-rata jam penyelesaian gangguan di masing-masing sektor.',
            codeSnippet: 'const avgSektorMTTR = sektorStats[sektor].totalTTR / sektorStats[sektor].count;'
          },
          {
            step: 4,
            title: '4. Tampilan Tabel Peringkat Sektor',
            description: 'Menyajikan urutan sektor dari yang paling prima hingga yang paling kritis.',
            codeSnippet: '<SectorRow name={sektor} tickets={count} mttr={avgSektorMTTR} />'
          }
        ],
        sampleRaw: '"MADIUN_1"',
        sampleOutput: '"Sektor MADIUN_1: 142 Tiket, MTTR: 2.45 Jam (Status Prima)"',
        evaluationGuide: 'Periksa penulisan nama sektor agar tidak ada spasi acak seperti "MADIUN _ 1" yang membuat teritori terpecah menjadi kategori ganda.'
      },
      {
        column: 'Kolom D & E',
        fieldName: 'TROUBLE NO & NUMBER',
        note: 'Nomor identifikasi unik tiket gangguan pelanggan',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'Kartu KPI Total Tiket Masuk & Modal Evaluasi Tiket',
        rawDataType: 'Unique Incident String (e.g. "IN1928374", "TR-2026-9901")',
        cleanedDataType: 'Deduplicated Identifier String',
        formula: 'COUNT(DISTINCT row[3] || row[4])',
        transformationLogic: 'Menghitung total volume tiket unik yang masuk ke sistem penanganan gangguan pelanggan selama periode yang dipilih.',
        steps: [
          {
            step: 1,
            title: '1. Ekstraksi Nomor Tiket',
            description: 'Membaca nomor tiket dari row[3] atau fallback ke row[4].',
            codeSnippet: 'const ticketNo = (row[3] || row[4] || "").trim();'
          },
          {
            step: 2,
            title: '2. Deduplikasi Baris Duplikat',
            description: 'Menyimpan ID ke dalam Set untuk memastikan tidak ada tiket yang terhitung ganda.',
            codeSnippet: 'uniqueTickets.add(ticketNo);'
          },
          {
            step: 3,
            title: '3. Penghitungan Total Tiket',
            description: 'Ukuran Set menjadi angka total tiket masuk (incoming tickets).',
            codeSnippet: 'const totalTickets = uniqueTickets.size;'
          },
          {
            step: 4,
            title: '4. Render KPI Utama',
            description: 'Nilai disajikan pada kartu KPI besar "Total Tiket Masuk".',
            codeSnippet: '<StatCard title="Total Tiket" value={totalTickets.toLocaleString()} />'
          }
        ],
        sampleRaw: '"IN1928374"',
        sampleOutput: '"1.240 Tiket Terdaftar"',
        evaluationGuide: 'Jika total tiket drop drastis, periksa apakah ada baris yang kosong pada nomor tiket di Google Sheets.'
      },
      {
        column: 'Kolom J',
        fieldName: 'STATUS',
        note: 'Status penyelesaian ("CLOSED", "RESOLVED", "OPEN")',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'Kartu Tiket Selesai, Backlog Antrean & Rasio Penyelesaian %',
        rawDataType: 'Text Status String ("CLOSED" | "RESOLVED" | "OPEN" | "PROGRESS")',
        cleanedDataType: 'Standardized Status Keyword',
        formula: 'if (status in ["CLOSED", "RESOLVED"]) countResolved++ else countPending++',
        transformationLogic: 'Mengevaluasi apakah penanganan gangguan sudah dinyatakan tuntas oleh teknisi atau masih dalam antrean pengerjaan di lapangan.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Status Tiket',
            description: 'Membaca string status dari kolom ke-10 row[9].',
            codeSnippet: 'const status = (row[9] || "").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Evaluasi Status Tuntas',
            description: 'Mencocokkan kata kunci penutupan tiket ("CLOSED", "RESOLVED", "CLEAR").',
            codeSnippet: 'const isResolved = status === "CLOSED" || status === "RESOLVED";'
          },
          {
            step: 3,
            title: '3. Hitung Rasio Penyelesaian %',
            description: 'Menghitung persentase tiket selesai: (Tiket Selesai / Total Tiket) * 100.',
            codeSnippet: 'const resolutionRate = (resolvedCount / totalCount) * 100;'
          },
          {
            step: 4,
            title: '4. Tampilan di Dashboard',
            description: 'Ditampilkan pada kartu "Tiket Selesai" dan bilah progres penyelesaian antrean.',
            codeSnippet: '<Progress value={resolutionRate} label={`${resolutionRate.toFixed(1)}%`} />'
          }
        ],
        sampleRaw: '"CLOSED"',
        sampleOutput: '"94.2% Tiket Selesai (1.168 / 1.240)"',
        evaluationGuide: 'Pastikan teknisi segera mengupdate status tiket menjadi CLOSED ketika perbaikan selesai agar tidak tercatat sebagai backlog tertunggak.'
      },
      {
        column: 'Kolom K & L',
        fieldName: 'TTR & RAW TTR',
        note: 'Time To Resolution dalam hitungan jam & raw format eksponensial',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'Kartu KPI MTTR Rata-rata (Jam) & % SLA Compliance (< 3 Jam)',
        rawDataType: 'Float / Scientific Exponential String (e.g. "2.45", "2.45E+00")',
        cleanedDataType: 'Float Jam Desimal (e.g. 2.45)',
        formula: 'AVERAGE(TTR) & (COUNT(TTR <= 3.0 Jam) / Total Resolved) * 100',
        transformationLogic: 'Mengonversi durasi waktu perbaikan (TTR) ke dalam jam desimal, menyaring outlier anomali, lalu menghitung rata-rata MTTR serta persentase tiket yang selesai di bawah batas toleransi SLA 3 Jam.',
        steps: [
          {
            step: 1,
            title: '1. Parsing Durasi Waktu Jam',
            description: 'Membaca row[10] atau row[11], mengonversi format teks eksponensial menjadi float.',
            codeSnippet: 'const rawTtr = parseFloat(row[10] || row[11]) || 0;'
          },
          {
            step: 2,
            title: '2. Pembersihan Outlier Anomali',
            description: 'Membuang nilai negatif atau waktu ekstrem tidak wajar (> 720 jam).',
            codeSnippet: 'if (rawTtr < 0 || rawTtr > 720) return; // skip outlier'
          },
          {
            step: 3,
            title: '3. Perhitungan MTTR & Kepatuhan SLA',
            description: 'Menghitung rata-rata jam dan mengecek apakah TTR <= 3.0 jam untuk memenuhi target SLA.',
            codeSnippet: 'if (rawTtr <= 3.0) countSlaMet++;'
          },
          {
            step: 4,
            title: '4. Render Indikator Warna di Dashboard',
            description: 'Menyajikan nilai MTTR (warna hijau jika < 3.0 jam) dan meter kepatuhan SLA.',
            codeSnippet: '<StatCard title="MTTR" value={`${avgMTTR.toFixed(2)} Jam`} status={avgMTTR < 3 ? "good" : "bad"} />'
          }
        ],
        sampleRaw: '"2.45E+00"',
        sampleOutput: '"MTTR: 2.65 Jam | SLA Compliance: 91.8% (Sesuai Target)"',
        evaluationGuide: 'Jika MTTR melonjak di atas 10 jam, periksa apakah ada tiket terbengkalai berbulan-bulan yang baru saja ditutup di sistem.'
      },
      {
        column: 'Kolom P',
        fieldName: 'STO',
        note: 'Sentral Telepon Otomat induk (MNZ, CRB, SLG, dll)',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'STO Heatmap, Pemetaan Distribusi Beban Gangguan Sentral',
        rawDataType: 'Text 3-Letter STO Code (e.g. "MNZ", "CRB", "SLG")',
        cleanedDataType: 'Standardized 3-Character Uppercase Code',
        formula: 'groupBy(row[15]) -> hitung kepadatan insiden per sentral STO',
        transformationLogic: 'Memetakan gangguan ke sentral telepon induk (e.g. MNZ = Madiun Kota, CRB = Caruban, SLG = Saradan) untuk mendeteksi potensi masalah infrastruktur optik lokal.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Kode STO',
            description: 'Mengekstrak kode sentral dari row[15].',
            codeSnippet: 'const sto = (row[15] || "UNK").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Pengelompokan Frekuensi Gangguan',
            description: 'Menghitung kepadatan insiden dan rata-rata TTR per STO.',
            codeSnippet: 'stoFrequency[sto] = (stoFrequency[sto] || 0) + 1;'
          },
          {
            step: 3,
            title: '3. Penentuan Tingkat Kritis (Color Scale)',
            description: 'Memberikan klasifikasi Hijau (Aman), Kuning (Waspada), atau Merah (Kritis).',
            codeSnippet: 'const level = count > 50 ? "danger" : count > 20 ? "warning" : "normal";'
          },
          {
            step: 4,
            title: '4. Visualisasi STO Heatmap Grid',
            description: 'Menampilkan badge sentral dengan warna gradasi panas sesuai tingkat insiden.',
            codeSnippet: '<STOBadge sto={sto} count={count} level={level} />'
          }
        ],
        sampleRaw: '"MNZ"',
        sampleOutput: '"STO MNZ: 38 Tiket (Tingkat Waspada: Hijau / Aman)"',
        evaluationGuide: 'Pastikan kode STO sesuai dengan singkatan resmi 3 huruf agar tidak tercecer menjadi STO anonim.'
      },
      {
        column: 'Kolom T',
        fieldName: 'FLAG HVC',
        note: 'Klasifikasi pelanggan prioritas (DIAMOND, PLATINUM, GOLD, REGULER)',
        targetPage: 'Performansi Jaringan & Assurance',
        targetComponent: 'Panel Pelanggan Prioritas HVC & Metrik SLA Diamond/Platinum',
        rawDataType: 'Tier Text String ("DIAMOND" | "PLATINUM" | "GOLD" | "REGULER")',
        cleanedDataType: 'Standardized Tier String',
        formula: 'filter(row[19] in ["DIAMOND", "PLATINUM", "GOLD"]) -> prioritaskan penanganan',
        transformationLogic: 'Menyaring pelanggan High Value Customer (HVC) yang memiliki prioritas penanganan tercepat dengan komitmen pemulihan di bawah 1.5 jam.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Klasifikasi Pelanggan',
            description: 'Membaca flag status dari kolom ke-20 row[19].',
            codeSnippet: 'const flagHvc = (row[19] || "REGULER").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Deteksi Pelanggan VIP',
            description: 'Memeriksa apakah pelanggan termasuk tier Diamond, Platinum, atau Gold.',
            codeSnippet: 'const isHvc = ["DIAMOND", "PLATINUM", "GOLD"].includes(flagHvc);'
          },
          {
            step: 3,
            title: '3. Penghitungan Metrik SLA Khusus HVC',
            description: 'Menghitung MTTR terpisah khusus segmen pelanggan bernilai tinggi.',
            codeSnippet: 'if (isHvc) hvcTickets.push(ticket);'
          },
          {
            step: 4,
            title: '4. Tampilan Badge Prioritas di UI',
            description: 'Menyajikan kartu metrik HVC dan badge warna emas pada tabel tiket.',
            codeSnippet: '<span className="bg-amber-100 text-amber-800">HVC DIAMOND</span>'
          }
        ],
        sampleRaw: '"DIAMOND"',
        sampleOutput: '"HVC DIAMOND: 100% SLA Tercapai (MTTR: 1.8 Jam)"',
        evaluationGuide: 'Pastikan tiket dari pelanggan HVC selalu termonitor dengan ketat agar tidak menimbulkan keluhan eskalasi pimpinan.'
      },
      {
        column: 'Kolom AR',
        fieldName: 'CLOSED BY',
        note: 'Nama teknisi / petugas yang menutup tiket',
        targetPage: 'Performansi Jaringan & Performansi Teknisi',
        targetComponent: 'Leaderboard Teknisi & Atribusi Tiket Terselesaikan',
        rawDataType: 'Text String Nama Personil / NIK',
        cleanedDataType: 'Clean Person Name String',
        formula: 'groupBy(row[43]) -> tambahkan +1 ke produktivitas tiket teknisi terkait',
        transformationLogic: 'Menghubungkan tiket yang telah tuntas dengan teknisi pelaksana di lapangan untuk dasar perhitungan insentif dan peringkat performansi.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Nama Petugas Penutup',
            description: 'Mengekstrak nama teknisi dari kolom ke-44 row[43].',
            codeSnippet: 'const closedBy = (row[43] || "NOC/Dispatcher").trim();'
          },
          {
            step: 2,
            title: '2. Pencocokan dengan Master Teknisi',
            description: 'Mencocokkan nama teknisi dengan database armada lapangan.',
            codeSnippet: 'const matchedTech = technicians.find(t => t.name.includes(closedBy));'
          },
          {
            step: 3,
            title: '3. Akumulasi Poin Produktivitas',
            description: 'Menambahkan skor poin penyelesaian tiket ke profil teknisi.',
            codeSnippet: 'if (matchedTech) matchedTech.completedTickets += 1;'
          },
          {
            step: 4,
            title: '4. Render Peringkat Teknisi',
            description: 'Data tampil pada tabel papan peringkat (leaderboard) di halaman Teknisi.',
            codeSnippet: '<td>{tech.name}</td><td>{tech.completedTickets} Tiket</td>'
          }
        ],
        sampleRaw: '"Budi Santoso"',
        sampleOutput: '"Budi Santoso: 28 Tiket Terselesaikan Bulan Ini"',
        evaluationGuide: 'Pastikan nama teknisi ditulis lengkap atau menyertakan NIK agar tidak terjadi salah penugasan poin ke teknisi lain.'
      }
    ]
  },
  {
    id: 'src-provisioning-master',
    title: 'Master Endstate - Pasang Baru IndiHome & PDA',
    module: 'PROVISIONING',
    moduleLabel: 'Performansi Provisioning',
    spreadsheetId: '1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw',
    sheetName: 'Master Endstate',
    gid: '0',
    editUrl: 'https://docs.google.com/spreadsheets/d/1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw/edit#gid=0',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw/gviz/tq?tqx=out:csv&sheet=Master%20Endstate',
    description: 'Data utama progres aktivasi dan pasang baru (PSB) IndiHome residensial dan PDA, status Kpro, durasi lead time, serta titik koordinat GPS realisasi.',
    updateFrequency: 'Harian / Real-time Live Sync',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Kolom A',
        fieldName: 'ORDER ID',
        note: 'Nomor transaksi order pemasangan baru pelanggan',
        targetPage: 'Performansi Provisioning (IndiHome & PDA)',
        targetComponent: 'Kartu KPI Total Order Masuk & Tabel Log Transaksi Order',
        rawDataType: 'Unique Transaction String (e.g. "SC102938475")',
        cleanedDataType: 'Clean Order Identifier String',
        formula: 'COUNT(DISTINCT row[0])',
        transformationLogic: 'Menghitung seluruh volume registrasi pasang baru yang masuk dari seluruh kanal penjualan (MyIndiHome, Sales Force, Plasa Telkom).',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Order ID',
            description: 'Mengekstrak nomor order pemasangan dari row[0].',
            codeSnippet: 'const orderId = (row[0] || "").trim();'
          },
          {
            step: 2,
            title: '2. Penghitungan Jumlah Pesanan',
            description: 'Menghitung total pesanan masuk sebagai dasar perhitungan tingkat keberhasilan aktivasi.',
            codeSnippet: 'totalOrderPsb++;'
          },
          {
            step: 3,
            title: '3. Penyajian di Dashboard',
            description: 'Menampilkan angka total permintaan instalasi baru pada kartu metrik utama.',
            codeSnippet: '<StatCard title="Total Order PSB" value={totalOrderPsb} />'
          }
        ],
        sampleRaw: '"SC102938475"',
        sampleOutput: '"Total Order PSB: 850 Pesanan Masuk"',
        evaluationGuide: 'Pastikan tidak ada baris order kosong atau duplikasi nomor pesanan dalam satu periode pelaporan.'
      },
      {
        column: 'Kolom E',
        fieldName: 'STATUS KPRO',
        note: 'Status progres (PSB COMPLETED, PS, FALLOUT, CANCEL)',
        targetPage: 'Performansi Provisioning (IndiHome & PDA)',
        targetComponent: 'Kartu KPI PSB Actual, Rasio Aktivasi %, Status Fallout Kendala',
        rawDataType: 'Text Status String ("PSB COMPLETED" | "PS" | "FALLOUT" | "CANCEL")',
        cleanedDataType: 'Standardized Kpro Status String',
        formula: '(COUNT(Status in ["PSB COMPLETED", "PS"]) / Total Order) * 100',
        transformationLogic: 'Mengevaluasi status akhir pengerjaan instalasi kabel drop optik dan modem ONT di rumah pelanggan. Status "PSB COMPLETED" menandakan layanan telah on-air aktif.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Status Kpro',
            description: 'Mengambil string status dari kolom ke-5 row[4].',
            codeSnippet: 'const statusKpro = (row[4] || "").trim().toUpperCase();'
          },
          {
            step: 2,
            title: '2. Klasifikasi Keberhasilan Aktivasi',
            description: 'Order dengan status "PSB COMPLETED" atau "PS" dihitung sebagai realisasi sukses (PSB Actual).',
            codeSnippet: 'const isCompleted = statusKpro.includes("COMPLETED") || statusKpro === "PS";'
          },
          {
            step: 3,
            title: '3. Hitung Tingkat Keberhasilan (Activation Rate)',
            description: 'Menghitung persentase aktivasi: (PSB Actual / Total Order) * 100.',
            codeSnippet: 'const activationRate = (psbActual / totalOrders) * 100;'
          },
          {
            step: 4,
            title: '4. Render Kartu KPI Utama',
            description: 'Menampilkan angka realisasi pasang baru dan diagram rasio keberhasilan instalasi.',
            codeSnippet: '<StatCard title="PSB Actual" value={psbActual} progress={activationRate} />'
          }
        ],
        sampleRaw: '"PSB COMPLETED"',
        sampleOutput: '"PSB Actual: 795 Pemasangan (Tingkat Aktivasi: 93.5%)"',
        evaluationGuide: 'Jika angka PSB Actual terlihat rendah, cek kolom status untuk order berstatus FALLOUT (kendala ODP penuh atau izin).'
      },
      {
        column: 'Kolom F',
        fieldName: 'LEAD TIME (HARI)',
        note: 'Durasi waktu dari order masuk hingga on-air terpasang',
        targetPage: 'Performansi Provisioning (IndiHome & PDA)',
        targetComponent: 'Kartu KPI Rata-rata Lead Time Penyediaan (Hari) & Kepatuhan SLA Pasang Baru',
        rawDataType: 'Float / Numeric String (e.g. "2.1", "1.8")',
        cleanedDataType: 'Float Hari Desimal (e.g. 2.1)',
        formula: 'AVERAGE(parseFloat(row[5])) (Batas Standar: < 3.0 Hari)',
        transformationLogic: 'Menghitung rata-rata hari yang dibutuhkan dari saat pelanggan registrasi hingga internet aktif online di tempat pelanggan.',
        steps: [
          {
            step: 1,
            title: '1. Parsing Nilai Hari Lead Time',
            description: 'Mengekstrak angka desimal durasi hari dari row[5].',
            codeSnippet: 'const leadTimeDays = parseFloat(row[5]) || 0;'
          },
          {
            step: 2,
            title: '2. Akumulasi Rata-rata Durasi',
            description: 'Menjumlahkan durasi seluruh order yang selesai dan membaginya dengan jumlah order.',
            codeSnippet: 'totalLeadTime += leadTimeDays;'
          },
          {
            step: 3,
            title: '3. Komparasi Target SLA',
            description: 'Memeriksa apakah rata-rata lead time memenuhi batas target maksimal 3 hari kerja.',
            codeSnippet: 'const avgLeadTime = totalLeadTime / completedCount;'
          },
          {
            step: 4,
            title: '4. Tampilan di Dashboard',
            description: 'Ditampilkan pada kartu indikator Lead Time dengan warna hijau jika durasi <= 3 hari.',
            codeSnippet: '<StatCard title="Lead Time" value={`${avgLeadTime.toFixed(1)} Hari`} />'
          }
        ],
        sampleRaw: '"2.1"',
        sampleOutput: '"Lead Time: 2.1 Hari (Kategori: Memenuhi SLA Prima)"',
        evaluationGuide: 'Pastikan penulisan tanggal order dan tanggal selesai konsisten agar nilai lead time tidak menjadi negatif atau bernilai anomali ratusan hari.'
      },
      {
        column: 'Kolom G & H',
        fieldName: 'LATITUDE & LONGITUDE',
        note: 'Koordinat geografis peta sebaran pemasangan',
        targetPage: 'Performansi Provisioning (Sub-Halaman: Peta Sebaran Koordinat Realisasi)',
        targetComponent: 'Peta Geospasial Interaktif Leaflet & Marker Sebaran PSB',
        rawDataType: 'Float GPS Coordinate Strings (e.g. "-7.6298", "111.5239")',
        cleanedDataType: 'Pair [Lat, Lng] Numbers',
        formula: 'PlotMarker([parseFloat(row[6]), parseFloat(row[7])])',
        transformationLogic: 'Mengonversi koordinat Latitude dan Longitude pelanggan menjadi pin lokasi interaktif pada peta Leaflet untuk visualisasi densitas penetrasi jaringan di wilayah kerja.',
        steps: [
          {
            step: 1,
            title: '1. Parsing Koordinat GPS',
            description: 'Mengekstrak latitude dari row[6] dan longitude dari row[7].',
            codeSnippet: 'const lat = parseFloat(row[6]); const lng = parseFloat(row[7]);'
          },
          {
            step: 2,
            title: '2. Validasi Wilayah Geografis Indonesia',
            description: 'Memastikan koordinat berada dalam batas wajar Indonesia (Lat -11 s.d. 6, Long 95 s.d. 141).',
            codeSnippet: 'const isValidGeo = !isNaN(lat) && !isNaN(lng) && lat < 6 && lat > -11;'
          },
          {
            step: 3,
            title: '3. Penempatan Titik Marker di Peta',
            description: 'Membuat marker pin dengan warna sesuai status Kpro (Hijau = Selesai, Merah = Kendala).',
            codeSnippet: '<Marker position={[lat, lng]} icon={customPin} />'
          },
          {
            step: 4,
            title: '4. Pembuatan Popup Interaktif',
            description: 'Menampilkan detail Order ID, nama pelanggan, dan paket saat pin di peta diklik.',
            codeSnippet: '<Popup><div><strong>{orderId}</strong><p>{paket}</p></div></Popup>'
          }
        ],
        sampleRaw: '"-7.6298", "111.5239"',
        sampleOutput: '"Pin Peta Interaktif di Madiun Kota"',
        evaluationGuide: 'Jika ada marker yang berada di tengah laut, cek apakah koordinat Latitude dan Longitude tertukar posisinya di Google Sheets.'
      },
      {
        column: 'Kolom I',
        fieldName: 'TIPE LAYANAN',
        note: 'Paket produk (1P Internet, 2P Net+TV, 3P, PDA)',
        targetPage: 'Performansi Provisioning (IndiHome & PDA)',
        targetComponent: 'Diagram Donut Komposisi Produk Langganan',
        rawDataType: 'Text Product Name String ("1P" | "2P" | "3P" | "PDA")',
        cleanedDataType: 'Standardized Product Category',
        formula: 'groupBy(row[8]) -> hitung persentase bauran produk',
        transformationLogic: 'Mengklasifikasikan ragam paket langganan untuk analisis bauran produk terlaris (Internet Only vs Paket Bundling TV Interaktif).',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Tipe Layanan',
            description: 'Mengekstrak nama paket produk dari row[8].',
            codeSnippet: 'const tipeLayanan = (row[8] || "1P").trim();'
          },
          {
            step: 2,
            title: '2. Agregasi Varian Paket',
            description: 'Menghitung proporsi order untuk paket 1P, 2P, 3P, dan PDA.',
            codeSnippet: 'packageCounts[tipeLayanan] = (packageCounts[tipeLayanan] || 0) + 1;'
          },
          {
            step: 3,
            title: '3. Tampilan Diagram Komposisi',
            description: 'Ditampilkan dalam diagram lingkaran komposisi bauran produk.',
            codeSnippet: '<Pie data={packageData} dataKey="count" nameKey="product" />'
          }
        ],
        sampleRaw: '"2P (Internet + UseeTV)"',
        sampleOutput: '"2P: 52% | 1P: 35% | 3P: 13%"',
        evaluationGuide: 'Gunakan penamaan paket yang baku agar varian produk tidak terpecah menjadi terlalu banyak pecahan kecil di grafik.'
      }
    ]
  },
  {
    id: 'src-provisioning-indibizz',
    title: 'GD INDIBIZZ NEW - Pemasangan Baru Segmen UKM/B2B',
    module: 'PROVISIONING',
    moduleLabel: 'Performansi Provisioning',
    spreadsheetId: '1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw',
    sheetName: 'GD INDIBIZZ NEW',
    gid: '0',
    editUrl: 'https://docs.google.com/spreadsheets/d/1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw/edit#gid=0',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw/gviz/tq?tqx=out:csv&sheet=GD%20INDIBIZZ%20NEW',
    description: 'Data khusus order penyediaan layanan Indibizz bagi sektor usaha kecil menengah (SME/B2B) terintegrasi dengan Master Endstate.',
    updateFrequency: 'Harian / Tergabung dalam sinkronisasi live',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Header Track',
        fieldName: 'TRACK ID INDIBIZZ',
        note: 'ID pelacakan pesanan solusi bisnis',
        targetPage: 'Performansi Provisioning (Segmen UKM / B2B)',
        targetComponent: 'Panel Order Solusi Bisnis & Rasio Pemenuhan UKM',
        rawDataType: 'Unique Business Track String (e.g. "IBZ-2026-0091")',
        cleanedDataType: 'Clean Tracking Code',
        formula: 'COUNT(DISTINCT TrackId) -> agregasi realisasi sambungan bisnis',
        transformationLogic: 'Menyaring pesanan internet bisnis berkecepatan tinggi yang ditujukan untuk gerai, kafe, cabang usaha, dan UMKM di wilayah kerja.',
        steps: [
          {
            step: 1,
            title: '1. Ingesti Sheet Indibizz',
            description: 'Membaca record pesanan dari sheet GD INDIBIZZ NEW.',
            codeSnippet: 'fetch("...sheet=GD INDIBIZZ NEW")'
          },
          {
            step: 2,
            title: '2. Konsolidasi dengan Provisioning Utama',
            description: 'Menggabungkan capaian sambungan bisnis ke dalam total pemenuhan instalasi baru.',
            codeSnippet: 'indibizzOrders.push(row);'
          },
          {
            step: 3,
            title: '3. Tampilan Sub-Panel B2B',
            description: 'Menyajikan performansi khusus penetrasi pasar segmen korporasi dan UKM.',
            codeSnippet: '<StatCard title="Realisasi Indibizz" value={`${b2bCount} Lokasi`} />'
          }
        ],
        sampleRaw: '"IBZ-2026-0091"',
        sampleOutput: '"48 Gerai UKM Terlayani"',
        evaluationGuide: 'Pastikan nomor Track ID Indibizz dicatat lengkap beserta nama perusahaan agar mudah dilacak saat audit.'
      }
    ]
  },
  {
    id: 'src-tech-bot',
    title: 'MIROR BOT MADIUN & Log Dispatcher Real-time Teknisi',
    module: 'TEKNISI',
    moduleLabel: 'Performansi Teknisi',
    spreadsheetId: '1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw',
    sheetName: 'MIROR BOT MADIUN',
    gid: '1971464072',
    editUrl: 'https://docs.google.com/spreadsheets/d/1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw/edit#gid=1971464072',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw/export?format=csv&gid=1971464072',
    description: 'Log live stream aktivitas penugasan teknisi dari bot Telegram/NOC, status work order (/close, /progres), nama teknisi tandem, dan ID tiket.',
    updateFrequency: 'Real-time per event dispatching',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Kolom B',
        fieldName: 'ID WO',
        note: 'Nomor Work Order penugasan lapangan',
        targetPage: 'Performansi Teknisi',
        targetComponent: 'Kartu KPI Total Work Order Lapangan & Log Aktivitas Kerja',
        rawDataType: 'Unique Work Order String (e.g. "WO-MDN-88491")',
        cleanedDataType: 'Clean WO Identifier',
        formula: 'COUNT(DISTINCT row[1])',
        transformationLogic: 'Merekam seluruh tugas pekerjaan fisik yang diterbitkan dispatcher NOC kepada tim teknisi lapangan melalui integrasi bot Telegram.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan ID Work Order',
            description: 'Mengekstrak nomor tiket tugas dari kolom ke-2 row[1].',
            codeSnippet: 'const woId = (row[1] || "").trim();'
          },
          {
            step: 2,
            title: '2. Agregasi Beban Kerja Armada',
            description: 'Menghitung total penugasan yang berjalan untuk mengukur kapasitas kerja harian.',
            codeSnippet: 'totalWorkOrders++;'
          },
          {
            step: 3,
            title: '3. Tampilan di Dashboard Teknisi',
            description: 'Disajikan pada kartu ringkasan "Total Work Order Dikerjakan".',
            codeSnippet: '<StatCard title="Total WO" value={totalWorkOrders} />'
          }
        ],
        sampleRaw: '"WO-MDN-88491"',
        sampleOutput: '"1.450 Work Order Terekam"',
        evaluationGuide: 'Pastikan bot Telegram selalu online dan mencatat setiap pembagian tugas tanpa gangguan server bot.'
      },
      {
        column: 'Kolom C',
        fieldName: 'STATUS',
        note: 'Status pekerjaan (/close = Selesai, /progres = Sedang Dikerjakan)',
        targetPage: 'Performansi Teknisi',
        targetComponent: 'Tingkat Penyelesaian Work Order & Efisiensi Penutupan Tugas',
        rawDataType: 'Command String ("/close" | "/progres" | "/pending")',
        cleanedDataType: 'Standardized Bot Status String',
        formula: '(COUNT(Status == "/close") / Total WO) * 100',
        transformationLogic: 'Mengevaluasi perintah penutupan tugas dari teknisi. Perintah "/close" menandakan pekerjaan telah tuntas dilakukan di rumah pelanggan atau sentral.',
        steps: [
          {
            step: 1,
            title: '1. Pembacaan Status Perintah Bot',
            description: 'Mengambil string status dari kolom ke-3 row[2].',
            codeSnippet: 'const botStatus = (row[2] || "").trim().toLowerCase();'
          },
          {
            step: 2,
            title: '2. Deteksi Penyelesaian Tugas',
            description: 'Memeriksa apakah status diawali dengan "/close".',
            codeSnippet: 'const isClosed = botStatus.includes("/close");'
          },
          {
            step: 3,
            title: '3. Hitung Tingkat Penyelesaian Harian',
            description: 'Menghitung persentase tugas yang diselesaikan tepat waktu.',
            codeSnippet: 'const completionRate = (closedCount / totalCount) * 100;'
          },
          {
            step: 4,
            title: '4. Render Indikator Efisiensi',
            description: 'Ditampilkan pada bilah efisiensi penugasan harian armada.',
            codeSnippet: '<ProgressBar value={completionRate} label="Efisiensi Penutupan WO" />'
          }
        ],
        sampleRaw: '"/close"',
        sampleOutput: '"91.5% WO Tuntas Tepat Waktu"',
        evaluationGuide: 'Ingatkan teknisi untuk segera mengetik perintah /close saat pekerjaan selesai agar pencapaian hariannya tidak tertunda.'
      },
      {
        column: 'Kolom Q & R',
        fieldName: 'TEKNISI 1 & TEKNISI 2',
        note: 'Nama teknisi tandem / pendamping pelaksana pekerjaan',
        targetPage: 'Performansi Teknisi',
        targetComponent: 'Leaderboard Papan Peringkat Teknisi, Rating Bintang & Skor Produktivitas',
        rawDataType: 'Text String Nama Personil Teknisi (e.g. "Agus Setiawan", "Rian Hidayat")',
        cleanedDataType: 'Clean Technician Name Strings',
        formula: 'Agregasi per Nama Teknisi -> hitung WO selesai, MTTR rata-rata & skor bintang',
        transformationLogic: 'Mengatribusikan pekerjaan lapangan kepada personil teknisi terkait (baik teknisi utama maupun rekan tandem) untuk menghitung akumulasi produktivitas individu dan penyusunan papan peringkat.',
        steps: [
          {
            step: 1,
            title: '1. Ekstraksi Nama Personil Lapangan',
            description: 'Membaca nama Teknisi 1 dari row[16] dan Teknisi 2 dari row[17].',
            codeSnippet: 'const tech1 = row[16].trim(); const tech2 = row[17].trim();'
          },
          {
            step: 2,
            title: '2. Pembagian Kredit Tugas Tandem',
            description: 'Menambahkan poin kontribusi kerja secara adil kepada kedua personil yang bertugas.',
            codeSnippet: 'creditTech(tech1, 1.0); if (tech2) creditTech(tech2, 0.8);'
          },
          {
            step: 3,
            title: '3. Perhitungan Skor Gabungan (Weighted Score)',
            description: 'Formula gabungan: (Tiket Selesai * 40%) + (Kecepatan MTTR * 30%) + (Rating Kualitas * 30%).',
            codeSnippet: 'const score = (tickets * 0.4) + (speedScore * 0.3) + (rating * 0.3);'
          },
          {
            step: 4,
            title: '4. Render Papan Peringkat Leaderboard',
            description: 'Menyajikan daftar teknisi dengan peringkat teratas, bintang rating, dan kartu performansi.',
            codeSnippet: '<TechnicianLeaderboardTable technicians={rankedList} />'
          }
        ],
        sampleRaw: '"Agus Setiawan", "Rian Hidayat"',
        sampleOutput: '"Agus Setiawan - Skor 4.9/5.0 (Peringkat 1 Leaderboard)"',
        evaluationGuide: 'Pastikan penulisan nama teknisi konsisten tanpa ejaan berbeda agar poin produktivitas tidak terpecah menjadi dua profil terpisah.'
      }
    ]
  },
  {
    id: 'src-qe-kpi',
    title: 'REKAP ACH KPI - Quality Engineering & K3 Compliance',
    module: 'QE',
    moduleLabel: 'Quality Engineering',
    spreadsheetId: '1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE',
    sheetName: 'REKAP ACH KPI',
    gid: '0',
    range: 'AE3:BI35',
    editUrl: 'https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/edit#gid=0',
    csvUrl: 'https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/export?format=csv&sheet=REKAP%20ACH%20KPI',
    description: 'Rekapitulasi pencapaian Key Performance Indicator (KPI) per Witel, kepatuhan K3 keselamatan kerja, audit patrol, dan skor mutu layanan.',
    updateFrequency: 'Mingguan / Bulanan',
    status: 'ONLINE',
    keyColumns: [
      {
        column: 'Range AE3:BI35',
        fieldName: 'WITEL & METRIKS QE',
        note: 'Madiun, Surabaya, Jakarta, Denpasar, Medan, dll',
        targetPage: 'Performansi QE (Safety & Mutu)',
        targetComponent: 'Skor Mutu Quality Engineering, Kepatuhan K3 & Audit Patrol Feeder',
        rawDataType: 'Table Range Data (Witel Names & Numerical Achievement Percentages)',
        cleanedDataType: 'Structured Witel QE Object with Weighted Scores',
        formula: 'Skor QE = (30% K3) + (30% Mutu Patrol) + (20% Material Audit) + (20% PM)',
        transformationLogic: 'Mengekstrak matriks pencapaian KPI mutu Quality Engineering dari range sel AE3 sampai BI35, mengagregasi kepatuhan keselamatan kerja (K3), dan mutu instalasi kabel optik.',
        steps: [
          {
            step: 1,
            title: '1. Ekstraksi Tabel Range AE3:BI35',
            description: 'Membaca matriks pencapaian witel dari rentang sel spesifik di spreadsheet.',
            codeSnippet: 'const matrixRows = parseRange(csvData, "AE3:BI35");'
          },
          {
            step: 2,
            title: '2. Normalisasi Matriks Indikator',
            description: 'Mengonversi capaian ke skala persentase 0-100% dan memvalidasi bobot pilar mutu.',
            codeSnippet: 'const k3Score = parseFloat(row.k3) || 95; const patrolScore = parseFloat(row.patrol) || 90;'
          },
          {
            step: 3,
            title: '3. Perhitungan Skor Agregat Mutu',
            description: 'Menghitung skor gabungan dengan bobot K3 30%, Mutu 30%, Material 20%, dan PM 20%.',
            codeSnippet: 'const compositeQeScore = (k3Score * 0.3) + (patrolScore * 0.3) + (matScore * 0.2) + (pmScore * 0.2);'
          },
          {
            step: 4,
            title: '4. Render Dashboard QE',
            description: 'Ditampilkan pada kartu Skor Mutu Witel dan radar chart audit kepatuhan.',
            codeSnippet: '<StatCard title="Skor Mutu QE" value={`${compositeQeScore.toFixed(1)} / 100`} />'
          }
        ],
        sampleRaw: '"Madiun: SLA 94.2%, MTTR 2.65, K3 98.5%"',
        sampleOutput: '"Skor Mutu QE: 92.4 / 100 (Kategori: EXCELLENT)"',
        evaluationGuide: 'Pastikan posisi range tabel AE3:BI35 tidak tergeser letak baris atau kolomnya saat mengupdate data rekapitulasi KPI bulanan.'
      }
    ]
  }
];
