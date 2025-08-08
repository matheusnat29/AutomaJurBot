// handlers/editarAudienciaHandler.js

import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import { Markup } from 'telegraf';
import Audiencia from '../database/models/Audiencia.js';

export function setupEditarAudienciaHandler(bot) {
  // A��o para iniciar edi��o
  bot.action(/editar_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    pushState(ctx, 'editando_audiencia', { audienciaId });

    await ctx.editMessageText('O que você deseja editar?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('👥 Nome das Partes', `edit_nome_partes_${audienciaId}`)],
        [Markup.button.callback('📅 Dia', `edit_dia_${audienciaId}`)],
        [Markup.button.callback('⏰ Hora', `edit_hora_${audienciaId}`)],
        [Markup.button.callback('⬅️ Voltar', 'back')],
      ]).reply_markup,
    });
  });

  bot.action(/edit_nome_partes_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    pushState(ctx, 'editando_nome_partes', { audienciaId });
    await ctx.editMessageText('✏️ Informe o novo nome das partes (autor x réu):', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')],
      ]).reply_markup,
    });
  });

  bot.action(/edit_dia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    pushState(ctx, 'editando_dia', { audienciaId });
    await ctx.editMessageText('📅 Informe a nova data da audiência (DD/MM/AAAA):', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')],
      ]).reply_markup,
    });
  });

  bot.action(/edit_hora_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    pushState(ctx, 'editando_hora', { audienciaId });
    await ctx.editMessageText('⏰ Informe o novo horário da audiência (HH:MM):', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')],
      ]).reply_markup,
    });
  });

  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const state = getCurrentState(ctx);
    const text = ctx.message.text.trim();

    if (!state) return next();

    const { audienciaId } = state.data || {};

    try {
      switch (state.state) {
        case 'editando_nome_partes':
          await Audiencia.findByIdAndUpdate(audienciaId, { partes: text });
          await ctx.reply('✅ Nome das partes atualizado com sucesso.');
          popState(ctx);
          break;

        case 'editando_dia':
          await Audiencia.findByIdAndUpdate(audienciaId, { data: text });
          await ctx.reply('✅ Data atualizada com sucesso.');
          popState(ctx);
          break;

        case 'editando_hora':
          await Audiencia.findByIdAndUpdate(audienciaId, { horario: text });
          await ctx.reply('✅ Horário atualizado com sucesso.');
          popState(ctx);
          break;

        default:
          return next();
      }
    } catch (err) {
      console.error('❌ Erro ao editar audiência:', err);
      await ctx.reply('❌ Ocorreu um erro ao editar a audiência.');
      popState(ctx);
    }
  });
}