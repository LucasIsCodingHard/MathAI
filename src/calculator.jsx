import { useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { getToken } from "./auth";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const API_URL = "https://e9318b7a53b1.ngrok-free.app/math";

/* ===================== HELPERS ===================== */

function toJsExpression(expr) {
  const ok = /^[0-9a-zA-Z\s+\-*/^().,_]*$/;
  if (!ok.test(expr)) throw new Error("Expresión inválida");

  let s = expr.replaceAll("^", "**");
  s = s.replace(/\bpi\b/gi, "Math.PI");
  s = s.replace(/\be\b/g, "Math.E");

  const fns = [
    "sin","cos","tan","asin","acos","atan",
    "sinh","cosh","tanh","exp","log","sqrt",
    "abs","floor","ceil","round","pow","min","max",
  ];

  for (const fn of fns) {
    s = s.replace(new RegExp(`\\b${fn}\\s*\\(`, "gi"), `Math.${fn}(`);
  }

  return s;
}

function compileF1(expr) {
  return new Function("x", `return (${toJsExpression(expr)});`);
}

function linspace(a, b, n) {
  return Array.from({ length: n }, (_, i) => a + (i * (b - a)) / (n - 1));
}

/* ===================== COMPONENTE ===================== */

export default function Calculator() {
  const [problemText, setProblemText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [plotSpec, setPlotSpec] = useState(null);
  const [plotError, setPlotError] = useState("");

  const fileInputRef = useRef(null);

  /* ===== PEGAR IMÁGENES (FIX REAL) ===== */

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    let imageFound = false;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFound = true;
          setImageFile(file);
        }
      }
    }

    // ✅ SOLO bloqueamos el paste si realmente capturamos imagen
    if (imageFound) {
      e.preventDefault();
    }
  }

  /* ===== SUBMIT ===== */

  async function handleSolve() {
    setIsLoading(true);
    setErrorMsg("");
    setAnswerText("");
    setPlotSpec(null);
    setPlotError("");

    try {
      const token = getToken?.() || "";
      const formData = new FormData();

      formData.append("problem", problemText);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setAnswerText(data?.answerText || "");
      setPlotSpec(data?.plotSpec || null);
    } catch (err) {
      setErrorMsg(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }

  /* ===== PLOT CON OVERLAYS ===== */

  const plotModel = useMemo(() => {
    if (!plotSpec || !plotSpec.xRange) return null;

    try {
      const [xmin, xmax] = plotSpec.xRange;
      const xs = linspace(xmin, xmax, 400);

      const fnExpr =
        plotSpec.function ||
        (Array.isArray(plotSpec.functions) && plotSpec.functions[0]?.expression);

      if (!fnExpr) return null;

      const f = compileF1(fnExpr);

      const curveTrace = {
        type: "scatter",
        mode: "lines",
        x: xs,
        y: xs.map((x) => {
          const v = f(x);
          return Number.isFinite(v) ? v : null;
        }),
        name: "f(x)",
      };

      const overlays = Array.isArray(plotSpec.overlays)
        ? plotSpec.overlays.filter(
            o =>
              o?.type === "point" &&
              typeof o.x === "number" &&
              typeof o.y === "number"
          )
        : [];

      const overlayTrace =
        overlays.length > 0
          ? {
              type: "scatter",
              mode: "markers+text",
              x: overlays.map(p => p.x),
              y: overlays.map(p => p.y),
              text: overlays.map(p => p.label || ""),
              textposition: "top center",
              marker: { size: 10 },
              name: "Puntos",
            }
          : null;

      return {
        data: overlayTrace ? [curveTrace, overlayTrace] : [curveTrace],
        layout: {
          title: plotSpec.title || "Gráfico",
          height: 460,
        },
      };
    } catch (err) {
      console.error("Error generando gráfico:", err);
      setPlotError("No se pudo generar el gráfico.");
      return null;
    }
  }, [plotSpec]);

  /* ===================== UI ===================== */

  return (
    <div className="calc">
      <h1>Math Web</h1>

      <textarea
        value={problemText}
        onChange={(e) => setProblemText(e.target.value)}
        onPaste={handlePaste}
        rows={4}
        placeholder="Escribí el problema o pegá una imagen (Ctrl+V)"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => setImageFile(e.target.files[0] || null)}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button type="button" onClick={() => fileInputRef.current.click()}>
          📎 Adjuntar
        </button>

        <button onClick={handleSolve} disabled={isLoading}>
          {isLoading ? "Procesando..." : "Enviar"}
        </button>

        {imageFile && (
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Imagen adjunta
            <button onClick={() => setImageFile(null)}>✕</button>
          </span>
        )}
      </div>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {plotError && <p style={{ color: "orange" }}>{plotError}</p>}

      {answerText && (
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {answerText}
        </ReactMarkdown>
      )}

      {plotModel && (
        <Plot
          data={plotModel.data}
          layout={plotModel.layout}
          useResizeHandler
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
}
