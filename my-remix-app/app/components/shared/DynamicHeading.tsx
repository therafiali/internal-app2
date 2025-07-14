import React from 'react';

interface DynamicHeadingProps {
  title: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const DynamicHeading: React.FC<DynamicHeadingProps> = ({
  title,
  className = '',
  gradientFrom = 'from-white',
  gradientTo = 'to-gray-500'
}) => {
  return (
    <div className="flex items-center justify-between mb-8 w-[50vw]">
      <h1 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${gradientFrom} ${gradientTo} ${className}`}>
        {title}
      </h1>
    </div>
  );
};

export default DynamicHeading;
