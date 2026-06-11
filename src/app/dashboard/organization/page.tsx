"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Building, Users, Settings, Link as LinkIcon, Copy } from "lucide-react";

export default function OrganizationPage() {
  const [org, setOrg] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchOrg() {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const orgId = userDoc.data().organizationId;
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          if (orgDoc.exists()) {
            setOrg({ id: orgDoc.id, ...orgDoc.data() });
            
            const q = query(collection(db, "users"), where("organizationId", "==", orgId));
            const usersSnapshot = await getDocs(q);
            const orgUsers = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(orgUsers);
          }
        }
      } catch (err) {
        console.error("Failed to fetch org details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, []);

  const handleGenerateInvite = async () => {
    if (!org) return;
    setGenerating(true);
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await addDoc(collection(db, "invites"), {
        code,
        organizationId: org.id,
        organizationName: org.name,
        createdBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      const link = `${window.location.origin}/auth?invite=${code}`;
      setInviteLink(link);
    } catch (err) {
      console.error("Failed to generate invite", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-zinc-400">Loading organization details...</div>;
  if (!org) return <div className="text-red-400">Organization not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <Building className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{org.name}</h1>
          <p className="text-zinc-400 mt-1">Manage your organization settings and members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold">Members</h2>
            </div>
            {users.find(u => u.id === auth.currentUser?.uid)?.role === "admin" && (
              <button 
                onClick={handleGenerateInvite}
                disabled={generating}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="w-3 h-3" /> {generating ? "Generating..." : "Generate Invite Link"}
              </button>
            )}
          </div>

          {inviteLink && (
            <div className="mb-4 bg-zinc-950 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between">
              <div className="truncate text-sm text-blue-400 mr-4 font-mono">{inviteLink}</div>
              <button 
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="text-zinc-400 hover:text-white"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div>
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </div>
                <div className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{u.role || "member"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-white">
            <Settings className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Allow Data Sharing (Contributions)</span>
              <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center p-1">
                <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">When enabled, external organizations can propose IOC contributions to your Global Threat Events.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
