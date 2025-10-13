import React from 'react';

/**
 * Footer Component
 * Legal footer with links to Apax privacy policy and terms
 * Compact single-line on desktop, stacked on mobile
 */
const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-copyright">© 2025 Apax Partners.</span>
        <span className="footer-separator" aria-hidden="true"> | </span>
        <span className="footer-links">
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
            Terms
          </a>
        </span>
        <span className="footer-separator" aria-hidden="true"> | </span>
        <span className="footer-notice">Confidential</span>
      </div>
    </footer>
  );
};

export default Footer;

