# Neon Radar

Proximity-based ephemeral chat. Think walkie-talkies, but in a browser, with a cyberpunk radar UI.

You open the app, a radar scans a 100m zone around you, and you see "frequency" rooms nearby. Tap one to join. Chat disappears when the room's TTL hits zero. No accounts, no history, no trace.

![Neon Radar](/public/og-image.png)

**Live at** [neon-radar.vercel.app](https://neon-radar.vercel.app/)

## How it works

- Rooms are deployed on random radio frequencies and placed on a radar grid
- Each room has a 60-minute countdown. When it expires, the room and its messages are gone
- You get a random callsign (GHOST_7X, CIPHER_3R, etc.) that you can change or scramble
- Real-time messaging with replies, reactions, and typing indicators
- Presence tracking shows who's online, away, or offline in your frequency

## Running it

```
npm install
npm run dev
```

Opens on `localhost:3000`. The dev server runs both the Vite frontend and the Express/Socket.io backend together.

## Stack

React 19, Vite, Tailwind v4, Socket.io, Motion, Express. No database -- rooms and messages persist to flat JSON files under `data/` and reset on restart.

## Deployment

Frontend deploys to Vercel (static build). Backend deploys to Railway (Dockerfile). Set `VITE_API_URL` in Vercel to point at the Railway URL for cross-origin socket connections.

See `.env.example` for config options.
