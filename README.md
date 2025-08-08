# BrandGen AI - Trademark Name Generator

A modern, elegant web application that generates unique and creative trademark names using OpenAI's GPT-4. Built with Next.js, Convex, and shadcn/ui components.

## Features

- **AI-Powered Generation**: Generates 10 unique trademark names using OpenAI GPT-4
- **Rate Limiting**: 3 requests per minute per user (IP-based)
- **Modern UI**: Beautiful, responsive design with shadcn/ui components
- **Real-time Updates**: Powered by Convex for seamless data synchronization
- **Skeleton Loading**: Smooth loading states for better UX
- **Toast Notifications**: User-friendly feedback with Sonner

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (serverless functions & database)
- **Styling**: Tailwind CSS v3, shadcn/ui
- **AI**: OpenAI GPT-4 API
- **Rate Limiting**: Convex Rate Limiter component

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Convex account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd brandGen
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add:
- `NEXT_PUBLIC_CONVEX_URL` - Get from Convex dashboard
- `OPENAI_API_KEY` - Get from OpenAI platform

4. Set up Convex:
```bash
npx convex dev
```

This will:
- Create a new Convex project (if needed)
- Deploy your functions
- Set up the database schema
- Open the Convex dashboard

5. In a new terminal, run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to see the app

## How It Works

1. **Initial Load**: When the page loads, it automatically generates 10 trademark names
2. **Manual Generation**: Click "Generate New Names" to get fresh trademark ideas
3. **Rate Limiting**: Users are limited to 3 requests per minute (tracked by IP)
4. **Error Handling**: Graceful error messages with retry information

## Project Structure

```
brandGen/
├── app/
│   ├── page.tsx          # Main page component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   └── ConvexClientProvider.tsx
├── convex/
│   ├── schema.ts         # Database schema
│   ├── trademarks.ts     # Backend functions
│   └── convex.config.ts  # Convex configuration
└── lib/
    └── utils.ts          # Utility functions
```

## API Configuration

The app uses OpenAI's GPT-4 model to generate creative trademark names. Each request:
- Generates 10 unique names
- Includes descriptions and industry categorization
- Uses high temperature for creativity

## Rate Limiting

- **Limit**: 3 requests per minute per user
- **Tracking**: IP-based identification
- **Algorithm**: Token bucket with burst capacity
- **Feedback**: Toast notifications with retry timing

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `OPENAI_API_KEY` (add to Convex dashboard)
4. Deploy

### Deploy Convex Functions

```bash
npx convex deploy
```

## License

MIT# Trademarkable
