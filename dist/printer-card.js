/*! Printer Card v1.0.0 | MIT License */
// model.js
const ENTITY_KEYS = ['status', 'cyan', 'magenta', 'yellow', 'black', 'drum', 'total', 'color', 'bw', 'duplex'];
const DEFAULT_PATTERNS = Object.freeze({
  no_paper: ['kein papier', 'no paper', 'no-paper', 'paper empty', 'out of paper', 'papier leer'],
  printing: ['printing', 'ausdruck', '=druckt'],
  powersave: ['powersave', 'power save', 'energiesparen', 'sleep', 'ruhezustand'],
  ready: ['=ready', '=bereit', '=idle'],
  tray1: ['*z1*', '*fach 1*', '*tray 1*', '*tray1*'],
  tray2: ['*z2*', '*fach 2*', '*tray 2*', '*tray2*'],
});
const TEXT = {
  de: {title:'Drucker',status:'Status',cyan:'Cyan',magenta:'Magenta',yellow:'Gelb',black:'Schwarz',drum:'Trommel verbleibend',total:'Gesamtseiten',color:'Farbseiten',bw:'S/W-Seiten',duplex:'Duplex',ready:'Bereit',printing:'Druckt',powersave:'Energiesparen',no_paper:'Kein Papier',tray1:'Fach 1',tray2:'Fach 2',unknown:'Unbekannt',unavailable:'Nicht verfügbar',low:'Niedrig',setup:'Entitäten im Karteneditor auswählen',missing:'Entität nicht gefunden',more:'Details'},
  en: {title:'Printer',status:'Status',cyan:'Cyan',magenta:'Magenta',yellow:'Yellow',black:'Black',drum:'Drum remaining',total:'Total pages',color:'Color pages',bw:'B/W pages',duplex:'Duplex',ready:'Ready',printing:'Printing',powersave:'Power save',no_paper:'No paper',tray1:'Tray 1',tray2:'Tray 2',unknown:'Unknown',unavailable:'Unavailable',low:'Low',setup:'Select entities in the card editor',missing:'Entity not found',more:'Details'},
};
function language(config, hass) {
  return config.language === 'auto' ? (hass?.language?.startsWith('de') ? 'de' : 'en') : config.language;
}
function normalizeConfig(input) {
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
function matches(value, patterns) {
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
function classifyStatus(raw, config) {
  const state = String(raw ?? '').trim();
  if (!state || state === 'unknown') return {kind:'unknown',trays:[]};
  if (state === 'unavailable') return {kind:'unavailable',trays:[]};
  const kind = ['no_paper','printing','powersave','ready'].find(k => matches(state,config.status_patterns[k])) ?? 'other';
  return {kind,trays:kind === 'no_paper' ? ['tray1','tray2'].filter(k=>matches(state,config.status_patterns[k])) : []};
}
function percentage(raw) {
  if (raw == null || !String(raw).trim()) return null;
  const value = Number(String(raw).trim().replace(/%$/, '').trim().replace(',', '.'));
  return Number.isFinite(value) ? Math.min(100,Math.max(0,value)) : null;
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function displayState(entity, locale) {
  if (!entity || ['unknown','unavailable',''].includes(entity.state)) return '—';
  const number = Number(entity.state);
  const value = entity.state.trim() && Number.isFinite(number) ? new Intl.NumberFormat(locale).format(number) : entity.state;
  return `${value}${entity.attributes?.unit_of_measurement ? ' '+entity.attributes.unit_of_measurement : ''}`;
}

// styles.js
const CARD_STYLE = `
:host{display:block;color:var(--primary-text-color,#202932);font-family:var(--paper-font-body1_-_font-family,system-ui,sans-serif)}
*{box-sizing:border-box}ha-card{display:block;padding:20px;border-radius:var(--ha-card-border-radius,18px);background:var(--ha-card-background,var(--card-background-color,#fff));border:1px solid var(--divider-color,#dce2e8);height:100%;overflow:hidden}
header{display:flex;align-items:center;gap:16px}h2{font-size:21px;line-height:1.3;margin:0;overflow-wrap:anywhere;font-weight:600}.printer{width:56px;height:56px;flex-shrink:0;color:var(--status-color)}
.status{color:var(--status-color);font-weight:600;text-align:center;margin:12px 0 0;overflow-wrap:anywhere}.raw{text-align:center;font-size:12px;color:var(--secondary-text-color,#687481);margin:4px 0 0;overflow-wrap:anywhere}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color,#008ac2);outline-offset:4px;border-radius:6px}.head-button{display:flex;align-items:center;gap:16px;text-align:left;width:100%}
.toners{display:flex;justify-content:space-evenly;gap:12px;margin:25px 0 20px}.toner{display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0}.letter{font-weight:800;font-size:16px;color:var(--toner)}.cartridge{position:relative;width:44px;height:100px;border:2px solid var(--secondary-text-color,#75808b);border-radius:7px;background:var(--divider-color,#e5e9ed);overflow:hidden}.fill{position:absolute;bottom:0;left:0;right:0;background:var(--toner);transition:height .6s ease}.shine{position:absolute;top:9px;left:6px;right:6px;height:3px;background:#ffffff60;border-radius:3px}.pct{font-size:15px;font-weight:600}.warning .cartridge{border-color:var(--error-color,#db4437)}.warning .pct,.low{color:var(--error-color,#db4437)}.low{font-size:11px;min-height:15px}.unknown .cartridge{background:repeating-linear-gradient(135deg,transparent,transparent 5px,#8882 5px,#8882 10px)}
.drum{border-top:1px solid var(--divider-color,#ddd);padding-top:15px;display:flex;justify-content:space-between;gap:12px;align-items:center;width:100%;text-align:left}.drum span{font-size:13px;color:var(--secondary-text-color,#687481)}.drum strong{overflow-wrap:anywhere;text-align:right}.stats{margin-top:18px;border-top:1px solid var(--divider-color,#ddd);padding-top:15px;display:grid;grid-template-columns:repeat(auto-fit,minmax(72px,1fr));gap:14px 8px}.stat{min-width:0}.stat span{display:block;font-size:11px;color:var(--secondary-text-color,#687481)}.stat strong{display:block;font-size:17px;margin-top:5px;overflow-wrap:anywhere}.note{font-size:13px;color:var(--secondary-text-color,#687481);margin:16px 0 0;overflow-wrap:anywhere}
.paper-slot{height:34px;overflow:hidden;display:flex;justify-content:center;margin-top:6px}.paper{height:25px;width:34px;border:1px solid #aeb6bf;background:white;border-radius:2px;animation:feed 1.3s infinite ease-in-out}.paper:after{content:'';display:block;width:20px;height:2px;background:#bbb;margin:6px auto;box-shadow:0 5px #bbb}.printing{animation:pulse 1s infinite ease-in-out}.warning.animate{animation:warn 1.4s infinite ease-in-out}
@keyframes pulse{50%{transform:scale(1.08)}}@keyframes feed{0%{transform:translateY(-8px);opacity:.3}50%{opacity:1}100%{transform:translateY(15px);opacity:0}}@keyframes warn{50%{opacity:.55}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
@media(max-width:350px){ha-card{padding:14px}h2{font-size:18px}.toners{gap:8px}.cartridge{width:38px}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
const EDITOR_STYLE = `
:host{display:block;font-family:system-ui,sans-serif;color:var(--primary-text-color,#202932)}*{box-sizing:border-box}fieldset{border:1px solid var(--divider-color,#ccc);border-radius:10px;margin:16px 0;padding:14px}legend{font-weight:600}label{display:block;font-size:13px;margin:12px 0 5px}input:not([type=checkbox]),select,textarea{display:block;width:100%;border:1px solid var(--divider-color,#aaa);border-radius:6px;background:var(--card-background-color,#fff);color:inherit;font:inherit;padding:10px}textarea{min-height:90px;resize:vertical}input:focus,textarea:focus,select:focus{outline:2px solid var(--primary-color,#008ac2)}.check{display:flex;gap:8px;align-items:center}p,small{line-height:1.5;color:var(--secondary-text-color,#667)}.error{color:var(--error-color,#c33)}button{padding:8px 12px;cursor:pointer;border-radius:6px;border:1px solid var(--divider-color,#aaa);background:var(--card-background-color,#fff);color:inherit}summary{cursor:pointer;padding:8px 0;font-weight:600}
`;

// editor.js
class PrinterCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this._config = normalizeConfig({}); }
  setConfig(config) { this._config = normalizeConfig(config); this._render(); }
  set hass(value) {
    const previousLanguage = language(this._config,this._hass);
    this._hass = value;
    if (!this.shadowRoot.querySelector('form') || previousLanguage !== language(this._config,value)) this._render();
    else this._updateEntities();
  }
  get hass() { return this._hass; }
  connectedCallback() { if (!this.shadowRoot.querySelector('form')) this._render(); }
  _updateEntities() {
    const ids = Object.keys(this._hass?.states ?? {}).sort();
    const signature = ids.map(id=>id+'\0'+(this._hass.states[id].attributes?.friendly_name ?? '')).join('\n');
    if (signature === this._entitySignature) return;
    this._entitySignature = signature;
    const list = this.shadowRoot.querySelector('datalist');
    if (list) list.innerHTML = ids.map(id=>`<option value="${escapeHTML(id)}">${escapeHTML(this._hass.states[id].attributes?.friendly_name ?? id)}</option>`).join('');
  }
  _emit(config) {
    this._config = normalizeConfig(config);
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));
  }
  _render() {
    const c=this._config, de=language(c,this._hass)==='de', t=TEXT[de?'de':'en'];
    this.shadowRoot.innerHTML=`<style>${EDITOR_STYLE}</style><form>
      <label for="name">${de?'Name':'Name'}</label><input id="name" data-key="name" value="${escapeHTML(c.name)}" placeholder="${t.title}">
      <label for="language">${de?'Sprache':'Language'}</label><select id="language" data-key="language">${[['auto','Auto'],['de','Deutsch'],['en','English']].map(([v,l])=>`<option value="${v}" ${c.language===v?'selected':''}>${l}</option>`).join('')}</select>
      <fieldset><legend>${de?'Entitäten':'Entities'}</legend><small>${de?'Alle Felder sind optional. ID eingeben oder Vorschlag auswählen. Leeres Feld blendet den Wert aus.':'All fields are optional. Enter an ID or select a suggestion. Empty fields hide the value.'}</small>
      <datalist id="entities"></datalist>${ENTITY_KEYS.map(key=>`<label for="entity-${key}">${t[key]}</label><input id="entity-${key}" data-entity="${key}" list="entities" autocomplete="off" spellcheck="false" value="${escapeHTML(c.entities[key] ?? '')}">`).join('')}</fieldset>
      <fieldset><legend>${de?'Darstellung':'Appearance'}</legend>
      <label class="check"><input type="checkbox" data-key="animation" ${c.animation?'checked':''}>${de?'Druck- und Warnanimationen':'Printing and warning animations'}</label>
      <label class="check"><input type="checkbox" data-key="toner_warning" ${c.toner_warning?'checked':''}>${de?'Tonerwarnung anzeigen':'Show low toner warning'}</label>
      <label for="threshold">${de?'Tonerwarnung ab ≤ (%)':'Toner warning at ≤ (%)'}</label><input id="threshold" type="number" min="0" max="100" step="any" data-key="warning_threshold" value="${c.warning_threshold}"></fieldset>
      <details><summary>${de?'Status-Erkennung anpassen':'Customize status matching'}</summary>
      <p>${de?'Ein Muster pro Zeile. Text = enthält; =bereit = exakter Status; * und ? = Platzhalter für den gesamten Status. Leere Liste deaktiviert eine Kategorie. Papierfehler haben Vorrang. Fachmuster gelten nur bei Papierfehlern.':'One pattern per line. Text = contains; =ready = exact state; * and ? = wildcards for the entire state. Empty lists disable a category. Paper errors take priority. Tray patterns only apply to paper errors.'}</p>
      ${Object.keys(DEFAULT_PATTERNS).map(key=>`<label for="pattern-${key}">${t[key]}</label><textarea id="pattern-${key}" data-pattern="${key}" spellcheck="false">${escapeHTML(c.status_patterns[key].join('\n'))}</textarea>`).join('')}
      <button type="button" id="reset">${de?'Standardmuster wiederherstellen':'Restore default patterns'}</button></details><p class="error" role="alert"></p></form>`;
    this._entitySignature=null; this._updateEntities();
    this.shadowRoot.querySelector('form').addEventListener('submit',e=>e.preventDefault());
    this.shadowRoot.querySelector('form').addEventListener('change',e=>{
      const el=e.target, config=structuredClone(this._config);
      if (el.dataset.entity) {
        if (el.value.trim()) config.entities[el.dataset.entity]=el.value.trim();
        else delete config.entities[el.dataset.entity];
      } else if(el.dataset.pattern) config.status_patterns[el.dataset.pattern]=el.value.split('\n').map(s=>s.trim()).filter(Boolean);
      else if(el.dataset.key) {
        if (el.type==='number' && (!el.value || !el.checkValidity())) {el.reportValidity();return;}
        config[el.dataset.key]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
      } else return;
      try {this._emit(config);this.shadowRoot.querySelector('.error').textContent='';if(el.dataset.key==='language')this._render();}
      catch(error){this.shadowRoot.querySelector('.error').textContent=error.message;}
    });
    this.shadowRoot.querySelector('#reset').addEventListener('click',()=>{this._emit({...this._config,status_patterns:structuredClone(DEFAULT_PATTERNS)});this._render();this.shadowRoot.querySelector('details').open=true;});
  }
}
if (!customElements.get('printer-card-editor')) customElements.define('printer-card-editor',PrinterCardEditor);

// card.js
const STATUS_COLORS={ready:'#4caf50',printing:'#03a9f4',powersave:'#9099a2',no_paper:'var(--error-color,#f44336)',unknown:'#9099a2',unavailable:'#9099a2',other:'#ef9a23'};
const TONERS=[['cyan','C','#00bcd4'],['magenta','M','#e91e63'],['yellow','Y','#fdd835'],['black','K','#616161']];
const PRINTER_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h12v5H6V3m12 13v5H6v-5h12m1-7a3 3 0 0 1 3 3v6h-3v-3H5v3H2v-6a3 3 0 0 1 3-3h14m-1 2v2h2v-2h-2M8 17v2h8v-2H8Z"/></svg>';
class PrinterCard extends HTMLElement {
  constructor() {
    super();this.attachShadow({mode:'open'});
    this.shadowRoot.addEventListener('click',event=>{
      const target=event.target.closest?.('[data-entity]');
      if(target?.dataset.entity)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:target.dataset.entity},bubbles:true,composed:true}));
    });
  }
  static getConfigElement(){return document.createElement('printer-card-editor');}
  static getStubConfig(){return {entities:{},animation:true,toner_warning:true,warning_threshold:20};}
  setConfig(config){this._config=normalizeConfig(config);this._render();}
  set hass(hass){
    const old=this._hass;this._hass=hass;
    if(!this._config)return;
    if(!old || old.language!==hass?.language || Object.values(this._config.entities).some(id=>old.states?.[id]!==hass?.states?.[id]))this._render();
  }
  get hass(){return this._hass;}
  getCardSize(){return 5;}
  getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
  _render(){
    if(!this._config)return;
    const c=this._config, lang=language(c,this._hass),t=TEXT[lang],e=c.entities,states=this._hass?.states ?? {};
    const statusEntity=states[e.status],raw=statusEntity?.state,status=classifyStatus(raw,c);
    const title=c.name || statusEntity?.attributes?.friendly_name || t.title;
    const statusText=status.kind==='other'?raw:(t[status.kind]+(status.trays.length?' · '+status.trays.map(k=>t[k]).join(' / '):''));
    const active=status.kind==='printing' && c.animation;
    const entityAttr=id=>id?`data-entity="${escapeHTML(id)}"`:'';
    const tonerMarkup=TONERS.filter(([key])=>e[key]).map(([key,letter,color])=>{
      const pct=percentage(states[e[key]]?.state),warning=c.toner_warning && pct!==null && pct<=c.warning_threshold;
      return `<button class="toner ${pct===null?'unknown':''} ${warning?'warning':''} ${c.animation?'animate':''}" style="--toner:${color}" ${entityAttr(e[key])} aria-label="${escapeHTML(t[key]+': '+(pct===null?t.unavailable:pct+'%')+(warning?' · '+t.low:''))}"><span class="letter">${letter}</span><span class="cartridge"><span class="fill" style="height:${pct ?? 0}%"></span><span class="shine"></span></span><span class="pct">${pct===null?'—':Math.round(pct*10)/10+'%'}</span><span class="low">${warning?'⚠ '+t.low:'&nbsp;'}</span></button>`;
    }).join('');
    const stats=['total','color','bw','duplex'].filter(key=>e[key]);
    const missing=Object.entries(e).filter(([,id])=>id && !states[id]);
    this.shadowRoot.innerHTML=`<style>${CARD_STYLE}</style><ha-card style="--status-color:${STATUS_COLORS[status.kind]}">
      <header>${e.status?`<button class="head-button" ${entityAttr(e.status)} aria-label="${escapeHTML(t.more+': '+title)}">`:'<div class="head-button">'}<span class="printer ${active?'printing':''}">${PRINTER_SVG}</span><h2>${escapeHTML(title)}</h2>${e.status?'</button>':'</div>'}</header>
      ${e.status?`<p class="status" role="status">${escapeHTML(statusText)}</p>${raw && !['unknown','unavailable'].includes(raw) && raw!==statusText?`<p class="raw">${escapeHTML(raw)}</p>`:''}`:''}
      ${active?'<div class="paper-slot" aria-hidden="true"><div class="paper"></div></div>':''}
      ${tonerMarkup?`<div class="toners">${tonerMarkup}</div>`:''}
      ${e.drum?`<button class="drum" ${entityAttr(e.drum)}><span>${t.drum}</span><strong>${escapeHTML(displayState(states[e.drum],lang))}</strong></button>`:''}
      ${stats.length?`<div class="stats">${stats.map(key=>`<button class="stat" ${entityAttr(e[key])}><span>${t[key]}</span><strong>${escapeHTML(displayState(states[e[key]],lang))}</strong></button>`).join('')}</div>`:''}
      ${!Object.values(e).some(Boolean)?`<p class="note">${t.setup}</p>`:''}
      ${missing.length && this._hass?`<p class="note">${t.missing}: ${missing.map(([,id])=>escapeHTML(id)).join(', ')}</p>`:''}
    </ha-card>`;
  }
}
if(!customElements.get('printer-card'))customElements.define('printer-card',PrinterCard);
window.customCards=window.customCards || [];
if(!window.customCards.some(card=>card.type==='printer-card'))window.customCards.push({type:'printer-card',name:'Printer Card',description:'Printer status, vertical CMYK toner, drum and page counts. Visual entity editor.',preview:true});

export {};
