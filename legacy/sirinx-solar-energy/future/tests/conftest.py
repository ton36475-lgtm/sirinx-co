"""Pytest fixtures for Future Agentic OS tests."""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop_policy():
    return asyncio.DefaultEventLoopPolicy()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a fresh in-memory database for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Create all tables
    from apps.api.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(test_engine) -> AsyncGenerator[AsyncClient, None]:
    """Provide a test HTTP client with the FastAPI app."""
    from apps.api.main import app
    from apps.api.database import get_db
    from sqlalchemy.ext.asyncio import AsyncSession

    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sample_org(db_session: AsyncSession) -> dict:
    """Create and return a sample org."""
    from apps.api.models.org import Org
    from packages.core.utils import new_uuid

    org = Org(
        id=new_uuid(),
        name="Test Solar Co",
        slug="test-solar-co",
        industry="solar_energy",
        language="th",
        timezone="Asia/Bangkok",
        currency="THB",
        is_active=True,
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return {"id": org.id, "name": org.name, "slug": org.slug}


@pytest_asyncio.fixture
async def sample_task(db_session: AsyncSession, sample_org: dict) -> dict:
    """Create and return a sample task."""
    from apps.api.models.task import Task
    from packages.core.utils import new_uuid

    task = Task(
        id=new_uuid(),
        org_id=sample_org["id"],
        title="Test Task",
        description="A test task for unit tests",
        priority="normal",
        status="pending",
        input_data={"test": True},
        max_steps=5,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return {"id": task.id, "org_id": task.org_id, "title": task.title}
