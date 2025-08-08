// utils/stateManager.js

const userHistory = new Map();

export function pushState(ctx, state, data = {}) {
  const userId = ctx.from.id;
  let history = userHistory.get(userId) || [];
  history.push({ state, data });
  userHistory.set(userId, history);
}

export function popState(ctx) {
  const userId = ctx.from.id;
  let history = userHistory.get(userId);
  if (history && history.length > 1) {
    history.pop();
    userHistory.set(userId, history);
  }
  return userHistory.get(userId);
}

export function getCurrentState(ctx) {
  const userId = ctx.from.id;
  const history = userHistory.get(userId);
  return history && history.length > 0 ? history[history.length - 1] : null;
}

export function getPreviousState(ctx) {
  const userId = ctx.from.id;
  const history = userHistory.get(userId);
  return history && history.length > 1 ? history[history.length - 2] : null;
}

// >>> NOVA FUNÇÃO PARA RESETAR ESTADOS <<<
export function resetState(ctx) {
  const userId = ctx.from.id;
  userHistory.set(userId, [{ state: 'main_menu' }]);
}
