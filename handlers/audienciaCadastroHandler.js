// handlers/audienciaCadastroHandler.js

import { Markup } from 'telegraf';
import { pushState, getCurrentState, popState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';

export function setupAudienciaCadastroHandler(bot) {
  bot.action('cadastrar_audiencia', async (ctx) => {
    console.log('📝 Iniciando cadastro de nova audiência');
    pushState(ctx, 'cadastrar_audiencia_nome_partes', {});
    await ctx.editMessageText('✍️ Informe o nome das partes (Autor x Réu):', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ])
    });
  });

  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    const current = getCurrentState(ctx);

    if (!current || !current.state.startsWith('cadastrar_audiencia')) return next();

    const state = current.state;
    const data = current.data || {};

    switch (state) {
      case 'cadastrar_audiencia_nome_partes': {
        data.partes = text;
        pushState(ctx, 'cadastrar_audiencia_representa', data);
        await ctx.reply('🧑‍⚖️ Qual parte você representa (autor ou réu)?', Markup.inlineKeyboard([
          [Markup.button.callback('Autor', 'representa_autor')],
          [Markup.button.callback('Réu', 'representa_reu')],
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
        break;
      }
    }
  });

  bot.action(/representa_(autor|reu)/, async (ctx) => {
    const representando = ctx.match[1];
    const current = getCurrentState(ctx);
    const data = current.data || {};

    data.representa = representando;
    pushState(ctx, 'cadastrar_audiencia_data', data);

    await ctx.editMessageText('📅 Informe o *dia* da audiência (formato: DD/MM/AAAA):', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ])
    });
  });

  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text.trim();
    const current = getCurrentState(ctx);
    if (!current || !current.state.startsWith('cadastrar_audiencia')) return next();
    const data = current.data || {};

    if (current.state === 'cadastrar_audiencia_data') {
      data.data = text;
      pushState(ctx, 'cadastrar_audiencia_hora', data);
      await ctx.reply('⏰ Informe o *horário* da audiência (ex: 14:30):', {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ])
      });
    } else if (current.state === 'cadastrar_audiencia_hora') {
      data.horario = text;
      pushState(ctx, 'cadastrar_audiencia_comarca', data);
      await ctx.reply('🏛️ Informe a *comarca* da audiência:', {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ])
      });
    } else if (current.state === 'cadastrar_audiencia_comarca') {
      data.comarca = text;

      try {
        await Audiencia.create({
          userId: ctx.from.id,
          partes: data.partes,
          representa: data.representa,
          data: data.data,
          horario: data.horario,
          comarca: data.comarca
        });

        console.log('✅ Audiência cadastrada:', data);

        popState(ctx);
        await ctx.reply('✅ Audiência cadastrada com sucesso!', {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Voltar ao Menu de Audiências', 'audiencias_pericias')]
          ])
        });
      } catch (error) {
        console.error('❌ Erro ao salvar audiência:', error);
        await ctx.reply('❌ Ocorreu um erro ao salvar a audiência.');
      }
    }
  });
}

console.log('[DEBUG] audienciaCadastroHandler exportado');
