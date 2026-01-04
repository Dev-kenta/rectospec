/**
 * AI Suggestion Panel
 * Handles AI-powered Gherkin improvement suggestions
 */

class SuggestionPanel {
  constructor() {
    this.panel = document.getElementById('suggestion-panel');
    this.toggleButton = document.getElementById('toggle-suggestion-panel');
    this.closeButton = document.getElementById('close-panel');
    this.getSuggestionButton = document.getElementById('get-suggestion-button');
    this.applySuggestionButton = document.getElementById('apply-suggestion');
    this.rejectSuggestionButton = document.getElementById('reject-suggestion');

    this.languageSelect = document.getElementById('language-select');
    this.focusAreaSelect = document.getElementById('focus-area-select');

    this.loadingElement = document.getElementById('suggestion-loading');
    this.previewElement = document.getElementById('suggestion-preview');
    this.contentElement = document.getElementById('suggestion-content');
    this.errorElement = document.getElementById('suggestion-error');

    this.currentSuggestion = null;

    this.init();
  }

  /**
   * Initialize event listeners
   */
  init() {
    // Toggle panel
    this.toggleButton.addEventListener('click', () => this.togglePanel());
    this.closeButton.addEventListener('click', () => this.closePanel());

    // Get suggestion
    this.getSuggestionButton.addEventListener('click', () => this.getSuggestion());

    // Apply/Reject suggestion
    this.applySuggestionButton.addEventListener('click', () => this.applySuggestion());
    this.rejectSuggestionButton.addEventListener('click', () => this.rejectSuggestion());
  }

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    this.panel.classList.toggle('hidden');
  }

  /**
   * Close panel
   */
  closePanel() {
    this.panel.classList.add('hidden');
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.loadingElement.classList.remove('hidden');
    this.previewElement.classList.add('hidden');
    this.errorElement.classList.add('hidden');
    this.getSuggestionButton.disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.loadingElement.classList.add('hidden');
    this.getSuggestionButton.disabled = false;
  }

  /**
   * Show error message
   */
  showError(message) {
    this.errorElement.textContent = message;
    this.errorElement.classList.remove('hidden');
    this.previewElement.classList.add('hidden');
  }

  /**
   * Show suggestion preview
   */
  showPreview(suggestion) {
    this.currentSuggestion = suggestion;

    // Display suggestion in a pre element with Gherkin syntax
    this.contentElement.textContent = suggestion;

    this.previewElement.classList.remove('hidden');
    this.errorElement.classList.add('hidden');
  }

  /**
   * Get suggestion from API
   */
  async getSuggestion() {
    try {
      // Get current editor content
      const content = editor.getValue();

      if (!content || content.trim().length === 0) {
        this.showError('Please write some Gherkin content first');
        return;
      }

      // Get selected options
      const language = this.languageSelect.value;
      const focusArea = this.focusAreaSelect.value;

      this.showLoading();

      // Call API
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          language: language,
          focusArea: focusArea,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate suggestion');
      }

      this.hideLoading();
      this.showPreview(data.suggestion);

    } catch (error) {
      this.hideLoading();
      this.showError(`Error: ${error.message}`);
      console.error('Failed to get suggestion:', error);
    }
  }

  /**
   * Apply suggestion to editor
   */
  applySuggestion() {
    if (!this.currentSuggestion) {
      return;
    }

    // Set editor content to suggestion
    editor.setValue(this.currentSuggestion, -1);

    // Show success message
    showStatus('Suggestion applied successfully!', 'success');

    // Clear preview
    this.currentSuggestion = null;
    this.previewElement.classList.add('hidden');
  }

  /**
   * Reject suggestion
   */
  rejectSuggestion() {
    this.currentSuggestion = null;
    this.previewElement.classList.add('hidden');
    showStatus('Suggestion rejected', 'info');
  }
}

// Initialize suggestion panel when DOM is ready
let suggestionPanel;

function initializeSuggestionPanel() {
  suggestionPanel = new SuggestionPanel();
}

// Initialize after editor is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for editor.js to initialize
    setTimeout(initializeSuggestionPanel, 100);
  });
} else {
  setTimeout(initializeSuggestionPanel, 100);
}
