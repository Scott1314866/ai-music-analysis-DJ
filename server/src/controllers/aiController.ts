import { Request, Response } from 'express';
import {
  generateChatReply,
  generateDjIntro,
  getFallbackChatReply,
  getFallbackDjIntro,
} from '../services/aiService.js';
import { env } from '../config/env.js';
import type { ChatMessageData, TrackData } from '../types/index.js';

// Static fallback tracks — used when no playlist data is loaded
const STATIC_TRACKS: TrackData[] = [
  { id: 'track-1', title: 'If', artist: 'Bread', duration: 158, durationString: '2:38', isFavorite: true, genre: 'SOFT ROCK' },
  { id: 'track-2', title: '비행운', artist: 'MoonMoon', duration: 178, durationString: '2:58', isFavorite: false, genre: 'INDIE BALLAD' },
  { id: 'track-3', title: "Creepin'", artist: 'Tabber, Paul Blanco, MISO', duration: 195, durationString: '3:15', isFavorite: false, genre: 'R&B / HIP-HOP' },
  { id: 'track-4', title: 'Hero', artist: 'Mili', duration: 165, durationString: '2:45', isFavorite: false, genre: 'ELECTRO-CLASSICAL' },
  { id: 'track-5', title: 'Wine', artist: 'SoulChef', duration: 185, durationString: '3:05', isFavorite: true, genre: 'JAZZ-HIPHOP' },
  { id: 'track-6', title: '天菜 (prod. by Bubbleboy)', artist: 'GAHO', duration: 170, durationString: '2:50', isFavorite: false, genre: '90s INDIE' },
];

// In-memory chat history per user (resets on server restart)
const chatStore = new Map<string, ChatMessageData[]>();

export async function chat(req: Request, res: Response): Promise<void> {
  try {
    const { message, history } = req.body as { message: string; history?: ChatMessageData[] };

    if (!message?.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    let replyText: string;
    let recommendedTrackId: string | undefined;

    if (env.LLM_API_KEY) {
      const result = await generateChatReply(message, history || [], STATIC_TRACKS);
      replyText = result.replyText;
      recommendedTrackId = result.recommendedTrackId;
    } else {
      const result = getFallbackChatReply(message, STATIC_TRACKS);
      replyText = result.replyText;
      recommendedTrackId = result.recommendedTrackId;
    }

    const claudioMsg: ChatMessageData = {
      id: `msg-claudio-${Date.now()}`,
      sender: 'claudio',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'REPLAY',
    };

    // Persist to in-memory store if user is authenticated
    if (req.user?.userId) {
      const userHistory = chatStore.get(req.user.userId) || [];
      userHistory.push(
        { id: `msg-user-${Date.now() - 1}`, sender: 'user', text: message.trim(), timestamp: claudioMsg.timestamp },
        claudioMsg
      );
      chatStore.set(req.user.userId, userHistory.slice(-100)); // Keep last 100 messages
    }

    res.json({ reply: claudioMsg, recommendedTrackId: recommendedTrackId || null });
  } catch (err) {
    console.error('[AI Chat] Error:', err);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
}

export async function djIntro(req: Request, res: Response): Promise<void> {
  try {
    const { title, artist, genre } = req.body;

    if (!title || !artist || !genre) {
      res.status(400).json({ error: 'title, artist, and genre are required' });
      return;
    }

    let introText: string;
    if (env.LLM_API_KEY) {
      introText = await generateDjIntro({ title, artist, genre });
    } else {
      introText = getFallbackDjIntro({ title, artist, genre });
    }

    res.json({ introText });
  } catch (err) {
    console.error('[AI DJ Intro] Error:', err);
    const { title, artist, genre } = req.body;
    res.json({ introText: getFallbackDjIntro({ title, artist, genre }), degraded: true });
  }
}

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  const messages = req.user?.userId ? chatStore.get(req.user.userId) || [] : [];
  res.json({ messages });
}
