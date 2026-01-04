import { useEffect, useMemo, useState } from "react";
import Calculator from "./calculator.jsx";
import Login from "./auth.jsx";
import { getToken, clearToken } from "./auth";
import "katex/dist/katex.min.css";

const DEVELOPERS = [
  {
    name: "Lucas Giarratana",
    role: "Frontend / UI",
    email: "lucas@email.com",
    githubLabel: "@lucas",
    githubUrl: "#",
    linkedinLabel: "/in/lucas",
    linkedinUrl: "#",
    image: `${import.meta.env.BASE_URL}GIARRA.jpg`,
  },
  {
    name: "Ian Levin",
    role: "Backend",
    email: "ian@email.com",
    githubLabel: "@ian",
    githubUrl: "#",
    linkedinLabel: "/in/ian",
    linkedinUrl: "#",
    image: `${import.meta.env.BASE_URL}IANLEVIN.jpg`,
  },
  {
    name: "IA Levin",
    role: "AI / Automation",
    email: "ialevi@email.com",
    githubLabel: "@ialevin",
    githubUrl: "#",
    linkedinLabel: "/in/ialevi",
    linkedinUrl: "#",
    image: `${import.meta.env.BASE_URL}IALEVIN.jpg`,
  },
];

const PLANS = [
  {
    id: "free",
    badge: null,
    name: "Free",
    price: "0",
    period: "/mes",
    desc: "Para usarlo todos los días sin complicaciones.",
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
  const [showLogin, setShowLogin] = useState(false);

  // ✅ logo desde /public/logo.png (respeta BASE_URL para GitHub Pages)
  const logoSrc = useMemo(
    () => `${import.meta.env.BASE_URL}logo.png`,
    []
  );

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleLogout() {
    clearToken();
    setIsLogged(false);
    scrollToId("top");
  }

  function openCheckoutPremium() {
    if (!window.fastspring || !window.fastspring.builder) {
      alert("FastSpring no está cargado.");
      return;
    }

    window.fastspring.builder.reset();
    window.fastspring.builder.push({
      products: [{ path: "suscription-plus", quantity: 1 }],
    });
    window.fastspring.builder.checkout();
  }

  function handlePlanClick(planId) {
    if (planId === "premium") {
      if (!isLogged) {
        setShowLogin(true);
        scrollToId("top");
        return;
      }
      openCheckoutPremium();
      return;
    }
    scrollToId("top");
  }

  useEffect(() => {
  setIsLogged(!!getToken());
}, [showLogin]);
  // 🔒 Bloquear scroll del fondo cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = showLogin ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showLogin]);

  // ⎋ Cerrar modal con ESC
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setShowLogin(false);
    }
    if (showLogin) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLogin]);

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
            {/* ✅ LOGO sin fondo/recuadro feo */}
            <div className="logo" aria-label="MathAPS logo">
              <img
                src={logoSrc}
                alt="MathAPS"
                className="logo-img"
                draggable="false"
              />
            </div>

            <div className="brand-text">
              <span className="brand-name">MathAPS</span>
            </div>
          </div>

          <nav className="nav">
            <a href="#plans">Planes</a>
            <a href="#devs">Desarrolladores</a>

            <div className="nav-auth">
              {!isLogged ? (
                <button
                  className="nav-btn nav-btn--login"
                  type="button"
                  onClick={() => setShowLogin(true)}
                >
                  Iniciar sesión
                </button>
              ) : (
                <button
                  className="nav-btn nav-btn--logout"
                  type="button"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="main">
        {/* ===== HERO + CALCULADORA ===== */}
        <section className="calculator" id="top">
          <div className="hero">
            <div className="hero-left">
              <h1 className="hero-title">
                Resolvé ejercicios y <span className="shine-platinum">entendé el paso a paso</span>
              </h1>

              <p className="hero-subtitle">
                MathAPS (Math Advanced Problem Solver) te ayuda a resolver problemas,
                visualizar funciones y estudiar más rápido con explicaciones claras.
              </p>

              <div className="hero-badges">
                <span className="hero-badge">Paso a paso</span>
                <span className="hero-badge">Graficador 2D/3D</span>
                <span className="hero-badge">Export PDF/PNG</span>
                <span className="hero-badge">Ideal para parciales</span>
              </div>

              <ul className="hero-points">
                <li>
                  <strong>Para quién:</strong> estudiantes de secundaria, CBC/UTN, facultad y autodidactas.
                </li>
                <li>
                  <strong>Qué hace:</strong> resuelve, explica, y grafica (funciones, puntos, superficies).
                </li>
                <li>
                  <strong>Por qué usarlo:</strong> menos tiempo trabado, más tiempo practicando.
                </li>
              </ul>

              <div className="hero-cta">
                <button
                  className="hero-btn hero-btn--primary"
                  type="button"
                  onClick={() => scrollToId("top")}
                >
                  Probar ahora
                </button>

                <button
                  className="hero-btn hero-btn--ghost"
                  type="button"
                  onClick={() => scrollToId("plans")}
                >
                  Ver planes
                </button>

                {!isLogged && (
                  <button
                    className="hero-btn hero-btn--link"
                    type="button"
                    onClick={() => setShowLogin(true)}
                  >
                    Desbloquear Premium
                  </button>
                )}
              </div>

              <p className="hero-note">
                Tip: podés pegar el enunciado o adjuntar una imagen.
                {!isLogged && " Premium se activa iniciando sesión."}
              </p>
            </div>
          </div>

          <div className="calculator-app">
            <Calculator
              isLogged={isLogged}
              onRequireLogin={() => setShowLogin(true)}
            />
          </div>
        </section>

        {/* ===== PLANES ===== */}
        <section id="plans" className="section plans">
          <h2 className="section-title">
            <span className="shine-platinum">Planes</span>
          </h2>

          <p className="section-subtitle">
            Elegí el plan según tu ritmo: práctica diaria gratis o Premium para parciales/finales.
          </p>

          <div className="plans-grid">
            {PLANS.map((p) => (
              <article
                key={p.id}
                className={`plan-card ${
                  p.id === "premium" ? "plan-card--premium" : "plan-card--free"
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

        {/* ===== DESARROLLADORES ===== */}
        <section id="devs" className="section devs">
          <h2 className="section-title">
            <span className="shine-platinum">Desarrolladores</span>
          </h2>
          <p className="section-subtitle">
            Equipo del proyecto — contacto directo para feedback, bugs o propuestas.
          </p>

          <div className="devs-grid">
            {DEVELOPERS.map((d) => (
              <article key={d.name} className="dev-card">
                <div className="dev-avatar" aria-label={`Foto de ${d.name}`}>
                  <img src={d.image} alt={`Avatar de ${d.name}`} />
                </div>

                <div className="dev-body">
                  <h3 className="dev-name">{d.name}</h3>
                  <p className="dev-role">{d.role}</p>

                  <ul className="dev-contact">
                    <li>
                      <span className="dev-label">Email:</span>{" "}
                      <a className="dev-link" href={`mailto:${d.email}`}>
                        {d.email}
                      </a>
                    </li>

                    <li>
                      <span className="dev-label">GitHub:</span>{" "}
                      <a
                        className="dev-link"
                        href={d.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {d.githubLabel}
                      </a>
                    </li>

                    <li>
                      <span className="dev-label">LinkedIn:</span>{" "}
                      <a
                        className="dev-link"
                        href={d.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {d.linkedinLabel}
                      </a>
                    </li>
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-title">MathAPS</p>
        <p className="footer-text">Proyecto desarrollado por estudiantes — 2026.</p>
      </footer>

      {/* ===== LOGIN MODAL (POPUP CENTRADO + BLUR) ===== */}
      {showLogin && (
        <div className="auth-overlay" onClick={() => setShowLogin(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-close"
              type="button"
              onClick={() => setShowLogin(false)}
              aria-label="Cerrar"
            >
              ✕
            </button>

            <Login
              onSuccess={() => {
                setIsLogged(true);
                setShowLogin(false);
              }}
              onClose={() => setShowLogin(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
