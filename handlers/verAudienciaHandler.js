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
      return ctx.editMessageText('❌ Audiência não encontrada.', {
        ...initialMenu(),
        reply_markup: Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup
      });
    }

    const statusEmoji = audiencia.concluida ? '✅' : '⚖️';
    const autor = audiencia.autor || '—';
    const reu = audiencia.reu || '—';
    const parte = audiencia.parteRepresentada || '—';
    const dataStr = audiencia.data || '—';
    const horaStr = audiencia.horario || '—';
    const processo = audiencia.processo || '—';
    const comarca = audiencia.comarca || '—';

    let acordoInfo = '';
    if (audiencia.concluida) {
      if (audiencia.acordo === true) {
        acordoInfo = '<br>🤝 <b>Acordo realizado</b>';
        if (audiencia.valorAcordo) acordoInfo += `<br>💰 <b>Valor:</b> R$ ${audiencia.valorAcordo}`;
      } else if (audiencia.acordo === false) {
        acordoInfo = '<br>❌ <b>Sem acordo</b>';
      }
    }

    const texto = `${statusEmoji} *Audiência*
` +
      `👥 *Autor:* ${autor}\n` +
      `👤 *Réu:* ${reu}\n` +
      `🧑‍💼 *Parte Representada:* ${parte}\n` +
      `📅 *Dia:* ${dataStr}\n` +
      `⏰ *Horário:* ${horaStr}\n` +
      `📄 *Processo:* ${processo}\n` +
      `🏛️ *Comarca:* ${comarca}` + (acordoInfo ? `\n${acordoInfo.replace(/<br>/g, '\n').replace(/<b>|<\/b>/g, '')}` : '');

    await ctx.editMessageText(texto, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔔 Agendar Notificação', `agendar_notificacao_audiencia_${audienciaId}`)],
        [Markup.button.callback('✏️ Editar', `editar_audiencia_${audienciaId}`)],
        [Markup.button.callback('⏰ Definir Lembrete', `definir_lembrete_audiencia_${audienciaId}`)],
        [Markup.button.callback('✅ Concluir', `concluir_audiencia_${audienciaId}`)],
        [Markup.button.callback('🗑️ Excluir', `confirmar_excluir_audiencia_${audienciaId}`)],
        [Markup.button.callback('⬅️ Voltar', 'back')],
      ]).reply_markup
    });
  } catch (err) {
    console.error('❌ Erro ao visualizar audiência:', err);
    await ctx.reply('❌ Erro ao visualizar audiência.',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
    );
  }
});


  // Excluir audiência
  bot.action(/excluir_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    const userId = ctx.from.id;

    try {
      await Audiencia.findOneAndDelete({ _id: audienciaId, userId });
      popState(ctx);
      await ctx.editMessageText('✅ Audiência excluída com sucesso.',
        {
          ...initialMenu(),
          reply_markup: Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup
        }
      );
    } catch (err) {
      console.error('❌ Erro ao excluir audiência:', err);
      await ctx.reply('❌ Erro ao excluir audiência.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
  });
}
