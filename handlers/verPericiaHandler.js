// handlers/verPericiaHandler.js

import { Markup } from 'telegraf';
import Pericia from '../database/models/Pericia.js';
import { pushState, popState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupVerPericiaHandler(bot) {
  // Ver detalhes da perícia
  bot.action(/ver_pericia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    const pericia = await Pericia.findById(id);

    if (!pericia) {
      return ctx.editMessageText('❌ Perícia não encontrada.', initialMenu());
    }

    const { parte, data, horario, representada, status } = pericia;

    const emojiRepresentada = '🧑‍💼';
    const emojiStatus = status === 'concluida' ? '✅' : '⏳';

    const texto = `${emojiStatus} *Perícia:*

👤 Parte: ${parte}
${emojiRepresentada} Representando: ${representada}
📅 Data: ${data}
⏰ Horário: ${horario}`;

    pushState(ctx, 'viewing_pericia', { id });

    await ctx.editMessageText(texto, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Editar', `editar_pericia_${id}`)],
        [Markup.button.callback('🗑️ Excluir', `confirmar_exclusao_pericia_${id}`)],
        [Markup.button.callback('⏰ Definir Lembrete', `definir_lembrete_pericia_${id}`)],
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  // Confirmação da exclusão
  bot.action(/confirmar_exclusao_pericia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    pushState(ctx, 'confirming_deletion_pericia', { id });

    await ctx.editMessageText('⚠️ Tem certeza que deseja excluir esta perícia?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim, excluir', `excluir_pericia_${id}`)],
        [Markup.button.callback('❌ Cancelar', 'back')]
      ]).reply_markup
    });
  });

  // Exclusão da perícia
  bot.action(/excluir_pericia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    await Pericia.findByIdAndDelete(id);
    popState(ctx);
    await ctx.editMessageText('✅ Perícia excluída com sucesso.', initialMenu());
  });
}
