import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  rightIcon,
  required = false,
  textarea = false,
  rows = 3,
  ...props
}) => {
  // On sépare les props DOM des props personnalisées
  const domProps = { ...props };
  // On retire rightIcon car ce n'est pas une prop DOM valide
  delete domProps.rightIcon;

  const inputProps = {
    id: name,
    name,
    type,
    value,
    onChange,
    placeholder,
    required,
    ...domProps
  };

  return (
    <div className="input-group">
      {label && <label htmlFor={name}>{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        {textarea ? (
          <textarea {...inputProps} rows={rows} className="input-field" />
        ) : (
          <input {...inputProps} className="input-field" />
        )}
        {rightIcon && <span className="input-right-icon">{rightIcon}</span>}
      </div>
    </div>
  );
};

export default Input;