export const STATE_SCHEMA_VERSION = 3;

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
  settings: {
    alwaysOnTop: true,
    resetOnCombatEnd: true,
    autoOpenCurrentPhase: true,
    autoClosePreviousPhase: true,
  },
};

export const EXDEATH_ACTIONS = {
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

export const CHAOS_ACTIONS = {
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

export function calculateExdeathAction(mechanic, value) {
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '';
  return EXDEATH_ACTIONS[mechanic] && EXDEATH_ACTIONS[mechanic][state] ? EXDEATH_ACTIONS[mechanic][state] : '';
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

export function calculateChaosAction(kind, value) {
  const mechanic = kind === 'water' ? 'tsunami' : kind;
  const state = normalizeMechanicState(value);
  if (state === MechanicState.Unset) return '대기';
  return CHAOS_ACTIONS[mechanic] && CHAOS_ACTIONS[mechanic][state] ? CHAOS_ACTIONS[mechanic][state] : '대기';
}

