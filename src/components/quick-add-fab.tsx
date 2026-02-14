"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface QuickEvent {
  id: string;
  title: string;
}

export function QuickAddFAB() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<QuickEvent[]>([]);
  const [form, setForm] = useState({
    eventId: "",
    contributorName: "",
    amount: "",
    direction: "received" as "given" | "received",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, eventId: data[0].id }));
          }
        }
      } catch (e) {
        console.error("Error fetching events:", e);
      }
    };
    fetchEvents();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventId) {
      toast.error("Please select an event");
      return;
    }
    setSubmitting(true);

    // Get familyId from the selected event
    try {
      const eventRes = await fetch(`/api/events/${form.eventId}`);
      if (!eventRes.ok) {
        toast.error("Failed to load event details");
        setSubmitting(false);
        return;
      }
      const eventData = await eventRes.json();

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: form.eventId,
          familyId: eventData.familyId,
          contributorName: form.contributorName,
          amount: parseInt(form.amount),
          direction: form.direction,
        }),
      });

      if (res.ok) {
        toast.success("Entry added!");
        setOpen(false);
        setForm({ eventId: "", contributorName: "", amount: "", direction: "received" });
        router.refresh();
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

  return (
    <>
      {/* FAB — visible on mobile and tablet, hidden on desktop */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        aria-label="Quick add entry"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">Quick Add Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Event</Label>
              {events.length > 0 ? (
                <Select value={form.eventId} onValueChange={(v) => setForm((prev) => ({ ...prev, eventId: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-11">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-slate-500">No events found. Create one first.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input
                placeholder="Contributor name"
                value={form.contributorName}
                onChange={(e) => setForm((prev) => ({ ...prev, contributorName: e.target.value }))}
                required
                className="bg-slate-800/50 border-slate-700 text-white h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Direction</Label>
                <Select value={form.direction} onValueChange={(v: "given" | "received") => setForm((prev) => ({ ...prev, direction: v }))}>
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
            <Button type="submit" disabled={submitting || !form.eventId} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Entry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
