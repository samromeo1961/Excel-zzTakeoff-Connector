<template>
  <div id="app" :data-theme="theme" class="h-100 d-flex flex-column">
    <!-- Header (hidden in fullscreen mode) -->
    <div v-if="!isFullscreen" class="app-header border-bottom">
      <div class="d-flex justify-content-between align-items-center">
        <!-- zzTakeoff Logo (Left Side) -->
        <div class="d-flex align-items-center">
          <img src="/assets/zztakeoff-logo-dark.png" alt="zzTakeoff" style="height: 40px;" />
        </div>
        <!-- Title with Excel Icon (Right Side) -->
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-file-earmark-excel text-white" style="font-size: 2rem;"></i>
          <h2 class="mb-0">XLx Connector</h2>
        </div>
      </div>
    </div>

    <!-- Tab Navigation (hidden in fullscreen mode) -->
    <ul v-if="!isFullscreen" class="nav nav-tabs" role="tablist">
      <li class="nav-item" role="presentation">
        <router-link
          to="/excel"
          class="nav-link"
          active-class="active"
          role="tab"
        >
          <i class="bi bi-grid-3x3-gap me-1"></i>
          Excel Grid
        </router-link>
      </li>
      <li class="nav-item" role="presentation">
        <router-link
          to="/recents"
          class="nav-link"
          active-class="active"
          role="tab"
        >
          <i class="bi bi-clock-history me-1"></i>
          Recent Files
        </router-link>
      </li>
      <li class="nav-item" role="presentation">
        <router-link
          to="/history"
          class="nav-link"
          active-class="active"
          role="tab"
        >
          <i class="bi bi-list-check me-1"></i>
          Send History
        </router-link>
      </li>
      <li class="nav-item" role="presentation">
        <router-link
          to="/templates"
          class="nav-link"
          active-class="active"
          role="tab"
        >
          <i class="bi bi-folder me-1"></i>
          Templates
        </router-link>
      </li>
      <li class="nav-item" role="presentation">
        <router-link
          to="/zztakeoff-web"
          class="nav-link"
          active-class="active"
          role="tab"
        >
          <i class="bi bi-globe me-1"></i>
          zzTakeoff Web
        </router-link>
      </li>
      <li class="nav-item ms-auto" role="presentation">
        <button
          @click="showHelp"
          class="nav-link btn btn-link"
          title="Help (F1)"
        >
          <i class="bi bi-question-circle"></i>
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          @click="toggleTheme"
          class="nav-link btn btn-link"
          title="Toggle Dark Mode"
        >
          <i class="bi" :class="theme === 'dark' ? 'bi-sun' : 'bi-moon'"></i>
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <router-link
          to="/preferences"
          class="nav-link"
          active-class="active"
          role="tab"
          title="Preferences"
        >
          <i class="bi bi-gear"></i>
        </router-link>
      </li>
    </ul>

    <!-- Main Content Area -->
    <div class="flex-grow-1 overflow-hidden">
      <router-view />
    </div>

    <!-- Help Modal -->
    <HelpModal ref="helpModalRef" />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import useElectronAPI from './composables/useElectronAPI';
import HelpModal from './components/common/HelpModal.vue';

const router = useRouter();
const route = useRoute();
const api = useElectronAPI();

// Help modal ref
const helpModalRef = ref(null);

// Theme state
const theme = ref('light');

// Fullscreen state
const isFullscreen = ref(false);
const lastVisitedTab = ref('/excel');

// Webview maximize state (shared with ZzTakeoffWebTab)
const webviewMaximized = ref(false);

// Shared Excel file state (persists across tab navigation)
// Only store serializable primitives here - no AG Grid or SheetJS objects!
const excelFileState = ref({
  currentFile: null,
  currentFileName: '',
  hasUnsavedChanges: false
});

// Shared zzTakeoff state (current project info)
const zzTakeoffState = ref({
  currentUrl: '',
  projectId: '',
  projectName: ''
});

// Tab name mapping
const tabNames = {
  '/excel': 'Excel Grid',
  '/recents': 'Recent Files',
  '/history': 'Send History',
  '/templates': 'Templates',
  '/zztakeoff-web': 'zzTakeoff Web',
  '/preferences': 'Preferences'
};

// Computed property for current tab title
const currentTabTitle = computed(() => {
  return tabNames[route.path] || 'XLx Connector';
});

// Computed property for back button text
const backButtonText = computed(() => {
  const tabName = tabNames[lastVisitedTab.value] || 'Excel Grid';
  return `Back to ${tabName}`;
});

// Watch route changes to track last visited tab
watch(() => route.path, (newPath, oldPath) => {
  // Always update lastVisitedTab when navigating between tabs
  if (oldPath && oldPath !== newPath) {
    lastVisitedTab.value = oldPath;
  }
});

// Toggle fullscreen mode
const enterFullscreen = () => {
  isFullscreen.value = true;
};

const exitFullscreen = () => {
  isFullscreen.value = false;
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// Navigate to tab (used by dropdown in fullscreen mode)
const navigateToTab = (path) => {
  router.push(path);
};

// Check for unsaved changes before closing app
const checkUnsavedChanges = (e) => {
  if (excelFileState.value.hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
};

// Load theme from preferences
onMounted(async () => {
  // Add beforeunload handler
  window.addEventListener('beforeunload', checkUnsavedChanges);

  try {
    const prefs = await api.preferencesStore.get();
    if (prefs.data?.theme) {
      theme.value = prefs.data.theme;
    }

    // Check if there's a last opened file and auto-load it
    const recentsResult = await api.recentsStore.getAll();
    if (recentsResult.success && recentsResult.data && recentsResult.data.length > 0) {
      // There's a previous Excel document - navigate to Excel Grid
      const lastFile = recentsResult.data[0]; // Most recent file
      router.push('/excel');

      // Wait for Excel Grid to mount, then load the file
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('load-excel-file', {
          detail: {
            filePath: lastFile.filePath,
            fileName: lastFile.fileName
          }
        }));
      }, 500);
    } else if (router.currentRoute.value.path === '/') {
      // No previous document - go to Excel Grid
      router.push('/excel');
    }

    // DO NOT enter fullscreen mode on startup - keep tabs visible
    // enterFullscreen();
  } catch (error) {
    console.error('Failed to load preferences or recents:', error);
    // Default to Excel Grid if there's an error
    if (router.currentRoute.value.path === '/') {
      router.push('/excel');
    }
  }

  // Listen for navigation commands from main process
  if (api.onNavigateTo) {
    api.onNavigateTo((path) => {
      router.push(path);
    });
  }

  // Listen for help command
  if (api.onShowHelp) {
    api.onShowHelp(() => {
      showHelp();
    });
  }
});

// Toggle theme
const toggleTheme = async () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';

  // Save to preferences
  try {
    await api.preferencesStore.update('theme', theme.value);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
};

// Show help modal
const showHelp = () => {
  if (helpModalRef.value) {
    helpModalRef.value.show();
  }
};

// Cleanup
onUnmounted(() => {
  window.removeEventListener('beforeunload', checkUnsavedChanges);
});

// Provide theme and other state to child components
provide('theme', theme);
provide('toggleTheme', toggleTheme);
provide('webviewMaximized', webviewMaximized);
provide('excelFileState', excelFileState);
provide('zzTakeoffState', zzTakeoffState);
provide('isFullscreen', isFullscreen);
provide('enterFullscreen', enterFullscreen);
provide('exitFullscreen', exitFullscreen);
provide('toggleFullscreen', toggleFullscreen);
provide('lastVisitedTab', lastVisitedTab);
</script>

<style scoped>
.app-header {
  padding: 0.75rem 1rem;
  background-color: var(--bs-body-bg);
}

.fullscreen-header {
  padding: 0.5rem 1rem;
  background-color: var(--bs-body-bg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-tabs {
  flex-shrink: 0;
}

[data-theme="dark"] {
  --bs-body-bg: #1e1e1e;
  --bs-body-color: #e4e4e4;
  --bs-border-color: #3e3e3e;
}

[data-theme="dark"] .app-header {
  background-color: #2d2d2d;
}

[data-theme="dark"] .fullscreen-header {
  background-color: #2d2d2d;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Fix header title visibility in dark mode */
[data-theme="dark"] .app-header h2 {
  color: #e4e4e4;
}

/* Fix filename text visibility in dark mode */
[data-theme="dark"] .app-header .text-muted {
  color: #adb5bd !important;
}

[data-theme="dark"] .app-header .text-warning {
  color: #ffc107 !important;
}

/* Fix tab visibility in dark mode - much brighter inactive tabs */
[data-theme="dark"] .nav-tabs {
  background-color: #2d2d2d;
  border-bottom-color: #3e3e3e;
}

[data-theme="dark"] .nav-tabs .nav-link {
  color: #ffffff !important;
  border-color: transparent;
  opacity: 0.7;
}

[data-theme="dark"] .nav-tabs .nav-link:hover {
  background-color: #3e3e3e;
  color: #ffffff !important;
  border-color: #3e3e3e #3e3e3e transparent;
  opacity: 1;
}

[data-theme="dark"] .nav-tabs .nav-link.active {
  background-color: #1e1e1e;
  border-color: #3e3e3e #3e3e3e #1e1e1e;
  color: #ffffff !important;
  opacity: 1;
}
</style>
