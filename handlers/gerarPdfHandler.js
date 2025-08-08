// handlers/gerarPdfHandler.js

import { Markup } from 'telegraf';
import Pericia from '../database/models/Pericia.js';
import Audiencia from '../database/models/Audiencia.js';
import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';
import { generatePdfFromData } from '../utils/pdfGenerator.js';
import fs from 'fs';

export function setupGerarPdfHandler(bot) {
  bot.action('gerar_pdf_pauta', async (ctx) => {
    console.log('📄 Gerando PDF da pauta do dia...');
    const userId = ctx.from.id;
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    const hojeInicio = new Date(hoje.setHours(0, 0, 0, 0));
    const amanhaFim = new Date(amanha.setHours(23, 59, 59, 999));

    try {
      const audiencias = await Audiencia.find({
        userId,
        dia: { $gte: hojeInicio, $lte: amanhaFim },
      });

      const pericias = await Pericia.find({
        userId,
        dia: { $gte: hojeInicio, $lte: amanhaFim },
      });

      if (audiencias.length === 0 && pericias.length === 0) {
        return await ctx.editMessageText('📭 Nenhuma audiência ou perícia encontrada para hoje ou amanhã.', initialMenu());
      }

      const pdfBuffer = await generatePdfFromData(audiencias, pericias);

      const filePath = `/tmp/pauta_${userId}.pdf`;
      fs.writeFileSync(filePath, pdfBuffer);

      await ctx.replyWithDocument({ source: filePath, filename: 'pauta-do-dia.pdf' });
      console.log('✅ PDF enviado com sucesso');

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      await ctx.reply('❌ Erro ao gerar PDF.');
    }
  });
}
