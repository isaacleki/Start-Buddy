import { NextRequest, NextResponse } from 'next/server';

let openaiPromise: Promise<any> | null = null;
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiPromise) {
    openaiPromise = import('openai').then((module) => {
      const OpenAI = module.default;
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    });
  }
  return openaiPromise;
}

// Simple in-memory session store to keep recent conversation turns per user session (dev use only)
// Structure: sessionId -> { messages: [{role,content}], updated: timestamp }
const sessionStore = new Map<string, { messages: Array<{ role: string; content: string }>; updated: number }>();
const MAX_SESSION_MESSAGES = 50;
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24 hours

function pruneSessions() {
  const now = Date.now();
  for (const [id, entry] of sessionStore.entries()) {
    if (now - entry.updated > SESSION_TTL) sessionStore.delete(id);
  }
}
function genSessionId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // 20 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function detectCrisis(text: string) {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    'suicide',
    'kill myself',
    'end my life',
    'want to die',
    "can't go on",
    'cant go on',
    'no reason to live',
    'i am going to kill myself',
    'i will kill myself',
  ];

  return patterns.some((p) => t.includes(p));
}

function detectEmotion(text: string) {
  if (!text) return null;
  const t = text.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/\blonely\b|\balone\b/, 'lonely'],
    [/\bsad\b|\bdown\b|\bdepressed\b/, 'sad'],
    [/\banxious\b|\bworried\b|\bstressed\b/, 'anxious'],
    [/\btired\b|\bexhausted\b/, 'tired'],
    [/\bfrustrat|\bangry\b/, 'frustrated'],
    [/\bbored\b/, 'bored'],
    [/\bhappy\b|\bexcited\b/, 'happy'],
  ];

  for (const [re, label] of map) {
    if (re.test(t)) return label;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    pruneSessions();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { messages: incomingMessages, sessionId: incomingSessionId } = body;
    // Prefer session id from cookie when available (browser session), fallback to payload
    const cookieSession = request.cookies?.get?.('chat_session')?.value || null;

    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // ✅ Normalize incoming roles correctly (no accidental default to assistant)
    const normalizedIncoming = incomingMessages
      .map((m: any) => ({
        role:
          (String(m?.role ?? '').toLowerCase() === 'assistant' ||
           String(m?.role ?? '').toLowerCase() === 'bot')
            ? 'assistant'
            : 'user',
        content: String(m?.content ?? ''),
      }))
      .filter((m) => m.content.trim().length > 0);

    // Session handling: use payload first (so client-stored id wins), else cookie, else new
    let sessionId =
      (typeof incomingSessionId === 'string' && incomingSessionId.length > 0
        ? incomingSessionId
        : cookieSession) || genSessionId();

    const existingEntry = sessionStore.get(sessionId) ?? { messages: [], updated: Date.now() };

    // ✅ Robust continuity:
    // - If server has no history (e.g., dev hot reload), seed from client's transcript.
    // - Otherwise, only append the latest *user* turn if it's new (prevents dupes / drift).
    let mergedSession = existingEntry.messages.slice();
    if (mergedSession.length === 0) {
      mergedSession = normalizedIncoming.slice(-MAX_SESSION_MESSAGES);
    } else {
      const lastIncomingUser = [...normalizedIncoming].reverse().find((m) => m.role === 'user');
      if (lastIncomingUser) {
        const lastStoredUser = [...mergedSession].reverse().find((m) => m.role === 'user');
        if (!lastStoredUser || lastStoredUser.content !== lastIncomingUser.content) {
          mergedSession.push(lastIncomingUser);
        }
      }
    }

    // Trim and persist
    mergedSession = mergedSession.slice(-MAX_SESSION_MESSAGES);
    sessionStore.set(sessionId, { messages: mergedSession, updated: Date.now() });

    // Safety pass
    const lastUser = [...mergedSession].reverse().find((m) => m.role === 'user');
    const lastText = lastUser?.content || '';

    if (detectCrisis(lastText)) {
      const crisisReply =
        "I'm really sorry you're feeling this way. If you're thinking about hurting yourself or ending your life, please seek immediate help. " +
        'If you are in the United States you can call or text 988 for the Suicide & Crisis Lifeline, or call emergency services right away. ' +
        "If you're elsewhere, please contact your local emergency number or a national crisis line. " +
        "I can stay here and listen, but I'm not a substitute for professional help. Would you like resources or help finding someone to talk to now?";

      mergedSession.push({ role: 'assistant', content: crisisReply });
      sessionStore.set(sessionId, { messages: mergedSession.slice(-MAX_SESSION_MESSAGES), updated: Date.now() });

      const crisisRes = NextResponse.json({ reply: crisisReply, sessionId, crisis: true });
      crisisRes.cookies.set('chat_session', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: true,
      });
      return crisisRes;
    }

    const openai = await getOpenAIClient();
    if (!openai) {
      // Local conversational fallback when no OpenAI key is present.
      const last = lastText.trim();
      const emotion = detectEmotion(last);

      const suggestions = [
        'Would you like to try a tiny 2-minute step to help—like a quick breathing break?',
        'If it helps, tell me one small thing that would make this moment a bit easier.',
        'I can listen—what part of this feels heaviest right now?',
      ];

      let reply = '';
      if (last.length === 0) {
        reply = "I'm here when you're ready to share. What's on your mind?";
      } else if (emotion) {
        const empathies: Record<string, string> = {
          lonely: `It sounds like you're feeling lonely — I'm really glad you reached out. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          sad: `I'm sorry you're feeling sad. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          anxious: `That sounds worrying — it's understandable to feel anxious. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          tired: `You sound exhausted. A tiny break can sometimes help. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          frustrated: `That sounds frustrating — I'm sorry you're dealing with that. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          bored: `I hear you — feeling bored can be heavy too. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          happy: `That's great to hear — tell me more about what's going well!`,
        };
        reply = empathies[emotion] ?? `It sounds like you're feeling ${emotion}. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`;
      } else if (last.split(/\s+/).length <= 3) {
        const shortReplies = ["Hey — how are you feeling right now?", "Hi — what's up for you today?", "Nice to hear from you — want to tell me more?"];
        reply = shortReplies[Math.floor(Math.random() * shortReplies.length)];
      } else {
        reply = `Thanks for sharing. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`;
      }

      mergedSession.push({ role: 'assistant', content: reply });
      sessionStore.set(sessionId, { messages: mergedSession.slice(-MAX_SESSION_MESSAGES), updated: Date.now() });

      const fallbackRes = NextResponse.json({ reply, fallback: true, sessionId });
      fallbackRes.cookies.set('chat_session', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: true,
      });
      return fallbackRes;
    }

    // Build system prompt for an empathetic, conversational assistant
    const system = `You are a warm, conversational, and compassionate listener for people who are feeling lonely, low, or overwhelmed.
Your goals:
- Validate feelings and reflect what the user says (e.g., "It sounds like you're feeling...")
- Ask open, gentle questions to encourage sharing (e.g., "Would you like to tell me more about that?")
- Offer small, practical suggestions when appropriate (short, optional 1-3 step ideas)
- Avoid giving medical or legal advice; always encourage professional help for serious concerns
- If the user mentions self-harm, suicide, or immediate danger, respond with supportive text and strongly encourage contacting emergency services and crisis hotlines (do not attempt to counsel clinically)

Keep replies conversational and concise (a few short paragraphs). Use first-person, empathetic language. When useful, suggest one small next step and ask if the user wants to try it.`;

    const emotion = detectEmotion(lastText);
    const emotionInstruction = emotion
      ? { role: 'system', content: `The user's last message suggests they feel ${emotion}. Begin your reply with a concise, validating reflection (e.g., "It sounds like you're feeling ${emotion}."). Then ask a gentle open question or offer a small step.` }
      : null;

    // Merge system with session messages (ensure system is the first message)
    const chatMessages = [
      { role: 'system', content: system },
      ...(emotionInstruction ? [emotionInstruction] : []),
      ...mergedSession.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = completion.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content from OpenAI');

      mergedSession.push({ role: 'assistant', content });
      sessionStore.set(sessionId, { messages: mergedSession.slice(-MAX_SESSION_MESSAGES), updated: Date.now() });

      const successRes = NextResponse.json({ reply: content, sessionId });
      successRes.cookies.set('chat_session', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: true,
      });
      return successRes;
    } catch (err) {
      console.error('OpenAI chat error:', err);
      const fallback = `Thanks for sharing — I'm here to listen. Tell me more about how you're feeling, or we can try a tiny next step together.`;
      mergedSession.push({ role: 'assistant', content: fallback });
      sessionStore.set(sessionId, { messages: mergedSession.slice(-MAX_SESSION_MESSAGES), updated: Date.now() });

      const errRes = NextResponse.json({ reply: fallback, fallback: true, sessionId });
      errRes.cookies.set('chat_session', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: true,
      });
      return errRes;
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
