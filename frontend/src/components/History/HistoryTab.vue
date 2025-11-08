<template>
  <div class="history-tab h-100 d-flex flex-column">
    <!-- Reusable Toolbar Component -->
    <TabToolbar
      :is-fullscreen="isFullscreen"
      :current-file-name="excelFileState.currentFileName"
      :has-unsaved-changes="excelFileState.hasUnsavedChanges"
      :show-file-info="!!excelFileState.currentFile"
      :show-search="historyItems.length > 0"
      tab-label="Send History"
      tab-icon="bi bi-list-check"
      search-placeholder="Search history..."
      @search="handleSearch"
      @exit-fullscreen="isFullscreen = false"
    >
      <!-- Toolbar action buttons -->
      <template #toolbar-actions>
        <span v-if="historyItems.length > 0" class="badge bg-info item-count-badge">
          {{ historyItems.length }} {{ historyItems.length === 1 ? 'item' : 'items' }}
        </span>
        <button
          v-if="historyItems.length > 0"
          @click="clearHistory"
          class="btn btn-sm btn-outline-danger"
          title="Clear all history"
        >
          <i class="bi bi-trash"></i>
        </button>
      </template>

      <!-- Fullscreen action buttons -->
      <template #fullscreen-actions>
        <span v-if="historyItems.length > 0" class="badge bg-info item-count-badge-fullscreen">
          {{ historyItems.length }} {{ historyItems.length === 1 ? 'item' : 'items' }}
        </span>
        <button
          v-if="historyItems.length > 0"
          @click="clearHistory"
          class="btn btn-sm action-icon-btn"
          title="Clear all history"
        >
          <i class="bi bi-trash"></i>
        </button>
      </template>
    </TabToolbar>

    <!-- Loading State -->
    <div v-if="loading" class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">Loading send history...</p>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="historyItems.length === 0" class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center text-muted">
        <i class="bi bi-list-check" style="font-size: 5rem; opacity: 0.3;"></i>
        <h4 class="mt-3">No Send History</h4>
        <p>Send items to zzTakeoff to see them listed here</p>
      </div>
    </div>

    <!-- AG Grid -->
    <div v-else class="flex-grow-1 position-relative">
      <ag-grid-vue
        class="h-100"
        :class="theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'"
        :columnDefs="columnDefs"
        :rowData="filteredItems"
        :defaultColDef="defaultColDef"
        :pagination="true"
        :paginationPageSize="50"
        :paginationPageSizeSelector="[20, 50, 100, 200]"
        @grid-ready="onGridReady"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { AgGridVue } from 'ag-grid-vue3';
import TabToolbar from '../common/TabToolbar.vue';
import useElectronAPI from '../../composables/useElectronAPI';

const api = useElectronAPI();
const router = useRouter();
const theme = inject('theme');
const isFullscreen = inject('isFullscreen');
const excelFileState = inject('excelFileState');

// State
const loading = ref(false);
const historyData = ref([]);
const gridApi = ref(null);
const searchText = ref('');

// Flatten history entries to individual items with send count
const historyItems = computed(() => {
  const itemMap = new Map();

  // Process all history entries
  historyData.value.forEach(entry => {
    entry.items?.forEach(item => {
      // Create a unique key for each item (using code + description)
      const itemKey = `${item.code}_${item.description}`;

      if (itemMap.has(itemKey)) {
        // Item already exists, increment send count
        const existing = itemMap.get(itemKey);
        existing.sendCount++;
        existing.lastSent = entry.date; // Update to most recent send
      } else {
        // New item
        itemMap.set(itemKey, {
          ...item,
          sendCount: 1,
          lastSent: entry.date,
          projectId: entry.projectId || 'unknown',
          projectName: entry.projectName || entry.project || 'Unknown Project'
        });
      }
    });
  });

  return Array.from(itemMap.values());
});

// Filter items based on search text
const filteredItems = computed(() => {
  if (!searchText.value) {
    return historyItems.value;
  }

  const search = searchText.value.toLowerCase();
  return historyItems.value.filter(item => {
    return (
      item.code?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.takeoffType?.toLowerCase().includes(search) ||
      item.costType?.toLowerCase().includes(search) ||
      item.projectName?.toLowerCase().includes(search)
    );
  });
});

// Column definitions
const columnDefs = ref([
  {
    field: 'code',
    headerName: 'Code/SKU',
    width: 150,
    pinned: 'left'
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 2,
    minWidth: 300
  },
  {
    field: 'takeoffType',
    headerName: 'Takeoff Type',
    width: 130
  },
  {
    field: 'costType',
    headerName: 'Cost Type',
    width: 130
  },
  {
    field: 'units',
    headerName: 'Units',
    width: 100
  },
  {
    field: 'costEach',
    headerName: 'Cost Each',
    width: 120,
    valueFormatter: (params) => {
      if (params.value === null || params.value === undefined) return '';
      return `$${Number(params.value).toFixed(2)}`;
    }
  },
  {
    field: 'markup',
    headerName: 'Markup %',
    width: 120,
    valueFormatter: (params) => {
      if (params.value === null || params.value === undefined) return '';
      return `${params.value}%`;
    }
  },
  {
    field: 'total',
    headerName: 'Total',
    width: 130,
    valueFormatter: (params) => {
      if (params.value === null || params.value === undefined) return '';
      return `$${Number(params.value).toFixed(2)}`;
    }
  },
  {
    field: 'sendCount',
    headerName: 'Times Sent',
    width: 130,
    pinned: 'right',
    cellClass: 'send-count-cell',
    cellStyle: (params) => {
      // Highlight cells that have been sent multiple times
      if (params.value && params.value > 1) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
          backgroundColor: isDark ? '#1e4620' : '#d1f2d5',
          color: isDark ? '#8fd19e' : '#0f5132',
          fontWeight: '700'
        };
      }
      return null;
    },
    valueFormatter: (params) => {
      if (params.value === null || params.value === undefined) return '';
      return `${params.value}x`;
    }
  },
  {
    field: 'lastSent',
    headerName: 'Last Sent',
    width: 180,
    pinned: 'right',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString();
    }
  },
  {
    field: 'projectId',
    headerName: 'Project',
    width: 250,
    cellRenderer: (params) => {
      const projectId = params.value;

      if (projectId && projectId !== 'unknown') {
        const url = `https://www.zztakeoff.com/app/takeoff?projectId=${projectId}`;
        return `<a href="#" class="project-link" data-url="${url}" title="Open project in zzTakeoff">${projectId}</a>`;
      }
      return projectId || 'Unknown Project';
    },
    onCellClicked: (params) => {
      const linkElement = params.event.target;
      if (linkElement.classList.contains('project-link')) {
        params.event.preventDefault();
        const url = linkElement.getAttribute('data-url');
        // Navigate to zzTakeoff Web tab and load the URL
        navigateToProject(url);
      }
    }
  }
]);

// Default column definition
const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 100
};

// Grid ready handler
const onGridReady = (params) => {
  gridApi.value = params.api;
};

// Handle search
const handleSearch = (search) => {
  searchText.value = search;
};

// Load history data
const loadHistory = async () => {
  loading.value = true;
  try {
    const result = await api.sendHistory.getList();
    if (result.success) {
      historyData.value = result.data || [];
    }
  } catch (error) {
    console.error('Error loading send history:', error);
  } finally {
    loading.value = false;
  }
};

// Clear history
const clearHistory = async () => {
  const confirmed = confirm('Are you sure you want to clear all send history? This cannot be undone.');
  if (!confirmed) return;

  try {
    const result = await api.sendHistory.clear();
    if (result.success) {
      historyData.value = [];
    }
  } catch (error) {
    console.error('Error clearing history:', error);
    alert('Failed to clear history: ' + error.message);
  }
};

// Navigate to project in zzTakeoff Web tab
const navigateToProject = async (url) => {
  try {
    // Navigate to zzTakeoff Web tab
    await router.push('/zztakeoff-web');

    // Wait a bit for the tab to mount, then navigate to the URL
    setTimeout(async () => {
      await api.webview.navigate(url);
    }, 500);
  } catch (error) {
    console.error('Error navigating to project:', error);
  }
};

// Load data on mount
onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.history-tab {
  background-color: var(--bs-body-bg);
}

/* Send count cell styling */
.send-count-cell {
  text-align: center;
}

/* Item count badge styling - match button height */
.item-count-badge {
  display: inline-flex;
  align-items: center;
  height: 31px;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Fullscreen badge styling */
.item-count-badge-fullscreen {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Project link styling */
:deep(.project-link) {
  color: #0d6efd;
  text-decoration: none;
  cursor: pointer;
}

:deep(.project-link:hover) {
  color: #0a58ca;
  text-decoration: underline;
}

[data-theme="dark"] :deep(.project-link) {
  color: #6ea8fe;
}

[data-theme="dark"] :deep(.project-link:hover) {
  color: #9ec5fe;
}

/* Dark mode text visibility */
[data-theme="dark"] .history-tab h4 {
  color: #e4e4e4;
}

[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
}
</style>
