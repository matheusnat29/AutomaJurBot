// handlers/lawyerListaHandler.js
import { Markup } from 'telegraf';
import Advogado from '../database/models/Advogado.js';
import { lawyerMenu } from '../menu/lawyerMenu.js';

export function setupLawyerListaHandler(bot) {
  // Handler para excluir advogado
  bot.action(/excluir_advogado_(.+)/, async (ctx) => {
    const advId = ctx.match[1];
    try {
      const deleted = await Advogado.findByIdAndDelete(advId);
      if (deleted) {
        await ctx.answerCbQuery('Advogado excluído com sucesso!');
        // Atualiza a lista após exclusão
        await listarTodosAdvogados(ctx);
      } else {
        await ctx.answerCbQuery('Advogado não encontrado.', { show_alert: true });
      }
    } catch (err) {
      console.error('Erro ao excluir advogado:', err);
      await ctx.answerCbQuery('Erro ao excluir advogado.', { show_alert: true });
    }
  });
  console.log('⚙️ lawyerListaHandler carregado ✅');

  async function listarTodosAdvogados(ctx) {
    console.log('Handler de listagem chamado!');
    try {
      const advogados = await Advogado.find({}).lean();

      if (!advogados.length) {
        return ctx.editMessageText(
          '📭 Nenhum advogado cadastrado.',
          Markup.inlineKeyboard([
            [Markup.button.callback('➕ Cadastrar Advogado', 'register_lawyer')],
            [Markup.button.callback('⬅️ Voltar', 'back')]
          ])
        );
      }

      let mensagem = '*📋 Lista de Advogados*\n\n';
      const botoes = [];

      advogados.forEach((adv, index) => {
        mensagem += `*${index + 1}.* ${adv.nome} — OAB ${adv.oab}\n`;
        botoes.push([
          Markup.button.callback(`✏️ Editar ${adv.nome}`, `editar_advogado_${adv._id}`),
          Markup.button.callback(`🗑️ Excluir`, `excluir_advogado_${adv._id}`)
        ]);
      });

      botoes.push([Markup.button.callback('⬅️ Voltar', 'back')]);

      await ctx.editMessageText(mensagem, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(botoes)
      });

    } catch (error) {
      console.error('❌ Erro ao listar advogados:', error);
      await ctx.reply('⚠️ Ocorreu um erro ao listar os advogados.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
  }

  bot.action('listar_advogados', listarTodosAdvogados);
  bot.action('my_lawyers', listarTodosAdvogados);

  // Retornar ao menu de advogados
  bot.action('voltar_menu_advogados', async (ctx) => {
    await ctx.editMessageText('📋 Menu de advogados:', lawyerMenu());
  });
}
