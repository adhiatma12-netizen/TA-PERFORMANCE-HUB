import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  Search, 
  Compass, 
  Maximize2, 
  Eye, 
  ExternalLink, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Navigation,
  Layers,
  Map,
  Activity,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { ProvisioningRow } from '../data/provisioningStats';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AIEvaluationButton } from './AIEvaluationModal';

// Clean and parse multi-dot and malformed coordinates for East Java region (e.g., -76.355.936 -> -7.6355936, 1.113.293.307 -> 111.3293307)
export function parseCoordinate(val: string | undefined | null, type: 'lat' | 'lng'): number | null {
  if (!val) return null;
  const clean = String(val).trim();
  if (
    clean === '#N/A' || 
    clean === '' || 
    clean.toLowerCase() === 'undefined' || 
    clean.toLowerCase() === 'null' ||
    clean === '-'
  ) {
    return null;
  }
  
  // Extract all digits and determine negative state
  const isNegative = clean.startsWith('-');
  const digits = clean.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 3) return null;
  
  if (type === 'lat') {
    // For latitude in East Java, it should start with 6, 7, 8, or 9
    const firstDigit = digits[0];
    if (firstDigit !== '6' && firstDigit !== '7' && firstDigit !== '8' && firstDigit !== '9') {
      return null;
    }
    const reconstructed = `-${firstDigit}.${digits.substring(1)}`;
    const parsed = parseFloat(reconstructed);
    return isNaN(parsed) ? null : parsed;
  } else {
    // For longitude in East Java, it should start with 110, 111, 112, 113, 114, 115
    if (!digits.startsWith('11') && !digits.startsWith('109') && !digits.startsWith('116')) {
      // Allow fallback if it doesn't match standard prefix but is close
    }
    // Most longitudes are 11x.xxxx
    let firstThree = digits.substring(0, 3);
    // If it is 11xxxx, first three is 11x. Otherwise if it is e.g. 109xxx, first three is 109.
    const reconstructed = `${firstThree}.${digits.substring(3)}`;
    const parsed = parseFloat(reconstructed);
    return isNaN(parsed) ? null : parsed;
  }
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface InteractiveCoordinatesMapProps {
  allData: ProvisioningRow[];
  initialYear?: number;
  initialSA?: string;
  initialSegment?: string;
  // Optional legacy props for compatibility
  globalYear?: number;
  setGlobalYear?: (yr: number) => void;
  globalSA?: string;
  setGlobalSA?: (sa: string) => void;
  globalSegment?: string;
  filterOptions?: {
    years: number[];
    sas: string[];
  };
  onOpenAiEvaluation?: (
    tableName: string,
    summaryMetrics: Record<string, any>,
    sampleRows: any[],
    filterContext?: Record<string, any>,
    promptNote?: string
  ) => void;
}

interface MapOrder {
  raw: ProvisioningRow;
  lat: number;
  lng: number;
  x: number; // calculated percentage x (0-100)
  y: number; // calculated percentage y (0-100)
}

export default function InteractiveCoordinatesMap({ 
  allData, 
  initialYear,
  initialSA,
  initialSegment,
  globalYear, 
  globalSA, 
  globalSegment,
  filterOptions,
  onOpenAiEvaluation
}: InteractiveCoordinatesMapProps) {
  const [mapSearch, setMapSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MapOrder | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<'coord' | 'scOrder' | null>(null);
  
  // Independent Local Map Filters - completely isolated from other sub-pages/tabs
  const [mapYear, setMapYear] = useState<number>(() => initialYear || globalYear || 2026);
  const [mapSA, setMapSA] = useState<string>(() => initialSA || globalSA || 'All');
  const [mapSegment, setMapSegment] = useState<string>(() => initialSegment || globalSegment || 'All');
  const [mapStatus, setMapStatus] = useState<string>('COMPWORK');
  const [mapBulan, setMapBulan] = useState<string>('All');

  // Map theme state
  const [mapTheme, setMapTheme] = useState<'street' | 'satellite'>('street');
  
  // Leaflet refs
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const trunkLinksLayerRef = useRef<L.LayerGroup | null>(null);
  const citiesLayerRef = useRef<L.LayerGroup | null>(null);

  // Available Years for independent map filter
  const availableYears = useMemo(() => {
    if (filterOptions?.years && filterOptions.years.length > 0) {
      return filterOptions.years;
    }
    const yrSet = new Set<number>();
    allData.forEach(r => { if (r.tahun) yrSet.add(r.tahun); });
    const yrs = Array.from(yrSet).sort((a, b) => b - a);
    return yrs.length > 0 ? yrs : [2026, 2025];
  }, [filterOptions?.years, allData]);

  // Available Service Areas (SAs) for independent map filter
  const availableSAs = useMemo(() => {
    if (filterOptions?.sas && filterOptions.sas.length > 0) {
      return filterOptions.sas;
    }
    const saSet = new Set<string>();
    allData.forEach(r => { if (r.sa) saSet.add(r.sa); });
    const sas = Array.from(saSet).sort();
    return ['All', ...sas];
  }, [filterOptions?.sas, allData]);

  // Available Segments for independent map filter
  const availableSegments = useMemo(() => {
    const defaultOrder = ['Indihome', 'Indibizz', 'PDA', 'MO', 'Lain-lain'];
    const segSet = new Set<string>();
    allData.forEach((r) => {
      if (r.segment) segSet.add(r.segment);
    });
    const segList = Array.from(segSet).sort((a, b) => {
      const idxA = defaultOrder.indexOf(a);
      const idxB = defaultOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return ['All', ...(segList.length > 0 ? segList : defaultOrder)];
  }, [allData]);

  // Calculate matching period total orders with local independent filters
  const totalPeriodOrders = useMemo(() => {
    return allData.filter(row => {
      const matchYear = row.tahun === mapYear;
      const matchSA = mapSA === 'All' || row.sa === mapSA;
      const matchSegment = mapSegment === 'All' || row.segment === mapSegment;
      return matchYear && matchSA && matchSegment;
    }).length;
  }, [allData, mapYear, mapSA, mapSegment]);

  // 1. Process and extract valid coordinates from the active selections
  const mapOrders = useMemo(() => {
    const validPoints: { raw: ProvisioningRow; lat: number; lng: number }[] = [];
    
    allData.forEach(order => {
      // Apply independent local filters
      const matchYear = order.tahun === mapYear;
      const matchSA = mapSA === 'All' || order.sa === mapSA;
      const matchSegment = mapSegment === 'All' || order.segment === mapSegment;
      const matchBulan = mapBulan === 'All' || order.bulan === Number(mapBulan);
      const isAllStatus = mapStatus.toUpperCase() === 'ALL';
      const matchStatus = isAllStatus || order.status.toUpperCase() === mapStatus.toUpperCase();

      if (!matchYear || !matchSA || !matchSegment || !matchBulan || !matchStatus) return;
      
      const lat = parseCoordinate(order.latitude, 'lat');
      const lng = parseCoordinate(order.longitude, 'lng');
      
      if (lat !== null && lng !== null && lat !== 0 && lng !== 0) {
        // Simple sanity boundary check for East Java region bounds (clamping outliers)
        if (lat < -10 || lat > -5 || lng < 109 || lng > 115) {
          // Keep it but maybe don't use extreme outliers for coordinate mapping
        }
        validPoints.push({ raw: order, lat, lng });
      }
    });

    if (validPoints.length === 0) return [];

    // Calculate bounding box dynamically
    const lats = validPoints.map(p => p.lat);
    const lngs = validPoints.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const rangeLat = maxLat - minLat || 0.05;
    const rangeLng = maxLng - minLng || 0.05;

    // Add 10% padding so dots do not hug the borders of the visual box
    const padLat = rangeLat * 0.1;
    const padLng = rangeLng * 0.1;

    const finalMinLat = minLat - padLat;
    const finalMaxLat = maxLat + padLat;
    const finalMinLng = minLng - padLng;
    const finalMaxLng = maxLng + padLng;

    const finalRangeLat = finalMaxLat - finalMinLat;
    const finalRangeLng = finalMaxLng - finalMinLng;

    // Convert coordinates to screen percentages
    return validPoints.map(p => {
      const x = ((p.lng - finalMinLng) / finalRangeLng) * 100;
      const y = ((finalMaxLat - p.lat) / finalRangeLat) * 100;
      return {
        ...p,
        x,
        y
      };
    });
  }, [allData, mapYear, mapSA, mapSegment, mapStatus, mapBulan]);

  // 2. Filter map orders based on the map specific search input
  const filteredMapOrders = useMemo(() => {
    if (!mapSearch.trim()) return mapOrders;
    const query = mapSearch.toLowerCase();
    return mapOrders.filter(item => 
      item.raw.scOrder.toLowerCase().includes(query) ||
      (item.raw.orderId && item.raw.orderId.toLowerCase().includes(query)) ||
      (item.raw.customerName && item.raw.customerName.toLowerCase().includes(query)) ||
      item.raw.sektor.toLowerCase().includes(query) ||
      item.raw.sto.toLowerCase().includes(query) ||
      (item.raw.packageName && item.raw.packageName.toLowerCase().includes(query))
    );
  }, [mapOrders, mapSearch]);

  // 3. Highlight orders found in search
  const highlightSet = useMemo(() => {
    if (!mapSearch.trim()) return new Set<string>();
    return new Set(filteredMapOrders.map(o => o.raw.scOrder));
  }, [filteredMapOrders, mapSearch]);

  // 4. Centroid calculations
  const centroid = useMemo(() => {
    if (mapOrders.length === 0) return { lat: 0, lng: 0 };
    const sum = mapOrders.reduce((acc, curr) => ({ lat: acc.lat + curr.lat, lng: acc.lng + curr.lng }), { lat: 0, lng: 0 });
    return {
      lat: sum.lat / mapOrders.length,
      lng: sum.lng / mapOrders.length
    };
  }, [mapOrders]);

  // 5. Status breakdown counts for active plotted points
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mapOrders.forEach(item => {
      const st = (item.raw.status || 'OTHER').toUpperCase();
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [mapOrders]);

  // 6. Period-wide coordinate status counts (for quick filter badges and visibility)
  const periodCoordinateStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { COMPWORK: 0, CANCLWORK: 0, WORKFAIL: 0, ALL: 0 };
    allData.forEach(order => {
      const matchYear = order.tahun === mapYear;
      const matchSA = mapSA === 'All' || order.sa === mapSA;
      const matchSegment = mapSegment === 'All' || order.segment === mapSegment;
      const matchBulan = mapBulan === 'All' || order.bulan === Number(mapBulan);
      if (!matchYear || !matchSA || !matchSegment || !matchBulan) return;

      const lat = parseCoordinate(order.latitude, 'lat');
      const lng = parseCoordinate(order.longitude, 'lng');
      if (lat !== null && lng !== null && lat !== 0 && lng !== 0) {
        counts.ALL = (counts.ALL || 0) + 1;
        const st = (order.status || 'OTHER').toUpperCase();
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return counts;
  }, [allData, mapYear, mapSA, mapSegment, mapBulan]);

  // Handle Copy event
  const copyToClipboard = (text: string, type: 'coord' | 'scOrder') => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setCopiedType(type);
    setTimeout(() => {
      setIsCopied(false);
      setCopiedType(null);
    }, 2000);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetMap = () => {
    setSelectedOrder(null);
    if (mapInstanceRef.current && mapOrders.length > 0) {
      const bounds = L.latLngBounds(mapOrders.map(item => [item.lat, item.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // If mapSearch triggers a match, center on the first matching record
  const handleFocusOnOrder = (item: MapOrder) => {
    setSelectedOrder(item);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([item.lat, item.lng], 15, { animate: true });
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapDivRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map centered on East Java
      mapInstanceRef.current = L.map(mapDivRef.current, {
        center: [-7.6, 112.5],
        zoom: 8.5,
        zoomControl: false, // We use our custom overlays
        attributionControl: true
      });
    }

    const map = mapInstanceRef.current;

    // Clean up existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Determine Tiles
    const tileUrl = mapTheme === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileAttribution = mapTheme === 'satellite'
      ? '&copy; Esri &mdash; Satellite Imagery'
      : '&copy; OpenStreetMap contributors';

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 18,
    }).addTo(map);

    // Initial resize trigger to prevent display glitches
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      // Map instance is preserved, cleaned up on final unmount
    };
  }, [mapTheme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Draw Layers (Markers, Trunk Links, Cities)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. Clean up old layers
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }
    if (trunkLinksLayerRef.current) {
      map.removeLayer(trunkLinksLayerRef.current);
    }
    if (citiesLayerRef.current) {
      map.removeLayer(citiesLayerRef.current);
    }

    // B. Draw Trunk Links
    const trunkGroup = L.layerGroup();
    const trunkLinks = [
      [
        { lat: -7.63, lng: 111.52 }, // Madiun
        { lat: -7.60, lng: 111.90 }, // Nganjuk
        { lat: -7.55, lng: 112.23 }, // Jombang
        { lat: -7.47, lng: 112.43 }, // Mojokerto
        { lat: -7.25, lng: 112.75 }  // Surabaya
      ],
      [
        { lat: -7.63, lng: 111.52 }, // Madiun
        { lat: -7.87, lng: 111.46 }, // Ponorogo
        { lat: -8.22, lng: 111.09 }  // Pacitan
      ],
      [
        { lat: -7.63, lng: 111.52 }, // Madiun
        { lat: -7.65, lng: 111.35 }  // Magetan
      ],
      [
        { lat: -7.40, lng: 111.44 }, // Ngawi
        { lat: -7.15, lng: 111.88 }, // Bojonegoro
        { lat: -6.89, lng: 112.01 }, // Tuban
        { lat: -6.90, lng: 112.20 }, // Lamongan
        { lat: -7.25, lng: 112.75 }  // Surabaya
      ],
      [
        { lat: -7.25, lng: 112.75 }, // Surabaya
        { lat: -7.45, lng: 112.71 }, // Sidoarjo
        { lat: -7.64, lng: 112.91 }, // Pasuruan
        { lat: -7.75, lng: 113.22 }, // Probolinggo
        { lat: -8.17, lng: 113.70 }, // Jember
        { lat: -8.12, lng: 114.43 }  // Banyuwangi
      ]
    ];

    trunkLinks.forEach((link) => {
      const latlngs = link.map(p => [p.lat, p.lng] as [number, number]);
      L.polyline(latlngs, {
        color: mapTheme === 'satellite' ? '#06b6d4' : '#ea580c',
        weight: 1.5,
        dashArray: '4, 6',
        opacity: mapTheme === 'satellite' ? 0.6 : 0.4
      }).addTo(trunkGroup);
    });
    trunkGroup.addTo(map);
    trunkLinksLayerRef.current = trunkGroup;

    // C. Draw Background Cities
    const citiesGroup = L.layerGroup();
    const backgroundCities = [
      { name: 'MADIUN', lat: -7.63, lng: 111.52 },
      { name: 'NGAWI', lat: -7.40, lng: 111.44 },
      { name: 'MAGETAN', lat: -7.65, lng: 111.35 },
      { name: 'PONOROGO', lat: -7.87, lng: 111.46 },
      { name: 'PACITAN', lat: -8.22, lng: 111.09 },
      { name: 'BOJONEGORO', lat: -7.15, lng: 111.88 },
      { name: 'TUBAN', lat: -6.89, lng: 112.01 },
      { name: 'LAMONGAN', lat: -6.90, lng: 112.20 },
      { name: 'SURABAYA', lat: -7.25, lng: 112.75 },
    ];

    backgroundCities.forEach((city) => {
      const cityMarker = L.circleMarker([city.lat, city.lng], {
        radius: 3.5,
        fillColor: mapTheme === 'satellite' ? '#06b6d4' : '#ea580c',
        color: '#ffffff',
        weight: 1,
        fillOpacity: 0.8
      });
      cityMarker.bindTooltip(city.name, {
        permanent: true,
        direction: 'top',
        className: 'bg-transparent text-[8px] font-mono font-bold border-none shadow-none text-slate-400 p-0'
      });
      cityMarker.addTo(citiesGroup);
    });
    citiesGroup.addTo(map);
    citiesLayerRef.current = citiesGroup;

    // D. Draw Active Coordinates Markers
    const markersGroup = L.layerGroup();
    filteredMapOrders.forEach((item) => {
      const isSelected = selectedOrder?.raw.scOrder === item.raw.scOrder;
      const isSearchMatched = highlightSet.has(item.raw.scOrder);
      const itemStatus = (item.raw.status || '').toUpperCase();
      
      let pointColor = '#10b981'; // emerald for COMPWORK
      if (itemStatus === 'CANCLWORK') {
        pointColor = '#ef4444'; // red for CANCLWORK
      } else if (itemStatus === 'WORKFAIL') {
        pointColor = '#f97316'; // orange for WORKFAIL
      } else if (itemStatus !== 'COMPWORK') {
        pointColor = '#8b5cf6'; // violet for others
      }

      if (isSelected) pointColor = '#3b82f6'; // blue for selected
      else if (isSearchMatched) pointColor = '#f59e0b'; // amber for search match

      const marker = L.circleMarker([item.lat, item.lng], {
        radius: isSelected ? 10 : isSearchMatched ? 8 : 5.5,
        fillColor: pointColor,
        color: '#ffffff',
        weight: isSelected ? 2.5 : 1.2,
        opacity: 1,
        fillOpacity: 0.85
      });

      const statusBadgeColor = itemStatus === 'COMPWORK' ? '#059669' : itemStatus === 'CANCLWORK' ? '#dc2626' : itemStatus === 'WORKFAIL' ? '#ea580c' : '#7c3aed';

      const displayOrderId = item.raw.orderId || item.raw.scOrder;
      const displayCustomer = item.raw.customerName ? item.raw.customerName : '';

      marker.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 4px; line-height: 1.45; min-width: 170px;">
          <div style="font-weight: 800; color: #1e40af; font-family: monospace; font-size: 11.5px; margin-bottom: 2px;">
            ORDER_ID: ${displayOrderId}
          </div>
          ${displayCustomer ? `<div style="font-weight: 700; color: #0f172a; margin-bottom: 3px; font-size: 11px;">👤 ${displayCustomer}</div>` : ''}
          <div style="color: #64748b;"><span style="font-weight: bold;">Status:</span> <span style="font-weight: 800; color: ${statusBadgeColor};">${item.raw.status || '-'}</span></div>
          <div style="color: #64748b;"><span style="font-weight: bold;">STO:</span> ${item.raw.sto} | <span style="font-weight: bold;">Sektor:</span> ${item.raw.sektor}</div>
          <div style="color: #64748b;"><span style="font-weight: bold;">Segmen:</span> ${item.raw.segment}</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -5]
      });

      marker.on('click', () => {
        setSelectedOrder(item);
      });

      marker.addTo(markersGroup);
    });

    markersGroup.addTo(map);
    markersLayerRef.current = markersGroup;

  }, [filteredMapOrders, selectedOrder, highlightSet, mapStatus, mapTheme]);

  // 3. Fit bounds when filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapOrders.length === 0) return;

    const bounds = L.latLngBounds(mapOrders.map(item => [item.lat, item.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [mapOrders]);

  // Determine bounds from mapOrders if any, otherwise default
  const bounds = useMemo(() => {
    if (mapOrders.length === 0) return null;
    const lats = mapOrders.map(o => o.lat);
    const lngs = mapOrders.map(o => o.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const rangeLat = maxLat - minLat || 0.05;
    const rangeLng = maxLng - minLng || 0.05;
    const padLat = rangeLat * 0.15;
    const padLng = rangeLng * 0.15;
    const finalMinLat = minLat - padLat;
    const finalMaxLat = maxLat + padLat;
    const finalMinLng = minLng - padLng;
    const finalMaxLng = maxLng + padLng;
    const finalRangeLat = finalMaxLat - finalMinLat;
    const finalRangeLng = finalMaxLng - finalMinLng;
    return { finalMinLat, finalMaxLat, finalMinLng, finalMaxLng, finalRangeLat, finalRangeLng };
  }, [mapOrders]);

  const baseMapElements = useMemo(() => {
    if (!bounds) return { eastJavaPoints: '', maduraPoints: '', trunkLinksPoints: [], citiesPoints: [] };
    const { finalMinLat, finalMaxLat, finalMinLng, finalMaxLng, finalRangeLat, finalRangeLng } = bounds;

    const toPct = (lat: number, lng: number) => {
      const x = ((lng - finalMinLng) / finalRangeLng) * 100;
      const y = ((finalMaxLat - lat) / finalRangeLat) * 100;
      return { x, y };
    };

    const eastJavaCoast = [
      { lat: -8.22, lng: 111.09 }, // Pacitan
      { lat: -8.10, lng: 111.30 },
      { lat: -8.16, lng: 111.71 }, // Trenggalek
      { lat: -8.07, lng: 111.90 }, // Tulungagung
      { lat: -8.10, lng: 112.16 }, // Blitar
      { lat: -8.26, lng: 112.63 }, // Malang South
      { lat: -8.13, lng: 113.22 }, // Lumajang
      { lat: -8.17, lng: 113.70 }, // Jember
      { lat: -8.50, lng: 114.38 }, // Banyuwangi South
      { lat: -8.12, lng: 114.43 }, // Banyuwangi East
      { lat: -7.70, lng: 114.00 }, // Situbondo
      { lat: -7.75, lng: 113.22 }, // Probolinggo
      { lat: -7.64, lng: 112.91 }, // Pasuruan
      { lat: -7.25, lng: 112.75 }, // Surabaya
      { lat: -7.15, lng: 112.65 }, // Gresik
      { lat: -6.90, lng: 112.20 }, // Lamongan
      { lat: -6.89, lng: 112.01 }, // Tuban
      { lat: -7.15, lng: 111.88 }, // Bojonegoro
      { lat: -7.40, lng: 111.44 }, // Ngawi
      { lat: -7.65, lng: 111.35 }, // Magetan
      { lat: -7.87, lng: 111.46 }, // Ponorogo
    ];

    const maduraCoast = [
      { lat: -7.02, lng: 112.75 }, // Bangkalan
      { lat: -6.98, lng: 113.20 }, // Sampang
      { lat: -7.01, lng: 114.00 }, // Pamekasan
      { lat: -7.01, lng: 114.26 }, // Sumenep
      { lat: -7.15, lng: 114.33 },
      { lat: -7.20, lng: 113.50 },
      { lat: -7.20, lng: 112.78 },
    ];

    const trunkLinks = [
      [
        { lat: -7.63, lng: 111.52 }, // Madiun
        { lat: -7.60, lng: 111.90 }, // Nganjuk
        { lat: -7.55, lng: 112.23 }, // Jombang
        { lat: -7.47, lng: 112.43 }, // Mojokerto
        { lat: -7.25, lng: 112.75 }  // Surabaya
      ],
      [
        { lat: -7.63, lng: 111.52 }, // Madiun
        { lat: -7.87, lng: 111.46 }, // Ponorogo
        { lat: -8.22, lng: 111.09 }  // Pacitan
      ],
      [
        { lat: -7.63, lng: 111.52 }, // Madiun
        { lat: -7.65, lng: 111.35 }  // Magetan
      ],
      [
        { lat: -7.40, lng: 111.44 }, // Ngawi
        { lat: -7.15, lng: 111.88 }, // Bojonegoro
        { lat: -6.89, lng: 112.01 }, // Tuban
        { lat: -6.90, lng: 112.20 }, // Lamongan
        { lat: -7.25, lng: 112.75 }  // Surabaya
      ],
      [
        { lat: -7.25, lng: 112.75 }, // Surabaya
        { lat: -7.45, lng: 112.71 }, // Sidoarjo
        { lat: -7.64, lng: 112.91 }, // Pasuruan
        { lat: -7.75, lng: 113.22 }, // Probolinggo
        { lat: -8.17, lng: 113.70 }, // Jember
        { lat: -8.12, lng: 114.43 }  // Banyuwangi
      ]
    ];

    const backgroundCities = [
      { name: 'MADIUN', lat: -7.63, lng: 111.52 },
      { name: 'NGAWI', lat: -7.40, lng: 111.44 },
      { name: 'MAGETAN', lat: -7.65, lng: 111.35 },
      { name: 'PONOROGO', lat: -7.87, lng: 111.46 },
      { name: 'PACITAN', lat: -8.22, lng: 111.09 },
      { name: 'BOJONEGORO', lat: -7.15, lng: 111.88 },
      { name: 'TUBAN', lat: -6.89, lng: 112.01 },
      { name: 'LAMONGAN', lat: -6.90, lng: 112.20 },
      { name: 'SURABAYA', lat: -7.25, lng: 112.75 },
    ];

    const eastJavaPoints = eastJavaCoast.map(c => {
      const p = toPct(c.lat, c.lng);
      return `${p.x}%,${p.y}%`;
    }).join(' ');

    const maduraPoints = maduraCoast.map(c => {
      const p = toPct(c.lat, c.lng);
      return `${p.x}%,${p.y}%`;
    }).join(' ');

    const trunkLinksPoints = trunkLinks.map(link => 
      link.map(c => toPct(c.lat, c.lng))
    );

    const citiesPoints = backgroundCities.map(c => {
      const p = toPct(c.lat, c.lng);
      return { name: c.name, ...p };
    });

    return { eastJavaPoints, maduraPoints, trunkLinksPoints, citiesPoints };
  }, [bounds]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" id="realisasi-coordinates-map-panel">
      {/* SECTION PANEL HEADER */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Globe className="w-4 h-4" />
            </span>
            <h4 className="text-base font-extrabold text-slate-900">
              Peta Sebaran Koordinat Realisasi
            </h4>
          </div>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
            <span>
              Plotting order {mapStatus.toUpperCase() === 'ALL' ? 'Semua Status (COMPWORK, CANCLWORK, WORKFAIL)' : mapStatus === 'COMPWORK' ? 'sukses (COMPWORK)' : mapStatus === 'CANCLWORK' ? 'kendala/batal (CANCLWORK)' : 'gagal (WORKFAIL)'} ({mapBulan === 'All' ? 'Semua Bulan' : INDONESIAN_MONTHS[Number(mapBulan) - 1]}) • SA: {mapSA} • Segmen: {mapSegment} • Tahun: {mapYear}. Total {mapOrders.length} titik aktif.
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
              ⚡ Default COMPWORK dimuat di awal agar ringan
            </span>
          </p>
        </div>

        {/* TOP MINI SUMMARY */}
        <div className="flex flex-wrap items-center gap-3">
          {onOpenAiEvaluation && (
            <AIEvaluationButton
              size="sm"
              onClick={() => {
                const stoCounts: Record<string, number> = {};
                const sektorCounts: Record<string, number> = {};
                mapOrders.forEach((o) => {
                  const s = o.raw.sto || 'Unknown';
                  const sk = o.raw.sektor || 'Unknown';
                  stoCounts[s] = (stoCounts[s] || 0) + 1;
                  sektorCounts[sk] = (sektorCounts[sk] || 0) + 1;
                });
                const topStos = Object.entries(stoCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, count]) => `${name} (${count})`)
                  .join(', ');
                const topSektors = Object.entries(sektorCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => `${name} (${count})`)
                  .join(', ');

                onOpenAiEvaluation(
                  'Peta Sebaran Koordinat Realisasi PSB Provisioning',
                  {
                    Tahun: mapYear,
                    Bulan: mapBulan === 'All' ? 'Semua Bulan' : INDONESIAN_MONTHS[Number(mapBulan) - 1],
                    Status: mapStatus.toUpperCase() === 'ALL' ? 'Semua Status' : mapStatus,
                    'Service Area (SA)': mapSA === 'All' ? 'Semua SA' : mapSA,
                    Segment: mapSegment === 'All' ? 'Semua Segment' : mapSegment,
                    'Total Titik Valid': mapOrders.length,
                    'Total Order Periode': totalPeriodOrders,
                    'Tingkat Kepadatan': `${formatPercent((mapOrders.length / (totalPeriodOrders || 1)) * 100)}%`,
                    'Titik Pusat Geografis': centroid.lat !== 0 ? `${centroid.lat.toFixed(4)}, ${centroid.lng.toFixed(4)}` : '-',
                    'Top STO Terkonsentrasi': topStos || '-',
                    'Sebaran Sektor': topSektors || '-',
                  },
                  filteredMapOrders.slice(0, 25).map((o) => ({
                    'SC Order': o.raw.scOrder,
                    Sektor: o.raw.sektor,
                    STO: o.raw.sto,
                    Status: o.raw.status,
                    Latitude: o.lat.toFixed(6),
                    Longitude: o.lng.toFixed(6),
                    Paket: o.raw.packageName || '-',
                    'Homepass / Info': o.raw.homepassId || o.raw.errorCode || '-',
                  })),
                  { Status: mapStatus, Bulan: mapBulan, SA: mapSA, Tahun: mapYear, Segment: mapSegment },
                  'Evaluasi sebaran spasial dan geografis titik realisasi dan kendala PSB Provisioning. Analisis klaster kepadatan order antar STO/Sektor, potensi kesenjangan jangkauan ODP/jaringan, serta rekomendasi penataan rute dan penyebaran teknisi lapangan.'
                );
              }}
            />
          )}
          <div className="bg-slate-100/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Kepadatan: {formatPercent((mapOrders.length / (totalPeriodOrders || 1)) * 100)}%</span>
          </div>
          {centroid.lat !== 0 && (
            <div className="bg-slate-100/80 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-600">
              Pusat: {centroid.lat.toFixed(4)}, {centroid.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center gap-3">
        {/* Local Status Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Status:</span>
          <div className="relative flex items-center">
            <select
              value={mapStatus}
              onChange={(e) => {
                setMapStatus(e.target.value);
                setSelectedOrder(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 pr-4 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="COMPWORK">COMPWORK (Realisasi - Cepat)</option>
              <option value="ALL">ALL (Semua Status)</option>
              <option value="CANCLWORK">CANCLWORK (Kendala/Batal)</option>
              <option value="WORKFAIL">WORKFAIL (Gagal)</option>
            </select>
            <div className="pointer-events-none text-slate-400 text-[8px] absolute right-0">
              ▼
            </div>
          </div>
        </div>

        {/* Local Month Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Bulan:</span>
          <div className="relative flex items-center">
            <select
              value={mapBulan}
              onChange={(e) => {
                setMapBulan(e.target.value);
                setSelectedOrder(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 pr-4 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="All">All (Semua Bulan)</option>
              {INDONESIAN_MONTHS.map((mName, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {idx + 1} - {mName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none text-slate-400 text-[8px] absolute right-0">
              ▼
            </div>
          </div>
        </div>

        {/* Independent Tahun Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Tahun:</span>
          <div className="relative flex items-center">
            <select
              value={mapYear}
              onChange={(e) => {
                setMapYear(Number(e.target.value));
                setSelectedOrder(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 pr-4 focus:outline-none cursor-pointer appearance-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
            <div className="pointer-events-none text-slate-400 text-[8px] absolute right-0">
              ▼
            </div>
          </div>
        </div>

        {/* Independent Service Area Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Service Area (SA):</span>
          <div className="relative flex items-center">
            <select
              value={mapSA}
              onChange={(e) => {
                setMapSA(e.target.value);
                setSelectedOrder(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 pr-4 focus:outline-none cursor-pointer appearance-none max-w-[150px]"
            >
              {availableSAs.map((sa) => (
                <option key={sa} value={sa}>
                  {sa === 'All' ? 'All (Semua SA)' : sa}
                </option>
              ))}
            </select>
            <div className="pointer-events-none text-slate-400 text-[8px] absolute right-0">
              ▼
            </div>
          </div>
        </div>

        {/* Independent Segment / Layanan Filter (Right Beside Service Area Filter) */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Segment:</span>
          <div className="relative flex items-center">
            <select
              value={mapSegment}
              onChange={(e) => {
                setMapSegment(e.target.value);
                setSelectedOrder(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-800 pr-4 focus:outline-none cursor-pointer appearance-none max-w-[150px]"
            >
              {availableSegments.map((seg) => (
                <option key={seg} value={seg}>
                  {seg === 'All' ? 'All (Semua Segment)' : seg}
                </option>
              ))}
            </select>
            <div className="pointer-events-none text-slate-400 text-[8px] absolute right-0">
              ▼
            </div>
          </div>
        </div>

        {/* Status Breakdown / Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto text-[11px]">
          <button
            type="button"
            onClick={() => {
              setMapStatus('COMPWORK');
              setSelectedOrder(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              mapStatus === 'COMPWORK'
                ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs ring-1 ring-emerald-500'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 font-semibold'
            }`}
            title="Tampilkan titik status COMPWORK (Realisasi Sukses)"
          >
            <span className={`w-2 h-2 rounded-full ${mapStatus === 'COMPWORK' ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>COMPWORK:</span>
            <span className="font-mono font-extrabold">{periodCoordinateStatusCounts['COMPWORK'] || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMapStatus('CANCLWORK');
              setSelectedOrder(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              mapStatus === 'CANCLWORK'
                ? 'bg-rose-600 text-white border-rose-700 font-black shadow-xs ring-1 ring-rose-500'
                : 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100 font-semibold'
            }`}
            title="Tampilkan titik status CANCLWORK (Kendala/Batal)"
          >
            <span className={`w-2 h-2 rounded-full ${mapStatus === 'CANCLWORK' ? 'bg-white' : 'bg-rose-500'}`} />
            <span>CANCLWORK:</span>
            <span className="font-mono font-extrabold">{periodCoordinateStatusCounts['CANCLWORK'] || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMapStatus('WORKFAIL');
              setSelectedOrder(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              mapStatus === 'WORKFAIL'
                ? 'bg-amber-600 text-white border-amber-700 font-black shadow-xs ring-1 ring-amber-500'
                : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100 font-semibold'
            }`}
            title="Tampilkan titik status WORKFAIL (Gagal)"
          >
            <span className={`w-2 h-2 rounded-full ${mapStatus === 'WORKFAIL' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>WORKFAIL:</span>
            <span className="font-mono font-extrabold">{periodCoordinateStatusCounts['WORKFAIL'] || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMapStatus('ALL');
              setSelectedOrder(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              mapStatus.toUpperCase() === 'ALL'
                ? 'bg-slate-800 text-white border-slate-900 font-black shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-semibold'
            }`}
            title="Tampilkan SEMUA status koordinat"
          >
            <span>ALL:</span>
            <span className="font-mono font-extrabold">{periodCoordinateStatusCounts['ALL'] || 0}</span>
          </button>
        </div>
      </div>

      {/* STUNNING FULL WIDTH IMMERSIVE MAP CANVAS */}
      <div className="relative w-full overflow-hidden flex flex-col bg-slate-100" style={{ height: '580px' }}>
        
        {/* LEAFLET MAP ELEMENT CONTAINER */}
        <div ref={mapDivRef} className="w-full h-full z-0" />

        {/* MAP TOOLS BAR */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-2">
          {/* Zoom Controls */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-1 flex flex-col space-y-1 shadow-lg">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetMap}
              title="Reset View"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-1 flex flex-col space-y-1 shadow-lg">
            <button
              onClick={() => setMapTheme('satellite')}
              title="Satellite Style (Real Satellite)"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${mapTheme === 'satellite' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMapTheme('street')}
              title="Street Style (Light OpenStreetMap)"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${mapTheme === 'street' ? 'text-emerald-500 bg-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COMPASS ROSE & SCALE ACCENTS */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col items-start space-y-1 bg-slate-950/70 backdrop-blur-sm p-2.5 rounded-lg border border-slate-800/40 text-[9px] text-slate-400 font-mono font-bold">
          <div className="flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span>NOC GIS NAVIGATOR</span>
          </div>
          <div className="flex items-center space-x-1.5 mt-1 pt-1 border-t border-slate-800/60">
            <div className="w-8 h-1 border-b border-l border-r border-slate-400"></div>
            <span>Auto-Scaling GIS Grid</span>
          </div>
        </div>

        {/* INNER SEARCH & PIN FOCUS */}
        <div className="absolute top-4 right-4 z-[1000] w-64 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 shadow-xl flex items-center space-x-2">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari Order / Sektor di Peta..."
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500 font-bold"
          />
          {mapSearch && (
            <button
              onClick={() => setMapSearch('')}
              className="text-[10px] text-slate-400 hover:text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded"
            >
              Batal
            </button>
          )}
        </div>

        {/* NO COORDINATES WARNING OVERLAY */}
        {mapOrders.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-slate-950/40 backdrop-blur-sm">
            <div className="text-center space-y-2 p-6 bg-slate-900/90 border border-slate-800/60 rounded-3xl max-w-sm shadow-2xl">
              <MapPin className="w-10 h-10 text-slate-500 mx-auto animate-bounce" />
              <h5 className="text-xs font-black text-slate-300">Tidak ada Koordinat Ditemukan</h5>
              <p className="text-[11px] text-slate-500">
                Seluruh data {mapStatus.toUpperCase() === 'ALL' ? 'semua status' : mapStatus} pada periode filter ini tidak memiliki nilai Latitude/Longitude valid di kolom AN & AO.
              </p>
            </div>
          </div>
        )}

        {/* MAP STATUS LEGEND */}
        <div className="absolute bottom-4 right-4 z-[900] hidden md:flex items-center space-x-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300 shadow-xl pointer-events-none">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Legenda:</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
            <span className="text-emerald-400">COMPWORK</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20"></span>
            <span className="text-rose-400">CANCLWORK</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
            <span className="text-amber-400">WORKFAIL</span>
          </div>
        </div>

        {/* GORGEOUS FLOATING ORDER DETAIL CARD OVERLAY */}
        {selectedOrder && (
          <div className="absolute top-16 right-4 bottom-14 z-[1010] w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fade-in text-slate-800">
            <div className="space-y-4">
              
              {/* Header detail */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-md border border-blue-100 uppercase tracking-wider">
                    Detail Koordinat Order
                  </span>
                  <h5 className="text-sm font-black text-slate-800 tracking-tight mt-1 flex items-center gap-1.5">
                    <span className="truncate">{selectedOrder.raw.orderId || selectedOrder.raw.scOrder}</span>
                  </h5>
                  {selectedOrder.raw.customerName && (
                    <p className="text-xs font-bold text-slate-700 truncate" title={selectedOrder.raw.customerName}>
                      {selectedOrder.raw.customerName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200/40 cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {/* Properties list */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2.5 text-[11px]">
                {/* ORDER_ID = DARI KOLOM C */}
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">ORDER_ID</span>
                    <span className="text-[9px] text-slate-400 font-medium">(Kolom C)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200/60 rounded text-[11px] select-all shadow-xs">
                      {selectedOrder.raw.orderId || selectedOrder.raw.scOrder}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.raw.orderId || selectedOrder.raw.scOrder, 'scOrder')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                      title="Salin ORDER_ID"
                    >
                      {isCopied && copiedType === 'scOrder' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CUSTOMER_NAME = DARI KOLOM U */}
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">CUSTOMER_NAME</span>
                    <span className="text-[9px] text-slate-400 font-medium">(Kolom U)</span>
                  </div>
                  <span className="font-extrabold text-slate-800 text-right max-w-[160px] truncate" title={selectedOrder.raw.customerName || '-'}>
                    {selectedOrder.raw.customerName || '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">Status Order</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    selectedOrder.raw.status.toUpperCase() === 'COMPWORK'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : selectedOrder.raw.status.toUpperCase() === 'CANCLWORK'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : selectedOrder.raw.status.toUpperCase() === 'WORKFAIL'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {selectedOrder.raw.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">Sektor</span>
                  <span className="font-extrabold text-slate-800">{selectedOrder.raw.sektor}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">SA Wilayah</span>
                  <span className="font-extrabold text-slate-800">{selectedOrder.raw.sa}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">Kode STO</span>
                  <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 border border-slate-200/40 rounded shadow-sm">{selectedOrder.raw.sto}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <span className="text-slate-400 font-bold">Segmen</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full">{selectedOrder.raw.segment}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-slate-400 font-bold">Paket Layanan</span>
                  <span className="font-black text-slate-800 truncate" title={selectedOrder.raw.packageName}>
                    {selectedOrder.raw.packageName || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/50">
                  <span className="text-slate-400 font-bold">Status Dated</span>
                  <span className="font-medium text-slate-500">{selectedOrder.raw.statusDated}</span>
                </div>
              </div>

              {/* LATITUDE & LONGITUDE DISPLAY CARD */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Koordinat GIS Terpasang</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-white p-2 border border-emerald-200/40 rounded-lg space-y-0.5">
                    <span className="text-slate-400 font-bold text-[8.5px] uppercase">Latitude (AN)</span>
                    <p className="font-mono font-bold text-slate-800 truncate" title={selectedOrder.raw.latitude}>{selectedOrder.raw.latitude}</p>
                  </div>
                  <div className="bg-white p-2 border border-emerald-200/40 rounded-lg space-y-0.5">
                    <span className="text-slate-400 font-bold text-[8.5px] uppercase">Longitude (AO)</span>
                    <p className="font-mono font-bold text-slate-800 truncate" title={selectedOrder.raw.longitude}>{selectedOrder.raw.longitude}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 bg-white border border-emerald-200/40 p-2 rounded-lg">
                  <span className="truncate">Pars: {selectedOrder.lat.toFixed(6)}, {selectedOrder.lng.toFixed(6)}</span>
                  <button
                    onClick={() => copyToClipboard(`${selectedOrder.lat.toFixed(6)},${selectedOrder.lng.toFixed(6)}`, 'coord')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Salin Koordinat"
                  >
                    {isCopied && copiedType === 'coord' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* ACTION LINKS */}
            <div className="pt-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.lat},${selectedOrder.lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Google Maps</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METRICS INFO */}
      <div className="p-4 bg-slate-50 text-[11px] text-slate-500 font-bold flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Informasi Koordinat: Google Geolocation API Format standard (latitude: -90 s/d 90, longitude: -180 s/d 180)</span>
        </div>
        <span>Regional: JATIM BARAT</span>
      </div>
    </div>
  );
}

// Helper formats
function formatPercent(num: number): string {
  if (isNaN(num)) return '0';
  return num.toFixed(1);
}

