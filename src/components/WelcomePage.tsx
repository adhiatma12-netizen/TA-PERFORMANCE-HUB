import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  ShieldCheck,
  UserPlus,
  ClipboardCheck,
  Users,
  Database,
  Sparkles,
  ArrowRight,
  LogOut,
  Layers,
} from 'lucide-react';
import { useLanguage, HeaderLanguageSwitcher } from '../lib/i18n';

interface WelcomePageProps {
  currentUser: string;
  currentUserRole: string;
  onProceed: () => void;
  onSelectModule?: (moduleId: string) => void;
  onLogout: () => void;
}

export default function WelcomePage({
  currentUser,
  currentUserRole,
  onProceed,
  onSelectModule,
  onLogout,
}: WelcomePageProps) {
  const isOwner = (currentUserRole || '').trim().toUpperCase() === 'OWNER';
  const { t, language } = useLanguage();

  const isEn = language === 'en';

  const modules = [
    {
      id: 'business',
      title: isEn ? 'Business Performance' : 'Performansi Bisnis',
      category: isEn ? 'Financial & KPI' : 'Finansial & KPI',
      icon: BarChart3,
      themeColor: 'emerald',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      summary: isEn
        ? 'Key financial indicator monitoring for Branch Budget Committee including Revenue realization, COGS, Gross Profit Margin by portfolio and program.'
        : 'Monitoring indikator finansial kunci Budget Commite Branch meliputi realisasi Revenue, COGS, Gross Profit Margin per portofolio dan program kerja.',
      tags: isEn
        ? ['Revenue & COGS', 'Gross Margin', 'Budget Committee', 'Period Filter']
        : ['Revenue & COGS', 'Gross Margin', 'Budget Commite', 'Filter Periode'],
    },
    {
      id: 'assurance',
      title: isEn ? 'Assurance Performance' : 'Performansi Assurance',
      category: isEn ? 'Network Stability' : 'Stabilitas Jaringan',
      icon: ShieldCheck,
      themeColor: 'blue',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      summary: isEn
        ? 'Monitoring customer trouble ticket reliability, Service Level Agreement (SLA) compliance, Mean Time to Repair (MTTR), and ticket backlog trends.'
        : 'Pemantauan kehandalan tiket gangguan pelanggan, pemenuhan Service Level Agreement (SLA), waktu rata-rata perbaikan (MTTR), serta tren backlog tiket.',
      tags: isEn
        ? ['SLA Compliance', 'MTTR (Hours)', 'Ticket Backlog', 'Product Spread']
        : ['SLA Compliance', 'MTTR (Jam)', 'Backlog Tiket', 'Sebaran Produk'],
    },
    {
      id: 'provisioning',
      title: isEn ? 'Provisioning Performance' : 'Performansi Provisioning',
      category: isEn ? 'New Installations' : 'Pasang Baru',
      icon: UserPlus,
      themeColor: 'violet',
      iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
      summary: isEn
        ? 'Oversight of new IndiHome & Indibizz installations fulfillment, sector performance analysis, Kpro obstacle statuses, and interactive coordinate map.'
        : 'Pengawasan pemenuhan instalasi pasang baru IndiHome & segmen Indibizz, analisis performa sektor, status Kpro, dan peta interaktif koordinat instalasi.',
      tags: isEn
        ? ['PSB Realization', 'Order Lead Time', 'Kpro Status', 'Coordinate Map']
        : ['Realisasi PSB', 'Lead Time Order', 'Status Kpro', 'Peta Koordinat'],
    },
    {
      id: 'qe',
      title: isEn ? 'QE Performance' : 'Performansi QE',
      category: isEn ? 'Safety & Quality' : 'Safety & Mutu K3',
      icon: ClipboardCheck,
      themeColor: 'amber',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      summary: isEn
        ? 'Quality Engineering audits & field HSE compliance, material standardization adherence (cable/ODP/closure), and Preventive Maintenance execution.'
        : 'Audit Quality Engineering & kepatuhan K3 lapangan, kesesuaian standardisasi material (kabel/ODP/closure), dan pelaksanaan Preventive Maintenance.',
      tags: isEn
        ? ['QE Quality Score', 'Field HSE Patrol', 'Material Standards', 'Preventive Maint.']
        : ['Skor QE Mutu', 'Patroli K3 Lapangan', 'Standar Material', 'Preventive Maint.'],
    },
    {
      id: 'technician',
      title: isEn ? 'Technician Performance' : 'Performansi Teknisi',
      category: isEn ? 'Field Workforce' : 'Produktivitas Personel',
      icon: Users,
      themeColor: 'rose',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      summary: isEn
        ? 'Field technician productivity evaluation, regular & mass outage ticket tracking, ONT underspec ratio, performance leaderboard, and customer satisfaction.'
        : 'Evaluasi produktivitas teknisi lapangan, tracking penyelesaian tiket reguler & gamas, rasio ONT underspec, leaderboard, serta kepuasan pelanggan.',
      tags: isEn
        ? ['Productivity Score', 'Leaderboard', 'Regular & Outage Tickets', 'ONT & Underspec']
        : ['Skor Produktivitas', 'Leaderboard', 'Tiket Reguler & Gamas', 'ONT & Underspec'],
    },
    {
      id: 'kelola-data',
      title: isEn ? 'Spreadsheet Data Management' : 'Kelola Data Spreadsheet',
      category: isOwner ? (isEn ? 'Owner Access' : 'Akses Owner') : (isEn ? 'Restricted' : 'Restricted'),
      icon: Database,
      themeColor: 'slate',
      iconBg: isOwner ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      badgeBg: isOwner ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200',
      summary: isEn
        ? 'Direct synchronization hub with official Google Spreadsheets (Master Endstate, GD Indibizz, Rekap QE) and user permissions management.'
        : 'Pusat integrasi langsung dengan Google Spreadsheet resmi (Master Endstate, GD Indibizz, Rekap QE) dan manajemen hak akses pengguna.',
      tags: isEn
        ? ['Live Sync Sheets', 'Header Schema', 'User Access', 'Connection Status']
        : ['Live Sync Sheets', 'Struktur Header', 'Hak Akses User', 'Status Koneksi'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="welcome-page">
      {/* Top Header Bar */}
      <header className="bg-slate-950 text-white border-b border-slate-900 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 bg-slate-900 border border-slate-800 rounded-full overflow-hidden shadow-md shrink-0">
              <img
                src="/src/assets/images/telkom_akses_logo_1784023194788.jpg"
                alt="Telkom Akses Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-sans font-black tracking-tight text-base text-white">TELKOM</span>
                <span className="font-sans tracking-widest text-base text-red-500 font-bold">AKSES</span>
                <span className="px-1.5 py-0.5 bg-red-950/80 text-red-400 border border-red-900/40 rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                  HUB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">
                Performance Control Hub
              </p>
            </div>
          </div>

          {/* User Status, Language Switcher & Logout */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Language Switcher with Flags */}
            <HeaderLanguageSwitcher variant="dark" />

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 font-medium">{t('user', 'User')}:</span>
              <span className="text-white font-bold max-w-[140px] truncate" title={currentUser}>
                {currentUser}
              </span>
              {currentUserRole && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    isOwner
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {currentUserRole}
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900/90 text-red-400 hover:text-red-200 border border-red-800/50 rounded-xl font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
              title={t('logoutTooltip', 'Keluar dari akun')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout', 'Keluar')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6 sm:pt-8 pb-20 sm:pb-24 space-y-6">
        {/* Top Welcome Title Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs text-center">
          <div className="space-y-3 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>{t('welcomePortalBadge', 'Portal Terpadu Monitoring Performansi')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {t('welcomeTitle', 'Selamat Datang di Telkom Akses Performance Control HUB')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {t('welcomeDescription', 'Platform terintegrasi dengan kapabilitas analisa berbasis AI untuk memudahkan monitoring serta evaluasi performansi operasional Telkom Akses secara akurat dan komprehensif.')}
            </p>
          </div>
        </div>

        {/* 6 Clean Module Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-red-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {t('welcomeScopeTitle', 'Daftar Halaman & Ruang Lingkup')}
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {t('welcomePageCount', '6 Halaman')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, idx) => {
              const IconComponent = mod.icon;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.04 * idx }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  onClick={() => {
                    if (onSelectModule) {
                      onSelectModule(mod.id);
                    } else {
                      onProceed();
                    }
                  }}
                >
                  <div className="space-y-3">
                    {/* Header: Icon & Category */}
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${mod.iconBg}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${mod.badgeBg}`}>
                        {mod.category}
                      </span>
                    </div>

                    {/* Title & Short Summary */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                        {mod.summary}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {mod.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded text-[10px] font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Direct CTA */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {t('welcomeExploreTitle', 'Mulai Eksplorasi Dashboard')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('welcomeExploreDesc', 'Klik tombol di samping untuk langsung masuk ke halaman utama performansi.')}
            </p>
          </div>

          <button
            onClick={onProceed}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-98 flex items-center justify-center space-x-2 cursor-pointer shrink-0"
            id="btn-next-bottom"
          >
            <span>{t('welcomeProceedBtn', 'Lanjut ke Halaman Utama')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Frozen Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 sm:py-3.5 text-center text-xs text-slate-500 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]" id="welcome-frozen-footer">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>{t('rightsReserved', '© 2026 Adhiatma21 Creative Studio - Service Area Performance Dashboard. All rights reserved.')}</p>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>{t('serviceAreaDashboard', 'Service Area Performance Dashboard')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

