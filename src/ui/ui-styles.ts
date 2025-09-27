const styles = `
<style>
    /* Enhanced CSS Variables for consistent theming */
    :root {
        --modal-backdrop: rgba(0, 0, 0, 0.65);
        --modal-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 10px 30px rgba(0, 0, 0, 0.2);
        --modal-border-radius: 12px;
        --button-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        --button-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.18);
        --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        --transition-spring: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        --header-glass-bg: rgba(var(--vscode-panel-background-rgb, 30, 30, 30), 0.95);
        --glow-primary: 0 0 20px rgba(0, 122, 204, 0.3);
        --glow-success: 0 0 20px rgba(40, 167, 69, 0.3);
        --glow-warning: 0 0 20px rgba(252, 188, 0, 0.3);
        --glow-error: 0 0 20px rgba(220, 53, 69, 0.3);
    }

    /* Enhanced animations keyframes */
    @keyframes modalFadeIn {
        0% {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        100% {
            opacity: 1;
            backdrop-filter: blur(12px);
        }
    }

    @keyframes modalSlideUp {
        0% {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @keyframes modalSlideDown {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
        }
    }

    @keyframes buttonPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    @keyframes fadeInUp {
        0% {
            opacity: 0;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes scaleIn {
        0% {
            opacity: 0;
            transform: scale(0.8);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 0.6;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }

    body {
        font-family: var(--vscode-font-family);
        background: radial-gradient(ellipse at center,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 1) 0%,
            rgba(var(--vscode-editor-background-rgb, 25, 25, 25), 1) 100%);
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
        right: 0;
        bottom: 0;
        background:
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.03) 0%, transparent 50%);
        pointer-events: none;
        z-index: -1;
        animation: backgroundShift 20s ease-in-out infinite;
    }

    @keyframes backgroundShift {
        0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
        50% { opacity: 0.8; transform: scale(1.05) rotate(1deg); }
    }

    .header {
        padding: 16px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        z-index: 100;
        animation: fadeInUp 0.6s ease-out;
    }

    .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--vscode-panel-background);
        opacity: 0.8;
        z-index: -1;
    }

    .header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--vscode-foreground);
        letter-spacing: -0.5px;
        background: linear-gradient(135deg, var(--vscode-foreground), rgba(var(--vscode-foreground), 0.7));
        -webkit-background-clip: text;
        background-clip: text;
        position: relative;
        transition: var(--transition-smooth);
    }

    .header h2:hover {
        transform: translateY(-1px);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .controls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .btn {
        background: linear-gradient(135deg, var(--vscode-button-background), rgba(var(--vscode-button-background), 0.8));
        color: var(--vscode-button-foreground);
        border: 1px solid transparent;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: var(--transition-smooth);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: relative;
        overflow: hidden;
        box-shadow: var(--button-shadow);
        letter-spacing: 0.25px;
        text-decoration: none;
        white-space: nowrap;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: var(--transition-smooth);
        z-index: 1;
    }

    .btn:hover::before {
        left: 100%;
    }

    .btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--button-shadow-hover);
        border-color: var(--vscode-focusBorder);
        filter: brightness(1.1);
    }

    .btn:active {
        transform: translateY(0);
        box-shadow: var(--button-shadow);
        transition: var(--transition-smooth);
    }

    .btn.primary {
        background: linear-gradient(135deg, #007ACC, #005A9E);
        color: white;
        box-shadow: var(--glow-primary);
        font-weight: 600;
    }

    .btn.primary:hover {
        box-shadow: var(--glow-primary), var(--button-shadow-hover);
        background: linear-gradient(135deg, #0088DD, #006BB8);
    }

    .btn.outlined {
        background: rgba(255, 255, 255, 0.05);
        color: var(--vscode-foreground);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .btn.outlined:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--vscode-focusBorder);
        color: var(--vscode-foreground);
        transform: translateY(-2px);
    }

    .btn.small {
        padding: 6px 12px;
        font-size: 12px;
        min-width: auto;
        border-radius: 6px;
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
        background: linear-gradient(180deg,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 1) 0%,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.98) 100%);
    }

    .chat-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 20px;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.1), transparent);
        z-index: 1;
        pointer-events: none;
    }

    .messages {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: 1.5;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        position: relative;
        z-index: 2;
    }

    .messages::-webkit-scrollbar {
        width: 8px;
    }

    .messages::-webkit-scrollbar-track {
        background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
        border-radius: 4px;
        transition: var(--transition-smooth);
    }

    .messages::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
    }

    .message {
        margin-bottom: 6px;
        padding: 6px 10px;
        border-radius: 6px;
        animation: fadeIn 0.2s ease forwards;
        transition: all 0.15s ease;
    }

    .message:hover {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .message.user {
        border: 1px solid rgba(102, 51, 153, 0.15);
        background: linear-gradient(90deg, rgba(102, 51, 153, 0.03) 0%, transparent 50%);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        position: relative;
        overflow: hidden;
    }

    .message.user::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #8B5CF6 0%, #6639B8 100%);
    }

    .message.claude {
        border: 1px solid rgba(46, 204, 113, 0.1);
        background: linear-gradient(90deg, rgba(46, 204, 113, 0.03) 0%, transparent 50%);
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
    }

    .message.claude::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%);
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
        padding: 10px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-panel-background);
        display: flex;
        flex-direction: column;
        position: relative;
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
            rgba(var(--vscode-input-background-rgb, 45, 45, 45), 0.9) 0%,
            rgba(var(--vscode-input-background-rgb, 45, 45, 45), 0.95) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        overflow: hidden;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        transition: var(--transition-smooth);
        position: relative;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .textarea-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        z-index: 1;
    }

    .textarea-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: var(--glow-primary), 0 8px 24px rgba(0, 0, 0, 0.15);
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
        gap: 10px;
        padding: 8px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.02) 0%,
            rgba(255, 255, 255, 0.05) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        position: relative;
        z-index: 2;
    }

    .input-controls::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        z-index: -1;
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }

    .right-controls {
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
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
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
        background-color: var(--vscode-button-hoverBackground);
    }

    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    .file-picker-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--modal-backdrop);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: modalFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 20px;
        box-sizing: border-box;
    }

    .file-picker-modal.closing {
        animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse;
    }

    .file-picker-content {
        background: linear-gradient(135deg,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.95) 0%,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.98) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--modal-border-radius);
        width: 500px;
        max-width: 90vw;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        box-shadow: var(--modal-shadow);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        overflow: hidden;
        animation: modalSlideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
    }

    .file-picker-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        z-index: 1;
    }

    .file-picker-modal.closing .file-picker-content {
        animation: modalSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .file-picker-header {
        padding: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .file-picker-header span {
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .file-search-input {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        padding: 6px 8px;
        border-radius: 3px;
        outline: none;
        font-size: 13px;
    }

    .file-search-input:focus {
        border-color: var(--vscode-focusBorder);
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
        background: var(--modal-backdrop);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: modalFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 20px;
        box-sizing: border-box;
    }

    .tools-modal.closing {
        animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse;
    }

    .tools-modal-content {
        background: linear-gradient(135deg,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.95) 0%,
            rgba(var(--vscode-editor-background-rgb, 30, 30, 30), 0.98) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--modal-border-radius);
        width: 700px;
        max-width: 90vw;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: var(--modal-shadow);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        overflow: hidden;
        animation: modalSlideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
    }

    .tools-modal-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        z-index: 1;
    }

    .tools-modal.closing .tools-modal-content {
        animation: modalSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tools-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 100%);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        position: relative;
        z-index: 2;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .tools-modal-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .tools-modal-body::-webkit-scrollbar {
        width: 6px;
    }

    .tools-modal-body::-webkit-scrollbar-track {
        background: transparent;
    }

    .tools-modal-body::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        transition: var(--transition-smooth);
    }

    .tools-modal-body::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .tools-modal-header span {
        font-weight: 700;
        font-size: 16px;
        color: var(--vscode-foreground);
        letter-spacing: -0.3px;
        background: linear-gradient(135deg, var(--vscode-foreground), rgba(var(--vscode-foreground), 0.8));
        -webkit-background-clip: text;
        background-clip: text;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .tools-close-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-size: 14px;
        padding: 8px 10px;
        transition: var(--transition-smooth);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
    }

    .tools-close-btn:hover {
        background: rgba(220, 53, 69, 0.1);
        border-color: rgba(220, 53, 69, 0.3);
        color: #dc3545;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
    }

    .tools-close-btn:active {
        transform: scale(0.95);
        transition: var(--transition-smooth);
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
        padding: 12px 16px;
        border-radius: 10px;
        cursor: pointer;
        transition: var(--transition-smooth);
        border: 1px solid transparent;
        background: rgba(255, 255, 255, 0.02);
        position: relative;
        overflow: hidden;
        margin-bottom: 4px;
    }

    .slash-command-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        transition: var(--transition-smooth);
        z-index: 0;
    }

    .slash-command-item:hover::before {
        left: 100%;
    }

    .slash-command-item:hover {
        background: linear-gradient(135deg,
            rgba(var(--vscode-list-hoverBackground-rgb, 255, 255, 255), 0.08) 0%,
            rgba(var(--vscode-list-hoverBackground-rgb, 255, 255, 255), 0.05) 100%);
        border-color: rgba(255, 255, 255, 0.1);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .slash-command-item:active {
        transform: translateX(2px) scale(0.98);
        transition: var(--transition-smooth);
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
        padding: 12px 16px;
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: var(--vscode-foreground);
        font-size: 13px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        position: relative;
        border-radius: 0;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
    }

    .status::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        z-index: 1;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        position: relative;
        transition: var(--transition-smooth);
    }

    .status-indicator::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        opacity: 0.3;
        pointer-events: none;
        transition: var(--transition-smooth);
    }

    .status.ready .status-indicator {
        background: radial-gradient(circle, #00d26a, #00a855);
        box-shadow: 0 0 12px rgba(0, 210, 106, 0.6), 0 0 24px rgba(0, 210, 106, 0.3);
    }

    .status.ready .status-indicator::after {
        background: #00d26a;
        animation: pulse 2s ease-in-out infinite;
    }

    .status.processing .status-indicator {
        background: radial-gradient(circle, #ff9500, #cc7700);
        box-shadow: 0 0 12px rgba(255, 149, 0, 0.6), 0 0 24px rgba(255, 149, 0, 0.3);
    }

    .status.processing .status-indicator::after {
        background: #ff9500;
        animation: pulse 1s ease-in-out infinite;
    }

    .status.error .status-indicator {
        background: radial-gradient(circle, #ff453a, #cc362c);
        box-shadow: 0 0 12px rgba(255, 69, 58, 0.6), 0 0 24px rgba(255, 69, 58, 0.3);
    }

    .status.error .status-indicator::after {
        background: #ff453a;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.16); }
    }

    .status-text {
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
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-widget-border);
        z-index: 1000;
    }

    .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-widget-border);
    }

    .conversation-header h3 {
        margin: 0;
        font-size: 16px;
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
        padding: 16px 0 0 0;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
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
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 600px;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        z-index: 2000;
    }

    .checkpoint-panel.hidden {
        display: none;
    }

    .checkpoint-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--vscode-panel-background);
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
</style>`;

export default styles;