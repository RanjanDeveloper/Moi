"use client";

import useSWR from "swr";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Receipt,
  Crown,
  Clock,
  ArrowRight,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RecentTransactionsList } from "@/components/recent-transactions-list";

interface Analytics {
  totalReceived: number;
  totalGiven: number;
  netBalance: number;
  eventCount: number;
  transactionCount: number;
  topContributors: { name: string; total: number }[];
  monthlyData: { month: string; received: number; given: number }[];
}

interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  status: string;
}

interface RecentTransaction {
  id: string;
  contributorName: string;
  amount: number;
  direction: "given" | "received";
  createdAt: string;
  event?: { title: string };
}

export default function DashboardPage() {
  const { data: analytics, error: analyticsError, isLoading: analyticsLoading } = useSWR<Analytics>("/api/analytics");
  const { data: eventsRes, error: eventsError, isLoading: eventsLoading } = useSWR("/api/events");
  const { data: txRes, error: txError, isLoading: txLoading } = useSWR("/api/transactions?sortBy=createdAt&sortOrder=desc");

  const loading = analyticsLoading || eventsLoading || txLoading;
  const error = analyticsError || eventsError || txError;

  // Derive upcoming events
  const upcomingEvents: UpcomingEvent[] = (() => {
    if (!eventsRes) return [];
    const events = eventsRes.data || eventsRes;
    const now = new Date();
    return events
      .filter((e: UpcomingEvent) => new Date(e.date) >= now && e.status === "open")
      .sort((a: UpcomingEvent, b: UpcomingEvent) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  })();

  // Derive recent transactions
  const recentTransactions: RecentTransaction[] = (() => {
    if (!txRes) return [];
    const txs = txRes.data || txRes;
    return txs.slice(0, 5);
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const data = analytics || {
    totalReceived: 0,
    totalGiven: 0,
    netBalance: 0,
    eventCount: 0,
    transactionCount: 0,
    topContributors: [],
    monthlyData: [],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Received"
          value={data.totalReceived}
          icon={TrendingDown}
          subtitle={`${data.transactionCount} entries`}
          iconClassName="bg-emerald-500/10"
        />
        <StatCard
          title="Total Given"
          value={data.totalGiven}
          icon={TrendingUp}
          iconClassName="bg-orange-500/10"
        />
        <StatCard
          title="Net Balance"
          value={data.netBalance}
          icon={Wallet}
          trend={data.netBalance >= 0 ? "up" : "down"}
          subtitle={data.netBalance >= 0 ? "You are owed" : "You owe"}
          iconClassName="bg-indigo-500/10"
        />
        <StatCard
          title="Events"
          value={String(data.eventCount)}
          icon={Calendar}
          iconClassName="bg-purple-500/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Monthly Overview
          </h3>
          {data.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => {
                    const [y, m] = v.split("-");
                    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1]} ${y.slice(2)}`;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v}`}/>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value: number | string | undefined) => [`₹${Number(value || 0).toLocaleString("en-IN")}`, ""]}
                />
                <Legend />
                <Bar
                  dataKey="received"
                  name="Received"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="given"
                  name="Given"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
              No data yet. Create events and add entries to see charts.
            </div>
          )}
        </div>

        {/* Top Contributors */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            Top Contributors
          </h3>
          {data.topContributors.length > 0 ? (
            <div className="space-y-3">
              {data.topContributors.slice(0, 8).map((contributor, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {contributor.name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    ₹{Number(contributor.total).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              No contributions yet
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Upcoming Events
            </h3>
            <Link href="/dashboard/events" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.date), "dd MMM yyyy")}
                        {event.location && (
                          <>
                            <MapPin className="h-3 w-3 ml-1" />
                            <span className="truncate">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
              No upcoming events
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <RecentTransactionsList transactions={recentTransactions} />
      </div>
    </div>
  );
}
