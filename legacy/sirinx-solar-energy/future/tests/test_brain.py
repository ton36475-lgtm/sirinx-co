"""Tests for Company Brain functionality."""
import pytest

pytestmark = pytest.mark.asyncio


async def test_create_brain_entry_via_api(client, sample_org):
    """Test creating a brain entry via the REST API."""
    response = await client.post(
        "/api/v1/brain/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "org_id": sample_org["id"],
            "entry_type": "doctrine",
            "title": "Safety First Policy",
            "content": "All solar installations must follow IEC standards.",
            "tags": ["safety", "policy"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Safety First Policy"
    assert data["entry_type"] == "doctrine"
    assert "id" in data


async def test_list_brain_entries(client, sample_org):
    """Test listing brain entries for an org."""
    for i in range(3):
        await client.post(
            "/api/v1/brain/",
            headers={"X-Org-ID": sample_org["id"]},
            json={
                "org_id": sample_org["id"],
                "entry_type": "knowledge",
                "title": f"Knowledge {i}",
                "content": f"Content {i}",
                "tags": [],
            },
        )

    response = await client.get(
        "/api/v1/brain/",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 3


async def test_search_brain_entries(client, sample_org):
    """Test searching brain entries by text query."""
    await client.post(
        "/api/v1/brain/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "org_id": sample_org["id"],
            "entry_type": "knowledge",
            "title": "Solar Panel Maintenance Guide",
            "content": "Clean panels monthly for optimal performance.",
            "tags": ["maintenance"],
        },
    )

    response = await client.post(
        "/api/v1/brain/search",
        headers={"X-Org-ID": sample_org["id"]},
        json={"query": "Solar Panel"},
    )
    assert response.status_code == 200
    data = response.json()
    # BrainSearchResponse has "entries" key
    assert "entries" in data
    assert len(data["entries"]) >= 1


async def test_get_brain_entry(client, sample_org):
    """Test retrieving a specific brain entry by ID."""
    create_resp = await client.post(
        "/api/v1/brain/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "org_id": sample_org["id"],
            "entry_type": "knowledge",
            "title": "Get Me",
            "content": "Retrieve this entry",
            "tags": [],
        },
    )
    entry_id = create_resp.json()["id"]

    response = await client.get(
        f"/api/v1/brain/{entry_id}",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 200
    assert response.json()["id"] == entry_id
    assert response.json()["title"] == "Get Me"


async def test_get_brain_entry_not_found(client, sample_org):
    """Test 404 for non-existent brain entry."""
    response = await client.get(
        "/api/v1/brain/nonexistent-id",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 404


async def test_update_brain_entry(client, sample_org):
    """Test updating a brain entry."""
    create_resp = await client.post(
        "/api/v1/brain/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "org_id": sample_org["id"],
            "entry_type": "template",
            "title": "Old Title",
            "content": "Old content",
            "tags": [],
        },
    )
    entry_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/brain/{entry_id}",
        headers={"X-Org-ID": sample_org["id"]},
        json={"title": "New Title", "content": "Updated content"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"
    assert response.json()["content"] == "Updated content"


async def test_delete_brain_entry(client, sample_org):
    """Test deleting a brain entry returns 204 No Content."""
    create_resp = await client.post(
        "/api/v1/brain/",
        headers={"X-Org-ID": sample_org["id"]},
        json={
            "org_id": sample_org["id"],
            "entry_type": "knowledge",
            "title": "To Delete",
            "content": "Delete me",
            "tags": [],
        },
    )
    entry_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/brain/{entry_id}",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert response.status_code == 204

    # Confirm deletion
    get_resp = await client.get(
        f"/api/v1/brain/{entry_id}",
        headers={"X-Org-ID": sample_org["id"]},
    )
    assert get_resp.status_code == 404


async def test_brain_missing_org_header(client):
    """Test that brain endpoints require X-Org-ID header."""
    response = await client.get("/api/v1/brain/")
    assert response.status_code == 400


async def test_brain_manager_context_retrieval(db_session, sample_org):
    """Test BrainManager context retrieval for task planning."""
    from apps.api.services.knowledge.brain_manager import BrainManager

    manager = BrainManager(db_session)

    await manager.create_entry(
        org_id=sample_org["id"],
        entry_type="doctrine",
        title="Solar Installation Standard",
        content="Always verify roof load capacity before installation.",
    )
    await db_session.commit()

    context = await manager.get_context_for_task(
        org_id=sample_org["id"],
        task_description="solar installation planning",
        max_entries=5,
    )
    assert isinstance(context, list)
    # Should find at least the entry we created (matches "solar" keyword)
    assert len(context) >= 1
    assert any("Solar Installation Standard" in c for c in context)


async def test_brain_manager_search(db_session, sample_org):
    """Test BrainManager text search returns matching entries."""
    from apps.api.services.knowledge.brain_manager import BrainManager

    manager = BrainManager(db_session)
    await manager.create_entry(
        org_id=sample_org["id"],
        entry_type="knowledge",
        title="ROI Calculation Method",
        content="NPV formula for solar energy projects",
    )
    await db_session.commit()

    results = await manager.search(
        org_id=sample_org["id"],
        query="ROI",
        limit=5,
    )
    assert len(results) >= 1
    assert any("ROI" in e.title for e in results)


async def test_brain_manager_search_no_match(db_session, sample_org):
    """Test BrainManager search returns empty list when no match."""
    from apps.api.services.knowledge.brain_manager import BrainManager

    manager = BrainManager(db_session)
    results = await manager.search(
        org_id=sample_org["id"],
        query="zzz_no_match_xyz_12345",
        limit=5,
    )
    assert results == []


async def test_brain_manager_create_and_retrieve_entry(db_session, sample_org):
    """Test that create_entry returns an ID and the entry is retrievable."""
    from apps.api.services.knowledge.brain_manager import BrainManager
    from apps.api.models.brain import BrainEntry
    from sqlalchemy import select

    manager = BrainManager(db_session)
    entry_id = await manager.create_entry(
        org_id=sample_org["id"],
        entry_type="template",
        title="Proposal Template",
        content="Dear {client}, we are pleased to offer...",
        tags=["sales", "template"],
        source="manual",
    )
    await db_session.commit()

    assert entry_id is not None

    result = await db_session.execute(
        select(BrainEntry).where(BrainEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    assert entry is not None
    assert entry.title == "Proposal Template"
    assert entry.entry_type == "template"
    assert entry.org_id == sample_org["id"]
    assert entry.source == "manual"
