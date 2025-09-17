# Technical Constraints and Requirements

## Platform Requirements

### Minimum System Requirements
- **VS Code**: Version 1.94.0 or higher
- **Node.js**: Version 20.x (based on @types/node dependency)
- **TypeScript**: Version 5.8.3 or compatible
- **Operating System**: Windows (with optional WSL), macOS, Linux

### Claude Code Dependencies
- **Claude Code CLI**: Must be installed and configured
- **Claude API Access**: Active API subscription or Pro/Max plan
- **Internet Connection**: Required for Claude API communication

## VS Code Extension Constraints

### API Limitations
- **Webview Security**: Content Security Policy restrictions
- **Sandbox Environment**: Limited Node.js API access in webview context
- **Extension Host**: Single-threaded execution model
- **Memory Limits**: Extension memory usage monitored by VS Code

### Extension Lifecycle
- **Activation Events**: `onStartupFinished` - loads automatically
- **Command Registration**: Must register all commands in `contributes` section
- **Configuration Schema**: All settings must be predefined in package.json
- **View Providers**: Webview lifecycle managed by VS Code

## Development Constraints

### TypeScript Configuration
```json
{
  "target": "ES2022",
  "module": "Node16",
  "strict": true,
  "sourceMap": true
}
```

### Code Quality Requirements
- **ESLint Rules**: Enforced code standards
- **Naming Conventions**: camelCase/PascalCase for imports
- **Semicolons**: Required
- **Strict Mode**: All strict type-checking enabled

### Build Process Constraints
- **Output Directory**: Must compile to `out/` folder
- **Source Maps**: Required for debugging
- **Exclude Patterns**: MCP server code excluded from main build

## Security Constraints

### Permission System
- **Tool Execution**: All Claude Code tools require explicit permission
- **File System Access**: Limited to workspace boundaries
- **Command Execution**: Validated through permission middleware
- **YOLO Mode**: Optional security bypass (disabled by default)

### Data Protection
- **Local Storage**: Conversations stored in VS Code global state
- **API Keys**: Managed through Claude Code CLI configuration
- **File Access**: Workspace-scoped file operations only

## Performance Constraints

### Memory Management
- **Conversation History**: Large histories impact memory usage
- **Image Storage**: Images stored in `.claude/claude-code-chat-images/`
- **Session State**: Persistent state across VS Code restarts
- **WebView Memory**: Separate memory space for UI components

### Response Time Limitations
- **API Timeout**: Dependent on Claude API response times
- **Tool Execution**: Long-running commands can be cancelled
- **UI Responsiveness**: Non-blocking UI operations
- **File Operations**: Large file processing may impact performance

## Network Requirements

### API Communication
- **HTTPS Required**: Secure communication with Claude API
- **Rate Limiting**: Subject to Claude API rate limits
- **Regional Availability**: Claude API geographic restrictions
- **Proxy Support**: VS Code proxy settings respected

### MCP Server Communication
- **Local Servers**: Run on localhost with configurable ports
- **Protocol**: Model Context Protocol over stdio/HTTP
- **Server Lifecycle**: Managed by extension process

## File System Constraints

### File Access Patterns
```typescript
// Allowed patterns
workspace.workspaceFolders[0].uri.fsPath  // Workspace root access
path.join(extensionPath, 'resources')     // Extension resources
globalState.get('conversations')          // VS Code global storage

// Restricted patterns
os.homedir()                              // Home directory access
process.env                               // Environment variables
```

### Storage Limitations
- **Global State**: VS Code storage quota limits
- **Image Files**: Local file system space constraints
- **Conversation Files**: JSON serialization size limits
- **Backup Files**: Git repository size considerations

## WSL Integration Constraints

### Path Translation
- **Windows Paths**: `C:\Users\...` format
- **WSL Paths**: `/mnt/c/Users/...` format
- **Automatic Conversion**: Required for cross-platform compatibility
- **Shell Commands**: Must execute in correct environment

### Configuration Requirements
```json
{
  "claudeCodeChat.wsl.enabled": true,
  "claudeCodeChat.wsl.distro": "Ubuntu",
  "claudeCodeChat.wsl.nodePath": "/usr/bin/node",
  "claudeCodeChat.wsl.claudePath": "/usr/local/bin/claude"
}
```

## Browser/WebView Constraints

### Content Security Policy
```html
<!-- Allowed -->
<script nonce="...">...</script>
<style nonce="...">...</style>

<!-- Blocked -->
<script src="external-url"></script>
eval() and Function() constructors
inline event handlers
```

### Communication Limitations
- **Message Passing**: Only communication method between extension and webview
- **Serialization**: All data must be JSON serializable
- **Event Handling**: Async message handling required
- **State Synchronization**: Manual state management between contexts

## Deployment Constraints

### VS Code Marketplace
- **Package Size**: Maximum VSIX package size limits
- **Review Process**: Manual review for marketplace publication
- **Version Management**: Semantic versioning required
- **Metadata Requirements**: Complete package.json configuration

### Distribution Channels
```bash
# Primary
vsce publish
vsce package  # Creates .vsix file

# Secondary
GitHub Releases
Direct .vsix installation
```

## Error Handling Requirements

### Exception Management
- **Graceful Degradation**: Extension should not crash VS Code
- **Error Reporting**: User-friendly error messages
- **Logging**: Comprehensive logging for debugging
- **Recovery**: Automatic recovery from transient failures

### User Experience
- **Status Indicators**: Clear operation status display
- **Progress Feedback**: Long operations show progress
- **Cancellation**: User can cancel long-running operations
- **Fallback Options**: Alternative paths when features fail

## Licensing Constraints

### Open Source Compliance
- **License**: Proprietary license with specific terms
- **Dependencies**: All dependencies must have compatible licenses
- **Distribution**: License terms affect distribution methods
- **Attribution**: Required attribution for third-party components

### Legal Requirements
- **Privacy Policy**: Data handling disclosure
- **Terms of Service**: Usage terms for Claude API
- **Export Controls**: Software export restrictions
- **Intellectual Property**: Respect for third-party IP rights

## Future Constraint Considerations

### Scalability Limits
- **User Base Growth**: Performance at scale
- **Feature Complexity**: Maintainability vs functionality
- **API Evolution**: Adaptation to Claude API changes
- **Platform Updates**: VS Code API evolution

### Technical Debt
- **Code Maintenance**: Regular refactoring needs
- **Dependency Updates**: Security and compatibility updates
- **Testing Coverage**: Comprehensive test suite requirements
- **Documentation**: Keeping documentation current

## Mitigation Strategies

### Performance Optimization
- **Lazy Loading**: Load features on demand
- **Caching**: Cache frequently accessed data
- **Debouncing**: Limit API call frequency
- **Resource Cleanup**: Proper disposal of resources

### Security Hardening
- **Input Validation**: Validate all user inputs
- **Permission Auditing**: Regular permission review
- **Secure Defaults**: Safe default configurations
- **Update Management**: Regular security updates