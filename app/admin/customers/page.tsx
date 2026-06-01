"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: number;
  name: string;
  phone: string;
  created_at: string;
};

export default function CustomersPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    async function loadLeads() {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    }

    loadLeads();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Customers</h1>

        <div className="mt-6 space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl border border-white/10 bg-white/10 p-4"
            >
              <p className="font-semibold">{lead.name}</p>
              <p className="text-amber-200">{lead.phone}</p>
              <p className="text-xs text-neutral-400">
                {new Date(lead.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}