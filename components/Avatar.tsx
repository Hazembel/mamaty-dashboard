import React from 'react';

interface AvatarProps {
  name: string;
  lastname?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getInitials = (name: string, lastname?: string): string => {
  if (lastname) {
    return `${name.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  }
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return 'N/A';
};

const Avatar: React.FC<AvatarProps> = ({ name, lastname, src, size = 'md', className = '' }) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const showFallback = !src || imgError;

  if (showFallback) {
    const initials = getInitials(name, lastname);
    const colorClasses = 'bg-cyan-100 text-cyan-800';
    
    return (
      <div
        className={`rounded-full flex items-center justify-center font-semibold ${sizeClasses[size]} ${colorClasses} ${className}`}
        aria-label={`${name} ${lastname || ''}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      src={src}
      alt={`${name} ${lastname || ''}`}
      onError={() => setImgError(true)}
    />
  );
};

export default Avatar;
