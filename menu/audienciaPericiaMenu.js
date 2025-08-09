// menu/audienciaPericiaMenu.js
import { Markup } from 'telegraf';

export function audienciaPericiaMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📅 Pauta do Dia', 'pauta_dia')],
    [Markup.button.callback('📂 Todas as Audiências/Perícias', 'todas_audiencias')],
    [Markup.button.callback('➕ Cadastrar Nova Audiência', 'add_audiencia')],
    [Markup.button.callback('🧪 Cadastrar Nova Perícia', 'add_pericia')],
    [Markup.button.callback('🖨️ Gerar PDF da Pauta do Dia', 'gerar_pdf')],
    [Markup.button.callback('⏰ Lembrete Interno', 'agendar_lembrete_interno')],
    [Markup.button.callback('⏰ Lembrete Google Calendar', 'agendar_lembrete')],
    [Markup.button.callback('⬅️ Voltar', 'back')]
  ]);
}
