import React, { useState, useMemo } from 'react';
import {
  Workflow,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Lock,
  Server,
  Globe,
  FileSpreadsheet,
  Database,
  TrendingUp,
  ShieldCheck,
  Users,
  Search,
  Filter,
  Sparkles,
  Code2,
  Layers,
  FileText,
  LayoutDashboard,
  Shield,
  Activity,
  MapPin,
  HelpCircle,
  Maximize2,
  ChevronRight,
  SlidersHorizontal,
  Compass,
  Check,
  AlertCircle
} from 'lucide-react';
import { IndicatorItem } from './KelolaDataDashboard';
import { VisualFlowChartDiagram, FlowchartCategory } from './VisualFlowChartDiagram';

export type ProcessPhaseId = 
  | 'ALL'
  | 'LOGIN'
  | 'WELCOME'
  | 'BISNIS'
  | 'ASSURANCE'
  | 'PROVISIONING'
  | 'QE'
  | 'TEKNISI'
  | 'KELOLA_DATA';

export type StepNodeType = 'INPUT' | 'PROCESS' | 'DECISION' | 'OUTPUT';

export interface FlowStepNode {
  id: string;
  phaseId: ProcessPhaseId;
  phaseName: string;
  stepNumber: string;
  type: StepNodeType;
  title: string;
  summary: string;
  component: string;
  dataSource: {
    sheetOrService: string;
    columnsOrParams: string;
    endpoint?: string;
  };
  transformationLogic: string;
  codeSnippet?: string;
  outputArtifact: string;
  decisionBranches?: {
    condition: string;
    result: string;
    isPositive?: boolean;
  }[];
  keyRules: string[];
}

export const SYSTEM_PROCESS_STEPS: FlowStepNode[] = [
  // 1. PROSES HALAMAN LOGIN
  {
    id: 'LOGIN-01',
    phaseId: 'LOGIN',
    phaseName: '1. Halaman Login',
    stepNumber: '1.1',
    type: 'INPUT',
    title: 'Pemilihan Mode Otentikasi Pengguna',
    summary: 'Pengguna memilih jalur autentikasi yang sesuai: Tab "Google Sheets" atau Tab "SSO / LDAP".',
    component: 'LoginPage.tsx -> Auth Mode Selector',
    dataSource: {
      sheetOrService: 'Form Login Client',
      columnsOrParams: 'activeTab: "sheets" | "sso", Input User ID & Password'
    },
    transformationLogic: 'State lokal `loginMode` berganti secara reaktif. Input field dibersihkan dan label disesuaikan dengan tipe akun yang dimasukkan.',
    codeSnippet: 'const [authMode, setAuthMode] = useState<"sheets" | "sso">("sheets");',
    outputArtifact: 'Payload Kredensial Siap Diverifikasi',
    keyRules: [
      'Mode Google Sheets: Untuk akun lokal dan administrator cadangan.',
      'Mode SSO / LDAP: Untuk seluruh pegawai dan mitra dengan akun intranet resmi.'
    ]
  },
  {
    id: 'LOGIN-02A',
    phaseId: 'LOGIN',
    phaseName: '1. Halaman Login',
    stepNumber: '1.2A',
    type: 'PROCESS',
    title: 'Verifikasi Mode Google Sheets (Sheet "list user")',
    summary: 'Aplikasi memanggil Google Sheets API untuk mencocokkan User ID dan Password.',
    component: 'src/lib/auth.ts -> fetchUserAccounts()',
    dataSource: {
      sheetOrService: 'Google Sheets [list user]',
      columnsOrParams: 'Kolom A (USER) & Kolom B (PASWORD)',
      endpoint: 'https://docs.google.com/spreadsheets/d/.../gviz/tq?tqx=out:csv&sheet=list%20user'
    },
    transformationLogic: 'Membaca sel CSV GViz. Melakukan sanitasi `row[0].trim().toLowerCase()`. Jika Kolom B kosong, diizinkan direct-login. Jika terisi, mencocokkan password secara exact match.',
    codeSnippet: 'const found = accounts.find(a => a.user.toLowerCase() === inputUser.toLowerCase());\nconst valid = !found.password || found.password === inputPassword;',
    outputArtifact: 'Status Validasi: Sukses / Kredensial Salah',
    keyRules: [
      'Pencocokan username bersifat case-insensitive.',
      'Jika Kolom B di sheet kosong, bypass password aktif untuk fleksibilitas operasional.'
    ]
  },
  {
    id: 'LOGIN-02B',
    phaseId: 'LOGIN',
    phaseName: '1. Halaman Login',
    stepNumber: '1.2B',
    type: 'PROCESS',
    title: 'Verifikasi Mode SSO / LDAP Enterprise Portal',
    summary: 'Frontend mengirim kredensial ke proxy backend untuk diverifikasi secara langsung ke server madiunjuara.com.',
    component: 'src/server/ssoAuthService.ts -> POST /api/auth/ldap',
    dataSource: {
      sheetOrService: 'Portal Enterprise madiunjuara.com',
      columnsOrParams: 'Form URL-encoded: i_userid & i_password',
      endpoint: 'http://madiunjuara.com/ (via server proxy /api/auth/ldap)'
    },
    transformationLogic: 'Backend mengirim POST form urlencoded ke server intranet. Membaca status respon: jika redirect 302 atau tidak ada pesan error "salah memasukan Password", maka valid. Kebijakan Zero-Storage: password tidak pernah disimpan.',
    codeSnippet: 'const res = await verifySsoCredentials(username, password);\n// Zero-credential storage guarantee',
    outputArtifact: 'Token Status SSO: Valid / Gagal Login',
    keyRules: [
      'Kredensial diverifikasi secara binary (berhasil / gagal) tanpa menyimpan password di database manapun.',
      'Menggunakan serverless proxy Express untuk menghindari batasan CORS browser.'
    ]
  },
  {
    id: 'LOGIN-03',
    phaseId: 'LOGIN',
    phaseName: '1. Halaman Login',
    stepNumber: '1.3',
    type: 'DECISION',
    title: 'Evaluasi & Penetapan Role Previlage (OWNER vs USER)',
    summary: 'Sistem memutuskan tingkat hak akses pengguna berdasarkan pencocokan ke Sheet "list user" Kolom C.',
    component: 'App.tsx & LoginPage.tsx -> resolveUserRole()',
    dataSource: {
      sheetOrService: 'Google Sheets [list user]',
      columnsOrParams: 'Kolom C (PREVILAGE)'
    },
    transformationLogic: 'Mengecek apakah User ID terdaftar di sheet "list user". Jika Kolom C == "OWNER", berikan peran OWNER. Jika Kolom C == "USER" atau akun SSO belum didaftarkan di sheet, berikan peran default USER.',
    codeSnippet: 'const isOwner = (account?.previlage || "").trim().toUpperCase() === "OWNER";\nconst role = isOwner ? "OWNER" : "USER";',
    outputArtifact: 'Role Otorisasi: OWNER atau USER',
    decisionBranches: [
      {
        condition: 'Kolom C == "OWNER"',
        result: 'Role OWNER -> Seluruh Dashboard & Tab Kelola Data Dibuka',
        isPositive: true
      },
      {
        condition: 'Kolom C == "USER" / Akun SSO Belum Masuk Sheet',
        result: 'Role USER -> Dashboard Operasional Dibuka, Tab Kelola Data Disembunyikan',
        isPositive: false
      }
    ],
    keyRules: [
      'Status OWNER membuka akses penuh ke panel kontrol spreadsheet, audit formula, dan manajemen user.',
      'Status USER hanya melihat dashboard operasional agar integritas data spreadsheet tetap aman.'
    ]
  },
  {
    id: 'LOGIN-04',
    phaseId: 'LOGIN',
    phaseName: '1. Halaman Login',
    stepNumber: '1.4',
    type: 'OUTPUT',
    title: 'Penerbitan Sesi Pengguna & Transisi Masuk',
    summary: 'Menyimpan identitas dan hak akses ke localStorage, lalu mengalihkan pengguna ke tampilan aplikasi utama.',
    component: 'LoginPage.tsx -> onLoginSuccess()',
    dataSource: {
      sheetOrService: 'Browser LocalStorage / SessionState',
      columnsOrParams: 'telkom_akses_auth_user, telkom_akses_auth_role'
    },
    transformationLogic: 'Menyimpan session token, menghentikan modal login, dan memicu lifecycle `App.tsx` untuk memulai data fetching dashboard.',
    codeSnippet: 'localStorage.setItem("telkom_akses_auth_user", user);\nlocalStorage.setItem("telkom_akses_auth_role", role);\nonLoginSuccess(user, role);',
    outputArtifact: 'Sesi Aktif & Transisi ke Welcome Page',
    keyRules: [
      'Sesi tersimpan aman di browser client.',
      'Pengguna dapat logout kapan saja untuk menghapus token sesi.'
    ]
  },

  // 2. PROSES WELCOME PAGE & INISIALISASI
  {
    id: 'WELCOME-01',
    phaseId: 'WELCOME',
    phaseName: '2. Welcome Page & Inisialisasi',
    stepNumber: '2.1',
    type: 'PROCESS',
    title: 'Inisialisasi Aplikasi & Rendering Brand Bar',
    summary: 'App.tsx membaca sesi login, menyajikan lencana profil pengguna, dan menampilkan badge status hak akses.',
    component: 'App.tsx -> Top Brand Bar Header',
    dataSource: {
      sheetOrService: 'State App Sesi Pengguna',
      columnsOrParams: 'currentUser, currentUserRole'
    },
    transformationLogic: 'Mengevaluasi role pengguna aktif. Jika berstatus OWNER, menampilkan badge emas "OWNER" di samping nama akun di sudut kanan atas brand bar.',
    codeSnippet: '<span className="text-xs font-bold text-slate-800 font-mono">{currentUser}</span>\n{isOwner && <span className="bg-amber-400 text-slate-950 font-black">OWNER</span>}',
    outputArtifact: 'Header Brand Bar Telkom Akses Interaktif',
    keyRules: [
      'Brand bar menyajikan logo resmi Telkom Akses, tanggal real-time, dan status akun.',
      'Menampilkan tombol Keluar / Logout di pojok kanan atas.'
    ]
  },
  {
    id: 'WELCOME-02',
    phaseId: 'WELCOME',
    phaseName: '2. Welcome Page & Inisialisasi',
    stepNumber: '2.2',
    type: 'PROCESS',
    title: 'Penyedotan Paralel 4 Master Google Sheets (GViz Ingestion)',
    summary: 'Sistem secara otomatis mengunduh data live dari 4 Google Sheets terhubung melalui GViz CSV endpoint.',
    component: 'App.tsx -> useGoogleSheetsSync()',
    dataSource: {
      sheetOrService: '4 Google Spreadsheets Master',
      columnsOrParams: 'BC, REKAP TIKET, Master Endstate, REKAP ACH KPI, MIROR BOT MADIUN',
      endpoint: 'GViz API endpoint CSV per sheet GID'
    },
    transformationLogic: 'Menjalankan `Promise.allSettled()` untuk mengambil data dari seluruh sheet secara paralel. Hasil CSV diuraikan ke bentuk array of objects.',
    codeSnippet: 'const results = await Promise.all([\n  fetchGvizCsv(SPREADSHEET_ID, "BC"),\n  fetchGvizCsv(SPREADSHEET_ID, "REKAP TIKET")\n]);',
    outputArtifact: 'Live Operational Data Store (Memory Cache)',
    keyRules: [
      'Jika salah satu sheet offline, aplikasi menggunakan fallback data cache lokal tanpa mengalami crash.',
      'Waktu sinkronisasi terakhir diperbarui secara otomatis di status bar.'
    ]
  },
  {
    id: 'WELCOME-03',
    phaseId: 'WELCOME',
    phaseName: '2. Welcome Page & Inisialisasi',
    stepNumber: '2.3',
    type: 'INPUT',
    title: 'Filter Global Wilayah Kerja (MADIUN vs JATIM)',
    summary: 'Pengguna memilih ruang lingkup teritori operasional yang ingin dianalisis.',
    component: 'App.tsx -> Regional Dropdown Selector',
    dataSource: {
      sheetOrService: 'User Interactive Selection',
      columnsOrParams: 'selectedRegional: "MADIUN" | "JATIM"'
    },
    transformationLogic: 'State global `selectedRegional` diubah. Seluruh modul dashboard yang aktif seketika menghitung ulang formula sesuai filter wilayah.',
    codeSnippet: '<select value={selectedRegional} onChange={e => setSelectedRegional(e.target.value)}>',
    outputArtifact: 'State Filter Teritori Aktif',
    keyRules: [
      'Pilihan teritori mempengaruhi seluruh modul: Bisnis, Assurance, Provisioning, QE, dan Teknisi.',
      'Peralihan filter instan tanpa perlu reload halaman web.'
    ]
  },
  {
    id: 'WELCOME-04',
    phaseId: 'WELCOME',
    phaseName: '2. Welcome Page & Inisialisasi',
    stepNumber: '2.4',
    type: 'DECISION',
    title: 'Otorisasi Visibilitas Tab Menu Navigasi (Route Guard)',
    summary: 'Menentukan apakah tab menu "Kelola Data" dimunculkan atau disembunyikan dari navigasi atas.',
    component: 'App.tsx -> Navigation Tabs Bar',
    dataSource: {
      sheetOrService: 'Role Pengguna Aktif',
      columnsOrParams: 'isOwner = currentUserRole === "OWNER"'
    },
    transformationLogic: 'Jika `isOwner === true`, tab "Kelola Data" dirender tepat di samping tab "Performansi Teknisi". Jika bukan owner, tab tersebut dihilangkan dari DOM.',
    codeSnippet: '{isOwner && (\n  <button id="tab-nav-kelola-data" onClick={() => setActiveTab("kelola-data")}>\n    Kelola Data\n  </button>\n)}',
    outputArtifact: 'Struktur Tab Navigasi Aktif',
    decisionBranches: [
      {
        condition: 'currentUserRole === "OWNER"',
        result: 'Tampilkan 6 Tab: Bisnis, Assurance, Provisioning, QE, Teknisi, & KELOLA DATA',
        isPositive: true
      },
      {
        condition: 'currentUserRole === "USER"',
        result: 'Tampilkan 5 Tab: Bisnis, Assurance, Provisioning, QE, & Teknisi (Kelola Data Disembunyikan)',
        isPositive: false
      }
    ],
    keyRules: [
      'Security guard: Pengguna non-owner yang memaksa URL state kelola-data otomatis dialihkan ke tab bisnis.'
    ]
  },

  // 3. PROSES HALAMAN BISNIS
  {
    id: 'BIZ-01-FLOW',
    phaseId: 'BISNIS',
    phaseName: '3. Halaman Performansi Bisnis',
    stepNumber: '3.1',
    type: 'INPUT',
    title: 'Ekstraksi Data Finansial dari Sheet "BC"',
    summary: 'Membaca dan memilah transaksi pendapatan dan beban biaya langsung.',
    component: 'BusinessDashboard.tsx -> useMemo() parser',
    dataSource: {
      sheetOrService: 'Google Sheets [BC]',
      columnsOrParams: 'Kolom G (Amount), Kolom P (Category: REVENUE / COGS), Kolom A (Bulan)'
    },
    transformationLogic: 'Menyaring baris dengan Kolom P == "REVENUE" untuk omzet dan Kolom P == "COGS" untuk beban pokok penjualan.',
    codeSnippet: 'const revenue = rows.filter(r => r.p === "REVENUE").reduce((acc, r) => acc + parse(r.g), 0);',
    outputArtifact: 'Dataset Finansial Teragregasi (Revenue & COGS)',
    keyRules: [
      'Nilai dalam satuan Miliar Rupiah (IDR M).',
      'Memvalidasi data per bulan kalender untuk analisis tren bulanan.'
    ]
  },
  {
    id: 'BIZ-02-FLOW',
    phaseId: 'BISNIS',
    phaseName: '3. Halaman Performansi Bisnis',
    stepNumber: '3.2',
    type: 'PROCESS',
    title: 'Mesin Kalkulasi Margin, EBITDA & Laba Bersih',
    summary: 'Menghitung indikator efisiensi laba kotor, rasio beban, dan laba operasional.',
    component: 'src/lib/businessMetrics.ts -> calculateFinancials()',
    dataSource: {
      sheetOrService: 'Model Keuangan Telkom Akses',
      columnsOrParams: 'Revenue, COGS, Target Revenue, Target COGS, Opex'
    },
    transformationLogic: 'Gross Profit = Revenue - COGS. Profit Margin = (Gross Profit / Revenue) * 100. EBITDA = Gross Profit - Opex. Net Income = EBITDA - Pajak.',
    codeSnippet: 'const grossProfit = revenue - cogs;\nconst margin = (grossProfit / revenue) * 100;\nconst ebitda = grossProfit - opex;',
    outputArtifact: 'Metrik Finansial: Laba Kotor, Margin %, Rasio COGS %, EBITDA',
    keyRules: [
      'Target Margin kotor perusahaan: minimal 25.0%.',
      'Target COGS ratio: maksimal 75.0% dari pendapatan.'
    ]
  },
  {
    id: 'BIZ-03-FLOW',
    phaseId: 'BISNIS',
    phaseName: '3. Halaman Performansi Bisnis',
    stepNumber: '3.3',
    type: 'OUTPUT',
    title: 'Penyajian Dashboard Finansial & Analisis AI',
    summary: 'Menampilkan kartu KPI omzet, grafik tren bulanan, diagram distribusi portofolio, dan modal evaluasi AI.',
    component: 'BusinessDashboard.tsx -> Recharts & AI Evaluation',
    dataSource: {
      sheetOrService: 'Visual UI Client',
      columnsOrParams: 'KPI Cards, Revenue Area Chart, Margin Gauges'
    },
    transformationLogic: 'Mengonversi metrik numerik menjadi format mata uang IDR Miliar dan merender grafik responsif.',
    codeSnippet: '<ResponsiveContainer><AreaChart data={trendData}>...</AreaChart></ResponsiveContainer>',
    outputArtifact: 'Visual Dashboard Bisnis Interaktif',
    keyRules: [
      'Tersedia tombol Evaluasi AI untuk mendapatkan rekomendasi bisnis berbasis Gemini.',
      'Dukungan ekspor laporan PDF formal untuk jajaran manajemen.'
    ]
  },

  // 4. PROSES HALAMAN ASSURANCE
  {
    id: 'ASR-01-FLOW',
    phaseId: 'ASSURANCE',
    phaseName: '4. Halaman Performansi Assurance',
    stepNumber: '4.1',
    type: 'INPUT',
    title: 'Ingesti Tiket Gangguan dari Sheet "REKAP TIKET"',
    summary: 'Membaca seluruh catatan insiden laporan pelanggan IndiHome dan segmen bisnis.',
    component: 'AssuranceDashboard.tsx -> loadTicketRecords()',
    dataSource: {
      sheetOrService: 'Google Sheets [REKAP TIKET]',
      columnsOrParams: 'Kolom D (Trouble No), Kolom J (Status), Kolom K (TTR), Kolom T (Flag HVC)'
    },
    transformationLogic: 'Memetakan setiap baris menjadi objek tiket terstruktur. Mengelompokkan status menjadi CLOSED (Resolved) dan PENDING (Dalam Penanganan).',
    codeSnippet: 'const isClosed = ["CLOSED", "RESOLVED"].includes(row.status.toUpperCase());',
    outputArtifact: 'Koleksi Tiket Insiden & Gangguan Lapangan',
    keyRules: [
      'Tiket gangguan diupdate secara kontinu oleh dispatcher NOC.',
      'Flag HVC memisahkan pelanggan prioritas Diamond, Platinum, dan Gold.'
    ]
  },
  {
    id: 'ASR-02-FLOW',
    phaseId: 'ASSURANCE',
    phaseName: '4. Halaman Performansi Assurance',
    stepNumber: '4.2',
    type: 'PROCESS',
    title: 'Komputasi SLA Kepatuhan 3 Jam, MTTR & Gangguan Berulang',
    summary: 'Mesin analisis menghitung kecepatan perbaikan rata-rata dan rasio penyelesaian dalam standar batas SLA.',
    component: 'src/lib/assuranceMetrics.ts',
    dataSource: {
      sheetOrService: 'Log Tiket Terverifikasi',
      columnsOrParams: 'TTR Hours, Waktu Open Tiket, Waktu Close Tiket'
    },
    transformationLogic: 'MTTR = SUM(TTR Jam Tiket Closed) / Total Tiket Closed. SLA Rate % = (Tiket Selesai ≤ 3 Jam / Total Tiket Closed) * 100. Repeat Trouble = % pelanggan lapor > 1x dalam 30 hari.',
    codeSnippet: 'const mttr = totalTtrHours / closedTicketsCount;\nconst slaRate = (ticketsUnder3Hours / closedTicketsCount) * 100;',
    outputArtifact: 'Indikator Keandalan: MTTR Jam, SLA % & Repeat Trouble %',
    keyRules: [
      'Standar target MTTR: maksimal 3.0 Jam.',
      'Standar target SLA Compliance: minimal 95.0%.'
    ]
  },
  {
    id: 'ASR-03-FLOW',
    phaseId: 'ASSURANCE',
    phaseName: '4. Halaman Performansi Assurance',
    stepNumber: '4.3',
    type: 'OUTPUT',
    title: 'Visualisasi Ringkasan Tiket & Matriks Solusi Penanganan',
    summary: 'Menyajikan tabel performansi per sektor/STO, distribusi penyebab gangguan, dan evaluasi solusi teknis.',
    component: 'AssuranceDashboard.tsx -> Tabel Performansi Agregasi & Evaluasi Solusi',
    dataSource: {
      sheetOrService: 'Visual UI Client',
      columnsOrParams: 'Tabel Agregasi, Donut Chart Solusi Tiket, Filter Sektor'
    },
    transformationLogic: 'Mengagregasi tiket berdasarkan sektor (Madiun Kota, Caruban, Ngawi, Magetan, Ponorogo, Pacitan) dan kategori solusi teknisi.',
    codeSnippet: '<TicketPerformanceTable data={aggregatedSectors} />',
    outputArtifact: 'Dashboard Assurance: Ringkasan & Agregasi Tiket Lengkap',
    keyRules: [
      'Menampilkan status tiket prioritas pelanggan HVC secara mencolok.',
      'Dukungan drilldown per STO dan per jenis kendala perangkat.'
    ]
  },

  // 5. PROSES HALAMAN PROVISIONING
  {
    id: 'PRV-01-FLOW',
    phaseId: 'PROVISIONING',
    phaseName: '5. Halaman Performansi Provisioning',
    stepNumber: '5.1',
    type: 'INPUT',
    title: 'Ingesti Order Pasang Baru & Koordinat GPS ("Master Endstate")',
    summary: 'Memuat data pesanan instalasi sambungan baru IndiHome dan Indibizz beserta koordinat lokasi rumah pelanggan.',
    component: 'ProvisioningDashboard.tsx & InteractiveCoordinatesMap.tsx',
    dataSource: {
      sheetOrService: 'Google Sheets [Master Endstate] & [GD INDIBIZZ NEW]',
      columnsOrParams: 'Kolom E (Status Kpro), Kolom F (Lead Time), Kolom G (Latitude), Kolom H (Longitude)'
    },
    transformationLogic: 'Membaca status pesanan pada sistem Kpro, durasi hari pemasangan, dan parsing numerik koordinat latitude/longitude valid.',
    codeSnippet: 'const lat = parseFloat(row.latitude);\nconst lng = parseFloat(row.longitude);',
    outputArtifact: 'Dataset Order Pasang Baru & Titik Koordinat GPS',
    keyRules: [
      'Status "PSB COMPLETED" menandakan sambungan internet telah berhasil aktif.',
      'Koordinat digunakan untuk pemetaan geospasial sebaran pelanggan.'
    ]
  },
  {
    id: 'PRV-02-FLOW',
    phaseId: 'PROVISIONING',
    phaseName: '5. Halaman Performansi Provisioning',
    stepNumber: '5.2',
    type: 'PROCESS',
    title: 'Perhitungan Realisasi Pasang Baru, Activation Rate & Lead Time',
    summary: 'Menghitung total instalasi selesai, tingkat keberhasilan aktivasi, backlog pending order, dan angka fallout.',
    component: 'src/lib/provisioningMetrics.ts',
    dataSource: {
      sheetOrService: 'Data Order Kpro',
      columnsOrParams: 'Status Kpro, Tanggal Registrasi, Tanggal On-Air'
    },
    transformationLogic: 'PSB Actual = COUNT(Status == "PSB COMPLETED"). Activation Rate = (PSB Selesai / Total Order) * 100. Lead Time = Rata-rata hari kerja penyelesaian instalasi.',
    codeSnippet: 'const activationRate = (completedOrders / totalOrders) * 100;\nconst leadTime = sumDays / completedOrders;',
    outputArtifact: 'Metrik Provisioning: PSB Actual, Lead Time Hari, % Fallout',
    keyRules: [
      'Target lead time pemasangan baru: maksimal 2.0 hari.',
      'Target activation rate: minimal 92.0% dari pesanan masuk.'
    ]
  },
  {
    id: 'PRV-03-FLOW',
    phaseId: 'PROVISIONING',
    phaseName: '5. Halaman Performansi Provisioning',
    stepNumber: '5.3',
    type: 'OUTPUT',
    title: 'Peta Sebaran Spasial Pelanggan & Detail Order Kpro',
    summary: 'Menampilkan peta interaktif titik rumah pelanggan, grafik tren status Kpro bulanan, dan tabel detail transaksi.',
    component: 'InteractiveCoordinatesMap.tsx & ProvisioningDashboard.tsx',
    dataSource: {
      sheetOrService: 'Leaflet Map Engine & Recharts Bar',
      columnsOrParams: 'Peta Koordinat, Marker Clustering, Filter Status Order'
    },
    transformationLogic: 'Merender peta spasial dengan pin point lokasi pelanggan. Marker dapat diklik untuk melihat No Order, Paket Layanan, dan Tanggal Pasang.',
    codeSnippet: '<InteractiveCoordinatesMap coordinates={customerCoordinates} />',
    outputArtifact: 'Peta Sebaran Koordinat Pelanggan & Trend Order',
    keyRules: [
      'Peta mendukung zoom, pan, dan filter per sektor teritori.',
      'Grafik tren memperlihatkan komparasi order sukses vs kendala fallout.'
    ]
  },

  // 6. PROSES HALAMAN QUALITY ENGINEERING (QE)
  {
    id: 'QE-01-FLOW',
    phaseId: 'QE',
    phaseName: '6. Quality Engineering (QE)',
    stepNumber: '6.1',
    type: 'INPUT',
    title: 'Pembacaan Parameter Mutu dari Sheet "REKAP ACH KPI"',
    summary: 'Mengambil hasil audit kualitas fisik kabel, tiang, ODP, kepatuhan K3 keselamatan kerja, dan jadwal pemeliharaan.',
    component: 'QEDashboard.tsx -> loadQeAuditData()',
    dataSource: {
      sheetOrService: 'Google Sheets [REKAP ACH KPI]',
      columnsOrParams: 'Range Data Evaluasi Sektor, Audit K3, Hasil Uji Material, Log PM'
    },
    transformationLogic: 'Mengekstrak skor kepatuhan patroli rute kabel, jumlah temuan pelanggaran APD, uji kesesuaian material splitter/closure, dan eksekusi PM.',
    codeSnippet: 'const auditScore = parseScoreRange(sheetData["REKAP ACH KPI"]);',
    outputArtifact: 'Dataset Audit Mutu Jaringan & Keselamatan Kerja',
    keyRules: [
      'Audit K3 memiliki toleransi 0 kasus (Zero Violation).',
      'Patroli jaringan wajib mencakup seluruh rute kabel utama (feeder & distribusi).'
    ]
  },
  {
    id: 'QE-02-FLOW',
    phaseId: 'QE',
    phaseName: '6. Quality Engineering (QE)',
    stepNumber: '6.2',
    type: 'PROCESS',
    title: 'Pembobotan Skor Mutu Komprehensif (Overall QE Score)',
    summary: 'Mengombinasikan 4 pilar teknis menjadi satu indeks mutu tunggal dengan rumus bobot resmi.',
    component: 'src/lib/qeMetrics.ts -> computeQeScores()',
    dataSource: {
      sheetOrService: 'Matriks Standar Mutu Telkom Akses',
      columnsOrParams: 'Bobot: Patrol (30%), K3 (30%), Material (20%), PM (20%)'
    },
    transformationLogic: 'Overall QE Score = (0.30 * PatrolCompliance) + (0.30 * K3Compliance) + (0.20 * MaterialConformity) + (0.20 * PmExecutionRate).',
    codeSnippet: 'const overallQE = (0.3 * patrol) + (0.3 * k3) + (0.2 * material) + (0.2 * pm);',
    outputArtifact: 'Skor Indeks Overall QE & Skor Rincian per Segmen',
    keyRules: [
      'Standar target Overall QE Score: minimal 95.0%.',
      'Nilai di bawah benchmark memicu peringatan audit pada sektor terkait.'
    ]
  },
  {
    id: 'QE-03-FLOW',
    phaseId: 'QE',
    phaseName: '6. Quality Engineering (QE)',
    stepNumber: '6.3',
    type: 'OUTPUT',
    title: 'Penyajian Rincian per Segment & Rekapitulasi Mutu',
    summary: 'Menampilkan persentase realisasi segment QE, grafik perbandingan antarsektor, dan detail transaksi temuan audit.',
    component: 'QEDashboard.tsx -> Prosentase & Realisasi Segment QE',
    dataSource: {
      sheetOrService: 'Visual UI Client',
      columnsOrParams: 'Tabel Segment, Grafik Radar/Bar, Log Audit K3'
    },
    transformationLogic: 'Mengonstruksi tabel pencapaian per witel/sektor lengkap dengan status lencana hijau (Lolos) atau merah (Perlu Perbaikan).',
    codeSnippet: '<QESegmentBreakdownTable data={qeSegments} />',
    outputArtifact: 'Dashboard QE: Prosentase & Realisasi Segment',
    keyRules: [
      'Dilengkapi grafik tren mutu per bulan untuk memantau peningkatan keandalan jaringan.',
      'Tabel rincian memuat seluruh temuan log audit lapangan secara transparan.'
    ]
  },

  // 7. PROSES HALAMAN TEKNISI
  {
    id: 'TEK-01-FLOW',
    phaseId: 'TEKNISI',
    phaseName: '7. Performansi Teknisi',
    stepNumber: '7.1',
    type: 'INPUT',
    title: 'Ingesti Data Personil Lapangan dari "MIROR BOT MADIUN"',
    summary: 'Membaca armada personil teknisi aktif, penugasan Work Order harian, dan log bot dispatcher.',
    component: 'TechnicianDashboard.tsx -> loadBotTechnicianLogs()',
    dataSource: {
      sheetOrService: 'Google Sheets [MIROR BOT MADIUN]',
      columnsOrParams: 'Kolom Q (Teknisi 1), Kolom R (Teknisi 2), Kolom C (Status: /close vs /progres)'
    },
    transformationLogic: 'Mengagregasi personil unik dari log bot, memetakan status penugasan tiket dan order yang sedang ditangani personil di lapangan.',
    codeSnippet: 'const techList = Array.from(new Set(rows.map(r => r.teknisi1).filter(Boolean)));',
    outputArtifact: 'Daftar Personil Teknisi Lapangan & Log Penugasan',
    keyRules: [
      'Menghubungkan nama teknisi dengan tiket gangguan assurance dan pemasangan baru.',
      'Mencatat riwayat closing tiket dari pesan bot otomatis.'
    ]
  },
  {
    id: 'TEK-02-FLOW',
    phaseId: 'TEKNISI',
    phaseName: '7. Performansi Teknisi',
    stepNumber: '7.2',
    type: 'PROCESS',
    title: 'Evaluasi Utilisasi Armada & Skor Produktivitas Harian',
    summary: 'Menghitung rasio personil aktif bertugas, rata-rata skor kecepatan penyelesaian, dan rasio ketuntasan WO bot.',
    component: 'src/lib/technicianMetrics.ts',
    dataSource: {
      sheetOrService: 'Log Penyelesaian Kerja',
      columnsOrParams: 'Total Teknisi, Teknisi On-Duty, Jumlah WO /close, Durasi Eksekusi'
    },
    transformationLogic: 'Utilisasi % = (Teknisi On-Duty / Total Teknisi) * 100. Skor Produktivitas = Pembobotan kecepatan dan volume tiket tuntas (skala 1-5). WO Resolution = (/close / Total WO) * 100.',
    codeSnippet: 'const utilization = (activeTechs / totalTechs) * 100;\nconst score = calculateProductivityScore(techLogs);',
    outputArtifact: 'Indikator Personil: % Utilisasi, Skor Produktivitas, WO Closing %',
    keyRules: [
      'Standar target utilisasi teknisi: minimal 85.0% personil siaga.',
      'Standar rata-rata skor produktivitas harian: minimal 4.0 (skala 1-5).'
    ]
  },
  {
    id: 'TEK-03-FLOW',
    phaseId: 'TEKNISI',
    phaseName: '7. Performansi Teknisi',
    stepNumber: '7.3',
    type: 'OUTPUT',
    title: 'Leaderboard Kinerja Personil & Distribusi Teritori',
    summary: 'Menyajikan peringkat teknisi terbaik, sebaran penugasan per sektor, dan tabel detail riwayat pekerjaan personil.',
    component: 'TechnicianDashboard.tsx -> Leaderboard & Dispatch Table',
    dataSource: {
      sheetOrService: 'Visual UI Client',
      columnsOrParams: 'Leaderboard Card, Productivity Rank, Work Order Table'
    },
    transformationLogic: 'Mengurutkan teknisi berdasarkan jumlah tiket diselesaikan dan memberikan lencana medali untuk teknisi dengan performa tertinggi.',
    codeSnippet: '<TechnicianLeaderboard data={rankedTechnicians} />',
    outputArtifact: 'Leaderboard & Rekapitulasi Produktivitas Teknisi',
    keyRules: [
      'Menumbuhkan motivasi dan keadilan evaluasi performa teknisi di lapangan.',
      'Memudahkan supervisor memonitor personil yang sedang menghadapi backlog kendala.'
    ]
  },

  // 8. PROSES HALAMAN KELOLA DATA (OWNER ONLY)
  {
    id: 'OWNER-01-FLOW',
    phaseId: 'KELOLA_DATA',
    phaseName: '8. Halaman Kelola Data (Owner)',
    stepNumber: '8.1',
    type: 'DECISION',
    title: 'Verifikasi Keamanan Wewenang OWNER (Authorization Guard)',
    summary: 'Memeriksa hak istimewa pengguna sebelum mengizinkan render seluruh panel kontrol spreadsheet dan data sensistif.',
    component: 'KelolaDataDashboard.tsx -> Role Security Check',
    dataSource: {
      sheetOrService: 'Sesi Aktif & Google Sheets [list user]',
      columnsOrParams: 'currentUserRole === "OWNER"'
    },
    transformationLogic: 'Jika role bukan OWNER, komponen menampilkan peringatan akses ditolak dan me-redirect pengguna kembali ke tab bisnis. Jika valid, membuka seluruh fitur kelola data.',
    codeSnippet: 'if (currentUserRole !== "OWNER") {\n  return <AccessDeniedBanner />;\n}',
    outputArtifact: 'Izin Akses Penuh Panel Owner Terbuka',
    decisionBranches: [
      {
        condition: 'Role == "OWNER"',
        result: 'Buka Halaman Kelola Data: Daftar Spreadsheet, Inspector User, & Flow Chart',
        isPositive: true
      },
      {
        condition: 'Role != "OWNER"',
        result: 'Akses Ditolak -> Otomatis Redirect ke Tab Bisnis',
        isPositive: false
      }
    ],
    keyRules: [
      'Perlindungan data sensitif perusahaan dari akses yang tidak berwenang.',
      'Hanya akun dengan wewenang OWNER di sheet list user yang dapat masuk.'
    ]
  },
  {
    id: 'OWNER-02-FLOW',
    phaseId: 'KELOLA_DATA',
    phaseName: '8. Halaman Kelola Data (Owner)',
    stepNumber: '8.2',
    type: 'PROCESS',
    title: 'Inspeksi Sumber Spreadsheet Live & Modal Logika Kolom',
    summary: 'Menyajikan direktori 4 spreadsheet master dan 11 tab sheet beserta tombol edit langsung dan audit transformasi data.',
    component: 'KelolaDataDashboard.tsx -> SPREADSHEET_SOURCES & ColumnLogicModal.tsx',
    dataSource: {
      sheetOrService: 'Katalog Metadata Spreadsheet',
      columnsOrParams: 'ID Spreadsheet, Nama Tab Sheet, GID, URL Edit, URL GViz CSV'
    },
    transformationLogic: 'Menyajikan kartu tautan cepat ke Google Sheets asli dan menyediakan modal interaktif "Cek Logika Kolom" yang menjelaskan alur ekstraksi langkah demi langkah.',
    codeSnippet: '<ColumnLogicModal isOpen={isLogicModalOpen} source={selectedSource} />',
    outputArtifact: 'Direktori Tautan Spreadsheet & Modal Logika Kolom',
    keyRules: [
      'Owner dapat membuka spreadsheet resmi hanya dengan 1 klik.',
      'Menyediakan transparansi penuh mengenai asal-usul setiap angka di aplikasi.'
    ]
  },
  {
    id: 'OWNER-03-FLOW',
    phaseId: 'KELOLA_DATA',
    phaseName: '8. Halaman Kelola Data (Owner)',
    stepNumber: '8.3',
    type: 'PROCESS',
    title: 'Manajemen Akun, Logika SSO & Simulator Hak Akses',
    summary: 'Menampilkan tabel akun terdaftar di sheet "list user", penjelasan logika SSO madiunjuara.com, dan simulator role.',
    component: 'KelolaDataDashboard.tsx -> Section 4 (SSO Logic & User Table)',
    dataSource: {
      sheetOrService: 'Sheet [list user] & Portal SSO',
      columnsOrParams: 'Kolom A (USER), Kolom B (PASWORD), Kolom C (PREVILAGE), Simulator ID'
    },
    transformationLogic: 'Menjelaskan mekanisme binary check SSO tanpa simpan password, aturan pencocokan otomatis ke Kolom C untuk menjadi OWNER, dan simulator live evaluator.',
    codeSnippet: 'const isOwner = (user.previlage || "").toUpperCase() === "OWNER";',
    outputArtifact: 'Panel Logika SSO & Tabel Referensi Hak Akses Pengguna',
    keyRules: [
      'Owner dapat dengan mudah mengangkat akun SSO menjadi OWNER hanya dengan mengisi Kolom C di sheet.',
      'Fitur intip password dengan tombol "Lihat Password" yang aman.'
    ]
  },
  {
    id: 'OWNER-04-FLOW',
    phaseId: 'KELOLA_DATA',
    phaseName: '8. Halaman Kelola Data (Owner)',
    stepNumber: '8.4',
    type: 'OUTPUT',
    title: 'Ekspor Kamus Sistem (.JSON) & Audit Analisis AI',
    summary: 'Menyediakan tombol unduh dokumentasi indikator ke file .JSON dan integrasi evaluasi performansi cerdas berbasis AI.',
    component: 'KelolaDataDashboard.tsx -> handleDownloadJSON & AIEvaluationModal',
    dataSource: {
      sheetOrService: 'Kamus Indikator JSON & Gemini AI Engine',
      columnsOrParams: 'Indikator Operasional, Metrik Aktual, API Key AI Studio'
    },
    transformationLogic: 'Mengonversi kamus indikator menjadi file data JSON yang dapat diunduh untuk dokumentasi teknis atau audit eksternal.',
    codeSnippet: 'const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });',
    outputArtifact: 'File JSON Dokumentasi & Laporan Analisis Cerdas AI',
    keyRules: [
      'Mendukung keterbukaan tata kelola data sistem (Data Governance).',
      'Evaluasi AI menyajikan temuan mendalam, anomali data, dan rekomendasi operasional.'
    ]
  }
];

interface SystemProcessFlowChartProps {
  indicators?: IndicatorItem[];
  onInspectIndicatorLogic?: (ind: IndicatorItem) => void;
}

export const SystemProcessFlowChart: React.FC<SystemProcessFlowChartProps> = ({ 
  indicators = [],
  onInspectIndicatorLogic
}) => {
  const [selectedPhase, setSelectedPhase] = useState<ProcessPhaseId>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStepModal, setActiveStepModal] = useState<FlowStepNode | null>(null);
  const [activeTabMode, setActiveTabMode] = useState<'VISUAL' | 'STEPS' | 'DICTIONARY'>('VISUAL');

  const mapPhaseToCategory = (phase: ProcessPhaseId): FlowchartCategory => {
    switch (phase) {
      case 'LOGIN': return 'FLOW_LOGIN';
      case 'WELCOME': return 'FLOW_WELCOME';
      case 'BISNIS':
      case 'ASSURANCE':
      case 'PROVISIONING':
      case 'QE':
      case 'TEKNISI':
        return 'FLOW_BISNIS';
      case 'KELOLA_DATA':
        return 'FLOW_KELOLA_DATA';
      default:
        return 'E2E_SYSTEM';
    }
  };

  // Filter list of steps
  const filteredSteps = useMemo(() => {
    return SYSTEM_PROCESS_STEPS.filter(step => {
      const matchPhase = selectedPhase === 'ALL' || step.phaseId === selectedPhase;
      const matchType = selectedType === 'ALL' || step.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        step.stepNumber.toLowerCase().includes(q) ||
        step.title.toLowerCase().includes(q) ||
        step.summary.toLowerCase().includes(q) ||
        step.component.toLowerCase().includes(q) ||
        step.phaseName.toLowerCase().includes(q) ||
        step.dataSource.sheetOrService.toLowerCase().includes(q) ||
        step.transformationLogic.toLowerCase().includes(q) ||
        step.outputArtifact.toLowerCase().includes(q);

      return matchPhase && matchType && matchSearch;
    });
  }, [selectedPhase, selectedType, searchQuery]);

  // Phase list metadata
  const phaseList: { id: ProcessPhaseId; label: string; icon: any; count: number }[] = [
    { id: 'ALL', label: 'Semua Proses (End-to-End)', icon: Workflow, count: SYSTEM_PROCESS_STEPS.length },
    { id: 'LOGIN', label: '1. Halaman Login (Auth & SSO)', icon: Lock, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'LOGIN').length },
    { id: 'WELCOME', label: '2. Welcome Page & Inisialisasi', icon: LayoutDashboard, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'WELCOME').length },
    { id: 'BISNIS', label: '3. Performansi Bisnis', icon: TrendingUp, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'BISNIS').length },
    { id: 'ASSURANCE', label: '4. Performansi Assurance', icon: Activity, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'ASSURANCE').length },
    { id: 'PROVISIONING', label: '5. Performansi Provisioning', icon: MapPin, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'PROVISIONING').length },
    { id: 'QE', label: '6. Quality Engineering (QE)', icon: ShieldCheck, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'QE').length },
    { id: 'TEKNISI', label: '7. Performansi Teknisi', icon: Users, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'TEKNISI').length },
    { id: 'KELOLA_DATA', label: '8. Halaman Kelola Data (Owner)', icon: Database, count: SYSTEM_PROCESS_STEPS.filter(s => s.phaseId === 'KELOLA_DATA').length }
  ];

  const getTypeBadge = (type: StepNodeType) => {
    switch (type) {
      case 'INPUT':
        return {
          label: 'INPUT DATA',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'PROCESS':
        return {
          label: 'PROSES SISTEM',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'DECISION':
        return {
          label: 'KEPUTUSAN / VALIDASI',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500'
        };
      case 'OUTPUT':
        return {
          label: 'OUTPUT / TAMPILAN',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        };
    }
  };

  return (
    <div className="space-y-6" id="system-process-flowchart-container">
      {/* SECTION HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5">
              <Workflow className="w-3.5 h-3.5" />
              <span>DIAGRAM ALUR PROSES WEB</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              {filteredSteps.length} dari {SYSTEM_PROCESS_STEPS.length} Tahapan Proses
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            Flow Chart & Alur Kerja Sistem Web (Login, Welcome Page, hingga Halaman Utama)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
            Diagram alur komprehensif yang memetakan bagaimana data mengalir dan diproses pada setiap halaman web: mulai dari verifikasi login (Sheets vs SSO), sesi inisialisasi pada Welcome Page, kalkulasi mesin indikator di setiap dashboard operasional, hingga panel pengawasan wewenang Owner.
          </p>
        </div>

        {/* Action / View Mode Switcher */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTabMode('VISUAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTabMode === 'VISUAL'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Workflow className="w-3.5 h-3.5 text-red-600" />
              <span>Diagram Flow Chart (Klasik)</span>
            </button>
            <button
              onClick={() => setActiveTabMode('STEPS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTabMode === 'STEPS'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rincian Teknis ({filteredSteps.length})</span>
            </button>
            <button
              onClick={() => setActiveTabMode('DICTIONARY')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTabMode === 'DICTIONARY'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Kamus Metrik ({indicators.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTabMode === 'VISUAL' && (
        <div className="space-y-4">
          <VisualFlowChartDiagram
            initialCategory={mapPhaseToCategory(selectedPhase)}
            onOpenColumnLogic={() => {
              if (onInspectIndicatorLogic && indicators.length > 0) {
                onInspectIndicatorLogic(indicators[0]);
              }
            }}
          />
        </div>
      )}

      {activeTabMode === 'STEPS' && (
        <>
          {/* SEARCH & SECONDARY TYPE FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tahapan, sheet, formula, atau komponen..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              />
            </div>

            {/* Step Type Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-bold mr-1 flex items-center space-x-1 text-[11px] uppercase tracking-wider">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Tipe Tahap:</span>
              </span>
              {[
                { id: 'ALL', label: 'Semua Tipe' },
                { id: 'INPUT', label: 'Input Data' },
                { id: 'PROCESS', label: 'Proses Sistem' },
                { id: 'DECISION', label: 'Keputusan' },
                { id: 'OUTPUT', label: 'Output UI' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedType === t.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRIMARY PROCESS FILTER PILLS (8 PROCESSES) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              <span>Filter Berdasarkan Halaman / Modul Proses:</span>
              <span className="text-slate-400 font-normal">Klik untuk menyaring diagram alur</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {phaseList.map(phase => {
                const IconComponent = phase.icon;
                const isSelected = selectedPhase === phase.id;
                return (
                  <button
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-500/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span>{phase.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {phase.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FLOW CHART STEP-BY-STEP VISUAL CONTAINER */}
          <div className="space-y-4 pt-2">
            {filteredSteps.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-800">Tidak ada tahapan alur yang sesuai</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Coba ubah kata kunci pencarian atau ganti filter halaman proses untuk melihat diagram alur.
                </p>
                <button
                  onClick={() => {
                    setSelectedPhase('ALL');
                    setSelectedType('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reset Seluruh Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredSteps.map((step, index) => {
                  const badge = getTypeBadge(step.type);
                  return (
                    <div
                      key={step.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all p-5 lg:p-6 space-y-4 relative group"
                    >
                      {/* Step Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-black text-xs inline-flex items-center justify-center">
                            {step.stepNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            {step.phaseName}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-center">
                          {step.component}
                        </div>
                      </div>

                      {/* Main Content Body */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Title & Summary */}
                        <div className="lg:col-span-6 space-y-2">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.summary}
                          </p>

                          {/* Data Source & Target */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                            <div className="flex items-start space-x-2">
                              <Database className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-800">Sumber / Target: </span>
                                <span className="text-slate-600 font-medium">{step.dataSource.sheetOrService}</span>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-800">Parameter / Kolom: </span>
                                <span className="text-slate-600 font-mono text-[11px]">{step.dataSource.columnsOrParams}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Transformation & Output */}
                        <div className="lg:col-span-6 space-y-3">
                          {/* Transformation Logic */}
                          <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              <span className="flex items-center space-x-1">
                                <Code2 className="w-3 h-3 text-cyan-400" />
                                <span>Logika Transformasi Sistem</span>
                              </span>
                              <span className="text-emerald-400 font-bold">Otomatis</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {step.transformationLogic}
                            </p>
                            {step.codeSnippet && (
                              <div className="bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800/80">
                                {step.codeSnippet}
                              </div>
                            )}
                          </div>

                          {/* Decision Branches (if any) */}
                          {step.decisionBranches && step.decisionBranches.length > 0 && (
                            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-2 text-xs">
                              <div className="font-bold text-purple-900 flex items-center space-x-1.5 text-[11px] uppercase tracking-wider">
                                <Shield className="w-3.5 h-3.5 text-purple-600" />
                                <span>Cabang Logika Keputusan:</span>
                              </div>
                              <div className="space-y-1.5">
                                {step.decisionBranches.map((branch, bIdx) => (
                                  <div key={bIdx} className="flex items-start space-x-2 text-[11px]">
                                    <span className={`font-mono font-black text-xs ${branch.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {branch.isPositive ? '✓' : '•'}
                                    </span>
                                    <div>
                                      <strong className="text-slate-800">{branch.condition}: </strong>
                                      <span className="text-slate-600">{branch.result}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Output Result */}
                          <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-xs">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-bold text-emerald-900 text-xs">Output Tahap:</span>
                              <span className="text-emerald-800 font-medium">{step.outputArtifact}</span>
                            </div>
                            <button
                              onClick={() => setActiveStepModal(step)}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-300 transition-colors cursor-pointer"
                            >
                              <span>Detail Lengkap</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Visual Flow Connector between steps */}
                      {index < filteredSteps.length - 1 && (
                        <div className="flex items-center justify-center pt-2">
                          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
                            <div className="h-4 w-px bg-slate-200" />
                            <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Melanjutkan ke tahap berikutnya</span>
                            <div className="h-4 w-px bg-slate-200" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* DICTIONARY VIEW (KAMUS METRIK) */}
      {activeTabMode === 'DICTIONARY' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Kamus Seluruh Indikator & Formula Kalkulasi Otomatis
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan seluruh {indicators.length} indikator performansi operasional yang aktif dihitung oleh mesin sistem.
              </p>
            </div>
            <div className="w-full md:w-64 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama indikator..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-24">Kode</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Indikator & Modul</th>
                  <th className="py-3 px-4 min-w-[200px]">Spreadsheet & Kolom Sumber</th>
                  <th className="py-3 px-4 min-w-[220px]">Formula & Logika Kalkulasi</th>
                  <th className="py-3 px-4 min-w-[140px]">Nilai Terkini</th>
                  <th className="py-3 px-4 min-w-[130px]">Target / Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {indicators
                  .filter(ind => !searchQuery || ind.name.toLowerCase().includes(searchQuery.toLowerCase()) || ind.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(ind => (
                    <tr key={ind.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-red-600 align-top">
                        {ind.code}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="font-bold text-slate-900 block text-xs">{ind.name}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase mt-1 inline-block">
                          {ind.moduleName}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-800">{ind.sourceSheet}</div>
                        {onInspectIndicatorLogic ? (
                          <button
                            type="button"
                            onClick={() => onInspectIndicatorLogic(ind)}
                            className="mt-1 text-left w-full group/btn flex items-center justify-between text-[11px] text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 px-2 py-1 rounded border border-slate-200 hover:border-red-200 font-mono transition-colors cursor-pointer"
                            title="Klik untuk membuka detail alur pipa logika ekstraksi data"
                          >
                            <span className="truncate">{ind.sourceColumns}</span>
                            <ChevronRight className="w-3 h-3 shrink-0 text-slate-400 group-hover/btn:text-red-600 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                          </button>
                        ) : (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{ind.sourceColumns}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top font-mono text-[11px] text-slate-700">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                          {ind.formula}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-xs">
                          {ind.currentValue}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-600 font-semibold">
                        {ind.benchmark}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL STEP MODAL INSPECTOR */}
      {activeStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-red-600 text-white rounded font-mono text-xs font-black">
                    Tahap {activeStepModal.stepNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    {activeStepModal.phaseName}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  {activeStepModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Ringkasan Kerja:</span>
                <p className="text-slate-700 text-sm leading-relaxed">{activeStepModal.summary}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Komponen Berjalan:</span>
                  <span className="text-slate-900 font-mono text-xs font-semibold">{activeStepModal.component}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Sumber Data / Target:</span>
                  <span className="text-slate-900 font-semibold">{activeStepModal.dataSource.sheetOrService}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-500 font-bold block text-[11px]">Formula / Transformasi Mesin:</span>
                <div className="bg-slate-900 text-cyan-300 p-3 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
                  {activeStepModal.transformationLogic}
                  {activeStepModal.codeSnippet && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-slate-300">
                      {activeStepModal.codeSnippet}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-500 font-bold block text-[11px]">Aturan Kunci & Batasan Integritas:</span>
                <div className="space-y-1.5">
                  {activeStepModal.keyRules.map((rule, rIdx) => (
                    <div key={rIdx} className="flex items-start space-x-2 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setActiveStepModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
