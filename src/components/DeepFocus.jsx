import React, { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import plantData from "../assets/lottie/plant.json";
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  RotateCcw,
  Trees,
  Volume2,
  VolumeX,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Sprout,
  Leaf,
  Skull,
  X,
  CloudRain,
  Coffee,
  Clock
} from "lucide-react";
import { NekoMascotFull } from "./NekoMascot";

const DeepFocus = () => {
  const TOTAL_TIME = 25 * 60; // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const fullscreenRef = useRef(null);
  const audioRefs = useRef({
    rain: null,
    cafe: null,
    clock: null
  });

  const [isMuted, setIsMuted] = useState(false);
  const [volumes, setVolumes] = useState({ rain: 50, cafe: 0, clock: 0 }); // 0-100
  const [preCountdown, setPreCountdown] = useState(null); // null, 3, 2, 1, "Mulai!"

  // Initialize Audio only once
  useEffect(() => {
    audioRefs.current.rain = new Audio("/audio/rain.ogg");
    audioRefs.current.cafe = new Audio("/audio/cafe.ogg");
    audioRefs.current.clock = new Audio("/audio/clock.ogg");

    Object.values(audioRefs.current).forEach(audio => {
      audio.loop = true;
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  // Sync volume state to actual audio objects
  useEffect(() => {
    if (audioRefs.current.rain) audioRefs.current.rain.volume = volumes.rain / 100;
    if (audioRefs.current.cafe) audioRefs.current.cafe.volume = volumes.cafe / 100;
    if (audioRefs.current.clock) audioRefs.current.clock.volume = volumes.clock / 100;
  }, [volumes]);

  // Gamification Stats
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("forest_stats");
    return saved ? JSON.parse(saved) : { planted: 0, dead: 0 };
  });

  const [treeState, setTreeState] = useState("idle"); // 'idle', 'growing', 'dead', 'success'
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    localStorage.setItem("forest_stats", JSON.stringify(stats));
  }, [stats]);

  // Audio Playback Controller
  useEffect(() => {
    const shouldPlay = isRunning && !showWarning && treeState === "growing" && !isMuted;

    Object.values(audioRefs.current).forEach(audio => {
      if (!audio) return;
      if (shouldPlay) {
        audio.play().catch((e) => console.log("Audio autoplay prevented:", e));
      } else {
        audio.pause();
      }
    });
  }, [isRunning, showWarning, treeState, isMuted]);

  useEffect(() => {
    let interval;
    if (isRunning && !showWarning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setTreeState("success");
      setStats((s) => ({ ...s, planted: s.planted + 1 }));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      setTimeout(() => {
        setTimeLeft(TOTAL_TIME);
        setTreeState("idle");
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, showWarning]);

  // Anti-Cheat: Visibility & Fullscreen Change API
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If user tabs out or minimizes window while timer is running
      if (document.hidden && isRunning && treeState === "growing") {
        killTree();
      }
    };

    const handleFullscreenChange = () => {
      // If user presses ESC and exits fullscreen while growing
      if (
        !document.fullscreenElement &&
        isRunning &&
        treeState === "growing" &&
        !showWarning
      ) {
        setShowWarning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isRunning, treeState, showWarning]);

  const killTree = () => {
    setIsRunning(false);
    setShowWarning(false);
    setTreeState("dead");
    setStats((s) => ({ ...s, dead: s.dead + 1 }));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    setTimeout(() => {
      setTimeLeft(TOTAL_TIME);
      setTreeState("idle");
    }, 5000);
  };

  // Pre-start Countdown Logic
  useEffect(() => {
    let timer;
    if (preCountdown !== null) {
      if (typeof preCountdown === "number" && preCountdown > 1) {
        timer = setTimeout(() => setPreCountdown(preCountdown - 1), 1000);
      } else if (preCountdown === 1) {
        timer = setTimeout(() => setPreCountdown("Mulai!"), 1000);
      } else if (preCountdown === "Mulai!") {
        timer = setTimeout(() => {
          setPreCountdown(null);
          setIsRunning(true);
          setTreeState("growing");
          setTimeLeft(TOTAL_TIME);
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [preCountdown]);

  const handleStart = () => {
    if (fullscreenRef.current) {
      fullscreenRef.current
        .requestFullscreen()
        .catch((err) => console.log("Fullscreen failed:", err));
    }
    setPreCountdown(3);
  };

  const handleGiveUpClick = () => {
    if (!isRunning) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    setShowWarning(true);
  };

  const resumeFocus = () => {
    setShowWarning(false);
    if (fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen().catch(() => { });
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const strokeDashoffset = 830 - 830 * (timeLeft / TOTAL_TIME);

  const getTreeVisual = () => {
    if (treeState === "dead") {
      return (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="relative">
            <Skull
              className="w-24 h-24 text-rose-800 drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="text-rose-500 font-bold mt-4 text-lg">
            Pohon layu dan mati...
          </p>
          <p className="text-rose-400 text-xs mt-1">
            Gagal merawat pohon karena distraksi.
          </p>
        </div>
      );
    }

    if (treeState === "success") {
      return (
        <div className="flex flex-col items-center animate-bounce">
          <div className="w-48 h-48 -mb-8 flex items-center justify-center drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]">
            <Trees className="w-32 h-32 text-emerald-400" />
          </div>
          <p className="text-emerald-400 font-bold mt-4 text-xl tracking-wide">
            Pohon Tumbuh Sempurna!
          </p>
          <p className="text-emerald-300 text-xs mt-1">
            +1 Pohon ke dalam Hutan Virtual
          </p>
        </div>
      );
    }

    if (treeState === "growing") {
      return (
        <div className="relative flex items-center justify-center">
          {isRunning && (
            <div className="absolute -inset-4 border-2 border-indigo-400/30 rounded-full animate-spin-slow pointer-events-none" />
          )}

          <div
            className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center shadow-inner relative overflow-hidden transition-all duration-1000 ${isRunning ? "bg-indigo-50/50 scale-105" : "bg-slate-50 scale-100"
              } ${treeState === "dead" && "bg-rose-50 grayscale"
              } ${treeState === "success" && "bg-emerald-50"}`}
          >
            <div className="w-40 h-40 -mb-6 flex items-center justify-center animate-pulse drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              <Lottie animationData={plantData} loop={true} className="w-full h-full" />
            </div>
            <p className="text-emerald-300 text-sm mt-4 font-bold tracking-wide animate-pulse">
              Merawat pohon fokus...
            </p>
          </div>
        </div>
      );
    }

    // Idle
    return (
      <div className="flex flex-col items-center text-slate-500 transition-all hover:scale-105 duration-500 opacity-60 grayscale">
        <div className="relative flex items-center justify-center">
          {treeState === "idle" && !isRunning && preCountdown === null && (
            <div className="absolute inset-0 bg-indigo-50/50 rounded-full animate-pulse-glow" />
          )}
          <div className="w-32 h-32 -mb-4 flex items-center justify-center drop-shadow-lg">
            <Sprout className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-4 font-medium">
          Bebas Gangguan. Tumbuhkan Hutanmu.
        </p>
      </div>
    );
  };

  return (
    <div
      ref={fullscreenRef}
      className="min-h-full rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-6 md:p-10 group py-10 bg-slate-900 pb-32"
    >
      {/* Aesthetic Nature Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2674&auto=format&fit=crop')`, // Bright sunny forest
          filter:
            treeState === "dead"
              ? "grayscale(80%) brightness(50%) sepia(30%) hue-rotate(-50deg)"
              : "brightness(90%)",
        }}
      ></div>
      {/* Dark gradient overlay for text readability */}
      <div
        className={`absolute inset-0 z-0 transition-colors duration-1000 ${treeState === "dead" ? "bg-rose-950/60" : treeState === "success" ? "bg-emerald-900/40" : "bg-slate-900/40"}`}
      ></div>

      <div className="relative z-10 text-center w-full max-w-lg flex flex-col h-full py-4">
        {/* Top Header & Stats */}
        <div className="flex justify-center gap-4 items-center opacity-90 transition-opacity w-full max-w-sm mx-auto mb-6">
          <div
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl border border-white/30 backdrop-blur-md shadow-lg"
            title="Pohon Ditanam"
          >
            <Trees className="w-4 h-4 text-emerald-300 drop-shadow-md" />
            <span className="text-white font-bold text-xs md:text-sm drop-shadow-md">
              {stats.planted}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-white/20 p-2.5 rounded-xl border border-white/30 backdrop-blur-md shadow-lg hover:bg-white/30 transition-colors text-white cursor-pointer"
            title={isMuted ? "Nyalakan Musik Lofi" : "Matikan Musik Lofi"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-slate-300" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
          </button>

          <div
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl border border-white/30 backdrop-blur-md shadow-lg"
            title="Pohon Mati"
          >
            <Skull className="w-4 h-4 text-rose-300 drop-shadow-md" />
            <span className="text-white font-bold text-xs md:text-sm drop-shadow-md">
              {stats.dead}
            </span>
          </div>
        </div>

        {/* Dynamic Tree Visual */}
        <div className="mb-4 h-32 flex items-end justify-center shrink-0">
          {getTreeVisual()}
        </div>

        {/* Desk Clock Aesthetic */}
        <div className="relative flex flex-col items-center justify-center mx-auto mb-10 shrink-0">
          {/* Clock Base/Stand */}
          <div className="absolute -bottom-4 w-40 h-8 bg-slate-800 rounded-[100%] blur-sm opacity-50"></div>
          <div className="absolute -bottom-3 w-32 h-6 bg-slate-200/20 backdrop-blur-xl rounded-t-3xl border-t border-white/30"></div>
          <div className="absolute -bottom-4 flex gap-12">
            <div className="w-3 h-6 bg-slate-300/40 backdrop-blur-md rounded-full rotate-12 border border-white/20"></div>
            <div className="w-3 h-6 bg-slate-300/40 backdrop-blur-md rounded-full -rotate-12 border border-white/20"></div>
          </div>

          {/* Main Clock Face */}
          <div className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72 rounded-full border-[16px] border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_10px_20px_rgba(0,0,0,0.2)] transition-shadow duration-700">
            {/* Inner Clock Background (Solid color to prevent blur bleeding artifacts) */}
            <div className="absolute inset-0 rounded-full bg-slate-900 -z-10 shadow-[inner_0_0_30px_rgba(0,0,0,0.8)]"></div>

            {/* Inner Ring Glow */}
            <div className="absolute inset-1 rounded-full border border-slate-700/50 pointer-events-none"></div>

            <svg
              className="absolute inset-0 w-full h-full transform -rotate-90"
              overflow="visible"
              viewBox="0 0 288 288"
            >
              {/* SVG Glow Filter Definition */}
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx="144"
                cy="144"
                r="138"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress Track (Uses native SVG filter for glow) */}
              <circle
                cx="144"
                cy="144"
                r="138"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeLinecap="round"
                className={`${treeState === "dead" ? "text-rose-500" : treeState === "success" ? "text-emerald-400" : isRunning ? "text-emerald-400" : "text-slate-500"} transition-all`}
                strokeDasharray="867"
                style={{
                  strokeDashoffset:
                    treeState === "idle"
                      ? 0
                      : 867 - 867 * (timeLeft / TOTAL_TIME),
                  filter: "url(#glow)",
                  transition: "stroke-dashoffset 1s linear",
                }}
              />
            </svg>
            <div className="flex flex-col items-center">
              <span
                className={`text-6xl md:text-7xl font-black font-mono tracking-widest ${treeState === "dead" ? "text-rose-400" : "text-white"}`}
              >
                {formatTime(timeLeft)}
              </span>
              {isRunning && treeState === "growing" && (
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest mt-2 animate-pulse">
                  Menumbuhkan...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 w-full justify-center items-center">
          {treeState === "idle" ? (
            <button
              onClick={handleStart}
              className="w-full max-w-[280px] py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30 shadow-xl hover:-translate-y-1"
            >
              <div className="p-1.5 bg-white/20 rounded-full">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <span>Masuk Zona Gimfikasi</span>
            </button>
          ) : (
            <button
              onClick={handleGiveUpClick}
              disabled={treeState === "dead" || treeState === "success"}
              className={`w-full max-w-[280px] py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${treeState === "dead" || treeState === "success" ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700" : "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30 shadow-lg hover:-translate-y-1 cursor-pointer"}`}
            >
              {treeState === "growing" && <X className="w-5 h-5" />}
              <span>
                {treeState === "growing"
                  ? "Menyerah (Bunuh Pohon)"
                  : treeState === "dead"
                    ? "Membersihkan Ranting..."
                    : "Panen Pohon..."}
              </span>
            </button>
          )}

          {/* Spatial Audio Mixer */}
          {treeState === "idle" && (
            <div className="w-full max-w-[280px] mt-6 bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl flex flex-col gap-4 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Ambient Mixer</span>
                <button onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? "Bunyikan Audio" : "Bisukan Audio"} className="text-emerald-400 hover:text-white transition-colors focus:ring-2 focus:ring-emerald-500 rounded-md p-1">
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </h4>

              <div className="flex items-center gap-3">
                <CloudRain className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                <input type="range" min="0" max="100" value={volumes.rain} onChange={(e) => setVolumes({ ...volumes, rain: e.target.value })} aria-label="Volume Suara Hujan" className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-sky-500" />
              </div>

              <div className="flex items-center gap-3">
                <Coffee className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                <input type="range" min="0" max="100" value={volumes.cafe} onChange={(e) => setVolumes({ ...volumes, cafe: e.target.value })} aria-label="Volume Suasana Kafe" className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500" />
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                <input type="range" min="0" max="100" value={volumes.clock} onChange={(e) => setVolumes({ ...volumes, clock: e.target.value })} aria-label="Volume Detak Jam" className="w-full accent-slate-300 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-slate-300" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-start Countdown Overlay */}
      {preCountdown !== null && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
          <span className="text-8xl md:text-[10rem] font-black text-white animate-bounce drop-shadow-[0_0_40px_rgba(52,211,153,0.8)] tracking-widest">
            {preCountdown}
          </span>
        </div>
      )}

      {/* Warning Modal (Give Up) */}
      {showWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in p-6">
          <div className="bg-slate-800 border border-rose-500/30 w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              Menyerah Sekarang?
            </h3>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed">
              Pohon yang sedang Anda tanam akan{" "}
              <strong className="text-rose-400">langsung mati dan layu</strong>{" "}
              jika Anda keluar. Yakin ingin membatalkan komitmen Anda?
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={resumeFocus}
                className="flex-1 py-3.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
              >
                Kembali Fokus
              </button>
              <button
                onClick={killTree}
                className="flex-1 py-3.5 rounded-xl font-bold bg-slate-700 hover:bg-rose-600 hover:text-white text-rose-400 transition-colors cursor-pointer"
              >
                Bunuh Pohon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepFocus;
