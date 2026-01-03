import { useState } from "react";
import Calculator from "./calculator.jsx";
import Login from "./Login.jsx";
import { getToken, clearToken } from "./auth";

const DEVELOPERS = [
  {
    name: "Lucas Giarratana",
    role: "Frontend / UI",
    email: "lucas@email.com",
    githubLabel: "@lucas",
    githubUrl: "#",
    linkedinLabel: "/in/lucas",
    linkedinUrl: "#",
  },
  {
    name: "Ian (Apellido)",
    role: "Backend / API",
    email: "ian@email.com",
    githubLabel: "@ian",
    githubUrl: "#",
    linkedinLabel: "/in/ian",
    linkedinUrl: "#",
  },
  {
    name: "Levin (IA)",
    role: "IA / Producto",
    email: "levin@email.com",
    githubLabel: "@levin",
    githubUrl: "#",
    linkedinLabel: "/in/levin",
    linkedinUrl: "#",
  },
];

const PLANS = [
  {
    id: "free",
    badge: null,
    name: "Free",
    price: "0",
    period: "/mes",
    desc: "Para usarlo todos los días sin complicarte.",
    features: [
      "Graficador 2D (curvas) y puntos",
      "Respuestas cortas + pasos básicos",
      "Hasta 10 consultas por día",
      "Export básico (captura / copiar resultado)",
    ],
    buttonText: "Empezar gratis",
    buttonClass: "plan-button plan-button--ghost",
    footnote: "Sin tarjeta • Acceso inmediato",
  },
  {
    id: "premium",
    badge: "Recomendado",
    name: "Premium",
    price: "4.99",
    period: "/mes",
    desc: "Ideal para parciales, finales y ejercicios pesados (multivariable, optimización, etc.).",
    features: [
      "Graficador 2D + 3D (superficies/contornos)",
      "Intersecciones y múltiples funciones en un mismo gráfico",
      "Explicación paso a paso completa",
      "Historial de problemas + favoritos",
      "Export PDF / PNG (fácil para entregar)",
      "Prioridad de respuesta",
    ],
    buttonText: "Pasar a Premium",
    buttonClass: "plan-button plan-button--primary",
    footnote: "Cancelás cuando quieras • Soporte prioritario",
  },
];

export default function App() {
  const [isLogged, setIsLogged] = useState(!!getToken());

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleLogout() {
    clearToken();
    setIsLogged(false);
    scrollToId("top");
  }

  function handlePlanClick(planId) {
    if (!isLogged && planId === "premium") {
      scrollToId("top");
      alert("Para Premium necesitás iniciar sesión.");
      return;
    }

    if (planId === "premium") {
      openCheckoutPremium();
    } else {
      scrollToId("top");
    }
  }

  function openCheckoutPremium() {
  if (!window.fastspring || !window.fastspring.builder) {
    alert("FastSpring no está cargado.");
    return;
  }

  window.fastspring.builder.reset(); // importante
  window.fastspring.builder.push({
    products: [
      {
        path: "suscription-plus",
        quantity: 1,
      },
    ],
  });

  window.fastspring.builder.checkout();
}


  return (
    <div className="page">
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-inner">
          <div
            className="brand"
            onClick={() => scrollToId("top")}
            style={{ cursor: "pointer" }}
          >
            <div className="logo">LOGO</div>
            <span className="brand-name">MathAI</span>
          </div>

          <nav className="nav">
            <a href="#plans">Planes</a>
            <a href="#devs">Desarrolladores</a>

            {isLogged && (
              <button
                className="nav-logout logout"
                onClick={handleLogout}
                type="button"
              >
                Cerrar sesión
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="main">
        <section className="calculator" id="top">
          {isLogged ? (
            <>
              <h1 className="calculator-title">
                <span className="shine-platinum">
                  Calculadora matemática avanzada
                </span>
              </h1>

              <p className="calculator-subtitle">
                Resolvé problemas y visualizá funciones de forma clara e interactiva.
              </p>

              <div className="calculator-app">
                <Calculator />
              </div>
            </>
          ) : (
            <Login onLogin={() => setIsLogged(true)} />
          )}
        </section>

        {/* ===== PLANES ===== */}
        <section id="plans" className="section plans">
          <h2 className="section-title">
            <span className="shine-platinum">Planes</span>
          </h2>

          <div className="plans-grid">
            {PLANS.map((p) => (
              <article
                key={p.id}
                className={`plan-card ${
                  p.id === "premium"
                    ? "plan-card--premium"
                    : "plan-card--free"
                } float-soft`}
              >
                <header className="plan-head">
                  {p.badge && <div className="plan-badge">{p.badge}</div>}
                  <h3 className="plan-name">{p.name}</h3>
                  <p className="plan-price">
                    <span className="plan-currency">$</span>
                    {p.price}
                    <span className="plan-period">{p.period}</span>
                  </p>
                  <p className="plan-desc">{p.desc}</p>
                </header>

                <ul className="plan-features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>

                <button
                  className={p.buttonClass}
                  type="button"
                  onClick={() => handlePlanClick(p.id)}
                >
                  {p.buttonText}
                </button>

                <p className="plan-footnote">{p.footnote}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-title">MathAI</p>
        <p className="footer-text">Proyecto desarrollado por estudiantes — 2026.</p>
      </footer>
    </div>
  );
}
