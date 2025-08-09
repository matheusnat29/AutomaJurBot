// menu/lawyerMenu.js
import { Markup } from 'telegraf';

export function lawyerMenu() {
  return {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('➕ Cadastrar Advogado', 'cadastrar_advogado')],
      [Markup.button.callback('📋 Listar Advogados', 'listar_advogados')],
      [Markup.button.callback('⬅️ Voltar', 'back')]
    ])
  };
}
