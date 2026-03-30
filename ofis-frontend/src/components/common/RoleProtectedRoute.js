import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = user.role || 'employee';
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default RoleProtectedRoute;