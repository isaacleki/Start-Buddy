'use client';

import { motion } from 'framer-motion';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isRunning?: boolean;
}

export function CircularProgress({ progress, size = 200, strokeWidth = 4, isRunning = false }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-teal-500"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: isRunning ? 1 : 0.3,
            ease: 'linear',
          }}
        />
      </svg>
    </div>
  );
}

