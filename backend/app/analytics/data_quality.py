import io
from typing import Dict, Any, List, Tuple
import pandas as pd
from app.schemas.schemas import DataQualityReport

COLUMN_SYNONYMS = {
    "period": ["period", "month", "date", "year_month", "time_period"],
    "business_unit": ["business_unit", "bu", "unit", "division", "segment"],
    "revenue": ["revenue", "total_revenue", "net_revenue", "topline"],
    "net_interest_income": ["net_interest_income", "nii"],
    "operating_expenses": ["operating_expenses", "opex", "operating_costs", "expenses"],
    "operating_profit": ["operating_profit", "ppop", "operating_income", "ebit"],
    "credit_loss_provisions": ["credit_loss_provisions", "provisions", "credit_provisions", "prov"],
    "net_profit": ["net_profit", "pat", "profit_after_tax", "bottom_line"],
    "net_interest_margin": ["net_interest_margin", "nim"],
    "cost_to_income_ratio": ["cost_to_income_ratio", "cir", "cost_income_ratio"],
    "gross_npa_ratio": ["gross_npa_ratio", "gnpa", "gross_npa"],
    "net_npa_ratio": ["net_npa_ratio", "nnpa", "net_npa"],
    "provision_coverage_ratio": ["provision_coverage_ratio", "pcr"],
    "casa_ratio": ["casa_ratio", "casa", "casa_pct"],
    "total_advances": ["total_advances", "advances", "loans", "loan_book"],
    "total_deposits": ["total_deposits", "deposits", "deposit_base"],
    "loan_processing_time": ["loan_processing_time", "tat", "turnaround_time", "processing_time"],
    "loan_approval_rate": ["loan_approval_rate", "approval_rate", "approval_pct"],
    "customer_acquisition_cost": ["customer_acquisition_cost", "cac", "acquisition_cost"],
    "customer_complaints": ["customer_complaints", "complaints", "grievances"],
    "customer_satisfaction": ["customer_satisfaction", "csat", "nps", "satisfaction_score"],
    "employee_productivity": ["employee_productivity", "productivity", "disbursal_per_fte"],
    "employee_attrition": ["employee_attrition", "attrition", "attrition_rate", "turnover"],
    "digital_adoption": ["digital_adoption", "digital_share", "digital_pct"],
    "service_resolution_time": ["service_resolution_time", "mttr", "resolution_hours"],
    "delinquency_rate": ["delinquency_rate", "delinquency", "dpd_rate", "dpd30"]
}

def normalize_column_name(col: str) -> str:
    cleaned = col.strip().lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "").replace("%", "pct").replace("₹", "")
    # Check exact canonical or exact synonym match
    for canonical, synonyms in COLUMN_SYNONYMS.items():
        if cleaned == canonical or cleaned in synonyms:
            return canonical
    return cleaned

def parse_and_validate_dataset(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, DataQualityReport]:
    """
    Parses CSV or Excel file, normalizes columns, checks for missing/duplicate data,
    and returns a clean DataFrame and DataQualityReport.
    """
    messages = []
    
    # 1. Parse file into DataFrame
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file.")
    except Exception as e:
        raise ValueError(f"Could not parse file: {str(e)}")

    total_rows = len(df)
    if total_rows == 0:
        raise ValueError("Uploaded file is empty.")

    # 2. Column mapping & deduplication
    original_cols = list(df.columns)
    mapped_cols = {col: normalize_column_name(col) for col in original_cols}
    df = df.rename(columns=mapped_cols)
    df = df.loc[:, ~df.columns.duplicated(keep="first")]

    required_keys = ["period", "business_unit", "revenue", "operating_profit", "loan_processing_time"]
    unmapped = [req for req in required_keys if req not in df.columns]

    if unmapped:
        messages.append(f"Missing mandatory columns: {', '.join(unmapped)}. Supported synonyms were checked.")

    # 3. Date normalization
    if "period" in df.columns:
        try:
            # Normalize to YYYY-MM
            df["period"] = pd.to_datetime(df["period"], errors="coerce").dt.strftime("%Y-%m")
            null_periods = df["period"].isnull().sum()
            if null_periods > 0:
                messages.append(f"{null_periods} rows had invalid date formats in 'period' column and were discarded.")
                df = df.dropna(subset=["period"])
        except Exception:
            messages.append("Could not standardize 'period' column to YYYY-MM format.")

    # 4. Business unit normalization
    if "business_unit" in df.columns:
        df["business_unit"] = df["business_unit"].fillna("Retail Banking").astype(str)

    # 5. Missing values check
    missing_count = int(df.isnull().sum().sum())
    if missing_count > 0:
        messages.append(f"Detected {missing_count} missing cell values. Numeric fields were imputed using forward-fill/median.")
        df = df.ffill().bfill().fillna(0.0)

    # 6. Duplicate check
    duplicate_rows = 0
    if "period" in df.columns and "business_unit" in df.columns:
        dup_mask = df.duplicated(subset=["period", "business_unit"], keep="last")
        duplicate_rows = int(dup_mask.sum())
        if duplicate_rows > 0:
            messages.append(f"Found {duplicate_rows} duplicate period+business_unit records; kept most recent occurrences.")
            df = df.drop_duplicates(subset=["period", "business_unit"], keep="last")

    # 7. Ensure numeric data types for metrics
    numeric_cols = [c for c in df.columns if c not in ["period", "business_unit", "is_synthetic"]]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    valid_rows = len(df)
    invalid_rows = total_rows - valid_rows

    report = DataQualityReport(
        total_rows=total_rows,
        valid_rows=valid_rows,
        invalid_rows=invalid_rows,
        missing_values_count=missing_count,
        duplicate_rows_count=duplicate_rows,
        column_mapping_success=len(unmapped) == 0,
        unmapped_columns=unmapped,
        validation_messages=messages if messages else ["All rows passed format and integrity validation successfully."],
        synthetic_notice="Uploaded data will be treated as independent prototype observations for analysis."
    )

    return df, report
