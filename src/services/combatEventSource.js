export class MockCombatEventSource {
  connect(onEvent) {
    const handler = (event) => onEvent(event.detail);
    window.addEventListener('umad:mockCombatEvent', handler);
    return () => window.removeEventListener('umad:mockCombatEvent', handler);
  }

  static emit(event) {
    window.dispatchEvent(new CustomEvent('umad:mockCombatEvent', { detail: event }));
  }
}

export class ActOverlayPluginEventSource {
  connect(onEvent) {
    const overlayLockPayload = (data) => (data && data.detail ? data.detail : data);
    const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const readLockState = (detail) => {
      if (!detail || typeof detail !== 'object') return undefined;
      if (hasOwn(detail, 'isLocked')) return !!detail.isLocked;
      if (hasOwn(detail, 'locked')) return !!detail.locked;
      return undefined;
    };

    let lastLocked;

    const onChangeZone = () => onEvent({ type: 'CombatStarted' });
    const onOverlayStateUpdate = (data) => {
      const detail = overlayLockPayload(data);
      const locked = readLockState(detail);
      if (locked === undefined) return;
      if (locked !== lastLocked) {
        lastLocked = locked;
        onEvent({ type: 'OverlayLockChanged', locked });
      }
    };
    const pollOverlayState = () => {
      if (!window.callOverlayHandler) return;
      try {
        const overlayState = window.callOverlayHandler({ call: 'getOverlayState' });
        if (overlayState && overlayState.then) overlayState.then(onOverlayStateUpdate).catch(() => {});
        else if (overlayState) onOverlayStateUpdate(overlayState);
      } catch {}
    };
    const onLogLine = (data) => {
      const line = JSON.stringify(data).toLowerCase();
      if (line.includes('네오 엑스데스') || line.includes('neo exdeath')) onEvent({ type: 'BossDetected', boss: 'neoExdeath' });
      if (line.includes('exdeath') || line.includes('엑스데스')) onEvent({ type: 'PhaseChanged', phase: 'exdeath' });
      if (line.includes('chaos') || line.includes('케프카')) onEvent({ type: 'PhaseChanged', phase: 'chaos' });
    };

    if (window.addOverlayListener) {
      window.addOverlayListener('ChangeZone', onChangeZone);
      window.addOverlayListener('LogLine', onLogLine);
      window.addOverlayListener('onOverlayStateUpdate', onOverlayStateUpdate);
    }

    document.addEventListener('onOverlayStateUpdate', onOverlayStateUpdate);
    document.addEventListener('LogLine', onLogLine);
    document.addEventListener('onLogLine', onLogLine);

    if (window.callOverlayHandler) window.callOverlayHandler({ call: 'subscribe', events: ['ChangeZone', 'LogLine'] });

    pollOverlayState();
    const pollId = setInterval(pollOverlayState, 1000);

    return () => {
      clearInterval(pollId);
      if (window.removeOverlayListener) window.removeOverlayListener('ChangeZone', onChangeZone);
      if (window.removeOverlayListener) window.removeOverlayListener('LogLine', onLogLine);
      if (window.removeOverlayListener) window.removeOverlayListener('onOverlayStateUpdate', onOverlayStateUpdate);
      document.removeEventListener('onOverlayStateUpdate', onOverlayStateUpdate);
      document.removeEventListener('LogLine', onLogLine);
      document.removeEventListener('onLogLine', onLogLine);
    };
  }
}

export function createCombatEventSource() {
  return typeof document === 'undefined' ? new MockCombatEventSource() : new ActOverlayPluginEventSource();
}
