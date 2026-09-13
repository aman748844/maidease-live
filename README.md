# 🧹 MaidEase Live - On-Demand Maid Booking & Calling Platform

![MaidEase Live Banner](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![NodeJS](https://img.shields.io/badge/Node.js-Express-green?logo=nodedotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite)
![Status](https://img.shields.io/badge/Status-Active%20Production%20Ready-success)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/aman748844/maidease-live)

> **MaidEase Live** is a full-stack, real-time home service and domestic help booking platform. It enables users to browse verified maids, check live availability, estimate custom service packages (BHK, cooking, cleaning, child care), initiate simulated direct calling, and track instant bookings in real time.

---

## 🌟 Key Features

- ⚡ **Instant Booking & Real-Time Dispatch:** Book domestic helpers with simulated fast-track 20-min ETA.
- 📞 **Direct Simulated Calling:** Call maids directly through the interface with live call status tracking and audio duration logging.
- 💰 **Smart Dynamic Price Estimator:** Interactive calculator based on BHK size, family members, and specific service packages (Cooking, Cleaning, Dishwashing, Babysitting, Elderly Care).
- 🛡️ **Verified Trust Badges:** Background verification checks, police clearance, ratings, and customer reviews.
- 📊 **Partner & Admin Dashboard:** Real-time metrics on active bookings, maid availability status (Online, Busy, Offline), and earnings.
- 📱 **Mobile & Desktop Responsive:** Polished UI built with React, Lucide Icons, and TailwindCSS.

---

## 📁 Project Architecture

```
maidease-live/
├── backend/                  # Express REST API Server
│   ├── data/                 # JSON File Persistence (maids, bookings, calls)
│   │   ├── maids.json
│   │   ├── bookings.json
│   │   └── calls.json
│   ├── index.js              # Main Backend Entry Point (Port 5001)
│   ├── server.js             # Backward-compatible wrapper
│   └── package.json
│
├── frontend/                 # Vite + React Modern Web App
│   ├── src/
│   │   ├── components/       # Modals, Cards, Nav, Trackers, Estimator
│   │   ├── context/          # Global App State (AppContext.jsx)
│   │   ├── services/         # API Layer (api.js)
│   │   ├── App.jsx
│   │   └── index.css
│   ├── vite.config.js        # Vite Config with API Proxy (/api -> :5001)
│   └── package.json
│
├── .gitignore                # Production ignore rules
└── README.md                 # Project Documentation
```

---

## 🚀 Quick Start Guide

### 1. Start the Backend API

```bash
cd backend
npm install
node index.js
```
* Backend will be live at `http://localhost:5001`

### 2. Start the Frontend Application

```bash
cd frontend
npm install
npm start
```
* Frontend will be live at `http://localhost:3000`

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, Lucide React, Canvas Confetti
- **Backend:** Node.js, Express.js, CORS, JSON-based storage
- **Deployment Ready:** Vercel (Frontend), Render / Railway (Backend)

---

## 📄 License

MIT License © 2026 MaidEase Live
