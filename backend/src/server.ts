import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------ MOCK DATABASE ------------------ */

let routes = [
  { routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91, fuelConsumption: 5000 },
  { routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88, fuelConsumption: 4800 },
  { routeId: "R003", vesselType: "Tanker", fuelType: "MGO", year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100 },
  { routeId: "R004", vesselType: "RoRo", fuelType: "HFO", year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900 },
  { routeId: "R005", vesselType: "Container", fuelType: "LNG", year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950 }
];

let bankEntries: any[] = [];
let pools: any[] = [];

/* ------------------ CONSTANTS ------------------ */

const BASELINE = 91.16;
const TARGET = 89.3368;
const ENERGY_FACTOR = 41000;

/* ------------------ HELPERS ------------------ */

function computeCB(route: any) {
  const energy = route.fuelConsumption * ENERGY_FACTOR;
  return (TARGET - route.ghgIntensity) * energy;
}

/* ------------------ ROUTES ------------------ */

app.get("/routes", (req, res) => res.json(routes));

app.get("/routes/comparison", (req, res) => {
  const result = routes.map(r => ({
    ...r,
    percentDiff: ((r.ghgIntensity - BASELINE) / BASELINE) * 100,
    compliant: r.ghgIntensity <= TARGET
  }));

  res.json({
    baseline: BASELINE,
    target: TARGET,
    data: result
  });
});

/* ------------------ COMPLIANCE ------------------ */

//  YEAR LEVEL CB
app.get("/compliance/cb", (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: "year is required" });
  }

  const data = routes
    .filter(r => r.year == year)
    .map(r => {
      const cb = computeCB(r);

      return {
        shipId: r.routeId,
        year,
        cb_before: cb
      };
    });

  res.json(data);
});

/* ------------------ ADJUSTED CB (KPI FORMAT) ------------------ */

app.get("/compliance/adjusted-cb", (req, res) => {
  const { shipId, year } = req.query;

  if (!shipId || !year) {
    return res.status(400).json({ error: "shipId and year required" });
  }

  const route = routes.find(r => r.routeId === shipId && r.year == year);
  if (!route) return res.status(404).json({ error: "Route not found" });

  const cb = computeCB(route);

  const applied = bankEntries
    .filter(b => b.shipId === shipId && b.year == year && b.type === "apply")
    .reduce((sum, b) => sum + b.amount, 0);

  res.json({
    shipId,
    year,
    cb_before: cb,
    applied,
    cb_after: cb + applied
  });
});

/* ------------------ BANKING ------------------ */

// GET records
app.get("/banking/records", (req, res) => {
  const { shipId, year } = req.query;

  if (!shipId || !year) {
    return res.status(400).json({ error: "shipId and year required" });
  }

  const data = bankEntries.filter(
    b => b.shipId === shipId && b.year == year
  );

  const balance = data.reduce((sum, b) => {
    return sum + (b.type === "bank" ? b.amount : -b.amount);
  }, 0);

  res.json({
    records: data,
    availableBalance: balance
  });
});

// 🔥 BANK (Article 20 compliant)
app.post("/banking/bank", (req, res) => {
  const { shipId, year, amount } = req.body;

  if (!shipId || !year || amount == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const route = routes.find(r => r.routeId === shipId && r.year == year);
  if (!route) return res.status(404).json({ error: "Route not found" });

  const cb = computeCB(route);

  if (cb <= 0) {
    return res.status(400).json({ error: "Cannot bank when CB ≤ 0" });
  }

  bankEntries.push({ shipId, year, amount, type: "bank" });

  res.json({
    shipId,
    year,
    cb_before: cb,
    applied: 0,
    cb_after: cb
  });
});

// 🔥 APPLY (Article 20 compliant)
app.post("/banking/apply", (req, res) => {
  const { shipId, year, amount } = req.body;

  if (!shipId || !year || amount == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const route = routes.find(r => r.routeId === shipId && r.year == year);
  if (!route) return res.status(404).json({ error: "Route not found" });

  const cb = computeCB(route);

  if (cb >= 0) {
    return res.status(400).json({ error: "Ship is not in deficit" });
  }

  const available = bankEntries
    .filter(b => b.year == year)
    .reduce((sum, b) => sum + (b.type === "bank" ? b.amount : -b.amount), 0);

  if (amount > available) {
    return res.status(400).json({ error: "Not enough banked surplus" });
  }

  bankEntries.push({ shipId, year, amount, type: "apply" });

  res.json({
    shipId,
    year,
    cb_before: cb,
    applied: amount,
    cb_after: cb + amount
  });
});

/* ------------------ POOLS ------------------ */

app.post("/pools", (req, res) => {
  const { members, year } = req.body;

  if (!members || !Array.isArray(members) || !year) {
    return res.status(400).json({ error: "members array and year required" });
  }

  // STEP 1: Build pool data with CB + banking
  let poolData = members.map((m: any) => {
    const route = routes.find(r => r.routeId === m.shipId && r.year == year);

    if (!route) {
      throw new Error(`Route not found for ${m.shipId}`);
    }

    const baseCB = computeCB(route);

    const bankAdjustment = bankEntries
      .filter(b => b.shipId === m.shipId && b.year == year)
      .reduce((sum, b) => {
        return sum + (b.type === "bank" ? b.amount : -b.amount);
      }, 0);

    const cb = baseCB + bankAdjustment;

    return {
      shipId: m.shipId,
      cb_before: cb,
      cb_after: cb
    };
  });

  // STEP 2: Validate pool total
  const total = poolData.reduce((sum, m) => sum + m.cb_before, 0);

  if (total < 0) {
    return res.status(400).json({ error: "Pool must have total CB ≥ 0" });
  }

  // STEP 3: Split surplus & deficit
  const surplus = poolData
    .filter(m => m.cb_before > 0)
    .sort((a, b) => b.cb_before - a.cb_before);

  const deficit = poolData
    .filter(m => m.cb_before < 0)
    .sort((a, b) => a.cb_before - b.cb_before);

  // STEP 4: Greedy redistribution
  for (let d of deficit) {
    for (let s of surplus) {

      if (d.cb_after >= 0) break;

      if (s.cb_after <= 0) continue;

      const transfer = Math.min(s.cb_after, Math.abs(d.cb_after));

      // apply transfer
      s.cb_after -= transfer;
      d.cb_after += transfer;
    }
  }

  // STEP 5: Final validation (safety)
  for (let m of poolData) {
    if (m.cb_before > 0 && m.cb_after < 0) {
      return res.status(400).json({ error: "Surplus ship became negative" });
    }

    if (m.cb_before < 0 && m.cb_after < m.cb_before) {
      return res.status(400).json({ error: "Deficit ship worsened" });
    }
  }

  pools.push(poolData);

  res.json({
    total_cb: total,
    members: poolData
  });
});

/* ------------------ SERVER ------------------ */

app.listen(3000, () => console.log("Backend running on port 3000"));