<div align="center">

<p align="center">
  <img src="public/banner.png" alt="Banner" width="100%" />
</p>

# 🛒 MyCassa

**Modern Point of Sale System for Restaurants & Cafes**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Docker](#-docker-deployment) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 About

**MyCassa** is a modern, full-featured cash register application built with Next.js. Designed specifically for restaurants, cafes, and food service businesses, it provides an intuitive interface for managing orders, customizing ingredients, applying discounts, and processing payments efficiently.

Part of the **MySagra** ecosystem, MyCassa seamlessly integrates with backend services to deliver a complete point-of-sale solution.

## ✨ Features

### 🎯 Core Functionality
- **Order Management** - Create, modify, confirm, and track orders in real-time
- **Ingredient Customization** - Modify ingredients for each order item with automatic surcharge calculation
- **Discount System** - Apply fixed amount or percentage discounts to orders
- **Daily Orders** - Search and load previous orders (pending orders only)
- **Order Status Tracking** - Track orders through pending, confirmed, and picked-up states

### 🔐 Security & Authentication
- **Secure Authentication** - NextAuth v5 integration with session management
- **Protected Routes** - Role-based access control for different user types
- **User Management** - Multi-user support with individual cashier tracking

### 🎨 User Experience
- **Modern UI** - Built with shadcn/ui components and Radix UI primitives
- **Dark/Light Mode** - Theme switching with next-themes
- **Responsive Design** - Optimized for desktop and tablet devices
- **Real-time Updates** - Server-Sent Events (SSE) for live order updates
- **Toast Notifications** - User-friendly feedback with Sonner

### 🛠️ Technical Features
- **Backend-for-Frontend (BFF)** - Server Actions for efficient API communication
- **Type Safety** - Full TypeScript implementation with Zod validation
- **Form Management** - React Hook Form with validation
- **Docker Support** - Containerized deployment with Docker Compose
- **API Proxy** - Seamless backend integration

## 🚀 Installation

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- Access to MySagra backend API

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/MySagra/mycassa.git
   cd mycassa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Update the following variables:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:4300
   API_URL=http://mysagra-mysagra-backend-1:4300
   
   # NextAuth Configuration
   AUTH_SECRET=your_secure_random_secret_here
   AUTH_URL=http://localhost:7000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:7000](http://localhost:7000)

## 🐳 Docker Deployment

MyCassa includes full Docker support for production deployments.

### Using Docker Compose

1. **Ensure you have a `.env` file configured** (see Installation section)

2. **Build and run the container**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   
   The application will be available at [http://localhost:7000](http://localhost:7000)

### Docker Configuration

The application uses a multi-stage Dockerfile for optimized builds:
- **Dependencies stage** - Installs npm packages
- **Builder stage** - Builds the Next.js application
- **Runner stage** - Minimal production image

The container connects to the `mysagra_default` network to communicate with the backend API.

## 🛠️ Tech Stack

### Frontend Framework
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://reactjs.org/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety

### UI Components & Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Icon library

### Forms & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Form state management
- **[Zod](https://zod.dev/)** - Schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Form validation integration

### Authentication
- **[NextAuth v5](https://next-auth.js.org/)** - Authentication for Next.js
- **[@auth/core](https://authjs.dev/)** - Core authentication library

### Data Fetching & API
- **[Axios](https://axios-http.com/)** - HTTP client
- **[@microsoft/fetch-event-source](https://github.com/Azure/fetch-event-source)** - Server-Sent Events support

### Utilities
- **[date-fns](https://date-fns.org/)** - Date manipulation
- **[clsx](https://github.com/lukeed/clsx)** - Conditional className utility
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind classes
- **[sonner](https://sonner.emilkowal.ski/)** - Toast notifications

## 📁 Project Structure

```
mycassa/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── cassa/             # Main cash register page
│   ├── login/             # Authentication page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── cassa/            # Cash register specific components
│   ├── login/            # Login components
│   ├── settings/         # Settings components
│   └── ui/               # shadcn/ui components
├── actions/              # Server Actions (BFF layer)
├── lib/                  # Utility functions and types
│   ├── api-client.ts     # API client configuration
│   ├── api-types.ts      # API type definitions
│   ├── auth.ts           # Authentication configuration
│   └── utils.ts          # Helper functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── public/               # Static assets
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker Compose configuration
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 7000 |
| `npm run build` | Build production bundle |
| `npm start` | Start production server on port 7000 |
| `npm run lint` | Run ESLint for code quality |

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Public API URL (client-side) | `http://localhost:4300` |
| `API_URL` | Internal API URL (server-side) | `http://mysagra-mysagra-backend-1:4300` |
| `AUTH_SECRET` | Secret key for NextAuth sessions | Random string (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | Application URL for auth callbacks | `http://localhost:7000` |

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
   
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Update documentation for significant changes
- Test your changes thoroughly before submitting
- Ensure TypeScript types are properly defined

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You must disclose source code of any modifications
- ✅ You must license derivative works under AGPL-3.0
- ✅ Network use counts as distribution (must provide source)

See the [LICENSE](LICENSE) file for full details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) by Vercel
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication powered by [NextAuth](https://next-auth.js.org/)
- Icons from [Lucide](https://lucide.dev/)
- Part of the [MySagra](https://github.com/MySagra) ecosystem

## 📞 Support

If you encounter any issues or have questions:

- 🐛 [Open an issue](https://github.com/MySagra/mycassa/issues)
- 💬 Check existing issues for solutions
- 📧 Contact the MySagra team

---

<div align="center">

**Made with ❤️ by the MySagra Team**

[⬆ Back to Top](#-mycassa)

</div>