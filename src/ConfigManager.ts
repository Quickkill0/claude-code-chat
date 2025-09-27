import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(cp.exec);

/**
 * Manages MCP server configuration and VS Code settings
 */
export class ConfigManager {
	private _initializationPromise: Promise<void>;

	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly _extensionUri: vscode.Uri
	) {
		this._initializationPromise = this._initializeMCPConfig();
	}

	/**
	 * Ensures that MCP configuration initialization is complete
	 */
	async ensureInitialized(): Promise<void> {
		await this._initializationPromise;
	}

	/**
	 * Initializes the MCP configuration
	 */
	private async _initializeMCPConfig(): Promise<void> {
		try {
			console.log('ConfigManager: Starting MCP configuration initialization...');
			// Initialize both user-level and project-level MCP configurations
			await this._initializeUserMCPConfig();
			await this._initializeProjectMCPConfig();
			console.log('ConfigManager: MCP configuration initialization completed successfully');
		} catch (error: any) {
			console.error('Failed to initialize MCP config:', error.message);
			throw error;
		}
	}

	/**
	 * Initializes user-level MCP configuration (for user-installed servers)
	 */
	private async _initializeUserMCPConfig(): Promise<void> {
		const storagePath = this._context.storageUri?.fsPath;
		if (!storagePath) { return; }

		// Create MCP config directory
		const mcpConfigDir = path.join(storagePath, 'mcp');
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(mcpConfigDir));
		} catch {
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(mcpConfigDir));
			console.log(`Created MCP config directory at: ${mcpConfigDir}`);
		}

		// Create or update mcp-servers.json for user-level servers
		const mcpConfigPath = path.join(mcpConfigDir, 'mcp-servers.json');
		const mcpConfigUri = vscode.Uri.file(mcpConfigPath);

		let mcpConfig: any = { mcpServers: {} };
		try {
			const existingContent = await vscode.workspace.fs.readFile(mcpConfigUri);
			mcpConfig = JSON.parse(new TextDecoder().decode(existingContent));
			console.log('Loaded existing user MCP config');
		} catch {
			console.log('No existing user MCP config found, creating new one');
		}

		// Ensure mcpServers exists
		if (!mcpConfig.mcpServers) {
			mcpConfig.mcpServers = {};
		}

		const configContent = new TextEncoder().encode(JSON.stringify(mcpConfig, null, 2));
		await vscode.workspace.fs.writeFile(mcpConfigUri, configContent);
		console.log(`Updated user MCP config at: ${mcpConfigPath}`);
	}

	/**
	 * Initializes project-level MCP configuration with permissions server
	 */
	private async _initializeProjectMCPConfig(): Promise<void> {
		// Get workspace root folder
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			console.log('ConfigManager: No workspace folder found, skipping project MCP config');
			return;
		}

		const projectMcpPath = path.join(workspaceFolder.uri.fsPath, '.mcp.json');
		const projectMcpUri = vscode.Uri.file(projectMcpPath);
		console.log(`ConfigManager: Initializing project MCP config at: ${projectMcpPath}`);

		// Try to find mcp-permissions.js in the correct location
		let mcpPermissionsJsPath = path.join(this._extensionUri.fsPath, 'claude-code-chat-permissions-mcp', 'dist', 'mcp-permissions.js');

		// Check if file exists in the mcp subdirectory
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(mcpPermissionsJsPath));
		} catch {
			// Try the compiled version path for different build configurations
			mcpPermissionsJsPath = path.join(this._extensionUri.fsPath, 'claude-code-chat-permissions-mcp', 'mcp-permissions.js');
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(mcpPermissionsJsPath));
			} catch {
				console.error('mcp-permissions.js not found in either location');
				console.error('Tried:', path.join(this._extensionUri.fsPath, 'claude-code-chat-permissions-mcp', 'dist', 'mcp-permissions.js'));
				console.error('Tried:', mcpPermissionsJsPath);
				return;
			}
		}

		const storagePath = this._context.storageUri?.fsPath;
		const mcpPermissionsPath = this.convertToWSLPath(mcpPermissionsJsPath);
		const permissionRequestsPath = this.convertToWSLPath(path.join(storagePath || '', 'permission-requests'));

		// Load existing project .mcp.json or create new one
		let projectMcpConfig: any = { mcpServers: {} };
		try {
			const existingContent = await vscode.workspace.fs.readFile(projectMcpUri);
			projectMcpConfig = JSON.parse(new TextDecoder().decode(existingContent));
			console.log('Loaded existing project .mcp.json config');
		} catch {
			console.log('No existing project .mcp.json found, creating new one');
		}

		// Ensure mcpServers exists
		if (!projectMcpConfig.mcpServers) {
			projectMcpConfig.mcpServers = {};
		}

		// Add or update the permissions server entry (only if not in YOLO mode)
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const yoloMode = config.get<boolean>('permissions.yoloMode', false);

		if (!yoloMode) {
			projectMcpConfig.mcpServers['claude-code-chat-permissions'] = {
				command: 'node',
				args: [mcpPermissionsPath],
				env: {
					CLAUDE_PERMISSIONS_PATH: permissionRequestsPath
				},
				scope: 'project',
				builtin: true,
				description: 'Claude Code Chat permissions handler'
			};
		} else {
			// Remove permissions server if YOLO mode is enabled
			delete projectMcpConfig.mcpServers['claude-code-chat-permissions'];
		}

		const configContent = new TextEncoder().encode(JSON.stringify(projectMcpConfig, null, 2));
		await vscode.workspace.fs.writeFile(projectMcpUri, configContent);

		console.log(`Updated project MCP config at: ${projectMcpPath}`);
	}

	/**
	 * Gets the MCP config file path
	 */
	getMCPConfigPath(): string | undefined {
		const storagePath = this._context.storageUri?.fsPath;
		if (!storagePath) { return undefined; }

		const configPath = path.join(storagePath, 'mcp', 'mcp-servers.json');
		return configPath;
	}

	/**
	 * Converts Windows path to WSL path if WSL is enabled
	 */
	convertToWSLPath(windowsPath: string): string {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		if (wslEnabled && windowsPath.match(/^[a-zA-Z]:/)) {
			// Convert C:\Users\... to /mnt/c/Users/...
			return windowsPath.replace(/^([a-zA-Z]):/, '/mnt/$1').toLowerCase().replace(/\\/g, '/');
		}

		return windowsPath;
	}

	/**
	 * Loads MCP servers configuration from both user and project levels
	 */
	async loadMCPServers(): Promise<any> {
		try {
			const servers: any = {};

			// Load user-level servers
			const userServers = await this.loadUserMCPServers();
			Object.assign(servers, userServers);

			// Load project-level servers (excluding built-in permissions server for UI)
			const projectServers = await this.loadProjectMCPServers();
			Object.assign(servers, projectServers);

			return servers;
		} catch (error) {
			console.error('Error loading MCP servers:', error);
			throw new Error('Failed to load MCP servers');
		}
	}

	/**
	 * Loads user-level MCP servers configuration
	 */
	async loadUserMCPServers(): Promise<any> {
		try {
			const mcpConfigPath = this.getMCPConfigPath();
			if (!mcpConfigPath) {
				return {};
			}

			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);
			let mcpConfig: any = { mcpServers: {} };

			try {
				const content = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch (error) {
				console.log('User MCP config file not found or error reading:', error);
				// File doesn't exist, return empty servers
			}

			// Add scope information to servers
			const scopedServers = Object.fromEntries(
				Object.entries(mcpConfig.mcpServers || {}).map(([name, config]: [string, any]) => [
					name,
					{ ...config, scope: 'user' }
				])
			);

			return scopedServers;
		} catch (error) {
			console.error('Error loading user MCP servers:', error);
			return {};
		}
	}

	/**
	 * Loads project-level MCP servers configuration
	 */
	async loadProjectMCPServers(): Promise<any> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				return {};
			}

			const projectMcpPath = path.join(workspaceFolder.uri.fsPath, '.mcp.json');
			const projectMcpUri = vscode.Uri.file(projectMcpPath);

			let projectMcpConfig: any = { mcpServers: {} };

			try {
				const content = await vscode.workspace.fs.readFile(projectMcpUri);
				projectMcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch (error) {
				console.log('Project .mcp.json file not found or error reading:', error);
				// File doesn't exist, return empty servers
			}

			// Filter out built-in permissions server for UI display and add scope information
			const filteredServers = Object.fromEntries(
				Object.entries(projectMcpConfig.mcpServers || {})
					.filter(([name]) => name !== 'claude-code-chat-permissions')
					.map(([name, config]: [string, any]) => [
						name,
						{ ...config, scope: 'project' }
					])
			);

			return filteredServers;
		} catch (error) {
			console.error('Error loading project MCP servers:', error);
			return {};
		}
	}

	/**
	 * Saves an MCP server configuration
	 */
	async saveMCPServer(name: string, config: any): Promise<void> {
		try {
			const mcpConfigPath = this.getMCPConfigPath();
			if (!mcpConfigPath) {
				throw new Error('Storage path not available');
			}

			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);
			let mcpConfig: any = { mcpServers: {} };

			// Load existing config
			try {
				const content = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist, use default structure
			}

			// Ensure mcpServers exists
			if (!mcpConfig.mcpServers) {
				mcpConfig.mcpServers = {};
			}

			// Add/update the server
			mcpConfig.mcpServers[name] = config;

			// Ensure directory exists
			const mcpDir = vscode.Uri.file(path.dirname(mcpConfigPath));
			try {
				await vscode.workspace.fs.stat(mcpDir);
			} catch {
				await vscode.workspace.fs.createDirectory(mcpDir);
			}

			// Save the config
			const configContent = new TextEncoder().encode(JSON.stringify(mcpConfig, null, 2));
			await vscode.workspace.fs.writeFile(mcpConfigUri, configContent);

			console.log(`Saved MCP server: ${name}`);
		} catch (error) {
			console.error('Error saving MCP server:', error);
			throw new Error('Failed to save MCP server');
		}
	}

	/**
	 * Deletes an MCP server configuration
	 */
	async deleteMCPServer(name: string): Promise<void> {
		try {
			const mcpConfigPath = this.getMCPConfigPath();
			if (!mcpConfigPath) {
				throw new Error('Storage path not available');
			}

			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);
			let mcpConfig: any = { mcpServers: {} };

			// Load existing config
			try {
				const content = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist, nothing to delete
				throw new Error('MCP config file not found');
			}

			// Delete the server
			if (mcpConfig.mcpServers && mcpConfig.mcpServers[name]) {
				delete mcpConfig.mcpServers[name];

				// Save the updated config
				const configContent = new TextEncoder().encode(JSON.stringify(mcpConfig, null, 2));
				await vscode.workspace.fs.writeFile(mcpConfigUri, configContent);

				console.log(`Deleted MCP server: ${name}`);
			} else {
				throw new Error(`Server '${name}' not found`);
			}
		} catch (error) {
			console.error('Error deleting MCP server:', error);
			throw error;
		}
	}

	/**
	 * Gets current VS Code settings relevant to Claude Code Chat
	 */
	getCurrentSettings(): any {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		return {
			'thinking.intensity': config.get<string>('thinking.intensity', 'think'),
			'wsl.enabled': config.get<boolean>('wsl.enabled', false),
			'wsl.distro': config.get<string>('wsl.distro', 'Ubuntu'),
			'wsl.nodePath': config.get<string>('wsl.nodePath', '/usr/bin/node'),
			'wsl.claudePath': config.get<string>('wsl.claudePath', '/usr/local/bin/claude'),
			'permissions.yoloMode': config.get<boolean>('permissions.yoloMode', false)
		};
	}

	/**
	 * Updates VS Code settings
	 */
	async updateSettings(settings: { [key: string]: any }): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');

		try {
			for (const [key, value] of Object.entries(settings)) {
				if (key === 'permissions.yoloMode') {
					// YOLO mode is workspace-specific
					await config.update(key, value, vscode.ConfigurationTarget.Workspace);
				} else {
					// Other settings are global (user-wide)
					await config.update(key, value, vscode.ConfigurationTarget.Global);
				}
			}

			console.log('Settings updated:', settings);
		} catch (error) {
			console.error('Failed to update settings:', error);
			vscode.window.showErrorMessage('Failed to update settings');
			throw error;
		}
	}

	/**
	 * Enables YOLO mode (skip all permissions)
	 */
	async enableYoloMode(): Promise<void> {
		try {
			// Update VS Code configuration to enable YOLO mode
			const config = vscode.workspace.getConfiguration('claudeCodeChat');

			// Clear any global setting and set workspace setting
			await config.update('permissions.yoloMode', true, vscode.ConfigurationTarget.Workspace);

			// Regenerate MCP config to remove permissions server
			await this._initializeMCPConfig();

			console.log('YOLO Mode enabled - all future permissions will be skipped');
		} catch (error) {
			console.error('Error enabling YOLO mode:', error);
			throw error;
		}
	}

	/**
	 * Disables YOLO mode and re-enables permissions
	 */
	async disableYoloMode(): Promise<void> {
		try {
			// Update VS Code configuration to disable YOLO mode
			const config = vscode.workspace.getConfiguration('claudeCodeChat');

			// Set workspace setting to false
			await config.update('permissions.yoloMode', false, vscode.ConfigurationTarget.Workspace);

			// Regenerate MCP config to add permissions server back
			await this._initializeMCPConfig();

			console.log('YOLO Mode disabled - permissions checks re-enabled');
		} catch (error) {
			console.error('Error disabling YOLO mode:', error);
			throw error;
		}
	}

	/**
	 * Gets custom prompt snippets from global state
	 */
	getCustomSnippets(): { [key: string]: any } {
		return this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});
	}

	/**
	 * Saves a custom prompt snippet
	 */
	async saveCustomSnippet(snippet: any): Promise<void> {
		try {
			const customSnippets = this.getCustomSnippets();
			customSnippets[snippet.id] = snippet;

			await this._context.globalState.update('customPromptSnippets', customSnippets);

			console.log('Saved custom snippet:', snippet.name);
		} catch (error) {
			console.error('Error saving custom snippet:', error);
			throw new Error('Failed to save custom snippet');
		}
	}

	/**
	 * Deletes a custom prompt snippet
	 */
	async deleteCustomSnippet(snippetId: string): Promise<void> {
		try {
			const customSnippets = this.getCustomSnippets();

			if (customSnippets[snippetId]) {
				delete customSnippets[snippetId];
				await this._context.globalState.update('customPromptSnippets', customSnippets);

				console.log('Deleted custom snippet:', snippetId);
			} else {
				throw new Error('Snippet not found');
			}
		} catch (error) {
			console.error('Error deleting custom snippet:', error);
			throw error;
		}
	}

	/**
	 * Gets platform information
	 */
	getPlatformInfo(): any {
		const platform = process.platform;
		const dismissed = this._context.globalState.get<boolean>('wslAlertDismissed', false);

		// Get WSL configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		return {
			platform: platform,
			isWindows: platform === 'win32',
			wslAlertDismissed: dismissed,
			wslEnabled: wslEnabled
		};
	}

	/**
	 * Dismisses the WSL alert
	 */
	async dismissWSLAlert(): Promise<void> {
		await this._context.globalState.update('wslAlertDismissed', true);
	}

	// ========================================================================================
	// Claude Code MCP Command Integration
	// ========================================================================================

	/**
	 * Executes a Claude MCP command with proper WSL support
	 */
	private async executeClaudeMCPCommand(args: string[]): Promise<string> {
		try {
			const config = vscode.workspace.getConfiguration('claudeCodeChat');
			const wslEnabled = config.get<boolean>('wsl.enabled', false);
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

			let command: string;
			let execOptions: any = { cwd };

			if (wslEnabled) {
				// WSL command execution
				const distro = config.get<string>('wsl.distro', 'Ubuntu');
				const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');
				const wslCwd = this.convertToWSLPath(cwd);

				command = `wsl -d ${distro} bash -c "cd ${wslCwd} && ${claudePath} ${args.join(' ')}"`;
			} else {
				// Native command execution
				command = `claude ${args.join(' ')}`;
			}

			console.log('Executing Claude MCP command:', command);
			const { stdout, stderr } = await execAsync(command, execOptions);

			if (stderr && !stderr.includes('✓')) {
				console.warn('Claude MCP command stderr:', stderr);
			}

			return stdout.toString().trim();
		} catch (error: any) {
			console.error('Claude MCP command failed:', error);
			if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
				throw new Error('Claude Code CLI not found. Please install Claude Code first: https://www.anthropic.com/claude-code');
			}
			throw new Error(`Claude MCP command failed: ${error.message}`);
		}
	}

	/**
	 * Lists MCP servers using Claude Code CLI
	 */
	async listMCPServersViaCLI(): Promise<any> {
		try {
			const output = await this.executeClaudeMCPCommand(['mcp', 'list']);
			// Parse the CLI output to extract server information
			// Claude MCP list outputs servers in a structured format
			const servers: any = {};
			const lines = output.split('\n').filter(line => line.trim());

			for (const line of lines) {
				// Skip header lines, empty lines, and "No servers" messages
				if (line.includes('MCP Servers') ||
					line.includes('---') ||
					!line.trim() ||
					line.includes('No MCP servers') ||
					line.includes('No servers configured') ||
					line.startsWith('No ') ||
					line.includes('Checking')) {
					continue;
				}

				// Parse server entries (format may vary, this is a basic parser)
				const parts = line.trim().split(/\s+/);
				if (parts.length >= 2) {
					// Remove trailing colon from server name if present
					const serverName = parts[0].replace(/:$/, '');

					// Skip if this looks like part of a status message
					if (serverName === 'No' ||
						serverName === 'servers' ||
						serverName === 'configured' ||
						serverName === 'Checking' ||
						serverName.length < 2) {
						continue;
					}

					const scope = parts[1] || 'local';
					const status = parts[2] || 'unknown';


					servers[serverName] = {
						name: serverName,
						scope: scope,
						status: status,
						managedByCLI: true
					};
				}
			}

			return servers;
		} catch (error) {
			console.error('Error listing MCP servers via CLI:', error);
			// Fallback to JSON config if CLI fails
			return await this.loadMCPServers();
		}
	}

	/**
	 * Adds an MCP server using Claude Code CLI
	 */
	async addMCPServerViaCLI(name: string, serverConfig: any, scope: string = 'local'): Promise<void> {
		try {
			const args = ['mcp', 'add', name, '--scope', scope];

			// Add server-specific configuration based on type
			if (serverConfig.type === 'stdio') {
				args.push('--');
				args.push(serverConfig.command);
				if (serverConfig.args) {
					args.push(...serverConfig.args);
				}
			} else if (serverConfig.type === 'http' || serverConfig.type === 'sse') {
				// Use the correct --transport syntax for HTTP/SSE servers
				args.splice(2, 0, '--transport', serverConfig.type); // Insert after 'add'
				args.push(serverConfig.url);
				if (serverConfig.headers) {
					for (const [key, value] of Object.entries(serverConfig.headers)) {
						args.push('--header', `${key}:${value}`);
					}
				}
			}

			// Set environment variables if provided
			if (serverConfig.env) {
				for (const [key, value] of Object.entries(serverConfig.env)) {
					args.push('--env', `${key}=${value}`);
				}
			}

			const output = await this.executeClaudeMCPCommand(args);
			console.log(`Added MCP server via CLI: ${name}`, output);

		} catch (error) {
			console.error('Error adding MCP server via CLI:', error);
			// Fallback to JSON config if CLI fails
			await this.saveMCPServer(name, serverConfig);
			throw error;
		}
	}

	/**
	 * Removes an MCP server using Claude Code CLI
	 */
	async removeMCPServerViaCLI(name: string): Promise<void> {
		try {
			const output = await this.executeClaudeMCPCommand(['mcp', 'remove', name]);
			console.log(`Removed MCP server via CLI: ${name}`, output);

		} catch (error) {
			console.error('Error removing MCP server via CLI:', error);
			// Fallback to JSON config if CLI fails
			await this.deleteMCPServer(name);
			throw error;
		}
	}

	/**
	 * Tests an MCP server connection using Claude Code CLI
	 */
	async testMCPServerViaCLI(name: string): Promise<boolean> {
		try {
			const output = await this.executeClaudeMCPCommand(['mcp', 'get', name]);
			return output.includes('✓') || output.includes('success') || !output.includes('error');
		} catch (error) {
			console.error('Error testing MCP server via CLI:', error);
			return false;
		}
	}

	/**
	 * Enhanced MCP server loading that combines CLI and JSON config
	 */
	async loadEnhancedMCPServers(): Promise<any> {
		try {
			// Try to get servers from Claude CLI first
			const cliServers = await this.listMCPServersViaCLI();

			// Also get servers from JSON config (for legacy support)
			const jsonServers = await this.loadMCPServers();

			// Load project-level permissions server for UI display
			const permissionsServer = await this.loadPermissionsServerForUI();

			// Merge all sources, CLI takes precedence
			const mergedServers = { ...jsonServers };

			// Add permissions server if available
			if (permissionsServer) {
				mergedServers['claude-code-chat-permissions'] = permissionsServer;
			}

			for (const [name, server] of Object.entries(cliServers)) {
				mergedServers[name] = {
					...(mergedServers[name] || {}),
					...(server as any),
					managedByCLI: true
				};
			}

			return mergedServers;
		} catch (error) {
			console.error('Error loading enhanced MCP servers:', error);
			// Fallback to JSON config only
			return await this.loadMCPServers();
		}
	}

	/**
	 * Loads permissions server configuration for UI display
	 */
	async loadPermissionsServerForUI(): Promise<any | null> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				return null;
			}

			const projectMcpPath = path.join(workspaceFolder.uri.fsPath, '.mcp.json');
			const projectMcpUri = vscode.Uri.file(projectMcpPath);

			let projectMcpConfig: any = { mcpServers: {} };

			try {
				const content = await vscode.workspace.fs.readFile(projectMcpUri);
				projectMcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch (error) {
				return null;
			}

			const permissionsServer = projectMcpConfig.mcpServers?.['claude-code-chat-permissions'];
			if (permissionsServer) {
				return {
					...permissionsServer,
					scope: 'project',
					builtin: true,
					nonRemovable: true,
					description: 'Claude Code Chat permissions handler'
				};
			}

			return null;
		} catch (error) {
			console.error('Error loading permissions server for UI:', error);
			return null;
		}
	}

	/**
	 * Unified method to add MCP server (tries CLI first, falls back to JSON)
	 */
	async addMCPServerUnified(name: string, serverConfig: any, scope: string = 'local'): Promise<void> {
		try {
			// Try Claude CLI first
			await this.addMCPServerViaCLI(name, serverConfig, scope);
		} catch (error) {
			console.warn('Claude CLI add failed, falling back to JSON config:', error);
			// Fallback to JSON config
			await this.saveMCPServer(name, serverConfig);
		}
	}

	/**
	 * Unified method to remove MCP server (tries CLI first, falls back to JSON)
	 */
	async removeMCPServerUnified(name: string): Promise<void> {
		let cliError: Error | null = null;
		let jsonError: Error | null = null;

		try {
			// Try Claude CLI first
			await this.removeMCPServerViaCLI(name);
			return; // Success, no need to try JSON
		} catch (error) {
			cliError = error as Error;
			console.warn('Claude CLI remove failed, falling back to JSON config:', error);
		}

		try {
			// Fallback to JSON config
			await this.deleteMCPServer(name);
		} catch (error) {
			jsonError = error as Error;
			console.warn('JSON config remove also failed:', error);
		}

		// If both failed, check if it's because the server doesn't exist
		if (cliError && jsonError) {
			const notFoundMessages = ['not found', 'No MCP server found'];
			const isNotFound = notFoundMessages.some(msg =>
				cliError!.message.includes(msg) || jsonError!.message.includes(msg)
			);

			if (isNotFound) {
				console.log(`Server '${name}' was not found in CLI or JSON config - it may have already been removed`);
				return; // Don't throw error for servers that don't exist
			}

			// Re-throw the CLI error if it's a different kind of error
			throw cliError;
		}
	}

	// ========================================================================================
	// CLAUDE.md File Management
	// ========================================================================================

	/**
	 * Gets the default CLAUDE.md template
	 */
	getClaudeMdTemplate(): string {
		return `# Project Instructions for Claude

## Overview
This file contains project-specific instructions and context for Claude Code Chat.
Edit this file to customize Claude's behavior for your project.

## Project Context
<!-- Describe your project, its purpose, and key technologies -->

## Coding Standards
<!-- Define your preferred coding standards and conventions -->
- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for public methods
- Prefer async/await over callbacks

## Architecture Guidelines
<!-- Describe architectural patterns and decisions -->

## Important Files and Folders
<!-- List key files and their purposes -->

## Development Workflow
<!-- Describe your development process -->

## Testing Requirements
<!-- Specify testing approach and requirements -->

## Performance Considerations
<!-- Note any performance requirements or constraints -->

## Security Guidelines
<!-- Important security considerations -->

## Custom Instructions
<!-- Add any specific instructions for Claude -->

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
	}

	/**
	 * Reads the CLAUDE.md file from workspace root
	 */
	async readClaudeMd(): Promise<{ content: string; exists: boolean; template?: string }> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			const template = this.getClaudeMdTemplate();

			if (!workspaceFolder) {
				return { content: '', exists: false, template };
			}

			const claudeMdPath = vscode.Uri.joinPath(workspaceFolder.uri, 'CLAUDE.md');

			try {
				const content = await vscode.workspace.fs.readFile(claudeMdPath);
				return { content: new TextDecoder().decode(content), exists: true, template };
			} catch (error) {
				// File doesn't exist, return empty content but provide template for later use
				console.log('CLAUDE.md not found, returning empty content');
				return { content: '', exists: false, template };
			}
		} catch (error) {
			console.error('Error reading CLAUDE.md:', error);
			throw new Error('Failed to read CLAUDE.md file');
		}
	}

	/**
	 * Writes content to CLAUDE.md file in workspace root
	 */
	async writeClaudeMd(content: string): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				throw new Error('No workspace folder found');
			}

			const claudeMdPath = vscode.Uri.joinPath(workspaceFolder.uri, 'CLAUDE.md');

			// Create backup of existing file if it exists
			try {
				const existingContent = await vscode.workspace.fs.readFile(claudeMdPath);
				const backupPath = vscode.Uri.joinPath(workspaceFolder.uri, 'CLAUDE.md.bak');
				await vscode.workspace.fs.writeFile(backupPath, existingContent);
				console.log('Created backup at CLAUDE.md.bak');
			} catch {
				// File doesn't exist yet, no backup needed
			}

			// Write the new content
			const contentBuffer = new TextEncoder().encode(content);
			await vscode.workspace.fs.writeFile(claudeMdPath, contentBuffer);

			console.log('Successfully wrote CLAUDE.md');
		} catch (error) {
			console.error('Error writing CLAUDE.md:', error);
			throw new Error('Failed to write CLAUDE.md file');
		}
	}

	/**
	 * Validates CLAUDE.md file size
	 */
	async validateClaudeMdSize(content: string): Promise<boolean> {
		const maxSizeKB = 1024; // 1MB limit
		const sizeKB = new TextEncoder().encode(content).length / 1024;
		return sizeKB <= maxSizeKB;
	}
}