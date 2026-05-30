# Automation System Web Dashboard

All-in-One Web Dashboard for Automation System Backend - Real-time metrics, workflow management, analytics visualization, GitHub integration, system health monitoring, user authentication, and comprehensive admin panel with dark/light mode support.

## 🎯 Features

- **Real-time Dashboard** - Live metrics and status updates
- **Workflow Management** - Create, edit, execute, and monitor workflows
- **Analytics & Visualization** - Charts and graphs for data insights
- **GitHub Integration** - View and manage GitHub repositories
- **System Health Monitoring** - Monitor system performance and health
- **User Authentication** - Secure JWT-based authentication
- **Admin Panel** - Complete system administration
- **Dark/Light Mode** - Theme support for user preference
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - WebSocket support for live data

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** Axios, React Query
- **Visualization:** Recharts
- **Theme:** next-themes
- **Real-time:** Socket.io Client

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Automation System Backend running on `http://localhost:3000`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Update `.env.local` with your backend API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3010`

### 4. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
automation-dashboard/
├── app/
│   ├── page.tsx              # Main dashboard page
│   ├── layout.tsx            # Root layout
│   ├── providers.tsx         # Theme provider
│   ├── globals.css           # Global styles
│   ├── workflows/            # Workflows page
│   ├── analytics/            # Analytics page
│   ├── github/               # GitHub integration page
│   ├── health/               # System health page
│   ├── admin/                # Admin panel
│   └── settings/             # Settings page
├── components/
│   ├── common/               # Shared components (Sidebar, Header)
│   ├── dashboard/            # Dashboard components
│   ├── workflows/            # Workflow components
│   ├── analytics/            # Analytics components
│   ├── github/               # GitHub components
│   └── admin/                # Admin components
├── lib/
│   ├── api-client.ts         # API client with type definitions
│   ├── store.ts              # Zustand stores
│   └── utils.ts              # Utility functions
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🔌 API Integration

The dashboard connects to the Automation System Backend API. Key endpoints:

### Workflows
- `GET /api/v1/workflows` - List all workflows
- `POST /api/v1/workflows` - Create workflow
- `GET /api/v1/workflows/:id` - Get workflow details
- `PUT /api/v1/workflows/:id` - Update workflow
- `DELETE /api/v1/workflows/:id` - Delete workflow
- `POST /api/v1/workflows/:id/execute` - Execute workflow

### Executions
- `GET /api/v1/executions` - List executions
- `GET /api/v1/executions/:id` - Get execution details

### Analytics
- `GET /api/v1/analytics/metrics` - Get metrics
- `GET /api/v1/analytics/trends` - Get trends
- `GET /api/v1/analytics/events` - Get events

### GitHub
- `GET /api/v1/github/repositories` - List repositories
- `GET /api/v1/github/user` - Get GitHub user info

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  primary: '#0a7ea4',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}
```

### API Base URL

Update in `.env.local`:

```
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

## 🔐 Authentication

The dashboard supports JWT-based authentication. To enable:

1. Set `NEXT_PUBLIC_AUTH_ENABLED=true` in `.env.local`
2. Implement login page in `app/login/page.tsx`
3. Store JWT token in localStorage
4. API client automatically includes token in requests

## 📊 Dashboard Components

### MetricsCard
Displays key metrics with trend indicators.

```tsx
<MetricsCard
  title="Active Workflows"
  value={42}
  icon="⚙️"
  color="bg-blue-500"
  trend={5}
/>
```

### WorkflowChart
Bar chart showing workflow status distribution.

### ExecutionTable
Table displaying recent workflow executions with status and duration.

### RecentActivity
List of recent workflow executions with quick status overview.

## 🧪 Testing

```bash
npm run type-check
npm run lint
```

## 📦 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3010
CMD ["npm", "start"]
```

### Environment Variables for Production

```
NEXT_PUBLIC_API_URL=https://api.production.com
NEXT_PUBLIC_WS_URL=wss://api.production.com
NODE_ENV=production
```

## 🐛 Troubleshooting

### API Connection Issues

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS settings in backend

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Theme Not Applying

Ensure `next-themes` is properly initialized in `app/providers.tsx`

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

**Status:** ✅ Production Ready

**Last Updated:** April 19, 2026  
**Version:** 1.0.0
