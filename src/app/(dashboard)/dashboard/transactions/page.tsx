"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { useContributorHistory } from "@/components/contributor-history-provider";

interface Transaction {
  id: string;
  contributorName: string;
  amount: number;
  direction: "given" | "received";
  createdAt: string;
  event?: { title: string; date: string };
  paidStatus: boolean;
}

export default function TransactionsPage() {
  const { openContributorHistory } = useContributorHistory();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "createdAt" | "contributorName">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
      });
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const toggleSort = (field: "amount" | "createdAt" | "contributorName") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "createdAt" ? "secondary" : "outline"}
            size="sm"
            onClick={() => toggleSort("createdAt")}
            className={cn("h-10", sortBy !== "createdAt" && "border-slate-700 text-slate-300")}
          >
            Date
            {sortBy === "createdAt" && <ArrowUpDown className="ml-2 h-3 w-3" />}
          </Button>
          <Button
            variant={sortBy === "amount" ? "secondary" : "outline"}
            size="sm"
            onClick={() => toggleSort("amount")}
            className={cn("h-10", sortBy !== "amount" && "border-slate-700 text-slate-300")}
          >
            Amount
            {sortBy === "amount" && <ArrowUpDown className="ml-2 h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                tx.direction === "received" ? "bg-emerald-500/10" : "bg-orange-500/10"
              )}>
                {tx.direction === "received" ? (
                  <TrendingDown className="h-5 w-5 text-emerald-400" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => openContributorHistory(tx.contributorName)}
                    className="text-sm font-semibold text-white truncate hover:underline hover:text-indigo-400 text-left"
                  >
                    {tx.contributorName}
                  </button>
                  {tx.paidStatus && (
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 px-1.5 py-0">
                      Paid
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="truncate max-w-[200px]">
                    {tx.event?.title || "Unknown Event"}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(tx.createdAt), "dd MMM yyyy")}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={cn(
                  "text-sm font-bold block",
                  tx.direction === "received" ? "text-emerald-400" : "text-orange-400"
                )}>
                  {tx.direction === "received" ? "+" : "−"}₹{tx.amount.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  {tx.direction}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && transactions.length > 0 && (
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
