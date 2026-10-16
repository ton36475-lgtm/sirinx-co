# AI Coding Tools — Model Catalog Status (2026-10-16)

| Tool | Version | Default Model | Provider | สถานะ |
|---|---|---|---|---|
| opencode | 1.19.0 | moonshotai/kimi-k2.7-code | openrouter | ✅ แก้แล้ว (space-bunny ตาย) |
| jcode | latest | moonshotai/kimi-k2.7-code | openrouter | ✅ |
| cline | 3.0.72 | moonshotai/kimi-k2.7-code (+ claude-sonnet-5 live) | openrouter | ✅ แก้ครั้งนี้ (ox-alpha ตาย) |
| freebuff | 0.2.29 | cloud-managed (manicode server) | — | ℹ️ ไม่มี local catalog |

**Retired models (ยืนยันจาก OpenRouter API):** stealth/space-bunny-alpha, stealth/ox-alpha
**Credits:** OpenRouter + HF หมดทั้งคู่ (Muse family ยิงไม่ได้จนกว่าเติม/HF PRO)
**Catalog กลาง:** infra/9router/model-catalog.json (1405 models / 21 providers)
**HF MCP:** opencode mcp.hf-mcp-server → https://huggingface.co/mcp (handshake ผ่าน, token env HF_TOKEN)
