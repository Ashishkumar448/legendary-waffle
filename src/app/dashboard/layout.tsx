"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  Search, 
  Upload, 
  Share2, 
  Clock, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  Building,
  Globe,
  Inbox,
  Activity
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>("Threat Events");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const navItems = [
    { name: "My Organization", href: "/dashboard/organization", icon: Building },
    { 
      name: "Threat Events", 
      icon: Globe,
      subItems: [
        { name: "All", href: "/dashboard/events?filter=all", filterKey: "all" },
        { name: "My Organization", href: "/dashboard/events?filter=org", filterKey: "org" },
        { name: "Global", href: "/dashboard/events?filter=global", filterKey: "global" }
      ]
    },
    { name: "Contributions Inbox", href: "/dashboard/contributions", icon: Inbox },
    { name: "Manual Enrichment", href: "/dashboard", icon: ShieldAlert },
    { name: "Bulk Upload", href: "/dashboard/bulk", icon: Upload },
    { name: "Global Search", href: "/dashboard/search", icon: Search },
    { name: "Live Threat Map", href: "/dashboard/live-map", icon: Activity },
    { name: "Graph Investigation", href: "/dashboard/graph", icon: Share2 },
    { name: "Timeline", href: "/dashboard/timeline", icon: Clock },
    { name: "What-If Sandbox", href: "/dashboard/what-if", icon: HelpCircle },
  ];

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold tracking-tight text-lg">IOCAG</span>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              
              if (item.subItems) {
                const isExpanded = expandedNav === item.name;
                const activeFilter = searchParams.get("filter") || "all";
                const isAnyChildActive = pathname.startsWith("/dashboard/events");
                
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => setExpandedNav(isExpanded ? null : item.name)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isAnyChildActive && !isExpanded ? "text-blue-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isAnyChildActive ? "text-blue-400" : "text-zinc-500"}`} />
                        {item.name}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="pl-9 pr-2 py-1 space-y-1">
                        {item.subItems.map(subItem => {
                          const isSubActive = isAnyChildActive && activeFilter === subItem.filterKey;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`
                                block px-3 py-2 rounded-md text-xs font-medium transition-colors
                                ${isSubActive 
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"}
                              `}
                            >
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href || item.name}
                  href={item.href || "#"}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent"}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-500 mb-4 px-3 truncate">
              {auth.currentUser?.email}
            </div>
            <button 
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
