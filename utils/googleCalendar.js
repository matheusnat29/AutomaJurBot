// utils/googleCalendar.js
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = ['https://www.googleapis.com/auth/calendar.events'];

export const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
  redirect_uri: process.env.GOOGLE_REDIRECT_URI
});

/**
 * Troca o código de autorização pelos tokens do Google
 * @param {string} code - Código retornado pelo Google OAuth
 * @returns {object} Tokens de acesso e atualização
 */
export async function exchangeCodeForTokens(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (err) {
    console.error('❌ Erro ao trocar código por tokens:', err);
    throw err;
  }
}

/**
 * Cria um evento no Google Calendar
 * @param {object} tokens - Tokens de autenticação do usuário
 * @param {object} pauta - Dados da pauta/audiência
 */
export async function createGoogleCalendarEvent(tokens, pauta) {
  if (!tokens) {
    throw new Error('Usuário não autenticado.');
  }

  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const [day, month, year] = pauta.dia.split('/');
  const [hour, minute] = pauta.horario.split(':');
  const isoDate = new Date(year, month - 1, day, hour, minute).toISOString();

  const event = {
    summary: `Audiência: ${pauta.poloAtivo} x ${pauta.poloPassivo}`,
    description: `Comarca: ${pauta.comarca}\nNota: ${pauta.nota || 'N/A'}`,
    start: {
      dateTime: isoDate,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: new Date(new Date(isoDate).getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return response.data;
}
