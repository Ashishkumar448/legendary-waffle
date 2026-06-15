"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { MessageSquare, Send, Loader2, User } from "lucide-react";
import { format } from "date-fns";

export default function Comments({ eventId, orgId }: { eventId: string, orgId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      try {
        const q = query(collection(db, "comments"), where("eventId", "==", eventId));
        const snap = await getDocs(q);
        const list: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setComments(list);
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [eventId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;
    setPosting(true);

    try {
      const commentPayload = {
        eventId,
        organizationId: orgId,
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        text: newComment.trim(),
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "comments"), commentPayload);
      setComments([...comments, { id: docRef.id, ...commentPayload }]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex flex-col h-[500px]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-white">Analyst Discussion</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-10">No comments yet. Start the discussion!</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-200">{c.authorEmail?.split('@')[0] || "Analyst"}</span>
                  <span className="text-xs text-zinc-500">{format(new Date(c.timestamp), "MMM dd, HH:mm")}</span>
                </div>
                <div className="text-sm text-zinc-300 bg-zinc-800/50 p-3 rounded-xl rounded-tl-none border border-zinc-700/50 whitespace-pre-wrap">
                  {c.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <form onSubmit={handlePost} className="relative">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add an analyst note or discussion point..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-[60px]"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePost(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={posting || !newComment.trim()}
            className="absolute right-2 bottom-2 top-2 w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
