"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Building, Users, Settings, Link as LinkIcon, Copy, Save, Loader2, Shield } from "lucide-react";

export default function OrganizationPage() {
  const [org, setOrg] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [autoEnrich, setAutoEnrich] = useState(true);

  const currentUserRole = users.find(u => u.id === auth.currentUser?.uid)?.role || "member";
  const isAdmin = currentUserRole === "admin";

  useEffect(() => {
    async function fetchOrg() {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const orgId = userDoc.data().organizationId;
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            setOrg({ id: orgDoc.id, ...orgData });
            setOrgName(orgData.name || "");
            setAutoEnrich(orgData.autoEnrich !== false);
            
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const saveSettings = async () => {
    if (!org || !isAdmin) return;
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, "organizations", org.id), {
        name: orgName,
        autoEnrich: autoEnrich
      });
      setOrg({ ...org, name: orgName, autoEnrich });
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  if (!org) return <div className="text-red-400 p-8">Organization not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
          <Building className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{org.name}</h1>
          <p className="text-zinc-400 mt-1">Manage your organization settings, members, and API defaults.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Column */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800"><Users className="w-5 h-5 text-indigo-400" /></div>
              <h2 className="text-xl font-bold">Members & Access</h2>
            </div>
            {isAdmin && (
              <button 
                onClick={handleGenerateInvite}
                disabled={generating}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 font-medium shadow-md shadow-indigo-600/20"
              >
                <LinkIcon className="w-4 h-4" /> {generating ? "Generating..." : "Generate Invite Link"}
              </button>
            )}
          </div>

          {inviteLink && (
            <div className="mb-6 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between">
              <div className="truncate text-sm text-indigo-400 mr-4 font-mono">{inviteLink}</div>
              <button 
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="text-indigo-400 hover:text-white p-2 hover:bg-indigo-500/20 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold uppercase shadow-inner">
                    {u.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      {u.name} {u.id === auth.currentUser?.uid && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md font-medium">You</span>}
                    </div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </div>
                </div>
                
                {isAdmin && u.id !== auth.currentUser?.uid ? (
                  <select 
                    value={u.role || "member"} 
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg font-medium text-zinc-400">
                    {u.role === "admin" && <Shield className="w-3 h-3 text-red-400" />}
                    {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Member"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Column */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 text-white mb-6">
            <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800"><Settings className="w-5 h-5 text-blue-400" /></div>
            <h2 className="text-xl font-bold">Workspace Settings</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-300">Organization Name</label>
              <input 
                type="text" 
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300">Default API Behaviors</h3>
              
              <div className="flex items-center justify-between bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                <div>
                  <div className="text-sm font-bold text-zinc-200">Auto-Enrich New IOCs</div>
                  <div className="text-xs text-zinc-500 mt-1 max-w-[250px]">Automatically query VirusTotal and AlienVault when adding IOCs to campaigns.</div>
                </div>
                <button 
                  disabled={!isAdmin}
                  onClick={() => setAutoEnrich(!autoEnrich)}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none disabled:opacity-50 ${autoEnrich ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoEnrich ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <button 
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
