export const ENTITY_KEYS = ['status', 'cyan', 'magenta', 'yellow', 'black', 'drum', 'total', 'color', 'bw', 'duplex'];
export const DEFAULT_PATTERNS = Object.freeze({
  no_paper: ['kein papier', 'no paper', 'no-paper', 'paper empty', 'out of paper', 'papier leer'],
  printing: ['printing', 'ausdruck', '=druckt'],
  powersave: ['powersave', 'power save', 'energiesparen', 'sleep', 'ruhezustand'],
  ready: ['=ready', '=bereit', '=idle'],
  tray1: ['*z1*', '*fach 1*', '*tray 1*', '*tray1*'],
  tray2: ['*z2*', '*fach 2*', '*tray 2*', '*tray2*'],
});
export const TEXT = {
  de: {title:'Drucker',status:'Status',cyan:'Cyan',magenta:'Magenta',yellow:'Gelb',black:'Schwarz',drum:'Trommel verbleibend',total:'Gesamtseiten',color:'Farbseiten',bw:'S/W-Seiten',duplex:'Duplex',ready:'Bereit',printing:'Druckt',powersave:'Energiesparen',no_paper:'Kein Papier',tray1:'Fach 1',tray2:'Fach 2',unknown:'Unbekannt',unavailable:'Nicht verfügbar',low:'Niedrig',setup:'Entitäten im Karteneditor auswählen',missing:'Entität nicht gefunden',more:'Details'},
  en: {title:'Printer',status:'Status',cyan:'Cyan',magenta:'Magenta',yellow:'Yellow',black:'Black',drum:'Drum remaining',total:'Total pages',color:'Color pages',bw:'B/W pages',duplex:'Duplex',ready:'Ready',printing:'Printing',powersave:'Power save',no_paper:'No paper',tray1:'Tray 1',tray2:'Tray 2',unknown:'Unknown',unavailable:'Unavailable',low:'Low',setup:'Select entities in the card editor',missing:'Entity not found',more:'Details'},
};
export function language(config, hass) {
  return config.language === 'auto' ? (hass?.language?.startsWith('de') ? 'de' : 'en') : config.language;
}
export function normalizeConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Printer Card: configuration must be an object');
  const config = {name:'',language:'auto',animation:true,toner_warning:true,warning_threshold:20,...structuredClone(input)};
  if (!['auto','de','en'].includes(config.language)) throw new Error('language: auto, de or en');
  if (typeof config.name !== 'string') throw new Error('name must be a string');
  for (const key of ['animation','toner_warning']) if (typeof config[key] !== 'boolean') throw new Error(`${key} must be true or false`);
  if (typeof config.warning_threshold !== 'number' || !Number.isFinite(config.warning_threshold) || config.warning_threshold < 0 || config.warning_threshold > 100) throw new Error('warning_threshold must be 0–100');
  if (config.entities != null && (typeof config.entities !== 'object' || Array.isArray(config.entities))) throw new Error('entities must be an object');
  config.entities = {...config.entities};
  for (const key of ENTITY_KEYS) {
    const id = config.entities[key];
    if (id != null && typeof id !== 'string') throw new Error(`entities.${key} must be an entity ID`);
    if (id) config.entities[key] = id.trim();
  }
  if (config.status_patterns != null && (typeof config.status_patterns !== 'object' || Array.isArray(config.status_patterns))) throw new Error('status_patterns must be an object');
  config.status_patterns = {...config.status_patterns};
  for (const key of Object.keys(DEFAULT_PATTERNS)) {
    const patterns = config.status_patterns[key] ?? DEFAULT_PATTERNS[key];
    if (!Array.isArray(patterns) || patterns.some(p => typeof p !== 'string' || p.length > 200)) throw new Error(`status_patterns.${key}: use an array of strings (max. 200 characters per pattern)`);
    config.status_patterns[key] = [...patterns];
  }
  return config;
}
// Literal substring by default; '=' means exact, '*' and '?' are safe glob wildcards.
export function matches(value, patterns) {
  const text = String(value ?? '').trim().toLowerCase();
  return patterns.some(raw => {
    const p = raw.trim().toLowerCase();
    if (!p) return false;
    if (p.startsWith('=')) return text === p.slice(1);
    if (!/[?*]/.test(p)) return text.includes(p);
    // Linear-space wildcard matching; no user-supplied regular expressions.
    let row = Array(text.length + 1).fill(false); row[0] = true;
    for (const ch of p) {
      const next = Array(text.length + 1).fill(false);
      next[0] = ch === '*' && row[0];
      for (let j=1;j<=text.length;j++) next[j] = ch === '*' ? next[j-1] || row[j] : row[j-1] && (ch === '?' || ch === text[j-1]);
      row = next;
    }
    return row[text.length];
  });
}
export function classifyStatus(raw, config) {
  const state = String(raw ?? '').trim();
  if (!state || state === 'unknown') return {kind:'unknown',trays:[]};
  if (state === 'unavailable') return {kind:'unavailable',trays:[]};
  const kind = ['no_paper','printing','powersave','ready'].find(k => matches(state,config.status_patterns[k])) ?? 'other';
  return {kind,trays:kind === 'no_paper' ? ['tray1','tray2'].filter(k=>matches(state,config.status_patterns[k])) : []};
}
export function percentage(raw) {
  if (raw == null || !String(raw).trim()) return null;
  const value = Number(String(raw).trim().replace(/%$/, '').trim().replace(',', '.'));
  return Number.isFinite(value) ? Math.min(100,Math.max(0,value)) : null;
}
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function displayState(entity, locale) {
  if (!entity || ['unknown','unavailable',''].includes(entity.state)) return '—';
  const number = Number(entity.state);
  const value = entity.state.trim() && Number.isFinite(number) ? new Intl.NumberFormat(locale).format(number) : entity.state;
  const originalUnit = entity.attributes?.unit_of_measurement;
  const unit = String(locale).startsWith('de') && /^pages?$/i.test(String(originalUnit ?? '').trim()) ? 'Seiten' : originalUnit;
  return `${value}${unit ? ' '+unit : ''}`;
}
