#!/usr/bin/env python3
"""Safe GLM-5.2 API smoke test.

Reads configuration from environment variables only, fails safely if the API key
is missing, sends a tiny harmless prompt, and never prints secret values.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


def main() -> int:
    api_key = os.environ.get("ZAI_API_KEY")
    if not api_key:
        print("GLM-5.2 smoke skipped: ZAI_API_KEY is not set")
        return 2

    base_url = os.environ.get("GLM52_BASE_URL", "https://api.z.ai/api/paas/v4/").rstrip("/")
    model = os.environ.get("GLM52_MODEL", "glm-5.2")
    url = f"{base_url}/chat/completions"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": "Return only the word OK for a connectivity smoke test.",
            }
        ],
        "max_tokens": 8,
        "temperature": 0,
    }

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if 200 <= response.status < 300:
                print(f"GLM-5.2 smoke succeeded: model={model}")
                return 0
            print(f"GLM-5.2 smoke failed: http_status={response.status}")
            return 1
    except urllib.error.HTTPError as exc:
        print(f"GLM-5.2 smoke failed: http_status={exc.code}")
        return 1
    except Exception as exc:  # noqa: BLE001 - smoke test should fail closed.
        print(f"GLM-5.2 smoke failed: {exc.__class__.__name__}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
