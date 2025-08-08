// handlers/audienciaVisualizacaoHandler.js

import { Markup } from 'telegraf';
import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';
import { initialMenu } from '../menu/initialMenu.js';

function formatStatus(audiencia) {
  const statusEmoji = audiencia.status === 'concluida' ? '✅' : '⏳';
  const parteEmoji = '🧑‍💼';
  return `${statusEmoji} ${parteEmoji} ${audiencia.representa}`;
}

function formatLabel(audiencia, index) {
  return `${index + 1}. ${audiencia.autor} x ${audiencia.reu} - ${audiencia.dia} ${audiencia.horario} - ${audiencia.comarca}`;
}

export function setupAudienciaVisualizacaoHandler(bot) {
  // Pauta do Dia
  bot.action('pauta_dia', async (ctx) => {
    const userId = ctx.from.id;
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    const hojeISO = hoje.toISOString().split('T')[0];
    const amanhaISO = amanha.toISOString().split('T')[0];

    const audiencias = await Audiencia.find({
      userId,
      dia: { $in: [hojeISO, amanhaISO] },
    });

    if (audiencias.length === 0) {
      return ctx.editMessageText('📭 Nenhuma audiência para hoje ou amanhã.', initialMenu());
    }

    const buttons = audiencias.map((a, i) => [
      Markup.button.callback(formatLabel(a, i), `abrir_audiencia_${a._id}`),
    ]);

    await ctx.editMessageText('📅 *Pauta do Dia:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([...buttons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
    });
  });

  // Todas as Audiências
  bot.action('todas_audiencias', async (ctx) => {
    const userId = ctx.from.id;
    const audiencias = await Audiencia.find({ userId });

    if (audiencias.length === 0) {
      return ctx.editMessageText('📭 Nenhuma audiência cadastrada.', initialMenu());
    }

    const buttons = audiencias.map((a, i) => [
      Markup.button.callback(formatLabel(a, i), `abrir_audiencia_${a._id}`),
    ]);

    await ctx.editMessageText('📂 *Todas as Audiências:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([...buttons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
    });
  });

  // Abre uma audiência
  bot.action(/abrir_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    const audiencia = await Audiencia.findById(id);
    if (!audiencia) return ctx.reply('❌ Audiência não encontrada.');

    pushState(ctx, 'abrindo_audiencia', { id });

    await ctx.editMessageText(
      `📌 *Audiência*
${formatStatus(audiencia)}
👥 ${audiencia.autor} x ${audiencia.reu}
📅 ${audiencia.dia} às ${audiencia.horario}
🏛️ ${audiencia.comarca}`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✏️ Editar', `editar_audiencia_${id}`)],
          [Markup.button.callback('⏰ Definir Lembrete', `definir_lembrete_audiencia_${id}`)],
          [Markup.button.callback('🗑️ Excluir', `confirmar_excluir_audiencia_${id}`)],
          [Markup.button.callback('⬅️ Voltar', 'back')],
        ]).reply_markup,
      }
    );
  });

  // Confirma exclusão
  bot.action(/confirmar_excluir_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    pushState(ctx, 'confirmando_exclusao_audiencia', { id });
    await ctx.editMessageText('❓ Tem certeza que deseja excluir esta audiência?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim, excluir', `excluir_audiencia_${id}`)],
        [Markup.button.callback('❌ Cancelar', 'back')],
      ]).reply_markup,
    });
  });

  // Exclui audiência
  bot.action(/excluir_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    await Audiencia.findByIdAndDelete(id);
    await ctx.editMessageText('✅ Audiência excluída com sucesso.', initialMenu());
    popState(ctx);
  });
}
