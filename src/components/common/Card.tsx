
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, highlighted = false }) => {
  return (
    <div 
      className={cn(
        'card',
        highlighted ? 'border-primary border-2' : '',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
