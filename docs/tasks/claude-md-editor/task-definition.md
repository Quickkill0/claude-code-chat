# Task: Direct CLAUDE.md File Editor in UI

## 🎯 Problem Statement
Users need the ability to directly view and edit the CLAUDE.md file from within the Claude Code Chat settings interface. Currently, there's no integrated way to manage this important configuration file that controls Claude's behavior and project-specific instructions.

## 📋 Requirements & Acceptance Criteria

### Functional Requirements
1. **New Settings Section**: Add "CLAUDE.md Editor" section in Settings UI under the Permissions section
2. **File Loading**: Automatically load CLAUDE.md content when Settings panel opens
3. **Live Editing**: Provide a text editor interface for modifying the file content
4. **Save Functionality**: Allow users to save changes back to CLAUDE.md
5. **File Creation**: If CLAUDE.md doesn't exist, offer to create it with a template
6. **Validation**: Basic validation for markdown syntax
7. **Undo/Redo**: Support for undo/redo operations during editing

### Non-Functional Requirements
- **Performance**: File loading/saving should be instant (<100ms)
- **UX**: Seamless integration with existing settings UI
- **Error Handling**: Graceful handling of file read/write errors
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 Technical Specifications

### Architecture Components
1. **UI Layer** (ui.ts, script.ts)
   - New settings panel section for CLAUDE.md editor
   - Monaco editor or textarea for markdown editing
   - Save/Cancel buttons with visual feedback

2. **Message Handling** (MessageHandler.ts, extension.ts)
   - New message types: `loadClaudeMd`, `saveClaudeMd`, `claudeMdLoaded`, `claudeMdSaved`
   - Integration with existing message flow

3. **File Management** (ConfigManager.ts)
   - Methods for reading/writing CLAUDE.md
   - Template generation for new files
   - Path resolution for workspace root

### File Locations
- **CLAUDE.md Location**: `{workspace_root}/CLAUDE.md`
- **Template Location**: Internal string constant or `.claude/templates/CLAUDE.md`

### Data Flow
```
User Opens Settings → Request loadClaudeMd → ConfigManager reads file →
Send claudeMdLoaded to UI → Display in editor → User edits →
Save button → saveClaudeMd message → ConfigManager writes →
Confirmation to UI
```

## 🎨 UI/UX Design

### Settings Panel Layout
```
Settings
├── MCP Servers
├── Permissions
│   ├── Tool Permissions
│   └── Always Allow Rules
├── CLAUDE.md Editor (NEW)
│   ├── Header: "Project Instructions (CLAUDE.md)"
│   ├── Info text: "Edit instructions that guide Claude's behavior"
│   ├── Editor area (Monaco or textarea)
│   └── Buttons: [Save] [Reset] [Load Template]
└── Custom Snippets
```

### Visual States
- **Empty State**: Show template with helpful comments
- **Loading State**: Spinner while loading file
- **Error State**: Red banner with error message
- **Success State**: Green checkmark on save

## 🧪 Testing Requirements

### Unit Tests
- ConfigManager CLAUDE.md read/write methods
- Message handler for new message types
- Template generation logic

### Integration Tests
- Full flow: Open settings → Load file → Edit → Save
- Error scenarios: Missing file, permission errors
- Template creation for new workspaces

### Manual Testing
- Cross-platform file handling (Windows/Mac/Linux)
- Large file performance (>100KB)
- Concurrent editing scenarios

## 🚀 Implementation Missions

### Mission 1: Backend Infrastructure
**Goal**: Set up file management and message handling
- [ ] Add CLAUDE.md methods to ConfigManager
- [ ] Create message types in MessageHandler
- [ ] Add handler methods in extension.ts
- [ ] Create default template

### Mission 2: UI Components
**Goal**: Build the editor interface
- [ ] Add CLAUDE.md section to settings HTML
- [ ] Implement editor component (Monaco/textarea)
- [ ] Add save/reset/template buttons
- [ ] Style with existing theme variables

### Mission 3: Integration & Flow
**Goal**: Connect UI with backend
- [ ] Wire up load on settings open
- [ ] Implement save functionality
- [ ] Add loading/error states
- [ ] Test full workflow

### Mission 4: Enhancement & Polish
**Goal**: Improve UX and add features
- [ ] Add syntax highlighting if using textarea
- [ ] Implement undo/redo if needed
- [ ] Add keyboard shortcuts (Ctrl+S to save)
- [ ] Add helpful tooltips and documentation

### Mission 5: Testing & Documentation
**Goal**: Ensure quality and maintainability
- [ ] Write unit tests
- [ ] Perform integration testing
- [ ] Update README with new feature
- [ ] Add inline code documentation

## 📊 Success Metrics
- Users can successfully edit CLAUDE.md without leaving VS Code
- Zero file corruption incidents
- <100ms load/save times
- Positive user feedback on ease of use

## 🔄 Dependencies
- Existing ConfigManager for file operations
- Current Settings UI framework
- VS Code file system API
- Potentially Monaco editor (if not using textarea)

## ⚠️ Risk Mitigation
- **File Corruption**: Always create backup before saving
- **Large Files**: Implement size limit (e.g., 1MB)
- **Concurrent Edits**: Warn if file changed externally
- **Permission Issues**: Clear error messages with solutions

## 📝 Notes
- Consider adding CLAUDE.md syntax validation
- Future: Support for multiple CLAUDE.md files per workspace
- Could integrate with IntelliSense for available variables/commands
- May want to add examples/snippets dropdown

---
*Created: 2025-09-20*
*Status: Ready for Implementation*
*Priority: Medium-High*