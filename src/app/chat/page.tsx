"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useStore, Category } from '@/lib/store';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'bot-1', role: 'bot', text: "Hi — I'm here to listen. What's on your mind today? You can vent, ask for steps, or say you'd like a tiny next step." },
  ]);
  const messagesRef = useRef<Message[]>(messages);

  // keep a ref in sync so sendMessage can read the latest messages (avoids stale-closure issues)
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // session id for server-side conversation tracking
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    // load saved session id if present
    try {
      const saved = localStorage.getItem('chat_session_id');
      if (saved) {
        sessionIdRef.current = saved;
      } else {
        // generate a client-side session id to avoid race conditions before server issues one
        const clientId = `c-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
        sessionIdRef.current = clientId;
        try { localStorage.setItem('chat_session_id', clientId); } catch {}
      }
    } catch {}
  }, []);

  const [input, setInput] = useState('');
  const [inFlight, setInFlight] = useState(false); // prevent overlapping sends
  const listRef = useRef<HTMLDivElement | null>(null);

  // store method to create tasks from chat-generated steps
  const createTaskFromSteps = useStore((s) => s.createTaskFromSteps);

  // Save-as-task UI state
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskCategory, setTaskCategory] = useState<Category>('personal');

  // helper: parse assistant reply into steps heuristically
  function parseStepsFromText(text: string) {
    if (!text) return [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const bulletLines = lines.filter((l) => /^\d+\.|^-|^•|^\*/.test(l));
    const candidates = (bulletLines.length ? bulletLines : lines)
      .map((l) => l.replace(/^\d+\.|^-\s*|^•\s*|^\*\s*/, '').trim())
      .filter(Boolean);

    if (candidates.length > 0) {
      return candidates.slice(0, 5).map((text) => ({ text, duration_min: 2 }));
    }

    const sentences = text.split(/[\.\?\!]\s+/).map((s) => s.trim()).filter(Boolean);
    return sentences.slice(0, 5).map((s) => ({ text: s, duration_min: 2 }));
  }

  const handlePrepareSave = () => {
    const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
    if (!lastBot) return;
    const firstLine = lastBot.text.split(/\r?\n/)[0].slice(0, 60);
    setTaskTitleInput(firstLine || 'New task from chat');
    setShowSavePanel(true);
  };

  const handleSaveAsTask = () => {
    const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
    if (!lastBot) return;
    const steps = parseStepsFromText(lastBot.text);
    if (steps.length === 0) {
      steps.push({ text: lastBot.text.slice(0, 180), duration_min: 2 });
    }
    createTaskFromSteps(taskTitleInput || 'New task', taskCategory, steps);
    const confirmMsg: Message = { id: `b-${Date.now()}`, role: 'bot', text: `Saved as a task — created "${taskTitleInput}".` };
    setMessages((m) => [...m, confirmMsg]);
    setShowSavePanel(false);
  };

  useEffect(() => {
    // scroll to bottom on new messages
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const body = (text ?? input).trim();
    if (!body || inFlight) return;

    setInFlight(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: body };
    // append the user's message locally
    setMessages((m) => [...m, userMsg]);
    setInput('');

    // Add a temporary loading message
    const loadingId = `loading-${Date.now()}`;
    const loadingMsg: Message = { id: loadingId, role: 'bot', text: 'Companion is typing…' };
    setMessages((prev) => [...prev, loadingMsg]);

    // prepare recent history to send for context (include the new user message but exclude transient loading entries)
    const current = [...messagesRef.current, userMsg, loadingMsg];
    // remove transient loading placeholders (identified by id prefix 'loading-')
    const clean = current.filter((m) => !m.id.startsWith('loading-'));
    const history = clean.slice(-20); // keep up to last 20 messages for context

    // Send recent client-side history (helps continuity if server-side assistant replies haven't been persisted yet)
    const clientHistory = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    const payload = { messages: clientHistory, sessionId: sessionIdRef.current };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // use 'include' so cookies are sent/accepted even in cross-origin dev setups
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'API error');
      }
      const data = await res.json();
      const replyText = data?.reply || 'Sorry — I couldn\'t generate a response. Would you like to try again?';
      const returnedSession = data?.sessionId;
      if (returnedSession && returnedSession !== sessionIdRef.current) {
        sessionIdRef.current = returnedSession;
        try { localStorage.setItem('chat_session_id', returnedSession); } catch {}
      }
      // replace loading message with actual reply
      setMessages((m) => m.map((mm) => (mm.id === loadingId ? { id: `b-${Date.now()}`, role: 'bot', text: replyText } : mm)));
    } catch (err) {
      console.error('Chat request failed', err);
      const replyText = 'Sorry — I couldn\'t reach the companion. Would you like to try again?';
      setMessages((m) => m.map((mm) => (mm.id === loadingId ? { id: `b-${Date.now()}`, role: 'bot', text: replyText } : mm)));
    } finally {
      setInFlight(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold">Companion Chat</h1>
          <p className="text-sm text-muted-foreground">A friendly place to talk while you work.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div
          ref={listRef}
          role="log"
          aria-live="polite"
          className="max-h-[60vh] overflow-y-auto rounded-md border bg-card/50 p-4 space-y-3"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%]`}> 
                <div className={`text-[11px] mb-1 ${m.role === 'user' ? 'text-right text-muted-foreground' : 'text-left text-muted-foreground'}`}>
                  {m.role === 'user' ? 'You' : 'Companion'}
                </div>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-emerald-500/10 text-foreground text-right' : 'bg-muted text-muted-foreground text-left'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save-as-task CTA: show when there is at least one assistant message */}
        {messages.some((m) => m.role === 'bot') && !showSavePanel && (
          <div className="flex justify-end">
            <button
              onClick={handlePrepareSave}
              className="text-sm text-foreground/80 hover:underline"
            >
              Save last response as task
            </button>
          </div>
        )}

        {/* Save-as-task panel */}
        {showSavePanel && (
          <div className="space-y-2 rounded-md border bg-background p-3">
            <div className="flex gap-2">
              <input
                value={taskTitleInput}
                onChange={(e) => setTaskTitleInput(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                placeholder="Task title"
              />
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as Category)}
                className="rounded-md border bg-background px-2 py-2 text-sm"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="hobby">Hobby</option>
                <option value="health">Health</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSavePanel(false)} className="px-3 py-2 rounded-md border text-sm">Cancel</button>
              <button onClick={handleSaveAsTask} className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm">Save as task</button>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write to your companion — ask, vent, or plan a tiny step..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={inFlight}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {inFlight ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </main>
  );
}

