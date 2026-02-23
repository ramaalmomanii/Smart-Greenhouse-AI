import React, { forwardRef } from 'react';

const Team = forwardRef((props, ref) => {
  return (
    <section id="team" className="team" ref={ref}>
      <div className="container">
        <h2 className="section-title">Meet the Team</h2>
        <div className="team-grid">
          {/* Team Leader */}
          <div className="team-card">
            <div className="team-img-container">
              <img 
                src="https://xsgames.co/randomusers/assets/avatars/male/38.jpg" 
                alt="Feras Al-Momani" 
                className="team-img" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/300x300/2ecc71/ffffff?text=F";
                }}
              />
            </div>
            <div className="team-info">
              <h3 className="team-name">Feras Al-Momani</h3>
              <span className="team-role team-leader">Team Leader</span>
              <p className="team-description">Backend Development & IoT Integration</p>
            </div>
          </div>
          
          {/* Team Member 1 */}
          <div className="team-card">
            <div className="team-img-container">
              <img 
                src="https://xsgames.co/randomusers/assets/avatars/female/42.jpg" 
                alt="Rama Al-Momani" 
                className="team-img" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/300x300/2ecc71/ffffff?text=R";
                }}
              />
            </div>
            <div className="team-info">
              <h3 className="team-name">Rama Al-Momani</h3>
              <span className="team-role">Team Member</span>
              <p className="team-description">Frontend Development & UI/UX Design</p>
            </div>
          </div>
          
          {/* Team Member 2 */}
          <div className="team-card">
            <div className="team-img-container">
              <img 
                src="/Photos/Tasneem Alomari.jpeg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/300x300/2ecc71/ffffff?text=T";
                }}
                alt="Tasneem Al-Omari" 
                className="team-img" 
              />
            </div>
            <div className="team-info">
              <h3 className="team-name">Tasneem Al-Omari</h3>
              <span className="team-role">Team Member</span>
              <p className="team-description">Hardware Design & Sensor Integration</p>
            </div>
          </div>
          
          {/* Team Member 3 */}
          <div className="team-card">
            <div className="team-img-container">
              <img 
                src="https://xsgames.co/randomusers/assets/avatars/female/35.jpg" 
                alt="Raghad Al-Lahham" 
                className="team-img" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/300x300/2ecc71/ffffff?text=R";
                }}
              />
            </div>
            <div className="team-info">
              <h3 className="team-name">Raghad Al-Lahham</h3>
              <span className="team-role">Team Member</span>
              <p className="team-description">AI Integration & Data Analysis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Team; 