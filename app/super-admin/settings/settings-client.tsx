"use client";

import { useState, useTransition } from "react";
import { Settings2, Save, ShieldAlert, Check } from "lucide-react";
import { updateSettingAction } from "./settings-actions";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  configs: any[];
}

export function SettingsClient({ configs }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;
    return map;
  });
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const handleSave = (key: string) => {
    startTransition(async () => {
      await updateSettingAction(key, values[key]);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-indigo-400" /> Platform Configuration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global environment variables, security thresholds, baseline currency, and system-wide operation parameters.
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        {configs.map((c) => {
          return (
            <div
              key={c.key}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{c.label}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{c.key}</div>
              </div>

              <div className="flex items-center gap-2 sm:w-80">
                {c.type === "BOOLEAN" ? (
                  <select
                    value={values[c.key]}
                    onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="false">Disabled (false)</option>
                    <option value="true">Enabled (true)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={values[c.key] || ""}
                    onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                )}

                <button
                  onClick={() => handleSave(c.key)}
                  disabled={isPending}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {savedKey === c.key ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

