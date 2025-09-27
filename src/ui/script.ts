const getScript = (isTelemetryEnabled: boolean) => `<script>
		const vscode = acquireVsCodeApi();
		const messagesDiv = document.getElementById('messages');
		const messageInput = document.getElementById('messageInput');
		const sendBtn = document.getElementById('sendBtn');
		const statusDiv = document.getElementById('status');
		const statusTextDiv = document.getElementById('statusText');
		const filePickerModal = document.getElementById('filePickerModal');
		const fileSearchInput = document.getElementById('fileSearchInput');
		const fileList = document.getElementById('fileList');
		const imageBtn = document.getElementById('imageBtn');
		const filePickerTitle = document.getElementById('filePickerTitle');
		const fileModeBtn = document.getElementById('fileModeBtn');
		const folderModeBtn = document.getElementById('folderModeBtn');
		const filePickerBreadcrumb = document.getElementById('filePickerBreadcrumb');
		const currentPathSpan = document.getElementById('currentPath');

		let isProcessRunning = false;
		let filteredFiles = [];
		let selectedFileIndex = -1;
		let isFileMode = true; // true for files, false for folders
		let currentFolderPath = '';
		let filteredFolders = [];
		let planModeEnabled = false;
		let thinkingModeEnabled = false;
		let yoloModeEnabled = false;

		// Context file management
		let selectedContextFiles = new Set();
		let contextFiles = new Map(); // Map of path -> {path, name, type, icon}

		// MCP Server Management Variables
		let mcpServersData = [];
		let currentMCPScope = 'all';
		let mcpSearchQuery = '';
		let mcpInstallingServers = new Set();

		function shouldAutoScroll(messagesDiv) {
			const threshold = 100; // pixels from bottom
			const scrollTop = messagesDiv.scrollTop;
			const scrollHeight = messagesDiv.scrollHeight;
			const clientHeight = messagesDiv.clientHeight;
			
			return (scrollTop + clientHeight >= scrollHeight - threshold);
		}

		function scrollToBottomIfNeeded(messagesDiv, shouldScroll = null) {
			// If shouldScroll is not provided, check current scroll position
			if (shouldScroll === null) {
				shouldScroll = shouldAutoScroll(messagesDiv);
			}
			
			if (shouldScroll) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight;
			}
		}

		function parseFileReferences(content) {
			// Parse @file references and return HTML with file chips
			// Split content into lines to better handle file references
			const lines = content.split('\\n');
			const fileLines = [];
			const messageLines = [];
			let foundNonFileLine = false;

			for (const line of lines) {
				const trimmedLine = line.trim();
				// Check if line starts with @ (file reference)
				if (trimmedLine.startsWith('@') && !foundNonFileLine) {
					fileLines.push(trimmedLine);
				} else if (trimmedLine.length > 0) {
					foundNonFileLine = true;
					messageLines.push(line);
				} else if (foundNonFileLine) {
					messageLines.push(line);
				}
			}

			if (fileLines.length > 0) {
				// Extract file paths and create chips section
				const chips = fileLines.map(fileLine => {
					const path = fileLine.substring(1).trim(); // Remove @ and trim
					const name = path.split('/').pop() || path.split('\\\\').pop() || path;
					const icon = path === '/' ? '📦' : (path.endsWith('/') ? '📁' : getFileIcon(name));
					return \`<span class="inline-file-chip"><span class="file-icon">\${icon}</span><span class="file-name">\${name}</span></span>\`;
				}).join(' '); // Add space between chips

				const messageText = messageLines.join('\\n').trim();

				// Return formatted content with chips at the top
				if (messageText) {
					return \`<div class="context-references">\${chips}</div><div class="message-text">\${parseSimpleMarkdown(messageText)}</div>\`;
				} else {
					return \`<div class="context-references">\${chips}</div>\`;
				}
			}

			return parseSimpleMarkdown(content);
		}

		function addMessage(content, type = 'claude') {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const messageDiv = document.createElement('div');
			messageDiv.className = \`message \${type}\`;
			
			// Add header for main message types (excluding system)
			if (type === 'user' || type === 'claude' || type === 'error' || type === 'info' || type === 'success') {
				const headerDiv = document.createElement('div');
				headerDiv.className = 'message-header';
				
				const iconDiv = document.createElement('div');
				iconDiv.className = \`message-icon \${type}\`;
				
				const labelDiv = document.createElement('div');
				labelDiv.className = 'message-label';
				
				// Set icon and label based on type
				switch(type) {
					case 'user':
						iconDiv.textContent = '👤';
						labelDiv.textContent = 'You';
						break;
					case 'claude':
						iconDiv.textContent = '🤖';
						labelDiv.textContent = 'Claude';
						break;
					case 'error':
						iconDiv.textContent = '⚠️';
						labelDiv.textContent = 'Error';
						break;
					case 'info':
						iconDiv.textContent = 'ℹ️';
						labelDiv.textContent = 'Info';
						break;
					case 'success':
						iconDiv.textContent = '✅';
						labelDiv.textContent = 'Success';
						break;
				}
				
				// Add copy button
				const copyBtn = document.createElement('button');
				copyBtn.className = 'copy-btn';
				copyBtn.title = 'Copy message';
				copyBtn.onclick = () => copyMessageContent(messageDiv);
				copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
				
				headerDiv.appendChild(iconDiv);
				headerDiv.appendChild(labelDiv);
				headerDiv.appendChild(copyBtn);
				messageDiv.appendChild(headerDiv);
			}
			
			// Add content
			const contentDiv = document.createElement('div');
			contentDiv.className = 'message-content';
			
			if (type === 'user') {
				// Parse file references for user messages
				contentDiv.innerHTML = parseFileReferences(content);
			} else if (type === 'claude' || type === 'thinking') {
				contentDiv.innerHTML = content;
			} else {
				const preElement = document.createElement('pre');
				preElement.textContent = content;
				contentDiv.appendChild(preElement);
			}
			
			messageDiv.appendChild(contentDiv);
			
			// Check if this is a permission-related error and add yolo mode button
			if (type === 'error' && isPermissionError(content)) {
				const yoloSuggestion = document.createElement('div');
				yoloSuggestion.className = 'yolo-suggestion';
				yoloSuggestion.innerHTML = \`
					<div class="yolo-suggestion-text">
						<span>💡 This looks like a permission issue. You can enable Yolo Mode to skip all permission checks.</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">Enable Yolo Mode</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}


		function addToolUseMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const messageDiv = document.createElement('div');
			messageDiv.className = 'message tool';
			
			// Create modern header with icon
			const headerDiv = document.createElement('div');
			headerDiv.className = 'tool-header';
			
			const iconDiv = document.createElement('div');
			iconDiv.className = 'tool-icon';
			iconDiv.textContent = '🔧';
			
			const toolInfoElement = document.createElement('div');
			toolInfoElement.className = 'tool-info';
			let toolName = data.toolInfo.replace('🔧 Executing: ', '');
			// Replace TodoWrite with more user-friendly name
			if (toolName === 'TodoWrite') {
				toolName = 'Update Todos';
			}
			toolInfoElement.textContent = toolName;
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(toolInfoElement);
			messageDiv.appendChild(headerDiv);
			
			if (data.rawInput) {
				const inputElement = document.createElement('div');
				inputElement.className = 'tool-input';
				
				const contentDiv = document.createElement('div');
				contentDiv.className = 'tool-input-content';
				
				// Handle TodoWrite specially or format raw input
				if (data.toolName === 'TodoWrite' && data.rawInput.todos) {
					let todoHtml = 'Todo List Update:';
					for (const todo of data.rawInput.todos) {
						const status = todo.status === 'completed' ? '✅' :
							todo.status === 'in_progress' ? '🔄' : '⏳';
						todoHtml += '\\n' + status + ' ' + todo.content;
					}
					contentDiv.innerHTML = todoHtml;
					// Update the todo display at the top
				} else {
					// Format raw input with expandable content for long values
					// Use diff format for Edit, MultiEdit, and Write tools, regular format for others
					if (data.toolName === 'Edit') {
						contentDiv.innerHTML = formatEditToolDiff(data.rawInput);
					} else if (data.toolName === 'MultiEdit') {
						contentDiv.innerHTML = formatMultiEditToolDiff(data.rawInput);
					} else if (data.toolName === 'Write') {
						contentDiv.innerHTML = formatWriteToolDiff(data.rawInput);
					} else {
						contentDiv.innerHTML = formatToolInputUI(data.rawInput);
					}
				}
				
				inputElement.appendChild(contentDiv);
				messageDiv.appendChild(inputElement);
			} else if (data.toolInput) {
				// Fallback for pre-formatted input
				const inputElement = document.createElement('div');
				inputElement.className = 'tool-input';
				
				const labelDiv = document.createElement('div');
				labelDiv.className = 'tool-input-label';
				labelDiv.textContent = 'INPUT';
				inputElement.appendChild(labelDiv);
				
				const contentDiv = document.createElement('div');
				contentDiv.className = 'tool-input-content';
				contentDiv.textContent = data.toolInput;
				inputElement.appendChild(contentDiv);
				messageDiv.appendChild(inputElement);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function createExpandableInput(toolInput, rawInput) {
			try {
				let html = toolInput.replace(/\\[expand\\]/g, '<span class="expand-btn" onclick="toggleExpand(this)">expand</span>');
				
				// Store raw input data for expansion
				if (rawInput && typeof rawInput === 'object') {
					let btnIndex = 0;
					html = html.replace(/<span class="expand-btn"[^>]*>expand<\\/span>/g, (match) => {
						const keys = Object.keys(rawInput);
						const key = keys[btnIndex] || '';
						const value = rawInput[key] || '';
						const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
						const escapedValue = valueStr.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
						btnIndex++;
						return \`<span class="expand-btn" data-key="\${key}" data-value="\${escapedValue}" onclick="toggleExpand(this)">expand</span>\`;
					});
				}
				
				return html;
			} catch (error) {
				console.error('Error creating expandable input:', error);
				return toolInput;
			}
		}


		function addToolResultMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			// For Read and Edit tools with hidden flag, just hide loading state and show completion message
			if (data.hidden && (data.toolName === 'Read' || data.toolName === 'Edit' || data.toolName === 'TodoWrite' || data.toolName === 'MultiEdit') && !data.isError) {				
				return	
				// Show completion message
				const toolName = data.toolName;
				let completionText;
				if (toolName === 'Read') {
					completionText = '✅ Read completed';
				} else if (toolName === 'Edit') {
					completionText = '✅ Edit completed';
				} else if (toolName === 'TodoWrite') {
					completionText = '✅ Update Todos completed';
				} else {
					completionText = '✅ ' + toolName + ' completed';
				}
				addMessage(completionText, 'system');
				return; // Don't show the result message
			}
			
			if(data.isError && data.content === "File has not been read yet. Read it first before writing to it."){
				return addMessage("File has not been read yet. Let me read it first before writing to it.", 'system');
			}

			const messageDiv = document.createElement('div');
			messageDiv.className = data.isError ? 'message error' : 'message tool-result';
			
			// Create header
			const headerDiv = document.createElement('div');
			headerDiv.className = 'message-header';
			
			const iconDiv = document.createElement('div');
			iconDiv.className = data.isError ? 'message-icon error' : 'message-icon';
			iconDiv.style.background = data.isError ? 
				'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 
				'linear-gradient(135deg, #1cc08c 0%, #16a974 100%)';
			iconDiv.textContent = data.isError ? '❌' : '✅';
			
			const labelDiv = document.createElement('div');
			labelDiv.className = 'message-label';
			labelDiv.textContent = data.isError ? 'Error' : 'Result';
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(labelDiv);
			messageDiv.appendChild(headerDiv);
			
			// Add content
			const contentDiv = document.createElement('div');
			contentDiv.className = 'message-content';
			
			// Check if it's a tool result and truncate appropriately
			let content = data.content;
			if (content.length > 200 && !data.isError) {
				const truncateAt = 197;
				const truncated = content.substring(0, truncateAt);
				const resultId = 'result_' + Math.random().toString(36).substr(2, 9);
				
				const preElement = document.createElement('pre');
				preElement.innerHTML = '<span id="' + resultId + '_visible">' + escapeHtml(truncated) + '</span>' +
									   '<span id="' + resultId + '_ellipsis">...</span>' +
									   '<span id="' + resultId + '_hidden" style="display: none;">' + escapeHtml(content.substring(truncateAt)) + '</span>';
				contentDiv.appendChild(preElement);
				
				// Add expand button container
				const expandContainer = document.createElement('div');
				expandContainer.className = 'diff-expand-container';
				const expandButton = document.createElement('button');
				expandButton.className = 'diff-expand-btn';
				expandButton.textContent = 'Show more';
				expandButton.setAttribute('onclick', 'toggleResultExpansion(\\'' + resultId + '\\\')');
				expandContainer.appendChild(expandButton);
				contentDiv.appendChild(expandContainer);
			} else {
				const preElement = document.createElement('pre');
				preElement.textContent = content;
				contentDiv.appendChild(preElement);
			}
			
			messageDiv.appendChild(contentDiv);
			
			// Check if this is a permission-related error and add yolo mode button
			if (data.isError && isPermissionError(content)) {
				const yoloSuggestion = document.createElement('div');
				yoloSuggestion.className = 'yolo-suggestion';
				yoloSuggestion.innerHTML = \`
					<div class="yolo-suggestion-text">
						<span>💡 This looks like a permission issue. You can enable Yolo Mode to skip all permission checks.</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">Enable Yolo Mode</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function formatToolInputUI(input) {
			if (!input || typeof input !== 'object') {
				const str = String(input);
				if (str.length > 100) {
					const truncateAt = 97;
					const truncated = str.substring(0, truncateAt);
					const inputId = 'input_' + Math.random().toString(36).substr(2, 9);
					
					return '<span id="' + inputId + '_visible">' + escapeHtml(truncated) + '</span>' +
						   '<span id="' + inputId + '_ellipsis">...</span>' +
						   '<span id="' + inputId + '_hidden" style="display: none;">' + escapeHtml(str.substring(truncateAt)) + '</span>' +
						   '<div class="diff-expand-container">' +
						   '<button class="diff-expand-btn" onclick="toggleResultExpansion(\\\'' + inputId + '\\\')">Show more</button>' +
						   '</div>';
				}
				return str;
			}

			// Special handling for Read tool with file_path
			if (input.file_path && Object.keys(input).length === 1) {
				const formattedPath = formatFilePath(input.file_path);
				return '<div class="diff-file-path clickable-file-path" data-file-path="' + escapeHtml(input.file_path) + '">' + formattedPath + '</div>';
			}

			let result = '';
			let isFirst = true;
			let offsetValue = null;

			// First pass: find offset value if it exists
			if (input.offset && typeof input.offset === 'number') {
				offsetValue = input.offset;
			}

			for (const [key, value] of Object.entries(input)) {
				const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

				if (!isFirst) result += '\\n';
				isFirst = false;

				// Special formatting for file_path in Read tool context
				if (key === 'file_path') {
					const formattedPath = formatFilePath(valueStr);
					const lineNumber = offsetValue ? offsetValue + 1 : null; // Convert 0-based offset to 1-based line number
					result += '<div class="diff-file-path clickable-file-path" data-file-path="' + escapeHtml(valueStr) + '"' +
							  (lineNumber ? ' data-line-number="' + lineNumber + '"' : '') + '>' + formattedPath + '</div>';
				} else if (valueStr.length > 100) {
					const truncated = valueStr.substring(0, 97) + '...';
					const escapedValue = valueStr.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
					result += '<span class="expandable-item"><strong>' + key + ':</strong> ' + truncated + ' <span class="expand-btn" data-key="' + key + '" data-value="' + escapedValue + '" onclick="toggleExpand(this)">expand</span></span>';
				} else {
					result += '<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			return result;
		}

		function formatEditToolDiff(input) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is an Edit tool (has file_path, old_string, new_string)
			if (!input.file_path || !input.old_string || !input.new_string) {
				return formatToolInputUI(input);
			}

			// Format file path with better display
			const formattedPath = formatFilePath(input.file_path);
			let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>\\n';
			
			// Create diff view
			const oldLines = input.old_string.split('\\n');
			const newLines = input.new_string.split('\\n');
			const allLines = [...oldLines.map(line => ({type: 'removed', content: line})), 
							 ...newLines.map(line => ({type: 'added', content: line}))];
			
			const maxLines = 6;
			const shouldTruncate = allLines.length > maxLines;
			const visibleLines = shouldTruncate ? allLines.slice(0, maxLines) : allLines;
			const hiddenLines = shouldTruncate ? allLines.slice(maxLines) : [];
			
			result += '<div class="diff-container">';
			result += '<div class="diff-header">Changes:</div>';
			
			// Create a unique ID for this diff
			const diffId = 'diff_' + Math.random().toString(36).substr(2, 9);
			
			// Show visible lines
			result += '<div id="' + diffId + '_visible">';
			for (const line of visibleLines) {
				const prefix = line.type === 'removed' ? '- ' : '+ ';
				const cssClass = line.type === 'removed' ? 'removed' : 'added';
				result += '<div class="diff-line ' + cssClass + '">' + prefix + escapeHtml(line.content) + '</div>';
			}
			result += '</div>';
			
			// Show hidden lines (initially hidden)
			if (shouldTruncate) {
				result += '<div id="' + diffId + '_hidden" style="display: none;">';
				for (const line of hiddenLines) {
					const prefix = line.type === 'removed' ? '- ' : '+ ';
					const cssClass = line.type === 'removed' ? 'removed' : 'added';
					result += '<div class="diff-line ' + cssClass + '">' + prefix + escapeHtml(line.content) + '</div>';
				}
				result += '</div>';
				
				// Add expand button
				result += '<div class="diff-expand-container">';
				result += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\\'' + diffId + '\\\')">Show ' + hiddenLines.length + ' more lines</button>';
				result += '</div>';
			}
			
			result += '</div>';
			
			// Add other properties if they exist
			for (const [key, value] of Object.entries(input)) {
				if (key !== 'file_path' && key !== 'old_string' && key !== 'new_string') {
					const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
					result += '\\n<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			
			return result;
		}

		function formatMultiEditToolDiff(input) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is a MultiEdit tool (has file_path and edits array)
			if (!input.file_path || !input.edits || !Array.isArray(input.edits)) {
				return formatToolInputUI(input);
			}

			// Format file path with better display
			const formattedPath = formatFilePath(input.file_path);
			let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>\\n';
			
			// Count total lines across all edits for truncation
			let totalLines = 0;
			for (const edit of input.edits) {
				if (edit.old_string && edit.new_string) {
					const oldLines = edit.old_string.split('\\n');
					const newLines = edit.new_string.split('\\n');
					totalLines += oldLines.length + newLines.length;
				}
			}

			const maxLines = 6;
			const shouldTruncate = totalLines > maxLines;
			
			result += '<div class="diff-container">';
			result += '<div class="diff-header">Changes (' + input.edits.length + ' edit' + (input.edits.length > 1 ? 's' : '') + '):</div>';
			
			// Create a unique ID for this diff
			const diffId = 'multiedit_' + Math.random().toString(36).substr(2, 9);
			
			let currentLineCount = 0;
			let visibleEdits = [];
			let hiddenEdits = [];
			
			// Determine which edits to show/hide based on line count
			for (let i = 0; i < input.edits.length; i++) {
				const edit = input.edits[i];
				if (!edit.old_string || !edit.new_string) continue;
				
				const oldLines = edit.old_string.split('\\n');
				const newLines = edit.new_string.split('\\n');
				const editLines = oldLines.length + newLines.length;
				
				if (shouldTruncate && currentLineCount + editLines > maxLines && visibleEdits.length > 0) {
					hiddenEdits.push(edit);
				} else {
					visibleEdits.push(edit);
					currentLineCount += editLines;
				}
			}
			
			// Show visible edits
			result += '<div id="' + diffId + '_visible">';
			for (let i = 0; i < visibleEdits.length; i++) {
				const edit = visibleEdits[i];
				if (i > 0) result += '<div class="diff-edit-separator"></div>';
				result += formatSingleEdit(edit, i + 1);
			}
			result += '</div>';
			
			// Show hidden edits (initially hidden)
			if (hiddenEdits.length > 0) {
				result += '<div id="' + diffId + '_hidden" style="display: none;">';
				for (let i = 0; i < hiddenEdits.length; i++) {
					const edit = hiddenEdits[i];
					result += '<div class="diff-edit-separator"></div>';
					result += formatSingleEdit(edit, visibleEdits.length + i + 1);
				}
				result += '</div>';
				
				// Add expand button
				result += '<div class="diff-expand-container">';
				result += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\\'' + diffId + '\\\')">Show ' + hiddenEdits.length + ' more edit' + (hiddenEdits.length > 1 ? 's' : '') + '</button>';
				result += '</div>';
			}
			
			result += '</div>';
			
			// Add other properties if they exist
			for (const [key, value] of Object.entries(input)) {
				if (key !== 'file_path' && key !== 'edits') {
					const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
					result += '\\n<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			
			return result;
		}

		function formatSingleEdit(edit, editNumber) {
			let result = '<div class="single-edit">';
			result += '<div class="edit-number">Edit #' + editNumber + '</div>';
			
			// Create diff view for this single edit
			const oldLines = edit.old_string.split('\\n');
			const newLines = edit.new_string.split('\\n');
			
			// Show removed lines
			for (const line of oldLines) {
				result += '<div class="diff-line removed">- ' + escapeHtml(line) + '</div>';
			}
			
			// Show added lines
			for (const line of newLines) {
				result += '<div class="diff-line added">+ ' + escapeHtml(line) + '</div>';
			}
			
			result += '</div>';
			return result;
		}

		function formatWriteToolDiff(input) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is a Write tool (has file_path and content)
			if (!input.file_path || !input.content) {
				return formatToolInputUI(input);
			}

			// Format file path with better display
			const formattedPath = formatFilePath(input.file_path);
			let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>\\n';
			
			// Create diff view showing all content as additions
			const contentLines = input.content.split('\\n');
			
			const maxLines = 6;
			const shouldTruncate = contentLines.length > maxLines;
			const visibleLines = shouldTruncate ? contentLines.slice(0, maxLines) : contentLines;
			const hiddenLines = shouldTruncate ? contentLines.slice(maxLines) : [];
			
			result += '<div class="diff-container">';
			result += '<div class="diff-header">New file content:</div>';
			
			// Create a unique ID for this diff
			const diffId = 'write_' + Math.random().toString(36).substr(2, 9);
			
			// Show visible lines (all as additions)
			result += '<div id="' + diffId + '_visible">';
			for (const line of visibleLines) {
				result += '<div class="diff-line added">+ ' + escapeHtml(line) + '</div>';
			}
			result += '</div>';
			
			// Show hidden lines (initially hidden)
			if (shouldTruncate) {
				result += '<div id="' + diffId + '_hidden" style="display: none;">';
				for (const line of hiddenLines) {
					result += '<div class="diff-line added">+ ' + escapeHtml(line) + '</div>';
				}
				result += '</div>';
				
				// Add expand button
				result += '<div class="diff-expand-container">';
				result += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\\'' + diffId + '\\\')">Show ' + hiddenLines.length + ' more lines</button>';
				result += '</div>';
			}
			
			result += '</div>';
			
			// Add other properties if they exist
			for (const [key, value] of Object.entries(input)) {
				if (key !== 'file_path' && key !== 'content') {
					const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
					result += '\\n<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			
			return result;
		}

		function escapeHtml(text) {
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML;
		}

		function openFileInEditor(filePath, lineNumber) {
			vscode.postMessage({
				type: 'openFile',
				filePath: filePath,
				lineNumber: lineNumber
			});
		}

		function formatFilePath(filePath) {
			if (!filePath) return '';
			
			// Extract just the filename
			const parts = filePath.split('/');
			const fileName = parts[parts.length - 1];
			
			return '<span class="file-path-truncated" title="' + escapeHtml(filePath) + '" data-file-path="' + escapeHtml(filePath) + '">' + 
				   '<span class="file-icon">📄</span>' + escapeHtml(fileName) + '</span>';
		}

		function toggleDiffExpansion(diffId) {
			const hiddenDiv = document.getElementById(diffId + '_hidden');
			const button = document.querySelector('[onclick*="' + diffId + '"]');
			
			if (hiddenDiv && button) {
				if (hiddenDiv.style.display === 'none') {
					hiddenDiv.style.display = 'block';
					button.textContent = 'Show less';
				} else {
					hiddenDiv.style.display = 'none';
					const hiddenLines = hiddenDiv.querySelectorAll('.diff-line').length;
					button.textContent = 'Show ' + hiddenLines + ' more lines';
				}
			}
		}

		function toggleResultExpansion(resultId) {
			const hiddenDiv = document.getElementById(resultId + '_hidden');
			const ellipsis = document.getElementById(resultId + '_ellipsis');
			const button = document.querySelector('[onclick*="toggleResultExpansion(\\'' + resultId + '\\\')"]');
			
			if (hiddenDiv && button) {
				if (hiddenDiv.style.display === 'none') {
					hiddenDiv.style.display = 'inline';
					if (ellipsis) ellipsis.style.display = 'none';
					button.textContent = 'Show less';
				} else {
					hiddenDiv.style.display = 'none';
					if (ellipsis) ellipsis.style.display = 'inline';
					button.textContent = 'Show more';
				}
			}
		}

		function toggleExpand(button) {
			const key = button.getAttribute('data-key');
			const value = button.getAttribute('data-value');
			
			// Find the container that holds just this key-value pair
			let container = button.parentNode;
			while (container && !container.classList.contains('expandable-item')) {
				container = container.parentNode;
			}
			
			if (!container) {
				// Fallback: create a wrapper around the current line
				const parent = button.parentNode;
				const wrapper = document.createElement('div');
				wrapper.className = 'expandable-item';
				parent.insertBefore(wrapper, button.previousSibling || button);
				
				// Move the key, value text, and button into the wrapper
				let currentNode = wrapper.nextSibling;
				const nodesToMove = [];
				while (currentNode && currentNode !== button.nextSibling) {
					nodesToMove.push(currentNode);
					currentNode = currentNode.nextSibling;
				}
				nodesToMove.forEach(node => wrapper.appendChild(node));
				container = wrapper;
			}
			
			if (button.textContent === 'expand') {
				// Show full content
				const decodedValue = value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
				container.innerHTML = '<strong>' + key + ':</strong> ' + decodedValue + ' <span class="expand-btn" data-key="' + key + '" data-value="' + value + '" onclick="toggleExpand(this)">collapse</span>';
			} else {
				// Show truncated content
				const decodedValue = value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
				const truncated = decodedValue.substring(0, 97) + '...';
				container.innerHTML = '<strong>' + key + ':</strong> ' + truncated + ' <span class="expand-btn" data-key="' + key + '" data-value="' + value + '" onclick="toggleExpand(this)">expand</span>';
			}
		}

		function sendMessage() {
			const text = messageInput.value.trim();
			if (text || contextFiles.size > 0) {
				// Clear todos when user sends a new message

				// Build message with context files
				let fullMessage = '';

				// Add context files as references with special separator
				if (contextFiles.size > 0) {
					// Use newline to separate file paths from message text
					const filePaths = Array.from(contextFiles.values()).map(f => '@' + f.path).join('\\n');
					fullMessage = filePaths + (text ? '\\n\\n' + text : '');
				} else {
					fullMessage = text;
				}

				vscode.postMessage({
					type: 'sendMessage',
					text: fullMessage,
					planMode: planModeEnabled,
					thinkingMode: thinkingModeEnabled,
					contextFiles: Array.from(contextFiles.values())
				});

				messageInput.value = '';
				clearAllContext(); // Clear context after sending
			}
		}

		function togglePlanMode() {
			planModeEnabled = !planModeEnabled;
			const switchElement = document.getElementById('planModeSwitch');
			if (planModeEnabled) {
				switchElement.classList.add('active');
			} else {
				switchElement.classList.remove('active');
			}
		}

		function toggleThinkingMode() {
			thinkingModeEnabled = !thinkingModeEnabled;
			
			if (thinkingModeEnabled) {
				sendStats('Thinking mode enabled');
			}
			
			const switchElement = document.getElementById('thinkingModeSwitch');
			const toggleLabel = document.getElementById('thinkingModeLabel');
			if (thinkingModeEnabled) {
				switchElement.classList.add('active');
				// Show thinking intensity modal when thinking mode is enabled
				showThinkingIntensityModal();
			} else {
				switchElement.classList.remove('active');
				// Reset to default "Thinking Mode" when turned off
				if (toggleLabel) {
					toggleLabel.textContent = 'Thinking Mode';
				}
			}
		}

		function toggleYoloMode() {
			yoloModeEnabled = !yoloModeEnabled;

			const switchElement = document.getElementById('yoloModeSwitch');
			if (yoloModeEnabled) {
				switchElement.classList.add('active');
			} else {
				switchElement.classList.remove('active');
			}

			// Update the yolo warning visibility
			updateYoloWarning();

			// Update settings to save the state
			updateSettings();
		}



		let totalCost = 0;
		let totalTokensInput = 0;
		let totalTokensOutput = 0;
		let requestCount = 0;
		let isProcessing = false;
		let requestStartTime = null;
		let requestTimer = null;

		// Send usage statistics
		function sendStats(eventName) {
			${isTelemetryEnabled ? 
			`try {
				if (typeof umami !== 'undefined' && umami.track) {
					umami.track(eventName);
				}
			} catch (error) {
				console.error('Error sending stats:', error);
			}` : 
			`// Telemetry disabled - no tracking`}
		}

		function updateStatus(text, state = 'ready') {
			statusTextDiv.textContent = text;
			statusDiv.className = \`status \${state}\`;
		}


		function updateStatusWithTotals() {
			if (isProcessing) {
				// While processing, show tokens and elapsed time
				const totalTokens = totalTokensInput + totalTokensOutput;
				const tokensStr = totalTokens > 0 ? 
					\`\${totalTokens.toLocaleString()} tokens\` : '0 tokens';
				
				let elapsedStr = '';
				if (requestStartTime) {
					const elapsedSeconds = Math.floor((Date.now() - requestStartTime) / 1000);
					elapsedStr = \` • \${elapsedSeconds}s\`;
				}
				
				const statusText = \`Processing • \${tokensStr}\${elapsedStr}\`;
				updateStatus(statusText, 'processing');
			} else {
				// When ready, show full info
				const costStr = totalCost > 0 ? \`$\${totalCost.toFixed(4)}\` : '$0.00';
				const totalTokens = totalTokensInput + totalTokensOutput;
				const tokensStr = totalTokens > 0 ? 
					\`\${totalTokens.toLocaleString()} tokens\` : '0 tokens';
				const requestStr = requestCount > 0 ? \`\${requestCount} requests\` : '';
				
				const statusText = \`Ready • \${costStr} • \${tokensStr}\${requestStr ? \` • \${requestStr}\` : ''}\`;
				updateStatus(statusText, 'ready');
			}
		}

		function startRequestTimer(startTime = undefined) {
			requestStartTime = startTime || Date.now();
			// Update status every 100ms for smooth real-time display
			requestTimer = setInterval(() => {
				if (isProcessing) {
					updateStatusWithTotals();
				}
			}, 100);
		}

		function stopRequestTimer() {
			if (requestTimer) {
				clearInterval(requestTimer);
				requestTimer = null;
			}
			requestStartTime = null;
		}

		// Auto-resize textarea
		function adjustTextareaHeight() {
			// Reset height to calculate new height
			messageInput.style.height = 'auto';
			
			// Get computed styles
			const computedStyle = getComputedStyle(messageInput);
			const lineHeight = parseFloat(computedStyle.lineHeight);
			const paddingTop = parseFloat(computedStyle.paddingTop);
			const paddingBottom = parseFloat(computedStyle.paddingBottom);
			const borderTop = parseFloat(computedStyle.borderTopWidth);
			const borderBottom = parseFloat(computedStyle.borderBottomWidth);
			
			// Calculate heights
			const scrollHeight = messageInput.scrollHeight;
			const maxRows = 5;
			const minHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
			const maxHeight = (lineHeight * maxRows) + paddingTop + paddingBottom + borderTop + borderBottom;
			
			// Set height
			if (scrollHeight <= maxHeight) {
				messageInput.style.height = Math.max(scrollHeight, minHeight) + 'px';
				messageInput.style.overflowY = 'hidden';
			} else {
				messageInput.style.height = maxHeight + 'px';
				messageInput.style.overflowY = 'auto';
			}
		}

		messageInput.addEventListener('input', adjustTextareaHeight);
		
		// Save input text as user types (debounced)
		let saveInputTimeout;
		messageInput.addEventListener('input', () => {
			clearTimeout(saveInputTimeout);
			saveInputTimeout = setTimeout(() => {
				vscode.postMessage({
					type: 'saveInputText',
					text: messageInput.value
				});
			}, 500); // Save after 500ms of no typing
		});
		
		messageInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				const sendBtn = document.getElementById('sendBtn');
				if (sendBtn.disabled){
					return;
				}
				sendMessage();
			} else if (e.key === 'Escape' && filePickerModal.style.display === 'flex') {
				e.preventDefault();
				hideFilePicker();
			} else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
				// Handle Ctrl+V/Cmd+V explicitly in case paste event doesn't fire
				// Don't prevent default - let browser handle it first
				setTimeout(() => {
					// If value hasn't changed, manually trigger paste
					const currentValue = messageInput.value;
					setTimeout(() => {
						if (messageInput.value === currentValue) {
							// Value didn't change, request clipboard from VS Code
							vscode.postMessage({
								type: 'getClipboardText'
							});
						}
					}, 50);
				}, 0);
			}
		});

		// Add explicit paste event handler for better clipboard support in VSCode webviews
		messageInput.addEventListener('paste', async (e) => {
			e.preventDefault();
			
			try {
				// Try to get clipboard data from the event first
				const clipboardData = e.clipboardData;
				
				// Check for images first
				if (clipboardData && clipboardData.items) {
					let hasImage = false;
					for (let i = 0; i < clipboardData.items.length; i++) {
						const item = clipboardData.items[i];
						if (item.type.startsWith('image/')) {
							// Found an image, handle it
							console.log('Image detected in clipboard:', item.type);
							hasImage = true;
							const blob = item.getAsFile();
							if (blob) {
								console.log('Converting image blob to base64...');
								// Convert blob to base64
								const reader = new FileReader();
								reader.onload = function(event) {
									const base64Data = event.target.result;
									console.log('Sending image to extension for file creation');
									// Send to extension to create file
									vscode.postMessage({
										type: 'createImageFile',
										imageData: base64Data,
										imageType: item.type
									});
								};
								reader.readAsDataURL(blob);
							}
							break; // Process only the first image found
						}
					}
					
					// If we found an image, don't process any text
					if (hasImage) {
						return;
					}
				}
				
				// No image found, handle text
				let text = '';
				
				if (clipboardData) {
					text = clipboardData.getData('text/plain');
				}
				
				// If no text from event, try navigator.clipboard API
				if (!text && navigator.clipboard && navigator.clipboard.readText) {
					try {
						text = await navigator.clipboard.readText();
					} catch (err) {
						console.log('Clipboard API failed:', err);
					}
				}
				
				// If still no text, request from VS Code extension
				if (!text) {
					vscode.postMessage({
						type: 'getClipboardText'
					});
					return;
				}
				
				// Insert text at cursor position
				const start = messageInput.selectionStart;
				const end = messageInput.selectionEnd;
				const currentValue = messageInput.value;
				
				const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
				messageInput.value = newValue;
				
				// Set cursor position after pasted text
				const newCursorPos = start + text.length;
				messageInput.setSelectionRange(newCursorPos, newCursorPos);
				
				// Trigger input event to adjust height
				messageInput.dispatchEvent(new Event('input', { bubbles: true }));
			} catch (error) {
				console.error('Paste error:', error);
			}
		});

		// Handle context menu paste
		messageInput.addEventListener('contextmenu', (e) => {
			// Don't prevent default - allow context menu to show
			// but ensure paste will work when selected
		});

		// Initialize textarea height
		adjustTextareaHeight();

		// File picker event listeners
		fileSearchInput.addEventListener('input', (e) => {
			filterFiles(e.target.value);
		});

		fileSearchInput.addEventListener('keydown', (e) => {
			const items = isFileMode ? filteredFiles : filteredFolders;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedFileIndex = Math.min(selectedFileIndex + 1, items.length - 1);
				renderFileList();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedFileIndex = Math.max(selectedFileIndex - 1, -1);
				renderFileList();
			} else if (e.key === 'Enter' && selectedFileIndex >= 0) {
				e.preventDefault();
				const selectedItem = items[selectedFileIndex];
				if (isFileMode) {
					selectFile(selectedItem);
				} else {
					if (e.ctrlKey || e.metaKey) {
						// Ctrl+Enter navigates into folder
						if (selectedItem.isDirectory) {
							navigateToFolder(selectedItem);
						}
					} else {
						// Enter selects the folder
						selectFolder(selectedItem);
					}
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
				hideFilePicker();
			}
		});

		// Close modal when clicking outside
		filePickerModal.addEventListener('click', (e) => {
			if (e.target === filePickerModal) {
				hideFilePicker();
			}
		});

		// Tools modal functions
		function showMCPModal() {
			document.getElementById('mcpModal').style.display = 'flex';
			// Reset to default state
			currentMCPScope = 'all';
			mcpSearchQuery = '';
			mcpServersData = [];

			// Update UI and load servers
			updateMCPScopeUI();
			loadEnhancedMCPServers();
		}
		
		function updateYoloWarning() {
			const warning = document.getElementById('yoloWarning');
			
			if (!warning) {
				return; // Elements not ready yet
			}
			
			warning.style.display = yoloModeEnabled ? 'block' : 'none';
		}
		
		function isPermissionError(content) {
			const permissionErrorPatterns = [
				'Error: MCP config file not found',
				'Error: MCP tool',
				'Claude requested permissions to use',
				'permission denied',
				'Permission denied',
				'permission request',
				'Permission request',
				'EACCES',
				'permission error',
				'Permission error'
			];
			
			return permissionErrorPatterns.some(pattern => 
				content.toLowerCase().includes(pattern.toLowerCase())
			);
		}
		
		function enableYoloMode() {
			sendStats('YOLO mode enabled');
			
			// Enable yolo mode
			yoloModeEnabled = true;
			
			// Update the toggle UI
			const switchElement = document.getElementById('yoloModeSwitch');
			if (switchElement) {
				switchElement.classList.add('active');
			}
			
			// Trigger the settings update
			updateSettings();
			
			// Show confirmation message
			addMessage('✅ Yolo Mode enabled! All permission checks will be bypassed for future commands.', 'system');
			
			// Update the warning banner
			updateYoloWarning();
		}

		function hideMCPModal() {
			document.getElementById('mcpModal').style.display = 'none';
			hideCustomMCPModal();
		}

		// Close MCP modal when clicking outside
		document.getElementById('mcpModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('mcpModal')) {
				hideMCPModal();
			}
		});

		// MCP Server management functions
		function loadMCPServers() {
			vscode.postMessage({ type: 'loadMCPServers' });
		}

		function showAddServerForm() {
			document.getElementById('addServerBtn').style.display = 'none';
			document.getElementById('popularServers').style.display = 'none';
			document.getElementById('addServerForm').style.display = 'block';
		}

		function hideAddServerForm() {
			document.getElementById('addServerBtn').style.display = 'block';
			document.getElementById('popularServers').style.display = 'block';
			document.getElementById('addServerForm').style.display = 'none';
			
			// Reset editing state
			editingServerName = null;
			
			// Reset form title and button
			const formTitle = document.querySelector('#addServerForm h5');
			if (formTitle) formTitle.remove();
			
			const saveBtn = document.querySelector('#addServerForm .btn:not(.outlined)');
			if (saveBtn) saveBtn.textContent = 'Add Server';
			
			// Clear form
			document.getElementById('serverName').value = '';
			document.getElementById('serverName').disabled = false;
			document.getElementById('serverCommand').value = '';
			document.getElementById('serverUrl').value = '';
			document.getElementById('serverArgs').value = '';
			document.getElementById('serverEnv').value = '';
			document.getElementById('serverHeaders').value = '';
			document.getElementById('serverType').value = 'http';
			updateServerForm();
		}

		function updateServerForm() {
			const serverType = document.getElementById('serverType').value;
			const commandGroup = document.getElementById('commandGroup');
			const urlGroup = document.getElementById('urlGroup');
			const argsGroup = document.getElementById('argsGroup');
			const envGroup = document.getElementById('envGroup');
			const headersGroup = document.getElementById('headersGroup');

			if (serverType === 'stdio') {
				commandGroup.style.display = 'block';
				urlGroup.style.display = 'none';
				argsGroup.style.display = 'block';
				envGroup.style.display = 'block';
				headersGroup.style.display = 'none';
			} else if (serverType === 'http' || serverType === 'sse') {
				commandGroup.style.display = 'none';
				urlGroup.style.display = 'block';
				argsGroup.style.display = 'none';
				envGroup.style.display = 'none';
				headersGroup.style.display = 'block';
			}
		}

		function saveMCPServer() {
			sendStats('MCP server added');
			
			const name = document.getElementById('serverName').value.trim();
			const type = document.getElementById('serverType').value;
			
			if (!name) {
				// Use a simple notification instead of alert which is blocked
				const notification = document.createElement('div');
				notification.textContent = 'Server name is required';
				notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
				document.body.appendChild(notification);
				setTimeout(() => notification.remove(), 3000);
				return;
			}

			// If editing, we can use the same name; if adding, check for duplicates
			if (!editingServerName) {
				const serversList = document.getElementById('mcpServersList');
				const existingServers = serversList.querySelectorAll('.server-name');
				for (let server of existingServers) {
					if (server.textContent === name) {
						const notification = document.createElement('div');
						notification.textContent = \`Server "\${name}" already exists\`;
						notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
						document.body.appendChild(notification);
						setTimeout(() => notification.remove(), 3000);
						return;
					}
				}
			}

			const serverConfig = { type };

			if (type === 'stdio') {
				const command = document.getElementById('serverCommand').value.trim();
				if (!command) {
					const notification = document.createElement('div');
					notification.textContent = 'Command is required for stdio servers';
					notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
					document.body.appendChild(notification);
					setTimeout(() => notification.remove(), 3000);
					return;
				}
				serverConfig.command = command;

				const argsText = document.getElementById('serverArgs').value.trim();
				if (argsText) {
					serverConfig.args = argsText.split('\\n').filter(line => line.trim());
				}

				const envText = document.getElementById('serverEnv').value.trim();
				if (envText) {
					serverConfig.env = {};
					envText.split('\\n').forEach(line => {
						const [key, ...valueParts] = line.split('=');
						if (key && valueParts.length > 0) {
							serverConfig.env[key.trim()] = valueParts.join('=').trim();
						}
					});
				}
			} else if (type === 'http' || type === 'sse') {
				const url = document.getElementById('serverUrl').value.trim();
				if (!url) {
					const notification = document.createElement('div');
					notification.textContent = 'URL is required for HTTP/SSE servers';
					notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
					document.body.appendChild(notification);
					setTimeout(() => notification.remove(), 3000);
					return;
				}
				serverConfig.url = url;

				const headersText = document.getElementById('serverHeaders').value.trim();
				if (headersText) {
					serverConfig.headers = {};
					headersText.split('\\n').forEach(line => {
						const [key, ...valueParts] = line.split('=');
						if (key && valueParts.length > 0) {
							serverConfig.headers[key.trim()] = valueParts.join('=').trim();
						}
					});
				}
			}

			vscode.postMessage({ 
				type: 'saveMCPServer', 
				name: name,
				config: serverConfig 
			});
			
			hideAddServerForm();
		}

		function deleteMCPServer(serverName) {
			// Just delete without confirmation
			vscode.postMessage({ 
				type: 'deleteMCPServer', 
				name: serverName 
			});
		}

		let editingServerName = null;

		function editMCPServer(name, config) {
			editingServerName = name;
			
			// Hide add button and popular servers
			document.getElementById('addServerBtn').style.display = 'none';
			document.getElementById('popularServers').style.display = 'none';
			
			// Show form
			document.getElementById('addServerForm').style.display = 'block';
			
			// Update form title and button
			const formTitle = document.querySelector('#addServerForm h5') || 
				document.querySelector('#addServerForm').insertAdjacentHTML('afterbegin', '<h5>Edit MCP Server</h5>') ||
				document.querySelector('#addServerForm h5');
			if (!document.querySelector('#addServerForm h5')) {
				document.getElementById('addServerForm').insertAdjacentHTML('afterbegin', '<h5 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600;">Edit MCP Server</h5>');
			} else {
				document.querySelector('#addServerForm h5').textContent = 'Edit MCP Server';
			}
			
			// Update save button text
			const saveBtn = document.querySelector('#addServerForm .btn:not(.outlined)');
			if (saveBtn) saveBtn.textContent = 'Update Server';
			
			// Populate form with existing values
			document.getElementById('serverName').value = name;
			document.getElementById('serverName').disabled = true; // Don't allow name changes when editing
			
			document.getElementById('serverType').value = config.type || 'stdio';
			
			if (config.command) {
				document.getElementById('serverCommand').value = config.command;
			}
			if (config.url) {
				document.getElementById('serverUrl').value = config.url;
			}
			if (config.args && Array.isArray(config.args)) {
				document.getElementById('serverArgs').value = config.args.join('\\n');
			}
			if (config.env) {
				const envLines = Object.entries(config.env).map(([key, value]) => \`\${key}=\${value}\`);
				document.getElementById('serverEnv').value = envLines.join('\\n');
			}
			if (config.headers) {
				const headerLines = Object.entries(config.headers).map(([key, value]) => \`\${key}=\${value}\`);
				document.getElementById('serverHeaders').value = headerLines.join('\\n');
			}
			
			// Update form field visibility
			updateServerForm();

			const toolsList = document.querySelector('.tools-list');
			if (toolsList) {
			  toolsList.scrollTop = toolsList.scrollHeight;
			}
		}

		function addPopularServer(name, config) {
			// Check if server already exists
			const serversList = document.getElementById('mcpServersList');
			const existingServers = serversList.querySelectorAll('.server-name');
			for (let server of existingServers) {
				if (server.textContent === name) {
					const notification = document.createElement('div');
					notification.textContent = \`Server "\${name}" already exists\`;
					notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
					document.body.appendChild(notification);
					setTimeout(() => notification.remove(), 3000);
					return;
				}
			}
			
			sendStats('MCP server added');
			
			// Add the server
			vscode.postMessage({ 
				type: 'saveMCPServer', 
				name: name,
				config: config 
			});
		}

		function displayMCPServers(servers) {
			const serversList = document.getElementById('mcpServersList');
			serversList.innerHTML = '';

			if (Object.keys(servers).length === 0) {
				serversList.innerHTML = '<div class="no-servers">No MCP servers configured</div>';
				return;
			}

			for (const [name, config] of Object.entries(servers)) {				
				const serverItem = document.createElement('div');
				serverItem.className = 'mcp-server-item';
				
				// Defensive check for config structure
				if (!config || typeof config !== 'object') {
					console.error('Invalid config for server:', name, config);
					continue;
				}
				
				const serverType = config.type || 'stdio';
				let configDisplay = '';
				
				if (serverType === 'stdio') {
					configDisplay = \`Command: \${config.command || 'Not specified'}\`;
					if (config.args && Array.isArray(config.args)) {
						configDisplay += \`<br>Args: \${config.args.join(' ')}\`;
					}
				} else if (serverType === 'http' || serverType === 'sse') {
					configDisplay = \`URL: \${config.url || 'Not specified'}\`;
				} else {
					configDisplay = \`Type: \${serverType}\`;
				}

				serverItem.innerHTML = \`
					<div class="server-info">
						<div class="server-name">\${name}</div>
						<div class="server-type">\${serverType.toUpperCase()}</div>
						<div class="server-config">\${configDisplay}</div>
					</div>
					<div class="server-actions">
						<button class="btn outlined server-edit-btn" onclick="editMCPServer('\${name}', \${JSON.stringify(config).replace(/"/g, '&quot;')})">Edit</button>
						<button class="btn outlined server-delete-btn" onclick="deleteMCPServer('\${name}')">Delete</button>
					</div>
				\`;
				
				serversList.appendChild(serverItem);
			}
		}

		// Enhanced MCP Server Management Functions
		function loadEnhancedMCPServers() {
			showMCPLoading(true);
			vscode.postMessage({ type: 'loadMCPServers' });
		}

		function switchMCPScope(scope) {
			currentMCPScope = scope;
			updateMCPScopeUI();
			displayFilteredMCPServers();
		}

		function updateMCPScopeUI() {
			// Update tab buttons
			document.querySelectorAll('.mcp-scope-tab').forEach(tab => {
				tab.classList.remove('active');
				if (tab.dataset.scope === currentMCPScope) {
					tab.classList.add('active');
				}
			});

			// Update description
			const descriptions = {
				all: 'Browse and manage all MCP servers',
				installed: 'View and manage installed servers',
				available: 'Discover and install new servers'
			};
			const descElement = document.getElementById('mcpScopeDescription');
			if (descElement) {
				descElement.textContent = descriptions[currentMCPScope] || descriptions.all;
			}
		}

		function filterMCPServers() {
			mcpSearchQuery = document.getElementById('mcpSearchInput').value.toLowerCase();
			displayFilteredMCPServers();
		}

		function displayFilteredMCPServers() {
			const serverList = document.getElementById('mcpServerList');
			const emptyState = document.getElementById('mcpEmptyState');
			const statsText = document.getElementById('mcpStatsText');

			let filteredServers = mcpServersData.filter(server => {
				// Apply scope filter
				let scopeMatch = true;
				if (currentMCPScope === 'installed') {
					scopeMatch = server.installed;
				} else if (currentMCPScope === 'available') {
					scopeMatch = !server.installed;
				}

				// Apply search filter
				let searchMatch = true;
				if (mcpSearchQuery) {
					searchMatch = server.name.toLowerCase().includes(mcpSearchQuery) ||
							  server.description.toLowerCase().includes(mcpSearchQuery) ||
							  (server.category && server.category.toLowerCase().includes(mcpSearchQuery));
				}

				return scopeMatch && searchMatch;
			});

			// Sort servers: for "All Servers" tab, installed first then alphabetically, otherwise just alphabetically
			if (currentMCPScope === 'all') {
				filteredServers.sort((a, b) => {
					// First sort by installation status (installed first)
					if (a.installed !== b.installed) {
						return b.installed - a.installed; // installed (true) comes before not installed (false)
					}
					// Then sort alphabetically by name
					return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
				});
			} else {
				// For installed/available tabs, just sort alphabetically
				filteredServers.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
			}

			// Update stats
			if (statsText) {
				statsText.textContent = \`\${filteredServers.length} server\${filteredServers.length !== 1 ? 's' : ''}\`;
			}

			if (filteredServers.length === 0) {
				serverList.style.display = 'none';
				emptyState.style.display = 'flex';
			} else {
				serverList.style.display = 'block';
				emptyState.style.display = 'none';
				serverList.innerHTML = filteredServers.map(server => createMCPServerCard(server)).join('');
			}
		}

		function createMCPServerCard(server) {
			const isInstalling = mcpInstallingServers.has(server.name);
			const statusClass = isInstalling ? 'installing' : (server.installed ? 'installed' : 'available');
			const statusText = isInstalling ? 'Installing...' : (server.installed ? 'Installed' : 'Available');

			return \`
				<div class="mcp-server-card \${statusClass}" data-server="\${server.name}">
					<div class="mcp-server-icon">\${server.icon}</div>
					<div class="mcp-server-details">
						<div class="mcp-server-header">
							<div class="mcp-server-name">\${server.name}</div>
							<div class="mcp-server-status \${statusClass}">\${statusText}</div>
						</div>
						<div class="mcp-server-description">\${server.description}</div>
						<div class="mcp-server-meta">
							<span>Type: \${server.type}</span>
							\${server.category ? \`<span>Category: \${server.category}</span>\` : ''}
							\${server.scope ? \`<span>Scope: \${server.scope}</span>\` : ''}
						</div>
						\${isInstalling ? '<div class="install-progress"><div class="install-progress-bar" style="width: 50%;"></div></div>' : ''}
					</div>
					<div class="mcp-server-actions">
						\${server.installed ?
							\`<button class="mcp-action-btn" onclick="testMCPServer('\${server.name}')">Test</button>
							 <button class="mcp-action-btn danger" onclick="uninstallMCPServer('\${server.name}')">Remove</button>\` :
							\`<div class="mcp-install-section">
								<div class="mcp-scope-selector">
									<label for="scope-\${server.name}">Scope:</label>
									<select id="scope-\${server.name}" class="mcp-scope-dropdown">
										<option value="local" \${server.defaultScope === 'local' ? 'selected' : ''}>Local</option>
										<option value="project" \${server.defaultScope === 'project' ? 'selected' : ''}>Project</option>
										<option value="user" \${server.defaultScope === 'user' ? 'selected' : ''}>User</option>
									</select>
								</div>
								<div class="mcp-install-buttons">
									<button class="mcp-action-btn primary" onclick="installMCPServer('\${server.name}')" \${isInstalling ? 'disabled' : ''}>Install</button>
									\${(server.type === 'http' || server.type === 'sse') ?
										\`<button class="mcp-action-btn secondary" onclick="installMCPServerWithKey('\${server.name}')" \${isInstalling ? 'disabled' : ''}>Add with Key</button>\` :
										''
									}
								</div>
							</div>\`
						}
					</div>
				</div>
			\`;
		}

		function installMCPServer(name) {
			const server = mcpServersData.find(s => s.name === name);
			if (!server) return;

			// Get selected scope from dropdown
			const scopeSelect = document.getElementById('scope-' + name);
			const selectedScope = scopeSelect ? scopeSelect.value : (server.defaultScope || 'local');

			mcpInstallingServers.add(name);
			displayFilteredMCPServers();

			vscode.postMessage({
				type: 'saveMCPServer',
				name: name,
				config: server.config,
				scope: selectedScope
			});
		}

		function installMCPServerWithKey(name) {
			const server = mcpServersData.find(s => s.name === name);
			if (!server) return;

			// Get selected scope from dropdown
			const scopeSelect = document.getElementById('scope-' + name);
			const selectedScope = scopeSelect ? scopeSelect.value : (server.defaultScope || 'local');

			// Show API key input modal
			showAPIKeyModal(name, server, selectedScope);
		}

		function uninstallMCPServer(name) {
			vscode.postMessage({
				type: 'deleteMCPServer',
				name: name
			});
		}

		function testMCPServer(name) {
			vscode.postMessage({
				type: 'testMCPServer',
				name: name
			});
		}

		function refreshMCPServers() {
			loadEnhancedMCPServers();
		}

		// Make MCP functions globally accessible for onclick handlers
		window.installMCPServer = installMCPServer;
		window.installMCPServerWithKey = installMCPServerWithKey;
		window.uninstallMCPServer = uninstallMCPServer;
		window.testMCPServer = testMCPServer;
		window.refreshMCPServers = refreshMCPServers;
		window.showCustomMCPForm = showCustomMCPForm;
		window.showAPIKeyModal = showAPIKeyModal;
		window.hideAPIKeyModal = hideAPIKeyModal;
		window.installMCPServerWithAPIKey = installMCPServerWithAPIKey;
		// Legacy function for backward compatibility
		window.deleteMCPServer = uninstallMCPServer;

		// Make folder mode functions globally accessible for onclick handlers
		window.switchToFileMode = switchToFileMode;
		window.switchToFolderMode = switchToFolderMode;
		window.navigateToRoot = navigateToRoot;
		window.navigateToPath = navigateToPath;

		// Context file management functions
		window.removeFromContext = removeFromContext;
		window.addSelectedFiles = addSelectedFiles;
		window.cancelFilePicker = cancelFilePicker;
		window.selectAllFiles = selectAllFiles;
		window.clearSelection = clearSelection;
		window.addRootFolder = addRootFolder;

		function showCustomMCPForm() {
			document.getElementById('mcpCustomModal').style.display = 'flex';
			clearCustomMCPForm();
		}

		function hideCustomMCPModal() {
			document.getElementById('mcpCustomModal').style.display = 'none';
		}

		function showAPIKeyModal(serverName, server, scope) {
			// Create API key modal overlay within the MCP modal if it doesn't exist
			if (!document.getElementById('mcpAPIKeyModal')) {
				const mcpModal = document.querySelector('.mcp-modal-content');
				if (!mcpModal) return;

				const overlay = document.createElement('div');
				overlay.id = 'mcpAPIKeyModal';
				overlay.className = 'mcp-api-key-overlay';
				overlay.innerHTML = \`
					<div class="mcp-api-key-modal">
						<div class="mcp-api-key-header">
							<h4>Add API Key for <span id="apiKeyServerName"></span></h4>
							<button class="mcp-modal-close" onclick="hideAPIKeyModal()">&times;</button>
						</div>
						<div class="mcp-api-key-body">
							<div class="form-group">
								<label for="apiKeyInput">API Key:</label>
								<input type="password" id="apiKeyInput" placeholder="Enter your API key" class="form-input">
								<small class="form-help">This key will be securely stored in your MCP configuration</small>
							</div>
							<div class="form-group">
								<label for="apiKeyName">Environment Variable Name:</label>
								<input type="text" id="apiKeyName" placeholder="e.g., API_KEY, OPENAI_API_KEY" class="form-input">
								<small class="form-help">The environment variable name to store the API key</small>
							</div>
						</div>
						<div class="mcp-api-key-footer">
							<button class="mcp-action-btn secondary" onclick="hideAPIKeyModal()">Cancel</button>
							<button class="mcp-action-btn primary" onclick="installMCPServerWithAPIKey()">Install with Key</button>
						</div>
					</div>
				\`;
				mcpModal.appendChild(overlay);
			}

			// Set current server info
			document.getElementById('apiKeyServerName').textContent = serverName;
			document.getElementById('apiKeyInput').value = '';

			// Set default API key name based on server
			const defaultKeyNames = {
				'openai': 'OPENAI_API_KEY',
				'anthropic': 'ANTHROPIC_API_KEY',
				'github': 'GITHUB_TOKEN',
				'notion': 'NOTION_API_KEY',
				'slack': 'SLACK_BOT_TOKEN',
				'gmail': 'GMAIL_API_KEY',
				'gdrive': 'GOOGLE_API_KEY',
				'brave-search': 'BRAVE_SEARCH_API_KEY',
				'alpaca': 'ALPACA_API_KEY',
				'context7': 'CONTEXT7_API_KEY',
				'everart': 'EVERART_API_KEY',
				'mongodb': 'MONGODB_URI',
				'postgres': 'DATABASE_URL',
				'sqlite': 'SQLITE_DB_PATH',
				'qdrant': 'QDRANT_API_KEY',
				'bigquery': 'GOOGLE_APPLICATION_CREDENTIALS',
				'aws-bedrock': 'AWS_ACCESS_KEY_ID'
			};
			document.getElementById('apiKeyName').value = defaultKeyNames[serverName] || 'API_KEY';

			// Store current context
			window.currentAPIKeyContext = { serverName, server, scope };

			// Show modal
			document.getElementById('mcpAPIKeyModal').style.display = 'flex';
		}

		function hideAPIKeyModal() {
			const modal = document.getElementById('mcpAPIKeyModal');
			if (modal) {
				modal.remove();
			}
			window.currentAPIKeyContext = null;
		}

		function installMCPServerWithAPIKey() {
			const context = window.currentAPIKeyContext;
			if (!context) return;

			const apiKey = document.getElementById('apiKeyInput').value.trim();
			const keyName = document.getElementById('apiKeyName').value.trim();

			if (!apiKey) {
				showNotification('Please enter an API key', 'error');
				return;
			}

			if (!keyName) {
				showNotification('Please enter an environment variable name', 'error');
				return;
			}

			// Clone the server config and add the API key
			const configWithKey = { ...context.server.config };
			if (!configWithKey.env) {
				configWithKey.env = {};
			}
			configWithKey.env[keyName] = apiKey;

			mcpInstallingServers.add(context.serverName);
			displayFilteredMCPServers();

			vscode.postMessage({
				type: 'saveMCPServer',
				name: context.serverName,
				config: configWithKey,
				scope: context.scope
			});

			hideAPIKeyModal();
		}

		function updateCustomServerForm() {
			const serverType = document.getElementById('customServerType').value;
			const commandGroup = document.getElementById('customCommandGroup');
			const urlGroup = document.getElementById('customUrlGroup');
			const argsGroup = document.getElementById('customArgsGroup');
			const envGroup = document.getElementById('customEnvGroup');
			const headersGroup = document.getElementById('customHeadersGroup');

			if (serverType === 'stdio') {
				commandGroup.style.display = 'block';
				urlGroup.style.display = 'none';
				argsGroup.style.display = 'block';
				envGroup.style.display = 'block';
				headersGroup.style.display = 'none';
			} else {
				commandGroup.style.display = 'none';
				urlGroup.style.display = 'block';
				argsGroup.style.display = 'none';
				envGroup.style.display = 'none';
				headersGroup.style.display = 'block';
			}
		}

		function clearCustomMCPForm() {
			document.getElementById('customServerName').value = '';
			document.getElementById('customServerScope').value = 'local';
			document.getElementById('customServerType').value = 'stdio';
			document.getElementById('customServerCommand').value = 'npx';
			document.getElementById('customServerUrl').value = '';
			document.getElementById('customServerArgs').value = '';
			document.getElementById('customServerEnv').value = '';
			document.getElementById('customServerHeaders').value = '';
			updateCustomServerForm();
		}

		function saveCustomMCPServer() {
			const name = document.getElementById('customServerName').value.trim();
			const scope = document.getElementById('customServerScope').value;
			const type = document.getElementById('customServerType').value;

			if (!name) {
				showNotification('Server name is required', 'error');
				return;
			}

			const serverConfig = { type };

			if (type === 'stdio') {
				const command = document.getElementById('customServerCommand').value.trim();
				if (!command) {
					showNotification('Command is required for stdio servers', 'error');
					return;
				}
				serverConfig.command = command;

				const argsText = document.getElementById('customServerArgs').value.trim();
				if (argsText) {
					serverConfig.args = argsText.split('\\n').filter(line => line.trim());
				}

				const envText = document.getElementById('customServerEnv').value.trim();
				if (envText) {
					serverConfig.env = {};
					envText.split('\\n').forEach(line => {
						const [key, ...valueParts] = line.split('=');
						if (key && valueParts.length > 0) {
							serverConfig.env[key.trim()] = valueParts.join('=').trim();
						}
					});
				}
			} else {
				const url = document.getElementById('customServerUrl').value.trim();
				if (!url) {
					showNotification('URL is required for HTTP/SSE servers', 'error');
					return;
				}
				serverConfig.url = url;

				const headersText = document.getElementById('customServerHeaders').value.trim();
				if (headersText) {
					serverConfig.headers = {};
					headersText.split('\\n').forEach(line => {
						const [key, ...valueParts] = line.split('=');
						if (key && valueParts.length > 0) {
							serverConfig.headers[key.trim()] = valueParts.join('=').trim();
						}
					});
				}
			}

			vscode.postMessage({
				type: 'saveMCPServer',
				name: name,
				config: serverConfig,
				scope: scope
			});

			hideCustomMCPModal();
		}

		function showMCPLoading(show) {
			const loading = document.getElementById('mcpLoading');
			const serverList = document.getElementById('mcpServerList');
			const emptyState = document.getElementById('mcpEmptyState');

			if (show) {
				loading.style.display = 'flex';
				serverList.style.display = 'none';
				emptyState.style.display = 'none';
			} else {
				loading.style.display = 'none';
			}
		}

		function showNotification(message, type = 'info') {
			const notification = document.createElement('div');
			notification.textContent = message;
			notification.style.cssText = \`
				position: fixed; top: 20px; right: 20px; z-index: 9999;
				padding: 12px 16px; border-radius: 6px; font-size: 13px;
				background: \${type === 'error' ? 'var(--vscode-inputValidation-errorBackground)' : 'var(--vscode-notificationToast-border)'};
				color: \${type === 'error' ? 'var(--vscode-inputValidation-errorForeground)' : 'var(--vscode-foreground)'};
				border: 1px solid \${type === 'error' ? 'var(--vscode-inputValidation-errorBorder)' : 'var(--vscode-notificationToast-border)'};
				box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			\`;
			document.body.appendChild(notification);
			setTimeout(() => notification.remove(), 3000);
		}

		function displayEnhancedMCPServers(data) {
			mcpServersData = data || [];
			showMCPLoading(false);
			displayFilteredMCPServers();
		}

		function createEnhancedMCPServerData(installedServers = {}) {
			// Define curated available servers with metadata
			const availableServers = [
				{
					name: 'context7',
					icon: '📚',
					description: 'Up-to-date code documentation for any library or framework',
					category: 'Documentation',
					type: 'http',
					config: { type: 'http', url: 'https://context7.liam.sh/mcp' },
					defaultScope: 'user'
				},
				{
					name: 'sequential-thinking',
					icon: '🔗',
					description: 'Step-by-step reasoning and problem-solving capabilities',
					category: 'AI Tools',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] },
					defaultScope: 'local'
				},
				{
					name: 'memory',
					icon: '🧠',
					description: 'Persistent knowledge graph storage and retrieval',
					category: 'Data Storage',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] },
					defaultScope: 'local'
				},
				{
					name: 'fetch',
					icon: '🌐',
					description: 'HTTP requests, web scraping, and content fetching',
					category: 'Web Tools',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] },
					defaultScope: 'local'
				},
				{
					name: 'filesystem',
					icon: '📁',
					description: 'Secure file operations and directory management',
					category: 'System Tools',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
					defaultScope: 'local'
				},
				{
					name: 'puppeteer',
					icon: '🎭',
					description: 'Browser automation and web page interaction',
					category: 'Automation',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'] },
					defaultScope: 'local'
				},
				{
					name: 'github',
					icon: '🐙',
					description: 'GitHub repository management and API integration',
					category: 'Development',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
					defaultScope: 'user'
				},
				{
					name: 'alpaca',
					icon: '📈',
					description: 'Stock trading and market data through Alpaca API',
					category: 'Finance',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-alpaca'] },
					defaultScope: 'user'
				},
				{
					name: 'mongodb',
					icon: '🍃',
					description: 'MongoDB database queries and collection analysis',
					category: 'Database',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-mongodb'] },
					defaultScope: 'project'
				},
				{
					name: 'qdrant',
					icon: '🔍',
					description: 'Vector search and similarity matching with Qdrant',
					category: 'AI/ML',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-qdrant'] },
					defaultScope: 'project'
				},
				{
					name: 'bigquery',
					icon: '🔢',
					description: 'Google BigQuery data warehouse queries and analysis',
					category: 'Database',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-bigquery'] },
					defaultScope: 'user'
				},
				{
					name: 'aws-bedrock',
					icon: '☁️',
					description: 'AWS Bedrock knowledge base retrieval and AI services',
					category: 'AI/ML',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-aws-bedrock'] },
					defaultScope: 'user'
				},
				{
					name: 'browserloop',
					icon: '📸',
					description: 'Take screenshots and monitor console logs of web pages',
					category: 'Automation',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', 'browserloop@latest'] },
					defaultScope: 'local'
				},
				{
					name: 'playwright',
					icon: '🎬',
					description: 'Advanced browser automation and web testing',
					category: 'Automation',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@executeautomation/playwright-mcp-server'] },
					defaultScope: 'local'
				},
				{
					name: 'git',
					icon: '🌳',
					description: 'Git repository management, commits, and version control',
					category: 'Development',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-git'] },
					defaultScope: 'project'
				},
				{
					name: 'slack',
					icon: '💬',
					description: 'Slack workspace integration and message management',
					category: 'Communication',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-slack'] },
					defaultScope: 'user'
				},
				{
					name: 'sqlite',
					icon: '🗃️',
					description: 'SQLite database queries and schema management',
					category: 'Database',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sqlite'] },
					defaultScope: 'project'
				},
				{
					name: 'postgres',
					icon: '🐘',
					description: 'PostgreSQL database operations and analytics',
					category: 'Database',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'] },
					defaultScope: 'project'
				},
				{
					name: 'gdrive',
					icon: '☁️',
					description: 'Google Drive file management and sharing',
					category: 'Cloud Storage',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-gdrive'] },
					defaultScope: 'user'
				},
				{
					name: 'gmail',
					icon: '📧',
					description: 'Gmail email management and automation',
					category: 'Communication',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-gmail'] },
					defaultScope: 'user'
				},
				{
					name: 'notion',
					icon: '📝',
					description: 'Notion workspace management and content creation',
					category: 'Productivity',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-notion'] },
					defaultScope: 'user'
				},
				{
					name: 'brave-search',
					icon: '🔍',
					description: 'Brave Search API for web search and results',
					category: 'Web Tools',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'] },
					defaultScope: 'user'
				},
				{
					name: 'everart',
					icon: '🎨',
					description: 'AI image generation and art creation tools',
					category: 'AI/ML',
					type: 'stdio',
					config: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-everart'] },
					defaultScope: 'user'
				}
			];

			// Mark servers as installed if they exist in the installed list
			const enhancedServers = availableServers.map(server => ({
				...server,
				installed: installedServers.hasOwnProperty(server.name),
				scope: installedServers[server.name]?.scope || server.defaultScope
			}));

			// Add any custom installed servers that aren't in our curated list
			for (const [name, config] of Object.entries(installedServers)) {
				if (!enhancedServers.find(s => s.name === name)) {
					enhancedServers.push({
						name,
						icon: '⚙️',
						description: 'Custom MCP server',
						category: 'Custom',
						type: config.type || 'stdio',
						config,
						installed: true,
						scope: config.scope || 'local',
						defaultScope: 'local'
					});
				}
			}

			return enhancedServers;
		}

		// Enhanced event listeners for MCP modals
		document.addEventListener('DOMContentLoaded', function() {
			const mcpModal = document.getElementById('mcpModal');
			const mcpCustomModal = document.getElementById('mcpCustomModal');

			if (mcpModal) {
				mcpModal.addEventListener('click', (e) => {
					if (e.target === mcpModal) {
						hideMCPModal();
					}
				});
			}

			if (mcpCustomModal) {
				mcpCustomModal.addEventListener('click', (e) => {
					if (e.target === mcpCustomModal) {
						hideCustomMCPModal();
					}
				});
			}
		});

		// Model selector functions
		let currentModel = 'opus'; // Default model

		function showModelSelector() {
			document.getElementById('modelModal').style.display = 'flex';
			// Select the current model radio button
			const radioButton = document.getElementById('model-' + currentModel);
			if (radioButton) {
				radioButton.checked = true;
			}
		}

		function hideModelModal() {
			document.getElementById('modelModal').style.display = 'none';
		}

		// Slash commands modal functions
		function showSlashCommandsModal() {
			document.getElementById('slashCommandsModal').style.display = 'flex';
			// Auto-focus the search input
			setTimeout(() => {
				document.getElementById('slashCommandsSearch').focus();
			}, 100);
		}

		function hideSlashCommandsModal() {
			document.getElementById('slashCommandsModal').style.display = 'none';
		}

		// Thinking intensity modal functions
		function showThinkingIntensityModal() {
			// Request current settings from VS Code first
			vscode.postMessage({
				type: 'getSettings'
			});
			document.getElementById('thinkingIntensityModal').style.display = 'flex';
		}

		function hideThinkingIntensityModal() {
			document.getElementById('thinkingIntensityModal').style.display = 'none';
		}

		function saveThinkingIntensity() {
			const thinkingSlider = document.getElementById('thinkingIntensitySlider');
			const intensityValues = ['think', 'think-hard', 'think-harder', 'ultrathink'];
			const thinkingIntensity = intensityValues[thinkingSlider.value] || 'think';
			
			// Send settings to VS Code
			vscode.postMessage({
				type: 'updateSettings',
				settings: {
					'thinking.intensity': thinkingIntensity
				}
			});
		}

		function updateThinkingModeToggleName(intensityValue) {
			const intensityNames = ['Thinking', 'Think Hard', 'Think Harder', 'Ultrathink'];
			const modeName = intensityNames[intensityValue] || 'Thinking';
			const toggleLabel = document.getElementById('thinkingModeLabel');
			if (toggleLabel) {
				toggleLabel.textContent = modeName + ' Mode';
			}
		}

		function updateThinkingIntensityDisplay(value) {
			// Update label highlighting for thinking intensity modal
			for (let i = 0; i < 4; i++) {
				const label = document.getElementById('thinking-label-' + i);
				if (i == value) {
					label.classList.add('active');
				} else {
					label.classList.remove('active');
				}
			}
			
			// Don't update toggle name until user confirms
		}

		function setThinkingIntensityValue(value) {
			// Set slider value for thinking intensity modal
			document.getElementById('thinkingIntensitySlider').value = value;
			
			// Update visual state
			updateThinkingIntensityDisplay(value);
		}

		function confirmThinkingIntensity() {
			// Get the current slider value
			const currentValue = document.getElementById('thinkingIntensitySlider').value;
			
			// Update the toggle name with confirmed selection
			updateThinkingModeToggleName(currentValue);
			
			// Save the current intensity setting
			saveThinkingIntensity();
			
			// Close the modal
			hideThinkingIntensityModal();
		}

		// WSL Alert functions
		function showWSLAlert() {
			const alert = document.getElementById('wslAlert');
			if (alert) {
				alert.style.display = 'block';
			}
		}

		function dismissWSLAlert() {
			const alert = document.getElementById('wslAlert');
			if (alert) {
				alert.style.display = 'none';
			}
			// Send dismiss message to extension to store in globalState
			vscode.postMessage({
				type: 'dismissWSLAlert'
			});
		}

		function openWSLSettings() {
			// Dismiss the alert
			dismissWSLAlert();
			
			// Open settings modal
			toggleSettings();
		}

		function executeSlashCommand(command) {
			// Hide the modal
			hideSlashCommandsModal();
			
			// Clear the input since user selected a command
			messageInput.value = '';
			
			// Send command to VS Code to execute in terminal
			vscode.postMessage({
				type: 'executeSlashCommand',
				command: command
			});
			
			// Show user feedback
			addMessage('user', \`Executing /\${command} command in terminal. Check the terminal output and return when ready.\`, 'assistant');
		}

		function handleCustomCommandKeydown(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				const customCommand = event.target.value.trim();
				if (customCommand) {
					executeSlashCommand(customCommand);
					// Clear the input for next use
					event.target.value = '';
				}
			}
		}

		// Store custom snippets data globally
		let customSnippetsData = {};

		function usePromptSnippet(snippetType) {
			const builtInSnippets = {
				'performance-analysis': 'Analyze this code for performance issues and suggest optimizations',
				'security-review': 'Review this code for security vulnerabilities',
				'implementation-review': 'Review the implementation in this code',
				'code-explanation': 'Explain how this code works in detail',
				'bug-fix': 'Help me fix this bug in my code',
				'refactor': 'Refactor this code to improve readability and maintainability',
				'test-generation': 'Generate comprehensive tests for this code',
				'documentation': 'Generate documentation for this code'
			};
			
			// Check built-in snippets first
			let promptText = builtInSnippets[snippetType];
			
			// If not found in built-in, check custom snippets
			if (!promptText && customSnippetsData[snippetType]) {
				promptText = customSnippetsData[snippetType].prompt;
			}
			
			if (promptText) {
				// Hide the modal
				hideSlashCommandsModal();
				
				// Insert the prompt into the message input
				messageInput.value = promptText;
				messageInput.focus();
				
				// Auto-resize the textarea
				autoResizeTextarea();
			}
		}

		function showAddSnippetForm() {
			document.getElementById('addSnippetForm').style.display = 'block';
			document.getElementById('snippetName').focus();
		}

		function hideAddSnippetForm() {
			document.getElementById('addSnippetForm').style.display = 'none';
			// Clear form fields
			document.getElementById('snippetName').value = '';
			document.getElementById('snippetPrompt').value = '';
		}

		function saveCustomSnippet() {
			const name = document.getElementById('snippetName').value.trim();
			const prompt = document.getElementById('snippetPrompt').value.trim();
			
			if (!name || !prompt) {
				alert('Please fill in both name and prompt text.');
				return;
			}
			
			// Generate a unique ID for the snippet
			const snippetId = 'custom-' + Date.now();
			
			// Save the snippet using VS Code global storage
			const snippetData = {
				name: name,
				prompt: prompt,
				id: snippetId
			};
			
			vscode.postMessage({
				type: 'saveCustomSnippet',
				snippet: snippetData
			});
			
			// Hide the form
			hideAddSnippetForm();
		}

		function loadCustomSnippets(snippetsData = {}) {
			const snippetsList = document.getElementById('promptSnippetsList');
			
			// Remove existing custom snippets
			const existingCustom = snippetsList.querySelectorAll('.custom-snippet-item');
			existingCustom.forEach(item => item.remove());
			
			// Add custom snippets after the add button and form
			const addForm = document.getElementById('addSnippetForm');
			
			Object.values(snippetsData).forEach(snippet => {
				const snippetElement = document.createElement('div');
				snippetElement.className = 'slash-command-item prompt-snippet-item custom-snippet-item';
				snippetElement.onclick = () => usePromptSnippet(snippet.id);
				
				snippetElement.innerHTML = \`
					<div class="slash-command-icon">📝</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/\${snippet.name}</div>
						<div class="slash-command-description">\${snippet.prompt}</div>
					</div>
					<div class="snippet-actions">
						<button class="snippet-delete-btn" onclick="event.stopPropagation(); deleteCustomSnippet('\${snippet.id}')" title="Delete snippet">🗑️</button>
					</div>
				\`;
				
				// Insert after the form
				addForm.parentNode.insertBefore(snippetElement, addForm.nextSibling);
			});
		}

		function deleteCustomSnippet(snippetId) {
			vscode.postMessage({
				type: 'deleteCustomSnippet',
				snippetId: snippetId
			});
		}

		function filterSlashCommands() {
			const searchTerm = document.getElementById('slashCommandsSearch').value.toLowerCase();
			const allItems = document.querySelectorAll('.slash-command-item');
			
			allItems.forEach(item => {
				const title = item.querySelector('.slash-command-title').textContent.toLowerCase();
				const description = item.querySelector('.slash-command-description').textContent.toLowerCase();
				
				if (title.includes(searchTerm) || description.includes(searchTerm)) {
					item.style.display = 'flex';
				} else {
					item.style.display = 'none';
				}
			});
		}

		function openModelTerminal() {
			vscode.postMessage({
				type: 'openModelTerminal'
			});
			hideModelModal();
		}

		function toggleModelDropdown() {
			const dropdown = document.getElementById('modelDropdown');
			const isVisible = dropdown.style.display === 'block';

			// Close all other dropdowns first
			const allDropdowns = document.querySelectorAll('.model-dropdown');
			allDropdowns.forEach(d => d.style.display = 'none');

			// Toggle this dropdown
			dropdown.style.display = isVisible ? 'none' : 'block';
		}

		function selectModelFromDropdown(model) {
			selectModel(model);
			// Close the dropdown
			document.getElementById('modelDropdown').style.display = 'none';
		}

		function selectModel(model, fromBackend = false) {
			currentModel = model;

			// Update the displayed text
			const displayNames = {
				'opus': 'Opus',
				'sonnet': 'Sonnet',
				'sonnet1m': 'Sonnet 1M',
				'default': 'Default'
			};

			const selectedText = document.getElementById('selectedModelText');
			if (selectedText) {
				selectedText.textContent = displayNames[model] || model;
			}

			// Update selected state in dropdown options
			const options = document.querySelectorAll('.model-option');
			options.forEach(option => {
				option.classList.remove('selected');
				if (option.dataset.value === model) {
					option.classList.add('selected');
				}
			});
			
			// Only send model selection to VS Code extension if not from backend
			if (!fromBackend) {
				vscode.postMessage({
					type: 'selectModel',
					model: model
				});
				
				// Save preference
				localStorage.setItem('selectedModel', model);
			}
			
			// Update radio button if modal is open
			const radioButton = document.getElementById('model-' + model);
			if (radioButton) {
				radioButton.checked = true;
			}
			
			hideModelModal();
		}

		// Initialize model dropdown without sending message
		currentModel = 'opus';
		selectModel(currentModel, true);

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			const modelWrapper = document.querySelector('.model-selector-wrapper');
			if (modelWrapper && !modelWrapper.contains(e.target)) {
				document.getElementById('modelDropdown').style.display = 'none';
			}
		});

		// Close model modal when clicking outside
		document.getElementById('modelModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('modelModal')) {
				hideModelModal();
			}
		});

		// Stop button functions
		function showStopButton() {
			document.getElementById('stopBtn').style.display = 'flex';
		}

		function hideStopButton() {
			document.getElementById('stopBtn').style.display = 'none';
		}

		function stopRequest() {
			sendStats('Stop request');
			
			vscode.postMessage({
				type: 'stopRequest'
			});
			hideStopButton();
		}

		// Disable/enable buttons during processing
		function disableButtons() {
			const sendBtn = document.getElementById('sendBtn');
			if (sendBtn) sendBtn.disabled = true;
		}

		function enableButtons() {
			const sendBtn = document.getElementById('sendBtn');
			if (sendBtn) sendBtn.disabled = false;
		}

		// Copy message content function
		function copyMessageContent(messageDiv) {
			const contentDiv = messageDiv.querySelector('.message-content');
			if (contentDiv) {
				// Get text content, preserving line breaks
				const text = contentDiv.innerText || contentDiv.textContent;
				
				// Copy to clipboard
				navigator.clipboard.writeText(text).then(() => {
					// Show brief feedback
					const copyBtn = messageDiv.querySelector('.copy-btn');
					const originalHtml = copyBtn.innerHTML;
					copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
					copyBtn.style.color = '#4caf50';
					
					setTimeout(() => {
						copyBtn.innerHTML = originalHtml;
						copyBtn.style.color = '';
					}, 1000);
				}).catch(err => {
					console.error('Failed to copy message:', err);
				});
			}
		}
		
		function copyCodeBlock(codeId) {
			const codeElement = document.getElementById(codeId);
			if (codeElement) {
				const rawCode = codeElement.getAttribute('data-raw-code');
				if (rawCode) {
					// Decode HTML entities
					const decodedCode = rawCode.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
					navigator.clipboard.writeText(decodedCode).then(() => {
						// Show temporary feedback
						const copyBtn = codeElement.closest('.code-block-container').querySelector('.code-copy-btn');
						if (copyBtn) {
							const originalInnerHTML = copyBtn.innerHTML;
							copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
							copyBtn.style.color = '#4caf50';
							setTimeout(() => {
								copyBtn.innerHTML = originalInnerHTML;
								copyBtn.style.color = '';
							}, 1000);
						}
					}).catch(err => {
						console.error('Failed to copy code:', err);
					});
				}
			}
		}

		window.addEventListener('message', event => {
			const message = event.data;
			
			switch (message.type) {
				case 'ready':
					addMessage(message.data, 'system');
					updateStatusWithTotals();
					break;
					
				case 'restoreInputText':
					const inputField = document.getElementById('messageInput');
					if (inputField && message.data) {
						inputField.value = message.data;
						// Auto-resize the textarea
						inputField.style.height = 'auto';
						inputField.style.height = Math.min(inputField.scrollHeight, 200) + 'px';
					}
					break;
					
				case 'output':
					if (message.data.trim()) {
						let displayData = message.data;
						
						// Check if this is a usage limit message with Unix timestamp
						const usageLimitMatch = displayData.match(/Claude AI usage limit reached\\|(\\d+)/);
						if (usageLimitMatch) {
							const timestamp = parseInt(usageLimitMatch[1]);
							const date = new Date(timestamp * 1000);
							const readableDate = date.toLocaleString(
								undefined,
								{
									weekday: 'short',
									month: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									second: '2-digit',
									hour12: true,
									timeZoneName: 'short',
									year: 'numeric'
								}
							);
							displayData = displayData.replace(usageLimitMatch[0], \`Claude AI usage limit reached: \${readableDate}\`);
						}
						
						addMessage(parseSimpleMarkdown(displayData), 'claude');
					}
					updateStatusWithTotals();
					break;
					
				case 'userInput':
					if (message.data.trim()) {
						addMessage(message.data, 'user');
					}
					break;
					
				case 'loading':
					addMessage(message.data, 'system');
					updateStatusWithTotals();
					break;
					
				case 'setProcessing':
					isProcessing = message.data.isProcessing;
					if (isProcessing) {
						startRequestTimer(message.data.requestStartTime);
						showStopButton();
						disableButtons();
					} else {
						stopRequestTimer();
						hideStopButton();
						enableButtons();
					}
					updateStatusWithTotals();
					break;
					
				case 'clearLoading':
					// Remove the last loading message
					const messages = messagesDiv.children;
					if (messages.length > 0) {
						const lastMessage = messages[messages.length - 1];
						if (lastMessage.classList.contains('system')) {
							lastMessage.remove();
						}
					}
					updateStatusWithTotals();
					break;

				case 'immediateStop':
					// Clear any pending message updates
					hideStopButton();
					enableButtons();
					// Stop any ongoing typing animations or partial message display
					break;

				case 'stopStreaming':
					// Stop any ongoing streaming message display
					// Clear any partially rendered messages
					break;
					
				case 'error':
					if (message.data.trim()) {
						// Check if this is an install required error
						if (message.data.includes('Install claude code first') || 
							message.data.includes('command not found') ||
							message.data.includes('ENOENT')) {
							sendStats('Install required');
						}
						addMessage(message.data, 'error');
					}
					updateStatusWithTotals();
					break;
					
				case 'toolUse':
					if (typeof message.data === 'object') {
						addToolUseMessage(message.data);
					} else if (message.data.trim()) {
						addMessage(message.data, 'tool');
					}
					break;
					
				case 'toolResult':
							addToolResultMessage(message.data);
					break;
					
				case 'thinking':
					if (message.data.trim()) {
						addMessage('💭 Thinking...' + parseSimpleMarkdown(message.data), 'thinking');
					}
					break;
					
				case 'sessionInfo':
					if (message.data.sessionId) {
						showSessionInfo(message.data.sessionId);
						// Show detailed session information
						const sessionDetails = [
							\`🆔 Session ID: \${message.data.sessionId}\`,
							\`🔧 Tools Available: \${message.data.tools.length}\`,
							\`🖥️ MCP Servers: \${message.data.mcpServers ? message.data.mcpServers.length : 0}\`
						];
						//addMessage(sessionDetails.join('\\n'), 'system');
					}
					break;
					
				case 'imagePath':
					// Handle image file path response - add to context as chip
					// The backend sends 'path' directly, not 'data.filePath'
					if (message.path) {
						const imagePath = message.path;
						const imageName = imagePath.split('/').pop() || imagePath.split('\\\\').pop() || 'image';

						// Add to context with image icon
						addToContext({
							path: imagePath,
							name: imageName,
							type: 'image',
							icon: '🖼️'
						});

						// Focus back on textarea
						messageInput.focus();
					}
					break;
					
				case 'updateTokens':
					// Update token totals in real-time
					totalTokensInput = message.data.totalTokensInput || 0;
					totalTokensOutput = message.data.totalTokensOutput || 0;
					
					// Update status bar immediately
					updateStatusWithTotals();
					
					// Show detailed token breakdown for current message
					const currentTotal = (message.data.currentInputTokens || 0) + (message.data.currentOutputTokens || 0);
					if (currentTotal > 0) {
						let tokenBreakdown = \`📊 Tokens: \${currentTotal.toLocaleString()}\`;
						
						if (message.data.cacheCreationTokens || message.data.cacheReadTokens) {
							const cacheInfo = [];
							if (message.data.cacheCreationTokens) cacheInfo.push(\`\${message.data.cacheCreationTokens.toLocaleString()} cache created\`);
							if (message.data.cacheReadTokens) cacheInfo.push(\`\${message.data.cacheReadTokens.toLocaleString()} cache read\`);
							tokenBreakdown += \` • \${cacheInfo.join(' • ')}\`;
						}
						
						addMessage(tokenBreakdown, 'system');
					}
					break;
					
				case 'updateTotals':
					// Update local tracking variables
					totalCost = message.data.totalCost || 0;
					totalTokensInput = message.data.totalTokensInput || 0;
					totalTokensOutput = message.data.totalTokensOutput || 0;
					requestCount = message.data.requestCount || 0;
					
					// Update status bar with new totals
					updateStatusWithTotals();
					
					// Show current request info if available
					if (message.data.currentCost || message.data.currentDuration) {
						const currentCostStr = message.data.currentCost ? \`$\${message.data.currentCost.toFixed(4)}\` : 'N/A';
						const currentDurationStr = message.data.currentDuration ? \`\${message.data.currentDuration}ms\` : 'N/A';
						addMessage(\`Request completed - Cost: \${currentCostStr}, Duration: \${currentDurationStr}\`, 'system');
					}
					break;
					
				case 'sessionResumed':
					console.log('Session resumed:', message.data);
					showSessionInfo(message.data.sessionId);
					addMessage(\`📝 Resumed previous session\\n🆔 Session ID: \${message.data.sessionId}\\n💡 Your conversation history is preserved\`, 'system');
					// Clear todo display
						break;

				case 'sessionCleared':
					console.log('Session cleared');
					// Clear all messages from UI
					messagesDiv.innerHTML = '';
					hideSessionInfo();
					addMessage('🆕 Started new session', 'system');
					// Reset totals
					totalCost = 0;
					totalTokensInput = 0;
					totalTokensOutput = 0;
					requestCount = 0;
					updateStatusWithTotals();
					// Clear todo display
						break;
					
				case 'loginRequired':
					sendStats('Login required');
					addMessage('🔐 Login Required\\n\\nYour Claude API key is invalid or expired.\\nA terminal has been opened - please run the login process there.\\n\\nAfter logging in, come back to this chat to continue.', 'error');
					updateStatus('Login Required', 'error');
					break;
					
				case 'showRestoreOption':
					showRestoreContainer(message.data);
					break;
					
				case 'restoreProgress':
					addMessage('🔄 ' + message.data, 'system');
					break;
					
				case 'restoreSuccess':
					//hideRestoreContainer(message.data.commitSha);
					addMessage('✅ ' + message.data.message, 'system');
					break;
					
				case 'restoreError':
					addMessage('❌ ' + message.data, 'error');
					break;
					
				case 'workspaceFiles':
					filteredFiles = message.data;
					selectedFileIndex = -1;
					renderFileList();
					break;

				case 'workspaceFolders':
					filteredFolders = message.data;
					currentFolderPath = message.currentPath || '';
					selectedFileIndex = -1;
					renderFileList();
					updateBreadcrumb();
					break;

					
				case 'conversationList':
					displayConversationList(message.data);
					break;
				case 'checkpointList':
					displayCheckpoints(message.data);
					break;
				case 'clipboardText':
					handleClipboardText(message.data);
					break;
				case 'modelSelected':
					// Update the UI with the current model
					currentModel = message.model;
					selectModel(message.model, true);
					break;
				case 'terminalOpened':
					// Display notification about checking the terminal
					addMessage(message.data, 'system');
					break;
				case 'permissionRequest':
					addPermissionRequestMessage(message.data);
					break;
				case 'mcpServers':
					// Convert to enhanced format with combined data
					const enhancedServers = createEnhancedMCPServerData(message.data);
					displayEnhancedMCPServers(enhancedServers);
					break;
				case 'mcpServerSaved':
					mcpInstallingServers.delete(message.data.name);
					loadEnhancedMCPServers();
					showNotification('MCP server "' + message.data.name + '" installed successfully', 'success');
					break;
				case 'mcpServerDeleted':
					loadEnhancedMCPServers();
					showNotification('MCP server "' + message.data.name + '" removed successfully', 'success');
					break;
				case 'mcpServerTested':
					const statusMessage = message.data.status === 'success' ?
						'✅ MCP server "' + message.data.name + '" is working correctly' :
						'❌ MCP server "' + message.data.name + '" test failed: ' + message.data.message;
					addMessage(statusMessage, message.data.status === 'success' ? 'system' : 'error');
					break;
				case 'mcpServerError':
					mcpInstallingServers.delete(message.data.name || 'unknown');
					showNotification('Error with MCP server: ' + message.data.error, 'error');
					break;
				case 'agentsList':
					agentsData = message.agents || [];
					displayAgents();
					break;
				case 'agentDetails':
					if (message.agent && currentEditingAgent) {
						document.getElementById('agentFormTitle').textContent = 'Edit Agent';
						document.getElementById('agentName').value = message.agent.metadata.name;
						document.getElementById('agentDescription').value = message.agent.metadata.description;
						document.getElementById('agentScope').value = message.agent.scope;
						document.getElementById('agentModel').value = message.agent.metadata.model || '';
						document.getElementById('agentColor').value = message.agent.metadata.color || '';
						document.getElementById('agentSystemPrompt').value = message.agent.systemPrompt;
						document.getElementById('agentFormModal').style.display = 'flex';
					}
					break;
				case 'agentCreated':
					hideAgentFormModal();
					loadAgents();
					showNotification('Agent created successfully', 'success');
					break;
				case 'agentUpdated':
					hideAgentFormModal();
					loadAgents();
					showNotification('Agent updated successfully', 'success');
					break;
				case 'agentDeleted':
					loadAgents();
					showNotification('Agent deleted successfully', 'success');
					break;
				case 'agentCloned':
					loadAgents();
					showNotification('Agent cloned successfully', 'success');
					break;
				case 'agentExported':
					if (message.success) {
						showNotification('Agent exported successfully', 'success');
					}
					break;
				case 'agentImported':
					loadAgents();
					showNotification('Agent imported successfully', 'success');
					break;
				case 'agentGenerationStarted':
					showNotification('Generating agent with AI... Please wait for the response in chat', 'info');
					break;
				case 'agentsSearchResults':
					agentsData = message.agents || [];
					displayAgents();
					break;
				case 'agentError':
					showNotification(message.error || 'Agent operation failed', 'error');
					// Reset the generate button if it was generating
					const generateBtn = document.querySelector('#aiGenerateModal button.primary');
					if (generateBtn && generateBtn.disabled) {
						generateBtn.disabled = false;
						generateBtn.textContent = 'Generate Agent';
					}
					break;
				case 'agentGenerated':
					// Reset the generate button
					const genBtn = document.querySelector('#aiGenerateModal button.primary');
					if (genBtn) {
						genBtn.disabled = false;
						genBtn.textContent = 'Generate Agent';
					}

					// Automatically populate the form with generated agent
					if (message.agent) {
						// Hide the AI generation modal first
						hideAIGenerateModal();

						// Now show the edit form with the generated agent
						document.getElementById('agentFormTitle').textContent = 'Save Generated Agent';
						document.getElementById('agentName').value = message.agent.metadata.name || '';
						document.getElementById('agentDescription').value = message.agent.metadata.description || '';
						document.getElementById('agentScope').value = message.agent.scope || 'user';
						document.getElementById('agentModel').value = message.agent.metadata.model || '';
						document.getElementById('agentColor').value = message.agent.metadata.color || '';
						document.getElementById('agentSystemPrompt').value = message.agent.systemPrompt || '';
						document.getElementById('agentFormModal').style.display = 'flex';

						showNotification('Agent generated! Review and save it.', 'success');
					}
					break;
			}
		});
		
		// Permission request functions
		function addPermissionRequestMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			const messageDiv = document.createElement('div');
			messageDiv.className = 'message permission-request';
			
			const toolName = data.tool || 'Unknown Tool';
			
			// Create always allow button text with command styling for Bash
			let alwaysAllowText = \`Always allow \${toolName}\`;
			let alwaysAllowTooltip = '';
			if (toolName === 'Bash' && data.pattern) {
				const pattern = data.pattern;
				// Remove the asterisk for display - show "npm i" instead of "npm i *"
				const displayPattern = pattern.replace(' *', '');
				const truncatedPattern = displayPattern.length > 30 ? displayPattern.substring(0, 30) + '...' : displayPattern;
				alwaysAllowText = \`Always allow <code>\${truncatedPattern}</code>\`;
				alwaysAllowTooltip = displayPattern.length > 30 ? \`title="\${displayPattern}"\` : '';
			}
			
			messageDiv.innerHTML = \`
				<div class="permission-header">
					<span class="icon">🔐</span>
					<span>Permission Required</span>
					<div class="permission-menu">
						<button class="permission-menu-btn" onclick="togglePermissionMenu('\${data.id}')" title="More options">⋮</button>
						<div class="permission-menu-dropdown" id="permissionMenu-\${data.id}" style="display: none;">
							<button class="permission-menu-item" onclick="enableYoloMode('\${data.id}')">
								<span class="menu-icon">⚡</span>
								<div class="menu-content">
									<span class="menu-title">Enable YOLO Mode</span>
									<span class="menu-subtitle">Auto-allow all permissions</span>
								</div>
							</button>
						</div>
					</div>
				</div>
				<div class="permission-content">
					<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
					<div class="permission-buttons">
						<button class="btn deny" onclick="respondToPermission('\${data.id}', false)">Deny</button>
						<button class="btn always-allow" onclick="respondToPermission('\${data.id}', true, true)" \${alwaysAllowTooltip}>\${alwaysAllowText}</button>
						<button class="btn allow" onclick="respondToPermission('\${data.id}', true)">Allow</button>
					</div>
				</div>
			\`;
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}
		
		function respondToPermission(id, approved, alwaysAllow = false) {
			// Send response back to extension
			vscode.postMessage({
				type: 'permissionResponse',
				id: id,
				approved: approved,
				alwaysAllow: alwaysAllow
			});
			
			// Update the UI to show the decision
			const permissionMsg = document.querySelector(\`.permission-request:has([onclick*="\${id}"])\`);
			if (permissionMsg) {
				const buttons = permissionMsg.querySelector('.permission-buttons');
				const permissionContent = permissionMsg.querySelector('.permission-content');
				let decision = approved ? 'You allowed this' : 'You denied this';
				
				if (alwaysAllow && approved) {
					decision = 'You allowed this and set it to always allow';
				}
				
				const emoji = approved ? '✅' : '❌';
				const decisionClass = approved ? 'allowed' : 'denied';
				
				// Hide buttons
				buttons.style.display = 'none';
				
				// Add decision div to permission-content
				const decisionDiv = document.createElement('div');
				decisionDiv.className = \`permission-decision \${decisionClass}\`;
				decisionDiv.innerHTML = \`\${emoji} \${decision}\`;
				permissionContent.appendChild(decisionDiv);
				
				permissionMsg.classList.add('permission-decided', decisionClass);
			}
		}

		function togglePermissionMenu(permissionId) {
			const menu = document.getElementById(\`permissionMenu-\${permissionId}\`);
			const isVisible = menu.style.display !== 'none';
			
			// Close all other permission menus
			document.querySelectorAll('.permission-menu-dropdown').forEach(dropdown => {
				dropdown.style.display = 'none';
			});
			
			// Toggle this menu
			menu.style.display = isVisible ? 'none' : 'block';
		}

		function enableYoloMode(permissionId) {
			sendStats('YOLO mode enabled');
			
			// Hide the menu
			document.getElementById(\`permissionMenu-\${permissionId}\`).style.display = 'none';
			
			// Send message to enable YOLO mode
			vscode.postMessage({
				type: 'enableYoloMode'
			});
			
			// Auto-approve this permission
			respondToPermission(permissionId, true);
			
			// Show notification
			addMessage('⚡ YOLO Mode enabled! All future permissions will be automatically allowed.', 'system');
		}

		// Close permission menus when clicking outside
		document.addEventListener('click', function(event) {
			if (!event.target.closest('.permission-menu')) {
				document.querySelectorAll('.permission-menu-dropdown').forEach(dropdown => {
					dropdown.style.display = 'none';
				});
			}
		});

		// Handle clicks on clickable file paths
		document.addEventListener('click', function(event) {
			const filePathElement = event.target.closest('.clickable-file-path');
			if (filePathElement) {
				const filePath = filePathElement.getAttribute('data-file-path');
				const lineNumber = filePathElement.getAttribute('data-line-number');

				if (filePath) {
					openFileInEditor(filePath, lineNumber ? parseInt(lineNumber, 10) : undefined);
				}
			}
		});

		// Handle clicks on checkpoint restore buttons
		document.addEventListener('click', function(event) {
			const restoreBtn = event.target.closest('.checkpoint-restore-btn');
			if (restoreBtn) {
				const commitSha = restoreBtn.getAttribute('data-sha');
				if (commitSha) {
					restoreCheckpoint(commitSha);
				}
			}
		});

		// Session management functions
		function newSession() {
			sendStats('New chat');
			
			vscode.postMessage({
				type: 'newSession'
			});
		}

		function restoreToCommit(commitSha) {
			console.log('Restore button clicked for commit:', commitSha);
			vscode.postMessage({
				type: 'restoreCommit',
				commitSha: commitSha
			});
		}

		// Checkpoint Panel Functions
		function toggleCheckpointPanel() {
			const panel = document.getElementById('checkpointPanel');
			if (panel.classList.contains('hidden')) {
				panel.classList.remove('hidden');
				loadCheckpoints();
			} else {
				panel.classList.add('hidden');
			}
		}

		function closeCheckpointPanel() {
			const panel = document.getElementById('checkpointPanel');
			panel.classList.add('hidden');
		}

		function loadCheckpoints() {
			vscode.postMessage({
				type: 'getCheckpoints'
			});
		}

		function refreshCheckpoints() {
			loadCheckpoints();
		}

		function displayCheckpoints(checkpoints) {
			const checkpointList = document.getElementById('checkpointList');

			if (checkpoints.length === 0) {
				checkpointList.innerHTML = '<div class="checkpoint-empty">No checkpoints available yet. Checkpoints are created automatically when you send messages.</div>';
				return;
			}

			checkpointList.innerHTML = '';
			checkpoints.forEach(checkpoint => {
				const item = createCheckpointItem(checkpoint);
				checkpointList.appendChild(item);
			});
		}

		function createCheckpointItem(checkpoint) {
			const item = document.createElement('div');
			item.className = 'checkpoint-item';
			item.dataset.sha = checkpoint.sha;

			const timeAgo = getTimeAgo(new Date(checkpoint.timestamp));
			const shortSha = checkpoint.sha ? checkpoint.sha.substring(0, 8) : 'unknown';
			const messagePreview = checkpoint.message.length > 60
				? checkpoint.message.substring(0, 60) + '...'
				: checkpoint.message;

			item.innerHTML = \`
				<div class="checkpoint-time">\${timeAgo}</div>
				<div class="checkpoint-message">\${escapeHtml(messagePreview)}</div>
				<div class="checkpoint-actions">
					<span class="checkpoint-sha">\${shortSha}</span>
					<button class="checkpoint-restore-btn" data-sha="\${checkpoint.sha}">
						Restore
					</button>
				</div>
			\`;

			return item;
		}

		function restoreCheckpoint(sha) {
			vscode.postMessage({
				type: 'restoreCommit',
				commitSha: sha
			});
			closeCheckpointPanel();
		}

		function getTimeAgo(date) {
			const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

			if (seconds < 60) return \`\${seconds}s ago\`;
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return \`\${minutes}m ago\`;
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return \`\${hours}h ago\`;
			const days = Math.floor(hours / 24);
			return \`\${days}d ago\`;
		}

		function escapeHtml(text) {
			const map = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#039;'
			};
			return text.replace(/[&<>"']/g, m => map[m]);
		}

		function showRestoreContainer(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const restoreContainer = document.createElement('div');
			restoreContainer.className = 'restore-container';
			restoreContainer.id = \`restore-\${data.sha}\`;
			
			const timeAgo = new Date(data.timestamp).toLocaleTimeString();
			const shortSha = data.sha ? data.sha.substring(0, 8) : 'unknown';
			
			restoreContainer.innerHTML = \`
				<button class="restore-btn dark" onclick="restoreToCommit('\${data.sha}')">
					Restore checkpoint
				</button>
				<span class="restore-date">\${timeAgo}</span>
			\`;
			
			messagesDiv.appendChild(restoreContainer);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function hideRestoreContainer(commitSha) {
			const container = document.getElementById(\`restore-\${commitSha}\`);
			if (container) {
				container.remove();
			}
		}
		
		function showSessionInfo(sessionId) {
			// const sessionInfo = document.getElementById('sessionInfo');
			// const sessionIdSpan = document.getElementById('sessionId');
			const sessionStatus = document.getElementById('sessionStatus');
			const newSessionBtn = document.getElementById('newSessionBtn');
			const historyBtn = document.getElementById('historyBtn');
			
			if (sessionStatus && newSessionBtn) {
				// sessionIdSpan.textContent = sessionId.substring(0, 8);
				// sessionIdSpan.title = \`Full session ID: \${sessionId} (click to copy)\`;
				// sessionIdSpan.style.cursor = 'pointer';
				// sessionIdSpan.onclick = () => copySessionId(sessionId);
				// sessionInfo.style.display = 'flex';
				sessionStatus.style.display = 'none';
				newSessionBtn.style.display = 'block';
				if (historyBtn) historyBtn.style.display = 'block';
			}
		}
		
		function copySessionId(sessionId) {
			navigator.clipboard.writeText(sessionId).then(() => {
				// Show temporary feedback
				const sessionIdSpan = document.getElementById('sessionId');
				if (sessionIdSpan) {
					const originalText = sessionIdSpan.textContent;
					sessionIdSpan.textContent = 'Copied!';
					setTimeout(() => {
						sessionIdSpan.textContent = originalText;
					}, 1000);
				}
			}).catch(err => {
				console.error('Failed to copy session ID:', err);
			});
		}
		
		function hideSessionInfo() {
			// const sessionInfo = document.getElementById('sessionInfo');
			const sessionStatus = document.getElementById('sessionStatus');
			const newSessionBtn = document.getElementById('newSessionBtn');
			const historyBtn = document.getElementById('historyBtn');
			
			if (sessionStatus && newSessionBtn) {
				// sessionInfo.style.display = 'none';
				sessionStatus.style.display = 'none';

				// Always show new session
				newSessionBtn.style.display = 'block';
				// Keep history button visible - don't hide it
				if (historyBtn) historyBtn.style.display = 'block';
			}
		}

		updateStatus('Initializing...', 'disconnected');
		

		function parseSimpleMarkdown(markdown) {
			// First, handle code blocks before line-by-line processing
			let processedMarkdown = markdown;
			
			// Store code blocks temporarily to protect them from further processing
			const codeBlockPlaceholders = [];
			
			// Handle multi-line code blocks with triple backticks
			// Using RegExp constructor to avoid backtick conflicts in template literal
			const codeBlockRegex = new RegExp('\\\`\\\`\\\`(\\\\w*)\\n([\\\\s\\\\S]*?)\\\`\\\`\\\`', 'g');
			processedMarkdown = processedMarkdown.replace(codeBlockRegex, function(match, lang, code) {
				const language = lang || 'plaintext';
				// Process code line by line to preserve formatting like diff implementation
				const codeLines = code.split('\\n');
				let codeHtml = '';
				
				for (const line of codeLines) {
					const escapedLine = escapeHtml(line);
					codeHtml += '<div class="code-line">' + escapedLine + '</div>';
				}
				
				// Create unique ID for this code block
				const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
				const escapedCode = escapeHtml(code);
				
				const codeBlockHtml = '<div class="code-block-container"><div class="code-block-header"><span class="code-block-language">' + language + '</span><button class="code-copy-btn" onclick="copyCodeBlock(\\\'' + codeId + '\\\')" title="Copy code"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></div><pre class="code-block"><code class="language-' + language + '" id="' + codeId + '" data-raw-code="' + escapedCode.replace(/"/g, '&quot;') + '">' + codeHtml + '</code></pre></div>';
				
				// Store the code block and return a placeholder
				const placeholder = '__CODEBLOCK_' + codeBlockPlaceholders.length + '__';
				codeBlockPlaceholders.push(codeBlockHtml);
				return placeholder;
			});
			
			// Handle inline code with single backticks
			const inlineCodeRegex = new RegExp('\\\`([^\\\`]+)\\\`', 'g');
			processedMarkdown = processedMarkdown.replace(inlineCodeRegex, '<code>$1</code>');
			
			const lines = processedMarkdown.split('\\n');
			let html = '';
			let inUnorderedList = false;
			let inOrderedList = false;

			for (let line of lines) {
				line = line.trim();
				
				// Check if this is a code block placeholder
				if (line.startsWith('__CODEBLOCK_') && line.endsWith('__')) {
					// This is a code block placeholder, don't process it
					html += line;
					continue;
				}

				// Bold
				line = line.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');

				// Italic - only apply when underscores are surrounded by whitespace or at beginning/end
				line = line.replace(/(?<!\\*)\\*(?!\\*)(.*?)\\*(?!\\*)/g, '<em>$1</em>');
				line = line.replace(/(^|\\s)_([^_\\s][^_]*[^_\\s]|[^_\\s])_(?=\\s|$)/g, '$1<em>$2</em>');

				// Headers
				if (/^####\\s+/.test(line)) {
				html += '<h4>' + line.replace(/^####\\s+/, '') + '</h4>';
				continue;
				} else if (/^###\\s+/.test(line)) {
				html += '<h3>' + line.replace(/^###\\s+/, '') + '</h3>';
				continue;
				} else if (/^##\\s+/.test(line)) {
				html += '<h2>' + line.replace(/^##\\s+/, '') + '</h2>';
				continue;
				} else if (/^#\\s+/.test(line)) {
				html += '<h1>' + line.replace(/^#\\s+/, '') + '</h1>';
				continue;
				}

				// Ordered list
				if (/^\\d+\\.\\s+/.test(line)) {
				if (!inOrderedList) {
					html += '<ol>';
					inOrderedList = true;
				}
				const item = line.replace(/^\\d+\\.\\s+/, '');
				html += '<li>' + item + '</li>';
				continue;
				}

				// Unordered list
				if (line.startsWith('- ')) {
				if (!inUnorderedList) {
					html += '<ul>';
					inUnorderedList = true;
				}
				html += '<li>' + line.slice(2) + '</li>';
				continue;
				}

				// Close lists
				if (inUnorderedList) {
				html += '</ul>';
				inUnorderedList = false;
				}
				if (inOrderedList) {
				html += '</ol>';
				inOrderedList = false;
				}

				// Paragraph or break
				if (line !== '') {
				html += '<p>' + line + '</p>';
				} else {
				html += '<br>';
				}
			}

			if (inUnorderedList) html += '</ul>';
			if (inOrderedList) html += '</ol>';

			// Restore code block placeholders
			for (let i = 0; i < codeBlockPlaceholders.length; i++) {
				const placeholder = '__CODEBLOCK_' + i + '__';
				html = html.replace(placeholder, codeBlockPlaceholders[i]);
			}

			return html;
		}

		// Conversation history functions
		function toggleConversationHistory() {
			const historyDiv = document.getElementById('conversationHistory');
			const chatContainer = document.getElementById('chatContainer');
			
			if (historyDiv.style.display === 'none') {
				sendStats('History opened');
				// Show conversation history
				requestConversationList();
				historyDiv.style.display = 'block';
				chatContainer.style.display = 'none';
			} else {
				// Hide conversation history
				historyDiv.style.display = 'none';
				chatContainer.style.display = 'flex';
			}
		}

		function requestConversationList() {
			vscode.postMessage({
				type: 'getConversationList'
			});
		}

		function loadConversation(filename) {
			vscode.postMessage({
				type: 'loadConversation',
				filename: filename
			});

			// Clear todo display when loading conversation

			// Hide conversation history and show chat
			toggleConversationHistory();
		}

		// Context file management functions
		function addToContext(file) {
			if (!contextFiles.has(file.path)) {
				contextFiles.set(file.path, {
					path: file.path,
					name: file.name || file.path.split('/').pop() || file.path.split('\\\\').pop(),
					type: file.type || 'file',
					icon: file.icon || getFileIcon(file.path)
				});
				updateContextFilesDisplay();
			}
		}

		function removeFromContext(path) {
			contextFiles.delete(path);
			selectedContextFiles.delete(path);
			updateContextFilesDisplay();
		}

		function updateContextFilesDisplay() {
			const container = document.getElementById('contextFilesContainer');
			const list = document.getElementById('contextFilesList');

			if (contextFiles.size === 0) {
				container.style.display = 'none';
				return;
			}

			container.style.display = 'block';
			list.innerHTML = '';

			contextFiles.forEach((file, path) => {
				const chip = document.createElement('div');
				chip.className = 'context-file-chip';

				if (file.type === 'folder') {
					chip.classList.add('folder');
				} else if (file.type === 'root') {
					chip.classList.add('root');
				} else if (file.type === 'image') {
					chip.classList.add('image');
				}

				// Create elements programmatically to avoid escaping issues
				const iconSpan = document.createElement('span');
				iconSpan.className = 'file-icon';
				iconSpan.textContent = file.icon;

				const nameSpan = document.createElement('span');
				nameSpan.className = 'file-name';
				nameSpan.title = path;
				nameSpan.textContent = file.name;

				const removeBtn = document.createElement('button');
				removeBtn.className = 'remove-btn';
				removeBtn.title = 'Remove';
				removeBtn.textContent = '✕';
				removeBtn.onclick = () => removeFromContext(path);

				chip.appendChild(iconSpan);
				chip.appendChild(nameSpan);
				chip.appendChild(removeBtn);

				list.appendChild(chip);
			});
		}

		function clearAllContext() {
			contextFiles.clear();
			selectedContextFiles.clear();
			updateContextFilesDisplay();
		}

		function addSelectedFiles() {
			selectedContextFiles.forEach(path => {
				const file = filteredFiles.find(f => f.path === path) ||
							filteredFolders.find(f => f.path === path);
				if (file) {
					addToContext({
						path: file.path,
						name: file.name,
						type: file.isDirectory ? 'folder' : 'file',
						icon: file.isDirectory ? '📁' : getFileIcon(file.path)
					});
				}
			});
			selectedContextFiles.clear();
			hideFilePicker();
			updateSelectionCount();
		}

		function cancelFilePicker() {
			selectedContextFiles.clear();
			hideFilePicker();
		}

		function selectAllFiles() {
			const items = isFileMode ? filteredFiles : filteredFolders;
			items.forEach(item => {
				selectedContextFiles.add(item.path);
			});
			renderFileList();
			updateSelectionCount();
		}

		function clearSelection() {
			selectedContextFiles.clear();
			renderFileList();
			updateSelectionCount();
		}

		function updateSelectionCount() {
			const countSpan = document.getElementById('selectionCount');
			const addBtn = document.getElementById('addSelectedBtn');
			const count = selectedContextFiles.size;

			if (countSpan) {
				countSpan.textContent = \`\${count} selected\`;
			}

			if (addBtn) {
				addBtn.disabled = count === 0;
			}
		}

		function addRootFolder() {
			addToContext({
				path: '/',
				name: 'Project Root',
				type: 'root',
				icon: '📦'
			});
			hideFilePicker();
		}

		// File picker functions
		function showFilePicker() {
			// Clear previous selections
			selectedContextFiles.clear();

			// Request initial list from VS Code based on current mode
			if (isFileMode) {
				vscode.postMessage({
					type: 'getWorkspaceFiles',
					searchTerm: ''
				});
			} else {
				vscode.postMessage({
					type: 'getWorkspaceFolders',
					searchTerm: '',
					currentPath: currentFolderPath
				});
			}

			// Show modal
			filePickerModal.style.display = 'flex';
			fileSearchInput.focus();
			selectedFileIndex = -1;
			updateSelectionCount();
		}

		function hideFilePicker() {
			filePickerModal.style.display = 'none';
			fileSearchInput.value = '';
			selectedFileIndex = -1;
			selectedContextFiles.clear();
		}

		function getFileIcon(filename) {
			const ext = filename.split('.').pop()?.toLowerCase();
			switch (ext) {
				case 'js': case 'jsx': case 'ts': case 'tsx': return '📄';
				case 'html': case 'htm': return '🌐';
				case 'css': case 'scss': case 'sass': return '🎨';
				case 'json': return '📋';
				case 'md': return '📝';
				case 'py': return '🐍';
				case 'java': return '☕';
				case 'cpp': case 'c': case 'h': return '⚙️';
				case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': return '🖼️';
				case 'pdf': return '📄';
				case 'zip': case 'tar': case 'gz': return '📦';
				default: return '📄';
			}
		}

		function renderFileList() {
			fileList.innerHTML = '';

			const items = isFileMode ? filteredFiles : filteredFolders;

			items.forEach((item, index) => {
				const fileItem = document.createElement('div');
				fileItem.className = isFileMode ? 'file-item' : 'file-item folder';
				if (index === selectedFileIndex) {
					fileItem.classList.add('selected');
				}
				if (selectedContextFiles.has(item.path)) {
					fileItem.classList.add('multi-selected');
				}

				const icon = isFileMode ? getFileIcon(item.name) : '📁';

				// Add checkbox for multi-select
				const checkbox = \`<input type="checkbox" \${selectedContextFiles.has(item.path) ? 'checked' : ''} />\`;

				if (isFileMode) {
					fileItem.innerHTML = \`
						\${checkbox}
						<span class="file-icon">\${icon}</span>
						<div class="file-info">
							<div class="file-name">\${item.name}</div>
							<div class="file-path">\${item.path}</div>
						</div>
					\`;
				} else {
					// Folder mode - add navigation button
					fileItem.innerHTML = \`
						\${checkbox}
						<span class="file-icon">\${icon}</span>
						<div class="file-info">
							<div class="file-name">\${item.name}</div>
							<div class="file-path">\${item.path}</div>
						</div>
						<button class="folder-navigate-btn" title="Navigate into folder">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
							</svg>
						</button>
					\`;
				}

				const checkboxEl = fileItem.querySelector('input[type="checkbox"]');
				checkboxEl.addEventListener('change', (e) => {
					e.stopPropagation();
					if (e.target.checked) {
						selectedContextFiles.add(item.path);
					} else {
						selectedContextFiles.delete(item.path);
					}
					updateSelectionCount();
					fileItem.classList.toggle('multi-selected', e.target.checked);
				});

				fileItem.addEventListener('click', (e) => {
					// Check if checkbox was clicked
					if (e.target.type === 'checkbox') {
						return;
					}

					// Check if the navigation button was clicked
					if (e.target.closest('.folder-navigate-btn')) {
						e.stopPropagation();
						if (!isFileMode && item.isDirectory) {
							navigateToFolder(item);
						}
						return;
					}

					// Toggle checkbox on row click
					const checkbox = fileItem.querySelector('input[type="checkbox"]');
					checkbox.checked = !checkbox.checked;
					if (checkbox.checked) {
						selectedContextFiles.add(item.path);
					} else {
						selectedContextFiles.delete(item.path);
					}
					updateSelectionCount();
					fileItem.classList.toggle('multi-selected', checkbox.checked);
				});

				fileList.appendChild(fileItem);
			});

			updateSelectionCount();
		}

		// Legacy function - no longer used with multi-select
		function selectFile(file) {
			// This function is deprecated but kept for compatibility
		}

		function filterFiles(searchTerm) {
			// Send search request to backend based on current mode
			if (isFileMode) {
				vscode.postMessage({
					type: 'getWorkspaceFiles',
					searchTerm: searchTerm
				});
			} else {
				vscode.postMessage({
					type: 'getWorkspaceFolders',
					searchTerm: searchTerm,
					currentPath: currentFolderPath
				});
			}
			selectedFileIndex = -1;
		}

		// Folder mode functions
		function switchToFileMode() {
			isFileMode = true;
			fileModeBtn.classList.add('active');
			folderModeBtn.classList.remove('active');
			filePickerTitle.textContent = 'Select Files';
			fileSearchInput.placeholder = 'Search files...';
			filePickerBreadcrumb.style.display = 'none';
			currentFolderPath = '';
			selectedContextFiles.clear();

			// Request files
			vscode.postMessage({
				type: 'getWorkspaceFiles',
				searchTerm: fileSearchInput.value
			});
		}

		function switchToFolderMode() {
			isFileMode = false;
			fileModeBtn.classList.remove('active');
			folderModeBtn.classList.add('active');
			filePickerTitle.textContent = 'Select Folders';
			selectedContextFiles.clear();
			fileSearchInput.placeholder = 'Search folders...';
			filePickerBreadcrumb.style.display = 'flex';
			currentFolderPath = '';

			// Request folders
			vscode.postMessage({
				type: 'getWorkspaceFolders',
				searchTerm: fileSearchInput.value,
				currentPath: currentFolderPath
			});
		}

		function navigateToFolder(folder) {
			currentFolderPath = folder.path;

			// Request contents of the selected folder
			vscode.postMessage({
				type: 'getWorkspaceFolders',
				searchTerm: '',
				currentPath: currentFolderPath
			});

			// Clear search input when navigating
			fileSearchInput.value = '';
		}

		function navigateToRoot() {
			currentFolderPath = '';

			// Request root folders
			vscode.postMessage({
				type: 'getWorkspaceFolders',
				searchTerm: fileSearchInput.value,
				currentPath: currentFolderPath
			});
		}

		// Legacy function - no longer used with multi-select
		function selectFolder(folder) {
			// This function is deprecated but kept for compatibility
		}

		function updateBreadcrumb() {
			if (!isFileMode) {
				filePickerBreadcrumb.style.display = 'flex';

				if (currentFolderPath) {
					const pathParts = currentFolderPath.split('/');
					let breadcrumbHTML = '';
					let currentPath = '';

					pathParts.forEach((part, index) => {
						if (index > 0) {
							breadcrumbHTML += '<span class="breadcrumb-separator">/</span>';
						}
						currentPath += (index > 0 ? '/' : '') + part;
						const clickablePath = currentPath;

						breadcrumbHTML += \`<button class="breadcrumb-btn" onclick="navigateToPath('\${clickablePath}')">\${part}</button>\`;
					});

					currentPathSpan.innerHTML = breadcrumbHTML;
				} else {
					currentPathSpan.innerHTML = '';
				}
			} else {
				filePickerBreadcrumb.style.display = 'none';
			}
		}

		function navigateToPath(path) {
			currentFolderPath = path;

			// Request contents of the selected path
			vscode.postMessage({
				type: 'getWorkspaceFolders',
				searchTerm: '',
				currentPath: currentFolderPath
			});

			// Clear search input when navigating
			fileSearchInput.value = '';
		}

		// Image handling functions
		function selectImage() {
			// Use VS Code's native file picker instead of browser file picker
			vscode.postMessage({
				type: 'selectImageFile'
			});
		}


		function showImageAddedFeedback(fileName) {
			// Create temporary feedback element
			const feedback = document.createElement('div');
			feedback.textContent = \`Added: \${fileName}\`;
			feedback.style.cssText = \`
				position: fixed;
				top: 20px;
				right: 20px;
				background: var(--vscode-notifications-background);
				color: var(--vscode-notifications-foreground);
				padding: 8px 12px;
				border-radius: 4px;
				font-size: 12px;
				z-index: 1000;
				opacity: 0;
				transition: opacity 0.3s ease;
			\`;
			
			document.body.appendChild(feedback);
			
			// Animate in
			setTimeout(() => feedback.style.opacity = '1', 10);
			
			// Animate out and remove
			setTimeout(() => {
				feedback.style.opacity = '0';
				setTimeout(() => feedback.remove(), 300);
			}, 2000);
		}

		function displayConversationList(conversations) {
			const listDiv = document.getElementById('conversationList');
			listDiv.innerHTML = '';

			if (conversations.length === 0) {
				listDiv.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">No conversations found</p>';
				return;
			}

			conversations.forEach(conv => {
				const item = document.createElement('div');
				item.className = 'conversation-item';
				item.onclick = () => loadConversation(conv.filename);

				const date = new Date(conv.startTime).toLocaleDateString();
				const time = new Date(conv.startTime).toLocaleTimeString();

				item.innerHTML = \`
					<div class="conversation-title">\${conv.firstUserMessage.substring(0, 60)}\${conv.firstUserMessage.length > 60 ? '...' : ''}</div>
					<div class="conversation-meta">\${date} at \${time} • \${conv.messageCount} messages • $\${conv.totalCost.toFixed(3)}</div>
					<div class="conversation-preview">Last: \${conv.lastUserMessage.substring(0, 80)}\${conv.lastUserMessage.length > 80 ? '...' : ''}</div>
				\`;

				listDiv.appendChild(item);
			});
		}

		function handleClipboardText(text) {
			if (!text) return;
			
			// Insert text at cursor position
			const start = messageInput.selectionStart;
			const end = messageInput.selectionEnd;
			const currentValue = messageInput.value;
			
			const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
			messageInput.value = newValue;
			
			// Set cursor position after pasted text
			const newCursorPos = start + text.length;
			messageInput.setSelectionRange(newCursorPos, newCursorPos);
			
			// Trigger input event to adjust height
			messageInput.dispatchEvent(new Event('input', { bubbles: true }));
		}

		// Settings functions

		function toggleSettings() {
			const settingsModal = document.getElementById('settingsModal');
			if (settingsModal.style.display === 'none') {
				// Request current settings from VS Code
				vscode.postMessage({
					type: 'getSettings'
				});
				// Request current permissions
				vscode.postMessage({
					type: 'getPermissions'
				});
				// Request CLAUDE.md content
				vscode.postMessage({
					type: 'loadClaudeMd'
				});
				settingsModal.style.display = 'flex';
			} else {
				hideSettingsModal();
			}
		}

		function hideSettingsModal() {
			// Check for unsaved CLAUDE.md changes
			const contentEl = document.getElementById('claudeMdContent');
			if (contentEl && originalClaudeMdContent && contentEl.value !== originalClaudeMdContent) {
				if (!confirm('You have unsaved changes to CLAUDE.md. Are you sure you want to close without saving?')) {
					return;
				}
			}
			document.getElementById('settingsModal').style.display = 'none';
		}

		// Agent Manager Functions
		let agentsData = [];
		let currentAgentsScope = 'both';
		let agentsSearchQuery = '';
		let currentEditingAgent = null;

		function showAgentsModal() {
			document.getElementById('agentsModal').style.display = 'flex';
			currentAgentsScope = 'both';
			agentsSearchQuery = '';
			loadAgents();
		}

		function hideAgentsModal() {
			document.getElementById('agentsModal').style.display = 'none';
		}

		function switchAgentsScope(scope) {
			currentAgentsScope = scope;
			document.querySelectorAll('.agents-scope-tab').forEach(tab => {
				tab.classList.toggle('active', tab.getAttribute('data-scope') === scope);
			});
			loadAgents();
		}

		function filterAgents() {
			agentsSearchQuery = document.getElementById('agentsSearchInput').value.toLowerCase();
			displayAgents();
		}

		function loadAgents() {
			vscode.postMessage({ type: 'getAgents', scope: currentAgentsScope });
		}

		function displayAgents() {
			const agentsList = document.getElementById('agentsList');

			let filteredAgents = agentsData.filter(agent => {
				if (agentsSearchQuery) {
					const searchLower = agentsSearchQuery.toLowerCase();
					return agent.metadata.name.toLowerCase().includes(searchLower) ||
						agent.metadata.description.toLowerCase().includes(searchLower);
				}
				return true;
			});

			if (filteredAgents.length === 0) {
				agentsList.innerHTML = \`
					<div class="agents-empty">
						<div class="agents-empty-icon">🤖</div>
						<div>No agents found</div>
					</div>
				\`;
				return;
			}

			agentsList.innerHTML = filteredAgents.map(agent => {
				// Escape single quotes in the name and scope to prevent breaking onclick handlers
				const escapedName = agent.metadata.name.replace(/'/g, "\\\\'");
				const escapedScope = agent.scope.replace(/'/g, "\\\\'");

				return \`
					<div class="agent-card" onclick="window.editAgent('\${escapedName}', '\${escapedScope}')">
						\${agent.metadata.color ? \`<div class="agent-color-indicator agent-color-\${agent.metadata.color}"></div>\` : ''}
						<div class="agent-info">
							<div class="agent-name">\${agent.metadata.name}</div>
							<div class="agent-description">\${agent.metadata.description}</div>
							<div class="agent-meta">
								<span class="agent-badge">\${agent.scope}</span>
								\${agent.metadata.model ? \`<span class="agent-badge">\${agent.metadata.model}</span>\` : ''}
							</div>
						</div>
						<div class="agent-actions-inline">
							<button class="agent-action-btn" onclick="event.stopPropagation(); window.cloneAgent('\${escapedName}', '\${escapedScope}')">Clone</button>
							<button class="agent-action-btn" onclick="event.stopPropagation(); window.exportAgent('\${escapedName}', '\${escapedScope}')">Export</button>
							<button class="agent-action-btn" onclick="event.stopPropagation(); window.deleteAgent('\${escapedName}', '\${escapedScope}')">Delete</button>
						</div>
					</div>
				\`;
			}).join('');
		}

		function showCreateAgentModal() {
			currentEditingAgent = null;
			document.getElementById('agentFormTitle').textContent = 'Create Agent';
			document.getElementById('agentName').value = '';
			document.getElementById('agentDescription').value = '';
			document.getElementById('agentScope').value = 'local';
			document.getElementById('agentModel').value = '';
			document.getElementById('agentColor').value = '';
			document.getElementById('agentSystemPrompt').value = '';
			document.getElementById('agentFormModal').style.display = 'flex';
		}

		function hideAgentFormModal() {
			document.getElementById('agentFormModal').style.display = 'none';
			currentEditingAgent = null;
			// Clear validation errors
			document.getElementById('agentName').style.borderColor = '';
			document.getElementById('agentDescription').style.borderColor = '';
			document.getElementById('agentSystemPrompt').style.borderColor = '';
		}

		function editAgent(name, scope) {
			currentEditingAgent = { name, scope };
			vscode.postMessage({ type: 'getAgent', name, scope });
		}

		function saveAgent() {
			const name = document.getElementById('agentName').value.trim();
			const description = document.getElementById('agentDescription').value.trim();
			const scope = document.getElementById('agentScope').value;
			const model = document.getElementById('agentModel').value;
			const color = document.getElementById('agentColor').value;
			const systemPrompt = document.getElementById('agentSystemPrompt').value.trim();

			// Validate required fields
			let hasError = false;
			if (!name) {
				document.getElementById('agentName').style.borderColor = '#e74c3c';
				hasError = true;
			} else {
				document.getElementById('agentName').style.borderColor = '';
			}

			if (!description) {
				document.getElementById('agentDescription').style.borderColor = '#e74c3c';
				hasError = true;
			} else {
				document.getElementById('agentDescription').style.borderColor = '';
			}

			if (!systemPrompt) {
				document.getElementById('agentSystemPrompt').style.borderColor = '#e74c3c';
				hasError = true;
			} else {
				document.getElementById('agentSystemPrompt').style.borderColor = '';
			}

			if (hasError) {
				showNotification('Please fill in all required fields', 'error');
				return;
			}

			const agent = {
				metadata: {
					name,
					description,
					...(model && { model }),
					...(color && { color })
				},
				systemPrompt,
				scope
			};

			if (currentEditingAgent) {
				vscode.postMessage({
					type: 'updateAgent',
					name: currentEditingAgent.name,
					scope: currentEditingAgent.scope,
					updates: agent
				});
			} else {
				vscode.postMessage({
					type: 'createAgent',
					agent,
					overwrite: false
				});
			}
		}

		// Store delete agent data
		let pendingDeleteAgent = null;
		let pendingCloneAgent = null;

		function deleteAgent(name, scope) {
			// Store the agent to delete and show modal
			pendingDeleteAgent = { name, scope };
			document.getElementById('deleteAgentName').textContent = name;
			document.getElementById('deleteConfirmModal').style.display = 'flex';
		}

		function confirmDeleteAgent() {
			if (pendingDeleteAgent) {
				vscode.postMessage({
					type: 'deleteAgent',
					name: pendingDeleteAgent.name,
					scope: pendingDeleteAgent.scope
				});
				pendingDeleteAgent = null;
			}
			hideDeleteConfirmModal();
		}

		function hideDeleteConfirmModal() {
			document.getElementById('deleteConfirmModal').style.display = 'none';
			pendingDeleteAgent = null;
		}

		function cloneAgent(name, fromScope) {
			// Store the agent to clone and show modal
			pendingCloneAgent = { name, fromScope };
			document.getElementById('cloneSourceName').textContent = name;
			document.getElementById('cloneNewName').value = \`\${name}-copy\`;
			document.getElementById('cloneToScope').value = fromScope === 'local' ? 'user' : 'local';
			document.getElementById('cloneAgentModal').style.display = 'flex';
		}

		function confirmCloneAgent() {
			if (pendingCloneAgent) {
				const newName = document.getElementById('cloneNewName').value.trim();
				const toScope = document.getElementById('cloneToScope').value;

				if (newName) {
					vscode.postMessage({
						type: 'cloneAgent',
						name: pendingCloneAgent.name,
						fromScope: pendingCloneAgent.fromScope,
						toScope,
						newName
					});
					pendingCloneAgent = null;
					hideCloneAgentModal();
				}
			}
		}

		function hideCloneAgentModal() {
			document.getElementById('cloneAgentModal').style.display = 'none';
			pendingCloneAgent = null;
		}

		function exportAgent(name, scope) {
			vscode.postMessage({ type: 'exportAgent', name, scope });
		}

		function importAgent() {
			vscode.postMessage({ type: 'importAgent', scope: 'user', overwrite: false });
		}

		function showAIGenerateModal() {
			document.getElementById('aiPrompt').value = '';
			document.getElementById('aiAgentScope').value = 'local';
			document.getElementById('aiGenerateModal').style.display = 'flex';
		}

		function hideAIGenerateModal() {
			document.getElementById('aiGenerateModal').style.display = 'none';
			// Reset the generate button state
			const generateBtn = document.querySelector('#aiGenerateModal button.primary');
			if (generateBtn) {
				generateBtn.disabled = false;
				generateBtn.textContent = 'Generate Agent';
			}
			// Clear the prompt
			document.getElementById('aiPrompt').value = '';
			document.getElementById('aiPrompt').style.borderColor = '';
		}

		function generateAgentWithAI() {
			const prompt = document.getElementById('aiPrompt').value.trim();
			const scope = document.getElementById('aiAgentScope').value;

			if (!prompt) {
				// Show error message in the modal instead of alert
				const promptTextarea = document.getElementById('aiPrompt');
				promptTextarea.style.borderColor = '#e74c3c';
				promptTextarea.focus();
				return;
			}

			// Show loading state in the modal
			const generateBtn = document.querySelector('#aiGenerateModal button.primary');
			const originalText = generateBtn.textContent;
			generateBtn.disabled = true;
			generateBtn.textContent = 'Generating...';

			// Send the generation request
			vscode.postMessage({
				type: 'generateAgentWithAI',
				prompt,
				scope
			});

			// Don't hide the modal yet - wait for response
			// The modal will be hidden when we receive agentGenerated or agentError message
		}

		// Close modals when clicking outside
		document.getElementById('agentsModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('agentsModal')) {
				hideAgentsModal();
			}
		});

		document.getElementById('agentFormModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('agentFormModal')) {
				hideAgentFormModal();
			}
		});

		document.getElementById('aiGenerateModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('aiGenerateModal')) {
				hideAIGenerateModal();
			}
		});

		// Make agent functions available globally
		window.showAgentsModal = showAgentsModal;
		window.hideAgentsModal = hideAgentsModal;
		window.switchAgentsScope = switchAgentsScope;
		window.filterAgents = filterAgents;
		window.showCreateAgentModal = showCreateAgentModal;
		window.hideAgentFormModal = hideAgentFormModal;
		window.editAgent = editAgent;
		window.saveAgent = saveAgent;
		window.deleteAgent = deleteAgent;
		window.confirmDeleteAgent = confirmDeleteAgent;
		window.hideDeleteConfirmModal = hideDeleteConfirmModal;
		window.cloneAgent = cloneAgent;
		window.confirmCloneAgent = confirmCloneAgent;
		window.hideCloneAgentModal = hideCloneAgentModal;
		window.exportAgent = exportAgent;
		window.importAgent = importAgent;
		window.showAIGenerateModal = showAIGenerateModal;
		window.hideAIGenerateModal = hideAIGenerateModal;
		window.generateAgentWithAI = generateAgentWithAI;

		function updateSettings() {
			// Note: thinking intensity is now handled separately in the thinking intensity modal
			
			const wslEnabled = document.getElementById('wsl-enabled').checked;
			const wslDistro = document.getElementById('wsl-distro').value;
			const wslNodePath = document.getElementById('wsl-node-path').value;
			const wslClaudePath = document.getElementById('wsl-claude-path').value;
			const yoloMode = yoloModeEnabled;

			// Update WSL options visibility
			document.getElementById('wslOptions').style.display = wslEnabled ? 'block' : 'none';

			// Send settings to VS Code immediately
			vscode.postMessage({
				type: 'updateSettings',
				settings: {
					'wsl.enabled': wslEnabled,
					'wsl.distro': wslDistro || 'Ubuntu',
					'wsl.nodePath': wslNodePath || '/usr/bin/node',
					'wsl.claudePath': wslClaudePath || '/usr/local/bin/claude',
					'permissions.yoloMode': yoloMode
				}
			});
		}

		// CLAUDE.md editor functions
		let originalClaudeMdContent = '';
		let claudeMdTemplate = '';

		function loadClaudeMd() {
			const statusEl = document.getElementById('claudeMdStatus');
			const contentEl = document.getElementById('claudeMdContent');
			const loadingEl = document.getElementById('claudeMdLoading');

			if (statusEl) statusEl.textContent = 'Loading...';
			if (loadingEl) loadingEl.style.display = 'flex';
			if (contentEl) contentEl.disabled = true;

			vscode.postMessage({
				type: 'loadClaudeMd'
			});
		}

		function saveClaudeMd() {
			const contentEl = document.getElementById('claudeMdContent');
			const statusEl = document.getElementById('claudeMdStatus');
			const loadingEl = document.getElementById('claudeMdLoading');

			if (!contentEl) return;

			const content = contentEl.value;

			if (statusEl) statusEl.textContent = 'Saving...';
			if (loadingEl) loadingEl.style.display = 'flex';
			if (contentEl) contentEl.disabled = true;

			vscode.postMessage({
				type: 'saveClaudeMd',
				content: content
			});
		}

		function resetClaudeMd() {
			const contentEl = document.getElementById('claudeMdContent');
			if (contentEl && originalClaudeMdContent) {
				contentEl.value = originalClaudeMdContent;
				updateClaudeMdStatus(false);
			}
		}

		function loadClaudeMdTemplate() {
			const contentEl = document.getElementById('claudeMdContent');
			if (contentEl && claudeMdTemplate) {
				// Confirm before loading template if there are unsaved changes
				if (contentEl.value !== originalClaudeMdContent && contentEl.value.trim() !== '') {
					if (!confirm('You have unsaved changes. Loading the template will overwrite your current content. Continue?')) {
						return;
					}
				}
				// Load template directly without backend call
				contentEl.value = claudeMdTemplate;
				updateClaudeMdStatus(true);
			}
		}

		// Add keyboard shortcut support for CLAUDE.md editor
		document.addEventListener('DOMContentLoaded', () => {
			const claudeMdContent = document.getElementById('claudeMdContent');
			if (claudeMdContent) {
				claudeMdContent.addEventListener('keydown', (e) => {
					// Ctrl+S or Cmd+S to save
					if ((e.ctrlKey || e.metaKey) && e.key === 's') {
						e.preventDefault();
						saveClaudeMd();
					}
				});
			}
		});

		function updateClaudeMdStatus(modified) {
			const statusEl = document.getElementById('claudeMdStatus');
			if (statusEl) {
				if (modified) {
					statusEl.textContent = 'Modified - unsaved changes';
					statusEl.style.color = 'var(--vscode-editorWarning-foreground)';
				} else {
					statusEl.textContent = 'Saved';
					statusEl.style.color = 'var(--vscode-descriptionForeground)';
				}
			}
		}

		// Permissions management functions
		function renderPermissions(permissions) {
			const permissionsList = document.getElementById('permissionsList');
			
			if (!permissions || !permissions.alwaysAllow || Object.keys(permissions.alwaysAllow).length === 0) {
				permissionsList.innerHTML = \`
					<div class="permissions-empty">
						No always-allow permissions set
					</div>
				\`;
				return;
			}
			
			let html = '';
			
			for (const [toolName, permission] of Object.entries(permissions.alwaysAllow)) {
				if (permission === true) {
					// Tool is always allowed
					html += \`
						<div class="permission-item">
							<div class="permission-info">
								<span class="permission-tool">\${toolName}</span>
								<span class="permission-desc">All</span>
							</div>
							<button class="permission-remove-btn" onclick="removePermission('\${toolName}', null)">Remove</button>
						</div>
					\`;
				} else if (Array.isArray(permission)) {
					// Tool has specific commands/patterns
					for (const command of permission) {
						const displayCommand = command.replace(' *', ''); // Remove asterisk for display
						html += \`
							<div class="permission-item">
								<div class="permission-info">
									<span class="permission-tool">\${toolName}</span>
									<span class="permission-command"><code>\${displayCommand}</code></span>
								</div>
								<button class="permission-remove-btn" onclick="removePermission('\${toolName}', '\${escapeHtml(command)}')">Remove</button>
							</div>
						\`;
					}
				}
			}
			
			permissionsList.innerHTML = html;
		}
		
		function removePermission(toolName, command) {
			vscode.postMessage({
				type: 'removePermission',
				toolName: toolName,
				command: command
			});
		}
		
		function showAddPermissionForm() {
			document.getElementById('showAddPermissionBtn').style.display = 'none';
			document.getElementById('addPermissionForm').style.display = 'block';
			
			// Focus on the tool select dropdown
			setTimeout(() => {
				document.getElementById('addPermissionTool').focus();
			}, 100);
		}
		
		function hideAddPermissionForm() {
			document.getElementById('showAddPermissionBtn').style.display = 'flex';
			document.getElementById('addPermissionForm').style.display = 'none';
			
			// Clear form inputs
			document.getElementById('addPermissionTool').value = '';
			document.getElementById('addPermissionCommand').value = '';
			document.getElementById('addPermissionCommand').style.display = 'none';
		}
		
		function toggleCommandInput() {
			const toolSelect = document.getElementById('addPermissionTool');
			const commandInput = document.getElementById('addPermissionCommand');
			const hintDiv = document.getElementById('permissionsFormHint');
			
			if (toolSelect.value === 'Bash') {
				commandInput.style.display = 'block';
				hintDiv.textContent = 'Use patterns like "npm i *" or "git add *" for specific commands.';
			} else if (toolSelect.value === '') {
				commandInput.style.display = 'none';
				commandInput.value = '';
				hintDiv.textContent = 'Select a tool to add always-allow permission.';
			} else {
				commandInput.style.display = 'none';
				commandInput.value = '';
				hintDiv.textContent = 'This will allow all ' + toolSelect.value + ' commands without asking for permission.';
			}
		}
		
		function addPermission() {
			const toolSelect = document.getElementById('addPermissionTool');
			const commandInput = document.getElementById('addPermissionCommand');
			const addBtn = document.getElementById('addPermissionBtn');
			
			const toolName = toolSelect.value.trim();
			const command = commandInput.value.trim();
			
			if (!toolName) {
				return;
			}
			
			// Disable button during processing
			addBtn.disabled = true;
			addBtn.textContent = 'Adding...';
			
			vscode.postMessage({
				type: 'addPermission',
				toolName: toolName,
				command: command || null
			});
			
			// Clear form and hide it
			toolSelect.value = '';
			commandInput.value = '';
			hideAddPermissionForm();
			
			// Re-enable button
			setTimeout(() => {
				addBtn.disabled = false;
				addBtn.textContent = 'Add';
			}, 500);
		}

		// Close settings modal when clicking outside
		document.getElementById('settingsModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('settingsModal')) {
				hideSettingsModal();
			}
		});

		// Close thinking intensity modal when clicking outside
		document.getElementById('thinkingIntensityModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('thinkingIntensityModal')) {
				hideThinkingIntensityModal();
			}
		});

		// Close slash commands modal when clicking outside
		document.getElementById('slashCommandsModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('slashCommandsModal')) {
				hideSlashCommandsModal();
			}
		});

		// Request custom snippets from VS Code on page load
		vscode.postMessage({
			type: 'getCustomSnippets'
		});

		// Detect slash commands input
		messageInput.addEventListener('input', (e) => {
			const value = messageInput.value;
			// Only trigger when "/" is the very first and only character
			if (value === '/') {
				showSlashCommandsModal();
			}
		});

		// Add settings message handler to window message event
		const originalMessageHandler = window.onmessage;
		window.addEventListener('message', event => {
			const message = event.data;
			
			if (message.type === 'customSnippetsData') {
				// Update global custom snippets data
				customSnippetsData = message.data || {};
				// Refresh the snippets display
				loadCustomSnippets(customSnippetsData);
			} else if (message.type === 'customSnippetSaved') {
				// Refresh snippets after saving
				vscode.postMessage({
					type: 'getCustomSnippets'
				});
			} else if (message.type === 'customSnippetDeleted') {
				// Refresh snippets after deletion
				vscode.postMessage({
					type: 'getCustomSnippets'
				});
			} else if (message.type === 'claudeMdLoaded') {
				// Handle CLAUDE.md content loaded
				const contentEl = document.getElementById('claudeMdContent');
				const statusEl = document.getElementById('claudeMdStatus');
				const loadingEl = document.getElementById('claudeMdLoading');

				// Store the template for later use
				if (message.data.template) {
					claudeMdTemplate = message.data.template;
				}

				if (contentEl) {
					contentEl.value = message.data.content;
					contentEl.disabled = false;
					originalClaudeMdContent = message.data.content;

					// Add change listener to track modifications
					contentEl.onchange = contentEl.oninput = () => {
						const isModified = contentEl.value !== originalClaudeMdContent;
						updateClaudeMdStatus(isModified);
					};
				}

				if (statusEl) {
					statusEl.textContent = message.data.exists ? 'Loaded from file' : 'New file - empty';
					statusEl.style.color = 'var(--vscode-descriptionForeground)';
				}

				if (loadingEl) loadingEl.style.display = 'none';
			} else if (message.type === 'claudeMdSaved') {
				// Handle CLAUDE.md save success
				const contentEl = document.getElementById('claudeMdContent');
				const statusEl = document.getElementById('claudeMdStatus');
				const loadingEl = document.getElementById('claudeMdLoading');

				if (contentEl) {
					contentEl.disabled = false;
					originalClaudeMdContent = contentEl.value;
				}

				if (statusEl) {
					statusEl.textContent = 'Saved successfully';
					statusEl.style.color = 'var(--vscode-testing-iconPassed)';
				}

				if (loadingEl) loadingEl.style.display = 'none';

				// Reset status after a delay
				setTimeout(() => updateClaudeMdStatus(false), 2000);
			} else if (message.type === 'claudeMdError') {
				// Handle CLAUDE.md error
				const statusEl = document.getElementById('claudeMdStatus');
				const loadingEl = document.getElementById('claudeMdLoading');
				const contentEl = document.getElementById('claudeMdContent');

				if (statusEl) {
					statusEl.textContent = message.data || 'Error occurred';
					statusEl.style.color = 'var(--vscode-errorForeground)';
				}

				if (loadingEl) loadingEl.style.display = 'none';
				if (contentEl) contentEl.disabled = false;
			} else if (message.type === 'settingsData') {
				// Update UI with current settings
				const thinkingIntensity = message.data['thinking.intensity'] || 'think';
				const intensityValues = ['think', 'think-hard', 'think-harder', 'ultrathink'];
				const sliderValue = intensityValues.indexOf(thinkingIntensity);

				// Update thinking intensity modal if it exists
				const thinkingIntensitySlider = document.getElementById('thinkingIntensitySlider');
				if (thinkingIntensitySlider) {
					thinkingIntensitySlider.value = sliderValue >= 0 ? sliderValue : 0;
					updateThinkingIntensityDisplay(thinkingIntensitySlider.value);
				} else {
					// Update toggle name even if modal isn't open
					updateThinkingModeToggleName(sliderValue >= 0 ? sliderValue : 0);
				}
				
				document.getElementById('wsl-enabled').checked = message.data['wsl.enabled'] || false;
				document.getElementById('wsl-distro').value = message.data['wsl.distro'] || 'Ubuntu';
				document.getElementById('wsl-node-path').value = message.data['wsl.nodePath'] || '/usr/bin/node';
				document.getElementById('wsl-claude-path').value = message.data['wsl.claudePath'] || '/usr/local/bin/claude';
				// Set yolo mode state and update UI
				yoloModeEnabled = message.data['permissions.yoloMode'] || false;
				const yoloSwitch = document.getElementById('yoloModeSwitch');
				if (yoloSwitch) {
					if (yoloModeEnabled) {
						yoloSwitch.classList.add('active');
					} else {
						yoloSwitch.classList.remove('active');
					}
				}
				
				// Update yolo warning visibility
				updateYoloWarning();
				
				// Show/hide WSL options
				document.getElementById('wslOptions').style.display = message.data['wsl.enabled'] ? 'block' : 'none';
			}

			if (message.type === 'platformInfo') {
				// Check if user is on Windows and show WSL alert if not dismissed and WSL not already enabled
				if (message.data.isWindows && !message.data.wslAlertDismissed && !message.data.wslEnabled) {
					// Small delay to ensure UI is ready
					setTimeout(() => {
						showWSLAlert();
					}, 1000);
				}
			}
			
			if (message.type === 'permissionsData') {
				// Update permissions UI
				renderPermissions(message.data);
			}
		});

		function runAbMethod() {
			vscode.postMessage({
				type: 'runAbMethod'
			});
		}

	</script>`;

export default getScript;