import {ENTITY_KEYS, DEFAULT_PATTERNS, TEXT, normalizeConfig, language, escapeHTML} from './model.js';
import {EDITOR_STYLE} from './styles.js';
export class PrinterCardEditor extends HTMLElement {
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
