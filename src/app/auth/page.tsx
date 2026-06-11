"use client";

import { Suspense, useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, addDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Mail, Lock, Loader2, Building, Users } from "lucide-react";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [targetOrgId, setTargetOrgId] = useState("");

  useEffect(() => {
    async function checkInvite() {
      if (!inviteCode) return;
      setIsLogin(false); // Force registration mode
      const q = query(collection(db, "invites"), where("code", "==", inviteCode));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const inviteData = snapshot.docs[0].data();
        setTargetOrgId(inviteData.organizationId);
        setInviteOrgName(inviteData.organizationName || "an Organization");
      } else {
        setError("Invalid or expired invite link.");
      }
    }
    checkInvite();
  }, [inviteCode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;
        
        // Update profile name
        if (name) {
          await updateProfile(user, { displayName: name });
        }

        let finalOrgId = targetOrgId;

        // If no invite code, create new organization
        if (!finalOrgId) {
          const orgRef = await addDoc(collection(db, "organizations"), {
            name: orgName || "My Organization",
            ownerId: user.uid,
            settings: { allowDataSharing: true },
            createdAt: serverTimestamp()
          });
          finalOrgId = orgRef.id;
        }

        // Create user document linking to the organization
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: name || user.email?.split('@')[0],
          organizationId: finalOrgId,
          role: targetOrgId ? "member" : "admin",
          createdAt: serverTimestamp()
        });
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;

      // Check if user document already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        let finalOrgId = targetOrgId;

        if (!finalOrgId) {
          const orgRef = await addDoc(collection(db, "organizations"), {
            name: `${user.displayName || 'My'} Organization`,
            ownerId: user.uid,
            settings: { allowDataSharing: true },
            createdAt: serverTimestamp()
          });
          finalOrgId = orgRef.id;
        }

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          organizationId: finalOrgId,
          role: targetOrgId ? "member" : "admin",
          createdAt: serverTimestamp()
        });
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 border border-zinc-700 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">IOCAG Web</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isLogin ? "Sign in to access threat intelligence." : "Create an account to start analyzing."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white"
                placeholder="analyst@example.com"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {inviteCode && inviteOrgName ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-blue-400 font-medium">You've been invited!</p>
                    <p className="text-xs text-zinc-400">Join <span className="text-white font-bold">{inviteOrgName}</span></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Organization Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required={!isLogin && !inviteCode}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white"
                      placeholder="Acme Security"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center disabled:opacity-50 mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <div className="border-t border-zinc-800 flex-grow"></div>
          <span className="mx-4 text-xs text-zinc-500 uppercase font-medium">Or continue with</span>
          <div className="border-t border-zinc-800 flex-grow"></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center disabled:opacity-50 mt-6"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
          <button 
            onClick={() => { setIsLogin(!isLogin); router.replace('/auth'); }} 
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex justify-center items-center text-zinc-500">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
