import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const API = "http://localhost:3000";

export default function App() {
  const [tab, setTab] = useState("routes");
  const [routes, setRoutes] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [cbData, setCbData] = useState<any[]>([]);
  const [poolResult, setPoolResult] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/routes`).then(res => res.json()).then(setRoutes);
  }, []);

  const loadComparison = async () => {
    const res = await fetch(`${API}/routes/comparison`);
    const data = await res.json();
    setComparison(data.data);
  };

  const loadCB = async () => {
    const res = await fetch(`${API}/compliance/cb?year=2024`);
    const data = await res.json();
    setCbData(data);
  };

  const createPool = async () => {
    const res = await fetch(`${API}/pools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: 2024,
        members: [{ shipId: "R001" }, { shipId: "R002" }]
      })
    });

    const data = await res.json();
    setPoolResult(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🚢 FuelEU Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 justify-center">
        {["routes", "compare", "banking", "pooling"].map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === "compare") loadComparison();
              if (t === "banking") loadCB();
            }}
            className={`px-4 py-2 rounded-lg ${
              tab === t ? "bg-blue-600 text-white" : "bg-white shadow"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {/*// ROUTES TAB */}
      {tab === "routes" && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">

          <h2 className="text-2xl font-semibold mb-4">🚢 Routes</h2>

          {/* FILTERS */}
          <div className="flex gap-4 mb-4">
            <select
              className="border p-2 rounded"
              onChange={(e) => setRoutes(routes.filter(r => r.vesselType === e.target.value || e.target.value === ""))}
            >
              <option value="">All Vessel</option>
              <option value="Container">Container</option>
              <option value="BulkCarrier">BulkCarrier</option>
              <option value="Tanker">Tanker</option>
            </select>

            <select
              className="border p-2 rounded"
              onChange={(e) => setRoutes(routes.filter(r => r.fuelType === e.target.value || e.target.value === ""))}
            >
              <option value="">All Fuel</option>
              <option value="HFO">HFO</option>
              <option value="LNG">LNG</option>
              <option value="MGO">MGO</option>
            </select>

            <select
              className="border p-2 rounded"
              onChange={(e) => setRoutes(routes.filter(r => r.year == e.target.value || e.target.value === ""))}
            >
              <option value="">All Year</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* TABLE */}
          <table className="w-full border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">ID</th>
                <th>Vessel</th>
                <th>Fuel</th>
                <th>Year</th>
                <th>GHG</th>
                <th>Fuel (t)</th>
                <th>Distance (km)</th>
                <th>Total Emissions</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {routes.map(r => {
                const emissions = (r.fuelConsumption * r.ghgIntensity).toFixed(0);

                return (
                  <tr key={r.routeId} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-medium">{r.routeId}</td>
                    <td>{r.vesselType}</td>
                    <td>{r.fuelType}</td>
                    <td>{r.year}</td>

                    <td className={r.ghgIntensity <= 89.3368 ? "text-green-600" : "text-red-600"}>
                      {r.ghgIntensity}
                    </td>

                    <td>{r.fuelConsumption}</td>

                    <td>{(Math.random() * 5000).toFixed(0)}</td>

                    <td>{emissions}</td>

                    <td>
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        onClick={async () => {
                          await fetch(`${API}/routes/${r.routeId}/baseline`, {
                            method: "POST"
                          });
                          alert("Baseline Set!");
                        }}
                      >
                        Set Baseline
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      )}

      {/* COMPARE TAB */}
      {tab === "compare" && (
        <div className="space-y-6">

          {/* TABLE */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Comparison Table</h2>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th>ID</th>
                  <th>GHG</th>
                  <th>% Diff</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {comparison.map(r => (
                  <tr key={r.routeId} className="text-center border-t">
                    <td>{r.routeId}</td>
                    <td>{r.ghgIntensity}</td>

                    <td className={r.percentDiff > 0 ? "text-green-600" : "text-red-600"}>
                      {r.percentDiff.toFixed(2)}%
                    </td>

                    <td className={r.compliant ? "text-green-600" : "text-red-600"}>
                      {r.compliant ? "✔" : "✖"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CHART */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">
              📊 GHG Intensity Comparison
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="routeId" />
                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="ghgIntensity"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* BANKING */}
      {tab === "banking" && (
        <div className="bg-white p-4 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Banking</h2>

          <button
            onClick={loadCB}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Load CB
          </button>

          {cbData.map((r: any) => (
            <BankingCard key={r.shipId} data={r} />
          ))}
        </div>
      )}

      {/* POOLING */}
      {tab === "pooling" && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Pooling</h2>

          <button
            onClick={createPool}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Create Pool
          </button>

          {poolResult && (
            <div className="mt-4">
              <h3>Total CB: {poolResult.total_cb.toFixed(0)}</h3>

              {poolResult.members.map((m: any) => (
                <div key={m.shipId} className="border p-2 mt-2 rounded">
                  {m.shipId}: {m.cb_before.toFixed(0)} → {m.cb_after.toFixed(0)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// BANKING CARD


const BankingCard = ({ data }: any) => {
  const [amount, setAmount] = useState(0);
  const [adjusted, setAdjusted] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchAdjusted = async () => {
    const res = await fetch(
      `http://localhost:3000/compliance/adjusted-cb?shipId=${data.shipId}&year=${data.year}`
    );
    const json = await res.json();
    setAdjusted(json);
  };

  const handleBank = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/banking/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipId: data.shipId,
          year: data.year,
          amount: Number(amount),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Banking failed");

      fetchAdjusted();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleApply = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/banking/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipId: data.shipId,
          year: data.year,
          amount: Number(amount),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Apply failed");

      fetchAdjusted();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="border p-4 rounded-lg space-y-2">
      <h3 className="font-semibold">{data.shipId}</h3>

      <div>
        CB Before:{" "}
        <span className={data.cb_before > 0 ? "text-green-600" : "text-red-600"}>
          {data.cb_before.toFixed(0)}
        </span>
      </div>

      {adjusted && (
        <div className="text-sm">
          <div>Applied: {adjusted.applied.toFixed(0)}</div>
          <div>
            CB After:{" "}
            <span className={adjusted.cb_after > 0 ? "text-green-600" : "text-red-600"}>
              {adjusted.cb_after.toFixed(0)}
            </span>
          </div>
        </div>
      )}

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Enter amount"
        className="border px-2 py-1 rounded w-full"
      />

      <div className="flex gap-2">
        <button
          onClick={handleBank}
          disabled={data.cb_before <= 0}
          className="px-3 py-1 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          Bank
        </button>

        <button
          onClick={handleApply}
          disabled={data.cb_before >= 0}
          className="px-3 py-1 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Apply
        </button>

        <button
          onClick={fetchAdjusted}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};
