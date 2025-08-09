// handlers/todasAudienciasHandler.js

import { Markup } from 'telegraf';
import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';

export function setupTodasAudienciasHandler(bot) {
  // Ação do menu inicial
  bot.action('all_audiencias', async (ctx) => {
    const userId = ctx.from.id;
    console.log('📂 Ação "Todas as Audiências e Perícias" acionada');

    const audiencias = await Audiencia.find({ userId }).sort({ dia: 1 });

    if (audiencias.length === 0) {
      return ctx.editMessageText('📭 Nenhuma audiência ou perícia cadastrada.');
    }

    const buttons = audiencias.map((aud, index) => {
  const statusEmoji = aud.concluida ? '✅' : '⚖️';
  // Não mostrar o número do processo no resumo
  const textoBotao = `${statusEmoji} ${index + 1}. ${aud.autor} x ${aud.reu} | ${aud.dia} ${aud.horario}`;
  // Remover qualquer ocorrência de processo do texto do botão
  return [Markup.button.callback(textoBotao.replace(/Proc\.?\s*[:=]?\s*[^|]+\|?/gi, ''), `ver_audiencia_${aud._id}`)];
    });

    await ctx.editMessageText('📂 *Todas as Audiências/Perícias:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([...buttons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
    });
  });

  // Ver detalhes de uma audiência da lista
  bot.action(/ver_audiencia_(.+)/, async (ctx) => {
    const audienciaId = ctx.match[1];
    const audiencia = await Audiencia.findById(audienciaId);

    if (!audiencia) {
      return ctx.editMessageText('❌ Audiência não encontrada.');
    }

    pushState(ctx, 'visualizando_audiencia', { audienciaId });

  const texto = `
*Autor:* ${audiencia.autor}
*Réu:* ${audiencia.reu}
*Representa:* ${audiencia.parteRepresentada}
*Dia:* ${audiencia.data}
*Horário:* ${audiencia.horario}
*Comarca:* ${audiencia.comarca}
*Processo:* ${audiencia.processo && audiencia.processo !== '' ? audiencia.processo : '—'}`;

    await ctx.editMessageText(texto, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Editar', `editar_audiencia_${audienciaId}`),
          Markup.button.callback('⏰ Definir Lembrete', `lembrete_audiencia_${audienciaId}`)
        ],
        [
          Markup.button.callback('🗑️ Excluir', `confirm_delete_audiencia_${audienciaId}`)
        ],
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });
}
