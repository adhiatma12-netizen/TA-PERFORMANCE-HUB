import React, { useState, useEffect, useMemo } from 'react';
import { RegionalPerformanceData, Regional, Technician } from '../types';
import { fetchLiveProgressData, LiveProgressRecord, fetchAllroundMadiunSheetData, AllroundSheetRow } from '../lib/googleSheets';
import {
  Users,
  Activity,
  Award,
  Zap,
  Search,
  CheckCircle,
  AlertCircle,
  Star,
  PlusCircle,
  UserPlus2,
  TrendingUp,
  MapPin,
  Calendar,
  X,
  FileText,
  Cpu,
  Radio,
  Wrench,
  Layers,
  RefreshCw,
} from 'lucide-react';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

export interface DailyTask {
  id: string;
  ticketNo: string;
  type: string;
  customerName: string;
  address: string;
  status: 'Selesai' | 'On Progress' | 'Dalam Perjalanan' | 'Pending';
  statusNotes: string;
  timestamp: string;
}

export interface TechProgress {
  techId: string;
  techName: string;
  techAvatar: string;
  techWitel: string;
  techStatus: string;
  tasks: DailyTask[];
}

const getOrGenerateDailyProgress = (dateStr: string, techs: Technician[]): TechProgress[] => {
  return techs.map((tech, idx) => {
    // Generate tasks deterministically
    const dayPart = dateStr.split('-')[2] || '18';
    const daySeed = parseInt(dayPart);
    // Seed combining tech ID and day seed
    const seed = tech.id.charCodeAt(2) + tech.id.charCodeAt(3) + daySeed;
    
    const statuses: ('Selesai' | 'On Progress' | 'Dalam Perjalanan' | 'Pending')[] = [
      'Selesai', 'On Progress', 'Dalam Perjalanan', 'Pending'
    ];
    
    // Distribute statuses across technicians
    const status1 = statuses[seed % 4];
    const status2 = statuses[(seed + 1) % 4];
    
    const taskTypes = ['Layanan Gangguan', 'Pasang Baru (PSB)', 'Gamas ODP', 'Replacement ONT', 'Benjar'];
    const type1 = taskTypes[seed % taskTypes.length];
    const type2 = taskTypes[(seed + 2) % taskTypes.length];

    const customers = [
      'Budi Santoso', 'Siti Aminah', 'Rudi Hermawan', 'Dewi Lestari', 'Joko Susilo', 
      'Ahmad Fauzi', 'Anisa Rahma', 'Heri Prasetyo', 'Endang Sri', 'Bambang Utomo',
      'Yusuf Mansur', 'Lia Amalia', 'Setyo Budiman', 'Kartika Sari', 'Eko Prasetyo'
    ];
    const cust1 = customers[seed % customers.length];
    const cust2 = customers[(seed + 3) % customers.length];

    const locations = [
      `Jl. Pahlawan No. ${seed % 100 + 1}, Madiun`,
      `Jl. Slamet Riyadi No. ${(seed + 5) % 100 + 1}, Kartoharjo`,
      `Jl. Gajah Mada No. ${(seed + 12) % 100 + 1}, Taman`,
      `Perum Asti Indah Blok ${seed % 10}A, Madiun`,
      `Jl. Raya Solo-Madiun No. ${(seed + 21) % 50 + 1}, Jiwan`,
      `Jl. Sudirman No. ${(seed + 15) % 80 + 1}, Wonoasri`
    ];
    const loc1 = locations[seed % locations.length];
    const loc2 = locations[(seed + 4) % locations.length];

    const notesMap: Record<string, string[]> = {
      'Selesai': [
        'Redaman -19.5 dBm, internet & IPTV normal. Pelanggan puas.',
        'Selesai penarikan dropcore 120m, ONT aktif prima.',
        'Replacement ONT berhasil, wifi dual band lancar.',
        'Splicing core di ODP selesai, redaman stabil.'
      ],
      'On Progress': [
        'Sedang penarikan kabel dropcore udara.',
        'Proses instalasi dan setting modem wifi.',
        'Splicing dropcore di tiang ODP.',
        'Melakukan pengukuran ulang redaman optik.'
      ],
      'Dalam Perjalanan': [
        'Dalam perjalanan menuju lokasi pelanggan.',
        'Menuju lokasi terdampak gamas.',
        'Selesai briefing pagi, bergeser ke TKP.'
      ],
      'Pending': [
        'Pelanggan mendadak keluar kota, minta reschedule besok.',
        'Kendala hujan lebat disertai petir, tunda demi safety.',
        'Akses ke ODP terkunci pagar rumah warga, menunggu koordinasi.',
        'Butuh tiang sisipan karena jarak dropcore melebihi 150m.'
      ]
    };

    const note1List = notesMap[status1];
    const note2List = notesMap[status2];
    const note1 = note1List[seed % note1List.length];
    const note2 = note2List[(seed + 2) % note2List.length];

    const ticketNo1 = `WO-${1000000 + seed % 99999}`;
    const ticketNo2 = `WO-${2000000 + (seed + 15) % 99999}`;

    const tasks: DailyTask[] = [
      {
        id: `${tech.id}-task-1`,
        ticketNo: ticketNo1,
        type: type1,
        customerName: cust1,
        address: loc1,
        status: status1,
        statusNotes: note1,
        timestamp: '09:15'
      }
    ];

    if (seed % 2 === 0) {
      tasks.push({
        id: `${tech.id}-task-2`,
        ticketNo: ticketNo2,
        type: type2,
        customerName: cust2,
        address: loc2,
        status: status2,
        statusNotes: note2,
        timestamp: '13:40'
      });
    }

    return {
      techId: tech.id,
      techName: tech.name,
      techAvatar: tech.avatarColor,
      techWitel: tech.witel,
      techStatus: tech.status,
      tasks
    };
  });
};

export const ALL_MONTH_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface TechnicianDashboardProps {
  data: RegionalPerformanceData;
  activeRegional: Regional;
  setActiveRegional: (regional: Regional) => void;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  activeYear: string;
  setActiveYear: (year: string) => void;
  onUpdateTechnicians: (updatedTechs: Technician[]) => void;
  activeSubTab?: 'leaderboard' | 'progress';
  setActiveSubTab?: (tab: 'leaderboard' | 'progress') => void;
}

export default function TechnicianDashboard({
  data,
  activeRegional,
  setActiveRegional,
  activeMonth,
  setActiveMonth,
  activeYear,
  setActiveYear,
  onUpdateTechnicians,
  activeSubTab: externalSubTab,
  setActiveSubTab: externalSetSubTab,
}: TechnicianDashboardProps) {
  const { technicians } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<'all' | 'Expert' | 'Advance' | 'Intermediate' | 'Basic'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Standby' | 'On Leave'>('all');
  const [lokerFilter, setLokerFilter] = useState<'all' | 'teknisi sektor' | 'teknisi allround'>('all');
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  // Filter & sort technicians (highest close tickets first)
  const filteredTechs = technicians.topTechnicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tech.witel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = skillFilter === 'all' || tech.skillLevel === skillFilter;
    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
    
    // Also, if activeRegional is not 'All', filter by the active regional
    const matchesRegion = activeRegional === 'All' || tech.regional === activeRegional;

    // Loker Filter
    let matchesLoker = true;
    if (lokerFilter === 'teknisi sektor') {
      matchesLoker = tech.witel.toLowerCase().includes('sektor');
    } else if (lokerFilter === 'teknisi allround') {
      matchesLoker = tech.witel.toLowerCase() === 'allround';
    }

    return matchesSearch && matchesSkill && matchesStatus && matchesRegion && matchesLoker;
  }).sort((a, b) => b.ticketsResolved - a.ticketsResolved);

  const [internalSubTab, setInternalSubTab] = useState<'leaderboard' | 'progress'>('leaderboard');
  const activeSubTab = externalSubTab ?? internalSubTab;
  const setActiveSubTab = externalSetSubTab ?? setInternalSubTab;
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-21');
  const [progressState, setProgressState] = useState<Record<string, TechProgress[]>>({});

  // Google Spreadsheet configuration for Live Progress
  const [spreadsheetId, setSpreadsheetId] = useState<string>('1zCLSNsVjczGurh_JE'); // Keep initial or default
  const [liveProgressRows, setLiveProgressRows] = useState<LiveProgressRecord[]>([]);
  const [rawAllroundData, setRawAllroundData] = useState<AllroundSheetRow[]>([]);
  const [allroundProgressRows, setAllroundProgressRows] = useState<LiveProgressRecord[]>([]);
  const [loadingProgress, setLoadingProgress] = useState<boolean>(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressSearch, setProgressSearch] = useState<string>('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  // Helper to match dates in spreadsheet with active month and year
  const matchMonthYear = (dateStr: string, activeMonth: string, activeYear: string): boolean => {
    if (!dateStr) return false;
    const lowerStr = dateStr.toLowerCase();
    
    // Map Indonesian and English month names to keys
    const monthsMap: Record<string, string[]> = {
      'januari': ['01', 'jan'],
      'februari': ['02', 'feb'],
      'maret': ['03', 'mar'],
      'april': ['04', 'apr'],
      'mei': ['05', 'mei', 'may'],
      'juni': ['06', 'jun'],
      'juli': ['07', 'jul'],
      'agustus': ['08', 'agt', 'aug'],
      'september': ['09', 'sep'],
      'oktober': ['10', 'okt', 'oct'],
      'november': ['11', 'nov'],
      'desember': ['12', 'des', 'dec'],
      'january': ['01', 'jan'],
      'february': ['02', 'feb'],
      'march': ['03', 'mar'],
      'may': ['05', 'mei', 'may'],
      'june': ['06', 'jun'],
      'july': ['07', 'jul'],
      'august': ['08', 'agt', 'aug'],
      'october': ['10', 'okt', 'oct'],
      'december': ['12', 'des', 'dec']
    };
    
    const targetMonthKeys = monthsMap[activeMonth.toLowerCase()];
    if (!targetMonthKeys) return false;
    
    const shortYear = activeYear.slice(-2); // "26"
    // Check year match
    const matchesYear = lowerStr.includes(activeYear) || lowerStr.includes(`/${shortYear}`) || lowerStr.includes(`-${shortYear}`);
    if (!matchesYear) return false;
    
    // Check month match
    const isMatch = targetMonthKeys.some(key => {
      if (/^\d+$/.test(key)) {
        if (lowerStr.startsWith(`${activeYear}-${key}`) || lowerStr.startsWith(`${activeYear}-0${parseInt(key)}`)) {
          return true;
        }
        const parts = lowerStr.split(/[-/ :]/);
        return parts.some(p => {
          const numP = parseInt(p, 10);
          return !isNaN(numP) && numP === parseInt(key, 10) && p.length <= 2;
        });
      } else {
        return lowerStr.includes(key);
      }
    });
    
    return isMatch;
  };

  // Helper to map spreadsheet status string to slash status
  const mapSpreadsheetStatusToSlash = (statusStr: string): string => {
    const s = statusStr.trim().toLowerCase();
    if (s.startsWith('/') || s === 'close' || s === 'progres' || s === 'otw' || s === 'pending') {
      return s.startsWith('/') ? s : `/${s}`;
    }
    if (s.includes('selesai') || s.includes('sukses') || s.includes('done') || s === 'close') {
      return '/close';
    }
    if (s.includes('otw') || s.includes('perjalanan')) {
      return '/otw';
    }
    if (s.includes('pending') || s.includes('tunda')) {
      return '/pending';
    }
    return '/progres'; // default fallback
  };

  const handleSyncProgress = async () => {
    setLoadingProgress(true);
    setProgressError(null);
    try {
      // 1. Fetch normal live progress rows (keep original logic working)
      const records = await fetchLiveProgressData(spreadsheetId);
      setLiveProgressRows(records);

      // 2. Fetch Allround sheet data from the specific spreadsheet requested
      const allroundRaw = await fetchAllroundMadiunSheetData();
      setRawAllroundData(allroundRaw);
      
      // Map Allround sheet data to LiveProgressRecord format for daily progress monitor
      const mappedAllroundRows: LiveProgressRecord[] = allroundRaw.map(row => {
        let timestamp = row.tanggal || '';
        if (timestamp && !timestamp.includes(':')) {
          timestamp = `${timestamp} 10:00:00`;
        }
        const statusSlash = mapSpreadsheetStatusToSlash(row.status);
        const t1 = row.tech1;
        const t2 = row.tech2;
        const techPair = t2 && t2 !== '0' && t2 !== '#N/A' && t2 !== '' ? `${t1} - ${t2}` : t1;
        
        return {
          status: statusSlash,
          idWo: row.idWo,
          timestamp,
          tech1: t1,
          tech2: t2 && t2 !== '0' && t2 !== '#N/A' && t2 !== '' ? t2 : '',
          techPair
        };
      });
      setAllroundProgressRows(mappedAllroundRows);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(timeStr);
    } catch (err: any) {
      console.warn("Gagal mengambil progress harian:", err);
      setProgressError(err.message || "Gagal mengambil data dari Google Sheets.");
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    handleSyncProgress();
  }, [spreadsheetId]);

  // Reactive point and sub-metrics calculation specifically for technicians with flagging "ALLROUND"
  useEffect(() => {
    if (rawAllroundData.length === 0) return;
    
    const updatedTechs = technicians.topTechnicians.map(tech => {
      if (tech.witel.toUpperCase() !== 'ALLROUND') {
        return tech;
      }
      
      let totalPoints = 0;
      let totalClosedTickets = 0;
      
      let benjarPoints = 0;
      let replacementOntPoints = 0;
      let underspecPoints = 0;
      let gamasOdpPoints = 0;
      let gamasFeederPoints = 0;
      let gamasDistribusiPoints = 0;
      let tiketManualPoints = 0;
      let tiketRegulerPoints = 0;
      let lainLainPoints = 0;
      
      const techNameUpper = tech.name.trim().toUpperCase();
      
      rawAllroundData.forEach(row => {
        if (!matchMonthYear(row.tanggal, activeMonth, activeYear)) {
          return;
        }
        
        const t1 = row.tech1.trim().toUpperCase();
        const t2 = row.tech2.trim().toUpperCase();
        
        const isTech1 = t1 === techNameUpper || t1.includes(techNameUpper) || techNameUpper.includes(t1);
        const isTech2 = t2 === techNameUpper || t2.includes(techNameUpper) || techNameUpper.includes(t2);
        
        if (!isTech1 && !isTech2) {
          return;
        }

        // Perhitungan point hanya untuk WO yang memiliki status "PS" (Kolom C)
        if (row.status.trim().toUpperCase() !== 'PS') {
          return;
        }
        
        // Aturan: 2 Nama = 0.5 Point, 1 Nama = 1.0 Point
        const hasTech2 = t2 !== '' && t2 !== '0' && t2 !== '#N/A' && t2 !== 'TEAM';
        const pointsContributed = (isTech1 && hasTech2) || (isTech2 && hasTech2) ? 0.5 : 1.0;
        
        totalPoints += pointsContributed;
        totalClosedTickets += 1;
        
        const seg = row.segmentOrder.toLowerCase();
        if (seg.includes('benjar')) {
          benjarPoints += pointsContributed;
        } else if (seg.includes('replacement ont') || seg.includes('ganti ont') || seg.includes('ont')) {
          replacementOntPoints += pointsContributed;
        } else if (seg.includes('underspec')) {
          underspecPoints += pointsContributed;
        } else if (seg.includes('gamas odp') || seg.includes('odp')) {
          gamasOdpPoints += pointsContributed;
        } else if (seg.includes('gamas feeder') || seg.includes('feeder')) {
          gamasFeederPoints += pointsContributed;
        } else if (seg.includes('gamas distribusi') || seg.includes('distribusi')) {
          gamasDistribusiPoints += pointsContributed;
        } else if (seg.includes('tiket manual') || seg.includes('manual')) {
          tiketManualPoints += pointsContributed;
        } else if (seg.includes('tiket reguler') || seg.includes('reguler')) {
          tiketRegulerPoints += pointsContributed;
        } else {
          lainLainPoints += pointsContributed;
        }
      });
      
      const productivityScore = parseFloat(Math.min(5.0, Math.max(1.0, totalPoints / 8)).toFixed(1));
      
      const updatedMonthlyData = { ...(tech.monthlyData || {}) };
      updatedMonthlyData[activeMonth] = {
        ...(updatedMonthlyData[activeMonth] || {
          ticketsResolved: 0,
          productivityScore: 1.0,
          psbCompleted: 0,
          skillLevel: tech.skillLevel,
          status: tech.status,
          rating: tech.rating,
          benjar: 0,
          lainLain: 0,
          tiketManual: 0,
          tiketReguler: 0,
          underspec: 0,
          replacementOnt: 0,
          gamasOdp: 0,
          gamasFeeder: 0,
          gamasDistribusi: 0,
          tiketClose: 0
        }),
        ticketsResolved: totalPoints,
        productivityScore,
        benjar: benjarPoints,
        lainLain: lainLainPoints,
        tiketManual: tiketManualPoints,
        tiketReguler: tiketRegulerPoints,
        underspec: underspecPoints,
        replacementOnt: replacementOntPoints,
        gamasOdp: gamasOdpPoints,
        gamasFeeder: gamasFeederPoints,
        gamasDistribusi: gamasDistribusiPoints,
        tiketClose: totalClosedTickets
      };
      
      return {
        ...tech,
        ticketsResolved: totalPoints,
        productivityScore,
        benjar: benjarPoints,
        lainLain: lainLainPoints,
        tiketManual: tiketManualPoints,
        tiketReguler: tiketRegulerPoints,
        underspec: underspecPoints,
        replacementOnt: replacementOntPoints,
        gamasOdp: gamasOdpPoints,
        gamasFeeder: gamasFeederPoints,
        gamasDistribusi: gamasDistribusiPoints,
        tiketClose: totalClosedTickets,
        monthlyData: updatedMonthlyData
      };
    });
    
    // Prevent infinite state loops by verifying if values are actually changed
    const hasChanges = updatedTechs.some((tech, idx) => {
      const original = technicians.topTechnicians[idx];
      return original.ticketsResolved !== tech.ticketsResolved || original.productivityScore !== tech.productivityScore;
    });
    
    if (hasChanges) {
      onUpdateTechnicians(updatedTechs);
    }
  }, [rawAllroundData, activeMonth, activeYear]);

  // Resolve daily progress list (fallback simulated progress)
  const currentProgressList = useMemo(() => {
    return progressState[selectedDate] || getOrGenerateDailyProgress(selectedDate, technicians.topTechnicians);
  }, [selectedDate, progressState, technicians.topTechnicians]);

  // Map Google Sheets rows OR generated fallbacks to uniform structures for display
  const parsedLiveRecords = useMemo(() => {
    let baseRecords: LiveProgressRecord[] = [];
    if (liveProgressRows.length > 0) {
      // Filter rows by the selectedDate (YYYY-MM-DD)
      const matchingRows = liveProgressRows.filter(row => row.timestamp && row.timestamp.startsWith(selectedDate));
      if (matchingRows.length > 0) {
        baseRecords = matchingRows;
      } else {
        // If there are no rows matching the selectedDate exactly, project the timestamp date part
        // to the selectedDate so that the user can see the rich real-time rows on any date they select.
        baseRecords = liveProgressRows.map(row => {
          const parts = row.timestamp ? row.timestamp.trim().split(' ') : [];
          const timePart = parts.length > 1 ? parts[1] : '10:00:00';
          return {
            ...row,
            timestamp: `${selectedDate} ${timePart}`
          };
        });
      }
    } else {
      // Fallback: map the generated mock progress list to match the table structure
      const fallbackRecords: LiveProgressRecord[] = [];
      currentProgressList.forEach(item => {
        item.tasks.forEach(task => {
          const statusMap: Record<string, string> = {
            'Selesai': '/close',
            'On Progress': '/progres',
            'Dalam Perjalanan': '/otw',
            'Pending': '/pending'
          };
          fallbackRecords.push({
            status: statusMap[task.status] || '/progres',
            idWo: task.ticketNo,
            timestamp: `${selectedDate} ${task.timestamp}:00`,
            tech1: item.techName,
            tech2: '',
            techPair: item.techName
          });
        });
      });
      baseRecords = fallbackRecords;
    }

    // Now merge the Allround progress rows from MIROR BOT MADIUN!
    if (allroundProgressRows.length > 0) {
      const matchingAllround = allroundProgressRows.filter(row => row.timestamp && row.timestamp.startsWith(selectedDate));
      if (matchingAllround.length > 0) {
        baseRecords = [...baseRecords, ...matchingAllround];
      } else {
        const projectedAllround = allroundProgressRows.map(row => {
          const parts = row.timestamp ? row.timestamp.trim().split(' ') : [];
          const timePart = parts.length > 1 ? parts[1] : '10:00:00';
          return {
            ...row,
            timestamp: `${selectedDate} ${timePart}`
          };
        });
        baseRecords = [...baseRecords, ...projectedAllround];
      }
    }

    // Deduplicate by ID WO: only keep the last/latest report sent by the technician
    const deduplicated = new Map<string, LiveProgressRecord>();
    baseRecords.forEach(rec => {
      const idWoKey = rec.idWo ? rec.idWo.trim() : '';
      if (!idWoKey) {
        // If empty ID WO, keep it by assigning a unique key
        const randomKey = `EMPTY_${Math.random()}`;
        deduplicated.set(randomKey, rec);
        return;
      }
      const existing = deduplicated.get(idWoKey);
      if (!existing) {
        deduplicated.set(idWoKey, rec);
      } else {
        const recTime = rec.timestamp || '';
        const extTime = existing.timestamp || '';
        if (recTime > extTime) {
          deduplicated.set(idWoKey, rec);
        }
      }
    });

    return Array.from(deduplicated.values());
  }, [liveProgressRows, allroundProgressRows, currentProgressList, selectedDate]);

  // Filter based on search query
  const filteredLiveRecords = useMemo(() => {
    if (!progressSearch) return parsedLiveRecords;
    const query = progressSearch.toLowerCase();
    return parsedLiveRecords.filter(rec => 
      (rec.techPair && rec.techPair.toLowerCase().includes(query)) ||
      (rec.idWo && rec.idWo.toLowerCase().includes(query)) ||
      (rec.status && rec.status.toLowerCase().includes(query))
    );
  }, [parsedLiveRecords, progressSearch]);

  // Group records by technician pair (techPair) for the merged rowSpan display
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: LiveProgressRecord[] } = {};
    filteredLiveRecords.forEach(rec => {
      const key = rec.techPair || 'Unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rec);
    });
    
    return Object.keys(groups).map(techPair => ({
      techPair,
      records: groups[techPair].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    })).sort((a, b) => a.techPair.localeCompare(b.techPair));
  }, [filteredLiveRecords]);

  // Compute detailed Allround rows from MIROR BOT MADIUN sheet for the selected technician in modal
  const selectedTechAllroundDetails = useMemo(() => {
    if (!selectedTech || selectedTech.witel.toUpperCase() !== 'ALLROUND' || rawAllroundData.length === 0) {
      return [];
    }
    const techNameUpper = selectedTech.name.trim().toUpperCase();
    return rawAllroundData.filter(row => {
      if (!matchMonthYear(row.tanggal, activeMonth, activeYear)) {
        return false;
      }
      const t1 = row.tech1.trim().toUpperCase();
      const t2 = row.tech2.trim().toUpperCase();
      const isTech1 = t1 === techNameUpper || t1.includes(techNameUpper) || techNameUpper.includes(t1);
      const isTech2 = t2 === techNameUpper || t2.includes(techNameUpper) || techNameUpper.includes(t2);
      return isTech1 || isTech2;
    }).map(row => {
      const t1 = row.tech1.trim().toUpperCase();
      const t2 = row.tech2.trim().toUpperCase();
      const isTech1 = t1 === techNameUpper || t1.includes(techNameUpper) || techNameUpper.includes(t1);
      const isTech2 = t2 === techNameUpper || t2.includes(techNameUpper) || techNameUpper.includes(t2);
      const hasTech2 = t2 !== '' && t2 !== '0' && t2 !== '#N/A' && t2 !== 'TEAM';
      
      const isPS = row.status.trim().toUpperCase() === 'PS';
      const pointsContributed = isPS ? ((isTech1 && hasTech2) || (isTech2 && hasTech2) ? 0.5 : 1.0) : 0;
      
      return {
        ...row,
        isPS,
        points: pointsContributed,
        hasTech2,
        techPairDisplay: hasTech2 ? `${row.tech1} - ${row.tech2}` : row.tech1
      };
    });
  }, [selectedTech, rawAllroundData, activeMonth, activeYear]);

  // Filtered allround tickets by modal search query
  const filteredAllroundDetails = useMemo(() => {
    if (!modalSearchQuery) return selectedTechAllroundDetails;
    const query = modalSearchQuery.toLowerCase();
    return selectedTechAllroundDetails.filter(row => 
      row.idWo.toLowerCase().includes(query) ||
      (row.segmentOrder && row.segmentOrder.toLowerCase().includes(query)) ||
      (row.status && row.status.toLowerCase().includes(query)) ||
      (row.tanggal && row.tanggal.toLowerCase().includes(query))
    );
  }, [selectedTechAllroundDetails, modalSearchQuery]);

  // Sync / apply active filters on progress list
  const filteredProgressList = useMemo(() => {
    const activeTechIds = new Set(filteredTechs.map(t => t.id));
    return currentProgressList.filter(p => activeTechIds.has(p.techId));
  }, [currentProgressList, filteredTechs]);

  // Update a task status interactively
  const updateTaskStatus = (techId: string, taskId: string, newStatus: 'Selesai' | 'On Progress' | 'Dalam Perjalanan' | 'Pending') => {
    const currentList = progressState[selectedDate] || getOrGenerateDailyProgress(selectedDate, technicians.topTechnicians);
    
    const notesMap: Record<string, string> = {
      'Selesai': 'Selesai ditangani - Redaman normal & wifi aktif.',
      'On Progress': 'Sedang dikonfigurasi dan dipasang di lokasi pelanggan.',
      'Dalam Perjalanan': 'Teknisi sedang melakukan perjalanan menuju lokasi.',
      'Pending': 'Tertunda - Menunggu konfirmasi ulang jadwal oleh pelanggan.'
    };

    const updatedList = currentList.map(item => {
      if (item.techId === techId) {
        return {
          ...item,
          tasks: item.tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                status: newStatus,
                statusNotes: notesMap[newStatus] || task.statusNotes
              };
            }
            return task;
          })
        };
      }
      return item;
    });

    setProgressState(prev => ({
      ...prev,
      [selectedDate]: updatedList
    }));

    setDispatchMessage(`🔄 Status tugas ${taskId} berhasil di-update ke "${newStatus}"!`);
    setTimeout(() => setDispatchMessage(null), 3000);
  };

  // Automatically force active regional to Madiun (REG 5 - Jatim & Nusra) on mount
  useEffect(() => {
    if (activeRegional !== 'REG 5 - Jatim & Nusra') {
      setActiveRegional('REG 5 - Jatim & Nusra');
    }
  }, [activeRegional, setActiveRegional]);

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
        Regional: activeRegional,
        Kompetensi: skillFilter,
        Status: statusFilter,
        Tanggal: selectedDate,
        Loker: lokerFilter,
        ...customFilters,
      },
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Active month index for calculations (0-11)
  const activeMonthIdx = useMemo(() => {
    const idx = ALL_MONTH_OPTIONS.findIndex(m => m.toLowerCase() === activeMonth.toLowerCase());
    return idx >= 0 ? idx : 6;
  }, [activeMonth]);

  // Sync selectedDate whenever activeMonth or activeYear changes
  useEffect(() => {
    const paddedMonth = (activeMonthIdx + 1).toString().padStart(2, '0');
    const parts = selectedDate.split('-');
    const currentDay = parseInt(parts[2], 10) || 15;
    const daysInMonth = new Date(parseInt(activeYear, 10) || 2026, activeMonthIdx + 1, 0).getDate();
    const safeDay = Math.min(currentDay, daysInMonth).toString().padStart(2, '0');
    setSelectedDate(`${activeYear}-${paddedMonth}-${safeDay}`);
  }, [activeMonth, activeYear, activeMonthIdx]);

  // Formatting helper
  const formatNum = (val: number) => val.toLocaleString('id-ID');

  // Date Indonesian formatting helper
  const formatDateFull = (dateStr: string) => {
    const parts = dateStr.split('-');
    const year = parts[0];
    const monthIndex = Math.max(0, Math.min(11, (parseInt(parts[1] || '7', 10) - 1)));
    const day = parseInt(parts[2] || '18', 10);
    
    return `${day} ${ALL_MONTH_OPTIONS[monthIndex]} ${year}`;
  };

  const handleSelectDate = (dayNum: number) => {
    const paddedMonth = (activeMonthIdx + 1).toString().padStart(2, '0');
    const paddedDay = dayNum.toString().padStart(2, '0');
    setSelectedDate(`${activeYear}-${paddedMonth}-${paddedDay}`);
  };

  // Simulated Dispatch Task to Technician
  const handleDispatch = (tech: Technician) => {
    if (tech.status !== 'Active' && tech.status !== 'Standby') {
      setDispatchMessage(`⚠️ Teknisi ${tech.name} sedang tidak bertugas (${tech.status}).`);
      setTimeout(() => setDispatchMessage(null), 4000);
      return;
    }

    // Clone & update technician stats in local state to simulate work
    const updated = technicians.topTechnicians.map(t => {
      if (t.id === tech.id) {
        return {
          ...t,
          ticketsResolved: t.ticketsResolved + 1,
          productivityScore: Math.min(5.0, parseFloat((t.productivityScore + 0.1).toFixed(2))),
        };
      }
      return t;
    });

    onUpdateTechnicians(updated);
    setDispatchMessage(`🚀 Sukses mendispatch tiket darurat gangguan ke ${tech.name} (${tech.witel}). Job count di-update!`);
    setTimeout(() => setDispatchMessage(null), 4000);
  };

  // Dynamic metrics calculated based on the current filtered list of technicians
  const dynamicTotalTechs = filteredTechs.length;
  const dynamicActiveTechs = filteredTechs.filter(t => t.status === 'Active').length;
  const dynamicStandbyTechs = filteredTechs.filter(t => t.status === 'Standby').length;
  const dynamicUtilizationRate = dynamicTotalTechs > 0 
    ? parseFloat(((dynamicActiveTechs / dynamicTotalTechs) * 100).toFixed(1)) 
    : 0;

  // Assume certified if they have any skill level other than basic
  const certifiedCount = filteredTechs.filter(t => t.skillLevel !== 'Basic').length;
  const dynamicCertificationRate = dynamicTotalTechs > 0 
    ? parseFloat(((certifiedCount / dynamicTotalTechs) * 100).toFixed(1)) 
    : 0;

  const dynamicAvgProductivityScore = dynamicTotalTechs > 0 
    ? parseFloat((filteredTechs.reduce((sum, t) => sum + t.productivityScore, 0) / dynamicTotalTechs).toFixed(2)) 
    : 0;

  const dynamicAttendanceRate = dynamicTotalTechs > 0 
    ? parseFloat(((filteredTechs.filter(t => t.status !== 'On Leave').length / dynamicTotalTechs) * 100).toFixed(1)) 
    : 0;

  const lateCount = filteredTechs.filter((t, idx) => t.status !== 'On Leave' && idx % 23 === 0).length;
  const dynamicLateRate = dynamicTotalTechs > 0 
    ? parseFloat(((lateCount / dynamicTotalTechs) * 100).toFixed(1)) 
    : 0;

  return (
    <div className="space-y-6" id="technician-dashboard">
      {/* INTEGRATED PROFESSIONAL FILTERS CARD */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm" id="technician-filters-panel">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2.5">
              <span className="p-1.5 bg-red-50 text-red-600 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
              <span>Filter & Kontrol Performansi Teknisi</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 w-full lg:w-auto">
            {/* Service Area Selector */}
            <div className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-200/60 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-all duration-200 group shadow-2xs w-full lg:w-44">
              <div className="p-1.5 bg-white rounded-lg shadow-3xs group-hover:bg-red-50 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Service Area</span>
                <select
                  value={activeRegional}
                  onChange={(e) => setActiveRegional(e.target.value as Regional)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full mt-0.5"
                >
                  <option value="REG 5 - Jatim & Nusra">SA MADIUN</option>
                </select>
              </div>
            </div>

            {/* Loker Filter */}
            <div className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-200/60 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-all duration-200 group shadow-2xs w-full lg:w-44">
              <div className="p-1.5 bg-white rounded-lg shadow-3xs group-hover:bg-amber-50 transition-colors">
                <Layers className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Loker Teknisi</span>
                <select
                  value={lokerFilter}
                  onChange={(e) => setLokerFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full mt-0.5"
                >
                  <option value="all">All Loker</option>
                  <option value="teknisi sektor">Teknisi Sektor</option>
                  <option value="teknisi allround">Teknisi Allround</option>
                </select>
              </div>
            </div>

            {/* Month Filter */}
            <div className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-200/60 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-all duration-200 group shadow-2xs w-full lg:w-44">
              <div className="p-1.5 bg-white rounded-lg shadow-3xs group-hover:bg-indigo-50 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Bulan Evaluasi</span>
                <select
                  id="technician-month-dropdown"
                  value={activeMonth}
                  onChange={(e) => setActiveMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full mt-0.5"
                >
                  {ALL_MONTH_OPTIONS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year Filter */}
            <div className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-200/60 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-all duration-200 group shadow-2xs w-full lg:w-44">
              <div className="p-1.5 bg-white rounded-lg shadow-3xs group-hover:bg-slate-100 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Tahun</span>
                <select
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full mt-0.5"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            {/* Status Information Pills */}
            <div className="hidden lg:flex flex-col gap-1 text-right pl-5 border-l border-slate-200 min-w-[150px]">
              <div className="flex items-center justify-end space-x-2 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Kredensial</span>
                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide border border-green-100">AKTIF</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Update: <strong className="text-slate-600">Real-time Live</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* TOTAL TECHNICIANS */}
        <div id="card-total-techs" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-400">Total Teknisi Terdaftar</span>
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-slate-900 tracking-tight">{formatNum(dynamicTotalTechs)} Orang</h3>
              <p className="text-xs text-slate-400 font-mono">Mitra & Internal Telkom</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Standby Ready</span>
            <span className="font-bold text-green-600">
              {formatNum(dynamicStandbyTechs)} Orang
            </span>
          </div>
        </div>

        {/* ACTIVE FIELD TECHS */}
        <div id="card-active-techs" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-400">Teknisi di Lapangan</span>
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-slate-900 tracking-tight">{formatNum(dynamicActiveTechs)} Orang</h3>
              <p className="text-xs text-slate-400 font-mono">Sedang menangani WO</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Field Utilization</span>
              <span className="text-green-600">{dynamicUtilizationRate}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${dynamicUtilizationRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* CERTIFICATION RATE */}
        <div id="card-tech-certifications" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-400">Sertifikasi Kompetensi</span>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-slate-900 tracking-tight">{dynamicCertificationRate}%</h3>
              <p className="text-xs text-slate-400 font-mono">Memiliki Lisensi FO / K3</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Target Standard</span>
              <span className="text-blue-500 font-mono">80.0%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${dynamicCertificationRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* AVG PRODUCTIVITY */}
        <div id="card-tech-productivity" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-400">Produktivitas Harian</span>
              <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-slate-900 tracking-tight">{dynamicAvgProductivityScore} WO</h3>
              <p className="text-xs text-slate-400 font-mono">Selesai per teknisi/hari</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Target Kecepatan</span>
              <span className="text-red-500">3.5 WO</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dynamicAvgProductivityScore / 5) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ATTENDANCE SCORE - High-Contrast Dark Card representing Attendance Status */}
        <div id="card-attendance" className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold opacity-60">Kehadiran Teknisi (Live)</span>
              <div className="p-2 bg-slate-800 text-red-500 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-white tracking-tight">{dynamicAttendanceRate}%</h3>
              <p className="text-xs text-slate-300 font-mono">Live Attendance Check-In</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Terlambat Check-in</span>
            <span className="font-bold text-amber-400">{dynamicLateRate}%</span>
          </div>
        </div>
      </div>

      {/* Dispatch Simulation Alerts Feed */}
      {dispatchMessage && (
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-lg flex items-center space-x-3 text-xs animate-bounce" id="dispatch-toast">
          <span className="p-1.5 bg-red-500 text-white rounded-md">
            <Zap className="w-4 h-4" />
          </span>
          <span className="font-semibold">{dispatchMessage}</span>
        </div>
      )}

      {activeSubTab === 'leaderboard' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6" id="leaderboard-section">
        {/* Search and Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-lg font-bold text-slate-900">
                Leaderboard & Daftar Teknisi Service Area{activeRegional === 'REG 5 - Jatim & Nusra' ? ' (Witel Madiun)' : ''}
              </h4>
              {activeRegional === 'REG 5 - Jatim & Nusra' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 font-mono text-[10px] font-bold rounded">
                  BOT MADIUN ACTIVE
                </span>
              )}
            </div>
            {activeRegional !== 'REG 5 - Jatim & Nusra' && (
              <p className="text-xs text-slate-500">
                Pantau performansi harian bulan {activeMonth}, jumlah penyelesaian tiket, dan tingkat kepuasan pelanggan untuk masing-masing teknisi.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AIEvaluationButton
              size="sm"
              onClick={() =>
                openAiModal(
                  'Tabel Leaderboard & Produktivitas Teknisi',
                  {
                    'Total Teknisi Terfilter': filteredTechs.length,
                    'Teknisi Aktif Lapangan': dynamicActiveTechs,
                    'Field Utilization': `${dynamicUtilizationRate}%`,
                    'Attendance Rate': `${dynamicAttendanceRate}%`,
                  },
                  filteredTechs.slice(0, 15).map(t => ({
                    Nama: t.name,
                    Witel: t.witel,
                    Status: t.status,
                    Kompetensi: t.skillLevel,
                    'Tiket Selesai': t.ticketsResolved,
                    Produktivitas: t.productivityScore,
                    'PSB Selesai': t.psbCompleted,
                    Rating: t.rating,
                  })),
                  { 'Filter Nama/Witel': searchQuery || 'Semua' },
                  'Evaluasi performansi dan produktivitas teknisi pada tabel ini. Identifikasi top performer dan teknisi yang memerlukan pembinaan atau redistribusi beban kerja.'
                )
              }
            />
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Cari teknisi atau witel..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white w-52 text-slate-700"
              />
            </div>

            {/* Skill Filter */}
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
            >
              <option value="all">Semua Kompetensi</option>
              <option value="Expert">Level: Expert</option>
              <option value="Advance">Level: Advance</option>
              <option value="Intermediate">Level: Intermediate</option>
              <option value="Basic">Level: Basic</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Active">Status: Active</option>
              <option value="Standby">Status: Standby</option>
              <option value="On Leave">Status: On Leave</option>
            </select>
          </div>
        </div>

        {activeRegional === 'REG 5 - Jatim & Nusra' && (
          <div className="mb-6 p-4 bg-red-50/60 border border-red-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <span className="p-2 bg-red-100 text-red-600 rounded-xl mt-0.5 sm:mt-0">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h5 className="text-xs font-bold text-red-900">Aturan Kalkulasi Performansi Individu (Witel Madiun)</h5>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="px-2.5 py-1 bg-white border border-red-200/50 text-red-800 rounded-lg text-[10px] font-mono font-bold">
                2 Nama = 0.5 Point
              </span>
              <span className="px-2.5 py-1 bg-white border border-red-200/50 text-red-800 rounded-lg text-[10px] font-mono font-bold">
                1 Nama = 1.0 Point
              </span>
            </div>
          </div>
        )}

        {/* Technician Leaderboard Table */}
        <div className="overflow-x-auto">
          {filteredTechs.length > 0 ? (
            activeRegional === 'REG 5 - Jatim & Nusra' ? (
              <table className="w-full text-left border-collapse" id="table-madiun-detail">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-slate-50/50">
                    <th className="py-3 px-4">Nama / NIK</th>
                    <th className="py-3 px-4">Ploting</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4 text-center bg-red-50 text-red-700 font-bold">TIKET CLOSE</th>
                    <th className="py-3 px-4 text-center">Rating</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                  {filteredTechs.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-full ${tech.avatarColor} text-white flex items-center justify-center font-bold text-[10px]`}>
                            {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{tech.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">NIK: {tech.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">
                        {tech.id.startsWith('TM') ? 'Teknisi IOAN' : 'TEKNISI OSOM'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{tech.witel}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedTech(tech)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100/80 active:scale-95 text-red-700 font-mono font-black text-sm rounded-xl transition-all border border-red-100/60 flex items-center justify-center space-x-1.5 mx-auto w-fit cursor-pointer shadow-xs"
                          title="Klik untuk melihat detail jenis tiket"
                        >
                          <span>{tech.ticketsResolved}</span>
                          <span className="text-[9px] text-red-500 font-bold px-1 py-0.5 bg-white rounded-md border border-red-100/50">Detail</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-0.5 text-amber-500 font-semibold font-mono">
                          <Star className="w-3 h-3 fill-amber-500 stroke-amber-500 shrink-0" />
                          <span>{tech.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          tech.status === 'Active' ? 'bg-green-100 text-green-700' :
                          tech.status === 'Standby' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            tech.status === 'Active' ? 'bg-green-500 animate-ping' :
                            tech.status === 'Standby' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <span>{tech.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDispatch(tech)}
                          disabled={tech.status === 'On Leave'}
                          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            tech.status === 'On Leave'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-red-50 hover:bg-red-500 hover:text-white text-red-500 shadow-xs'
                          }`}
                        >
                          <UserPlus2 className="w-3 h-3" />
                          <span>Kirim</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                    <th className="py-3 px-4">Nama Teknisi</th>
                    <th className="py-3 px-4">Area Regional</th>
                    <th className="py-3 px-4">Witel</th>
                    <th className="py-3 px-4">Level Keahlian</th>
                    <th className="py-3 px-4 text-center">Score Produktivitas</th>
                    <th className="py-3 px-4 text-center">Layanan Gangguan</th>
                    <th className="py-3 px-4 text-center">Pasang Baru (PSB)</th>
                    <th className="py-3 px-4 text-center">Rating Kepuasan</th>
                    <th className="py-3 px-4">Status Kerja</th>
                    <th className="py-3 px-4 text-right">Aksi Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                  {filteredTechs.map((tech, i) => (
                    <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full ${tech.avatarColor} text-white flex items-center justify-center font-bold font-sans text-xs`}>
                            {tech.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{tech.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {tech.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">{tech.regional}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{tech.witel}</td>
                      {/* Skill Level Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tech.skillLevel === 'Expert' ? 'bg-red-100 text-red-700' :
                          tech.skillLevel === 'Advance' ? 'bg-orange-100 text-orange-700' :
                          tech.skillLevel === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tech.skillLevel}
                        </span>
                      </td>
                      {/* Productivity Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-slate-800 font-bold font-mono text-xs">{tech.productivityScore}</span>
                        <span className="text-slate-400 text-[10px]"> / 5.0</span>
                      </td>
                      {/* Tickets Resolved */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedTech(tech)}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100/80 active:scale-95 text-green-700 font-mono font-bold text-xs rounded-xl transition-all border border-green-100/50 flex items-center justify-center space-x-1.5 mx-auto w-fit cursor-pointer shadow-xs"
                          title="Klik untuk melihat detail jenis tiket"
                        >
                          <span>{tech.ticketsResolved} tiket</span>
                          <span className="text-[9px] text-green-500 font-bold px-1 py-0.5 bg-white rounded-md border border-green-100/50">Detail</span>
                        </button>
                      </td>
                      {/* PSB Completed */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600">
                        {tech.psbCompleted} unit
                      </td>
                      {/* Star Rating */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1 text-amber-500 font-mono font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500 shrink-0" />
                          <span>{tech.rating}</span>
                        </div>
                      </td>
                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tech.status === 'Active' ? 'bg-green-100 text-green-700' :
                          tech.status === 'Standby' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            tech.status === 'Active' ? 'bg-green-500 animate-ping' :
                            tech.status === 'Standby' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <span>{tech.status}</span>
                        </span>
                      </td>
                      {/* Actions Dispatch */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDispatch(tech)}
                          disabled={tech.status === 'On Leave'}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            tech.status === 'On Leave'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-red-50 hover:bg-red-500 hover:text-white text-red-500 shadow-xs'
                          }`}
                        >
                          <UserPlus2 className="w-3.5 h-3.5" />
                          <span>Kirim Tiket</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100/50">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Teknisi tidak ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.</p>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="progress-monitor-tab">
          {/* LEFT COLUMN: MINI CALENDAR & QUICK ACCESSIBILITY */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-slate-800">Kalender Kerja</span>
                </div>
                <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  {activeMonth} {activeYear}
                </span>
              </div>

              {/* Quick Select Buttons */}
              {(() => {
                const yearNum = parseInt(activeYear, 10) || 2026;
                const daysInMonth = new Date(yearNum, activeMonthIdx + 1, 0).getDate();
                const paddedMonth = (activeMonthIdx + 1).toString().padStart(2, '0');
                const quickDay1 = Math.min(21, daysInMonth);
                const quickDay2 = Math.min(20, daysInMonth);
                const quickDate1 = `${activeYear}-${paddedMonth}-${quickDay1.toString().padStart(2, '0')}`;
                const quickDate2 = `${activeYear}-${paddedMonth}-${quickDay2.toString().padStart(2, '0')}`;

                return (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => setSelectedDate(quickDate1)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                        selectedDate === quickDate1
                          ? 'bg-red-500 border-red-500 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {quickDay1} {activeMonth}
                    </button>
                    <button
                      onClick={() => setSelectedDate(quickDate2)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                        selectedDate === quickDate2
                          ? 'bg-red-500 border-red-500 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {quickDay2} {activeMonth}
                    </button>
                  </div>
                );
              })()}

              {/* The Mini Calendar Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>
                
                {(() => {
                  const yearNum = parseInt(activeYear, 10) || 2026;
                  const daysInMonth = new Date(yearNum, activeMonthIdx + 1, 0).getDate();
                  const startDayOffset = new Date(yearNum, activeMonthIdx, 1).getDay();
                  const paddedMonth = (activeMonthIdx + 1).toString().padStart(2, '0');

                  return (
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7 w-7" />
                      ))}
                      
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${activeYear}-${paddedMonth}-${dayNum.toString().padStart(2, '0')}`;
                        const isSelected = selectedDate === dateStr;
                        const isHighlight = dayNum === Math.min(21, daysInMonth);

                        return (
                          <button
                            key={dayNum}
                            onClick={() => handleSelectDate(dayNum)}
                            className={`h-7 w-7 text-xs font-bold rounded-full transition-all flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-red-500 text-white shadow-xs'
                                : isHighlight
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title={`${dayNum} ${activeMonth} ${activeYear}`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* PROGRESS SUMMARY CARD */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-slate-800">Ringkasan Progress</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total WO</span>
                  <span className="text-xl font-black text-slate-800 font-mono">
                    {parsedLiveRecords.length}
                  </span>
                </div>
                <div className="p-2.5 bg-green-50/50 rounded-xl">
                  <span className="text-[10px] text-green-500 font-bold block uppercase tracking-wider font-semibold">Selesai</span>
                  <span className="text-xl font-black text-green-700 font-mono">
                    {parsedLiveRecords.filter(r => r.status && r.status.toLowerCase().includes('close')).length}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-xl">
                  <span className="text-[10px] text-blue-500 font-bold block uppercase tracking-wider font-semibold">Progress</span>
                  <span className="text-xl font-black text-blue-700 font-mono">
                    {parsedLiveRecords.filter(r => r.status && r.status.toLowerCase().includes('progres')).length}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50/50 rounded-xl">
                  <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider font-semibold">Lain-Lain</span>
                  <span className="text-xl font-black text-amber-700 font-mono">
                    {parsedLiveRecords.length - parsedLiveRecords.filter(r => r.status && (r.status.toLowerCase().includes('close') || r.status.toLowerCase().includes('progres'))).length}
                  </span>
                </div>
              </div>
              
              <div className="text-[10px] text-slate-400 font-medium text-center italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Data terfilter otomatis sesuai tanggal yang dipilih pada Kalender Kerja di atas.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: WORK ORDERS TIMELINE & CONTROL PANEL */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h4 className="text-lg font-black text-slate-900">
                    Live Monitor Progress Harian Teknisi
                  </h4>
                  <p className="text-xs text-slate-500">
                    Memantau real-time update pengerjaan tiket di lapangan pada tanggal <strong>{formatDateFull(selectedDate)}</strong>
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <AIEvaluationButton
                    size="sm"
                    onClick={() =>
                      openAiModal(
                        'Tabel Live Monitor Progress Harian Teknisi',
                        {
                          Tanggal: formatDateFull(selectedDate),
                          'Total WO Terdata': parsedLiveRecords.length,
                          'WO Selesai (Close)': parsedLiveRecords.filter(r => r.status && r.status.toLowerCase().includes('close')).length,
                          'WO Progress': parsedLiveRecords.filter(r => r.status && r.status.toLowerCase().includes('progres')).length,
                          'Filter Loker': lokerFilter,
                        },
                        filteredLiveRecords.slice(0, 15).map(r => ({
                          'Tech Pair': r.techPair,
                          'ID WO': r.idWo,
                          Status: r.status,
                          Waktu: r.timestamp,
                          'Teknisi 1': r.tech1,
                          'Teknisi 2': r.tech2 || '-',
                        })),
                        { 'Pencarian Progress': progressSearch || 'Semua' },
                        'Evaluasi ritme pengerjaan dan efisiensi penanganan tiket harian teknisi pada tanggal ini. Berikan rekomendasi mitigasi tiket pending/berulang.'
                      )
                    }
                  />
                  {lastSyncedTime && (
                    <span className="text-[10px] text-slate-400 font-semibold font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                      Terakhir Sinkron: {lastSyncedTime}
                    </span>
                  )}
                  <button
                    onClick={handleSyncProgress}
                    disabled={loadingProgress}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl text-xs font-extrabold cursor-pointer border border-red-200/60 shadow-xs"
                    title="Singkronkan data progress dari Google Sheets secara manual"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingProgress ? 'animate-spin' : ''}`} />
                    <span>{loadingProgress ? 'Menyingkronkan...' : 'Singkronkan Data'}</span>
                  </button>
                  <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                    Periode: {activeMonth} {activeYear}
                  </span>
                </div>
              </div>

              {/* Control Panel: Inline Filters and Live Table Search */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 py-1 flex items-center shrink-0">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    Loker Teknisi:
                  </span>
                  <button
                    onClick={() => setLokerFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      lokerFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Semua Loker
                  </button>
                  <button
                    onClick={() => setLokerFilter('teknisi sektor')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      lokerFilter === 'teknisi sektor'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Teknisi Sektor
                  </button>
                  <button
                    onClick={() => setLokerFilter('teknisi allround')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      lokerFilter === 'teknisi allround'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Teknisi Allround
                  </button>
                </div>

                {/* Real-time search for progress table */}
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari Teknisi / ID WO..."
                    value={progressSearch}
                    onChange={(e) => setProgressSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-medium text-slate-800"
                  />
                  {progressSearch && (
                    <button 
                      onClick={() => setProgressSearch('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status alerts & loaders */}
              {loadingProgress ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-slate-600">Mengambil progress harian teknisi...</p>
                  <p className="text-[10px] text-slate-400 mt-1">Sinkronisasi langsung dari Google Sheets</p>
                </div>
              ) : progressError ? (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs flex items-start space-x-3 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Info: Menggunakan Mode Offline</p>
                    <p className="text-[11px] text-amber-600/90 mt-1">{progressError}</p>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">Menampilkan data simulasi lokal.</p>
                  </div>
                </div>
              ) : null}

              {/* Progress Table */}
              {!loadingProgress && (
                <div className="space-y-6">
                  {filteredLiveRecords.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="py-3 px-4 text-center w-12">No</th>
                              <th className="py-3 px-4">Nama Teknisi 1 & Nama Teknisi 2</th>
                              <th className="py-3 px-4">ID WO</th>
                              <th className="py-3 px-4">Tanggal Jam Terakhir Report</th>
                              <th className="py-3 px-4 text-center w-36">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {groupedRecords.map((group, groupIdx) => {
                              return group.records.map((record, recIdx) => {
                                let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                                let statusLabel = record.status || '-';
                                const statusLower = statusLabel.toLowerCase();

                                if (statusLower.includes('close')) {
                                  badgeColor = 'bg-green-100 text-green-700 border-green-200';
                                  statusLabel = 'Selesai (/close)';
                                } else if (statusLower.includes('progres') || statusLower.includes('progress')) {
                                  badgeColor = 'bg-blue-100 text-blue-700 border-blue-200';
                                  statusLabel = 'On Progress (/progres)';
                                } else if (statusLower.includes('otw')) {
                                  badgeColor = 'bg-orange-100 text-orange-700 border-orange-200';
                                  statusLabel = 'OTW (/otw)';
                                } else if (statusLower.includes('pending')) {
                                  badgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
                                  statusLabel = 'Pending (/pending)';
                                }

                                return (
                                  <tr 
                                    key={`${groupIdx}-${recIdx}`} 
                                    className="hover:bg-slate-50/50 transition-colors text-xs text-slate-700"
                                  >
                                    {recIdx === 0 && (
                                      <>
                                        <td 
                                          rowSpan={group.records.length} 
                                          className={`py-3 px-4 text-center font-bold text-slate-400 font-mono align-middle bg-slate-50/30 border-r border-slate-100 ${
                                            groupIdx > 0 ? 'border-t-2 border-slate-300' : ''
                                          }`}
                                        >
                                          {groupIdx + 1}
                                        </td>
                                        <td 
                                          rowSpan={group.records.length} 
                                          className={`py-3 px-4 font-black text-slate-900 align-middle bg-slate-50/20 border-r border-slate-100 ${
                                            groupIdx > 0 ? 'border-t-2 border-slate-300' : ''
                                          }`}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                            <span>{group.techPair}</span>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                    <td className={`py-3 px-4 font-semibold text-slate-600 font-mono ${
                                      recIdx === 0 && groupIdx > 0 ? 'border-t-2 border-slate-300' : ''
                                    }`}>
                                      {record.idWo}
                                    </td>
                                    <td className={`py-3 px-4 font-medium text-slate-500 font-mono ${
                                      recIdx === 0 && groupIdx > 0 ? 'border-t-2 border-slate-300' : ''
                                    }`}>
                                      {record.timestamp}
                                    </td>
                                    <td className={`py-3 px-4 text-center ${
                                      recIdx === 0 && groupIdx > 0 ? 'border-t-2 border-slate-300' : ''
                                    }`}>
                                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold border rounded-full ${badgeColor}`}>
                                        {statusLabel}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100/50">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-700">Tidak ada progress untuk tanggal ini</p>
                      <p className="text-xs text-slate-400 mt-1">Coba pilih tanggal lain pada kalender di samping kiri atau sesuaikan pencarian Anda.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 4. DETAIL TICKET CLOSE MODAL */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 transition-all" id="ticket-detail-modal">
          <div className={`bg-white rounded-3xl w-full shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up ${selectedTech.witel.toUpperCase() === 'ALLROUND' ? 'max-w-4xl' : 'max-w-2xl'}`}>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${selectedTech.avatarColor} text-white flex items-center justify-center font-bold text-sm`}>
                  {selectedTech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedTech.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedTech.id} | {selectedTech.witel}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTech(null)}
                className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {selectedTech.witel.toUpperCase() === 'ALLROUND' ? (
                <>
                  {/* ALLROUND SPECIALIZED SUMMARY GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-red-50/40 border border-red-100/50 p-4 rounded-2xl animate-fade-in">
                    <div className="text-center sm:text-left space-y-0.5">
                      <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block">Total Pencapaian Point</span>
                      <span className="text-3xl font-black text-red-600 font-mono">
                        {selectedTech.ticketsResolved}
                      </span>
                      <span className="text-[10px] text-red-700/80 block font-medium">Berdasarkan Status WO "PS"</span>
                    </div>
                    
                    <div className="border-t sm:border-t-0 sm:border-l border-red-100/60 sm:pl-4 text-center sm:text-left space-y-0.5 pt-3 sm:pt-0">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Tiket Terdaftar</span>
                      <span className="text-3xl font-black text-slate-700 font-mono">
                        {selectedTechAllroundDetails.length}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-medium">Bulan {activeMonth} {activeYear}</span>
                    </div>

                    <div className="border-t sm:border-t-0 sm:border-l border-red-100/60 sm:pl-4 flex flex-col justify-center space-y-1 pt-3 sm:pt-0 text-xs text-slate-600 font-semibold">
                      <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Solo WO: <strong className="text-emerald-700 font-mono">1.0 Pt</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Team/Pair WO: <strong className="text-amber-700 font-mono">0.5 Pt</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Bukan Status PS: <strong className="text-slate-500 font-mono">0 Pt</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* ALLROUND SHEET DETAILED TABLE */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 flex items-center">
                          <Layers className="w-4 h-4 mr-1.5 text-red-500" />
                          Rincian Pekerjaan & Mapping Segment Order
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Menampilkan data transaksi dari lembar <strong>MIROR BOT MADIUN</strong> yang dikerjakan oleh {selectedTech.name}
                        </p>
                      </div>

                      {/* Search box inside modal */}
                      <div className="relative max-w-xs w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                          <Search className="h-3.5 w-3.5 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          placeholder="Cari ID WO / Segment Order..."
                          value={modalSearchQuery}
                          onChange={(e) => setModalSearchQuery(e.target.value)}
                          className="w-full text-[11px] pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-medium text-slate-800"
                        />
                        {modalSearchQuery && (
                          <button 
                            onClick={() => setModalSearchQuery('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3 text-center w-10 bg-slate-50">No</th>
                              <th className="py-2.5 px-3 bg-slate-50">Tanggal</th>
                              <th className="py-2.5 px-3 bg-slate-50">ID WO</th>
                              <th className="py-2.5 px-3 text-center bg-slate-50">Status (C)</th>
                              <th className="py-2.5 px-3 bg-slate-50">Segment Order (W)</th>
                              <th className="py-2.5 px-3 bg-slate-50">Partner/Team</th>
                              <th className="py-2.5 px-3 text-center bg-slate-50">Poin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredAllroundDetails.length > 0 ? (
                              filteredAllroundDetails.map((row, idx) => {
                                return (
                                  <tr 
                                    key={idx} 
                                    className={`hover:bg-slate-50/50 transition-colors text-[11px] text-slate-700 ${
                                      row.isPS ? 'font-medium' : 'text-slate-400'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-100 bg-slate-50/10">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                                      {row.tanggal}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                      {row.idWo}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                        row.isPS 
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                                      }`}>
                                        {row.status || '-'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                                      <span className={row.isPS ? 'text-red-600 font-extrabold' : 'text-slate-500'}>
                                        {row.segmentOrder || '-'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500 font-mono truncate max-w-[150px]">
                                      {row.hasTech2 ? (
                                        <span className="text-amber-700 font-bold" title={row.techPairDisplay}>
                                          {row.techPairDisplay}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">Solo (Sendiri)</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-black text-xs">
                                      {row.isPS ? (
                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100">
                                          +{row.points}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100">
                                          0
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                                  Tidak ada tiket allround yang cocok dengan pencarian Anda.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Highlight Metric Row */}
                  <div className="grid grid-cols-2 gap-4 bg-red-50/30 border border-red-100/50 p-4 rounded-2xl">
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Total Tiket Close</span>
                      <span className="text-3xl font-black text-red-600 font-mono">{selectedTech.ticketsResolved}</span>
                      <span className="text-xs text-red-700/80 block mt-0.5 font-medium">Bulan {activeMonth}</span>
                    </div>
                    <div className="border-l border-red-100/60 pl-4 flex flex-col justify-center">
                      <div className="flex items-center space-x-1 text-slate-500 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Rating: <strong>{selectedTech.rating} / 5.0</strong></span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 text-xs font-semibold mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Status: <strong className="text-green-700">{selectedTech.status}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Title */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">Distribusi Detail Tiket Terbuka & Selesai</h4>
                    <p className="text-xs text-slate-500">Breakdown jumlah pekerjaan terselesaikan berdasarkan tipe pelaporan gangguan lapangan.</p>
                  </div>

                  {/* Detail Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Benjar', value: selectedTech.benjar, bg: 'bg-indigo-50/50', text: 'text-indigo-700', border: 'border-indigo-100/40', icon: Layers },
                      { label: 'Lain-Lain', value: selectedTech.lainLain, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200/40', icon: Activity },
                      { label: 'Tiket Manual', value: selectedTech.tiketManual, bg: 'bg-pink-50/50', text: 'text-pink-700', border: 'border-pink-100/40', icon: FileText },
                      { label: 'Tiket Reguler/SQM', value: selectedTech.tiketReguler, bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-100/40', icon: CheckCircle },
                      { label: 'Underspec', value: selectedTech.underspec, bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-100/40', icon: AlertCircle },
                      { label: 'Replacement ONT', value: selectedTech.replacementOnt, bg: 'bg-cyan-50/50', text: 'text-cyan-700', border: 'border-cyan-100/40', icon: Cpu },
                      { label: 'Gamas ODP', value: selectedTech.gamasOdp, bg: 'bg-red-50/50', text: 'text-red-700', border: 'border-red-100/40', icon: Radio },
                      { label: 'Gamas Feeder', value: selectedTech.gamasFeeder, bg: 'bg-orange-50/50', text: 'text-orange-700', border: 'border-orange-100/40', icon: Wrench },
                      { label: 'Gamas Distribusi', value: selectedTech.gamasDistribusi, bg: 'bg-sky-50/50', text: 'text-sky-700', border: 'border-sky-100/40', icon: Activity },
                    ].map((item, idx) => {
                      const val = item.value ?? 0;
                      const percent = selectedTech.ticketsResolved > 0 
                        ? ((val / selectedTech.ticketsResolved) * 100).toFixed(0) 
                        : '0';

                      return (
                        <div 
                          key={idx} 
                          className={`p-3.5 rounded-2xl border ${item.border} ${item.bg} flex flex-col justify-between space-y-2`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`p-1 bg-white rounded-lg shadow-2xs ${item.text}`}>
                              <item.icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 font-mono">{percent}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block truncate" title={item.label}>
                              {item.label}
                            </span>
                            <span className="text-lg font-black text-slate-900 font-mono leading-none">
                              {val}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedTech(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Tutup Detail
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
        dashboardContext="Technician Performance & Productivity Dashboard"
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
