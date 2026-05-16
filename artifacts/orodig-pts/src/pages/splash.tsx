import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import loginBg from "@assets/image_1778968907902.png";

export default function Splash() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress(Math.min((step / steps) * 100, 100));

      if (step >= steps - 8) {
        setFadeOut(true);
      }

      if (step >= steps) {
        clearInterval(timer);
        setLocation("/dashboard");
      }
    }, interval);

    return () => clearInterval(timer);
  }, [setLocation]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <div className="animate-pulse">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter drop-shadow-[0_0_30px_rgba(201,164,60,0.8)]"
            style={{ color: "hsl(42,68%,50%)" }}>
            ORODIG
          </h1>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-widest mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            PTS
          </p>
        </div>

        <p className="text-white/90 text-lg sm:text-xl font-bold tracking-widest uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          Oro Digital Para Todos
        </p>

        <div className="w-48 sm:w-64 mt-4">
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(42,68%,40%), hsl(42,68%,60%), hsl(42,68%,50%))",
                boxShadow: "0 0 10px hsl(42 68% 50% / 0.8)"
              }}
            />
          </div>
          <p className="text-white/60 text-xs mt-2 tracking-widest uppercase">Cargando plataforma...</p>
        </div>
      </div>
    </div>
  );
}
