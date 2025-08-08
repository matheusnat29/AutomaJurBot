// handlers/pautaDiaHandler.js

import { Markup } from 'telegraf';
import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupPautaDiaHandler(bot) {
  bot.action('pauta_dia', async (ctx) => {
    console.log('📅 Ação pauta_dia acionada');
    const userId = ctx.from.id;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const audiencias = await Audiencia.find({
      userId,
      dia: {
        $gte: today.toISOString().split('T')[0],
        $lte: tomorrow.toISOString().split('T')[0],
      },
    }).sort({ dia: 1, horario: 1 });

    if (audiencias.length === 0) {
      return ctx.editMessageText('📭 Nenhuma audiência para hoje ou amanhã.', initialMenu());
    }

    const buttons = audiencias.map((aud, idx) => [
      Markup.button.callback(
        `${idx + 1}. ${aud.autor} x ${aud.reu} - ${formatarDataHora(aud.dia, aud.horario)} - ${aud.comarca}`,
        `ver_audiencia_${aud._id}`
      )
    ]);

    await ctx.editMessageText('📅 *Pauta do Dia:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        ...buttons,
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup,
    });
  });

  bot.action(/ver_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    const audiencia = await Audiencia.findById(id);
    if (!audiencia) return ctx.reply('❌ Audiência não encontrada.');

    pushState(ctx, 'ver_audiencia', { id });

    await ctx.editMessageText(
      `📌 *Audiência*
👤 ${audiencia.autor} x ${audiencia.reu}
📆 ${formatarDataHora(audiencia.dia, audiencia.horario)}
🏛️ ${audiencia.comarca}`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('🗑️ Excluir', `confirm_delete_audiencia_${id}`),
            Markup.button.callback('⏰ Definir Lembrete', `definir_lembrete_${id}`),
            Markup.button.callback('✏️ Editar', `editar_audiencia_${id}`),
          ],
          [Markup.button.callback('⬅️ Voltar', 'back')],
        ]).reply_markup,
      }
    );
  });
}

function formatarDataHora(dataISO, hora) {
  const data = new Date(dataISO);
  return `${data.toLocaleDateString('pt-BR')} às ${hora}`;
}
