# Vcyber - Video Conferencing Platform

A modern, custom-branded video conferencing application built on [LiveKit](https://livekit.io/), featuring a sleek dark gradient design and seamless user experience.

## ✨ Features

- 🎨 **Custom Branding**: Beautiful dark gradient theme (blue to purple)
- 📹 **HD Video Conferencing**: Built on LiveKit's robust infrastructure
- 💬 **Real-time Chat**: Instant messaging with all participants
- 🔗 **Easy Invites**: One-click room link copying
- 🎯 **Simple Interface**: Clean, intuitive user experience
- 🔒 **Secure**: End-to-end encryption support
- 🌐 **Web-based**: No downloads required

## 🚀 Quick Links

- **[📖 Deployment Guide](./DEPLOYMENT.md)** - Complete VPS deployment instructions
- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Cloud](https://livekit.io/cloud)

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Video/Audio**: [LiveKit](https://livekit.io/)
- **UI Components**: [@livekit/components-react](https://github.com/livekit/components-js/)
- **Language**: TypeScript
- **Styling**: CSS Modules with custom gradient themes

## 🏃 Local Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- LiveKit Cloud account (free tier available)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/ndducnha/conf.git
   cd conf
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your LiveKit credentials:

   ```env
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Visit [http://localhost:3000](http://localhost:3000)

## 📦 Production Deployment

For complete deployment instructions to VPS or Vercel, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Quick deployment options:

- **VPS**: Full control with PM2 + Nginx
- **Vercel**: One-click deployment with automatic HTTPS

## 🔑 Getting LiveKit Credentials

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
2. Create a new project
3. Copy your API Key, API Secret, and WebSocket URL
4. Add them to `.env.local`

## 📝 Environment Variables

Required variables:

- `LIVEKIT_API_KEY` - Your LiveKit API key
- `LIVEKIT_API_SECRET` - Your LiveKit API secret
- `LIVEKIT_URL` - Your LiveKit WebSocket URL

Optional variables:

- `NEXT_PUBLIC_SHOW_SETTINGS_MENU` - Enable advanced settings menu

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with [LiveKit](https://livekit.io/) - Open source WebRTC infrastructure
