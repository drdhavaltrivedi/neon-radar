# 🛰️ Neon Radar

A futuristic, real-time proximity-based chat application set in a neon-drenched secure zone. **Neon Radar** allows you to discover local "frequency" rooms, connect with other nearby nodes, and engage in ephemeral, secure transmissions.

![Neon Radar Interface](/public/og-image.png)

### 🌍 Live Deployment
- **Frontend (Vercel)**: [https://neon-radar.vercel.app/](https://neon-radar.vercel.app/)
- **Backend (Railway)**: [https://neon-radar-production.up.railway.app/](https://neon-radar-production.up.railway.app/)
## 📡 Live Radar Tracking

The core of the experience is the **Proximity Radar**, which scans a 100m secure zone around your location.
- **Dynamic Frequency Nodes**: Rooms are deployed on specific frequencies (e.g., 104.5 MHz) and appear on your radar based on their real or simulated GPS coordinates.
- **Node Discovery**: Other connected users appear as pings on the radar. You can hover over them to see their current public designation (Alias).
- **Secure Tunneling**: Each connection is established via an ephemeral tunnel protocol.

## 💬 Features

- **Alias Management**: Scramble or manually set your identity in the Matrix. Your public designation is strictly ephemeral.
- **Local Transmissions**: Join frequencies to chat with anyone in that radius. No registration required.
- **Real-Time Presence**: See "Local Nodes" in your frequency and monitor their status (Online, Away, Offline).
- **Message Interaction**: React to messages with emojis and reply to specific transmission lines.
- **Ephemeral Rooms**: Each room has a TTL (Time-To-Live). Once the countdown hits zero, the frequency is decommissioned.
- **Persistence**: While transmissions are designed for the moment, the system now tracks room states and message history across reboots for a consistent experience.

## 🚀 Technology Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS + Vanilla CSS (Neon Aesthetics)
- **Animations**: Motion (Framer Motion)
- **Real-time Engine**: Socket.io (Bi-directional WebSocket communication)
- **Icons**: Lucide React
- **Backend**: Node.js + Express + TSX

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd neon-radar
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the transmission server:
   ```bash
   npm run dev
   ```

## 🔐 Privacy & Security

Neon Radar is built on the philosophy of ephemeral identities.
- **Non-Persistent Data**: Most metadata is wiped upon system reset.
- **Secure Radius**: Communications are localized to ensure only those in the immediate "radius" can access the frequency.

---

*Scan the matrix. Find your frequency.* 🌌
