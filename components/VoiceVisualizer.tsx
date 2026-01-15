
import React from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 bg-blue-500 rounded-full transition-all duration-300 ${
            isActive 
              ? `animate-bounce opacity-100` 
              : 'h-2 opacity-30'
          }`}
          style={{
            animationDelay: isActive ? `${i * 0.15}s` : '0s',
            height: isActive ? '32px' : '8px'
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
