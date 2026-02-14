"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Receipt,
  Crown,
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

interface Analytics {
  totalReceived: number;
  totalGiven: number;
  netBalance: number;
  eventCount: number;
  transactionCount: number;
  topContributors: { name: string; total: number }[];
  monthlyData: { month: string; received: number; given: number }[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

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
                />
                <Bar
                  dataKey="given"
                  name="Given"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
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
    </div>
  );
}
