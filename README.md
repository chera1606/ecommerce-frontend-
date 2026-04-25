# Efoy Gabeya - Frontend 🎨

Welcome to the frontend repository for **Efoy Gabeya**! This is a modern, high-fidelity, and fully responsive web application designed to deliver a premium e-commerce shopping experience. 

Built from the ground up without heavy CSS frameworks, it utilizes clean CSS variables, dynamic dark mode, and a highly componentized React architecture.

---

## 🛠️ Tech Stack

*   **Framework:** React (Bootstrapped with Vite for lightning-fast HMR)
*   **Routing:** React Router v6
*   **Styling:** Pure Vanilla CSS (Custom CSS Variables, Flexbox, Grid)
*   **Icons:** Lucide React
*   **State Management:** React Context API (AuthContext, CartContext, AppSettingsContext)

## ✨ Key Features

1.  **Immersive Dark Mode:** Fully integrated, CSS-variable-driven dark mode that gracefully switches themes across the storefront and administrative dashboards.
2.  **Hybrid Cart System:** 
    *   **Guest Cart:** Unauthenticated users can seamlessly build carts using `localStorage`.
    *   **Smart Merge:** Automatically merges the guest cart into the cloud database upon login.
3.  **Comprehensive Admin Dashboard:** An isolated, responsive control panel for Super Admins and regular Admins to manage inventory, fulfill orders, and monitor platform analytics in real-time.
4.  **Flawless Responsiveness:** Carefully crafted media queries ensure the application looks cinematic on 4K desktop screens and remains perfectly usable down to compact mobile devices.
5.  **Smart Form Handling & Error States:** Dynamic product cards that auto-hide when images fail to load, secure checkout redirection, and real-time form validation.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) installed.

### 2. Installation
Clone the frontend repository and install dependencies:
```bash
git clone https://github.com/chera1606/ecommerce-frontend-.git
cd ecommerce-frontend-
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory. You need to point the frontend to your backend API:
```env
VITE_API_URL=http://localhost:5000
```
*(If you are running the backend locally, ensure it is active on port 5000).*

### 4. Start the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser. You're ready to build!

---

## ☁️ Deployment (Vercel)

This application is configured for one-click deployment on **Vercel**.

1.  **Routing Configuration:** A `vercel.json` file is included in the root to handle Single Page Application (SPA) routing. This prevents `404 Not Found` errors when refreshing pages like `/shop` or `/login`.
2.  **Environment Variables:** When deploying to Vercel, navigate to your project settings and add the `VITE_API_URL` environment variable, pointing it to your production backend URL (e.g., `https://ecommerce-backend-1-87dk.onrender.com`).
3.  **Framework Preset:** Ensure Vercel recognizes the project as a **Vite** application.

---
*Built with ❤️ for Efoy Gabeya.*
