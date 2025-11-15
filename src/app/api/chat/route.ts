import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
type ChatTurn = { role: 'user' | 'assistant'; content: string };
const sessionStore = new Map<string, { messages: ChatTurn[]; updated: number }>();
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
  if (record.count >= RATE_LIMIT) return false;

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

// Emotion detection (also catches short negative cues like “not good”)
function detectEmotion(text: string) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/\bnot\s+good\b|\bbad\b|\bawful\b|\bterrible\b|\brough\b|\bmeh\b/.test(t)) return 'sad';

  const map: Array<[RegExp, string]> = [
    [/\blonely\b|\balone\b/, 'lonely'],
    [/\bsad\b|\bdown\b|\bdepressed\b/, 'sad'],
    [/\banxious\b|\bworried\b|\bstressed\b/, 'anxious'],
    [/\btired\b|\bexhausted\b/, 'tired'],
    [/\bfrustrat|\bangry\b/, 'frustrated'],
    [/\bbored\b/, 'bored'],
    [/\bhappy\b|\bexcited\b/, 'happy'],
  ];
  for (const [re, label] of map) if (re.test(t)) return label;
  return null;
}

// Helper: last assistant message content (for anti-repeat + follow-through).
function lastAssistantText(arr: ChatTurn[]) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].role === 'assistant') return arr[i].content || '';
  return '';
}
// Helper: avoid sending the exact same assistant line back-to-back.
function pickDifferent(options: string[], avoid: string) {
  const trimmed = (avoid || '').trim();
  for (const opt of options) if (opt.trim() && opt.trim() !== trimmed) return opt;
  return options[0];
}
// Helper: if client seeded a greeting, don’t start prompts with assistant text.
function stripLeadingAssistant(transcript: ChatTurn[]): ChatTurn[] {
  let i = 0;
  while (i < transcript.length && transcript[i].role === 'assistant') i++;
  const sliced = transcript.slice(i);
  return sliced.length ? sliced : transcript;
}

export async function POST(request: Request) {
  try {
    pruneSessions();

    // Basic rate limit (IP best-effort)
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { messages: incomingMessages, sessionId: incomingSessionId } = body;

    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // Read cookie via next/headers
    const cookieStore = cookies();
    const cookieSession = cookieStore.get('chat_session')?.value || null;

    // ✅ Normalize incoming roles correctly (no accidental default to assistant)
    const normalizedIncoming: ChatTurn[] = (incomingMessages as any[])
      .map((m: any): ChatTurn => ({
        role:
          (String(m?.role ?? '').toLowerCase() === 'assistant' ||
           String(m?.role ?? '').toLowerCase() === 'bot')
            ? 'assistant'
            : 'user',
        content: String(m?.content ?? ''),
      }))
      .filter((m) => m.content.trim().length > 0);

    // Session handling: use payload first (so client-stored id wins), else cookie, else new
    const sessionId =
      (typeof incomingSessionId === 'string' && incomingSessionId.length > 0
        ? incomingSessionId
        : cookieSession) || genSessionId();

    // ✅ Deterministic continuity: trust the client's last-N transcript; avoid server-side diffing/duplication.
    const mergedSession = stripLeadingAssistant(
      normalizedIncoming.slice(-MAX_SESSION_MESSAGES)
    );
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
      const crisisRes = NextResponse.json({ reply: crisisReply, sessionId, crisis: true });
      crisisRes.cookies.set('chat_session', sessionId, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax', httpOnly: true });
      return crisisRes;
    }

    const openai = await getOpenAIClient();
    if (!openai) {
      // Local conversational fallback when no OpenAI key is present.
      // Produce a context-aware reply (reflect + tiny step; respect user intents; follow through on “yes”).

      const last = lastText.trim();
      const emotion = detectEmotion(last);

      // Intent & affirmation recognition
      const prevAssistant = lastAssistantText(mergedSession);

      const mentionsMusic   = /\b(music|song|playlist|track|listen)\b/i.test(last);
      const wantsBreathing  = /\b(breath|breathing|inhale|exhale|box[- ]?breath)\b/i.test(last);
      const mentionsArt     = /\b(art|draw|sketch|doodle|paint|color(?:ing)?|watercolor|marker|pen|pencil|illustrat|canvas)\b/i.test(last);
      const mentionsWalk    = /\b(walk|stroll|step\s*out|fresh\s*air|outside|window|stretch|move|movement)\b/i.test(last);
      const mentionsHydrate = /\b(water|hydrate|hydration|glass|sip|tea|herbal|decaf|chamomile)\b/i.test(last);
      const mentionsJournal = /\b(journal|write|notebook|note|diary|pages|free[- ]?write|morning\s*pages)\b/i.test(last);

      const isAffirm  = /\b(yes|yeah|yep|sure|ok|okay|let'?s|lets|do it|sounds good)\b/i.test(last);
      const isDecline = /\b(no|nah|nope|not now|later)\b/i.test(last);

      // Follow-through awareness (what we suggested last time)
      const prior = (prevAssistant || '').toLowerCase();
      const priorSuggestedBreathing = /breath|inhale|exhale|box/.test(prior);
      const priorSuggestedMusic     = /music|song|playlist|press play/.test(prior);
      const priorSuggestedGrounding = /5-4-3-2-1|ground/.test(prior);
      const priorSuggestedArt       = /doodle|sketch|draw|color|art/.test(prior);
      const priorSuggestedWalk      = /walk|outside|fresh air|window|stretch|move/.test(prior);
      const priorSuggestedHydrate   = /water|hydrate|sip|tea|herbal|decaf|chamomile/.test(prior);
      const priorSuggestedJournal   = /journal|write|free[- ]?write|pages|diary/.test(prior);

      const suggestions = [
        'Would you like to try a tiny 2-minute step?',
        'If it helps, tell me one small thing that would make this moment a bit easier.',
        'I can listen—what part of this feels heaviest right now?',
      ];

      let reply = '';

      // 1) Follow‑through on “yes”
      if (isAffirm && priorSuggestedBreathing) {
        reply = pickDifferent([
          "Great — let’s do 60 seconds of 4‑2‑6 breathing. Inhale 4, hold 2, exhale 6… I’m here. Type “done” when you finish and we’ll check in.",
          "Okay — 4 rounds: inhale 4, hold 2, exhale 6. When you’re done, tell me how it felt (better/same/worse).",
        ], prevAssistant);
      } else if (isAffirm && priorSuggestedMusic) {
        reply = pickDifferent([
          "Nice. Pick one song you love, press play now, and tell me the title. I’ll be here.",
          "Go for it — hit play on one track. When it starts, share the name and we’ll do one more tiny step.",
        ], prevAssistant);
      } else if (isAffirm && priorSuggestedGrounding) {
        reply = pickDifferent([
          "Let’s do 5‑4‑3‑2‑1. Start with 5 things you can see. Type them here; I’ll follow along.",
          "Okay — grounding together. Name 5 things you can see right now. I’m with you.",
        ], prevAssistant);
      } else if (isAffirm && priorSuggestedArt) {
        reply = pickDifferent([
          "Great — start a 2‑minute doodle: draw three shapes (circle, triangle, square) and shade them. No erasing. Type “done” when finished.",
          "Okay — open a blank page and sketch anything in one continuous line for 120 seconds. When time’s up, tell me how it felt.",
        ], prevAssistant);
      } else if (isAffirm && priorSuggestedWalk) {
        reply = pickDifferent([
          "Stand up for a 2‑minute walk to a window or step outside if you can. On the way, notice three things you see. Type “done” when back.",
          "Two minutes of gentle movement: stroll to a window, roll your shoulders, slow exhale. Ping me when you’re back.",
        ], prevAssistant);
      } else if (isAffirm && priorSuggestedHydrate) {
        reply = pickDifferent([
          "Fill a glass with water or make herbal tea. Take 10 slow sips. When you finish, type “done”.",
          "Hydration reset: grab water, sip steadily for ~2 minutes. Tell me if it shifts anything 1–10.",
        ], prevAssistant);
      } else if (isAffirm && priorSuggestedJournal) {
        reply = pickDifferent([
          "Open a note and free‑write for 2 minutes. Start with: “Right now I feel…”. No editing. Type “done” when finished.",
          "Two-minute journal: set a timer and write without stopping. When time’s up, share one word that captures the feeling.",
        ], prevAssistant);
      }

      // 2) Intent‑first suggestions (music, breathing, art, movement, hydration, journaling)
      else if (mentionsMusic) {
        reply = pickDifferent([
          "Music can help regulate mood. Pick one song you love, press play now, and tell me the title. I’ll be here.",
          "Let’s try a music micro‑step: one track, press play, and share its name here.",
        ], prevAssistant);
      } else if (wantsBreathing) {
        reply = pickDifferent([
          "Let’s try a tiny 60‑second 4‑2‑6 breathing reset: inhale 4, hold 2, exhale 6 — 6 cycles. Want to do that now?",
          "We can do a box‑breathing minute: inhale 4, hold 4, exhale 4, hold 4 — repeat 6 times. Want to try?",
        ], prevAssistant);
      } else if (mentionsArt) {
        reply = pickDifferent([
          "Art reset: set a 2‑minute timer and doodle anything — three shapes or a quick sketch. No erasing. When done, type “done”.",
          "Let’s keep it tiny — pick one color and fill five small boxes or sketch a simple object for 120 seconds. I’ll be here.",
        ], prevAssistant);
      } else if (mentionsWalk) {
        reply = pickDifferent([
          "Movement helps. Want a 2‑minute walk to a window or outside if possible? Notice three things you see.",
          "Let’s do a quick reset: stand, stretch your arms, roll shoulders, then a short stroll. Ready?",
        ], prevAssistant);
      } else if (mentionsHydrate) {
        reply = pickDifferent([
          "Hydration micro‑step: grab water or herbal tea and take 10 slow sips. I’ll be here.",
          "Tea sounds good — make a quick cup (decaf/herbal if you like). Tell me when it’s ready.",
        ], prevAssistant);
      } else if (mentionsJournal) {
        reply = pickDifferent([
          "Two‑minute journal: open a note and start with “Right now I feel…”. Want to try?",
          "Let’s do a quick free‑write for 2 minutes. No editing, just flow. Up for it?",
        ], prevAssistant);
      }

      // 3) Decline
      else if (isDecline) {
        reply = pickDifferent([
          "Got it. We can just talk. What part of this is weighing most right now?",
          "Okay — no steps for now. Tell me a bit more about what’s hardest in this moment.",
        ], prevAssistant);
      }

      // 4) Emotion-aware empathy
      else if (emotion) {
        const choicesByMood: Record<string, string[]> = {
          lonely: [
            `It sounds like you're feeling lonely — I'm really glad you reached out. ${suggestions[0]}`,
            `Lonely moments can sting. ${suggestions[2]}`,
          ],
          sad: [
            `I'm sorry you're feeling sad. ${suggestions[1]}`,
            `That sounds heavy. ${suggestions[0]}`,
          ],
          anxious: [
            `That sounds worrying — it's understandable to feel anxious. ${suggestions[0]}`,
            `Anxiety can make everything feel urgent. ${suggestions[2]}`,
          ],
          tired: [
            `You sound exhausted. A tiny break can sometimes help. ${suggestions[0]}`,
            `Low energy makes everything heavier. ${suggestions[1]}`,
          ],
          frustrated: [
            `That sounds frustrating — I'm sorry you're dealing with that. ${suggestions[2]}`,
            `I hear your frustration. ${suggestions[0]}`,
          ],
          bored: [
            `I hear you — feeling bored can be heavy too. ${suggestions[1]}`,
            `Boredom drags. ${suggestions[2]}`,
          ],
          happy: [
            `That's great to hear — tell me more about what's going well!`,
          ],
        };
        const options = choicesByMood[emotion] ?? [`It sounds like you're feeling ${emotion}. ${suggestions[1]}`];
        reply = pickDifferent(options, prevAssistant);
      }

      // 5) Very short inputs (≤ 3 words) — keep varied and include the new intents
      else if (last.split(/\s+/).length <= 3) {
        reply = pickDifferent([
          'Want a tiny 2‑minute reset — music, breathing, doodle, short walk, water/tea, or a quick journal — or prefer to talk it through?',
          'We can keep it small: one song, 60s breathing, a quick sketch, a short stroll, some water/tea, or a 2‑min free‑write. What sounds good?',
        ], prevAssistant);
      }

      // 6) General reflection
      else {
        reply = pickDifferent([
          `Thanks for sharing. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
          `Appreciate you opening up. What part feels heaviest right now?`,
        ], prevAssistant);
      }

      const fallbackRes = NextResponse.json({ reply, fallback: true, sessionId });
      fallbackRes.cookies.set('chat_session', sessionId, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax', httpOnly: true });
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
      ...mergedSession.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const client = await getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = completion.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content from OpenAI');

      const successRes = NextResponse.json({ reply: content, sessionId });
      successRes.cookies.set('chat_session', sessionId, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax', httpOnly: true });
      return successRes;
    } catch (err) {
      console.error('OpenAI chat error:', err);
      const fallback = `Thanks for sharing — I'm here to listen. Tell me more about how you're feeling, or we can try a tiny next step together.`;
      const errRes = NextResponse.json({ reply: fallback, fallback: true, sessionId });
      errRes.cookies.set('chat_session', sessionId, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax', httpOnly: true });
      return errRes;
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
