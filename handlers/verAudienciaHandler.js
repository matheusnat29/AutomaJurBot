// handlers/verAudienciaHandler.js

import { Markup } from 'telegraf';
import { pushState, popState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupVerAudienciaHandler(bot) {
  // Visualizar detalhes da audiência
  bot.action(/ver_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    const userId = ctx.from.id;

    try {
      const audiencia = await Audiencia.findOne({ _id: audienciaId, userId });

      if (!audiencia) {
        return ctx.editMessageText('❌ Audiência não encontrada.', initialMenu());
      }

      const dataHora = `${audiencia.dia} às ${audiencia.horario}`;
      const parte = audiencia.parteRepresentada ? `🧑‍💼 ${audiencia.parteRepresentada}` : 'Não informado';

      const texto = `📌 *Audiência*

👥 *${audiencia.autor} x ${audiencia.reu}*
👤 ${parte}
📅 ${dataHora}
📍 ${audiencia.comarca}`;

      await ctx.editMessageText(texto, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✏️ Editar', `editar_audiencia_${audienciaId}`)],
          [Markup.button.callback('🗑️ Excluir', `confirmar_excluir_audiencia_${audienciaId}`)],
          [Markup.button.callback('⏰ Definir Lembrete', `definir_lembrete_audiencia_${audienciaId}`)],
          [Markup.button.callback('⬅️ Voltar', 'back')],
        ]).reply_markup
      });
    } catch (err) {
      console.error('❌ Erro ao visualizar audiência:', err);
      await ctx.reply('❌ Erro ao visualizar audiência.');
    }
  });

  // Confirmação de exclusão
  bot.action(/confirmar_excluir_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    pushState(ctx, 'confirmando_exclusao_audiencia', { audienciaId });

    await ctx.editMessageText('⚠️ Deseja realmente excluir esta audiência?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim, excluir', `excluir_audiencia_${audienciaId}`)],
        [Markup.button.callback('❌ Cancelar', 'back')]
      ]).reply_markup
    });
  });

  // Excluir audiência
  bot.action(/excluir_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    const userId = ctx.from.id;

    try {
      await Audiencia.findOneAndDelete({ _id: audienciaId, userId });
      popState(ctx);
      await ctx.editMessageText('✅ Audiência excluída com sucesso.', initialMenu());
    } catch (err) {
      console.error('❌ Erro ao excluir audiência:', err);
      await ctx.reply('❌ Erro ao excluir audiência.');
    }
  });
}
