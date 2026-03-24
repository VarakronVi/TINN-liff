import React from "react";
import { useEffect, useState, createContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import liff from "@line/liff";
import "./App.css";
import tinnSplash from "./assets/tinn-splash.svg";
import tinnLogo from "./assets/tinn-logo.svg";

import LaunchPage from "./components/LaunchPage.js";
import TinderPage from "./components/TinderPage.js";
import GalleryPage from "./components/GalleryPage.js";
import RoutingPage from "./components/RoutingPage.js";
import CoinRewardsPage from "./components/CoinRewardsPage.js";
import TravelCompanion from "./components/TravelCompanion.js";
import HistoryPage from "./components/HistoryPage.js";
import AboutPage from "./components/AboutPage.js";
import EventPage from "./components/EventPage.js";
import { mockApi } from "./services/mockApi";

const DEV_MODE = false;
const SPLASH_DURATION = 3000; // 3 วินาที

export const LiffContext = createContext<{
  isLoggedIn: boolean;
  userId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
  isLiffReady: boolean;
}>({
  isLoggedIn: false,
  userId: null,
  displayName: null,
  pictureUrl: null,
  isLiffReady: false,
});

// ── Splash Screen Component ──────────────────────────────────────
const SplashScreen: React.FC<{ fadeOut: boolean }> = ({ fadeOut }) => (
  <div
    className="fixed inset-0 z-50 flex flex-col items-center justify-center"
    style={{
      background: 'linear-gradient(160deg, #bbf7d0 0%, #34d399 40%, #0d9488 100%)',
      transition: 'opacity 0.8s ease-out',
      opacity: fadeOut ? 0 : 1,
    }}
  >
    {/* Logo */}
    <div
      style={{
        animation: 'splashLogoIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        opacity: 0,
      }}
    >
      <img src={tinnLogo} alt="TINN" className="w-120 h-auto drop-shadow-2xl" />
    </div>

    {/* Tagline */}
    <p
      className="text-white/80 text-sm font-medium mt-4 tracking-widest uppercase"
      style={{
        animation: 'splashFadeUp 0.6s ease-out 0.5s forwards',
        opacity: 0,
      }}
    >
      Discover Thailand
    </p>

    {/* Loading dots */}
    <div
      className="flex space-x-2 mt-12"
      style={{
        animation: 'splashFadeUp 0.6s ease-out 0.8s forwards',
        opacity: 0,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-white/60 rounded-full"
          style={{
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>

    {/* Bottom silhouette from splash image */}
    <div className="absolute bottom-0 left-0 right-0">
      <img
        src={tinnSplash}
        alt=""
        className="w-full object-cover object-bottom"
        style={{ height: '35vh', opacity: 0.4 }}
      />
    </div>

    <style>{`
      @keyframes splashLogoIn {
        from { opacity: 0; transform: scale(0.7) translateY(20px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes splashFadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes dotBounce {
        0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
        40%            { transform: translateY(-8px); opacity: 1;   }
      }
    `}</style>
  </div>
);

// ── App ──────────────────────────────────────────────────────────
function App() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFadeOut, setSplashFadeOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Splash timer — fade out แล้วซ่อน
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFadeOut(true), SPLASH_DURATION);
    const hideTimer = setTimeout(() => setSplashVisible(false), SPLASH_DURATION + 800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // LIFF init
  useEffect(() => {
    if (DEV_MODE) {
      const mockUser = {
        userId: "dev_user_" + Date.now(),
        displayName: "Dev User",
        pictureUrl: "https://via.placeholder.com/150/10b981/FFFFFF?text=DEV",
      };
      setIsLiffReady(true);
      setIsLoggedIn(true);
      setUserId(mockUser.userId);
      setDisplayName(mockUser.displayName);
      setPictureUrl(mockUser.pictureUrl);
      localStorage.setItem("liff_userId", mockUser.userId);
      localStorage.setItem("liff_displayName", mockUser.displayName);
      localStorage.setItem("liff_pictureUrl", mockUser.pictureUrl);
      mockApi.createOrGetUser(mockUser.userId).catch(console.error);
      return;
    }

    const liffId =
      (typeof window !== "undefined" && (window as any).__VITE_LIFF_ID__) ||
      ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_LIFF_ID) as string) ||
      "";

    if (!liffId) {
      setIsLiffReady(true);
      return;
    }

    liff.init({ liffId })
      .then(() => {
        setIsLiffReady(true);
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          liff.getProfile()
            .then((profile) => {
              setUserId(profile.userId);
              setDisplayName(profile.displayName);
              setPictureUrl(profile.pictureUrl || null);
              localStorage.setItem("liff_userId", profile.userId);
              localStorage.setItem("liff_displayName", profile.displayName);
              if (profile.pictureUrl) localStorage.setItem("liff_pictureUrl", profile.pictureUrl);
              mockApi.createOrGetUser(profile.userId).catch(console.error);
            })
            .catch(() => setError("Failed to get user profile"));
        } else {
          // รอ splash fade out ก่อนค่อย redirect login
          setTimeout(() => liff.login(), SPLASH_DURATION + 800);
        }
      })
      .catch((e: Error) => {
        setError(`LIFF init failed: ${e.message}`);
        setIsLiffReady(true);
      });
  }, []);

  const liffContextValue = { isLoggedIn, userId, displayName, pictureUrl, isLiffReady };

  return (
    <>
      {/* Splash overlay — แสดงทับทุกหน้า */}
      {splashVisible && <SplashScreen fadeOut={splashFadeOut} />}

      {/* App content — โหลดอยู่เบื้องหลังระหว่าง splash */}
      {error ? (
        <div className="min-h-screen bg-gradient-to-br from-red-100 to-white flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-800">Initialization Error</h2>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <LiffContext.Provider value={liffContextValue}>
          <Router>
            <Routes>
              <Route path="/" element={<LaunchPage />} />
              <Route path="/tinder" element={<TinderPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/routing" element={<RoutingPage />} />
              <Route path="/rewards" element={<CoinRewardsPage />} />
              <Route path="/travel-companion" element={<TravelCompanion />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/event" element={<EventPage />} />
            </Routes>
          </Router>
        </LiffContext.Provider>
      )}
    </>
  );
}

export default App;