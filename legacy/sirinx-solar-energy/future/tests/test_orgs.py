"""Tests for organization CRUD endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_org(client: AsyncClient):
    """Test creating a new organization."""
    response = await client.post("/api/v1/orgs/", json={
        "name": "SIRINX Solar",
        "industry": "solar_energy",
        "language": "th",
        "timezone": "Asia/Bangkok",
        "currency": "THB",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "SIRINX Solar"
    assert data["slug"] == "sirinx-solar"
    assert "id" in data


async def test_create_org_auto_slug(client: AsyncClient):
    """Test that slug is auto-generated from name."""
    response = await client.post("/api/v1/orgs/", json={
        "name": "My Solar Company",
        "industry": "solar_energy",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "my-solar-company"


async def test_list_orgs(client: AsyncClient):
    """Test listing organizations."""
    # Create two orgs
    await client.post("/api/v1/orgs/", json={"name": "Org One", "industry": "solar_energy"})
    await client.post("/api/v1/orgs/", json={"name": "Org Two", "industry": "manufacturing"})

    response = await client.get("/api/v1/orgs/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 2


async def test_get_org(client: AsyncClient):
    """Test getting a specific org."""
    create_resp = await client.post("/api/v1/orgs/", json={"name": "Get Test Org", "industry": "retail"})
    org_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/orgs/{org_id}")
    assert response.status_code == 200
    assert response.json()["id"] == org_id


async def test_get_org_not_found(client: AsyncClient):
    """Test 404 for non-existent org."""
    response = await client.get("/api/v1/orgs/nonexistent-id")
    assert response.status_code == 404


async def test_update_org(client: AsyncClient):
    """Test updating an org."""
    create_resp = await client.post("/api/v1/orgs/", json={"name": "Update Test", "industry": "finance"})
    org_id = create_resp.json()["id"]

    response = await client.put(f"/api/v1/orgs/{org_id}", json={"name": "Updated Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


async def test_delete_org_soft(client: AsyncClient):
    """Test soft delete (deactivation) of org — returns 204 No Content."""
    create_resp = await client.post("/api/v1/orgs/", json={"name": "Delete Me", "industry": "other"})
    org_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/orgs/{org_id}")
    assert response.status_code == 204

    # Should no longer appear in active list (is_active=False → 404)
    get_resp = await client.get(f"/api/v1/orgs/{org_id}")
    assert get_resp.status_code == 404


async def test_duplicate_slug_rejected(client: AsyncClient):
    """Test that duplicate slugs are rejected with 409 Conflict."""
    await client.post("/api/v1/orgs/", json={
        "name": "Duplicate Slug",
        "slug": "unique-slug",
        "industry": "other",
    })
    response = await client.post("/api/v1/orgs/", json={
        "name": "Another Org",
        "slug": "unique-slug",
        "industry": "other",
    })
    assert response.status_code in (400, 409, 422)


async def test_list_orgs_pagination(client: AsyncClient):
    """Test listing orgs with pagination params."""
    for i in range(5):
        await client.post("/api/v1/orgs/", json={
            "name": f"Paginated Org {i}",
            "industry": "other",
        })

    response = await client.get("/api/v1/orgs/?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 2
    assert data["page"] == 1
    assert data["page_size"] == 2


async def test_create_org_default_language(client: AsyncClient):
    """Test that org defaults to Thai language."""
    response = await client.post("/api/v1/orgs/", json={
        "name": "Default Lang Org",
        "industry": "solar_energy",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["language"] == "th"
    assert data["currency"] == "THB"
