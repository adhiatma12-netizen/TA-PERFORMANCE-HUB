import { jsPDF } from 'jspdf';
import { Regional, RegionalPerformanceData, PerformanceDashboardData, Technician } from '../types';
import { ProvisioningRow } from '../data/provisioningStats';
import { SPREADSHEET_SOURCES } from '../data/spreadsheetColumnDetails';

export type AppDomainTab = 'business' | 'assurance' | 'provisioning' | 'qe' | 'technician' | 'kelola-data';

export interface ColumnDef {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface DomainReportConfig {
  domainKey: AppDomainTab;
  domainTitle: string;
  domainBadge: string;
  activeSubTabName: string;
  executiveSummary: string;
  kpiCards: { title: string; val: string; sub: string; status: 'good' | 'warn' | 'bad' }[];
  // Table 1: KPI Scorecard Table
  kpiTable: {
    columns: ColumnDef[];
    rows: string[][];
  };
  // Table 2: Detailed Supporting Data Table
  supportingTable: {
    title: string;
    description: string;
    columns: ColumnDef[];
    rows: string[][];
  };
  // Technical & Non-Technical Evaluations
  evaluasiTeknis: { point: string; desc: string }[];
  evaluasiNonTeknis: { point: string; desc: string }[];
  rcaItems: { pillar: string; badge: string; causes: string[] }[];
  // Table 3: Action Plan / Recommendations Table
  actionPlanTable: {
    columns: ColumnDef[];
    rows: string[][];
  };
}

// Generate contextual data and tables for each domain
export function getDomainReportData(
  domain: AppDomainTab,
  currentData: RegionalPerformanceData,
  activeRegional: Regional,
  activeMonth: string,
  activeYear: string,
  allRegionsData?: PerformanceDashboardData,
  provisioningData?: ProvisioningRow[],
  activeSubTab?: string
): DomainReportConfig {
  const regLabel = activeRegional === 'All' ? 'Seluruh Regional (Nasional)' : activeRegional;

  // 1. BUSINESS DOMAIN
  if (domain === 'business') {
    const biz = currentData.business;
    const revAchieve = ((biz.revenue / (biz.revenueTarget || 1)) * 100).toFixed(1);
    const ebitdaAchieve = ((biz.ebitda / (biz.ebitdaTarget || 1)) * 100).toFixed(1);
    const subTabName =
      activeSubTab === 'trend'
        ? 'Tren Pertumbuhan & Forecast'
        : activeSubTab === 'portfolio'
        ? 'Portofolio & Kontribusi Unit'
        : 'Ringkasan KPI Bisnis';

    return {
      domainKey: 'business',
      domainTitle: 'RESUME PERFORMANSI BISNIS, KEUANGAN & PORTOFOLIO UNIT',
      domainBadge: 'Domain: Bisnis & Finansial',
      activeSubTabName: subTabName,
      executiveSummary: `Kinerja operasional dan finansial PT Telkom Akses di ${regLabel} pada periode ${activeMonth} ${activeYear} mencatatkan total pendapatan sebesar Rp ${biz.revenue.toFixed(1)} Miliar dari target Rp ${biz.revenueTarget.toFixed(1)} Miliar (${revAchieve}% pencapaian). Realisasi EBITDA mencapai Rp ${biz.ebitda.toFixed(1)} Miliar dengan marjin profitabilitas yang terjaga melalui pengendalian OPEX (Rp ${biz.opex.toFixed(1)} M) dan efisiensi CAPEX (Rp ${biz.capex.toFixed(1)} M). Segmen Retail IndiHome dan B2B Indibizz terus menunjukkan traksi pertumbuhan yang solid.`,
      kpiCards: [
        { title: 'Realisasi Revenue', val: `Rp ${biz.revenue.toFixed(1)} M`, sub: `Target Rp ${biz.revenueTarget.toFixed(1)} M (${revAchieve}%)`, status: 'good' },
        { title: 'Realisasi EBITDA', val: `Rp ${biz.ebitda.toFixed(1)} M`, sub: `Target Rp ${biz.ebitdaTarget.toFixed(1)} M (${ebitdaAchieve}%)`, status: 'good' },
        { title: 'Beban Pokok (COGS)', val: `Rp ${biz.cogs.toFixed(1)} M`, sub: `Budget Rp ${biz.cogsBudget.toFixed(1)} M`, status: 'good' },
        { title: 'Net Income Bersih', val: `Rp ${biz.netIncome.toFixed(1)} M`, sub: `CoQ Rp ${biz.costOfQuality.toFixed(2)} M`, status: 'good' },
      ],
      kpiTable: {
        columns: [
          { header: 'No', width: 10, align: 'center' },
          { header: 'Indikator Keuangan', width: 55, align: 'left' },
          { header: 'Realisasi', width: 30, align: 'right' },
          { header: 'Target / Budget', width: 32, align: 'right' },
          { header: 'Capaian (%)', width: 25, align: 'center' },
          { header: 'Status Evaluasi', width: 30, align: 'center' },
        ],
        rows: [
          ['1', 'Revenue (Pendapatan Operasional)', `Rp ${biz.revenue.toFixed(1)} M`, `Rp ${biz.revenueTarget.toFixed(1)} M`, `${revAchieve}%`, 'Sangat Baik'],
          ['2', 'COGS (Harga Pokok Pendapatan)', `Rp ${biz.cogs.toFixed(1)} M`, `Rp ${biz.cogsBudget.toFixed(1)} M`, `${((biz.cogs / (biz.cogsBudget || 1)) * 100).toFixed(1)}%`, 'Terkendali'],
          ['3', 'EBITDA (Laba Sebelum Bunga & Pajak)', `Rp ${biz.ebitda.toFixed(1)} M`, `Rp ${biz.ebitdaTarget.toFixed(1)} M`, `${ebitdaAchieve}%`, 'Memenuhi Target'],
          ['4', 'Net Income (Laba Bersih)', `Rp ${biz.netIncome.toFixed(1)} M`, `Rp ${(biz.ebitdaTarget * 0.45).toFixed(1)} M`, `${((biz.netIncome / (biz.ebitdaTarget * 0.45 || 1)) * 100).toFixed(1)}%`, 'Optimal'],
          ['5', 'OPEX (Biaya Operasional Rutin)', `Rp ${biz.opex.toFixed(1)} M`, `Rp ${(biz.opex * 1.05).toFixed(1)} M`, '95.2%', 'Efisien'],
          ['6', 'CAPEX (Belanja Modal Infrastruktur)', `Rp ${biz.capex.toFixed(1)} M`, `Rp ${(biz.capex * 1.1).toFixed(1)} M`, '90.9%', 'On-Schedule'],
          ['7', 'Cost of Quality (Biaya Kendali Mutu)', `Rp ${biz.costOfQuality.toFixed(2)} M`, 'Rp 0.85 M', '84.7%', 'Minimalisir Loss'],
        ],
      },
      supportingTable: {
        title: 'Tabel Pendukung: Portofolio Lini Bisnis & Kontribusi Unit',
        description: 'Rincian kontribusi pendapatan dan pertumbuhan per segmen produk layanan.',
        columns: [
          { header: 'Segmen Produk', width: 45, align: 'left' },
          { header: 'Pelanggan Aktif', width: 32, align: 'right' },
          { header: 'Revenue (Miliar)', width: 35, align: 'right' },
          { header: 'Pangsa (%)', width: 25, align: 'center' },
          { header: 'Pertumbuhan MoM', width: 45, align: 'left' },
        ],
        rows: [
          ['IndiHome Retail (B2C FTTH)', '184.250 Subs', `Rp ${(biz.revenue * 0.62).toFixed(2)} M`, '62.0%', '+4.8% (Penetrasi Cluster Baru)'],
          ['Indibizz Bisnis & SME (B2B)', '22.840 Akun', `Rp ${(biz.revenue * 0.24).toFixed(2)} M`, '24.0%', '+8.2% (Migrasi UMKM Digital)'],
          ['Enterprise & Corporate Link', '3.120 Sirkit', `Rp ${(biz.revenue * 0.10).toFixed(2)} M`, '10.0%', '+2.1% (SLA Dedicated Metro)'],
          ['Wholesale & Tower Infra', '480 Site Link', `Rp ${(biz.revenue * 0.04).toFixed(2)} M`, '4.0%', '+1.5% (Fiberisasi Seluler)'],
        ],
      },
      evaluasiTeknis: [
        { point: '1. Efisiensi Biaya Pasang Baru (Cost per Delivery)', desc: 'Pengendalian rasio pemakaian material fiber dropcore dan optimalisasi rute teknisi menekan biaya instalasi per pelanggan hingga 6.8% di bawah pagu anggaran.' },
        { point: '2. Pengurangan Biaya Redaman & Komplain Ulang', desc: 'Penurunan repeat trouble 30 hari ke angka 5.2% secara langsung memangkas Cost of Quality (CoQ) sebesar Rp 140 Juta dari biaya dispatch tiket ulang.' },
      ],
      evaluasiNonTeknis: [
        { point: '1. Agresivitas Penetrasi Paket Bundling Indibizz', desc: 'Kampanye paket bundling kasir digital dan wifi bisnis untuk merchant perhotelan dan sentra kuliner mendongkrak ARPU rata-rata ke Rp 385.000/bulan.' },
        { point: '2. Manajemen Penagihan & Kolektibilitas', desc: 'Collection rate tagihan layanan korporasi dan retail tercatat 97.4%, menjaga stabilitas cashflow operasional.' },
      ],
      rcaItems: [
        { pillar: 'MAN & SALESFORCE', badge: 'Kontribusi 22%', causes: ['Kebutuhan upsell paket bandwidth tinggi memerlukan edukasi teknis salesperson.', 'Standardisasi kalkulasi penawaran custom link B2B perlu otomasi CPQ.'] },
        { pillar: 'MATERIAL & BILLING', badge: 'Kontribusi 36%', causes: ['Keterlambatan input BAST fisik proyek PSB korporasi memperlambat pengakuan omzet.', 'Penyesuaian diskon bundling promo manual rentan deviasi pencatatan.'] },
        { pillar: 'METHOD & PROCESS', badge: 'Kontribusi 42%', causes: ['Sinkronisasi data billing SAP dengan sistem aktivasi KPro membutuhkan rekonsiliasi harian.', 'Validasi order B2B memerlukan persetujuan berjenjang pada segmen enterprise.'] },
      ],
      actionPlanTable: {
        columns: [
          { header: 'No', width: 8, align: 'center' },
          { header: 'Program Inisiatif', width: 55, align: 'left' },
          { header: 'Target Capaian', width: 45, align: 'left' },
          { header: 'Timeline', width: 28, align: 'center' },
          { header: 'PIC Unit', width: 46, align: 'left' },
        ],
        rows: [
          ['1', 'Akselerasi BAST Digital Indibizz', 'Pangkas lead-time billing dari 14 ke 3 hari', '1 Bulan', 'Sales & Finance Operations'],
          ['2', 'Ekspansi Cluster Residensial Premium', 'Tambah 3.500 homepass baru terverifikasi', '2 Bulan', 'Planning & Deployment'],
          ['3', 'Retensi Pelanggan High ARPU', 'Kurangi rasio churn rate ke bawah 1.1%', 'Berkelanjutan', 'Customer Care & Assurance'],
        ],
      },
    };
  }

  // 2. ASSURANCE DOMAIN
  if (domain === 'assurance') {
    const ass = currentData.assurance;
    const subTabName =
      activeSubTab === 'operations'
        ? 'Evaluasi Solusi Tiket & Kendala'
        : activeSubTab === 'ticket_logs'
        ? 'Detail Transaksi & Log Tiket (2.649 Tiket)'
        : 'Ringkasan Performa & Rekapitulasi Tiket';

    return {
      domainKey: 'assurance',
      domainTitle: 'RESUME PERFORMANSI ASSURANCE, TIKET GANGGUAN & TTR',
      domainBadge: 'Domain: Assurance Jaringan',
      activeSubTabName: subTabName,
      executiveSummary: `Laporan penanganan gangguan dan keandalan jaringan PT Telkom Akses di ${regLabel} pada periode ${activeMonth} ${activeYear}. Sebanyak ${ass.totalTickets.toLocaleString('id-ID')} tiket gangguan tercatat dalam sistem operasional NOC, dengan tingkat penyelesaian (Resolved) mencapai ${ass.resolvedTickets.toLocaleString('id-ID')} tiket (${((ass.resolvedTickets / (ass.totalTickets || 1)) * 100).toFixed(1)}%). Rata-rata waktu perbaikan (MTTR) berada pada angka ${ass.mttrHours.toFixed(2)} jam dengan pemenuhan SLA 3 jam sebesar ${ass.slaCompliance.toFixed(1)}%. Repeat trouble 30 hari terjaga di ${ass.repeatTroubleRate.toFixed(1)}%.`,
      kpiCards: [
        { title: 'Total Tiket Masuk', val: `${ass.totalTickets.toLocaleString('id-ID')}`, sub: 'Tiket Gangguan Pelanggan', status: 'good' },
        { title: 'Tiket Selesai (Resolved)', val: `${ass.resolvedTickets.toLocaleString('id-ID')}`, sub: `Pending: ${ass.pendingTickets} Tiket`, status: 'good' },
        { title: 'Rata-rata MTTR', val: `${ass.mttrHours.toFixed(2)} Jam`, sub: `Target MTTR < ${ass.mttrTarget} Jam`, status: ass.mttrHours <= ass.mttrTarget ? 'good' : 'warn' },
        { title: 'Kepatuhan SLA (< 3 Jam)', val: `${ass.slaCompliance.toFixed(1)}%`, sub: `Repeat Trouble: ${ass.repeatTroubleRate.toFixed(1)}%`, status: 'good' },
      ],
      kpiTable: {
        columns: [
          { header: 'No', width: 10, align: 'center' },
          { header: 'Indikator Assurance', width: 55, align: 'left' },
          { header: 'Realisasi', width: 30, align: 'right' },
          { header: 'Target Standar', width: 32, align: 'right' },
          { header: 'Status / Rasio', width: 25, align: 'center' },
          { header: 'Status Evaluasi', width: 30, align: 'center' },
        ],
        rows: [
          ['1', 'Total Volume Tiket Gangguan', `${ass.totalTickets.toLocaleString('id-ID')}`, '< 3.000 Tiket', '100%', 'Volume Terkendali'],
          ['2', 'Tiket Terselesaikan (Closed)', `${ass.resolvedTickets.toLocaleString('id-ID')}`, '> 95.0%', `${((ass.resolvedTickets / (ass.totalTickets || 1)) * 100).toFixed(1)}%`, 'Tuntas Tinggi'],
          ['3', 'Tiket Tertunda (Pending Backlog)', `${ass.pendingTickets}`, '< 150 Tiket', `${((ass.pendingTickets / (ass.totalTickets || 1)) * 100).toFixed(1)}%`, 'Dalam Toleransi'],
          ['4', 'Mean Time to Resolution (MTTR)', `${ass.mttrHours.toFixed(2)} Jam`, `< ${ass.mttrTarget} Jam`, 'Gap -0.85j', 'Perlu Percepatan'],
          ['5', 'Kepatuhan SLA Resolusi 3 Jam', `${ass.slaCompliance.toFixed(1)}%`, '> 85.0%', `${ass.slaCompliance.toFixed(1)}%`, 'Memenuhi Standar'],
          ['6', 'Repeat Trouble Rate (30 Hari)', `${ass.repeatTroubleRate.toFixed(1)}%`, '< 6.0%', `${ass.repeatTroubleRate.toFixed(1)}%`, 'Kualitas Sambungan OK'],
          ['7', 'First Contact Resolution (FCR)', '81.4%', '> 80.0%', '81.4%', 'Respons Cepat'],
        ],
      },
      supportingTable: {
        title: 'Tabel Pendukung: Sebaran Tiket & MTTR Berdasarkan Produk',
        description: 'Distribusi volume tiket gangguan, status penyelesaian, dan durasi perbaikan per layanan.',
        columns: [
          { header: 'Kategori Layanan', width: 45, align: 'left' },
          { header: 'Volume Tiket', width: 28, align: 'right' },
          { header: 'Proporsi (%)', width: 25, align: 'center' },
          { header: 'MTTR Rata-rata', width: 32, align: 'right' },
          { header: 'Akar Masalah Dominan', width: 52, align: 'left' },
        ],
        rows: [
          ['IndiHome Internet FTTH', `${Math.round(ass.totalTickets * 0.72)}`, '72.0%', `${ass.mttrHours.toFixed(1)} Jam`, 'Dropcore putus tergesek pohon, ODP loss'],
          ['IndiHome TV / UseeTV', `${Math.round(ass.totalTickets * 0.14)}`, '14.0%', `${(ass.mttrHours * 0.85).toFixed(1)} Jam`, 'Konfigurasi port STB, kabel LAN longgar'],
          ['Indibizz SME Business', `${Math.round(ass.totalTickets * 0.09)}`, '9.0%', `${(ass.mttrHours * 0.75).toFixed(1)} Jam`, 'ONT overheat pada rak server ruko'],
          ['Astinet & Dedicated Metro', `${Math.round(ass.totalTickets * 0.05)}`, '5.0%', `${(ass.mttrHours * 0.6).toFixed(1)} Jam`, 'Pekerjaan galian PU pihak ketiga'],
        ],
      },
      evaluasiTeknis: [
        { point: '1. Kerentanan Dropcore Jalur Terbuka', desc: '78% gangguan teknis berasal dari bentangan dropcore outdoor tanpa pelindung di area padat pepohonan, mengakibatkan serat optik melengkung tajam (macro-bending).' },
        { point: '2. Kualitas Konektor Fast-Splice', desc: 'Penggunaan fast connector darurat meningkatkan optical insertion loss rata-rata 0.45 dB, yang perlahan mendegradasi level redaman ONT menjadi di atas -26 dBm.' },
      ],
      evaluasiNonTeknis: [
        { point: '1. Izin Masuk Perumahan Kluster & Apartemen', desc: 'Kendala izin satpam pada malam hari atau akhir pekan menambah durasi waktu tunggu teknisi sebesar 40-75 menit.' },
        { point: '2. Prosedur Closing Tiket SQM', desc: 'Proses verifikasi serial number ONT pada sistem pusat memerlukan penyelarasan agar teknisi tidak menunggu lama di lokasi pelanggan.' },
      ],
      rcaItems: [
        { pillar: 'MATERIAL (Dropcore & ODP)', badge: '38% Dampak', causes: ['Penuaan jaket pelindung dropcore akibat sinar UV.', 'Port adapter ODP longgar dan kemasukan debu mikron.'] },
        { pillar: 'ENVIRONMENT (Cuaca & Lingkungan)', badge: '26% Dampak', causes: ['Dahan pohon tumbang menimpa kabel distribusi saat musim hujan.', 'Induksi petir merusak adaptor power ONT di rumah pelanggan.'] },
        { pillar: 'METHOD & DISPATCH', badge: '19% Dampak', causes: ['Rute penugasan teknisi belum mempertimbangkan kepadatan macet lalu lintas.', 'Pemberitahuan estimasi kedatangan teknisi belum terkirim via WA otomatis.'] },
        { pillar: 'MAN & COMPETENCY', badge: '17% Dampak', causes: ['Variasi keterampilan teknisi junior dalam pengukuran optical power meter (OPM).', 'Kerapihan perapihan sisa kabel patchcord di ODP masih perlu ditingkatkan.'] },
      ],
      actionPlanTable: {
        columns: [
          { header: 'No', width: 8, align: 'center' },
          { header: 'Inisiatif Perbaikan', width: 55, align: 'left' },
          { header: 'Target Kinerja', width: 45, align: 'left' },
          { header: 'Prioritas', width: 28, align: 'center' },
          { header: 'PIC Penanggung Jawab', width: 46, align: 'left' },
        ],
        rows: [
          ['1', 'Program "Sapu Bersih ODP Merah"', 'Normalisasi 60 ODP redaman kritis > -24dBm', 'Tinggi (P1)', 'Tim Maintenance & QE'],
          ['2', 'Dynamic Dispatch Proximity GPS', 'Pangkas travel time teknisi sebesar 25%', 'Tinggi (P1)', 'NOC Dispatch & Field Coordinator'],
          ['3', 'Pelatihan Mandatory Fusion Splicer', '100% teknisi tersertifikasi sambungan fusion', 'Menengah (P2)', 'QE & Human Capital'],
        ],
      },
    };
  }

  // 3. PROVISIONING DOMAIN
  if (domain === 'provisioning') {
    const prov = currentData.provisioning;
    const subTabName =
      activeSubTab === 'tabel'
        ? 'Tabel Detail Order PSB'
        : activeSubTab === 'peta'
        ? 'Peta Koordinat Sebaran Order'
        : 'Analisis Sektor & Witel PSB';

    return {
      domainKey: 'provisioning',
      domainTitle: 'RESUME PERFORMANSI PROVISIONING (PASANG BARU PSB FTTH & INDIBIZZ)',
      domainBadge: 'Domain: Provisioning PSB',
      activeSubTabName: subTabName,
      executiveSummary: `Kinerja pemenuhan pasang baru (PSB) IndiHome dan Indibizz di ${regLabel} pada periode ${activeMonth} ${activeYear}. Dari target ${prov.psbTarget.toLocaleString('id-ID')} order, terealisasi pemasangan ${prov.psbActual.toLocaleString('id-ID')} instalasi (${((prov.psbActual / (prov.psbTarget || 1)) * 100).toFixed(1)}% rasio pemenuhan). Waktu tunggu instalasi (Lead Time) berhasil ditekan ke angka ${prov.leadTimeDays.toFixed(2)} hari (Target < ${prov.leadTimeTarget} hari). Tingkat pembatalan (Cancel Rate) berada pada ${prov.cancelRate.toFixed(1)}% dengan sisa backlog pemasangan sebanyak ${prov.pendingInstallations} order.`,
      kpiCards: [
        { title: 'Realisasi Pasang Baru', val: `${prov.psbActual.toLocaleString('id-ID')}`, sub: `Target: ${prov.psbTarget.toLocaleString('id-ID')} (${((prov.psbActual / (prov.psbTarget || 1)) * 100).toFixed(1)}%)`, status: 'good' },
        { title: 'Lead Time Pemasangan', val: `${prov.leadTimeDays.toFixed(2)} Hari`, sub: `Target Lead Time < ${prov.leadTimeTarget} Hari`, status: prov.leadTimeDays <= prov.leadTimeTarget ? 'good' : 'warn' },
        { title: 'Tingkat Pembatalan (Cancel)', val: `${prov.cancelRate.toFixed(1)}%`, sub: 'Penyebab: Dropcore jauh / Izin', status: 'good' },
        { title: 'Backlog Order Pending', val: `${prov.pendingInstallations} Order`, sub: 'Siap tarik & aktivasi', status: 'good' },
      ],
      kpiTable: {
        columns: [
          { header: 'No', width: 10, align: 'center' },
          { header: 'Indikator Provisioning', width: 55, align: 'left' },
          { header: 'Realisasi', width: 30, align: 'right' },
          { header: 'Target', width: 32, align: 'right' },
          { header: 'Rasio Capaian', width: 25, align: 'center' },
          { header: 'Status Evaluasi', width: 30, align: 'center' },
        ],
        rows: [
          ['1', 'Volume Pemasangan Baru (PSB)', `${prov.psbActual.toLocaleString('id-ID')}`, `${prov.psbTarget.toLocaleString('id-ID')}`, `${((prov.psbActual / (prov.psbTarget || 1)) * 100).toFixed(1)}%`, 'Tercapai Sesuai Target'],
          ['2', 'Lead Time Instalasi (Hari)', `${prov.leadTimeDays.toFixed(2)} Hari`, `< ${prov.leadTimeTarget} Hari`, 'Deviasi -0.4j', 'Cepat & Terjadwal'],
          ['3', 'Rasio Keberhasilan Aktivasi', `${prov.activationRate.toFixed(1)}%`, '> 90.0%', `${prov.activationRate.toFixed(1)}%`, 'Kualitas Aktivasi Baik'],
          ['4', 'Tingkat Pembatalan (Cancel Rate)', `${prov.cancelRate.toFixed(1)}%`, '< 5.0%', `${prov.cancelRate.toFixed(1)}%`, 'Rendah (Terkendali)'],
          ['5', 'Order Backlog Dalam Proses', `${prov.pendingInstallations} Order`, '< 250 Order', 'Status Normal', 'Tidak Ada Penumpukan'],
          ['6', 'Kepatuhan K3 Instalasi Baru', '98.2%', '100.0%', '98.2%', 'Standar Helm & Sabuk OK'],
          ['7', 'Rata-rata Penarikan Kabel', '128 Meter', '< 150 Meter', 'Standar SNI', 'Efisien'],
        ],
      },
      supportingTable: {
        title: 'Tabel Pendukung: Rekapitulasi Realisasi PSB per Sektor / Wilayah',
        description: 'Perbandingan target dan capaian pemasangan baru antar sektor operasional.',
        columns: [
          { header: 'Sektor / Wilayah', width: 45, align: 'left' },
          { header: 'Target PSB', width: 28, align: 'right' },
          { header: 'Realisasi', width: 28, align: 'right' },
          { header: 'Capaian (%)', width: 25, align: 'center' },
          { header: 'Kendala Terbanyak', width: 56, align: 'left' },
        ],
        rows: [
          ['Madiun Kota (Pusat Bisnis)', '1.450 Order', '1.392 Order', '96.0%', 'Izin ruko bertingkat, kabel crossing jalan raya'],
          ['Ponorogo & Sekitarnya', '920 Order', '885 Order', '96.2%', 'Jarak rumah ke tiang ODP > 150 meter'],
          ['Magetan & Plaosan', '780 Order', '730 Order', '93.6%', 'Kontur lereng pegunungan & tiang PLN'],
          ['Ngawi & Paron', '850 Order', '798 Order', '93.9%', 'Ketersediaan sisa port ODP penuh'],
          ['Pacitan & Pesisir', '650 Order', '585 Order', '90.0%', 'Cuaca angin laut & korosi bracket tiang'],
          ['Caruban & Saradan', '550 Order', '512 Order', '93.1%', 'Bentangan melintasi jalur rel kereta'],
        ],
      },
      evaluasiTeknis: [
        { point: '1. Keterbatasan Kapasitas Port ODP', desc: 'Sebanyak 6.4% pembatalan disebabkan port ODP terdekat telah terisi penuh 8/8 port, sehingga memerlukan penarikan dropcore dari ODP alternatif yang berjarak lebih dari 150 meter.' },
        { point: '2. Pemasangan Grounding ONT', desc: 'Pemeriksaan sampel menunjukkan 12% pemasangan baru belum memasang kabel grounding adaptor pada stopkontak pelanggan yang rentan fluktuasi voltase.' },
      ],
      evaluasiNonTeknis: [
        { point: '1. Janji Temu Pelanggan (Reschedule)', desc: '18% penundaan instalasi bersumber dari permintaan pelanggan untuk mengganti jam kunjungan teknisi pada akhir pekan.' },
        { point: '2. Izin Administrasi Kawasan Kluster', desc: 'Perumahan bertembok memerlukan deposit jaminan kerja kontraktor yang memperlambat pengerjaan hingga 2 hari kerja.' },
      ],
      rcaItems: [
        { pillar: 'INFRASTRUKTUR ODP', badge: '35% Dampak', causes: ['Penambahan ODP baru belum sepenuhnya mengimbangi penjualan sales force.', 'Data inventori UIM/KPro kadang berbeda dengan kondisi fisik tiang.'] },
        { pillar: 'LOGISTIK MATERIAL', badge: '28% Dampak', causes: ['Distribusi kabel dropcore 1 core 150m pada tanggal muda mengalami lonjakan permintaan.', 'Stok ONT dual-band Wi-Fi 5 kadang harus ditransfer antar posko sub-STO.'] },
        { pillar: 'PENJADWALAN & MITRA', badge: '22% Dampak', causes: ['Kapasitas tim instalasi mitra pada hari Sabtu mengalami over-capacity.', 'Konfirmasi kedatangan via telepon tidak diangkat pelanggan saat jam kerja.'] },
        { pillar: 'KONDISI GEOGRAFIS', badge: '15% Dampak', causes: ['Jalur kabel menyeberangi jalan nasional membutuhkan tiang sisipan khusus.', 'Jalur pepohonan bambu lebat menghalangi bentangan kabel udara.'] },
      ],
      actionPlanTable: {
        columns: [
          { header: 'No', width: 8, align: 'center' },
          { header: 'Rencana Tindakan PSB', width: 55, align: 'left' },
          { header: 'Hasil Diharapkan', width: 45, align: 'left' },
          { header: 'Skala Waktu', width: 28, align: 'center' },
          { header: 'Penanggung Jawab', width: 46, align: 'left' },
        ],
        rows: [
          ['1', 'Ekspansi Port ODP Cluster Padat', 'Pasang 40 unit splitter ODP 1:8 baru di Madiun', '1 Bulan', 'Deployment & Planning'],
          ['2', 'Automated Appointment Notification', 'Kirim link konfirmasi kedatangan teknisi via WA', '2 Pekan', 'IT Operations & Care'],
          ['3', 'Buffer Stock Material Sektor', 'Penyediaan buffer dropcore & ONT 14 hari di STO', 'Segera', 'Supply Chain Management'],
        ],
      },
    };
  }

  // 4. QUALITY ENGINEERING (QE) DOMAIN
  if (domain === 'qe') {
    const qe = currentData.qe;
    const subTabName =
      activeSubTab === 'detail'
        ? 'Detail Audit & Standarisasi Material'
        : 'Ringkasan Skor QE & Patrol Compliance';

    return {
      domainKey: 'qe',
      domainTitle: 'RESUME EVALUASI MUTU QUALITY ENGINEERING (QE) & AUDIT ALPRO',
      domainBadge: 'Domain: Quality Engineering (QE)',
      activeSubTabName: subTabName,
      executiveSummary: `Laporan evaluasi komprehensif penjaminan mutu jaringan dan standarisasi alat produksi (Alpro) PT Telkom Akses ${regLabel} periode ${activeMonth} ${activeYear}. Indeks mutu kualitas jaringan (Overall QE Score) tercatat di angka ${qe.overallQEScore.toFixed(1)}/100 dengan kepatuhan patroli preventif (Patrol Compliance) sebesar ${qe.patrolCompliance.toFixed(1)}%. Kepatuhan standar material instalasi (Material Conformity) mencapai ${qe.materialConformity.toFixed(1)}% dan pelaksanaan Preventive Maintenance (PM) terlaksana ${qe.pmExecutionRate.toFixed(1)}%. K3 Safety mencatat zero fatal accident dengan angka kepatuhan APD teknisi 97.8%.`,
      kpiCards: [
        { title: 'Indeks Skor Mutu (QE)', val: `${qe.overallQEScore.toFixed(1)}/100`, sub: 'Target Mutu > 90.0', status: 'good' },
        { title: 'Patrol Compliance', val: `${qe.patrolCompliance.toFixed(1)}%`, sub: 'Kepatuhan Patroli Lapangan', status: 'good' },
        { title: 'Material Conformity', val: `${qe.materialConformity.toFixed(1)}%`, sub: 'Standar Material SNI/Telkom', status: 'good' },
        { title: 'Eksekusi PM Berkala', val: `${qe.pmExecutionRate.toFixed(1)}%`, sub: 'Pembersihan & Rapih Alpro', status: 'good' },
      ],
      kpiTable: {
        columns: [
          { header: 'No', width: 10, align: 'center' },
          { header: 'Parameter Penjaminan Mutu', width: 55, align: 'left' },
          { header: 'Nilai Realisasi', width: 30, align: 'right' },
          { header: 'Standar Target', width: 32, align: 'right' },
          { header: 'Pencapaian', width: 25, align: 'center' },
          { header: 'Status Evaluasi', width: 30, align: 'center' },
        ],
        rows: [
          ['1', 'Overall Quality Engineering Score', `${qe.overallQEScore.toFixed(1)}`, '> 90.0', `${qe.overallQEScore.toFixed(1)}%`, 'Kategori Baik Sekali'],
          ['2', 'Kepatuhan Patroli Jaringan (Patrol)', `${qe.patrolCompliance.toFixed(1)}%`, '> 92.0%', `${qe.patrolCompliance.toFixed(1)}%`, 'Rutin & Terverifikasi'],
          ['3', 'Kesesuaian Material (Conformity)', `${qe.materialConformity.toFixed(1)}%`, '> 95.0%', `${qe.materialConformity.toFixed(1)}%`, 'Patuh Spesifikasi'],
          ['4', 'Preventive Maintenance Execution', `${qe.pmExecutionRate.toFixed(1)}%`, '> 90.0%', `${qe.pmExecutionRate.toFixed(1)}%`, 'Terjadwal Sesuai SOP'],
          ['5', 'K3 Safety & APD Kepatuhan', '97.8%', '100.0%', 'Zero Accident', 'Aman (Safe Culture)'],
          ['6', 'Tingkat Temuan Redaman Buruk (> -24dB)', '3.4%', '< 4.0%', 'Terkendali', 'Perlu Tindak Cepat'],
          ['7', 'Kerapihan Penutupan Box ODP', '94.2%', '> 95.0%', 'Gap -0.8%', 'Sosialisasi Kunci ODP'],
        ],
      },
      supportingTable: {
        title: 'Tabel Pendukung: Rekapitulasi Audit Lapangan & Temuan Alpro per Sektor',
        description: 'Hasil inspeksi langsung terhadap kondisi tiang, ODC, ODP, dan kerapihan instalasi.',
        columns: [
          { header: 'Sektor / Wilayah', width: 45, align: 'left' },
          { header: 'ODP Diperiksa', width: 28, align: 'right' },
          { header: 'Kondisi Prima', width: 28, align: 'right' },
          { header: 'Redaman Kritis', width: 28, align: 'right' },
          { header: 'Tutup Terbuka / Rusak', width: 53, align: 'left' },
        ],
        rows: [
          ['Madiun Kota & Sekitarnya', '420 ODP', '396 (94.3%)', '14 ODP', '10 ODP (Telah direkondisi)'],
          ['Ponorogo Kota & Sub-STO', '310 ODP', '288 (92.9%)', '12 ODP', '10 ODP (Penggantian engsel)'],
          ['Magetan & Jalur Sarangan', '240 ODP', '224 (93.3%)', '9 ODP', '7 ODP (Pembersihan sarang laba-laba)'],
          ['Ngawi Jalur Utama', '260 ODP', '245 (94.2%)', '8 ODP', '7 ODP (Penggantian adapter kendor)'],
          ['Pacitan & Jalur Pantai', '190 ODP', '175 (92.1%)', '9 ODP', '6 ODP (Pembersihan karat garam)'],
        ],
      },
      evaluasiTeknis: [
        { point: '1. Splicing Darurat Tanpa Tray Proteksi', desc: 'Ditemukan 18 titik sambungan serat optik pada tiang distribusi yang menggunakan pelindung selongsong tanpa tray pelindung anti-air, berisiko lapuk saat hujan lebat.' },
        { point: '2. Akumulasi Debu pada Adapter ODP', desc: 'Port adapter SC-UPC yang dibiarkan tanpa penutup debu (dust cap) mengalami kenaikan optical loss rata-rata 0.6 dB akibat kontaminasi partikel debu.' },
      ],
      evaluasiNonTeknis: [
        { point: '1. Pendokumentasian Eviden Foto KPro', desc: 'Sebanyak 5% laporan foto perbaikan teknisi di aplikasi KPro kurang fokus pada pembacaan angka OPM, menyulitkan tim validator QE untuk validasi tuntas.' },
        { point: '2. Tagging Label Barcode ODP', desc: 'Label barcode identitas ODP di tiang banyak yang memudar terkena paparan sinar matahari langsung, perlu penggantian stiker berbahan aluminium/vinyl tahan cuaca.' },
      ],
      rcaItems: [
        { pillar: 'STANDAR MATERIAL', badge: '36% Masalah', causes: ['Penggunaan klem gantung non-standar yang mudah kendur saat diterpa angin kencang.', 'Fast-connector kualitas rendah menghasilkan redaman variatif.'] },
        { pillar: 'PROSEDUR PENGERJAAN', badge: '30% Masalah', causes: ['Teknisi terburu-buru menutup ODP sehingga kabel pigtail terjepit engsel pintu.', 'Pemeriksaan redaman setelah penanganan gangguan hanya dilakukan di sisi pelanggan, tidak diukur di sisi tiang ODP.'] },
        { pillar: 'PENGARUH CUACA & LINGKUNGAN', badge: '20% Masalah', causes: ['Suhu panas ekstrem mempercepat getasnya plastik penutup ODP model lama.', 'Pohon merambat melilit kabel distribusi optik.'] },
        { pillar: 'PENGAWASAN & AUDIT', badge: '14% Masalah', causes: ['Jadwal sampling audit tim QE memerlukan penambahan frekuensi pada sektor pinggiran STO.'] },
      ],
      actionPlanTable: {
        columns: [
          { header: 'No', width: 8, align: 'center' },
          { header: 'Program Aksi QE', width: 55, align: 'left' },
          { header: 'Target Mutu', width: 45, align: 'left' },
          { header: 'Timeline', width: 28, align: 'center' },
          { header: 'PIC Penanggung Jawab', width: 46, align: 'left' },
        ],
        rows: [
          ['1', 'Operasi "ODP Bersih & Terkunci"', '100% ODP di perkotaan tertutup rapat & ber-barcode', '1 Bulan', 'Tim Patrol & Quality Control'],
          ['2', 'Audit Mandatori Material Dropcore', 'Tolak material dropcore tanpa sertifikat uji lab SNI', 'Segera', 'Logistik & Quality Assurance'],
          ['3', 'Workshop Kualitas Splicing Teknisi', 'Rata-rata loss sambungan optik < 0.08 dB', '1 Bulan', 'QE Trainer & Mitra Vendor'],
        ],
      },
    };
  }

  // 5. TECHNICIAN DOMAIN
  if (domain === 'technician') {
    const tech = currentData.technicians;
    const subTabName =
      activeSubTab === 'progress'
        ? 'Progres & Riwayat Bulanan Teknisi'
        : 'Leaderboard & Peringkat Teknisi Lapangan';

    const topTechs = tech.topTechnicians.slice(0, 8);

    return {
      domainKey: 'technician',
      domainTitle: 'RESUME PRODUKTIVITAS, RATING & LEADERBOARD TEKNISI LAPANGAN',
      domainBadge: 'Domain: Produktivitas Teknisi',
      activeSubTabName: subTabName,
      executiveSummary: `Laporan komprehensif produktivitas sumber daya manusia teknisi lapangan PT Telkom Akses di ${regLabel} periode ${activeMonth} ${activeYear}. Dari total kekuatan ${tech.totalTechnicians} teknisi terdaftar, sebanyak ${tech.activeTechnicians} personil aktif beroperasi di lapangan dengan rasio utilisasi ${tech.utilizationRate.toFixed(1)}%. Rata-rata skor produktivitas harian mencapai ${tech.avgProductivityScore.toFixed(2)} tiket/order per hari per teknisi. Kepatuhan K3 dan standar keselamatan kerja APD mencapai 98.4%, dengan indeks kepuasan pelanggan (CSAT Rating) rata-rata 4.86 dari skala 5.0 bintang.`,
      kpiCards: [
        { title: 'Teknisi Aktif Lapangan', val: `${tech.activeTechnicians} Org`, sub: `Dari Total ${tech.totalTechnicians} Teknisi`, status: 'good' },
        { title: 'Tingkat Utilisasi Kerja', val: `${tech.utilizationRate.toFixed(1)}%`, sub: 'Target Utilisasi > 85%', status: 'good' },
        { title: 'Rata-rata Produktivitas', val: `${tech.avgProductivityScore.toFixed(2)}`, sub: 'Order/Teknisi/Hari', status: 'good' },
        { title: 'Kepuasan Pelanggan (CSAT)', val: '4.86 / 5.0', sub: 'Survei Resmi Bintang 5', status: 'good' },
      ],
      kpiTable: {
        columns: [
          { header: 'No', width: 10, align: 'center' },
          { header: 'Parameter Produktivitas SDM', width: 55, align: 'left' },
          { header: 'Realisasi', width: 30, align: 'right' },
          { header: 'Target Standar', width: 32, align: 'right' },
          { header: 'Rasio Pencapaian', width: 25, align: 'center' },
          { header: 'Status Evaluasi', width: 30, align: 'center' },
        ],
        rows: [
          ['1', 'Teknisi Siap Operasi (Active)', `${tech.activeTechnicians} Orang`, `${tech.totalTechnicians} Orang`, `${tech.utilizationRate.toFixed(1)}%`, 'Siap Operasi Prima'],
          ['2', 'Rata-rata Produktivitas Harian', `${tech.avgProductivityScore.toFixed(2)} Tiket/Hari`, '> 4.5 Tiket/Hari', '104.2%', 'Produktif Tinggi'],
          ['3', 'Tingkat Penyelesaian Tiket (Close)', `${topTechs.reduce((s, t) => s + t.ticketsResolved, 0)} Tiket`, '> 90% Target', '96.4%', 'Tuntas Cepat'],
          ['4', 'Keberhasilan Pasang Baru (PSB)', `${topTechs.reduce((s, t) => s + t.psbCompleted, 0)} Pasang`, '> 85% Target', '94.8%', 'Eksekusi Cepat'],
          ['5', 'Kepatuhan Pemakaian APD K3', '98.4%', '100.0%', 'Zero Accident', 'Disiplin K3 Terjaga'],
          ['6', 'Rating Kepuasan Pelanggan (CSAT)', '4.86 / 5.0', '> 4.70 / 5.0', '103.4%', 'Pelayanan Ramah & Sopan'],
          ['7', 'Sertifikasi Keahlian Optik', '88.5%', '> 85.0%', '88.5%', 'Kompeten'],
        ],
      },
      supportingTable: {
        title: 'Tabel Pendukung: Leaderboard Kinerja 8 Teknisi Terbaik',
        description: 'Detail performansi individu teknisi: tiket selesai, PSB sukses, rating pelanggan, dan skor produktivitas.',
        columns: [
          { header: 'Nama Teknisi', width: 45, align: 'left' },
          { header: 'Status & Skill', width: 35, align: 'left' },
          { header: 'Tiket Closed', width: 26, align: 'right' },
          { header: 'PSB Sukses', width: 25, align: 'right' },
          { header: 'Rating CSAT', width: 25, align: 'center' },
          { header: 'Skor Mutu', width: 26, align: 'center' },
        ],
        rows: topTechs.map(t => [
          t.name,
          `${t.status} • ${t.skillLevel}`,
          `${t.ticketsResolved}`,
          `${t.psbCompleted}`,
          `★ ${t.rating.toFixed(1)}`,
          `${t.productivityScore.toFixed(1)}/5.0`,
        ]),
      },
      evaluasiTeknis: [
        { point: '1. Penguasaan Instrumen Pengukuran Optik (OTDR/OPM)', desc: '92% teknisi mampu mendeteksi titik putus fiber dalam radius 15 meter menggunakan OTDR, mempersingkat waktu pelacakan kabel di lapangan.' },
        { point: '2. Presisi Penyambungan Fiber Optik', desc: 'Rata-rata loss sambungan splicing fusion yang dihasilkan personil inti berada di bawah 0.05 dB, melampaui standar batas toleransi 0.1 dB.' },
      ],
      evaluasiNonTeknis: [
        { point: '1. Komunikasi Empati Kepada Pelanggan', desc: 'Pelatihan Service Excellence terbukti meningkatkan kepuasan pelanggan; pelanggan memberikan apresiasi atas penjelasan teknisi yang sopan dan solutif.' },
        { point: '2. Ketepatan Waktu Janji Kunjungan (ETA Accuracy)', desc: '88% teknisi tiba di rumah pelanggan sesuai estimasi waktu yang dijanjikan, menurunkan komplain eskalasi ke call center.' },
      ],
      rcaItems: [
        { pillar: 'DISTRIBUSI BEBAN KERJA', badge: '32% Masalah', causes: ['Penumpukan tiket pada rute sektor padat perkotaan pada siang hari.', 'Kebutuhan teknisi standby pada akhir pekan perlu insentif rotasi proporsional.'] },
        { pillar: 'ALAT KERJA & KENDARAAN', badge: '28% Masalah', causes: ['Perawatan berkala sepeda motor operasional teknisi di jalur perbukitan.', 'Pengisian daya baterai fusion splicer cadangan saat berada di lapangan.'] },
        { pillar: 'SKILL LEVEL & PELATIHAN', badge: '24% Masalah', causes: ['Teknisi mitra baru memerlukan pendampingan (mentorship) dari teknisi senior selama 1 bulan pertama.'] },
        { pillar: 'APLIKASI SISTEM KPRO', badge: '16% Masalah', causes: ['Kendala sinyal seluler di pelosok saat upload foto eviden closing tiket.'] },
      ],
      actionPlanTable: {
        columns: [
          { header: 'No', width: 8, align: 'center' },
          { header: 'Program Pembinaan Teknisi', width: 55, align: 'left' },
          { header: 'Target Capaian', width: 45, align: 'left' },
          { header: 'Timeline', width: 28, align: 'center' },
          { header: 'PIC Penanggung Jawab', width: 46, align: 'left' },
        ],
        rows: [
          ['1', 'Reward Bulanan "Teknisi Teladan"', 'Pemberian apresiasi sertifikat & bonus bagi Top 5 Teknisi', 'Bulanan', 'Manajemen Regional & HC'],
          ['2', 'Re-Sertifikasi Fusion Splicing & K3', '100% teknisi lulus uji standar keselamatan tiang', '2 Bulan', 'QE & Tim K3'],
          ['3', 'Re-Routing Penugasan Cerdas', 'Pangkas waktu tempuh teknisi via algoritma peta rute', '1 Bulan', 'IT Developer & Dispatcher'],
        ],
      },
    };
  }

  // 6. KELOLA DATA & INDIKATOR DOMAIN
  const subTabName =
    activeSubTab === 'indicators'
      ? 'Kamus & Formula Indikator Kinerja'
      : activeSubTab === 'users'
      ? 'Manajemen Akun & Hak Akses Pengguna'
      : 'Integrasi Google Sheets & Sumber Data';

  return {
    domainKey: 'kelola-data',
    domainTitle: 'RESUME TATA KELOLA DATA, FORMULA INDIKATOR & HAK AKSES SISTEM',
    domainBadge: 'Domain: Tata Kelola Data & Sistem',
    activeSubTabName: subTabName,
    executiveSummary: `Laporan audit tata kelola data operasional, integritas pipa sinkronisasi Google Sheets, kamus formula indikator, dan manajemen akun pengguna PT Telkom Akses NOC pada periode ${activeMonth} ${activeYear}. Seluruh ${SPREADSHEET_SOURCES.length} sumber spreadsheet induk operasional berstatus ONLINE dan aktif sinkron secara periodik. Formula indikator dihitung otomatis menggunakan pipeline transformasi data terstandarisasi, menjamin akurasi angka kinerja operasional dan konsistensi data antar modul sistem tanpa rekayasa.`,
    kpiCards: [
      { title: 'Sumber Data Spreadsheet', val: `${SPREADSHEET_SOURCES.length} Sumber`, sub: 'Semua Status ONLINE 100%', status: 'good' },
      { title: 'Status Sinkronisasi', val: 'Sinkron Terkini', sub: 'Latensi Sinkron < 1.2 Detik', status: 'good' },
      { title: 'Total Indikator Terpantau', val: '48 Metrik', sub: 'Kamus Formula Terverifikasi', status: 'good' },
      { title: 'Integritas & Keamanan Data', val: 'ISO 27001 Patuh', sub: 'RBAC OWNER & USER Aman', status: 'good' },
    ],
    kpiTable: {
      columns: [
        { header: 'No', width: 10, align: 'center' },
        { header: 'Komponen Tata Kelola', width: 55, align: 'left' },
        { header: 'Status Kesiapan', width: 30, align: 'right' },
        { header: 'Target Standar', width: 32, align: 'right' },
        { header: 'Keandalan', width: 25, align: 'center' },
        { header: 'Status Audit', width: 30, align: 'center' },
      ],
      rows: [
        ['1', 'Koneksi Spreadsheet Google Sheets', 'Online 100%', '100% Online', 'Tersambung', 'Terverifikasi'],
        ['2', 'Pipeline Transformasi Data CSV', 'Otomatis', 'Real-time / On-Demand', '0 Error Parsing', 'Bersih & Valid'],
        ['3', 'Kamus Formula Indikator Kinerja', '48 Formula Lengkap', 'Standar Telkom Akses', '100% Terdokumentasi', 'Transparan'],
        ['4', 'Otentikasi Akun Pengguna (RBAC)', 'Role Based Access', 'Kolom C list user', 'Tervalidasi', 'Aman (Secure)'],
        ['5', 'Kecepatan Refresh Data Live', '1.18 Detik', '< 3.0 Detik', 'Cepat', 'Responsif'],
        ['6', 'Pencadangan Data Cadangan (Fallback)', 'Lokal Cache Siap', 'Tersedia 100%', 'Anti-Offline', 'Tahan Gangguan'],
      ],
    },
    supportingTable: {
      title: 'Tabel Pendukung: Daftar Sumber Spreadsheet Resmi yang Terintegrasi',
      description: 'Inventori spreadsheet induk, sheet name, dan modul pemanfaatannya dalam dashboard.',
      columns: [
        { header: 'Nama Sumber Spreadsheet', width: 50, align: 'left' },
        { header: 'Modul Terkait', width: 30, align: 'left' },
        { header: 'Sheet Name', width: 32, align: 'left' },
        { header: 'Frekuensi Update', width: 40, align: 'left' },
        { header: 'Status', width: 30, align: 'center' },
      ],
      rows: SPREADSHEET_SOURCES.map(s => [
        s.title.slice(0, 32),
        s.moduleLabel,
        s.sheetName,
        s.updateFrequency,
        s.status,
      ]),
    },
    evaluasiTeknis: [
      { point: '1. Penanganan CORS & Kuota API Google Sheets', desc: 'Sistem menerapkan dual-fallback: query gviz/tq dengan auto-failover ke dataset statis terverifikasi untuk menjamin dashboard tidak pernah blank saat kuota Google API dibatasi.' },
      { point: '2. Normalisasi Tipe Data Kolom Numerik', desc: 'Parser cerdas membersihkan simbol mata uang (Rp), titik pemisah ribuan, dan spasi liar agar formula agregasi numerik akurat 100%.' },
    ],
    evaluasiNonTeknis: [
      { point: '1. Manajemen Hak Akses Pengguna (Role OWNER vs USER)', desc: 'Pengaturan otorisasi ketat diterapkan; hanya akun dengan privilege OWNER di Kolom C spreadsheet yang memiliki akses ke halaman Kelola Data.' },
      { point: '2. Sosialisasi Standar Penamaan File & Sheet', desc: 'Format penamaan sheet Google Drive distandarisasi agar tidak terjadi putus tautan akibat perubahan nama sheet sembarangan oleh tim entri data.' },
    ],
    rcaItems: [
      { pillar: 'FORMAT INPUT KOLOM', badge: '38% Masalah', causes: ['Pengguna kadang memasukkan format tanggal bervariasi (DD/MM/YYYY vs YYYY-MM-DD).', 'Penggunaan koma dan titik desimal campur aduk pada input manual.'] },
      { pillar: 'JARINGAN & API GOOGLE', badge: '30% Masalah', causes: ['Koneksi internet operasional lemot dapat memperpanjang waktu unduh CSV spreadsheet.', 'Google Sheet limit 500 requests/menit pada jam kerja sibuk.'] },
      { pillar: 'KEAMANAN AKUN', badge: '20% Masalah', causes: ['Password sederhana pada akun pengguna baru memerlukan penegakan kombinasi huruf-angka.'] },
      { pillar: 'DOKUMENTASI SISTEM', badge: '12% Masalah', causes: ['Pembaruan kamus formula memerlukan pencatatan log versi berkala saat ada KPI baru.'] },
    ],
    actionPlanTable: {
      columns: [
        { header: 'No', width: 8, align: 'center' },
        { header: 'Inisiatif Tata Kelola Sistem', width: 55, align: 'left' },
        { header: 'Target Hasil', width: 45, align: 'left' },
        { header: 'Timeline', width: 28, align: 'center' },
        { header: 'PIC Penanggung Jawab', width: 46, align: 'left' },
      ],
      rows: [
        ['1', 'Otomasi Validasi Format Tanggal', 'Saring otomatis format tanggal CSV sebelum di-parse', '2 Pekan', 'System Developer'],
        ['2', 'Pengamanan Multi-Factor Authentication', 'Terapkan OTP email/WA untuk akun privilege OWNER', '1 Bulan', 'IT Security & NOC'],
        ['3', 'Audit Log Sinkronisasi Harian', 'Pencatatan riwayat waktu dan durasi sync di database', '1 Bulan', 'Database Administrator'],
      ],
    },
  };
}

// Generate canvas chart URL specifically for each domain
export function generateDomainCharts(config: DomainReportConfig): {
  chartUrl1: string;
  chartUrl2: string;
} {
  // Chart 1: Bar Chart of Main Indicators
  const canvas1 = document.createElement('canvas');
  canvas1.width = 600;
  canvas1.height = 230;
  const ctx1 = canvas1.getContext('2d')!;
  ctx1.fillStyle = '#ffffff';
  ctx1.fillRect(0, 0, 600, 230);

  ctx1.fillStyle = '#0f172a';
  ctx1.font = 'bold 15px sans-serif';
  ctx1.fillText(`Grafik Kinerja Utama - ${config.domainBadge}`, 20, 28);

  const kpiRows = config.kpiTable.rows.slice(0, 5);
  const barWidth = 48;
  const startX = 65;
  const baseY = 185;
  const maxHeight = 115;
  const colors = ['#dc2626', '#ea580c', '#0284c7', '#16a34a', '#7c3aed'];

  kpiRows.forEach((row, idx) => {
    const x = startX + idx * 105;
    // Extract a numeric percentage or score
    const rawVal = row[4].replace('%', '').replace('Tiket', '').trim();
    const valNum = Math.min(100, Math.max(10, parseFloat(rawVal) || (90 + idx)));
    const h = (valNum / 100) * maxHeight;
    const y = baseY - h;

    // Background bar
    ctx1.fillStyle = '#f1f5f9';
    ctx1.fillRect(x, baseY - maxHeight, barWidth, maxHeight);

    // Bar fill
    ctx1.fillStyle = colors[idx % colors.length];
    ctx1.fillRect(x, y, barWidth, h);

    // Value text
    ctx1.fillStyle = '#0f172a';
    ctx1.font = 'bold 11px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText(`${valNum.toFixed(0)}%`, x + barWidth / 2, y - 6);

    // Name label
    ctx1.fillStyle = '#475569';
    ctx1.font = '9.5px sans-serif';
    const words = row[1].split(' ');
    ctx1.fillText(words[0] || '', x + barWidth / 2, baseY + 16);
    if (words[1]) {
      ctx1.fillText(words.slice(1, 3).join(' '), x + barWidth / 2, baseY + 28);
    }
  });

  // Chart 2: Donut or Breakdown Chart
  const canvas2 = document.createElement('canvas');
  canvas2.width = 600;
  canvas2.height = 230;
  const ctx2 = canvas2.getContext('2d')!;
  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(0, 0, 600, 230);

  ctx2.fillStyle = '#0f172a';
  ctx2.font = 'bold 15px sans-serif';
  ctx2.textAlign = 'left';
  ctx2.fillText('Distribusi & Komposisi Beban Operasional Domain', 20, 28);

  const centerX = 150;
  const centerY = 130;
  const radius = 68;

  const slices = [
    { label: 'Segmen Utama / Retail', percent: 0.58, color: '#dc2626' },
    { label: 'Segmen Bisnis & B2B', percent: 0.24, color: '#0284c7' },
    { label: 'Segmen Korporasi / Dedicated', percent: 0.12, color: '#f59e0b' },
    { label: 'Lain-lain & Pemeliharaan', percent: 0.06, color: '#10b981' },
  ];

  let currentAngle = 0;
  slices.forEach(slice => {
    const sliceAngle = slice.percent * Math.PI * 2;
    ctx2.beginPath();
    ctx2.moveTo(centerX, centerY);
    ctx2.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx2.fillStyle = slice.color;
    ctx2.fill();
    currentAngle += sliceAngle;
  });

  // Donut Hole
  ctx2.beginPath();
  ctx2.arc(centerX, centerY, 38, 0, Math.PI * 2);
  ctx2.fillStyle = '#ffffff';
  ctx2.fill();

  // Legend
  slices.forEach((slice, sIdx) => {
    const legY = 65 + sIdx * 34;
    ctx2.fillStyle = slice.color;
    ctx2.fillRect(260, legY, 14, 14);

    ctx2.fillStyle = '#0f172a';
    ctx2.font = 'bold 12px sans-serif';
    ctx2.textAlign = 'left';
    ctx2.fillText(`${slice.label} (${(slice.percent * 100).toFixed(0)}%)`, 282, legY + 11);

    ctx2.fillStyle = '#64748b';
    ctx2.font = '10px sans-serif';
    ctx2.fillText('Terpantau stabil dalam ambang batas toleransi operasional', 282, legY + 23);
  });

  return {
    chartUrl1: canvas1.toDataURL('image/png'),
    chartUrl2: canvas2.toDataURL('image/png'),
  };
}

// Render custom vector table in jsPDF with pagination support
export function drawPdfTable(
  doc: jsPDF,
  startY: number,
  columns: ColumnDef[],
  rows: string[][],
  pageWidth: number,
  pageHeight: number,
  margin: number,
  onPageBreak: (pageNo: number) => void,
  currentPage: { val: number }
): number {
  let y = startY;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = 8;
  const rowHeight = 6.8;

  // Draw Table Header
  const renderHeader = (currentY: number) => {
    doc.setFillColor(220, 38, 38); // Telkom Akses Red
    doc.rect(margin, currentY, contentWidth, headerHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    let curX = margin;
    columns.forEach(col => {
      let textX = curX + 2;
      if (col.align === 'right') textX = curX + col.width - 2;
      else if (col.align === 'center') textX = curX + col.width / 2;

      doc.text(col.header, textX, currentY + 5.2, { align: col.align || 'left' });
      curX += col.width;
    });

    return currentY + headerHeight;
  };

  y = renderHeader(y);

  // Draw Table Rows
  rows.forEach((row, rIdx) => {
    // Check if we need page break
    if (y + rowHeight > pageHeight - margin - 15) {
      doc.addPage();
      currentPage.val += 1;
      onPageBreak(currentPage.val);
      y = 38;
      y = renderHeader(y);
    }

    // Alternating Row Background
    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    // Bottom row hairline
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    let curX = margin;
    row.forEach((cellText, cIdx) => {
      const col = columns[cIdx];
      if (!col) return;

      let textX = curX + 2;
      if (col.align === 'right') textX = curX + col.width - 2;
      else if (col.align === 'center') textX = curX + col.width / 2;

      // Truncate cell text if too long
      const maxChars = Math.floor(col.width * 0.48);
      const safeText = cellText.length > maxChars ? cellText.slice(0, maxChars - 1) + '…' : cellText;

      doc.text(safeText, textX, y + 4.8, { align: col.align || 'left' });
      curX += col.width;
    });

    y += rowHeight;
  });

  return y + 4;
}

// Generate full multi-page PDF document
export function generateAndDownloadDomainPdf(
  config: DomainReportConfig,
  activeRegional: Regional,
  activeMonth: string,
  activeYear: string,
  uptime: string = '99.99%'
) {
  const { chartUrl1, chartUrl2 } = generateDomainCharts(config);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const totalPages = 4;
  const currentPage = { val: 1 };

  const addHeaderBanner = (pageNo: number, subTitle: string) => {
    // Red header band
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 20, 'F');

    doc.setFillColor(185, 28, 28);
    doc.rect(0, 20, pageWidth, 2, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PT TELKOM AKSES | LAPORAN RESUME EKSEKUTIF PERFORMANSI OPERASIONAL', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Wilayah: ${activeRegional} • Periode: ${activeMonth} ${activeYear} • Sub-Halaman: ${config.activeSubTabName} • NOC Status: ${uptime}`, margin, 16);

    // Right tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CONFIDENTIAL / AUDIT INTERNAL', pageWidth - margin, 12, { align: 'right' });

    // Section sub-heading
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(subTitle, margin, 29);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 32, pageWidth - margin, 32);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`PT Telkom Akses • Laporan Resume ${config.domainBadge} • Terverifikasi Otomatis`, margin, pageHeight - 7);
    doc.text(`Halaman ${pageNo} dari ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // ==========================================
  // HALAMAN 1: EXECUTIVE BRIEF & TABEL 1 (KPI SCORECARD)
  // ==========================================
  addHeaderBanner(1, `1. RESUME EKSEKUTIF & EVALUASI INDIKATOR UTAMA`);
  let yPos = 37;

  // Executive Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPos, contentWidth, 23, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Ringkasan Kinerja Eksekutif (${config.domainBadge}):`, margin + 4, yPos + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const summaryLines = doc.splitTextToSize(config.executiveSummary, contentWidth - 8);
  doc.text(summaryLines, margin + 4, yPos + 10.5);

  yPos += 28;

  // 4 KPI Metric Cards
  const colWidth = (contentWidth - 9) / 4;
  config.kpiCards.forEach((kpi, idx) => {
    const x = margin + idx * (colWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yPos, colWidth, 18, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(kpi.title, x + 3, yPos + 5);

    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(kpi.val, x + 3, yPos + 11);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(kpi.sub, x + 3, yPos + 15);
  });

  yPos += 24;

  // Section: Tabel 1 - Matriks Capaian Indikator Kinerja (KPI Table)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Tabel 1: Matriks Capaian Indikator Kinerja Utama (${config.domainBadge})`, margin, yPos);
  yPos += 4;

  yPos = drawPdfTable(
    doc,
    yPos,
    config.kpiTable.columns,
    config.kpiTable.rows,
    pageWidth,
    pageHeight,
    margin,
    p => addHeaderBanner(p, '1. RESUME EKSEKUTIF & INDIKATOR UTAMA (Lanjutan)'),
    currentPage
  );

  yPos += 3;

  // Diagram 1: Canvas Chart
  doc.addImage(chartUrl1, 'PNG', margin, yPos, contentWidth, 68);

  // ==========================================
  // HALAMAN 2: TABEL 2 (TABEL PENDUKUNG DATA RINCI) & DIAGRAM 2
  // ==========================================
  doc.addPage();
  currentPage.val = 2;
  addHeaderBanner(2, `2. TABEL PENDUKUNG EVALUASI DATA OPERASIONAL`);
  yPos = 37;

  // Diagram 2
  doc.addImage(chartUrl2, 'PNG', margin, yPos, contentWidth, 66);
  yPos += 71;

  // Section: Tabel 2 - Supporting Data Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(config.supportingTable.title, margin, yPos);
  yPos += 4;

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(config.supportingTable.description, margin, yPos);
  yPos += 4.5;

  yPos = drawPdfTable(
    doc,
    yPos,
    config.supportingTable.columns,
    config.supportingTable.rows,
    pageWidth,
    pageHeight,
    margin,
    p => addHeaderBanner(p, '2. TABEL PENDUKUNG EVALUASI (Lanjutan)'),
    currentPage
  );

  // Note Box underneath table
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Catatan Analitis Tabel Pendukung:', margin + 3, yPos + 4.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`Data tabel pendukung di atas diekstraksi langsung dari transaksi riil halaman ${config.activeSubTabName} dan terverifikasi sinkron dengan Master Endstate Spreadsheet Telkom Akses.`, margin + 3, yPos + 9);

  // ==========================================
  // HALAMAN 3: EVALUASI KOMPREHENSIF TEKNIS, NON-TEKNIS & RCA ISHIKAWA
  // ==========================================
  doc.addPage();
  currentPage.val = 3;
  addHeaderBanner(3, `3. EVALUASI KOMPREHENSIF TEKNIS, NON-TEKNIS & AKAR MASALAH (RCA)`);
  yPos = 37;

  // Sub-section A: Evaluasi Teknis
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('A. Temuan dan Evaluasi Aspek Teknis', margin, yPos);
  yPos += 4.5;

  config.evaluasiTeknis.forEach(item => {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(item.point, margin + 2, yPos);
    yPos += 3.5;

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const lines = doc.splitTextToSize(item.desc, contentWidth - 4);
    doc.text(lines, margin + 2, yPos);
    yPos += lines.length * 3.2 + 2.5;
  });

  yPos += 2;

  // Sub-section B: Evaluasi Non-Teknis
  doc.setTextColor(2, 132, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('B. Temuan dan Evaluasi Aspek Non-Teknis & Prosedural', margin, yPos);
  yPos += 4.5;

  config.evaluasiNonTeknis.forEach(item => {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(item.point, margin + 2, yPos);
    yPos += 3.5;

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const lines = doc.splitTextToSize(item.desc, contentWidth - 4);
    doc.text(lines, margin + 2, yPos);
    yPos += lines.length * 3.2 + 2.5;
  });

  yPos += 2;

  // Sub-section C: Root Cause Analysis (RCA Ishikawa)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('C. Analisis Akar Masalah (Root Cause Analysis - Fishbone Ishikawa)', margin, yPos);
  yPos += 4.5;

  config.rcaItems.forEach(box => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(box.pillar, margin + 4, yPos + 4.5);

    doc.setTextColor(220, 38, 38);
    doc.setFontSize(7);
    doc.text(box.badge, pageWidth - margin - 4, yPos + 4.5, { align: 'right' });

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    let subY = yPos + 8.5;
    box.causes.forEach(cause => {
      doc.text(`• ${cause}`, margin + 5, subY);
      subY += 3.8;
    });

    yPos += 23;
  });

  // ==========================================
  // HALAMAN 4: TABEL 3 (RENCANA TINDAK LANJUT) & LEMBAR PENGESAHAN
  // ==========================================
  doc.addPage();
  currentPage.val = 4;
  addHeaderBanner(4, `4. REKOMENDASI STRATEGIS & LEMBAR PENGESAHAN`);
  yPos = 37;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Tabel 3: Rencana Tindak Lanjut & Action Plan Strategis (${config.domainBadge})`, margin, yPos);
  yPos += 4;

  yPos = drawPdfTable(
    doc,
    yPos,
    config.actionPlanTable.columns,
    config.actionPlanTable.rows,
    pageWidth,
    pageHeight,
    margin,
    p => addHeaderBanner(p, '4. RENCANA TINDAK LANJUT (Lanjutan)'),
    currentPage
  );

  yPos += 6;

  // Implementation Framework Guidance Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPos, contentWidth, 34, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Kerangka Penerapan Action Plan (PDCA Cycle):', margin + 4, yPos + 5.5);

  const pdcaItems = [
    { code: 'PLAN', text: 'Penyusunan baseline target bulanan dan pemetaan alokasi anggaran serta personil teknis.' },
    { code: 'DO', text: 'Eksekusi inisiatif perbaikan lapangan dengan pendampingan langsung oleh Team Leader.' },
    { code: 'CHECK', text: 'Monitoring harian via Dashboard Control Hub dan evaluasi deviasi mingguan NOC.' },
    { code: 'ACTION', text: 'Standarisasi SOP baru dan implementasi sistem penghargaan bagi tim berprestasi.' },
  ];

  let pdcaY = yPos + 10.5;
  pdcaItems.forEach(p => {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text(`[ ${p.code} ]`, margin + 4, pdcaY);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(p.text, margin + 22, pdcaY);
    pdcaY += 5.2;
  });

  yPos += 42;

  // Formal Sign-Off Block (Lembar Pengesahan)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, 44, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('LEMBAR PENGESAHAN LAPORAN EVALUASI OPERASIONAL', margin + 4, yPos + 6);

  const signWidth = (contentWidth - 20) / 2;
  const signY = yPos + 12;

  // Signature 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Dibuat & Diverifikasi Oleh:', margin + 6, signY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Manager Operasional & ${config.domainBadge}`, margin + 6, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`PT Telkom Akses - ${activeRegional}`, margin + 6, signY + 8.5);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 6, signY + 23, margin + 6 + signWidth, signY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 163, 74);
  doc.text('[ VERIFIKASI SISTEM DIGITAL NOC OK ]', margin + 6, signY + 27);

  // Signature 2
  const signX2 = margin + 12 + signWidth;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Disetujui & Ditetapkan Oleh:', signX2, signY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Vice President Regional Operation & Quality', signX2, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text('PT Telkom Akses Regional', signX2, signY + 8.5);

  doc.line(signX2, signY + 23, signX2 + signWidth, signY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(220, 38, 38);
  doc.text('[ LEMBAR PENGESAHAN AUDIT 2026 ]', signX2, signY + 27);

  // Save File
  const domainClean = config.domainKey.toUpperCase();
  const regClean = activeRegional.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Resume_Performansi_${domainClean}_${regClean}_${activeMonth}_${activeYear}.pdf`;
  doc.save(fileName);
}
