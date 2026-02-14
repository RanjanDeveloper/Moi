"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Copy,
  Check,
  Crown,
  UserPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useSWR from "swr";

interface Family {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  role: string;
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function FamilyPage() {
  const { data: families = [], mutate: mutateFamilies } = useSWR<Family[]>("/api/families");
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  
  const { data: members = [] } = useSWR<Member[]>(
    selectedFamily ? `/api/families/${selectedFamily.id}/members` : null
  );

  const loading = !families;
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [familyDesc, setFamilyDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Select first family on load
  useEffect(() => {
    if (families && families.length > 0 && !selectedFamily) {
      setSelectedFamily(families[0]);
    }
  }, [families, selectedFamily]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName, description: familyDesc }),
      });
      if (res.ok) {
        toast.success("Family created!");
        setCreateDialogOpen(false);
        setFamilyName("");
        setFamilyDesc("");
        mutateFamilies();
      }
    } catch {
      toast.error("Failed to create family");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/families/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Joined family!");
        setJoinDialogOpen(false);
        setInviteCode("");
        mutateFamilies();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to join");
    } finally {
      setSubmitting(false);
    }
  };

  const copyInvite = () => {
    if (selectedFamily) {
      navigator.clipboard.writeText(selectedFamily.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Family</h1>
        <div className="flex gap-2">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10">
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Join a Family</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Invite Code</Label>
                  <Input
                    placeholder="Paste invite code here"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white h-11"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 h-11">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Join Family
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 h-10">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Family</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Family Name</Label>
                  <Input
                    placeholder="e.g. Kumar Family"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Description</Label>
                  <Input
                    placeholder="Optional description"
                    value={familyDesc}
                    onChange={(e) => setFamilyDesc(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white h-11"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 h-11">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Family
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {families.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-1">No family yet</h3>
          <p className="text-sm text-slate-500">Create a family or join one using an invite code</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family List */}
          <div className="space-y-2">
            {families.map((family) => (
              <div
                key={family.id}
                onClick={() => {
                  setSelectedFamily(family);
                }}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-all",
                  selectedFamily?.id === family.id
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {family.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{family.name}</p>
                    <Badge variant="outline" className={cn("text-[9px] mt-1", family.role === "admin" ? "border-amber-500/30 text-amber-400" : "border-slate-600 text-slate-400")}>
                      {family.role === "admin" ? "Admin" : "Member"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Family Details */}
          {selectedFamily && (
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-400" />
                      {selectedFamily.name}
                    </span>
                    {selectedFamily.role === "admin" && (
                      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedFamily.description && (
                    <p className="text-sm text-slate-400">{selectedFamily.description}</p>
                  )}

                  {/* Invite Code */}
                  <div className="rounded-xl bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Invite Code</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-indigo-400 font-mono bg-slate-900 px-3 py-2 rounded-lg">
                        {selectedFamily.inviteCode}
                      </code>
                      <Button variant="outline" size="icon" className="border-slate-700 text-slate-400 hover:text-white" onClick={copyInvite}>
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2">Share this code with family members to invite them</p>
                  </div>

                  {/* Members */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Members ({members.length})</p>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{member.user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{member.user.email}</p>
                          </div>
                          <Badge variant="outline" className={cn("text-[9px]", member.role === "admin" ? "border-amber-500/30 text-amber-400" : "border-slate-600 text-slate-400")}>
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
