<template>
  <div class="recents-tab h-100 d-flex flex-column">
    <!-- Fullscreen Header (shown only in fullscreen mode) -->
    <div v-if="isFullscreen" class="fullscreen-header border-bottom p-2 d-flex align-items-center justify-content-between">
      <FullscreenNavigation />
      <h5 class="mb-0">
        <i class="bi bi-clock-history me-2"></i>
        Recent Files
      </h5>
    </div>

    <div class="p-3 flex-grow-1 overflow-auto">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="mb-0">Recent Files</h4>
          <p class="text-muted small mb-0">Recently opened Excel files</p>
        </div>
        <div class="d-flex gap-2">
          <button
            v-if="recentFiles.length > 0"
            @click="clearRecents"
            class="btn btn-sm btn-outline-danger"
            title="Clear all recent files"
          >
            <i class="bi bi-trash me-1"></i>
            Clear All
          </button>
          <FullscreenButton />
        </div>
      </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="recentFiles.length === 0" class="list-group mt-3">
      <div class="list-group-item text-center text-muted">
        <i class="bi bi-clock-history" style="font-size: 3rem;"></i>
        <p class="mt-2">No recent files yet</p>
        <p class="small">Open an Excel file to see it listed here</p>
      </div>
    </div>

    <!-- Recent Files List -->
    <div v-else class="list-group">
      <a
        v-for="(file, index) in recentFiles"
        :key="file.filePath"
        href="#"
        @click.prevent="openRecentFile(file)"
        class="list-group-item list-group-item-action d-flex align-items-start gap-3"
      >
        <i class="bi bi-file-earmark-excel text-success" style="font-size: 2rem;"></i>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">{{ file.fileName }}</h6>
              <p class="mb-1 text-muted small">{{ file.filePath }}</p>
              <small class="text-muted">
                <i class="bi bi-clock me-1"></i>
                Opened {{ formatDate(file.lastOpened) }}
              </small>
            </div>
            <button
              @click.stop="removeRecent(file.filePath)"
              class="btn btn-sm btn-link text-danger"
              title="Remove from recent files"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </a>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import FullscreenButton from '../Common/FullscreenButton.vue';
import FullscreenNavigation from '../Common/FullscreenNavigation.vue';
import useElectronAPI from '../../composables/useElectronAPI';

const api = useElectronAPI();
const router = useRouter();
const isFullscreen = inject('isFullscreen');

const recentFiles = ref([]);
const loading = ref(true);

// Load recent files
const loadRecents = async () => {
  try {
    loading.value = true;
    const result = await api.recentsStore.getAll();
    if (result.success && Array.isArray(result.data)) {
      // Sort by lastOpened, most recent first
      recentFiles.value = result.data.sort((a, b) =>
        new Date(b.lastOpened) - new Date(a.lastOpened)
      );
    }
  } catch (error) {
    console.error('Error loading recent files:', error);
  } finally {
    loading.value = false;
  }
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString();
};

// Open a recent file
const openRecentFile = async (file) => {
  try {
    console.log('Opening recent file:', file.filePath);

    // Navigate to Excel Grid tab first
    await router.push('/excel');

    // Wait a moment for the tab to mount
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger a custom event that ExcelGridTab listens to
    window.dispatchEvent(new CustomEvent('load-excel-file', {
      detail: {
        filePath: file.filePath,
        fileName: file.fileName
      }
    }));
  } catch (error) {
    console.error('Error opening recent file:', error);
    alert(`Error opening file: ${error.message}`);
  }
};

// Remove a file from recents
const removeRecent = async (filePath) => {
  try {
    await api.recentsStore.remove(filePath);
    await loadRecents(); // Reload the list
  } catch (error) {
    console.error('Error removing recent file:', error);
  }
};

// Clear all recent files
const clearRecents = async () => {
  if (confirm('Clear all recent files?')) {
    try {
      await api.recentsStore.clear();
      recentFiles.value = [];
    } catch (error) {
      console.error('Error clearing recent files:', error);
    }
  }
};

// Load on mount
onMounted(() => {
  loadRecents();
});
</script>

<style scoped>
.recents-tab {
  background-color: var(--bs-body-bg);
}

.fullscreen-header {
  background-color: var(--bs-body-bg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

/* Dark mode text visibility */
[data-theme="dark"] .recents-tab h4 {
  color: #e4e4e4;
}

[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
}

[data-theme="dark"] .fullscreen-header {
  background-color: #2d2d2d;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

[data-theme="dark"] .fullscreen-header h5 {
  color: #e4e4e4;
}

[data-theme="dark"] .list-group-item {
  background-color: #2d2d2d;
  border-color: #3e3e3e;
  color: #e4e4e4;
}

[data-theme="dark"] .list-group-item-action:hover {
  background-color: #3e3e3e;
}

[data-theme="dark"] .list-group-item h6 {
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

[data-theme="dark"] .btn-link.text-danger {
  color: #ea868f !important;
}

[data-theme="dark"] .btn-link.text-danger:hover {
  color: #ff6b7a !important;
}
</style>
