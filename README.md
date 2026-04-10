# # FuelEU Maritime — Full-Stack Developer Assignment

## Overview
This project is a full-stack FuelEU Maritime compliance dashboard. It allows users to:
- View routes and emissions data
- Compare routes against a baseline
- Calculate compliance balance (CB)
- Simulate banking and pooling logic

## Tech Stack
Frontend: React, TypeScript, Vite
Backend: Node.js, Express, TypeScript

## Features
- Routes dashboard with filtering
- GHG intensity visualization
- Comparison with compliance status
- Compliance Balance calculation
- Banking and pooling logic (API level)

## How to Run
Backend:
cd backend
npm install
npm run dev

Frontend:
cd frontend
npm install
npm run dev

## API Endpoints
GET /routes
POST /routes/:id/baseline
GET /routes/comparison
GET /compliance/cb
POST /banking/bank
POST /pools

## Formula
CB = (Target - Actual) × Energy
Energy = fuelConsumption × 41000
