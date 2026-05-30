"""Tests for task management endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_task(client: AsyncClient, sample_org: dict):
    """Test creating a task."""
    response = await client.post(
        "/api/v1/tasks/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "title": "Generate Solar Proposal",
            "description": "Create proposal for 100kWp system",
            "org_id": sample_org["id"],
            "priority": "high",
            "input_data": {"client": "Factory A", "consumption_kwh": 50000},
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Generate Solar Proposal"
    assert data["org_id"] == sample_org["id"]
    assert data["status"] == "pending"


async def test_list_tasks(client: AsyncClient, sample_org: dict):
    """Test listing tasks for an org."""
    for i in range(3):
        await client.post(
            "/api/v1/tasks/",
            headers={"X-Org-ID": sample_org["id"]},
            json={
                "title": f"Task {i}",
                "org_id": sample_org["id"],
                "input_data": {},
            },
        )

    response = await client.get(
        "/api/v1/tasks/",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 3


async def test_get_task(client: AsyncClient, sample_task: dict):
    """Test getting a specific task — requires X-Org-ID header."""
    response = await client.get(
        f"/api/v1/tasks/{sample_task['id']}",
        headers={"X-Org-ID": sample_task["org_id"]},
    )
    assert response.status_code == 200
    assert response.json()["id"] == sample_task["id"]


async def test_update_task(client: AsyncClient, sample_task: dict):
    """Test updating a task."""
    response = await client.put(
        f"/api/v1/tasks/{sample_task['id']}",
        headers={"X-Org-ID": sample_task["org_id"]},
        json={"title": "Updated Task Title", "priority": "urgent"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task Title"
    assert response.json()["priority"] == "urgent"


async def test_task_not_found(client: AsyncClient, sample_org: dict):
    """Test 404 for non-existent task."""
    response = await client.get(
        "/api/v1/tasks/nonexistent",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 404


async def test_task_missing_org_header(client: AsyncClient):
    """Test 400 when X-Org-ID header is missing."""
    response = await client.get("/api/v1/tasks/")
    assert response.status_code == 400


async def test_list_task_runs(client: AsyncClient, sample_task: dict):
    """Test listing runs for a task (should be empty initially)."""
    response = await client.get(
        f"/api/v1/tasks/{sample_task['id']}/runs",
        headers={"X-Org-ID": sample_task["org_id"]},
    )
    assert response.status_code == 200
    data = response.json()
    # Router returns PaginatedResponse
    assert "items" in data
    assert data["total"] == 0


async def test_task_priority_filter(client: AsyncClient, sample_org: dict):
    """Test filtering tasks by priority."""
    await client.post(
        "/api/v1/tasks/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "title": "Urgent Task",
            "org_id": sample_org["id"],
            "priority": "urgent",
            "input_data": {},
        },
    )
    await client.post(
        "/api/v1/tasks/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "title": "Normal Task",
            "org_id": sample_org["id"],
            "priority": "normal",
            "input_data": {},
        },
    )

    response = await client.get(
        "/api/v1/tasks/",
        headers={"X-Org-ID": sample_org["id"]},
        params={"priority": "urgent"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["priority"] == "urgent"


async def test_cancel_task(client: AsyncClient, sample_org: dict):
    """Test cancelling a task that has no runs (hard delete path)."""
    create_resp = await client.post(
        "/api/v1/tasks/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "title": "To Cancel",
            "org_id": sample_org["id"],
            "input_data": {},
        },
    )
    task_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/tasks/{task_id}",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 204

    # Task should now be gone (hard deleted)
    get_resp = await client.get(
        f"/api/v1/tasks/{task_id}",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert get_resp.status_code == 404


async def test_run_task(client: AsyncClient, sample_task: dict):
    """Test creating a TaskRun via POST /{task_id}/run."""
    response = await client.post(
        f"/api/v1/tasks/{sample_task['id']}/run",
        headers={"X-Org-ID": sample_task["org_id"]},
        json={"triggered_by": "test-suite"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["task_id"] == sample_task["id"]
    assert data["status"] == "pending"
