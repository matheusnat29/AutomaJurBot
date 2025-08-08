// /menu/initialMenu.js
import { Markup } from 'telegraf';

export const initialMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('🔍 Buscar Intimações por OAB', 'search_oab_intimation')],
  [Markup.button.callback('🔍 Monitorar Processos', 'monitor_processes')],
  [Markup.button.callback('📚 Minhas Bibliotecas', 'my_libraries')],
  [Markup.button.callback('💰 Finanças', 'finances')],
  [Markup.button.callback('📊 Cálculos', 'calculos')], // ✅ novo botão
  [Markup.button.callback('⚖️ Cadastrar Advogado', 'register_lawyer')],
  [Markup.button.callback('📂 Meus Advogados', 'my_lawyers')],
  [Markup.button.callback('⏳ Audiências e Perícias', 'audiencias_pericias')]
]);
