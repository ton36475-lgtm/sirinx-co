"""Tool registry — register, validate, and safely execute tools."""
import asyncio
import json
import os
import subprocess
import time
from typing import Any, Callable, Awaitable, Optional
from dataclasses import dataclass, field
from packages.core.errors import ToolExecutionError

@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: dict  # JSON Schema
    execute: Callable[..., Awaitable[Any]]
    requires_approval: bool = False
    risk_level: str = "low"  # low, medium, high, critical
    tags: list = field(default_factory=list)

    def to_llm_tool(self) -> dict:
        """Format as tool definition for LLM API calls."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.parameters,
        }

class ToolRegistry:
    """Registry for all available tools."""

    def __init__(self):
        self._tools: dict[str, ToolDefinition] = {}
        self._register_builtin_tools()

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self, tags: Optional[list] = None) -> list[ToolDefinition]:
        tools = list(self._tools.values())
        if tags:
            tools = [t for t in tools if any(tag in t.tags for tag in tags)]
        return tools

    def to_llm_tools(self, tags: Optional[list] = None) -> list[dict]:
        return [t.to_llm_tool() for t in self.list_tools(tags)]

    async def execute(self, name: str, params: dict) -> Any:
        tool = self.get(name)
        if not tool:
            raise ToolExecutionError(name, f"Tool '{name}' not registered")
        try:
            return await tool.execute(**params)
        except ToolExecutionError:
            raise
        except Exception as e:
            raise ToolExecutionError(name, str(e))

    def _register_builtin_tools(self):
        """Register all built-in tools."""

        async def read_file(path: str) -> dict:
            try:
                # Sandbox: only allow reading within CWD
                abs_path = os.path.abspath(path)
                cwd = os.path.abspath(os.getcwd())
                if not abs_path.startswith(cwd):
                    raise ToolExecutionError("read_file", f"Access denied: path outside working directory")
                if not os.path.exists(abs_path):
                    return {"error": f"File not found: {path}"}
                with open(abs_path, "r", encoding="utf-8") as f:
                    content = f.read()
                return {"path": path, "content": content, "size": len(content)}
            except ToolExecutionError:
                raise
            except Exception as e:
                return {"error": str(e)}

        async def write_file(path: str, content: str) -> dict:
            try:
                abs_path = os.path.abspath(path)
                cwd = os.path.abspath(os.getcwd())
                if not abs_path.startswith(cwd):
                    raise ToolExecutionError("write_file", "Access denied: path outside working directory")
                os.makedirs(os.path.dirname(abs_path), exist_ok=True)
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return {"path": path, "bytes_written": len(content), "success": True}
            except ToolExecutionError:
                raise
            except Exception as e:
                return {"error": str(e)}

        async def search_files(directory: str, pattern: str, max_results: int = 20) -> dict:
            import fnmatch
            try:
                matches = []
                abs_dir = os.path.abspath(directory)
                cwd = os.path.abspath(os.getcwd())
                if not abs_dir.startswith(cwd):
                    return {"error": "Access denied: directory outside working directory"}
                for root, dirs, files in os.walk(abs_dir):
                    for filename in files:
                        if fnmatch.fnmatch(filename, pattern):
                            rel_path = os.path.relpath(os.path.join(root, filename), cwd)
                            matches.append(rel_path)
                            if len(matches) >= max_results:
                                break
                    if len(matches) >= max_results:
                        break
                return {"matches": matches, "count": len(matches)}
            except Exception as e:
                return {"error": str(e)}

        async def run_command(command: str, timeout: int = 30) -> dict:
            """Sandboxed command execution — only safe commands allowed."""
            ALLOWED_COMMANDS = {"echo", "ls", "dir", "cat", "type", "pwd", "whoami", "python", "pip", "pytest"}
            cmd_parts = command.strip().split()
            if not cmd_parts:
                return {"error": "Empty command"}
            base_cmd = os.path.basename(cmd_parts[0]).lower().replace(".exe", "")
            if base_cmd not in ALLOWED_COMMANDS:
                return {"error": f"Command '{base_cmd}' not in allowed list", "allowed": list(ALLOWED_COMMANDS)}
            try:
                result = await asyncio.wait_for(
                    asyncio.create_subprocess_shell(
                        command,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    ),
                    timeout=timeout,
                )
                stdout, stderr = await result.communicate()
                return {
                    "stdout": stdout.decode("utf-8", errors="replace"),
                    "stderr": stderr.decode("utf-8", errors="replace"),
                    "returncode": result.returncode,
                }
            except asyncio.TimeoutError:
                return {"error": f"Command timed out after {timeout}s"}
            except Exception as e:
                return {"error": str(e)}

        async def http_request(url: str, method: str = "GET", headers: Optional[dict] = None, body: Optional[str] = None) -> dict:
            import httpx
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.request(
                        method=method.upper(),
                        url=url,
                        headers=headers or {},
                        content=body,
                    )
                    return {
                        "status_code": resp.status_code,
                        "headers": dict(resp.headers),
                        "body": resp.text[:10000],  # cap at 10KB
                    }
            except Exception as e:
                return {"error": str(e)}

        async def database_query(sql: str, params: Optional[dict] = None) -> dict:
            """Read-only SQL query (SELECT only)."""
            sql_clean = sql.strip().upper()
            if not sql_clean.startswith("SELECT"):
                return {"error": "Only SELECT queries are allowed"}
            return {"result": "Database query tool requires DB session — use via orchestrator context"}

        # Register all built-in tools
        self.register(ToolDefinition(
            name="read_file",
            description="Read content of a file within the working directory",
            parameters={"type": "object", "properties": {"path": {"type": "string", "description": "Relative file path"}}, "required": ["path"]},
            execute=read_file,
            risk_level="low",
            tags=["file", "read"],
        ))
        self.register(ToolDefinition(
            name="write_file",
            description="Write content to a file within the working directory",
            parameters={"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]},
            execute=write_file,
            risk_level="medium",
            requires_approval=False,
            tags=["file", "write"],
        ))
        self.register(ToolDefinition(
            name="search_files",
            description="Search for files matching a pattern in a directory",
            parameters={"type": "object", "properties": {"directory": {"type": "string"}, "pattern": {"type": "string"}, "max_results": {"type": "integer", "default": 20}}, "required": ["directory", "pattern"]},
            execute=search_files,
            risk_level="low",
            tags=["file", "search"],
        ))
        self.register(ToolDefinition(
            name="run_command",
            description="Run a sandboxed shell command (limited to safe commands)",
            parameters={"type": "object", "properties": {"command": {"type": "string"}, "timeout": {"type": "integer", "default": 30}}, "required": ["command"]},
            execute=run_command,
            risk_level="high",
            requires_approval=True,
            tags=["system"],
        ))
        self.register(ToolDefinition(
            name="http_request",
            description="Make an HTTP request to an external URL",
            parameters={"type": "object", "properties": {"url": {"type": "string"}, "method": {"type": "string", "default": "GET"}, "headers": {"type": "object"}, "body": {"type": "string"}}, "required": ["url"]},
            execute=http_request,
            risk_level="medium",
            tags=["network"],
        ))
        self.register(ToolDefinition(
            name="database_query",
            description="Execute a read-only SQL SELECT query",
            parameters={"type": "object", "properties": {"sql": {"type": "string"}, "params": {"type": "object"}}, "required": ["sql"]},
            execute=database_query,
            risk_level="low",
            tags=["database"],
        ))

# Global singleton
_registry: Optional[ToolRegistry] = None

def get_tool_registry() -> ToolRegistry:
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry
