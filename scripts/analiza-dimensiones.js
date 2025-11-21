// Analiza la distribución de la suma de las 7 dimensiones de caminar
// Uso: node scripts/analiza-dimensiones.js
const fs = require('fs');
const path = require('path');

function quantile(sorted, q) {
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

try {
  const file = path.join(__dirname, '..', 'public', 'data', 'dimensiones-de-caminar.geojson');
  const raw = fs.readFileSync(file, 'utf8');
  const geo = JSON.parse(raw);
  const totals = [];
  const perFeature = [];
  const dimNames = [
    'Eval_D_abastecerse_cnt',
    'Eval_aprender_cnt',
    'Eval_D_circular_cnt',
    'Eval_D_cuidados_cnt',
    'Eval_D_disfrutar_cnt',
    'Eval_D_reutil_reparar_cnt',
    'Eval_D_trabajar_cnt'
  ];
  const perDim = Object.fromEntries(dimNames.map(n => [n, []]));

  for (const f of geo.features) {
    const p = f.properties || {};
    let sum = 0;
    const record = { id: p.fid ?? p.id ?? null };
    dimNames.forEach(n => {
      const v = Number(p[n] ?? 0) || 0;
      perDim[n].push(v);
      record[n] = v;
      sum += v;
    });
    record.total = sum;
    perFeature.push(record);
    // Excluir totales 0 solo si queremos analizar presencia; aquí incluimos todos
    totals.push(sum);
  }

  const filtered = totals.filter(t => t > 0);
  const sortedAll = [...totals].sort((a,b)=>a-b);
  const sortedPos = [...filtered].sort((a,b)=>a-b);

  const stats = {
    count_total: totals.length,
    count_positive: filtered.length,
    min: sortedAll[0],
    max: sortedAll[sortedAll.length-1],
    min_positive: sortedPos[0],
    max_positive: sortedPos[sortedPos.length-1],
    q10: quantile(sortedPos, 0.10),
    q25: quantile(sortedPos, 0.25),
    q50: quantile(sortedPos, 0.50),
    q75: quantile(sortedPos, 0.75),
    q90: quantile(sortedPos, 0.90),
    q95: quantile(sortedPos, 0.95)
  };

  // Stats por dimensión
  const dimStats = {};
  for (const n of dimNames) {
    const arr = perDim[n].sort((a,b)=>a-b);
    dimStats[n] = {
      min: arr[0],
      max: arr[arr.length-1],
      q25: quantile(arr,0.25),
      q50: quantile(arr,0.50),
      q75: quantile(arr,0.75),
      mean: arr.reduce((s,v)=>s+v,0)/arr.length
    };
  }

  console.log('=== Distribución total (suma 7 dimensiones) ===');
  console.table(stats);
  console.log('\n=== Estadísticos por dimensión ===');
  console.table(dimStats);

  // Sugerencia de cortes basada en cuantiles y rango
  // Usamos min_positive, q25, q50, q75, q95, max_positive para proponer
  const cuts = [stats.min_positive, stats.q25, stats.q50, stats.q75, stats.q95, stats.max_positive].map(v=>Math.round(v));
  console.log('\nSugerencia inicial de cortes (min+, Q25, Q50, Q75, Q95, max+):', cuts);
  console.log('Propuesta para 5 clases:');
  console.log('- Clase 1: 0 (sin oferta)');
  console.log(`- Clase 2: 1–${Math.round(stats.q25)} muy baja`);
  console.log(`- Clase 3: ${Math.round(stats.q25)+1}–${Math.round(stats.q50)} baja`);
  console.log(`- Clase 4: ${Math.round(stats.q50)+1}–${Math.round(stats.q75)} media`);
  console.log(`- Clase 5: ${Math.round(stats.q75)+1}–${Math.round(stats.q95)} alta`);
  console.log(`- Clase 6: >${Math.round(stats.q95)} muy alta`);
  console.log('\nAjustar manualmente para redondear valores “bonitos” antes de codificar.');
} catch (e) {
  console.error('Error analizando:', e);
  process.exit(1);
}
