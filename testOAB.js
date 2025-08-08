// testOAB.js
import { checkOAB } from './scrapers/oab.js';

console.log('🚀 Iniciando teste de checkOAB...');

const run = async () => {
  const resultados = await checkOAB('123456'); // Substitua por um número válido se quiser
  console.log('📦 Resultado:', resultados);
};

run();
