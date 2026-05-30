"""Auto-Dream — condense session knowledge after task runs."""
from __future__ import annotations
import logging
from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from apps.api.services.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

DREAM_SYSTEM_PROMPT = """You are an AI knowledge consolidator. After a task run, extract and condense
the most valuable learnings, patterns, and insights for future reference.

Output a JSON object:
{
  "title": "Brief title for this memory",
  "key_learnings": ["learning 1", "learning 2"],
  "patterns_observed": ["pattern 1"],
  "recommendations": ["recommendation 1"],
  "condensed_summary": "2-3 sentence summary of key takeaways"
}
"""

class AutoDream:
    """Condenses task run knowledge into persistent brain entries."""

    def __init__(self, db: AsyncSession, provider: Optional["BaseLLMProvider"] = None):
        self.db = db
        self.provider = provider

    async def condense_task_run(
        self,
        org_id: str,
        task_id: str,
        task_run_id: str,
        task_title: str,
        step_results: list[dict],
        review_summary: str,
    ) -> Optional[str]:
        """Condense a completed task run into a brain memory entry."""
        if not self.provider:
            logger.info("AutoDream: no provider configured, skipping condensation")
            return None

        steps_text = "\n".join([
            f"Step {s.get('step', '?')}: {s.get('name', '')} — {s.get('status', '')}: {str(s.get('output', ''))[:200]}"
            for s in step_results
        ])

        prompt = f"""Task: {task_title}
Task Run ID: {task_run_id}
Review Summary: {review_summary}

Step Results:
{steps_text}

Extract key learnings and patterns from this task execution."""

        try:
            response = await self.provider.generate(
                system=DREAM_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
            )

            import json, re
            try:
                dream_data = json.loads(response.content)
            except Exception:
                match = re.search(r'\{[\s\S]*\}', response.content)
                dream_data = json.loads(match.group()) if match else {}

            condensed_content = dream_data.get("condensed_summary", response.content)
            learnings = dream_data.get("key_learnings", [])
            if learnings:
                condensed_content += "\n\nKey Learnings:\n" + "\n".join(f"- {l}" for l in learnings)

            from apps.api.services.knowledge.brain_manager import BrainManager
            brain = BrainManager(self.db)
            entry_id = await brain.create_entry(
                org_id=org_id,
                entry_type="memory",
                title=dream_data.get("title", f"Memory: {task_title}"),
                content=condensed_content,
                tags=["auto-dream", f"task:{task_id}"],
                source=f"task_run:{task_run_id}",
            )
            logger.info(f"AutoDream: created brain entry {entry_id} for task run {task_run_id}")
            return entry_id

        except Exception as e:
            logger.error(f"AutoDream condensation failed: {e}")
            return None
