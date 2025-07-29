import React from 'react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "" 
}: SearchBarProps) {
  return (
    <div className={`mb-4 flex justify-end ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 border border-gray-700 rounded-md w-64 text-sm bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring focus:border-blue-300"
      />
    </div>
  );
} 