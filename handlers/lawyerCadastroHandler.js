// handlers/lawyerCadastroHandler.js
import { Markup } from 'telegraf';
import Advogado from '../database/models/Advogado.js';
import { pushState, resetState, isInState } from '../utils/stateManager.js';
import { lawyerMenu } from '../menu/lawyerMenu.js';

export function setupLawyerCadastroHandler(bot) {
  console.log('⚙️ lawyerCadastroHandler carregado ✅');

  // Início do cadastro
  bot.action('cadastrar_advogado', async (ctx) => {
    resetState(ctx);
    pushState(ctx, 'aguardando_nome_advogado');

    const message = '🧑‍⚖️ Informe o *nome completo* do advogado:';
    const keyboard = { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) };
    try {
      await ctx.editMessageText(message, keyboard);
    } catch {
      await ctx.reply(message, keyboard);
    }
  });

  // Receber mensagens de texto conforme o estado
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    ctx.session = ctx.session || {};

    // Nome do advogado
    if (isInState(ctx, 'aguardando_nome_advogado')) {
      const nome = ctx.message.text.trim();
      if (!nome) {
        return ctx.reply('⚠️ O nome não pode estar vazio. Digite novamente.',
          { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      }

      ctx.session.advogadoCadastro = { nome };
      pushState(ctx, 'aguardando_oab_advogado');
      return ctx.reply('📜 Informe o número da *OAB* (apenas números):',
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
      );
    }

    // Número da OAB
    if (isInState(ctx, 'aguardando_oab_advogado')) {
      const oab = ctx.message.text.replace(/\D/g, '');
      if (!oab) {
        return ctx.reply('⚠️ O número da OAB não pode estar vazio. Digite novamente.',
          { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      }

      ctx.session.advogadoCadastro.oab = oab;
      pushState(ctx, 'aguardando_uf_advogado');
      return ctx.reply('🌎 Informe a *UF* (estado) da OAB:',
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
      );
    }

    // UF do advogado (salva no banco)
    if (isInState(ctx, 'aguardando_uf_advogado')) {
      const uf = ctx.message.text.trim().toUpperCase();
      if (!uf || uf.length !== 2) {
        return ctx.reply('⚠️ A UF deve ter 2 letras. Digite novamente.',
          { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      }

      ctx.session.advogadoCadastro.uf = uf;

      try {
        const advogado = new Advogado({
          userId,
          nome: ctx.session.advogadoCadastro.nome,
          oab: ctx.session.advogadoCadastro.oab,
          uf: ctx.session.advogadoCadastro.uf
        });

        await advogado.save();
        console.log(`✅ Advogado ${ctx.session.advogadoCadastro.nome} cadastrado para usuário ${userId}`);

        resetState(ctx);
        delete ctx.session.advogadoCadastro;

        return ctx.reply('✅ Advogado cadastrado com sucesso!',
          { ...lawyerMenu(), ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      } catch (error) {
        console.error('❌ Erro ao salvar advogado:', error);
        return ctx.reply('⚠️ Ocorreu um erro ao salvar o advogado. Tente novamente.',
          { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      }
    }

    return next();
  });

  // Cancelar cadastro
  bot.action('cancelar_cadastro_advogado', async (ctx) => {
    resetState(ctx);
    try {
      await ctx.editMessageText('📋 Menu de advogados:', { ...lawyerMenu(), ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) });
    } catch {
      await ctx.reply('📋 Menu de advogados:', { ...lawyerMenu(), ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) });
    }
  });
}
