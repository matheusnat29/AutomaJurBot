// handlers/pautaDoDiaHandler.js
import { Markup } from 'telegraf';
import { resetState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';
import Pericia from '../database/models/Pericia.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupPautaDoDiaHandler(bot) {
  // Handler para mostrar detalhes da perícia na pauta do dia
  bot.action(/detalhe_pericia_(.+)/, async (ctx) => {
    const periciaId = ctx.match[1];
    const pericia = await Pericia.findById(periciaId);
    if (!pericia) {
      return ctx.editMessageText('❌ Perícia não encontrada.');
    }
    // Exibir todos os campos disponíveis
    const texto = `*Parte:* ${pericia.nomeParte}\n*Data:* ${pericia.data instanceof Date ? pericia.data.toLocaleDateString('pt-BR') : pericia.data}\n*Horário:* ${pericia.horario}`;
    await ctx.editMessageText(texto, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'pauta_do_dia')]
      ]).reply_markup
    });
  });
  // Handler para mostrar detalhes da audiência na pauta do dia
  bot.action(/detalhe_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    const audiencia = await Audiencia.findById(audienciaId);
    if (!audiencia) {
      return ctx.editMessageText('❌ Audiência não encontrada.');
    }
  const texto = `*Autor:* ${audiencia.autor}\n*Réu:* ${audiencia.reu}\n*Representa:* ${audiencia.parteRepresentada}\n*Dia:* ${audiencia.data}\n*Horário:* ${audiencia.horario}\n*Comarca:* ${audiencia.comarca}\n*Processo:* ${audiencia.processo && audiencia.processo !== '' ? audiencia.processo : '—'}`;
    await ctx.editMessageText(texto, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'pauta_do_dia')]
      ]).reply_markup
    });
  });
  console.log('⚙️ pautaDoDiaHandler carregado ✅');

  bot.action('pauta_do_dia', async (ctx) => {
    try {
      const userId = ctx.from.id;

      // Definição de intervalo (hoje até amanhã)
      const hoje = new Date();
      const amanha = new Date();
      amanha.setDate(hoje.getDate() + 1);

      const inicio = new Date(hoje.setHours(0, 0, 0, 0));
      const fim = new Date(amanha.setHours(23, 59, 59, 999));

      console.log(`📅 Buscando eventos entre ${inicio} e ${fim} para o usuário ${userId}`);

      // Busca no banco
      const [audiencias, pericias] = await Promise.all([
        Audiencia.find({ userId, dia: { $gte: inicio, $lte: fim } }).lean(),
        Pericia.find({ userId, dia: { $gte: inicio, $lte: fim } }).lean()
      ]);

      // Nenhum evento encontrado
      if (!audiencias.length && !pericias.length) {
        return ctx.editMessageText(
          '📭 Nenhuma audiência ou perícia encontrada para hoje e amanhã.',
          Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'voltar_menu_inicial')]])
        );
      }

      // Montagem da mensagem
      let mensagem = '📅 *Pauta do Dia (Hoje e Amanhã)*\n\n';
      const botoes = [];

      audiencias.forEach((a, index) => {
        const statusEmoji = a.status === 'concluida' ? '✅' : '⏳';
        mensagem += `${statusEmoji} Audiência ${index + 1}: ${a.autor} x ${a.reu}\n📅 ${a.dia.toLocaleDateString()} ⏰ ${a.horario} 📍 ${a.comarca}\n🧑‍💼 ${a.parteRepresentada}\n\n`;
        botoes.push([Markup.button.callback(`Audiência ${index + 1}`, `detalhe_audiencia_${a._id}`)]);
      });

      pericias.forEach((p, index) => {
        const statusEmoji = p.status === 'concluida' ? '✅' : '⏳';
        mensagem += `${statusEmoji} Perícia ${index + 1}: ${p.parte}\n📅 ${p.dia.toLocaleDateString()} ⏰ ${p.horario}\n\n`;
        botoes.push([Markup.button.callback(`Perícia ${index + 1}`, `detalhe_pericia_${p._id}`)]);
      });

      botoes.push([Markup.button.callback('⬅️ Voltar', 'voltar_menu_inicial')]);

      await ctx.editMessageText(mensagem, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(botoes)
      });

    } catch (err) {
      console.error('❌ Erro em pauta_do_dia:', err);
      await ctx.reply('⚠️ Ocorreu um erro ao carregar a pauta do dia.');
    }
  });

  // Voltar ao menu inicial
  bot.action('voltar_menu_inicial', async (ctx) => {
    resetState(ctx);
    await ctx.editMessageText('📋 Menu inicial:', initialMenu());
  });
}
