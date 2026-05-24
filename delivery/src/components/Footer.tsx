import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="footer-content">
        <p className="footer-logo">🍕 <span>Sabor</span> a Casa</p>
        <p className="footer-copy">
          &copy; {year} Sabor a Casa. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
