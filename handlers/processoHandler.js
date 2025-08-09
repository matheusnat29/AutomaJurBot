// handlers/processoHandler.js
import { Markup } from 'telegraf';
import { pushState, popState, getCurrentState } from '../utils/stateManager.js';

export function setupProcessoHandler(bot) {
  bot.action('monitor_processes', async (ctx) => {
    pushState(ctx, 'monitor_processes');
    await ctx.editMessageText(
      '🔍 Em breve: monitoramento automático de processos por número e tribunal.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ])
    );
  });

  bot.on('text', async (ctx, next) => {
    const currentState = getCurrentState(ctx);

    if (currentState?.state === 'monitor_processes') {
      await ctx.reply('🔎 Envio de números de processos será implementado futuramente.');
      popState(ctx);
      return;
    }

    return next();
  });
}
