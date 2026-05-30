"""UltraPlan — break complex tasks into step-by-step plans."""
from __future__ import annotations
import json
import logging
from typing import TYPE_CHECKING
from dataclasses import dataclass, field

if TYPE_CHECKING:
    from apps.api.services.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

@dataclass
class PlannedStep:
    step_number: int
    name: str
    description: str
    tool: str | None = None
    input_data: dict = field(default_factory=dict)
    estimated_tokens: int = 500

@dataclass
class Plan:
    task_title: str
    task_description: str
    steps: list[PlannedStep] = field(default_factory=list)
    total_estimated_tokens: int = 0
    reasoning: str = ""

class TaskPlanner:
    """Breaks a complex task into structured steps using an LLM."""

    SYSTEM_PROMPT = """You are an expert task planner. Given a task description and available tools,
break the task into clear, sequential steps. Each step should be atomic and achievable.

Output a JSON object with this structure:
{
  "reasoning": "brief explanation of your plan",
  "steps": [
    {
      "step_number": 1,
      "name": "Short step name",
      "description": "What this step does",
      "tool": "tool_name_or_null",
      "input_data": {"key": "value"},
      "estimated_tokens": 500
    }
  ]
}

Rules:
- Maximum 20 steps
- Each step must have a clear, measurable outcome
- Use tools only when specified in available_tools
- If no tool needed, set tool to null
- Be specific and actionable
"""

    def __init__(self, provider: "BaseLLMProvider"):
        self.provider = provider

    async def plan(
        self,
        task_title: str,
        task_description: str,
        input_data: dict,
        available_tools: list[dict],
        brain_context: list[str] | None = None,
        max_steps: int = 20,
    ) -> Plan:
        """Generate a plan for the given task."""

        tools_desc = json.dumps(available_tools, indent=2) if available_tools else "None"
        brain_ctx = "\n".join(brain_context) if brain_context else "No context available"
        input_desc = json.dumps(input_data, indent=2) if input_data else "{}"

        user_prompt = f"""Task: {task_title}

Description: {task_description}

Input Data:
{input_desc}

Available Tools:
{tools_desc}

Relevant Knowledge:
{brain_ctx}

Create a plan with maximum {max_steps} steps to accomplish this task."""

        try:
            response = await self.provider.generate(
                system=self.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
                temperature=0.2,
                max_tokens=4096,
            )

            plan_data = self._parse_plan(response.content)
            steps = [PlannedStep(**s) for s in plan_data.get("steps", [])]
            total_tokens = sum(s.estimated_tokens for s in steps)

            return Plan(
                task_title=task_title,
                task_description=task_description,
                steps=steps,
                total_estimated_tokens=total_tokens,
                reasoning=plan_data.get("reasoning", ""),
            )
        except Exception as e:
            logger.error(f"Planning failed: {e}")
            # Return minimal fallback plan
            return Plan(
                task_title=task_title,
                task_description=task_description,
                steps=[PlannedStep(
                    step_number=1,
                    name="Execute task",
                    description=task_description,
                    tool=None,
                    input_data=input_data,
                )],
                reasoning=f"Fallback plan due to planning error: {e}",
            )

    def _parse_plan(self, content: str) -> dict:
        """Extract JSON from LLM response."""
        import re
        # Try direct parse
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        # Try extracting JSON block
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        # Try finding { ... } block
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {"steps": [], "reasoning": content}
