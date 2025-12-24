# Known Issues

## 🔴 Critical Issues

### ELECTRON_RUN_AS_NODE Environment Variable

**Status:** Active workaround required  
**Affects:** Application launch  
**Severity:** High  
**Discovered:** December 2025

#### Problem
The `ELECTRON_RUN_AS_NODE` environment variable causes Electron to run in Node.js mode instead of Electron mode. When set to `1`, `require('electron')` returns the executable path string instead of the Electron API object, causing the application to crash on startup.

#### Symptoms
```
TypeError: Cannot read properties of undefined (reading 'whenReady')
```

Application fails to start with error showing `app` is undefined.

#### Root Cause
The environment variable `ELECTRON_RUN_AS_NODE=1` is set in the system or shell, which makes Electron behave as plain Node.js.

#### Workaround
Clear the environment variable before launching:

**PowerShell:**
```powershell
$env:ELECTRON_RUN_AS_NODE=$null; npm start
```

**cmd:**
```cmd
set ELECTRON_RUN_AS_NODE=
npm start
```

**Bash/Linux/Mac:**
```bash
unset ELECTRON_RUN_AS_NODE && npm start
```

#### Permanent Fix Options

1. **Remove from system environment variables** (Recommended)
   - Windows: System Properties → Environment Variables
   - Remove `ELECTRON_RUN_AS_NODE` if present

2. **Update package.json scripts** (Alternative)
   ```json
   {
     "scripts": {
       "start": "cross-env ELECTRON_RUN_AS_NODE= electron .",
       "dev": "cross-env ELECTRON_RUN_AS_NODE= electron . --dev"
     }
   }
   ```
   Requires: `npm install --save-dev cross-env`

## 🟡 Security Issues

### Electron Version < 35.7.5

**Status:** Accepted risk (for now)  
**Affects:** All users  
**Severity:** Moderate  
**CVE:** GHSA-vmqv-hx8q-j7mg

#### Problem
Current Electron version (33.4.11) has an ASAR Integrity Bypass vulnerability.

#### Impact
Potential for resource modification in packed applications. This primarily affects distributed builds.

#### Why Not Fixed
- Upgrading to Electron 35+ may introduce breaking changes
- Current version is stable and working
- Application is in development/beta phase
- Security risk is low for local-first application

#### Mitigation
- Application stores data locally (not network-exposed)
- Code signing can be added for distributed builds
- Users should download from official sources only

#### Planned Resolution
- Monitor Electron 35/36 stability
- Plan upgrade and testing cycle
- Target: Q1 2026

## 🟢 Minor Issues

### comfyui-prompt-manager Directory

**Status:** Investigation needed  
**Affects:** Git repository organization

A `comfyui-prompt-manager/` directory exists in the repository but is not tracked by git. This appears to be a Python-based ComfyUI plugin.

**Options:**
1. Add to .gitignore if it's a local tool
2. Create a separate repository for it
3. Integrate it as a git submodule

**Decision:** Pending user input

---

## 📋 Tracking

| Issue | Severity | Status | Target Fix |
|-------|----------|--------|------------|
| ELECTRON_RUN_AS_NODE | High | Workaround | User action |
| Electron < 35.7.5 | Moderate | Deferred | Q1 2026 |
| comfyui-prompt-manager | Low | Investigation | TBD |

---

## 🔗 Related

- [Implementation Plan](./implementation_plan.md)
- [Audit Report](./audit_report.md)
- [Electron Issue](https://github.com/advisories/GHSA-vmqv-hx8q-j7mg)

**Last Updated:** December 23, 2025
