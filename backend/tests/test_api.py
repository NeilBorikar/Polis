import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.base import Base, engine

# Setup the TestClient
client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Ensure the database is initialized before running tests.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up can be added here if using a separate test DB,
    # but for simple verification of SQLite we can let it be.

def test_root_endpoint():
    """
    Test that the root endpoint is accessible and returns welcome message.
    """
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert "Welcome" in json_data["message"]
    assert json_data["documentation"] == "/docs"

def test_health_endpoints():
    """
    Test the ALB health and readiness probes.
    """
    # Liveness check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

    # Readiness check (makes DB query)
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["database"] == "connected"

def test_get_metrics_auto_seeds():
    """
    Test that retrieving city metrics auto-seeds default dashboard data.
    """
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    
    # Assert JSON response conforms to Pydantic schemas and has correct properties
    assert "id" in data
    assert "smartBus" in data
    assert "streetLight" in data
    assert "cctv" in data
    assert data["livabilityIndex"] == 93.0
    assert data["smartBus"]["total"] == 5

def test_issues_crud_flow():
    """
    Test creating, reading, updating and resolving issues.
    """
    # 1. Create a new issue
    new_issue_data = {
        "category": "Pothole",
        "description": "Deep pothole in sector 4",
        "coordinates": [1.5, 0.5, -2.5]
    }
    create_response = client.post("/api/issues", json=new_issue_data)
    assert create_response.status_code == 201
    created_issue = create_response.json()
    assert created_issue["id"] is not None
    assert created_issue["category"] == "Pothole"
    assert created_issue["status"] == "New"
    assert created_issue["verified"] is False
    assert created_issue["coordinates"] == [1.5, 0.5, -2.5]

    issue_id = created_issue["id"]

    # 2. Get the created issue by ID
    get_response = client.get(f"/api/issues/{issue_id}")
    assert get_response.status_code == 200
    assert get_response.json()["description"] == "Deep pothole in sector 4"

    # 3. Update status of the issue to 'In Progress'
    status_response = client.patch(f"/api/issues/{issue_id}/status?status_str=In+Progress")
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "In Progress"
    assert status_response.json()["verified"] is False

    # 4. Resolve the issue
    resolve_response = client.post(f"/api/issues/{issue_id}/resolve")
    assert resolve_response.status_code == 200
    assert resolve_response.json()["status"] == "Resolved"
    assert resolve_response.json()["verified"] is True
