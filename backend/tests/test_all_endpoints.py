import io
import pytest

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["total_records"] >= 36

def test_dashboard_summary_consolidated(client):
    response = client.get("/api/dashboard/summary?business_unit=Consolidated")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "revenue" in data["kpis"]
    assert "operating_profit" in data["kpis"]
    assert "net_interest_margin" in data["kpis"]
    assert "cost_to_income_ratio" in data["kpis"]
    assert data["kpis"]["revenue"]["current_value"] > 0
    assert len(data["recent_trend"]) >= 6

def test_dashboard_summary_retail(client):
    response = client.get("/api/dashboard/summary?business_unit=Retail Banking")
    assert response.status_code == 200
    data = response.json()
    assert data["business_unit"] == "Retail Banking"
    assert data["kpis"]["loan_processing_time"]["current_value"] > 0

def test_kpis_list_and_trends(client):
    # List
    response = client.get("/api/kpis")
    assert response.status_code == 200
    kpis = response.json()
    assert len(kpis) >= 15
    codes = [k["code"] for k in kpis]
    assert "loan_processing_time" in codes
    assert "operating_profit" in codes

    # Trends
    resp_trend = client.get("/api/kpis/trends?kpis=revenue,operating_profit,loan_processing_time&business_unit=Consolidated")
    assert resp_trend.status_code == 200
    t_data = resp_trend.json()
    assert len(t_data["points"]) >= 36
    assert "revenue_ma3" in t_data["points"][-1]

def test_driver_analysis_regression(client):
    payload = {
        "target_metric": "operating_profit",
        "candidate_drivers": [
            "loan_processing_time",
            "customer_acquisition_cost",
            "digital_adoption",
            "delinquency_rate"
        ],
        "business_unit": "Consolidated",
        "include_lags": True
    }
    response = client.post("/api/analysis/drivers", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_metric"] == "operating_profit"
    assert len(data["ranked_drivers"]) == 4
    assert "diagnostics" in data
    assert 0.0 <= data["diagnostics"]["r_squared"] <= 1.0
    assert data["diagnostics"]["durbin_watson"] > 0
    # Check that driver items have required statistics
    top_driver = data["ranked_drivers"][0]
    assert "standardized_beta" in top_driver
    assert "pearson_corr" in top_driver
    assert "vif" in top_driver
    assert "association_summary" in top_driver

def test_risk_monitoring_alerts(client):
    response = client.get("/api/risks")
    assert response.status_code == 200
    data = response.json()
    assert data["total_alerts"] > 0
    assert len(data["alerts"]) > 0
    first_alert = data["alerts"][0]
    assert first_alert["severity"] in ["high", "medium", "low"]
    assert first_alert["observed_value"] > 0
    assert "supporting_evidence" in first_alert
    assert "recommended_investigation" in first_alert

def test_ai_assistant_grounding_and_fallback(client):
    # Operating profit question
    payload = {
        "message": "Why did operating profit decline and what are the key drivers?",
        "business_unit": "Consolidated"
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["response"]) > 50
    # Must contain structured executive tags
    assert "[OBSERVED FACT]" in data["response"]
    assert "[STATISTICAL ASSOCIATION]" in data["response"]
    assert "[HYPOTHESIS]" in data["response"]
    assert "[ESTIMATE]" in data["response"]
    assert "disclaimer" in data

def test_scenario_planner_simulation(client):
    payload = {
        "business_unit": "Consolidated",
        "name": "Cost Rationalization & Efficiency Push",
        "opex_change_pct": -5.0,
        "loan_growth_pct": 8.0,
        "tat_change_pct": -10.0,
        "cac_change_pct": -8.0,
        "delinquency_change_pct": 5.0
    }
    response = client.post("/api/scenarios/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    metrics = data["metrics"]
    assert "net_profit" in metrics
    assert "cost_to_income_ratio" in metrics
    # Verify projected opex decreased
    assert metrics["operating_expenses"]["projected"] < metrics["operating_expenses"]["baseline"]
    # Check 5x5 sensitivity matrix
    assert len(data["sensitivity_table"]) == 5
    assert len(data["methodology_notes"]) > 0
    assert "limitations" in data

def test_data_upload_validation(client):
    # Upload sample CSV
    csv_content = (
        "period,business_unit,revenue,net_interest_income,operating_expenses,operating_profit,"
        "credit_loss_provisions,net_profit,net_interest_margin,cost_to_income_ratio,gross_npa_ratio,"
        "net_npa_ratio,provision_coverage_ratio,casa_ratio,total_advances,total_deposits,"
        "loan_processing_time,loan_approval_rate,customer_acquisition_cost,customer_complaints,"
        "customer_satisfaction,employee_productivity,employee_attrition,digital_adoption,"
        "service_resolution_time,delinquency_rate\n"
        "2026-10,Retail Banking,15500.0,10200.0,6100.0,9400.0,1400.0,5980.0,4.12,39.3,1.22,0.30,75.4,41.8,1350000.0,1450000.0,3.4,72.5,1900.0,4.8,85.2,56.0,16.8,89.5,12.5,1.7\n"
    )
    files = {"file": ("test_upload.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["valid_rows"] == 1
    assert data["column_mapping_success"] is True

def test_executive_report_generation(client):
    response = client.get("/api/reports/executive?business_unit=Consolidated")
    assert response.status_code == 200
    data = response.json()
    assert "executive_summary" in data
    assert len(data["financial_highlights"]) >= 3
    assert len(data["actionable_recommendations"]) >= 3
