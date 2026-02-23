import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [isDashboardOnline, setIsDashboardOnline] = useState(true);
  
  // Create refs for each section
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const supervisorRef = useRef(null);
  const teamRef = useRef(null);

  // Function to scroll to a section
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Add animation class for fade-in effect
    document.body.classList.add('loaded');
    
    // Assume dashboard is online for demo purposes
    setIsDashboardOnline(true);
  }, []);
  
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header-section">
        <div className="container">
          <div className="header-content">
            <h1>Smart Irrigation System</h1>
            <p className="tagline">IoT-Based Intelligent Water Management - Graduation Project 2025</p>
            
            <nav className="main-nav">
              <ul>
                <li><button onClick={() => scrollToSection(aboutRef)} className="nav-link">About</button></li>
                <li><button onClick={() => scrollToSection(featuresRef)} className="nav-link">Features</button></li>
                <li><button onClick={() => scrollToSection(supervisorRef)} className="nav-link">Supervisor</button></li>
                <li><button onClick={() => scrollToSection(teamRef)} className="nav-link">Team</button></li>
                <li>
                  <Link to="/dashboard" className="nav-dashboard">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className="header-cta">
              <Link to="/dashboard" className="cta-button">
                <span className="cta-icon">⚙️</span>
                <span>Enter Dashboard</span>
                <span className="cta-status online">
                  Online
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* About Section */}
      <section id="about" className="about-section" ref={aboutRef}>
        <div className="container">
          <h2 className="section-title">About the Project</h2>
          <div className="about-content">
            <p>The Smart Irrigation System is an innovative IoT solution designed to optimize water usage in agricultural and gardening applications. Our system uses real-time sensor data and AI-powered decision making to provide precise irrigation control based on actual soil conditions and environmental factors.</p>
            <p>By monitoring soil moisture, temperature, humidity, and water tank levels, the system automatically controls water pumps to maintain optimal growing conditions while conserving water resources. The project demonstrates how IoT technology can contribute to sustainable agriculture and efficient resource management.</p>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="features-section" ref={featuresRef}>
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌡️</div>
              <h3>Real-time Monitoring</h3>
              <p>Track soil moisture, temperature, humidity, and water levels through a responsive web dashboard.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI-Powered Decisions</h3>
              <p>Gemini AI integration analyzes sensor data to make intelligent irrigation decisions based on environmental conditions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Automated Control</h3>
              <p>Automatic pump activation based on soil conditions with manual override capabilities when needed.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Remote Access</h3>
              <p>Monitor and control your irrigation system from anywhere through a secure web interface.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Supervisor Section */}
      <section id="supervisor" className="supervisor-section" ref={supervisorRef}>
        <div className="container">
          <h2 className="section-title">Supervising Professor</h2>
          <div className="supervisor-card">
            <img 
              src="https://placehold.co/200x200/3498db/ffffff?text=Dr.+Raad" 
              alt="Dr. Raad Al-Khatib" 
              className="supervisor-img" 
            />
            <h3 className="supervisor-name">Dr. Rae'd M Al-Khatib</h3>
            <p className="supervisor-title">Associate Professor, Faculty of Engineering</p>
            <p className="supervisor-bio">Dr. Al-Khatib specializes in embedded systems and IoT applications. With extensive experience in guiding innovative engineering projects, he provides valuable insights and direction to help students bridge theoretical knowledge with practical implementation.</p>
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section id="team" className="team-section" ref={teamRef}>
        <div className="container">
          <h2 className="section-title">Meet the Team</h2>
          <div className="team-grid">
            {/* Team Leader */}
            <div className="team-card">
              <div className="team-img-container">
                <img 
                  src="https://placehold.co/300x300/2ecc71/ffffff?text=F" 
                  alt="Feras Al-Momani" 
                  className="team-img" 
                />
              </div>
              <div className="team-info">
                <h3 className="team-name">Feras Al-Momani</h3>
                <span className="team-role team-leader">Team Leader</span>
                <p className="team-description">Full Stack Development & UI/UX Design</p>
              </div>
            </div>
            
            {/* Team Member 1 */}
            <div className="team-card">
              <div className="team-img-container">
                <img 
                  src="https://placehold.co/300x300/2ecc71/ffffff?text=R" 
                  alt="Rama Al-Momani" 
                  className="team-img" 
                />
              </div>
              <div className="team-info">
                <h3 className="team-name">Rama Al-Momani</h3>
                <span className="team-role">Team Member</span>
                <p className="team-description"> Hardware Design & IoT Integration & Database Devolopment </p>
              </div>
            </div>
            
            {/* Team Member 2 */}
            <div className="team-card">
              <div className="team-img-container">
                <img 
                  src="https://placehold.co/300x300/2ecc71/ffffff?text=T" 
                  alt="Tasneem Al-Omari" 
                  className="team-img" 
                />
              </div>
              <div className="team-info">
                <h3 className="team-name">Tasneem Al-Omari</h3>
                <span className="team-role">Team Member</span>
                <p className="team-description"> 2nd Frontend Development & UI/UX Design</p>
              </div>
            </div>
            
            {/* Team Member 3 */}
            <div className="team-card">
              <div className="team-img-container">
                <img 
                  src="https://placehold.co/300x300/2ecc71/ffffff?text=R" 
                  alt="Raghad Al-Lahham" 
                  className="team-img" 
                />
              </div>
              <div className="team-info">
                <h3 className="team-name">Raghad Al-Lahham</h3>
                <span className="team-role">Team Member</span>
                <p className="team-description"> Hardware Design & Sensor Integration </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dashboard Button */}
      <section className="dashboard-section">
        <div className="container">
          <Link to="/dashboard" className="dashboard-btn">
            Go to Project Dashboard
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer>
        <div className="container">
          <p>&copy; 2025 Smart Irrigation System. All rights reserved.</p>
          <p className="footer-tech">Built with ESP8266, FastAPI, React, and Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 