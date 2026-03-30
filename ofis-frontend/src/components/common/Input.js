import React from 'react';
import '../common/Common.css';

const Input = ({
  label,
  type = 'text',
  error,
  helperText,
  icon,
  ...props
}) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          className={`input-field ${error ? 'error' : ''} ${icon ? 'with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
      {helperText && !error && <span className="input-helper">{helperText}</span>}
    </div>
  );
};

export default Input;