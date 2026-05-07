import './Header.css';

interface HeaderProps {
  cartItemCount: number;
  onCartOpen: () => void;
}

function Header({ cartItemCount, onCartOpen }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">🍕 Sabor a Casa</h1>

        <nav className="header-nav">
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#menu">Menu</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <button className="cart-toggle-btn" onClick={onCartOpen}>
            🛒 <span className="cart-badge">{cartItemCount}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
