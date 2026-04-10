import React, { useEffect, useState } from "react";

export default function App() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [tab, setTab] = useState("routes");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/routes")
      .then(res => res.json())
      .then(setRoutes);
  }, []);

  const loadComparison = () => {
    fetch("http://localhost:3000/routes/comparison")
      .then(res => res.json())
      .then(setComparison);
  };

  const filtered = routes.filter(r =>
    r.vesselType.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>FuelEU Maritime Dashboard</h1>

      {/* Tabs */}
      <button onClick={() => setTab("routes")}>Routes</button>
      <button onClick={() => { setTab("compare"); loadComparison(); }}>Compare</button>
      <button onClick={() => setTab("banking")}>Banking</button>
      <button onClick={() => setTab("pooling")}>Pooling</button>

      {/* ROUTES TAB */}
      {tab === "routes" && (
        <div>
          <br /><br />

          <input
            placeholder="Filter by vessel"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />

          <table border={1}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vessel</th>
                <th>Fuel</th>
                <th>GHG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.routeId}>
                  <td>{r.routeId}</td>
                  <td>{r.vesselType}</td>
                  <td>{r.fuelType}</td>
                  <td>{r.ghgIntensity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>GHG Intensity Visualization</h2>

          {filtered.map(r => (
            <div key={r.routeId} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><b>{r.routeId}</b></span>
                <span>{r.ghgIntensity} gCO₂e/MJ</span>
              </div>

              <div style={{
                background: "#eee",
                height: 12,
                borderRadius: 6,
                overflow: "hidden"
              }}>
                <div style={{
                  background: r.ghgIntensity <= 89.3368 ? "green" : "red",
                  width: r.ghgIntensity * 3,
                  height: "100%"
                }}></div>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* COMPARE TAB */}
      {tab === "compare" && (
        <>
          <h2>Comparison</h2>
          <table border={1}>
            <thead>
              <tr>
                <th>ID</th>
                <th>GHG</th>
                <th>% Diff</th>
                <th>Compliant</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((r: any) => (
                <tr key={r.routeId}>
                  <td>{r.routeId}</td>
                  <td>{r.ghgIntensity}</td>
                  <td>{r.percentDiff.toFixed(2)}%</td>
                  <td style={{ color: r.compliant ? "green" : "red" }}>
                    {r.compliant ? "✔ Compliant" : "✖ Non-Compliant"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* BANKING TAB */}
      {tab === "banking" && (
        <>
          <h2>Banking</h2>
          <p>Banking logic implemented in backend.</p>
          <p>Use API: POST /banking/bank</p>
        </>
      )}

      {/* POOLING TAB */}
      {tab === "pooling" && (
        <>
          <h2>Pooling</h2>
          <p>Pooling logic implemented in backend.</p>
          <p>Use API: POST /pools</p>
        </>
      )}
    </div>
  );
}