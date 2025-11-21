<template>
  <div>
    <!-- Fullscreen Header -->
    <div v-if="isFullscreen" class="fullscreen-header-new d-flex align-items-center gap-3 px-3 py-2">
      <!-- Back to Navigation (Left) -->
      <FullscreenNavigation />

      <!-- Search Bar (Expands to fill space) -->
      <div class="search-bar-container flex-grow-1">
        <div class="input-group">
          <span class="input-group-text bg-transparent border-0">
            <i class="bi bi-search"></i>
          </span>
          <input
            v-model="searchText"
            type="text"
            class="form-control border-0"
            :placeholder="searchPlaceholder"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- Custom Action Icons (Right Side) -->
      <div class="d-flex align-items-center gap-2 ms-auto">
        <slot name="fullscreen-actions"></slot>

        <!-- Exit Fullscreen Icon -->
        <button
          @click="$emit('exit-fullscreen')"
          class="btn btn-sm action-icon-btn"
          title="Exit fullscreen"
        >
          <i class="bi bi-fullscreen-exit"></i>
        </button>

        <!-- File Name (Discrete) - Only show if file is open -->
        <div v-if="showFileInfo && currentFileName" class="file-name-discrete d-flex align-items-center gap-2 px-3 py-2" :title="currentFilePath || currentFileName">
          <i class="bi bi-file-earmark-excel"></i>
          <span class="small">{{ currentFileName }}</span>
        </div>

        <!-- Tab Label -->
        <div class="grid-label d-flex align-items-center gap-2 px-3 py-2">
          <i :class="tabIcon"></i>
          <span>{{ tabLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Toolbar (only visible when NOT in fullscreen) -->
    <div v-if="!isFullscreen" class="toolbar border-bottom p-2 d-flex gap-2 align-items-center">
      <!-- File Info (Left Side) -->
      <div v-if="showFileInfo && currentFileName" class="file-info-container d-flex align-items-center gap-2">
        <i class="bi bi-file-earmark-excel text-success" style="font-size: 1.25rem;"></i>
        <div class="d-flex align-items-center gap-2">
          <strong class="file-name">{{ currentFileName }}</strong>
          <span v-if="hasUnsavedChanges" class="badge bg-warning text-dark">
            <i class="bi bi-circle-fill" style="font-size: 0.4rem;"></i>
            Unsaved
          </span>
          <span v-if="showRowCount && displayedRowCount !== null" class="badge bg-secondary">
            <i class="bi bi-list-ol"></i>
            {{ displayedRowCount }}{{ displayedRowCount !== totalRowCount ? ` / ${totalRowCount}` : '' }} row{{ displayedRowCount !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Search Bar (Expands to fill available space) -->
      <div v-if="showSearch" class="search-bar-inline flex-grow-1 mx-3">
        <div class="input-group input-group-sm">
          <span class="input-group-text search-icon">
            <i class="bi bi-search"></i>
          </span>
          <input
            v-model="searchText"
            type="text"
            class="form-control search-input"
            :placeholder="searchPlaceholder"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- Custom Action Buttons (Right Side - stays right-justified) -->
      <div class="d-flex gap-2 align-items-center ms-auto">
        <slot name="toolbar-actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import FullscreenNavigation from './FullscreenNavigation.vue';

const props = defineProps({
  isFullscreen: {
    type: Boolean,
    required: true
  },
  currentFileName: {
    type: String,
    default: ''
  },
  currentFilePath: {
    type: String,
    default: ''
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false
  },
  showFileInfo: {
    type: Boolean,
    default: true
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  tabLabel: {
    type: String,
    required: true
  },
  tabIcon: {
    type: String,
    default: 'bi bi-grid-3x3-gap'
  },
  displayedRowCount: {
    type: Number,
    default: null
  },
  totalRowCount: {
    type: Number,
    default: null
  },
  showRowCount: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['search', 'exit-fullscreen']);

const searchText = ref('');

const handleSearch = () => {
  emit('search', searchText.value);
};

// Watch for external search text changes (if needed)
watch(() => searchText.value, (newValue) => {
  if (newValue === '') {
    emit('search', '');
  }
});
</script>

<style scoped>
/* Fullscreen Header */
.fullscreen-header-new {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-bottom: 2px solid #3498db;
  z-index: 9999;
  position: relative;
  min-height: 56px;
  flex-shrink: 0;
}

/* Search Bar (Fullscreen) */
.search-bar-container .input-group {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 8px;
}

.search-bar-container .input-group-text {
  color: rgba(255, 255, 255, 0.7);
}

.search-bar-container .form-control {
  background-color: transparent;
  color: #ffffff;
}

.search-bar-container .form-control::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-bar-container .form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  box-shadow: none;
}

/* Action Icon Buttons (Fullscreen) */
.action-icon-btn {
  width: 38px;
  height: 38px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 4px;
}

.action-icon-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.action-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* File Name Discrete (Fullscreen) */
.file-name-discrete {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.file-name-discrete:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

/* Grid Label (Fullscreen) */
.grid-label {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: #ffffff;
  font-weight: 600;
  min-width: 140px;
  justify-content: center;
}

/* Toolbar */
.toolbar {
  background-color: var(--bs-body-bg);
  flex-shrink: 0;
}

[data-theme="dark"] .toolbar {
  background-color: #2d2d2d;
  color: #e4e4e4;
}

/* Search bar styling */
.search-icon {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.search-input {
  background-color: #ffffff;
  border-color: #dee2e6;
  color: #212529;
}

.search-input::placeholder {
  color: #6c757d;
}

.search-input:focus {
  background-color: #ffffff;
  border-color: #86b7fe;
  color: #212529;
}

/* Dark mode search bar styling */
[data-theme="dark"] .search-icon {
  background-color: #2d2d2d;
  border-color: #495057;
  color: #adb5bd;
}

[data-theme="dark"] .search-input {
  background-color: #1e1e1e;
  border-color: #495057;
  color: #e4e4e4;
}

[data-theme="dark"] .search-input::placeholder {
  color: #6c757d;
}

[data-theme="dark"] .search-input:focus {
  background-color: #2d2d2d;
  border-color: #4da6ff;
  color: #e4e4e4;
}

/* File info styling */
.file-info-container {
  background-color: rgba(40, 167, 69, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #28a745;
}

.file-name {
  font-size: 0.95rem;
  color: var(--bs-body-color);
}


/* Dark mode file info visibility */
[data-theme="dark"] .toolbar .text-muted {
  color: #adb5bd !important;
}

[data-theme="dark"] .toolbar .text-success {
  color: #28a745 !important;
}

[data-theme="dark"] .file-info-container {
  background-color: rgba(40, 167, 69, 0.15);
  border-left-color: #4caf50;
}

[data-theme="dark"] .file-name {
  color: #e4e4e4;
}
</style>
