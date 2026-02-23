import React, { forwardRef } from 'react';

const About = forwardRef((props, ref) => {
  return (
    <section id="about" className="about" ref={ref}>
      <div className="container">
        <h2 className="section-title">About the Project</h2>
        <div className="about-content">
          <div className="about-decoration">
            <div className="decoration-circle"></div>
            <div className="decoration-line"></div>
          </div>
          <div className="about-text">
            <p>The Smart Irrigation System is an innovative IoT solution designed to optimize water usage in agricultural and gardening applications. Our system uses real-time sensor data and AI-powered decision making to provide precise irrigation control based on actual soil conditions and environmental factors.</p>
            <p>By monitoring soil moisture, temperature, humidity, and water tank levels, the system automatically controls water pumps to maintain optimal growing conditions while conserving water resources. The project demonstrates how IoT technology can contribute to sustainable agriculture and efficient resource management.</p>
          </div>
          <div className="about-highlights">
            <div className="highlight-item">
              <div className="highlight-icon">💧</div>
              <div className="highlight-text">Water Conservation</div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">🌱</div>
              <div className="highlight-text">Optimal Growth</div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">🔄</div>
              <div className="highlight-text">Sustainable Farming</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default About; 