/**
 * Script: Fetch NetEase Cloud Music liked songs using MUSIC_U cookie.
 * Run: npx tsx server/src/scripts/fetchNeteaseLiked.ts
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const { login_status, likelist, playlist_mylike, song_detail } = require('NeteaseCloudMusicApi');

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const MUSIC_U = process.env.NETEASE_MUSIC_U || '';
const COOKIE = `MUSIC_U=${MUSIC_U};`;

async function main() {
  console.log('[Fetch] Step 1: Checking login status with MUSIC_U cookie...');

  try {
    const statusRes = await login_status({ cookie: COOKIE }) as any;
    // v4 API nests everything under body.data
    const data = statusRes.body?.data || statusRes.body || {};
    console.log('  [LoginStatus] code:', data.code);
    console.log('  [LoginStatus] profile:', JSON.stringify(data.profile, null, 2));

    const uid = data.profile?.userId || data.account?.id;
    if (!uid) {
      console.error('[Fetch] ERROR: Could not extract user ID from login status.');
      console.error('[Fetch] This likely means the MUSIC_U cookie is expired or invalid.');
      console.error('[Fetch] Full data:', JSON.stringify(data).slice(0, 500));
      process.exit(1);
    }

    console.log(`[Fetch] Got user ID: ${uid}`);

    // Step 2: Fetch liked songs playlist via playlist_mylike (most reliable)
    console.log('[Fetch] Step 2: Fetching liked songs via playlist_mylike...');
    const myLikeRes = await playlist_mylike({ cookie: COOKIE, limit: 500 }) as any;
    const myLikeData = myLikeRes.body?.data || myLikeRes.body || {};
    console.log('  [Mylike] code:', myLikeData.code);

    if (myLikeData.code === 200 && myLikeData.playlist?.tracks) {
      const tracks = myLikeData.playlist.tracks;
      console.log(`  [Mylike] Got ${tracks.length} tracks from liked playlist`);
      console.log(`  [Mylike] Playlist ID: ${myLikeData.playlist.id}, Name: ${myLikeData.playlist.name}`);

      const outputPath = resolve(__dirname, '../../../../data/netease-liked-songs.json');
      const output = {
        fetchedAt: new Date().toISOString(),
        uid: String(uid),
        playlistId: myLikeData.playlist.id,
        playlistName: myLikeData.playlist.name,
        totalCount: tracks.length,
        tracks: tracks.slice(0, 500).map((t: any) => ({
          id: t.id,
          name: t.name,
          artists: t.ar?.map((a: any) => a.name) || [],
          album: t.al?.name || '',
          albumPic: t.al?.picUrl || '',
          durationMs: t.dt || 0,
          durationSec: Math.round((t.dt || 0) / 1000),
          popularity: t.pop || 0,
          fee: t.fee || 0,
        })),
      };

      writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`[Fetch] DONE: Saved ${output.tracks.length} tracks to data/netease-liked-songs.json`);
      return;
    }

    // Fallback: try likelist
    console.log('[Fetch] playlist_mylike failed, trying likelist...');
    const likeRes = await likelist({ uid: String(uid), cookie: COOKIE }) as any;
    const likeData = likeRes.body?.data || likeRes.body || {};
    console.log('  [Likelist] code:', likeData.code);

    const trackIds: number[] = likeData.ids || [];
    console.log(`  [Likelist] Liked song count: ${trackIds.length}`);

    if (trackIds.length > 0) {
      console.log('[Fetch] Step 3: Fetching track details in batches...');

      const allTracks: any[] = [];
      const batchSize = 500;

      for (let i = 0; i < Math.min(trackIds.length, 1000); i += batchSize) {
        const batch = trackIds.slice(i, i + batchSize);
        const idsStr = batch.join(',');
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(Math.min(trackIds.length, 1000) / batchSize)} (${batch.length} songs)...`);

        try {
          const detailRes = await song_detail({ ids: idsStr, cookie: COOKIE }) as any;
          const detailData = detailRes.body?.data || detailRes.body || {};
          if (detailData.code === 200 && detailData.songs) {
            allTracks.push(...detailData.songs);
            console.log(`    Got ${detailData.songs.length} tracks`);
          }
        } catch (e) {
          console.error(`    Batch failed:`, (e as Error).message);
        }
      }

      console.log(`[Fetch] Total detailed tracks: ${allTracks.length}`);

      const outputPath = resolve(__dirname, '../../../../data/netease-liked-songs.json');
      const output = {
        fetchedAt: new Date().toISOString(),
        uid: String(uid),
        totalCount: allTracks.length,
        tracks: allTracks.map((t: any) => ({
          id: t.id,
          name: t.name,
          artists: t.ar?.map((a: any) => a.name) || [],
          album: t.al?.name || '',
          albumPic: t.al?.picUrl || '',
          durationMs: t.dt || 0,
          durationSec: Math.round((t.dt || 0) / 1000),
          popularity: t.pop || 0,
        })),
      };

      writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`[Fetch] DONE: Saved ${output.tracks.length} tracks to data/netease-liked-songs.json`);
    } else {
      console.error('[Fetch] No liked songs found with either method.');
      process.exit(1);
    }
  } catch (err) {
    console.error('[Fetch] FATAL ERROR:', err);
    process.exit(1);
  }
}

main();
