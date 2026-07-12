// src/domain/mechanics.js
const STATE_SCHEMA_VERSION = 3;

const MechanicState = {
  Unset: 'unset',
  Circle: 'circle',
  Question: 'question',
};

const EXDEATH_MECHANICS = ['water', 'thunder', 'bomb'];
const initialState = {
  schemaVersion: STATE_SCHEMA_VERSION,
  phase: 'exdeath',
  exdeath: {
    water: MechanicState.Unset,
    thunder: MechanicState.Unset,
    bomb: MechanicState.Unset,
    inputOrder: [],
  },
  chaos: {
    fire: MechanicState.Unset,
    debuff: MechanicState.Unset,
    tsunami: MechanicState.Unset,
  },
  settings: {
    alwaysOnTop: true,
    resetOnCombatEnd: true,
    autoOpenCurrentPhase: true,
    autoClosePreviousPhase: true,
  },
};

const EXDEATH_ACTIONS = {
  water: {
    [MechanicState.Circle]: '쉐어',
    [MechanicState.Question]: '산개',
  },
  thunder: {
    [MechanicState.Circle]: '산개',
    [MechanicState.Question]: '쉐어',
  },
  bomb: {
    [MechanicState.Circle]: '멈춰!',
    [MechanicState.Question]: '움직여!',
  },
};

const EYE_ACTION_LABELS = {
  look: '봐',
  away: '보지마',
};

const CHAOS_ACTIONS = {
  debuff: {
    [MechanicState.Circle]: '빠름',
    [MechanicState.Question]: '느림',
  },
  fire: {
    [MechanicState.Circle]: '나가',
    [MechanicState.Question]: '그대로',
  },
  tsunami: {
    [MechanicState.Circle]: '그대로',
    [MechanicState.Question]: '나가',
  },
};

function cloneState(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeMechanicState(value) {
  if (value === true || value === 'true' || value === MechanicState.Circle) return MechanicState.Circle;
  if (value === false || value === 'false' || value === MechanicState.Question) return MechanicState.Question;
  return MechanicState.Unset;
}

function normalizeState(stored) {
  // Legacy state used "unknown" both for the ? button and for no input. Resetting
  // unversioned data avoids carrying ambiguous test-state into real raid logic.
  if (!stored || stored.schemaVersion !== STATE_SCHEMA_VERSION) return cloneState(initialState);

  const next = cloneState(initialState);
  next.phase = stored.phase || next.phase;
  next.settings = { ...next.settings, ...(stored.settings || {}) };
  next.exdeath = normalizeExdeath(stored.exdeath || {});
  const storedChaos = stored.chaos || {};
  next.chaos = {
    fire: normalizeMechanicState(storedChaos.fire),
    debuff: normalizeMechanicState(storedChaos.debuff),
    tsunami: normalizeMechanicState(storedChaos.tsunami === undefined ? storedChaos.water : storedChaos.tsunami),
  };
  return next;
}

function normalizeExdeath(exdeath) {
  const normalized = {
    water: normalizeMechanicState(exdeath.water),
    thunder: normalizeMechanicState(exdeath.thunder),
    bomb: normalizeMechanicState(exdeath.bomb),
    inputOrder: [],
  };
  const order = Array.isArray(exdeath.inputOrder) ? exdeath.inputOrder : [];
  order.forEach((mechanic) => {
    if (EXDEATH_MECHANICS.includes(mechanic) && normalized[mechanic] !== MechanicState.Unset && !normalized.inputOrder.includes(mechanic)) {
      normalized.inputOrder.push(mechanic);
    }
  });
  EXDEATH_MECHANICS.forEach((mechanic) => {
    if (normalized[mechanic] !== MechanicState.Unset && !normalized.inputOrder.includes(mechanic)) normalized.inputOrder.push(mechanic);
  });
  return enforceExdeathExclusivity(normalized);
}

function enforceExdeathExclusivity(exdeath) {
  if (exdeath.water !== MechanicState.Unset && exdeath.thunder !== MechanicState.Unset) {
    const waterIndex = exdeath.inputOrder.indexOf('water');
    const thunderIndex = exdeath.inputOrder.indexOf('thunder');
    const keep = thunderIndex > waterIndex ? 'thunder' : 'water';
    const remove = keep === 'thunder' ? 'water' : 'thunder';
    exdeath[remove] = MechanicState.Unset;
    exdeath.inputOrder = exdeath.inputOrder.filter((mechanic) => mechanic !== remove);
  }
  exdeath.inputOrder = exdeath.inputOrder.filter((mechanic) => EXDEATH_MECHANICS.includes(mechanic) && exdeath[mechanic] !== MechanicState.Unset);
  return exdeath;
}

function setExdeathMechanic(exdeath, mechanic, value) {
  if (!EXDEATH_MECHANICS.includes(mechanic)) return normalizeExdeath(exdeath);
  const state = normalizeMechanicState(value);
  const next = normalizeExdeath(exdeath);

  if (state === MechanicState.Unset) {
    next[mechanic] = MechanicState.Unset;
    next.inputOrder = next.inputOrder.filter((item) => item !== mechanic);
    return next;
  }

  if (mechanic === 'water') {
    next.thunder = MechanicState.Unset;
    next.inputOrder = next.inputOrder.filter((item) => item !== 'thunder');
  }
  if (mechanic === 'thunder') {
    next.water = MechanicState.Unset;
    next.inputOrder = next.inputOrder.filter((item) => item !== 'water');
  }

  next[mechanic] = state;
  if (!next.inputOrder.includes(mechanic)) next.inputOrder.push(mechanic);
  return enforceExdeathExclusivity(next);
}

function calculateExdeathAction(mechanic, value) {
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '';
  return EXDEATH_ACTIONS[mechanic] && EXDEATH_ACTIONS[mechanic][state] ? EXDEATH_ACTIONS[mechanic][state] : '';
}

function calculateExdeathEyeActions(exdeath) {
  const normalized = normalizeExdeath(exdeath);
  return normalized.inputOrder.slice(0, 2).map((mechanic) => (
    normalized[mechanic] === MechanicState.Question ? 'look' : 'away'
  ));
}

function calculateEyeOrder(exdeath) {
  return calculateExdeathEyeActions(exdeath);
}

function calculateExdeathEyeText(action) {
  return EYE_ACTION_LABELS[action] || '원형';
}

function calculateChaosAction(kind, value) {
  const mechanic = kind === 'water' ? 'tsunami' : kind;
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '대기';
  return CHAOS_ACTIONS[mechanic] && CHAOS_ACTIONS[mechanic][state] ? CHAOS_ACTIONS[mechanic][state] : '대기';
}



// src/services/combatEventSource.js
class MockCombatEventSource{connect(onEvent){const h=e=>onEvent(e.detail);window.addEventListener('umad:mockCombatEvent',h);return()=>window.removeEventListener('umad:mockCombatEvent',h)}static emit(event){window.dispatchEvent(new CustomEvent('umad:mockCombatEvent',{detail:event}))}}
class ActOverlayPluginEventSource{connect(onEvent){if(!window.addOverlayListener)return()=>{};const onChangeZone=()=>onEvent({type:'CombatStarted'});const onLogLine=data=>{const line=JSON.stringify(data).toLowerCase();if(line.includes('exdeath'))onEvent({type:'PhaseChanged',phase:'exdeath'});if(line.includes('chaos'))onEvent({type:'PhaseChanged',phase:'chaos'})};window.addOverlayListener('ChangeZone',onChangeZone);window.addOverlayListener('LogLine',onLogLine);if(window.callOverlayHandler)window.callOverlayHandler({call:'subscribe',events:['ChangeZone','LogLine']});return()=>{if(window.removeOverlayListener)window.removeOverlayListener('ChangeZone',onChangeZone);if(window.removeOverlayListener)window.removeOverlayListener('LogLine',onLogLine)}}}
function createCombatEventSource(){return window.addOverlayListener?new ActOverlayPluginEventSource():new MockCombatEventSource()}


// src/main.js
const app=document.getElementById('app');
if(!app)throw new Error('App root element was not found.');
const STORAGE_KEY='umad-p4-helper-state',validPhases=['exdeath','chaos'];let state=load(),confirmReset=false;
function readStoredState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(error){console.error('Failed to read saved state.',error);return{}}}
function load(){const loaded=normalizeState(readStoredState());if(!validPhases.includes(loaded.phase))loaded.phase='exdeath';return loaded}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){console.error('Failed to save state.',error)}}
function setState(next){state=typeof next==='function'?next(state):{...state,...next};save();render()}
function icon(n){return`<span class="icon icon-${n}" aria-hidden="true"></span>`}
function mark(v){const stateValue=normalizeMechanicState(v);return stateValue===MechanicState.Circle?'O':stateValue===MechanicState.Question?'?':'-'}
function truth(path,value,labels){const opts=[MechanicState.Circle,MechanicState.Question];return`<div class="truth-buttons">${opts.map(v=>`<button data-set="${path}" data-value="${v}" class="${value===v?'selected':''}">${labels&&labels[v]?labels[v]:mark(v)}</button>`).join('')}</div>`}
function orderBadge(order){return order?`<span class="order-badge" title="엑스데스 캐스팅 판정 입력 순서">${order}</span>`:''}
function row(iconName,label,path,value,result='',order=0,labels){return`<div class="mechanic-row"><span class="mechanic-name">${icon(iconName)}${label}</span>${truth(path,value,labels)}${result||order?`<span class="result-wrap">${orderBadge(order)}${result?`<strong class="result-pill">${result}</strong>`:''}</span>`:''}</div>`}
function eyeText(eye){return calculateExdeathEyeText(eye)}
function selectedShareAction(){return state.exdeath.water!==MechanicState.Unset?calculateExdeathAction('water',state.exdeath.water):calculateExdeathAction('thunder',state.exdeath.thunder)}
function debuffSummary(eye){const fire=calculateChaosAction('fire',state.chaos.fire);const tsunami=calculateChaosAction('tsunami',state.chaos.tsunami);const bomb=calculateExdeathAction('bomb',state.exdeath.bomb);const debuff=calculateChaosAction('debuff',state.chaos.debuff);const share=selectedShareAction();return`<section class="debuff-summary" aria-label="디버프 전체 확인"><div class="summary-line summary-line-four"><b>${eyeText(eye[0])}</b><b>${fire}</b><b>${eyeText(eye[1])}</b><b>${tsunami}</b></div><div class="summary-line summary-line-two"><b>${bomb||'대기'}</b><b>${debuff}${share?` ${share}`:''}</b></div></section>`}
function setPath(path,value){const [group,key]=path.split('.');if(group==='exdeath'){setState(s=>({...s,exdeath:setExdeathMechanic(s.exdeath,key,value)}));return}setState(s=>({...s,[group]:{...s[group],[key]:normalizeMechanicState(value)}}))}
function reset(){if(!confirmReset){confirmReset=true;setTimeout(()=>{confirmReset=false;render()},2500);render();return}state=cloneState(initialState);state.phase='exdeath';confirmReset=false;save();render()}
function exdeathOrder(mechanic){const index=state.exdeath.inputOrder.indexOf(mechanic);return index===-1?0:index+1}
function render(){const eye=calculateExdeathEyeActions(state.exdeath);const speedLabels={[MechanicState.Circle]:'빠름',[MechanicState.Question]:'느림'};app.innerHTML=`<main class="shell"><header><div><h1>절요성 4페 컨페</h1></div><button class="reset" data-reset>${icon('reset')}${confirmReset?'한 번 더':'초기화'}</button></header><section class="mechanics">${row('water','물','exdeath.water',state.exdeath.water,calculateExdeathAction('water',state.exdeath.water),exdeathOrder('water'))}${row('lightning','번개','exdeath.thunder',state.exdeath.thunder,calculateExdeathAction('thunder',state.exdeath.thunder),exdeathOrder('thunder'))}${row('bomb','폭탄','exdeath.bomb',state.exdeath.bomb,calculateExdeathAction('bomb',state.exdeath.bomb),exdeathOrder('bomb'))}${row('eye','디버프','chaos.debuff',state.chaos.debuff,calculateChaosAction('debuff',state.chaos.debuff),0,speedLabels)}<div class="phase-gap" aria-hidden="true"></div>${row('fire','화염','chaos.fire',state.chaos.fire,calculateChaosAction('fire',state.chaos.fire))}${row('water','해일','chaos.tsunami',state.chaos.tsunami,calculateChaosAction('tsunami',state.chaos.tsunami))}${debuffSummary(eye)}</section><section class="settings">${[['alwaysOnTop','항상 위에 표시'],['resetOnCombatEnd','전투 종료 시 자동 초기화']].map(([k,l])=>`<label><input data-setting="${k}" type="checkbox" ${state.settings[k]?'checked':''}>${l}</label>`).join('')}</section></main>`;bind()}
function bind(){document.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>setPath(b.dataset.set,b.dataset.value));document.querySelectorAll('[data-setting]').forEach(i=>i.onchange=()=>setState(s=>({...s,settings:{...s.settings,[i.dataset.setting]:i.checked}})));const resetButton=document.querySelector('[data-reset]');if(resetButton)resetButton.addEventListener('click',reset)/* Mock 테스트 이벤트 바인딩 비활성화: document.querySelectorAll('[data-mock]').forEach(b=>b.onclick=()=>MockCombatEventSource.emit({type:'PhaseChanged',phase:b.dataset.mock}));const combatEndButton=document.querySelector('[data-combat-end]');if(combatEndButton)combatEndButton.addEventListener('click',()=>MockCombatEventSource.emit({type:'CombatEnded'})) */}
function connectCombatEventSource(){try{createCombatEventSource().connect(ev=>{if(ev.type==='CombatEnded'&&state.settings.resetOnCombatEnd){state=cloneState(initialState);state.phase='exdeath';save();render()}if(ev.type==='PhaseChanged'&&validPhases.includes(ev.phase)){state.phase=ev.phase;save()}})}catch(error){console.error('Failed to connect combat event source.',error)}}
window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='r')reset()});render();connectCombatEventSource();
