const styles = `
<style>
    /* Enhanced animations and smooth transitions */
    :root {
        --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        --message-enter: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        --hover-scale: 1.02;
        --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.1);
        --shadow-medium: 0 4px 20px rgba(0, 0, 0, 0.15);
        --shadow-heavy: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    * {
        scrollbar-width: thin;
        scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
    }

    *::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    *::-webkit-scrollbar-track {
        background: transparent;
    }

    *::-webkit-scrollbar-thumb {
        background-color: var(--vscode-scrollbarSlider-background);
        border-radius: 4px;
        transition: background-color 0.2s ease;
    }

    *::-webkit-scrollbar-thumb:hover {
        background-color: var(--vscode-scrollbarSlider-hoverBackground);
    }

    body {
        font-family: var(--vscode-font-family);
        background: 
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.01) 0%, transparent 50%),
            linear-gradient(135deg, 
                var(--vscode-editor-background) 0%, 
                color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-panel-border) 5%) 100%);
        color: var(--vscode-editor-foreground);
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
    }

    body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
            linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        opacity: 0.5;
        z-index: 0;
    }

    .header {
        padding: 16px 24px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background: linear-gradient(135deg,
            var(--vscode-panel-background) 0%,
            color-mix(in srgb, var(--vscode-panel-background) 98%, var(--vscode-focusBorder) 2%) 100%);
        backdrop-filter: blur(10px) saturate(180%);
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 100;
        box-shadow: var(--shadow-light);
        transition: var(--chat-transition);
    }

    .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
            transparent 0%, 
            var(--vscode-focusBorder) 50%, 
            transparent 100%);
        opacity: 0.3;
    }

    .header:hover {
        box-shadow: var(--shadow-medium);
    }

    .header h2 {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        background: linear-gradient(135deg, 
            var(--vscode-foreground) 0%, 
            color-mix(in srgb, var(--vscode-foreground) 80%, var(--vscode-focusBorder) 20%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.2px;
        position: relative;
        transition: var(--chat-transition);
    }

    .header h2::after {
        content: attr(data-text);
        position: absolute;
        left: 0;
        top: 0;
        background: linear-gradient(135deg, 
            color-mix(in srgb, var(--vscode-focusBorder) 50%, transparent 50%) 0%, 
            color-mix(in srgb, var(--vscode-focusBorder) 30%, transparent 70%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: blur(1px);
        opacity: 0;
        z-index: -1;
        transition: opacity 0.3s ease;
    }

    .header:hover h2::after {
        opacity: 1;
    }

    .controls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .btn {
        background: linear-gradient(135deg, 
            var(--vscode-button-background) 0%, 
            color-mix(in srgb, var(--vscode-button-background) 90%, var(--vscode-focusBorder) 10%) 100%);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: var(--chat-transition);
        display: flex;
        align-items: center;
        gap: 6px;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        user-select: none;
    }

    .btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            transparent 100%);
        transition: left 0.5s ease;
    }

    .btn:hover::before {
        left: 100%;
    }

    .btn:hover {
        transform: translateY(-1px) scale(var(--hover-scale));
        box-shadow: var(--shadow-medium);
        border-color: var(--vscode-focusBorder);
        background: linear-gradient(135deg, 
            var(--vscode-button-hoverBackground) 0%, 
            color-mix(in srgb, var(--vscode-button-hoverBackground) 85%, var(--vscode-focusBorder) 15%) 100%);
    }

    .btn:active {
        transform: translateY(0) scale(0.98);
        box-shadow: var(--shadow-light);
        transition-duration: 0.1s;
    }

    .btn.outlined {
        background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.05) 0%, 
            rgba(255, 255, 255, 0.01) 100%);
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
        backdrop-filter: blur(10px);
    }

    .btn.outlined::before {
        background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.08) 50%, 
            transparent 100%);
    }

    .btn.outlined:hover {
        background: linear-gradient(135deg, 
            var(--vscode-list-hoverBackground) 0%, 
            color-mix(in srgb, var(--vscode-list-hoverBackground) 90%, var(--vscode-focusBorder) 10%) 100%);
        border-color: var(--vscode-focusBorder);
        transform: translateY(-1px) scale(var(--hover-scale));
        box-shadow: var(--shadow-medium);
    }

    .btn.small {
        padding: 4px 8px;
        font-size: 11px;
        min-width: auto;
    }

    .btn.stop {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 400;
        opacity: 0.7;
    }

    .btn.stop:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border-color: rgba(231, 76, 60, 0.3);
        opacity: 1;
    }

    /* Permission Request */
    .permission-request {
        margin: 4px 12px 20px 12px;
        background-color: rgba(252, 188, 0, 0.1);
        border: 1px solid rgba(252, 188, 0, 0.3);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: slideUp 0.3s ease;
    }

    .permission-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .permission-header .icon {
        font-size: 16px;
    }

    .permission-menu {
        position: relative;
        margin-left: auto;
    }

    .permission-menu-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s ease;
        line-height: 1;
    }

    .permission-menu-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        color: var(--vscode-foreground);
    }

    .permission-menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 220px;
        padding: 4px 0;
        margin-top: 4px;
    }

    .permission-menu-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 16px;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        color: var(--vscode-foreground);
        transition: background-color 0.2s ease;
    }

    .permission-menu-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .permission-menu-item .menu-icon {
        font-size: 16px;
        margin-top: 1px;
        flex-shrink: 0;
    }

    .permission-menu-item .menu-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .permission-menu-item .menu-title {
        font-weight: 500;
        font-size: 13px;
        line-height: 1.2;
    }

    .permission-menu-item .menu-subtitle {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
        line-height: 1.2;
    }

    .permission-content {
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-descriptionForeground);
    }



    .permission-tool {
        font-family: var(--vscode-editor-font-family);
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 8px 10px;
        margin: 8px 0;
        font-size: 12px;
        color: var(--vscode-editor-foreground);
    }

    .permission-buttons {
        margin-top: 2px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
    }

    .permission-buttons .btn {
        font-size: 12px;
        padding: 6px 12px;
        min-width: 70px;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        border-radius: 4px;
        border: 1px solid;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .permission-buttons .btn.allow {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .permission-buttons .btn.allow:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .permission-buttons .btn.deny {
        background-color: transparent;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
    }

    .permission-buttons .btn.deny:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .permission-buttons .btn.always-allow {
        background-color: rgba(0, 122, 204, 0.1);
        color: var(--vscode-charts-blue);
        border-color: rgba(0, 122, 204, 0.3);
        font-weight: 500;
        min-width: auto;
        padding: 6px 14px;
        height: 28px;
    }

    .permission-buttons .btn.always-allow:hover {
        background-color: rgba(0, 122, 204, 0.2);
        border-color: rgba(0, 122, 204, 0.5);
        transform: translateY(-1px);
    }

    .permission-buttons .btn.always-allow code {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: var(--vscode-editor-font-family);
        font-size: 11px;
        color: var(--vscode-editor-foreground);
        margin-left: 4px;
        display: inline;
        line-height: 1;
        vertical-align: baseline;
    }

    .permission-decision {
        font-size: 13px;
        font-weight: 600;
        padding: 8px 12px;
        text-align: center;
        border-radius: 4px;
        margin-top: 8px;
    }

    .permission-decision.allowed {
        background-color: rgba(0, 122, 204, 0.15);
        color: var(--vscode-charts-blue);
        border: 1px solid rgba(0, 122, 204, 0.3);
    }

    .permission-decision.denied {
        background-color: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .permission-decided {
        opacity: 0.7;
        pointer-events: none;
    }

    .permission-decided .permission-buttons {
        display: none;
    }

    .permission-decided.allowed {
        border-color: var(--vscode-inputValidation-infoBackground);
        background-color: rgba(0, 122, 204, 0.1);
    }

    .permission-decided.denied {
        border-color: var(--vscode-inputValidation-errorBorder);
        background-color: var(--vscode-inputValidation-errorBackground);
    }

    /* Permissions Management */
    .permissions-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background-color: var(--vscode-input-background);
        margin-top: 8px;
    }

    .permission-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 6px;
        padding-right: 6px;
        border-bottom: 1px solid var(--vscode-panel-border);
        transition: background-color 0.2s ease;
        min-height: 32px;
    }

    .permission-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .permission-item:last-child {
        border-bottom: none;
    }

    .permission-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-grow: 1;
        min-width: 0;
    }

    .permission-tool {
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 3px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
        height: 18px;
        display: inline-flex;
        align-items: center;
        line-height: 1;
    }

    .permission-command {
        font-size: 12px;
        color: var(--vscode-foreground);
        flex-grow: 1;
    }

    .permission-command code {
        background-color: var(--vscode-textCodeBlock-background);
        padding: 3px 6px;
        border-radius: 3px;
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-textLink-foreground);
        font-size: 11px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        line-height: 1;
    }

    .permission-desc {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-style: italic;
        flex-grow: 1;
        height: 18px;
        display: inline-flex;
        align-items: center;
        line-height: 1;
    }

    .permission-remove-btn {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.2s ease;
        font-weight: 500;
        flex-shrink: 0;
        opacity: 0.7;
    }

    .permission-remove-btn:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: var(--vscode-errorForeground);
        opacity: 1;
    }

    .permissions-empty {
        padding: 16px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        font-size: 13px;
    }

    .permissions-empty::before {
        content: "🔒";
        display: block;
        font-size: 16px;
        margin-bottom: 8px;
        opacity: 0.5;
    }

    /* Add Permission Form */
    .permissions-add-section {
        margin-top: 6px;
    }

    .permissions-show-add-btn {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 6px 8px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 400;
        opacity: 0.7;
    }

    .permissions-show-add-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        opacity: 1;
    }

    .permissions-add-form {
        margin-top: 8px;
        padding: 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background-color: var(--vscode-input-background);
        animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .permissions-form-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
    }

    .permissions-tool-select {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 12px;
        min-width: 100px;
        height: 24px;
        flex-shrink: 0;
    }

    .permissions-command-input {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 12px;
        flex-grow: 1;
        height: 24px;
        font-family: var(--vscode-editor-font-family);
    }

    .permissions-command-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .permissions-add-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 3px;
        padding: 4px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        height: 24px;
        font-weight: 500;
        flex-shrink: 0;
    }

    .permissions-add-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .permissions-add-btn:disabled {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        cursor: not-allowed;
        opacity: 0.5;
    }

    .permissions-cancel-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 4px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 24px;
        font-weight: 500;
    }

    .permissions-cancel-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .permissions-form-hint {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        line-height: 1.3;
    }

    .yolo-mode-section {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        opacity: 1;
        transition: opacity 0.2s ease;
    }

    .yolo-mode-section:hover {
        opacity: 1;
    }

    .yolo-mode-section input[type="checkbox"] {
        transform: scale(0.9);
        margin: 0;
    }

    .yolo-mode-section label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        font-weight: 400;
    }

    /* WSL Alert */
    .wsl-alert {
        margin: 8px 12px;
        background-color: rgba(135, 206, 235, 0.1);
        border: 2px solid rgba(135, 206, 235, 0.3);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .wsl-alert-content {
        display: flex;
        align-items: center;
        padding: 14px 18px;
        gap: 14px;
    }

    .wsl-alert-icon {
        font-size: 22px;
        flex-shrink: 0;
    }

    .wsl-alert-text {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-foreground);
    }

    .wsl-alert-text strong {
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .wsl-alert-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }

    .wsl-alert-actions .btn {
        padding: 6px 14px;
        font-size: 12px;
        border-radius: 6px;
    }

    .wsl-alert-actions .btn:first-child {
        background-color: rgba(135, 206, 235, 0.2);
        border-color: rgba(135, 206, 235, 0.4);
    }

    .wsl-alert-actions .btn:first-child:hover {
        background-color: rgba(135, 206, 235, 0.3);
        border-color: rgba(135, 206, 235, 0.6);
    }

    .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        backdrop-filter: blur(10px);
    }

    .chat-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 50% 0%, 
            rgba(255, 255, 255, 0.02) 0%, 
            transparent 50%);
        pointer-events: none;
        z-index: 1;
    }

    .messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: 1.5;
        position: relative;
        z-index: 2;
        scroll-behavior: smooth;
        mask-image: linear-gradient(to bottom, 
            transparent 0px, 
            black 8px, 
            black calc(100% - 8px), 
            transparent 100%);
    }

    .messages::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, 
            var(--vscode-scrollbarSlider-background) 0%, 
            color-mix(in srgb, var(--vscode-scrollbarSlider-background) 80%, var(--vscode-focusBorder) 20%) 100%);
        border-radius: 6px;
    }

    .message {
        margin-bottom: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        animation: messageSlideIn 0.4s var(--message-enter) forwards;
        transition: var(--chat-transition);
        position: relative;
        backdrop-filter: blur(10px) saturate(120%);
        will-change: transform, opacity;
    }

    .message:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-medium);
    }

    .message:last-child {
        margin-bottom: 0;
    }

    @keyframes messageSlideIn {
        0% { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
            filter: blur(2px);
        }
        50% {
            opacity: 0.5;
            transform: translateY(10px) scale(0.98);
            filter: blur(1px);
        }
        100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
            filter: blur(0px);
        }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Typing indicator animation */
    @keyframes typingPulse {
        0%, 20% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
        80%, 100% { transform: scale(0.8); opacity: 0.5; }
    }

    .typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        margin: 8px 0;
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
    }

    .typing-indicator .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--vscode-descriptionForeground);
        animation: typingPulse 1.5s ease-in-out infinite;
    }

    .typing-indicator .dot:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator .dot:nth-child(3) {
        animation-delay: 0.4s;
    }

    /* Floating animation for buttons */
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
    }

    /* Glow animation for focus states */
    @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px rgba(var(--vscode-focusBorder), 0.5); }
        50% { box-shadow: 0 0 20px rgba(var(--vscode-focusBorder), 0.8); }
    }

    /* Shimmer effect for loading */
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }

    .loading-shimmer {
        background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            transparent 100%);
        background-size: 200% 100%;
        animation: shimmer 2s ease-in-out infinite;
    }

    /* Smooth scroll-to-bottom button */
    .scroll-to-bottom {
        position: fixed;
        bottom: 140px;
        right: 24px;
        width: 44px;
        height: 44px;
        border-radius: 22px;
        background: linear-gradient(135deg, 
            var(--vscode-button-background) 0%, 
            color-mix(in srgb, var(--vscode-button-background) 85%, var(--vscode-focusBorder) 15%) 100%);
        border: 1px solid var(--vscode-panel-border);
        color: var(--vscode-button-foreground);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        opacity: 0;
        visibility: hidden;
        transition: var(--chat-transition);
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow-medium);
        z-index: 1000;
    }

    .scroll-to-bottom.visible {
        opacity: 0.9;
        visibility: visible;
        animation: float 3s ease-in-out infinite;
    }

    .scroll-to-bottom:hover {
        opacity: 1;
        transform: translateY(-2px) scale(1.05);
        box-shadow: var(--shadow-heavy);
    }

    .message.user {
        border: 1px solid rgba(139, 92, 246, 0.2);
        background: linear-gradient(135deg, 
            rgba(139, 92, 246, 0.08) 0%, 
            rgba(139, 92, 246, 0.04) 30%,
            rgba(139, 92, 246, 0.01) 70%,
            transparent 100%);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        position: relative;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(139, 92, 246, 0.1);
    }

    .message.user:hover {
        border-color: rgba(139, 92, 246, 0.3);
        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);
    }

    .message.user::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, 
            #8B5CF6 0%, 
            #7C3AED 50%, 
            #6D28D9 100%);
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
    }

    .message.claude {
        border: 1px solid rgba(34, 197, 94, 0.2);
        background: linear-gradient(135deg, 
            rgba(34, 197, 94, 0.08) 0%, 
            rgba(34, 197, 94, 0.04) 30%,
            rgba(34, 197, 94, 0.01) 70%,
            transparent 100%);
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(34, 197, 94, 0.1);
    }

    .message.claude:hover {
        border-color: rgba(34, 197, 94, 0.3);
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.15);
    }

    .message.claude::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, 
            #22C55E 0%, 
            #16A34A 50%, 
            #15803D 100%);
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
    }

    .message.error {
        border: 1px solid rgba(231, 76, 60, 0.2);
        background: linear-gradient(90deg, rgba(231, 76, 60, 0.05) 0%, transparent 50%);
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
    }

    .message.error::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
    }

    .message.system {
        background: linear-gradient(90deg, rgba(127, 140, 141, 0.04) 0%, transparent 100%);
        border: 1px solid rgba(127, 140, 141, 0.15);
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        font-size: 12px;
        padding: 4px 8px;
        position: relative;
        overflow: hidden;
    }

    .message.system::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: rgba(127, 140, 141, 0.5);
    }

    .message.tool {
        border: 1px solid rgba(120, 139, 237, 0.1);
        background: linear-gradient(90deg, rgba(120, 139, 237, 0.02) 0%, transparent 50%);
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
        padding: 5px 8px;
    }

    .message.tool::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #7c8bed 0%, #5d6fe1 100%);
    }

    .message.tool-result {
        border: 1px solid rgba(28, 192, 140, 0.15);
        background: linear-gradient(90deg, rgba(28, 192, 140, 0.02) 0%, transparent 50%);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        white-space: pre-wrap;
        position: relative;
        overflow: hidden;
        padding: 5px 8px;
    }

    .message.tool-result::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #1cc08c 0%, #16a974 100%);
    }

    .message.thinking {
        border: 1px solid rgba(186, 85, 211, 0.15);
        background: linear-gradient(90deg, rgba(186, 85, 211, 0.03) 0%, transparent 50%);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        font-style: italic;
        opacity: 0.9;
        position: relative;
        overflow: hidden;
    }

    .message.thinking::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #ba55d3 0%, #9932cc 100%);
    }

    .tool-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tool-icon {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        background: linear-gradient(135deg, #7c8bed 0%, #5d6fe1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 4px;
    }

    .tool-info {
        font-weight: 500;
        font-size: 11px;
        color: var(--vscode-editor-foreground);
        opacity: 0.8;
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        padding-bottom: 3px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        position: relative;
    }

    .copy-btn {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .message:hover .copy-btn {
        opacity: 0.7;
    }

    .copy-btn:hover {
        opacity: 1;
        background-color: var(--vscode-list-hoverBackground);
    }

    .message-icon {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 2px;
    }

    .message-icon.user {
        background: linear-gradient(135deg, #8B5CF6 0%, #6639B8 100%);
    }

    .message-icon.claude {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    }

    .message-icon.system {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    }

    .message-icon.error {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .message-label {
        font-weight: 500;
        font-size: 10px;
        opacity: 0.65;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    .message-content {
        padding-left: 2px;
        font-size: 13px;
        line-height: 1.5;
        width: 100%;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    /* Code blocks generated by markdown parser only */
    .message-content pre.code-block {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 12px;
        margin: 8px 0;
        overflow-x: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
    }

    .message-content pre.code-block code {
        background: none;
        border: none;
        padding: 0;
        color: var(--vscode-editor-foreground);
    }

    .code-line {
        white-space: pre-wrap;
        word-break: break-word;
    }

    /* Code block container and header */
    .code-block-container {
        margin: 8px 0;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        background-color: var(--vscode-textCodeBlock-background);
        overflow: hidden;
    }

    .code-block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        background-color: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        font-size: 10px;
    }

    .code-block-language {
        color: var(--vscode-descriptionForeground);
        font-family: var(--vscode-editor-font-family);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .code-copy-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: 0.7;
    }

    .code-copy-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        opacity: 1;
    }

    .code-block-container .code-block {
        margin: 0;
        border: none;
        border-radius: 0;
        background: none;
    }

    /* Inline code */
    .message-content code {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 2px 4px;
        font-family: var(--vscode-editor-font-family);
        font-size: 0.9em;
        color: var(--vscode-editor-foreground);
    }

    .priority-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 6px;
    }

    .priority-badge.high {
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .priority-badge.medium {
        background: rgba(243, 156, 18, 0.15);
        color: #f39c12;
        border: 1px solid rgba(243, 156, 18, 0.3);
    }

    .priority-badge.low {
        background: rgba(149, 165, 166, 0.15);
        color: #95a5a6;
        border: 1px solid rgba(149, 165, 166, 0.3);
    }

    .tool-input {
        padding: 3px 4px;
        font-family: var(--vscode-editor-font-family);
        font-size: 11px;
        line-height: 1.3;
        white-space: pre-line;
        opacity: 0.9;
    }

    .tool-input-label {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .tool-input-content {
        color: var(--vscode-editor-foreground);
        opacity: 0.95;
    }

    /* Diff display styles for Edit tool */
    .diff-container {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        overflow: hidden;
    }

    .diff-header {
        background-color: var(--vscode-panel-background);
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-foreground);
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .diff-removed,
    .diff-added {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
    }

    .diff-line {
        padding: 2px 12px;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .diff-line.removed {
        background-color: rgba(244, 67, 54, 0.1);
        border-left: 3px solid rgba(244, 67, 54, 0.6);
        color: var(--vscode-foreground);
    }

    .diff-line.added {
        background-color: rgba(76, 175, 80, 0.1);
        border-left: 3px solid rgba(76, 175, 80, 0.6);
        color: var(--vscode-foreground);
    }

    .diff-line.removed::before {
        content: '';
        color: rgba(244, 67, 54, 0.8);
        font-weight: 600;
        margin-right: 8px;
    }

    .diff-line.added::before {
        content: '';
        color: rgba(76, 175, 80, 0.8);
        font-weight: 600;
        margin-right: 8px;
    }

    .diff-expand-container {
        padding: 8px 12px;
        text-align: center;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
    }

    .diff-expand-btn {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.15) 0%, rgba(64, 165, 255, 0.1) 100%);
        border: 1px solid rgba(64, 165, 255, 0.3);
        color: #40a5ff;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .diff-expand-btn:hover {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.25) 0%, rgba(64, 165, 255, 0.15) 100%);
        border-color: rgba(64, 165, 255, 0.5);
    }

    .diff-expand-btn:active {
        transform: translateY(1px);
    }

    /* MultiEdit specific styles */
    .single-edit {
        margin-bottom: 12px;
    }

    .edit-number {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--vscode-descriptionForeground);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-top: 6px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .diff-edit-separator {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        margin: 12px 0;
    }

    /* File path display styles */
    .diff-file-path {
        padding: 8px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .diff-file-path:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .diff-file-path:active {
        transform: translateY(1px);
    }

    .file-path-short,
    .file-path-truncated {
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .file-path-truncated {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 2px 4px;
        border-radius: 3px;
    }

    .file-path-truncated .file-icon {
        font-size: 14px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    .file-path-truncated:hover {
        color: var(--vscode-textLink-foreground);
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-path-truncated:hover .file-icon {
        opacity: 1;
    }

    .file-path-truncated:active {
        transform: translateY(1px);
    }

    .expand-btn {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.15) 0%, rgba(64, 165, 255, 0.1) 100%);
        border: 1px solid rgba(64, 165, 255, 0.3);
        color: #40a5ff;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        margin-left: 6px;
        display: inline-block;
        transition: all 0.2s ease;
    }

    .expand-btn:hover {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.25) 0%, rgba(64, 165, 255, 0.15) 100%);
        border-color: rgba(64, 165, 255, 0.5);
        transform: translateY(-1px);
    }

    .expanded-content {
        margin-top: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        position: relative;
    }

    .expanded-content::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #40a5ff 0%, #0078d4 100%);
        border-radius: 0 0 0 6px;
    }

    .expanded-content pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .input-container {
        padding: 16px 20px;
        border-top: 1px solid var(--vscode-panel-border);
        background: linear-gradient(135deg,
            var(--vscode-panel-background) 0%,
            color-mix(in srgb, var(--vscode-panel-background) 98%, var(--vscode-focusBorder) 2%) 100%);
        backdrop-filter: blur(15px) saturate(150%);
        display: flex;
        flex-direction: column;
        position: relative;
        box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.08);
    }

    .input-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
            transparent 0%, 
            var(--vscode-focusBorder) 50%, 
            transparent 100%);
        opacity: 0.2;
    }

    .input-modes {
        display: flex;
        gap: 16px;
        align-items: center;
        padding-bottom: 5px;
        font-size: 9.5px;
    }

    .mode-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--vscode-foreground);
        opacity: 0.8;
        transition: opacity 0.2s ease;
    }

    .mode-toggle span {
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .mode-toggle span:hover {
        opacity: 1;
    }

    .mode-toggle:hover {
        opacity: 1;
    }

    .mode-switch {
        position: relative;
        width: 26px;
        height: 14px;
        background-color: var(--vscode-panel-border);
        border-radius: 7px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .mode-switch.active {
        background-color: var(--vscode-button-background);
    }

    .mode-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        background-color: var(--vscode-foreground);
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .mode-switch.active::after {
        transform: translateX(10px);
        background-color: var(--vscode-button-foreground);
    }

    .textarea-container {
        display: flex;
        gap: 10px;
        align-items: flex-end;
    }

    .textarea-wrapper {
        flex: 1;
        background: linear-gradient(135deg,
            var(--vscode-input-background) 0%,
            color-mix(in srgb, var(--vscode-input-background) 95%, var(--vscode-focusBorder) 5%) 100%);
        border: 1px solid var(--vscode-input-border);
        border-radius: 12px;
        overflow: hidden;
        transition: var(--chat-transition);
        backdrop-filter: blur(10px);
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .textarea-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 
            inset 0 1px 3px rgba(0, 0, 0, 0.05),
            0 0 0 3px color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent 80%),
            0 2px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    /* Context Files Container - Above Input */
    .context-files-container {
        padding: 6px 10px;
        background-color: var(--vscode-input-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        min-height: 28px;
        max-height: 100px;
        overflow-y: auto;
    }

    .context-files-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
    }

    .context-file-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 8px;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        max-width: 180px;
        animation: chipSlideIn 0.2s ease;
    }

    @keyframes chipSlideIn {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .context-file-chip.folder {
        background-color: rgba(255, 193, 7, 0.15);
        color: var(--vscode-foreground);
    }

    .context-file-chip.root {
        background-color: rgba(76, 175, 80, 0.15);
        color: var(--vscode-foreground);
    }

    .context-file-chip.image {
        background-color: rgba(156, 39, 176, 0.15);
        color: var(--vscode-foreground);
    }

    .context-file-chip .file-icon {
        flex-shrink: 0;
        font-size: 12px;
    }

    .context-file-chip .file-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        font-size: 11px;
    }

    .context-file-chip .remove-btn {
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--vscode-foreground);
        cursor: pointer;
        padding: 0;
        margin: 0;
        margin-left: 2px;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        opacity: 0.6;
        transition: all 0.2s ease;
        font-size: 11px;
    }

    .context-file-chip .remove-btn:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.1);
    }

    /* Inline file chips in user messages */
    .context-references {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--vscode-panel-border);
        width: 100%;
        box-sizing: border-box;
    }

    .inline-file-chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 1px 5px;
        margin: 2px;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 8px;
        font-size: 10px;
        font-weight: 500;
        line-height: 1.3;
    }

    .inline-file-chip .file-icon {
        font-size: 11px;
    }

    .message-text {
        margin-top: 4px;
    }

    .input-field {
        width: 100%;
        box-sizing: border-box;
        background-color: transparent;
        color: var(--vscode-input-foreground);
        border: none;
        padding: 12px;
        outline: none;
        font-family: var(--vscode-editor-font-family);
        min-height: 120px;
        line-height: 1.4;
        overflow-y: auto;
        resize: none;
        max-height: 300px;
    }

    .input-field:focus {
        border: none;
        outline: none;
    }

    .input-field::placeholder {
        color: var(--vscode-input-placeholderForeground);
        border: none;
        outline: none;
    }

    .input-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 2px 4px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-input-background);
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .model-selector {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .model-selector:hover {
        background-color: rgba(128, 128, 128, 0.25);
        opacity: 1;
    }

    .tools-btn {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tools-btn:hover {
        background-color: rgba(128, 128, 128, 0.25);
        opacity: 1;
    }

    .slash-btn,
    .at-btn,
    .ab-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .slash-btn:hover,
    .at-btn:hover,
    .ab-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .image-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: all 0.2s ease;
        padding-top: 6px;
    }

    .image-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .send-btn {
        background: linear-gradient(135deg, 
            var(--vscode-button-background) 0%, 
            color-mix(in srgb, var(--vscode-button-background) 85%, var(--vscode-focusBorder) 15%) 100%);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 8px 16px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: var(--chat-transition);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow-light);
        user-select: none;
    }

    .send-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.2) 50%, 
            transparent 100%);
        transition: left 0.5s ease;
    }

    .send-btn:hover::before {
        left: 100%;
    }

    .send-btn div {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
    }

    .send-btn span {
        line-height: 1;
    }

    .send-btn:hover {
        background: linear-gradient(135deg, 
            var(--vscode-button-hoverBackground) 0%, 
            color-mix(in srgb, var(--vscode-button-hoverBackground) 80%, var(--vscode-focusBorder) 20%) 100%);
        transform: translateY(-1px) scale(1.05);
        box-shadow: var(--shadow-medium);
    }

    .send-btn:active {
        transform: translateY(0) scale(0.98);
        transition-duration: 0.1s;
    }

    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .send-btn:disabled:hover {
        transform: none;
        background: linear-gradient(135deg, 
            var(--vscode-button-background) 0%, 
            color-mix(in srgb, var(--vscode-button-background) 85%, var(--vscode-focusBorder) 15%) 100%);
    }

    .secondary-button {
        background-color: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .secondary-button:hover {
        background-color: var(--vscode-button-secondaryHoverBackground, rgba(128, 128, 128, 0.3));
        border-color: var(--vscode-focusBorder);
    }

    .right-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .yolo-warning {
        font-size: 12px;
        color: var(--vscode-foreground);
        text-align: center;
        font-weight: 500;
        background-color: rgba(255, 99, 71, 0.08);
        border: 1px solid rgba(255, 99, 71, 0.2);
        padding: 8px 12px;
        margin: 4px 4px;
        border-radius: 4px;
        animation: slideDown 0.3s ease;
    }

    .yolo-suggestion {
        margin-top: 6px;
        padding: 6px 8px;
        background-color: rgba(252, 188, 0, 0.05);
        border: 1px solid rgba(252, 188, 0, 0.2);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        animation: slideUp 0.2s ease;
    }

    .yolo-suggestion-text {
        font-size: 11px;
        color: var(--vscode-foreground);
        flex-grow: 1;
        opacity: 0.9;
    }

    .yolo-suggestion-btn {
        background: linear-gradient(135deg, rgba(252, 188, 0, 0.12) 0%, rgba(252, 188, 0, 0.08) 100%);
        color: #fcbc00;
        border: 1px solid rgba(252, 188, 0, 0.25);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        font-weight: 500;
        flex-shrink: 0;
    }

    .yolo-suggestion-btn:hover {
        background: linear-gradient(135deg, rgba(252, 188, 0, 0.18) 0%, rgba(252, 188, 0, 0.12) 100%);
        border-color: rgba(252, 188, 0, 0.35);
        transform: translateY(-1px);
    }

    /* Enhanced Modal System with Glass-morphism */
    .file-picker-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
            radial-gradient(circle at 30% 40%, rgba(0, 0, 0, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
        backdrop-filter: blur(12px) saturate(120%);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        animation: modalFadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes modalFadeIn {
        from {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to {
            opacity: 1;
            backdrop-filter: blur(12px) saturate(120%);
        }
    }

    .file-picker-modal.closing {
        animation: modalFadeOut 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
    }

    @keyframes modalFadeOut {
        from {
            opacity: 1;
            backdrop-filter: blur(12px) saturate(120%);
        }
        to {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
    }

    .file-picker-content {
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-focusBorder) 5%) 0%,
                var(--vscode-editor-background) 100%);
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 70%, var(--vscode-focusBorder) 30%);
        border-radius: 16px;
        width: 500px;
        max-width: 90vw;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px) saturate(180%);
        transform: scale(0.8) translateY(20px);
        animation: modalContentSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards;
        position: relative;
        overflow: hidden;
    }

    @keyframes modalContentSlideIn {
        from {
            transform: scale(0.8) translateY(20px);
            opacity: 0.8;
        }
        to {
            transform: scale(1) translateY(0);
            opacity: 1;
        }
    }

    .file-picker-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            color-mix(in srgb, var(--vscode-focusBorder) 50%, transparent 50%) 50%,
            transparent 100%);
        opacity: 0.6;
    }

    .file-picker-content.closing {
        animation: modalContentSlideOut 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
    }

    @keyframes modalContentSlideOut {
        from {
            transform: scale(1) translateY(0);
            opacity: 1;
        }
        to {
            transform: scale(0.85) translateY(-20px);
            opacity: 0;
        }
    }

    .file-picker-header {
        padding: 20px 24px;
        border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        display: flex;
        flex-direction: column;
        gap: 16px;
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-panel-background) 80%, var(--vscode-focusBorder) 20%) 0%,
                var(--vscode-panel-background) 100%);
        border-radius: 16px 16px 0 0;
        position: relative;
    }

    .file-picker-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 24px;
        right: 24px;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            var(--vscode-focusBorder) 50%,
            transparent 100%);
        opacity: 0.3;
    }

    .file-picker-header span {
        font-weight: 600;
        font-size: 16px;
        color: var(--vscode-foreground);
        background: linear-gradient(135deg,
            var(--vscode-foreground) 0%,
            color-mix(in srgb, var(--vscode-foreground) 80%, var(--vscode-focusBorder) 20%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .file-search-input {
        background:
            linear-gradient(135deg,
                var(--vscode-input-background) 0%,
                color-mix(in srgb, var(--vscode-input-background) 95%, var(--vscode-focusBorder) 5%) 100%);
        color: var(--vscode-input-foreground);
        border: 1px solid color-mix(in srgb, var(--vscode-input-border) 70%, var(--vscode-focusBorder) 30%);
        padding: 12px 16px;
        border-radius: 10px;
        outline: none;
        font-size: 14px;
        transition: var(--chat-transition);
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
    }

    .file-search-input:focus {
        border-color: var(--vscode-focusBorder);
        box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.15),
            0 0 0 2px color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent 80%),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
    }

    .file-search-input::placeholder {
        color: color-mix(in srgb, var(--vscode-input-foreground) 60%, transparent 40%);
    }

    /* Enhanced Modal Form Styles */
    .form-group {
        margin-bottom: 20px;
        opacity: 0;
        animation: formGroupSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .form-group:nth-child(1) { animation-delay: 0.1s; }
    .form-group:nth-child(2) { animation-delay: 0.15s; }
    .form-group:nth-child(3) { animation-delay: 0.2s; }
    .form-group:nth-child(4) { animation-delay: 0.25s; }
    .form-group:nth-child(5) { animation-delay: 0.3s; }

    @keyframes formGroupSlideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 14px;
        color: var(--vscode-foreground);
        background: linear-gradient(135deg,
            var(--vscode-foreground) 0%,
            color-mix(in srgb, var(--vscode-foreground) 85%, var(--vscode-focusBorder) 15%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .form-group input[type="text"],
    .form-group input[type="url"],
    .form-group select,
    .form-group textarea {
        width: 100%;
        background:
            linear-gradient(135deg,
                var(--vscode-input-background) 0%,
                color-mix(in srgb, var(--vscode-input-background) 95%, var(--vscode-focusBorder) 5%) 100%);
        color: var(--vscode-input-foreground);
        border: 1px solid color-mix(in srgb, var(--vscode-input-border) 70%, var(--vscode-focusBorder) 30%);
        padding: 12px 16px;
        border-radius: 10px;
        outline: none;
        font-size: 14px;
        transition: var(--chat-transition);
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        box-sizing: border-box;
    }

    .form-group textarea {
        resize: vertical;
        min-height: 80px;
        font-family: var(--vscode-editor-font-family, monospace);
        line-height: 1.5;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        border-color: var(--vscode-focusBorder);
        box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.1),
            0 0 0 2px color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent 80%),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
    }

    .form-group input::placeholder,
    .form-group textarea::placeholder {
        color: color-mix(in srgb, var(--vscode-input-foreground) 60%, transparent 40%);
    }

    /* Enhanced Modal List Items */
    .tool-item,
    .mcp-server-item,
    .agents-item,
    .conversation-item {
        padding: 16px 20px;
        margin-bottom: 12px;
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-list-hoverBackground) 30%, transparent 70%) 0%,
                color-mix(in srgb, var(--vscode-list-hoverBackground) 10%, transparent 90%) 100%);
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        border-radius: 12px;
        cursor: pointer;
        transition: var(--chat-transition);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        opacity: 0;
        animation: listItemSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .tool-item:nth-child(1) { animation-delay: 0.1s; }
    .tool-item:nth-child(2) { animation-delay: 0.15s; }
    .tool-item:nth-child(3) { animation-delay: 0.2s; }
    .tool-item:nth-child(4) { animation-delay: 0.25s; }
    .tool-item:nth-child(5) { animation-delay: 0.3s; }
    .tool-item:nth-child(6) { animation-delay: 0.35s; }

    @keyframes listItemSlideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .tool-item::before,
    .mcp-server-item::before,
    .agents-item::before,
    .conversation-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%);
        transition: left 0.5s ease;
    }

    .tool-item:hover::before,
    .mcp-server-item:hover::before,
    .agents-item:hover::before,
    .conversation-item:hover::before {
        left: 100%;
    }

    .tool-item:hover,
    .mcp-server-item:hover,
    .agents-item:hover,
    .conversation-item:hover {
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-list-hoverBackground) 60%, transparent 40%) 0%,
                color-mix(in srgb, var(--vscode-list-hoverBackground) 30%, transparent 70%) 100%);
        border-color: var(--vscode-focusBorder);
        transform: translateY(-2px);
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .tool-item:active,
    .mcp-server-item:active,
    .agents-item:active,
    .conversation-item:active {
        transform: translateY(0);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.05);
    }

    /* MCP Server Status Indicators */
    .mcp-server-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        backdrop-filter: blur(10px);
        border: 1px solid;
        transition: var(--chat-transition);
        position: relative;
        overflow: hidden;
    }

    .mcp-server-status::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: inherit;
        opacity: 0.1;
        transition: opacity 0.3s ease;
    }

    .mcp-server-status:hover::before {
        opacity: 0.2;
    }

    .mcp-server-status.connected {
        background: linear-gradient(135deg,
            color-mix(in srgb, #22c55e 20%, transparent 80%),
            color-mix(in srgb, #22c55e 10%, transparent 90%));
        color: #22c55e;
        border-color: color-mix(in srgb, #22c55e 30%, transparent 70%);
    }

    .mcp-server-status.connected::before {
        background: #22c55e;
    }

    .mcp-server-status.disconnected {
        background: linear-gradient(135deg,
            color-mix(in srgb, #ef4444 20%, transparent 80%),
            color-mix(in srgb, #ef4444 10%, transparent 90%));
        color: #ef4444;
        border-color: color-mix(in srgb, #ef4444 30%, transparent 70%);
    }

    .mcp-server-status.disconnected::before {
        background: #ef4444;
    }

    .mcp-server-status.connecting {
        background: linear-gradient(135deg,
            color-mix(in srgb, #f59e0b 20%, transparent 80%),
            color-mix(in srgb, #f59e0b 10%, transparent 90%));
        color: #f59e0b;
        border-color: color-mix(in srgb, #f59e0b 30%, transparent 70%);
        animation: pulse 2s infinite;
    }

    .mcp-server-status.connecting::before {
        background: #f59e0b;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    /* Agent Status and Color Indicators */
    .agent-color-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--vscode-panel-border);
        position: relative;
        overflow: hidden;
        transition: var(--chat-transition);
    }

    .agent-color-indicator::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 50%;
        background: inherit;
        opacity: 0.2;
        transform: scale(1.5);
        transition: var(--chat-transition);
    }

    .agent-color-indicator:hover::before {
        transform: scale(2);
        opacity: 0.1;
    }

    .agent-color-indicator.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .agent-color-indicator.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .agent-color-indicator.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .agent-color-indicator.cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .agent-color-indicator.yellow { background: linear-gradient(135deg, #eab308, #ca8a04); }
    .agent-color-indicator.purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
    .agent-color-indicator.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
    .agent-color-indicator.pink { background: linear-gradient(135deg, #ec4899, #db2777); }

    /* Enhanced Button Styles for Modals */
    .form-buttons {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        margin-right: 8px;
        padding-top: 24px;
        border-top: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        justify-content: flex-end;
    }

    .form-buttons .btn {
        min-width: 100px;
        padding: 12px 24px;
        font-weight: 600;
    }

    .form-buttons .btn.primary {
        background: linear-gradient(135deg,
            var(--vscode-button-background) 0%,
            color-mix(in srgb, var(--vscode-button-background) 85%, var(--vscode-focusBorder) 15%) 100%);
        box-shadow:
            0 4px 16px color-mix(in srgb, var(--vscode-button-background) 30%, transparent 70%),
            0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .form-buttons .btn.primary:hover {
        background: linear-gradient(135deg,
            var(--vscode-button-hoverBackground) 0%,
            color-mix(in srgb, var(--vscode-button-hoverBackground) 85%, var(--vscode-focusBorder) 15%) 100%);
        box-shadow:
            0 8px 24px color-mix(in srgb, var(--vscode-button-background) 40%, transparent 60%),
            0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Loading and Progress Indicators */
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent 80%);
        border-top: 2px solid var(--vscode-focusBorder);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Tab Enhancement for Modals */
    .mcp-scope-tabs,
    .agents-scope-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 20px;
        padding: 4px;
        background: color-mix(in srgb, var(--vscode-panel-background) 50%, transparent 50%);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
    }

    .mcp-scope-tab,
    .agents-scope-tab {
        flex: 1;
        padding: 10px 16px;
        border: none;
        background: transparent;
        color: var(--vscode-foreground);
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: var(--chat-transition);
        position: relative;
        overflow: hidden;
    }

    .mcp-scope-tab::before,
    .agents-scope-tab::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%);
        transition: left 0.3s ease;
    }

    .mcp-scope-tab:hover::before,
    .agents-scope-tab:hover::before {
        left: 100%;
    }

    .mcp-scope-tab.active,
    .agents-scope-tab.active {
        background: linear-gradient(135deg,
            var(--vscode-button-background) 0%,
            color-mix(in srgb, var(--vscode-button-background) 85%, var(--vscode-focusBorder) 15%) 100%);
        color: var(--vscode-button-foreground);
        box-shadow:
            0 2px 8px color-mix(in srgb, var(--vscode-button-background) 30%, transparent 70%),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .mcp-scope-tab:hover,
    .agents-scope-tab:hover {
        background: color-mix(in srgb, var(--vscode-list-hoverBackground) 60%, transparent 40%);
        transform: translateY(-1px);
    }

    .mcp-scope-tab.active:hover,
    .agents-scope-tab.active:hover {
        background: linear-gradient(135deg,
            var(--vscode-button-hoverBackground) 0%,
            color-mix(in srgb, var(--vscode-button-hoverBackground) 85%, var(--vscode-focusBorder) 15%) 100%);
    }

    /* Accessibility and Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
        .file-picker-modal,
        .tools-modal,
        .checkpoint-panel,
        .conversation-history,
        .form-group,
        .tool-item,
        .mcp-server-item,
        .agents-item,
        .conversation-item {
            animation: none !important;
            transition: none !important;
        }

        .file-picker-content,
        .tools-modal-content {
            transform: none !important;
        }

        .loading-spinner {
            animation: none !important;
        }

        .mcp-server-status.connecting {
            animation: none !important;
        }
    }

    /* Focus States for Accessibility */
    .tools-close-btn:focus-visible,
    .form-group input:focus-visible,
    .form-group select:focus-visible,
    .form-group textarea:focus-visible,
    .mcp-scope-tab:focus-visible,
    .agents-scope-tab:focus-visible {
        outline: 2px solid var(--vscode-focusBorder);
        outline-offset: 2px;
        border-radius: 4px;
    }

    .tool-item:focus-visible,
    .mcp-server-item:focus-visible,
    .agents-item:focus-visible,
    .conversation-item:focus-visible {
        outline: 2px solid var(--vscode-focusBorder);
        outline-offset: 2px;
        border-radius: 12px;
    }

    /* High Contrast Mode Support */
    @media (prefers-contrast: high) {
        .file-picker-modal,
        .tools-modal {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: none;
        }

        .file-picker-content,
        .tools-modal-content,
        .checkpoint-panel,
        .conversation-history {
            border-width: 2px;
            backdrop-filter: none;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .form-group input,
        .form-group select,
        .form-group textarea,
        .file-search-input {
            border-width: 2px;
            backdrop-filter: none;
        }

        .mcp-server-status,
        .agent-color-indicator {
            border-width: 2px;
        }
    }

    /* Dark/Light Theme Specific Enhancements */
    [data-vscode-theme-kind="vscode-dark"] {
        --modal-glow: 0 0 40px rgba(100, 149, 237, 0.1);
    }

    [data-vscode-theme-kind="vscode-light"] {
        --modal-glow: 0 0 40px rgba(0, 0, 0, 0.05);
    }

    /* Enhanced scroll styles for modals */
    .tools-modal-body,
    .conversation-list,
    .checkpoint-list {
        scrollbar-width: thin;
        scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
    }

    .tools-modal-body::-webkit-scrollbar,
    .conversation-list::-webkit-scrollbar,
    .checkpoint-list::-webkit-scrollbar {
        width: 6px;
    }

    .tools-modal-body::-webkit-scrollbar-track,
    .conversation-list::-webkit-scrollbar-track,
    .checkpoint-list::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 3px;
    }

    .tools-modal-body::-webkit-scrollbar-thumb,
    .conversation-list::-webkit-scrollbar-thumb,
    .checkpoint-list::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg,
            var(--vscode-scrollbarSlider-background),
            color-mix(in srgb, var(--vscode-scrollbarSlider-background) 80%, var(--vscode-focusBorder) 20%));
        border-radius: 3px;
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 50%, transparent 50%);
    }

    .tools-modal-body::-webkit-scrollbar-thumb:hover,
    .conversation-list::-webkit-scrollbar-thumb:hover,
    .checkpoint-list::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg,
            var(--vscode-scrollbarSlider-hoverBackground),
            color-mix(in srgb, var(--vscode-scrollbarSlider-hoverBackground) 80%, var(--vscode-focusBorder) 20%));
    }

    .file-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 4px;
    }

    .file-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 3px;
        font-size: 13px;
        gap: 8px;
    }

    .file-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-item.selected {
        background-color: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
    }

    .file-item.multi-selected {
        background-color: var(--vscode-list-inactiveSelectionBackground);
    }

    .file-item input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        cursor: pointer;
    }

    /* File picker footer */
    .file-picker-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
    }

    .file-icon {
        font-size: 16px;
        flex-shrink: 0;
    }

    .file-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .file-name {
        font-weight: 500;
    }

    .file-path {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .file-thumbnail {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        overflow: hidden;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .thumbnail-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
    }

    /* File picker mode toggle styles */
    .file-picker-title-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .file-picker-mode-toggle {
        display: flex;
        gap: 4px;
    }

    .mode-toggle-btn {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-button-border);
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
    }

    .mode-toggle-btn:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .mode-toggle-btn.active {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    /* File picker selection controls */
    .file-picker-selection-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--vscode-panel-border);
        margin-bottom: 8px;
    }

    .selection-info {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .selection-actions {
        display: flex;
        gap: 8px;
    }

    /* File picker breadcrumb styles */
    .file-picker-breadcrumb {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .breadcrumb-btn {
        background: none;
        border: none;
        color: var(--vscode-textLink-foreground);
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;
        font-size: 12px;
    }

    .breadcrumb-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .breadcrumb-separator {
        color: var(--vscode-descriptionForeground);
        margin: 0 2px;
    }

    /* Folder item specific styles */
    .file-item.folder {
        font-weight: 500;
    }

    .file-item.folder .file-icon {
        font-size: 14px;
    }

    .file-item.folder:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-item.folder .file-info .file-path {
        font-style: italic;
    }

    /* Folder navigation button styles */
    .folder-navigate-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: all 0.2s ease;
    }

    .folder-navigate-btn:hover {
        background-color: var(--vscode-toolbar-hoverBackground);
        color: var(--vscode-foreground);
        opacity: 1;
    }

    .folder-navigate-btn svg {
        pointer-events: none;
    }

    .file-item.folder {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .file-item.folder .file-info {
        flex: 1;
        min-width: 0;
    }

    .tools-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
            radial-gradient(circle at 30% 40%, rgba(0, 0, 0, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
        backdrop-filter: blur(12px) saturate(120%);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        animation: modalFadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .tools-modal-content {
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-focusBorder) 5%) 0%,
                var(--vscode-editor-background) 100%);
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 70%, var(--vscode-focusBorder) 30%);
        border-radius: 16px;
        width: 800px;
        max-width: 90vw;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px) saturate(180%);
        overflow: hidden;
        transform: scale(0.8) translateY(20px);
        animation: modalContentSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards;
        position: relative;
    }

    .tools-modal-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            color-mix(in srgb, var(--vscode-focusBorder) 50%, transparent 50%) 50%,
            transparent 100%);
        opacity: 0.6;
    }

    .tools-modal-content.closing {
        animation: modalContentSlideOut 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
    }

    .tools-modal-header {
        padding: 24px 32px;
        border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-panel-background) 80%, var(--vscode-focusBorder) 20%) 0%,
                var(--vscode-panel-background) 100%);
        border-radius: 16px 16px 0 0;
        position: relative;
    }

    .tools-modal-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 32px;
        right: 32px;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            var(--vscode-focusBorder) 50%,
            transparent 100%);
        opacity: 0.3;
    }

    .tools-modal-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 24px 32px;
        background:
            linear-gradient(to bottom,
                var(--vscode-editor-background) 0%,
                color-mix(in srgb, var(--vscode-editor-background) 98%, var(--vscode-panel-border) 2%) 100%);
    }

    .tools-modal-header span {
        font-weight: 600;
        font-size: 18px;
        color: var(--vscode-foreground);
        background: linear-gradient(135deg,
            var(--vscode-foreground) 0%,
            color-mix(in srgb, var(--vscode-foreground) 80%, var(--vscode-focusBorder) 20%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.2px;
    }

    .tools-close-btn {
        background: linear-gradient(135deg,
            color-mix(in srgb, var(--vscode-button-background) 50%, transparent 50%) 0%,
            color-mix(in srgb, var(--vscode-button-background) 30%, transparent 70%) 100%);
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        color: var(--vscode-foreground);
        cursor: pointer;
        font-size: 16px;
        padding: 8px 12px;
        border-radius: 8px;
        transition: var(--chat-transition);
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
    }

    .tools-close-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%);
        transition: left 0.3s ease;
    }

    .tools-close-btn:hover::before {
        left: 100%;
    }

    .tools-close-btn:hover {
        background: linear-gradient(135deg,
            color-mix(in srgb, var(--vscode-button-hoverBackground) 70%, transparent 30%) 0%,
            color-mix(in srgb, var(--vscode-button-hoverBackground) 50%, transparent 50%) 100%);
        border-color: var(--vscode-focusBorder);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tools-close-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .tools-beta-warning {
        padding: 12px 16px;
        background-color: var(--vscode-notifications-warningBackground);
        color: var(--vscode-notifications-warningForeground);
        font-size: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tools-list {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
    }

    /* MCP Modal content area improvements */
    #mcpModal * {
        box-sizing: border-box;
    }

    #mcpModal .tools-list {
        padding: 24px;
        max-height: calc(80vh - 120px);
        overflow-y: auto;
        width: 100%;
    }

    #mcpModal .mcp-servers-list {
        padding: 0;
    }

    #mcpModal .mcp-add-server {
        padding: 0;
    }

    #mcpModal .mcp-add-form {
        padding: 12px;
    }

    .tool-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 0;
        cursor: pointer;
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }

    .tool-item:last-child {
        border-bottom: none;
    }

    .tool-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        padding: 16px 12px;
        margin: 0 -12px;
    }

    .tool-item input[type="checkbox"], 
    .tool-item input[type="radio"] {
        margin: 0;
        margin-top: 2px;
        flex-shrink: 0;
    }

    .tool-item label {
        color: var(--vscode-foreground);
        font-size: 13px;
        cursor: pointer;
        flex: 1;
        line-height: 1.4;
    }

    .tool-item input[type="checkbox"]:disabled + label {
        opacity: 0.7;
    }

    /* Model selection specific styles */
    .model-explanatory-text {
        padding: 20px;
        padding-bottom: 0px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    .model-title {
        font-weight: 600;
        margin-bottom: 4px;
    }

    .model-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.3;
    }

    .model-option-content {
        flex: 1;
    }

    .default-model-layout {
        cursor: pointer;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        width: 100%;
    }

    .configure-button {
        margin-left: 12px;
        flex-shrink: 0;
        align-self: flex-start;
    }

    /* Thinking intensity slider */
    .thinking-slider-container {
        position: relative;
        padding: 0px 16px;
        margin: 12px 0;
    }

    .thinking-slider {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--vscode-panel-border);
        outline: none !important;
        border: none;
        cursor: pointer;
        border-radius: 2px;
    }

    .thinking-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--vscode-foreground);
        cursor: pointer;
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .thinking-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    .thinking-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--vscode-foreground);
        cursor: pointer;
        border-radius: 50%;
        border: none;
        transition: transform 0.2s ease;
    }

    .thinking-slider::-moz-range-thumb:hover {
        transform: scale(1.2);
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        padding: 0 8px;
    }

    .slider-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        transition: all 0.2s ease;
        text-align: center;
        width: 100px;
        cursor: pointer;
    }

    .slider-label:hover {
        opacity: 1;
        color: var(--vscode-foreground);
    }

    .slider-label.active {
        opacity: 1;
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .slider-label:first-child {
        margin-left: -50px;
    }

    .slider-label:last-child {
        margin-right: -50px;
    }

    .settings-group {
        padding-bottom: 20px;
        margin-bottom: 40px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .settings-group h3 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }


    /* Thinking intensity modal */
    .thinking-modal-description {
        padding: 0px 20px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
        text-align: center;
        margin: 20px;
        margin-bottom: 0px;
    }

    .thinking-modal-actions {
        padding-top: 20px;
        text-align: right;
        border-top: 1px solid var(--vscode-widget-border);
    }

    .confirm-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .confirm-btn:hover {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-focusBorder);
    }

    /* Slash commands modal */
    .slash-commands-search {
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        position: sticky;
        top: 0;
        background-color: var(--vscode-editor-background);
        z-index: 10;
    }

    .search-input-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        background-color: var(--vscode-input-background);
        transition: all 0.2s ease;
        position: relative;
    }

    .search-input-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .search-prefix {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        font-size: 13px;
        font-weight: 600;
        border-radius: 4px 0 0 4px;
        border-right: 1px solid var(--vscode-input-border);
    }

    .slash-commands-search input {
        flex: 1;
        padding: 8px 12px;
        border: none !important;
        background: transparent;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        outline: none !important;
        box-shadow: none !important;
    }

    .slash-commands-search input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }

    .slash-commands-search input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .command-input-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        background-color: var(--vscode-input-background);
        transition: all 0.2s ease;
        width: 100%;
        position: relative;
    }

    .command-input-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .command-prefix {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        font-size: 12px;
        font-weight: 600;
        border-radius: 4px 0 0 4px;
        border-right: 1px solid var(--vscode-input-border);
    }

    .slash-commands-section {
        margin-bottom: 32px;
    }

    .slash-commands-section:last-child {
        margin-bottom: 16px;
    }

    .slash-commands-section h3 {
        margin: 16px 20px 12px 20px;
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .slash-commands-info {
        padding: 12px 20px;
        background-color: rgba(255, 149, 0, 0.1);
        border: 1px solid rgba(255, 149, 0, 0.2);
        border-radius: 4px;
        margin: 0 20px 16px 20px;
    }

    .slash-commands-info p {
        margin: 0;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
        opacity: 0.9;
    }

    .prompt-snippet-item {
        border-left: 2px solid var(--vscode-charts-blue);
        background-color: rgba(0, 122, 204, 0.03);
    }

    .prompt-snippet-item:hover {
        background-color: rgba(0, 122, 204, 0.08);
    }

    .add-snippet-item {
        border-left: 2px solid var(--vscode-charts-green);
        background-color: rgba(0, 200, 83, 0.03);
        border-style: dashed;
    }

    .add-snippet-item:hover {
        background-color: rgba(0, 200, 83, 0.08);
        border-style: solid;
    }

    .add-snippet-form {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 16px;
        margin: 8px 0;
        animation: slideDown 0.2s ease;
    }

    .add-snippet-form .form-group {
        margin-bottom: 12px;
    }

    .add-snippet-form label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        font-size: 12px;
        color: var(--vscode-foreground);
    }

    .add-snippet-form textarea {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 3px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 12px;
        font-family: var(--vscode-font-family);
        box-sizing: border-box;
    }

    .add-snippet-form .command-input-wrapper input {
        flex: 1;
        padding: 6px 8px;
        border: none !important;
        background: transparent;
        color: var(--vscode-input-foreground);
        font-size: 12px;
        font-family: var(--vscode-font-family);
        outline: none !important;
        box-shadow: none !important;
    }

    .add-snippet-form .command-input-wrapper input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }

    .add-snippet-form textarea:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .add-snippet-form input::placeholder,
    .add-snippet-form textarea::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .add-snippet-form textarea {
        resize: vertical;
        min-height: 60px;
    }

    .add-snippet-form .form-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 12px;
    }

    .custom-snippet-item {
        position: relative;
    }

    .snippet-actions {
        display: flex;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-left: 8px;
    }

    .custom-snippet-item:hover .snippet-actions {
        opacity: 1;
    }

    .snippet-delete-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        font-size: 12px;
        transition: all 0.2s ease;
        opacity: 0.7;
    }

    .snippet-delete-btn:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: var(--vscode-errorForeground);
        opacity: 1;
    }

    .slash-commands-list {
        display: grid;
        gap: 6px;
        padding: 0 20px;
    }

    .slash-command-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        background-color: transparent;
    }

    .slash-command-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-list-hoverBackground);
    }

    .slash-command-icon {
        font-size: 16px;
        min-width: 20px;
        text-align: center;
        opacity: 0.8;
    }

    .slash-command-content {
        flex: 1;
    }

    .slash-command-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        margin-bottom: 2px;
    }

    .slash-command-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        line-height: 1.3;
    }

    /* Quick command input */
    .custom-command-item {
        cursor: default;
    }

    .custom-command-item .command-input-wrapper {
        margin-top: 4px;
        max-width: 200px;
    }

    .custom-command-item .command-input-wrapper input {
        flex: 1;
        padding: 4px 6px;
        border: none !important;
        background: transparent;
        color: var(--vscode-input-foreground);
        font-size: 11px;
        font-family: var(--vscode-editor-font-family);
        outline: none !important;
        box-shadow: none !important;
    }

    .custom-command-item .command-input-wrapper input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }

    .custom-command-item .command-input-wrapper input::placeholder {
        color: var(--vscode-input-placeholderForeground);
        opacity: 0.7;
    }

    .status {
        padding: 8px 12px;
        background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
        color: #e1e1e1;
        font-size: 12px;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        position: relative;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .status.ready .status-indicator {
        background-color: #00d26a;
        box-shadow: 0 0 6px rgba(0, 210, 106, 0.5);
    }

    .status.processing .status-indicator {
        background-color: #ff9500;
        box-shadow: 0 0 6px rgba(255, 149, 0, 0.5);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .status.error .status-indicator {
        background-color: #ff453a;
        box-shadow: 0 0 6px rgba(255, 69, 58, 0.5);
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
    }

    .status-text {
        flex: 1;
    }

    .todo-display {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        max-width: 50%;
    }

    .todo-icon {
        font-size: 14px;
        flex-shrink: 0;
    }

    .todo-text {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.9);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }

    pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
    }

    .session-badge {
        margin-left: 16px;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s, transform 0.1s;
    }

    .session-badge:hover {
        background-color: var(--vscode-button-hoverBackground);
        transform: scale(1.02);
    }

    .session-icon {
        font-size: 10px;
    }

    .session-label {
        opacity: 0.8;
        font-size: 10px;
    }

    .session-status {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        padding: 2px 6px;
        border-radius: 4px;
        background-color: var(--vscode-badge-background);
        border: 1px solid var(--vscode-panel-border);
    }

    .session-status.active {
        color: var(--vscode-terminal-ansiGreen);
        background-color: rgba(0, 210, 106, 0.1);
        border-color: var(--vscode-terminal-ansiGreen);
    }

    /* Markdown content styles */
    .message h1, .message h2, .message h3, .message h4 {
        margin: 0.8em 0 0.4em 0;
        font-weight: 600;
        line-height: 1.3;
    }

    .message h1 {
        font-size: 1.5em;
        border-bottom: 2px solid var(--vscode-panel-border);
        padding-bottom: 0.3em;
    }

    .message h2 {
        font-size: 1.3em;
        border-bottom: 1px solid var(--vscode-panel-border);
        padding-bottom: 0.2em;
    }

    .message h3 {
        font-size: 1.1em;
    }

    .message h4 {
        font-size: 1.05em;
    }

    .message strong {
        font-weight: 600;
        color: var(--vscode-terminal-ansiBrightWhite);
    }

    .message em {
        font-style: italic;
    }

    .message ul, .message ol {
        margin: 0.6em 0;
        padding-left: 1.5em;
    }

    .message li {
        margin: 0.3em 0;
        line-height: 1.4;
    }

    .message ul li {
        list-style-type: disc;
    }

    .message ol li {
        list-style-type: decimal;
    }

    .message p {
        margin: 0.5em 0;
        line-height: 1.6;
    }

    .message p:first-child {
        margin-top: 0;
    }

    .message p:last-child {
        margin-bottom: 0;
    }

    .message br {
        line-height: 1.2;
    }

    .restore-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px
    }

    .restore-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
    }

    .restore-btn.dark {
        background-color: #2d2d30;
        color: #999999;
    }

    .restore-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .restore-btn.dark:hover {
        background-color: #3e3e42;
    }

    .restore-date {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
    }

    .conversation-history {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 60px;
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-focusBorder) 5%) 0%,
                var(--vscode-editor-background) 100%);
        border: 1px solid color-mix(in srgb, var(--vscode-widget-border) 70%, var(--vscode-focusBorder) 30%);
        border-radius: 16px 16px 0 0;
        box-shadow:
            0 -8px 32px rgba(0, 0, 0, 0.15),
            0 -4px 16px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(20px) saturate(180%);
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px);
        animation: conversationSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        overflow: hidden;
    }

    @keyframes conversationSlideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .conversation-history::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            color-mix(in srgb, var(--vscode-focusBorder) 50%, transparent 50%) 50%,
            transparent 100%);
        opacity: 0.6;
    }

    .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 32px;
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-panel-background) 80%, var(--vscode-focusBorder) 20%) 0%,
                var(--vscode-panel-background) 100%);
        border-bottom: 1px solid color-mix(in srgb, var(--vscode-widget-border) 60%, transparent 40%);
        border-radius: 16px 16px 0 0;
        position: relative;
    }

    .conversation-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 32px;
        right: 32px;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            var(--vscode-focusBorder) 50%,
            transparent 100%);
        opacity: 0.3;
    }

    .conversation-header h3 {
        margin: 0;
        font-weight: 600;
        font-size: 18px;
        background: linear-gradient(135deg,
            var(--vscode-foreground) 0%,
            color-mix(in srgb, var(--vscode-foreground) 80%, var(--vscode-focusBorder) 20%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.2px;
    }

    .conversation-list {
        padding: 8px;
        overflow-y: auto;
        height: calc(100% - 60px);
    }

    .conversation-item {
        padding: 12px;
        margin: 4px 0;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 6px;
        cursor: pointer;
        background-color: var(--vscode-list-inactiveSelectionBackground);
    }

    .conversation-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .conversation-title {
        font-weight: 500;
        margin-bottom: 4px;
    }

    .conversation-meta {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
    }

    .conversation-preview {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
    }

    /* Tool loading animation */
    .tool-loading {
        padding: 16px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        background-color: var(--vscode-panel-background);
        border-top: 1px solid var(--vscode-panel-border);
    }

    .loading-spinner {
        display: flex;
        gap: 4px;
    }

    .loading-ball {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--vscode-button-background);
        animation: bounce 1.4s ease-in-out infinite both;
    }

    .loading-ball:nth-child(1) { animation-delay: -0.32s; }
    .loading-ball:nth-child(2) { animation-delay: -0.16s; }
    .loading-ball:nth-child(3) { animation-delay: 0s; }

    @keyframes bounce {
        0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .loading-text {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    /* Tool completion indicator */
    .tool-completion {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: rgba(76, 175, 80, 0.1);
        border-top: 1px solid rgba(76, 175, 80, 0.2);
        font-size: 12px;
    }

    .completion-icon {
        color: #4caf50;
        font-weight: bold;
    }

    .completion-text {
        color: var(--vscode-foreground);
        opacity: 0.8;
    }

    /* MCP Servers styles */
    .mcp-servers-list {
        padding: 4px;
    }

    .mcp-server-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        margin-bottom: 16px;
        background-color: var(--vscode-editor-background);
        transition: all 0.2s ease;
    }

    .mcp-server-item:hover {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .server-info {
        flex: 1;
    }

    .server-name {
        font-weight: 600;
        font-size: 16px;
        color: var(--vscode-foreground);
        margin-bottom: 8px;
    }

    .server-type {
        display: inline-block;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 8px;
    }

    .server-config {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.9;
        line-height: 1.4;
    }

    .server-delete-btn {
        padding: 8px 16px;
        font-size: 13px;
        color: var(--vscode-errorForeground);
        border-color: var(--vscode-errorForeground);
        min-width: 80px;
        justify-content: center;
    }

    .server-delete-btn:hover {
        background-color: var(--vscode-inputValidation-errorBackground);
        border-color: var(--vscode-errorForeground);
    }

    .server-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-shrink: 0;
    }

    .server-edit-btn {
        padding: 8px 16px;
        font-size: 13px;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
        min-width: 80px;
        transition: all 0.2s ease;
        justify-content: center;
    }

    .server-edit-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .mcp-add-server {
        text-align: center;
        margin-bottom: 24px;
        padding: 0 4px;
    }

    .mcp-add-form {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 24px;
        margin-top: 20px;
        box-sizing: border-box;
        width: 100%;
    }

    .form-group {
        margin-bottom: 20px;
        box-sizing: border-box;
        width: 100%;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        font-size: 13px;
        color: var(--vscode-foreground);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        max-width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: var(--vscode-font-family);
        box-sizing: border-box;
        resize: vertical;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .form-group textarea {
        resize: vertical;
        min-height: 60px;
    }

    .form-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .no-servers {
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        padding: 40px 20px;
    }

    /* Popular MCP Servers */
    .mcp-popular-servers {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--vscode-panel-border);
    }

    .mcp-popular-servers h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
        opacity: 0.9;
    }

    .popular-servers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
    }

    .popular-server-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .popular-server-item:hover {
        border-color: var(--vscode-focusBorder);
        background-color: var(--vscode-list-hoverBackground);
        transform: translateY(-1px);
    }

    .popular-server-icon {
        font-size: 24px;
        flex-shrink: 0;
    }

    .popular-server-info {
        flex: 1;
        min-width: 0;
    }

    .popular-server-name {
        font-weight: 600;
        font-size: 13px;
        color: var(--vscode-foreground);
        margin-bottom: 2px;
    }

    .popular-server-desc {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Enhanced MCP Modal Styles */
    .mcp-modal-content {
        max-width: 700px;
        width: 90vw;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .mcp-controls {
        padding: 16px 0;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .mcp-search-container {
        position: relative;
    }

    .mcp-search-container input {
        width: 100%;
        padding: 8px 12px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        color: var(--vscode-input-foreground);
        font-size: 13px;
    }

    .mcp-search-container input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .mcp-scope-tabs {
        display: flex;
        gap: 4px;
        background: var(--vscode-editor-background);
        border-radius: 6px;
        padding: 2px;
    }

    .mcp-scope-tab {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .mcp-scope-tab.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }

    .mcp-scope-tab:hover:not(.active) {
        background: var(--vscode-list-hoverBackground);
        color: var(--vscode-foreground);
    }

    .mcp-scope-info {
        padding: 12px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .mcp-scope-info span {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .mcp-stats {
        display: flex;
        gap: 16px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
    }

    .mcp-server-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px 0;
        max-height: 400px;
    }

    .mcp-server-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin-bottom: 8px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .mcp-server-card:hover {
        border-color: var(--vscode-focusBorder);
        background: var(--vscode-list-hoverBackground);
        transform: translateY(-1px);
    }

    .mcp-server-card.installed {
        border-left: 3px solid var(--vscode-gitDecoration-addedResourceForeground);
    }

    .mcp-server-card.installing {
        border-left: 3px solid var(--vscode-gitDecoration-modifiedResourceForeground);
        opacity: 0.7;
    }

    .mcp-server-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-hoverBackground) 100%);
        flex-shrink: 0;
    }

    .mcp-server-details {
        flex: 1;
        min-width: 0;
    }

    .mcp-server-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }

    .mcp-server-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--vscode-foreground);
    }

    .mcp-server-status {
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
    }

    .mcp-server-status.installed {
        background: var(--vscode-gitDecoration-addedResourceForeground);
        color: white;
    }

    .mcp-server-status.available {
        background: var(--vscode-descriptionForeground);
        color: white;
        opacity: 0.7;
    }

    .mcp-server-status.installing {
        background: var(--vscode-gitDecoration-modifiedResourceForeground);
        color: white;
    }

    .mcp-server-status.error {
        background: var(--vscode-errorForeground);
        color: white;
    }

    .mcp-server-description {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
        margin-bottom: 6px;
        line-height: 1.4;
    }

    .mcp-server-meta {
        display: flex;
        gap: 12px;
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.6;
    }

    .mcp-server-actions {
        display: flex;
        gap: 6px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .mcp-server-card:hover .mcp-server-actions {
        opacity: 1;
    }

    .mcp-action-btn {
        padding: 6px 8px;
        background: transparent;
        border: 1px solid var(--vscode-button-border);
        border-radius: 4px;
        color: var(--vscode-button-foreground);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .mcp-action-btn.primary {
        background: var(--vscode-button-background);
        border-color: var(--vscode-button-background);
    }

    .mcp-action-btn.primary:hover {
        background: var(--vscode-button-hoverBackground);
    }

    .mcp-action-btn:hover {
        background: var(--vscode-list-hoverBackground);
    }

    .mcp-action-btn.danger {
        border-color: var(--vscode-errorForeground);
        color: var(--vscode-errorForeground);
    }

    .mcp-action-btn.danger:hover {
        background: var(--vscode-errorForeground);
        color: white;
    }

    .mcp-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--vscode-descriptionForeground);
        gap: 12px;
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--vscode-panel-border);
        border-top: 2px solid var(--vscode-button-background);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .mcp-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
    }

    .mcp-empty-state .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .mcp-empty-state h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .mcp-empty-state p {
        margin: 0;
        font-size: 12px;
        opacity: 0.8;
        line-height: 1.4;
    }

    .mcp-actions {
        padding: 16px 16px 16px 0;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 8px;
        margin-right: 8px;
    }

    .mcp-actions .btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
    }

    /* Custom MCP Form Styles */
    .mcp-custom-form {
        padding: 20px;
    }

    .mcp-custom-form .form-group {
        margin-bottom: 16px;
    }

    .mcp-custom-form label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .mcp-custom-form input,
    .mcp-custom-form select,
    .mcp-custom-form textarea {
        width: 100%;
        padding: 8px 12px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: inherit;
    }

    .mcp-custom-form input:focus,
    .mcp-custom-form select:focus,
    .mcp-custom-form textarea:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .mcp-custom-form textarea {
        resize: vertical;
        min-height: 60px;
    }

    .mcp-server-card .install-progress {
        width: 100%;
        height: 2px;
        background: var(--vscode-panel-border);
        border-radius: 1px;
        overflow: hidden;
        margin-top: 8px;
    }

    .mcp-server-card .install-progress-bar {
        height: 100%;
        background: var(--vscode-button-background);
        border-radius: 1px;
        transition: width 0.3s ease;
        animation: progress-shimmer 1.5s infinite;
    }

    @keyframes progress-shimmer {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }

    /* MCP Install Section Styles */
    .mcp-install-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .mcp-scope-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
    }

    .mcp-scope-selector label {
        font-weight: 500;
        color: var(--foreground);
        white-space: nowrap;
    }

    .mcp-scope-dropdown {
        background: var(--input-background);
        border: 1px solid var(--input-border);
        border-radius: 4px;
        color: var(--foreground);
        font-size: 12px;
        padding: 4px 8px;
        min-width: 80px;
        cursor: pointer;
    }

    .mcp-scope-dropdown:focus {
        outline: none;
        border-color: var(--button-primary-background);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .mcp-install-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .mcp-action-btn.secondary {
        background: var(--button-secondary-background);
        color: var(--button-secondary-foreground);
        border: 1px solid var(--input-border);
    }

    .mcp-action-btn.secondary:hover {
        background: var(--input-background);
        border-color: var(--button-primary-background);
    }

    /* API Key Modal Styles */
    .form-help {
        display: block;
        font-size: 11px;
        color: var(--foreground-muted);
        margin-top: 4px;
        line-height: 1.3;
    }

    .form-input[type="password"] {
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
    }

    .mcp-modal-body .form-group {
        margin-bottom: 16px;
    }

    .mcp-modal-body .form-group:last-child {
        margin-bottom: 0;
    }

    /* API Key Overlay Modal Styles */
    .mcp-api-key-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: 12px;
    }

    .mcp-api-key-modal {
        background: var(--background);
        border: 1px solid var(--input-border);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        max-height: 80%;
        overflow: hidden;
    }

    .mcp-api-key-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--input-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--header-background);
    }

    .mcp-api-key-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--foreground);
    }

    .mcp-api-key-body {
        padding: 20px;
        max-height: 300px;
        overflow-y: auto;
    }

    .mcp-api-key-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--input-border);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background: var(--header-background);
    }

    /* Checkpoint Panel Styles */
    .checkpoint-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-focusBorder) 5%) 0%,
                var(--vscode-editor-background) 100%);
        border: 1px solid color-mix(in srgb, var(--vscode-panel-border) 70%, var(--vscode-focusBorder) 30%);
        border-radius: 16px;
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px) saturate(180%);
        width: 90%;
        max-width: 700px;
        max-height: 75vh;
        display: flex;
        flex-direction: column;
        z-index: 2000;
        opacity: 0;
        animation: modalContentSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        overflow: hidden;
        position: relative;
    }

    .checkpoint-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            color-mix(in srgb, var(--vscode-focusBorder) 50%, transparent 50%) 50%,
            transparent 100%);
        opacity: 0.6;
    }

    .checkpoint-panel.hidden {
        display: none;
    }

    .checkpoint-header {
        padding: 24px 32px;
        border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-panel-background) 80%, var(--vscode-focusBorder) 20%) 0%,
                var(--vscode-panel-background) 100%);
        border-radius: 16px 16px 0 0;
        position: relative;
    }

    .checkpoint-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 32px;
        right: 32px;
        height: 1px;
        background: linear-gradient(90deg,
            transparent 0%,
            var(--vscode-focusBorder) 50%,
            transparent 100%);
        opacity: 0.3;
    }

    .checkpoint-header h3 {
        margin: 0;
        font-weight: 600;
        font-size: 18px;
        background: linear-gradient(135deg,
            var(--vscode-foreground) 0%,
            color-mix(in srgb, var(--vscode-foreground) 80%, var(--vscode-focusBorder) 20%) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.2px;
    }

    .checkpoint-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .checkpoint-header .close-btn {
        background: transparent;
        border: none;
        color: var(--vscode-foreground);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        opacity: 0.7;
        transition: all 0.2s ease;
    }

    .checkpoint-header .close-btn:hover {
        opacity: 1;
        background: var(--vscode-button-background);
    }

    .checkpoint-description {
        padding: 12px 20px;
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        border-bottom: 1px solid var(--vscode-panel-border);
        background: var(--vscode-editor-background);
    }

    .checkpoint-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
    }

    .checkpoint-item {
        padding: 12px 16px;
        margin-bottom: 8px;
        background: var(--vscode-panel-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .checkpoint-item:hover {
        background: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .checkpoint-time {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
    }

    .checkpoint-message {
        font-size: 13px;
        color: var(--vscode-foreground);
        margin-bottom: 8px;
        line-height: 1.4;
    }

    .checkpoint-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .checkpoint-sha {
        font-family: monospace;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-editor-background);
        padding: 2px 6px;
        border-radius: 3px;
    }

    .checkpoint-restore-btn {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .checkpoint-restore-btn:hover {
        background: var(--vscode-button-hoverBackground);
    }

    .checkpoint-footer {
        padding: 12px 20px;
        border-top: 1px solid var(--vscode-panel-border);
        background: var(--vscode-panel-background);
        display: flex;
        justify-content: flex-end;
    }

    .refresh-btn {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 16px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .refresh-btn:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }

    .checkpoint-empty {
        padding: 32px 20px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-size: 13px;
        line-height: 1.5;
    }

    /* Agent Manager styles */
    .agents-modal-content {
        width: 800px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
    }

    .agents-controls {
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .agents-scope-tabs {
        display: flex;
        gap: 8px;
    }

    .agents-scope-tab {
        flex: 1;
        padding: 6px 12px;
        background: transparent;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        color: var(--vscode-foreground);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .agents-scope-tab.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .agents-scope-tab:hover:not(.active) {
        background: var(--vscode-list-hoverBackground);
    }

    .agents-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        min-height: 200px;
        max-height: 400px;
    }

    .agent-card {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .agent-card:hover {
        background: var(--vscode-list-hoverBackground);
        transform: translateX(2px);
    }

    .agent-color-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .agent-color-green { background: #28a745; }
    .agent-color-blue { background: #007bff; }
    .agent-color-red { background: #dc3545; }
    .agent-color-cyan { background: #17a2b8; }
    .agent-color-yellow { background: #ffc107; }
    .agent-color-purple { background: #6f42c1; }
    .agent-color-orange { background: #fd7e14; }
    .agent-color-pink { background: #e83e8c; }

    .agent-info {
        flex: 1;
    }

    .agent-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin-bottom: 2px;
    }

    .agent-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.9;
    }

    .agent-meta {
        display: flex;
        gap: 8px;
        margin-top: 4px;
    }

    .agent-badge {
        font-size: 10px;
        padding: 2px 6px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 3px;
    }

    .agent-actions-inline {
        display: flex;
        gap: 4px;
        margin-left: 12px;
    }

    .agent-action-btn {
        padding: 4px 8px;
        background: transparent;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        color: var(--vscode-foreground);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .agent-action-btn:hover {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .agents-actions {
        padding: 16px 20px;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        gap: 8px;
    }

    .agents-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--vscode-descriptionForeground);
    }

    .agents-empty-icon {
        font-size: 48px;
        opacity: 0.3;
        margin-bottom: 16px;
    }

    /* Agent Form styles */
    .agent-form {
        padding: 20px;
    }

    .agent-form .form-group {
        margin-bottom: 16px;
    }

    .agent-form label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .agent-form input,
    .agent-form select,
    .agent-form textarea {
        width: 100%;
        padding: 8px 12px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: inherit;
    }

    .agent-form input:focus,
    .agent-form select:focus,
    .agent-form textarea:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .agent-form textarea {
        resize: vertical;
        font-family: 'Cascadia Code', 'Courier New', monospace;
    }

    .form-hint {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
        opacity: 0.8;
    }

    /* AI Generate Form styles */
    .ai-generate-form {
        padding: 20px;
    }

    .ai-generate-form .form-group {
        margin-bottom: 16px;
    }

    .ai-generate-form label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .ai-generate-form textarea,
    .ai-generate-form select {
        width: 100%;
        padding: 8px 12px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: inherit;
    }

    .ai-generate-form textarea:focus,
    .ai-generate-form select:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .ai-generate-form textarea {
        resize: vertical;
    }

    /* Mode Selection Styles */
    .mode-selection-btn {
        position: relative;
        background: linear-gradient(135deg,
            color-mix(in srgb, var(--vscode-button-background) 20%, transparent 80%),
            color-mix(in srgb, var(--vscode-button-background) 10%, transparent 90%));
        border: 1px solid color-mix(in srgb, var(--vscode-button-background) 30%, transparent 70%);
    }

    .mode-selection-btn:hover {
        background: linear-gradient(135deg,
            color-mix(in srgb, var(--vscode-button-background) 30%, transparent 70%),
            color-mix(in srgb, var(--vscode-button-background) 15%, transparent 85%));
        border-color: color-mix(in srgb, var(--vscode-button-background) 40%, transparent 60%);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .mode-selection-content {
        width: 500px;
        max-width: 90vw;
    }

    .mode-selection-description {
        padding: 0 32px 20px 32px;
        color: var(--vscode-descriptionForeground);
        font-size: 13px;
        line-height: 1.5;
        background:
            linear-gradient(to bottom,
                transparent 0%,
                color-mix(in srgb, var(--vscode-panel-border) 5%, transparent 95%) 100%);
    }

    .mode-selection-options {
        padding: 0 32px 20px 32px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .mode-option {
        border: 2px solid color-mix(in srgb, var(--vscode-panel-border) 60%, transparent 40%);
        border-radius: 12px;
        padding: 16px 20px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-input-background) 95%, var(--vscode-focusBorder) 5%) 0%,
                var(--vscode-input-background) 100%);
        position: relative;
        overflow: hidden;
    }

    .mode-option::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg,
            color-mix(in srgb, var(--vscode-focusBorder) 8%, transparent 92%) 0%,
            transparent 50%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    .mode-option:hover {
        border-color: color-mix(in srgb, var(--vscode-focusBorder) 50%, transparent 50%);
        transform: translateY(-2px);
        box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.1),
            0 0 0 1px color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent 80%);
    }

    .mode-option:hover::before {
        opacity: 1;
    }

    .mode-option.selected {
        border-color: var(--vscode-focusBorder);
        background:
            linear-gradient(135deg,
                color-mix(in srgb, var(--vscode-focusBorder) 8%, var(--vscode-input-background) 92%) 0%,
                color-mix(in srgb, var(--vscode-focusBorder) 4%, var(--vscode-input-background) 96%) 100%);
        box-shadow:
            0 0 0 3px color-mix(in srgb, var(--vscode-focusBorder) 15%, transparent 85%),
            0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .mode-option.selected::before {
        opacity: 1;
    }

    .mode-option-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }

    .mode-radio {
        position: relative;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }

    .mode-radio input[type="radio"] {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
    }

    .radio-custom {
        position: absolute;
        top: 0;
        left: 0;
        width: 18px;
        height: 18px;
        border: 2px solid var(--vscode-panel-border);
        border-radius: 50%;
        background: var(--vscode-input-background);
        transition: all 0.2s ease;
    }

    .mode-radio input[type="radio"]:checked + .radio-custom {
        border-color: var(--vscode-focusBorder);
        background: linear-gradient(135deg,
            var(--vscode-focusBorder) 0%,
            color-mix(in srgb, var(--vscode-focusBorder) 80%, white 20%) 100%);
    }

    .radio-custom::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: white;
        transform: translate(-50%, -50%) scale(0);
        transition: transform 0.2s ease;
    }

    .mode-radio input[type="radio"]:checked + .radio-custom::after {
        transform: translate(-50%, -50%) scale(1);
    }

    .mode-title {
        font-weight: 600;
        font-size: 15px;
        color: var(--vscode-foreground);
        letter-spacing: -0.1px;
    }

    .mode-option .mode-description {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        line-height: 1.4;
        margin-left: 30px;
    }

    .mode-selection-actions {
        padding: 20px 32px 16px 32px;
        border-top: 1px solid color-mix(in srgb, var(--vscode-panel-border) 40%, transparent 60%);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background:
            linear-gradient(to bottom,
                transparent 0%,
                color-mix(in srgb, var(--vscode-panel-background) 50%, transparent 50%) 100%);
    }

    .mode-selection-actions .btn {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .mode-selection-actions .btn.outlined {
        background: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
    }

    .mode-selection-actions .btn.outlined:hover {
        background: color-mix(in srgb, var(--vscode-panel-border) 20%, transparent 80%);
        border-color: var(--vscode-focusBorder);
    }

    .mode-selection-actions .btn.primary {
        background: linear-gradient(135deg,
            var(--vscode-button-background) 0%,
            color-mix(in srgb, var(--vscode-button-background) 85%, black 15%) 100%);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-button-background);
    }

    .mode-selection-actions .btn.primary:hover {
        background: linear-gradient(135deg,
            color-mix(in srgb, var(--vscode-button-background) 90%, white 10%) 0%,
            var(--vscode-button-background) 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--vscode-button-background) 30%, transparent 70%);
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
        .mode-selection-content {
            width: 95vw;
        }

        .mode-selection-description,
        .mode-selection-options,
        .mode-selection-actions {
            padding-left: 20px;
            padding-right: 20px;
        }

        .mode-option {
            padding: 14px 16px;
        }

        .mode-title {
            font-size: 14px;
        }

        .mode-option .mode-description {
            font-size: 11px;
            margin-left: 26px;
        }
    }
</style>`;

export default styles;