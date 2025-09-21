export function getCheckpointPanelHtml(): string {
    return `
        <div id="checkpointPanel" class="checkpoint-panel hidden">
            <div class="checkpoint-header">
                <h3>Checkpoints</h3>
                <button id="closeCheckpointPanel" class="close-btn">×</button>
            </div>
            <div class="checkpoint-description">
                Select a checkpoint to restore your code to that point in time. This will revert all changes made after the selected checkpoint.
            </div>
            <div id="checkpointList" class="checkpoint-list">
                <!-- Checkpoints will be populated here -->
            </div>
            <div class="checkpoint-footer">
                <button id="refreshCheckpoints" class="refresh-btn">Refresh</button>
            </div>
        </div>
    `;
}

export function getCheckpointItemHtml(checkpoint: any): string {
    const timeAgo = getTimeAgo(new Date(checkpoint.timestamp));
    const shortSha = checkpoint.sha ? checkpoint.sha.substring(0, 8) : 'unknown';
    const messagePreview = checkpoint.message.length > 60
        ? checkpoint.message.substring(0, 60) + '...'
        : checkpoint.message;

    return `
        <div class="checkpoint-item" data-sha="${checkpoint.sha}">
            <div class="checkpoint-time">${timeAgo}</div>
            <div class="checkpoint-message">${escapeHtml(messagePreview)}</div>
            <div class="checkpoint-actions">
                <span class="checkpoint-sha">${shortSha}</span>
                <button class="checkpoint-restore-btn" data-sha="${checkpoint.sha}">
                    Restore
                </button>
            </div>
        </div>
    `;
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}