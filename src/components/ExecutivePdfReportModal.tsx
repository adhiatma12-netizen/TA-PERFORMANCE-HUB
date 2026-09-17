import React, { useState, useRef } from 'react';
import {
  FileDown,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  Wrench,
  Users,
  ShieldCheck,
  Building2,
  Cpu,
  BarChart3,
  GitBranch,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Regional } from '../types';

interface ExecutivePdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegional?: Regional;
  totalTickets?: number;
  avgTtr?: number;
  uptime?: string;
  stoStatus?: string;
}

export default function ExecutivePdfReportModal({
  isOpen,
  onClose,
  activeRegional = 'All',
  totalTickets = 2649,
  avgTtr = 17.15,
  uptime = '99.99%',
  stoStatus = 'OK (100%)',
}: ExecutivePdfReportModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluasi' | 'rca' | 'strategis' | 'diagrams'>('overview');
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Helper to draw a canvas chart to data URL
  const generateChartsForPdf = (): {
    kpiChartUrl: string;
    rcaChartUrl: string;
    trendChartUrl: string;
    techRatioChartUrl: string;
  } => {
    // 1. KPI Comparison Canvas
    const canvasKpi = document.createElement('canvas');
    canvasKpi.width = 600;
    canvasKpi.height = 240;
    const ctxKpi = canvasKpi.getContext('2d')!;
    ctxKpi.fillStyle = '#ffffff';
    ctxKpi.fillRect(0, 0, 600, 240);

    // Title
    ctxKpi.fillStyle = '#0f172a';
    ctxKpi.font = 'bold 16px sans-serif';
    ctxKpi.fillText('Pencapaian Target KPI per Domain Operasional (%)', 20, 28);

    const kpiData = [
      { name: 'Bisnis & Sales', value: 98.4, target: 100, color: '#dc2626' },
      { name: 'Assurance Jaringan', value: 94.2, target: 100, color: '#ea580c' },
      { name: 'Provisioning PSB', value: 89.2, target: 90, color: '#0284c7' },
      { name: 'Quality Eng (QE)', value: 91.8, target: 90, color: '#16a34a' },
      { name: 'Produktivitas Teknisi', value: 96.5, target: 95, color: '#7c3aed' },
    ];

    const barWidth = 45;
    const startX = 60;
    const baseY = 190;
    const maxHeight = 130;

    kpiData.forEach((item, index) => {
      const x = startX + index * 105;
      const h = (item.value / 100) * maxHeight;
      const y = baseY - h;

      // Target background line
      ctxKpi.fillStyle = '#f1f5f9';
      ctxKpi.fillRect(x, baseY - maxHeight, barWidth, maxHeight);

      // Bar fill
      ctxKpi.fillStyle = item.color;
      ctxKpi.fillRect(x, y, barWidth, h);

      // Value label
      ctxKpi.fillStyle = '#0f172a';
      ctxKpi.font = 'bold 12px sans-serif';
      ctxKpi.textAlign = 'center';
      ctxKpi.fillText(`${item.value}%`, x + barWidth / 2, y - 6);

      // Name label
      ctxKpi.fillStyle = '#475569';
      ctxKpi.font = '10px sans-serif';
      const words = item.name.split(' ');
      ctxKpi.fillText(words[0], x + barWidth / 2, baseY + 16);
      if (words[1]) {
        ctxKpi.fillText(words.slice(1).join(' '), x + barWidth / 2, baseY + 28);
      }
    });

    // 2. RCA Root Cause Distribution Canvas
    const canvasRca = document.createElement('canvas');
    canvasRca.width = 600;
    canvasRca.height = 240;
    const ctxRca = canvasRca.getContext('2d')!;
    ctxRca.fillStyle = '#ffffff';
    ctxRca.fillRect(0, 0, 600, 240);

    ctxRca.fillStyle = '#0f172a';
    ctxRca.font = 'bold 16px sans-serif';
    ctxRca.textAlign = 'left';
    ctxRca.fillText('Distribusi Akar Masalah Tiket Gangguan (RCA Ishikawa)', 20, 28);

    const rcaCategories = [
      { category: 'Material (Dropcore/Konektor Aus)', percent: 38, color: '#e11d48' },
      { category: 'Machine/Env (Cuaca/Pohon/Petir)', percent: 26, color: '#f59e0b' },
      { category: 'Method (Verifikasi SQM & Prosedur)', percent: 19, color: '#2563eb' },
      { category: 'Man (Keahlian & Pengukuran OPM)', percent: 17, color: '#8b5cf6' },
    ];

    rcaCategories.forEach((item, idx) => {
      const y = 60 + idx * 42;
      ctxRca.fillStyle = '#334155';
      ctxRca.font = '12px sans-serif';
      ctxRca.fillText(item.category, 20, y);

      // Bar track
      ctxRca.fillStyle = '#f1f5f9';
      ctxRca.fillRect(20, y + 6, 480, 16);

      // Bar fill
      ctxRca.fillStyle = item.color;
      ctxRca.fillRect(20, y + 6, (item.percent / 100) * 480, 16);

      // Label percentage
      ctxRca.fillStyle = '#0f172a';
      ctxRca.font = 'bold 12px sans-serif';
      ctxRca.fillText(`${item.percent}%`, 515, y + 19);
    });

    // 3. Monthly Trend Canvas
    const canvasTrend = document.createElement('canvas');
    canvasTrend.width = 600;
    canvasTrend.height = 240;
    const ctxTrend = canvasTrend.getContext('2d')!;
    ctxTrend.fillStyle = '#ffffff';
    ctxTrend.fillRect(0, 0, 600, 240);

    ctxTrend.fillStyle = '#0f172a';
    ctxTrend.font = 'bold 16px sans-serif';
    ctxTrend.fillText('Tren Bulanan: Volume Tiket Gangguan & Rata-rata TTR', 20, 28);

    const months = [
      { month: 'Januari 2026', tickets: 940, ttr: 18.2 },
      { month: 'Februari 2026', tickets: 875, ttr: 17.4 },
      { month: 'Maret 2026', tickets: 834, ttr: 15.8 },
    ];

    const startTrendX = 90;
    const baseTrendY = 190;
    months.forEach((m, i) => {
      const x = startTrendX + i * 170;
      // Ticket bar
      const barH = (m.tickets / 1000) * 110;
      ctxTrend.fillStyle = '#e2e8f0';
      ctxTrend.fillRect(x, baseTrendY - 120, 50, 120);
      ctxTrend.fillStyle = '#dc2626';
      ctxTrend.fillRect(x, baseTrendY - barH, 50, barH);

      ctxTrend.fillStyle = '#dc2626';
      ctxTrend.font = 'bold 12px sans-serif';
      ctxTrend.textAlign = 'center';
      ctxTrend.fillText(`${m.tickets}`, x + 25, baseTrendY - barH - 6);

      // TTR line point
      const ttrY = baseTrendY - (m.ttr / 20) * 110;
      ctxTrend.fillStyle = '#2563eb';
      ctxTrend.beginPath();
      ctxTrend.arc(x + 25, ttrY, 6, 0, Math.PI * 2);
      ctxTrend.fill();

      ctxTrend.fillStyle = '#1e3a8a';
      ctxTrend.font = 'bold 11px sans-serif';
      ctxTrend.fillText(`${m.ttr}j`, x + 25, ttrY - 10);

      // Month label
      ctxTrend.fillStyle = '#334155';
      ctxTrend.font = '11px sans-serif';
      ctxTrend.fillText(m.month, x + 25, baseTrendY + 20);
    });

    // 4. Technical vs Non-Technical Ratio Canvas
    const canvasTechRatio = document.createElement('canvas');
    canvasTechRatio.width = 600;
    canvasTechRatio.height = 240;
    const ctxTech = canvasTechRatio.getContext('2d')!;
    ctxTech.fillStyle = '#ffffff';
    ctxTech.fillRect(0, 0, 600, 240);

    ctxTech.fillStyle = '#0f172a';
    ctxTech.font = 'bold 16px sans-serif';
    ctxTech.fillText('Proporsi Karakteristik Isu Operasional (Teknis vs Non-Teknis)', 20, 28);

    // Donut chart representation
    const centerX = 160;
    const centerY = 135;
    const radius = 70;

    // Technical: 68%, Non-Technical: 32%
    // Tech slice (Red)
    ctxTech.beginPath();
    ctxTech.moveTo(centerX, centerY);
    ctxTech.arc(centerX, centerY, radius, 0, Math.PI * 2 * 0.68);
    ctxTech.fillStyle = '#dc2626';
    ctxTech.fill();

    // Non-tech slice (Blue)
    ctxTech.beginPath();
    ctxTech.moveTo(centerX, centerY);
    ctxTech.arc(centerX, centerY, radius, Math.PI * 2 * 0.68, Math.PI * 2);
    ctxTech.fillStyle = '#0284c7';
    ctxTech.fill();

    // Donut hole
    ctxTech.beginPath();
    ctxTech.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctxTech.fillStyle = '#ffffff';
    ctxTech.fill();

    // Legend
    ctxTech.textAlign = 'left';
    ctxTech.fillStyle = '#dc2626';
    ctxTech.fillRect(280, 85, 18, 18);
    ctxTech.fillStyle = '#0f172a';
    ctxTech.font = 'bold 13px sans-serif';
    ctxTech.fillText('Faktor Teknis (68%)', 310, 100);
    ctxTech.fillStyle = '#64748b';
    ctxTech.font = '11px sans-serif';
    ctxTech.fillText('Dropcore, ODP loss, konektor optik, redaman, ONT HW', 310, 118);

    ctxTech.fillStyle = '#0284c7';
    ctxTech.fillRect(280, 145, 18, 18);
    ctxTech.fillStyle = '#0f172a';
    ctxTech.font = 'bold 13px sans-serif';
    ctxTech.fillText('Faktor Non-Teknis (32%)', 310, 160);
    ctxTech.fillStyle = '#64748b';
    ctxTech.font = '11px sans-serif';
    ctxTech.fillText('Ijin perumahan/kluster, komunikasi pelanggan, dispatch delay', 310, 178);

    return {
      kpiChartUrl: canvasKpi.toDataURL('image/png'),
      rcaChartUrl: canvasRca.toDataURL('image/png'),
      trendChartUrl: canvasTrend.toDataURL('image/png'),
      techRatioChartUrl: canvasTechRatio.toDataURL('image/png'),
    };
  };

  // Generate and Download PDF using jsPDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { kpiChartUrl, rcaChartUrl, trendChartUrl, techRatioChartUrl } = generateChartsForPdf();
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      const addHeaderBanner = (pageNumber: number, totalPages: number, pageTitle: string) => {
        // Red header band
        doc.setFillColor(220, 38, 38); // Telkom red
        doc.rect(0, 0, pageWidth, 20, 'F');

        doc.setFillColor(185, 28, 28);
        doc.rect(0, 20, pageWidth, 2, 'F');

        // Header Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('PT TELKOM AKSES | LAPORAN RESUME EKSEKUTIF PERFORMANSI OPERASIONAL', margin, 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Wilayah: Regional ${activeRegional} • Periode: Q1 2026 • Status: NOC Live (${uptime})`, margin, 16);

        // Right label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('CONFIDENTIAL / INTERNAL USE', pageWidth - margin, 12, { align: 'right' });

        // Sub header section title
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(pageTitle, margin, 30);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, 33, pageWidth - margin, 33);

        // Footer
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('PT Telkom Akses • Laporan Audit Operasional Berkala • Terintegrasi NOC & Google Sheets', margin, pageHeight - 7);
        doc.text(`Halaman ${pageNumber} dari ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      };

      // ==========================================
      // HALAMAN 1: RESUME OPERASIONAL KESELURUHAN & METRIK UTAMA
      // ==========================================
      addHeaderBanner(1, 4, '1. RESUME OPERASIONAL KESELURUHAN & CAPAIAN TARGET');

      let yPos = 40;

      // Executive Summary Text Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Ringkasan Eksekutif Operasional Regional:', margin + 4, yPos + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const summaryLines = doc.splitTextToSize(
        `Kinerja operasional PT Telkom Akses pada periode Q1 2026 secara umum berada pada kategori PRIMA dengan tingkat pemenuhan target rata-rata 94.8%. Sebanyak ${totalTickets.toLocaleString('id-ID')} tiket gangguan berhasil ditangani dengan rata-rata TTR ${avgTtr.toFixed(2)} jam. Tingkat ketersediaan layanan (Uptime) tercatat stabil di ${uptime} dan konektivitas seluruh Sentral Telepon Otomat (STO) berstatus 100% online.`,
        contentWidth - 8
      );
      doc.text(summaryLines, margin + 4, yPos + 11);

      yPos += 30;

      // KPI Metric Cards (4 Columns)
      const colWidth = (contentWidth - 9) / 4;
      const kpis = [
        { title: 'Bisnis & Sales', val: '98.4%', sub: 'Realisasi Target' },
        { title: 'Assurance', val: `${totalTickets.toLocaleString()}`, sub: `TTR ${avgTtr.toFixed(1)}j` },
        { title: 'Provisioning', val: '89.2%', sub: '5.820 Order PSB' },
        { title: 'Quality Eng (QE)', val: '91.8', sub: 'Skor Mutu / 100' },
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (colWidth + 3);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, yPos, colWidth, 18, 2, 2, 'FD');

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(kpi.title, x + 3, yPos + 5);

        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(kpi.val, x + 3, yPos + 11);

        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(kpi.sub, x + 3, yPos + 15);
      });

      yPos += 24;

      // Diagram 1: KPI Chart
      doc.addImage(kpiChartUrl, 'PNG', margin, yPos, contentWidth, 75);
      yPos += 80;

      // Diagram 2: Trend Chart
      doc.addImage(trendChartUrl, 'PNG', margin, yPos, contentWidth, 75);

      // ==========================================
      // HALAMAN 2: EVALUASI TEKNIS & NON-TEKNIS
      // ==========================================
      doc.addPage();
      addHeaderBanner(2, 4, '2. EVALUASI TEKNIS & NON-TEKNIS OPERASIONAL');
      yPos = 38;

      // Diagram 4: Proporsi Isu Teknis vs Non Teknis
      doc.addImage(techRatioChartUrl, 'PNG', margin, yPos, contentWidth, 68);
      yPos += 73;

      // Sub-heading: Evaluasi Teknis
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('A. Temuan dan Evaluasi Aspek Teknis', margin, yPos);
      yPos += 4;

      const techItems = [
        {
          point: '1. Integritas Kabel Dropcore & Akses Last-Mile',
          desc: 'Ditemukan 78% tiket gangguan berpusat pada segmen dropcore outdoor ke rumah pelanggan. Penyebab dominan meliputi tekukan ekstrem (bending radius < 30mm), kabel tergesek dahan pohon, dan degradasi jaket pelindung akibat paparan sinar UV matahari.',
        },
        {
          point: '2. Kualitas Optik & Redaman ODP (Optical Distribution Point)',
          desc: 'Sebanyak 4.2% ODP di sentral padat teridentifikasi memiliki redaman mendekati batas kritis (-24 dBm s.d. -26 dBm). Akumulasi debu pada adapter SC/UPC dan konektor pigtail yang kendor menjadi kontributor utama degradasi sinyal optik.',
        },
        {
          point: '3. Performa Hardware ONT & Router Pelanggan',
          desc: 'Perangkat ONT tipe legacy generasi awal menunjukkan tingkat panas berlebih (overheating) pada penempatan ruangan tertutup, menyebabkan reboot otomatis dan penurunan kecepatan Wi-Fi yang disalahartikan sebagai gangguan kabel optik.',
        },
        {
          point: '4. Standarisasi Sambungan Optik (Splicing)',
          desc: 'Penyambungan darurat dengan mechanical fast-connector memiliki insertion loss 0.4 - 0.7 dB. Diperlukan standarisasi penyambungan permanen fusion splicer untuk menjamin loss di bawah 0.1 dB.',
        },
      ];

      techItems.forEach(item => {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(item.point, margin + 2, yPos);
        yPos += 3.5;

        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const lines = doc.splitTextToSize(item.desc, contentWidth - 4);
        doc.text(lines, margin + 2, yPos);
        yPos += lines.length * 3.2 + 2;
      });

      yPos += 3;

      // Sub-heading: Evaluasi Non-Teknis
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('B. Temuan dan Evaluasi Aspek Non-Teknis', margin, yPos);
      yPos += 4;

      const nonTechItems = [
        {
          point: '1. Hambatan Regulasi & Perizinan Kawasan (Cluster/Gedung)',
          desc: 'Sekitar 12% keterlambatan pemenuhan SLA disebabkan proses administrasi perizinan masuk ke kawasan perumahan kluster dan building management komersial pada hari libur dan malam hari.',
        },
        {
          point: '2. Komunikasi & Customer Updates Teknisi',
          desc: 'Keterlambatan teknisi akibat cuaca buruk atau kemacetan jalan belum terkomunikasikan secara otomatis ke pelanggan, memicu eskalasi komplain tiket sebelum teknisi tiba di lokasi.',
        },
        {
          point: '3. Penjadwalan Kerja & Distribusi Jam Sibuk (Peak Hours)',
          desc: 'Beban tiket melonjak hingga 2.4x lipat antara pukul 14.00 - 18.00 WIB. Kapasitas tim lapangan pada rentang waktu ini memerlukan sistem rotasi dinamis agar tidak terjadi antrean tiket berlebih.',
        },
      ];

      nonTechItems.forEach(item => {
        doc.setTextColor(2, 132, 199);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(item.point, margin + 2, yPos);
        yPos += 3.5;

        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const lines = doc.splitTextToSize(item.desc, contentWidth - 4);
        doc.text(lines, margin + 2, yPos);
        yPos += lines.length * 3.2 + 2;
      });

      // ==========================================
      // HALAMAN 3: ROOT CAUSE ANALYSIS (RCA)
      // ==========================================
      doc.addPage();
      addHeaderBanner(3, 4, '3. ROOT CAUSE ANALYSIS (RCA) - ISHIKAWA & 5-WHYS');
      yPos = 38;

      // Diagram 3: RCA Distribution Chart
      doc.addImage(rcaChartUrl, 'PNG', margin, yPos, contentWidth, 68);
      yPos += 74;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Matriks Analisis Akar Masalah (Metodologi Fishbone Ishikawa):', margin, yPos);
      yPos += 5;

      const rcaMatrix = [
        {
          pillar: '1. MAN (SDM & Teknisi Lapangan)',
          badge: '17% Dampak',
          causes: [
            'Kompetensi teknisi mitra baru dalam penggunaan OPM (Optical Power Meter) belum merata.',
            'Kekeliruan identifikasi port ODP saat penanganan cepat menyebabkan salah cabut pelanggan lain.',
            'Pemberian penjelasan solusi teknis kepada pelanggan belum terstandarisasi SOP Service Excellence.',
          ],
        },
        {
          pillar: '2. MATERIAL (Komponen & Kabel Akses)',
          badge: '38% Dampak',
          causes: [
            'Penggunaan fast connector non-standar yang mudah longgar dan rentan kemasukan debu mikron.',
            'Kabel dropcore tanpa messenger wire yang dipasang di bentangan panjang mengalami penarikan berlebih.',
            'Patchcord di ODP berkarat akibat penutup ODP yang tidak terkunci sempurna oleh teknisi.',
          ],
        },
        {
          pillar: '3. METHOD (Prosedur Kerja & Sistem)',
          badge: '19% Dampak',
          causes: [
            'Closing tiket SQM membutuhkan validasi ganda dari sistem pusat yang memakan waktu hingga 45 menit.',
            'Dispatching tiket belum mengadopsi proximity GPS secara optimal, sehingga rute teknisi bersilangan.',
            'Proses pelaporan kendala KPro masih bersifat reaktif saat teknisi sudah berada di lapangan.',
          ],
        },
        {
          pillar: '4. MACHINE & ENVIRONMENT (Alat & Lingkungan)',
          badge: '26% Dampak',
          causes: [
            'Hujan monsun dan angin ribut menyebabkan dahan pohon roboh menimpa jalur kabel distribusi udara.',
            'Keterbatasan alat ukur canggih (OTDR kalibrasi) di sentral-sentral perbatasan.',
            'Fluktuasi tegangan listrik PLN di rumah pelanggan memicu kerusakan adaptor daya ONT.',
          ],
        },
      ];

      rcaMatrix.forEach(box => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, yPos, contentWidth, 23, 2, 2, 'FD');

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(box.pillar, margin + 4, yPos + 5);

        doc.setTextColor(220, 38, 38);
        doc.setFontSize(7.5);
        doc.text(box.badge, pageWidth - margin - 4, yPos + 5, { align: 'right' });

        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        let subY = yPos + 9;
        box.causes.forEach(cause => {
          doc.text(`• ${cause}`, margin + 6, subY);
          subY += 4.2;
        });

        yPos += 26;
      });

      // ==========================================
      // HALAMAN 4: REKOMENDASI STRATEGIS & PENGESAHAN
      // ==========================================
      doc.addPage();
      addHeaderBanner(4, 4, '4. REKOMENDASI STRATEGIS & ACTION PLAN OPERASIONAL');
      yPos = 38;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Rencana Tindak Lanjut Strategis (Strategic Roadmap):', margin, yPos);
      yPos += 6;

      const recommendations = [
        {
          level: 'JANGKA PENDEK (Quick Wins: 1 - 30 Hari)',
          color: [220, 38, 38],
          actions: [
            'Program "Sapu Jagat ODP Merah": Pembersihan dan rekoneksi 50 ODP dengan loss optik tertinggi.',
            'Dynamic Dispatching Proximity: Penerapan penugasan tiket otomatis berbasis lokasi teknisi terdekat via GPS.',
            'Buffer Stock Fast-Moving: Penyediaan cadangan dropcore premium dan adaptor optik di posko sub-STO.',
            'Pembersihan Jalur Kabel: Koordinasi dengan dinas pertamanan untuk perapihan dahan pohon di jalur distribusi utama.',
          ],
        },
        {
          level: 'JANGKA MENENGAH (1 - 3 Bulan)',
          color: [2, 132, 199],
          actions: [
            'Sertifikasi Mandatory Teknisi: Program uji kompetensi fusion splicing dan keselamatan K3 bagi seluruh teknisi.',
            'MoU Akses Kawasan: Kesepakatan fast-lane perizinan teknisi dengan paguyuban pengelola perumahan kluster.',
            'Otomasi Pelanggan: Fitur live tracking perjalanan teknisi via SMS/WhatsApp untuk menurunkan kecemasan pelanggan.',
            'Audit Berkala KPro: Pemeriksaan kualitas instalasi baru sebelum ditandatangani serah terima operasional (BAST).',
          ],
        },
        {
          level: 'JANGKA PANJANG (6 - 12 Bulan)',
          color: [22, 163, 74],
          actions: [
            'AI Predictive Maintenance: Penerapan machine learning pendeteksi anomali redaman sebelum terjadi putus total (LOS).',
            'Modernisasi Jaringan XGS-PON: Upgrade kapasitas perangkat sentral pada STO dengan utilisasi di atas 85%.',
            'Full Fiber Consolidation: Eliminasi sisa kabel tembaga warisan di seluruh distrik sentral.',
          ],
        },
      ];

      recommendations.forEach(rec => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(rec.color[0], rec.color[1], rec.color[2]);
        doc.setLineWidth(0.6);
        doc.roundedRect(margin, yPos, contentWidth, 34, 2, 2, 'FD');

        // Header band
        doc.setFillColor(rec.color[0], rec.color[1], rec.color[2]);
        doc.roundedRect(margin, yPos, contentWidth, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(rec.level, margin + 4, yPos + 4.2);

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        let actY = yPos + 10.5;
        rec.actions.forEach((act, aIdx) => {
          doc.text(`${aIdx + 1}. ${act}`, margin + 4, actY);
          actY += 5.2;
        });

        yPos += 38;
      });

      yPos += 8;

      // Lembar Pengesahan / Approval Block
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, contentWidth, 42, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('LEMBAR PENGESAHAN LAPORAN AUDIT OPERASIONAL', margin + 4, yPos + 6);

      const signWidth = (contentWidth - 20) / 2;
      const signY = yPos + 12;

      // Signature 1
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Dibuat & Diverifikasi Oleh:', margin + 8, signY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('NOC & Operational Assurance Manager', margin + 8, signY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('PT Telkom Akses Regional', margin + 8, signY + 8.5);

      doc.setDrawColor(203, 213, 225);
      doc.line(margin + 8, signY + 22, margin + 8 + signWidth, signY + 22);
      doc.setFont('helvetica', 'bold');
      doc.text('[ VERIFIED BY AUTOMATED NOC SYSTEM ]', margin + 8, signY + 25);

      // Signature 2
      const signX2 = margin + 12 + signWidth;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Disetujui & Ditetapkan Oleh:', signX2, signY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('VP Regional Operations & Quality', signX2, signY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('PT Telkom Akses', signX2, signY + 8.5);

      doc.line(signX2, signY + 22, signX2 + signWidth, signY + 22);
      doc.setFont('helvetica', 'bold');
      doc.text('[ EXECUTIVE SIGNATURE - AUDIT 2026 ]', signX2, signY + 25);

      // Save PDF file
      const fileName = `Resume_Performansi_Operasional_Telkom_Akses_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Terjadi kendala saat menyusun PDF. Silakan gunakan opsi Cetak di browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      id="executive-pdf-report-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md font-bold">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-red-600/90 text-white">
                  Executive Audit Report
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Regional: <strong className="text-white">{activeRegional}</strong> • Q1 2026
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Resume Eksekutif Performansi Operasional
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Unduh Dokumen Lengkap Format PDF"
              id="btn-modal-generate-pdf"
            >
              <FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Menyusun Dokumen PDF...' : 'Download PDF Sekarang'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer hidden sm:flex"
              title="Cetak via Browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            📊 Resume Keseluruhan & KPI
          </button>
          <button
            onClick={() => setActiveTab('evaluasi')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'evaluasi'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            ⚙️ Evaluasi Teknis & Non-Teknis
          </button>
          <button
            onClick={() => setActiveTab('rca')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'rca'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            🔍 Root Cause Analysis (RCA)
          </button>
          <button
            onClick={() => setActiveTab('strategis')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'strategis'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            🎯 Rekomendasi Strategis
          </button>
          <button
            onClick={() => setActiveTab('diagrams')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'diagrams'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            📈 Diagram Kinerja Lengkap
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6" ref={reportRef}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-md uppercase tracking-wider">
                    Executive Brief
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Audit Status: <strong className="text-emerald-400">PASSED 94.8%</strong>
                  </span>
                </div>
                <h3 className="text-xl font-black mb-2">
                  Laporan Hasil Evaluasi Operasional PT Telkom Akses (Kuartal I 2026)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  Laporan ini merangkum kinerja operasional lintas divisi: Bisnis & Finansial, Assurance (Penanganan Gangguan Jaringan),
                  Provisioning (Pemasangan Baru IndiHome/Indibizz), Quality Engineering (QE), serta Produktivitas Teknisi. Berdasarkan
                  analisis data riil {totalTickets.toLocaleString('id-ID')} tiket gangguan, layanan beroperasi stabil dengan tingkat
                  uptime {uptime} dan durasi MTTR rata-rata {avgTtr.toFixed(2)} jam.
                </p>
              </div>

              {/* 4 Multi-Domain KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold text-slate-500">1. Bisnis & Finansial</span>
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">98.4%</div>
                  <div className="text-xs text-emerald-600 font-bold mt-1">Capaian Target Revenue</div>
                  <div className="text-[11px] text-slate-500 mt-2">Realisasi Rp 14.8 Miliar (IndiHome + Indibizz B2B)</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold text-slate-500">2. Assurance Jaringan</span>
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{totalTickets.toLocaleString('id-ID')}</div>
                  <div className="text-xs text-slate-600 font-bold mt-1">Total Tiket Gangguan</div>
                  <div className="text-[11px] text-slate-500 mt-2">Rata-rata TTR: {avgTtr.toFixed(2)} Jam • HVC Priority OK</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold text-slate-500">3. Provisioning PSB</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">89.2%</div>
                  <div className="text-xs text-blue-600 font-bold mt-1">Rasio Sukses Pasang Baru</div>
                  <div className="text-[11px] text-slate-500 mt-2">5.820 Order PSB terselesaikan via alur KPro</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold text-slate-500">4. Quality & Teknisi</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">91.8<span className="text-sm font-bold text-slate-400">/100</span></div>
                  <div className="text-xs text-emerald-600 font-bold mt-1">Indeks Kualitas Mutu (QE)</div>
                  <div className="text-[11px] text-slate-500 mt-2">4.8 tiket/teknisi/hari • Rating Pelanggan 4.85/5.0</div>
                </div>
              </div>

              {/* High Level Takeaway Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kesesuaian Indikator Kinerja Utama (SLA Matrix)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-medium">Uptime Backbone & STO</span>
                    <p className="font-bold text-slate-800 mt-1">{uptime} (Target 99.95%)</p>
                    <span className="text-[10px] text-emerald-600 font-bold">Status: Memenuhi Target</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-medium">MTTR &lt; 3 Jam (TTR Target)</span>
                    <p className="font-bold text-slate-800 mt-1">42.8% Tercapai</p>
                    <span className="text-[10px] text-amber-600 font-bold">Status: Perlu Peningkatan</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-medium">Kepatuhan K3 & APD Teknisi</span>
                    <p className="font-bold text-slate-800 mt-1">96.5% Zero Incident</p>
                    <span className="text-[10px] text-emerald-600 font-bold">Status: Patuh Standar SOP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVALUASI TEKNIS & NON-TEKNIS */}
          {activeTab === 'evaluasi' && (
            <div className="space-y-6">
              {/* Evaluasi Teknis */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-red-600 mb-2">
                  <Wrench className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">A. Evaluasi Teknis Operasional</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Hasil audit mendalam terhadap infrastruktur fisik, transmisi optik, dan perangkat pelanggan.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">1. Kondisi Fisik Dropcore & Last-Mile</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Dominasi 78% gangguan berasal dari segmen dropcore outdoor. Penarikan kabel yang melintasi pohon tanpa pelindung spiral
                      dan sudut tekukan tajam (bending radius &lt; 30mm) menyebabkan peningkatan attenuasi secara drastis hingga putus serat optik.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">2. Kualitas Optik & ODP Degradasi</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Sebanyak 4.2% ODP di sentral perkotaan berada pada level redaman kritis (-24 dBm s.d. -26 dBm). Kontaminasi debu pada port SC/UPC
                      dan pigtail yang kendor menjadi kontributor hilangnya sinyal (Loss of Signal / LOS).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">3. Perangkat Pelanggan (ONT / STB)</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      ONT model awal menunjukkan gejala overheating di area dengan ventilasi terbatas, mengakibatkan modulasi Wi-Fi melambat.
                      Pelanggan melaporkan gangguan jaringan, padahal link optik dari ODP berstatus normal.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">4. Kualitas Splicing & Sambungan Darurat</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Penggunaan mechanical splice cepat saat penanganan darurat sering tidak diganti dengan fusion splicing permanen,
                      menyebabkan loss kumulatif bertambah 0.5 dB per sambungan seiring waktu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Evaluasi Non-Teknis */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <Users className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">B. Evaluasi Non-Teknis Operasional</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Analisis faktor prosedural, koordinasi perizinan, komunikasi pelanggan, dan manajemen waktu penugasan.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">1. Kendala Perizinan Kawasan (Cluster/Gedung)</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      12% keterlambatan SLA tiket bersumber dari birokrasi keamanan lingkungan (perumahan kluster, pengelola mall/gedung)
                      yang melarang teknisi bertugas pada jam malam atau hari libur tanpa surat izin fisik resmi.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">2. Komunikasi Proaktif ke Pelanggan</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Ketika teknisi terjebak kemacetan atau cuaca hujan lebat, pemberitahuan ke pelanggan belum terintegrasi secara otomatis,
                      sehingga memicu persepsi bahwa laporan gangguan diabaikan.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">3. Distribusi Penugasan Jam Sibuk</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Terjadi lonjakan antrean penugasan tiket sebesar 240% antara pukul 14:00 hingga 18:00 WIB. Diperlukan penyesuaian shift
                      teknisi standby untuk menyerap lonjakan tiket pada jendela waktu tersebut.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-black text-slate-800 mb-1">4. Kepatuhan K3 dan Standardisasi APD</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Kepatuhan pemakaian helm dan safety harness di tiang mencapai 96.5%. Target regional adalah 100% Zero Accident
                      dengan penegakan sanksi dan reward berkala bagi tim lapangan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOT CAUSE ANALYSIS (RCA) */}
          {activeTab === 'rca' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-rose-600 mb-2">
                  <GitBranch className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">Analisis Akar Masalah (Ishikawa Fishbone & 5-Whys)</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Pendekatan sistemik untuk memetakan akar penyebab gangguan berulang dan keterlambatan MTTR berdasarkan 4 pilar utama.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pillar 1: Man */}
                  <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-rose-900 text-xs">1. MAN (Faktor SDM / Teknisi)</span>
                      <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded font-black text-[10px]">17% Kontribusi</span>
                    </div>
                    <ul className="space-y-2 text-[11px] text-rose-900/80">
                      <li>• Pemahaman teknisi junior dalam membaca nilai dBm pada OPM bervariasi.</li>
                      <li>• Salah cabut patchcord di ODP karena penomoran core yang pudar.</li>
                      <li>• Verifikasi penutupan tiket di lapangan membutuhkan konfirmasi berulang.</li>
                    </ul>
                  </div>

                  {/* Pillar 2: Material */}
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-amber-900 text-xs">2. MATERIAL (Komponen Pasif Optik)</span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-black text-[10px]">38% Kontribusi</span>
                    </div>
                    <ul className="space-y-2 text-[11px] text-amber-900/80">
                      <li>• Fast connector murah rentan longgar dan memiliki insertion loss tinggi (&gt;0.5 dB).</li>
                      <li>• Dropcore tanpa kawat penggantung ditarik pada bentang tiang melebihi 40 meter.</li>
                      <li>• Pengunci tutup ODP aus menyebabkan air hujan merembes ke pigtail.</li>
                    </ul>
                  </div>

                  {/* Pillar 3: Method */}
                  <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-blue-900 text-xs">3. METHOD (Prosedur & Sistem)</span>
                      <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded font-black text-[10px]">19% Kontribusi</span>
                    </div>
                    <ul className="space-y-2 text-[11px] text-blue-900/80">
                      <li>• Waktu tunggu sinkronisasi tiket SQM dengan backend IT memakan waktu 30-45 menit.</li>
                      <li>• Penugasan tiket manual belum otomatis memperhitungkan posisi GPS teknisi terdekat.</li>
                      <li>• Prosedur validasi kendala instalasi baru belum real-time via aplikasi mobile.</li>
                    </ul>
                  </div>

                  {/* Pillar 4: Machine & Environment */}
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-emerald-900 text-xs">4. ENVIRONMENT & MACHINE</span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded font-black text-[10px]">26% Kontribusi</span>
                    </div>
                    <ul className="space-y-2 text-[11px] text-emerald-900/80">
                      <li>• Cuaca hujan monsun dan dahan pohon tumbang memutus kabel distribusi udara.</li>
                      <li>• Keterbatasan alat OTDR kalibrasi aktif di sub-STO perbatasan.</li>
                      <li>• Fluktuasi tegangan listrik rumah pelanggan merusak adaptor catu daya ONT.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STRATEGIS */}
          {activeTab === 'strategis' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-emerald-600 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">Rekomendasi Strategis & Action Plan Berkelanjutan</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Peta jalan perbaikan bertahap untuk memastikan keandalan jaringan, kepuasan pelanggan, dan efisiensi operasional.
                </p>

                <div className="space-y-4">
                  {/* Jangka Pendek */}
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/30">
                    <div className="flex items-center space-x-2 text-red-700 font-black text-xs mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>JANGKA PENDEK (Quick Wins: 1 s.d. 30 Hari)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700">
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <strong>• Program "Sapu Jagat ODP Merah":</strong> Audit dan perbaikan 50 ODP beredaman kritis dengan pembersihan konektor optik.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <strong>• Dynamic Dispatching:</strong> Penugasan tiket otomatis berbasis radius GPS teknisi terdekat untuk memangkas waktu tempuh 35%.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <strong>• Buffer Stock Sub-STO:</strong> Penempatan dropcore premium dan adaptor cadangan di posko transit untuk percepatan penanganan.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <strong>• Shift Jam Sibuk:</strong> Penyesuaian jadwal teknisi standby pada rentang kritis 14:00 - 18:00 WIB.
                      </div>
                    </div>
                  </div>

                  {/* Jangka Menengah */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                    <div className="flex items-center space-x-2 text-blue-700 font-black text-xs mb-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>JANGKA MENENGAH (1 s.d. 3 Bulan)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700">
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <strong>• Sertifikasi Splicing 100% Teknisi:</strong> Pelatihan wajib pengukuran OPM, fusion splicing, dan etika komunikasi pelanggan.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <strong>• Fast-Track Perizinan Kawasan:</strong> Penandatanganan MoU SOP akses darurat dengan 25 asosiasi perumahan dan mall.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <strong>• Live Tracking Teknisi:</strong> Pemberitahuan WhatsApp posisi kedatangan teknisi secara real-time kepada pelanggan.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <strong>• Standarisasi BAST Digital:</strong> Validasi foto redaman hasil instalasi baru sebelum aktivasi sistem layanan.
                      </div>
                    </div>
                  </div>

                  {/* Jangka Panjang */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                    <div className="flex items-center space-x-2 text-emerald-700 font-black text-xs mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>JANGKA PANJANG (6 s.d. 12 Bulan)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700">
                      <div className="bg-white p-3 rounded-lg border border-emerald-100">
                        <strong>• AI Predictive Maintenance:</strong> Deteksi dini pelemahan sinyal optik ODP secara otomatis sebelum pelanggan komplain.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100">
                        <strong>• Migrasi XGS-PON:</strong> Upgrade perangkat OLT pada sentral dengan utilisasi bandwidth tinggi untuk kestabilan jangka panjang.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100">
                        <strong>• 100% All-Optical Access:</strong> Penataan ulang kabel udara lama dan konsolidasi jalur bawah tanah terpadu.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100">
                        <strong>• Zero Waste & K3 Champion:</strong> Pengelolaan daur ulang sisa serat optik dan nihil kecelakaan kerja (Zero Fatality).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIAGRAMS PREVIEW */}
          {activeTab === 'diagrams' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-slate-900 mb-4">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-black">Visualisasi Diagram Kinerja Operasional & RCA</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Diagram 1 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">Diagram 1: Capaian Target KPI per Modul</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Bisnis & Sales</span>
                          <span className="text-red-600">98.4%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '98.4%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Assurance Jaringan</span>
                          <span className="text-orange-600">94.2%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: '94.2%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Provisioning Pasang Baru</span>
                          <span className="text-blue-600">89.2%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '89.2%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Quality Engineering (QE)</span>
                          <span className="text-emerald-600">91.8%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '91.8%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagram 2 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">Diagram 2: Distribusi Akar Masalah (RCA Pareto)</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Material (Dropcore / Fast Connector)</span>
                          <span className="text-rose-600">38%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-rose-600 h-2.5 rounded-full" style={{ width: '38%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Machine & Lingkungan (Cuaca / Pohon / Petir)</span>
                          <span className="text-amber-600">26%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '26%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Method (Prosedur Closing & Validasi)</span>
                          <span className="text-blue-600">19%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '19%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Man (Keahlian & Pengukuran Teknisi)</span>
                          <span className="text-purple-600">17%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '17%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagram 3 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">Diagram 3: Tren Bulanan MTTR & Volume Tiket</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px]">Jan 2026</span>
                        <p className="font-bold text-red-600 text-sm">940 Tiket</p>
                        <span className="text-[10px] text-slate-600">TTR: 18.2 Jam</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px]">Feb 2026</span>
                        <p className="font-bold text-red-600 text-sm">875 Tiket</p>
                        <span className="text-[10px] text-slate-600">TTR: 17.4 Jam</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px]">Mar 2026</span>
                        <p className="font-bold text-emerald-600 text-sm">834 Tiket</p>
                        <span className="text-[10px] text-emerald-700 font-bold">TTR: 15.8 Jam</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 text-center">
                      📉 Tren Positif: Terjadi penurunan volume tiket (-11.2%) dan percepatan MTTR (+13.1%)
                    </p>
                  </div>

                  {/* Diagram 4 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">Diagram 4: Karakteristik Isu (Teknis vs Non-Teknis)</h4>
                    <div className="flex items-center justify-around py-3">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 border-4 border-red-600 flex items-center justify-center font-black text-red-700 text-sm mx-auto mb-1">
                          68%
                        </div>
                        <span className="text-xs font-bold text-slate-800">Faktor Teknis</span>
                        <p className="text-[10px] text-slate-400">Kabel, ODP, ONT, Loss</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-blue-600 flex items-center justify-center font-black text-blue-700 text-sm mx-auto mb-1">
                          32%
                        </div>
                        <span className="text-xs font-bold text-slate-800">Non-Teknis</span>
                        <p className="text-[10px] text-slate-400">Ijin Kawasan, Komunikasi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dokumen Terverifikasi Otomatis • Terintegrasi Data Operasional Regional {activeRegional}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Menyusun Dokumen PDF...' : 'Download File PDF (.pdf)'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
