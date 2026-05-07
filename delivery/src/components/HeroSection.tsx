import './HeroSection.css';

function HeroSection() {
  const handleOrderNow = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" id="home">
      <div className="hero-text">
        <h2>Comida deliciosa, directo a tu puerta</h2>
        <p>
          Haz tu pedido rápido y fácil. Paga con Transbank o Efectivo al recibir.
          ¡Entrega en minutos!
        </p>
        <button className="hero-cta-btn" onClick={handleOrderNow}>
          🛍️ Order Now
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
