import { useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { getToken } from "./auth";

// ✅ Backend (cambiá acá si vuelve a cambiar)
const API_URL = "https://93d87bc943dc.ngrok-free.app/math/";

// ---------- helpers: parsear expresión matemática ----------
function toJsExpression(expr) {
  if (!expr || typeof expr !== "string") {
    throw new Error("La expresión debe ser un string");
  }

  const ok = /^[0-9a-zA-Z\s+\-*/^().,_]*$/;
  if (!ok.test(expr)) {
    throw new Error("La función contiene caracteres no permitidos (demo).");
  }

  let s = expr.trim();
  s = s.replaceAll("^", "**");

  s = s.replace(/\bpi\b/gi, "Math.PI");
  s = s.replace(/\be\b/g, "Math.E");

  const fnMap = [
    "sin","cos","tan","asin","acos","atan",
    "sinh","cosh","tanh","exp","log","sqrt",
    "abs","floor","ceil","round","pow","min","max",
  ];

  for (const fn of fnMap) {
    const re = new RegExp(`\\b${fn}\\s*\\(`, "gi");
    s = s.replace(re, `Math.${fn}(`);
  }

  return s;
}

function compileF2(expr) {
  const js = toJsExpression(expr);
  // eslint-disable-next-line no-new-func
  return new Function("x", "y", `return (${js});`);
}

function compileF1(expr) {
  const js = toJsExpression(expr);
  // eslint-disable-next-line no-new-func
  return new Function("x", `return (${js});`);
}

// ---------- helpers: datos ----------
function getFunctionsList(plotSpec) {
  const list = [];

  // Nuevo formato: functions: [{expression,label}]
  if (Array.isArray(plotSpec.functions)) {
    for (const f of plotSpec.functions) {
      if (f && typeof f.expression === "string") {
        list.push({ expression: f.expression, label: f.label || "f" });
      }
    }
  }

  // Formato viejo: function: "..."
  if (typeof plotSpec.function === "string") {
    list.push({ expression: plotSpec.function, label: plotSpec.label || "f" });
  }

  return list;
}

function linspace(a, b, n) {
  if (n < 2) return [a, b];
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(a + (i * (b - a)) / (n - 1));
  return arr;
}

function ensureGrid(grid, plotType) {
  const fallback = plotType === "curve2d" ? { n: 400 } : { nx: 80, ny: 80 };
  return { ...fallback, ...(grid || {}) };
}

function padRange(xs, ys, pad = 1) {
  const xmin = Math.min(...xs) - pad;
  const xmax = Math.max(...xs) + pad;
  const ymin = Math.min(...ys) - pad;
  const ymax = Math.max(...ys) + pad;
  return { xmin, xmax, ymin, ymax };
}

function pointTrace2D(pts) {
  return {
    type: "scatter",
    mode: "markers+text",
    x: pts.map((p) => p.x),
    y: pts.map((p) => p.y),
    text: pts.map((p) => p.label || ""),
    textposition: "top center",
    marker: { size: 10 },
  };
}

export default function Calculator() {
  const [problemText, setProblemText] = useState(
    "Necesito encontrar los máximos de la función x^2 + y."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [plotSpec, setPlotSpec] = useState(null);

  async function handleSolve() {
    setIsLoading(true);
    setErrorMsg("");
    setAnswerText("");
    setPlotSpec(null);

    try {
      const token = getToken?.() || "";

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ problem: problemText }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Backend respondió ${res.status}${text ? `: ${text}` : ""}`);
      }

      const data = await res.json();
      console.log("BACKEND:", data);

      setAnswerText(
        typeof data?.answerText === "string"
          ? data.answerText
          : JSON.stringify(data, null, 2)
      );

      setPlotSpec(data?.plotSpec ?? null);
    } catch (err) {
      setErrorMsg(err?.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }

  const plotModel = useMemo(() => {
    if (!plotSpec) return null;

    const plotTypeRaw = String(plotSpec.plotType || "").toLowerCase();
    const plotType = plotTypeRaw === "curve" ? "curve2d" : plotTypeRaw;

    const title = plotSpec.title || "Gráfico";

    const overlays = Array.isArray(plotSpec.overlays) ? plotSpec.overlays : [];
    const overlayPoints = overlays
      .filter((o) => o?.type === "point" && typeof o.x === "number" && typeof o.y === "number")
      .map((p) => ({ x: p.x, y: p.y, label: p.label || "" }));

    // ---- POINT (1 punto) ----
    if (plotType === "point") {
      const pts =
        overlayPoints.length > 0
          ? overlayPoints
          : [{
              x: Array.isArray(plotSpec.xRange) ? plotSpec.xRange[0] : 0,
              y: Array.isArray(plotSpec.yRange) ? plotSpec.yRange[0] : 0,
              label: "",
            }];

      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const { xmin, xmax, ymin, ymax } = padRange(xs, ys, 1);

      return {
        title,
        data: [pointTrace2D(pts)],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 50, r: 10, b: 50, t: 50 },
          xaxis: { title: "x", range: [xmin, xmax], zeroline: false },
          yaxis: { title: "y", range: [ymin, ymax], zeroline: false },
        },
      };
    }

    // ---- POINTS (varios puntos) ----
    if (plotType === "points") {
      if (overlayPoints.length === 0) return null;

      const xs = overlayPoints.map((p) => p.x);
      const ys = overlayPoints.map((p) => p.y);
      const { xmin, xmax, ymin, ymax } = padRange(xs, ys, 1);

      return {
        title,
        data: [pointTrace2D(overlayPoints)],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 50, r: 10, b: 50, t: 50 },
          xaxis: { title: "x", range: [xmin, xmax], zeroline: false },
          yaxis: { title: "y", range: [ymin, ymax], zeroline: false },
        },
      };
    }

    // ---- LINE (segmento/polilínea) ----
    if (plotType === "line") {
      const line = Array.isArray(plotSpec.line) ? plotSpec.line : [];
      if (line.length < 2) return null;

      const xs = line.map((p) => p.x);
      const ys = line.map((p) => p.y);
      if (![...xs, ...ys].every((v) => typeof v === "number")) return null;

      const { xmin, xmax, ymin, ymax } = padRange(xs, ys, 1);

      const lineTrace = {
        type: "scatter",
        mode: "lines",
        x: xs,
        y: ys,
        line: { width: 2 },
        name: "Línea",
      };

      const ptsTrace = overlayPoints.length ? [pointTrace2D(overlayPoints)] : [];

      return {
        title,
        data: [lineTrace, ...ptsTrace],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 50, r: 10, b: 50, t: 50 },
          xaxis: { title: "x", range: [xmin, xmax], zeroline: false },
          yaxis: { title: "y", range: [ymin, ymax], zeroline: false },
        },
      };
    }

    // ---- RECT (región por rangos) ----
    if (plotType === "rect") {
      if (!Array.isArray(plotSpec.xRange) || !Array.isArray(plotSpec.yRange)) return null;
      let [xmin, xmax] = plotSpec.xRange;
      let [ymin, ymax] = plotSpec.yRange;
      if (![xmin, xmax, ymin, ymax].every((v) => typeof v === "number")) return null;

      if (xmin === xmax) { xmin -= 1; xmax += 1; }
      if (ymin === ymax) { ymin -= 1; ymax += 1; }

      const polyX = [xmin, xmax, xmax, xmin, xmin];
      const polyY = [ymin, ymin, ymax, ymax, ymin];

      const regionTrace = {
        type: "scatter",
        mode: "lines",
        x: polyX,
        y: polyY,
        fill: "toself",
        fillcolor: "rgba(124, 92, 255, 0.15)",
        line: { width: 2 },
        name: "Región",
      };

      const ptsTrace = overlayPoints.length ? [pointTrace2D(overlayPoints)] : [];

      return {
        title,
        data: [regionTrace, ...ptsTrace],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 50, r: 10, b: 50, t: 50 },
          xaxis: { title: "x", range: [xmin - 1, xmax + 1], zeroline: false },
          yaxis: { title: "y", range: [ymin - 1, ymax + 1], zeroline: false },
        },
      };
    }

    // ---- POLYGON (región por puntos) ----
    if (plotType === "polygon") {
      const poly = Array.isArray(plotSpec.polygon) ? plotSpec.polygon : [];
      if (poly.length < 3) return null;

      const polyXs = poly.map((p) => p.x);
      const polyYs = poly.map((p) => p.y);
      if (![...polyXs, ...polyYs].every((v) => typeof v === "number")) return null;

      const closedX = [...polyXs, polyXs[0]];
      const closedY = [...polyYs, polyYs[0]];

      const regionTrace = {
        type: "scatter",
        mode: "lines",
        x: closedX,
        y: closedY,
        fill: "toself",
        fillcolor: "rgba(124, 92, 255, 0.15)",
        line: { width: 2 },
        name: "Región",
      };

      const ptsTrace = overlayPoints.length ? [pointTrace2D(overlayPoints)] : [];

      const xsAll = overlayPoints.length ? polyXs.concat(overlayPoints.map(p => p.x)) : polyXs;
      const ysAll = overlayPoints.length ? polyYs.concat(overlayPoints.map(p => p.y)) : polyYs;
      const { xmin, xmax, ymin, ymax } = padRange(xsAll, ysAll, 1);

      return {
        title,
        data: [regionTrace, ...ptsTrace],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 50, r: 10, b: 50, t: 50 },
          xaxis: { title: "x", range: [xmin, xmax], zeroline: false },
          yaxis: { title: "y", range: [ymin, ymax], zeroline: false },
        },
      };
    }

    // ---- CURVE (una o varias funciones y=f(x)) ----
    if (plotType === "curve2d") {
      if (!Array.isArray(plotSpec.xRange) || plotSpec.xRange.length !== 2) return null;

      let [xmin, xmax] = plotSpec.xRange;
      if (typeof xmin !== "number" || typeof xmax !== "number") return null;
      if (xmin === xmax) { xmin -= 1; xmax += 1; }

      const grid = ensureGrid(plotSpec.grid, "curve2d");
      const n = grid.n ?? 400;
      const xs = linspace(xmin, xmax, n);

      const funcs = getFunctionsList(plotSpec);
      if (funcs.length === 0) return null;

      const traces = funcs.map((fnObj) => {
        let f;
        try { f = compileF1(fnObj.expression); }
        catch (e) {
          console.error("Curve compile error:", fnObj.expression, e.message);
          return null;
        }

        const ys = xs.map((x) => {
          const v = f(x);
          return Number.isFinite(v) ? v : null;
        });

        return { type: "scatter", mode: "lines", x: xs, y: ys, name: fnObj.label };
      }).filter(Boolean);

      const pointsTrace = overlayPoints.length ? [pointTrace2D(overlayPoints)] : [];

      return {
        title,
        data: [...traces, ...pointsTrace],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 50, r: 10, b: 50, t: 50 },
          xaxis: Array.isArray(plotSpec.xRange) ? { range: plotSpec.xRange } : undefined,
          yaxis: Array.isArray(plotSpec.yRange) ? { range: plotSpec.yRange } : undefined,
          legend: { orientation: "h" },
        },
      };
    }

    // ---- SURFACE / CONTOUR (una o varias funciones z=f(x,y)) ----
    if (plotType === "surface" || plotType === "contour") {
      if (!Array.isArray(plotSpec.xRange) || !Array.isArray(plotSpec.yRange)) return null;

      let [xmin, xmax] = plotSpec.xRange;
      let [ymin, ymax] = plotSpec.yRange;
      if (![xmin, xmax, ymin, ymax].every((v) => typeof v === "number")) return null;

      if (xmin === xmax) { xmin -= 1; xmax += 1; }
      if (ymin === ymax) { ymin -= 1; ymax += 1; }

      const grid = ensureGrid(plotSpec.grid, plotType);
      const nx = grid.nx ?? 80;
      const ny = grid.ny ?? 80;

      const xs = linspace(xmin, xmax, nx);
      const ys = linspace(ymin, ymax, ny);

      const funcs = getFunctionsList(plotSpec);
      if (funcs.length === 0) return null;

      // ⚠️ este renderer asume z=f(x,y). Si la expresión tiene 'z', no sirve.
      for (const fn of funcs) {
        if (/\bz\b/i.test(fn.expression)) {
          console.error("Surface/contour requiere z=f(x,y) (sin 'z'):", fn.expression);
          return null;
        }
      }

      const traces = funcs.map((fnObj, idx) => {
        let f;
        try { f = compileF2(fnObj.expression); }
        catch (e) {
          console.error("Surface compile error:", fnObj.expression, e.message);
          return null;
        }

        const Z = ys.map((y) =>
          xs.map((x) => {
            const v = f(x, y);
            return Number.isFinite(v) ? v : null;
          })
        );

        if (plotType === "surface") {
          return {
            type: "surface",
            x: xs,
            y: ys,
            z: Z,
            name: fnObj.label || `Superficie ${idx + 1}`,
            opacity: funcs.length > 1 ? 0.85 : 1,
            showscale: idx === 0,
          };
        }

        return {
          type: "contour",
          x: xs,
          y: ys,
          z: Z,
          name: fnObj.label || `Contorno ${idx + 1}`,
          showscale: idx === 0,
        };
      }).filter(Boolean);

      const overlay2D =
        plotType === "contour" && overlayPoints.length ? [pointTrace2D(overlayPoints)] : [];

      const overlay3D =
        plotType === "surface" && overlayPoints.length && funcs.length > 0
          ? (() => {
              let f0;
              try { f0 = compileF2(funcs[0].expression); } catch { return []; }
              return [{
                type: "scatter3d",
                mode: "markers+text",
                x: overlayPoints.map((p) => p.x),
                y: overlayPoints.map((p) => p.y),
                z: overlayPoints.map((p) => {
                  const v = f0(p.x, p.y);
                  return Number.isFinite(v) ? v : null;
                }),
                text: overlayPoints.map((p) => p.label),
                textposition: "top center",
                marker: { size: 5 },
                name: "Puntos",
              }];
            })()
          : [];

      return {
        title,
        data: [...traces, ...overlay2D, ...overlay3D],
        layout: {
          title,
          autosize: true,
          height: 460,
          margin: { l: 10, r: 10, b: 10, t: 50 },
          legend: { orientation: "h" },
        },
      };
    }

    console.error("plotType no soportado:", plotType, plotSpec);
    return null;
  }, [plotSpec]);

  return (
    <div className="calc">
      <header className="calc-header">
        <h1 className="calc-title">Math Web (frontend)</h1>
        <p className="calc-sub">
          El backend/IA define <b>qué</b> graficar con un <code>plotSpec</code>. El frontend solo interpreta y dibuja.
        </p>
      </header>

      <section className="calc-card">
        <div className="calc-row-between">
          <h2 className="calc-h2">Entrada</h2>
        </div>

        <textarea
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          rows={4}
          className="calc-textarea"
          placeholder="Escribí el problema..."
        />

        <div className="calc-row">
          <button onClick={handleSolve} className="calc-button" disabled={isLoading}>
            {isLoading ? "Procesando..." : "Enviar"}
          </button>

          <span className="calc-hint">
            Backend: <code>POST {API_URL}</code>
          </span>
        </div>

        {errorMsg && (
          <div className="calc-error">
            <b>Error:</b> {errorMsg}
          </div>
        )}
      </section>

      <section className="calc-grid">
        <div className="calc-card">
          <h2 className="calc-h2">Respuesta</h2>
          {!answerText && !isLoading && <p className="calc-muted">Todavía no hay respuesta.</p>}
          {isLoading && <p className="calc-muted">Cargando...</p>}
          {answerText && <pre className="calc-pre">{answerText}</pre>}

          {plotSpec && (
            <details className="calc-details">
              <summary className="calc-summary">Ver plotSpec (debug)</summary>
              <pre className="calc-pre">{JSON.stringify(plotSpec, null, 2)}</pre>
            </details>
          )}
        </div>

        <div className="calc-card">
          <h2 className="calc-h2">Gráfico</h2>

          {!plotModel && plotSpec && (
            <p className="calc-muted">
              No pude renderizar este plotType: <code>{String(plotSpec.plotType)}</code>
            </p>
          )}

          {!plotModel && !plotSpec && (
            <p className="calc-muted">Cuando el backend devuelva plotSpec, se renderiza acá.</p>
          )}

          {plotModel && (
            <Plot
              data={plotModel.data}
              layout={{
                ...plotModel.layout,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#fff" },
              }}
              useResizeHandler
              style={{ width: "100%" }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
