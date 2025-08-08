// handlers/lawyerHandler.js

import { pushState, getCurrentState, popState } from '../utils/stateManager.js';
import { checkOAB } from '../scrapers/oab.js';
import Advogado from '../database/models/Advogado.js';
import { initialMenu } from '../menu/initialMenu.js';
import { Markup } from 'telegraf';

export const oabResultsCache = new Map();

export function setupLawyerHandlers(bot) {
  // Inicia o cadastro
  bot.action('register_lawyer', async (ctx) => {
    console.log('🟢 Ação register_lawyer acionada');
    pushState(ctx, 'awaiting_oab');
    await ctx.reply('🆔 Envie o número da OAB que você deseja consultar (somente números).', Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'back')]
    ]));
  });

  // Recebe o número da OAB
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    const currentState = getCurrentState(ctx);

    if (!currentState || currentState.state !== 'awaiting_oab') return next();

    if (!/^\d+[A-Z\-]*$/i.test(text)) {
      console.log('⚠️ OAB inválida:', text);
      await ctx.reply('❌ O número da OAB deve conter apenas números (e opcionalmente letras como "E").');
      return;
    }

    try {
      console.log('🔍 Buscando dados da OAB para:', text);
      await ctx.reply('🔍 Consultando o site da OAB...');
      const resultados = await checkOAB(text);

      if (!resultados || resultados.length === 0) {
        await ctx.reply('❌ Nenhum resultado encontrado.');
        popState(ctx);
        return;
      }

      console.log(`✅ ${resultados.length} resultados encontrados`);
      oabResultsCache.set(userId, resultados);
      pushState(ctx, 'selecting_advogado');

      const buttons = resultados.map((adv, index) => [
        Markup.button.callback(`${index + 1}. ${adv.name} (${adv.inscription})`, `select_advogado_${index}`)
      ]);

      await ctx.reply('👤 Selecione o advogado que deseja cadastrar:', Markup.inlineKeyboard([
        ...buttons,
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]));
    } catch (error) {
      console.error('❌ Erro ao consultar OAB:', error);
      await ctx.reply('❌ Ocorreu um erro durante a consulta.');
      popState(ctx);
    }
  });

  // Seleciona o advogado e pergunta se deseja confirmar
  bot.action(/select_advogado_(\d+)/, async (ctx) => {
    const userId = ctx.from.id;
    const index = parseInt(ctx.match[1], 10);
    const resultados = oabResultsCache.get(userId);

    if (!resultados || !resultados[index]) {
      console.log('⚠️ Advogado não encontrado no cache');
      return;
    }

    const advogado = resultados[index];
    console.log('🔎 Advogado selecionado:', advogado);

    pushState(ctx, 'confirming_advogado', { advogado });

    await ctx.editMessageText(
      `Deseja cadastrar o advogado *${advogado.name}* (${advogado.inscription})?`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Confirmar', 'confirm_register_lawyer')],
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]).reply_markup
      }
    );
  });

  // Confirma cadastro do advogado
  bot.action('confirm_register_lawyer', async (ctx) => {
    const userId = ctx.from.id;
    const current = getCurrentState(ctx);
    const advogado = current?.data?.advogado;

    console.log('📦 Dados do advogado recuperados:', advogado);

    if (!advogado || !advogado.name || !advogado.inscription) {
      console.error('❌ Dados do advogado estão incompletos ou ausentes:', advogado);
      return ctx.reply('❌ Não foi possível cadastrar o advogado. Dados ausentes.');
    }

    try {
      const exists = await Advogado.findOne({
        userId,
        inscription: advogado.inscription
      });

      if (exists) {
        await ctx.editMessageText('⚠️ Este advogado já está cadastrado.', initialMenu());
      } else {
        await new Advogado({
          userId,
          name: advogado.name,
          inscription: advogado.inscription
        }).save();

        await ctx.editMessageText(`✅ Advogado *${advogado.name}* cadastrado com sucesso!`, {
          parse_mode: 'Markdown',
          ...initialMenu()
        });
      }
    } catch (err) {
      console.error('❌ Erro ao salvar advogado:', err);
      await ctx.reply('❌ Erro ao salvar advogado.');
    }

    popState(ctx);
    oabResultsCache.delete(userId);
  });

  // Lista os advogados
  bot.action('my_lawyers', async (ctx) => {
    const userId = ctx.from.id;
    const advogados = await Advogado.find({ userId });

    if (advogados.length === 0) {
      return ctx.editMessageText('📭 Você ainda não cadastrou nenhum advogado.', initialMenu());
    }

    const buttons = advogados.map((adv, idx) => [
      Markup.button.callback(`${idx + 1}. ${adv.name} (${adv.inscription})`, `confirm_delete_lawyer_${adv._id}`)
    ]);

    await ctx.editMessageText('👨‍⚖️ *Meus Advogados:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        ...buttons,
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]).reply_markup
    });
  });

  // Confirma a exclusão
  bot.action(/confirm_delete_lawyer_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    pushState(ctx, 'confirming_deletion', { id });

    await ctx.editMessageText('Tem certeza que deseja excluir este advogado?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim, excluir', `delete_lawyer_${id}`)],
        [Markup.button.callback('❌ Cancelar', 'back')]
      ]).reply_markup
    });
  });

  // Deleta o advogado
  bot.action(/delete_lawyer_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    await Advogado.findByIdAndDelete(id);
    await ctx.editMessageText('✅ Advogado excluído com sucesso.', initialMenu());
    popState(ctx);
  });
}
