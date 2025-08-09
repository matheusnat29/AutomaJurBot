// handlers/periciaCadastroHandler.js
import { Markup } from 'telegraf';
import { pushState, popState, resetState, isInState } from '../utils/stateManager.js';
import Pericia from '../database/models/Pericia.js';
import { initialMenu } from '../menu/initialMenu.js';

export function setupPericiaCadastroHandler(bot) {
  console.log('⚙️ periciaCadastroHandler carregado ✅');

  // ➕ Cadastrar Nova Perícia
  bot.action('add_pericia', async (ctx) => {
    console.log(`📌 Usuário ${ctx.from?.id} iniciou cadastro de perícia`);
    await ctx.answerCbQuery();
    pushState(ctx, 'cadastro_pericia_nome');

    const message = '✏️ Informe o nome da parte:';
    try {
      await ctx.editMessageText(
        message,
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back_to_audiencia_menu')]])
      );
    } catch {
      await ctx.reply(
        message,
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back_to_audiencia_menu')]])
      );
    }
  });

  // Receber texto de cada etapa
  bot.on('text', async (ctx, next) => {
  ctx.session = ctx.session || {};
  ctx.session.pericia = ctx.session.pericia || {};
    const text = ctx.message.text?.trim();
    const userId = ctx.from?.id;
    if (!userId) return;

    // Etapa 1 - Nome da parte
    if (isInState(ctx, 'cadastro_pericia_nome')) {
  ctx.session = ctx.session || {};
  ctx.session.pericia = ctx.session.pericia || {};
  ctx.session.pericia = { ...ctx.session.pericia, nomeParte: text };
      pushState(ctx, 'cadastro_pericia_dia');
      console.log(`🖊 Nome recebido: ${text}`);

      return ctx.reply(
        '📅 Informe o dia da perícia (dd/mm/aaaa):',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back_to_pericia_nome')]
        ])
      );
    }

    // Etapa 2 - Dia
    if (isInState(ctx, 'cadastro_pericia_dia')) {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        console.log('⚠️ Data inválida');
        return ctx.reply('❌ Data inválida. Informe no formato dd/mm/aaaa:');
      }

  ctx.session.pericia = { ...ctx.session.pericia, dia: text };
      pushState(ctx, 'cadastro_pericia_hora');
      console.log(`📅 Dia registrado: ${text}`);

      return ctx.reply(
        '⏰ Informe o horário (HH:mm):',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Voltar', 'back_to_pericia_dia')]
        ])
      );
    }

    // Etapa 3 - Hora (Finalização)
    if (isInState(ctx, 'cadastro_pericia_hora')) {
      if (!/^\d{2}:\d{2}$/.test(text)) {
        console.log('⚠️ Hora inválida');
        return ctx.reply('❌ Hora inválida. Informe no formato HH:mm:');
      }

  ctx.session.pericia = { ...ctx.session.pericia, hora: text };

      try {
        const novaPericia = new Pericia({
          userId,
          nomeParte: ctx.session.pericia.nomeParte,
          data: ctx.session.pericia.dia,
          horario: ctx.session.pericia.hora
        });
        await novaPericia.save();
        console.log(`💾 Perícia salva no banco para usuário ${userId}`);
      } catch (err) {
        console.error('❌ Erro ao salvar perícia:', err);
        return ctx.reply('⚠️ Ocorreu um erro ao salvar a perícia. Tente novamente mais tarde.');
      }

      resetState(ctx);
      delete ctx.session.pericia;

      await ctx.reply('✅ Perícia cadastrada com sucesso!',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('🧪 Cadastrar Nova Perícia', 'add_pericia'),
            Markup.button.callback('✅ Concluir', 'menu_audiencia_pericia')
          ],
          [Markup.button.callback('⬅️ Voltar', 'back_to_audiencia_menu')]
        ])
      );
      return;
    }

    return next();
  });

  // Botões de voltar
  bot.action('back_to_pericia_nome', async (ctx) => {
    console.log('↩️ Voltando para etapa: Nome da parte');
    popState(ctx);
    await ctx.editMessageText(
      '✏️ Informe o nome da parte:',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back_to_audiencia_menu')]])
    );
  });

  bot.action('back_to_pericia_dia', async (ctx) => {
    console.log('↩️ Voltando para etapa: Dia da perícia');
    popState(ctx);
    await ctx.editMessageText(
      '📅 Informe o dia da perícia (dd/mm/aaaa):',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back_to_pericia_nome')]])
    );
  });

  bot.action('back_to_audiencia_menu', async (ctx) => {
    console.log('↩️ Voltando para menu Audiências e Perícias');
    resetState(ctx);
    await ctx.editMessageText('⏳ Audiências e Perícias', Markup.inlineKeyboard([
      [Markup.button.callback('📅 Pauta do Dia', 'pauta_dia')],
      [Markup.button.callback('📂 Todas as Audiências/Perícias', 'todas_audiencias')],
      [Markup.button.callback('➕ Cadastrar Nova Audiência', 'add_audiencia')],
      [Markup.button.callback('🧪 Cadastrar Nova Perícia', 'add_pericia')],
      [Markup.button.callback('🖨️ Gerar PDF da Pauta do Dia', 'gerar_pdf')],
      [Markup.button.callback('⏰ Lembretes Definidos', 'lembretes_definidos')],
      [Markup.button.callback('⬅️ Voltar ao Menu Inicial', 'back_to_main')]
    ]));
  });
}
