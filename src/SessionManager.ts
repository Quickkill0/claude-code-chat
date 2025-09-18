import * as vscode from 'vscode';
import * as cp from 'child_process';

/**
 * Manages Claude CLI sessions, including starting processes,
 * handling session IDs, and managing model selection
 */
export class SessionManager {
	private _currentSessionId: string | undefined;
	private _currentClaudeProcess: cp.ChildProcess | undefined;
	private _selectedModel: string = 'default';
	private _isProcessing: boolean = false;

	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly _onSessionCleared: () => void,
		private readonly _onLoginRequired: () => void
	) {
		// Load saved model preference
		this._selectedModel = this._context.workspaceState.get('claude.selectedModel', 'default');
	}

	get currentSessionId(): string | undefined {
		return this._currentSessionId;
	}

	get selectedModel(): string {
		return this._selectedModel;
	}

	get isProcessing(): boolean {
		return this._isProcessing;
	}

	get currentProcess(): cp.ChildProcess | undefined {
		return this._currentClaudeProcess;
	}

	setSessionId(sessionId: string | undefined): void {
		this._currentSessionId = sessionId;
	}

	setProcessing(isProcessing: boolean): void {
		this._isProcessing = isProcessing;
	}

	setSelectedModel(model: string): void {
		// Validate model name
		const validModels = ['opus', 'sonnet', 'sonnet1m', 'default'];
		if (validModels.includes(model)) {
			this._selectedModel = model;
			console.log('Model selected:', model);

			// Store the model preference in workspace state
			this._context.workspaceState.update('claude.selectedModel', model);

			// Show confirmation
			vscode.window.showInformationMessage(`Claude model switched to: ${model.charAt(0).toUpperCase() + model.slice(1)}`);
		} else {
			console.error('Invalid model selected:', model);
			vscode.window.showErrorMessage(`Invalid model: ${model}. Please select Opus, Sonnet, or Default.`);
		}
	}

	/**
	 * Creates a new Claude process with the given arguments and message
	 */
	createClaudeProcess(args: string[], message: string, cwd: string): cp.ChildProcess {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Prepare environment variables
		const baseEnv: Record<string, string | undefined> = {
			...process.env,
			FORCE_COLOR: '0',
			NO_COLOR: '1'
		};

		let claudeProcess: cp.ChildProcess;

		if (wslEnabled) {
			// Use WSL with bash -ic for proper environment loading
			console.log('Using WSL configuration:', { wslDistro, nodePath, claudePath });
			const wslCommand = `"${nodePath}" --no-warnings --enable-source-maps "${claudePath}" ${args.join(' ')}`;

			claudeProcess = cp.spawn('wsl', ['-d', wslDistro, 'bash', '-ic', wslCommand], {
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: baseEnv
			});
		} else {
			// Use native claude command
			console.log('Using native Claude command');
			claudeProcess = cp.spawn('claude', args, {
				shell: process.platform === 'win32',
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: baseEnv
			});
		}

		// Store process reference
		this._currentClaudeProcess = claudeProcess;

		// Send the message to Claude's stdin
		if (claudeProcess.stdin) {
			claudeProcess.stdin.write(message + '\n');
			claudeProcess.stdin.end();
		}

		return claudeProcess;
	}

	/**
	 * Builds command arguments for Claude CLI
	 */
	buildClaudeArgs(mcpConfigPath?: string, yoloMode: boolean = false): string[] {
		const args = [
			'-p',
			'--output-format', 'stream-json', '--verbose'
		];

		if (yoloMode) {
			// Yolo mode: skip all permissions regardless of MCP config
			args.push('--dangerously-skip-permissions');
		} else if (mcpConfigPath) {
			// Add MCP configuration for permissions
			args.push('--mcp-config', mcpConfigPath);
			args.push('--allowedTools', 'mcp__claude-code-chat-permissions__approval_prompt');
			args.push('--permission-prompt-tool', 'mcp__claude-code-chat-permissions__approval_prompt');
		}

		// Add model selection if not using default
		if (this._selectedModel && this._selectedModel !== 'default') {
			// Map sonnet1m to sonnet[1m] for CLI
			if (this._selectedModel === 'sonnet1m') {
				args.push('--model', 'sonnet[1m]');
			} else {
				args.push('--model', this._selectedModel);
			}
		}

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
			console.log('Resuming session:', this._currentSessionId);
		} else {
			console.log('Starting new session');
		}

		return args;
	}

	/**
	 * Stops the current Claude process
	 */
	stopProcess(): void {
		console.log('Stop request received');

		this._isProcessing = false;

		if (this._currentClaudeProcess) {
			console.log('Force killing Claude process immediately...');

			// Clear any accumulated stream buffers
			if (this._currentClaudeProcess.stdout) {
				this._currentClaudeProcess.stdout.removeAllListeners('data');
				this._currentClaudeProcess.stdout.destroy();
			}
			if (this._currentClaudeProcess.stderr) {
				this._currentClaudeProcess.stderr.removeAllListeners('data');
				this._currentClaudeProcess.stderr.destroy();
			}

			// Immediately force kill - no graceful termination
			this._currentClaudeProcess.kill('SIGKILL');

			// Clear process reference
			this._currentClaudeProcess = undefined;

			console.log('Claude process termination initiated');
		} else {
			console.log('No Claude process running to stop');
		}
	}

	/**
	 * Clears the current session
	 */
	clearSession(): void {
		this._isProcessing = false;

		// Try graceful termination first
		if (this._currentClaudeProcess) {
			const processToKill = this._currentClaudeProcess;
			this._currentClaudeProcess = undefined;
			processToKill.kill('SIGTERM');
		}

		// Clear current session
		this._currentSessionId = undefined;

		// Notify about session clearing
		this._onSessionCleared();
	}

	/**
	 * Handles configuration changes that require a new session
	 */
	handleConfigChange(): void {
		// Start a new session due to configuration change
		this.clearSession();

		// Show notification to user
		vscode.window.showInformationMessage(
			'WSL configuration changed. Started a new Claude session.',
			'OK'
		);
	}

	/**
	 * Opens a terminal with Claude model selection command
	 */
	openModelTerminal(): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = ['/model'];

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		// Create terminal with the claude /model command
		const terminal = vscode.window.createTerminal('Claude Model Selection');
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath} ${args.join(' ')}`);
		} else {
			terminal.sendText(`claude ${args.join(' ')}`);
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			'Check the terminal to update your default model configuration. Come back to this chat here after making changes.',
			'OK'
		);
	}

	/**
	 * Executes a slash command in terminal
	 */
	executeSlashCommand(command: string): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = [`/${command}`];

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		// Create terminal with the claude command
		const terminal = vscode.window.createTerminal(`Claude /${command}`);
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath} ${args.join(' ')}`);
		} else {
			terminal.sendText(`claude ${args.join(' ')}`);
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			`Executing /${command} command in terminal. Check the terminal output and return when ready.`,
			'OK'
		);
	}

	/**
	 * Handles login required scenario
	 */
	handleLoginRequired(): void {
		this._isProcessing = false;
		this._onLoginRequired();

		// Get configuration to check if WSL is enabled
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Open terminal and run claude login
		const terminal = vscode.window.createTerminal('Claude Login');
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath}`);
		} else {
			terminal.sendText('claude');
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			'Please login to Claude in the terminal, then come back to this chat to continue.',
			'OK'
		);
	}
}