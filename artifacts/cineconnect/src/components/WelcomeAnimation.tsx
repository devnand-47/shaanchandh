import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film } from "lucide-react";

const STORAGE_KEY = "cc_welcome_shown";

function FilmStrip({ top }: { top: boolean }) {
  const holes = Array.from({ length: 12 });
  return (
    <div
      className={`absolute left-0 right-0 flex items-center gap-0 ${top ? "top-0" : "bottom-0"}`}
      style={{ height: 28, background: "rgba(0,0,0,0.85)" }}
    >
      {holes.map((_, i) => (
        <div
          key={i}
          className="flex-1 flex items-center justify-center"
        >
          <div className="w-4 h-3 rounded-sm border border-white/20 bg-background/60" />
        </div>
      ))}
    </div>
  );
}

export function WelcomeAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2600);
    const t3 = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      onDone();
    }, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "hsl(224, 71%, 4%)" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Scan-line texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
            }}
          />

          {/* Film strips top & bottom */}
          <FilmStrip top={true} />
          <FilmStrip top={false} />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
            }}
          />

          {/* Spotlight glow */}
          <motion.div
            className="absolute w-96 h-96 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(346,87%,43%,0.15) 0%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2.5, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-6 px-8 text-center">
            {/* Logo icon */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
            >
              <Film className="w-12 h-12 text-primary" />
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
            >
              <span className="font-serif italic text-4xl md:text-5xl font-bold text-foreground tracking-wide">
                Cine<span className="text-primary">Connect</span>
              </span>
            </motion.div>

            {/* Divider line */}
            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200px", opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
            />

            {/* Welcome text */}
            <motion.p
              className="text-muted-foreground text-lg font-medium tracking-widest uppercase"
              initial={{ opacity: 0, letterSpacing: "0.4em" }}
              animate={{ opacity: 1, letterSpacing: "0.2em" }}
              transition={{ delay: 0.75, duration: 0.6, ease: "easeOut" }}
            >
              Your story begins here
            </motion.p>
          </div>

          {/* Film grain overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px",
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="exit-overlay"
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{ background: "hsl(224, 71%, 4%)" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
}

export function useWelcomeAnimation() {
  const [shouldShow, setShouldShow] = useState(false);
  const [done, setDone] = useState(false);

  const trigger = () => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setShouldShow(true);
    }
  };

  const handleDone = () => {
    setShouldShow(false);
    setDone(true);
  };

  return { shouldShow, done, trigger, handleDone };
}
