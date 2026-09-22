import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  Download,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

export type FlowchartCategory = 
  | 'E2E_SYSTEM'
  | 'FLOW_LOGIN'
  | 'FLOW_WELCOME'
  | 'FLOW_BISNIS'
  | 'FLOW_ASSURANCE'
  | 'FLOW_PROVISIONING'
  | 'FLOW_QE'
  | 'FLOW_TEKNISI'
  | 'FLOW_KELOLA_DATA';

export interface FlowchartLane {
  id: string;
  title: string;
  subtitle?: string;
  x: number;
  width: number;
}

export interface FlowchartElement {
  id: string;
  laneId: string;
  type: 'START' | 'END' | 'PROCESS' | 'DECISION' | 'DOCUMENT' | 'SUBPROCESS';
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  details?: {
    description: string;
    dataSource?: string;
    formulaOrLogic?: string;
    component?: string;
    rule?: string;
  };
}

export interface FlowchartConnection {
  id: string;
  from: string;
  to: string;
  fromSide?: 'bottom' | 'right' | 'left' | 'top';
  toSide?: 'top' | 'left' | 'right' | 'bottom';
  label?: string;
  points?: { x: number; y: number }[]; // custom orthogonal waypoints
  isNegative?: boolean;
}

export interface FlowchartDiagramData {
  id: FlowchartCategory;
  title: string;
  subtitle: string;
  lanes: FlowchartLane[];
  nodes: FlowchartElement[];
  connections: FlowchartConnection[];
  canvasWidth: number;
  canvasHeight: number;
}

// 1. END-TO-END SYSTEM FLOWCHART (SWIMLANE 4 STEPS)
const E2E_FLOWCHART: FlowchartDiagramData = {
  id: 'E2E_SYSTEM',
  title: 'Flow Alur Lengkap Sistem Web (End-to-End)',
  subtitle: 'Dari Halaman Login, Welcome Page, Kalkulasi Dashboard Operasional, hingga Kelola Data Owner',
  canvasWidth: 1370,
  canvasHeight: 820,
  lanes: [
    { id: 'lane-1', title: 'Step 1: Otentikasi Login', subtitle: 'Sheets & SSO Verification', x: 20, width: 320 },
    { id: 'lane-2', title: 'Step 2: Welcome & Ingesti', subtitle: 'GViz Sync & Role Guard', x: 360, width: 320 },
    { id: 'lane-3', title: 'Step 3: Dashboard Operasional', subtitle: 'Formula KPI & Realisasi', x: 700, width: 330 },
    { id: 'lane-4', title: 'Step 4: Kelola Data Owner', subtitle: 'Spreadsheet Control & Audit', x: 1050, width: 300 }
  ],
  nodes: [
    // Step 1: Login
    { id: 'n-start', laneId: 'lane-1', type: 'START', label: 'Start', x: 120, y: 85, width: 120, height: 44, details: { description: 'Pengguna mengakses URL web Performance Control Hub Telkom Akses.', component: 'App.tsx' } },
    { id: 'n-input-login', laneId: 'lane-1', type: 'PROCESS', label: 'Input User ID & Password', sublabel: 'Pilih Tab Sheets / SSO', x: 80, y: 155, width: 200, height: 55, details: { description: 'Pengguna memasukkan username dan password serta memilih tab mode login.', component: 'LoginPage.tsx' } },
    { id: 'n-dec-sso', laneId: 'lane-1', type: 'DECISION', label: 'Mode SSO ?', x: 105, y: 235, width: 150, height: 75, details: { description: 'Pengecekan apakah pengguna menggunakan akun SSO kantor atau akun Google Sheets.', component: 'LoginPage.tsx -> activeTab' } },
    { id: 'n-proc-sheets', laneId: 'lane-1', type: 'PROCESS', label: 'Verifikasi Sheet "list user"', sublabel: 'Kolom A & Kolom B', x: 25, y: 340, width: 145, height: 58, details: { description: 'Mencocokkan User ID di Kolom A dan Password di Kolom B.', dataSource: 'Google Sheets: list user', component: 'auth.ts' } },
    { id: 'n-proc-sso', laneId: 'lane-1', type: 'PROCESS', label: 'Verifikasi Portal SSO', sublabel: 'madiunjuara.com via Proxy', x: 185, y: 340, width: 145, height: 58, details: { description: 'Mengirim kredensial ke madiunjuara.com melalui proxy /api/auth/ldap tanpa menyimpan password.', dataSource: 'http://madiunjuara.com/', component: 'ssoAuthService.ts' } },
    { id: 'n-dec-valid', laneId: 'lane-1', type: 'DECISION', label: 'Kredensial Valid ?', x: 105, y: 430, width: 150, height: 75, details: { description: 'Evaluasi apakah status login berhasil atau ditolak.', component: 'LoginPage.tsx' } },
    { id: 'n-doc-error', laneId: 'lane-1', type: 'DOCUMENT', label: 'Tolak Akses Masuk', sublabel: 'Notifikasi Error Login', x: 25, y: 535, width: 140, height: 52, details: { description: 'Menampilkan pesan peringatan bahwa User ID atau password salah.', component: 'LoginPage.tsx' } },
    { id: 'n-dec-owner', laneId: 'lane-1', type: 'DECISION', label: 'Kolom C == OWNER ?', x: 105, y: 625, width: 150, height: 75, details: { description: 'Mengecek apakah User ID memiliki nilai OWNER di Kolom C sheet list user.', dataSource: 'Sheet list user: Kolom C', component: 'App.tsx' } },

    // Step 2: Welcome & Ingestion
    { id: 'n-set-role', laneId: 'lane-2', type: 'PROCESS', label: 'Tetapkan Role Akun', sublabel: 'Simpan ke LocalStorage', x: 420, y: 85, width: 200, height: 55, details: { description: 'Menyimpan token sesi pengguna dan hak akses ke penyimpanan lokal browser.', component: 'App.tsx -> onLoginSuccess' } },
    { id: 'n-render-welcome', laneId: 'lane-2', type: 'PROCESS', label: 'Render Welcome Page', sublabel: 'Brand Bar & Header Status', x: 420, y: 165, width: 200, height: 55, details: { description: 'Menampilkan nama pengguna, lencana status role, dan waktu sinkronisasi.', component: 'App.tsx Header' } },
    { id: 'n-gviz-sync', laneId: 'lane-2', type: 'PROCESS', label: 'Penyedotan 4 Master Sheets', sublabel: 'Endpoint GViz Live CSV', x: 415, y: 245, width: 210, height: 58, details: { description: 'Mengambil data live dari BC, REKAP TIKET, Master Endstate, REKAP ACH KPI, dan MIROR BOT.', dataSource: 'Google Spreadsheets GViz API', component: 'useGoogleSheetsSync' } },
    { id: 'n-dec-sync', laneId: 'lane-2', type: 'DECISION', label: 'Sync Sukses ?', x: 445, y: 335, width: 150, height: 75, details: { description: 'Pemeriksaan apakah respons HTTP 200 CSV diterima dari seluruh sheet.', component: 'App.tsx' } },
    { id: 'n-doc-cache', laneId: 'lane-2', type: 'DOCUMENT', label: 'Muat Cache Data Lokal', sublabel: 'Offline Fallback', x: 365, y: 435, width: 145, height: 52, details: { description: 'Jika Google Sheets lambat/offline, aplikasi memuat data cadangan lokal tanpa crash.', component: 'App.tsx' } },
    { id: 'n-mem-store', laneId: 'lane-2', type: 'PROCESS', label: 'Simpan ke State Global', sublabel: 'Memory App Store', x: 420, y: 515, width: 200, height: 55, details: { description: 'Data diuraikan menjadi objek terstruktur siap dikonsumsi oleh seluruh dashboard.', component: 'App.tsx' } },
    { id: 'n-dec-guard', laneId: 'lane-2', type: 'DECISION', label: 'Role == OWNER ?', x: 445, y: 625, width: 150, height: 75, details: { description: 'Route Guard: menentukan apakah tab menu "Kelola Data" dimunculkan di navigasi.', component: 'App.tsx -> Tab Navigation' } },

    // Step 3: Dashboard Operasional
    { id: 'n-select-tab', laneId: 'lane-3', type: 'PROCESS', label: 'Pilih Modul Dashboard', sublabel: 'Bisnis / Asr / Prv / QE / Tek', x: 760, y: 85, width: 200, height: 55, details: { description: 'Pengguna memilih tab menu operasional yang ingin dianalisis.', component: 'App.tsx Tab Router' } },
    { id: 'n-filter-region', laneId: 'lane-3', type: 'PROCESS', label: 'Filter Teritori Wilayah', sublabel: 'Madiun vs Jatim Regional', x: 760, y: 165, width: 200, height: 55, details: { description: 'Memilih cakupan wilayah Madiun atau regional Jawa Timur.', component: 'App.tsx -> Dropdown Regional' } },
    { id: 'n-calc-kpi', laneId: 'lane-3', type: 'PROCESS', label: 'Hitung Indikator Otomatis', sublabel: 'SUM / COUNT / Ratio Formula', x: 755, y: 245, width: 210, height: 58, details: { description: 'Menghitung 35+ metrik secara instan dari baris-baris data mentah spreadsheet.', formulaOrLogic: 'Misal: MTTR = SUM(TTR Jam)/Tiket; Gross Profit = Revenue - COGS', component: 'lib/*Metrics.ts' } },
    { id: 'n-dec-benchmark', laneId: 'lane-3', type: 'DECISION', label: 'Capai Target ?', x: 785, y: 335, width: 150, height: 75, details: { description: 'Membandingkan nilai aktual indikator dengan target standar perusahaan.', component: 'Dashboard Components' } },
    { id: 'n-kpi-red', laneId: 'lane-3', type: 'PROCESS', label: 'Di Bawah SLA (Merah)', sublabel: 'Perlu Eskalasi & Alert', x: 705, y: 435, width: 145, height: 52, details: { description: 'Menampilkan peringatan bahwa metrik berada di bawah target SLA/Benchmark.', component: 'KPI Cards' } },
    { id: 'n-kpi-green', laneId: 'lane-3', type: 'PROCESS', label: 'Target Tercapai (Hijau)', sublabel: 'Kinerja Operasional Prima', x: 865, y: 435, width: 145, height: 52, details: { description: 'Menampilkan indikator hijau dengan tren peningkatan.', component: 'KPI Cards' } },
    { id: 'n-render-ui', laneId: 'lane-3', type: 'DOCUMENT', label: 'Visualisasi Grafik & Peta', sublabel: 'Recharts Tren & Titik GPS', x: 755, y: 515, width: 210, height: 55, details: { description: 'Merender grafik tren bulanan, diagram donat, dan peta interaktif koordinat pelanggan.', component: 'Recharts & Leaflet' } },
    { id: 'n-ai-eval', laneId: 'lane-3', type: 'PROCESS', label: 'Evaluasi Rekomendasi AI', sublabel: 'Analisis Cerdas Gemini', x: 760, y: 625, width: 200, height: 55, details: { description: 'Analisis cerdas data operasional dan rekomendasi perbaikan berbasis AI.', component: 'AIEvaluationModal.tsx' } },

    // Step 4: Kelola Data Owner
    { id: 'n-owner-tab', laneId: 'lane-4', type: 'PROCESS', label: 'Buka Tab "Kelola Data"', sublabel: 'Khusus Hak Akses OWNER', x: 1095, y: 85, width: 200, height: 55, details: { description: 'Hanya dapat diakses jika pengguna terverifikasi memiliki role OWNER.', component: 'KelolaDataDashboard.tsx' } },
    { id: 'n-audit-sheets', laneId: 'lane-4', type: 'PROCESS', label: 'Direktori Master Sheets', sublabel: '4 File & 11 Tab GID Live', x: 1095, y: 165, width: 200, height: 55, details: { description: 'Menampilkan tautan resmi ke Google Sheets untuk diedit langsung oleh tim berwenang.', component: 'KelolaDataDashboard -> SPREADSHEET_SOURCES' } },
    { id: 'n-logic-modal', laneId: 'lane-4', type: 'PROCESS', label: 'Inspeksi Modal Logika Kolom', sublabel: 'Audit Transformasi Data', x: 1095, y: 245, width: 200, height: 55, details: { description: 'Menjelaskan asal kolom dan transformasi data setiap baris secara transparan.', component: 'ColumnLogicModal.tsx' } },
    { id: 'n-sso-sim', laneId: 'lane-4', type: 'PROCESS', label: 'Simulator Wewenang Akun', sublabel: 'Tes User ID & Kolom C', x: 1095, y: 325, width: 200, height: 55, details: { description: 'Menguji User ID SSO dan panduan memberikan wewenang OWNER di sheet list user.', component: 'KelolaDataDashboard -> Section 4' } },
    { id: 'n-export-doc', laneId: 'lane-4', type: 'DOCUMENT', label: 'Ekspor Kamus Indikator', sublabel: 'Dokumentasi File .JSON', x: 1095, y: 410, width: 200, height: 55, details: { description: 'Mengunduh kamus indikator dan spesifikasi teknis dalam format data JSON.', component: 'KelolaDataDashboard -> handleDownloadJSON' } },
    { id: 'n-end', laneId: 'lane-4', type: 'END', label: 'End (Selesai)', x: 1130, y: 500, width: 130, height: 44, details: { description: 'Siklus alur aplikasi tuntas secara aman dan terintegrasi.', component: 'System' } }
  ],
  connections: [
    // Step 1
    { id: 'c1', from: 'n-start', to: 'n-input-login' },
    { id: 'c2', from: 'n-input-login', to: 'n-dec-sso' },
    { id: 'c3-sso', from: 'n-dec-sso', to: 'n-proc-sso', fromSide: 'right', toSide: 'top', label: 'SSO' },
    { id: 'c3-sht', from: 'n-dec-sso', to: 'n-proc-sheets', fromSide: 'left', toSide: 'top', label: 'Sheets' },
    { id: 'c4-sso', from: 'n-proc-sso', to: 'n-dec-valid', fromSide: 'bottom', toSide: 'right' },
    { id: 'c4-sht', from: 'n-proc-sheets', to: 'n-dec-valid', fromSide: 'bottom', toSide: 'left' },
    { id: 'c5-fail', from: 'n-dec-valid', to: 'n-doc-error', fromSide: 'left', toSide: 'top', label: 'Gagal', isNegative: true },
    { id: 'c5-pass', from: 'n-dec-valid', to: 'n-dec-owner', fromSide: 'bottom', toSide: 'top', label: 'Valid' },
    { id: 'c6-e2e', from: 'n-dec-owner', to: 'n-set-role', fromSide: 'right', toSide: 'left', label: 'Sesi Login', points: [{ x: 255, y: 662 }, { x: 345, y: 662 }, { x: 345, y: 112 }, { x: 420, y: 112 }] },

    // Step 2
    { id: 'c7', from: 'n-set-role', to: 'n-render-welcome' },
    { id: 'c8', from: 'n-render-welcome', to: 'n-gviz-sync' },
    { id: 'c9', from: 'n-gviz-sync', to: 'n-dec-sync' },
    { id: 'c10-fail', from: 'n-dec-sync', to: 'n-doc-cache', fromSide: 'left', toSide: 'top', label: 'Offline', isNegative: true },
    { id: 'c10-pass', from: 'n-dec-sync', to: 'n-mem-store', fromSide: 'bottom', toSide: 'top', label: 'Online' },
    { id: 'c10-cache-cont', from: 'n-doc-cache', to: 'n-mem-store', fromSide: 'bottom', toSide: 'left' },
    { id: 'c11', from: 'n-mem-store', to: 'n-dec-guard' },
    { id: 'c12-oper', from: 'n-mem-store', to: 'n-select-tab', fromSide: 'right', toSide: 'left', label: 'Data Ready', points: [{ x: 620, y: 542 }, { x: 680, y: 542 }, { x: 680, y: 112 }, { x: 760, y: 112 }] },

    // Step 3
    { id: 'c13', from: 'n-select-tab', to: 'n-filter-region' },
    { id: 'c14', from: 'n-filter-region', to: 'n-calc-kpi' },
    { id: 'c15', from: 'n-calc-kpi', to: 'n-dec-benchmark' },
    { id: 'c16-green', from: 'n-dec-benchmark', to: 'n-kpi-green', fromSide: 'right', toSide: 'top', label: 'Tercapai' },
    { id: 'c16-red', from: 'n-dec-benchmark', to: 'n-kpi-red', fromSide: 'left', toSide: 'top', label: 'Under SLA', isNegative: true },
    { id: 'c17-g', from: 'n-kpi-green', to: 'n-render-ui', fromSide: 'bottom', toSide: 'right' },
    { id: 'c17-r', from: 'n-kpi-red', to: 'n-render-ui', fromSide: 'bottom', toSide: 'left' },
    { id: 'c18', from: 'n-render-ui', to: 'n-ai-eval' },

    // Step 4
    { id: 'c19-guard', from: 'n-dec-guard', to: 'n-owner-tab', fromSide: 'right', toSide: 'left', label: 'Role OWNER', points: [{ x: 595, y: 662 }, { x: 1025, y: 662 }, { x: 1025, y: 112 }, { x: 1095, y: 112 }] },
    { id: 'c20', from: 'n-owner-tab', to: 'n-audit-sheets' },
    { id: 'c21', from: 'n-audit-sheets', to: 'n-logic-modal' },
    { id: 'c22', from: 'n-logic-modal', to: 'n-sso-sim' },
    { id: 'c23', from: 'n-sso-sim', to: 'n-export-doc' },
    { id: 'c24', from: 'n-export-doc', to: 'n-end' }
  ]
};

// 2. DETAILED FLOWCHARTS FOR INDIVIDUAL PROCESSES
const LOGIN_PROCESS_FLOWCHART: FlowchartDiagramData = {
  id: 'FLOW_LOGIN',
  title: 'Flow Eksekusi Otentikasi & Otorisasi Akun (Login & SSO)',
  subtitle: 'Diagram Alur Verifikasi Google Sheets vs Enterprise SSO/LDAP serta Penentuan Hak Akses OWNER',
  canvasWidth: 1060,
  canvasHeight: 700,
  lanes: [
    { id: 'lane-1', title: 'Step 1: Input Kredensial', subtitle: 'Form Login Client', x: 20, width: 330 },
    { id: 'lane-2', title: 'Step 2: Engine Verifikasi', subtitle: 'Sheets vs SSO LDAP', x: 370, width: 340 },
    { id: 'lane-3', title: 'Step 3: Resolusi Previlage & Sesi', subtitle: 'OWNER vs USER', x: 730, width: 310 }
  ],
  nodes: [
    // Step 1
    { id: 'n-start', laneId: 'lane-1', type: 'START', label: 'Start', x: 125, y: 60, width: 120, height: 44, details: { description: 'Pengguna membuka web app.' } },
    { id: 'n-form-input', laneId: 'lane-1', type: 'PROCESS', label: 'Input User ID & Password', sublabel: 'Form Login Client UI', x: 85, y: 135, width: 200, height: 55, details: { description: 'Form input di halaman login.' } },
    { id: 'n-dec-mode', laneId: 'lane-1', type: 'DECISION', label: 'Pilih SSO ?', x: 115, y: 220, width: 140, height: 75, details: { description: 'Menentukan mode autentikasi yang dipilih pengguna.' } },
    { id: 'n-route-sheet', laneId: 'lane-1', type: 'PROCESS', label: 'Jalur Google Sheets', sublabel: 'Sheet "list user"', x: 30, y: 325, width: 140, height: 55, details: { description: 'Memilih verifikasi ke spreadsheet lokal.' } },
    { id: 'n-route-sso', laneId: 'lane-1', type: 'PROCESS', label: 'Jalur SSO Enterprise', sublabel: 'madiunjuara.com', x: 190, y: 325, width: 140, height: 55, details: { description: 'Memilih verifikasi ke server intranet kantor.' } },
    { id: 'n-doc-login-cancel', laneId: 'lane-1', type: 'DOCUMENT', label: 'Akses Ditolak', sublabel: 'Notifikasi Error Login', x: 85, y: 480, width: 200, height: 50, details: { description: 'Pesan kesalahan username atau password tidak cocok.' } },

    // Step 2
    { id: 'n-exec-sheet', laneId: 'lane-2', type: 'PROCESS', label: 'Baca Sheet "list user"', sublabel: 'Kolom A (User) & B (Pass)', x: 440, y: 135, width: 200, height: 55, details: { description: 'Cek baris Google Sheet list user.' } },
    { id: 'n-exec-ldap', laneId: 'lane-2', type: 'PROCESS', label: 'Proxy POST /api/auth/ldap', sublabel: 'Target: madiunjuara.com', x: 440, y: 220, width: 200, height: 55, details: { description: 'Kirim i_userid dan i_password via proxy Express backend.' } },
    { id: 'n-dec-sso-res', laneId: 'lane-2', type: 'DECISION', label: 'SSO Sukses ?', sublabel: 'HTTP 302 / 200 OK', x: 470, y: 310, width: 140, height: 75, details: { description: 'Mengecek respon HTTP dari portal madiunjuara.com.' } },
    { id: 'n-dec-sheet-res', laneId: 'lane-2', type: 'DECISION', label: 'Password Cocok ?', sublabel: 'Validasi Kolom B', x: 470, y: 420, width: 140, height: 75, details: { description: 'Validasi exact match password atau bypass jika kosong.' } },

    // Step 3
    { id: 'n-check-owner-sheet', laneId: 'lane-3', type: 'DECISION', label: 'Kolom C == OWNER ?', sublabel: 'Cek Sheet list user', x: 815, y: 135, width: 140, height: 75, details: { description: 'Mengecek nilai Kolom C untuk User ID yang login.' } },
    { id: 'n-set-owner', laneId: 'lane-3', type: 'PROCESS', label: 'Berikan Role OWNER', sublabel: 'Akses Penuh Kelola Data', x: 785, y: 245, width: 200, height: 55, details: { description: 'Akun mendapatkan izin mengakses halaman Kelola Data.' } },
    { id: 'n-set-user', laneId: 'lane-3', type: 'PROCESS', label: 'Berikan Role USER', sublabel: 'Dashboard Saja (Modul Biasa)', x: 785, y: 335, width: 200, height: 55, details: { description: 'Akun hanya dapat membuka modul operasional biasa.' } },
    { id: 'n-save-session', laneId: 'lane-3', type: 'DOCUMENT', label: 'Simpan LocalStorage Sesi', sublabel: 'telkom_akses_auth_user', x: 785, y: 425, width: 200, height: 50, details: { description: 'Sesi tersimpan dan pengguna dialihkan ke Welcome Page.' } },
    { id: 'n-end', laneId: 'lane-3', type: 'END', label: 'End (Login Sukses)', x: 825, y: 515, width: 120, height: 44, details: { description: 'Sesi aktif di browser.' } }
  ],
  connections: [
    { id: 'cl1', from: 'n-start', to: 'n-form-input' },
    { id: 'cl2', from: 'n-form-input', to: 'n-dec-mode' },
    { id: 'cl3-sht', from: 'n-dec-mode', to: 'n-route-sheet', fromSide: 'left', toSide: 'top', label: 'Sheets' },
    { id: 'cl3-sso', from: 'n-dec-mode', to: 'n-route-sso', fromSide: 'right', toSide: 'top', label: 'SSO' },
    
    { id: 'cl4-sht', from: 'n-route-sheet', to: 'n-exec-sheet', fromSide: 'right', toSide: 'left' },
    { id: 'cl4-sso', from: 'n-route-sso', to: 'n-exec-ldap', fromSide: 'right', toSide: 'left' },

    { id: 'cl5-sso', from: 'n-exec-ldap', to: 'n-dec-sso-res' },
    { id: 'cl5-sht', from: 'n-exec-sheet', to: 'n-dec-sheet-res' },

    { id: 'cl6-sso-fail', from: 'n-dec-sso-res', to: 'n-doc-login-cancel', fromSide: 'left', toSide: 'top', label: 'Gagal', isNegative: true },
    { id: 'cl6-sht-fail', from: 'n-dec-sheet-res', to: 'n-doc-login-cancel', fromSide: 'left', toSide: 'bottom', label: 'Salah', isNegative: true },

    { id: 'cl7-sso-pass', from: 'n-dec-sso-res', to: 'n-check-owner-sheet', fromSide: 'right', toSide: 'left', label: 'Valid' },
    { id: 'cl7-sht-pass', from: 'n-dec-sheet-res', to: 'n-check-owner-sheet', fromSide: 'right', toSide: 'left', label: 'Valid' },

    { id: 'cl8-owner-yes', from: 'n-check-owner-sheet', to: 'n-set-owner', fromSide: 'bottom', toSide: 'top', label: 'Ya (Owner)' },
    { id: 'cl8-owner-no', from: 'n-check-owner-sheet', to: 'n-set-user', fromSide: 'right', toSide: 'top', label: 'User Biasa' },

    { id: 'cl9-own', from: 'n-set-owner', to: 'n-save-session' },
    { id: 'cl9-usr', from: 'n-set-user', to: 'n-save-session' },
    { id: 'cl10', from: 'n-save-session', to: 'n-end' }
  ]
};

// 3. OPERATIONAL PROCESS FLOWCHART
const OPERATIONAL_PROCESS_FLOWCHART: FlowchartDiagramData = {
  id: 'FLOW_BISNIS',
  title: 'Flow Eksekusi Komputasi Indikator & Dashboard Operasional',
  subtitle: 'Diagram Alur Transformasi Data Mentah Spreadsheet Menjadi 35+ Metrik, Evaluasi SLA, dan Peta GPS',
  canvasWidth: 1060,
  canvasHeight: 700,
  lanes: [
    { id: 'lane-1', title: 'Step 1: Ekstraksi Data', subtitle: 'Filter Tab GID & Wilayah', x: 20, width: 330 },
    { id: 'lane-2', title: 'Step 2: Logika Komputasi', subtitle: 'Mesin Formula KPI', x: 370, width: 340 },
    { id: 'lane-3', title: 'Step 3: Visualisasi & Output', subtitle: 'Recharts, Peta & AI', x: 730, width: 310 }
  ],
  nodes: [
    // Step 1
    { id: 'op-start', laneId: 'lane-1', type: 'START', label: 'Start', x: 125, y: 60, width: 120, height: 44 },
    { id: 'op-select-mod', laneId: 'lane-1', type: 'PROCESS', label: 'Pilih Modul Dashboard', sublabel: 'Bisnis / Asr / Prv / QE / Tek', x: 85, y: 135, width: 200, height: 55 },
    { id: 'op-read-gviz', laneId: 'lane-1', type: 'PROCESS', label: 'Baca Data Mentah GViz', sublabel: 'Filter Tab GID Terkait', x: 85, y: 220, width: 200, height: 55 },
    { id: 'op-filter-reg', laneId: 'lane-1', type: 'PROCESS', label: 'Terapkan Filter Regional', sublabel: 'Madiun vs Jatim', x: 85, y: 305, width: 200, height: 55 },
    { id: 'op-dec-empty', laneId: 'lane-1', type: 'DECISION', label: 'Data Ada ?', x: 115, y: 395, width: 140, height: 75 },
    { id: 'op-doc-nodata', laneId: 'lane-1', type: 'DOCUMENT', label: 'Tampilkan State Kosong', sublabel: 'Data Belum Tersedia', x: 85, y: 505, width: 200, height: 50 },

    // Step 2
    { id: 'op-group-data', laneId: 'lane-2', type: 'PROCESS', label: 'Grouping Data per Bulan / STO', sublabel: 'Aggregator GroupBy', x: 440, y: 135, width: 200, height: 55 },
    { id: 'op-run-formula', laneId: 'lane-2', type: 'PROCESS', label: 'Eksekusi Rumus KPI Resmi', sublabel: 'Margin / MTTR / SLA / PSB', x: 440, y: 220, width: 200, height: 58 },
    { id: 'op-dec-bench', laneId: 'lane-2', type: 'DECISION', label: 'Sesuai SLA ?', x: 470, y: 310, width: 140, height: 75 },
    { id: 'op-bench-fail', laneId: 'lane-2', type: 'PROCESS', label: 'Status Alert (Merah)', sublabel: 'Under Benchmark', x: 380, y: 415, width: 140, height: 50 },
    { id: 'op-bench-pass', laneId: 'lane-2', type: 'PROCESS', label: 'Status Lolos (Hijau)', sublabel: 'Target Terpenuhi', x: 550, y: 415, width: 140, height: 50 },
    { id: 'op-spatial-geo', laneId: 'lane-2', type: 'PROCESS', label: 'Validasi Koordinat GPS', sublabel: 'Latitude & Longitude Pelanggan', x: 440, y: 500, width: 200, height: 55 },

    // Step 3
    { id: 'op-render-cards', laneId: 'lane-3', type: 'DOCUMENT', label: 'Render Kartu Metrik', sublabel: 'Ringkasan Nilai KPI', x: 785, y: 135, width: 200, height: 50 },
    { id: 'op-render-charts', laneId: 'lane-3', type: 'DOCUMENT', label: 'Render Grafik & Peta', sublabel: 'Recharts & Leaflet Map', x: 785, y: 215, width: 200, height: 50 },
    { id: 'op-render-table', laneId: 'lane-3', type: 'DOCUMENT', label: 'Tabel Detail Transaksi', sublabel: 'Pencarian & Pagination', x: 785, y: 295, width: 200, height: 50 },
    { id: 'op-ai-action', laneId: 'lane-3', type: 'PROCESS', label: 'Evaluasi Rekomendasi AI', sublabel: 'Gemini Assistant Engine', x: 785, y: 375, width: 200, height: 55 },
    { id: 'op-end', laneId: 'lane-3', type: 'END', label: 'End (Dashboard Live)', x: 825, y: 465, width: 120, height: 44 }
  ],
  connections: [
    { id: 'op-c1', from: 'op-start', to: 'op-select-mod' },
    { id: 'op-c2', from: 'op-select-mod', to: 'op-read-gviz' },
    { id: 'op-c3', from: 'op-read-gviz', to: 'op-filter-reg' },
    { id: 'op-c4', from: 'op-filter-reg', to: 'op-dec-empty' },
    { id: 'op-c5-no', from: 'op-dec-empty', to: 'op-doc-nodata', fromSide: 'bottom', toSide: 'top', label: 'Kosong', isNegative: true },
    { id: 'op-c5-yes', from: 'op-dec-empty', to: 'op-group-data', fromSide: 'right', toSide: 'left', label: 'Ada Data', points: [{ x: 255, y: 432 }, { x: 330, y: 432 }, { x: 330, y: 162 }, { x: 440, y: 162 }] },
    
    { id: 'op-c6', from: 'op-group-data', to: 'op-run-formula' },
    { id: 'op-c7', from: 'op-run-formula', to: 'op-dec-bench' },
    { id: 'op-c8-yes', from: 'op-dec-bench', to: 'op-bench-pass', fromSide: 'right', toSide: 'top', label: 'Sesuai' },
    { id: 'op-c8-no', from: 'op-dec-bench', to: 'op-bench-fail', fromSide: 'left', toSide: 'top', label: 'Kurang', isNegative: true },
    { id: 'op-c9-pass', from: 'op-bench-pass', to: 'op-spatial-geo', fromSide: 'bottom', toSide: 'right' },
    { id: 'op-c9-fail', from: 'op-bench-fail', to: 'op-spatial-geo', fromSide: 'bottom', toSide: 'left' },

    { id: 'op-c10-cards', from: 'op-run-formula', to: 'op-render-cards', fromSide: 'right', toSide: 'left' },
    { id: 'op-c11-charts', from: 'op-spatial-geo', to: 'op-render-charts', fromSide: 'right', toSide: 'left', points: [{ x: 640, y: 527 }, { x: 710, y: 527 }, { x: 710, y: 240 }, { x: 785, y: 240 }] },
    { id: 'op-c12-tbl', from: 'op-render-cards', to: 'op-render-table' },
    { id: 'op-c13-ai', from: 'op-render-table', to: 'op-ai-action' },
    { id: 'op-c14-end', from: 'op-ai-action', to: 'op-end' }
  ]
};

// 4. KELOLA DATA FLOWCHART
const KELOLA_DATA_FLOWCHART: FlowchartDiagramData = {
  id: 'FLOW_KELOLA_DATA',
  title: 'Flow Eksekusi Tata Kelola Data & Hak Wewenang Owner',
  subtitle: 'Diagram Alur Pengawasan Dokumen Master, Logika Kolom, dan Manajemen Akun Pegawai',
  canvasWidth: 1060,
  canvasHeight: 700,
  lanes: [
    { id: 'lane-1', title: 'Step 1: Otorisasi Masuk', subtitle: 'Role Guard Check', x: 20, width: 330 },
    { id: 'lane-2', title: 'Step 2: Inspeksi & Simulasi', subtitle: 'Spreadsheet & SSO Logic', x: 370, width: 340 },
    { id: 'lane-3', title: 'Step 3: Tata Kelola & Output', subtitle: 'Kamus JSON & Ekspor', x: 730, width: 310 }
  ],
  nodes: [
    { id: 'kd-start', laneId: 'lane-1', type: 'START', label: 'Start', x: 125, y: 60, width: 120, height: 44 },
    { id: 'kd-click-tab', laneId: 'lane-1', type: 'PROCESS', label: 'Klik Tab "Kelola Data"', sublabel: 'Akses Navigasi Bar', x: 85, y: 135, width: 200, height: 55 },
    { id: 'kd-dec-auth', laneId: 'lane-1', type: 'DECISION', label: 'Role OWNER ?', x: 115, y: 220, width: 140, height: 75 },
    { id: 'kd-doc-denied', laneId: 'lane-1', type: 'DOCUMENT', label: 'Akses Ditolak', sublabel: 'Redirect ke Welcome Page', x: 85, y: 330, width: 200, height: 50 },
    { id: 'kd-open-panel', laneId: 'lane-1', type: 'PROCESS', label: 'Buka Panel Kelola Data', sublabel: 'Akses Diberikan Penuh', x: 85, y: 415, width: 200, height: 55 },

    // Step 2
    { id: 'kd-list-sources', laneId: 'lane-2', type: 'PROCESS', label: 'Tampilkan Master Sheets', sublabel: '4 Spreadsheet & 11 Tab GID', x: 440, y: 135, width: 200, height: 55 },
    { id: 'kd-inspect-col', laneId: 'lane-2', type: 'PROCESS', label: 'Buka Modal Logika Kolom', sublabel: 'Audit Transformasi Data', x: 440, y: 220, width: 200, height: 55 },
    { id: 'kd-sso-sim', laneId: 'lane-2', type: 'PROCESS', label: 'Simulator Hak Akses SSO', sublabel: 'Live Role Evaluator', x: 440, y: 305, width: 200, height: 55 },
    { id: 'kd-dec-owner-assign', laneId: 'lane-2', type: 'DECISION', label: 'Angkat OWNER ?', x: 470, y: 395, width: 140, height: 75 },
    { id: 'kd-proc-update-sheet', laneId: 'lane-2', type: 'PROCESS', label: 'Set Kolom C "OWNER"', sublabel: 'Sheet list user', x: 440, y: 505, width: 200, height: 55 },

    // Step 3
    { id: 'kd-flow-chart', laneId: 'lane-3', type: 'DOCUMENT', label: 'Diagram Alur Proses Sistem', sublabel: 'Flow Chart Klasik Standar', x: 785, y: 135, width: 200, height: 50 },
    { id: 'kd-metric-dict', laneId: 'lane-3', type: 'DOCUMENT', label: 'Tabel Kamus Metrik', sublabel: '35+ Indikator Resmi', x: 785, y: 215, width: 200, height: 50 },
    { id: 'kd-export-json', laneId: 'lane-3', type: 'PROCESS', label: 'Ekspor Kamus ke JSON', sublabel: 'Unduh Dokumentasi Teknis', x: 785, y: 295, width: 200, height: 50 },
    { id: 'kd-ai-audit', laneId: 'lane-3', type: 'PROCESS', label: 'Audit Kesehatan Data AI', sublabel: 'Gemini Intelligence Audit', x: 785, y: 375, width: 200, height: 55 },
    { id: 'kd-end', laneId: 'lane-3', type: 'END', label: 'End (Tata Kelola Selesai)', x: 825, y: 465, width: 120, height: 44 }
  ],
  connections: [
    { id: 'kd-c1', from: 'kd-start', to: 'kd-click-tab' },
    { id: 'kd-c2', from: 'kd-click-tab', to: 'kd-dec-auth' },
    { id: 'kd-c3-no', from: 'kd-dec-auth', to: 'kd-doc-denied', fromSide: 'bottom', toSide: 'top', label: 'Bukan Owner', isNegative: true },
    { id: 'kd-c3-yes', from: 'kd-dec-auth', to: 'kd-open-panel', fromSide: 'right', toSide: 'top', label: 'Valid Owner', points: [{ x: 255, y: 257 }, { x: 295, y: 257 }, { x: 295, y: 442 }, { x: 285, y: 442 }] },
    
    { id: 'kd-c4', from: 'kd-open-panel', to: 'kd-list-sources', fromSide: 'right', toSide: 'left', points: [{ x: 285, y: 442 }, { x: 355, y: 442 }, { x: 355, y: 162 }, { x: 440, y: 162 }] },
    { id: 'kd-c5', from: 'kd-list-sources', to: 'kd-inspect-col' },
    { id: 'kd-c6', from: 'kd-inspect-col', to: 'kd-sso-sim' },
    { id: 'kd-c7', from: 'kd-sso-sim', to: 'kd-dec-owner-assign' },
    { id: 'kd-c8-yes', from: 'kd-dec-owner-assign', to: 'kd-proc-update-sheet', fromSide: 'bottom', toSide: 'top', label: 'Ya' },
    
    { id: 'kd-c9', from: 'kd-list-sources', to: 'kd-flow-chart', fromSide: 'right', toSide: 'left' },
    { id: 'kd-c10', from: 'kd-flow-chart', to: 'kd-metric-dict' },
    { id: 'kd-c11', from: 'kd-metric-dict', to: 'kd-export-json' },
    { id: 'kd-c12', from: 'kd-export-json', to: 'kd-ai-audit' },
    { id: 'kd-c13', from: 'kd-ai-audit', to: 'kd-end' }
  ]
};

const ALL_DIAGRAMS: Record<FlowchartCategory, FlowchartDiagramData> = {
  E2E_SYSTEM: E2E_FLOWCHART,
  FLOW_LOGIN: LOGIN_PROCESS_FLOWCHART,
  FLOW_WELCOME: E2E_FLOWCHART,
  FLOW_BISNIS: OPERATIONAL_PROCESS_FLOWCHART,
  FLOW_ASSURANCE: OPERATIONAL_PROCESS_FLOWCHART,
  FLOW_PROVISIONING: OPERATIONAL_PROCESS_FLOWCHART,
  FLOW_QE: OPERATIONAL_PROCESS_FLOWCHART,
  FLOW_TEKNISI: OPERATIONAL_PROCESS_FLOWCHART,
  FLOW_KELOLA_DATA: KELOLA_DATA_FLOWCHART
};

interface VisualFlowChartDiagramProps {
  initialCategory?: FlowchartCategory;
  onOpenColumnLogic?: () => void;
}

export const VisualFlowChartDiagram: React.FC<VisualFlowChartDiagramProps> = ({
  initialCategory = 'E2E_SYSTEM',
  onOpenColumnLogic
}) => {
  const [selectedDiagramId, setSelectedDiagramId] = useState<FlowchartCategory>(initialCategory);
  const [selectedNode, setSelectedNode] = useState<FlowchartElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Synchronize when initialCategory changes from outer tabs
  React.useEffect(() => {
    if (initialCategory && ALL_DIAGRAMS[initialCategory]) {
      setSelectedDiagramId(initialCategory);
    }
  }, [initialCategory]);

  const currentDiagram = ALL_DIAGRAMS[selectedDiagramId] || E2E_FLOWCHART;

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoomLevel(1);

  // Helper to find node by ID
  const getNode = (id: string): FlowchartElement | undefined => {
    return currentDiagram.nodes.find(n => n.id === id);
  };

  // Helper to calculate orthogonal SVG line paths
  const getConnectionPath = (conn: FlowchartConnection) => {
    const fromNode = getNode(conn.from);
    const toNode = getNode(conn.to);

    if (!fromNode || !toNode) return null;

    let startX = fromNode.x + fromNode.width / 2;
    let startY = fromNode.y + fromNode.height;

    if (conn.fromSide === 'right') {
      startX = fromNode.x + fromNode.width;
      startY = fromNode.y + fromNode.height / 2;
    } else if (conn.fromSide === 'left') {
      startX = fromNode.x;
      startY = fromNode.y + fromNode.height / 2;
    } else if (conn.fromSide === 'top') {
      startX = fromNode.x + fromNode.width / 2;
      startY = fromNode.y;
    }

    let endX = toNode.x + toNode.width / 2;
    let endY = toNode.y;

    if (conn.toSide === 'left') {
      endX = toNode.x;
      endY = toNode.y + toNode.height / 2;
    } else if (conn.toSide === 'right') {
      endX = toNode.x + toNode.width;
      endY = toNode.y + toNode.height / 2;
    } else if (conn.toSide === 'bottom') {
      endX = toNode.x + toNode.width / 2;
      endY = toNode.y + toNode.height;
    }

    let dPath = '';
    let midLabelX = (startX + endX) / 2;
    let midLabelY = (startY + endY) / 2;

    if (conn.points && conn.points.length > 0) {
      dPath = `M ${startX} ${startY}`;
      conn.points.forEach(p => {
        dPath += ` L ${p.x} ${p.y}`;
      });
      dPath += ` L ${endX} ${endY}`;
      // Put label near first segment
      midLabelX = (conn.points[0].x + (conn.points[1] ? conn.points[1].x : conn.points[0].x)) / 2;
      midLabelY = (conn.points[0].y + (conn.points[1] ? conn.points[1].y : conn.points[0].y)) / 2 - 10;
    } else if (Math.abs(startX - endX) < 10) {
      // Direct vertical
      dPath = `M ${startX} ${startY} L ${endX} ${endY}`;
      midLabelX = startX + 22;
      midLabelY = (startY + endY) / 2;
    } else {
      // Orthogonal elbow
      const midY = startY + (endY - startY) / 2;
      dPath = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
      midLabelX = (startX + endX) / 2;
      midLabelY = midY - 9;
    }

    const strokeColor = conn.isNegative ? '#dc2626' : '#0f172a';

    return (
      <g key={conn.id} className="flow-connection group cursor-pointer">
        {/* Hover trigger zone */}
        <path
          d={dPath}
          fill="none"
          stroke="transparent"
          strokeWidth="12"
          className="hover:stroke-blue-200/50 transition-all"
        />
        {/* Real Arrow Line */}
        <path
          d={dPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          markerEnd={conn.isNegative ? "url(#arrow-red)" : "url(#arrow-black)"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Connection Label with Dynamic Width so text never overflows badge */}
        {conn.label && (() => {
          const lblWidth = Math.max(54, conn.label.length * 6.5 + 14);
          const lblHeight = 18;
          return (
            <g transform={`translate(${midLabelX}, ${midLabelY})`}>
              <rect
                x={-lblWidth / 2}
                y={-lblHeight / 2}
                width={lblWidth}
                height={lblHeight}
                rx="4"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="1"
                className="shadow-xs"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill={strokeColor}
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {conn.label}
              </text>
            </g>
          );
        })()}
      </g>
    );
  };

  // Helper to render flowchart shapes with clean text that never overflows borders or piles up
  const renderNode = (node: FlowchartElement) => {
    const isSelected = selectedNode?.id === node.id;
    const { x, y, width, height, type, label, sublabel } = node;

    const strokeColor = isSelected ? '#2563eb' : '#0f172a';
    const strokeWidth = isSelected ? 2.5 : 2;
    const fillColor = isSelected ? '#eff6ff' : '#ffffff';

    // Calculate inner geometry bounds for foreignObject text containment
    let innerX = x + 4;
    let innerY = y + 3;
    let innerWidth = width - 8;
    let innerHeight = height - 6;

    if (type === 'DECISION') {
      // In a rhombus, the central rectangular region has area bounded by 0.72 scale
      innerWidth = Math.round(width * 0.72);
      innerHeight = Math.round(height * 0.72);
      innerX = Math.round(x + (width - innerWidth) / 2);
      innerY = Math.round(y + (height - innerHeight) / 2);
    } else if (type === 'DOCUMENT') {
      // Leave room for wavy bottom cut
      innerHeight = height - 14;
    } else if (type === 'START' || type === 'END') {
      innerWidth = width - 16;
      innerX = x + 8;
    }

    return (
      <g
        key={node.id}
        onClick={() => setSelectedNode(node)}
        className="flow-node cursor-pointer select-none transition-all group"
      >
        {/* Shape Rendering based on ISO Flowchart Type */}
        {type === 'START' || type === 'END' ? (
          // Oval / Pill
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={height / 2}
            ry={height / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="group-hover:stroke-blue-600 shadow-sm transition-colors"
          />
        ) : type === 'DECISION' ? (
          // Diamond (Rhombus)
          <polygon
            points={`
              ${x + width / 2},${y} 
              ${x + width},${y + height / 2} 
              ${x + width / 2},${y + height} 
              ${x},${y + height / 2}
            `}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="group-hover:stroke-blue-600 shadow-sm transition-colors"
          />
        ) : type === 'DOCUMENT' ? (
          // Document shape with wavy bottom
          <path
            d={`
              M ${x} ${y} 
              H ${x + width} 
              V ${y + height - 10} 
              Q ${x + width * 0.75} ${y + height - 18}, ${x + width * 0.5} ${y + height - 7} 
              T ${x} ${y + height - 10} 
              Z
            `}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="group-hover:stroke-blue-600 shadow-sm transition-colors"
          />
        ) : (
          // Standard Process Rectangle
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx="0"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="group-hover:stroke-blue-600 shadow-sm transition-colors"
          />
        )}

        {/* Text Rendering via foreignObject: guarantees automatic wrapping, no overflow outside borders, and no text collisions */}
        <foreignObject
          x={innerX}
          y={innerY}
          width={innerWidth}
          height={innerHeight}
          className="pointer-events-none"
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
              padding: '2px 4px',
              lineHeight: '1.22',
              wordBreak: 'normal',
              overflowWrap: 'break-word',
              overflow: 'hidden',
              userSelect: 'none'
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: type === 'DECISION' ? '10.5px' : '11px',
                color: isSelected ? '#1d4ed8' : '#0f172a',
                maxWidth: '100%',
                display: '-webkit-box',
                WebkitLineClamp: sublabel ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {label}
            </span>
            {sublabel && (
              <span
                style={{
                  fontSize: '8.5px',
                  color: '#64748b',
                  marginTop: '2px',
                  fontWeight: 600,
                  maxWidth: '100%',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {sublabel}
              </span>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : ''}`} id="visual-flowchart-diagram-root">
      {/* 1. FILTER DAN TOOLBAR ATAS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-red-600 text-white rounded text-[11px] font-black uppercase tracking-wider">
              FLOW CHART KLASIK
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-300 font-bold">
              Standard Swimlane, Oval, Diamond & Orthogonal Lines
            </span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">
            {currentDiagram.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
            {currentDiagram.subtitle}
          </p>
        </div>

        {/* Toolbar Interaktif: Zoom & Fullscreen */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs font-bold">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil (-)"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 text-slate-300 font-mono text-[11px]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar (+)"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors ml-1 border-l border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. FILTER PILIHAN ALUR PROSES (TABS PER PROSES) */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 mr-2">
          <Filter className="w-3.5 h-3.5 text-red-600" />
          <span>Filter Alur Proses:</span>
        </span>

        {[
          { id: 'E2E_SYSTEM', label: '1. Semua Proses (End-to-End Swimlane)' },
          { id: 'FLOW_LOGIN', label: '2. Proses Login & SSO / LDAP' },
          { id: 'FLOW_BISNIS', label: '3. Proses Halaman Operasional & Formula KPI' },
          { id: 'FLOW_KELOLA_DATA', label: '4. Proses Halaman Kelola Data (Owner)' },
        ].map((item) => {
          const isActive = selectedDiagramId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedDiagramId(item.id as FlowchartCategory);
                setSelectedNode(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20 font-extrabold'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 3. DIAGRAM CANVAS AREA */}
      <div className="relative border-2 border-slate-900 bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Legend Box in corner */}
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-300 shadow-sm text-[10px] space-y-1.5">
          <div className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
            Simbol Standar Flowchart
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2.5 rounded-full border border-black inline-block bg-white" />
            <span className="text-slate-600">Oval: Start / End</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2.5 border border-black inline-block bg-white" />
            <span className="text-slate-600">Persegi: Proses / Aksi</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rotate-45 border border-black inline-block bg-white" />
            <span className="text-slate-600">Belah Ketupat: Keputusan</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2.5 border border-black border-b-dashed inline-block bg-white" />
            <span className="text-slate-600">Dokumen: Output Data / State</span>
          </div>
        </div>

        {/* Outer Scroll Container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[760px] p-4 flex justify-center bg-slate-50/60">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out'
            }}
          >
            {/* SVG CANVAS */}
            <svg
              width={currentDiagram.canvasWidth}
              height={currentDiagram.canvasHeight}
              viewBox={`0 0 ${currentDiagram.canvasWidth} ${currentDiagram.canvasHeight}`}
              className="bg-white border border-slate-300 shadow-sm"
              style={{ minWidth: currentDiagram.canvasWidth, minHeight: currentDiagram.canvasHeight }}
            >
              {/* SVG Markers for Arrowheads */}
              <defs>
                <marker
                  id="arrow-black"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
                </marker>
                <marker
                  id="arrow-red"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
                </marker>
              </defs>

              {/* Title Header Bar */}
              <rect x="0" y="0" width={currentDiagram.canvasWidth} height="36" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              <text
                x={currentDiagram.canvasWidth / 2}
                y="23"
                textAnchor="middle"
                fontSize="13"
                fontWeight="900"
                fontFamily="sans-serif"
                fill="#0f172a"
              >
                {currentDiagram.title.toUpperCase()}
              </text>

              {/* Swimlane Columns (Step 1, Step 2, Step 3, Step 4) */}
              {currentDiagram.lanes.map((lane) => (
                <g key={lane.id}>
                  {/* Lane Header Box */}
                  <rect
                    x={lane.x}
                    y="36"
                    width={lane.width}
                    height="38"
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                  <text
                    x={lane.x + lane.width / 2}
                    y="53"
                    textAnchor="middle"
                    fontSize="11.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    fill="#0f172a"
                  >
                    {lane.title}
                  </text>
                  {lane.subtitle && (
                    <text
                      x={lane.x + lane.width / 2}
                      y="67"
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="sans-serif"
                      fill="#64748b"
                      fontWeight="600"
                    >
                      {lane.subtitle}
                    </text>
                  )}

                  {/* Lane Column Background & Separator Line */}
                  <rect
                    x={lane.x}
                    y="74"
                    width={lane.width}
                    height={currentDiagram.canvasHeight - 74}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </g>
              ))}

              {/* Render Connections / Arrows FIRST (so nodes sit on top of lines) */}
              <g className="connections-layer">
                {currentDiagram.connections.map(conn => getConnectionPath(conn))}
              </g>

              {/* Render Nodes / Shapes */}
              <g className="nodes-layer">
                {currentDiagram.nodes.map(node => renderNode(node))}
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* 4. DETAIL PANEL KETIKA NODE DI-KLIK */}
      {selectedNode ? (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-wide">
                  Tipe: {selectedNode.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID Simpul: {selectedNode.id}
                </span>
              </div>
              <h4 className="text-base font-black text-white">
                {selectedNode.label}
              </h4>
              {selectedNode.sublabel && (
                <p className="text-xs text-blue-300 font-semibold">
                  Sub-label: {selectedNode.sublabel}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup Detail ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Fungsi & Perilaku Sistem:
              </span>
              <p className="text-slate-200 leading-relaxed">
                {selectedNode.details?.description || 'Melakukan proses operasional atau pengambilan keputusan pada halaman web.'}
              </p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Sumber Data & Formula:
              </span>
              <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                {selectedNode.details?.dataSource || selectedNode.details?.formulaOrLogic || 'Memory State / GViz Live API'}
              </p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Komponen Kode Terkait:
              </span>
              <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                {selectedNode.details?.component || 'src/components/*'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Petunjuk:</strong> Klik salah satu kotak proses atau belah ketupat keputusan pada diagram untuk melihat rincian fungsi, sumber data, dan logika kodenya.
            </span>
          </div>
          {onOpenColumnLogic && (
            <button
              onClick={onOpenColumnLogic}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 shrink-0 ml-3 cursor-pointer"
            >
              <span>Buka Modal Logika Kolom</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
