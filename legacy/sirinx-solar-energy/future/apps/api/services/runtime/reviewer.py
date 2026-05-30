"""Review task outputs and apply self-correction."""
from __future__ import annotations
import json
import logging
from typing import TYPE_CHECKING
from dataclasses import dataclass

if TYPE_CHECKING:
    from apps.api.services.providers.base import BaseLLMProvider
    from apps.api.services.runtime.planner import Plan
    from apps.api.services.runtime.executor import StepResult

logger = logging.getLogger(__name__)

@dataclass
class ReviewResult:
    passed: bool
    score: float  # 0.0 to 1.0
    feedback: str
    corrections: list[str]
    summary: str
    should_retry: bool = False
    retry_step: int | None = None

class OutputReviewer:
    """Reviews task run outputs for quality and correctness."""

    SYSTEM_PROMPT = """You are a quality reviewer evaluating the output of an AI task execution.

Review the task plan, executed steps, and their outputs. Assess:
1. Did each step complete successfully?
2. Are the outputs coherent and correct?
3. Was the overall task goal achieved?
4. Are there any critical errors or missing information?

Output a JSON review:
{
  "passed": true/false,
  "score": 0.0-1.0,
  "feedback": "Overall feedback",
  "corrections": ["Issue 1", "Issue 2"],
  "summary": "Brief summary of what was accomplished",
  "should_retry": false,
  "retry_step": null
}
"""

    def __init__(self, provider: "BaseLLMProvider"):
        self.provider = provider

    async def review(
        self,
        task_title: str,
        task_description: str,
        plan: "Plan",
        step_results: list["StepResult"],
    ) -> ReviewResult:
        """Review all step results against the original task."""

        steps_summary = []
        for sr in step_results:
            steps_summary.append({
                "step": sr.step_number,
                "name": sr.name,
                "status": sr.status,
                "output": sr.output_data,
                "error": sr.error_message,
            })

        prompt = f"""Task: {task_title}
Description: {task_description}

Plan had {len(plan.steps)} steps.
Executed {len(step_results)} steps.

Step Results:
{json.dumps(steps_summary, indent=2)}

Review the execution and provide your assessment."""

        try:
            response = await self.provider.generate(
                system=self.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2048,
            )
            review_data = self._parse_review(response.content)
            return ReviewResult(
                passed=review_data.get("passed", True),
                score=float(review_data.get("score", 0.8)),
                feedback=review_data.get("feedback", ""),
                corrections=review_data.get("corrections", []),
                summary=review_data.get("summary", "Task completed"),
                should_retry=review_data.get("should_retry", False),
                retry_step=review_data.get("retry_step"),
            )
        except Exception as e:
            logger.error(f"Review failed: {e}")
            # Default pass review on error
            failed_steps = [s for s in step_results if s.status == "failed"]
            return ReviewResult(
                passed=len(failed_steps) == 0,
                score=1.0 - (len(failed_steps) / max(len(step_results), 1)),
                feedback=f"Auto-review (reviewer error: {e})",
                corrections=[],
                summary=f"Completed {len(step_results)} steps, {len(failed_steps)} failed",
            )

    def _parse_review(self, content: str) -> dict:
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
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        return {"passed": True, "score": 0.7, "feedback": content, "corrections": [], "summary": "Review completed"}
