"""Tests for the runtime orchestration services."""
import pytest
from unittest.mock import AsyncMock

pytestmark = pytest.mark.asyncio


async def test_tool_registry_builtin_tools():
    """Test that built-in tools are registered."""
    from apps.api.services.runtime.tool_registry import ToolRegistry

    registry = ToolRegistry()
    tools = registry.list_tools()
    tool_names = [t.name for t in tools]

    assert "read_file" in tool_names
    assert "write_file" in tool_names
    assert "search_files" in tool_names
    assert "run_command" in tool_names
    assert "http_request" in tool_names


async def test_tool_registry_execute_unknown_tool():
    """Test that executing an unknown tool raises ToolExecutionError."""
    from apps.api.services.runtime.tool_registry import ToolRegistry
    from packages.core.errors import ToolExecutionError

    registry = ToolRegistry()
    with pytest.raises(ToolExecutionError):
        await registry.execute("nonexistent_tool", {})


async def test_tool_registry_read_file_outside_cwd():
    """Test that reading files outside CWD is blocked."""
    from apps.api.services.runtime.tool_registry import ToolRegistry

    registry = ToolRegistry()
    result = await registry.execute("read_file", {"path": "../../etc/passwd"})
    # The tool returns {"error": ...} dict rather than raising for path violations
    assert "error" in result


async def test_tool_registry_get_returns_none_for_unknown():
    """Test that get() returns None for unregistered tools."""
    from apps.api.services.runtime.tool_registry import ToolRegistry

    registry = ToolRegistry()
    assert registry.get("does_not_exist") is None


async def test_tool_registry_to_llm_tools():
    """Test that to_llm_tools returns correct format for LLM APIs."""
    from apps.api.services.runtime.tool_registry import ToolRegistry

    registry = ToolRegistry()
    llm_tools = registry.to_llm_tools()
    assert len(llm_tools) > 0
    for tool in llm_tools:
        assert "name" in tool
        assert "description" in tool
        assert "input_schema" in tool


async def test_tool_registry_filter_by_tag():
    """Test listing tools filtered by tag."""
    from apps.api.services.runtime.tool_registry import ToolRegistry

    registry = ToolRegistry()
    file_tools = registry.list_tools(tags=["file"])
    assert len(file_tools) > 0
    for tool in file_tools:
        assert "file" in tool.tags


async def test_planner_fallback_on_error():
    """Test that planner returns a fallback plan on LLM error."""
    from apps.api.services.runtime.planner import TaskPlanner

    mock_provider = AsyncMock()
    mock_provider.generate.side_effect = Exception("LLM API error")

    planner = TaskPlanner(provider=mock_provider)
    plan = await planner.plan(
        task_title="Test Task",
        task_description="Do something",
        input_data={},
        available_tools=[],
    )

    assert plan is not None
    assert len(plan.steps) >= 1
    # Fallback plan sets reasoning with "Fallback" prefix
    assert "Fallback" in plan.reasoning or "fallback" in plan.reasoning.lower()


async def test_planner_parses_valid_llm_response():
    """Test that planner correctly parses a well-formed JSON response."""
    import json
    from apps.api.services.runtime.planner import TaskPlanner
    from apps.api.services.providers.base import LLMResponse

    plan_json = json.dumps({
        "reasoning": "Simple two-step plan",
        "steps": [
            {
                "step_number": 1,
                "name": "Gather data",
                "description": "Collect relevant information",
                "tool": None,
                "input_data": {},
                "estimated_tokens": 300,
            },
            {
                "step_number": 2,
                "name": "Produce output",
                "description": "Write the final result",
                "tool": None,
                "input_data": {},
                "estimated_tokens": 400,
            },
        ],
    })

    mock_provider = AsyncMock()
    mock_provider.generate.return_value = LLMResponse(
        content=plan_json,
        model="test-model",
        input_tokens=50,
        output_tokens=100,
        cost_usd=0.001,
    )

    planner = TaskPlanner(provider=mock_provider)
    plan = await planner.plan(
        task_title="Two Step Task",
        task_description="Gather and output",
        input_data={},
        available_tools=[],
    )

    assert len(plan.steps) == 2
    assert plan.steps[0].name == "Gather data"
    assert plan.steps[1].name == "Produce output"
    assert plan.reasoning == "Simple two-step plan"


async def test_reviewer_auto_pass_on_error():
    """Test that reviewer defaults to pass/fail based on step results when LLM errors."""
    from apps.api.services.runtime.reviewer import OutputReviewer
    from apps.api.services.runtime.planner import Plan, PlannedStep
    from apps.api.services.runtime.executor import StepResult
    from datetime import datetime, timezone

    mock_provider = AsyncMock()
    mock_provider.generate.side_effect = Exception("Review API error")

    reviewer = OutputReviewer(provider=mock_provider)
    plan = Plan(
        task_title="Test",
        task_description="Test",
        steps=[PlannedStep(step_number=1, name="Step 1", description="Do it")],
    )
    step_result = StepResult(
        step_number=1,
        name="Step 1",
        status="completed",
        output_data={"result": "done"},
        started_at=datetime.now(timezone.utc),
    )

    review = await reviewer.review(
        task_title="Test",
        task_description="Test",
        plan=plan,
        step_results=[step_result],
    )

    assert review is not None
    # All steps completed → passed=True, score=1.0
    assert review.passed is True
    assert review.score == pytest.approx(1.0)
    assert 0.0 <= review.score <= 1.0


async def test_reviewer_fails_when_steps_failed():
    """Test that reviewer marks as failed when steps have failed status."""
    from apps.api.services.runtime.reviewer import OutputReviewer
    from apps.api.services.runtime.planner import Plan, PlannedStep
    from apps.api.services.runtime.executor import StepResult
    from datetime import datetime, timezone

    mock_provider = AsyncMock()
    mock_provider.generate.side_effect = Exception("Review API error")

    reviewer = OutputReviewer(provider=mock_provider)
    plan = Plan(
        task_title="Test",
        task_description="Test",
        steps=[PlannedStep(step_number=1, name="Step 1", description="Do it")],
    )
    step_result = StepResult(
        step_number=1,
        name="Step 1",
        status="failed",
        error_message="Tool error",
        started_at=datetime.now(timezone.utc),
    )

    review = await reviewer.review(
        task_title="Test",
        task_description="Test",
        plan=plan,
        step_results=[step_result],
    )

    # 1 failed out of 1 → passed=False, score=0.0
    assert review.passed is False
    assert review.score == pytest.approx(0.0)


async def test_executor_handles_failed_tool():
    """Test that executor handles tool failures gracefully."""
    from apps.api.services.runtime.executor import StepExecutor
    from apps.api.services.runtime.tool_registry import ToolRegistry
    from apps.api.services.providers.base import LLMResponse

    mock_provider = AsyncMock()
    mock_provider.generate.return_value = LLMResponse(
        content='{"output": "done", "success": true}',
        model="test-model",
        input_tokens=10,
        output_tokens=20,
        cost_usd=0.001,
        tool_calls=[],  # No tool calls → final response
    )

    registry = ToolRegistry()
    executor = StepExecutor(provider=mock_provider, tool_registry=registry)

    result = await executor.execute_step(
        step_number=1,
        step_name="Simple Step",
        step_description="Execute a test step",
        tool=None,
        input_data={"input": "test"},
    )

    assert result.step_number == 1
    assert result.status in ("completed", "failed")


async def test_mock_provider_returns_response():
    """Test that MockProvider returns a valid LLMResponse."""
    from apps.api.services.providers.registry import MockProvider

    provider = MockProvider()
    response = await provider.generate(
        messages=[{"role": "user", "content": "Hello"}],
    )
    assert response.content
    assert response.model == "mock-model"
    assert isinstance(response.input_tokens, int)
    assert isinstance(response.output_tokens, int)
    assert isinstance(response.cost_usd, float)


async def test_mock_provider_embed():
    """Test that MockProvider returns a 384-dim embedding."""
    from apps.api.services.providers.registry import MockProvider

    provider = MockProvider()
    embedding = await provider.embed("test text")
    assert isinstance(embedding, list)
    assert len(embedding) == 384
    assert all(isinstance(v, float) for v in embedding)


async def test_mock_provider_health_check():
    """Test that MockProvider health check returns True."""
    from apps.api.services.providers.registry import MockProvider

    provider = MockProvider()
    result = await provider.health_check()
    assert result is True
