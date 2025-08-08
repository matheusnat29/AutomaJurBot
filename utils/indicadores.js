// utils/indicadores.js
import axios from 'axios';

// Salário mínimo por ano (atualizado até 2025)
export const salarioMinimoAno = {
  2023: 1320,
  2024: 1412,
  2025: 1502 // exemplo, ajuste conforme necessário
};

// Faixas INSS para 2025 (exemplo, ajuste com dados reais ou API)
export const faixasINSS = [
  { limite: 1412, aliquota: 0.075 },
  { limite: 2666.68, aliquota: 0.09 },
  { limite: 4000.03, aliquota: 0.12 },
  { limite: 7786.02, aliquota: 0.14 },
];

// Faixas IRPF para 2025 (exemplo, ajuste com dados reais ou API)
export const faixasIRPF = [
  { limite: 2259.20, aliquota: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896 }
];

// Busca IPCA-E mensal do site do Banco Central
export async function obterIPCAEMensal(ano, mes) {
  const codigoSerie = 1737;
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-28`;

  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigoSerie}/dados?formato=json&dataInicial=${dataInicio}&dataFinal=${dataFim}`;

  const { data } = await axios.get(url);
  const resultado = data.find(entry => entry.data.includes(`${mes}/${ano}`));
  return resultado ? parseFloat(resultado.valor.replace(',', '.')) : 0;
}

// Busca taxa SELIC acumulada para o período
export async function obterSELICAcumulada(mes, ano) {
  const codigoSerie = 4390; // SELIC acumulada no mês
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-28`;

  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigoSerie}/dados?formato=json&dataInicial=${dataInicio}&dataFinal=${dataFim}`;

  const { data } = await axios.get(url);
  const resultado = data.find(entry => entry.data.includes(`${mes}/${ano}`));
  return resultado ? parseFloat(resultado.valor.replace(',', '.')) : 0;
}
