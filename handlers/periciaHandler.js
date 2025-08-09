// handlers/periciaHandler.js

import { Markup } from 'telegraf';
import { pushState, getCurrentState, popState } from '../utils/stateManager.js';
import Pericia from '../database/models/Pericia.js';

export function setupPericiaHandler(bot) {
  bot.action('cadastrar_pericia', async (ctx) => {
    console.log('🧪 Ação cadastrar_pericia acionada');
    pushState(ctx, 'pericia_nome_parte');
    await ctx.editMessageText('👤 Qual o nome da parte envolvida na perícia?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  bot.on('text', async (ctx, next) => {
    const current = getCurrentState(ctx);
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();

    if (!current) return next();

    switch (current.state) {
      case 'pericia_nome_parte': {
        console.log('✏️ Parte informada:', text);
        pushState(ctx, 'pericia_data', { nomeParte: text });
        await ctx.reply('📅 Qual a data da perícia? (formato DD/MM/AAAA)', Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
        break;
      }

      case 'pericia_data': {
        console.log('📅 Data informada:', text);
        current.data.data = text;
        pushState(ctx, 'pericia_horario', current.data);
        await ctx.reply('⏰ Qual o horário da perícia? (formato HH:MM)', Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
        break;
      }

      case 'pericia_horario': {
        console.log('⏰ Horário informado:', text);
        const { nomeParte, data } = current.data;

        try {
          await Pericia.create({ userId, nomeParte, data, horario: text });
          console.log('✅ Perícia salva no banco de dados');
          await ctx.reply('✅ Perícia cadastrada com sucesso!', Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Voltar ao menu', 'back')],
            [Markup.button.callback('⬅️ Voltar', 'back')]
          ]));
        } catch (err) {
          console.error('❌ Erro ao salvar perícia:', err);
          await ctx.reply('❌ Erro ao salvar perícia.',
            Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
          );
        }

        popState(ctx);
        break;
      }

      default:
        return next();
    }
  });
}
