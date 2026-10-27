# FinSight AI — HDFC Bank Executive Decision Intelligence

> **Independent Prototype Notice:** FinSight AI is an independent decision-support prototype built around a simulated HDFC Bank scenario. All figures and observations are synthetic, model-generated records for analytics and executive decision demonstration purposes. This is not an official HDFC Bank application.

---

## 🏛️ Executive Summary

**FinSight AI** is an enterprise-grade full-stack financial analytics and executive decision-intelligence platform. It bridges the critical divide between **operational day-to-day KPIs** (such as loan processing turnaround time, delinquency rates, customer acquisition cost, employee productivity, and digital channel adoption) and **topline/bottomline financial performance** (Net Revenue, Operating Profit / PPOP, Net Profit / PAT, Net Interest Margin, and Cost-to-Income Ratio).

Equipped with an econometric driver analysis engine, statistical anomaly detection, interactive strategic what-if scenario planning, and an LLM-powered executive assistant with verified numerical grounding and a deterministic fallback, FinSight AI empowers C-suite leaders (CEO, CFO, CRO, COO) to make evidence-based banking decisions.

---

## ⚡ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom HDFC navy & teal banking palette
- **Visualizations**: Recharts (multi-line trends, area trajectory charts, standardized beta bar charts)
- **Icons**: Lucide React
- **HTTP Client**: Axios with configured API proxy
- **Testing**: Vitest & React Testing Library with jsdom

### Backend
- **Framework**: Python 3.13, FastAPI & Uvicorn
- **Validation**: Pydantic V2 & Pydantic-Settings
- **ORM & Migrations**: SQLAlchemy 2.0 with Alembic
- **Database**: SQLite development fallback (default) with zero configuration; full PostgreSQL support via `DATABASE_URL`

### Analytics & Econometrics
- **Statsmodels & Scipy**: Multiple OLS regression, Durbin-Watson autocorrelation tests, Variance Inflation Factor (VIF), Pearson & Spearman rank correlations
- **Scikit-learn**: Sequential temporal train/test split (75/25) with holdout test RMSE and $R^2$ evaluation, Random Forest non-linear feature importances
- **Pandas & NumPy**: 36-month time-series modeling, rolling averages (MA3), statistical Z-score anomaly detection

### AI & LLM Decision Support
- **OpenAI API**: GPT-4o-mini with prompt engineering enforcing strict separation between facts, statistical associations, hypotheses, and scenario estimates
- **Deterministic Engine**: Built-in template intelligence generator producing complete executive answers when no OpenAI API key is supplied

---

## 📊 Core Application Modules

### 1. Executive Overview
- Board-level summary cards for **Net Revenue**, **Pre-Provision Operating Profit (PPOP)**, **Net Profit (PAT)**, **Net Interest Margin (NIM)**, **Cost-to-Income Ratio (CIR)**, and **Gross NPA Ratio**.
- Period-over-period changes (MoM and YoY) with favorable/unfavorable directional indicator badges.
- Dynamic **AI Executive Briefing banner** providing high-level performance commentary.
- Interactive multi-month revenue vs operating profit trajectory area charts.
- Business unit scope filtering: `Consolidated`, `Retail Banking`, `Wholesale Banking`, `Wealth Management`, and `Treasury & Digital`.

### 2. KPI Intelligence Explorer
- Operational vs Financial metric categories.
- Dual-axis historical co-movement charts comparing up to 4 metrics simultaneously.
- 3-Month Moving Average (MA3) smoothing toggle.
- Comprehensive metric catalog detailing operational definitions, supervisory targets, and optimization goals.

### 3. Driver Analysis Engine
- Ordinary Least Squares (OLS) multiple regression identifying key drivers of operating profit, net profit, CIR, or NIM.
- Model diagnostics: In-sample $R^2$, Adjusted $R^2$, Out-of-sample Test $R^2$, F-statistic p-value, Durbin-Watson statistic, and AIC/BIC.
- Standardized Beta ($\beta$) coefficients allowing direct comparison of heterogeneous metrics (Days vs ₹ vs %).
- Multicollinearity screening via Variance Inflation Factor (VIF).
- Lag order analysis (evaluating $T$, $T-1$, and $T-2$ month operational transmission delays).
- Prominent **Supervisory Econometric Notice** clearly distinguishing statistical association from causation.

### 4. Operational & Credit Risk Monitor
- Real-time statistical anomaly detection using historical Z-scores ($|Z| \ge 2.2\sigma$ for high risk, $\ge 1.5\sigma$ for medium risk) and regulatory threshold breach tracking.
- Severity breakdown (High, Medium, Low) and quick search filtering.
- Detailed alert cards displaying:
  - Observed metric value vs 35-month baseline mean.
  - Percentage deviation and detection methodology.
  - Empirical statistical evidence.
  - Prioritized actionable investigation protocol for bank leadership.

### 5. AI Executive Assistant
- Interactive dialogue interface answering strategic queries such as:
  - *"Why did operating profit decline in recent periods?"*
  - *"What is affecting the cost-to-income ratio?"*
  - *"What could happen if loan processing time decreases by 10%?"*
  - *"Which operational risks require immediate C-suite attention?"*
- **Strict Evidence Grounding**: The backend pre-computes and validates all numerical evidence before dispatching context to the assistant.
- Color-coded executive badges explicitly categorizing statements into:
  - `[OBSERVED FACT]` (Verified bank ledger observations)
  - `[STATISTICAL ASSOCIATION]` (Empirical regression betas & correlations)
  - `[HYPOTHESIS]` (Underwriting and channel operational explanations)
  - `[ESTIMATE]` (Model-derived scenario projections)
- Zero-dependency fallback: runs deterministically when no API key is configured.

### 6. Strategic Scenario Planner
- Interactive assumption sliders:
  - Operating Expenses (Opex) % adjustment ($-15\%$ to $+15\%$)
  - Loan Advances Expansion % ($-10\%$ to $+20\%$)
  - Loan Processing Turnaround Time (TAT) speedup/delay ($-30\%$ to $+30\%$)
  - Customer Acquisition Cost (CAC) % shift ($-25\%$ to $+25\%$)
  - Early Delinquency Arrears (30+ DPD) stress ($-30\%$ to $+50\%$)
- Preset scenario shortcuts: *Cost Rationalization Sprint*, *Aggressive Retail Loan Expansion*, and *Macro Delinquency Stress Test*.
- Comprehensive baseline vs projected outcomes table with absolute and percentage shifts.
- **5x5 Net Profit Sensitivity Heatmap**: Loan Expansion vs Opex adjustments.
- Clear hypothetical limitations and regulatory model disclaimers.

### 7. Data Management & Quality Diagnostics
- Drag-and-drop ingestion for CSV and Excel files.
- Automated column synonym mapping (`TAT` -> `loan_processing_time`, etc.).
- Date normalization (`YYYY-MM`), missing-value imputation, and duplicate detection.
- Data Quality Report detailing row counts, schema mapping status, and diagnostic logs.
- Downloadable sample CSV upload template.
- One-click **"Restore 36M Baseline"** button to reset the database to the pristine 180-record synthetic dataset.

### 8. Executive Reports
- Formal Board Memorandum summarizing executive positions, core financial ledger highlights, operational vulnerabilities, and key driver econometric findings.
- Prioritized Action Plan categorized into `P1 - Critical`, `P2 - Strategic`, and `P3 - Operational`.
- Built-in browser Print / Save as PDF capability with print-optimized CSS.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ & npm (Node v20 tested)

### 1. Repository Setup & Workspace
```bash
cd /Users/veerenkumarkonchada/.gemini/antigravity-ide/scratch/finsight-ai
```

### 2. Backend Setup
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# Run database migrations
cd backend
PYTHONPATH=. alembic upgrade head

# Initialize / Seed the database (creates 180 records across 36 months)
PYTHONPATH=. python -m app.services.seed_data

# Start backend server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be live at `http://localhost:8000`.
Interactive OpenAPI docs are available at `http://localhost:8000/docs`.

### 3. Frontend Setup
In a separate terminal:
```bash
cd /Users/veerenkumarkonchada/.gemini/antigravity-ide/scratch/finsight-ai/frontend

# Install dependencies (if needed)
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing

### Backend Test Suite (Pytest)
```bash
cd /Users/veerenkumarkonchada/.gemini/antigravity-ide/scratch/finsight-ai/backend
PYTHONPATH=. ../venv/bin/pytest tests/test_all_endpoints.py -v
```
Tests cover:
- Health check & database connection
- Dashboard summary calculations (Consolidated & Retail)
- KPI catalog and 36-month moving average trends
- Multiple OLS regression, VIF, and lag analysis
- Risk anomaly alert generation
- AI assistant grounded response & template fallback
- Scenario planner calculations & 5x5 sensitivity matrix
- Data upload validation & quality reporting
- Board report generation

### Frontend Test Suite (Vitest)
```bash
cd /Users/veerenkumarkonchada/.gemini/antigravity-ide/scratch/finsight-ai/frontend
npm test
```

### Production Build Validation
```bash
cd /Users/veerenkumarkonchada/.gemini/antigravity-ide/scratch/finsight-ai/frontend
npm run build
```

---

## 🔒 Security & Governance Disclosures

1. **API Key Security**: The OpenAI API key is stored exclusively in backend environment variables (`.env`) and is never sent or exposed to client-side code.
2. **Deterministic Fallback**: If no OpenAI API key is configured, the application automatically uses a deterministic template reasoning engine without breaking.
3. **Upload Protection**: File uploads are restricted to `.csv` and `.xlsx` files with a maximum 15 MB file size limit. Ingestion validates schemas and prevents arbitrary code execution.
4. **CORS Governance**: Configured via backend settings (`settings.CORS_ORIGINS`).
5. **Causation Guardrail**: FinSight AI explicitly instructs users that regression coefficients and correlations represent historical associations, not counterfactual causation.
