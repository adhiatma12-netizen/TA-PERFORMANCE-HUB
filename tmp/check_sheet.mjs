import fs from 'fs';

async function run() {
  const spreadsheetId = "1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE";
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
  const res = await fetch(url);
  const html = await res.text();
  console.log("HTML len:", html.length);
  
  // Look for items with sheet names or gid
  const gidMatches = [...html.matchAll(/gid=([0-9]+)/g)].map(m => m[1]);
  console.log("Gids:", [...new Set(gidMatches)]);

  // Look for BC 2026
  const pos = html.indexOf("BC 2026");
  console.log("BC 2026 pos:", pos);
  if (pos !== -1) {
    console.log(html.substring(Math.max(0, pos - 150), pos + 250));
  }
}
run();
