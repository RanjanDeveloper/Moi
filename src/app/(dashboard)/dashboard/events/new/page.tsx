"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Family {
  id: string;
  name: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [form, setForm] = useState({
    familyId: "",
    title: "",
    type: "wedding" as string,
    location: "",
    description: "",
  });

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const res = await fetch("/api/families");
        if (res.ok) {
          const data = await res.json();
          setFamilies(data);
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, familyId: data[0].id }));
          }
        }
      } catch (error) {
        console.error("Error fetching families:", error);
      }
    };
    fetchFamilies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: selectedDate.toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        toast.success("Event created successfully!");
        router.push("/dashboard/events");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create event");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">New Event</h1>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {families.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-300">Family</Label>
                <Select
                  value={form.familyId}
                  onValueChange={(v) => setForm({ ...form, familyId: v })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-11">
                    <SelectValue placeholder="Select family" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {families.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                placeholder="e.g. Kumar's Wedding"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="wedding">💒 Wedding</SelectItem>
                    <SelectItem value="housewarming">🏠 Housewarming</SelectItem>
                    <SelectItem value="festival">🎉 Festival</SelectItem>
                    <SelectItem value="funeral">🕯️ Funeral</SelectItem>
                    <SelectItem value="custom">⭐ Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:text-white",
                        !selectedDate && "text-slate-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date ?? undefined);
                        setDatePickerOpen(false);
                      }}
                      className="rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Location</Label>
              <Input
                placeholder="e.g. Village Community Hall"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                placeholder="Optional notes about this event..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !form.familyId}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Create Event"
              )}
            </Button>

            {families.length === 0 && (
              <p className="text-sm text-amber-400 text-center">
                You need to create or join a family first before creating events.{" "}
                <Link href="/dashboard/family" className="underline">
                  Go to Family
                </Link>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
