"use client";
import { useState } from "react";

interface BackupInfo {
  lastBackup: string;
  sizeKB: number;
  ageHours: number;
  integrity: boolean;
  checksumMatch: boolean;
  schedulerRegistered: boolean;
  status: "healthy" | "warning" | "failed";
}

export function BackupClient({ initialBackup }: { initialBackup: BackupInfo }) {
  const [backup, setBackup] = useState<BackupInfo>(initialBackup);

  // Placeholder server actions – replace with real API calls
  async function runBackup() {
    "use server";
    console.log("Run backup triggered");
    // TODO: invoke backup process and refresh UI
  }

  async function registerScheduler() {
    "use server";
    console.log("Register scheduler triggered");
    // TODO: register scheduler and refresh UI
  }

  return (
    <section className="p-6 space-y-6 bg-slate-900 text-slate-100 rounded-lg overflow-auto">
      <h1 className="text-2xl font-bold">Backup &amp; Recovery</h1>
      {/* Overall status badge */}
      <div className="flex items-center space-x-2">
        <span className="font-medium">Overall Status:</span>
        {backup.status === "healthy" && (
          <span className="px-2 py-0.5 rounded bg-green-800 text-green-100">Healthy</span>
        )}
        {backup.status === "warning" && (
          <span className="px-2 py-0.5 rounded bg-yellow-800 text-yellow-100">Warning</span>
        )}
        {backup.status === "failed" && (
          <span className="px-2 py-0.5 rounded bg-red-800 text-red-100">Failed</span>
        )}
      </div>

      {/* Backup details table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left">File</th>
              <th className="px-3 py-2 text-left">Size (KB)</th>
              <th className="px-3 py-2 text-left">Age (h)</th>
              <th className="px-3 py-2 text-left">Integrity</th>
              <th className="px-3 py-2 text-left">Checksum</th>
              <th className="px-3 py-2 text-left">Scheduler</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900">
            <tr>
              <td className="px-3 py-2 border-t border-slate-700">{backup.lastBackup}</td>
              <td className="px-3 py-2 border-t border-slate-700">{backup.sizeKB}</td>
              <td className="px-3 py-2 border-t border-slate-700">{backup.ageHours.toFixed(1)}</td>
              <td className="px-3 py-2 border-t border-slate-700">
                {backup.integrity ? (
                  <span className="px-1 rounded bg-green-800 text-green-100">OK</span>
                ) : (
                  <span className="px-1 rounded bg-red-800 text-red-100">FAIL</span>
                )}
              </td>
              <td className="px-3 py-2 border-t border-slate-700">
                {backup.checksumMatch ? (
                  <span className="px-1 rounded bg-green-800 text-green-100">OK</span>
                ) : (
                  <span className="px-1 rounded bg-red-800 text-red-100">MISMATCH</span>
                )}
              </td>
              <td className="px-3 py-2 border-t border-slate-700">
                {backup.schedulerRegistered ? (
                  <span className="px-1 rounded bg-green-800 text-green-100">Registered</span>
                ) : (
                  <span className="px-1 rounded bg-yellow-800 text-yellow-100">Not registered</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form action={runBackup} className="flex-1">
          <button type="submit" className="w-full px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded text-white">
            Run backup now
          </button>
        </form>
        {!backup.schedulerRegistered && (
          <form action={registerScheduler} className="flex-1">
            <button type="submit" className="w-full px-4 py-2 bg-indigo-800 hover:bg-indigo-700 rounded text-white">
              Register scheduler
            </button>
          </form>
        )}
        <a
          href="/api/backup/download/latest"
          target="_blank"
          className="flex-1 text-center px-4 py-2 bg-green-800 hover:bg-green-700 rounded text-white"
        >
          Download latest backup
        </a>
      </div>
    </section>
  );
}
