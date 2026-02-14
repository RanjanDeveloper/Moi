"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRight,
  Search,
  Minus,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import useSWR from "swr";

interface ReturnEntry {
  personName: string;
  totalReceived: number;
  totalGiven: number;
  netBalance: number;
  suggestedReturn: number;
  lastInteraction: string;
  eventCount: number;
  timeline: {
    id: string;
    amount: number;
    direction: string;
    date: string;
    event: { title: string; type: string } | null;
  }[];
}

export default function ReturnsPage() {
  const { data: returns, error } = useSWR<ReturnEntry[]>("/api/returns");
  const loading = !returns && !error;
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = returns?.filter((r) =>
    r.personName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Smart Returns</h1>
      <p className="text-sm text-slate-400">
        Track who gave you money and how much you should return. Click a person to see their contribution history.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 h-11"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-1">No return data</h3>
          <p className="text-sm text-slate-500">
            Add moi entries to events to see return suggestions here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((person) => {
            const suggestedReturn = Number(person.suggestedReturn);
            const isExpanded = expanded === person.personName;

            return (
              <div key={person.personName}>
                <div
                  className={cn(
                    "rounded-xl border bg-slate-900/50 p-4 cursor-pointer transition-all hover:border-slate-700",
                    isExpanded ? "border-indigo-500/30" : "border-slate-800"
                  )}
                  onClick={() => setExpanded(isExpanded ? null : person.personName)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0",
                      suggestedReturn > 0 ? "bg-amber-500/10 text-amber-400" : suggestedReturn < 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                    )}>
                      {person.personName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {person.personName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-emerald-400/70">
                          Recv: ₹{Number(person.totalReceived).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-orange-400/70">
                          Given: ₹{Number(person.totalGiven).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-slate-500">
                          {Number(person.eventCount)} events
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {suggestedReturn > 0 ? (
                        <div>
                          <p className="text-xs text-amber-400/70 uppercase tracking-wider">You owe</p>
                          <p className="text-lg font-bold text-amber-400">
                            ₹{suggestedReturn.toLocaleString("en-IN")}
                          </p>
                        </div>
                      ) : suggestedReturn < 0 ? (
                        <div>
                          <p className="text-xs text-emerald-400/70 uppercase tracking-wider">They owe</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ₹{Math.abs(suggestedReturn).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Settled</p>
                          <Minus className="h-5 w-5 text-slate-500 ml-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {isExpanded && person.timeline.length > 0 && (
                  <div className="ml-6 mt-2 pl-4 border-l-2 border-slate-800 space-y-3 py-2">
                    {person.timeline.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0 -ml-[21px]",
                          entry.direction === "received" ? "bg-emerald-400" : "bg-orange-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300">
                            {entry.event?.title || "Unknown Event"}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {format(new Date(entry.date), "dd MMM yyyy")}
                          </p>
                        </div>
                        <p className={cn(
                          "text-xs font-semibold",
                          entry.direction === "received" ? "text-emerald-400" : "text-orange-400"
                        )}>
                          {entry.direction === "received" ? "+" : "-"}₹{entry.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
