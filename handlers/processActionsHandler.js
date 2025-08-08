// handlers/processActionsHandler.js
import { statusSelectionMenu } from '../menu/statusSelectionMenu.js';

export function setupProcessActionsHandlers(bot) {
  bot.action(/edit_parties_(.+)_(.+)/, async (ctx) => {
    await ctx.reply(`✏️ Edição de polos para o processo ${ctx.match[1]} na biblioteca ${ctx.match[2]}`);
  });

  bot.action(/show_recent_movements_(.+)/, async (ctx) => {
    await ctx.reply(`🔄 Movimentações recentes do processo ${ctx.match[1]}: (lista aqui)`);
  });

  bot.action(/change_status_from_library_(.+)_(.+)/, async (ctx) => {
    await ctx.editMessageText('Selecione o novo status do processo:', statusSelectionMenu(ctx.match[1], ctx.match[2]));
  });
}
