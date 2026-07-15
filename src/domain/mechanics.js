export const STATE_SCHEMA_VERSION = 3;

export const DEFAULT_ACTION_PRESET_ID = 'current';

export const MechanicState = {
  Unset: 'unset',
  Circle: 'circle',
  Question: 'question',
};

export const EXDEATH_MECHANICS = ['water', 'thunder', 'bomb'];
export const initialState = {
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
};

export const ACTION_PRESETS = {
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
    exdeath: {
      bomb: {
        [MechanicState.Circle]: '멈춰',
        [MechanicState.Question]: '움직여',
      },
    },
    eye: {
      look: '봐',
      away: '보지마',
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
  },
};

export const EXDEATH_ACTIONS = ACTION_PRESETS.current.exdeath;
export const EYE_ACTION_LABELS = ACTION_PRESETS.current.eye;
export const CHAOS_ACTIONS = ACTION_PRESETS.current.chaos;

export function getActionPreset(id) {
  return ACTION_PRESETS[id] || ACTION_PRESETS[DEFAULT_ACTION_PRESET_ID];
}

function presetAction(preset, section, mechanic, state) {
  const selected = getActionPreset(preset && preset.id ? preset.id : preset);
  return (selected[section] && selected[section][mechanic] && selected[section][mechanic][state])
    || (ACTION_PRESETS.current[section] && ACTION_PRESETS.current[section][mechanic] && ACTION_PRESETS.current[section][mechanic][state])
    || '';
}

export function cloneState(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function normalizeMechanicState(value) {
  if (value === true || value === 'true' || value === MechanicState.Circle) return MechanicState.Circle;
  if (value === false || value === 'false' || value === MechanicState.Question) return MechanicState.Question;
  return MechanicState.Unset;
}

export function normalizeState(stored) {
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

export function setExdeathMechanic(exdeath, mechanic, value) {
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

export function calculateExdeathAction(mechanic, value, preset = DEFAULT_ACTION_PRESET_ID) {
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '';
  return presetAction(preset, 'exdeath', mechanic, state);
}

export function calculateExdeathEyeActions(exdeath) {
  const normalized = normalizeExdeath(exdeath);
  return normalized.inputOrder.slice(0, 2).map((mechanic) => (
    normalized[mechanic] === MechanicState.Question ? 'look' : 'away'
  ));
}

export function calculateEyeOrder(exdeath) {
  return calculateExdeathEyeActions(exdeath);
}

export function calculateExdeathEyeText(action, preset = DEFAULT_ACTION_PRESET_ID) {
  const selected = getActionPreset(preset);
  return (selected.eye && selected.eye[action]) || EYE_ACTION_LABELS[action] || '원형';
}

export function calculateChaosAction(kind, value, preset = DEFAULT_ACTION_PRESET_ID) {
  const mechanic = kind === 'water' ? 'tsunami' : kind;
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '대기';
  return presetAction(preset, 'chaos', mechanic, state) || '대기';
}

export function buildPartyChatLine(actions) {
  return `/p ${actions.filter(Boolean).join(' > ')}`;
}

