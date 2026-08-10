import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { scanGate, ApiError, isConflict, isNotFound, type ScanResponse } from "gate-shared";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ScanLine, Undo2, XCircle } from "lucide-react";
import { loadSelection, clearSelection } from "../lib/selection.ts";

interface LogEntry {
  id: number;
  code: number;
  scannedAt: string;
  status: "ok" | "error";
  direction?: "IN" | "OUT";
  zoneName?: string;
  occupied?: number;
  capacity?: number;
  label?: string;
  message?: string;
}

let nextLogId = 1;

function errorLabel(error: ApiError): string {
  if (isConflict(error)) return "Already scanned";
  if (isNotFound(error)) return "Unknown code";
  return "Rejected";
}

export function ScanPage() {
  const navigate = useNavigate();
  const selection = loadSelection();
  const [code, setCode] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selection) navigate("/", { replace: true });
  }, [selection, navigate]);

  const mutation = useMutation<ScanResponse, ApiError, number>({
    mutationFn: (codeValue) => scanGate(selection!.gateId, codeValue),
    onSuccess: (response) => {
      setLog((prev) =>
        [
          {
            id: nextLogId++,
            code: response.code,
            scannedAt: response.scannedAt,
            status: "ok" as const,
            direction: response.direction,
            zoneName: response.zoneName,
            occupied: response.occupied,
            capacity: response.capacity,
          },
          ...prev,
        ].slice(0, 25),
      );
      setCode("");
      inputRef.current?.focus();
    },
    onError: (error, codeValue) => {
      setLog((prev) =>
        [
          {
            id: nextLogId++,
            code: codeValue,
            scannedAt: new Date().toISOString(),
            status: "error" as const,
            label: errorLabel(error),
            message: error.detail,
          },
          ...prev,
        ].slice(0, 25),
      );
      setCode("");
      inputRef.current?.focus();
    },
  });

  if (!selection) return null;

  const submit = () => {
    const parsed = Number(code);
    if (!code || !Number.isInteger(parsed) || parsed <= 0) return;
    mutation.mutate(parsed);
  };

  const latest = log[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-6">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <ScanLine className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{selection.eventName}</p>
              <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white">{selection.gateName}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selection.zoneName}
                {selection.zoneRegular ? " · regular zone" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSelection();
              navigate("/");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Switch
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-3"
        >
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="0000"
            className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-7 text-center text-4xl font-bold tracking-widest text-slate-900 shadow-sm transition-colors placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-700"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !code}
            className="rounded-2xl bg-indigo-600 px-4 py-5 text-lg font-bold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? "Scanning…" : "Scan"}
          </button>
        </form>

        {latest && (
          <div
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-5 text-center shadow-sm ${
              latest.status === "ok"
                ? latest.direction === "IN"
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50"
                  : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50"
                : "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/50"
            }`}
          >
            {latest.status === "ok" ? (
              <>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    latest.direction === "IN"
                      ? "bg-emerald-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {latest.direction === "IN" ? (
                    <ArrowDownToLine className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <ArrowUpFromLine className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </span>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{latest.direction}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Code {latest.code} · {latest.zoneName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {latest.occupied} / {latest.capacity} occupied
                </p>
              </>
            ) : (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-white">
                  <XCircle className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">
                  {latest.label} · code {latest.code}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{latest.message}</p>
              </>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Session log</h2>
          {log.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No scans yet this session. There's no server-side attendance history endpoint, so this list only covers
              scans made here.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                    entry.status === "ok"
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/30"
                  }`}
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    {entry.status === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    Code {entry.code}{" "}
                    {entry.status === "ok" ? `· ${entry.direction} · ${entry.zoneName}` : `· ${entry.label}`}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(entry.scannedAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
