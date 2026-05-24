import { Request, Response } from 'express';
import { signToken } from '../middleware/auth.js';

// Hardcoded accounts — no database needed
const ACCOUNTS: Record<string, { password: string; neteaseUid: string | null }> = {
  scottcui: { password: '123456', neteaseUid: '402133965' },
};

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const normalizedName = username.trim().toLowerCase();
  const account = ACCOUNTS[normalizedName];

  if (!account) {
    // Auto-register: any new username with any password
    ACCOUNTS[normalizedName] = { password, neteaseUid: null };
  } else if (account.password !== password) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const token = signToken({ userId: normalizedName, username: normalizedName });

  res.json({
    token,
    user: {
      id: normalizedName,
      username: normalizedName,
      neteaseUid: ACCOUNTS[normalizedName].neteaseUid,
    },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const username = req.user?.username;
  if (!username || !ACCOUNTS[username]) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      id: username,
      username,
      neteaseUid: ACCOUNTS[username].neteaseUid,
    },
  });
}

export async function updateNetEase(req: Request, res: Response): Promise<void> {
  const { neteaseUid } = req.body;
  const username = req.user?.username;
  if (!username || !ACCOUNTS[username]) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  ACCOUNTS[username].neteaseUid = neteaseUid;
  res.json({ user: { id: username, username, neteaseUid } });
}
