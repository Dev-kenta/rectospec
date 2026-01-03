/**
 * Ace Editor initialization and file loading
 */

// Global variables
let editor;
let currentFilePath = '';

/**
 * Initialize Ace Editor
 */
function initializeEditor() {
  // Initialize Ace Editor
  editor = ace.edit('editor-container');
  editor.setTheme('ace/theme/monokai');
  editor.session.setMode('ace/mode/gherkin');
  editor.setOptions({
    fontSize: '14px',
    showPrintMargin: false,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
  });

  // Set read-only until file is loaded
  editor.setReadOnly(true);

  // Add Ctrl+S (Cmd+S on Mac) keyboard shortcut for saving
  editor.commands.addCommand({
    name: 'save',
    bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
    exec: function() {
      saveFile();
    }
  });
}

/**
 * Get file path from URL query parameters
 */
function getFilePathFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('file');
}

/**
 * Load file content from server
 */
async function loadFile(filePath) {
  try {
    showStatus('Loading file...', 'info');

    const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load file');
    }

    // Set file content
    editor.setValue(data.content, -1); // -1 moves cursor to start
    editor.setReadOnly(false);
    currentFilePath = filePath;

    showStatus(`Loaded: ${filePath}`, 'success');
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
    console.error('Failed to load file:', error);
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('status-message');
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = `status-message status-${type}`;

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'status-message';
    }, 3000);
  }
}

/**
 * Save file content to server
 */
async function saveFile() {
  try {
    if (!currentFilePath) {
      showStatus('No file loaded', 'error');
      return;
    }

    showStatus('Saving...', 'info');

    const content = editor.getValue();
    const response = await fetch('/api/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: currentFilePath,
        content: content,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save file');
    }

    showStatus('Saved successfully!', 'success');
  } catch (error) {
    showStatus(`Save error: ${error.message}`, 'error');
    console.error('Failed to save file:', error);
  }
}

/**
 * Initialize application
 */
async function initialize() {
  // Initialize editor
  initializeEditor();

  // Get file path from URL
  const filePath = getFilePathFromUrl();

  if (!filePath) {
    showStatus('No file specified. Please provide a file path via the "file" query parameter.', 'error');
    return;
  }

  // Load file
  await loadFile(filePath);

  // Setup save button
  const saveButton = document.getElementById('save-button');
  if (saveButton) {
    saveButton.addEventListener('click', saveFile);
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
