// handlers/defaultHandler.js
import { getCurrentState, resetState, pushState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupDefaultHandler(bot) {
  bot.on('message', async (ctx) => {
    const state = getCurrentState(ctx);

    // Se não estiver em nenhum estado conhecido, leva para o menu principal
    if (!state) {
      resetState(ctx);
      pushState(ctx, 'main_menu');
      console.log(`ℹ️ Mensagem fora de fluxo de ${ctx.from?.username || ctx.from?.id} → Redirecionando para menu`);
      await initialMenu(ctx, '⚠️ Não entendi sua mensagem. Aqui está o menu novamente:');
      try {
        await ctx.reply('⬅️ Voltar',
          require('telegraf').Markup.inlineKeyboard([[require('telegraf').Markup.button.callback('⬅️ Voltar', 'back')]])
        );
      } catch {}
    }
  });
}
