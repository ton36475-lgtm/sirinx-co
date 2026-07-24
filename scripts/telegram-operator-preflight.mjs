#!/usr/bin/env node

import { runTelegramOperatorPreflightCli } from "../services/telegram-command-bot/src/operator-preflight.mjs";

const result = await runTelegramOperatorPreflightCli();
process.exitCode = result.exitCode;
