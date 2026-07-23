import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Flavor = 'pink' | 'white' | 'saffron';

interface FlavorConfig {
  id: Flavor;
  name: string;
  color: string;
  liquidGradient: string;
  splashFill: string;
  glowClass: string;
  badgeClass: string;
  accentColor: string;
  shadowColor: string;
  emoji: string;
}

const FLAVORS: FlavorConfig[] = [
  {
    id: 'pink',
    name: 'Strawberry Bliss',
    color: 'bg-pink-300 dark:bg-pink-400',
    liquidGradient: 'linear-gradient(135deg, #ffd1dc 0%, #fbcfe8 100%)',
    splashFill: '#ffd1dc',
    glowClass: 'from-pink-100/60 dark:from-rose-950/20',
    badgeClass: 'bg-pink-500 text-white',
    accentColor: '#db2777',
    shadowColor: 'rgba(219,39,119,0.15)',
    emoji: '💗'
  },
  {
    id: 'white',
    name: 'Vedic Pure',
    color: 'bg-white dark:bg-neutral-200',
    liquidGradient: 'linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%)',
    splashFill: '#ffffff',
    glowClass: 'from-blue-50/60 dark:from-sky-950/20',
    badgeClass: 'bg-blue-600 text-white',
    accentColor: '#2563eb',
    shadowColor: 'rgba(0,0,0,0.06)',
    emoji: '🤍'
  },
  {
    id: 'saffron',
    name: 'Saffron Badam',
    color: 'bg-amber-400',
    liquidGradient: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
    splashFill: '#fef08a',
    glowClass: 'from-amber-100/60 dark:from-amber-950/20',
    badgeClass: 'bg-amber-500 text-neutral-900 font-extrabold',
    accentColor: '#d97706',
    shadowColor: 'rgba(217,119,6,0.15)',
    emoji: '💛'
  }
];

export const MilkSplashAnimation: React.FC = () => {
  const [scrollThrown, setScrollThrown] = useState(false);
  const [activeFlavor, setActiveFlavor] = useState<Flavor>('pink'); // Set strawberry pink as default as requested!
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number; scale: number; rotation: number; color: string }[]>([]);
  const [isPouring, setIsPouring] = useState(false);
  const [pourCount, setPourCount] = useState(0);

  // 3D Tilt states
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const currentFlavor = FLAVORS.find(f => f.id === activeFlavor) || FLAVORS[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Compute normalized coordinates: -1 to 1 relative to center
    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);
    
    // Tilt angle limits (Max 15 degrees)
    setTilt({
      x: -mouseY * 15,
      y: mouseX * 15
    });
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const triggerSplash = (e?: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | null, targetFlavor?: Flavor) => {
    let x = 250;
    let y = 200;

    if (e && 'clientX' in e) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      // Random coordinates around center bottle region
      x = 180 + Math.random() * 140;
      y = 150 + Math.random() * 150;
    }
    
    const flavorToUse = targetFlavor ? (FLAVORS.find(f => f.id === targetFlavor) || currentFlavor) : currentFlavor;

    // Generate 10 droplets for a more volume-rich splash
    const newDrops = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: x + (Math.random() * 80 - 40),
      y: y + (Math.random() * 50 - 25),
      scale: Math.random() * 0.9 + 0.4,
      rotation: Math.random() * 360,
      color: flavorToUse.splashFill
    }));

    setSplashes((prev) => [...prev, ...newDrops].slice(-35)); // Cap droplets in DOM
    
    setIsPouring(true);
    setPourCount(prev => prev + 1);
    setTimeout(() => {
      setIsPouring(false);
    }, 1200);
  };

  useEffect(() => {
    // Initial splash on load
    const initialTimer = setTimeout(() => {
      triggerSplash(null, 'pink');
    }, 800);

    // Periodic automatic ambient splash
    const intervalTimer = setInterval(() => {
      triggerSplash(null);
    }, 4500);

    // Scroll listener for "milk being thrown on bottle"
    let lastScrollY = window.scrollY;
    let hasTriggeredScrollSplash = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 80 && !hasTriggeredScrollSplash && currentScrollY > lastScrollY) {
        hasTriggeredScrollSplash = true;
        setScrollThrown(true);
        
        // Trigger multiple high-volume splashes to simulate milk being thrown
        triggerSplash(null, activeFlavor);
        setTimeout(() => triggerSplash(null, activeFlavor), 150);
        setTimeout(() => triggerSplash(null, activeFlavor), 300);
        
        // Clear stream after 1.5 seconds
        setTimeout(() => {
          setScrollThrown(false);
        }, 1500);
      }
      
      // Reset when scrolling back near top
      if (currentScrollY < 15) {
        hasTriggeredScrollSplash = false;
        setScrollThrown(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeFlavor]);

  // Render floating details inside the liquid matching the active flavor
  const renderLiquidInclusions = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => {
          let style: React.CSSProperties = {};
          let className = "";

          if (activeFlavor === 'pink') {
            // Tiny strawberries or pink pulp
            className = "absolute bg-rose-400/70 rounded-full";
            style = {
              width: i % 2 === 0 ? '5px' : '7px',
              height: i % 2 === 0 ? '5px' : '7px',
            };
          } else if (activeFlavor === 'saffron') {
            // Saffron strands (thin lines)
            className = "absolute bg-amber-600/80 rounded-full rotate-12";
            style = {
              width: '1.5px',
              height: '8px',
            };
          } else {
            // Premium white cream bubbles
            className = "absolute bg-white/60 rounded-full border border-blue-100/25";
            style = {
              width: i % 2 === 0 ? '6px' : '4px',
              height: i % 2 === 0 ? '6px' : '4px',
            };
          }

          return (
            <motion.div
              key={i}
              className={className}
              style={{ 
                bottom: 0, 
                left: `${12 + i * 11}%`,
                ...style
              }}
              animate={{
                y: [280, 0],
                x: [0, (i % 2 === 0 ? 12 : -12), 0],
                opacity: [0, 0.8, 0],
                rotate: activeFlavor === 'saffron' ? [12, 180, 360] : 0
              }}
              transition={{
                duration: 4 + i * 0.6,
                repeat: Infinity,
                delay: i * 0.35,
                ease: "easeOut"
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="relative w-full max-w-[500px] h-[550px] mx-auto flex flex-col items-center justify-center cursor-pointer select-none group"
      onClick={(e) => triggerSplash(e)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title="Click anywhere on the bottle to splash milk!"
      style={{ perspective: 1000 }}
    >
      {/* Scroll-triggered milk throwing stream */}
      <AnimatePresence>
        {scrollThrown && (
          <motion.svg
            className="absolute z-40 pointer-events-none"
            style={{
              top: -80,
              left: -120,
              width: 400,
              height: 350,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Main streaming milk stream */}
            <motion.path
              d="M 20,40 C 120,60 220,180 280,240"
              fill="none"
              stroke={currentFlavor.splashFill}
              strokeWidth="16"
              strokeLinecap="round"
              initial={{ strokeDasharray: "400", strokeDashoffset: "400" }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* Inner highlights to make it look 3D and liquidy */}
            <motion.path
              d="M 25,43 C 122,62 218,178 276,236"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ strokeDasharray: "400", strokeDashoffset: "400" }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
            />
            {/* Droplets flying off the stream */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.circle
                key={i}
                r={Math.random() * 4 + 3}
                fill={currentFlavor.splashFill}
                initial={{ x: 20, y: 40, opacity: 0 }}
                animate={{
                  x: [20, 100 + i * 30, 200 + i * 20],
                  y: [40, 70 + i * 25, 140 + i * 35],
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.08,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Background radial glowing dynamic lights */}
      <div className={`absolute inset-0 bg-radial transition-all duration-1000 ${currentFlavor.glowClass} to-transparent blur-3xl rounded-full scale-110 pointer-events-none`} />

      {/* Background dynamic organic liquid shape drifting */}
      <motion.div 
        className="absolute w-76 h-76 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 filter blur-sm pointer-events-none"
        animate={{
          borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"],
          rotate: [0, 180, 360],
          scale: [0.9, 1.05, 0.9]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating interactive hint badge */}
      <motion.div 
        className={`absolute top-4 right-4 text-xs font-black px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none z-20 uppercase tracking-widest border border-white/20 transition-all duration-500 ${currentFlavor.badgeClass}`}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        Click to Splash!
      </motion.div>

      {/* Splash Liquid Waves rising from bottom */}
      <div className="absolute bottom-4 left-0 right-0 h-28 overflow-hidden rounded-b-3xl pointer-events-none z-10">
        {/* Layer 1: Foreground Milk Wave */}
        <motion.svg 
          viewBox="0 0 1200 120" 
          style={{ fill: currentFlavor.splashFill }}
          className="absolute bottom-0 w-[200%] h-full transition-colors duration-750"
          animate={{ x: [0, -600] }}
          transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
        >
          <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1350,30 1500,60 L1500,120 L0,120 Z" />
        </motion.svg>

        {/* Layer 2: Midground Soft Milk Wave */}
        <motion.svg 
          viewBox="0 0 1200 120" 
          style={{ fill: currentFlavor.splashFill, opacity: 0.5 }}
          className="absolute bottom-1 w-[200%] h-[90%] transition-colors duration-750"
          animate={{ x: [-600, 0] }}
          transition={{ repeat: Infinity, duration: 13, ease: "linear" }}
        >
          <path d="M0,50 C150,20 350,80 500,50 C650,20 850,80 1000,50 C1150,20 1350,80 1500,50 L1500,120 L0,120 Z" />
        </motion.svg>
      </div>

      {/* 3D Dynamic floor shadow that moves opposite to the bottle's tilt */}
      <motion.div
        className="absolute bottom-10 w-36 h-6 rounded-full bg-black/10 dark:bg-black/35 blur-md pointer-events-none z-0"
        animate={{
          scale: isHovering ? 1.08 : 1.0,
          x: -tilt.y * 1.5,
          y: tilt.x * 0.5,
          opacity: isHovering ? 0.35 : 0.2
        }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      />

      {/* Main Glass Milk Bottle Component with true 3D properties */}
      <motion.div 
        className="relative z-10 w-44 h-[380px] flex flex-col items-center"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          y: isHovering ? -12 : [0, -8, 0],
        }}
        transition={isHovering ? { type: "spring", stiffness: 150, damping: 18 } : {
          y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
          rotateX: { type: "spring", stiffness: 150, damping: 18 },
          rotateY: { type: "spring", stiffness: 150, damping: 18 }
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Liquid level inside the bottle */}
        <div 
          className="absolute inset-x-2.5 bottom-6 top-16 rounded-b-3xl overflow-hidden shadow-inner flex flex-col justify-end transition-all duration-700"
          style={{
            background: currentFlavor.liquidGradient,
            boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.03), inset 0 10px 15px rgba(255,255,255,0.8)`
          }}
        >
          {/* Internal milk surface wave */}
          <motion.div 
            className="w-[200%] h-6 opacity-30 bg-white"
            animate={{ x: [0, -100, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={{
              borderRadius: "40%",
              marginBottom: "-8px"
            }}
          />
          {renderLiquidInclusions()}
        </div>

        {/* Glass Bottle Outer Border with Specular Highlight Reflection */}
        <div className="absolute inset-0 border-3 border-white/60 dark:border-white/30 rounded-t-[50px] rounded-b-[30px] shadow-[inset_0_4px_16px_rgba(255,255,255,0.85),_0_12px_24px_rgba(0,0,0,0.08)] bg-transparent backdrop-blur-[1px] pointer-events-none z-10" />

        {/* Foil Cap - 3D translation effect */}
        <div 
          style={{ transform: 'translateZ(25px)' }}
          className={`absolute -top-1 w-20 h-6 bg-gradient-to-r rounded-full shadow-md border border-white/40 flex items-center justify-center transition-all duration-700 ${
            activeFlavor === 'pink' ? 'from-pink-600 via-pink-400 to-pink-700' : activeFlavor === 'saffron' ? 'from-amber-600 via-amber-400 to-amber-700' : 'from-blue-700 via-blue-500 to-blue-800'
          }`}
        >
          <div className="w-16 h-1 bg-white/30 rounded-full absolute top-1" />
          <span className="text-[9px] font-mono font-black text-white/95 uppercase tracking-widest">
            {activeFlavor === 'white' ? 'PURE' : activeFlavor === 'pink' ? 'SWEET' : 'VEDIC'}
          </span>
        </div>
        <div 
          style={{ transform: 'translateZ(20px)' }}
          className={`absolute top-5 w-16 h-4 bg-gradient-to-r rounded-b-md shadow-sm border-x border-b border-white/20 transition-all duration-700 ${
            activeFlavor === 'pink' ? 'from-pink-600 to-pink-800' : activeFlavor === 'saffron' ? 'from-amber-600 to-amber-800' : 'from-blue-600 to-blue-800'
          }`}
        />

        {/* Bottle Neck Details */}
        <div style={{ transform: 'translateZ(15px)' }} className="absolute top-9 w-14 h-1 bg-white/40 rounded-full z-10" />
        <div style={{ transform: 'translateZ(15px)' }} className="absolute top-12 w-14 h-1 bg-white/40 rounded-full z-10" />

        {/* The Premium "PARAG" Label Design - Pop out 3D parallax effect */}
        <div 
          style={{ transform: 'translateZ(38px)' }}
          className="absolute top-28 w-[92%] bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-950 dark:from-neutral-900 dark:to-neutral-950 text-white py-5 px-3 rounded-xl shadow-2xl border border-white/15 text-center flex flex-col justify-center items-center overflow-hidden z-20"
        >
          {/* Radial light behind label text */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_75%)] pointer-events-none" />
          
          <span className={`text-[9px] font-black uppercase tracking-[0.22em] transition-colors duration-500 ${
            activeFlavor === 'pink' ? 'text-pink-300' : activeFlavor === 'saffron' ? 'text-amber-300' : 'text-blue-300'
          }`}>
            {currentFlavor.name}
          </span>
          <h2 className="text-xl font-black font-sans leading-none tracking-wider my-1 text-white drop-shadow-sm">
            PARAG
          </h2>
          <div className="h-[2px] w-12 bg-white/30 rounded-full my-0.5" />
          <h3 className="text-xs font-semibold tracking-[0.15em] text-neutral-300">
            MILK
          </h3>
          <p className="text-[7px] text-white/80 mt-1.5 bg-white/10 px-2.5 py-0.5 rounded-full font-black tracking-widest uppercase">
            100% Pasteur Fresh
          </p>

          {/* Clean minimal badge icon */}
          <div className="w-5 h-5 mt-1 text-white opacity-40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </div>

        {/* Glass reflection shines floating on top */}
        <div style={{ transform: 'translateZ(42px)' }} className="absolute top-14 left-4 w-2 h-44 bg-gradient-to-r from-white/35 to-transparent rounded-full pointer-events-none z-10" />
        <div style={{ transform: 'translateZ(42px)' }} className="absolute top-14 right-4 w-1 h-32 bg-gradient-to-l from-white/20 to-transparent rounded-full pointer-events-none z-10" />
      </motion.div>

      {/* Dynamic Splashing Milk Particles on click */}
      <AnimatePresence>
        {splashes.map((splash) => (
          <motion.div
            key={splash.id}
            className="absolute z-30 pointer-events-none"
            style={{
              left: splash.x,
              top: splash.y,
            }}
            initial={{ scale: 0.1, y: 0, x: 0, opacity: 1 }}
            animate={{
              scale: [splash.scale * 0.5, splash.scale * 1.5, splash.scale],
              y: [0, -130 - Math.random() * 90, 60 + Math.random() * 110],
              x: [0, (Math.random() * 180 - 90), (Math.random() * 320 - 160)],
              opacity: [1, 0.95, 0],
              rotate: [0, splash.rotation]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.3,
              ease: "easeOut",
            }}
          >
            {/* Liquid drop SVG with dynamic active flavor splash color */}
            <svg 
              width="36" 
              height="36" 
              viewBox="0 0 40 40" 
              style={{ fill: splash.color }}
              className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.08)] transition-all"
            >
              {Math.random() > 0.45 ? (
                // Smooth round tear drop
                <path d="M20,5 C20,5 28,15 28,22 C28,27 24,31 20,31 C16,31 12,27 12,22 C12,15 20,5 20,5 Z" />
              ) : (
                // Splattering crown piece
                <path d="M12,15 C15,10 20,12 24,8 C26,14 31,18 28,24 C25,28 18,29 14,25 C10,21 9,18 12,15 Z" />
              )}
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Ambient milk splashing columns triggered during "isPouring" */}
      <AnimatePresence>
        {isPouring && (
          <>
            {/* Left Splashing Spray */}
            <motion.div
              className="absolute left-10 bottom-24 z-20 pointer-events-none"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.4, 1.6, 0.8],
                x: [-15, -90, -135],
                y: [0, -70, 25],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
            >
              <svg width="60" height="60" viewBox="0 0 100 100" style={{ fill: currentFlavor.splashFill }}>
                <path d="M10,80 C20,40 50,20 60,10 C50,40 30,70 10,80 C15,75 25,60 10,80 Z" />
                <circle cx="80" cy="15" r="5" />
                <circle cx="70" cy="35" r="4" />
                <circle cx="50" cy="55" r="6" />
              </svg>
            </motion.div>

            {/* Right Splashing Spray */}
            <motion.div
              className="absolute right-10 bottom-24 z-20 pointer-events-none"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.4, 1.6, 0.8],
                x: [15, 90, 135],
                y: [0, -70, 25],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
            >
              <svg width="60" height="60" viewBox="0 0 100 100" style={{ fill: currentFlavor.splashFill }}>
                <path d="M90,80 C80,40 50,20 40,10 C50,40 70,70 90,80 C85,75 75,60 90,80 Z" />
                <circle cx="20" cy="15" r="5" />
                <circle cx="30" cy="35" r="4" />
                <circle cx="50" cy="55" r="6" />
              </svg>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating surrounding bubbles that rise continuously with active color */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={`amb-${i}`}
            style={{
              width: i % 2 === 0 ? '7px' : '11px',
              height: i % 2 === 0 ? '7px' : '11px',
              bottom: '12%',
              left: `${8 + i * 6.8}%`,
              backgroundColor: currentFlavor.splashFill,
              boxShadow: `0 2px 4px rgba(0,0,0,0.02)`
            }}
            className="absolute rounded-full opacity-50 border border-white/25 transition-all duration-750"
            animate={{
              y: [0, -280 - Math.random() * 160],
              x: [0, Math.sin(i) * 45],
              opacity: [0, 0.6, 0.5, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 5.5 + Math.random() * 4.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Dynamic sleek flavor controller switch at the bottom */}
      <div 
        onClick={(e) => e.stopPropagation()} // Stop click on bar from splashing
        className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 bg-white/95 dark:bg-neutral-900/95 px-2 py-1.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl flex gap-1 z-30 pointer-events-auto backdrop-blur-sm"
      >
        {FLAVORS.map((f) => {
          const isSelected = activeFlavor === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveFlavor(f.id);
                // Trigger an exciting splash with the new color immediately!
                triggerSplash(null, f.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 cursor-pointer ${
                isSelected
                  ? `${f.badgeClass} shadow-md scale-105`
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span>{f.emoji}</span>
              <span className="tracking-wider">{f.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
