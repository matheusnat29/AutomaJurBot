// menu/pautaOptionsMenu.js
import { Markup } from 'telegraf';

export const pautaOptionsMenu = (pautaId, hasNote) => {
  const buttons = [
    [Markup.button.callback('✏️ Editar Polos', `edit_polos_${pautaId}`)]
  ];

  if (hasNote) {
    buttons.push(
      [Markup.button.callback('📝 Editar Nota', `edit_note_${pautaId}`)],
      [Markup.button.callback('👁️ Ver Nota', `view_note_${pautaId}`)]
    );
  } else {
    buttons.push([
      Markup.button.callback('📝 Adicionar Nota', `add_note_${pautaId}`)
    ]);
  }

  buttons.push(
    [Markup.button.callback('🗑️ Excluir', `confirm_delete_pauta_${pautaId}`)],
    [Markup.button.callback('⬅️ Voltar', 'back')]
  );

  return Markup.inlineKeyboard(buttons);
};
