import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../common/Common.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
    xlarge: 'modal-xlarge',
  }[size];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;