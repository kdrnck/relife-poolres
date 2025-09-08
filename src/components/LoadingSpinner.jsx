import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Yükleniyor...', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}></div>
        <div className={`${sizeClasses[size]} border-4 border-yellow-500 border-t-transparent rounded-full animate-spin absolute top-0`}></div>
      </div>
      {text && (
        <p className="mt-3 text-gray-600 text-sm font-medium">{text}</p>
      )}
    </div>
  );
};

const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded-lg p-4">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-300 rounded w-20"></div>
        <div className="h-8 bg-gray-300 rounded w-24"></div>
      </div>
    </div>
  </div>
);

const SkeletonGrid = ({ rows = 3, cols = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className={`grid grid-cols-${cols} gap-4`}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export { LoadingSpinner, SkeletonCard, SkeletonGrid };
export default LoadingSpinner;
