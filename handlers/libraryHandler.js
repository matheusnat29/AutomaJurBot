// handlers/libraryHandler.js
export function setupLibraryHandler(bot) {
  bot.action(/save_process_to_library_(.+)_(.+)/, async (ctx) => {
    await ctx.reply(`📁 Processo ${ctx.match[1]} salvo na biblioteca ${ctx.match[2]}`);
  });

  bot.action(/delete_process_(.+)_(.+)/, async (ctx) => {
    await ctx.reply(`🗑️ Processo ${ctx.match[1]} removido da biblioteca ${ctx.match[2]}`);
  });
}
