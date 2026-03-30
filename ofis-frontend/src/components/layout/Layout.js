import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ user, onLogout }) => {
  return (
    <div className="layout">
      <Header user={user} onLogout={onLogout} />
      <div className="layout-content">
        <Sidebar userRole={user?.role} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;