"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SearchResult {
  events: { id: string; title: string; type: string; date: string; status: string }[];
  contributors: { contributorName: string; eventId: string; amount: number; direction: string }[];
}

export function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
        setResults(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setResults(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleEventClick = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`);
    setSearchOpen(false);
    setQuery("");
    setResults(null);
  };

  const hasResults = results && (results.events.length > 0 || results.contributors.length > 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="text-base font-bold text-white">Moi Ledger</span>
        </div>

        {/* Desktop greeting */}
        <div className="hidden lg:block">
          <h2 className="text-sm text-slate-400">
            Welcome back,{" "}
            <span className="text-white font-medium">
              {session?.user?.name || "User"}
            </span>
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (!searchOpen) setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700/50 text-[10px] text-slate-500 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Search dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="p-3 border-b border-slate-800">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events, people..."
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-10"
                    autoFocus
                  />
                </div>

                {searching && (
                  <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
                )}

                {!searching && query.length >= 2 && !hasResults && (
                  <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                )}

                {hasResults && (
                  <div className="max-h-80 overflow-y-auto">
                    {results.events.length > 0 && (
                      <div>
                        <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Events</p>
                        {results.events.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => handleEventClick(ev.id)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-indigo-400">
                                {ev.type === "wedding" ? "💒" : ev.type === "festival" ? "🎉" : ev.type === "housewarming" ? "🏠" : "⭐"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{ev.title}</p>
                              <p className="text-[10px] text-slate-500">
                                {format(new Date(ev.date), "dd MMM yyyy")} · {ev.status}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.contributors.length > 0 && (
                      <div>
                        <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">People</p>
                        {results.contributors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => handleEventClick(c.eventId)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-emerald-400">{c.contributorName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{c.contributorName}</p>
                              <p className="text-[10px] text-slate-500">
                                ₹{c.amount.toLocaleString("en-IN")} · {c.direction}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!searching && query.length < 2 && (
                  <div className="p-4 text-center text-sm text-slate-600">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            )}
          </div>

          <NotificationsDropdown />
        </div>
      </div>
    </header>
  );
}
