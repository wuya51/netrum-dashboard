# Netrum Node Dashboard

A comprehensive web-based dashboard for monitoring and managing Netrum network nodes, built with Next.js. This application provides real-time insights into node statistics, mining status, cooldown periods, and network health.

## 🌐 Official Website
**https://www.netrum123.xyz**

## 🚀 Built with Next.js

This project is developed using **Next.js 14+** with the modern App Router architecture, providing:
- **Server-Side Rendering (SSR)** for optimal SEO and performance
- **Static Site Generation (SSG)** capabilities
- **API Routes** for backend functionality
- **File-based Routing** with App Router
- **Built-in Optimization** for images, fonts, and scripts

## Features

### 🔍 Node Search & Monitoring
- **Search by Wallet Address or Node ID**: Quickly find any node using wallet addresses or node identifiers
- **Real-time Data Display**: View comprehensive node information including:
  - Identity details
  - Node statistics (task count, RAM usage, status)
  - Mining status and token information
  - Claim status and requirements
  - Cooldown periods
  - Live log data

### 📊 Active Nodes Overview
- **Interactive Node List**: Browse all active nodes in the network
- **Click-to-Search Functionality**: Click any node in the list to instantly search its details
- **Smart Cooldown Management**: 30-second cooldown period after searches to prevent spam
- **Adaptive Popup Display**: Hover over nodes to see detailed information without leaving the page

### 🌐 Network Status
- **Service Health Monitoring**: Real-time status of Netrum network services
- **Registration Status**: Display network information and contract addresses
- **Auto-refresh Capability**: Configurable automatic data refresh every 5 minutes

### 🎯 Next.js App Router Features
- **URL Parameter Handling**: Seamless search via URL parameters
- **Client-side Navigation**: Smooth transitions between searches
- **State Management**: React hooks with custom store pattern
- **Error Boundaries**: Graceful error handling and recovery

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Modern web browser with JavaScript enabled

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd netrum-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the Application**
   Open your browser and navigate to:
   ```
   http://localhost:3030
   ```

### Next.js Development Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

## Project Structure (Next.js App Router)
