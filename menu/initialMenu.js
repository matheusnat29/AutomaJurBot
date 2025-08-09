// menu/initialMenu.js
import { Markup } from 'telegraf';

export async function initialMenu(ctx, extraMessage = null) {
  const menuText = `${extraMessage ? `${extraMessage}\n\n` : ''}📋 *Menu Principal*  \nEscolha uma das opções abaixo:`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('👨‍⚖️ Cadastrar Advogado', 'register_lawyer')],
    [Markup.button.callback('📂 Meus Advogados', 'my_lawyers')],
    [Markup.button.callback('🗓️ Agendar Lembrete', 'agendar_lembrete')],
    [Markup.button.callback('📅 Audiências/Perícias', 'audiencias_menu')],
    [Markup.button.callback('📚 Biblioteca/Processos', 'menu_biblioteca_processos')],
    [Markup.button.callback('⬅️ Voltar', 'back')],
  ]);

  // Sempre tenta editar a mensagem anterior, só faz reply se não for possível
  try {
    await ctx.editMessageText(menuText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (err) {
    try {
      await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (replyErr) {
      console.error('🚨 Falha ao exibir menu inicial:', replyErr);
    }
  }
}
