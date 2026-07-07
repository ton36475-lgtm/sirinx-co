# Mobile Command App

Status: planned command surface.

This app will become the mobile approval and status interface for SIRINX OS.

## MVP Commands

- show gate status
- show node heartbeat
- show AdaptiveSync dry-run plan
- approve or reject queued actions
- trigger emergency stop

## Safety

Mobile commands cannot directly run shell commands, mutate Cloudflare, push GitHub, send customer messages, write production databases, or mirror raw files.
