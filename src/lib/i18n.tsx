import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  isId: boolean;
  isEn: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Brand & Header
    brandTitleAkses: 'AKSES',
    brandTitleTelkom: 'TELKOM',
    brandSub: 'Performance Control Hub',
    home: 'Beranda',
    backToWelcome: 'Kembali ke Halaman Sambutan (Welcome Page)',
    pdfResume: 'PDF Resume',
    pdfResumeTooltip: 'Download PDF Resume Performansi (Sesuai Halaman Aktif)',
    user: 'User',
    logout: 'Keluar',
    logoutTooltip: 'Keluar dari Akun (Logout)',
    selectLanguage: 'Pilih Bahasa',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
    uptime: 'Uptime',
    stoConnection: 'Koneksi STO',
    refreshData: 'Segarkan Data',
    loading: 'Memuat...',
    syncSuccess: 'Sinkronisasi Live Berhasil',
    syncError: 'Gagal Sinkron',
    downloadPdfResume: 'Download PDF Resume',

    // Sidebar
    pageMenu: 'Menu Halaman',
    hideMenu: 'Sembunyikan Menu (Hide)',
    unhideMenu: 'Tampilkan Menu Penuh (Unhide)',
    showSubpages: 'Tampilkan Sub Halaman (+)',
    hideSubpages: 'Sembunyikan Sub Halaman (-)',
    nocLive: 'NOC Live',
    telkomAkses: 'Telkom Akses',

    // Menu 1: Bisnis
    menuBusiness: 'Performansi Bisnis',
    menuBusinessSub: 'Budget Commite Branch',
    subBusinessKpi: 'Ringkasan & KPI Finansial',
    subBusinessTrend: 'Trend Finansial Perbulan',
    subBusinessPortfolio: 'Detail Portofolio & Program',

    // Menu 2: Assurance
    menuAssurance: 'Performansi Assurance',
    menuAssuranceSub: 'Tiket & Penanganan Gangguan',
    subAssuranceTicketPerf: 'Performansi Tiket',
    subAssuranceOperations: 'Evaluasi Solusi Tiket',
    subAssuranceTicketLogs: 'Detail Transaksi & Log Tiket',
    subAssuranceKpiAssurance: 'KPI ASSURANCE',
    subAssuranceKpiIoan: 'KPI IOAN',

    // Menu 3: Provisioning
    menuProvisioning: 'Performansi Provisioning',
    menuProvisioningSub: 'Pasang Baru & Kpro',
    subProvisioningSector: 'Kinerja Sektor & Bulanan',
    subProvisioningTable: 'Trend Bulanan & Kpro',
    subProvisioningMap: 'Peta Koordinat Realisasi',

    // Menu 4: QE
    menuQe: 'Performansi QE',
    menuQeSub: 'Safety & Mutu K3 Service Area',
    subQeMain: 'Performansi & Tren Grafik',
    subQeDetail: 'Detail Transaksi & Rekap',

    // Menu 5: Teknisi
    menuTechnician: 'Performansi Teknisi',
    menuTechnicianSub: 'Produktivitas & Leaderboard',
    subTechnicianLeaderboard: 'Leaderboard & Profil Teknisi',
    subTechnicianProgress: 'Tracking Progres Harian',

    // Menu 6: Kelola Data
    menuKelolaData: 'Kelola Data',
    menuKelolaDataSub: 'Link Spreadsheet & Sinkronisasi',
    subKelolaDataSheets: 'Daftar Link Spreadsheet',
    subKelolaDataIndicators: 'Kamus Data & Indikator',
    subKelolaDataUsers: 'Referensi Hak Akses User',

    // Stage Headers
    stageBusinessKpi: '📈 Performansi Bisnis - Ringkasan & KPI Finansial',
    stageBusinessTrend: '📊 Performansi Bisnis - Trend Finansial Perbulan',
    stageBusinessPortfolio: '💼 Performansi Bisnis - Detail Portofolio & Program',
    stageAssuranceTicketPerf: '🛠️ Ringkasan & Agregasi Tiket',
    stageAssuranceOperations: '🛠️ Evaluasi Solusi Tiket',
    stageAssuranceTicketLogs: '📋 Detail Transaksi & Log Tiket',
    stageAssuranceKpiIoan: '🏆 Performansi Assurance - KPI IOAN',
    stageAssuranceKpiAssurance: '🏆 Performansi Assurance - KPI ASSURANCE',
    stageProvisioning: '📦 Performansi Provisioning',
    stageQe: '🛡️ Evaluasi QE Service Area',
    stageTechnician: '👷 Produktivitas, Rating & Leaderboard Teknisi Lapangan',
    stageKelolaData: '🗄️ Kelola Data, Link Spreadsheet & All Indikator Data',

    // Welcome Page
    welcomePortalBadge: 'Portal Terpadu Monitoring Performansi',
    welcomeTitle: 'Selamat Datang di Telkom Akses Performance Control HUB',
    welcomeDescription: 'Platform terintegrasi dengan kapabilitas analisa berbasis AI untuk memudahkan monitoring serta evaluasi performansi operasional Telkom Akses secara akurat dan komprehensif.',
    welcomeScopeTitle: 'Daftar Halaman & Ruang Lingkup',
    welcomePageCount: '6 Halaman',
    welcomeExploreTitle: 'Mulai Eksplorasi Dashboard',
    welcomeExploreDesc: 'Klik tombol di samping untuk langsung masuk ke halaman utama performansi.',
    welcomeProceedBtn: 'Lanjut ke Halaman Utama',
    
    // Welcome Modules
    welcomeModBusinessCat: 'Finansial & KPI',
    welcomeModBusinessSummary: 'Monitoring indikator finansial kunci Budget Commite Branch meliputi realisasi Revenue, COGS, Gross Profit Margin per portofolio dan program kerja.',
    welcomeModAssuranceCat: 'Stabilitas Jaringan',
    welcomeModAssuranceSummary: 'Pemantauan kehandalan tiket gangguan pelanggan, pemenuhan Service Level Agreement (SLA), waktu rata-rata perbaikan (MTTR), serta tren backlog tiket.',
    welcomeModProvisioningCat: 'Pasang Baru',
    welcomeModProvisioningSummary: 'Monitoring efektivitas pemenuhan pasang baru (PSB), sebaran geografis per sektor STO, tingkat kendala proyek (Kpro), dan peta koordinat.',
    welcomeModQeCat: 'Mutu & Keselamatan',
    welcomeModQeSummary: 'Audit berkala Quality Engineering, kepatuhan Alat Pelindung Diri (APD/K3), standarisasi instalasi fisik, dan tracking temuan lapangan.',
    welcomeModTechnicianCat: 'SDM Lapangan',
    welcomeModTechnicianSummary: 'Peringkat produktivitas harian, rasio keberhasilan penanganan gangguan, poin kontribusi, serta analitik beban kerja teknisi service area.',
    welcomeModKelolaDataCat: 'Administrasi & Integrasi',
    welcomeModKelolaDataSummary: 'Pusat integrasi langsung dengan Google Spreadsheet resmi (Master Endstate, GD Indibizz, Rekap QE) dan manajemen hak akses pengguna.',

    // Common & Footer
    rightsReserved: '© 2026 Adhiatma21 Creative Studio - Service Area Performance Dashboard. All rights reserved.',
    privacyPolicy: 'Kebijakan Privasi',
    sopManual: 'Panduan SOP',
    verifiedSystem: '● Sistem Terverifikasi Aman & Real-Time',
    serviceAreaDashboard: 'Service Area Performance Dashboard',

    // Filter & Actions
    filterRegional: 'Filter Wilayah',
    filterMonth: 'Pilih Bulan',
    filterYear: 'Pilih Tahun',
    allRegions: 'Semua Regional',
    search: 'Cari data...',
    downloadExcel: 'Download Excel',
    aiAnalysis: 'Analisa Berbasis AI',
    status: 'Status',
    achieved: 'Tercapai',
    notAchieved: 'Belum Tercapai',
    action: 'Aksi',
    close: 'Tutup',
    save: 'Simpan',
    cancel: 'Batal',
    revenue: 'Realisasi Revenue',
    cogs: 'Realisasi COGS',
    grossProfit: 'Gross Profit',
    margin: 'Margin',
    target: 'Target',
    achievement: 'Pencapaian',
    totalTickets: 'Total Tiket',
    openTickets: 'Tiket Open',
    closedTickets: 'Tiket Selesai',
    mttrHours: 'MTTR Rata-rata',
    slaCompliance: 'Kepatuhan SLA',
    totalProvisioning: 'Total Pasang Baru',
    kproCount: 'Kendala Kpro',
    safetyScore: 'Skor K3 Safety',
    leaderboard: 'Peringkat Teknisi',
  },
  en: {
    // Brand & Header
    brandTitleAkses: 'AKSES',
    brandTitleTelkom: 'TELKOM',
    brandSub: 'Performance Control Hub',
    home: 'Home',
    backToWelcome: 'Back to Welcome Page',
    pdfResume: 'PDF Summary',
    pdfResumeTooltip: 'Download Performance PDF Summary (Active Page)',
    user: 'User',
    logout: 'Logout',
    logoutTooltip: 'Sign Out of Account',
    selectLanguage: 'Select Language',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
    uptime: 'Uptime',
    stoConnection: 'STO Connection',
    refreshData: 'Refresh Data',
    loading: 'Loading...',
    syncSuccess: 'Live Sync Successful',
    syncError: 'Sync Failed',
    downloadPdfResume: 'Download PDF Summary',

    // Sidebar
    pageMenu: 'Page Menu',
    hideMenu: 'Hide Menu',
    unhideMenu: 'Unhide / Show Full Menu',
    showSubpages: 'Show Sub-pages (+)',
    hideSubpages: 'Hide Sub-pages (-)',
    nocLive: 'NOC Live',
    telkomAkses: 'Telkom Akses',

    // Menu 1: Bisnis
    menuBusiness: 'Business Performance',
    menuBusinessSub: 'Branch Budget Committee',
    subBusinessKpi: 'Financial Summary & KPI',
    subBusinessTrend: 'Monthly Financial Trend',
    subBusinessPortfolio: 'Portfolio & Program Details',

    // Menu 2: Assurance
    menuAssurance: 'Assurance Performance',
    menuAssuranceSub: 'Tickets & Incident Handling',
    subAssuranceTicketPerf: 'Ticket Performance',
    subAssuranceOperations: 'Ticket Solution Evaluation',
    subAssuranceTicketLogs: 'Transaction Details & Ticket Logs',
    subAssuranceKpiAssurance: 'ASSURANCE KPI',
    subAssuranceKpiIoan: 'IOAN KPI',

    // Menu 3: Provisioning
    menuProvisioning: 'Provisioning Performance',
    menuProvisioningSub: 'New Installs & Kpro',
    subProvisioningSector: 'Sector & Monthly Performance',
    subProvisioningTable: 'Monthly Trend & Kpro',
    subProvisioningMap: 'Realization Coordinates Map',

    // Menu 4: QE
    menuQe: 'QE Performance',
    menuQeSub: 'Safety & HSE Quality Service Area',
    subQeMain: 'Performance & Trend Charts',
    subQeDetail: 'Transaction Details & Recap',

    // Menu 5: Teknisi
    menuTechnician: 'Technician Performance',
    menuTechnicianSub: 'Productivity & Leaderboard',
    subTechnicianLeaderboard: 'Leaderboard & Tech Profile',
    subTechnicianProgress: 'Daily Progress Tracking',

    // Menu 6: Kelola Data
    menuKelolaData: 'Data Management',
    menuKelolaDataSub: 'Spreadsheet Links & Sync',
    subKelolaDataSheets: 'Spreadsheet Links List',
    subKelolaDataIndicators: 'Data Dictionary & Indicators',
    subKelolaDataUsers: 'User Access Rights Reference',

    // Stage Headers
    stageBusinessKpi: '📈 Business Performance - Financial Summary & KPI',
    stageBusinessTrend: '📊 Business Performance - Monthly Financial Trend',
    stageBusinessPortfolio: '💼 Business Performance - Portfolio & Program Details',
    stageAssuranceTicketPerf: '🛠️ Assurance Performance - Ticket Summary & Aggregation',
    stageAssuranceOperations: '🛠️ Assurance Performance - Ticket Solution Evaluation',
    stageAssuranceTicketLogs: '📋 Assurance Performance - Transaction Details & Logs (2,649 Tickets)',
    stageAssuranceKpiIoan: '🏆 Assurance Performance - IOAN KPI',
    stageAssuranceKpiAssurance: '🏆 Assurance Performance - ASSURANCE KPI',
    stageProvisioning: '📦 IndiHome New Installation Performance (Provisioning)',
    stageQe: '🛡️ Service Area QE Evaluation',
    stageTechnician: '👷 Field Technician Productivity, Rating & Leaderboard',
    stageKelolaData: '🗄️ Data Management, Spreadsheet Links & Indicators',

    // Welcome Page
    welcomePortalBadge: 'Unified Performance Monitoring Portal',
    welcomeTitle: 'Welcome to Telkom Akses Performance Control HUB',
    welcomeDescription: 'Integrated platform featuring AI-powered analytics capabilities to streamline accurate, comprehensive operational performance monitoring for Telkom Akses.',
    welcomeScopeTitle: 'Directory of Pages & Functional Scope',
    welcomePageCount: '6 Pages',
    welcomeExploreTitle: 'Start Exploring Dashboard',
    welcomeExploreDesc: 'Click the button beside to enter the main performance dashboard immediately.',
    welcomeProceedBtn: 'Proceed to Main Page',
    
    // Welcome Modules
    welcomeModBusinessCat: 'Financial & KPI',
    welcomeModBusinessSummary: 'Monitoring key financial indicators of Branch Budget Committee including Revenue realization, COGS, Gross Profit Margin per portfolio and work program.',
    welcomeModAssuranceCat: 'Network Stability',
    welcomeModAssuranceSummary: 'Monitoring customer trouble ticket reliability, Service Level Agreement (SLA) compliance, Mean Time to Repair (MTTR), and ticket backlog trends.',
    welcomeModProvisioningCat: 'New Installs',
    welcomeModProvisioningSummary: 'Monitoring new service fulfillment (PSB) effectiveness, geographic distribution by STO sector, project impediment rates (Kpro), and coordinate maps.',
    welcomeModQeCat: 'Quality & Safety',
    welcomeModQeSummary: 'Regular Quality Engineering audits, Personal Protective Equipment (PPE/HSE) compliance, physical installation standards, and field findings tracking.',
    welcomeModTechnicianCat: 'Field Workforce',
    welcomeModTechnicianSummary: 'Daily productivity rankings, resolution success rates, contribution points, and service area technician workload analytics.',
    welcomeModKelolaDataCat: 'Admin & Integration',
    welcomeModKelolaDataSummary: 'Direct integration hub with official Google Spreadsheets (Master Endstate, GD Indibizz, Rekap QE) and user access management.',

    // Common & Footer
    rightsReserved: '© 2026 Adhiatma21 Creative Studio - Service Area Performance Dashboard. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    sopManual: 'SOP Manual',
    verifiedSystem: '● Live Verified Secure System',
    serviceAreaDashboard: 'Service Area Performance Dashboard',

    // Filter & Actions
    filterRegional: 'Regional Filter',
    filterMonth: 'Select Month',
    filterYear: 'Select Year',
    allRegions: 'All Regionals',
    search: 'Search data...',
    downloadExcel: 'Download Excel',
    aiAnalysis: 'AI-Powered Analysis',
    status: 'Status',
    achieved: 'Achieved',
    notAchieved: 'Not Achieved',
    action: 'Action',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    revenue: 'Revenue Realization',
    cogs: 'COGS Realization',
    grossProfit: 'Gross Profit',
    margin: 'Margin',
    target: 'Target',
    achievement: 'Achievement',
    totalTickets: 'Total Tickets',
    openTickets: 'Open Tickets',
    closedTickets: 'Closed Tickets',
    mttrHours: 'Average MTTR',
    slaCompliance: 'SLA Compliance',
    totalProvisioning: 'Total New Installs',
    kproCount: 'Kpro Obstacles',
    safetyScore: 'Safety & Quality Score',
    leaderboard: 'Technician Ranking',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
  isId: true,
  isEn: false,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('telkom_akses_app_language');
      if (saved === 'en' || saved === 'id') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'id'; // default Bahasa Indonesia
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('telkom_akses_app_language', lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language] || translations.id;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to id if en is missing key
    if (language === 'en' && translations.id[key]) {
      return translations.id[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isId: language === 'id',
        isEn: language === 'en',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

/**
 * High-definition SVG Flag: Indonesia (Merah Putih)
 */
export const IndonesiaFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={`inline-block rounded-xs overflow-hidden shadow-2xs border border-slate-300/40 shrink-0 ${className}`}
    aria-label="Bendera Indonesia"
  >
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#e70011" d="M0 0h640v240H0z"/>
      <path fill="#ffffff" d="M0 240h640v240H0z"/>
    </g>
  </svg>
);

/**
 * High-definition SVG Flag: United Kingdom / English (Union Jack)
 */
export const UkFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={`inline-block rounded-xs overflow-hidden shadow-2xs border border-slate-300/40 shrink-0 ${className}`}
    aria-label="English Flag"
  >
    <path fill="#012169" d="M0 0h640v480H0z"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"/>
    <path fill="#C8102E" d="m424 288 153 112h63v-15L484 272zm-8-96 161-120v-19l-187 139zm-136 96L119 400v19l187-139zm8-96L127 80H64v15l156 117z"/>
    <path fill="#FFF" d="M240 0v480h160V0zM0 160v160h640V160z"/>
    <path fill="#C8102E" d="M267 0v480h106V0zM0 187v106h640V187z"/>
  </svg>
);

/**
 * Header Language Switcher Component with flags
 * Includes both Indonesian and English options, highlighting the active selection
 */
export const HeaderLanguageSwitcher: React.FC<{ 
  variant?: 'dark' | 'light';
  compact?: boolean;
}> = ({ variant = 'dark', compact = false }) => {
  const { language, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div 
      className={`inline-flex items-center p-0.5 rounded-xl border transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-slate-300 shadow-inner' 
          : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
      }`}
      role="group"
      aria-label="Language Selector"
    >
      {/* Indonesia Option */}
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'id'
            ? isDark
              ? 'bg-red-600 text-white shadow-xs font-black'
              : 'bg-red-600 text-white shadow-xs font-black'
            : isDark
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Ubah ke Bahasa Indonesia"
        id="btn-lang-id"
      >
        <IndonesiaFlag className="w-4 h-2.5" />
        <span className={compact ? 'text-[11px]' : 'text-xs'}>ID</span>
      </button>

      {/* English Option */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'en'
            ? isDark
              ? 'bg-red-600 text-white shadow-xs font-black'
              : 'bg-red-600 text-white shadow-xs font-black'
            : isDark
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Switch to English"
        id="btn-lang-en"
      >
        <UkFlag className="w-4 h-2.5" />
        <span className={compact ? 'text-[11px]' : 'text-xs'}>EN</span>
      </button>
    </div>
  );
};
