// handlers/lawyerHandler.js
import { Markup } from 'telegraf';
import { pushState, resetState, isInState } from '../utils/stateManager.js';
import { checkOAB } from '../scrapers/checkOAB.js';
import Advogado from '../database/models/Advogado.js';
import { initialMenu } from '../menu/initialMenu.js';

// Cache de resultados de OAB por usuário (em memória)
const oabResultsCache = new Map();

export function setupLawyerHandler(bot) {
  console.log('⚙️ lawyerHandler carregado ✅');

  // inicia fluxo
  bot.action('register_lawyer', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    pushState(ctx, 'awaiting_oab');
    try {
      await ctx.editMessageText(
        '✏️ Digite o número da OAB para buscar o advogado:',
        Markup.inlineKeyboard([[Markup.button.callback('❌ Cancelar', 'cancel_register_lawyer')]])
      );
    } catch (err) {
      await ctx.reply(
        '✏️ Digite o número da OAB para buscar o advogado:',
        Markup.inlineKeyboard([[Markup.button.callback('❌ Cancelar', 'cancel_register_lawyer')]])
      );
    }
  });

  bot.action('cancel_register_lawyer', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    resetState(ctx);
    oabResultsCache.delete(ctx.from.id);
    await initialMenu(ctx, '❌ Cadastro cancelado.');
  });

  // captura texto (número da OAB) apenas quando o usuário estiver no estado correto
  bot.on('text', async (ctx, next) => {
    if (!isInState(ctx, 'awaiting_oab')) return next();

    const oabNumber = ctx.message.text.trim();
    if (!/^\d+$/.test(oabNumber)) {
      return ctx.reply('⚠️ O número da OAB deve conter apenas dígitos. Tente novamente:');
    }

    try {
      await ctx.reply(`⏳ Buscando dados para OAB ${oabNumber}...`);
      const results = await checkOAB(oabNumber);

      if (!results || results.length === 0) {
        return ctx.reply('⚠️ Nenhum advogado encontrado com esse número. Verifique e tente novamente.');
      }

      // salvar no cache por usuário
      oabResultsCache.set(ctx.from.id, results);

      // montar botões com os mesmos campos que serão salvos no DB (nome / oab)
      const buttons = results.map((adv, idx) => [
        Markup.button.callback(`${adv.nome} — ${adv.oab}`, `select_lawyer_${idx}`)
      ]);

      await ctx.reply('👨‍⚖️ Selecione o advogado encontrado:', Markup.inlineKeyboard(buttons));

    } catch (err) {
      console.error(`❌ Erro ao buscar OAB ${oabNumber}:`, err);
      ctx.reply('🚨 Erro ao buscar dados no site da OAB. Tente novamente mais tarde.');
    }
  });

  // selecionar um dos resultados e salvar no banco
  bot.action(/select_lawyer_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    if (!isInState(ctx, 'awaiting_oab')) {
      return ctx.reply('⚠️ A seleção de advogado não está ativa no momento.');
    }

    const index = parseInt(ctx.match[1], 10);
    const selected = oabResultsCache.get(ctx.from.id)?.[index];

    if (!selected) {
      return ctx.reply('⚠️ O advogado selecionado não foi encontrado na memória. Tente novamente.');
    }

    try {
      const novoAdv = new Advogado({
        nome: selected.nome,
        oab: selected.oab,
        telegramId: ctx.from.id,
        email: ''
      });

      const saved = await novoAdv.save();
      console.log(`✅ Advogado ${selected.nome} cadastrado para usuário ${ctx.from.id}`);
      console.log('Advogado salvo no banco:', saved);

      // limpar estado/cache e voltar ao menu
      resetState(ctx);
      oabResultsCache.delete(ctx.from.id);

      await initialMenu(ctx, `✅ Advogado ${selected.nome} cadastrado com sucesso!`);
    } catch (err) {
      console.error('❌ Erro ao salvar advogado:', err);
      ctx.reply('🚨 Erro ao salvar o advogado no banco de dados.');
    }
  });
}
