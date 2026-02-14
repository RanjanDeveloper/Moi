"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContributorHistory } from "@/components/contributor-history-provider";

interface Transaction {
  id: string;
  amount: number;
    direction: "given" | "received";
    contributorName: string;
    createdAt: Date | string;
    event?: {
        title: string;
        date?: Date | string;
    } | null;
}

interface RecentTransactionsListProps {
  transactions: Transaction[];
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  const { openContributorHistory } = useContributorHistory();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Receipt className="h-4 w-4 text-emerald-400" />
          Recent Transactions
        </h3>
        <Link href="/dashboard/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/20">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  tx.direction === "received"
                    ? "bg-emerald-500/10"
                    : "bg-orange-500/10"
                )}
              >
                {tx.direction === "received" ? (
                  <TrendingDown className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => openContributorHistory(tx.contributorName)}
                  className="text-sm font-medium text-white truncate hover:underline hover:text-indigo-400 text-left block w-full"
                >
                  {tx.contributorName}
                </button>
                <p className="text-xs text-slate-500 truncate">
                  {tx.event?.title || "Event"} ·{" "}
                  {format(new Date(tx.createdAt), "dd MMM")}
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold flex-shrink-0",
                  tx.direction === "received"
                    ? "text-emerald-400"
                    : "text-orange-400"
                )}
              >
                {tx.direction === "received" ? "+" : "−"}₹
                {tx.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
          No recent transactions
        </div>
      )}
    </div>
  );
}
