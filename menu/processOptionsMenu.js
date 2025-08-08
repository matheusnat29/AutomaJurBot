// menu/processOptionsMenu.js
import { Markup } from 'telegraf';

const statusEmojis = {
  'Em Andamento': '⏳',
  'Sentenciado': '⚖️',
  'Recurso': '🔄',
  'Em Conclusão': '✍️',
  'default': '⚪️'
};

export const processOptionsMenu = (processNumber, libraryName, currentStatus = 'Em Andamento') => {
  const statusEmoji = statusEmojis[currentStatus] || statusEmojis['default'];

  return Markup.inlineKeyboard([
    [Markup.button.callback('📄 Copiar Número', `copy_process_number_${processNumber}`)],
    [Markup.button.callback('🔄 Mostrar Movimentações Recentes', `show_recent_movements_${processNumber}`)],
    [Markup.button.callback(`${statusEmoji} Mudar Status`, `change_status_from_library_${processNumber}_${libraryName}`)],
    [Markup.button.callback('✏️ Editar Polos', `edit_parties_${processNumber}_${libraryName}`)],
    [Markup.button.callback('🗑️ Deletar Processo', `delete_process_${processNumber}_${libraryName}`)],
    [Markup.button.callback('⬅️ Voltar', 'back')]
  ]);
};
