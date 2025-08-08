// handlers/honorarioHandler.js
import { Markup } from 'telegraf';
import { pushState, popState, getCurrentState } from '../utils/stateManager.js';

export function setupHonorarioHandlers(bot) {
  bot.action('finances', async (ctx) => {
    pushState(ctx, 'finances_menu');
    await ctx.editMessageText('💰 Menu de finanças (honorários, recebíveis, etc.) em construção.', Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'back')]
    ]));
  });

  bot.on('text', async (ctx, next) => {
    const currentState = getCurrentState(ctx);
    
    if (currentState?.state === 'finances_menu') {
      await ctx.reply('📌 Em breve você poderá adicionar dados de honorários diretamente aqui.');
      popState(ctx);
      return; // ⬅️ evita chamar next() duas vezes
    }

    return next(); // ⬅️ MUITO IMPORTANTE
  });
}
