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
  const statusEmoji = audiencia.status === 'concluida' ? '✅' : '⏳';
  const parteEmoji = '🧑‍💼';
  return `${index + 1}. ${statusEmoji} ${audiencia.autor} x ${audiencia.reu} (${parteEmoji} ${audiencia.parteRepresentada}) - ${formatarData(audiencia.data)} às ${formatarHorario(audiencia.data)} - ${audiencia.comarca}`;
}

export function setupExibirPautaHandler(bot) {
  bot.action('pauta_do_dia', async (ctx) => {
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

    await ctx.editMessageText('📅 *Pauta do Dia:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        ...botoes,
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  bot.action('todas_audiencias', async (ctx) => {
    const userId = ctx.from.id;
    console.log('📂 Ação todas_audiencias acionada');

    const audiencias = await Audiencia.find({ userId });

    if (audiencias.length === 0) {
      await ctx.editMessageText('📭 Nenhuma audiência ou perícia cadastrada.', initialMenu());
      return;
    }

    const botoes = audiencias.map((a, i) => [
      Markup.button.callback(gerarTextoBotao(a, i), `ver_audiencia_${a._id}`)
    ]);

    await ctx.editMessageText('📂 *Todas as Audiências e Perícias:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        ...botoes,
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });
}
