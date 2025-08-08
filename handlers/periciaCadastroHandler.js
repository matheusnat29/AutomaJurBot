// handlers/periciaCadastroHandler.js

import { Markup } from 'telegraf';
import { pushState, popState, getCurrentState } from '../utils/stateManager.js';
import Pericia from '../database/models/Pericia.js';

export function setupPericiaCadastroHandler(bot) {
  bot.action('cadastrar_nova_pericia', async (ctx) => {
    console.log('🧪 Iniciando cadastro de nova perícia');
    pushState(ctx, 'awaiting_pericia_nome_parte');
    await ctx.editMessageText('👤 Informe o nome da parte relacionada à perícia:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    const current = getCurrentState(ctx);

    if (!current) return next();

    switch (current.state) {
      case 'awaiting_pericia_nome_parte': {
        pushState(ctx, 'awaiting_pericia_data', { nomeParte: text });
        await ctx.reply('📅 Informe o dia da perícia (formato: DD/MM/AAAA):', Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
        break;
      }
      case 'awaiting_pericia_data': {
        current.data.data = text;
        pushState(ctx, 'awaiting_pericia_horario', current.data);
        await ctx.reply('⏰ Informe o horário da perícia (ex: 14:00):', Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
        break;
      }
      case 'awaiting_pericia_horario': {
        const { nomeParte, data } = current.data;
        const horario = text;

        try {
          await Pericia.create({ userId, nomeParte, data, horario });
          console.log('✅ Perícia salva no banco de dados');
          popState(ctx); // remove horario
          popState(ctx); // remove data
          popState(ctx); // remove nomeParte

          await ctx.reply('✅ Perícia cadastrada com sucesso!', {
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.callback('⬅️ Voltar ao menu', 'back')]
            ])
          });
        } catch (error) {
          console.error('❌ Erro ao salvar perícia:', error);
          await ctx.reply('❌ Ocorreu um erro ao salvar a perícia.');
        }
        break;
      }
      default:
        return next();
    }
  });
}