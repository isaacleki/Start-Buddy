'use client';

interface TimerSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function TimerSlider({ value, min, max, onChange, disabled }: TimerSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const thumbSize = 24;
  const thumbOffset = (thumbSize / 2);

  return (
    <div className="relative w-full py-4">
      <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-visible">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="absolute top-0 left-0 w-full h-10 cursor-pointer disabled:cursor-not-allowed"
        style={{ 
          zIndex: 10,
          opacity: 0,
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `calc(${percentage}% - ${thumbOffset}px)`,
          zIndex: 5,
        }}
      >
        <div className={`w-6 h-6 rounded-full bg-gradient-to-b from-teal-500 to-teal-600 border-2 border-white shadow-lg ${disabled ? 'opacity-50' : ''}`} />
      </div>
    </div>
  );
}

