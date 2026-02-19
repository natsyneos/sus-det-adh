import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import bgImage from '../../assets/033b0a9678b326af3e1307879cea8820c2f1418b.png';

interface LandingScreenProps {
  onTopicSelect: (topic: string) => void;
}

const topics = [
  "What Is ADH1?",
  "Mechanism of Disease",
  "Average Diagnostic Time",
  "Clinical Presentation",
  "Confirming Diagnosis",
  "Limitations of Conventional Therapy"
];

export function LandingScreen({ onTopicSelect }: LandingScreenProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position for flashlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveTopic(topic);
    // Delay navigation to show the press effect
    setTimeout(() => {
      onTopicSelect(topic);
    }, 400);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#1a1a1c] relative overflow-hidden flex flex-col items-center justify-center px-16 py-12"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Animated fog overlay */}
      <div className="absolute inset-0 opacity-30 z-[1]">
        <div className="fog-layer"></div>
      </div>

      {/* Spotlight overlay effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `radial-gradient(circle 280px at ${mousePosition.x}px ${mousePosition.y}px, 
                       transparent 0%, 
                       transparent 40%, 
                       rgba(26, 26, 28, 0.7) 100%)`
        }}
      />

      <div className="relative z-10 max-w-7xl w-full">
        {/* Main heading */}
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl font-light tracking-wide mb-20 text-center"
        >
          <span className="text-white">SUSPECT & </span>
          <span className="text-[#FFC358] font-bold">DETECT ADH1</span>
        </motion.h1>

        {/* Topic grid */}
        <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
          {topics.map((topic, index) => {
            const isActive = activeTopic === topic;
            
            return (
              <motion.button
                key={topic}
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  scale: isActive ? 1.02 : 1
                }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                onClick={() => handleTopicClick(topic)}
                className={`group relative bg-[#252528] border rounded-lg px-8 py-12 
                           text-white hover:border-[#5a5a5e] transition-all duration-400
                           hover:bg-[#2a2a2e] overflow-hidden z-30
                           ${isActive ? 'border-[#d4a574]' : 'border-[#3a3a3e]'}`}
              >
                {/* Amber glow on press/active */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#d4a574]/20 via-[#d4a574]/10 to-transparent"
                  />
                )}
                
                {/* Subtle glow on hover */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4a4a4e]/20 to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                )}
                
                <span className="relative z-10 text-lg font-light tracking-wide leading-relaxed block">
                  {topic}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
