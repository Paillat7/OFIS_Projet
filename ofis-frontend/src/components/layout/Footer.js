import React from 'react';
import './Layout.css';
// ===== IMPORT DU LOGO =====
import ofisLogo from '../../public/images/ofis-logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <img
            src={ofisLogo}
            alt="OFIS"
            style={{ height: '30px', marginRight: '10px' }}
          />
          <span className="footer-tagline">IT. Services. People. You trust.</span>
        </div>
        <div className="footer-right">
          <a
            href="http://www.ofis-technologies.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            www.ofis-technologies.com
          </a>
          <span className="footer-copyright">© {currentYear} OFIS</span>
        </div>
      </div>
      <div className="footer-message">
        Votre partenaire de confiance pour les infrastructures critiques
      </div>
    </footer>
  );
};

export default Footer;