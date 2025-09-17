# Task: Add 1M Context Toggle

## Task Status
Current: Completed

## Problem Statement
~~Research if we can use "context-1m-2025-08-07 beta" header in our app. If so, add a toggle next to yolo mode, thinking mode, and plan first toggles called "1M Context" and use our enforce model to enforce Sonnet as required.~~

**REVISED:** Remove the 1M Context toggle and instead add a new "Sonnet 1M" model option to the Enforce Model modal for better user experience.

## Context & Constraints
- Must integrate with existing toggle patterns in src/ui.ts (lines 72-83)
- Must follow existing JavaScript implementation patterns in src/script.ts
- Must work with current Claude CLI architecture that spawns child processes
- Toggle should automatically enforce Sonnet model and disable model selector when active
- Session-based persistence (resets on page refresh)
- No user warnings needed - just model button disabling

## Expected Outcome
~~A functional "1M Context" toggle that:~~
~~1. Appears next to existing toggles (Plan First, Thinking Mode, Yolo Mode)~~
~~2. When enabled: automatically switches to Sonnet model and disables model selector button~~
~~3. When disabled: re-enables model selector and restores previous model choice~~
~~4. Passes context-1m-2025-08-07 beta header via environment variables to Claude CLI~~
~~5. Sends model enforcement to backend to ensure Sonnet is used~~

**REVISED:** A new "Sonnet 1M" model option in the Enforce Model modal that:
1. Appears as a fourth option in the model selector (after Opus, Sonnet, before Default)
2. When selected: uses `--model sonnet[1m]` CLI argument for 1M token context
3. Displays as "Sonnet 1M" in the model selector button
4. Provides clear description: "Sonnet with 1 million token context window"

## Task Type
Full-stack

## Technical Context
### Code Constraints
- Follow existing toggle HTML structure: `div.mode-toggle` with `span` and `div.mode-switch`
- Use existing JavaScript naming patterns: `toggle[Feature]Mode()` functions
- Maintain boolean state variables pattern: `[feature]ModeEnabled`
- Follow existing message passing: `vscode.postMessage()` with type/data structure

### Architecture Hints
- UI toggles: src/ui.ts lines 72-83 (input-modes section)
- Toggle JavaScript: src/script.ts (search for togglePlanMode, toggleThinkingMode, toggleYoloMode)
- Model enforcement: src/script.ts _setSelectedModel(), currentModel variable
- Environment variables: src/extension.ts spawn() calls already pass env object
- Message handling: src/extension.ts _handleWebviewMessage() switch statement

### Tech Stack Requirements
- HTML: Vanilla HTML in template string (src/ui.ts)
- CSS: Existing styles in src/ui-styles.ts (check .mode-toggle, .mode-switch classes)
- JavaScript: Vanilla TypeScript (src/script.ts)
- Backend: Node.js child_process spawn with environment variables (src/extension.ts)

### API Constraints
- Claude CLI uses environment variables for headers (research confirmed)
- Model enforcement uses --model flag in CLI args (see _setSelectedModel implementation)
- Message flow: Frontend → vscode.postMessage → Extension → Claude CLI spawn

## Code Guidance
### File Organization
- UI HTML: Add toggle in src/ui.ts around line 83 (after existing toggles)
- Toggle Logic: Add JavaScript functions in src/script.ts (follow existing toggle patterns)
- Message Handling: Add case in src/extension.ts _handleWebviewMessage()
- Environment Variables: Modify env object in src/extension.ts spawn calls

### Testing Requirements
- Test toggle visual state changes
- Test model selector disable/enable behavior
- Test message sending with 1M context header in environment
- Test model enforcement to Sonnet when toggle is active

### Performance Considerations
- Session-based state only (no localStorage writes)
- Minimal DOM manipulation for toggle states
- Environment variable passing adds negligible overhead

## Missions
- [x] Mission 1: Frontend - Add 1M Context toggle UI component with visual state management
- [x] Mission 2: Frontend - Implement toggle JavaScript logic with model enforcement and disable/enable functionality
- [x] Mission 3: Backend - Add message handling and environment variable passing for context header
- [x] Mission 4: Full-stack - Integration testing and refinement of toggle behavior

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

## Sub-Agent Outputs
*Links to detailed agent outputs stored in sub-agents-outputs/ folder*

## Notes
- Task created: 2025-09-16
- Status: Brainstormed → Validated → In dev → Testing → Completed
- All missions defined upfront based on problem analysis
- Each mission builds incrementally on previous ones
- Agent outputs tracked for context window optimization
- Research confirmed: context-1m-2025-08-07 beta header enables 1M token context for Claude Sonnet 4
- Claude CLI architecture supports environment variable passing for headers
- Existing model enforcement pattern via _setSelectedModel() can be reused