// src/domain/mechanics.js
const STATE_SCHEMA_VERSION = 4;

const DEFAULT_ACTION_PRESET_ID = 'current';

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
  custom: {
    eye1: MechanicState.Unset,
    eye2: MechanicState.Unset,
    dice: MechanicState.Unset,
  },
};

const ACTION_PRESETS = {
  current: {
    id: 'current',
    name: '기본',
    exdeath: {
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
    },
    eye: {
      look: '봐',
      away: '보지마',
      eye1: {
        [MechanicState.Circle]: '보지마',
        [MechanicState.Question]: '봐',
      },
      eye2: {
        [MechanicState.Circle]: '보지마',
        [MechanicState.Question]: '봐',
      },
    },
    chaos: {
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
    },
  },
  alternate: {
    id: 'alternate',
    name: '마안/기믹명',
    displayRows: [
      { icon: 'eye', label: '마안1', path: 'custom.eye1', section: 'eye', mechanic: 'eye1' },
      { icon: 'eye', label: '마안2', path: 'custom.eye2', section: 'eye', mechanic: 'eye2' },
      { icon: 'fire', label: '화염', path: 'chaos.fire', section: 'chaos', mechanic: 'fire' },
      { icon: 'water', label: '해일', path: 'chaos.tsunami', section: 'chaos', mechanic: 'tsunami' },
      { icon: 'debuff', label: '디버프', path: 'chaos.debuff', section: 'chaos', mechanic: 'debuff', buttonLabels: true, hideResult: true },
      { icon: 'bomb', label: '주사위', path: 'custom.dice', section: 'custom', mechanic: 'dice' },
    ],
    exdeath: {
      bomb: {
        [MechanicState.Circle]: '멈춰',
        [MechanicState.Question]: '움직여',
      },
    },
    eye: {
      look: '봐',
      away: '보지마',
      eye1: {
        [MechanicState.Circle]: '보지마',
        [MechanicState.Question]: '봐',
      },
      eye2: {
        [MechanicState.Circle]: '보지마',
        [MechanicState.Question]: '봐',
      },
    },
    chaos: {
      debuff: {
        [MechanicState.Circle]: '산개',
        [MechanicState.Question]: '쉐어',
      },
      fire: {
        [MechanicState.Circle]: '채리엇',
        [MechanicState.Question]: '도넛',
      },
      tsunami: {
        [MechanicState.Circle]: '도넛',
        [MechanicState.Question]: '채리엇',
      },
    },
    custom: {
      dice: {
        [MechanicState.Circle]: '멈춰',
        [MechanicState.Question]: '움직여',
      },
    },
  },
};

const EXDEATH_ACTIONS = ACTION_PRESETS.current.exdeath;
const EYE_ACTION_LABELS = ACTION_PRESETS.current.eye;
const CHAOS_ACTIONS = ACTION_PRESETS.current.chaos;

function getActionPreset(id) {
  return ACTION_PRESETS[id] || ACTION_PRESETS[DEFAULT_ACTION_PRESET_ID];
}

function presetAction(preset, section, mechanic, state) {
  const selected = getActionPreset(preset && preset.id ? preset.id : preset);
  return (selected[section] && selected[section][mechanic] && selected[section][mechanic][state])
    || (ACTION_PRESETS.current[section] && ACTION_PRESETS.current[section][mechanic] && ACTION_PRESETS.current[section][mechanic][state])
    || '';
}

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
  next.exdeath = normalizeExdeath(stored.exdeath || {});
  const storedChaos = stored.chaos || {};
  next.chaos = {
    fire: normalizeMechanicState(storedChaos.fire),
    debuff: normalizeMechanicState(storedChaos.debuff),
    tsunami: normalizeMechanicState(storedChaos.tsunami === undefined ? storedChaos.water : storedChaos.tsunami),
  };
  const storedCustom = stored.custom || {};
  next.custom = {
    eye1: normalizeMechanicState(storedCustom.eye1),
    eye2: normalizeMechanicState(storedCustom.eye2),
    dice: normalizeMechanicState(storedCustom.dice),
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

function calculateExdeathAction(mechanic, value, preset = DEFAULT_ACTION_PRESET_ID) {
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '';
  return presetAction(preset, 'exdeath', mechanic, state);
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

function calculateExdeathEyeText(action, preset = DEFAULT_ACTION_PRESET_ID) {
  const selected = getActionPreset(preset);
  return (selected.eye && selected.eye[action]) || EYE_ACTION_LABELS[action] || '원형';
}

function calculateChaosAction(kind, value, preset = DEFAULT_ACTION_PRESET_ID) {
  const mechanic = kind === 'water' ? 'tsunami' : kind;
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '대기';
  return presetAction(preset, 'chaos', mechanic, state) || '대기';
}

function calculatePresetRowAction(row, value, preset = DEFAULT_ACTION_PRESET_ID) {
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '';
  if (row.section === 'eye') return presetAction(preset, 'eye', row.mechanic, state);
  return presetAction(preset, row.section, row.mechanic, state);
}

function buildPartyChatLine(actions) {
  return `/p ${actions.filter(Boolean).join(' > ')}`;
}



// src/main.js
const app=document.getElementById('app');
if(!app)throw new Error('App root element was not found.');
const APP_BUILD_VERSION='settings-26';
const STORAGE_KEY='umad-p4-helper-state',PANEL_STORAGE_KEY='umad-p4-helper-panel-size',SETTINGS_STORAGE_KEY='umad-p4-helper-settings',validPhases=['exdeath','chaos'];
const overlayCanvasSize={width:600,height:600},defaultPanelSize={width:560,height:520},minPanelSize={width:0,height:260};
let state=load(),panelSize=loadPanelSize(),settings=loadSettings(),confirmReset=false,copyNotice='',panelDrag=null,settingsOpen=false;
console.info(`UMAD helper loaded ${APP_BUILD_VERSION}`);
function readStoredState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(error){console.error('Failed to read saved state.',error);return{}}}

function clampOpacity(value){return Math.min(1,Math.max(0.2,Number(value)||1))}
function normalizeSettings(value){return{presetId:ACTION_PRESETS[value&&value.presetId]?value.presetId:DEFAULT_ACTION_PRESET_ID,opacity:clampOpacity(value&&value.opacity)}}
function readStoredSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)||'{}')}catch(error){console.error('Failed to read saved settings.',error);return{}}}
function loadSettings(){return normalizeSettings(readStoredSettings())}
function saveSettings(){try{localStorage.setItem(SETTINGS_STORAGE_KEY,JSON.stringify(settings))}catch(error){console.error('Failed to save settings.',error)}}
function setSettings(next){settings=normalizeSettings(typeof next==='function'?next(settings):{...settings,...next});saveSettings();render()}
function selectedPreset(){return ACTION_PRESETS[settings.presetId]||ACTION_PRESETS[DEFAULT_ACTION_PRESET_ID]}
function load(){const loaded=normalizeState(readStoredState());if(!validPhases.includes(loaded.phase))loaded.phase='exdeath';return loaded}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){console.error('Failed to save state.',error)}}

function clampPanelSize(size){const maxWidth=Math.max(0,Math.max(window.innerWidth,overlayCanvasSize.width)-20),maxHeight=Math.max(minPanelSize.height,Math.max(window.innerHeight,overlayCanvasSize.height)-20);return{width:Math.min(Math.max(Math.round(Number(size&&size.width)||defaultPanelSize.width),minPanelSize.width),maxWidth),height:Math.min(Math.max(Math.round(Number(size&&size.height)||defaultPanelSize.height),minPanelSize.height),maxHeight)}}
function readStoredPanelSize(){try{return JSON.parse(localStorage.getItem(PANEL_STORAGE_KEY)||'{}')}catch(error){console.error('Failed to read saved panel size.',error);return{}}}
function loadPanelSize(){return clampPanelSize(readStoredPanelSize())}
function savePanelSize(){try{localStorage.setItem(PANEL_STORAGE_KEY,JSON.stringify(panelSize))}catch(error){console.error('Failed to save panel size.',error)}}
function setPanelSize(size){panelSize=clampPanelSize(size);savePanelSize();const shell=document.querySelector('.shell');if(shell){shell.style.width=`${panelSize.width}px`;shell.style.height=`${panelSize.height}px`}}
function panelStyle(){return`style="width:${panelSize.width}px;height:${panelSize.height}px;opacity:${settings.opacity}"`}
function viewportScale(shell){const rect=shell.getBoundingClientRect();return{scaleX:rect.width/(shell.offsetWidth||rect.width||1)||1,scaleY:rect.height/(shell.offsetHeight||rect.height||1)||1}}
function startPanelDrag(event){if(event.button!==undefined&&event.button!==0)return;const shell=event.currentTarget.closest('.shell');if(!shell)return;event.preventDefault();const scale=viewportScale(shell);panelDrag={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startWidth:panelSize.width,startHeight:panelSize.height,scaleX:scale.scaleX,scaleY:scale.scaleY,active:false};try{event.currentTarget.setPointerCapture(event.pointerId)}catch(error){console.warn('Pointer capture is not available in this host.',error)}document.body.classList.add('resizing-panel')}
function movePanelDrag(event){if(!panelDrag||event.pointerId!==panelDrag.pointerId)return;if(event.buttons!==undefined&&(event.buttons&1)===0){stopPanelDrag(event);return}const dx=(event.clientX-panelDrag.startX)/panelDrag.scaleX,dy=(event.clientY-panelDrag.startY)/panelDrag.scaleY;if(!panelDrag.active&&Math.hypot(dx,dy)<4)return;panelDrag.active=true;event.preventDefault();setPanelSize({width:panelDrag.startWidth+dx,height:panelDrag.startHeight+dy})}
function stopPanelDrag(event){if(!panelDrag||event.pointerId!==panelDrag.pointerId)return;panelDrag=null;document.body.classList.remove('resizing-panel')}
function setState(next){state=typeof next==='function'?next(state):{...state,...next};save();render()}
function icon(n){return`<span class="icon icon-${n}" aria-hidden="true"></span>`}
function mark(v){const stateValue=normalizeMechanicState(v);return stateValue===MechanicState.Circle?'O':stateValue===MechanicState.Question?'?':'-'}
function truth(path,value,labels){const opts=[MechanicState.Circle,MechanicState.Question];return`<div class="truth-buttons">${opts.map(v=>`<button data-set="${path}" data-value="${v}" class="${value===v?'selected':''}">${labels&&labels[v]?labels[v]:mark(v)}</button>`).join('')}</div>`}
function valueAtPath(path){const [group,key]=path.split('.');return state[group]&&state[group][key]}
function presetRowLabels(row){if(!row.buttonLabels)return null;const preset=selectedPreset();return{[MechanicState.Circle]:calculatePresetRowAction(row,MechanicState.Circle,preset),[MechanicState.Question]:calculatePresetRowAction(row,MechanicState.Question,preset)}}
function orderBadge(order){return order?`<span class="order-badge" title="엑스데스 캐스팅 판정 입력 순서">${order}</span>`:''}
function row(iconName,label,path,value,result='',order=0,labels){return`<div class="mechanic-row"><span class="mechanic-name">${icon(iconName)}${label}</span>${truth(path,value,labels)}${result||order?`<span class="result-wrap">${orderBadge(order)}${result?`<strong class="result-pill">${result}</strong>`:''}</span>`:''}</div>`}
function presetRow(rowConfig){const value=valueAtPath(rowConfig.path);const result=rowConfig.hideResult?'':calculatePresetRowAction(rowConfig,value,selectedPreset());return row(rowConfig.icon,rowConfig.label,rowConfig.path,value,result,0,presetRowLabels(rowConfig))}
function mechanicsRows(){const preset=selectedPreset();if(Array.isArray(preset.displayRows))return preset.displayRows.map(presetRow).join('');const speedLabels={[MechanicState.Circle]:'빠름',[MechanicState.Question]:'느림'};return`${row('water','물','exdeath.water',state.exdeath.water,calculateExdeathAction('water',state.exdeath.water,preset),exdeathOrder('water'))}${row('lightning','번개','exdeath.thunder',state.exdeath.thunder,calculateExdeathAction('thunder',state.exdeath.thunder,preset),exdeathOrder('thunder'))}${row('bomb','폭탄','exdeath.bomb',state.exdeath.bomb,calculateExdeathAction('bomb',state.exdeath.bomb,preset),exdeathOrder('bomb'))}${row('eye','디버프','chaos.debuff',state.chaos.debuff,calculateChaosAction('debuff',state.chaos.debuff,preset),0,speedLabels)}<div class="phase-gap" aria-hidden="true"></div>${row('fire','화염','chaos.fire',state.chaos.fire,calculateChaosAction('fire',state.chaos.fire,preset))}${row('water','해일','chaos.tsunami',state.chaos.tsunami,calculateChaosAction('tsunami',state.chaos.tsunami,preset))}`}
function eyeText(eye){return calculateExdeathEyeText(eye,selectedPreset())}
function selectedShareAction(){return state.exdeath.water!==MechanicState.Unset?calculateExdeathAction('water',state.exdeath.water,selectedPreset()):calculateExdeathAction('thunder',state.exdeath.thunder,selectedPreset())}
function summaryRowValue(mechanic){const row=Array.isArray(selectedPreset().displayRows)&&selectedPreset().displayRows.find(item=>item.mechanic===mechanic);return row?calculatePresetRowAction(row,valueAtPath(row.path),selectedPreset()):''}
function summaryFourActions(eye){const preset=selectedPreset();if(Array.isArray(preset.displayRows)){return[summaryRowValue('eye1'),calculateChaosAction('fire',state.chaos.fire,preset),summaryRowValue('eye2'),calculateChaosAction('tsunami',state.chaos.tsunami,preset)]}return[eyeText(eye[0]),calculateChaosAction('fire',state.chaos.fire,preset),eyeText(eye[1]),calculateChaosAction('tsunami',state.chaos.tsunami,preset)]}
function summaryDiceAction(){return summaryRowValue('dice')||calculateExdeathAction('bomb',state.exdeath.bomb,selectedPreset())}
function partyChatLine(eye){return buildPartyChatLine(summaryFourActions(eye))}
function debuffSummary(eye){const actions=summaryFourActions(eye);const dice=summaryDiceAction();const debuff=calculateChaosAction('debuff',state.chaos.debuff,selectedPreset());const share=Array.isArray(selectedPreset().displayRows)?'':selectedShareAction();const chatLine=partyChatLine(eye);return`<button type="button" class="debuff-summary" data-copy-summary aria-label="첫 번째 줄 파티 채팅 복사: ${chatLine}" title="클릭하면 복사됩니다: ${chatLine}"><div class="summary-line summary-line-four">${actions.map(action=>`<b>${action||'대기'}</b>`).join('')}</div><div class="summary-line summary-line-two"><b>${dice||'대기'}</b><b>${debuff}${share?` ${share}`:''}</b></div>${copyNotice?`<span class="copy-notice">${copyNotice}</span>`:''}</button>`}
function setPath(path,value){const [group,key]=path.split('.');if(group==='exdeath'){setState(s=>({...s,exdeath:setExdeathMechanic(s.exdeath,key,value)}));return}setState(s=>({...s,[group]:{...s[group],[key]:normalizeMechanicState(value)}}))}
async function copyText(text){let clipboardError=null;if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return}catch(error){clipboardError=error}}const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.top='0';ta.style.left='0';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);const copied=document.execCommand('copy');ta.remove();if(!copied)throw clipboardError||new Error('Legacy clipboard copy command was rejected.')}
function showCopyNotice(message){copyNotice=message;render();setTimeout(()=>{copyNotice='';render()},1500)}
async function copySummary(){const eye=calculateExdeathEyeActions(state.exdeath);const text=partyChatLine(eye);try{await copyText(text);showCopyNotice('복사됨')}catch(error){console.error('Failed to copy summary.',error);showCopyNotice('복사 실패')}}
function reset(){if(!confirmReset){confirmReset=true;setTimeout(()=>{confirmReset=false;render()},2500);render();return}state=cloneState(initialState);state.phase='exdeath';confirmReset=false;save();render()}
function exdeathOrder(mechanic){const index=state.exdeath.inputOrder.indexOf(mechanic);return index===-1?0:index+1}
function readShellScroll(){const shell=app.querySelector('.shell');return shell?{left:shell.scrollLeft,top:shell.scrollTop}:null}
function restoreShellScroll(scroll){if(!scroll)return;const shell=app.querySelector('.shell');if(!shell)return;shell.scrollLeft=scroll.left;shell.scrollTop=scroll.top}

function settingsPanel(){const presets=Object.values(ACTION_PRESETS);return`<div class="settings-popover" ${settingsOpen?'':'hidden'}><fieldset class="preset-options"><legend>리스트 설정</legend>${presets.map(p=>`<button type="button" class="preset-option ${settings.presetId===p.id?'selected':''}" data-setting-preset="${p.id}" aria-pressed="${settings.presetId===p.id?'true':'false'}">${p.name}</button>`).join('')}</fieldset><label>오퍼시티 <span>${Math.round(settings.opacity*100)}%</span><input type="range" min="20" max="100" step="5" value="${Math.round(settings.opacity*100)}" data-setting-opacity></label></div>`}
function render(){const shellScroll=readShellScroll();const eye=calculateExdeathEyeActions(state.exdeath);app.innerHTML=`<main class="shell" ${panelStyle()}><header><div><h1>절요성 4페 컨페</h1></div><div class="header-actions"><button class="reset" data-reset>${icon('reset')}${confirmReset?'한 번 더':'초기화'}</button><button class="settings-toggle" data-settings-toggle aria-label="설정" title="설정">⚙️</button></div>${settingsPanel()}</header><section class="mechanics">${mechanicsRows()}${debuffSummary(eye)}</section><button type="button" class="panel-resize-grip" aria-label="패널 크기 조절" title="오른쪽 아래를 드래그해서 가로/세로 크기 조절"></button></main>`;restoreShellScroll(shellScroll);bind()}
function bind(){document.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>setPath(b.dataset.set,b.dataset.value));const resetButton=document.querySelector('[data-reset]');if(resetButton)resetButton.addEventListener('click',reset);const copyButton=document.querySelector('[data-copy-summary]');if(copyButton)copyButton.addEventListener('click',copySummary);const settingsButton=document.querySelector('[data-settings-toggle]');if(settingsButton)settingsButton.addEventListener('click',()=>{settingsOpen=!settingsOpen;render()});document.querySelectorAll('[data-setting-preset]').forEach(button=>button.addEventListener('click',()=>setSettings({presetId:button.dataset.settingPreset})));const opacityInput=document.querySelector('[data-setting-opacity]');if(opacityInput)opacityInput.addEventListener('input',()=>setSettings({opacity:Number(opacityInput.value)/100}));const grip=document.querySelector('.panel-resize-grip');if(grip)grip.addEventListener('pointerdown',startPanelDrag)}
window.addEventListener('pointermove',movePanelDrag);window.addEventListener('pointerup',stopPanelDrag);window.addEventListener('pointercancel',stopPanelDrag);window.addEventListener('blur',()=>{panelDrag=null;document.body.classList.remove('resizing-panel')});window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='r')reset()});window.addEventListener('resize',()=>setPanelSize(panelSize));render();
