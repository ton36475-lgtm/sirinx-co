"""Execute individual task steps with tools."""
from __future__ import annotations
import json
import logging
from typing import TYPE_CHECKING, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

if TYPE_CHECKING:
    from apps.api.services.providers.base import BaseLLMProvider
    from apps.api.services.runtime.tool_registry import ToolRegistry

logger = logging.getLogger(__name__)

@dataclass
class StepResult:
    step_number: int
    name: str
    status: str  # completed, failed
    output_data: dict = field(default_factory=dict)
    error_message: str | None = None
    tokens_used: int = 0
    cost_usd: float = 0.0
    tool_calls: list[dict] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None

class StepExecutor:
    """Executes a single step using an LLM + tools (agent loop)."""

    SYSTEM_PROMPT = """You are an AI assistant executing a specific task step.
Use the available tools when needed. Be precise and focused on this single step.

When you have completed the step, provide your final answer/output.
If a tool returns an error, handle it gracefully and try an alternative approach.

Output format: After all tool calls, provide a JSON summary:
{"output": "the result", "success": true/false, "notes": "any important observations"}
"""

    def __init__(self, provider: "BaseLLMProvider", tool_registry: "ToolRegistry"):
        self.provider = provider
        self.tool_registry = tool_registry

    async def execute_step(
        self,
        step_number: int,
        step_name: str,
        step_description: str,
        tool: str | None,
        input_data: dict,
        task_context: str = "",
        max_iterations: int = 5,
    ) -> StepResult:
        result = StepResult(step_number=step_number, name=step_name, status="running")

        # Build tool list for LLM
        if tool:
            tool_def = self.tool_registry.get(tool)
            tools = [tool_def.to_llm_tool()] if tool_def else self.tool_registry.to_llm_tools()
        else:
            tools = self.tool_registry.to_llm_tools()

        messages = [
            {
                "role": "user",
                "content": f"""Task Context: {task_context}

Step {step_number}: {step_name}
Description: {step_description}
Input: {json.dumps(input_data, indent=2)}

Execute this step now."""
            }
        ]

        total_tokens = 0
        total_cost = 0.0

        try:
            # Agent loop
            for iteration in range(max_iterations):
                response = await self.provider.generate(
                    system=self.SYSTEM_PROMPT,
                    messages=messages,
                    tools=tools,
                    temperature=0.1,
                    max_tokens=4096,
                )

                total_tokens += response.input_tokens + response.output_tokens
                total_cost += response.cost_usd

                # Handle tool calls
                if response.tool_calls:
                    messages.append({"role": "assistant", "content": response.content, "tool_calls": response.tool_calls})
                    tool_results = []
                    for tc in response.tool_calls:
                        tool_result = await self.tool_registry.execute(tc["name"], tc.get("input", {}))
                        tool_results.append({
                            "tool_call_id": tc.get("id", tc["name"]),
                            "role": "tool",
                            "name": tc["name"],
                            "content": json.dumps(tool_result),
                        })
                        result.tool_calls.append({"tool": tc["name"], "input": tc.get("input", {}), "output": tool_result})
                    messages.extend(tool_results)
                else:
                    # Final response
                    output = self._parse_output(response.content)
                    result.status = "completed"
                    result.output_data = output
                    result.tokens_used = total_tokens
                    result.cost_usd = total_cost
                    result.completed_at = datetime.now(timezone.utc)
                    return result

            # Max iterations reached
            result.status = "completed"
            result.output_data = {"output": "Max iterations reached", "partial": True}
            result.tokens_used = total_tokens
            result.cost_usd = total_cost
            result.completed_at = datetime.now(timezone.utc)

        except Exception as e:
            logger.error(f"Step {step_number} execution failed: {e}")
            result.status = "failed"
            result.error_message = str(e)
            result.tokens_used = total_tokens
            result.cost_usd = total_cost
            result.completed_at = datetime.now(timezone.utc)

        return result

    def _parse_output(self, content: str) -> dict:
        import re
        try:
            return json.loads(content)
        except Exception:
            pass
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return {"output": content, "success": True}
