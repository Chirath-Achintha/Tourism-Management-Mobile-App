# 🌍 Tourism Management Mobile App

A premium full-stack mobile application built using the MERN stack with Expo (React Native). This platform allows users to explore tourist destinations, book tours, and manage travel-related services with ease.

## 🏗️ Project Architecture

The project is organized into two main directories for a clean separation of concerns:

```text
Tourism-Management-Mobile-App/
├── backend/            # Node.js + Express + MongoDB Server
│   ├── src/            # Backend source code
│   ├── .env            # Environment variables
│   └── server.js       # Entry point
│
└── frontend/           # Expo (React Native) Mobile Application
    ├── app/            # Screens (Expo Router)
    ├── components/     # Reusable UI components
    ├── constants/      # Design system (Colors, Spacing)
    └── styles/         # Global & Screen styles
```

---

## 🛠️ Technologies Used

### Frontend
- **Framework**: Expo (React Native)
- **Language**: TypeScript / JavaScript
- **Navigation**: Expo Router (File-based routing)
- **Styling**: Native CSS-in-JS

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JSON Web Tokens (JWT) & Bcrypt

---

## 🚀 Getting Started

### 1️⃣ Prerequisites
- **Node.js**: Version 18 or 20 recommended.
- **Expo Go App**: Download on your [iOS](https://apps.apple.com/app/expo-go/id982107779) or [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) device.

### 2️⃣ Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file with your MongoDB connection string.
4. Start the server:
   ```bash
   npm run dev
   ```

### 3️⃣ Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with your phone using the **Expo Go** app.

---

## 🎯 Project Roadmap

- [x] Project Structure Setup
- [x] Welcome & Authentication UI
- [x] Basic Backend API setup
- [ ] Connect Frontend to Backend APIs
- [ ] Implement Destination Booking
- [ ] User Profile Management

---

## ⚠️ Important Notes
- **Network**: Ensure your phone and computer are on the same WiFi network to use Expo Go.
- **Environment**: Never share your `.env` file or commit it to version control.
- **Localhost**: When connecting the frontend to the backend, use your computer's **Local IP Address** (e.g., `192.168.x.x`) instead of `localhost`.