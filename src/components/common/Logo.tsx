
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center">
      <span className={`font-bold text-primary ${sizeClasses[size]}`}>
        Nexus
        <span className="text-black">Hub</span>
      </span>
    </div>
  );
};

export default Logo;
