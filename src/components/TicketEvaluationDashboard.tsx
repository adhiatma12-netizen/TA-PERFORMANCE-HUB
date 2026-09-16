import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Ticket,
  Search,
  Download,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Radio,
  Sparkles,
  Wrench,
  Activity,
  Calendar,
  X,
  Info,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AssuranceTicketRecord, FALLBACK_ASSURANCE_TICKETS } from '../data/assuranceTicketFallback';
import {
  fetchAssuranceTickets,
  ASSURANCE_SPREADSHEET_ID,
  DEFAULT_SHEET_TAB,
} from '../lib/assuranceTicketFetcher';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

const SERVICE_TYPE_COLORS: { [key: string]: string } = {
  INTERNET: '#EF4444', // Red
  IPTV: '#3B82F6',     // Blue
  VOICE: '#10B981',    // Emerald
};

const HVC_COLORS: { [key: string]: string } = {
  HVC_DIAMOND: '#06B6D4',
  HVC_PLATINUM: '#8B5CF6',
  HVC_GOLD: '#F59E0B',
  REGULER: '#64748B',
};

const PALETTE = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#84CC16'];

// Helper to categorize Actual Solution for high-level grouping
function categorizeSolution(sol: string): string {
  const s = (sol || '').toUpperCase();
  if (!s || s.includes('(KOSONG') || s === '-') return 'Belum Ada Solusi / Kosong';
  if (s.includes('AUTOCLOSE') || s.includes('AUTO-CLOSED') || s.includes('RELASI KE GAMAS') || s.includes('STATUS ONT UP')) {
    return 'Auto-Closed SQM / Gamas';
  }
  if (s.includes('DROP CORE') || s.includes('DROPCORE') || s.includes('SAMBUNG DROP') || s.includes('GANTI DROP')) {
    return 'Perbaikan Drop Core (Kabel)';
  }
  if (s.includes('MODEM') || s.includes('ONT') || s.includes('PORT LAN') || s.includes('GANTI MODEM') || s.includes('GANTI ONT')) {
    return 'Penggantian / Setting Modem & ONT';
  }
  if (s.includes('SOC') || s.includes('CONNECTOR') || s.includes('KONEKTOR')) {
    return 'Perbaikan SOC & Konektor';
  }
  if (s.includes('GAMAS') || s.includes('FEEDER') || s.includes('DISTRIBUSI') || s.includes('SAMBUNG FO')) {
    return 'Penanganan Jaringan Luar / Feeder Gamas';
  }
  if (s.includes('SETTING') || s.includes('CONFIG') || s.includes('EDUKASI')) {
    return 'Setting Konfigurasi & Edukasi Pelanggan';
  }
  return 'Tindakan Fisik / Perbaikan Lainnya';
}

// Format number with strictly two decimal digits (e.g. 17.15, 2.05, 0.00)
function formatTwoDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num) || num <= 0) return '0.00';
  return num.toFixed(2);
}

// Parse date from Kolom F ("6/8/2026 23:15:00" or "DD/MM/YYYY")
function parseDateParts(dateStr: string): { day: number; month: number; year: number; dateKey: string; label: string } | null {
  if (!dateStr) return null;
  const firstPart = dateStr.trim().split(' ')[0];
  const parts = firstPart.split(/[/.-]/);
  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const mStr = monthNames[month] || `M${month}`;
  const dPadded = day < 10 ? `0${day}` : `${day}`;
  const dateKey = `${year}-${month < 10 ? '0' + month : month}-${dPadded}`;
  const label = `${dPadded} ${mStr}`;

  return { day, month, year, dateKey, label };
}

export default function TicketEvaluationDashboard() {
  const [tickets, setTickets] = useState<AssuranceTicketRecord[]>(FALLBACK_ASSURANCE_TICKETS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filters
  const [selectedSektor, setSelectedSektor] = useState<string>('ALL');
  const [selectedSto, setSelectedSto] = useState<string>('ALL');
  const [selectedTypeLayanan, setSelectedTypeLayanan] = useState<string>('ALL');
  const [selectedTypeTiket, setSelectedTypeTiket] = useState<string>('ALL');
  const [selectedHvc, setSelectedHvc] = useState<string>('ALL');
  const [selectedSolutionCategory, setSelectedSolutionCategory] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active sub-tab inside Evaluation view
  const [activeSubSection, setActiveSubSection] = useState<'actual_solution' | 'subsegmentasi' | 'type_layanan' | 'daily_trend' | 'table'>('actual_solution');

  // Table pagination & sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [sortField, setSortField] = useState<string>('troubleOpenTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal ticket detail
  const [selectedTicket, setSelectedTicket] = useState<AssuranceTicketRecord | null>(null);

  // AI Evaluation Modal State
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    tableName: string;
    filterContext: Record<string, any>;
    summaryMetrics: Record<string, any>;
    sampleRows: any[];
    promptNote?: string;
  }>({
    isOpen: false,
    tableName: '',
    filterContext: {},
    summaryMetrics: {},
    sampleRows: [],
  });

  const openAiModal = (
    tableName: string,
    summaryMetrics: Record<string, any>,
    sampleRows: any[],
    customFilters: Record<string, any> = {},
    promptNote: string = ''
  ) => {
    setAiModalState({
      isOpen: true,
      tableName,
      filterContext: {
        Sektor: selectedSektor,
        STO: selectedSto,
        'Type Layanan': selectedTypeLayanan,
        'Type Tiket': selectedTypeTiket,
        HVC: selectedHvc,
        Kategori: selectedSolutionCategory,
        Tanggal: selectedDate,
        ...customFilters,
      },
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Fetch live ticket data
  const loadLiveData = async () => {
    setIsLoading(true);
    setSyncError(null);
    try {
      const data = await fetchAssuranceTickets(ASSURANCE_SPREADSHEET_ID, DEFAULT_SHEET_TAB);
      if (data && data.records && data.records.length > 0) {
        setTickets(data.records);
        setIsLive(data.isLive);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      } else {
        throw new Error('Data spreadsheet kosong.');
      }
    } catch (err: any) {
      console.warn('Gagal fetch live tiket assurance, memakai cache fallback:', err);
      setSyncError(err.message || 'Gagal koneksi live spreadsheet');
      setTickets(FALLBACK_ASSURANCE_TICKETS);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  // Filtered dataset
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (selectedSektor !== 'ALL' && t.sektor !== selectedSektor) return false;
      if (selectedSto !== 'ALL' && t.sto !== selectedSto) return false;
      if (selectedTypeLayanan !== 'ALL' && (t.typeLayanan || 'INTERNET') !== selectedTypeLayanan) return false;
      if (selectedTypeTiket !== 'ALL' && !t.typeTiket.includes(selectedTypeTiket)) return false;
      if (selectedHvc !== 'ALL' && t.flagHvc !== selectedHvc) return false;
      if (selectedSolutionCategory !== 'ALL' && categorizeSolution(t.actualSolution) !== selectedSolutionCategory) return false;
      
      if (selectedDate !== 'ALL') {
        const dp = parseDateParts(t.troubleOpenTime);
        if (!dp || dp.dateKey !== selectedDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (t.troubleNo && t.troubleNo.toLowerCase().includes(q)) ||
          (t.troubleNumber && t.troubleNumber.toLowerCase().includes(q)) ||
          (t.actualSolution && t.actualSolution.toLowerCase().includes(q)) ||
          (t.subsegmentasi && t.subsegmentasi.toLowerCase().includes(q)) ||
          (t.sto && t.sto.toLowerCase().includes(q)) ||
          (t.odp && t.odp.toLowerCase().includes(q)) ||
          (t.closedBy && t.closedBy.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [tickets, selectedSektor, selectedSto, selectedTypeLayanan, selectedTypeTiket, selectedHvc, selectedSolutionCategory, selectedDate, searchQuery]);

  // Unique options for filter dropdowns
  const filterOptions = useMemo(() => {
    const sektors = new Set<string>();
    const stos = new Set<string>();
    const typeLayanans = new Set<string>();
    const typeTikets = new Set<string>();
    const hvcs = new Set<string>();
    const categories = new Set<string>();
    const datesMap = new Map<string, { dateKey: string; label: string; count: number }>();

    tickets.forEach(t => {
      if (t.sektor) sektors.add(t.sektor);
      if (t.sto) stos.add(t.sto);
      typeLayanans.add(t.typeLayanan || 'INTERNET');
      if (t.typeTiket) typeTikets.add(t.typeTiket);
      if (t.flagHvc) hvcs.add(t.flagHvc);
      categories.add(categorizeSolution(t.actualSolution));

      const dp = parseDateParts(t.troubleOpenTime);
      if (dp) {
        if (!datesMap.has(dp.dateKey)) {
          datesMap.set(dp.dateKey, { dateKey: dp.dateKey, label: dp.label, count: 0 });
        }
        datesMap.get(dp.dateKey)!.count += 1;
      }
    });

    const datesSorted = Array.from(datesMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return {
      sektors: Array.from(sektors).sort(),
      stos: Array.from(stos).sort(),
      typeLayanans: Array.from(typeLayanans).sort(),
      typeTikets: Array.from(typeTikets).sort(),
      hvcs: Array.from(hvcs).sort(),
      categories: Array.from(categories).sort(),
      dates: datesSorted,
    };
  }, [tickets]);

  // Key KPI calculations
  const kpis = useMemo(() => {
    const total = filteredTickets.length;
    if (total === 0) {
      return {
        total: 0,
        internetCount: 0,
        iptvCount: 0,
        voiceCount: 0,
        regulerCount: 0,
        sqmCount: 0,
        hvcCount: 0,
        closedCount: 0,
        closeRate: 100,
        avgTtr: 0,
        autoClosedCount: 0,
        fieldRepairCount: 0,
        uniqueSolutions: 0,
        uniqueSubsegmentasi: 0,
      };
    }

    let internetCount = 0;
    let iptvCount = 0;
    let voiceCount = 0;
    let regulerCount = 0;
    let sqmCount = 0;
    let hvcCount = 0;
    let closedCount = 0;
    let sumTtr = 0;
    let ttrCount = 0;
    let autoClosedCount = 0;
    let fieldRepairCount = 0;

    const solSet = new Set<string>();
    const subSet = new Set<string>();

    filteredTickets.forEach(t => {
      const lay = (t.typeLayanan || 'INTERNET').toUpperCase();
      if (lay === 'INTERNET') internetCount++;
      else if (lay === 'IPTV') iptvCount++;
      else if (lay === 'VOICE') voiceCount++;

      if (t.typeTiket.includes('REGULER')) regulerCount++;
      if (t.typeTiket.includes('SQM')) sqmCount++;
      if (t.flagHvc.startsWith('HVC_')) hvcCount++;

      if (t.status.toUpperCase() === 'CLOSED') closedCount++;

      if (t.ttr > 0) {
        sumTtr += t.ttr;
        ttrCount++;
      }

      if (t.actualSolution) {
        solSet.add(t.actualSolution);
        const cat = categorizeSolution(t.actualSolution);
        if (cat.includes('Auto-Closed')) autoClosedCount++;
        else fieldRepairCount++;
      }

      if (t.subsegmentasi) subSet.add(t.subsegmentasi);
    });

    return {
      total,
      internetCount,
      iptvCount,
      voiceCount,
      regulerCount,
      sqmCount,
      hvcCount,
      closedCount,
      closeRate: parseFloat(((closedCount / total) * 100).toFixed(1)),
      avgTtr: ttrCount > 0 ? parseFloat((sumTtr / ttrCount).toFixed(2)) : 0,
      autoClosedCount,
      fieldRepairCount,
      uniqueSolutions: solSet.size,
      uniqueSubsegmentasi: subSet.size,
    };
  }, [filteredTickets]);

  // DAILY TREND DATA (Kolom F - TROUBLE_OPENTIME)
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, {
      dateKey: string;
      label: string;
      total: number;
      internet: number;
      iptv: number;
      voice: number;
      reguler: number;
      sqm: number;
      closed: number;
      sumTtr: number;
      ttrCount: number;
    }>();

    filteredTickets.forEach(t => {
      const dp = parseDateParts(t.troubleOpenTime);
      if (!dp) return;

      if (!map.has(dp.dateKey)) {
        map.set(dp.dateKey, {
          dateKey: dp.dateKey,
          label: dp.label,
          total: 0,
          internet: 0,
          iptv: 0,
          voice: 0,
          reguler: 0,
          sqm: 0,
          closed: 0,
          sumTtr: 0,
          ttrCount: 0,
        });
      }

      const entry = map.get(dp.dateKey)!;
      entry.total++;

      const lay = (t.typeLayanan || 'INTERNET').toUpperCase();
      if (lay === 'INTERNET') entry.internet++;
      else if (lay === 'IPTV') entry.iptv++;
      else if (lay === 'VOICE') entry.voice++;

      if (t.typeTiket.includes('REGULER')) entry.reguler++;
      if (t.typeTiket.includes('SQM')) entry.sqm++;

      if (t.status.toUpperCase() === 'CLOSED') entry.closed++;
      if (t.ttr > 0) {
        entry.sumTtr += t.ttr;
        entry.ttrCount++;
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return sorted.map(d => ({
      ...d,
      avgTtr: d.ttrCount > 0 ? parseFloat((d.sumTtr / d.ttrCount).toFixed(2)) : 0,
      closeRate: d.total > 0 ? parseFloat(((d.closed / d.total) * 100).toFixed(1)) : 100,
    }));
  }, [filteredTickets]);

  // Peak and trough daily stats
  const dailyStats = useMemo(() => {
    if (dailyTrendData.length === 0) return null;
    let peakDay = dailyTrendData[0];
    let lowDay = dailyTrendData[0];
    let totalAllDays = 0;

    dailyTrendData.forEach(d => {
      totalAllDays += d.total;
      if (d.total > peakDay.total) peakDay = d;
      if (d.total < lowDay.total) lowDay = d;
    });

    const avgDaily = Math.round(totalAllDays / dailyTrendData.length);
    return { peakDay, lowDay, avgDaily, totalDays: dailyTrendData.length };
  }, [dailyTrendData]);

  // ACTUAL SOLUTION EVALUATION (Kolom W)
  const actualSolutionSummary = useMemo(() => {
    const map = new Map<string, {
      name: string;
      category: string;
      total: number;
      internet: number;
      iptv: number;
      voice: number;
      reguler: number;
      sqm: number;
      hvc: number;
      gamas: number;
      sumTtr: number;
      ttrCount: number;
      closed: number;
      stos: { [key: string]: number };
      sektors: { [key: string]: number };
    }>();

    filteredTickets.forEach(t => {
      const sol = (t.actualSolution || '(KOSONG/EMPTY)').trim();
      if (!map.has(sol)) {
        map.set(sol, {
          name: sol,
          category: categorizeSolution(sol),
          total: 0,
          internet: 0,
          iptv: 0,
          voice: 0,
          reguler: 0,
          sqm: 0,
          hvc: 0,
          gamas: 0,
          sumTtr: 0,
          ttrCount: 0,
          closed: 0,
          stos: {},
          sektors: {},
        });
      }

      const entry = map.get(sol)!;
      entry.total++;

      const lay = (t.typeLayanan || 'INTERNET').toUpperCase();
      if (lay === 'INTERNET') entry.internet++;
      else if (lay === 'IPTV') entry.iptv++;
      else if (lay === 'VOICE') entry.voice++;

      if (t.typeTiket.includes('REGULER')) entry.reguler++;
      if (t.typeTiket.includes('SQM')) entry.sqm++;
      if (t.flagHvc.startsWith('HVC_')) entry.hvc++;
      if (t.isGamas === 'GAMAS') entry.gamas++;

      if (t.status.toUpperCase() === 'CLOSED') entry.closed++;
      if (t.ttr > 0) {
        entry.sumTtr += t.ttr;
        entry.ttrCount++;
      }

      if (t.sto) entry.stos[t.sto] = (entry.stos[t.sto] || 0) + 1;
      if (t.sektor) entry.sektors[t.sektor] = (entry.sektors[t.sektor] || 0) + 1;
    });

    const totalTicketsCount = filteredTickets.length || 1;
    return Array.from(map.values())
      .map(s => {
        let topSto = '-';
        let maxSto = 0;
        Object.entries(s.stos).forEach(([k, v]) => {
          if (v > maxSto) {
            maxSto = v;
            topSto = k;
          }
        });

        return {
          ...s,
          sharePercent: parseFloat(((s.total / totalTicketsCount) * 100).toFixed(1)),
          avgTtr: s.ttrCount > 0 ? parseFloat((s.sumTtr / s.ttrCount).toFixed(2)) : 0,
          closeRate: s.total > 0 ? parseFloat(((s.closed / s.total) * 100).toFixed(1)) : 100,
          topSto,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // SUBSEGMENTASI EVALUATION (Kolom M)
  const subsegmentasiSummary = useMemo(() => {
    const map = new Map<string, {
      name: string;
      total: number;
      internet: number;
      iptv: number;
      voice: number;
      reguler: number;
      sqm: number;
      hvc: number;
      sumTtr: number;
      ttrCount: number;
      closed: number;
      solutions: { [key: string]: number };
      topSto: string;
      stos: { [key: string]: number };
    }>();

    filteredTickets.forEach(t => {
      const sub = (t.subsegmentasi || '(KOSONG/EMPTY)').trim();
      if (!map.has(sub)) {
        map.set(sub, {
          name: sub,
          total: 0,
          internet: 0,
          iptv: 0,
          voice: 0,
          reguler: 0,
          sqm: 0,
          hvc: 0,
          sumTtr: 0,
          ttrCount: 0,
          closed: 0,
          solutions: {},
          topSto: '-',
          stos: {},
        });
      }

      const entry = map.get(sub)!;
      entry.total++;

      const lay = (t.typeLayanan || 'INTERNET').toUpperCase();
      if (lay === 'INTERNET') entry.internet++;
      else if (lay === 'IPTV') entry.iptv++;
      else if (lay === 'VOICE') entry.voice++;

      if (t.typeTiket.includes('REGULER')) entry.reguler++;
      if (t.typeTiket.includes('SQM')) entry.sqm++;
      if (t.flagHvc.startsWith('HVC_')) entry.hvc++;

      if (t.status.toUpperCase() === 'CLOSED') entry.closed++;
      if (t.ttr > 0) {
        entry.sumTtr += t.ttr;
        entry.ttrCount++;
      }

      const sol = t.actualSolution || 'Tanpa Solusi';
      entry.solutions[sol] = (entry.solutions[sol] || 0) + 1;

      if (t.sto) entry.stos[t.sto] = (entry.stos[t.sto] || 0) + 1;
    });

    const totalTicketsCount = filteredTickets.length || 1;
    return Array.from(map.values())
      .map(s => {
        let topSol = '-';
        let maxSolCount = 0;
        Object.entries(s.solutions).forEach(([k, v]) => {
          if (v > maxSolCount) {
            maxSolCount = v;
            topSol = k;
          }
        });

        let topSto = '-';
        let maxStoCount = 0;
        Object.entries(s.stos).forEach(([k, v]) => {
          if (v > maxStoCount) {
            maxStoCount = v;
            topSto = k;
          }
        });

        return {
          ...s,
          sharePercent: parseFloat(((s.total / totalTicketsCount) * 100).toFixed(1)),
          avgTtr: s.ttrCount > 0 ? parseFloat((s.sumTtr / s.ttrCount).toFixed(2)) : 0,
          closeRate: s.total > 0 ? parseFloat(((s.closed / s.total) * 100).toFixed(1)) : 100,
          topSolution: topSol,
          topSto,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // TYPE LAYANAN EVALUATION (Kolom N - TKASSETTYPE)
  const typeLayananSummary = useMemo(() => {
    const types = ['INTERNET', 'IPTV', 'VOICE'];
    const totalTicketsCount = filteredTickets.length || 1;

    return types.map(typeKey => {
      const matches = filteredTickets.filter(t => (t.typeLayanan || 'INTERNET').toUpperCase() === typeKey);
      const total = matches.length;

      let reguler = 0;
      let sqm = 0;
      let hvc = 0;
      let closed = 0;
      let sumTtr = 0;
      let ttrCount = 0;

      const solMap: { [key: string]: number } = {};
      const subMap: { [key: string]: number } = {};

      matches.forEach(t => {
        if (t.typeTiket.includes('REGULER')) reguler++;
        if (t.typeTiket.includes('SQM')) sqm++;
        if (t.flagHvc.startsWith('HVC_')) hvc++;

        if (t.status.toUpperCase() === 'CLOSED') closed++;
        if (t.ttr > 0) {
          sumTtr += t.ttr;
          ttrCount++;
        }

        const sol = t.actualSolution || 'Kosong';
        solMap[sol] = (solMap[sol] || 0) + 1;

        const sub = t.subsegmentasi || 'Kosong';
        subMap[sub] = (subMap[sub] || 0) + 1;
      });

      const topSolutions = Object.entries(solMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const topSubsegmentasi = Object.entries(subMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        type: typeKey,
        total,
        sharePercent: parseFloat(((total / totalTicketsCount) * 100).toFixed(1)),
        reguler,
        sqm,
        hvc,
        closeRate: total > 0 ? parseFloat(((closed / total) * 100).toFixed(1)) : 100,
        avgTtr: ttrCount > 0 ? parseFloat((sumTtr / ttrCount).toFixed(2)) : 0,
        topSolutions,
        topSubsegmentasi,
        color: SERVICE_TYPE_COLORS[typeKey] || '#64748B',
      };
    });
  }, [filteredTickets]);

  // Solution Category Pie Data
  const solutionCategoryPie = useMemo(() => {
    const map = new Map<string, number>();
    filteredTickets.forEach(t => {
      const cat = categorizeSolution(t.actualSolution);
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTickets]);

  // Sorted and Paginated Tickets for Master Table
  const sortedTickets = useMemo(() => {
    const list = [...filteredTickets];
    list.sort((a, b) => {
      let valA: any = (a as any)[sortField] || '';
      let valB: any = (b as any)[sortField] || '';

      if (sortField === 'ttr') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredTickets, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedTickets.length / rowsPerPage) || 1;
  const pagedTickets = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedTickets.slice(start, start + rowsPerPage);
  }, [sortedTickets, currentPage, rowsPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedSektor('ALL');
    setSelectedSto('ALL');
    setSelectedTypeLayanan('ALL');
    setSelectedTypeTiket('ALL');
    setSelectedHvc('ALL');
    setSelectedSolutionCategory('ALL');
    setSelectedDate('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Export Filtered CSV
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) return;
    const headers = [
      'No Tiket',
      'No Pelanggan',
      'Tgl Open',
      'Type Layanan',
      'Subsegmentasi',
      'Actual Solution',
      'Type Tiket',
      'Sektor',
      'STO',
      'ODP',
      'HVC',
      'TTR Jam',
      'Status',
      'Closed By',
      'Is Gamas',
    ];

    const rows = filteredTickets.map(t => [
      `"${t.troubleNo}"`,
      `"${t.troubleNumber}"`,
      `"${t.troubleOpenTime}"`,
      `"${t.typeLayanan || 'INTERNET'}"`,
      `"${(t.subsegmentasi || '').replace(/"/g, '""')}"`,
      `"${(t.actualSolution || '').replace(/"/g, '""')}"`,
      `"${t.typeTiket}"`,
      `"${t.sektor}"`,
      `"${t.sto}"`,
      `"${t.odp}"`,
      `"${t.flagHvc}"`,
      `"${t.ttr}"`,
      `"${t.status}"`,
      `"${t.closedBy}"`,
      `"${t.isGamas}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Evaluasi_Tiket_Assurance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilter =
    selectedSektor !== 'ALL' ||
    selectedSto !== 'ALL' ||
    selectedTypeLayanan !== 'ALL' ||
    selectedTypeTiket !== 'ALL' ||
    selectedHvc !== 'ALL' ||
    selectedSolutionCategory !== 'ALL' ||
    selectedDate !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6" id="ticket-evaluation-dashboard-view">
      
      {/* 1. TOP HEADER & TELEMETRY CONTROLS */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                Sub-Halaman 3: Evaluasi Tiket Assurance
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isLive ? 'Sinkronisasi Data Realtime' : 'Data Operasional Lengkap'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Pembaruan: <strong>{lastSyncTime}</strong>
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2.5">
              <span>Evaluasi Mendalam Actual Solution & Segmentasi Gangguan</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Analisis komprehensif mengintegrasikan data <strong>Actual Solution</strong>, <strong>Subsegmentasi Masalah</strong>, <strong>Type Layanan</strong>, serta <strong>Trend Harian</strong> dengan matriks korelasi Sektor, STO, durasi penanganan (TTR), dan prioritas pelanggan.
            </p>

            {syncError && (
              <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{syncError} (Menggunakan data operasional lokal)</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadLiveData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Segarkan data terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : 'text-slate-300'}`} />
              <span>{isLoading ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
              title="Download data terfilter sebagai file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="executive-kpi-cards">
        
        {/* Total Tiket Evaluasi */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tiket Masuk</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{kpis.total.toLocaleString('id-ID')}</h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-red-600">{kpis.regulerCount} Reguler</span>
              <span>•</span>
              <span className="text-blue-600">{kpis.sqmCount} SQM</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>HVC Customers</span>
            <span className="font-bold text-amber-600 font-mono">{kpis.hvcCount} Tiket</span>
          </div>
        </div>

        {/* Actual Solution Stats */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Actual Solutions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{kpis.uniqueSolutions}</h4>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Variasi Solusi Teridentifikasi</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Auto SQM vs Fisik</span>
            <span className="font-bold text-blue-600 font-mono">
              {kpis.autoClosedCount} : {kpis.fieldRepairCount}
            </span>
          </div>
        </div>

        {/* Subsegmentasi Tiket */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subsegmentasi Masalah</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{kpis.uniqueSubsegmentasi}</h4>
            <p className="text-[11px] font-medium text-purple-600 font-semibold truncate mt-1">
              Top: {subsegmentasiSummary[0]?.name || '-'}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dominasi Top 1</span>
            <span className="font-bold text-slate-700 font-mono">{subsegmentasiSummary[0]?.sharePercent || 0}%</span>
          </div>
        </div>

        {/* Type Layanan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Type Layanan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-red-600">Internet:</span>
              <span className="font-mono font-bold text-slate-800">{kpis.internetCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-blue-600">IPTV:</span>
              <span className="font-mono font-bold text-slate-800">{kpis.iptvCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-600">Voice:</span>
              <span className="font-mono font-bold text-slate-800">{kpis.voiceCount}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dominasi Layanan</span>
            <span className="font-bold text-slate-700 font-mono">
              {kpis.total > 0 ? ((kpis.internetCount / kpis.total) * 100).toFixed(1) : 0}% Internet
            </span>
          </div>
        </div>

        {/* MTTR & Close Rate */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rata-rata TTR & SLA</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{formatTwoDigits(kpis.avgTtr)} <span className="text-sm font-bold text-slate-400">Jam</span></h4>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">
              Close Rate: {kpis.closeRate}%
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status Closed</span>
            <span className="font-bold text-slate-700 font-mono">{kpis.closedCount} Tiket</span>
          </div>
        </div>

      </div>

      {/* 3. MULTI-DIMENSIONAL FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4" id="evaluation-filters">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-slate-800">Filter Multidimensi & Pencarian Tiket</h4>
            <span className="text-xs text-slate-400">({filteredTickets.length} dari {tickets.length} tiket)</span>
          </div>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-3 py-1.5 rounded-xl transition-all self-start md:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Filter Select Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
          
          {/* Sektor */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Sektor</label>
            <select
              value={selectedSektor}
              onChange={e => { setSelectedSektor(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua Sektor</option>
              {filterOptions.sektors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* STO */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">STO</label>
            <select
              value={selectedSto}
              onChange={e => { setSelectedSto(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua STO</option>
              {filterOptions.stos.map(sto => (
                <option key={sto} value={sto}>{sto}</option>
              ))}
            </select>
          </div>

          {/* Type Layanan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Type Layanan</label>
            <select
              value={selectedTypeLayanan}
              onChange={e => { setSelectedTypeLayanan(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua Layanan</option>
              {filterOptions.typeLayanans.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Type Tiket */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Type Tiket</label>
            <select
              value={selectedTypeTiket}
              onChange={e => { setSelectedTypeTiket(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua Type</option>
              {filterOptions.typeTikets.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Flag HVC */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Flag HVC</label>
            <select
              value={selectedHvc}
              onChange={e => { setSelectedHvc(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua HVC</option>
              {filterOptions.hvcs.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Kategori Solusi */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Kategori Solusi</label>
            <select
              value={selectedSolutionCategory}
              onChange={e => { setSelectedSolutionCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua Kategori</option>
              {filterOptions.categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tanggal Harian */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Harian</label>
            <select
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="ALL">Semua Tanggal ({filterOptions.dates.length} Hari)</option>
              {filterOptions.dates.map(d => (
                <option key={d.dateKey} value={d.dateKey}>{d.label} ({d.count} tiket)</option>
              ))}
            </select>
          </div>

        </div>

        {/* Global Keyword Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari No Tiket (INC...), No Internet, Actual Solution, Subsegmentasi, ODP, atau Closed By..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. VIEW SECTIONS NAVIGATOR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveSubSection('actual_solution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSubSection === 'actual_solution'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-red-500" />
          <span>1. Evaluasi Actual Solution</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {actualSolutionSummary.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubSection('daily_trend')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSubSection === 'daily_trend'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span>2. Trend Tiket Harian</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {dailyTrendData.length} Hari
          </span>
        </button>

        <button
          onClick={() => setActiveSubSection('subsegmentasi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSubSection === 'subsegmentasi'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>3. Subsegmentasi Tiket</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {subsegmentasiSummary.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubSection('type_layanan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSubSection === 'type_layanan'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-500" />
          <span>4. Type Layanan</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            3 Layanan
          </span>
        </button>

        <button
          onClick={() => setActiveSubSection('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSubSection === 'table'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Ticket className="w-3.5 h-3.5 text-amber-500" />
          <span>5. Tabel Detail Evaluasi Tiket</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {filteredTickets.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EVALUASI ACTUAL SOLUTION (KOLOM W) */}
      {/* ========================================================================= */}
      {activeSubSection === 'actual_solution' && (
        <div className="space-y-6 animate-fade-in" id="actual-solution-evaluation">
          
          {/* Top Charts: Category Distribution & Solution Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top 8 Actual Solutions Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-red-600" />
                    <span>Top 8 Actual Solution Terbanyak</span>
                  </h4>
                  <p className="text-xs text-slate-500">Volume penanganan gangguan yang paling sering diterapkan di lapangan.</p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
                  Total {actualSolutionSummary.length} Variasi Solusi
                </span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={actualSolutionSummary.slice(0, 8).map(s => ({
                      name: s.name.length > 28 ? s.name.slice(0, 26) + '...' : s.name,
                      fullName: s.name,
                      Tiket: s.total,
                      Internet: s.internet,
                      IPTV: s.iptv,
                      Voice: s.voice,
                    }))}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 max-w-xs">
                              <p className="font-bold text-slate-100">{data.fullName}</p>
                              <div className="pt-2 border-t border-slate-800 space-y-1">
                                <p className="text-red-400 font-bold">Total: {data.Tiket} Tiket</p>
                                <p className="text-slate-300">Internet: {data.Internet} | IPTV: {data.IPTV} | Voice: {data.Voice}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Tiket" fill="#EF4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Kategori Solusi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Pengelompokan Solusi Lapangan</h4>
                <p className="text-xs text-slate-500 mb-4">Distribusi tindakan otomatis vs intervensi teknisi fisik.</p>

                <div className="h-48 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={solutionCategoryPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {solutionCategoryPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`${val} Tiket`, 'Jumlah']}
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                {solutionCategoryPie.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                      <span className="truncate text-slate-700 font-medium" title={cat.name}>{cat.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 shrink-0 ml-2">
                      {cat.value} ({kpis.total > 0 ? ((cat.value / kpis.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Comprehensive Actual Solution Matrix Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900">Rincian Evaluasi Seluruh Actual Solution</h4>
                <p className="text-xs text-slate-500">Mengkombinasikan Type Layanan, Subsegmentasi Masalah, STO Dominan, dan MTTR Jam.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">Klik baris untuk memfilter</span>
                <AIEvaluationButton
                  size="sm"
                  onClick={() =>
                    openAiModal(
                      'Tabel Rincian Evaluasi Seluruh Actual Solution',
                      {
                        'Total Tiket': kpis.total,
                        'Total Solusi Unik': actualSolutionSummary.length,
                        'Top Solusi': actualSolutionSummary[0]?.name || '-',
                        'MTTR Rata-rata': `${formatTwoDigits(kpis.avgTtr)} Jam`,
                      },
                      actualSolutionSummary.slice(0, 20).map(s => ({
                        'Actual Solution': s.name,
                        Kategori: s.category,
                        Volume: s.total,
                        'Share %': `${formatTwoDigits(s.sharePercent)}%`,
                        'Top STO': s.topSto,
                        'Avg TTR (Jam)': formatTwoDigits(s.avgTtr),
                        'Close Rate %': `${formatTwoDigits(s.closeRate)}%`,
                      })),
                      {},
                      'Analisis solusi gangguan (Actual Solution) yang paling banyak terjadi. Berikan rekomendasi teknis untuk mengurangi kendala berulang pada komponen fisik seperti Drop Core, ONT, atau konektor SOC.'
                    )
                  }
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Actual Solution</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-right">Volume</th>
                    <th className="py-3 px-3 text-right">Share %</th>
                    <th className="py-3 px-3">Internet / IPTV / Voice</th>
                    <th className="py-3 px-3 text-center">Top STO</th>
                    <th className="py-3 px-3 text-right">Avg TTR</th>
                    <th className="py-3 px-3 text-right">Close Rate</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {actualSolutionSummary.slice(0, 20).map((sol, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 max-w-xs">
                        <span title={sol.name}>{sol.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {sol.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                        {sol.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-500">
                        {sol.sharePercent}%
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="text-red-600 font-bold" title="Internet">{sol.internet}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-blue-600 font-bold" title="IPTV">{sol.iptv}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-emerald-600 font-bold" title="Voice">{sol.voice}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">{sol.topSto}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        {formatTwoDigits(sol.avgTtr)} jam
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sol.closeRate >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {sol.closeRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setSearchQuery(sol.name);
                            setActiveSubSection('table');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          title="Lihat tiket dengan solusi ini di tabel"
                        >
                          Lihat Tiket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: TREND TIKET SETIAP HARI (KOLOM F - TROUBLE_OPENTIME) */}
      {/* ========================================================================= */}
      {activeSubSection === 'daily_trend' && (
        <div className="space-y-6 animate-fade-in" id="daily-trend-evaluation">
          
          {/* Daily Trend Insights Row */}
          {dailyStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Puncak Tiket Harian (Peak Day)</span>
                <h4 className="text-2xl font-black text-red-600 tracking-tight mt-1">{dailyStats.peakDay.label}</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">{dailyStats.peakDay.total} Tiket Masuk</p>
                <div className="mt-2 text-[11px] text-slate-400">
                  {dailyStats.peakDay.internet} Internet • {dailyStats.peakDay.iptv} IPTV • {dailyStats.peakDay.voice} Voice
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Volume Terendah Harian</span>
                <h4 className="text-2xl font-black text-emerald-600 tracking-tight mt-1">{dailyStats.lowDay.label}</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">{dailyStats.lowDay.total} Tiket Masuk</p>
                <div className="mt-2 text-[11px] text-slate-400">
                  {dailyStats.lowDay.reguler} Reguler • {dailyStats.lowDay.sqm} SQM
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Harian</span>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{dailyStats.avgDaily} <span className="text-sm font-semibold text-slate-400">Tiket / Hari</span></h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Dihitung dari {dailyStats.totalDays} hari operasional</p>
                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                  Siklus mingguan terpantau stabil
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Penyelesaian Rata-rata</span>
                <h4 className="text-2xl font-black text-blue-600 tracking-tight mt-1">{kpis.closeRate}%</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">Rata-rata TTR: {formatTwoDigits(kpis.avgTtr)} Jam</p>
                <div className="mt-2 text-[11px] text-emerald-600 font-bold">
                  SLA Target &lt; 24 Jam Terpenuhi
                </div>
              </div>
            </div>
          )}

          {/* Interactive Daily Trend Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Trend Volume Tiket Harian</span>
                </h4>
                <p className="text-xs text-slate-500">Pergerakan tiket harian dengan pembagian Type Layanan (Internet, IPTV, Voice).</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Internet</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> IPTV</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Voice</span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTrendData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInternet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorIptv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorVoice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[180px]">
                            <p className="font-extrabold text-sm text-slate-100 border-b border-slate-800 pb-1">{d.label}</p>
                            <p className="text-white font-bold">Total Masuk: {d.total} Tiket</p>
                            <div className="space-y-0.5 text-[11px] text-slate-300">
                              <p className="text-red-400">Internet: {d.internet} ({((d.internet / d.total) * 100).toFixed(0)}%)</p>
                              <p className="text-blue-400">IPTV: {d.iptv}</p>
                              <p className="text-emerald-400">Voice: {d.voice}</p>
                              <div className="pt-1 border-t border-slate-800 flex justify-between text-slate-400">
                                <span>Reguler / SQM:</span>
                                <span className="text-slate-200 font-mono">{d.reguler} / {d.sqm}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Rata-rata TTR:</span>
                                <span className="text-amber-400 font-mono font-bold">{formatTwoDigits(d.avgTtr)} Jam</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="internet" stackId="1" stroke="#EF4444" fillOpacity={1} fill="url(#colorInternet)" name="Internet" strokeWidth={2} />
                  <Area type="monotone" dataKey="iptv" stackId="1" stroke="#3B82F6" fillOpacity={1} fill="url(#colorIptv)" name="IPTV" strokeWidth={2} />
                  <Area type="monotone" dataKey="voice" stackId="1" stroke="#10B981" fillOpacity={1} fill="url(#colorVoice)" name="Voice" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Table Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900">Tabel Rekapitulasi Harian Tiket</h4>
                <p className="text-xs text-slate-500">Breakdown volume harian berdasarkan layanan (Internet, IPTV, Voice), jenis tiket, dan MTTR.</p>
              </div>
              <AIEvaluationButton
                size="sm"
                onClick={() =>
                  openAiModal(
                    'Tabel Rekapitulasi Harian Tiket',
                    {
                      'Total Hari Tercatat': dailyTrendData.length,
                      'Total Tiket': kpis.total,
                      'Rata-rata Harian': `${(kpis.total / Math.max(1, dailyTrendData.length)).toFixed(1)} Tiket/Hari`,
                    },
                    dailyTrendData.slice(0, 20).map(d => ({
                      Tanggal: d.label,
                      Total: d.total,
                      Internet: d.internet,
                      IPTV: d.iptv,
                      Voice: d.voice,
                      Reguler: d.reguler,
                      SQM: d.sqm,
                      'Avg TTR': `${formatTwoDigits(d.avgTtr)} Jam`,
                      'Close Rate': `${formatTwoDigits(d.closeRate)}%`,
                    })),
                    {},
                    'Evaluasi tren harian gangguan tiket. Deteksi lonjakan anomali tiket (spike) pada tanggal tertentu dan berikan rekomendasi penambahan kapasitas dispatching teknisi.'
                  )
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Tanggal Open</th>
                    <th className="py-3 px-4 text-right">Total Tiket</th>
                    <th className="py-3 px-4 text-right text-red-600">Internet</th>
                    <th className="py-3 px-4 text-right text-blue-600">IPTV</th>
                    <th className="py-3 px-4 text-right text-emerald-600">Voice</th>
                    <th className="py-3 px-4 text-right">Reguler</th>
                    <th className="py-3 px-4 text-right">SQM</th>
                    <th className="py-3 px-4 text-right">Avg TTR</th>
                    <th className="py-3 px-4 text-right">Close Rate</th>
                    <th className="py-3 px-4 text-center">Aksi Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyTrendData.map((day, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{day.label}</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900">{day.total}</td>
                      <td className="py-3 px-4 text-right font-mono text-red-600 font-bold">{day.internet}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600 font-bold">{day.iptv}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">{day.voice}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{day.reguler}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{day.sqm}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">{formatTwoDigits(day.avgTtr)} jam</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${day.closeRate >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {day.closeRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedDate(day.dateKey);
                            setActiveSubSection('table');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Pilih Hari Ini
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SUBSEGMENTASI TIKET (KOLOM M) */}
      {/* ========================================================================= */}
      {activeSubSection === 'subsegmentasi' && (
        <div className="space-y-6 animate-fade-in" id="subsegmentasi-evaluation">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Subsegmentasi Horizontal Bar Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Distribusi Subsegmentasi Tiket Teratas</span>
                  </h4>
                  <p className="text-xs text-slate-500">Klasifikasi jenis keluhan atau gangguan yang dilaporkan.</p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
                  Total {subsegmentasiSummary.length} Kategori
                </span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subsegmentasiSummary.slice(0, 8).map(s => ({
                      name: s.name.length > 28 ? s.name.slice(0, 26) + '...' : s.name,
                      fullName: s.name,
                      Tiket: s.total,
                      Internet: s.internet,
                      IPTV: s.iptv,
                      Voice: s.voice,
                    }))}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 max-w-xs">
                              <p className="font-bold text-slate-100">{data.fullName}</p>
                              <div className="pt-2 border-t border-slate-800 space-y-1">
                                <p className="text-purple-400 font-bold">Total: {data.Tiket} Tiket</p>
                                <p className="text-slate-300">Internet: {data.Internet} | IPTV: {data.IPTV} | Voice: {data.Voice}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Tiket" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subsegmentasi Insights Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Sorotan Subsegmentasi</h4>
                <p className="text-xs text-slate-500 mb-4">Analisis dampak subsegmentasi pada operasional jaringan.</p>

                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100/60">
                    <span className="text-[10px] font-bold text-purple-700 uppercase">Subsegmentasi #1 Terbesar</span>
                    <h5 className="font-bold text-slate-900 text-sm mt-0.5">{subsegmentasiSummary[0]?.name || '-'}</h5>
                    <div className="flex justify-between items-center text-xs mt-2 text-slate-600">
                      <span>Volume Tiket:</span>
                      <span className="font-mono font-black text-purple-700">{subsegmentasiSummary[0]?.total} ({subsegmentasiSummary[0]?.sharePercent}%)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      Solusi Terbanyak: <strong>{subsegmentasiSummary[0]?.topSolution || '-'}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-2xl border border-red-100/60">
                    <span className="text-[10px] font-bold text-red-700 uppercase">Subsegmentasi #2</span>
                    <h5 className="font-bold text-slate-900 text-sm mt-0.5">{subsegmentasiSummary[1]?.name || '-'}</h5>
                    <div className="flex justify-between items-center text-xs mt-2 text-slate-600">
                      <span>Volume Tiket:</span>
                      <span className="font-mono font-black text-red-700">{subsegmentasiSummary[1]?.total} ({subsegmentasiSummary[1]?.sharePercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold">Korelasi Solusi:</span> Masalah konektivitas fisik mendominasi lebih dari 70% keluhan pelanggan IndiHome.
              </div>
            </div>
          </div>

          {/* Subsegmentasi Detail Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900">Tabel Korelasi Subsegmentasi x Actual Solution</h4>
                <p className="text-xs text-slate-500">Menganalisis korelasi subsegmentasi keluhan pelanggan terhadap tindakan actual solution teknisi.</p>
              </div>
              <AIEvaluationButton
                size="sm"
                onClick={() =>
                  openAiModal(
                    'Tabel Korelasi Subsegmentasi x Actual Solution',
                    {
                      'Total Subsegmentasi': subsegmentasiSummary.length,
                      'Total Tiket': kpis.total,
                      'Top Subsegmentasi': subsegmentasiSummary[0]?.name || '-',
                    },
                    subsegmentasiSummary.slice(0, 15).map(s => ({
                      Subsegmentasi: s.name,
                      Total: s.total,
                      'Share %': `${s.sharePercent}%`,
                      Internet: s.internet,
                      IPTV: s.iptv,
                      Voice: s.voice,
                      'Top Solution': s.topSolution,
                      'Top STO': s.topSto,
                      'Avg TTR': `${formatTwoDigits(s.avgTtr)} Jam`,
                    })),
                    {},
                    'Evaluasi korelasi subsegmentasi keluhan pelanggan dengan solusi aktual teknisi. Berikan saran pencegahan keluhan pada segmen pelanggan terbesar.'
                  )
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Subsegmentasi</th>
                    <th className="py-3 px-3 text-right">Total Tiket</th>
                    <th className="py-3 px-3 text-right">Share %</th>
                    <th className="py-3 px-3">Type Layanan</th>
                    <th className="py-3 px-3">Top Actual Solution</th>
                    <th className="py-3 px-3 text-center">Top STO</th>
                    <th className="py-3 px-3 text-right">Avg TTR</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subsegmentasiSummary.slice(0, 15).map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 max-w-xs truncate" title={sub.name}>{sub.name}</td>
                      <td className="py-3 px-3 text-right font-black font-mono text-slate-900">{sub.total}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-500">{sub.sharePercent}%</td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <span className="text-red-600 font-bold">{sub.internet}</span> / <span className="text-blue-600 font-bold">{sub.iptv}</span> / <span className="text-emerald-600 font-bold">{sub.voice}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={sub.topSolution}>
                        {sub.topSolution}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{sub.topSto}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{formatTwoDigits(sub.avgTtr)} jam</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setSearchQuery(sub.name);
                            setActiveSubSection('table');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-600 text-slate-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Filter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: TYPE LAYANAN (KOLOM N - TKASSETTYPE) */}
      {/* ========================================================================= */}
      {activeSubSection === 'type_layanan' && (
        <div className="space-y-6 animate-fade-in" id="type-layanan-evaluation">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {typeLayananSummary.map((serv, index) => (
              <div key={index} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: serv.color }} />
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{serv.type}</h4>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 font-mono font-bold text-xs rounded-full text-slate-700">
                      {serv.sharePercent}% Total Tiket
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h5 className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                      {serv.total.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-400">Tiket</span>
                    </h5>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span>Reguler: <strong>{serv.reguler}</strong></span>
                      <span>•</span>
                      <span>SQM: <strong>{serv.sqm}</strong></span>
                      <span>•</span>
                      <span>HVC: <strong>{serv.hvc}</strong></span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Top Actual Solutions
                      </span>
                      <div className="space-y-1 text-xs">
                        {serv.topSolutions.map((sol, i) => (
                          <div key={i} className="flex justify-between items-center text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                            <span className="truncate max-w-[200px]" title={sol.name}>{sol.name}</span>
                            <span className="font-mono font-bold shrink-0 ml-1">{sol.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Top Subsegmentasi
                      </span>
                      <div className="space-y-1 text-xs">
                        {serv.topSubsegmentasi.map((sub, i) => (
                          <div key={i} className="flex justify-between items-center text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                            <span className="truncate max-w-[200px]" title={sub.name}>{sub.name}</span>
                            <span className="font-mono font-bold shrink-0 ml-1">{sub.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Rata-rata TTR</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">{formatTwoDigits(serv.avgTtr)} Jam</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTypeLayanan(serv.type);
                      setActiveSubSection('table');
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Filter Layanan Ini
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: MASTER DETAIL TICKET TABLE */}
      {/* ========================================================================= */}
      {activeSubSection === 'table' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4" id="ticket-master-table">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-red-600" />
                <span>Daftar Detail Evaluasi Tiket</span>
              </h4>
              <p className="text-xs text-slate-500">
                Menampilkan {pagedTickets.length} dari {sortedTickets.length} tiket terfilter (Total seluruh tiket: {tickets.length}).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <AIEvaluationButton
                size="sm"
                onClick={() =>
                  openAiModal(
                    'Tabel Daftar Detail Evaluasi Tiket Gangguan',
                    {
                      'Total Terfilter': sortedTickets.length,
                      'Total Keseluruhan': tickets.length,
                      'Halaman': `${currentPage} dari ${Math.ceil(sortedTickets.length / rowsPerPage)}`,
                    },
                    pagedTickets.slice(0, 20).map(t => ({
                      'Incident / No Tiket': t.troubleNo,
                      'Tgl Buka': t.troubleOpenTime,
                      'Sektor': t.sektor,
                      'STO': t.sto,
                      'Subsegmentasi': t.subsegmentasi,
                      'Actual Solution': t.actualSolution,
                      'TTR Jam': formatTwoDigits(t.ttr),
                      'Status': t.status,
                    })),
                    { 'Baris Per Hal': rowsPerPage },
                    'Evaluasi sampel baris tiket detail di atas. Berikan kesimpulan tren operasional dan area perbaikan prioritas penanganan gangguan.'
                  )
                }
              />
              <span className="text-slate-400 font-medium">Baris:</span>
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center">No</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('troubleOpenTime')}>
                    <div className="flex items-center gap-1">
                      <span>Tgl Buka</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">No Tiket / Pelanggan</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('typeLayanan')}>
                    <div className="flex items-center gap-1">
                      <span>Layanan</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Subsegmentasi</th>
                  <th className="py-3 px-3">Actual Solution</th>
                  <th className="py-3 px-3">Sektor / STO / ODP</th>
                  <th className="py-3 px-3">Type / HVC</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800 text-right" onClick={() => handleSort('ttr')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>TTR (Jam)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedTickets.map((t, idx) => {
                  const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                  const serviceColor = SERVICE_TYPE_COLORS[(t.typeLayanan || 'INTERNET').toUpperCase()] || '#64748B';
                  const hvcColor = HVC_COLORS[t.flagHvc] || '#64748B';

                  return (
                    <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{globalIdx}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {t.troubleOpenTime}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-red-600">{t.troubleNo}</div>
                        <div className="font-mono text-[11px] text-slate-400">{t.troubleNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: serviceColor }}
                        >
                          {t.typeLayanan || 'INTERNET'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 max-w-xs truncate" title={t.subsegmentasi}>
                        {t.subsegmentasi || '-'}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={t.actualSolution}>
                          {t.actualSolution || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {categorizeSolution(t.actualSolution)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{t.sektor} • <span className="font-mono text-blue-600">{t.sto}</span></div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={t.odp}>{t.odp}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 text-[11px]">{t.typeTiket}</div>
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-white mt-0.5"
                          style={{ backgroundColor: hvcColor }}
                        >
                          {t.flagHvc}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        {formatTwoDigits(t.ttr)} j
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status.toUpperCase() === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-500">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({sortedTickets.length} total tiket)
            </span>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                « Pertama
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 font-mono font-bold text-xs bg-slate-900 text-white rounded-lg">
                {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Terakhir »
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODAL TICKET DETAIL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight font-mono">{selectedTicket.troubleNo}</h4>
                  <p className="text-xs text-slate-500 font-mono">No Pelanggan: {selectedTicket.troubleNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Type Layanan</span>
                <p className="font-bold text-slate-900 mt-1">{selectedTicket.typeLayanan || 'INTERNET'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Type Tiket</span>
                <p className="font-bold text-slate-900 mt-1">{selectedTicket.typeTiket}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Flag HVC</span>
                <p className="font-bold text-amber-600 mt-1">{selectedTicket.flagHvc}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sektor</span>
                <p className="font-bold text-slate-900 mt-1">{selectedTicket.sektor}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">STO</span>
                <p className="font-bold text-blue-600 mt-1 font-mono">{selectedTicket.sto}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">ODP</span>
                <p className="font-bold text-slate-900 mt-1 font-mono text-[11px] truncate" title={selectedTicket.odp}>{selectedTicket.odp || '-'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 bg-red-50/60 rounded-2xl border border-red-100">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
                  Actual Solution
                </span>
                <p className="text-sm font-bold text-slate-900">{selectedTicket.actualSolution || '(KOSONG)'}</p>
                <p className="text-xs text-slate-500 mt-1">Kategori: {categorizeSolution(selectedTicket.actualSolution)}</p>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
                  Subsegmentasi Tiket
                </span>
                <p className="text-sm font-bold text-slate-900">{selectedTicket.subsegmentasi || '(KOSONG)'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Waktu Open</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedTicket.troubleOpenTime}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Waktu Close</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedTicket.troubleCloseTime || selectedTicket.dateClose || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">TTR Penyelesaian</span>
                  <p className="font-mono font-black text-slate-900 mt-0.5 text-sm">{formatTwoDigits(selectedTicket.ttr)} Jam</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Closed By</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedTicket.closedBy || 'SYSTEM'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Performance Evaluation Modal */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState(prev => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext="Assurance Ticket Evaluation & Solution (Sub-Halaman 3)"
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
