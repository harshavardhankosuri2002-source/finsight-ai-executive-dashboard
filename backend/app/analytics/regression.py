import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from scipy import stats
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.stattools import durbin_watson
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

from app.schemas.schemas import DriverRankItem, RegressionDiagnostics

# Mapping of code to clean display names
KPI_NAMES = {
    "loan_processing_time": "Loan Processing Turnaround Time (TAT)",
    "loan_approval_rate": "Loan Approval Rate",
    "customer_acquisition_cost": "Customer Acquisition Cost (CAC)",
    "customer_complaints": "Customer Complaints Ratio",
    "customer_satisfaction": "Customer Satisfaction Score (CSAT)",
    "employee_productivity": "Employee Productivity (Disbursal/FTE)",
    "employee_attrition": "Employee Attrition Rate",
    "digital_adoption": "Digital Adoption Rate",
    "service_resolution_time": "Mean Time to Resolve Grievances (MTTR)",
    "delinquency_rate": "Early Delinquency Rate (30+ DPD)",
    "revenue": "Total Revenue",
    "net_interest_income": "Net Interest Income (NII)",
    "operating_expenses": "Operating Expenses (Opex)",
    "operating_profit": "Pre-Provision Operating Profit (PPOP)",
    "credit_loss_provisions": "Credit Loss Provisions",
    "net_profit": "Net Profit (PAT)",
    "net_interest_margin": "Net Interest Margin (NIM)",
    "cost_to_income_ratio": "Cost-to-Income Ratio (CIR)",
    "gross_npa_ratio": "Gross NPA Ratio",
    "net_npa_ratio": "Net NPA Ratio",
    "provision_coverage_ratio": "Provision Coverage Ratio",
    "casa_ratio": "CASA Deposit Ratio",
    "total_advances": "Total Advances",
    "total_deposits": "Total Deposits"
}

DEFAULT_OPERATIONAL_DRIVERS = [
    "loan_processing_time",
    "loan_approval_rate",
    "customer_acquisition_cost",
    "customer_complaints",
    "customer_satisfaction",
    "employee_productivity",
    "employee_attrition",
    "digital_adoption",
    "service_resolution_time",
    "delinquency_rate"
]

def calculate_correlations(
    df: pd.DataFrame,
    target_metric: str,
    candidate_drivers: List[str]
) -> Dict[str, Dict[str, float]]:
    """
    Computes Pearson and Spearman correlation coefficients and p-values.
    """
    results = {}
    y = df[target_metric].astype(float)

    for driver in candidate_drivers:
        if driver not in df.columns:
            continue
        x = df[driver].astype(float)
        
        # Pearson correlation
        p_corr, p_pval = stats.pearsonr(x, y)
        if np.isnan(p_corr):
            p_corr, p_pval = 0.0, 1.0

        # Spearman rank correlation
        s_corr, s_pval = stats.spearmanr(x, y)
        if np.isnan(s_corr):
            s_corr, s_pval = 0.0, 1.0

        results[driver] = {
            "pearson_corr": float(p_corr),
            "pearson_p_value": float(p_pval),
            "spearman_corr": float(s_corr),
            "spearman_p_value": float(s_pval)
        }
    return results

def calculate_optimal_lags(
    df: pd.DataFrame,
    target_metric: str,
    candidate_drivers: List[str],
    max_lag: int = 2
) -> Dict[str, int]:
    """
    Evaluates optimal lag order (0, 1, or 2 months) by maximizing absolute cross-correlation.
    """
    optimal_lags = {}
    y = df[target_metric].astype(float).values

    for driver in candidate_drivers:
        if driver not in df.columns:
            optimal_lags[driver] = 0
            continue

        best_lag = 0
        best_abs_corr = 0.0

        for lag in range(max_lag + 1):
            if lag == 0:
                x_lag = df[driver].astype(float).values
                y_trim = y
            else:
                x_lag = df[driver].astype(float).values[:-lag]
                y_trim = y[lag:]

            if len(x_lag) > 5:
                corr, _ = stats.pearsonr(x_lag, y_trim)
                if not np.isnan(corr) and abs(corr) > best_abs_corr:
                    best_abs_corr = abs(corr)
                    best_lag = lag

        optimal_lags[driver] = best_lag

    return optimal_lags

def run_multiple_regression_analysis(
    df: pd.DataFrame,
    target_metric: str = "operating_profit",
    candidate_drivers: Optional[List[str]] = None,
    test_size: float = 0.25,
    include_lags: bool = True
) -> Dict[str, Any]:
    """
    Executes multiple linear regression with model diagnostics, standardized betas,
    VIF multicollinearity tests, and train/test validation.
    """
    if candidate_drivers is None or len(candidate_drivers) == 0:
        candidate_drivers = [d for d in DEFAULT_OPERATIONAL_DRIVERS if d != target_metric]

    # Filter available columns
    available_drivers = [d for d in candidate_drivers if d in df.columns]
    if len(available_drivers) == 0:
        raise ValueError("No candidate driver columns found in dataset.")

    # Calculate optimal lags if requested
    optimal_lags = calculate_optimal_lags(df, target_metric, available_drivers) if include_lags else {d: 0 for d in available_drivers}

    # Build regression matrix with applied lags where optimal
    reg_df = df[[target_metric] + available_drivers].copy()
    for driver in available_drivers:
        lag = optimal_lags.get(driver, 0)
        if lag > 0:
            reg_df[driver] = reg_df[driver].shift(lag)

    reg_df = reg_df.dropna().reset_index(drop=True)
    n_samples = len(reg_df)

    if n_samples < 10:
        raise ValueError("Insufficient data points for multiple regression analysis (minimum 10 rows required).")

    # Correlations
    corr_dict = calculate_correlations(reg_df, target_metric, available_drivers)

    X = reg_df[available_drivers].astype(float)
    y = reg_df[target_metric].astype(float)

    # Standardize X and y for comparable standardized beta coefficients
    X_std = (X - X.mean()) / (X.std().replace(0, 1.0))
    y_std = (y - y.mean()) / (y.std() if y.std() > 0 else 1.0)

    # Train/Test Split (Sequential temporal split to prevent lookahead leakage)
    split_idx = int(n_samples * (1.0 - test_size))
    X_train, X_test = X_std.iloc[:split_idx], X_std.iloc[split_idx:]
    y_train, y_test = y_std.iloc[:split_idx], y_std.iloc[split_idx:]

    # Fit OLS using Statsmodels on training data
    X_train_const = sm.add_constant(X_train)
    # If perfect collinearity, sm handles or we use pinv
    ols_model = sm.OLS(y_train, X_train_const).fit()

    # Out-of-sample evaluation on test set
    if len(X_test) > 0:
        X_test_const = sm.add_constant(X_test, has_constant='add')
        y_test_pred = ols_model.predict(X_test_const)
        test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
        test_r2 = float(r2_score(y_test, y_test_pred))
    else:
        test_rmse = 0.0
        test_r2 = float(ols_model.rsquared)

    # Full fit for robust model parameter reporting
    X_full_const = sm.add_constant(X_std)
    full_model = sm.OLS(y_std, X_full_const).fit()

    # Compute VIF (Variance Inflation Factor) to monitor multicollinearity
    vif_dict = {}
    for i, col in enumerate(available_drivers):
        try:
            val = variance_inflation_factor(X_std.values, i)
            vif_dict[col] = float(np.clip(val, 1.0, 99.9))
        except Exception:
            vif_dict[col] = 1.0

    # Fit Random Forest for non-linear importance scoring
    rf = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=4)
    rf.fit(X, y)
    rf_importances = dict(zip(available_drivers, [float(v) for v in rf.feature_importances_]))

    # Compile driver rankings
    ranked_drivers: List[DriverRankItem] = []
    
    for driver in available_drivers:
        # Get regression beta and p-value from model
        beta = float(full_model.params.get(driver, 0.0))
        p_val = float(full_model.pvalues.get(driver, 1.0))
        
        c_info = corr_dict.get(driver, {"pearson_corr": 0.0, "spearman_corr": 0.0, "pearson_p_value": 1.0})
        p_corr = c_info["pearson_corr"]
        s_corr = c_info["spearman_corr"]
        corr_pval = c_info["pearson_p_value"]
        
        # Importance score combines standardized beta magnitude and RF feature importance
        imp_score = round(float((abs(beta) * 0.6 + rf_importances.get(driver, 0.0) * 0.4) * 100), 2)
        vif_val = round(vif_dict.get(driver, 1.0), 2)
        opt_lag = optimal_lags.get(driver, 0)

        # Relationship verbal summary
        dir_str = "Positive" if beta > 0 else "Negative"
        strength = "Strong" if abs(beta) >= 0.35 else ("Moderate" if abs(beta) >= 0.15 else "Weak")
        stat_sig = "Statistically Significant (p < 0.05)" if p_val < 0.05 else "Inconclusive (p >= 0.05)"
        
        summary = (
            f"{strength} {dir_str.lower()} association (β = {beta:+.2f}, p = {p_val:.3f}). "
            f"A 1σ improvement in {KPI_NAMES.get(driver, driver)} is associated with a "
            f"{abs(beta):.2f}σ {'increase' if beta > 0 else 'decrease'} in {KPI_NAMES.get(target_metric, target_metric)}."
        )
        if opt_lag > 0:
            summary += f" Strongest effect manifests with a {opt_lag}-month transmission lag."

        ranked_drivers.append(DriverRankItem(
            kpi_code=driver,
            kpi_name=KPI_NAMES.get(driver, driver),
            pearson_corr=round(p_corr, 3),
            spearman_corr=round(s_corr, 3),
            corr_p_value=round(corr_pval, 4),
            standardized_beta=round(beta, 3),
            regression_p_value=round(p_val, 4),
            importance_score=imp_score,
            vif=vif_val,
            optimal_lag_months=opt_lag,
            relationship_direction=dir_str,
            association_summary=summary
        ))

    # Sort drivers by absolute standardized impact & importance
    ranked_drivers.sort(key=lambda x: (abs(x.standardized_beta), x.importance_score), reverse=True)

    # Diagnostics
    dw = float(durbin_watson(full_model.resid))
    diagnostics = RegressionDiagnostics(
        r_squared=round(float(full_model.rsquared), 3),
        adj_r_squared=round(float(full_model.rsquared_adj), 3),
        f_statistic=round(float(full_model.fvalue), 2) if not np.isnan(full_model.fvalue) else 0.0,
        f_pvalue=round(float(full_model.f_pvalue), 4) if not np.isnan(full_model.f_pvalue) else 1.0,
        durbin_watson=round(dw, 2),
        aic=round(float(full_model.aic), 1),
        bic=round(float(full_model.bic), 1),
        train_samples=len(X_train),
        test_samples=len(X_test),
        test_rmse=round(test_rmse, 3),
        test_r_squared=round(test_r2, 3)
    )

    # SHAP-like attribution breakdown
    shap_breakdown = [
        {
            "kpi_code": d.kpi_code,
            "kpi_name": d.kpi_name,
            "mean_abs_impact": round(float(abs(d.standardized_beta)), 3),
            "rf_importance": round(rf_importances.get(d.kpi_code, 0.0), 3)
        }
        for d in ranked_drivers
    ]

    interpretation_notes = [
        f"The model explains {diagnostics.r_squared * 100:.1f}% of the variance in {KPI_NAMES.get(target_metric, target_metric)} (Adjusted R²: {diagnostics.adj_r_squared * 100:.1f}%).",
        f"Durbin-Watson statistic is {diagnostics.durbin_watson:.2f} (values close to 2.0 indicate absence of serial residual autocorrelation).",
        f"Top positive driver: {ranked_drivers[0].kpi_name if ranked_drivers else 'N/A'} (Impact β: {ranked_drivers[0].standardized_beta if ranked_drivers else 0:+.2f}).",
        f"Out-of-sample test R² on reserved 25% test partition: {diagnostics.test_r_squared * 100:.1f}%."
    ]

    disclaimer = (
        "STATISTICAL GOVERNANCE NOTICE: Statistical association and regression coefficients reflect observational co-movements "
        "and do not prove causal relationships. Unobserved macroeconomic factors, rate cycle shifts, and regulatory changes "
        "may influence outcomes. All models are trained on simulated bank operational data."
    )

    return {
        "target_metric": target_metric,
        "target_name": KPI_NAMES.get(target_metric, target_metric),
        "sample_size": n_samples,
        "ranked_drivers": ranked_drivers,
        "diagnostics": diagnostics,
        "shap_feature_importance": shap_breakdown,
        "interpretation_notes": interpretation_notes,
        "statistical_disclaimer": disclaimer
    }
