# Task: MCP Modal Redesign and One-Click Installer

## Task Status
Current: Completed

## Problem Statement
Research how our current MCP implementation works and how Claude Code actually handles MCP adding, removing and editing. Remake our MCP Servers modal to work with the new MCP implementation and create a new one click installer library for MCPs using all the current ones we have here and find like 5-6 more good ones.

## Context & Constraints
- Must integrate with Claude Code's official MCP command system (`claude mcp add`, `claude mcp remove`, `claude mcp list`)
- Should work with the existing MCP configuration system in ConfigManager.ts
- UI should provide browse, search, install, configure, and manage capabilities
- Installation feedback should show success/failure notifications only
- Must maintain compatibility with current VS Code extension architecture

## Expected Outcome
A redesigned MCP Servers modal that seamlessly integrates with Claude Code's MCP management system, plus a comprehensive one-click installer featuring current and additional high-quality MCP servers with proper installation, configuration, and management capabilities.

## Task Type
Complex Full-stack

## Technical Context

### Code Constraints
- TypeScript with strict mode enabled
- ES2022 target with Node16 module system
- ESLint enforcement with camelCase/PascalCase naming
- All code must follow existing patterns in src/ directory
- Webview security restrictions (CSP) apply to UI components

### Architecture Hints
- Current MCP modal located in src/ui.ts (lines 160-261) with corresponding script.ts functions
- ConfigManager.ts handles MCP server configuration with JSON storage
- Extension.ts manages message passing between webview and extension
- MCPManager.js exists but appears to be compiled output
- Message passing pattern: webview → extension → ConfigManager → file system

### Tech Stack Requirements
- VS Code Extension API for webview and configuration management
- HTML/CSS/JavaScript for frontend interface (no external frameworks)
- Node.js child_process for executing claude mcp commands
- JSON-based configuration storage following existing patterns
- TypeScript for all new backend code

### API Constraints
- Must use `claude mcp` CLI commands for server management
- Configuration stored in extension storage path: `mcp/mcp-servers.json`
- Webview communication via postMessage API only
- WSL path conversion support required for Windows users

## Code Guidance

### File Organization
- UI components go in src/ui.ts following existing modal patterns
- Backend logic in src/ConfigManager.ts or new MCP-specific manager
- Client-side JavaScript in src/script.ts following existing function patterns
- Types and interfaces should be defined inline or in dedicated .ts files

### Testing Requirements
- Manual testing through F5 debug launch in VS Code
- Test MCP installation/removal through UI
- Verify configuration persistence across extension reloads
- Test WSL compatibility on Windows systems

### Performance Considerations
- Lazy load MCP server list to avoid blocking UI
- Cache server metadata to reduce repeated API calls
- Debounce search inputs to prevent excessive filtering
- Use efficient DOM manipulation for large server lists

## Missions

- [x] Mission 1: Backend - Research and integrate Claude Code MCP commands into ConfigManager
- [x] Mission 2: Backend - Create MCP installer service with server discovery and validation
- [x] Mission 3: Frontend - Redesign MCP Servers modal with enhanced UI and one-click installation
- [x] Mission 4: Frontend - Implement search, filtering, and server management features
- [x] Mission 5: Full-stack - Add curated collection of 12+ high-quality MCP servers with metadata
- [x] Mission 6: Full-stack - Test installation flows and error handling across different platforms

## Agent Usage Tracking
*Agents used across all missions will be tracked here*

### Mission 1 Agents
- (To be updated during mission execution)

### Mission 2 Agents
- (To be updated during mission execution)

### Mission 3 Agents
- (To be updated during mission execution)

### Mission 4 Agents
- (To be updated during mission execution)

### Mission 5 Agents
- (To be updated during mission execution)

### Mission 6 Agents
- (To be updated during mission execution)

## Sub-Agent Outputs
*Links to detailed agent outputs stored in sub-agents-outputs/ folder*

## Research Summary

### Current MCP Implementation Analysis
**Location**: src/ui.ts (lines 160-261), src/script.ts (MCP functions), src/ConfigManager.ts (storage)

**Current Features**:
- Basic modal with hardcoded popular servers (Context7, Sequential Thinking, Memory, Puppeteer, Fetch, Filesystem)
- Add server form with HTTP/SSE/stdio support
- Edit/delete functionality for custom servers
- Configuration stored in JSON format

**Current Servers**: Context7, Sequential Thinking, Memory, Puppeteer, Fetch, Filesystem

### Claude Code MCP Commands Research
**Core Commands**:
- `claude mcp add [name] --scope user|project|local` - Add MCP server
- `claude mcp list` - List configured servers
- `claude mcp remove [name]` - Remove MCP server
- `claude mcp get [name]` - Test server connection

**Scopes**:
- Local: Session-specific servers (default)
- Project: Shared via .mcp.json
- User: Global across all projects

### Additional High-Quality MCP Servers Identified
1. **GitHub MCP** - Repository management and GitHub API integration
2. **Alpaca Trading** - Stock and options trading with market data
3. **MongoDB** - Database queries and collection analysis
4. **Qdrant** - Vector search and memory storage
5. **BigQuery** - Google Cloud data warehouse queries
6. **AWS Bedrock** - Knowledge base retrieval and AI integration

## Notes
- Task created: 2025-01-17
- Status: Brainstormed → Validated → In dev → Testing → Completed
- All missions defined upfront based on problem analysis
- Each mission builds incrementally on previous ones
- Agent outputs tracked for context window optimization
- Backend-first approach to provide ready APIs for frontend integration