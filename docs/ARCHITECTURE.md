# FinSight AI Architecture Documentation

## System Topology

```
+---------------------------------------------------------------+
|                   FinSight AI Frontend                        |
|  (React 18 + TypeScript + Vite + Tailwind CSS + Recharts)     |
|                                                               |
|  [Executive Overview]   [KPI Intelligence]   [Driver Analysis]|
|  [Risk Monitor]         [AI Assistant]       [Scenario Planner]|
|  [Data Management]      [Executive Reports]                   |
+------------------------------+--------------------------------+
                               | Axios HTTP / REST
                               v
+---------------------------------------------------------------+
|                     FastAPI Backend                           |
|                    (Python 3.13 / Uvicorn)                    |
|                                                               |
|  /api/dashboard    /api/kpis        /api/analysis/drivers     |
|  /api/risks        /api/assistant   /api/scenarios/run        |
|  /api/data         /api/reports     /api/health               |
+---------------+------------------------------+----------------+
                |                              |
        SQLAlchemy 2.0                 Analytics Engines
                v                              v
+-------------------------------+  +----------------------------+
|        Database Layer         |  |   Econometric & AI Core    |
| - SQLite (Default dev)        |  | - Statsmodels Multiple OLS |
| - PostgreSQL (Production)     |  | - Scikit-learn (75/25 split|
| - Alembic Migrations          |  | - Scipy & VIF Multicollin. |
| - 180 Synthetic Records       |  | - OpenAI GPT-4o-mini /     |
| - 19 Baseline Risk Alerts     |  |   Deterministic Fallback   |
+-------------------------------+  +----------------------------+
```

## Data Model & ER Relationships

1. **`monthly_records`**:
   - `id` (PK), `period` (YYYY-MM), `business_unit` (Unique compound index on period + business_unit)
   - Financial attributes: `revenue`, `net_interest_income`, `operating_expenses`, `operating_profit`, `credit_loss_provisions`, `net_profit`, `net_interest_margin`, `cost_to_income_ratio`, `gross_npa_ratio`, `net_npa_ratio`, `provision_coverage_ratio`, `casa_ratio`, `total_advances`, `total_deposits`.
   - Operational attributes: `loan_processing_time`, `loan_approval_rate`, `customer_acquisition_cost`, `customer_complaints`, `customer_satisfaction`, `employee_productivity`, `employee_attrition`, `digital_adoption`, `service_resolution_time`, `delinquency_rate`.

2. **`kpi_definitions`**:
   - Master metadata containing canonical code, display name, category, unit, supervisory target value, optimization direction (`higher` | `lower`), and warning/critical thresholds.

3. **`risk_alerts`**:
   - Time-series anomaly detection alerts containing observed value, baseline 35-month mean, standard deviation, Z-score, deviation percentage, detection methodology, and recommended investigation protocols.

4. **`scenario_runs`**:
   - Audited historical simulation records capturing baseline values, assumption levers, and calculated sensitivity outputs.

5. **`executive_chat_history`**:
   - Audit trail of executive queries, pre-computed evidence contexts, and model responses.

## Analytics & Econometric Engine Specifications

### 1. Multiple Linear Regression & Econometric Diagnostics
- Standardized Beta: $\beta_j = \hat{b}_j \cdot \frac{s_{X_j}}{s_y}$ allowing direct comparison across heterogeneous metrics.
- Multicollinearity: Variance Inflation Factor $VIF_j = \frac{1}{1 - R_j^2}$, flagging predictors with severe linear dependence.
- Out-of-sample Generalization: Sequential temporal 75/25 train/test split to prevent temporal lookahead data leakage, computing holdout RMSE and test $R^2$.
- Autocorrelation: Durbin-Watson statistic $d = \frac{\sum_{t=2}^T (e_t - e_{t-1})^2}{\sum_{t=1}^T e_t^2}$.

### 2. Transmission Lag Modeling
- Cross-correlation analysis evaluating orders $T$, $T-1$, and $T-2$ months:
  $r_{xy}(k) = \frac{\sum (x_{t-k} - \bar{x})(y_t - \bar{y})}{\sqrt{\sum (x_{t-k} - \bar{x})^2 \sum (y_t - \bar{y})^2}}$

### 3. Anomaly & Risk Detection
- Z-Score: $Z = \frac{x_t - \mu_{t-1}}{\sigma_{t-1}}$, where $|Z| \ge 2.2\sigma$ triggers High severity, and $|Z| \ge 1.5\sigma$ triggers Medium severity.
