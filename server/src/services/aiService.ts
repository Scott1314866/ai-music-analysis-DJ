import OpenAI from 'openai';
import { env } from '../config/env.js';
import type { ChatMessageData, DJIntroRequest, TrackData } from '../types/index.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: env.LLM_API_KEY,
      baseURL: env.LLM_API_BASE,
    });
  }
  return client;
}

const CHAT_SYSTEM_PROMPT = `You are Claudio, an AI DJ with impeccable music taste and a cyberpunk radio host personality.
You broadcast from a late-night digital radio station called CLAUDIO FM. Your listeners are coding late at night, driving through neon-lit streets, or lying in bed staring at the ceiling.

Rules:
- Keep responses under 3 sentences, cool and concise
- If the user expresses a mood or emotion, recommend a specific type of music or genre that matches
- Use lowercase, radio-host casual English with occasional music terminology (frequencies, wavelengths, grooves, beats, vinyl)
- Sprinkle in subtle cyberpunk / late-night radio aesthetics ("the signal is clear tonight", "transmitting on all frequencies")
- Never break character — you are always on air. You ARE Claudio the DJ.
- Don't use markdown, emojis, or hashtags. Pure late-night FM voice.
- When recommending a song, mention the genre and vibe, not just the name.

Default available genres in your library: SOFT ROCK, INDIE BALLAD, R&B / HIP-HOP, ELECTRO-CLASSICAL, JAZZ-HIPHOP, 90s INDIE`;

const DJ_INTRO_SYSTEM_PROMPT = `You are Claudio, a midnight radio DJ with a deep, resonant broadcast voice.
Generate a 4-6 sentence English DJ intro for the upcoming track.

Style: Late-night FM radio, intimate, slightly poetic, cyberpunk-infused.
The intro MUST mention:
- The song title
- The artist name
- The genre / musical style
- A brief evocative description of the mood this track creates
Make it feel like a live broadcast at 2 AM. Address the listener directly.

Example tone:
"Hey, this is Claudio on the late-night groove. Next up, we have a smooth Jazz-HipHop track called 'Wine' by SoulChef. Picture a dimly lit room, a glass catching the glow of streetlights outside. Let the rhythm take control — you're listening to Claudio FM."

IMPORTANT: Output ONLY the intro text. No quotation marks around it. No stage directions. Just the spoken intro.`;

export async function generateChatReply(
  userMessage: string,
  history: ChatMessageData[],
  availableTracks: TrackData[]
): Promise<{ replyText: string; recommendedTrackId?: string }> {
  const ai = getClient();

  const recentHistory = history.slice(-10).map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  })) as { role: 'user' | 'assistant'; content: string }[];

  const trackContext =
    availableTracks.length > 0
      ? `\n\nCurrently available tracks in the library:\n${availableTracks
          .map((t) => `- "${t.title}" by ${t.artist} [${t.genre}] (id: ${t.id})`)
          .join('\n')}`
      : '';

  const messages = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT + trackContext },
    ...recentHistory,
    { role: 'user', content: userMessage },
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  const completion = await ai.chat.completions.create({
    model: env.LLM_MODEL,
    messages,
    max_tokens: 300,
    temperature: 0.85,
  });

  const replyText = completion.choices[0]?.message?.content?.trim() || "This is Claudio. We're experiencing some signal interference. Stand by.";

  // Try to detect if Claudio recommended a track from our library
  let recommendedTrackId: string | undefined;
  const replyLower = replyText.toLowerCase();
  for (const track of availableTracks) {
    if (
      replyLower.includes(track.title.toLowerCase()) ||
      replyLower.includes(track.artist.toLowerCase())
    ) {
      recommendedTrackId = track.id;
      break;
    }
  }

  return { replyText, recommendedTrackId };
}

export async function generateDjIntro(track: DJIntroRequest): Promise<string> {
  const ai = getClient();

  const userPrompt = `Generate a DJ intro for this track:
Title: "${track.title}"
Artist: "${track.artist}"
Genre: "${track.genre}"`;

  const messages = [
    { role: 'system', content: DJ_INTRO_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  const completion = await ai.chat.completions.create({
    model: env.LLM_MODEL,
    messages,
    max_tokens: 250,
    temperature: 0.9,
  });

  const introText = completion.choices[0]?.message?.content?.trim() || '';

  if (!introText) {
    // Graceful fallback
    return `This is Claudio. Up next, "${track.title}" by ${track.artist}. A ${track.genre.toLowerCase()} cut, handpicked for this late-night frequency. You're tuned in to Claudio FM.`;
  }

  // Clean any wrapping quotes
  return introText.replace(/^["']|["']$/g, '');
}

// Fallback responses when LLM is unavailable
export function getFallbackChatReply(userMessage: string, tracks: TrackData[]): { replyText: string; recommendedTrackId?: string } {
  const triggers: Record<string, { text: string; genre: string }> = {
    hello: { text: "Hello there. This is Claudio on the late-night frequency. Take a break from the noise and let's find your wavelength.", genre: 'SOFT ROCK' },
    love: { text: "Love is the highest frequency. Some tracks hit different at 2 AM — let me find one that resonates.", genre: 'JAZZ-HIPHOP' },
    sad: { text: "I feel that. The best music comes from places words can't reach. Let's slide into something that understands.", genre: 'INDIE BALLAD' },
    energetic: { text: "Now we're talking. Cranking up the voltage — neon lines, heavy basslines, zero compromise.", genre: '90s INDIE' },
    jazz: { text: "Ah, the warm crackle of vinyl and boom-bap percussion. Jazz and hip-hop were always meant to share a frequency.", genre: 'JAZZ-HIPHOP' },
    mood: { text: "Your mood is the only algorithm I trust. Tell me where you are, and I'll find the right signal.", genre: 'R&B / HIP-HOP' },
  };

  const msg = userMessage.toLowerCase();
  let match: { text: string; genre: string } | undefined;

  for (const [key, val] of Object.entries(triggers)) {
    if (msg.includes(key)) {
      match = val;
      break;
    }
  }

  const replyText = match?.text || "This is Claudio. The signal's a little hazy tonight, but I'm still here — curating every frequency by hand. What's on your mind?";

  let recommendedTrackId: string | undefined;
  if (match) {
    const track = tracks.find((t) => t.genre === match!.genre);
    if (track) recommendedTrackId = track.id;
  }

  return { replyText, recommendedTrackId };
}

export function getFallbackDjIntro(track: DJIntroRequest): string {
  return `This is Claudio. It's late, and the airwaves are clear. Up next, we have a ${track.genre.toLowerCase()} track called "${track.title}" by ${track.artist}. Turn down the lights, turn up the volume — this one's for you. You're locked in to Claudio FM.`;
}
