import {TEXT, normalizeConfig, language, classifyStatus, percentage, displayState, escapeHTML} from './model.js';
import {CARD_STYLE} from './styles.js';
import './editor.js';
const STATUS_COLORS={ready:'#4caf50',printing:'#03a9f4',powersave:'#9099a2',no_paper:'var(--error-color,#f44336)',unknown:'#9099a2',unavailable:'#9099a2',other:'#ef9a23'};
const TONERS=[['cyan','C','#00bcd4'],['magenta','M','#e91e63'],['yellow','Y','#fdd835'],['black','K','#616161']];
const PRINTER_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h12v5H6V3m12 13v5H6v-5h12m1-7a3 3 0 0 1 3 3v6h-3v-3H5v3H2v-6a3 3 0 0 1 3-3h14m-1 2v2h2v-2h-2M8 17v2h8v-2H8Z"/></svg>';
export class PrinterCard extends HTMLElement {
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
      ${e.status?`<p class="status" role="status">${escapeHTML(statusText)}</p>`:''}
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
