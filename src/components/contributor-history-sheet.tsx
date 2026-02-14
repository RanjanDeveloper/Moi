"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { Loader2, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  direction: "given" | "received";
  notes: string | null;
  createdAt: string;
  event: {
    title: string;
    date: string;
  };
}

interface ContributorHistorySheetProps {
  contributorName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContributorHistorySheet({
  contributorName,
  isOpen,
  onClose,
}: ContributorHistorySheetProps) {
  const { data: res, isLoading: loading } = useSWR(
    isOpen && contributorName
      ? `/api/transactions?contributorName=${encodeURIComponent(contributorName)}&limit=100`
      : null
  );

  const transactions: Transaction[] = res?.data || [];

  const totalReceived = transactions
    .filter((t) => t.direction === "received")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalGiven = transactions
    .filter((t) => t.direction === "given")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-slate-900 border-l border-slate-800 text-white w-full sm:max-w-md overflow-y-auto p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-white">
            {contributorName}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Transaction history across all events
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                  Total Received
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  ₹{totalReceived.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-orange-400/70">
                  Total Given
                </p>
                <p className="text-lg font-bold text-orange-400">
                  ₹{totalGiven.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">History</h3>
              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  No transactions found.
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {tx.event?.title || "Unknown Event"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(tx.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-bold",
                            tx.direction === "received"
                              ? "text-emerald-400"
                              : "text-orange-400"
                          )}
                        >
                          {tx.direction === "received" ? "+" : "-"}₹
                          {tx.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-800/30 p-1.5 rounded">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
