// Operator's chosen event+gate for this device, persisted so a page reload mid-shift
// doesn't force them to re-pick it. There's no server-side "session" concept to sync to.

export interface GateSelection {
  eventId: number;
  eventName: string;
  gateId: number;
  gateName: string;
  zoneName: string;
  zoneRegular: boolean;
}

const STORAGE_KEY = "gate-scan.selection";

export function loadSelection(): GateSelection | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GateSelection;
  } catch {
    return null;
  }
}

export function saveSelection(selection: GateSelection): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

export function clearSelection(): void {
  localStorage.removeItem(STORAGE_KEY);
}
