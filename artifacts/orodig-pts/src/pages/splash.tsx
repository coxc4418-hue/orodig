import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import loginBg from "@assets/image_1778968907902.png";

const GOLD = "hsl(42,68%,50%)";

export default function Splash() {
  const [, setLocation] = useLocation();
  const { currentMember } = useAuth();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!currentMember) {
      setLocation("/");
      return;
    }

    const duration = 5000;
    const tick = 40;
    const steps = duration / tick;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress(Math.min((step / steps) * 100, 100));
      if (step >= steps - 10) setFadeOut(true);
      if (step >= steps) {
        clearInterval(timer);
        setLocation("/dashboard");
      }
    }, tick);

    return () => clearInterval(timer);
  }, [setLocation, currentMember]);

  if (!currentMember) return null;

  const firstName = currentMember.fullName.split(" ")[0];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Dark overlay gradient */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.05), rgba(0,0,0,0.55))" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
        {/* Animated logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-40"
            style={{ background: GOLD, transform: "scale(2)" }} />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: "hsl(42 68% 50% / 0.6)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
            <span className="text-3xl sm:text-4xl font-black" style={{ color: GOLD }}>O</span>
          </div>
        </div>

        <div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter drop-shadow-[0_4px_20px_rgba(201,145,26,0.7)]"
            style={{ color: GOLD }}>
            ORODIG
          </h1>
          <p className="text-xl sm:text-2xl font-black text-white tracking-[0.3em] uppercase mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            PTS
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-white/90 text-lg sm:text-xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            ¡Bienvenido, <span style={{ color: GOLD }}>{firstName}</span>!
          </p>
          <p className="text-white/55 text-sm tracking-widest uppercase">Oro Digital Para Todos</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 sm:w-64 space-y-2">
          <div className="w-full bg-white/15 rounded-full h-1 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75 ease-linear"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, hsl(42,68%,35%), hsl(42,68%,58%), hsl(42,68%,42%))`,
                boxShadow: `0 0 12px hsl(42 68% 50% / 0.7)`,
              }}
            />
          </div>
          <p className="text-white/40 text-xs tracking-widest uppercase">Preparando tu panel...</p>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{
              background: GOLD,
              left: `${10 + i * 11}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDuration: `${1.5 + i * 0.4}s`,
              animationDelay: `${i * 0.2}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
