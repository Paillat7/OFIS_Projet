import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const domProps = { ...props };
  // Retirer isLoading et autres props non DOM
  delete domProps.isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`btn btn-${variant} btn-${size} ${isLoading ? 'btn-loading' : ''}`}
      {...domProps}
    >
      {isLoading ? 'Chargement...' : children}
    </button>
  );
};

export default Button;