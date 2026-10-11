import React from 'react';

interface LiquidChromeLogoProps {
  text?: string;
  subText?: string;
  className?: string;
  fontSize?: number;
  interactive?: boolean;
}

export const LiquidChromeLogo: React.FC<LiquidChromeLogoProps> = ({
  text = 'EXAMCRAFT',
  subText,
  className = '',
  fontSize = 18,
}) => {
  return (
    <div className={`inline-flex items-baseline gap-1.5 select-none ${className}`}>
      <span
        style={{ fontSize: `${fontSize}px` }}
        className="font-bold tracking-tight text-slate-900 dark:text-white leading-none font-sans"
      >
        {text}
      </span>
      {subText && (
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
          {subText}
        </span>
      )}
    </div>
  );
};
