"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Plus,
  MapPin,
  Search,
  Heart,
  Home,
  PartyPopper,
  Flame,
  Star,
  Gift,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";


const typeIcons: Record<string, React.ElementType> = {
  wedding: Gift,
  housewarming: Home,
  festival: PartyPopper,
  funeral: Flame,
  custom: Star,
};

const typeColors: Record<string, string> = {
  wedding: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  housewarming: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  festival: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  funeral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  custom: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  description: string | null;
  status: string;
  family?: { name: string };
  creator?: { name: string };
  transactions?: unknown[];
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounce search
  useEffect(() => {
     const timer = setTimeout(() => {
       setDebouncedSearch(search);
       setCurrentPage(1);
     }, 300);
     return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: "12",
  });

  const { data: eventsRes, isLoading: eventsLoading } = useSWR(`/api/events?${params}`);
  const { data: favorites, isLoading: favLoading } = useSWR<string[]>("/api/favorites");

  const events: Event[] = eventsRes?.data || [];
  const totalPages = eventsRes?.meta?.totalPages || 1;
  const favoriteIds = new Set(favorites || []);
  const loading = eventsLoading || favLoading;

  const toggleFavorite = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const newFavorites = new Set(favoriteIds);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
    } else {
      newFavorites.add(eventId);
    }
    const newFavArray = Array.from(newFavorites);

    // Optimistic update
    mutate("/api/favorites", newFavArray, false);

    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      mutate("/api/favorites");
    } catch {
      mutate("/api/favorites");
    }
  };

  const filtered = events
    .filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.type.toLowerCase().includes(search.toLowerCase())
    )
    .filter((e) => (filter === "favorites" ? favoriteIds.has(e.id) : true));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <Link href="/dashboard/events/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 h-10">
            <Plus className="h-4 w-4 mr-1" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 h-11"
          />
        </div>
        <Button
          variant={filter === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-slate-300 h-11 px-4"
        >
          All
        </Button>
        <Button
          variant={filter === "favorites" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter("favorites")}
          className="text-slate-300 h-11 px-4"
        >
          <Heart className={cn("h-4 w-4 mr-1", filter === "favorites" && "fill-pink-500 text-pink-500")} />
          Favorites
        </Button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {filter === "favorites" ? (
            <>
              <Heart className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-1">No favorites yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Click the heart icon on events to add them to favorites
              </p>
              <Button onClick={() => setFilter("all")} variant="outline" className="border-slate-700 text-slate-300">
                View all events
              </Button>
            </>
          ) : (
            <>
              <Calendar className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-1">No events yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Create your first event to start tracking contributions
              </p>
              <Link href="/dashboard/events/new">
                <Button className="bg-indigo-600 hover:bg-indigo-500">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Event
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => {
            const Icon = typeIcons[event.type] || Star;
            const isFav = favoriteIds.has(event.id);
            return (
              <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all duration-200 cursor-pointer relative">
                  {/* Favorite button */}
                  <button
                    onClick={(e) => toggleFavorite(e, event.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors z-10"
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-all",
                        isFav
                          ? "fill-pink-500 text-pink-500 scale-110"
                          : "text-slate-600 hover:text-pink-400"
                      )}
                    />
                  </button>

                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeColors[event.type]?.split(" ")[0] || "bg-slate-800")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        event.status === "open"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-slate-600 text-slate-400"
                      )}
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {event.title}
                  </h3>
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(event.date), "dd MMM yyyy")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  {event.family && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {event.family.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}


      {!loading && events.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={loading}
        />
      )}
    </div>
  );
}
