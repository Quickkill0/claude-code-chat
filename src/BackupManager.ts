import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';

const exec = util.promisify(cp.exec);

export interface CommitInfo {
	id: string;
	sha: string;
	message: string;
	timestamp: string;
}

/**
 * Manages git backup functionality for workspace changes
 */
export class BackupManager {
	private _backupRepoPath: string | undefined;
	private _commits: CommitInfo[] = [];

	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly _onCommitCreated: (commitInfo: CommitInfo) => void
	) {
		this._initializeBackupRepo();
	}

	get commits(): CommitInfo[] {
		return this._commits;
	}

	get backupRepoPath(): string | undefined {
		return this._backupRepoPath;
	}

	/**
	 * Initializes the backup git repository
	 */
	private async _initializeBackupRepo(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) { return; }

			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {
				console.error('No workspace storage available');
				return;
			}
			console.log('Workspace storage path:', storagePath);
			this._backupRepoPath = path.join(storagePath, 'backups', '.git');

			// Create backup git directory if it doesn't exist
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(this._backupRepoPath));
				// Repo exists, but we don't load existing commits
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._backupRepoPath));

				const workspacePath = workspaceFolder.uri.fsPath;

				// Initialize git repo with workspace as work-tree
				await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" init`);
				await exec(`git --git-dir="${this._backupRepoPath}" config user.name "Claude Code Chat"`);
				await exec(`git --git-dir="${this._backupRepoPath}" config user.email "claude@anthropic.com"`);

				console.log(`Initialized backup repository at: ${this._backupRepoPath}`);
			}
		} catch (error: any) {
			console.error('Failed to initialize backup repository:', error.message);
		}
	}

	/**
	 * Loads existing commits from the backup repository
	 * Note: This method is not called automatically on startup
	 * to ensure each session starts fresh with its own checkpoints
	 */
	private async _loadExistingCommits(): Promise<void> {
		if (!this._backupRepoPath) { return; }

		try {
			// Get all commits from the git log
			const { stdout } = await exec(
				`git --git-dir="${this._backupRepoPath}" log --pretty=format:"%H|%s|%ai" --date=iso`
			);

			if (!stdout.trim()) { return; }

			const lines = stdout.trim().split('\n');
			this._commits = lines.map(line => {
				const [sha, message, timestamp] = line.split('|');
				return {
					id: `commit-${sha.substring(0, 8)}`,
					sha,
					message,
					timestamp: new Date(timestamp).toISOString()
				};
			});

			console.log(`Loaded ${this._commits.length} existing checkpoints`);
		} catch (error: any) {
			// If there are no commits yet, this is fine
			if (!error.message.includes('does not have any commits')) {
				console.error('Failed to load existing commits:', error.message);
			}
		}
	}

	/**
	 * Creates a backup commit before Claude makes changes
	 */
	async createBackupCommit(userMessage: string): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) { return; }

			const workspacePath = workspaceFolder.uri.fsPath;
			const now = new Date();
			const timestamp = now.toISOString().replace(/[:.]/g, '-');
			const displayTimestamp = now.toISOString();
			const commitMessage = `Before: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;

			// Add all files using git-dir and work-tree (excludes .git automatically)
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" add -A`);

			// Check if this is the first commit (no HEAD exists yet)
			let isFirstCommit = false;
			try {
				await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);
			} catch {
				isFirstCommit = true;
			}

			// Check if there are changes to commit
			const { stdout: status } = await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" status --porcelain`);

			// Always create a checkpoint, even if no files changed
			let actualMessage;
			if (isFirstCommit) {
				actualMessage = `Initial backup: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
			} else if (status.trim()) {
				actualMessage = commitMessage;
			} else {
				actualMessage = `Checkpoint (no changes): ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
			}

			// Create commit with --allow-empty to ensure checkpoint is always created
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" commit --allow-empty -m "${actualMessage}"`);
			const { stdout: sha } = await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);

			// Store commit info
			const commitInfo: CommitInfo = {
				id: `commit-${timestamp}`,
				sha: sha.trim(),
				message: actualMessage,
				timestamp: displayTimestamp
			};

			this._commits.push(commitInfo);

			// Notify about the new commit
			this._onCommitCreated(commitInfo);

			console.log(`Created backup commit: ${commitInfo.sha.substring(0, 8)} - ${actualMessage}`);
		} catch (error: any) {
			console.error('Failed to create backup commit:', error.message);
		}
	}

	/**
	 * Restores the workspace to a specific commit
	 */
	async restoreToCommit(commitSha: string): Promise<{ success: boolean; message?: string; error?: string }> {
		try {
			const commit = this._commits.find(c => c.sha === commitSha);
			if (!commit) {
				return {
					success: false,
					error: 'Commit not found'
				};
			}

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) {
				return {
					success: false,
					error: 'No workspace folder or backup repository available'
				};
			}

			const workspacePath = workspaceFolder.uri.fsPath;

			// First, clean up any uncommitted changes in the working directory
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" clean -fd`);

			// Reset the working tree to the specified commit
			// This ensures we're restoring to the exact state at that checkpoint
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" reset --hard ${commitSha}`);

			// Keep all commits to allow back and forth navigation between checkpoints
			// Users should be able to restore to any checkpoint at any time

			vscode.window.showInformationMessage(`Restored to checkpoint: ${commit.message}`);

			return {
				success: true,
				message: `Successfully restored to: ${commit.message}`
			};
		} catch (error: any) {
			console.error('Failed to restore commit:', error.message);
			vscode.window.showErrorMessage(`Failed to restore commit: ${error.message}`);
			return {
				success: false,
				error: `Failed to restore: ${error.message}`
			};
		}
	}

	/**
	 * Clears all commits (used when starting a new session)
	 */
	clearCommits(): void {
		this._commits = [];
	}

	/**
	 * Gets a commit by SHA
	 */
	getCommitBySha(sha: string): CommitInfo | undefined {
		return this._commits.find(c => c.sha === sha);
	}
}