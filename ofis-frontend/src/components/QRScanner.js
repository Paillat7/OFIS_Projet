// src/components/QRScanner.js
import React, { useState } from 'react';
import QrReader from 'react-qr-reader';

const QRScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState('');

  const handleScan = (data) => {
    if (data) {
      onScan(data);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Erreur de caméra');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%', maxWidth: '500px' }}
      />
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      <button
        onClick={onClose}
        style={{
          marginTop: '2rem',
          padding: '0.5rem 2rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Fermer
      </button>
    </div>
  );
};

export default QRScanner;