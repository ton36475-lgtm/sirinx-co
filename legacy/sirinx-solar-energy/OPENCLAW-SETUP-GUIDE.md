# OpenClaw Auto-Installation & Setup Guide
## SIRINX Solar Energy AI Command Center

---

## 📋 Overview

This guide provides step-by-step instructions for installing and configuring OpenClaw for the SIRINX AI Command Center ecosystem. The installation is fully automated and requires minimal manual intervention.

---

## 🚀 Quick Start (30 seconds)

### Option 1: Automatic Installation (Recommended)

1. **Navigate to AI-WarRoom:**
   ```
   C:\Users\Ton36\AI-WarRoom
   ```

2. **Double-click the installer:**
   ```
   RUN-OPENCLAW-SETUP.bat
   ```

3. **Click "Yes" when prompted for Administrator privileges**

4. **Wait for installation to complete** (2-5 minutes)

5. **Verify installation:**
   ```
   openclaw --version
   ```

### Option 2: Manual Installation (Advanced)

1. **Open PowerShell as Administrator**

2. **Navigate to AI-WarRoom:**
   ```powershell
   cd C:\Users\Ton36\AI-WarRoom
   ```

3. **Run the installation script:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\install-openclaw.ps1
   ```

4. **Follow the on-screen prompts**

---

## 📁 Installation Files

After running the installer, you'll find these files in `C:\Users\Ton36\AI-WarRoom\setup\`:

| File | Purpose |
|------|---------|
| `openclaw-setup.bat` | Windows Command Prompt launcher |
| `openclaw-setup.ps1` | PowerShell wrapper script |
| `setup-env.bat` | Environment variables setup |
| `QUICKSTART.md` | Quick reference guide |

---

## 🔧 Using OpenClaw

### Method 1: Direct Command (Recommended)

After installation, use OpenClaw directly from any terminal:

```bash
# Check version
openclaw --version

# Show help
openclaw --help

# Check status
openclaw status
```

### Method 2: Batch File Launcher

```batch
cd C:\Users\Ton36\AI-WarRoom\setup
openclaw-setup.bat version
openclaw-setup.bat status
openclaw-setup.bat help
```

### Method 3: PowerShell Wrapper

```powershell
cd C:\Users\Ton36\AI-WarRoom\setup
.\openclaw-setup.ps1 version
.\openclaw-setup.ps1 status
.\openclaw-setup.ps1 config
```

---

## 📂 Project Structure

After installation, your AI-WarRoom is organized as follows:

```
C:\Users\Ton36\AI-WarRoom\
├── Projects\
│   ├── AI-WarRoom\              ← SIRINX Multi-Agent System (42 Agents)
│   │   ├── src\
│   │   ├── server\
│   │   ├── client\
│   │   └── drizzle\
│   │
│   └── Travobet_AI\             ← Travobet AI Project
│       ├── src\
│       ├── models\
│       └── config\
│
├── Documents\                   ← AI Documentation & Guides
│   ├── architecture\
│   ├── api-docs\
│   └── guides\
│
├── Models\                      ← AI Models & Weights
│   ├── llm-models\
│   ├── vision-models\
│   └── embeddings\
│
├── .openclaw\                   ← OpenClaw Configuration
│   └── config.json
│
└── setup\                       ← Setup Scripts & Guides
    ├── openclaw-setup.bat
    ├── openclaw-setup.ps1
    ├── setup-env.bat
    ├── QUICKSTART.md
    └── OPENCLAW-SETUP-GUIDE.md
```

---

## ⚙️ Configuration

### OpenClaw Config File

Location: `C:\Users\Ton36\AI-WarRoom\.openclaw\config.json`

```json
{
  "projectName": "SIRINX-AI-Command-Center",
  "version": "1.0.0",
  "aiWarRoomPath": "C:\\Users\\Ton36\\AI-WarRoom",
  "projectsPath": "C:\\Users\\Ton36\\AI-WarRoom\\Projects",
  "documentsPath": "C:\\Users\\Ton36\\AI-WarRoom\\Documents",
  "modelsPath": "C:\\Users\\Ton36\\AI-WarRoom\\Models",
  "agentCount": 42,
  "multiAgentArchitecture": "SIRINX",
  "integrations": {
    "telegram": true,
    "github": true,
    "pixelAgents": true,
    "manus": true
  }
}
```

### Environment Variables

The setup script creates these environment variables:

| Variable | Value |
|----------|-------|
| `AI_WARROOM_PATH` | `C:\Users\Ton36\AI-WarRoom` |
| `AI_PROJECTS_PATH` | `C:\Users\Ton36\AI-WarRoom\Projects` |
| `AI_DOCUMENTS_PATH` | `C:\Users\Ton36\AI-WarRoom\Documents` |
| `AI_MODELS_PATH` | `C:\Users\Ton36\AI-WarRoom\Models` |
| `OPENCLAW_CONFIG` | `C:\Users\Ton36\AI-WarRoom\.openclaw\config.json` |

To set these manually, run:
```batch
C:\Users\Ton36\AI-WarRoom\setup\setup-env.bat
```

---

## 🔗 Integration Points

### SIRINX Multi-Agent System (42 Agents)

OpenClaw integrates with the 42-agent SIRINX architecture:

- **Orchestrator Agent** - Central coordination hub
- **Lead Generation Agents** - Social media scanning (TikTok, Instagram, Facebook)
- **Financial Agents** - NPV, IRR, Tax 150%, Degradation calculations
- **SEO Agents** - Local SEO for 77 Thai provinces
- **Chatbot Agents** - Chain of Thought reasoning
- **Email Marketing Agents** - Lead nurturing sequences
- **Security Agents** - RLS, encryption, rate limiting
- **And 34 more specialized agents...**

### Telegram Bot Integration

Daily reports sent to Telegram at 9 AM Bangkok time (UTC+7):
- Bot: @MultiAgentAiCompany_bot
- Chat ID: 8719485384
- Reports include: Agent status, workflow metrics, system health

### AI Command Center Dashboard

Access the web interface:
- **URL:** https://aicontrohub-bfc4d4am.manus.space
- **Features:** Real-time agent monitoring, workflow orchestration, performance metrics
- **Tech Stack:** React, TypeScript, Tailwind CSS, Glassmorphism UI

### Pixel Agents System

Visual agent representation with:
- Character animations
- Office environment simulation
- Interactive dashboard
- Real-time status updates

---

## 🐛 Troubleshooting

### Issue: "openclaw command not found"

**Solution 1:** Restart your terminal
```powershell
# Close and reopen PowerShell or Command Prompt
```

**Solution 2:** Verify npm installation
```bash
npm list -g openclaw
```

**Solution 3:** Reinstall OpenClaw
```bash
npm install -g openclaw --force
```

**Solution 4:** Add to PATH manually
1. Open System Environment Variables (Win+X → System → Advanced system settings)
2. Click "Environment Variables"
3. Under "User variables", click "New"
4. Variable name: `PATH`
5. Variable value: `C:\Users\Ton36\AppData\Roaming\npm`
6. Click OK and restart terminal

### Issue: "Access Denied" during installation

**Solution:** Run as Administrator
```powershell
# Right-click PowerShell → Run as Administrator
```

### Issue: Installation hangs or times out

**Solution:** Check npm registry
```bash
npm config set registry https://registry.npmjs.org/
npm install -g openclaw --verbose
```

---

## ✅ Verification Checklist

After installation, verify the following:

- [ ] OpenClaw command works: `openclaw --version`
- [ ] Config file exists: `C:\Users\Ton36\AI-WarRoom\.openclaw\config.json`
- [ ] Setup directory created: `C:\Users\Ton36\AI-WarRoom\setup\`
- [ ] Batch launcher works: `openclaw-setup.bat version`
- [ ] PowerShell wrapper works: `.\openclaw-setup.ps1 version`
- [ ] Environment variables set: `echo %AI_WARROOM_PATH%`
- [ ] AI projects accessible: `C:\Users\Ton36\AI-WarRoom\Projects\`

---

## 📚 Additional Resources

### Official Documentation
- OpenClaw GitHub: https://github.com/openclaw/openclaw
- OpenClaw Docs: https://openclaw.io/docs

### SIRINX AI Command Center
- Dashboard: https://aicontrohub-bfc4d4am.manus.space
- Architecture: 42-agent multi-agent system
- Features: Lead generation, financial engine, SEO optimization

### Support
- Issue Tracker: C:\Users\Ton36\AI-WarRoom\setup\QUICKSTART.md
- Configuration: C:\Users\Ton36\AI-WarRoom\.openclaw\config.json

---

## 🎯 Next Steps

1. **Verify Installation**
   ```bash
   openclaw --version
   openclaw status
   ```

2. **Initialize Project**
   ```bash
   openclaw init --name SIRINX-AI-Command-Center
   ```

3. **Configure Agents**
   ```bash
   openclaw config agents
   ```

4. **Start Monitoring**
   ```bash
   openclaw monitor
   ```

5. **Access Dashboard**
   - Open: https://aicontrohub-bfc4d4am.manus.space
   - Login with Manus credentials
   - Monitor real-time agent activity

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the QUICKSTART.md guide
3. Check OpenClaw documentation
4. Contact system administrator

---

**Installation Date:** [Auto-generated during setup]
**Version:** 1.0.0
**System:** SIRINX Solar Energy AI Command Center
**Status:** ✅ Ready for Production

---

*Last Updated: March 29, 2026*
*Created by: Manus AI Agent*
*For: SIRINX Solar Energy Platform*
