// handlers/audienciaPericiaListaHandler.js
import { Markup } from 'telegraf';
import { getAllAudiencias, getAllPericias } from '../database/services/audienciaService.js';
import { pushState, popState } from '../utils/stateManager.js';

export function setupAudienciaPericiaListaHandler(bot) {
  console.log('📂 audienciaPericiaListaHandler carregado ✅');

  bot.action('all_audiencias_pericias', async (ctx) => {
    try {
      console.log(`📂 Usuário ${ctx.from.id} abriu "Todas as Audiências e Perícias"`);

      pushState(ctx, 'viewing_all_audiencias_pericias');

      const audiencias = await getAllAudiencias(ctx.from.id);
      const pericias = await getAllPericias(ctx.from.id);

      if ((!audiencias || audiencias.length === 0) && (!pericias || pericias.length === 0)) {
        return ctx.editMessageText(
          '📂 Nenhuma audiência ou perícia cadastrada.',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Voltar', 'audiencias_menu')],
            [Markup.button.callback('⬅️ Voltar', 'back')]
          ])
        );
      }

      let message = '📂 **Todas as Audiências e Perícias**\n\n';

      const itens = [...audiencias.map(a => ({ ...a, tipo: 'audiência' })), ...pericias.map(p => ({ ...p, tipo: 'perícia' }))];

      itens.forEach((item, index) => {
        const statusEmoji = item.concluida ? '✅' : '⏳';
        const parteEmoji = `🧑‍💼 ${item.parteRepresentada || ''}`;
        const descricao = item.tipo === 'audiência'
          ? `${item.autor} x ${item.reu}`
          : `${item.nomeParte}`;

        message += `${index + 1}. ${statusEmoji} ${descricao}\n   ${parteEmoji}\n   📅 ${item.data} ⏰ ${item.hora}\n   📍 ${item.comarca || '—'}\n\n`;
      });

      await ctx.editMessageText(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            ...itens.map((item, idx) => [
              Markup.button.callback(`✏️ Editar ${idx + 1}`, `editar_item_${item._id}`),
              Markup.button.callback(`🗑️ Excluir ${idx + 1}`, `excluir_item_${item._id}`),
              Markup.button.callback(`⏰ Lembrete ${idx + 1}`, `lembrete_item_${item._id}`)
            ]),
            [Markup.button.callback('⬅️ Voltar', 'audiencias_menu')]
          ])
        }
      );
    } catch (error) {
      console.error('❌ Erro ao carregar todas as audiências e perícias:', error);
      ctx.reply('⚠️ Ocorreu um erro ao carregar todas as audiências e perícias.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
  });
}
