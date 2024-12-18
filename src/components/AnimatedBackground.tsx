// src/components/AnimatedBackground.tsx
import { Box } from '@mantine/core';

export const AnimatedBackground: React.FC = () => {
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #000000, #1a0000)',
        pointerEvents: 'none'
      }}
    >
      <style>
        {`
          @keyframes spotlight {
            0% { transform: rotate(0deg) scale(1); opacity: 0.3; }
            25% { transform: rotate(90deg) scale(1.2); opacity: 0.5; }
            50% { transform: rotate(180deg) scale(1); opacity: 0.3; }
            75% { transform: rotate(270deg) scale(1.2); opacity: 0.5; }
            100% { transform: rotate(360deg) scale(1); opacity: 0.3; }
          }

          @keyframes discoBall {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes glowPulse {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.5); }
            100% { opacity: 0.3; transform: scale(1); }
          }

          .spotlight {
            position: absolute;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255, 0, 0, 0.2) 0%, transparent 70%);
            animation: spotlight 8s infinite linear;
            will-change: transform, opacity;
          }

          .disco-ball {
            position: absolute;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(255, 0, 0, 0.6) 0%, rgba(255, 0, 0, 0.2) 50%, transparent 70%);
            animation: discoBall 10s infinite linear;
            will-change: transform;
          }

          .glow-orb {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #FF0000;
            border-radius: 50%;
            filter: blur(5px);
            animation: glowPulse 3s infinite ease-in-out;
            will-change: transform, opacity;
          }
        `}
      </style>

      {/* Reflektory */}
      {[...Array(4)].map((_, i) => (
        <Box
          key={`spotlight-${i}`}
          className="spotlight"
          style={{
            left: `${15 + i * 25}%`,
            top: `${10 + (i % 2) * 50}%`,
            animationDelay: `${i * -2}s`
          }}
        />
      ))}

      {/* Kule disco */}
      {[...Array(3)].map((_, i) => (
        <Box
          key={`disco-${i}`}
          className="disco-ball"
          style={{
            left: `${20 + i * 30}%`,
            top: `${20 + (i % 2) * 40}%`,
            animationDelay: `${i * -3}s`
          }}
        />
      ))}

      {/* Świecące orby */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={`orb-${i}`}
          className="glow-orb"
          style={{
            left: `${Math.sin(i) * 50 + 50}%`,
            top: `${Math.cos(i) * 40 + 50}%`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </Box>
  );
};
