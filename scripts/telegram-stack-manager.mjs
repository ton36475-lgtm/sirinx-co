#!/usr/bin/env node

import { runTelegramStackManagerCli } from "../services/telegram-command-bot/src/stack-manager.mjs";

const result = await runTelegramStackManagerCli();
process.exitCode = result.exitCode;
