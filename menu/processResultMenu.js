// menu/processResultMenu.js
import { Markup } from 'telegraf';

export const processResultMenu = (processNumber, courtSystem) => Markup.inlineKeyboard([
  [Markup.button.callback('📁 Salvar na Biblioteca', `save_process_to_library_${processNumber}_${courtSystem}`)],
  [Markup.button.callback('🔔 Receber Alertes de Intimação', `monitor_process_${processNumber}`)],
  [Markup.button.callback('⬅️ Voltar', 'back')]
]);
