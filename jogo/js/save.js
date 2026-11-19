// Progresso salvo no próprio aparelho (localStorage).
const KEY = 'estrela-de-belem-v1';
const fresh = () => ({ completed: [], stars: {}, pieces: [], sound: true });

function load() {
  try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch (e) { return fresh(); }
}
export const save = load();
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* modo privado: segue sem salvar */ }
}
