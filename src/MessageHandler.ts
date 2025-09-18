/**
 * Handles processing of Claude's streaming JSON messages
 */
export class MessageHandler {
	private _totalTokensInput: number = 0;
	private _totalTokensOutput: number = 0;
	private _totalCost: number = 0;
	private _requestCount: number = 0;

	constructor(
		private readonly _onMessage: (message: { type: string, data: any }) => void,
		private readonly _onSessionUpdate: (sessionId: string) => void,
		private readonly _onLoginRequired: () => void,
		private readonly _onProcessingComplete: () => void
	) {}

	get totalTokensInput(): number {
		return this._totalTokensInput;
	}

	get totalTokensOutput(): number {
		return this._totalTokensOutput;
	}

	get totalCost(): number {
		return this._totalCost;
	}

	get requestCount(): number {
		return this._requestCount;
	}

	/**
	 * Resets all counters (used for new sessions)
	 */
	resetCounters(): void {
		this._totalTokensInput = 0;
		this._totalTokensOutput = 0;
		this._totalCost = 0;
		this._requestCount = 0;
	}

	/**
	 * Processes JSON stream data from Claude
	 */
	processJsonStreamData(jsonData: any): void {
		switch (jsonData.type) {
			case 'system':
				this._handleSystemMessage(jsonData);
				break;

			case 'assistant':
				this._handleAssistantMessage(jsonData);
				break;

			case 'user':
				this._handleUserMessage(jsonData);
				break;

			case 'result':
				this._handleResultMessage(jsonData);
				break;
		}
	}

	/**
	 * Handles system messages (initialization, session info)
	 */
	private _handleSystemMessage(jsonData: any): void {
		if (jsonData.subtype === 'init') {
			// System initialization message - session ID will be captured from final result
			console.log('System initialized');
			this._onSessionUpdate(jsonData.session_id);

			// Show session info in UI
			this._onMessage({
				type: 'sessionInfo',
				data: {
					sessionId: jsonData.session_id,
					tools: jsonData.tools || [],
					mcpServers: jsonData.mcp_servers || []
				}
			});
		}
	}

	/**
	 * Handles assistant messages (content, tool use)
	 */
	private _handleAssistantMessage(jsonData: any): void {
		if (jsonData.message && jsonData.message.content) {
			// Track token usage in real-time if available
			if (jsonData.message.usage) {
				this._totalTokensInput += jsonData.message.usage.input_tokens || 0;
				this._totalTokensOutput += jsonData.message.usage.output_tokens || 0;

				// Send real-time token update to webview
				this._onMessage({
					type: 'updateTokens',
					data: {
						totalTokensInput: this._totalTokensInput,
						totalTokensOutput: this._totalTokensOutput,
						currentInputTokens: jsonData.message.usage.input_tokens || 0,
						currentOutputTokens: jsonData.message.usage.output_tokens || 0,
						cacheCreationTokens: jsonData.message.usage.cache_creation_input_tokens || 0,
						cacheReadTokens: jsonData.message.usage.cache_read_input_tokens || 0
					}
				});
			}

			// Process each content item in the assistant message
			for (const content of jsonData.message.content) {
				if (content.type === 'text' && content.text.trim()) {
					// Show text content
					this._onMessage({
						type: 'output',
						data: content.text.trim()
					});
				} else if (content.type === 'thinking' && content.thinking.trim()) {
					// Show thinking content
					this._onMessage({
						type: 'thinking',
						data: content.thinking.trim()
					});
				} else if (content.type === 'tool_use') {
					// Show tool execution with better formatting
					const toolInfo = `🔧 Executing: ${content.name}`;
					let toolInput = '';

					if (content.input) {
						// Special formatting for TodoWrite to make it more readable
						if (content.name === 'TodoWrite' && content.input.todos) {
							toolInput = '\nTodo List Update:';
							for (const todo of content.input.todos) {
								const status = todo.status === 'completed' ? '✅' :
									todo.status === 'in_progress' ? '🔄' : '⏳';
								toolInput += `\n${status} ${todo.content}`;
							}
						} else {
							// Send raw input to UI for formatting
							toolInput = '';
						}
					}

					// Show tool use
					this._onMessage({
						type: 'toolUse',
						data: {
							toolInfo: toolInfo,
							toolInput: toolInput,
							rawInput: content.input,
							toolName: content.name
						}
					});
				}
			}
		}
	}

	/**
	 * Handles user messages (tool results)
	 */
	private _handleUserMessage(jsonData: any): void {
		if (jsonData.message && jsonData.message.content) {
			// Process tool results from user messages
			for (const content of jsonData.message.content) {
				if (content.type === 'tool_result') {
					let resultContent = content.content || 'Tool executed successfully';

					// Stringify if content is an object or array
					if (typeof resultContent === 'object' && resultContent !== null) {
						resultContent = JSON.stringify(resultContent, null, 2);
					}

					const isError = content.is_error || false;
					const toolName = content.tool_name || 'Unknown';

					// Don't send tool result for Read and Edit tools unless there's an error
					if ((toolName === 'Read' || toolName === 'Edit' || toolName === 'TodoWrite' || toolName === 'MultiEdit') && !isError) {
						// Still send to UI to hide loading state, but mark it as hidden
						this._onMessage({
							type: 'toolResult',
							data: {
								content: resultContent,
								isError: isError,
								toolUseId: content.tool_use_id,
								toolName: toolName,
								hidden: true
							}
						});
					} else {
						// Show tool result
						this._onMessage({
							type: 'toolResult',
							data: {
								content: resultContent,
								isError: isError,
								toolUseId: content.tool_use_id,
								toolName: toolName
							}
						});
					}
				}
			}
		}
	}

	/**
	 * Handles result messages (final response)
	 */
	private _handleResultMessage(jsonData: any): void {
		if (jsonData.subtype === 'success') {
			// Check for login errors
			if (jsonData.is_error && jsonData.result && jsonData.result.includes('Invalid API key')) {
				this._onLoginRequired();
				return;
			}

			// Capture session ID from final result
			if (jsonData.session_id) {
				this._onSessionUpdate(jsonData.session_id);

				// Show session info in UI
				this._onMessage({
					type: 'sessionInfo',
					data: {
						sessionId: jsonData.session_id,
						tools: jsonData.tools || [],
						mcpServers: jsonData.mcp_servers || []
					}
				});
			}

			// Update cumulative tracking
			this._requestCount++;
			if (jsonData.total_cost_usd) {
				this._totalCost += jsonData.total_cost_usd;
			}

			console.log('Result received:', {
				cost: jsonData.total_cost_usd,
				duration: jsonData.duration_ms,
				turns: jsonData.num_turns
			});

			// Send updated totals to webview
			this._onMessage({
				type: 'updateTotals',
				data: {
					totalCost: this._totalCost,
					totalTokensInput: this._totalTokensInput,
					totalTokensOutput: this._totalTokensOutput,
					requestCount: this._requestCount,
					currentCost: jsonData.total_cost_usd,
					currentDuration: jsonData.duration_ms,
					currentTurns: jsonData.num_turns
				}
			});

			// Notify that processing is complete
			this._onProcessingComplete();
		}
	}

	/**
	 * Sets token and cost values (used when loading conversations)
	 */
	setCounters(totalTokensInput: number, totalTokensOutput: number, totalCost: number): void {
		this._totalTokensInput = totalTokensInput;
		this._totalTokensOutput = totalTokensOutput;
		this._totalCost = totalCost;
	}
}