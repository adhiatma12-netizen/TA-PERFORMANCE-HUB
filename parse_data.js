import fs from 'fs';

function parseCSV(text) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentLine.push(currentField.trim());
      lines.push(currentLine);
      currentLine = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }
  
  return lines;
}

// Helper to parse Indonesian decimal string (e.g. "4,5" -> 4.5)
function parseIndoFloat(val) {
  if (!val || val === '0' || val === '' || val === '-') return 0;
  const cleanVal = val.replace(/,/g, '.');
  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? 0 : parsed;
}

const fileContent = fs.readFileSync('bot_madiun.csv', 'utf8');
const rows = parseCSV(fileContent);

const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-amber-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];

// 1. Build a map of technician historical values from "REKAP CLOSE M To M" (Rows 111-139)
const historicalMap = {};
for (let i = 111; i <= 139; i++) {
  const row = rows[i];
  if (!row || row.length < 12) continue;
  
  const nik = row[4];
  if (!nik) continue;
  
  const m1 = parseIndoFloat(row[6]);
  const m2 = parseIndoFloat(row[7]);
  const m3 = parseIndoFloat(row[8]);
  const m4 = parseIndoFloat(row[9]);
  const m5 = parseIndoFloat(row[10]);
  const m6 = parseIndoFloat(row[11]);
  
  historicalMap[nik] = {
    'Januari': m1,
    'Februari': m2,
    'Maret': m3,
    'April': m4,
    'Mei': m5,
    'Juni': m6
  };
}

const parsedTechs = [];
let techIndex = 1;

// 2. The main monthly report starts from Row 7 (index 7) up to Row 35 (index 35) in the CSV
for (let i = 7; i <= 35; i++) {
  const row = rows[i];
  if (!row || row.length < 16) continue;
  
  const name = row[5];
  if (!name || name === 'NAMA' || name === 'Grand Total' || name.includes('Total')) continue;
  
  const ploting = row[2] || 'Teknisi IOAN';
  const area = row[3] || 'Sektor Madiun';
  const NIK = row[4] || '';
  
  // Base Month 6 (Juni) detailed categories
  const bBenjar = parseIndoFloat(row[6]);
  const bLainLain = parseIndoFloat(row[7]);
  const bTiketManual = parseIndoFloat(row[8]);
  const bTiketReguler = parseIndoFloat(row[9]);
  const bUnderspec = parseIndoFloat(row[10]);
  const bReplacementOnt = parseIndoFloat(row[11]);
  const bGamasOdp = parseIndoFloat(row[12]);
  const bGamasFeeder = parseIndoFloat(row[13]);
  const bGamasDistribusi = parseIndoFloat(row[14]);
  const bTiketClose = parseIndoFloat(row[15]);
  
  // Retrieve Month-to-Month totals
  const monthlyTotals = historicalMap[NIK] || {
    'Januari': 0, 'Februari': 0, 'Maret': 0, 'April': 0, 'Mei': 0, 'Juni': bTiketClose
  };
  
  // Calculate simulated July (Juli) total tickets as a realistic stable factor of June
  const j6 = monthlyTotals['Juni'] !== undefined ? monthlyTotals['Juni'] : bTiketClose;
  const j7 = j6 > 0 ? Math.round(j6 * (0.92 + (techIndex % 5) * 0.04)) : 0;
  
  const monthlyTotalsWithJuly = {
    ...monthlyTotals,
    'Juni': j6,
    'Juli': j7
  };
  
  // Create multi-month dataset for this technician
  const monthlyData = {};
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli'];
  
  months.forEach(month => {
    const totalTickets = monthlyTotalsWithJuly[month];
    
    // Scale sub-metrics proportionally to total tickets
    let benjar = 0, lainLain = 0, tiketManual = 0, tiketReguler = 0, underspec = 0;
    let replacementOnt = 0, gamasOdp = 0, gamasFeeder = 0, gamasDistribusi = 0;
    
    if (month === 'Juni') {
      benjar = bBenjar;
      lainLain = bLainLain;
      tiketManual = bTiketManual;
      tiketReguler = bTiketReguler;
      underspec = bUnderspec;
      replacementOnt = bReplacementOnt;
      gamasOdp = bGamasOdp;
      gamasFeeder = bGamasFeeder;
      gamasDistribusi = bGamasDistribusi;
    } else if (totalTickets > 0) {
      if (bTiketClose > 0) {
        // Proportion-based scaling from Month 6 distribution
        const ratio = totalTickets / bTiketClose;
        benjar = parseFloat((bBenjar * ratio).toFixed(1));
        lainLain = parseFloat((bLainLain * ratio).toFixed(1));
        tiketManual = parseFloat((bTiketManual * ratio).toFixed(1));
        tiketReguler = parseFloat((bTiketReguler * ratio).toFixed(1));
        underspec = parseFloat((bUnderspec * ratio).toFixed(1));
        replacementOnt = parseFloat((bReplacementOnt * ratio).toFixed(1));
        gamasOdp = parseFloat((bGamasOdp * ratio).toFixed(1));
        gamasFeeder = parseFloat((bGamasFeeder * ratio).toFixed(1));
        gamasDistribusi = parseFloat((bGamasDistribusi * ratio).toFixed(1));
      } else {
        // Fallback distribution when Month 6 is 0 but historical month is active
        tiketReguler = parseFloat((totalTickets * 0.85).toFixed(1));
        tiketManual = parseFloat((totalTickets * 0.10).toFixed(1));
        replacementOnt = parseFloat((totalTickets * 0.05).toFixed(1));
      }
    }
    
    // Calculate month-specific performance values
    const maxClose = 110;
    const productivityScore = totalTickets > 0 
      ? parseFloat((3.0 + (totalTickets / maxClose) * 2.0).toFixed(1)) 
      : 0.0;
      
    let skillLevel = 'Basic';
    if (totalTickets >= 70) skillLevel = 'Expert';
    else if (totalTickets >= 40) skillLevel = 'Advance';
    else if (totalTickets >= 5) skillLevel = 'Intermediate';
    
    let status = 'Standby';
    if (totalTickets > 0) {
      status = (techIndex % 5 === 0) ? 'Standby' : 'Active';
    } else {
      status = (techIndex % 4 === 0) ? 'On Leave' : 'Standby';
    }
    
    const rating = parseFloat((4.5 + (totalTickets % 5) * 0.1).toFixed(1));
    const psbCompleted = Math.round(totalTickets * 0.4);
    
    monthlyData[month] = {
      ticketsResolved: totalTickets,
      productivityScore: productivityScore,
      psbCompleted: psbCompleted,
      skillLevel: skillLevel,
      status: status,
      rating: rating,
      
      benjar: benjar,
      lainLain: lainLain,
      tiketManual: tiketManual,
      tiketReguler: tiketReguler,
      underspec: underspec,
      replacementOnt: replacementOnt,
      gamasOdp: gamasOdp,
      gamasFeeder: gamasFeeder,
      gamasDistribusi: gamasDistribusi,
      tiketClose: totalTickets
    };
  });
  
  // Set default properties to the default active month (Juni)
  const defaultMonth = 'Juni';
  const def = monthlyData[defaultMonth];
  const avatarColor = colors[techIndex % colors.length];
  
  parsedTechs.push({
    id: NIK || `TM${String(techIndex).padStart(3, '0')}`,
    name: name,
    regional: 'REG 5 - Jatim & Nusra',
    witel: area,
    productivityScore: def.productivityScore,
    ticketsResolved: def.ticketsResolved,
    psbCompleted: def.psbCompleted,
    skillLevel: def.skillLevel,
    status: def.status,
    avatarColor: avatarColor,
    rating: def.rating,
    
    benjar: def.benjar,
    lainLain: def.lainLain,
    tiketManual: def.tiketManual,
    tiketReguler: def.tiketReguler,
    underspec: def.underspec,
    replacementOnt: def.replacementOnt,
    gamasOdp: def.gamasOdp,
    gamasFeeder: def.gamasFeeder,
    gamasDistribusi: def.gamasDistribusi,
    tiketClose: def.tiketClose,
    
    monthlyData: monthlyData
  });
  
  techIndex++;
}

console.log(`Successfully parsed ${parsedTechs.length} technicians with full historical monthlyData.`);

const tsContent = `import { Technician } from '../types';

export const madiunTechnicians: Technician[] = ${JSON.stringify(parsedTechs, null, 2)};
`;

fs.writeFileSync('src/data/parsedMadiunData.ts', tsContent);
console.log('Successfully updated src/data/parsedMadiunData.ts!');
