# RYTAIL — Agentic AI Fashion Retail Inventory Intelligence & Operations Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-emerald.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-sky.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.1-purple.svg)](https://vitejs.dev)
[![GCP Storage](https://img.shields.io/badge/GCP_Storage-Live_Stream-blue.svg)](https://cloud.google.com/storage)
[![Tests](https://img.shields.io/badge/Tests-12%20Passed-brightgreen.svg)]()

**RYTAIL** is a production-oriented, agentic AI fashion retail intelligence and physical store operations platform developed for Style Union.

It unifies central merchandising, allocation science, warehouse-to-store logistics, physical in-store barcode scanning, cycle count audits, and Google Cloud Platform (GCP) live data ingestion into an explainable, auditable system.

---

## 1. Six Core Operational Modules

1. **First Allocation Engine & Comparables Scoring**
   - Size-curve breakdown (S, M, L, XL, XXL) across 193 retail stores.
   - Authoritative allocation pool calculation: $4,435 \times 52.4\% = 2,323$ units.
   - Explains Store E0100's allocation ($13$ units) with mathematical trace vs Nextail.
   - Hard gates enforce pool constraints, store tier capacity, and eligibility.

2. **Replenishment Engine**
   - Target Stock formula:
     $$\text{Target Stock} = \lceil \text{Average Daily Sales} \times (\text{Lead Time} + \text{Review Period}) + \text{Safety Stock} \rceil$$
   - Minimum Display Quantity (MDQ) shortage detection and backroom availability check.

3. **Warehouse-to-Store Distance & Routing Network**
   - Real-world road routing and geodesic distance engine between regional DCs and stores.
   - Transit lead time computation and dynamic freight cost matrix.

4. **In-Store Barcode Scanning & Multi-Location Stock Movements**
   - Camera barcode scanner + USB/Bluetooth external hardware scanner support.
   - Granular inventory tracking: Sales Floor, Backroom, Damaged, Quarantine, and Receiving.
   - Atomic backroom-to-sales floor replenishment movements with display quantity alerts.
   - **Sample Barcode for testing:** `8901234567890` (EXFP00035 WHITECAP GRAY).

5. **Multi-Platform Connectors & Google Cloud Storage (GCS) Live Hub**
   - Direct connection to GCP Cloud Storage buckets (`gs://...`).
   - Authentication via Service Account JSON key or Application Default Credentials (`ADC`).
   - Live stream ingestion of POS sales transactions, on-hand inventory, and size curves.
   - Export planning snapshots and execution runs directly back to GCS.
   - Support for SAP S/4HANA ERP, Manhattan SCALE WMS, and PineLabs POS.

6. **Physical Inventory Cycle Counts & Store Shrinkage Audits**
   - Store session creation, barcode scanning, expected vs counted variance tracking.
   - Shrinkage value computation and store manager approval workflow.

---

## 2. Agentic AI Floating Co-Pilot

- Accessible via the circular action icon at the bottom-right corner of the application.
- Coordinates 8 specialized domain agents:
  - **Data Intelligence Agent** (GCS bucket audits, schema validation)
  - **First Allocation Agent**
  - **Replenishment Agent**
  - **Store Transfer Agent**
  - **Nextail Comparison Agent**
  - **Scanner & Movement Agent**
  - **Logistics & Distance Agent**
  - **Cycle Count Audit Agent**
- Strict governance lifecycle: `Recommended -> Approved -> Executed`.

---

## 3. Quick Start in Visual Studio Code

### Step 1: Open Project in VS Code
Extract the zip file, launch VS Code, and open the `rytail` root folder:
```bash
code .
```

### Step 2: Start the Backend (FastAPI)
Open a terminal in VS Code:
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the 12 deterministic test suites
python run_tests.py

# Start Backend Server (runs on http://localhost:8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 3: Start the Frontend (React + Vite + Tailwind)
Open a second terminal in VS Code:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite Dev Server (runs on http://localhost:3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. One-Click VS Code Launch
Pre-configured VS Code settings and launch profiles are included under `.vscode/`:
- Press `F5` or go to the **Run & Debug** panel and choose **"Backend: FastAPI (Uvicorn)"**.
- Run task: `Terminal -> Run Task -> Start Frontend (Vite)`.

---

## 5. Sample Test Data & Credentials

### Sample Barcode for Testing
- **Barcode**: `8901234567890`
- **Product**: Women's Casual Top (Style: `EXFP00035`, Colour: `Whitecap Gray`, Size: `M`, SKU: `EXFP00035-WHG-M`)
- **Location**: Store E0100 (Phoenix Marketcity Bangalore)
- **MDQ**: 6 units | **Sales Floor**: 3 units | **Backroom**: 10 units | **Shortage**: 3 units

### Seed User Accounts
| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `adminpassword` |
| **Store Manager** | `planner` | `plannerpassword` |
| **Store Associate** | `business` | `businesspassword` |
| **Merchandiser** | `merchandiser` | `merchpassword` |
| **Data Engineer** | `data_eng` | `datapassword` |

---

## 6. Project Architecture

```
rytail/
├── .vscode/                 # VS Code launch & task configurations
│   ├── launch.json
│   ├── tasks.json
│   └── settings.json
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API Routers (allocation, replenishment, scanner, gcs, copilot, etc.)
│   │   ├── db/              # SQLAlchemy models, SQLite db, and database seeders
│   │   ├── engines/         # Deterministic allocation, replenishment, transfer & distance engines
│   │   ├── schemas/         # Pydantic validation models
│   │   ├── services/        # GCS cloud service, cycle count service, copilot orchestrator
│   │   ├── config.py        # Central application settings
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Test suites (12 comprehensive tests)
│   ├── requirements.txt
│   └── run_tests.py         # Test runner
├── frontend/
│   ├── src/
│   │   ├── api/client.ts    # Frontend REST API client
│   │   ├── components/      # Floating AI Copilot, Navigation, Header
│   │   ├── pages/           # BarcodeScanner, DataConnectors, WarehouseMap, CycleCounts, FirstAllocation, etc.
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```
