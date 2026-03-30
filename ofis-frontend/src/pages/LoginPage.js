import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/authService';
import './Pages.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(formData);
      
      if (result.success) {
        setLoading(false);
        if (onLogin) {
          onLogin(result.user);
        }
        // Redirection vers la racine
        navigate('/');
      } else {
        setError(result.error || 'Identifiants incorrects');
        setLoading(false);
      }
    } catch (err) {
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-wrapper">
            <img 
              src="/images/ofis-logo.png" 
              alt="OFIS" 
              className="login-logo"
            />
            <p className="login-logo-tagline">
              IT. Services. People. You trust.
            </p>
          </div>

          <div className="login-header">
            <div className="logo-container">
              <h1 className="logo">OFIS</h1>
              <p className="tagline">IT. Services. People. You trust.</p>
            </div>
            <div className="welcome-box">
              <h2>Bienvenue</h2>
              <p>Application interne de suivi des missions</p>
            </div>
          </div>

          <div className="welcome-message">
            <p>Connectez-vous pour accéder à votre espace de travail</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <Input
              label="Identifiant"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="technicien, manager ou admin"
              icon={<FaUser />}
              required
            />

            <Input
              label="Mot de passe"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={<FaLock />}
              required
              rightIcon={
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={loading}
              className="login-button"
            >
              Se connecter
            </Button>

            <div className="login-links">
              <button type="button" className="forgot-link">
                 Mot de passe oublié ?
              </button>
            </div>
          </form>

          <div className="login-footer">
            <p className="version">Version 1.0 • © 2026 OFIS</p>
            <p className="security-note">
              <i className="lock-icon">🔒</i> Accès sécurisé réservé aux employés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;