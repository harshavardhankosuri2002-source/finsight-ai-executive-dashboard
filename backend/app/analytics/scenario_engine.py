from typing import Dict, Any, List
import pandas as pd
from app.schemas.schemas import ScenarioAssumptions, ScenarioMetricResult, ScenarioResponse

def run_strategic_scenario(
    baseline_record: Dict[str, Any],
    assumptions: ScenarioAssumptions
) -> ScenarioResponse:
    """
    Simulates executive what-if scenarios on bank financial performance
    using deterministic banking accounting relationships.
    """
    b = baseline_record
    
    # Baseline extracted values
    base_advances = float(b["total_advances"])
    base_deposits = float(b["total_deposits"])
    base_revenue = float(b["revenue"])
    base_nii = float(b["net_interest_income"])
    base_fee_income = max(100.0, base_revenue - base_nii)
    base_opex = float(b["operating_expenses"])
    base_ppop = float(b["operating_profit"])
    base_provisions = float(b["credit_loss_provisions"])
    base_pat = float(b["net_profit"])
    base_nim = float(b["net_interest_margin"])
    base_cir = float(b["cost_to_income_ratio"])
    base_delinq = float(b["delinquency_rate"])
    base_tat = float(b["loan_processing_time"])
    base_cac = float(b["customer_acquisition_cost"])

    # 1. Loan Book & Advances
    loan_growth_factor = 1.0 + (assumptions.loan_growth_pct / 100.0)
    proj_advances = round(base_advances * loan_growth_factor, 2)
    
    # 2. NIM & Net Interest Income
    # Delinquency stress slightly contracts yield; loan growth at scale has slight asset repricing
    nim_adjustment = (
        -(assumptions.delinquency_change_pct / 100.0) * 0.03
        + (assumptions.loan_growth_pct / 100.0) * 0.01
    )
    proj_nim = round(max(1.5, base_nim + nim_adjustment), 2)
    proj_nii = round((proj_advances * (proj_nim / 100.0) / 12.0), 2)

    # 3. Non-Interest Income (Processing fees boosted by lower TAT and higher loan disbursals)
    tat_speedup = -(assumptions.tat_change_pct / 100.0) # e.g. -10% TAT = +10% speedup
    fee_growth = (assumptions.loan_growth_pct * 0.40) + (tat_speedup * 0.15)
    proj_fee_income = round(base_fee_income * (1.0 + fee_growth / 100.0), 2)
    proj_revenue = round(proj_nii + proj_fee_income, 2)

    # 4. Operating Expenses
    # Influenced by direct Opex lever, CAC adjustments (marketing cost), and TAT efficiency
    cac_lever_effect = (assumptions.cac_change_pct / 100.0) * 0.08
    tat_efficiency_effect = (assumptions.tat_change_pct / 100.0) * 0.04
    net_opex_pct_shift = assumptions.opex_change_pct + (cac_lever_effect * 100.0) + (tat_efficiency_effect * 100.0)
    proj_opex = round(max(500.0, base_opex * (1.0 + net_opex_pct_shift / 100.0)), 2)

    # 5. Operating Profit (PPOP)
    proj_ppop = round(proj_revenue - proj_opex, 2)

    # 6. Credit Loss Provisions
    # Scales with loan book expansion and delinquency rate
    delinq_factor = 1.0 + (assumptions.delinquency_change_pct / 100.0) * 0.85
    advances_factor = 1.0 + (assumptions.loan_growth_pct / 100.0) * 0.50
    proj_provisions = round(max(50.0, base_provisions * delinq_factor * advances_factor), 2)

    # 7. Net Profit (PAT) after ~25.17% corporate tax rate
    proj_pbt = proj_ppop - proj_provisions
    tax_rate = 0.2517
    proj_pat = round(max(0.0, proj_pbt * (1.0 - tax_rate)), 2)

    # 8. Ratios
    proj_cir = round((proj_opex / proj_revenue) * 100.0, 2) if proj_revenue > 0 else 0.0
    proj_delinq = round(max(0.1, base_delinq * (1.0 + assumptions.delinquency_change_pct / 100.0)), 2)
    proj_tat = round(max(0.5, base_tat * (1.0 + assumptions.tat_change_pct / 100.0)), 2)
    proj_cac = round(max(100.0, base_cac * (1.0 + assumptions.cac_change_pct / 100.0)), 2)

    # Compile metric results
    def make_res(code: str, name: str, unit: str, base_val: float, proj_val: float):
        delta_abs = round(proj_val - base_val, 2)
        delta_pct = round(((proj_val - base_val) / base_val) * 100.0, 2) if base_val != 0 else 0.0
        return ScenarioMetricResult(
            metric_code=code,
            metric_name=name,
            unit=unit,
            baseline=round(base_val, 2),
            projected=round(proj_val, 2),
            delta_abs=delta_abs,
            delta_pct=delta_pct
        )

    metrics_res = {
        "revenue": make_res("revenue", "Total Revenue", "₹ Cr", base_revenue, proj_revenue),
        "net_interest_income": make_res("net_interest_income", "Net Interest Income", "₹ Cr", base_nii, proj_nii),
        "operating_expenses": make_res("operating_expenses", "Operating Expenses", "₹ Cr", base_opex, proj_opex),
        "operating_profit": make_res("operating_profit", "Operating Profit (PPOP)", "₹ Cr", base_ppop, proj_ppop),
        "credit_loss_provisions": make_res("credit_loss_provisions", "Credit Provisions", "₹ Cr", base_provisions, proj_provisions),
        "net_profit": make_res("net_profit", "Net Profit (PAT)", "₹ Cr", base_pat, proj_pat),
        "net_interest_margin": make_res("net_interest_margin", "Net Interest Margin", "%", base_nim, proj_nim),
        "cost_to_income_ratio": make_res("cost_to_income_ratio", "Cost-to-Income Ratio", "%", base_cir, proj_cir),
        "loan_processing_time": make_res("loan_processing_time", "Turnaround Time (TAT)", "Days", base_tat, proj_tat),
        "customer_acquisition_cost": make_res("customer_acquisition_cost", "Customer Acquisition Cost", "₹", base_cac, proj_cac),
        "delinquency_rate": make_res("delinquency_rate", "Delinquency Rate", "%", base_delinq, proj_delinq)
    }

    # Generate 5x5 Sensitivity Matrix: Loan Growth (-5% to +15%) vs Opex Adjustment (-10% to +10%)
    loan_growth_steps = [-5.0, 0.0, 5.0, 10.0, 15.0]
    opex_steps = [-10.0, -5.0, 0.0, 5.0, 10.0]
    sensitivity_table = []

    for lg in loan_growth_steps:
        row_dict = {"loan_growth_pct": lg}
        for op in opex_steps:
            # Quick simulate PAT
            adv_sim = base_advances * (1.0 + lg / 100.0)
            nii_sim = adv_sim * (base_nim / 100.0) / 12.0
            fee_sim = base_fee_income * (1.0 + (lg * 0.4) / 100.0)
            rev_sim = nii_sim + fee_sim
            op_sim = base_opex * (1.0 + op / 100.0)
            ppop_sim = rev_sim - op_sim
            prov_sim = base_provisions * (1.0 + lg * 0.5 / 100.0)
            pbt_sim = ppop_sim - prov_sim
            pat_sim = max(0.0, pbt_sim * (1.0 - 0.2517))
            row_dict[f"opex_{int(op):+d}%"] = round(pat_sim, 1)
        sensitivity_table.append(row_dict)

    methodology = [
        "Net Interest Income is computed from scaled loan advances using projected Net Interest Margin: NII = (Advances × NIM) / 12.",
        "Non-interest fee income dynamically scales with loan disbursement volume (+0.40% per 1% loan expansion) and loan processing turnaround time speedup (+0.15% per 1% TAT reduction).",
        "Operating Expenses combine the direct Opex lever, CAC marketing spend adjustments (8% elasticity), and operational TAT efficiency savings (4% elasticity).",
        "Credit loss provisions reflect loan book expansion and delinquency pipeline degradation (85% provision elasticity to 30+ DPD movements).",
        "Net Profit (PAT) is derived after factoring standard Indian effective banking corporate tax rates (25.17%)."
    ]

    limitations = (
        "HYPOTHETICAL SIMULATION DISCLAIMER: Projected figures are calculated using mechanical financial models and sensitivity elasticities. "
        "They do not account for external macroeconomic shocks, RBI policy rate shifts, competitor pricing wars, or capital adequacy constraints. "
        "Results must be treated as indicative scenario planning aids, not guaranteed financial forecasts."
    )

    return ScenarioResponse(
        scenario_name=assumptions.name,
        business_unit=assumptions.business_unit,
        baseline_period=b["period"],
        assumptions=assumptions,
        metrics=metrics_res,
        sensitivity_table=sensitivity_table,
        methodology_notes=methodology,
        limitations=limitations
    )
