<template>
  <div class="zztakeoff-web-tab h-100 d-flex flex-column" ref="containerRef">
    <!-- Toolbar -->
    <div class="toolbar border-bottom p-2 d-flex align-items-center gap-2">
      <!-- Navigate to Tab Dropdown (when maximized) -->
      <div v-if="isMaximized" class="btn-group position-relative" role="group">
        <button
          @click="goBackToLastTab"
          class="btn btn-sm btn-warning"
          title="Back to Last Tab"
        >
          <i class="bi bi-arrow-left-circle me-1"></i>
          Back to {{ lastTabLabel }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-warning dropdown-toggle dropdown-toggle-split"
          @click="toggleTabDropdown"
          title="Select Tab"
        >
          <span class="visually-hidden">Select Tab</span>
        </button>
        <ul class="dropdown-menu" :class="{ 'show': showTabDropdown }">
          <li v-for="tab in availableTabs" :key="tab.path">
            <a
              class="dropdown-item"
              href="#"
              @click.prevent="selectTabAndGoBack(tab)"
              :class="{ 'active': lastTabPath === tab.path }"
            >
              <i :class="tab.icon" class="me-2"></i>
              {{ tab.label }}
            </a>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <a
              class="dropdown-item text-danger"
              href="#"
              @click.prevent="exitFullscreen"
            >
              <i class="bi bi-fullscreen-exit me-2"></i>
              Exit Fullscreen
            </a>
          </li>
        </ul>
      </div>

      <template v-if="!isMaximized">
        <button
          @click="goBack"
          class="btn btn-sm btn-outline-secondary"
          title="Go Back"
          :disabled="!canGoBack"
        >
          <i class="bi bi-arrow-left"></i>
        </button>
        <button
          @click="goForward"
          class="btn btn-sm btn-outline-secondary"
          title="Go Forward"
          :disabled="!canGoForward"
        >
          <i class="bi bi-arrow-right"></i>
        </button>
        <button
          @click="reload"
          class="btn btn-sm btn-outline-secondary"
          title="Reload"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <button
          @click="goHome"
          class="btn btn-sm btn-outline-primary"
          title="Go to Login"
        >
          <i class="bi bi-house"></i> Login
        </button>
      </template>

      <!-- URL Bar or Find Bar (inline, mutually exclusive) -->
      <div class="flex-grow-1 d-flex align-items-center gap-2">
        <!-- URL Bar (shown when not searching) -->
        <template v-if="!showFindBar">
          <input
            :value="currentUrl"
            class="form-control form-control-sm"
            type="text"
            placeholder="URL"
            readonly
            style="max-width: 400px;"
          />
          <span v-if="isLoading" class="spinner-border spinner-border-sm text-primary"></span>
        </template>

        <!-- Find Bar (shown when searching) -->
        <template v-else>
          <input
            v-model="findText"
            @input="handleFindInput"
            @keydown.enter="findNext"
            @keydown.shift.enter.prevent="findPrevious"
            @keydown.esc="toggleFindBar"
            class="form-control form-control-sm flex-grow-1"
            type="text"
            placeholder="Find in page..."
            ref="findInputRef"
            autocomplete="off"
          />
          <span v-if="findResults" class="text-muted small text-nowrap">
            {{ findResults.activeMatchOrdinal }} of {{ findResults.matches }}
          </span>
          <button
            @click="findPrevious"
            class="btn btn-sm btn-outline-secondary"
            title="Previous (Shift+Enter)"
            :disabled="!findText"
          >
            <i class="bi bi-chevron-up"></i>
          </button>
          <button
            @click="findNext"
            class="btn btn-sm btn-outline-secondary"
            title="Next (Enter)"
            :disabled="!findText"
          >
            <i class="bi bi-chevron-down"></i>
          </button>
        </template>
      </div>

      <!-- Find/Close Button -->
      <button
        @click.prevent="toggleFindBar"
        class="btn btn-sm"
        :class="showFindBar ? 'btn-outline-danger' : 'btn-outline-secondary'"
        :title="showFindBar ? 'Close Find (Esc)' : 'Find in Page (Ctrl+F)'"
      >
        <i class="bi" :class="showFindBar ? 'bi-x-lg' : 'bi-search'"></i>
      </button>

      <!-- Theme Toggle Button -->
      <button
        @click="toggleTheme"
        class="btn btn-sm btn-outline-secondary"
        title="Toggle Dark Mode"
      >
        <i class="bi" :class="theme === 'dark' ? 'bi-sun' : 'bi-moon'"></i>
      </button>

      <!-- Focus Window Button -->
      <button
        @click="focusWindow"
        class="btn btn-sm btn-primary"
        title="Focus zzTakeoff Window"
      >
        <i class="bi bi-window"></i> Focus Window
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="hasError" class="alert alert-danger m-3 d-flex align-items-start gap-2" role="alert">
      <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
      <div class="flex-grow-1">
        <strong>Unable to load page</strong>
        <p class="mb-2">{{ errorMessage }}</p>
        <div class="small" v-if="errorDetails">
          <strong>Error Details:</strong>
          <ul class="mb-0">
            <li><strong>Error Code:</strong> {{ errorDetails.errorCode }}</li>
            <li><strong>URL:</strong> {{ errorDetails.url }}</li>
          </ul>
        </div>
        <button @click="reload" class="btn btn-sm btn-danger mt-2">
          <i class="bi bi-arrow-clockwise me-1"></i>
          Try Again
        </button>
      </div>
    </div>

    <!-- Info Message - Separate Window -->
    <div v-if="!hasError" class="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted">
      <i class="bi bi-window-desktop display-1 mb-3"></i>
      <h3>zzTakeoff is open in a separate window</h3>
      <p class="text-center" style="max-width: 500px;">
        The zzTakeoff web interface is now running in its own window. You can move it to a second screen for better productivity.
      </p>
      <button @click="focusWindow" class="btn btn-primary mt-3">
        <i class="bi bi-window"></i> Bring to Front
      </button>
    </div>

    <!-- Webview Container (Hidden but kept for structure if needed) -->
    <div class="webview-container position-relative" ref="webviewContainerRef" style="height: 0; overflow: hidden;">
      <!-- Grey overlay when dropdown is open -->
      <div
        v-if="showTabDropdown"
        class="dropdown-overlay"
        @click="closeDropdown"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import useElectronAPI from '../../composables/useElectronAPI';

const theme = inject('theme');
const toggleTheme = inject('toggleTheme');
const api = useElectronAPI();
const router = useRouter();

// Inject maximize state from parent (App.vue)
const isMaximized = inject('webviewMaximized');
const zzTakeoffState = inject('zzTakeoffState');

// Refs
const containerRef = ref(null);
const webviewContainerRef = ref(null);
const currentUrl = ref('https://www.zztakeoff.com/login');
const isLoading = ref(false);
const errorMessage = ref(null);
const errorDetails = ref(null);
const hasError = ref(false);
const canGoBack = ref(false);
const canGoForward = ref(false);

// Find in Page state
const showFindBar = ref(false);
const findText = ref('');
const findResults = ref(null);
const findInputRef = ref(null);

// Dropdown state for tab selection
const showTabDropdown = ref(false);

// Tab navigation data
const lastTabPath = ref('/excel'); // Default to Excel Grid tab
const navigatingViaDropdown = ref(false); // Track if we're navigating via dropdown
const availableTabs = [
  { path: '/excel', label: 'Excel Grid', icon: 'bi bi-grid' },
  { path: '/recents', label: 'Recents', icon: 'bi bi-clock-history' },
  { path: '/history', label: 'History', icon: 'bi bi-clock' },
  { path: '/templates', label: 'Templates', icon: 'bi bi-folder' },
  { path: '/preferences', label: 'Preferences', icon: 'bi bi-gear' }
];

// Computed label for the button
const lastTabLabel = computed(() => {
  const tab = availableTabs.find(t => t.path === lastTabPath.value);
  return tab ? tab.label : 'Excel Grid';
});

// Toggle tab dropdown
const toggleTabDropdown = async () => {
  showTabDropdown.value = !showTabDropdown.value;
};

// Close dropdown
const closeDropdown = async () => {
  showTabDropdown.value = false;
};

// Exit fullscreen function
const exitFullscreen = async () => {
  showTabDropdown.value = false; // Close dropdown
  isMaximized.value = false; // Exit fullscreen mode
};

// Create BrowserView (now Window)
const createWebView = async () => {
  try {
    console.log('Creating zzTakeoff Window...');
    // We don't need bounds anymore for separate window
    const result = await api.webview.create(currentUrl.value, {});

    if (result.success) {
      console.log('Window created successfully');
      isLoading.value = true;

      // Update currentUrl with the actual URL from the Window
      if (result.url) {
        currentUrl.value = result.url;
        console.log('Current URL updated to:', result.url);

        // Also update zzTakeoff state
        handleUrlChange(result.url);
      }
    } else {
      hasError.value = true;
      errorMessage.value = result.message || 'Failed to create web view';
    }
  } catch (error) {
    console.error('Error creating Window:', error);
    hasError.value = true;
    errorMessage.value = error.message || 'Failed to create web view';
  }
};

// Navigation methods
const reload = async () => {
  try {
    hasError.value = false;
    errorMessage.value = null;
    errorDetails.value = null;
    isLoading.value = true;
    await api.webview.reload();
  } catch (error) {
    console.error('Error reloading:', error);
    hasError.value = true;
    errorMessage.value = error.message;
  }
};

const goHome = async () => {
  try {
    hasError.value = false;
    errorMessage.value = null;
    errorDetails.value = null;
    isLoading.value = true;
    currentUrl.value = 'https://www.zztakeoff.com/login';
    await api.webview.navigate(currentUrl.value);
  } catch (error) {
    console.error('Error navigating home:', error);
    hasError.value = true;
    errorMessage.value = error.message;
  }
};

const goBack = async () => {
  try {
    const result = await api.webview.goBack();
    if (result.success) {
      canGoBack.value = result.canGoBack !== false;
    }
  } catch (error) {
    console.error('Error going back:', error);
  }
};

const goForward = async () => {
  try {
    const result = await api.webview.goForward();
    if (result.success) {
      canGoForward.value = result.canGoForward !== false;
    }
  } catch (error) {
    console.error('Error going forward:', error);
  }
};

// Focus the external window
const focusWindow = async () => {
  try {
    // Re-calling create will focus the existing window
    await api.webview.create(currentUrl.value, {});
  } catch (error) {
    console.error('Error focusing window:', error);
  }
};

// Tab navigation functions
const goBackToLastTab = async () => {
  // Save the current active tab before leaving
  await saveLastActiveTab();

  // Mark that we're navigating via dropdown
  navigatingViaDropdown.value = true;

  // Navigate to the last selected tab
  await router.push(lastTabPath.value);
};

const selectTabAndGoBack = async (tab) => {
  // Close the dropdown
  showTabDropdown.value = false;

  // Save the selected tab to preferences
  lastTabPath.value = tab.path;
  await api.preferencesStore.update('lastActiveTab', tab.path);

  // Mark that we're navigating via dropdown
  navigatingViaDropdown.value = true;

  // Navigate to the selected tab
  await router.push(tab.path);
};

const saveLastActiveTab = async () => {
  // Save the last active tab to preferences (called when switching to zzTakeoff Web)
  const currentPath = router.currentRoute.value.path;
  if (currentPath !== '/zztakeoff-web') {
    lastTabPath.value = currentPath;
    await api.preferencesStore.update('lastActiveTab', currentPath);
  }
};

// Find in Page functions
const toggleFindBar = async () => {
  console.log('[Find] Toggle find bar clicked, current state:', showFindBar.value);

  showFindBar.value = !showFindBar.value;

  if (showFindBar.value) {
    // Focus the input when opening
    await nextTick();
    if (findInputRef.value) {
      findInputRef.value.focus();
      findInputRef.value.select();
    }
  } else {
    // Stop find when closing
    if (api.webview && api.webview.stopFindInPage) {
      try {
        await api.webview.stopFindInPage('clearSelection');
        console.log('[Find] Stopped find in page');
      } catch (error) {
        console.error('[Find] Error stopping find:', error);
      }
    }
    findText.value = '';
    findResults.value = null;
  }
};

const handleFindInput = async () => {
  console.log('[Find] Input changed:', findText.value);

  if (!findText.value) {
    findResults.value = null;
    if (api.webview && api.webview.stopFindInPage) {
      try {
        await api.webview.stopFindInPage('clearSelection');
      } catch (error) {
        console.error('[Find] Error clearing selection:', error);
      }
    }
    return;
  }

  // Perform find with default options
  if (api.webview && api.webview.findInPage) {
    try {
      console.log('[Find] Searching for:', findText.value);
      const result = await api.webview.findInPage(findText.value, { findNext: false });
      console.log('[Find] Search result:', result);
    } catch (error) {
      console.error('[Find] Error finding in page:', error);
    }
  } else {
    console.warn('[Find] WebView or findInPage not available');
  }
};

const findNext = async () => {
  if (!findText.value) return;

  if (api.webview && api.webview.findInPage) {
    try {
      console.log('[Find] Finding next:', findText.value);
      await api.webview.findInPage(findText.value, { findNext: true, forward: true });
    } catch (error) {
      console.error('[Find] Error finding next:', error);
    }
  } else {
    console.warn('[Find] WebView or findInPage not available');
  }
};

const findPrevious = async () => {
  if (!findText.value) return;

  if (api.webview && api.webview.findInPage) {
    try {
      console.log('[Find] Finding previous:', findText.value);
      await api.webview.findInPage(findText.value, { findNext: true, forward: false });
    } catch (error) {
      console.error('[Find] Error finding previous:', error);
    }
  } else {
    console.warn('[Find] WebView or findInPage not available');
  }
};

const handleFoundInPage = (result) => {
  findResults.value = {
    activeMatchOrdinal: result.activeMatchOrdinal,
    matches: result.matches
  };
};

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
};

// Event handlers
const handleLoadingChange = (loading) => {
  isLoading.value = loading;
  console.log('Loading state changed:', loading);
};

const handleUrlChange = (url) => {
  currentUrl.value = url;
  console.log('URL changed:', url);

  // Update shared zzTakeoff state with project info
  zzTakeoffState.value.currentUrl = url;

  // Extract projectId from URL if present
  try {
    const urlObj = new URL(url);
    const projectId = urlObj.searchParams.get('projectId');
    if (projectId) {
      zzTakeoffState.value.projectId = projectId;
      // Note: projectName would need to be extracted from the page or API
      // For now, we'll just use the projectId
      zzTakeoffState.value.projectName = projectId;
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
};

const handleLoadError = (error) => {
  console.error('Load error:', error);
  hasError.value = true;
  errorMessage.value = error.errorDescription || 'Failed to load page';
  errorDetails.value = error;
  isLoading.value = false;
};

// Track navigation TO this component to save the previous tab
watch(() => router.currentRoute.value.path, async (newPath, oldPath) => {
  // If navigating TO zzTakeoff Web from another tab (not via dropdown)
  if (newPath === '/zztakeoff-web' && oldPath && oldPath !== '/zztakeoff-web' && !navigatingViaDropdown.value) {
    // Save the previous tab as the last active tab
    lastTabPath.value = oldPath;
    await api.preferencesStore.update('lastActiveTab', oldPath);
    console.log('Saved last active tab:', oldPath);
  }
  // Reset the flag after navigation
  navigatingViaDropdown.value = false;
}, { immediate: false });

// Setup and cleanup
onMounted(async () => {
  // Load last active tab from preferences
  try {
    if (api.preferencesStore) {
      const response = await api.preferencesStore.get();
      if (response?.success && response.data?.lastActiveTab) {
        lastTabPath.value = response.data.lastActiveTab;
      }
    }
  } catch (error) {
    console.error('Error loading last active tab:', error);
  }

  // Set up event listeners
  if (api.webview) {
    api.webview.onLoading(handleLoadingChange);
    api.webview.onUrlChanged(handleUrlChange);
    api.webview.onLoadError(handleLoadError);
    api.webview.onFoundInPage(handleFoundInPage);
  }

  // Create/Focus Window
  await createWebView();
});

onUnmounted(async () => {
  // We do NOT destroy the window on unmount anymore, so it persists
  // The user can close it manually or it closes when the app closes
});
</script>

<style scoped>
.zztakeoff-web-tab {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.toolbar {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  z-index: 9999;
  position: relative;
}

.find-bar {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  z-index: 2;
}

.find-bar input {
  max-width: 300px;
}

.webview-container {
  background-color: #ffffff;
  min-height: 200px;
}

/* Dropdown overlay */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  cursor: pointer;
}

/* Dark mode */
[data-theme="dark"] .toolbar {
  background-color: var(--bg-secondary);
  border-bottom-color: var(--border-color);
}

[data-theme="dark"] .find-bar {
  background-color: var(--bg-secondary);
  border-bottom-color: var(--border-color);
}

[data-theme="dark"] .webview-container {
  background-color: #1a1a1a;
}

[data-theme="dark"] .alert-danger {
  background-color: #842029;
  border-color: #a52834;
  color: #f8d7da;
}

[data-theme="dark"] .alert-danger .btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

[data-theme="dark"] .alert-danger .btn-danger:hover {
  background-color: #bb2d3b;
  border-color: #b02a37;
}

[data-theme="dark"] .alert-info {
  background-color: #055160;
  border-color: #087990;
  color: #cff4fc;
}

/* Loading spinner */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

/* Error alert */
.alert {
  border-radius: 0.375rem;
}

.alert ul {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}

/* Disabled buttons */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Maximize button styling */
.btn-outline-success {
  transition: all 0.3s ease;
}

.btn-outline-success:hover {
  transform: scale(1.05);
}

/* Back to DBx button when maximized */
.btn-warning {
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

[data-theme="dark"] .btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
}

[data-theme="dark"] .btn-warning:hover {
  background-color: #ffca2c;
  border-color: #ffc720;
  color: #000;
}

/* Dropdown menu styling */
.btn-group {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 99999;
  display: none;
  min-width: 250px;
  max-height: 400px;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,.175);
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #16181b;
}

.dropdown-item.active {
  background-color: rgba(13, 110, 253, 0.1);
  font-weight: 600;
}

.dropdown-divider {
  height: 0;
  margin: 0.5rem 0;
  overflow: hidden;
  border-top: 1px solid rgba(0,0,0,.15);
}

[data-theme="dark"] .dropdown-menu {
  background-color: #2d3238;
  border-color: #495057;
}

[data-theme="dark"] .dropdown-item {
  color: #f8f9fa;
}

[data-theme="dark"] .dropdown-item:hover {
  background-color: #212529;
  color: #f8f9fa;
}

[data-theme="dark"] .dropdown-item.active {
  background-color: rgba(110, 168, 254, 0.2);
  color: #f8f9fa;
}

[data-theme="dark"] .dropdown-item.text-danger {
  color: #dc3545 !important;
}

[data-theme="dark"] .dropdown-item.text-danger:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

[data-theme="dark"] .dropdown-divider {
  border-top-color: #495057;
}

/* Fix button visibility in dark mode */
[data-theme="dark"] .btn-outline-secondary {
  color: #adb5bd;
  border-color: #6c757d;
}

[data-theme="dark"] .btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
}

[data-theme="dark"] .btn-outline-secondary:disabled {
  color: #495057;
  border-color: #495057;
}

[data-theme="dark"] .btn-outline-primary {
  color: #6ea8fe;
  border-color: #0d6efd;
}

[data-theme="dark"] .btn-outline-primary:hover {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: #ffffff;
}

[data-theme="dark"] .btn-outline-success {
  color: #5cb85c;
  border-color: #5cb85c;
}

[data-theme="dark"] .btn-outline-success:hover {
  background-color: #5cb85c;
  border-color: #5cb85c;
  color: #ffffff;
}

[data-theme="dark"] .btn-outline-danger {
  color: #ea868f;
  border-color: #dc3545;
}

[data-theme="dark"] .btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #ffffff;
}

/* Fix form control visibility */
[data-theme="dark"] .form-control {
  background-color: #2d2d2d;
  border-color: #495057;
  color: #e4e4e4;
}

[data-theme="dark"] .form-control:focus {
  background-color: #2d2d2d;
  border-color: #6ea8fe;
  color: #e4e4e4;
  box-shadow: 0 0 0 0.25rem rgba(110, 168, 254, 0.25);
}

[data-theme="dark"] .form-control::placeholder {
  color: #6c757d;
}

[data-theme="dark"] .form-control:disabled,
[data-theme="dark"] .form-control[readonly] {
  background-color: #1e1e1e;
  border-color: #3e3e3e;
  color: #6c757d;
}

/* Fix text visibility */
[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
}
</style>
