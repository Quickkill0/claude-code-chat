/**
 * UI utility functions extracted from script.ts
 * These functions handle formatting, DOM manipulation, and markdown processing
 */

/**
 * Escapes HTML entities in text
 */
export function escapeHtml(text: string): string {
	// Fallback implementation that doesn't rely on DOM
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;');
}

/**
 * Formats a file path for display with truncation and click handler
 */
export function formatFilePath(filePath: string): string {
	if (!filePath) {return '';}

	// Extract just the filename
	const parts = filePath.split('/');
	const fileName = parts[parts.length - 1];

	return `<span class="file-path-truncated" title="${escapeHtml(filePath)}" data-file-path="${escapeHtml(filePath)}">${escapeHtml(fileName)}</span>`;
}

/**
 * Formats tool input for UI display with special handling for different tool types
 */
export function formatToolInputUI(input: any): string {
	if (!input || typeof input !== 'object') {
		const str = String(input);
		if (str.length > 100) {
			const truncateAt = 97;
			const truncated = str.substring(0, truncateAt);
			const inputId = 'input_' + Math.random().toString(36).substr(2, 9);

			return `<span id="${inputId}_visible">${escapeHtml(truncated)}</span>` +
				   `<span id="${inputId}_ellipsis">...</span>` +
				   `<span id="${inputId}_hidden" style="display: none;">${escapeHtml(str.substring(truncateAt))}</span>` +
				   `<div class="diff-expand-container">` +
				   `<button class="diff-expand-btn" onclick="toggleResultExpansion('${inputId}')">Show more</button>` +
				   `</div>`;
		}
		return str;
	}

	// Special handling for Read tool with file_path
	if (input.file_path && Object.keys(input).length === 1) {
		const formattedPath = formatFilePath(input.file_path);
		return `<div class="tool-input-file-path clickable-file-path" data-file-path="${escapeHtml(input.file_path)}">📁 ${formattedPath}</div>`;
	}

	// Handle Read tool with file_path and offset
	if (input.file_path && (input.offset !== undefined || input.limit !== undefined)) {
		const formattedPath = formatFilePath(input.file_path);
		const lineNumber = input.offset ? input.offset + 1 : null; // Convert 0-based offset to 1-based line number

		let result = `<div class="tool-input-file-path clickable-file-path" data-file-path="${escapeHtml(input.file_path)}"` +
					 (lineNumber ? ` data-line-number="${lineNumber}"` : '') + `>📁 ${formattedPath}</div>`;

		// Add offset and limit info
		if (input.offset !== undefined) {
			result += `<div class="tool-input-meta">offset: ${input.offset}</div>`;
		}
		if (input.limit !== undefined) {
			result += `<div class="tool-input-meta">limit: ${input.limit}</div>`;
		}

		return result;
	}

	// Special handling for Write tool
	if (input.file_path && input.content && Object.keys(input).length === 2) {
		const formattedPath = formatFilePath(input.file_path);
		const contentLength = input.content ? input.content.length : 0;
		return `<div class="tool-input-file-path clickable-file-path" data-file-path="${escapeHtml(input.file_path)}">📄 ${formattedPath}</div>` +
			   `<div class="tool-input-meta">Writing ${contentLength} characters</div>`;
	}

	// Format as JSON for other objects
	try {
		const jsonStr = JSON.stringify(input, null, 2);
		if (jsonStr.length > 200) {
			const truncated = jsonStr.substring(0, 200);
			const inputId = 'input_' + Math.random().toString(36).substr(2, 9);

			return `<pre id="${inputId}_visible">${escapeHtml(truncated)}</pre>` +
				   `<span id="${inputId}_ellipsis">...</span>` +
				   `<pre id="${inputId}_hidden" style="display: none;">${escapeHtml(jsonStr.substring(200))}</pre>` +
				   `<div class="diff-expand-container">` +
				   `<button class="diff-expand-btn" onclick="toggleResultExpansion('${inputId}')">Show more</button>` +
				   `</div>`;
		}
		return `<pre>${escapeHtml(jsonStr)}</pre>`;
	} catch (e) {
		return escapeHtml(String(input));
	}
}

/**
 * Formats Edit tool input as a diff view
 */
export function formatEditToolDiff(input: any): string {
	if (!input || typeof input !== 'object') {
		return formatToolInputUI(input);
	}

	// Check if this is an Edit tool (has file_path, old_string, new_string)
	if (!input.file_path || !input.old_string || !input.new_string) {
		return formatToolInputUI(input);
	}

	// Format file path with better display
	const formattedPath = formatFilePath(input.file_path);
	let result = `<div class="diff-file-path clickable-file-path" data-file-path="${escapeHtml(input.file_path)}">${formattedPath}</div>\n`;

	// Create diff view
	const oldLines = input.old_string.split('\n');
	const newLines = input.new_string.split('\n');
	const allLines = [...oldLines.map((line: string) => ({type: 'removed', content: line})),
					 ...newLines.map((line: string) => ({type: 'added', content: line}))];

	const maxLines = 6;
	const shouldTruncate = allLines.length > maxLines;
	const displayLines = shouldTruncate ? allLines.slice(0, maxLines) : allLines;

	const diffId = 'diff_' + Math.random().toString(36).substr(2, 9);

	result += `<div class="edit-diff">`;
	result += `<div id="${diffId}_visible">`;

	for (const line of displayLines) {
		const prefix = line.type === 'removed' ? '-' : '+';
		const className = line.type === 'removed' ? 'diff-removed' : 'diff-added';
		result += `<div class="${className}"><span class="diff-prefix">${prefix}</span>${escapeHtml(line.content)}</div>`;
	}

	result += `</div>`;

	if (shouldTruncate) {
		const remainingLines = allLines.slice(maxLines);
		result += `<div id="${diffId}_hidden" style="display: none;">`;

		for (const line of remainingLines) {
			const prefix = line.type === 'removed' ? '-' : '+';
			const className = line.type === 'removed' ? 'diff-removed' : 'diff-added';
			result += `<div class="${className}"><span class="diff-prefix">${prefix}</span>${escapeHtml(line.content)}</div>`;
		}

		result += `</div>`;
		result += `<div class="diff-expand-container">`;
		result += `<button class="diff-expand-btn" onclick="toggleDiffExpansion('${diffId}')">Show ${remainingLines.length} more lines</button>`;
		result += `</div>`;
	}

	result += `</div>`;

	return result;
}

/**
 * Formats MultiEdit tool input as multiple diff views
 */
export function formatMultiEditToolDiff(input: any): string {
	if (!input || typeof input !== 'object') {
		return formatToolInputUI(input);
	}

	// Check if this is a MultiEdit tool (has file_path and edits array)
	if (!input.file_path || !Array.isArray(input.edits)) {
		return formatToolInputUI(input);
	}

	const formattedPath = formatFilePath(input.file_path);
	let result = `<div class="diff-file-path clickable-file-path" data-file-path="${escapeHtml(input.file_path)}">${formattedPath}</div>\n`;

	result += `<div class="multi-edit-summary">Making ${input.edits.length} edit${input.edits.length !== 1 ? 's' : ''}</div>`;

	// Show each edit as a mini diff
	for (let i = 0; i < input.edits.length; i++) {
		const edit = input.edits[i];
		result += formatSingleEdit(edit, i + 1);
	}

	return result;
}

/**
 * Formats a single edit within a MultiEdit operation
 */
function formatSingleEdit(edit: any, editNumber: number): string {
	if (!edit.old_string || !edit.new_string) {
		return `<div class="edit-item">Edit ${editNumber}: ${escapeHtml(JSON.stringify(edit))}</div>`;
	}

	const oldLines = edit.old_string.split('\n');
	const newLines = edit.new_string.split('\n');

	let result = `<div class="edit-item">`;
	result += `<div class="edit-number">Edit ${editNumber}:</div>`;
	result += `<div class="mini-diff">`;

	// Show removed lines
	for (const line of oldLines) {
		result += `<div class="diff-removed"><span class="diff-prefix">-</span>${escapeHtml(line)}</div>`;
	}

	// Show added lines
	for (const line of newLines) {
		result += `<div class="diff-added"><span class="diff-prefix">+</span>${escapeHtml(line)}</div>`;
	}

	result += `</div></div>`;
	return result;
}

/**
 * Formats Write tool input as a diff-like view
 */
export function formatWriteToolDiff(input: any): string {
	if (!input || typeof input !== 'object') {
		return formatToolInputUI(input);
	}

	// Check if this is a Write tool (has file_path and content)
	if (!input.file_path || !input.content) {
		return formatToolInputUI(input);
	}

	const formattedPath = formatFilePath(input.file_path);
	let result = `<div class="diff-file-path clickable-file-path" data-file-path="${escapeHtml(input.file_path)}">${formattedPath}</div>\n`;

	const lines = input.content.split('\n');
	const maxLines = 10;
	const shouldTruncate = lines.length > maxLines;
	const displayLines = shouldTruncate ? lines.slice(0, maxLines) : lines;

	const diffId = 'write_' + Math.random().toString(36).substr(2, 9);

	result += `<div class="write-content">`;
	result += `<div class="write-summary">Writing ${lines.length} line${lines.length !== 1 ? 's' : ''} to file</div>`;
	result += `<div id="${diffId}_visible">`;

	for (const line of displayLines) {
		result += `<div class="code-line">${escapeHtml(line)}</div>`;
	}

	result += `</div>`;

	if (shouldTruncate) {
		const remainingLines = lines.slice(maxLines);
		result += `<div id="${diffId}_hidden" style="display: none;">`;

		for (const line of remainingLines) {
			result += `<div class="code-line">${escapeHtml(line)}</div>`;
		}

		result += `</div>`;
		result += `<div class="diff-expand-container">`;
		result += `<button class="diff-expand-btn" onclick="toggleDiffExpansion('${diffId}')">Show ${remainingLines.length} more lines</button>`;
		result += `</div>`;
	}

	result += `</div>`;

	return result;
}

/**
 * Parses simple markdown and converts it to HTML
 */
export function parseSimpleMarkdown(markdown: string): string {
	// First, handle code blocks before line-by-line processing
	let processedMarkdown = markdown;

	// Store code blocks temporarily to protect them from further processing
	const codeBlockPlaceholders: string[] = [];

	// Handle multi-line code blocks with triple backticks
	const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
	processedMarkdown = processedMarkdown.replace(codeBlockRegex, function(match, lang, code) {
		const language = lang || 'plaintext';
		// Process code line by line to preserve formatting like diff implementation
		const codeLines = code.split('\n');
		let codeHtml = '';

		for (const line of codeLines) {
			const escapedLine = escapeHtml(line);
			codeHtml += `<div class="code-line">${escapedLine}</div>`;
		}

		const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
		const placeholder = `__CODEBLOCK_${codeBlockPlaceholders.length}__`;

		const fullCodeBlock = `<div class="code-block">` +
							 `<div class="code-header">` +
							 `<span class="code-language">${language}</span>` +
							 `<button class="copy-code-btn" onclick="copyCodeBlock('${codeId}')" title="Copy code">` +
							 `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">` +
							 `<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>` +
							 `</svg>` +
							 `</button>` +
							 `</div>` +
							 `<div class="code-content" id="${codeId}">` +
							 codeHtml +
							 `</div>` +
							 `</div>`;

		codeBlockPlaceholders.push(fullCodeBlock);
		return placeholder;
	});

	// Handle inline code with single backticks, but not within code blocks
	processedMarkdown = processedMarkdown.replace(/`([^`\n]+)`/g, '<code>$1</code>');

	// Process line by line for other markdown features
	const lines = processedMarkdown.split('\n');
	const processedLines = lines.map(line => {
		// Skip processing lines that contain code block placeholders
		if (line.includes('__CODEBLOCK_')) {
			return line;
		}

		// Headers
		if (line.startsWith('### ')) {
			return `<h3>${escapeHtml(line.substring(4))}</h3>`;
		} else if (line.startsWith('## ')) {
			return `<h2>${escapeHtml(line.substring(3))}</h2>`;
		} else if (line.startsWith('# ')) {
			return `<h1>${escapeHtml(line.substring(2))}</h1>`;
		}

		// Bold and italic (need to handle before escaping)
		let processedLine = line;

		// Bold **text**
		processedLine = processedLine.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

		// Italic *text*
		processedLine = processedLine.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

		// Unordered lists
		if (processedLine.match(/^\s*[-*+]\s/)) {
			const indent = processedLine.match(/^\s*/)?.[0].length || 0;
			const content = processedLine.replace(/^\s*[-*+]\s/, '');
			const marginLeft = indent * 20;
			return `<div style="margin-left: ${marginLeft}px;">• ${content}</div>`;
		}

		// Ordered lists
		if (processedLine.match(/^\s*\d+\.\s/)) {
			const indent = processedLine.match(/^\s*/)?.[0].length || 0;
			const match = processedLine.match(/^\s*(\d+)\.\s(.*)$/);
			if (match) {
				const number = match[1];
				const content = match[2];
				const marginLeft = indent * 20;
				return `<div style="margin-left: ${marginLeft}px;">${number}. ${content}</div>`;
			}
		}

		// Links [text](url)
		processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

		// Empty lines become breaks
		if (processedLine.trim() === '') {
			return '<br>';
		}

		return processedLine;
	});

	let result = processedLines.join('\n');

	// Restore code blocks
	codeBlockPlaceholders.forEach((codeBlock, index) => {
		result = result.replace(`__CODEBLOCK_${index}__`, codeBlock);
	});

	return result;
}

/**
 * Checks if window and document are available (for DOM operations)
 * Note: This is intended for client-side script usage only
 */
export function isDOMAvailable(): boolean {
	return typeof globalThis !== 'undefined' &&
		   'window' in globalThis &&
		   'document' in globalThis;
}

/**
 * Gets an element by ID safely
 * Note: This is intended for client-side script usage only
 */
export function getElementById(id: string): any | null {
	if (!isDOMAvailable()) {return null;}
	const doc = (globalThis as any).document;
	return doc ? doc.getElementById(id) : null;
}

/**
 * Checks if user should auto-scroll based on current scroll position
 * Note: This is intended for client-side script usage only
 */
export function shouldAutoScroll(messagesDiv: any): boolean {
	const threshold = 100; // pixels from bottom
	const scrollTop = messagesDiv.scrollTop;
	const scrollHeight = messagesDiv.scrollHeight;
	const clientHeight = messagesDiv.clientHeight;

	return (scrollTop + clientHeight >= scrollHeight - threshold);
}

/**
 * Scrolls to bottom if needed based on auto-scroll check
 * Note: This is intended for client-side script usage only
 */
export function scrollToBottomIfNeeded(messagesDiv: any, shouldScroll: boolean | null = null): void {
	// If shouldScroll is not provided, check current scroll position
	if (shouldScroll === null) {
		shouldScroll = shouldAutoScroll(messagesDiv);
	}

	if (shouldScroll) {
		messagesDiv.scrollTop = messagesDiv.scrollHeight;
	}
}