import React from 'react';

/**
 * Footer Component
 * Legal footer with links to Apax privacy policy and terms
 */
const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-copyright">
          © 2025 Apax Partners. All rights reserved.
        </p>
        
        <div className="footer-links">
          <a 
            href="https://www.apax.com/privacy-policy/" 
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="Privacy Policy (opens in new window)"
          >
            Privacy Policy
          </a>
          <span className="footer-separator" aria-hidden="true">|</span>
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
        
        <p className="footer-notice">
          Confidential information for authorized attendees only.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

