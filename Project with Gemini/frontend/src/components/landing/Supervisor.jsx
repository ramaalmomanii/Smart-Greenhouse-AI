import React, { forwardRef } from 'react';

const Supervisor = forwardRef((props, ref) => {
  return (
    <section id="supervisor" className="supervisor" ref={ref}>
      <div className="container">
        <h2 className="section-title">Supervising Professor</h2>
        <div className="supervisor-card">
          <img 
            src="/Photos/Dr Ra'ad Alkhateeb.jpeg" 
            alt="Dr. Raad Al-Khatib" 
            className="supervisor-img" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/200x200/3498db/ffffff?text=Dr.+Raad";
            }}
          />
          <h3 className="supervisor-name">Dr.  Rae'd M Al-Khatib</h3>
          <p className="supervisor-title">Associate Professor, Faculty of Engineering</p>
          <p className="supervisor-bio">Dr. Al-Khatib specializes in embedded systems and IoT applications. With extensive experience in guiding innovative engineering projects, he provides valuable insights and direction to help students bridge theoretical knowledge with practical implementation.</p>
        </div>
      </div>
    </section>
  );
});

export default Supervisor; 