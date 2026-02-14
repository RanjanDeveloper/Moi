"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Pencil,
  Loader2,
  Calendar,
  MapPin,
  ArrowUpDown,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";
import { Pagination } from "@/components/ui/pagination";
import { ContributorCombobox } from "@/components/contributor-combobox";

interface Transaction {
  id: string;
  contributorName: string;
  amount: number;
  notes: string | null;
  paidStatus: boolean;
  direction: "given" | "received";
  createdAt: string;
}

interface EventDetail {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  description: string | null;
  status: string;
  familyId: string;
  family: { id: string; name: string };
  creator: { name: string };
  totalReceived: number;
  totalGiven: number;
  transactionCount: number;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "createdAt" | "contributorName">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default sort for API
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txForm, setTxForm] = useState({
    contributorName: "",
    amount: "",
    notes: "",
    direction: "received" as "given" | "received",
    paidStatus: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${params.id}`);
      if (res.ok) {
        setEvent(await res.json());
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const query = new URLSearchParams({
        eventId: params.id as string,
        page: currentPage.toString(),
        limit: "10",
        sortBy,
        sortOrder,
        search
      });
      const res = await fetch(`/api/transactions?${query}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTxLoading(false);
    }
  }, [params.id, currentPage, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          familyId: event.familyId,
          contributorName: txForm.contributorName,
          amount: parseInt(txForm.amount),
          notes: txForm.notes || undefined,
          direction: txForm.direction,
          paidStatus: txForm.paidStatus,
        }),
      });

      if (res.ok) {
        toast.success("Entry added!");
        setAddDialogOpen(false);
        setTxForm({ contributorName: "", amount: "", notes: "", direction: "received", paidStatus: false });
        setTxForm({ contributorName: "", amount: "", notes: "", direction: "received", paidStatus: false });
        fetchEvent(); // Refresh stats
        fetchTransactions(); // Refresh list
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add entry");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorName: txForm.contributorName,
          amount: parseInt(txForm.amount),
          notes: txForm.notes || null,
          direction: txForm.direction,
          paidStatus: txForm.paidStatus,
        }),
      });

      if (res.ok) {
        toast.success("Entry updated!");
        setEditDialogOpen(false);
        setEditingTx(null);
        setEditingTx(null);
        fetchEvent();
        fetchTransactions();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (txId: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/transactions/${txId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Entry deleted");
        toast.success("Entry deleted");
        fetchEvent();
        fetchTransactions();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleStatus = async () => {
    if (!event) return;
    setTogglingStatus(true);
    try {
      const newStatus = event.status === "open" ? "closed" : "open";
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Event ${newStatus === "open" ? "reopened" : "closed"}`);
        fetchEvent();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleExport = () => {
    if (!event) return;
    window.open(`/api/transactions/export?eventId=${event.id}`, "_blank");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const entries = results.data.map((row: any) => ({
          contributorName: row["Contributor Name"] || row.contributorName || row.name,
          amount: row["Amount"] || row.amount,
          direction: row["Direction"] || row.direction || "received",
          notes: row["Notes"] || row.notes || "",
          paidStatus: row["Paid"] || row.paidStatus || false,
        }));

        try {
          const res = await fetch("/api/transactions/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entries,
              eventId: event.id,
              familyId: event.familyId,
            }),
          });
          const data = await res.json();
          toast.success(data.message);
          if (data.errors?.length > 0) {
            toast.warning(`${data.errors.length} entries had issues`);
          }
          fetchEvent();
          fetchTransactions();
        } catch {
          toast.error("Import failed");
        }
      },
    });
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setTxForm({
      contributorName: tx.contributorName,
      amount: String(tx.amount),
      notes: tx.notes || "",
      direction: tx.direction,
      paidStatus: tx.paidStatus,
    });
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Event not found</p>
      </div>
    );
  }

  // Removed client-side sorting/filtering logic as it is now handled by API
  
  // Stats come directly from event
  const totalReceived = event.totalReceived;
  const totalGiven = event.totalGiven;

  // Inline form JSX — NOT a component to avoid remount/focus loss
  const renderFormFields = (onSubmit: (e: React.FormEvent) => void, buttonLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Name</Label>
        <ContributorCombobox
          value={txForm.contributorName}
          onChange={(val) => setTxForm((prev) => ({ ...prev, contributorName: val }))}
          className="h-11"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Amount (₹)</Label>
          <Input
            type="number"
            placeholder="0"
            value={txForm.amount}
            onChange={(e) => setTxForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
            className="bg-slate-800/50 border-slate-700 text-white h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Direction</Label>
          <Select value={txForm.direction} onValueChange={(v: "given" | "received") => setTxForm((prev) => ({ ...prev, direction: v }))}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="given">Given</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Notes</Label>
        <Textarea
          placeholder="Optional notes..."
          value={txForm.notes}
          onChange={(e) => setTxForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="bg-slate-800/50 border-slate-700 text-white min-h-[60px]"
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {buttonLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Badge variant="outline" className={cn("text-xs", event.status === "open" ? "border-emerald-500/30 text-emerald-400" : "border-slate-600 text-slate-400")}>
              {event.status}
            </Badge>
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title={event.status === "open" ? "Close event" : "Reopen event"}
            >
              {event.status === "open" ? (
                <ToggleRight className="h-5 w-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-slate-500" />
              )}
            </button>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(event.date), "dd MMM yyyy")}
            </span>
            {event.location && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">Received</p>
          <p className="text-lg font-bold text-emerald-400">₹{totalReceived.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-orange-400/70">Given</p>
          <p className="text-lg font-bold text-orange-400">₹{totalGiven.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-indigo-400/70">Entries</p>
          <p className="text-lg font-bold text-indigo-400">{event.transactionCount}</p>
        </div>
      </div>

      {/* Recent Activity Timeline - Using paginated transactions */}
      {!txLoading && transactions.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            Recent Activity
          </h3>
          <div className="relative pl-4 border-l border-slate-800 space-y-6">
            {[...transactions]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((tx) => (
                <div key={tx.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-950",
                      tx.direction === "received" ? "bg-emerald-500" : "bg-orange-500"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 mb-0.5">
                      {format(new Date(tx.createdAt), "MMM d, h:mm a")}
                    </span>
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-white">
                        {tx.contributorName}
                      </span>{" "}
                      {tx.direction === "received" ? "contributed" : "received"}{" "}
                      <span
                        className={cn(
                          "font-medium",
                          tx.direction === "received"
                            ? "text-emerald-400"
                            : "text-orange-400"
                        )}
                      >
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 h-10"
          />
        </div>

        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
          {sortBy === "amount" ? "Amount" : sortBy === "contributorName" ? "Name" : "Date"}
        </Button>

        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1" />
          CSV
        </Button>



        <label>
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" asChild>
            <span>
              <Upload className="h-3.5 w-3.5 mr-1" />
              Import
            </span>
          </Button>
        </label>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Add Moi Entry</DialogTitle>
            </DialogHeader>
            {renderFormFields(handleAddTransaction, "Add Entry")}
          </DialogContent>
        </Dialog>
      </div>

      {/* Entries List */}
      {txLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No entries yet. Add your first moi entry!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-3 hover:border-slate-700 transition-colors"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                tx.direction === "received" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
              )}>
                {tx.contributorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{tx.contributorName}</p>
                  {tx.paidStatus && (
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">Paid</Badge>
                  )}
                </div>
                {tx.notes && <p className="text-xs text-slate-500 truncate mt-0.5">{tx.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn("text-sm font-bold", tx.direction === "received" ? "text-emerald-400" : "text-orange-400")}>
                  {tx.direction === "received" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-600">{format(new Date(tx.createdAt), "dd MMM")}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => openEdit(tx)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => handleDelete(tx.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!txLoading && transactions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={txLoading}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Entry</DialogTitle>
          </DialogHeader>
          {renderFormFields(handleEditTransaction, "Update Entry")}
        </DialogContent>
      </Dialog>
    </div>
  );
}
