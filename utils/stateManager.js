// utils/stateManager.js

// Armazena estados na memória (pode ser substituído por banco/Redis futuramente)
const userStates = new Map();

/**
 * Define o estado do usuário com dados extras.
 * @param {Object} ctx - Contexto do Telegraf
 * @param {string} state - Novo estado
 * @param {Object} [data={}] - Dados adicionais
 */
export function pushState(ctx, state, data = {}) {
  const userId = ctx?.from?.id;
  if (!userId) return;

  userStates.set(userId, { state, data });
}

/**
 * Remove o estado do usuário e retorna o que foi removido.
 * @param {Object} ctx - Contexto do Telegraf
 * @returns {Object|null} - Estado anterior
 */
export function popState(ctx) {
  const userId = ctx?.from?.id;
  if (!userId) return null;

  const prevState = userStates.get(userId) || null;
  userStates.delete(userId);
  return prevState;
}

/**
 * Reseta o estado do usuário (mesmo que popState, mas sem retorno).
 * @param {Object} ctx - Contexto do Telegraf
 */
export function resetState(ctx) {
  const userId = ctx?.from?.id;
  if (userId) {
    userStates.delete(userId);
  }
}

/**
 * Retorna o estado atual do usuário.
 * @param {Object} ctx - Contexto do Telegraf
 * @returns {Object|null} - Objeto com { state, data } ou null
 */
export function getCurrentState(ctx) {
  const userId = ctx?.from?.id;
  if (!userId) return null;

  return userStates.get(userId) || null;
}

/**
 * Verifica se o usuário está em um estado específico.
 * @param {Object} ctx - Contexto do Telegraf
 * @param {string} expectedState - Estado esperado
 * @returns {boolean}
 */
export function isInState(ctx, expectedState) {
  return getCurrentState(ctx)?.state === expectedState;
}
