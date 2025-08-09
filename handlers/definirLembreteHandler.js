// handlers/definirLembreteHandler.js

import { Markup } from 'telegraf';
import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';
import { oauth2Client, createGoogleCalendarEvent } from '../utils/googleCalendar.js';
import { userTokens } from '../utils/userTokens.js';

export function setupDefinirLembreteHandler(bot) {
  bot.action(/set_reminder_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    pushState(ctx, 'awaiting_reminder_choice', { audienciaId });

    await ctx.editMessageText('🧭 Como deseja definir o lembrete?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('📅 Google Calendar', 'reminder_google')],
        [Markup.button.callback('⏰ Alerta Interno', 'reminder_interno')],
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  bot.action('reminder_google', async (ctx) => {
    const userId = ctx.from.id;
    const state = getCurrentState(ctx);
    const audienciaId = state?.data?.audienciaId;

    if (!userTokens.has(userId)) {
      return ctx.reply('⚠️ Você precisa autorizar o acesso ao Google Calendar primeiro. Use o comando /auth.');
    }

    try {
      const token = userTokens.get(userId);
      oauth2Client.setCredentials(token);

      // Buscar dados da audiência (você pode mover isso para um helper depois)
      const Audiencia = (await import('../database/models/Audiencia.js')).default;
      const audiencia = await Audiencia.findById(audienciaId);
      if (!audiencia) {
        return ctx.reply('❌ Audiência não encontrada.');
      }

      const summary = `${audiencia.parteAutor} x ${audiencia.parteReu}`;
      const description = `Audiência (${audiencia.representa}) na comarca ${audiencia.comarca}`;
      const startTime = new Date(`${audiencia.data}T${audiencia.hora}:00-03:00`); // Ajuste para fuso horário Brasil
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutos após

      const calendar = await createGoogleCalendarEvent(oauth2Client, {
        summary,
        description,
        start: startTime,
        end: endTime,
      });

      await ctx.editMessageText('✅ Lembrete criado com sucesso no Google Calendar!', initialMenu());
      popState(ctx);
    } catch (error) {
      console.error('❌ Erro ao criar evento no Google Calendar:', error);
      await ctx.reply('❌ Erro ao criar evento no Google Calendar.');
    }
  });

  bot.action('reminder_interno', async (ctx) => {
    // Placeholder: você pode futuramente armazenar lembrete localmente
    await ctx.editMessageText('🔔 Alerta interno ativado (funcionalidade em construção).', initialMenu());
    popState(ctx);
  });
}
