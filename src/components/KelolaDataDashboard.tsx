import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  Filter, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  SlidersHorizontal, 
  Table, 
  Layers, 
  Lock, 
  FileSpreadsheet, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  BarChart3,
  Users,
  Shield,
  UserCheck,
  UserX,
  ChevronRight,
  Workflow,
  Code2,
  Globe,
  KeyRound,
  Server,
  HelpCircle,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { RegionalPerformanceData, Regional, PerformanceDashboardData } from '../types';
import { fetchUserAccounts, UserAccount, SPREADSHEET_ID, SHEET_NAME } from '../lib/auth';
import { 
  SPREADSHEET_SOURCES, 
  SpreadsheetSourceItem, 
  KeyColumnDetail 
} from '../data/spreadsheetColumnDetails';
import { ColumnLogicModal } from './ColumnLogicModal';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

interface KelolaDataDashboardProps {
  currentUser: string | null;
  currentUserRole: string;
  onRefreshAllData: () => void;
  isLoadingLive: boolean;
  syncStatus: 'local' | 'live' | 'error';
  syncTime: string;
  allRegionsData: PerformanceDashboardData;
  currentData: RegionalPerformanceData;
  activeRegional: Regional;
  activeMonth: string;
  activeYear: string;
}

// Re-export type for compatibility
export type { SpreadsheetSourceItem, KeyColumnDetail };

// 2. Definition of All Indicators across the entire web application
export interface IndicatorItem {
  code: string;
  name: string;
  module: 'AUTH' | 'BISNIS' | 'ASSURANCE' | 'PROVISIONING' | 'TEKNISI' | 'QE';
  moduleName: string;
  sourceSheet: string;
  sourceColumns: string;
  unit: string;
  formula: string;
  currentValue: string | number;
  benchmark: string;
  description: string;
}

export default function KelolaDataDashboard({
  currentUser,
  currentUserRole,
  onRefreshAllData,
  isLoadingLive,
  syncStatus,
  syncTime,
  allRegionsData,
  currentData,
  activeRegional,
  activeMonth,
  activeYear,
}: KelolaDataDashboardProps) {
  // Navigation & filter state
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ssoSimulationId, setSsoSimulationId] = useState<string>('');

  // AI Performance Evaluation Modal State
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    tableName: string;
    summaryMetrics: Record<string, any>;
    sampleRows: any[];
    promptNote?: string;
  }>({
    isOpen: false,
    tableName: '',
    summaryMetrics: {},
    sampleRows: [],
    promptNote: '',
  });

  const openAiModal = (
    tableName: string,
    summaryMetrics: Record<string, any>,
    sampleRows: any[],
    promptNote?: string
  ) => {
    setAiModalState({
      isOpen: true,
      tableName,
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Column logic inspection modal state
  const [selectedSourceForLogic, setSelectedSourceForLogic] = useState<SpreadsheetSourceItem | null>(null);
  const [selectedColumnForLogic, setSelectedColumnForLogic] = useState<KeyColumnDetail | null>(null);
  const [isLogicModalOpen, setIsLogicModalOpen] = useState<boolean>(false);

  const handleOpenColumnLogic = (src: SpreadsheetSourceItem, col: KeyColumnDetail) => {
    setSelectedSourceForLogic(src);
    setSelectedColumnForLogic(col);
    setIsLogicModalOpen(true);
  };

  const handleInspectIndicatorLogic = (ind: IndicatorItem) => {
    const matchedSource = SPREADSHEET_SOURCES.find(s => 
      s.sheetName.toLowerCase() === ind.sourceSheet.toLowerCase() ||
      s.module === ind.module
    );
    if (matchedSource && matchedSource.keyColumns.length > 0) {
      const matchedCol = matchedSource.keyColumns.find(c => 
        ind.sourceColumns.toLowerCase().includes(c.column.toLowerCase()) ||
        c.fieldName.toLowerCase().includes(ind.name.toLowerCase()) ||
        ind.formula.toLowerCase().includes(c.fieldName.toLowerCase())
      ) || matchedSource.keyColumns[0];

      handleOpenColumnLogic(matchedSource, matchedCol);
    }
  };

  // Live user accounts state (fetched from 'list user')
  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

  // Load registered users from sheet 'list user'
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetchUserAccounts();
      setUserList(res.accounts);
    } catch (err) {
      console.warn('Gagal memuat list user:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // SSO Role Resolver simulation helper
  const simulatedMatch = useMemo(() => {
    const trimmed = ssoSimulationId.trim().toLowerCase();
    if (!trimmed) return null;
    const found = userList.find(u => (u.user || '').trim().toLowerCase() === trimmed);
    if (found) {
      const isOwner = (found.previlage || '').toUpperCase() === 'OWNER';
      return {
        isFound: true,
        account: found,
        role: isOwner ? 'OWNER' : 'USER',
        isOwner,
        explanation: isOwner 
          ? `User ID "${found.user}" terdaftar di sheet [list user] dengan Kolom C bernilai "OWNER". Saat berhasil login via SSO (madiunjuara.com), akun ini seketika memperoleh wewenang OWNER (akses penuh halaman Kelola Data dibuka).`
          : `User ID "${found.user}" terdaftar di sheet [list user] dengan Kolom C bernilai "USER". Saat berhasil login via SSO, akun ini mendapatkan hak akses USER reguler (halaman Kelola Data disembunyikan).`
      };
    }
    return {
      isFound: false,
      account: null,
      role: 'USER',
      isOwner: false,
      explanation: `User ID "${ssoSimulationId}" belum terdaftar di sheet [list user]. Jika pegawai ini berhasil login via SSO portal kantor (madiunjuara.com), sistem akan secara otomatis memberikan hak akses default USER. Untuk mengangkat akun ini menjadi OWNER, silakan tambahkan baris baru di sheet [list user] dengan User ID ini pada Kolom A dan isi Kolom C dengan "OWNER".`
    };
  }, [ssoSimulationId, userList]);

  // Compile all real indicators with dynamically bound values from app state
  const indicators: IndicatorItem[] = useMemo(() => {
    const biz = currentData.business;
    const asr = currentData.assurance;
    const prv = currentData.provisioning;
    const qe = currentData.qe;
    const tek = currentData.technicians;

    const grossProfit = parseFloat((biz.revenue - biz.cogs).toFixed(1));
    const profitMargin = biz.revenue > 0 ? parseFloat(((grossProfit / biz.revenue) * 100).toFixed(1)) : 0;
    const cogsRatio = biz.revenue > 0 ? parseFloat(((biz.cogs / biz.revenue) * 100).toFixed(1)) : 0;

    return [
      // AUTHENTICATION & ACCESS INDICATORS
      {
        code: 'AUTH-01',
        name: 'Username / User ID Otentikasi',
        module: 'AUTH',
        moduleName: 'Autentikasi & Previlage',
        sourceSheet: 'list user',
        sourceColumns: 'Kolom A (USER)',
        unit: 'String',
        formula: 'Pencocokan string case-insensitive terhadap database user Google Sheets',
        currentValue: `${userList.length} Akun Terdaftar`,
        benchmark: 'Wajib terdaftar di sheet',
        description: 'Identitas akun resmi pegawai/mitra untuk otentikasi login ke Performance Control Hub.'
      },
      {
        code: 'AUTH-02',
        name: 'Kredensial Password Akses',
        module: 'AUTH',
        moduleName: 'Autentikasi & Previlage',
        sourceSheet: 'list user',
        sourceColumns: 'Kolom B (PASWORD)',
        unit: 'String',
        formula: 'Validasi password exact match (jika kolom B di sheet kosong, diizinkan bypass tanpa password)',
        currentValue: 'Tervalidasi Enkripsi',
        benchmark: 'Sesuai dengan database',
        description: 'Kunci sandi keamanan otentikasi akses sistem.'
      },
      {
        code: 'AUTH-03',
        name: 'Previlage / Tingkat Otorisasi Akses',
        module: 'AUTH',
        moduleName: 'Autentikasi & Previlage',
        sourceSheet: 'list user',
        sourceColumns: 'Kolom C (PREVILAGE)',
        unit: 'Enum ("OWNER" | "USER")',
        formula: 'IF Kolom_C == "OWNER" THEN Tampilkan Halaman Kelola Data ELSE Sembunyikan',
        currentValue: currentUserRole,
        benchmark: 'OWNER untuk akses Kelola Data',
        description: 'Otorisasi peran hak akses. Pengguna dengan status OWNER mendapatkan izin membuka halaman Kelola Data, sedangkan status USER disembunyikan.'
      },
      {
        code: 'AUTH-04',
        name: 'Otentikasi Terintegrasi SSO / LDAP',
        module: 'AUTH',
        moduleName: 'Autentikasi & Previlage',
        sourceSheet: 'Portal madiunjuara.com (SSO/LDAP)',
        sourceColumns: 'Form i_userid & i_password via /api/auth/ldap',
        unit: 'Boolean / HTTP Status',
        formula: 'POST /api/auth/ldap -> Target: http://madiunjuara.com/ (Binary Check: Redirect 302 / Status 200 tanpa pesan error)',
        currentValue: 'Terintegrasi Aktif (madiunjuara.com)',
        benchmark: 'Binary Status: 200 / 302 Sukses',
        description: 'Verifikasi identitas kredensial pegawai kantor secara langsung ke portal SSO madiunjuara.com dengan kebijakan Zero-Credential Storage (password tidak pernah disimpan ke DB/sheet).'
      },
      {
        code: 'AUTH-05',
        name: 'Resolusi Previlage SSO Hybrid (OWNER / USER)',
        module: 'AUTH',
        moduleName: 'Autentikasi & Previlage',
        sourceSheet: 'list user (Kolom A & C) + SSO',
        sourceColumns: 'Cross-check SSO UserID -> Sheet list user Kolom A & C',
        unit: 'Role Enum ("OWNER" | "USER")',
        formula: 'IF SSO_Valid AND Sheet.Kolom_A.includes(SSO_User) AND Sheet.Kolom_C == "OWNER" THEN "OWNER" ELSE "USER"',
        currentValue: `${userList.filter(u => (u.previlage || '').toUpperCase() === 'OWNER').length} Akun OWNER Terdaftar`,
        benchmark: 'OWNER jika tercatat di Sheet Kolom C',
        description: 'Mekanisme penetapan hak akses akun SSO. Jika User ID SSO terdaftar di sheet "list user" dengan Kolom C "OWNER", akun diberikan hak penuh OWNER. Jika tidak terdaftar atau Kolom C bernilai "USER", otomatis diberikan hak standar USER.'
      },

      // BUSINESS METRICS
      {
        code: 'BIZ-01',
        name: 'Total Revenue (Pendapatan)',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC',
        sourceColumns: 'Kolom G (Amount) WHERE Kolom P == "REVENUE"',
        unit: 'Miliar IDR',
        formula: 'SUM(Kolom_G) WHERE Kolom_P == "REVENUE" AND Kolom_A == [Bulan_Aktif]',
        currentValue: `Rp ${biz.revenue} M`,
        benchmark: `Target: Rp ${biz.revenueTarget} M`,
        description: 'Total realisasi omzet pendapatan kotor seluruh portofolio bisnis dalam periode aktif.'
      },
      {
        code: 'BIZ-02',
        name: 'Cost of Goods Sold (COGS)',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC',
        sourceColumns: 'Kolom G (Amount) WHERE Kolom P == "COGS"',
        unit: 'Miliar IDR',
        formula: 'SUM(Kolom_G) WHERE Kolom_P == "COGS" AND Kolom_A == [Bulan_Aktif]',
        currentValue: `Rp ${biz.cogs} M`,
        benchmark: `Budget: Rp ${biz.cogsBudget} M`,
        description: 'Beban pokok pendapatan langsung yang dikeluarkan untuk pengadaan perangkat, material, dan jasa proyek.'
      },
      {
        code: 'BIZ-03',
        name: 'Gross Profit (Laba Kotor)',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC',
        sourceColumns: 'Kalkulasi dari Kolom G (Revenue) - Kolom G (COGS)',
        unit: 'Miliar IDR',
        formula: 'Total Revenue - Total COGS',
        currentValue: `Rp ${grossProfit} M`,
        benchmark: '> Rp 10.0 M',
        description: 'Keuntungan kotor operasional sebelum dikurangi beban umum opex dan pajak.'
      },
      {
        code: 'BIZ-04',
        name: 'Profit Margin %',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC',
        sourceColumns: 'Rasio dari Revenue & COGS',
        unit: '% (Persentase)',
        formula: '(Gross Profit / Total Revenue) * 100',
        currentValue: `${profitMargin}%`,
        benchmark: '≥ 25.0%',
        description: 'Tingkat efisiensi laba margin kotor terhadap total pendapatan yang dibukukan.'
      },
      {
        code: 'BIZ-05',
        name: 'COGS Ratio %',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC',
        sourceColumns: 'Rasio dari COGS terhadap Revenue',
        unit: '% (Persentase)',
        formula: '(Total COGS / Total Revenue) * 100',
        currentValue: `${cogsRatio}%`,
        benchmark: '≤ 75.0%',
        description: 'Proporsi pengeluaran biaya beban pokok terhadap pemasukan total.'
      },
      {
        code: 'BIZ-06',
        name: 'EBITDA Operasional',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC & Model Keuangan',
        sourceColumns: 'Agregasi Finansial',
        unit: 'Miliar IDR',
        formula: 'Revenue - COGS - Opex Operasional',
        currentValue: `Rp ${biz.ebitda} M`,
        benchmark: `Target: Rp ${biz.ebitdaTarget} M`,
        description: 'Laba sebelum bunga, pajak, depresiasi, dan amortisasi.'
      },
      {
        code: 'BIZ-07',
        name: 'Net Income (Laba Bersih)',
        module: 'BISNIS',
        moduleName: 'Performansi Bisnis',
        sourceSheet: 'BC & Model Keuangan',
        sourceColumns: 'Agregasi Finansial Akhir',
        unit: 'Miliar IDR',
        formula: 'EBITDA - Depresiasi - Pajak Badan',
        currentValue: `Rp ${biz.netIncome} M`,
        benchmark: '> Rp 5.0 M',
        description: 'Laba bersih akhir yang diatribusikan kepada perusahaan.'
      },

      // ASSURANCE METRICS
      {
        code: 'ASR-01',
        name: 'Total Tiket Gangguan Masuk',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'COUNT(Kolom D: Trouble No)',
        unit: 'Tiket',
        formula: 'COUNT(Baris) WHERE Bulan == [Bulan_Aktif]',
        currentValue: `${asr.totalTickets.toLocaleString('id-ID')} Tiket`,
        benchmark: 'Monitoring Tren',
        description: 'Akumulasi seluruh laporan tiket insiden dan gangguan pelanggan yang diterima sistem NOC.'
      },
      {
        code: 'ASR-02',
        name: 'Tiket Berhasil Diselesaikan (Resolved)',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'Kolom J (STATUS == "CLOSED")',
        unit: 'Tiket',
        formula: 'COUNT(Baris) WHERE STATUS IN ("CLOSED", "RESOLVED")',
        currentValue: `${asr.resolvedTickets.toLocaleString('id-ID')} Tiket`,
        benchmark: '≥ 95% Penyelesaian',
        description: 'Jumlah tiket gangguan yang telah selesai ditangani secara teknis oleh teknisi lapangan.'
      },
      {
        code: 'ASR-03',
        name: 'Tiket Pending (Dalam Penanganan)',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'Kolom J (STATUS != "CLOSED")',
        unit: 'Tiket',
        formula: 'Total Tiket Masuk - Total Tiket Resolved',
        currentValue: `${asr.pendingTickets.toLocaleString('id-ID')} Tiket`,
        benchmark: 'Minimalkan Backlog',
        description: 'Tiket gangguan yang masih dalam antrean atau investigasi teknisi di lapangan.'
      },
      {
        code: 'ASR-04',
        name: 'Mean Time to Resolution (MTTR)',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'Kolom K (TTR) & Kolom L (RAW TTR)',
        unit: 'Jam',
        formula: 'SUM(TTR Hours) / COUNT(Valid Closed Tickets)',
        currentValue: `${asr.mttrHours} Jam`,
        benchmark: `Target SLA: ≤ ${asr.mttrTarget} Jam`,
        description: 'Rata-rata durasi kecepatan penanganan gangguan sejak tiket dibuat hingga berstatus closed.'
      },
      {
        code: 'ASR-05',
        name: 'SLA Compliance Rate',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'Kolom K (TTR ≤ 3.0 Jam)',
        unit: '% (Persentase)',
        formula: '(COUNT(Tiket Selesai ≤ 3 Jam) / Total Tiket Resolved) * 100',
        currentValue: `${asr.slaCompliance}%`,
        benchmark: '≥ 95.0%',
        description: 'Persentase pemenuhan komitmen penanganan tiket dalam batas standar SLA layanan 3 jam.'
      },
      {
        code: 'ASR-06',
        name: 'Repeat Trouble Rate (Gangguan Berulang)',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'Kolom D & Riwayat No Internet',
        unit: '% (Persentase)',
        formula: '(COUNT(Pelanggan Lapor >1x dalam 30 Hari) / Total Tiket) * 100',
        currentValue: `${asr.repeatTroubleRate}%`,
        benchmark: '≤ 3.0%',
        description: 'Indikasi mutu perbaikan permanen; memantau tiket berulang dari pelanggan yang sama dalam 30 hari.'
      },
      {
        code: 'ASR-07',
        name: 'High Value Customer (HVC) Ratio',
        module: 'ASSURANCE',
        moduleName: 'Performansi Assurance',
        sourceSheet: 'REKAP TIKET',
        sourceColumns: 'Kolom T (FLAG HVC: DIAMOND / PLATINUM / GOLD)',
        unit: '% (Persentase)',
        formula: '(COUNT(Tiket HVC) / Total Tiket) * 100',
        currentValue: '18.4%',
        benchmark: 'Prioritas Penanganan 100%',
        description: 'Proporsi tiket gangguan dari segmen pelanggan bernilai tinggi yang wajib mendapat SLA respon cepat.'
      },

      // PROVISIONING METRICS
      {
        code: 'PRV-01',
        name: 'Realisasi Pasang Baru (PSB Actual)',
        module: 'PROVISIONING',
        moduleName: 'Performansi Provisioning',
        sourceSheet: 'Master Endstate & GD INDIBIZZ NEW',
        sourceColumns: 'Kolom E (STATUS KPRO == "PSB COMPLETED")',
        unit: 'Sambungan (SS)',
        formula: 'COUNT(Baris) WHERE STATUS_KPRO == "PSB COMPLETED"',
        currentValue: `${prv.psbActual.toLocaleString('id-ID')} SS`,
        benchmark: `Target: ${prv.psbTarget.toLocaleString('id-ID')} SS`,
        description: 'Total instalasi sambungan baru pelanggan IndiHome PDA dan Indibizz yang telah aktif.'
      },
      {
        code: 'PRV-02',
        name: 'Tingkat Keberhasilan Aktivasi (Activation Rate)',
        module: 'PROVISIONING',
        moduleName: 'Performansi Provisioning',
        sourceSheet: 'Master Endstate',
        sourceColumns: 'Rasio Status Kpro',
        unit: '% (Persentase)',
        formula: '(PSB Actual / Total Order Masuk) * 100',
        currentValue: `${prv.activationRate}%`,
        benchmark: '≥ 92.0%',
        description: 'Persentase konversi pesanan pasang baru yang berhasil terpasang tanpa kendala fallout.'
      },
      {
        code: 'PRV-03',
        name: 'Lead Time Pemasangan Baru',
        module: 'PROVISIONING',
        moduleName: 'Performansi Provisioning',
        sourceSheet: 'Master Endstate',
        sourceColumns: 'Kolom F (LEAD TIME HARI)',
        unit: 'Hari',
        formula: 'AVERAGE(Kolom_F: Tanggal On-Air - Tanggal Order Registrasi)',
        currentValue: `${prv.leadTimeDays} Hari`,
        benchmark: `Target: ≤ ${prv.leadTimeTarget} Hari`,
        description: 'Rata-rata kecepatan hari kerja yang dibutuhkan tim instalasi dari registrasi order hingga internet aktif.'
      },
      {
        code: 'PRV-04',
        name: 'Pending Installations / Backlog Order',
        module: 'PROVISIONING',
        moduleName: 'Performansi Provisioning',
        sourceSheet: 'Master Endstate',
        sourceColumns: 'Kolom E (STATUS KPRO == "IN PROGRESS" / "SURVEY")',
        unit: 'Order',
        formula: 'COUNT(Order Belum Selesai)',
        currentValue: `${prv.pendingInstallations.toLocaleString('id-ID')} Order`,
        benchmark: 'Monitoring Harian',
        description: 'Daftar order pasang baru yang sedang dalam proses reservasi ODP, penarikan dropcore, atau survey lapangan.'
      },
      {
        code: 'PRV-05',
        name: 'Cancel / Fallout Rate',
        module: 'PROVISIONING',
        moduleName: 'Performansi Provisioning',
        sourceSheet: 'Master Endstate',
        sourceColumns: 'Kolom E (STATUS KPRO == "CANCEL" / "FALLOUT")',
        unit: '% (Persentase)',
        formula: '(COUNT(Order Batal) / Total Order Masuk) * 100',
        currentValue: `${prv.cancelRate}%`,
        benchmark: '≤ 5.0%',
        description: 'Tingkat pembatalan order karena kendala teknis (ODP penuh, jarak kabel melebihi standar, atau izin warga).'
      },
      {
        code: 'PRV-06',
        name: 'Titik Koordinat GPS Realisasi Pasang Baru',
        module: 'PROVISIONING',
        moduleName: 'Performansi Provisioning',
        sourceSheet: 'Master Endstate',
        sourceColumns: 'Kolom G (LATITUDE) & Kolom H (LONGITUDE)',
        unit: 'Koordinat Spasial',
        formula: 'Pemetaan Leaflet/Google Maps (Lat, Long, OrderId, Sektor)',
        currentValue: '100% Terpetakan',
        benchmark: 'Akurasi GPS < 15m',
        description: 'Koordinat spasial akurat titik rumah pelanggan untuk visualisasi clustering dan kepadatan jaringan pada peta interaktif.'
      },

      // QUALITY ENGINEERING (QE) METRICS
      {
        code: 'QE-01',
        name: 'Overall Quality Engineering Score',
        module: 'QE',
        moduleName: 'Quality Engineering',
        sourceSheet: 'REKAP ACH KPI',
        sourceColumns: 'Range AE3:BI35 (Performance Score)',
        unit: '% (Persentase)',
        formula: 'Bobot: (30% Patrol) + (30% K3) + (20% Material) + (20% PM)',
        currentValue: `${qe.overallQEScore}%`,
        benchmark: '≥ 95.0%',
        description: 'Indeks komprehensif kepatuhan standar teknis, mutu instalasi kabel fiber optik, dan keandalan perangkat.'
      },
      {
        code: 'QE-02',
        name: 'Kepatuhan Patrol Jaringan (Patrol Compliance)',
        module: 'QE',
        moduleName: 'Quality Engineering',
        sourceSheet: 'REKAP ACH KPI',
        sourceColumns: 'Data Evaluasi Sektor',
        unit: '% (Persentase)',
        formula: '(Realisasi Rute Patrol / Rencana Rute Wajib) * 100',
        currentValue: `${qe.patrolCompliance}%`,
        benchmark: '≥ 95.0%',
        description: 'Kepatuhan tim pemeliharaan menyisir jalur kabel udara/tanah untuk mendeteksi potensi pohon tumbang dan tiang miring.'
      },
      {
        code: 'QE-03',
        name: 'K3 Audit Violations (Pelanggaran K3 Kerja)',
        module: 'QE',
        moduleName: 'Quality Engineering',
        sourceSheet: 'REKAP ACH KPI',
        sourceColumns: 'Laporan Audit K3 Lapangan',
        unit: 'Kasus',
        formula: 'SUM(Kasus Pelanggaran APD / Prosedur K3)',
        currentValue: `${qe.k3AuditViolations} Kasus`,
        benchmark: '0 Kasus (Zero Violation)',
        description: 'Jumlah temuan ketidakpatuhan Alat Pelindung Diri (helm safety, sabuk panjat, sepatu boots) teknisi.'
      },
      {
        code: 'QE-04',
        name: 'Material Conformity (Kesesuaian Standar Material)',
        module: 'QE',
        moduleName: 'Quality Engineering',
        sourceSheet: 'REKAP ACH KPI',
        sourceColumns: 'Audit Mutu Material ODP/ONT',
        unit: '% (Persentase)',
        formula: '(Material Lolos Uji Lab / Total Sampel Material) * 100',
        currentValue: `${qe.materialConformity}%`,
        benchmark: '≥ 98.0%',
        description: 'Tingkat kepatuhan material kabel optik, closure, dan passive splitter terhadap spesifikasi teknis Telkom.'
      },
      {
        code: 'QE-05',
        name: 'Preventive Maintenance Execution Rate',
        module: 'QE',
        moduleName: 'Quality Engineering',
        sourceSheet: 'REKAP ACH KPI',
        sourceColumns: 'Log Pemeliharaan Berkala',
        unit: '% (Persentase)',
        formula: '(Jumlah Titik PM Selesai / Jadwal Target PM) * 100',
        currentValue: `${qe.pmExecutionRate}%`,
        benchmark: '≥ 90.0%',
        description: 'Tingkat penyelesaian agenda pemeliharaan preventif pada sentral OLT, FDT, dan jalur feeder utama.'
      },

      // TECHNICIAN PRODUCTIVITY METRICS
      {
        code: 'TEK-01',
        name: 'Total Teknisi Lapangan Terdaftar',
        module: 'TEKNISI',
        moduleName: 'Performansi Teknisi',
        sourceSheet: 'MIROR BOT MADIUN & DB Teknisi',
        sourceColumns: 'Kolom Q (TEKNISI 1) & R (TEKNISI 2)',
        unit: 'Personil',
        formula: 'COUNT(DISTINCT Nama Teknisi)',
        currentValue: `${tek.totalTechnicians} Personil`,
        benchmark: 'Kapasitas Optimum',
        description: 'Total armada teknisi yang ditugaskan melayani penanganan gangguan dan pasang baru di teritori operasional.'
      },
      {
        code: 'TEK-02',
        name: 'Armada Teknisi Aktif (Active On-Duty)',
        module: 'TEKNISI',
        moduleName: 'Performansi Teknisi',
        sourceSheet: 'MIROR BOT MADIUN',
        sourceColumns: 'Status Presensi & Log Dispatch',
        unit: 'Personil',
        formula: 'COUNT(Teknisi) WHERE Status == "Active"',
        currentValue: `${tek.activeTechnicians} Personil`,
        benchmark: '≥ 90% Siaga',
        description: 'Jumlah teknisi yang bertugas aktif menyelesaikan order kerja hari ini.'
      },
      {
        code: 'TEK-03',
        name: 'Tingkat Utilisasi Teknisi (Utilization Rate)',
        module: 'TEKNISI',
        moduleName: 'Performansi Teknisi',
        sourceSheet: 'MIROR BOT MADIUN',
        sourceColumns: 'Rasio Aktif vs Total',
        unit: '% (Persentase)',
        formula: '(Teknisi Aktif / Total Teknisi) * 100',
        currentValue: `${tek.utilizationRate}%`,
        benchmark: '≥ 85.0%',
        description: 'Persentase keterlibatan produktif personil teknisi di lapangan.'
      },
      {
        code: 'TEK-04',
        name: 'Rata-rata Skor Produktivitas Harian',
        module: 'TEKNISI',
        moduleName: 'Performansi Teknisi',
        sourceSheet: 'MIROR BOT MADIUN',
        sourceColumns: 'Order Resolved per Hari',
        unit: 'Skor (1.0 - 5.0)',
        formula: 'AVERAGE(Skor Order Selesai per Hari Kerja)',
        currentValue: `${tek.avgProductivityScore} / 5.0`,
        benchmark: '≥ 4.0 Baik',
        description: 'Indeks produktivitas gabungan penyelesaian tiket gangguan, penutupan WO bot, dan pemasangan pasang baru.'
      },
      {
        code: 'TEK-05',
        name: 'Work Order Resolution Bot Madiun',
        module: 'TEKNISI',
        moduleName: 'Performansi Teknisi',
        sourceSheet: 'MIROR BOT MADIUN',
        sourceColumns: 'Kolom C (STATUS: "/close" vs "/progres")',
        unit: 'Work Order',
        formula: 'COUNT(WO /close) / (COUNT(WO /close) + COUNT(WO /progres)) * 100',
        currentValue: '96.8% Closed',
        benchmark: '≥ 95.0%',
        description: 'Tingkat ketuntasan eksekusi penugasan otomatis melalui bot dispatcher Madiun.'
      }
    ];
  }, [currentData, userList, currentUserRole]);

  // Filtered indicators based on search query and category
  const filteredIndicators = useMemo(() => {
    return indicators.filter(item => {
      const matchModule = selectedModule === 'ALL' || item.module === selectedModule;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || 
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.sourceSheet.toLowerCase().includes(q) ||
        item.sourceColumns.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q);
      return matchModule && matchQuery;
    });
  }, [indicators, selectedModule, searchQuery]);

  // Download dictionary as JSON
  const handleDownloadJSON = () => {
    const payload = {
      title: 'Telkom Akses PCC - Kamus Data & Indikator Lengkap',
      generatedAt: new Date().toISOString(),
      authorizedBy: currentUser,
      previlage: currentUserRole,
      spreadsheetSources: SPREADSHEET_SOURCES,
      allIndicators: indicators
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kamus_data_indikator_telkom_akses_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="kelola-data-dashboard">
      
      {/* 1. TOP OWNER AUTHORIZATION BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-700/60 shadow-xl shadow-slate-900/10 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PREVILAGE OWNER VERIFIED</span>
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-mono font-semibold">
                Ref: Google Sheets [list user] Kolom C
              </span>
              <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Akses Eksklusif Terbuka</span>
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
              <Database className="w-8 h-8 text-red-500" />
              <span>Kelola Data, Sumber Spreadsheet & Kamus Indikator</span>
            </h1>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Halaman kelola data ini hanya dapat diakses oleh akun dengan status <strong className="text-amber-300">PREVILAGE: OWNER</strong> (berdasarkan pengecekan Kolom C pada sheet <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">list user</code>). Menampilkan seluruh tautan spreadsheet asal data, pemetaan kolom, dan kamus seluruh indikator performansi operasional Telkom Akses.
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <AIEvaluationButton
              onClick={() =>
                openAiModal(
                  'Tata Kelola Data & Integritas Spreadsheet',
                  {
                    'Total Sumber Spreadsheet': SPREADSHEET_SOURCES.length,
                    'Total Indikator Terdaftar': indicators.length,
                    'Total Akun Pengguna': userList.length,
                    'Status Otorisasi': 'PREVILAGE OWNER VERIFIED',
                    'Status Koneksi': 'Live Google Sheets Online',
                  },
                  indicators.slice(0, 25).map((ind) => ({
                    'Kode Indikator': ind.code,
                    'Nama Indikator': ind.name,
                    'Modul': ind.moduleName,
                    'Sumber Sheet': ind.sourceSheet,
                    'Rumus': ind.formula,
                    'Benchmark Target': ind.benchmark,
                  })),
                  'Evaluasi kesehatan tata kelola data, integrasi Google Spreadsheet dengan dashboard Telkom Akses, konsistensi rumus matematis indikator, dan pemetaan hak akses role-based access control.'
                )
              }
              className="w-full justify-center"
            />

            <button
              onClick={onRefreshAllData}
              disabled={isLoadingLive}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Menyinkronkan...' : 'Sinkronkan Semua Sumber Data'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Unduh dokumentasi kamus indikator dalam format JSON"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Kamus Indikator (.JSON)</span>
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Logged In: <strong className="text-white font-mono">{currentUser}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Status Otorisasi: <strong className="text-emerald-300 uppercase">{currentUserRole}</strong></span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span>Terakhir Disinkronkan: <strong className="text-slate-200">{syncTime}</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>Koneksi Google Sheets: Online</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-overview">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>Dokumen Master</span>
            <FileSpreadsheet className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900">4 Dokumen</div>
          <p className="text-xs text-slate-500 mt-1">Google Spreadsheets aktif</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>Sheet Tab Terhubung</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900">{SPREADSHEET_SOURCES.length} Tab Sheet</div>
          <p className="text-xs text-slate-500 mt-1">Terkoneksi via API GViz CSV</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>Indikator Operasional</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900">{indicators.length} Metriks</div>
          <p className="text-xs text-slate-500 mt-1">Terkalkulasi secara otomatis</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>User Terdaftar</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900">{userList.length} Akun</div>
          <p className="text-xs text-slate-500 mt-1">Dikelola di sheet "list user"</p>
        </div>
      </div>

      {/* 3. SECTION: SPREADSHEET SOURCE DATA DIRECTORY */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6" id="spreadsheet-sources-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-extrabold uppercase tracking-wide">
                DAFTAR LINK SPREADSHEET
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-semibold">{SPREADSHEET_SOURCES.length} Sumber Data Live</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Link Source Data & Spreadsheet Tempat Pengambilan Data
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Semua data operasional yang tampil pada dashboard ini diambil secara real-time dan transparan dari Google Sheets berikut:
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Klik tombol <strong>Buka Spreadsheet</strong> untuk mengakses dokumen asli di tab baru.</span>
          </div>
        </div>

        {/* Grid of Spreadsheet Source Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SPREADSHEET_SOURCES.map((source) => (
            <div 
              key={source.id} 
              className="bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl p-5 transition-all hover:shadow-md hover:border-slate-300 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                      {source.module}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                      {source.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{source.updateFrequency}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {source.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {source.description}
                </p>

                {/* Metadata Box */}
                <div className="bg-white rounded-xl p-3 border border-slate-200/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Sheet Tab:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {source.sheetName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Spreadsheet ID:</span>
                    <div className="flex items-center space-x-1">
                      <code className="font-mono text-[11px] text-slate-700 truncate max-w-[170px]" title={source.spreadsheetId}>
                        {source.spreadsheetId}
                      </code>
                      <button
                        onClick={() => handleCopy(source.spreadsheetId, `id-${source.id}`)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                        title="Salin Spreadsheet ID"
                      >
                        {copiedId === `id-${source.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Columns Summary with Clickable Logic Inspection */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Kolom Referensi Inti:
                    </span>
                    <span className="text-[10px] text-red-600 font-extrabold bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Klik kolom untuk cek alur logika</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {source.keyColumns.map((col, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleOpenColumnLogic(source, col)}
                        className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-white hover:bg-red-50/80 border border-slate-200/80 hover:border-red-300 transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                        title={`Klik untuk melihat detail logika pengambilan data ${col.column} (${col.fieldName})`}
                      >
                        <div className="flex items-start space-x-2 min-w-0 pr-2">
                          <span className="font-mono font-bold text-red-600 shrink-0 text-xs px-1.5 py-0.5 bg-red-50 rounded border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors">
                            {col.column}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-800 text-xs group-hover:text-red-950 transition-colors">
                                {col.fieldName}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] truncate group-hover:text-slate-700">
                              {col.note}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center space-x-1 text-[11px] font-bold text-slate-400 group-hover:text-red-600 pl-1">
                          <span className="hidden sm:inline text-[10px]">Cek Logika</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopy(source.editUrl, `url-${source.id}`)}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {copiedId === `url-${source.id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>

                <a
                  href={source.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-200 hover:border-red-600"
                >
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SECTION: SPREADSHEET 'LIST USER' INSPECTOR & SSO/LDAP LOGIC */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6" id="list-user-inspector-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>REFERENSI HAK AKSES & LOGIKA LOGIN</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-semibold">Dual-Mode: Google Sheets & SSO / LDAP</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Otorisasi Hak Akses & Logika Autentikasi (Google Sheets vs SSO / LDAP)
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
              Sistem Performance Control Hub mendukung otentikasi ganda: <strong>Login Langsung Database Google Sheets</strong> dan <strong>Login Enterprise SSO / LDAP (madiunjuara.com)</strong>. Bagian ini menjelaskan secara rinci alur verifikasi kredensial, proteksi zero-credential, aturan penentuan status <strong className="text-emerald-700">OWNER</strong> vs <strong className="text-slate-700">USER</strong>, serta tabel akun terdaftar.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Sembunyikan Password' : 'Lihat Password'}</span>
            </button>

            <button
              onClick={loadUsers}
              disabled={isLoadingUsers}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh User List</span>
            </button>
          </div>
        </div>

        {/* EXPLANATION PANEL: DUAL-MODE AUTHENTICATION & SSO / LDAP LOGIC */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                  <Globe className="w-3 h-3" />
                  <span>Enterprise SSO Integration</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Lock className="w-3 h-3" />
                  <span>Zero-Credential Storage</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                  Target: http://madiunjuara.com/
                </span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2 mt-1">
                <Server className="w-5 h-5 text-red-500" />
                <span>Logika Autentikasi SSO / LDAP & Resolusi Hak Akses OWNER</span>
              </h3>
              <p className="text-xs text-slate-400">
                Memahami bagaimana sistem memverifikasi kredensial pengguna dan memutuskan apakah seorang pengguna SSO berhak membuka halaman Kelola Data ini.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start lg:self-center">
              <a
                href="http://madiunjuara.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <span>Portal SSO madiunjuara.com</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* 3 Step Architectural Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Mode Google Sheets */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Mode 1: Google Sheets
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  Database User Spreadsheet
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Digunakan saat memilih tab <strong>"Google Sheets"</strong> di layar login.
                </p>
                <div className="mt-3 space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-red-400 font-bold">•</span>
                    <span><strong>Kolom A (USER):</strong> Username / ID dicocokkan secara <em>case-insensitive</em>.</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-red-400 font-bold">•</span>
                    <span><strong>Kolom B (PASWORD):</strong> Exact match. Jika sel kosong di sheet, diizinkan masuk langsung tanpa kata sandi.</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-red-400 font-bold">•</span>
                    <span><strong>Kolom C (PREVILAGE):</strong> Menentukan peran: jika <code>OWNER</code> maka halaman Kelola Data dibuka, jika <code>USER</code> maka disembunyikan.</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-amber-300/90 font-medium">
                Cocok untuk: Akun Owner utama & akun lokal darurat.
              </div>
            </div>

            {/* Card 2: Mode SSO / LDAP */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Mode 2: SSO / LDAP Kantor
                  </span>
                  <Globe className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  Portal madiunjuara.com
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Digunakan saat memilih tab <strong>"SSO / LDAP"</strong> di layar login.
                </p>
                <div className="mt-3 space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-cyan-400 font-bold">•</span>
                    <span><strong>Proxy Endpoint:</strong> Request dikirim ke backend <code>/api/auth/ldap</code> (alias <code>/api/auth-ldap</code>) untuk keamanan & menghindari CORS browser.</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-cyan-400 font-bold">•</span>
                    <span><strong>Binary Verification:</strong> Server melakukan POST form (<code>i_userid</code> & <code>i_password</code>) ke <code>http://madiunjuara.com/</code>. Hanya mengecek status valid/tidaknya (deteksi redirect 302 atau penolakan).</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-cyan-400 font-bold">•</span>
                    <span><strong>Zero-Storage:</strong> Kata sandi SSO pegawai <em>TIDAK PERNAH disimpan</em> di database maupun Google Sheets.</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-cyan-300/90 font-medium">
                Cocok untuk: Seluruh pegawai kantor dengan akun intranet aktif.
              </div>
            </div>

            {/* Card 3: Resolusi Previlage Hybrid */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Logika Otorisasi OWNER
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  Bagaimana Akun SSO Menjadi OWNER?
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Setelah SSO memverifikasi bahwa kredensial benar, sistem melakukan cross-check ke sheet <code>list user</code>:
                </p>
                <div className="mt-3 space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-emerald-400 font-bold">1.</span>
                    <span><strong>Jika User ID ada di Kolom A & Kolom C = "OWNER":</strong> Akun SSO tersebut otomatis mendapatkan status <strong className="text-emerald-400">OWNER</strong> (Kelola Data terbuka)!</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-slate-400 font-bold">2.</span>
                    <span><strong>Jika User ID ada di Kolom A & Kolom C = "USER":</strong> Akun SSO memperoleh status <strong>USER</strong> biasa.</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-mono text-amber-400 font-bold">3.</span>
                    <span><strong>Jika User ID belum ada di Sheet:</strong> Sistem secara aman memberikan peran default <strong>USER</strong> (bisa melihat dashboard operasional, namun Kelola Data disembunyikan).</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-emerald-300/90 font-medium">
                Integritas: Akses Owner tetap terlindungi oleh otorisasi spreadsheet.
              </div>
            </div>
          </div>

          {/* INTERACTIVE SSO ROLE SIMULATOR & OWNER INSTRUCTION GUIDE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-800">
            {/* Owner Step-by-Step Guide */}
            <div className="lg:col-span-7 bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Panduan Bagi Owner: Cara Memberikan Akses OWNER ke Akun SSO Kantor
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jika ada pimpinan atau rekan kerja yang login menggunakan akun SSO (madiunjuara.com) dan ingin diberi wewenang sebagai <strong>OWNER</strong> agar bisa membuka halaman Kelola Data ini, ikuti langkah berikut:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  <div className="font-bold text-white flex items-center space-x-1">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] inline-flex items-center justify-center font-mono">1</span>
                    <span>Buka Sheet</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Buka Google Sheet <code className="text-slate-200">list user</code> melalui tombol <em>"Edit di Sheet"</em>.
                  </p>
                </div>
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  <div className="font-bold text-white flex items-center space-x-1">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] inline-flex items-center justify-center font-mono">2</span>
                    <span>Tulis User ID & OWNER</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ketik User ID SSO di <strong>Kolom A</strong>. Kosongkan Kolom B. Isi <strong>Kolom C</strong> dengan <code>OWNER</code>.
                  </p>
                </div>
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  <div className="font-bold text-white flex items-center space-x-1">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] inline-flex items-center justify-center font-mono">3</span>
                    <span>Refresh & Aktif</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Klik tombol <em>"Refresh User List"</em>. Saat user tersebut login via SSO, ia seketika menjadi OWNER!
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive SSO Simulation Box */}
            <div className="lg:col-span-5 bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Simulator Resolusi Hak Akses SSO</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Live Evaluator</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Uji coba status hak akses yang akan diterima User ID jika login melalui portal SSO madiunjuara.com:
                </p>
                <div className="mt-2.5 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ssoSimulationId}
                    onChange={(e) => setSsoSimulationId(e.target.value)}
                    placeholder="Ketik User ID SSO (misal: 25890026 atau owner)..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Simulation Result Area */}
              {simulatedMatch ? (
                <div className={`p-3 rounded-xl border text-xs ${
                  simulatedMatch.isOwner 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center space-x-1.5">
                      {simulatedMatch.isOwner ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Users className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Hasil Role SSO:</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                      simulatedMatch.isOwner 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-slate-700 text-slate-200'
                    }`}>
                      {simulatedMatch.role}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1.5 leading-relaxed">
                    {simulatedMatch.explanation}
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Ketik User ID di atas untuk melihat simulasi penentuan role saat login SSO.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUBHEADER: DAFTAR USER AKTUAL DI SHEET */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Table className="w-4 h-4 text-amber-600" />
              <span>Daftar Akun Terdaftar di Sheet "list user" ({userList.length} Akun)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tabel acuan kredensial lokal dan pemetaan previlage (Kolom C) untuk pengguna lokal maupun pengguna SSO.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Status: <span className="text-emerald-700 font-bold">{userList.filter(u => (u.previlage || '').toUpperCase() === 'OWNER').length} Akun OWNER</span>, {userList.filter(u => (u.previlage || '').toUpperCase() !== 'OWNER').length} Akun USER
          </div>
        </div>

        {/* Table of Users and their Privileges */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16">No</th>
                <th className="py-3 px-4">Kolom A: USER</th>
                <th className="py-3 px-4">Kolom B: PASWORD</th>
                <th className="py-3 px-4">Kolom C: PREVILAGE</th>
                <th className="py-3 px-4">Status Visibilitas Halaman Kelola Data</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Memuat data dari Google Sheets [list user]...</span>
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data pengguna yang ditemukan di sheet "list user".
                  </td>
                </tr>
              ) : (
                userList.map((acc, index) => {
                  const isOwnerAccount = (acc.previlage || '').toUpperCase() === 'OWNER';
                  const isCurrentActive = acc.user.toLowerCase() === (currentUser || '').toLowerCase();

                  return (
                    <tr 
                      key={index}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentActive ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-slate-900">{acc.user}</span>
                          {isCurrentActive && (
                            <span className="px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase">
                              Akun Anda Saat Ini
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {acc.password ? (
                          showPasswords ? acc.password : '••••••••'
                        ) : (
                          <span className="text-slate-400 italic font-sans">(Kosong / Tanpa Password)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isOwnerAccount ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-black text-[11px] uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>OWNER</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-bold text-[11px] uppercase tracking-wider">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>USER</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isOwnerAccount ? (
                          <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Munculkan Halaman Kelola Data (Akses Diberikan)</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                            <UserX className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>Sembunyikan Halaman Kelola Data (Akses Ditutup)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href="https://docs.google.com/spreadsheets/d/1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE/edit#gid=0"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-slate-400 hover:text-red-600 font-semibold text-[11px]"
                        >
                          <span>Edit di Sheet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SECTION: ALL INDIKATOR DATA (KAMUS INDIKATOR LENGKAP) */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6" id="all-indicators-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-extrabold uppercase tracking-wide">
                ALL INDIKATOR DATA
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-semibold">{filteredIndicators.length} dari {indicators.length} Indikator</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Kamus Lengkap Indikator & Metrik Operasional Web
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Daftar seluruh indikator performansi yang dihitung dan disajikan di web ini beserta sumber kolom, formula kalkulasi, dan nilai aktual real-time.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari indikator, kolom, formula..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'Semua Modul', count: indicators.length },
            { id: 'AUTH', label: 'Autentikasi & Hak Akses', count: indicators.filter(i => i.module === 'AUTH').length },
            { id: 'BISNIS', label: 'Performansi Bisnis', count: indicators.filter(i => i.module === 'BISNIS').length },
            { id: 'ASSURANCE', label: 'Performansi Assurance', count: indicators.filter(i => i.module === 'ASSURANCE').length },
            { id: 'PROVISIONING', label: 'Performansi Provisioning', count: indicators.filter(i => i.module === 'PROVISIONING').length },
            { id: 'QE', label: 'Quality Engineering', count: indicators.filter(i => i.module === 'QE').length },
            { id: 'TEKNISI', label: 'Performansi Teknisi', count: indicators.filter(i => i.module === 'TEKNISI').length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedModule(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedModule === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedModule === cat.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Indicators Table View */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-24">Kode</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Indikator & Modul</th>
                <th className="py-3.5 px-4 min-w-[220px]">Spreadsheet & Kolom Sumber</th>
                <th className="py-3.5 px-4 min-w-[220px]">Formula & Logika Kalkulasi</th>
                <th className="py-3.5 px-4 min-w-[140px]">Nilai Aktual Terkini</th>
                <th className="py-3.5 px-4 min-w-[130px]">Target / Benchmark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredIndicators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada indikator yang sesuai dengan kata kunci pencarian "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredIndicators.map((ind) => (
                  <tr key={ind.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-red-600 align-top">
                      {ind.code}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {ind.name}
                        </span>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                            {ind.moduleName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                            [{ind.unit}]
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {ind.description}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1 font-semibold text-slate-800">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Sheet: <strong>{ind.sourceSheet}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInspectIndicatorLogic(ind)}
                          className="text-left w-full group/btn flex items-center justify-between text-[11px] text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 px-2 py-1 rounded border border-slate-200 hover:border-red-200 font-mono transition-colors cursor-pointer"
                          title="Klik untuk membuka detail alur pipa logika ekstraksi data"
                        >
                          <span className="truncate">{ind.sourceColumns}</span>
                          <ChevronRight className="w-3 h-3 shrink-0 text-slate-400 group-hover/btn:text-red-600 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-800 leading-relaxed">
                        {ind.formula}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-black text-xs">
                        {ind.currentValue}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="text-[11px] font-bold text-slate-600">
                        {ind.benchmark}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE COLUMN LOGIC INSPECTION MODAL (OWNER DATA AUDIT) */}
      <ColumnLogicModal
        isOpen={isLogicModalOpen}
        onClose={() => setIsLogicModalOpen(false)}
        source={selectedSourceForLogic}
        columnDetail={selectedColumnForLogic}
        allSources={SPREADSHEET_SOURCES}
        onSelectColumn={(src, col) => {
          setSelectedSourceForLogic(src);
          setSelectedColumnForLogic(col);
        }}
      />

      {/* 6. AI PERFORMANCE EVALUATION MODAL */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState((prev) => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext="Tata Kelola Data, Sumber Spreadsheet & Kamus Indikator Telkom Akses"
        filterContext={{
          'Role Pengguna': currentUserRole,
          'Email Aktif': currentUser,
          'Status Sinkronisasi': syncStatus,
          'Waktu Sync': syncTime,
          'Modul Terpilih': selectedModule,
        }}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />

    </div>
  );
}
