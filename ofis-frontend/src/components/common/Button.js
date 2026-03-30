import React from 'react';
import '../common/Common.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    outline: 'btn-outline',
  }[variant];

  const sizeClass = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large',
  }[size];

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className} ${isLoading ? 'loading' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner"></span>
          Chargement...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;