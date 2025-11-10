<template>
  <div class="recents-tab h-100 d-flex flex-column">
    <!-- Fullscreen Header (shown only in fullscreen mode) -->
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
            v-model="searchQuery"
            type="text"
            class="form-control border-0"
            placeholder="Search files..."
            @input="onSearchChange"
          />
          <button
            v-if="searchQuery"
            class="btn btn-sm action-icon-btn"
            type="button"
            @click="clearSearch"
            title="Clear search"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <!-- Custom Action Icons (Right Side) -->
      <div class="d-flex align-items-center gap-2 ms-auto">
        <button
          @click="showColumnPicker = true"
          class="btn btn-sm action-icon-btn"
          title="Manage Columns (show/hide, reorder)"
        >
          <i class="bi bi-layout-three-columns"></i>
        </button>
        <button
          v-if="recentFiles.length > 0"
          @click="clearRecents"
          class="btn btn-sm action-icon-btn"
          title="Clear all recent files"
        >
          <i class="bi bi-trash"></i>
        </button>

        <!-- Exit Fullscreen Icon -->
        <button
          @click="isFullscreen = false"
          class="btn btn-sm action-icon-btn"
          title="Exit fullscreen"
        >
          <i class="bi bi-fullscreen-exit"></i>
        </button>

        <!-- Tab Label -->
        <div class="grid-label d-flex align-items-center gap-2 px-3 py-2">
          <i class="bi bi-clock-history"></i>
          <span>Recent Files</span>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar p-2 border-bottom d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3 flex-grow-1">
        <div>
          <h5 class="mb-0">
            <i class="bi bi-clock-history me-2"></i>
            Recent Files
          </h5>
          <p class="text-muted small mb-0">
            {{ filteredCount }} file{{ filteredCount !== 1 ? 's' : '' }}
            <span v-if="searchQuery && filteredCount !== recentFiles.length">
              (filtered from {{ recentFiles.length }})
            </span>
          </p>
        </div>

        <!-- Search Bar -->
        <div class="search-bar-container flex-grow-1">
          <div class="input-group input-group-sm">
            <span class="input-group-text search-icon">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control search-input"
              placeholder="Search files..."
              @input="onSearchChange"
            />
            <button
              v-if="searchQuery"
              class="btn btn-outline-secondary btn-clear-search"
              type="button"
              @click="clearSearch"
              title="Clear search"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button
          @click="showColumnPicker = true"
          class="btn btn-sm btn-outline-secondary action-btn-icon"
          title="Manage Columns (show/hide, reorder)"
        >
          <i class="bi bi-layout-three-columns"></i>
        </button>
        <button
          v-if="recentFiles.length > 0"
          @click="clearRecents"
          class="btn btn-sm btn-outline-danger action-btn-icon"
          title="Clear all recent files"
        >
          <i class="bi bi-trash"></i>
        </button>
        <FullscreenButton />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Loading recent files...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="recentFiles.length === 0" class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center text-muted">
        <i class="bi bi-clock-history" style="font-size: 4rem; opacity: 0.3;"></i>
        <h5 class="mt-3">No Recent Files</h5>
        <p>Open an Excel file to see it listed here</p>
      </div>
    </div>

    <!-- AG Grid -->
    <div v-else class="flex-grow-1 ag-grid-container">
      <ag-grid-vue
        :class="gridTheme"
        style="width: 100%; height: 100%;"
        :columnDefs="columnDefs"
        :rowData="recentFiles"
        :defaultColDef="defaultColDef"
        :getRowClass="getRowClass"
        :context="{ componentParent }"
        :pagination="true"
        :paginationPageSize="20"
        :paginationPageSizeSelector="[10, 20, 50, 100]"
        :suppressCellFocus="true"
        @grid-ready="onGridReady"
      />
    </div>

    <!-- Column Picker Modal -->
    <ColumnPickerModal
      :is-open="showColumnPicker"
      :column-defs="columnDefs"
      :grid-api="gridApi"
      @close="showColumnPicker = false"
      @apply="applyColumnChanges"
    />
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AgGridVue } from 'ag-grid-vue3';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import FullscreenButton from '../common/FullscreenButton.vue';
import FullscreenNavigation from '../common/FullscreenNavigation.vue';
import ColumnPickerModal from '../Excel/ColumnPickerModal.vue';
import useElectronAPI from '../../composables/useElectronAPI';

const api = useElectronAPI();
const router = useRouter();
const isFullscreen = inject('isFullscreen');
const theme = inject('theme', 'light');

const recentFiles = ref([]);
const loading = ref(true);
const gridApi = ref(null);
const searchQuery = ref('');
const filteredCount = ref(0);
const showColumnPicker = ref(false);

// Track currently open file from session storage
const currentlyOpenFile = computed(() => {
  try {
    // Check session storage for currently open file
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith('excelGrid_')) {
        const filePath = key.replace('excelGrid_', '');
        return filePath;
      }
    }
  } catch (err) {
    console.warn('Error accessing session storage:', err);
  }
  return null;
});

// Theme for AG Grid
const gridTheme = computed(() => {
  return theme.value === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';
});

// Format file size in bytes to human readable
const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

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

// File Path cell renderer - using simple function renderer instead
const FilePathCellRenderer = (params) => {
  if (!params.value) return '';
  return params.value;
};

// Actions cell renderer - using simple function renderer instead
const ActionsCellRenderer = (params) => {
  return `
    <div class="d-flex gap-1">
      <button
        class="btn btn-sm btn-primary open-file-btn"
        title="Open file"
        data-file='${JSON.stringify(params.data).replace(/'/g, '&#39;')}'
      >
        <i class="bi bi-folder2-open"></i>
      </button>
      <button
        class="btn btn-sm btn-outline-danger remove-file-btn"
        title="Remove from recents"
        data-filepath="${params.data.filePath}"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
};

// File Name cell renderer - using simple function renderer instead
const FileNameCellRenderer = (params) => {
  if (!params.value) return '';

  // Check if this file is currently open
  let isOpen = false;
  try {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith('excelGrid_')) {
        const openFilePath = key.replace('excelGrid_', '');
        if (openFilePath === params.data?.filePath) {
          isOpen = true;
          break;
        }
      }
    }
  } catch (err) {
    // ignore
  }

  const openBadge = isOpen ? '<span class="badge bg-success ms-2 pulse-badge" title="Currently open in Excel Grid tab"><i class="bi bi-check-circle-fill"></i> OPEN</span>' : '';
  const openIcon = isOpen ? '<i class="bi bi-file-earmark-excel-fill text-success" style="font-size: 1.2rem;"></i>' : '<i class="bi bi-file-earmark-excel text-success"></i>';

  return `
    <div class="d-flex align-items-center gap-2">
      ${openIcon}
      <strong>${params.value}</strong>
      ${openBadge}
    </div>
  `;
};

// Column definitions
const columnDefs = ref([
  {
    headerName: 'File Name',
    field: 'fileName',
    flex: 2,
    minWidth: 200,
    cellRenderer: FileNameCellRenderer
  },
  {
    headerName: 'File Size',
    field: 'fileSize',
    width: 120,
    valueFormatter: (params) => formatFileSize(params.value)
  },
  {
    headerName: 'Rows',
    field: 'rowCount',
    width: 100,
    valueFormatter: (params) => {
      if (params.value === null || params.value === undefined) return '-';
      return params.value.toLocaleString();
    }
  },
  {
    headerName: 'Sheets',
    field: 'sheetName',
    width: 150,
    valueFormatter: (params) => {
      if (!params.value || params.value === '') return '-';
      return params.value;
    }
  },
  {
    headerName: 'Last Opened',
    field: 'lastOpened',
    width: 180,
    sort: 'desc',
    valueFormatter: (params) => formatRelativeTime(params.value),
    tooltipValueGetter: (params) => formatDate(params.value)
  },
  {
    headerName: 'Date Created',
    field: 'dateCreated',
    width: 180,
    valueFormatter: (params) => formatDate(params.value)
  },
  {
    headerName: 'Date Modified',
    field: 'dateModified',
    width: 180,
    valueFormatter: (params) => formatDate(params.value)
  },
  {
    headerName: 'File Path',
    field: 'filePath',
    flex: 1,
    minWidth: 300,
    cellClass: 'text-muted small',
    cellRenderer: FilePathCellRenderer
  },
  {
    headerName: 'Actions',
    field: '_actions',
    width: 140,
    pinned: 'right',
    cellRenderer: ActionsCellRenderer,
    sortable: false,
    filter: false,
    suppressSizeToFit: true
  }
]);

// Default column definition
const defaultColDef = ref({
  sortable: true,
  filter: true,
  resizable: true,
  suppressMovable: false
});

// Row class rules - highlight currently open file
const getRowClass = (params) => {
  try {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith('excelGrid_')) {
        const openFilePath = key.replace('excelGrid_', '');
        if (openFilePath === params.data?.filePath) {
          return 'currently-open-row';
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return '';
};

// Grid ready event
const onGridReady = (params) => {
  gridApi.value = params.api;
  params.api.sizeColumnsToFit();
  updateFilteredCount();

  // Listen for filter changes to update count
  params.api.addEventListener('filterChanged', updateFilteredCount);

  // Add click handlers for action buttons
  setTimeout(() => {
    const gridElement = document.querySelector('.ag-grid-container');
    if (gridElement) {
      gridElement.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('open-file-btn')) {
          const fileData = target.getAttribute('data-file');
          if (fileData) {
            try {
              const file = JSON.parse(fileData);
              openRecentFile(file);
            } catch (err) {
              console.error('Error parsing file data:', err);
            }
          }
        } else if (target.classList.contains('remove-file-btn')) {
          const filePath = target.getAttribute('data-filepath');
          if (filePath) {
            removeRecent(filePath);
          }
        }
      });
    }
  }, 100);
};

// Update filtered row count
const updateFilteredCount = () => {
  if (gridApi.value) {
    filteredCount.value = gridApi.value.getDisplayedRowCount();
  } else {
    filteredCount.value = recentFiles.value.length;
  }
};

// Search functionality
const onSearchChange = () => {
  if (gridApi.value) {
    gridApi.value.setGridOption('quickFilterText', searchQuery.value);
  }
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  onSearchChange();
};

// Load recent files
const loadRecents = async () => {
  try {
    loading.value = true;
    const result = await api.recentsStore.getAll();
    if (result.success && Array.isArray(result.data)) {
      // Filter to only show Excel files and sort by lastOpened (most recent first)
      recentFiles.value = result.data
        .filter(item => item.type === 'excel' && item.filePath)
        .sort((a, b) => new Date(b.lastOpened || b.lastUsed) - new Date(a.lastOpened || a.lastUsed));

      filteredCount.value = recentFiles.value.length;
      console.log('[RecentsTab] Loaded recent files:', recentFiles.value);
    }
  } catch (error) {
    console.error('Error loading recent files:', error);
  } finally {
    loading.value = false;
  }
};

// Open a recent file
const openRecentFile = async (file) => {
  try {
    console.log('[RecentsTab] Opening recent file:', file.filePath);

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

// Apply column changes from column picker
const applyColumnChanges = (newColumnDefs) => {
  columnDefs.value = newColumnDefs;
  showColumnPicker.value = false;
};

// Open folder containing file
const openFileFolder = async (filePath) => {
  if (!filePath) return;
  try {
    const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
    if (api.shell?.openPath) {
      await api.shell.openPath(folderPath);
    }
  } catch (error) {
    console.error('Error opening folder:', error);
  }
};

// Refresh grid to update visual indicators
const refreshGrid = () => {
  if (gridApi.value) {
    gridApi.value.redrawRows();
  }
};

// Event handlers for cleanup
let visibilityHandler = null;
let routerUnwatch = null;

// Load on mount and refresh grid when becoming visible
onMounted(() => {
  loadRecents();

  // Add event listener to refresh when tab becomes visible
  visibilityHandler = () => {
    if (!document.hidden && router.currentRoute.value.path === '/recents') {
      setTimeout(() => {
        refreshGrid();
      }, 100);
    }
  };

  document.addEventListener('visibilitychange', visibilityHandler);

  // Listen for route changes
  routerUnwatch = router.afterEach((to) => {
    if (to.path === '/recents') {
      setTimeout(() => {
        refreshGrid();
      }, 100);
    }
  });
});

// Cleanup on unmount
onBeforeUnmount(() => {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  if (routerUnwatch) {
    routerUnwatch();
  }
});

// Provide component parent context for AG Grid cell renderers
const componentParent = {
  openRecentFile,
  removeRecent,
  openFileFolder
};
</script>

<style scoped>
.recents-tab {
  background-color: var(--bs-body-bg);
}

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

/* Grid Label (Fullscreen) */
.grid-label {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: #ffffff;
  font-weight: 600;
  min-width: 140px;
  justify-content: center;
}

.toolbar {
  background-color: var(--bs-body-bg);
  flex-shrink: 0;
}

/* Search bar styling for normal toolbar */
.toolbar .search-icon {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.toolbar .search-input {
  background-color: #ffffff;
  border-color: #dee2e6;
  color: #212529;
}

.toolbar .search-input::placeholder {
  color: #6c757d;
}

.toolbar .search-input:focus {
  background-color: #ffffff;
  border-color: #86b7fe;
  color: #212529;
}

.toolbar .btn-clear-search {
  border-color: #dee2e6;
}

/* Dark mode search bar styling for normal toolbar */
[data-theme="dark"] .toolbar .search-icon {
  background-color: #2d2d2d;
  border-color: #495057;
  color: #adb5bd;
}

[data-theme="dark"] .toolbar .search-input {
  background-color: #1e1e1e;
  border-color: #495057;
  color: #e4e4e4;
}

[data-theme="dark"] .toolbar .search-input::placeholder {
  color: #6c757d;
}

[data-theme="dark"] .toolbar .search-input:focus {
  background-color: #2d2d2d;
  border-color: #4da6ff;
  color: #e4e4e4;
}

[data-theme="dark"] .toolbar .btn-clear-search {
  border-color: #495057;
  color: #adb5bd;
}

[data-theme="dark"] .toolbar .btn-clear-search:hover {
  background-color: #495057;
  color: #ffffff;
}

/* Icon-only action buttons */
.action-btn-icon {
  width: 38px;
  height: 38px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn-icon i {
  font-size: 1rem;
}

.ag-grid-container {
  overflow: hidden;
}

/* File path text styling - ensure visibility */
.ag-grid-container .text-muted {
  color: #ffffff !important;
}

.ag-grid-container .text-muted.small {
  color: #ffffff !important;
}

/* Dark mode file path text - white to match other grid text */
[data-theme="dark"] .ag-grid-container .text-muted,
[data-theme="dark"] .ag-grid-container .ag-cell.text-muted,
[data-theme="dark"] .ag-theme-quartz-dark .text-muted,
[data-theme="dark"] .ag-theme-quartz-dark .ag-cell.text-muted {
  color: #ffffff !important;
}

[data-theme="dark"] .ag-grid-container .text-muted.small,
[data-theme="dark"] .ag-grid-container .ag-cell.text-muted.small,
[data-theme="dark"] .ag-theme-quartz-dark .text-muted.small,
[data-theme="dark"] .ag-theme-quartz-dark .ag-cell.text-muted.small {
  color: #ffffff !important;
}

/* File path link styling */
.file-path-link {
  color: #6c757d;
  text-decoration: none;
}

.file-path-link:hover {
  color: #0d6efd;
  text-decoration: underline;
  cursor: pointer;
}

/* File path link dark mode */
[data-theme="dark"] .file-path-link {
  color: #adb5bd;
}

[data-theme="dark"] .file-path-link:hover {
  color: #4da6ff;
}

/* Currently open file row highlighting */
.ag-grid-container :deep(.currently-open-row) {
  background-color: rgba(25, 135, 84, 0.1) !important;
  border-left: 4px solid #198754 !important;
  font-weight: 500;
}

.ag-grid-container :deep(.currently-open-row:hover) {
  background-color: rgba(25, 135, 84, 0.15) !important;
}

/* Dark mode currently open row */
[data-theme="dark"] .ag-grid-container :deep(.currently-open-row) {
  background-color: rgba(25, 135, 84, 0.2) !important;
  border-left: 4px solid #20c997 !important;
}

[data-theme="dark"] .ag-grid-container :deep(.currently-open-row:hover) {
  background-color: rgba(25, 135, 84, 0.25) !important;
}

/* Pulsing badge animation for currently open file */
.pulse-badge {
  animation: pulse 2s ease-in-out infinite;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Dark mode support */
[data-theme="dark"] .recents-tab {
  background-color: #1e1e1e;
}

[data-theme="dark"] .fullscreen-header,
[data-theme="dark"] .toolbar {
  background-color: #2d2d2d;
  border-color: #3e3e3e;
}

[data-theme="dark"] .fullscreen-header h5,
[data-theme="dark"] .toolbar h5 {
  color: #e4e4e4;
}

[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
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
</style>
