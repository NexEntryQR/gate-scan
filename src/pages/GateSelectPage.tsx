import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { listEvents, listGatesByEvent, listZonesByEvent } from "gate-shared";
import { ChevronDown, ScanLine } from "lucide-react";
import { ErrorBanner } from "../components/ErrorBanner.tsx";
import { saveSelection } from "../lib/selection.ts";

const selectClass =
  "w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-10 text-base font-medium text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export function GateSelectPage() {
  const navigate = useNavigate();
  const [eventId, setEventId] = useState<number | null>(null);
  const [gateId, setGateId] = useState<number | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["events", "all"],
    queryFn: () => listEvents({ size: 100, sort: "startDatetime,desc" }),
  });

  const zonesQuery = useQuery({
    queryKey: ["zones-by-event", eventId],
    queryFn: () => listZonesByEvent(eventId!),
    enabled: eventId !== null,
  });

  const gatesQuery = useQuery({
    queryKey: ["gates-by-event", eventId],
    queryFn: () => listGatesByEvent(eventId!),
    enabled: eventId !== null,
  });

  const selectedEvent = eventsQuery.data?.content.find((event) => event.id === eventId);
  const selectedGate = gatesQuery.data?.find((gate) => gate.id === gateId);
  const selectedZone = zonesQuery.data?.find((zone) => zone.id === selectedGate?.zoneId);
  const canStart = !!(selectedEvent && selectedGate && selectedZone);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 font-sans dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <ScanLine className="h-7 w-7" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gate Scan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose the event and gate you're scanning at.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {eventsQuery.isError && <ErrorBanner error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Event</span>
            <div className="relative">
              <select
                className={selectClass}
                value={eventId ?? ""}
                onChange={(e) => {
                  setEventId(e.target.value ? Number(e.target.value) : null);
                  setGateId(null);
                }}
              >
                <option value="">Select an event…</option>
                {eventsQuery.data?.content.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          {eventId !== null && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gate</span>
              {gatesQuery.isError && <ErrorBanner error={gatesQuery.error} onRetry={() => gatesQuery.refetch()} />}
              <div className="relative">
                <select
                  className={selectClass}
                  value={gateId ?? ""}
                  onChange={(e) => setGateId(e.target.value ? Number(e.target.value) : null)}
                  disabled={gatesQuery.isPending || zonesQuery.isPending}
                >
                  <option value="">{gatesQuery.isPending ? "Loading gates…" : "Select a gate…"}</option>
                  {gatesQuery.data?.map((gate) => {
                    const zone = zonesQuery.data?.find((z) => z.id === gate.zoneId);
                    const zoneLabel = zone ? `${zone.name}${zone.regular ? " · regular" : ""}` : "zone";
                    return (
                      <option key={gate.id} value={gate.id} disabled={!gate.active}>
                        {zoneLabel} → {gate.name} ({gate.directionMode})
                        {gate.active ? "" : " — deactivated"}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
          )}

          <button
            type="button"
            disabled={!canStart}
            onClick={() => {
              if (!selectedEvent || !selectedGate || !selectedZone) return;
              saveSelection({
                eventId: selectedEvent.id,
                eventName: selectedEvent.name,
                gateId: selectedGate.id,
                gateName: selectedGate.name,
                zoneName: selectedZone.name,
                zoneRegular: selectedZone.regular,
              });
              navigate("/scan");
            }}
            className="mt-2 rounded-xl bg-indigo-600 px-4 py-4 text-lg font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start scanning
          </button>
        </div>
      </div>
    </div>
  );
}
