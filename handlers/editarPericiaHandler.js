// handlers/editarPericiaHandler.js

import { Markup } from 'telegraf';
import Pericia from '../database/models/Pericia.js';
import { pushState, getCurrentState, popState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupEditarPericiaHandler(bot) {
  bot.action(/editar_pericia_(.+)/, async (ctx) => {
    const periciaId = ctx.match[1];
    pushState(ctx, 'editing_pericia', { periciaId, step: 'parte' });

    await ctx.editMessageText('✏️ Informe o novo nome da parte:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  bot.on('text', async (ctx, next) => {
    const state = getCurrentState(ctx);
    if (!state || state.state !== 'editing_pericia') return next();

    const { periciaId, step, parte, dia } = state.data;
    const text = ctx.message.text.trim();

    if (step === 'parte') {
      pushState(ctx, 'editing_pericia', { periciaId, parte: text, step: 'dia' });
      return ctx.reply('📅 Informe a nova data da perícia (formato DD/MM/AAAA):');
    }

    if (step === 'dia') {
      pushState(ctx, 'editing_pericia', { periciaId, parte, dia: text, step: 'hora' });
      return ctx.reply('⏰ Informe o novo horário da perícia (formato HH:mm):');
    }

    if (step === 'hora') {
      try {
        await Pericia.findByIdAndUpdate(periciaId, {
          parte,
          data: text + ':00', // salva com segundos zerados
          dia,
        });

        await ctx.reply('✅ Perícia atualizada com sucesso!', initialMenu());
        popState(ctx);
      } catch (error) {
        console.error('❌ Erro ao atualizar perícia:', error);
        await ctx.reply('❌ Ocorreu um erro ao atualizar a perícia.');
        popState(ctx);
      }
    }
  });
}
