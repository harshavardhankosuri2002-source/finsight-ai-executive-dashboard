import os
import random
import numpy as np
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import KpiDefinition, MonthlyRecord, RiskAlertRecord
from app.core.database import SessionLocal, engine, Base

KPI_DEFINITIONS_DATA = [
    # Operational KPIs
    {
        "code": "loan_processing_time",
        "name": "Loan Processing Turnaround Time (TAT)",
        "category": "operational",
        "unit": "Days",
        "description": "Average duration from initial loan application submission to final sanction and disbursement.",
        "target_value": 3.5,
        "direction_better": "lower",
        "warning_threshold": 4.5,
        "critical_threshold": 5.5,
    },
    {
        "code": "loan_approval_rate",
        "name": "Loan Approval Rate",
        "category": "operational",
        "unit": "%",
        "description": "Percentage of processed credit applications approved under bank underwriting norms.",
        "target_value": 72.0,
        "direction_better": "higher",
        "warning_threshold": 65.0,
        "critical_threshold": 60.0,
    },
    {
        "code": "customer_acquisition_cost",
        "name": "Customer Acquisition Cost (CAC)",
        "category": "operational",
        "unit": "₹",
        "description": "Total blended sales, marketing, and channel origination expense per newly acquired customer.",
        "target_value": 1850.0,
        "direction_better": "lower",
        "warning_threshold": 2400.0,
        "critical_threshold": 2900.0,
    },
    {
        "code": "customer_complaints",
        "name": "Customer Complaints Ratio",
        "category": "operational",
        "unit": "Per 10k Customers",
        "description": "Total escalated ombudsman and service grievances lodged per 10,000 active customer relationships.",
        "target_value": 4.0,
        "direction_better": "lower",
        "warning_threshold": 6.5,
        "critical_threshold": 8.0,
    },
    {
        "code": "customer_satisfaction",
        "name": "Customer Satisfaction Score (CSAT)",
        "category": "operational",
        "unit": "Score (0-100)",
        "description": "Periodic transaction and relationship CSAT index based on digital and branch post-service surveys.",
        "target_value": 85.0,
        "direction_better": "higher",
        "warning_threshold": 78.0,
        "critical_threshold": 72.0,
    },
    {
        "code": "employee_productivity",
        "name": "Employee Productivity (Disbursement/FTE)",
        "category": "operational",
        "unit": "₹ Lakhs / FTE",
        "description": "Average annualized asset disbursement and fee generation produced per full-time branch & digital employee.",
        "target_value": 55.0,
        "direction_better": "higher",
        "warning_threshold": 46.0,
        "critical_threshold": 40.0,
    },
    {
        "code": "employee_attrition",
        "name": "Employee Attrition Rate",
        "category": "operational",
        "unit": "%",
        "description": "Annualized voluntary and involuntary frontline and operational staff turnover rate.",
        "target_value": 16.0,
        "direction_better": "lower",
        "warning_threshold": 21.0,
        "critical_threshold": 25.0,
    },
    {
        "code": "digital_adoption",
        "name": "Digital Adoption Rate",
        "category": "operational",
        "unit": "%",
        "description": "Share of monetary and non-monetary transactions performed via Mobile Banking, NetBanking, and UPI.",
        "target_value": 90.0,
        "direction_better": "higher",
        "warning_threshold": 84.0,
        "critical_threshold": 80.0,
    },
    {
        "code": "service_resolution_time",
        "name": "Mean Time to Resolve Grievances (MTTR)",
        "category": "operational",
        "unit": "Hours",
        "description": "Average hours elapsed from complaint ticketing to formal customer closure and verification.",
        "target_value": 12.0,
        "direction_better": "lower",
        "warning_threshold": 18.0,
        "critical_threshold": 24.0,
    },
    {
        "code": "delinquency_rate",
        "name": "Early Delinquency Rate (30+ DPD)",
        "category": "operational",
        "unit": "%",
        "description": "Percentage of standard advance portfolio past due by 30 to 89 days (early stress indicator).",
        "target_value": 1.6,
        "direction_better": "lower",
        "warning_threshold": 2.2,
        "critical_threshold": 2.8,
    },
    # Financial Metrics
    {
        "code": "revenue",
        "name": "Total Revenue (Net Income)",
        "category": "financial",
        "unit": "₹ Cr",
        "description": "Sum of Net Interest Income and Other Non-Interest Operating Income (fees, forex, commissions).",
        "target_value": 34000.0,
        "direction_better": "higher",
        "warning_threshold": 30000.0,
        "critical_threshold": 27000.0,
    },
    {
        "code": "net_interest_income",
        "name": "Net Interest Income (NII)",
        "category": "financial",
        "unit": "₹ Cr",
        "description": "Interest earned on loans and investments minus interest expended on customer deposits and borrowings.",
        "target_value": 26000.0,
        "direction_better": "higher",
        "warning_threshold": 22500.0,
        "critical_threshold": 20000.0,
    },
    {
        "code": "operating_expenses",
        "name": "Operating Expenses (Opex)",
        "category": "financial",
        "unit": "₹ Cr",
        "description": "Total staff costs, technology investments, branch leases, administrative and depreciation costs.",
        "target_value": 13500.0,
        "direction_better": "lower",
        "warning_threshold": 14800.0,
        "critical_threshold": 16000.0,
    },
    {
        "code": "operating_profit",
        "name": "Pre-Provision Operating Profit (PPOP)",
        "category": "financial",
        "unit": "₹ Cr",
        "description": "Total revenue minus operating expenses, before deducting credit loss provisions and tax charges.",
        "target_value": 20000.0,
        "direction_better": "higher",
        "warning_threshold": 17500.0,
        "critical_threshold": 15500.0,
    },
    {
        "code": "credit_loss_provisions",
        "name": "Credit Loss Provisions & Contingencies",
        "category": "financial",
        "unit": "₹ Cr",
        "description": "Regulatory and prudential impairment allowances set aside against impaired or stressed loan assets.",
        "target_value": 3100.0,
        "direction_better": "lower",
        "warning_threshold": 4100.0,
        "critical_threshold": 5000.0,
    },
    {
        "code": "net_profit",
        "name": "Net Profit (Profit After Tax - PAT)",
        "category": "financial",
        "unit": "₹ Cr",
        "description": "Bottom-line net earnings attributable to shareholders after all provisions and statutory taxes.",
        "target_value": 13200.0,
        "direction_better": "higher",
        "warning_threshold": 11500.0,
        "critical_threshold": 10000.0,
    },
    {
        "code": "net_interest_margin",
        "name": "Net Interest Margin (NIM)",
        "category": "financial",
        "unit": "%",
        "description": "Net interest income expressed as an annualized percentage of average interest-earning assets.",
        "target_value": 3.85,
        "direction_better": "higher",
        "warning_threshold": 3.45,
        "critical_threshold": 3.25,
    },
    {
        "code": "cost_to_income_ratio",
        "name": "Cost-to-Income Ratio (CIR)",
        "category": "financial",
        "unit": "%",
        "description": "Operating expenses divided by total net revenue. Key measure of operating banking efficiency.",
        "target_value": 39.5,
        "direction_better": "lower",
        "warning_threshold": 42.5,
        "critical_threshold": 45.0,
    },
    {
        "code": "gross_npa_ratio",
        "name": "Gross NPA Ratio (GNPA)",
        "category": "financial",
        "unit": "%",
        "description": "Gross non-performing advances as a proportion of total gross advances across the bank book.",
        "target_value": 1.25,
        "direction_better": "lower",
        "warning_threshold": 1.55,
        "critical_threshold": 1.85,
    },
    {
        "code": "net_npa_ratio",
        "name": "Net NPA Ratio (NNPA)",
        "category": "financial",
        "unit": "%",
        "description": "Net non-performing advances after deducting provisioning reserves from gross bad loans.",
        "target_value": 0.32,
        "direction_better": "lower",
        "warning_threshold": 0.45,
        "critical_threshold": 0.60,
    },
    {
        "code": "provision_coverage_ratio",
        "name": "Provision Coverage Ratio (PCR)",
        "category": "financial",
        "unit": "%",
        "description": "Proportion of total gross bad loans cushioned by cumulative loan loss provisions and buffers.",
        "target_value": 75.0,
        "direction_better": "higher",
        "warning_threshold": 70.0,
        "critical_threshold": 65.0,
    },
    {
        "code": "casa_ratio",
        "name": "CASA Deposit Ratio",
        "category": "financial",
        "unit": "%",
        "description": "Low-cost Current Account and Savings Account deposits as a percentage of total deposit base.",
        "target_value": 41.5,
        "direction_better": "higher",
        "warning_threshold": 37.5,
        "critical_threshold": 35.0,
    }
]

def generate_synthetic_data(seed: int = 42):
    """
    Generates 36 monthly observations (Oct 2023 - Sep 2026) for 4 units + Consolidated.
    Enforces realistic banking macroeconomic growth and operational-financial relationships.
    """
    np.random.seed(seed)
    random.seed(seed)

    periods = []
    # 36 months from 2023-10 to 2026-09
    year = 2023
    month = 10
    for _ in range(36):
        periods.append(f"{year}-{month:02d}")
        month += 1
        if month > 12:
            month = 1
            year += 1

    units_meta = {
        "Retail Banking": {
            "advances_base": 1250000,
            "deposits_base": 1380000,
            "weight": 0.48,
            "tat_base": 3.6,
            "approval_base": 71.0,
            "cac_base": 1950,
            "complaints_base": 5.2,
            "csat_base": 84.0,
            "prod_base": 54.0,
            "attrition_base": 17.5,
            "digital_base": 88.0,
            "mttr_base": 13.5,
            "delinq_base": 1.75,
            "nim_base": 4.10,
            "cir_base": 41.2,
            "gnpa_base": 1.20,
        },
        "Wholesale Banking": {
            "advances_base": 1050000,
            "deposits_base": 920000,
            "weight": 0.38,
            "tat_base": 11.5,
            "approval_base": 76.5,
            "cac_base": 52000,
            "complaints_base": 2.1,
            "csat_base": 86.5,
            "prod_base": 180.0,
            "attrition_base": 11.0,
            "digital_base": 78.5,
            "mttr_base": 22.0,
            "delinq_base": 1.45,
            "nim_base": 3.35,
            "cir_base": 32.5,
            "gnpa_base": 1.45,
        },
        "Wealth Management": {
            "advances_base": 160000,
            "deposits_base": 240000,
            "weight": 0.08,
            "tat_base": 2.2,
            "approval_base": 84.0,
            "cac_base": 14500,
            "complaints_base": 1.4,
            "csat_base": 91.0,
            "prod_base": 110.0,
            "attrition_base": 13.5,
            "digital_base": 82.0,
            "mttr_base": 8.0,
            "delinq_base": 0.65,
            "nim_base": 3.95,
            "cir_base": 46.0,
            "gnpa_base": 0.55,
        },
        "Treasury & Digital": {
            "advances_base": 190000,
            "deposits_base": 210000,
            "weight": 0.06,
            "tat_base": 1.5,
            "approval_base": 88.0,
            "cac_base": 850,
            "complaints_base": 3.8,
            "csat_base": 83.0,
            "prod_base": 95.0,
            "attrition_base": 14.0,
            "digital_base": 96.5,
            "mttr_base": 6.5,
            "delinq_base": 0.30,
            "nim_base": 3.50,
            "cir_base": 34.0,
            "gnpa_base": 0.25,
        }
    }

    all_records = []

    for t, period in enumerate(periods):
        # Time trends (growth index over 36 months)
        growth_factor = 1.0 + (t * 0.0095) # ~11% annualized balance sheet expansion
        macro_shock = 0.0
        # Simulated stress in months 33-35 (recent quarter operational bottleneck & slight delinquency uptick)
        if t >= 33:
            macro_shock = 0.04 * (t - 32)

        period_unit_records = {}

        for unit_name, meta in units_meta.items():
            # Add stochastic fluctuation + intentional correlation links
            noise = np.random.normal(0, 0.02)
            noise_op = np.random.normal(0, 0.03)

            # Operational KPIs with realistic variations
            # If t >= 33, retail experiences higher TAT & delinquency spike
            unit_shock = macro_shock if unit_name in ["Retail Banking", "Treasury & Digital"] else macro_shock * 0.4
            
            tat = max(1.0, meta["tat_base"] * (1.0 + unit_shock * 1.5 + noise_op))
            approval_rate = min(92.0, max(50.0, meta["approval_base"] * (1.0 - unit_shock * 0.5 + noise * 0.5)))
            cac = max(500.0, meta["cac_base"] * (1.0 + unit_shock * 1.2 + noise_op))
            complaints = max(0.5, meta["complaints_base"] * (1.0 + unit_shock * 1.8 + noise_op))
            csat = min(98.0, max(60.0, meta["csat_base"] * (1.0 - unit_shock * 0.8 - noise * 0.4)))
            prod = max(20.0, meta["prod_base"] * (1.0 - unit_shock * 0.6 + noise * 0.6))
            attrition = min(35.0, max(8.0, meta["attrition_base"] * (1.0 + unit_shock * 0.7 + noise_op)))
            digital = min(98.5, max(65.0, meta["digital_base"] + (t * 0.22) + noise))
            mttr = max(4.0, meta["mttr_base"] * (1.0 + unit_shock * 1.3 + noise_op))
            delinquency = max(0.2, meta["delinq_base"] * (1.0 + unit_shock * 1.6 + noise_op * 0.8))

            # Balance sheet scale
            advances = meta["advances_base"] * growth_factor * (1.0 + noise * 0.5)
            deposits = meta["deposits_base"] * growth_factor * (1.0 + noise * 0.4)

            # Financial metrics logically tied to operational throughput & balance sheet
            # NIM influenced by CASA & delinquency
            casa_pct = min(48.0, max(34.0, 41.5 + (digital * 0.04) - (unit_shock * 2.0) + noise))
            nim = max(2.8, meta["nim_base"] + (casa_pct - 40.0) * 0.025 - (delinquency * 0.08) + noise * 0.1)
            
            # Monthly Net Interest Income (annualized advances * NIM / 12)
            nii = (advances * (nim / 100.0) / 12.0)
            
            # Non-interest income (fees, processing fees driven by loan approval and TAT efficiency)
            efficiency_mult = 1.0 - (tat / meta["tat_base"] - 1.0) * 0.12
            other_income = (nii * 0.32) * efficiency_mult * (approval_rate / meta["approval_base"]) * (1.0 + noise * 0.5)
            revenue = round(nii + other_income, 2)
            nii = round(nii, 2)

            # Cost to income ratio affected by digital adoption, CAC, and employee productivity
            cir_target = meta["cir_base"] - (digital - meta["digital_base"]) * 0.18 + (cac / meta["cac_base"] - 1.0) * 4.0 + (unit_shock * 2.5) + noise * 0.8
            cir = round(float(np.clip(cir_target, 28.0, 52.0)), 2)

            opex = round(revenue * (cir / 100.0), 2)
            operating_profit = round(revenue - opex, 2)

            # Credit loss provisions tied directly to delinquency rate and advances
            gnpa = round(float(np.clip(meta["gnpa_base"] + (delinquency - meta["delinq_base"]) * 0.65 + noise * 0.05, 0.2, 3.5)), 2)
            pcr = round(float(np.clip(75.5 - (gnpa - 1.2) * 4.0 + noise, 64.0, 85.0)), 2)
            nnpa = round(max(0.05, gnpa * (1.0 - pcr / 100.0)), 2)

            # Provisions calculated from NPA pipeline and delinquency
            provisions = round(max(100.0, (advances * (gnpa / 100.0) * 0.015) + (delinquency * 120.0) * (1.0 + unit_shock * 1.2) + noise * 50), 2)
            
            # Net profit after ~25.17% corporate tax rate
            tax_rate = 0.2517
            pbt = operating_profit - provisions
            net_profit = round(max(50.0, pbt * (1.0 - tax_rate)), 2)

            record = {
                "period": period,
                "business_unit": unit_name,
                "revenue": revenue,
                "net_interest_income": nii,
                "operating_expenses": opex,
                "operating_profit": operating_profit,
                "credit_loss_provisions": provisions,
                "net_profit": net_profit,
                "net_interest_margin": round(nim, 2),
                "cost_to_income_ratio": cir,
                "gross_npa_ratio": gnpa,
                "net_npa_ratio": nnpa,
                "provision_coverage_ratio": pcr,
                "casa_ratio": round(casa_pct, 2),
                "total_advances": round(advances, 2),
                "total_deposits": round(deposits, 2),
                "loan_processing_time": round(tat, 2),
                "loan_approval_rate": round(approval_rate, 2),
                "customer_acquisition_cost": round(cac, 2),
                "customer_complaints": round(complaints, 2),
                "customer_satisfaction": round(csat, 2),
                "employee_productivity": round(prod, 2),
                "employee_attrition": round(attrition, 2),
                "digital_adoption": round(digital, 2),
                "service_resolution_time": round(mttr, 2),
                "delinquency_rate": round(delinquency, 2),
                "is_synthetic": True,
            }
            period_unit_records[unit_name] = record
            all_records.append(record)

        # Build Consolidated summary row for this period
        tot_rev = sum(r["revenue"] for r in period_unit_records.values())
        tot_nii = sum(r["net_interest_income"] for r in period_unit_records.values())
        tot_opex = sum(r["operating_expenses"] for r in period_unit_records.values())
        tot_ppop = sum(r["operating_profit"] for r in period_unit_records.values())
        tot_prov = sum(r["credit_loss_provisions"] for r in period_unit_records.values())
        tot_pat = sum(r["net_profit"] for r in period_unit_records.values())
        tot_adv = sum(r["total_advances"] for r in period_unit_records.values())
        tot_dep = sum(r["total_deposits"] for r in period_unit_records.values())

        # Weighted averages for percentages
        cons_cir = round((tot_opex / tot_rev) * 100.0, 2)
        cons_nim = round(sum(r["net_interest_margin"] * (r["total_advances"] / tot_adv) for r in period_unit_records.values()), 2)
        cons_gnpa = round(sum(r["gross_npa_ratio"] * (r["total_advances"] / tot_adv) for r in period_unit_records.values()), 2)
        cons_nnpa = round(sum(r["net_npa_ratio"] * (r["total_advances"] / tot_adv) for r in period_unit_records.values()), 2)
        cons_pcr = round(sum(r["provision_coverage_ratio"] * (r["total_advances"] / tot_adv) for r in period_unit_records.values()), 2)
        cons_casa = round(sum(r["casa_ratio"] * (r["total_deposits"] / tot_dep) for r in period_unit_records.values()), 2)

        # Operational weighted averages
        cons_tat = round(sum(r["loan_processing_time"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_appr = round(sum(r["loan_approval_rate"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_cac = round(sum(r["customer_acquisition_cost"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_comp = round(sum(r["customer_complaints"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_csat = round(sum(r["customer_satisfaction"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_prod = round(sum(r["employee_productivity"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_attr = round(sum(r["employee_attrition"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_digi = round(sum(r["digital_adoption"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_mttr = round(sum(r["service_resolution_time"] * units_meta[u]["weight"] for u, r in period_unit_records.items()), 2)
        cons_delinq = round(sum(r["delinquency_rate"] * (r["total_advances"] / tot_adv) for u, r in period_unit_records.items()), 2)

        cons_record = {
            "period": period,
            "business_unit": "Consolidated",
            "revenue": round(tot_rev, 2),
            "net_interest_income": round(tot_nii, 2),
            "operating_expenses": round(tot_opex, 2),
            "operating_profit": round(tot_ppop, 2),
            "credit_loss_provisions": round(tot_prov, 2),
            "net_profit": round(tot_pat, 2),
            "net_interest_margin": cons_nim,
            "cost_to_income_ratio": cons_cir,
            "gross_npa_ratio": cons_gnpa,
            "net_npa_ratio": cons_nnpa,
            "provision_coverage_ratio": cons_pcr,
            "casa_ratio": cons_casa,
            "total_advances": round(tot_adv, 2),
            "total_deposits": round(tot_dep, 2),
            "loan_processing_time": cons_tat,
            "loan_approval_rate": cons_appr,
            "customer_acquisition_cost": cons_cac,
            "customer_complaints": cons_comp,
            "customer_satisfaction": cons_csat,
            "employee_productivity": cons_prod,
            "employee_attrition": cons_attr,
            "digital_adoption": cons_digi,
            "service_resolution_time": cons_mttr,
            "delinquency_rate": cons_delinq,
            "is_synthetic": True,
        }
        all_records.append(cons_record)

    return all_records

def generate_risk_alerts(records: list):
    """
    Scans the latest periods to identify statistically significant threshold breaches and Z-score anomalies.
    """
    df = pd.DataFrame(records)
    alerts = []
    
    # Analyze the latest period
    latest_period = df["period"].max()
    latest_df = df[df["period"] == latest_period]
    history_df = df[df["period"] < latest_period]

    monitored_kpis = [
        ("loan_processing_time", "Loan Processing Turnaround Time (TAT)", "higher", 4.5, 5.2, "Days"),
        ("delinquency_rate", "Early Delinquency Rate (30+ DPD)", "higher", 2.2, 2.6, "%"),
        ("customer_acquisition_cost", "Customer Acquisition Cost (CAC)", "higher", 2400.0, 2800.0, "₹"),
        ("cost_to_income_ratio", "Cost-to-Income Ratio (CIR)", "higher", 42.0, 44.5, "%"),
        ("service_resolution_time", "Mean Time to Resolve Grievances (MTTR)", "higher", 18.0, 22.0, "Hours"),
        ("customer_satisfaction", "Customer Satisfaction (CSAT)", "lower", 78.0, 72.0, "Score")
    ]

    for _, row in latest_df.iterrows():
        b_unit = row["business_unit"]
        unit_history = history_df[history_df["business_unit"] == b_unit]

        if len(unit_history) < 6:
            continue

        for kpi_code, kpi_name, bad_direction, warn_thresh, crit_thresh, unit_label in monitored_kpis:
            if kpi_code not in row:
                continue

            current_val = float(row[kpi_code])
            hist_series = unit_history[kpi_code].astype(float)
            hist_mean = float(hist_series.mean())
            hist_std = float(hist_series.std()) if hist_series.std() > 1e-4 else 1.0

            z_score = (current_val - hist_mean) / hist_std

            # Determine severity
            severity = None
            method = "Statistical Z-Score & Threshold Monitoring"

            if bad_direction == "higher":
                dev_pct = ((current_val - hist_mean) / hist_mean) * 100.0 if hist_mean != 0 else 0.0
                if z_score >= 2.2 or (b_unit == "Consolidated" and current_val >= crit_thresh):
                    severity = "high"
                elif z_score >= 1.5 or (b_unit == "Consolidated" and current_val >= warn_thresh):
                    severity = "medium"
            else: # bad direction is lower
                dev_pct = ((hist_mean - current_val) / hist_mean) * 100.0 if hist_mean != 0 else 0.0
                if z_score <= -2.2 or (b_unit == "Consolidated" and current_val <= crit_thresh):
                    severity = "high"
                elif z_score <= -1.5 or (b_unit == "Consolidated" and current_val <= warn_thresh):
                    severity = "medium"

            if severity:
                evidence = (
                    f"Observed {current_val:.2f} {unit_label} vs 35-month baseline mean {hist_mean:.2f} {unit_label} "
                    f"(Z-score: {z_score:+.2f}σ, Deviation: {dev_pct:+.1f}%). Historical standard deviation is {hist_std:.2f}."
                )
                
                recs = {
                    "loan_processing_time": "Audit mortgage & MSME sanction queue bottlenecks; review LOS API latency and credit committee escalation thresholds.",
                    "delinquency_rate": "Trigger early cure outreach on 30+ DPD accounts; tighten underwriting credit scoring on high-risk ticket bands.",
                    "customer_acquisition_cost": "Conduct channel attribution review across digital performance marketing and direct selling agents (DSA) commissions.",
                    "cost_to_income_ratio": "Freeze non-essential administrative expenditure; expedite branch automation and digital self-service migration.",
                    "service_resolution_time": "Increase tier-2 dispute resolution staffing; automate recurring charge-reversal workflows.",
                    "customer_satisfaction": "Investigate net promoter feedback in mobile app reviews and retail branch wait times."
                }

                alert = {
                    "period": latest_period,
                    "business_unit": b_unit,
                    "kpi_code": kpi_code,
                    "kpi_name": kpi_name,
                    "observed_value": round(current_val, 2),
                    "baseline_value": round(hist_mean, 2),
                    "deviation_pct": round(dev_pct, 2),
                    "severity": severity,
                    "detection_method": method,
                    "supporting_evidence": evidence,
                    "recommended_investigation": recs.get(kpi_code, "Review operational workflows and execute root-cause diagnostic.")
                }
                alerts.append(alert)

    return alerts

def init_db_and_seed():
    """
    Initializes database tables and populates with seed data if empty.
    Also exports synthetic CSV to data/ directory.
    """
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Check if KPI definitions exist
        kpi_count = db.query(KpiDefinition).count()
        if kpi_count == 0:
            for item in KPI_DEFINITIONS_DATA:
                kpi_def = KpiDefinition(**item)
                db.add(kpi_def)
            db.commit()

        # Check if monthly records exist
        record_count = db.query(MonthlyRecord).count()
        if record_count == 0:
            synthetic_records = generate_synthetic_data(seed=42)
            
            # Save CSV file in data/ folder for transparent auditing and sample download (if filesystem is writable)
            try:
                os.makedirs("data", exist_ok=True)
                df_export = pd.DataFrame(synthetic_records)
                df_export.to_csv("data/synthetic_hdfc_bank_36m.csv", index=False)

                # Generate sample template CSV
                template_df = df_export.head(3)
                template_df.to_csv("data/sample_upload_template.csv", index=False)
            except Exception as file_err:
                print(f"Notice: CSV export skipped on read-only filesystem: {file_err}")

            for rec in synthetic_records:
                db_record = MonthlyRecord(**rec)
                db.add(db_record)
            db.commit()

            # Seed risk alerts
            alerts_data = generate_risk_alerts(synthetic_records)
            for alert in alerts_data:
                db_alert = RiskAlertRecord(**alert)
                db.add(db_alert)
            db.commit()
            print(f"Successfully seeded {len(synthetic_records)} monthly records and {len(alerts_data)} risk alerts.")
        else:
            print(f"Database already contains {record_count} monthly records.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
