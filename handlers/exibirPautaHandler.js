// handlers/exibirPautaHandler.js

import { Markup } from 'telegraf';
import Audiencia from '../database/models/Audiencia.js';
import { initialMenu } from '../menu/initialMenu.js';

function formatarData(d) {
  return d.toLocaleDateString('pt-BR');
}

function formatarHorario(d) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function gerarTextoBotao(audiencia, index) {
  // ⚖️ para não concluída, ✅ para concluída
    const statusEmoji = audiencia.concluida ? '✅' : '⚖️';
    // Garantir data e horário nunca undefined ou zerados
  let dataObj = audiencia.data;
    let dataStr = '—';
    let horaStr = audiencia.horario || '—';
    if (dataObj && typeof dataObj === 'string' && dataObj.includes('/')) {
      const [dia, mes, ano] = dataObj.split('/');
      const dateTmp = new Date(`${ano}-${mes}-${dia}T00:00:00-03:00`);
      if (!isNaN(dateTmp)) {
        dataStr = formatarData(dateTmp);
      }
    } else if (dataObj instanceof Date && !isNaN(dataObj)) {
      dataStr = formatarData(dataObj);
    } else if (typeof dataObj === 'string' && dataObj.trim() !== '') {
      dataStr = dataObj;
    }
    if (!horaStr || horaStr === '00:00' || horaStr === 'undefined' || horaStr === undefined || horaStr === null || horaStr === '') {
      horaStr = '—';
    }
  // Resumo: NÃO mostrar parte representada nem comarca
  return `${statusEmoji} ${index + 1}. ${audiencia.autor} x ${audiencia.reu} | 📅 ${dataStr} ⏰ ${horaStr}`;
}

export function setupExibirPautaHandler(bot) {
  // Função utilitária para deletar histórico de mensagens do bot
  async function limparHistorico(ctx) {
    ctx.session = ctx.session || {};
    if (Array.isArray(ctx.session.botMessageIds)) {
      for (const msgId of ctx.session.botMessageIds) {
        try { await ctx.deleteMessage(msgId); } catch {}
      }
    }
    ctx.session.botMessageIds = [];
  }
  bot.action('pauta_do_dia', async (ctx) => {
    await limparHistorico(ctx);
    const userId = ctx.from.id;
    console.log('📅 Ação pauta_do_dia acionada');

    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    const audiencias = await Audiencia.find({
      userId,
      data: { $gte: hoje, $lte: amanha }
    });

    if (audiencias.length === 0) {
      await ctx.editMessageText('📭 Nenhuma audiência agendada para hoje ou amanhã.', initialMenu());
      return;
    }

    const botoes = audiencias.map((a, i) => [
      Markup.button.callback(gerarTextoBotao(a, i), `ver_audiencia_${a._id}`)
    ]);

    const sent = await ctx.editMessageText('📅 *Pauta do Dia:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        ...botoes,
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
    ctx.session.botMessageIds = [sent.message_id];
  });

  bot.action('todas_audiencias', async (ctx) => {
    await limparHistorico(ctx);
    const userId = ctx.from.id;
    console.log('📂 Ação todas_audiencias acionada');

    const audiencias = await Audiencia.find({ userId });

    if (audiencias.length === 0) {
      try {
        await ctx.editMessageText('📭 Nenhuma audiência ou perícia cadastrada.', initialMenu());
      } catch {
        await ctx.reply('📭 Nenhuma audiência ou perícia cadastrada.');
        await initialMenu(ctx);
      }
      return;
    }

    const botoes = audiencias.map((a, i) => [
      Markup.button.callback(gerarTextoBotao(a, i), `ver_audiencia_${a._id}`)
    ]);

    try {
      const sent = await ctx.editMessageText('📂 *Todas as Audiências e Perícias:*', {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          ...botoes,
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]).reply_markup
      });
      ctx.session.botMessageIds = [sent.message_id];
    } catch {
      const sent = await ctx.reply('📂 *Todas as Audiências e Perícias:*', {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          ...botoes,
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]).reply_markup
      });
      ctx.session.botMessageIds = [sent.message_id];
    }
  });
}
