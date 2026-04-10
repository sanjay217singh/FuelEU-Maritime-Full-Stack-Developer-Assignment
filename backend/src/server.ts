
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let routes = [
  { routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91, fuelConsumption: 5000, isBaseline: true },
  { routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88, fuelConsumption: 4800 },
  { routeId: "R003", vesselType: "Tanker", fuelType: "MGO", year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100 }
];

app.get("/routes", (req,res)=>res.json(routes));

app.post("/routes/:id/baseline", (req,res)=>{
  routes.forEach(r=>r.isBaseline=false);
  const r = routes.find(x=>x.routeId===req.params.id);
  if(r) r.isBaseline=true;
  res.json(r);
});

app.get("/routes/comparison", (req, res) => {
  const base = routes.find(r => r.isBaseline);

  if (!base) {
    return res.status(400).json({ error: "No baseline selected" });
  }

  const result = routes.map(r => ({
    ...r,
    percentDiff: ((r.ghgIntensity / base.ghgIntensity) - 1) * 100,
    compliant: r.ghgIntensity <= 89.3368
  }));

  res.json(result);
});

app.get("/compliance/cb",(req,res)=>{
  const actual = Number(req.query.actual);
  const fuel = Number(req.query.fuel);
  const target = 89.3368;
  const energy = fuel*41000;
  res.json({cb:(target-actual)*energy});
});

app.listen(3000,()=>console.log("Backend running"));
