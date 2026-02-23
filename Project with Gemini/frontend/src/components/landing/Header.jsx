import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isDashboardOnline = true, navFunctions = {} }) => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const { scrollToAbout, scrollToFeatures, scrollToSupervisor, scrollToTeam } = navFunctions;

  return (
    <header className={`header-section ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-overlay"></div>
      <div className="container">
        <div className="header-content">
          <h1>Smart Irrigation System</h1>
          <div className="header-tagline">
            <span className="tag-icon">🌱</span>
            <p>IoT-Based Intelligent Water Management - Graduation Project 2025</p>
            <span className="tag-icon">💧</span>
          </div>
          
          <div className="header-animation">
            <div className="animation-circle"></div>
            <div className="animation-circle"></div>
            <div className="animation-circle"></div>
          </div>
          
          <nav className="main-nav">
            <ul>
              <li><button onClick={scrollToAbout} className="nav-link">About</button></li>
              <li><button onClick={scrollToFeatures} className="nav-link">Features</button></li>
              <li><button onClick={scrollToSupervisor} className="nav-link">Supervisor</button></li>
              <li><button onClick={scrollToTeam} className="nav-link">Team</button></li>
              <li>
                <Link 
                  to="/dashboard" 
                  className={`nav-dashboard ${!isDashboardOnline ? 'nav-dashboard-offline' : ''}`}
                >
                  Dashboard {!isDashboardOnline && <span className="status-dot"></span>}
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="header-cta">
            <Link to="/dashboard" className="cta-button">
              <span className="cta-icon">⚙️</span>
              <span>Enter Dashboard</span>
              <span className={`cta-status ${isDashboardOnline ? 'online' : 'offline'}`}>
                {isDashboardOnline ? 'Online' : 'Offline'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 