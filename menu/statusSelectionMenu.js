// menu/statusSelectionMenu.js
import { Markup } from 'telegraf';

export const statusSelectionMenu = (processNumber, libraryName) => Markup.inlineKeyboard([
  [
    Markup.button.callback('⏳ Em Andamento', `set_status_${processNumber}_${libraryName}_Em Andamento`),
    Markup.button.callback('⚖️ Sentenciado', `set_status_${processNumber}_${libraryName}_Sentenciado`)
  ],
  [
    Markup.button.callback('🔄 Recurso', `set_status_${processNumber}_${libraryName}_Recurso`),
    Markup.button.callback('✍️ Em Conclusão', `set_status_${processNumber}_${libraryName}_Em Conclusão`)
  ],
  [Markup.button.callback('⬅️ Voltar', 'back')]
]);
