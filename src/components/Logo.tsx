'use client';

import Image from 'next/image';
import { useState } from 'react';

const LOGO_PATHS = ['/logo.svg', '/logo.png', '/logo.svg.png', '/logo.webp'];

export function Logo({ size = 24, className = '' }: { size?: number; className?: string }) {
  const [currentPath, setCurrentPath] = useState(LOGO_PATHS[0]);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-teal-500/10 text-teal-600 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-semibold">SB</span>
      </div>
    );
  }

  return (
    <Image
      src={currentPath}
      alt="Start Buddy"
      width={size}
      height={size}
      className={className}
      priority
      onError={() => {
        const currentIndex = LOGO_PATHS.indexOf(currentPath);
        if (currentIndex < LOGO_PATHS.length - 1) {
          setCurrentPath(LOGO_PATHS[currentIndex + 1]);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

