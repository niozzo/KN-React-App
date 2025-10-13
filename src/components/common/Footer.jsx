import React from 'react';

/**
 * Footer Component
 * Legal footer with links to Apax privacy policy and terms
 * Three-row centered layout for login page
 * 
 * @param {boolean} transparent - If true, footer has no background/border (for login page)
 */
const Footer = ({ transparent = false }) => {
  return (
    <footer className={`app-footer ${transparent ? 'app-footer-transparent' : ''}`}>
      <div className="footer-content">
        <div className="footer-row">
          © 2025 Apax Partners
        </div>
        
        <div className="footer-row footer-links">
          <a 
            href="https://www.apax.com/privacy-policy/" 
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="Privacy Policy (opens in new window)"
          >
            Privacy Policy
          </a>
          <span className="footer-separator" aria-hidden="true"> | </span>
          <a 
            href="https://www.apax.com/terms-conditions/" 
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="Terms & Conditions (opens in new window)"
          >
            Terms & Conditions
          </a>
        </div>
        
        <div className="footer-row footer-notice">
          Confidential information for authorized KnowledgeNow attendees only
        </div>
      </div>
    </footer>
  );
};

export default Footer;

