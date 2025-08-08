// handlers/scraperHandler.js
import { checkTJRJ } from '../scrapers/tj_rj.js';
import { checkDJEN } from '../scrapers/djen.js';
import { checkOAB } from '../scrapers/oab.js';

export function setupScraperHandlers(bot) {
  bot.action('search_oab_intimation', async (ctx) => {
    await ctx.reply('🔍 Buscando intimações na OAB...');
    const result = await checkOAB();
    await ctx.reply(result || 'Nenhuma intimação encontrada.');
  });

  bot.action('search_tjrj', async (ctx) => {
    await ctx.reply('🔍 Consultando TJ-RJ...');
    const result = await checkTJRJ();
    await ctx.reply(result || 'Nenhum processo encontrado.');
  });

  bot.action('search_djen', async (ctx) => {
    await ctx.reply('🔍 Consultando DJEN...');
    const result = await checkDJEN();
    await ctx.reply(result || 'Nenhuma publicação encontrada.');
  });
}
