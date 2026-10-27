import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.seed_data import init_db_and_seed

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db_and_seed()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
