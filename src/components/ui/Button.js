import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  const finalClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${disabled ? disabledClasses : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={finalClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 