import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import getHtml from './ui';
import { SessionManager } from './SessionManager';
import { ConversationManager, ConversationData } from './ConversationManager';
import { PermissionManager, PermissionRequest } from './PermissionManager';
import { BackupManager, CommitInfo } from './BackupManager';
import { ConfigManager } from './ConfigManager';
import { MessageHandler } from './MessageHandler';
import { AgentManager } from './AgentManager';
import * as yaml from 'js-yaml';

export function activate(context: vscode.ExtensionContext) {
	console.log('Claude Code Chat extension is being activated!');
	const provider = new ClaudeChatProvider(context.extensionUri, context);

	const disposable = vscode.commands.registerCommand('claude-code-chat.openChat', (column?: vscode.ViewColumn) => {
		console.log('Claude Code Chat command executed!');
		provider.show(column);
	});

	const loadConversationDisposable = vscode.commands.registerCommand('claude-code-chat.loadConversation', (filename: string) => {
		provider.loadConversation(filename);
	});

	// Register webview view provider for sidebar chat (using shared provider instance)
	const webviewProvider = new ClaudeChatWebviewProvider(context.extensionUri, context, provider);
	vscode.window.registerWebviewViewProvider('claude-code-chat.chat', webviewProvider);

	// Listen for configuration changes
	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('claudeCodeChat.wsl')) {
			console.log('WSL configuration changed, starting new session');
			provider.newSessionOnConfigChange();
		}
	});

	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = "Claude";
	statusBarItem.tooltip = "Open Claude Code Chat (Ctrl+Shift+C)";
	statusBarItem.command = 'claude-code-chat.openChat';
	statusBarItem.show();

	context.subscriptions.push(disposable, loadConversationDisposable, configChangeDisposable, statusBarItem);
	console.log('Claude Code Chat extension activation completed successfully!');
}

export function deactivate() { }

class ClaudeChatWebviewProvider implements vscode.WebviewViewProvider {
	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext,
		private readonly _chatProvider: ClaudeChatProvider
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		// Use the shared chat provider instance for the sidebar
		this._chatProvider.showInWebview(webviewView.webview, webviewView);

		// Handle visibility changes to reinitialize when sidebar reopens
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				// Close main panel when sidebar becomes visible
				if (this._chatProvider._panel) {
					console.log('Closing main panel because sidebar became visible');
					this._chatProvider._panel.dispose();
					this._chatProvider._panel = undefined;
				}
				this._chatProvider.reinitializeWebview();
			}
		});
	}
}

class ClaudeChatProvider {
	public _panel: vscode.WebviewPanel | undefined;
	private _webview: vscode.Webview | undefined;
	private _webviewView: vscode.WebviewView | undefined;
	private _disposables: vscode.Disposable[] = [];
	private _messageHandlerDisposable: vscode.Disposable | undefined;
	private _draftMessage: string = '';
	private _rawOutput: string = '';

	// Manager instances
	private _sessionManager: SessionManager;
	private _conversationManager: ConversationManager;
	private _permissionManager: PermissionManager;
	private _backupManager: BackupManager;
	private _configManager: ConfigManager;
	private _messageHandler: MessageHandler;
	private _agentManager: AgentManager;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext
	) {
		// Initialize managers
		this._sessionManager = new SessionManager(
			this._context,
			() => this._handleSessionCleared(),
			() => this._handleLoginRequired()
		);

		this._conversationManager = new ConversationManager(
			this._context,
			(conversation, startTime) => this._handleConversationLoaded(conversation, startTime)
		);

		this._permissionManager = new PermissionManager(
			this._context,
			(request) => this._handlePermissionRequest(request)
		);

		this._backupManager = new BackupManager(
			this._context,
			(commitInfo) => this._handleCommitCreated(commitInfo)
		);

		this._configManager = new ConfigManager(this._context, this._extensionUri);

		this._agentManager = new AgentManager(this._context);

		this._messageHandler = new MessageHandler(
			(message) => this._sendAndSaveMessage(message),
			(sessionId) => this._sessionManager.setSessionId(sessionId),
			() => this._sessionManager.handleLoginRequired(),
			() => this._handleProcessingComplete()
		);

		// Resume session from latest conversation
		const latestConversation = this._conversationManager.getLatestConversation();
		this._sessionManager.setSessionId(latestConversation?.sessionId);
	}

	public show(column: vscode.ViewColumn | vscode.Uri = vscode.ViewColumn.Two) {
		// Handle case where a URI is passed instead of ViewColumn
		const actualColumn = column instanceof vscode.Uri ? vscode.ViewColumn.Two : column;

		// Close sidebar if it's open
		this._closeSidebar();

		if (this._panel) {
			this._panel.reveal(actualColumn);
			return;
		}

		this._panel = vscode.window.createWebviewPanel(
			'claudeChat',
			'Claude Code Chat',
			actualColumn,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this._extensionUri]
			}
		);

		// Set icon for the webview tab using URI path
		const iconPath = vscode.Uri.joinPath(this._extensionUri, 'icon.png');
		this._panel.iconPath = iconPath;

		this._panel.webview.html = this._getHtmlForWebview();
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._setupWebviewMessageHandler(this._panel.webview);

		// Resume session from latest conversation
		const latestConversation = this._conversationManager.getLatestConversation();
		this._sessionManager.setSessionId(latestConversation?.sessionId);

		// Load latest conversation history if available
		if (latestConversation) {
			this._conversationManager.loadConversation(latestConversation.filename);
		}

		// Send ready message immediately
		setTimeout(() => {
			// If no conversation to load, send ready immediately
			if (!latestConversation) {
				this._sendReadyMessage();
			}
		}, 100);
	}

	private _postMessage(message: any) {
		if (this._panel && this._panel.webview) {
			this._panel.webview.postMessage(message);
		} else if (this._webview) {
			this._webview.postMessage(message);
		}
	}

	private _sendReadyMessage() {
		this._postMessage({
			type: 'ready',
			data: this._sessionManager.isProcessing ? 'Claude is working...' : 'Ready to chat with Claude Code! Type your message below.'
		});

		// Send current model to webview
		this._postMessage({
			type: 'modelSelected',
			model: this._sessionManager.selectedModel
		});

		// Send platform information to webview
		this._sendPlatformInfo();

		// Send current settings to webview
		this._sendCurrentSettings();

		// Send saved draft message if any
		if (this._draftMessage) {
			this._postMessage({
				type: 'restoreInputText',
				data: this._draftMessage
			});
		}
	}

	private _handleWebviewMessage(message: any) {
		switch (message.type) {
			case 'sendMessage':
				this._sendMessageToClaude(message.text, message.planMode, message.thinkingMode);
				return;
			case 'newSession':
				this._newSession();
				return;
			case 'restoreCommit':
				this._restoreToCommit(message.commitSha);
				return;
			case 'getConversationList':
				this._sendConversationList();
				return;
			case 'getCheckpoints':
				this._sendCheckpointList();
				return;
			case 'getWorkspaceFiles':
				this._sendWorkspaceFiles(message.searchTerm);
				return;
			case 'getWorkspaceFolders':
				this._sendWorkspaceFolders(message.searchTerm, message.currentPath);
				return;
			case 'selectImageFile':
				this._selectImageFile();
				return;
			case 'loadConversation':
				this.loadConversation(message.filename);
				return;
			case 'stopRequest':
				this._stopClaudeProcess();
				return;
			case 'getSettings':
				this._sendCurrentSettings();
				return;
			case 'updateSettings':
				this._updateSettings(message.settings);
				return;
			case 'getClipboardText':
				this._getClipboardText();
				return;
			case 'selectModel':
				this._sessionManager.setSelectedModel(message.model);
				return;
			case 'openModelTerminal':
				this._sessionManager.openModelTerminal();
				return;
			case 'executeSlashCommand':
				this._sessionManager.executeSlashCommand(message.command);
				return;
			case 'dismissWSLAlert':
				this._configManager.dismissWSLAlert();
				return;
			case 'openFile':
				this._openFileInEditor(message.filePath);
				return;
			case 'createImageFile':
				this._createImageFile(message.imageData, message.imageType);
				return;
			case 'permissionResponse':
				this._permissionManager.handlePermissionResponse(message.id, message.approved, message.alwaysAllow);
				return;
			case 'getPermissions':
				this._sendPermissions();
				return;
			case 'removePermission':
				this._removePermission(message.toolName, message.command);
				return;
			case 'addPermission':
				this._addPermission(message.toolName, message.command);
				return;
			case 'loadMCPServers':
				this._loadMCPServers();
				return;
			case 'saveMCPServer':
				this._saveMCPServer(message.name, message.config, message.scope);
				return;
			case 'deleteMCPServer':
				this._deleteMCPServer(message.name);
				return;
			case 'testMCPServer':
				this._testMCPServer(message.name);
				return;
			case 'getCustomSnippets':
				this._sendCustomSnippets();
				return;
			case 'saveCustomSnippet':
				this._saveCustomSnippet(message.snippet);
				return;
			case 'deleteCustomSnippet':
				this._deleteCustomSnippet(message.snippetId);
				return;
			case 'enableYoloMode':
				this._enableYoloMode();
				return;
			case 'saveInputText':
				this._saveInputText(message.text);
				return;
			case 'runAbMethod':
				this._runAbMethod();
				return;
			case 'loadClaudeMd':
				this._loadClaudeMd();
				return;
			case 'saveClaudeMd':
				this._saveClaudeMd(message.content);
				return;
			case 'getAgents':
				this._getAgents(message.scope);
				return;
			case 'getAgent':
				this._getAgent(message.name, message.scope);
				return;
			case 'createAgent':
				this._createAgent(message.agent, message.overwrite);
				return;
			case 'updateAgent':
				this._updateAgent(message.name, message.scope, message.updates);
				return;
			case 'deleteAgent':
				this._deleteAgent(message.name, message.scope);
				return;
			case 'cloneAgent':
				this._cloneAgent(message.name, message.fromScope, message.toScope, message.newName);
				return;
			case 'searchAgents':
				this._searchAgents(message.query, message.scope);
				return;
			case 'exportAgent':
				this._exportAgent(message.name, message.scope);
				return;
			case 'importAgent':
				this._importAgent(message.content, message.scope, message.overwrite);
				return;
			case 'generateAgentWithAI':
				this._generateAgentWithAI(message.prompt, message.scope);
				return;
		}
	}

	private _setupWebviewMessageHandler(webview: vscode.Webview) {
		// Dispose of any existing message handler
		if (this._messageHandlerDisposable) {
			this._messageHandlerDisposable.dispose();
		}

		// Set up new message handler
		this._messageHandlerDisposable = webview.onDidReceiveMessage(
			message => this._handleWebviewMessage(message),
			null,
			this._disposables
		);
	}

	private _closeSidebar() {
		if (this._webviewView) {
			// Switch VS Code to show Explorer view instead of chat sidebar
			vscode.commands.executeCommand('workbench.view.explorer');
		}
	}

	public showInWebview(webview: vscode.Webview, webviewView?: vscode.WebviewView) {
		// Close main panel if it's open
		if (this._panel) {
			console.log('Closing main panel because sidebar is opening');
			this._panel.dispose();
			this._panel = undefined;
		}

		this._webview = webview;
		this._webviewView = webviewView;
		this._webview.html = this._getHtmlForWebview();

		this._setupWebviewMessageHandler(this._webview);

		// Initialize the webview
		this._initializeWebview();
	}

	private _initializeWebview() {
		// Resume session from latest conversation
		const latestConversation = this._conversationManager.getLatestConversation();
		this._sessionManager.setSessionId(latestConversation?.sessionId);

		// Load latest conversation history if available
		if (latestConversation) {
			this._conversationManager.loadConversation(latestConversation.filename);
		} else {
			// If no conversation to load, send ready immediately
			setTimeout(() => {
				this._sendReadyMessage();
			}, 100);
		}
	}

	public reinitializeWebview() {
		// Only reinitialize if we have a webview (sidebar)
		if (this._webview) {
			this._initializeWebview();
			// Set up message handler for the webview
			this._setupWebviewMessageHandler(this._webview);
		}
	}

	private async _sendMessageToClaude(message: string, planMode?: boolean, thinkingMode?: boolean) {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

		// Get thinking intensity setting
		const configThink = vscode.workspace.getConfiguration('claudeCodeChat');
		const thinkingIntensity = configThink.get<string>('thinking.intensity', 'think');

		// Prepend mode instructions if enabled
		let actualMessage = message;
		if (planMode) {
			actualMessage = 'PLAN MODE: Plan first before making any changes. Show me in detail what you will change and wait for my explicit approval in a separate message before proceeding. Do not implement anything until I confirm. If I ask to change or alter the plan then alter plan with my request in mind. Once i apporove be sure to create a detailed prompt for the plan to paste in a new chat. \n\n' + message;
		}
		if (thinkingMode) {
			let thinkingPrompt = '';
			const thinkingMessage = ' THROUGH THIS STEP BY STEP: \n';
			switch (thinkingIntensity) {
				case 'think':
					thinkingPrompt = 'THINK';
					break;
				case 'think-hard':
					thinkingPrompt = 'THINK HARD';
					break;
				case 'think-harder':
					thinkingPrompt = 'THINK HARDER';
					break;
				case 'ultrathink':
					thinkingPrompt = 'ULTRATHINK';
					break;
				default:
					thinkingPrompt = 'THINK';
			}
			actualMessage = thinkingPrompt + thinkingMessage + actualMessage;
		}

		this._sessionManager.setProcessing(true);

		// Clear draft message since we're sending it
		this._draftMessage = '';

		// Show original user input in chat and save to conversation (without mode prefixes)
		this._sendAndSaveMessage({
			type: 'userInput',
			data: message
		});

		// Set processing state to true
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: true }
		});

		// Create backup commit before Claude makes changes
		try {
			await this._backupManager.createBackupCommit(message);
		}
		catch (e) {
			console.log("error", e);
		}

		// Show loading indicator
		this._postMessage({
			type: 'loading',
			data: 'Claude is working...'
		});

		// Get configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const yoloMode = config.get<boolean>('permissions.yoloMode', false);

		// Get MCP config path
		const mcpConfigPath = this._configManager.getMCPConfigPath();
		const convertedMcpConfigPath = mcpConfigPath ? this._configManager.convertToWSLPath(mcpConfigPath) : undefined;

		// Build command arguments
		const args = this._sessionManager.buildClaudeArgs(convertedMcpConfigPath, yoloMode);

		console.log('Claude command args:', args);

		// Create Claude process
		const claudeProcess = this._sessionManager.createClaudeProcess(args, actualMessage, cwd);

		this._rawOutput = '';
		let errorOutput = '';

		if (claudeProcess.stdout) {
			claudeProcess.stdout.on('data', (data) => {
				this._rawOutput += data.toString();

				// Process JSON stream line by line
				const lines = this._rawOutput.split('\n');
				this._rawOutput = lines.pop() || ''; // Keep incomplete line for next chunk

				for (const line of lines) {
					if (line.trim()) {
						try {
							const jsonData = JSON.parse(line.trim());
							this._messageHandler.processJsonStreamData(jsonData);
						} catch (error) {
							console.log('Failed to parse JSON line:', line, error);
						}
					}
				}
			});
		}

		if (claudeProcess.stderr) {
			claudeProcess.stderr.on('data', (data) => {
				errorOutput += data.toString();
			});
		}

		claudeProcess.on('close', (code) => {
			console.log('Claude process closed with code:', code);
			console.log('Claude stderr output:', errorOutput);

			if (!this._sessionManager.currentProcess) {
				return;
			}

			// Clear loading indicator and set processing to false
			this._postMessage({
				type: 'clearLoading'
			});

			// Reset processing state
			this._sessionManager.setProcessing(false);

			// Clear processing state
			this._postMessage({
				type: 'setProcessing',
				data: { isProcessing: false }
			});

			if (code !== 0 && errorOutput.trim()) {
				// Error with output
				this._sendAndSaveMessage({
					type: 'error',
					data: errorOutput.trim()
				});
			}
		});

		claudeProcess.on('error', (error) => {
			console.log('Claude process error:', error.message);

			if (!this._sessionManager.currentProcess) {
				return;
			}

			this._postMessage({
				type: 'clearLoading'
			});

			this._sessionManager.setProcessing(false);

			// Clear processing state
			this._postMessage({
				type: 'setProcessing',
				data: { isProcessing: false }
			});

			// Check if claude command is not installed
			if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
				this._sendAndSaveMessage({
					type: 'error',
					data: 'Install claude code first: https://www.anthropic.com/claude-code'
				});
			} else {
				this._sendAndSaveMessage({
					type: 'error',
					data: `Error running Claude: ${error.message}`
				});
			}
		});
	}

	// Event handlers for manager callbacks
	private _handleSessionCleared() {
		// Clear conversations and commits
		this._conversationManager.clearConversation();
		this._backupManager.clearCommits();

		// Reset counters in message handler
		this._messageHandler.resetCounters();

		// Notify webview to clear all messages and reset session
		this._postMessage({
			type: 'sessionCleared'
		});
	}

	private _handleLoginRequired() {
		this._sessionManager.setProcessing(false);

		// Clear processing state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Show login required message
		this._postMessage({
			type: 'loginRequired'
		});

		// Send message to UI about terminal
		this._postMessage({
			type: 'terminalOpened',
			data: `Please login to Claude in the terminal, then come back to this chat to continue.`,
		});
	}

	private _handleConversationLoaded(conversation: Array<{ timestamp: string, messageType: string, data: any }>, startTime: string | undefined) {
		// Clear UI messages first, then send all messages to recreate the conversation
		setTimeout(() => {
			// Clear existing messages
			this._postMessage({
				type: 'sessionCleared'
			});

			let requestStartTime: number;

			// Small delay to ensure messages are cleared before loading new ones
			setTimeout(() => {
				const messages = conversation;
				for (let i = 0; i < messages.length; i++) {
					const message = messages[i];

					if(message.messageType === 'permissionRequest'){
						const isLast = i === messages.length - 1;
						if(!isLast){
							continue;
						}
					}

					this._postMessage({
						type: message.messageType,
						data: message.data
					});
					if (message.messageType === 'userInput') {
						try {
							requestStartTime = new Date(message.timestamp).getTime();
						} catch (e) {
							console.log(e);
						}
					}
				}

				// Send updated totals
				this._postMessage({
					type: 'updateTotals',
					data: {
						totalCost: this._messageHandler.totalCost,
						totalTokensInput: this._messageHandler.totalTokensInput,
						totalTokensOutput: this._messageHandler.totalTokensOutput,
						requestCount: this._messageHandler.requestCount
					}
				});

				// Restore processing state if the conversation was saved while processing
				if (this._sessionManager.isProcessing) {
					this._postMessage({
						type: 'setProcessing',
						data: { isProcessing: this._sessionManager.isProcessing, requestStartTime }
					});
				}
				// Send ready message after conversation is loaded
				this._sendReadyMessage();
			}, 50);
		}, 100); // Small delay to ensure webview is ready
	}

	private _handlePermissionRequest(request: PermissionRequest) {
		// Send permission request to the UI
		this._sendAndSaveMessage({
			type: 'permissionRequest',
			data: {
				id: request.id,
				tool: request.tool,
				input: request.input,
				pattern: request.pattern
			}
		});
	}

	private _handleCommitCreated(commitInfo: CommitInfo) {
		// Show restore option in UI and save to conversation
		this._sendAndSaveMessage({
			type: 'showRestoreOption',
			data: commitInfo
		});
	}

	private _handleProcessingComplete() {
		this._sessionManager.setProcessing(false);

		// Clear processing state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});
	}

	private _newSession() {
		this._sessionManager.clearSession();
	}

	public newSessionOnConfigChange() {
		// Start a new session due to configuration change
		this._sessionManager.handleConfigChange();

		// Send message to webview about the config change
		this._sendAndSaveMessage({
			type: 'configChanged',
			data: '⚙️ WSL configuration changed. Started a new session.'
		});
	}

	private async _restoreToCommit(commitSha: string): Promise<void> {
		const result = await this._backupManager.restoreToCommit(commitSha);

		if (result.success) {
			this._sendAndSaveMessage({
				type: 'restoreSuccess',
				data: {
					message: result.message,
					commitSha: commitSha
				}
			});

			// Refresh the checkpoint list after restoration
			this._sendCheckpointList();

			// Clear the conversation after the restored checkpoint
			// This ensures the conversation reflects the new timeline
			const commitIndex = this._backupManager.commits.findIndex(c => c.sha === commitSha);
			if (commitIndex !== -1) {
				// Keep only messages up to this checkpoint
				this._conversationManager.truncateAfterCheckpoint(commitIndex);
			}
		} else {
			this._postMessage({
				type: 'restoreError',
				data: result.error
			});
		}
	}

	private _sendAndSaveMessage(message: { type: string, data: any }): void {
		// Send to UI using the helper method
		this._postMessage(message);

		// Save to conversation
		this._conversationManager.addMessage(message.type, message.data);

		// Persist conversation with current data
		if (this._sessionManager.currentSessionId) {
			this._conversationManager.saveConversationWithData(
				this._sessionManager.currentSessionId,
				this._messageHandler.totalCost,
				this._messageHandler.totalTokensInput,
				this._messageHandler.totalTokensOutput
			);
		}
	}

	public async loadConversation(filename: string): Promise<void> {
		await this._conversationManager.loadConversation(filename);
	}

	private _sendConversationList(): void {
		this._postMessage({
			type: 'conversationList',
			data: this._conversationManager.getConversationList()
		});
	}

	private _sendCheckpointList(): void {
		// Get all commits from BackupManager and send to UI
		const checkpoints = this._backupManager.commits;
		this._postMessage({
			type: 'checkpointList',
			data: checkpoints
		});
	}

	private async _sendWorkspaceFiles(searchTerm?: string): Promise<void> {
		try {
			// Always get all files and filter on the backend for better search results
			const files = await vscode.workspace.findFiles(
				'**/*',
				'{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.next/**,**/.nuxt/**,**/target/**,**/bin/**,**/obj/**}',
				500 // Reasonable limit for filtering
			);

			let fileList = files.map(file => {
				const relativePath = vscode.workspace.asRelativePath(file);
				return {
					name: file.path.split('/').pop() || '',
					path: relativePath,
					fsPath: file.fsPath
				};
			});

			// Filter results based on search term
			if (searchTerm && searchTerm.trim()) {
				const term = searchTerm.toLowerCase();
				fileList = fileList.filter(file => {
					const fileName = file.name.toLowerCase();
					const filePath = file.path.toLowerCase();

					// Check if term matches filename or any part of the path
					return fileName.includes(term) ||
						filePath.includes(term) ||
						filePath.split('/').some(segment => segment.includes(term));
				});
			}

			// Sort and limit results
			fileList = fileList
				.sort((a, b) => a.name.localeCompare(b.name))
				.slice(0, 50);

			this._postMessage({
				type: 'workspaceFiles',
				data: fileList
			});
		} catch (error) {
			console.error('Error getting workspace files:', error);
			this._postMessage({
				type: 'workspaceFiles',
				data: []
			});
		}
	}

	private async _sendWorkspaceFolders(searchTerm?: string, currentPath?: string): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				this._postMessage({
					type: 'workspaceFolders',
					data: []
				});
				return;
			}

			// Base path - either current path or workspace root
			const basePath = currentPath
				? vscode.Uri.joinPath(workspaceFolder.uri, currentPath)
				: workspaceFolder.uri;

			// Read directory contents
			const dirContents = await vscode.workspace.fs.readDirectory(basePath);

			// Filter for directories only and exclude common directories
			const excludedDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'target', 'bin', 'obj', '.vscode', '.ab-method']);

			let folderList = dirContents
				.filter(([name, type]) => {
					return type === vscode.FileType.Directory && !excludedDirs.has(name) && !name.startsWith('.');
				})
				.map(([name, type]) => {
					const folderPath = currentPath ? `${currentPath}/${name}` : name;
					return {
						name: name,
						path: folderPath,
						type: 'folder',
						isDirectory: true
					};
				});

			// Filter results based on search term
			if (searchTerm && searchTerm.trim()) {
				const term = searchTerm.toLowerCase();
				folderList = folderList.filter(folder => {
					const folderName = folder.name.toLowerCase();
					const folderPath = folder.path.toLowerCase();

					// Check if term matches folder name or any part of the path
					return folderName.includes(term) ||
						folderPath.includes(term) ||
						folderPath.split('/').some(segment => segment.includes(term));
				});
			}

			// Sort and limit results
			folderList = folderList
				.sort((a, b) => a.name.localeCompare(b.name))
				.slice(0, 50);

			this._postMessage({
				type: 'workspaceFolders',
				data: folderList,
				currentPath: currentPath || ''
			});
		} catch (error) {
			console.error('Error getting workspace folders:', error);
			this._postMessage({
				type: 'workspaceFolders',
				data: [],
				currentPath: currentPath || ''
			});
		}
	}

	private async _selectImageFile(): Promise<void> {
		try {
			// Show VS Code's native file picker for images
			const result = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: true,
				title: 'Select image files',
				filters: {
					'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']
				}
			});

			if (result && result.length > 0) {
				// Send the selected file paths back to webview
				result.forEach(uri => {
					this._postMessage({
						type: 'imagePath',
						path: uri.fsPath
					});
				});
			}
		} catch (error) {
			console.error('Error selecting image files:', error);
		}
	}

	private _stopClaudeProcess(): void {
		this._sessionManager.stopProcess();

		// Update UI state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Immediately clear any loading or streaming states
		this._postMessage({
			type: 'immediateStop'
		});

		this._postMessage({
			type: 'clearLoading'
		});

		// Stop any ongoing message streaming to UI
		this._postMessage({
			type: 'stopStreaming'
		});

		// Send stop confirmation message directly to UI and save
		this._sendAndSaveMessage({
			type: 'error',
			data: '⏹️ Claude code was stopped.'
		});

		// Clear any internal buffer state
		this._clearInternalBuffers();
	}

	private _clearInternalBuffers(): void {
		this._rawOutput = '';
	}

	private _sendCurrentSettings(): void {
		const settings = this._configManager.getCurrentSettings();
		this._postMessage({
			type: 'settingsData',
			data: settings
		});
	}

	private async _enableYoloMode(): Promise<void> {
		try {
			await this._configManager.enableYoloMode();
			// Send updated settings to UI
			this._sendCurrentSettings();
		} catch (error) {
			console.error('Error enabling YOLO mode:', error);
		}
	}

	private _saveInputText(text: string): void {
		this._draftMessage = text || '';
	}

	private async _runAbMethod(): Promise<void> {
		try {
			// Get the workspace folder
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				vscode.window.showErrorMessage('No workspace folder found');
				return;
			}

			// Create a new terminal
			const terminal = vscode.window.createTerminal({
				name: 'AB Method',
				cwd: workspaceFolder.uri.fsPath
			});

			// Show the terminal
			terminal.show();

			// Send the command
			terminal.sendText('npx ab-method');

			// Small delay then send 'y'
			setTimeout(() => {
				terminal.sendText('y');
			}, 2000);

			// Send success message to UI
			this._sendAndSaveMessage({
				type: 'info',
				data: '🚀 AB Method installation started in terminal. Check the terminal for progress.'
			});

			// Monitor terminal disposal to check result
			const disposable = vscode.window.onDidCloseTerminal((closedTerminal) => {
				if (closedTerminal === terminal) {
					// Check if ab-method was successfully installed
					this._checkAbMethodInstallation();
					disposable.dispose();
				}
			});

		} catch (error) {
			console.error('Error running AB Method:', error);
			this._sendAndSaveMessage({
				type: 'error',
				data: `❌ Failed to run AB Method: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		}
	}

	private async _checkAbMethodInstallation(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				return;
			}

			// Check if .ab-method folder exists
			const abMethodPath = vscode.Uri.joinPath(workspaceFolder.uri, '.ab-method');

			try {
				const stat = await vscode.workspace.fs.stat(abMethodPath);
				if (stat.type === vscode.FileType.Directory) {
					// AB Method successfully installed
					this._sendAndSaveMessage({
						type: 'success',
						data: '✅ AB Method successfully installed in your project!'
					});
				} else {
					this._sendAndSaveMessage({
						type: 'error',
						data: '❌ AB Method installation failed - .ab-method directory not found'
					});
				}
			} catch (error) {
				// Directory doesn't exist
				this._sendAndSaveMessage({
					type: 'error',
					data: '❌ AB Method installation failed - .ab-method directory not found'
				});
			}
		} catch (error) {
			console.error('Error checking AB Method installation:', error);
			this._sendAndSaveMessage({
				type: 'error',
				data: '❌ Error checking AB Method installation status'
			});
		}
	}

	private async _updateSettings(settings: { [key: string]: any }): Promise<void> {
		try {
			await this._configManager.updateSettings(settings);
		} catch (error) {
			// Error handling is done in ConfigManager
		}
	}

	private async _getClipboardText(): Promise<void> {
		try {
			const text = await vscode.env.clipboard.readText();
			this._postMessage({
				type: 'clipboardText',
				data: text
			});
		} catch (error) {
			console.error('Failed to read clipboard:', error);
		}
	}

	private _sendPlatformInfo() {
		const platformInfo = this._configManager.getPlatformInfo();
		this._postMessage({
			type: 'platformInfo',
			data: platformInfo
		});
	}

	private async _openFileInEditor(filePath: string) {
		try {
			const uri = vscode.Uri.file(filePath);
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
			console.error('Error opening file:', error);
		}
	}

	private async _createImageFile(imageData: string, imageType: string) {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) { return; }

			// Extract base64 data from data URL
			const base64Data = imageData.split(',')[1];
			const buffer = Buffer.from(base64Data, 'base64');

			// Get file extension from image type
			const extension = imageType.split('/')[1] || 'png';

			// Create unique filename with timestamp
			const timestamp = Date.now();
			const imageFileName = `image_${timestamp}.${extension}`;

			// Create images folder in workspace .claude directory
			const imagesDir = vscode.Uri.joinPath(workspaceFolder.uri, '.claude', 'claude-code-chat-images');
			await vscode.workspace.fs.createDirectory(imagesDir);

			// Create .gitignore to ignore all images
			const gitignorePath = vscode.Uri.joinPath(imagesDir, '.gitignore');
			try {
				await vscode.workspace.fs.stat(gitignorePath);
			} catch {
				// .gitignore doesn't exist, create it
				const gitignoreContent = new TextEncoder().encode('*\n');
				await vscode.workspace.fs.writeFile(gitignorePath, gitignoreContent);
			}

			// Create the image file
			const imagePath = vscode.Uri.joinPath(imagesDir, imageFileName);
			await vscode.workspace.fs.writeFile(imagePath, buffer);

			// Send the file path back to webview
			this._postMessage({
				type: 'imagePath',
				data: {
					filePath: imagePath.fsPath
				}
			});
		} catch (error) {
			console.error('Error creating image file:', error);
			vscode.window.showErrorMessage('Failed to create image file');
		}
	}

	private async _sendPermissions(): Promise<void> {
		try {
			const permissions = await this._permissionManager.getPermissions();
			this._postMessage({
				type: 'permissionsData',
				data: permissions
			});
		} catch (error) {
			console.error('Error sending permissions:', error);
			this._postMessage({
				type: 'permissionsData',
				data: { alwaysAllow: {} }
			});
		}
	}

	private async _removePermission(toolName: string, command: string | null): Promise<void> {
		try {
			await this._permissionManager.removePermission(toolName, command);
			// Send updated permissions to UI
			this._sendPermissions();
		} catch (error) {
			console.error('Error removing permission:', error);
		}
	}

	private async _addPermission(toolName: string, command: string | null): Promise<void> {
		try {
			await this._permissionManager.addPermission(toolName, command);
			// Send updated permissions to UI
			this._sendPermissions();
		} catch (error) {
			console.error('Error adding permission:', error);
		}
	}

	private async _loadMCPServers(): Promise<void> {
		try {
			// Use enhanced loading that combines CLI and JSON config
			const servers = await this._configManager.loadEnhancedMCPServers();
			this._postMessage({ type: 'mcpServers', data: servers });
		} catch (error) {
			console.error('Error loading MCP servers:', error);
			this._postMessage({ type: 'mcpServerError', data: { error: 'Failed to load MCP servers' } });
		}
	}

	private async _saveMCPServer(name: string, config: any, scope: string = 'local'): Promise<void> {
		try {
			// Use unified method that tries CLI first, falls back to JSON
			await this._configManager.addMCPServerUnified(name, config, scope);
			this._postMessage({ type: 'mcpServerSaved', data: { name } });
		} catch (error) {
			console.error('Error saving MCP server:', error);
			this._postMessage({ type: 'mcpServerError', data: { error: 'Failed to save MCP server' } });
		}
	}

	private async _deleteMCPServer(name: string): Promise<void> {
		try {
			// Use unified method that tries CLI first, falls back to JSON
			await this._configManager.removeMCPServerUnified(name);
			this._postMessage({ type: 'mcpServerDeleted', data: { name } });
		} catch (error) {
			console.error('Error deleting MCP server:', error);
			this._postMessage({ type: 'mcpServerError', data: { error: 'Failed to delete MCP server' } });
		}
	}

	private async _testMCPServer(name: string): Promise<void> {
		try {
			const isWorking = await this._configManager.testMCPServerViaCLI(name);
			this._postMessage({
				type: 'mcpServerTested',
				data: {
					name,
					status: isWorking ? 'success' : 'failed',
					message: isWorking ? 'Server is working correctly' : 'Server test failed'
				}
			});
		} catch (error: any) {
			console.error('Error testing MCP server:', error);
			this._postMessage({
				type: 'mcpServerTested',
				data: {
					name,
					status: 'error',
					message: `Test failed: ${error?.message || 'Unknown error'}`
				}
			});
		}
	}

	private async _sendCustomSnippets(): Promise<void> {
		try {
			const customSnippets = this._configManager.getCustomSnippets();
			this._postMessage({
				type: 'customSnippetsData',
				data: customSnippets
			});
		} catch (error) {
			console.error('Error loading custom snippets:', error);
			this._postMessage({
				type: 'customSnippetsData',
				data: {}
			});
		}
	}

	private async _saveCustomSnippet(snippet: any): Promise<void> {
		try {
			await this._configManager.saveCustomSnippet(snippet);
			this._postMessage({
				type: 'customSnippetSaved',
				data: { snippet }
			});
		} catch (error) {
			console.error('Error saving custom snippet:', error);
			this._postMessage({
				type: 'error',
				data: 'Failed to save custom snippet'
			});
		}
	}

	private async _deleteCustomSnippet(snippetId: string): Promise<void> {
		try {
			await this._configManager.deleteCustomSnippet(snippetId);
			this._postMessage({
				type: 'customSnippetDeleted',
				data: { snippetId }
			});
		} catch (error) {
			console.error('Error deleting custom snippet:', error);
			this._postMessage({
				type: 'error',
				data: 'Failed to delete custom snippet'
			});
		}
	}

	private async _loadClaudeMd(): Promise<void> {
		try {
			const result = await this._configManager.readClaudeMd();
			this._postMessage({
				type: 'claudeMdLoaded',
				data: {
					content: result.content,
					exists: result.exists,
					template: result.template
				}
			});
		} catch (error) {
			console.error('Error loading CLAUDE.md:', error);
			this._postMessage({
				type: 'claudeMdError',
				data: 'Failed to load CLAUDE.md file'
			});
		}
	}

	private async _saveClaudeMd(content: string): Promise<void> {
		try {
			// Validate size
			const isValidSize = await this._configManager.validateClaudeMdSize(content);
			if (!isValidSize) {
				this._postMessage({
					type: 'claudeMdError',
					data: 'File is too large (max 1MB)'
				});
				return;
			}

			// Save the file
			await this._configManager.writeClaudeMd(content);

			this._postMessage({
				type: 'claudeMdSaved',
				data: 'CLAUDE.md saved successfully'
			});
		} catch (error) {
			console.error('Error saving CLAUDE.md:', error);
			this._postMessage({
				type: 'claudeMdError',
				data: 'Failed to save CLAUDE.md file'
			});
		}
	}

	// Agent-related methods
	private async _getAgents(scope: 'local' | 'user' | 'both'): Promise<void> {
		try {
			const agents = await this._agentManager.listAgents(scope);
			this._postMessage({
				type: 'agentsList',
				agents: agents
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _getAgent(name: string, scope: 'local' | 'user'): Promise<void> {
		try {
			const agent = await this._agentManager.getAgent(name, scope);
			this._postMessage({
				type: 'agentDetails',
				agent: agent
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _createAgent(agent: any, overwrite: boolean): Promise<void> {
		try {
			const created = await this._agentManager.createAgent(agent, overwrite);
			this._postMessage({
				type: 'agentCreated',
				agent: created
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _updateAgent(name: string, scope: 'local' | 'user', updates: any): Promise<void> {
		try {
			const updated = await this._agentManager.updateAgent(name, scope, updates);
			this._postMessage({
				type: 'agentUpdated',
				agent: updated
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _deleteAgent(name: string, scope: 'local' | 'user'): Promise<void> {
		try {
			const deleted = await this._agentManager.deleteAgent(name, scope);
			this._postMessage({
				type: 'agentDeleted',
				success: deleted,
				name: name,
				scope: scope
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _cloneAgent(name: string, fromScope: 'local' | 'user', toScope: 'local' | 'user', newName?: string): Promise<void> {
		try {
			const cloned = await this._agentManager.cloneAgent(name, fromScope, toScope, newName);
			this._postMessage({
				type: 'agentCloned',
				agent: cloned
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _searchAgents(query: string, scope: 'local' | 'user' | 'both'): Promise<void> {
		try {
			const agents = await this._agentManager.searchAgents(query, scope);
			this._postMessage({
				type: 'agentsSearchResults',
				agents: agents
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _exportAgent(name: string, scope: 'local' | 'user'): Promise<void> {
		try {
			const content = await this._agentManager.exportAgent(name, scope);

			// Show save dialog
			const uri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(`${name}.md`),
				filters: {
					'Markdown': ['md'],
					'All Files': ['*']
				}
			});

			if (uri) {
				await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
				this._postMessage({
					type: 'agentExported',
					success: true,
					path: uri.fsPath
				});
			}
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _importAgent(content: string | undefined, scope: 'local' | 'user', overwrite: boolean): Promise<void> {
		try {
			let agentContent = content;

			// If no content provided, show file picker
			if (!agentContent) {
				const uri = await vscode.window.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					filters: {
						'Markdown': ['md'],
						'All Files': ['*']
					}
				});

				if (uri && uri[0]) {
					const fileContent = await vscode.workspace.fs.readFile(uri[0]);
					agentContent = Buffer.from(fileContent).toString('utf-8');
				} else {
					return;
				}
			}

			const imported = await this._agentManager.importAgent(agentContent, scope, overwrite);
			this._postMessage({
				type: 'agentImported',
				agent: imported
			});
		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private async _generateAgentWithAI(prompt: string, scope: 'local' | 'user'): Promise<void> {
		try {
			// Notify UI that generation has started
			this._postMessage({
				type: 'agentGenerationStarted',
				prompt: prompt
			});

			// Create the prompt for Claude to generate the agent
			const aiPrompt = `Generate a Claude Code agent based on this request: "${prompt}"

Please create an agent in YAML frontmatter format with:
- name: A short, descriptive name (no spaces, use hyphens)
- description: A clear description of what the agent does
- model: Choose from opus, sonnet, or haiku (optional, based on complexity needs)
- color: Choose from green, blue, red, cyan, yellow, purple, orange, pink (optional)

Followed by the system prompt that defines the agent's behavior.

IMPORTANT: Return ONLY the agent definition in this exact format, nothing else:

\`\`\`yaml
---
name: agent-name-here
description: Clear description here
model: opus
color: blue
---

Your detailed system prompt here...
\`\`\``;

			// Create a separate Claude process for agent generation
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

			// Create args for claude command - use simple mode without tools
			const args = ['-p', '--dangerously-skip-permissions'];

			// Create the Claude process
			const claudeProcess = this._sessionManager.createClaudeProcess(args, aiPrompt, cwd);

			let fullResponse = '';

			// Handle stdout data
			if (claudeProcess.stdout) {
				claudeProcess.stdout.on('data', (data: Buffer) => {
					fullResponse += data.toString();
				});
			}

			// Handle stderr data for debugging
			if (claudeProcess.stderr) {
				claudeProcess.stderr.on('data', (data: Buffer) => {
					console.error('Agent generation stderr:', data.toString());
				});
			}

			// Handle process completion
			claudeProcess.on('close', (code) => {
				if (code === 0) {
					// Parse the generated agent from the response
					const agentData = this._parseGeneratedAgent(fullResponse);
					if (agentData) {
						// Send the parsed agent to the UI form
						this._postMessage({
							type: 'agentGenerated',
							agent: {
								...agentData,
								scope
							}
						});
					} else {
						this._postMessage({
							type: 'agentError',
							error: 'Failed to parse generated agent. Please try again with a clearer description.'
						});
					}
				} else {
					this._postMessage({
						type: 'agentError',
						error: 'Agent generation failed. Please try again.'
					});
				}
			});

			// Handle errors
			claudeProcess.on('error', (error) => {
				console.error('Agent generation process error:', error);
				this._postMessage({
					type: 'agentError',
					error: error.message || 'Failed to generate agent'
				});
			});

			// Note: createClaudeProcess already handles sending the prompt internally
			// so we don't need to write to stdin here

		} catch (error) {
			this._postMessage({
				type: 'agentError',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	private _parseGeneratedAgent(text: string): any {
		// Look for YAML frontmatter pattern in the text
		// Check for code blocks with yaml
		const codeBlockRegex = /```(?:yaml|yml)?\n(---\n[\s\S]*?---\n[\s\S]*?)```/;
		const match = text.match(codeBlockRegex);

		if (match) {
			try {
				const agentContent = match[1];
				// Parse the frontmatter
				const frontmatterEndIndex = agentContent.indexOf('\n---', 4);
				if (frontmatterEndIndex === -1) {
					return null;
				}

				const yamlContent = agentContent.substring(4, frontmatterEndIndex).trim();
				const systemPrompt = agentContent.substring(frontmatterEndIndex + 4).trim();

				// Parse YAML
				const metadata = yaml.load(yamlContent) as any;

				if (metadata && metadata.name && metadata.description) {
					return {
						metadata: {
							name: metadata.name,
							description: metadata.description,
							model: metadata.model,
							color: metadata.color,
							tools: metadata.tools
						},
						systemPrompt: systemPrompt
					};
				}
			} catch (error) {
				console.error('Failed to parse generated agent:', error);
			}
		}

		// Also check for plain frontmatter without code block
		const plainRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/m;
		const plainMatch = text.match(plainRegex);

		if (plainMatch) {
			try {
				const yamlContent = plainMatch[1];
				const systemPrompt = plainMatch[2];

				const metadata = yaml.load(yamlContent) as any;

				if (metadata && metadata.name && metadata.description) {
					return {
						metadata: {
							name: metadata.name,
							description: metadata.description,
							model: metadata.model,
							color: metadata.color,
							tools: metadata.tools
						},
						systemPrompt: systemPrompt
					};
				}
			} catch (error) {
				console.error('Failed to parse generated agent:', error);
			}
		}

		return null;
	}

	private _getHtmlForWebview(): string {
		return getHtml(vscode.env?.isTelemetryEnabled);
	}

	public dispose() {
		if (this._panel) {
			this._panel.dispose();
			this._panel = undefined;
		}

		// Dispose message handler if it exists
		if (this._messageHandlerDisposable) {
			this._messageHandlerDisposable.dispose();
			this._messageHandlerDisposable = undefined;
		}

		// Dispose managers
		this._permissionManager.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}