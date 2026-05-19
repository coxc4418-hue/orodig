import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import welcomeBg from "@assets/welcome_banner.jpg";

export default function Splash() {
  const [, setLocation] = useLocation();
  const { currentMember } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!currentMember) {
      setLocation("/");
      return;
    }

    const duration = 5000;
    const fadeStart = 4300;

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, fadeStart);

    const redirectTimer = setTimeout(() => {
      setLocation("/dashboard");
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [setLocation, currentMember]);

  if (!currentMember) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 bg-black ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Welcome Image - Clear, legible, bg-contain to prevent cropping */}
      <div
        className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat bg-black"
        style={{ backgroundImage: `url(${welcomeBg})` }}
      />
    </div>
  );
}
