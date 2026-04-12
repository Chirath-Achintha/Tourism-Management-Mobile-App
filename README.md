# Tourism-Management-Mobile-App

🌍 Tourism Management Mobile App
📌 Project Overview

This is a mobile application built using Expo (React Native).

The app allows users to explore tourist destinations, book tours, and manage travel-related services.
Currently, we are developing the frontend (UI) first before connecting to the backend.

🛠️ Technologies Used
Expo (React Native)
JavaScript / TypeScript
Expo Router (for navigation)

------------------------------------------------------
Project Structure

mobile/tourism-app/
├── app/                  # Screens (Expo Router)
│   ├── (tabs)/           # Main app after login
│   ├── index.tsx         # Welcome screen
│   ├── login.tsx
│   ├── register.tsx
│   ├── _layout.tsx
│
├── components/           # Reusable components
│   ├── AppButton.tsx
│
├── constants/            # Design system
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│
├── styles/               # Screen styles
│   ├── welcome.styles.ts
│
├── package.json

------------------------------------------------------
🚀 How to Run This Project

Follow these steps carefully:

1️⃣ Install Node.js

Make sure you have Node.js installed (version 18 or 20 recommended).

Check version:
node -v

2️⃣ Open the Project

Open the project folder in VS Code.

Navigate to:
mobile/tourism-app

3️⃣ Install Dependencies

Run this command in the terminal:

npm install

4️⃣ Start the App

Run:

npx expo start

5️⃣ Run on Your Phone (Recommended)
📱 For iPhone:
Install Expo Go from App Store
Make sure your phone and PC are on the same WiFi
Scan the QR code shown in the browser
❗ If QR Code Does Not Appear

Run this instead:

npx expo start --tunnel

Then scan the QR code again.

⚠️ Important Notes
Do NOT use "localhost" for mobile apps
Always run npm install before starting
Keep the terminal running while the app is open
Save files to see instant updates (auto reload)
🎯 Current Progress
Project setup completed ✅
Welcome screen created ✅
Navigation structure ready ✅

Next steps:

Build Login & Register UI
Then connect backend APIs