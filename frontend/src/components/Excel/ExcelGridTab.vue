<template>
  <div class="excel-grid-tab h-100 d-flex flex-column">
    <!-- Reusable Toolbar Component -->
    <TabToolbar
      :is-fullscreen="isFullscreen"
      :current-file-name="currentFileName"
      :current-file-path="currentFile"
      :has-unsaved-changes="hasUnsavedChanges"
      :show-file-info="!!currentFile"
      :show-search="!!currentFile"
      :show-row-count="!!currentFile"
      :displayed-row-count="displayedRowCount"
      :total-row-count="totalRowCount"
      tab-label="Excel Grid"
      tab-icon="bi bi-grid-3x3-gap"
      @search="handleSearch"
      @exit-fullscreen="isFullscreen = false"
    >
      <!-- Fullscreen action buttons -->
      <template #fullscreen-actions>
        <button
          @click="clearAllFilters"
          class="btn btn-sm action-icon-btn"
          :disabled="!currentFile || rowData.length === 0"
          title="Clear all filters"
        >
          <i class="bi bi-funnel-fill"></i>
        </button>
        <button
          @click="selectAllFiltered"
          class="btn btn-sm action-icon-btn"
          :disabled="!currentFile || rowData.length === 0"
          title="Select all visible rows"
        >
          <i class="bi bi-check-square"></i>
        </button>
        <button
          @click="deselectAll"
          class="btn btn-sm action-icon-btn"
          :disabled="!currentFile || selectedRowsCount === 0"
          title="Deselect all rows"
        >
          <i class="bi bi-x-square"></i>
        </button>
        <button
          @click="openSendToTemplateModal"
          class="btn btn-sm action-icon-btn"
          :disabled="!currentFile || selectedRowsCount === 0"
          title="Send selected items to template"
        >
          <i class="bi bi-folder-plus"></i>
        </button>
        <button
          @click="openUpdateTemplateModal"
          class="btn btn-sm action-icon-btn"
          :disabled="!currentFile || rowData.length === 0"
          title="Update template from all Excel rows (based on SKU matching)"
        >
          <i class="bi bi-arrow-repeat"></i>
        </button>
        <button
          @click="showColumnPicker = true"
          class="btn btn-sm action-icon-btn"
          :disabled="!currentFile"
          title="Manage Columns (show/hide, reorder)"
        >
          <i class="bi bi-layout-three-columns"></i>
        </button>
      </template>

      <!-- Toolbar action buttons -->
      <template #toolbar-actions>
        <button
          v-if="currentFile"
          @click="clearAllFilters"
          class="btn btn-sm btn-outline-info"
          :disabled="!currentFile || rowData.length === 0"
          title="Clear all filters"
        >
          <i class="bi bi-funnel-fill"></i>
        </button>
        <button
          v-if="currentFile"
          @click="selectAllFiltered"
          class="btn btn-sm btn-outline-primary"
          :disabled="!currentFile || rowData.length === 0"
          title="Select all visible rows"
        >
          <i class="bi bi-check-square"></i>
        </button>
        <button
          v-if="currentFile"
          @click="deselectAll"
          class="btn btn-sm btn-outline-secondary"
          :disabled="!currentFile || selectedRowsCount === 0"
          title="Deselect all rows"
        >
          <i class="bi bi-x-square"></i>
        </button>
        <span v-if="currentFile && selectedRowsCount > 0" class="badge bg-primary">
          {{ selectedRowsCount }} selected
        </span>
        <button
          v-if="currentFile"
          @click="openSendToTemplateModal"
          class="btn btn-sm btn-success"
          :disabled="!currentFile || selectedRowsCount === 0"
          title="Send selected items to template"
        >
          <i class="bi bi-folder-plus"></i>
        </button>
        <button
          v-if="currentFile"
          @click="openUpdateTemplateModal"
          class="btn btn-sm btn-outline-primary"
          :disabled="!currentFile || rowData.length === 0"
          title="Update template from all Excel rows (based on SKU matching)"
        >
          <i class="bi bi-arrow-repeat"></i>
        </button>
        <button
          v-if="currentFile"
          @click="showColumnPicker = true"
          class="btn btn-sm btn-outline-secondary"
          :disabled="!currentFile"
          title="Manage Columns (show/hide, reorder)"
        >
          <i class="bi bi-layout-three-columns"></i> Columns
        </button>
      </template>
    </TabToolbar>

    <!-- Loading State -->
    <div v-if="loading" class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- No File State -->
    <div v-else-if="!currentFile" class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center text-muted">
        <i class="bi bi-file-earmark-excel" style="font-size: 5rem; opacity: 0.3;"></i>
        <h4 class="mt-3">No Excel File Loaded</h4>
        <p>Click "Open File" to load an Excel spreadsheet</p>
        <button @click="openFile" class="btn btn-primary mt-2">
          <i class="bi bi-folder2-open me-2"></i>
          Open Excel File
        </button>
      </div>
    </div>

    <!-- AG Grid -->
    <div v-else class="flex-grow-1 position-relative">
      <!-- Sheet selector for multi-sheet files -->
      <div v-if="availableSheets.length > 1" class="p-2 bg-light border-bottom">
        <label class="form-label mb-1 small">Sheet:</label>
        <select
          v-model="currentSheetName"
          @change="onSheetChange"
          class="form-select form-select-sm"
          style="max-width: 300px;"
        >
          <option v-for="sheet in availableSheets" :key="sheet.name" :value="sheet.name">
            {{ sheet.name }} ({{ sheet.rowCount }} rows)
          </option>
        </select>
      </div>

      <ag-grid-vue
        class="h-100"
        :class="theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :pagination="true"
        :paginationPageSize="100"
        :paginationPageSizeSelector="[50, 100, 200, 500]"
        :suppressCellFocus="false"
        :enableCellTextSelection="true"
        :enableBrowserTooltips="true"
        :ensureDomOrder="true"
        :rowSelection="rowSelectionConfig"
        :navigateToNextCell="navigateToNextCell"
        :getRowId="getRowId"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
        @selection-changed="onSelectionChanged"
        @cell-key-down="onCellKeyDown"
      />
    </div>

    <!-- Send to Template Modal -->
    <SendToTemplateModal
      :is-open="showSendToTemplateModal"
      :items="selectedRows"
      @close="closeSendToTemplateModal"
      @sent="handleSentToTemplate"
    />

    <UpdateTemplateModal
      :is-open="showUpdateTemplateModal"
      :items="rowData"
      :column-mappings="columnMappings"
      @close="closeUpdateTemplateModal"
      @updated="handleTemplateUpdated"
    />

    <ColumnPickerModal
      :visible="showColumnPicker"
      :columns="columnDefs"
      @close="showColumnPicker = false"
      @apply="handleColumnChanges"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { AgGridVue } from 'ag-grid-vue3';
import SendToTemplateModal from '../Modals/SendToTemplateModal.vue';
import UpdateTemplateModal from '../Modals/UpdateTemplateModal.vue';
import ColumnPickerModal from './ColumnPickerModal.vue';
import TabToolbar from '../common/TabToolbar.vue';
import useElectronAPI from '../../composables/useElectronAPI';

const api = useElectronAPI();
const router = useRouter();
const theme = inject('theme');
const toggleTheme = inject('toggleTheme');
const isFullscreen = inject('isFullscreen');
const isMaximized = inject('webviewMaximized');

// Use shared state from App.vue for minimal file info only
const sharedState = inject('excelFileState');
const zzTakeoffState = inject('zzTakeoffState');

// Computed refs for shared simple state
const currentFile = computed({
  get: () => sharedState.value.currentFile,
  set: (val) => { sharedState.value.currentFile = val; }
});
const currentFileName = computed({
  get: () => sharedState.value.currentFileName,
  set: (val) => { sharedState.value.currentFileName = val; }
});
const hasUnsavedChanges = computed({
  get: () => sharedState.value.hasUnsavedChanges,
  set: (val) => { sharedState.value.hasUnsavedChanges = val; }
});

// Local state (AG Grid and Excel data - NOT shared to avoid serialization issues)
const rowData = ref([]);
const columnDefs = ref([]);
const excelData = ref(null);
const metadata = ref({});
const gridApi = ref(null);
const loading = ref(false);
const loadingMessage = ref('');

// SQLite pagination state
const availableSheets = ref([]);
const currentSheetName = ref('');
const totalRowCount = ref(0);
const displayedRowCount = ref(0);

// Load all rows from SQLite for the current sheet
const loadSheetData = async () => {
  if (!currentFile.value || !currentSheetName.value) {
    rowData.value = [];
    return;
  }

  try {
    loading.value = true;
    loadingMessage.value = 'Loading sheet data...';

    // Get default markup from preferences
    let defaultMarkupPercent = null;
    if (api.preferencesStore?.get) {
      const prefsResult = await api.preferencesStore.get();
      defaultMarkupPercent = prefsResult?.data?.defaultMarkupPercent;
    }

    // Query ALL rows from SQLite (offset=0, limit=-1 means all rows)
    const result = await api.excel.querySheet(
      currentFile.value,
      currentSheetName.value,
      0,
      -1  // -1 means load all rows
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to load sheet data');
    }

    // Merge with metadata
    const rowsWithMetadata = result.data.map(row => {
      const rowHash = row._rowHash;
      const meta = metadata.value[rowHash] || {};

      return {
        ...row,
        _zzType: meta.zzType || row._zzType || '',
        _markupPercent: meta.markupPercent !== undefined ? meta.markupPercent : (defaultMarkupPercent || null),
        _markupManuallySet: meta.markupManuallySet || false,
        _costType: meta.costType || 'Other', // Default to 'Other'
        _sentToZzTakeoff: !!meta.lastSent,
        _lastSent: meta.lastSent,
        _sentCount: meta.sentCount || 0
      };
    });

    rowData.value = rowsWithMetadata;
    totalRowCount.value = result.totalRows;
    displayedRowCount.value = rowsWithMetadata.length;

    console.log('[SQLite] Loaded', rowsWithMetadata.length, 'rows from sheet:', currentSheetName.value);
  } catch (error) {
    console.error('[SQLite] Error loading sheet data:', error);
    rowData.value = [];
    totalRowCount.value = 0;
    displayedRowCount.value = 0;
  } finally {
    loading.value = false;
  }
};

// Load column mappings for sending to zzTakeoff
const columnMappings = ref(null);

// Modal state for Send to Template
const showSendToTemplateModal = ref(false);
const showUpdateTemplateModal = ref(false);
const showColumnPicker = ref(false);
const selectedRows = ref([]);
const selectedRowsCount = ref(0);

// Default column definition
const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  editable: true,
  minWidth: 100
};

// Row selection configuration (AG Grid v32+ API)
const rowSelectionConfig = {
  mode: 'multiRow',
  checkboxes: true,
  headerCheckbox: true,
  enableClickSelection: false
};

// Get row ID function for AG Grid (uses _rowHash for row identification)
const getRowId = (params) => {
  return params.data._rowHash;
};

// Session storage helpers for persistence across tab navigation
const saveToSession = () => {
  try {
    if (currentFile.value) {
      const sessionData = {
        rowData: rowData.value,
        columnDefs: columnDefs.value.map(col => ({
          field: col.field,
          headerName: col.headerName,
          editable: col.editable,
          minWidth: col.minWidth,
          flex: col.flex,
          width: col.width,
          maxWidth: col.maxWidth,
          pinned: col.pinned,
          cellClass: col.cellClass
        })),
        excelData: {
          filePath: excelData.value?.filePath,
          fileName: excelData.value?.fileName,
          sheets: excelData.value?.sheets?.map(sheet => ({
            name: sheet.name,
            headers: sheet.headers,
            hidden: sheet.hidden,
            data: sheet.data?.map(row => {
              const cleanRow = {};
              for (const [key, value] of Object.entries(row || {})) {
                if (!key.startsWith('_') || key === '_rowHash') {
                  cleanRow[key] = value;
                }
              }
              return cleanRow;
            })
          }))
        },
        metadata: metadata.value
      };
      sessionStorage.setItem('excelGridState', JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error saving to session storage:', error);
  }
};

const restoreFromSession = () => {
  try {
    const stored = sessionStorage.getItem('excelGridState');
    if (stored && currentFile.value) {
      const sessionData = JSON.parse(stored);

      // Restore data
      if (sessionData.rowData) rowData.value = sessionData.rowData;
      if (sessionData.metadata) metadata.value = sessionData.metadata;
      if (sessionData.excelData) excelData.value = sessionData.excelData;

      // Restore column definitions with cell editors/renderers/styles
      if (sessionData.columnDefs) {
        columnDefs.value = sessionData.columnDefs.map(col => {
          const colDef = { ...col };

          // Re-attach cell editor for zzType column
          if (col.field === '_zzType') {
            colDef.cellEditor = ZzTypeEditor;
          }

          // Re-attach cell editor AND cellStyle for Markup % column
          if (col.field === '_markupPercent') {
            colDef.cellEditor = MarkupPercentEditor;
            colDef.singleClickEdit = true;
            colDef.cellEditorPopup = false;

            // Re-attach the cellStyle function (not serializable, so must be re-added)
            colDef.cellStyle = (params) => {
              const isManual = params.data && params.data._markupManuallySet === true;

              if (isManual) {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

                if (isDark) {
                  return {
                    backgroundColor: '#006d7a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontStyle: 'italic',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  };
                } else {
                  return {
                    backgroundColor: '#fff9c4',
                    color: '#000000',
                    fontWeight: '700',
                    fontStyle: 'italic',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  };
                }
              }
              return null;
            };

            // Re-attach valueFormatter and valueParser
            colDef.valueFormatter = (params) => {
              if (params.value === null || params.value === undefined || params.value === '') {
                return '';
              }
              return `${params.value}%`;
            };

            colDef.valueParser = (params) => {
              const value = params.newValue;
              if (value === null || value === undefined || value === '') {
                return null;
              }
              const numericValue = parseFloat(String(value).replace('%', '').trim());
              return isNaN(numericValue) ? null : numericValue;
            };
          }

          // Re-attach cell editor for Cost Type column
          if (col.field === '_costType') {
            colDef.cellEditor = CostTypeEditor;
          }

          // Re-attach cell renderer for Actions column
          if (col.field === '_actions') {
            colDef.cellRenderer = ActionsCellRenderer;
          }

          return colDef;
        });
      }

      console.log('Restored Excel state from session storage');
      return true;
    }
  } catch (error) {
    console.error('Error restoring from session storage:', error);
  }
  return false;
};

const clearSession = () => {
  sessionStorage.removeItem('excelGridState');
};

// Computed stats
const rowsWithZzType = computed(() => {
  return rowData.value.filter(row => row._zzType).length;
});

const rowsSent = computed(() => {
  return rowData.value.filter(row => row._sentToZzTakeoff).length;
});

// Update displayed row count
const updateDisplayedRowCount = () => {
  if (gridApi.value) {
    displayedRowCount.value = gridApi.value.getDisplayedRowCount();
  } else {
    displayedRowCount.value = rowData.value.length;
  }
};

// Grid ready handler
const onGridReady = (params) => {
  gridApi.value = params.api;
  console.log('Grid ready');

  // Note: We use fixed widths (150px) for most columns and flex for Description
  // This gives Description all remaining space while keeping other columns compact

  // Update displayed row count initially
  updateDisplayedRowCount();

  // Listen for filter changes to update count
  params.api.addEventListener('filterChanged', updateDisplayedRowCount);
  params.api.addEventListener('modelUpdated', updateDisplayedRowCount);
};

// Sheet change handler
const onSheetChange = async () => {
  // Find the selected sheet
  const selectedSheet = availableSheets.value.find(s => s.name === currentSheetName.value);
  if (!selectedSheet) return;

  // Update total row count
  totalRowCount.value = selectedSheet.rowCount;

  // Load data for the new sheet
  await loadSheetData();

  console.log('[SQLite] Switched to sheet:', currentSheetName.value, 'with', totalRowCount.value, 'rows');
};

// Cell value changed handler
const onCellValueChanged = async (event) => {
  hasUnsavedChanges.value = true;

  // Track if Markup % was manually edited
  if (event.colDef.field === '_markupPercent') {
    // Mark this row's markup as manually set
    if (event.data && event.node) {
      event.data._markupManuallySet = true;

      // Force AG Grid to redraw this specific row (which re-evaluates cellStyle)
      if (gridApi.value) {
        // Update the node data first
        event.node.setData(event.data);

        // Then force a complete row redraw
        gridApi.value.redrawRows({ rowNodes: [event.node] });
      }
    }
  }

  // Persist change to SQLite
  if (currentFile.value && currentSheetName.value && event.data) {
    try {
      const rowId = event.data._id; // SQLite row ID
      const field = event.colDef.field;
      const newValue = event.newValue;

      // Build updates object
      const updates = {
        [field]: newValue
      };

      // If markup was manually set, also update that flag
      if (field === '_markupPercent') {
        updates._markupManuallySet = true;
      }

      // Update in SQLite
      await api.excel.updateRow(
        currentFile.value,
        currentSheetName.value,
        rowId,
        updates
      );

      console.log('[SQLite] Updated row', rowId, 'field', field, 'to', newValue);
    } catch (error) {
      console.error('[SQLite] Error updating row:', error);
    }
  }
};

// Selection changed handler
const onSelectionChanged = () => {
  if (gridApi.value) {
    selectedRows.value = gridApi.value.getSelectedRows();
    selectedRowsCount.value = selectedRows.value.length;
  }
};

// Tab/Shift+Tab and Arrow key navigation during cell editing
const onCellKeyDown = (event) => {
  const gridEvent = event.event;
  const key = gridEvent.key;

  if (!gridApi.value) return;

  // CRITICAL: For number inputs, prevent arrow up/down IMMEDIATELY before anything else
  const activeElement = document.activeElement;
  const isNumberInput = activeElement && activeElement.type === 'number';
  if (isNumberInput && (key === 'ArrowUp' || key === 'ArrowDown')) {
    gridEvent.preventDefault();
    gridEvent.stopPropagation();
    console.log('[KeyDown] Prevented arrow', key, 'on number input');
  }

  const editingCells = gridApi.value.getEditingCells();
  const isEditing = editingCells.length > 0;

  // Handle Tab and Shift+Tab for navigation
  if (key === 'Tab' && isEditing) {
    // Stop editing to save the value
    gridApi.value.stopEditing();

    // Get current cell position
    const focusedCell = gridApi.value.getFocusedCell();
    if (!focusedCell) return;

    let rowIndex = focusedCell.rowIndex;
    let colKey = focusedCell.column.getColId();

    // Get all columns
    const allColumns = gridApi.value.getAllDisplayedColumns();
    const currentColIndex = allColumns.findIndex(col => col.getColId() === colKey);

    if (gridEvent.shiftKey) {
      // Shift+Tab: Move to previous cell (left)
      if (currentColIndex > 0) {
        colKey = allColumns[currentColIndex - 1].getColId();
      } else if (rowIndex > 0) {
        rowIndex = rowIndex - 1;
        colKey = allColumns[allColumns.length - 1].getColId();
      }
    } else {
      // Tab: Move to next cell (right)
      if (currentColIndex < allColumns.length - 1) {
        colKey = allColumns[currentColIndex + 1].getColId();
      } else if (rowIndex < gridApi.value.getDisplayedRowCount() - 1) {
        rowIndex = rowIndex + 1;
        colKey = allColumns[0].getColId();
      }
    }

    gridApi.value.setFocusedCell(rowIndex, colKey);
    gridEvent.preventDefault();
    gridEvent.stopPropagation();
    return;
  }

  // Handle Arrow keys for navigation
  const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);

  if (isArrowKey && isEditing) {
    const activeElement = document.activeElement;
    const isInputElement = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA'
    );

    // For number inputs, ALWAYS prevent default on up/down arrows to stop incrementing
    const isNumberInput = activeElement && activeElement.type === 'number';
    if (isNumberInput && (key === 'ArrowUp' || key === 'ArrowDown')) {
      gridEvent.preventDefault();
      gridEvent.stopPropagation();
    }

    let shouldNavigate = false;

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      // Up/Down arrows always navigate
      shouldNavigate = true;
    } else if (isInputElement && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      // For left/right, check cursor position
      const cursorPos = activeElement.selectionStart;
      const textLength = activeElement.value.length;

      if (key === 'ArrowRight' && cursorPos === textLength) {
        // Cursor at end, right arrow should navigate
        shouldNavigate = true;
      } else if (key === 'ArrowLeft' && cursorPos === 0) {
        // Cursor at beginning, left arrow should navigate
        shouldNavigate = true;
      }
    }

    if (shouldNavigate) {
      // Stop editing to save the value
      gridApi.value.stopEditing();

      // Get current cell position
      const focusedCell = gridApi.value.getFocusedCell();
      if (!focusedCell) return;

      let rowIndex = focusedCell.rowIndex;
      let colKey = focusedCell.column.getColId();

      // Get all columns
      const allColumns = gridApi.value.getAllDisplayedColumns();
      const currentColIndex = allColumns.findIndex(col => col.getColId() === colKey);

      switch (key) {
        case 'ArrowUp':
          rowIndex = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          rowIndex = Math.min(gridApi.value.getDisplayedRowCount() - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          if (currentColIndex > 0) {
            colKey = allColumns[currentColIndex - 1].getColId();
          }
          break;
        case 'ArrowRight':
          if (currentColIndex < allColumns.length - 1) {
            colKey = allColumns[currentColIndex + 1].getColId();
          }
          break;
      }

      gridApi.value.setFocusedCell(rowIndex, colKey);

      // Only prevent default for left/right if we're navigating
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        gridEvent.preventDefault();
        gridEvent.stopPropagation();
      }
    }
  }
};

// Navigate to next cell callback (handles Enter key and default navigation)
const navigateToNextCell = (params) => {
  // Return the suggested next cell position
  // This allows default AG Grid navigation to work for Enter key
  return params.nextCellPosition;
};

// Clear all filters
const clearAllFilters = () => {
  if (gridApi.value) {
    gridApi.value.setFilterModel(null);
  }
};

// Select all filtered rows
const selectAllFiltered = () => {
  if (gridApi.value) {
    gridApi.value.forEachNodeAfterFilter((node) => {
      node.setSelected(true);
    });
  }
};

// Deselect all rows
const deselectAll = () => {
  if (gridApi.value) {
    gridApi.value.deselectAll();
  }
};

// Handle search (receives searchText from TabToolbar component)
const handleSearch = (searchText) => {
  if (searchText && searchText.trim() && gridApi.value) {
    // Use AG Grid's quick filter
    gridApi.value.setGridOption('quickFilterText', searchText);
  } else if (gridApi.value) {
    // Clear filter if search is empty
    gridApi.value.setGridOption('quickFilterText', '');
  }
};

// Open Send to Template modal
const openSendToTemplateModal = () => {
  if (selectedRows.value.length > 0) {
    showSendToTemplateModal.value = true;
  }
};

// Close Send to Template modal
const closeSendToTemplateModal = () => {
  showSendToTemplateModal.value = false;
};

// Handle successful send to template
const handleSentToTemplate = ({ templateId, itemsAdded }) => {
  console.log(`Sent ${itemsAdded} items to template ${templateId}`);
  // Optionally deselect all rows after successful send
  deselectAll();
};

// Open Update Template modal
const openUpdateTemplateModal = () => {
  console.log('[ExcelGrid] Update Template button clicked');
  console.log('[ExcelGrid] Row data length:', rowData.value.length);
  console.log('[ExcelGrid] Column mappings:', columnMappings.value);

  if (rowData.value.length > 0) {
    console.log('[ExcelGrid] Opening Update Template modal');
    showUpdateTemplateModal.value = true;
  } else {
    console.warn('[ExcelGrid] Cannot open modal - no row data');
  }
};

// Close Update Template modal
const closeUpdateTemplateModal = () => {
  showUpdateTemplateModal.value = false;
};

// Handle successful template update
const handleTemplateUpdated = ({ templateId, added, updated, removed }) => {
  console.log(`Updated template ${templateId}: Added ${added}, Updated ${updated}, Removed ${removed}`);
};

// Handle column picker changes
const handleColumnChanges = (updatedColumns) => {
  console.log('[ExcelGrid] Column picker changes applied:', updatedColumns);

  // Reorder and hide/show columns based on user's changes
  const newColumnDefs = [];

  updatedColumns.forEach((col, index) => {
    const existingCol = columnDefs.value.find(c => c.field === col.field);
    if (existingCol) {
      newColumnDefs.push({
        ...existingCol,
        hide: !col.visible
      });
    }
  });

  // Update column definitions
  columnDefs.value = newColumnDefs;

  // Refresh the grid
  if (gridApi.value) {
    gridApi.value.setGridOption('columnDefs', newColumnDefs);
    console.log('[ExcelGrid] Grid columns updated');
  }

  // Save the updated column state to session storage
  saveToSession();
  console.log('[ExcelGrid] Column changes saved to session');
};

// zzType dropdown options
const zzTypeOptions = [
  { value: '', label: '-- Select Type --' },
  { value: 'area', label: 'area' },
  { value: 'linear', label: 'linear' },
  { value: 'segment', label: 'segment' },
  { value: 'count', label: 'count' }
];

// zzType Cell Editor
class ZzTypeEditor {
  init(params) {
    this.params = params;
    this.value = params.value || '';

    // Create select element
    this.eInput = document.createElement('select');
    this.eInput.className = 'form-select form-select-sm';
    this.eInput.style.width = '100%';
    this.eInput.style.height = '100%';

    // Add options
    zzTypeOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.text = option.label;
      if (option.value === this.value) {
        optionElement.selected = true;
      }
      this.eInput.appendChild(optionElement);
    });

    // Listen for changes
    this.eInput.addEventListener('change', () => {
      params.stopEditing();
    });
  }

  getGui() {
    return this.eInput;
  }

  getValue() {
    return this.eInput.value;
  }

  destroy() {
    // Cleanup
  }

  afterGuiAttached() {
    this.eInput.focus();
  }
}

// Cost Type dropdown options
const costTypeOptions = [
  { value: 'Other', label: 'Other' },
  { value: 'Subcontra', label: 'Subcontra' },
  { value: 'Material', label: 'Material' },
  { value: 'Labor', label: 'Labor' },
  { value: 'Equipment', label: 'Equipment' }
];

// Cost Type Cell Editor
class CostTypeEditor {
  init(params) {
    this.params = params;
    this.value = params.value || 'Other'; // Default to 'Other'

    // Create select element
    this.eInput = document.createElement('select');
    this.eInput.className = 'form-select form-select-sm';
    this.eInput.style.width = '100%';
    this.eInput.style.height = '100%';

    // Add options
    costTypeOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.text = option.label;
      if (option.value === this.value) {
        optionElement.selected = true;
      }
      this.eInput.appendChild(optionElement);
    });

    // Listen for changes
    this.eInput.addEventListener('change', () => {
      params.stopEditing();
    });
  }

  getGui() {
    return this.eInput;
  }

  getValue() {
    return this.eInput.value;
  }

  destroy() {
    // Cleanup
  }

  afterGuiAttached() {
    this.eInput.focus();
  }
}

// Markup % Cell Editor (uses text input to prevent arrow key number incrementing)
class MarkupPercentEditor {
  init(params) {
    this.params = params;
    // Get the raw numeric value (not the formatted "XX%" string)
    const rawValue = params.value;
    this.value = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';

    // Check if user pressed a key to start editing
    const charPress = params.key;

    // Create text input instead of number input
    this.eInput = document.createElement('input');
    this.eInput.type = 'text';
    this.eInput.className = 'form-control form-control-sm';
    this.eInput.style.width = '100%';
    this.eInput.style.height = '100%';
    this.eInput.style.textAlign = 'right';
    this.eInput.style.padding = '4px 8px';

    // If user started typing, use that character; otherwise use existing value
    if (charPress && charPress.length === 1 && /[0-9.-]/.test(charPress)) {
      // User typed a number/decimal/minus to start editing
      this.eInput.value = charPress;
    } else {
      // User clicked to edit - keep existing value
      this.eInput.value = this.value;
    }

    // Handle keyboard events
    this.eInput.addEventListener('keydown', (e) => {
      // Stop editing on Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        params.stopEditing();
        return;
      }

      // Prevent arrow keys from navigating while typing
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation();
      }
    });

    // Validate input to only allow numbers and decimal points
    this.eInput.addEventListener('input', (e) => {
      // Remove any non-numeric characters except decimal point and minus
      let value = e.target.value.replace(/[^0-9.-]/g, '');

      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }

      // Update the input value if it changed
      if (e.target.value !== value) {
        e.target.value = value;
      }
    });
  }

  getGui() {
    return this.eInput;
  }

  getValue() {
    const value = this.eInput.value.trim();
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? null : numericValue;
  }

  destroy() {
    // Cleanup
  }

  afterGuiAttached() {
    this.eInput.focus();

    // If there's already a value, select it all for easy replacement
    if (this.eInput.value) {
      // Only select if user didn't start typing (click-to-edit scenario)
      if (!this.params.key || this.params.key.length !== 1) {
        this.eInput.select();
      }
    }
  }
}

// Actions Cell Renderer
const ActionsCellRenderer = (params) => {
  const container = document.createElement('div');
  container.className = 'd-flex gap-1 h-100 align-items-center flex-wrap';

  const sendBtn = document.createElement('button');
  sendBtn.className = 'btn btn-sm btn-warning';
  sendBtn.innerHTML = '<i class="bi bi-send"></i>';
  sendBtn.title = 'Send to zzTakeoff';
  sendBtn.onclick = () => sendToZzTakeoff(params.data);

  const templateBtn = document.createElement('button');
  templateBtn.className = 'btn btn-sm btn-success';
  templateBtn.innerHTML = '<i class="bi bi-folder-plus"></i>';
  templateBtn.title = 'Send to Template';
  templateBtn.onclick = () => sendRowToTemplate(params.data);

  const sentBadge = document.createElement('span');
  if (params.data._sentToZzTakeoff) {
    sentBadge.className = 'badge bg-success ms-1';
    sentBadge.innerHTML = '<i class="bi bi-check-circle"></i>';
  }

  container.appendChild(sendBtn);
  container.appendChild(templateBtn);
  if (params.data._sentToZzTakeoff) {
    container.appendChild(sentBadge);
  }

  return container;
};

/**
 * Build properties object dynamically based on column mappings
 * Only includes columns where sendToZzTakeoff is true
 */
const buildPropertiesFromMappings = (rowData) => {
  const properties = {};

  if (!columnMappings.value || !columnMappings.value.preferredColumns) {
    console.warn('[buildProperties] Column mappings not loaded - using fallback');
    // Fallback to basic properties if mappings not loaded
    const description = rowData.Description || rowData.Name || 'Unnamed Item';
    const sku = rowData.SKU || rowData.ItemCode || rowData.PriceCode || '';
    return {
      name: { value: description },
      sku: { value: sku }
    };
  }

  console.log('[buildProperties] Processing row data:', rowData);
  console.log('[buildProperties] Column mappings:', columnMappings.value.preferredColumns);

  // Iterate through all columns that should be sent to zzTakeoff
  columnMappings.value.preferredColumns.forEach(col => {
    if (!col.sendToZzTakeoff) {
      console.log(`[buildProperties] Skipping ${col.label} - sendToZzTakeoff is false`);
      return;
    }

    // Skip metadata columns - they are NOT sent as properties
    // zzType is only used to determine which dialog to open (Area/Linear/Segment/Count)
    // markupPercent is internal metadata, not sent to zzTakeoff for now
    if (col.isMetadata) {
      console.log(`[buildProperties] Skipping metadata column ${col.label} - metadata columns are not sent as properties`);
      return;
    }

    let value = '';

    // Handle mapped columns (values from Excel)
    if (col.excelColumn) {
      value = rowData[col.excelColumn] || '';
      console.log(`[buildProperties] Excel column ${col.label} (${col.excelColumn}): ${value}`);
    }
    // Handle standard columns without mapping (try common field names)
    else {
      // Try to find value from common field name variations
      const commonNames = {
        sku: ['SKU', 'ItemCode', 'PriceCode', 'Code'],
        name: ['Name', 'ItemName', 'Title'],
        description: ['Description', 'Desc', 'ItemDescription'],
        units: ['Units', 'Unit', 'UOM'],
        costCode: ['Cost Code', 'CostCode', 'Cost Centre', 'CostCentre'],
        category: ['Category', 'Cat', 'Type'],
        costEach: ['Cost Each', 'CostEach', 'Price', 'UnitPrice']
      };

      const possibleNames = commonNames[col.id] || [col.label];
      console.log(`[buildProperties] Trying common names for ${col.label}:`, possibleNames);
      for (const name of possibleNames) {
        if (rowData[name]) {
          value = rowData[name];
          console.log(`[buildProperties] Found value for ${col.label} using field ${name}: ${value}`);
          break;
        }
      }
    }

    // Add to properties object with the column LABEL as the key
    // This ensures "Sub Category" is sent as "Sub Category", not "custom1"
    // Special case: Use "name" for description column to match zzTakeoff's expected property
    const propertyKey = col.id === 'description' ? 'name' : col.label;

    if (value !== undefined && value !== null && value !== '') {
      properties[propertyKey] = { value: value.toString() };
      console.log(`[buildProperties] Added property "${propertyKey}": ${value}`);
    } else {
      console.warn(`[buildProperties] Skipping ${col.label} - no value found`);
    }
  });

  console.log('[buildProperties] Final properties object:', properties);
  return properties;
};

// Send to zzTakeoff (Direct - No Modal)
const sendToZzTakeoff = async (row) => {
  if (!row._zzType) {
    alert('Please select a zzType before sending to zzTakeoff');
    return;
  }

  try {
    loading.value = true;
    loadingMessage.value = 'Sending to zzTakeoff...';

    // Transform item to zzTakeoff format
    const typeMapping = {
      'area': 'area',
      'linear': 'linear',
      'segment': 'segment',
      'count': 'count'
    };

    // Build properties dynamically based on column mappings
    const properties = buildPropertiesFromMappings(row);

    const zzTakeoffItem = {
      type: typeMapping[row._zzType] || 'count',
      properties: properties
    };

    // Get display data
    const description = row.Description || row.Name || 'Unnamed Item';
    const sku = row.SKU || row.ItemCode || row.PriceCode || '';
    const costEach = parseFloat(row['Cost Each'] || row.Price || 0);
    const markup = row._markupPercent || 0;

    // Calculate total cost (using quantity of 1 since we don't have a quantity column)
    const totalCost = costEach * (1 + markup / 100);

    // Save to send history
    await api.sendHistory.add({
      projectId: zzTakeoffState.value.projectId || 'unknown',
      projectName: zzTakeoffState.value.projectName || 'Currently Open Project',
      project: zzTakeoffState.value.projectName || 'Currently Open Project',
      items: [{
        code: sku,
        description: description,
        takeoffType: row._zzType,
        costType: row._costType || 'Subcontra',
        units: row.Unit || row.Units || 'm2',
        costEach: costEach,
        markup: markup,
        quantity: 1,
        total: totalCost
      }],
      status: 'Sent (JavaScript Injection)',
      sentAt: new Date().toISOString(),
      itemCount: 1,
      totalCost: totalCost
    });

    console.log('[zzTakeoff] Item ready for JavaScript injection:', JSON.stringify(zzTakeoffItem, null, 2));

    // Update row status FIRST
    const rowIndex = rowData.value.findIndex(r => r._rowHash === row._rowHash);
    if (rowIndex !== -1) {
      rowData.value[rowIndex]._sentToZzTakeoff = true;
      rowData.value[rowIndex]._lastSent = new Date().toISOString();
      rowData.value[rowIndex]._sentCount = (rowData.value[rowIndex]._sentCount || 0) + 1;
    }

    hasUnsavedChanges.value = true;
    saveToSession();

    // Refresh grid to show updated status
    if (gridApi.value) {
      gridApi.value.refreshCells({ force: true });
    }

    // Navigate to zzTakeoff Web tab and execute JavaScript injection
    try {
      // Navigate to zzTakeoff Web tab if not already there
      if (router.currentRoute.value.path !== '/zztakeoff-web') {
        console.log('[zzTakeoff] Navigating to zzTakeoff Web tab...');
        await router.push('/zztakeoff-web');
        // Wait longer for BrowserView to be ready and page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('[zzTakeoff] Already on zzTakeoff Web tab');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Maximize the webview after navigation
      isMaximized.value = true;

      // Wait for webview to resize and stabilize after maximize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Execute JavaScript to inject the item into the currently open project
      if (api.webview && api.webview.executeJavaScript) {
        // Build properties object for JavaScript injection
        const propertiesJson = JSON.stringify(properties);

        // Build the JavaScript code exactly like Databuild does
        const jsCode = `
          (function() {
            try {
              // Check if required functions are available
              if (typeof Router === 'undefined') {
                return { success: false, error: 'Router not available - zzTakeoff page may not be loaded' };
              }
              if (typeof appLayout === 'undefined') {
                return { success: false, error: 'appLayout not available - zzTakeoff page may not be loaded' };
              }
              if (typeof startTakeoffWithProperties === 'undefined') {
                return { success: false, error: 'startTakeoffWithProperties not available - zzTakeoff page may not be loaded or you may not be logged in' };
              }

              // First: Navigate to Takeoff tab
              const takeoffUrl = appLayout.getAppUrl('takeoff');
              console.log('[zzTakeoff] Navigating to:', takeoffUrl);
              Router.go(takeoffUrl);

              // Second: Open the takeoff dialogue with item properties
              const properties = ${propertiesJson};
              startTakeoffWithProperties({
                type: ${JSON.stringify(zzTakeoffItem.type)},
                properties: properties
              });

              return { success: true, note: 'Router.go() then startTakeoffWithProperties executed with ' + Object.keys(properties).length + ' properties' };
            } catch (error) {
              return { success: false, error: error.message, stack: error.stack };
            }
          })()
        `;

        console.log('[zzTakeoff] Executing Router.go() + startTakeoffWithProperties with properties:', properties);

        const result = await api.webview.executeJavaScript(jsCode);

        console.log('[zzTakeoff] JavaScript injection result:', result);

        if (result && result.success) {
          console.log('[zzTakeoff] Successfully executed:', result.note || 'Takeoff dialogue opened');
        } else {
          console.error('[zzTakeoff] Failed to execute:', result?.error);
        }
      }
    } catch (error) {
      console.error('[zzTakeoff] Error during JavaScript injection:', error);
    }
  } catch (error) {
    console.error('Error sending to zzTakeoff:', error);
    alert(`Error sending to zzTakeoff: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// Send row to template
const sendRowToTemplate = (rowData) => {
  // Set selected rows to just this one row
  selectedRows.value = [rowData];
  selectedRowsCount.value = 1;
  // Open the template modal
  showSendToTemplateModal.value = true;
};

// Open file
const openFile = async () => {
  try {
    const result = await api.file.openDialog();
    if (result.success && !result.canceled) {
      await loadExcelFile(result.filePath);
    }
  } catch (error) {
    console.error('Error opening file:', error);
    alert(`Error opening file: ${error.message}`);
  }
};

// Load Excel file
const loadExcelFile = async (filePath) => {
  try {
    loading.value = true;
    loadingMessage.value = 'Reading Excel file...';

    // Close the old file if one is currently open
    if (currentFile.value && currentFile.value !== filePath) {
      console.log('[ExcelGrid] Closing previous file:', currentFile.value);
      loadingMessage.value = 'Closing previous file...';

      // Clear session storage for the old file
      try {
        sessionStorage.removeItem(`excelGrid_${currentFile.value}`);
        console.log('[ExcelGrid] Cleared session storage for previous file');
      } catch (err) {
        console.warn('[ExcelGrid] Failed to clear session storage:', err);
      }

      // Close the file in the backend
      try {
        await api.excel.closeFile(currentFile.value);
      } catch (err) {
        console.warn('[ExcelGrid] Failed to close previous file:', err);
      }

      // Clear grid data
      rowData.value = [];
      columnDefs.value = [];
      selectedRows.value = [];
      metadata.value = {};
      console.log('[ExcelGrid] Cleared grid state');
    }

    // Read Excel file (now returns metadata only - data is in SQLite)
    const result = await api.excel.readFile(filePath);
    if (!result.success) {
      throw new Error(result.message || 'Failed to read Excel file');
    }

    // Check if this was a cache hit or cache miss
    if (result.cached === true) {
      console.log('✅ CACHE HIT: File loaded from cache in <200ms');
      loadingMessage.value = 'Loading from cache (fast)...';
    } else {
      console.log('❌ CACHE MISS: Full Excel parse performed');
      loadingMessage.value = 'Reading Excel file (first time)...';
    }

    // Store file info
    currentFile.value = result.filePath;
    currentFileName.value = result.filePath.split(/[\\/]/).pop();

    loadingMessage.value = 'Loading metadata...';

    // Load metadata from hidden sheet
    const metadataResult = await api.excel.getMetadata(filePath);
    if (metadataResult.success) {
      metadata.value = metadataResult.metadata || {};
    }

    loadingMessage.value = 'Loading preferences...';

    // Load preferences for default markup %
    const prefsResult = await api.preferencesStore.get();
    const preferences = prefsResult?.data || {};
    const defaultMarkupPercent = preferences.defaultMarkupPercent;

    // Load FILE-SPECIFIC column mappings for this file
    const columnMappingsResult = await api.preferencesStore.getCombinedColumnMappings(filePath);
    const columnMappingsData = columnMappingsResult?.data || { preferredColumns: [] };

    console.log('[ExcelGrid] Loaded file-specific column mappings for:', filePath);
    console.log('[ExcelGrid] Column mappings:', columnMappingsData);

    loadingMessage.value = 'Loading sheet list...';

    // Get sheet list from SQLite
    const sheetListResult = await api.excel.getSheetList(filePath);
    if (!sheetListResult.success || !sheetListResult.sheets || sheetListResult.sheets.length === 0) {
      throw new Error('No sheets found in Excel file');
    }

    // Set available sheets and select first sheet
    availableSheets.value = sheetListResult.sheets;
    currentSheetName.value = sheetListResult.sheets[0].name;
    totalRowCount.value = sheetListResult.sheets[0].rowCount;

    // Get first sheet metadata
    const sheet = sheetListResult.sheets[0];
    if (!sheet) {
      throw new Error('No sheets found in Excel file');
    }

    console.log('Sheet columns from SQLite:', sheet.columns);
    console.log('Column mappings:', columnMappingsData);

    loadingMessage.value = 'Building grid...';

    // Build column definitions from mappings
    const cols = [];

    // Create a mapping from original column names to sanitized column names
    const columnNameMap = {};
    sheet.columns.forEach((originalCol, index) => {
      const sanitizedCol = sheet.sanitizedColumns[index];
      columnNameMap[originalCol] = sanitizedCol;
    });

    console.log('Column name mapping (original → sanitized):', columnNameMap);

    // Get visible mapped columns sorted by order (EXCLUDE metadata columns - they're added manually below)
    const visibleColumns = columnMappingsData.preferredColumns
      .filter(col => col.visible && col.excelColumn && !col.isMetadata)
      .sort((a, b) => a.order - b.order);

    console.log('Visible mapped columns:', visibleColumns.length);

    // FALLBACK: If no column mappings configured, show ALL non-internal columns
    if (visibleColumns.length === 0) {
      console.log('[ExcelGrid] No column mappings configured - showing all columns as fallback');
      const internalColumns = ['_rowIndex', '_rowHash', '_zzType', '_markupPercent', '_markupManuallySet'];
      // Filter out internal columns AND auto-generated blank column names (Column8, Column9, etc.)
      const dataColumns = sheet.columns.filter(col =>
        !internalColumns.includes(col) &&
        !col.match(/^Column\d+$/) // Exclude ColumnN pattern (blank columns)
      );

      dataColumns.forEach((originalCol, index) => {
        const sanitizedCol = columnNameMap[originalCol] || originalCol;
        // Check if this is a description/name column
        const isDescriptionLike = /description|desc|name|title|item.*name/i.test(originalCol);

        cols.push({
          field: sanitizedCol,
          headerName: originalCol, // Use original column name as header
          editable: true,
          cellEditor: 'agTextCellEditor',
          minWidth: isDescriptionLike ? 300 : 100,
          width: isDescriptionLike ? undefined : 150, // Fixed width for non-description columns
          flex: isDescriptionLike ? 1 : 0, // Only description columns flex to fill space
          suppressMovable: false,
          wrapText: isDescriptionLike,
          autoHeight: isDescriptionLike,
          tooltipField: isDescriptionLike ? sanitizedCol : undefined
        });
      });

      console.log('[ExcelGrid] Created', cols.length, 'fallback columns (filtered out', sheet.columns.length - dataColumns.length - internalColumns.length, 'blank columns)');
    } else {
      // Show ONLY mapped columns with preferred labels (metadata columns like Markup % are added separately below)
      cols.push(...visibleColumns.map(prefCol => {
      const isDescriptionColumn = prefCol.id === 'description' || prefCol.id === 'name';

      // Use sanitized column name as field (for SQLite data)
      const sanitizedFieldName = columnNameMap[prefCol.excelColumn] || prefCol.excelColumn;

      const colDef = {
        field: sanitizedFieldName, // Use the SANITIZED column name as the field
        headerName: prefCol.label,  // Use the preferred label as the header
        editable: true,
        cellEditor: 'agTextCellEditor', // Force text editor to support alphanumeric values (e.g., SKU: "ABC123")
        minWidth: isDescriptionColumn ? 300 : 100,
        width: isDescriptionColumn ? undefined : 150, // Fixed width for non-description columns
        flex: isDescriptionColumn ? 1 : 0, // Only description columns flex to fill space
        suppressMovable: false,
        cellClass: isDescriptionColumn ? 'description-column' : '',
        wrapText: isDescriptionColumn,
        autoHeight: isDescriptionColumn,
        tooltipField: isDescriptionColumn ? sanitizedFieldName : undefined, // Show full text on hover
        tooltipComponentParams: isDescriptionColumn ? {
          color: '#ececec'
        } : undefined
      };

      return colDef;
    }));

      console.log('[ExcelGrid] Column definitions created:', visibleColumns.length, 'mapped columns');
    }

    // Add Markup % column (metadata column - user can type values)
    cols.push({
      field: '_markupPercent',
      headerName: 'Markup %',
      width: 120,
      maxWidth: 120,
      editable: true,
      singleClickEdit: true,
      cellEditor: MarkupPercentEditor,
      cellEditorPopup: false,
      pinned: 'right',
      suppressSizeToFit: true,
      cellClass: 'markup-cell',
      cellStyle: (params) => {
        // Apply styling if markup was manually edited
        const isManual = params.data && params.data._markupManuallySet === true;

        if (isManual) {
          // Check if dark mode
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

          if (isDark) {
            // Dark mode: bright cyan background with white text
            return {
              backgroundColor: '#006d7a',
              color: '#ffffff',
              fontWeight: '700',
              fontStyle: 'italic',
              overflow: 'visible',
              textOverflow: 'clip',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
              paddingRight: '8px'
            };
          } else {
            // Light mode: bright yellow background with black text
            return {
              backgroundColor: '#fff9c4',
              color: '#000000',
              fontWeight: '700',
              fontStyle: 'italic',
              overflow: 'visible',
              textOverflow: 'clip',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
              paddingRight: '8px'
            };
          }
        }
        return null;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined || params.value === '') {
          return '';
        }
        return `${params.value}%`;
      },
      valueParser: (params) => {
        const value = params.newValue;
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const numericValue = parseFloat(String(value).replace('%', '').trim());
        return isNaN(numericValue) ? null : numericValue;
      }
    });

    // Add Cost Type column (metadata column - user can select)
    cols.push({
      field: '_costType',
      headerName: 'Cost Type',
      width: 140,
      maxWidth: 140,
      cellEditor: CostTypeEditor,
      editable: true,
      cellClass: 'cost-type-cell',
      pinned: 'right',
      suppressSizeToFit: true
    });

    // Add zzType column
    cols.push({
      field: '_zzType',
      headerName: 'zzType',
      width: 150,
      maxWidth: 150,
      cellEditor: ZzTypeEditor,
      editable: true,
      cellClass: 'zz-type-cell',
      pinned: 'right',
      suppressSizeToFit: true
    });

    // Add Actions column
    cols.push({
      field: '_actions',
      headerName: 'Actions',
      width: 150,
      maxWidth: 150,
      cellRenderer: ActionsCellRenderer,
      editable: false,
      sortable: false,
      filter: false,
      pinned: 'right',
      suppressSizeToFit: true
    });

    columnDefs.value = cols;

    hasUnsavedChanges.value = false;

    // Store a minimal excelData reference for compatibility
    excelData.value = {
      filePath: result.filePath,
      fileName: currentFileName.value,
      sheets: [{ name: sheet.name, columns: sheet.columns }]
    };

    // Load all rows from SQLite for the current sheet
    await loadSheetData();

    // Get file statistics for recents metadata
    let fileStats = {};
    try {
      const statsResult = await api.excel.getFileStats(filePath);
      if (statsResult && statsResult.success) {
        fileStats = statsResult.data;
      }
    } catch (err) {
      console.warn('[ExcelGrid] Failed to get file stats:', err);
    }

    // Add to recents with enhanced metadata
    await api.recentsStore.add({
      filePath,
      fileName: result.data.fileName,
      type: 'excel',
      lastOpened: new Date().toISOString(),
      // Enhanced metadata
      fileSize: fileStats.fileSize,
      rowCount: fileStats.rowCount,
      sheetCount: fileStats.sheetCount || availableSheets.value.length,
      dateCreated: fileStats.dateCreated,
      dateModified: fileStats.dateModified
    });

    // Save as last opened file for auto-reload on next app start
    try {
      await api.preferencesStore.update({ key: 'lastOpenedFile', value: filePath });
      console.log('[ExcelGrid] Saved last opened file to preferences:', filePath);
    } catch (err) {
      console.warn('[ExcelGrid] Failed to save last opened file:', err);
    }

    // Update application menu to refresh recent files list
    if (api.updateMenu) {
      await api.updateMenu();
    }

    console.log('File loaded successfully:', filePath);
  } catch (error) {
    console.error('Error loading Excel file:', error);
    alert(`Error loading Excel file: ${error.message}`);
    currentFile.value = null;
  } finally {
    loading.value = false;
  }
};

// Save file
const saveFile = async () => {
  if (!currentFile.value) return;

  try {
    loading.value = true;
    loadingMessage.value = 'Saving file...';

    // Convert currentFile to plain string to avoid serialization issues with computed properties
    const filePathString = String(currentFile.value);

    // Collect metadata from rows
    const newMetadata = {};
    rowData.value.forEach(row => {
      if (row._rowHash && (row._zzType || row._markupPercent !== null || row._costType)) {
        newMetadata[row._rowHash] = {
          zzType: row._zzType,
          markupPercent: row._markupPercent,
          markupManuallySet: row._markupManuallySet || false,
          costType: row._costType,
          lastSent: row._lastSent,
          sentCount: row._sentCount || 0
        };
      }
    });

    // STEP 1: Write Excel file FIRST (so the file exists for saveMetadata to read)
    // Update Excel data with current row data
    const updatedSheets = excelData.value.sheets.map(sheet => {
      if (sheet === excelData.value.sheets[0]) {
        // Update first sheet with current data
        return {
          name: sheet.name,
          headers: sheet.headers,
          hidden: sheet.hidden,
          data: rowData.value.map(row => {
            // Remove internal fields
            const cleanRow = { ...row };
            delete cleanRow._zzType;
            delete cleanRow._markupPercent;
            delete cleanRow._costType;
            delete cleanRow._sentToZzTakeoff;
            delete cleanRow._lastSent;
            delete cleanRow._sentCount;
            delete cleanRow._actions;
            delete cleanRow._rowIndex;
            delete cleanRow._rowHash;
            return cleanRow;
          })
        };
      }
      // Clean other sheets too - deeply clone only serializable data
      return {
        name: sheet.name,
        headers: Array.isArray(sheet.headers) ? [...sheet.headers] : sheet.headers,
        data: Array.isArray(sheet.data) ? sheet.data.map(row => {
          if (typeof row === 'object' && row !== null) {
            // Create a clean copy of the row, excluding internal properties
            const cleanRow = {};
            for (const [key, value] of Object.entries(row)) {
              if (!key.startsWith('_') && typeof value !== 'function') {
                cleanRow[key] = value;
              }
            }
            return cleanRow;
          }
          return row;
        }) : sheet.data,
        hidden: sheet.hidden
      };
    });

    // Write Excel file - use JSON serialization to ensure no non-serializable data
    const dataToSend = {
      filePath: String(excelData.value.filePath),
      fileName: String(excelData.value.fileName),
      sheets: updatedSheets
    };

    // Force serialization to remove any non-serializable properties
    const serializedData = JSON.parse(JSON.stringify(dataToSend));

    const writeResult = await api.excel.writeFile(filePathString, serializedData);

    if (!writeResult.success) {
      throw new Error(writeResult.message || 'Failed to write Excel file');
    }

    // STEP 2: Now save metadata to hidden sheet (file exists now, so it can be read)
    const metadataResult = await api.excel.saveMetadata(filePathString, newMetadata);
    if (!metadataResult.success) {
      console.warn('Failed to save metadata, but file was saved:', metadataResult.message);
    }

    hasUnsavedChanges.value = false;
    metadata.value = newMetadata;

    // Save to session storage
    saveToSession();

    console.log('File saved successfully');
    // No alert needed - user can see "Unsaved" indicator disappear
  } catch (error) {
    console.error('Error saving file:', error);
    alert(`Error saving file: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// Save file as
const saveFileAs = async () => {
  if (!currentFile.value) return;

  try {
    const result = await api.file.saveDialog(currentFile.value);
    if (result.success && !result.canceled) {
      const oldFile = currentFile.value;
      currentFile.value = result.filePath;
      currentFileName.value = result.filePath.split(/[\\/]/).pop();
      await saveFile();
      // Keep new path if save succeeded
    }
  } catch (error) {
    console.error('Error saving file:', error);
    alert(`Error saving file: ${error.message}`);
  }
};

// Close file
const closeFile = async () => {
  console.log('[ExcelGrid] closeFile called, currentFile:', currentFile.value);
  if (!currentFile.value) {
    console.log('[ExcelGrid] No file to close');
    return;
  }

  // Check for unsaved changes
  if (hasUnsavedChanges.value) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to close this file?');
    if (!confirmed) {
      return;
    }
  }

  // Close SQLite database
  const fileToClose = currentFile.value;
  try {
    await api.excel.closeFile(fileToClose);
    console.log('[SQLite] Database closed for file:', fileToClose);
  } catch (error) {
    console.error('[SQLite] Error closing database:', error);
  }

  // Clear all state
  currentFile.value = null;
  currentFileName.value = '';
  rowData.value = [];
  columnDefs.value = [];
  excelData.value = null;
  metadata.value = {};
  hasUnsavedChanges.value = false;
  availableSheets.value = [];
  currentSheetName.value = '';
  totalRowCount.value = 0;

  // Clear session storage
  clearSession();

  console.log('File closed');
};

// Handle custom event for loading files from Recent Files tab
const handleLoadFileEvent = async (event) => {
  const { filePath } = event.detail;
  if (filePath) {
    await loadExcelFile(filePath);
  }
};

// Handle custom event for applying default markup from Preferences
const handleApplyDefaultMarkup = (event) => {
  console.log('[ExcelGrid] *** handleApplyDefaultMarkup called ***');
  console.log('[ExcelGrid] Event detail:', event.detail);

  const { defaultMarkupPercent } = event.detail;
  console.log('[ExcelGrid] defaultMarkupPercent value:', defaultMarkupPercent);

  if (!currentFile.value) {
    console.log('[ExcelGrid] No file loaded (currentFile is null), skipping markup update');
    return;
  }

  if (!rowData.value || rowData.value.length === 0) {
    console.log('[ExcelGrid] No row data (empty array), skipping markup update');
    return;
  }

  console.log('[ExcelGrid] Applying default markup % to all rows:', defaultMarkupPercent);
  console.log('[ExcelGrid] Current rowData length:', rowData.value.length);

  // Update only rows that haven't been manually edited
  let updatedCount = 0;
  let skippedCount = 0;

  // Create a completely new array to trigger full reactivity
  const updatedRows = rowData.value.map(row => {
    // Skip rows that have manually set markup
    if (row._markupManuallySet) {
      skippedCount++;
      return { ...row }; // Create new object anyway to force update
    }

    updatedCount++;
    return {
      ...row,
      _markupPercent: defaultMarkupPercent
    };
  });

  console.log('[ExcelGrid] Updated', updatedCount, 'rows, skipped', skippedCount, 'manually edited rows');

  // Use AG Grid's applyTransaction API to force complete row updates
  if (gridApi.value) {
    console.log('[ExcelGrid] Using applyTransaction to update all rows...');

    // Update via transaction which forces AG Grid to recreate row nodes
    gridApi.value.applyTransaction({
      update: updatedRows
    });

    console.log('[ExcelGrid] Applied transaction for', updatedRows.length, 'rows');

    // Force refresh after transaction
    setTimeout(() => {
      gridApi.value.refreshCells({
        force: true,
        columns: ['_markupPercent'],
        suppressFlash: false
      });
      console.log('[ExcelGrid] Forced cell refresh after transaction');
    }, 50);
  } else {
    console.log('[ExcelGrid] No gridApi available, using fallback array update');
  }

  // Update the row data array reference
  rowData.value = [...updatedRows];

  // Mark as unsaved
  hasUnsavedChanges.value = true;
  console.log('[ExcelGrid] Marked as unsaved changes');

  // Save to session storage
  saveToSession();
  console.log('[ExcelGrid] Saved to session storage');

  console.log('[ExcelGrid] *** Default markup % applied to', rowData.value.length, 'rows ***');
};

// Listen for menu commands
onMounted(async () => {
  // Load column mappings for sending to zzTakeoff
  if (api.preferencesStore && api.preferencesStore.getColumnMappings) {
    const result = await api.preferencesStore.getColumnMappings();
    if (result.success) {
      columnMappings.value = result.data;
      console.log('[ExcelGrid] Column mappings loaded:', columnMappings.value);
    }
  }

  // Auto-load last opened file on app startup (if not already loaded from session)
  if (!currentFile.value && api.preferencesStore && api.preferencesStore.get) {
    try {
      const prefsResult = await api.preferencesStore.get();
      const lastOpenedFile = prefsResult?.data?.lastOpenedFile;

      if (lastOpenedFile) {
        console.log('[ExcelGrid] Found last opened file in preferences:', lastOpenedFile);

        // Check if file still exists
        const fileExists = await api.file.checkFileExists(lastOpenedFile);
        if (fileExists) {
          console.log('[ExcelGrid] Auto-loading last opened file...');
          await loadExcelFile(lastOpenedFile);
        } else {
          console.log('[ExcelGrid] Last opened file no longer exists, clearing from preferences');
          await api.preferencesStore.update({ key: 'lastOpenedFile', value: null });
        }
      }
    } catch (err) {
      console.warn('[ExcelGrid] Failed to auto-load last opened file:', err);
    }
  }

  // Restore state from session storage if available
  if (currentFile.value) {
    const restored = restoreFromSession();
    if (restored) {
      console.log('Excel Grid tab mounted - state restored from session');
    }
  }

  // Register menu event handlers only once (using a global flag to prevent duplicates)
  if (!window._excelGridMenuHandlersRegistered) {
    if (api.onMenuOpenFile) {
      api.onMenuOpenFile(openFile);
    }
    if (api.onMenuSaveFile) {
      api.onMenuSaveFile(saveFile);
    }
    if (api.onMenuSaveFileAs) {
      api.onMenuSaveFileAs(saveFileAs);
    }
    if (api.onMenuCloseFile) {
      api.onMenuCloseFile(closeFile);
    }
    if (api.onMenuOpenRecentFile) {
      api.onMenuOpenRecentFile(async (filePath) => {
        console.log('[ExcelGrid] Opening recent file from menu:', filePath);
        await loadExcelFile(filePath);
      });
    }
    window._excelGridMenuHandlersRegistered = true;
    console.log('[ExcelGrid] Menu event handlers registered');
  }

  // Listen for custom event from Recent Files tab
  window.addEventListener('load-excel-file', handleLoadFileEvent);

  // Listen for custom event from Preferences tab to apply default markup
  console.log('[ExcelGrid] Registering event listener for apply-default-markup');
  window.addEventListener('apply-default-markup', handleApplyDefaultMarkup);
  console.log('[ExcelGrid] Event listener registered successfully');

  // Listen for force grid reload from Preferences tab
  window.addEventListener('force-grid-reload', async () => {
    console.log('[ExcelGrid] Force reload requested');
    if (currentFile.value) {
      await loadExcelFile(currentFile.value);
    }
  });
});

onBeforeUnmount(() => {
  // Save state to session storage before navigating away
  console.log('[ExcelGrid] Component unmounting - saving state to session');
  saveToSession();
});

onUnmounted(() => {
  // Cleanup event listeners
  window.removeEventListener('load-excel-file', handleLoadFileEvent);
  window.removeEventListener('apply-default-markup', handleApplyDefaultMarkup);
  window.removeEventListener('force-grid-reload', async () => {
    if (currentFile.value) {
      await loadExcelFile(currentFile.value);
    }
  });
});
</script>

<style scoped>
.excel-grid-tab {
  background-color: var(--bs-body-bg);
}

/* Fix button visibility in dark mode */
[data-theme="dark"] .btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #ffffff;
}

[data-theme="dark"] .btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

[data-theme="dark"] .btn-success:disabled {
  background-color: #155724;
  border-color: #155724;
  color: #6c757d;
}

[data-theme="dark"] .btn-outline-success {
  color: #5cb85c;
  border-color: #5cb85c;
  background-color: transparent;
}

[data-theme="dark"] .btn-outline-success:hover {
  background-color: #5cb85c;
  border-color: #5cb85c;
  color: #ffffff;
}

[data-theme="dark"] .btn-outline-success:disabled {
  color: #4a934a;
  border-color: #4a934a;
}

[data-theme="dark"] .btn-outline-danger {
  color: #ea868f;
  border-color: #dc3545;
  background-color: transparent;
}

[data-theme="dark"] .btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #ffffff;
}

[data-theme="dark"] .btn-outline-danger:disabled {
  color: #6c4a4d;
  border-color: #6c4a4d;
}

/* Fix text visibility in dark mode */
[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
}

[data-theme="dark"] .text-success {
  color: #5cb85c !important;
}

/* Fix file icon color in dark mode */
[data-theme="dark"] .bi-file-earmark-excel.text-success {
  color: #5cb85c !important;
}

/* Fix empty state text */
[data-theme="dark"] .text-center.text-muted h4 {
  color: #adb5bd !important;
}

[data-theme="dark"] .text-center.text-muted p {
  color: #adb5bd !important;
}

/* Markup % column - Purple theme */
.ag-theme-quartz .markup-cell {
  background-color: #6f42c1 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .ag-theme-quartz-dark .markup-cell {
  background-color: #5a32a3 !important;
  color: #ffffff !important;
}

/* Cost Type column - Teal theme */
.ag-theme-quartz .cost-type-cell {
  background-color: #20c997 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .ag-theme-quartz-dark .cost-type-cell {
  background-color: #198754 !important;
  color: #ffffff !important;
}

/* zzType column - Blue theme */
.ag-theme-quartz .zz-type-cell {
  background-color: #0d6efd !important;
  color: #ffffff !important;
  font-weight: 700 !important;
}

[data-theme="dark"] .ag-theme-quartz-dark .zz-type-cell {
  background-color: #0a58ca !important;
  color: #ffffff !important;
}

/* Fix zzType cell editor dropdown visibility in dark mode */
[data-theme="dark"] .ag-theme-quartz-dark .ag-select,
[data-theme="dark"] .ag-theme-quartz-dark .ag-cell-editor select,
[data-theme="dark"] .ag-theme-quartz-dark .form-select {
  background-color: #2d2d2d !important;
  border-color: #495057 !important;
  color: #ffffff !important;
}

[data-theme="dark"] .ag-theme-quartz-dark .form-select option {
  background-color: #2d2d2d !important;
  color: #ffffff !important;
}

[data-theme="dark"] .ag-theme-quartz-dark .ag-cell-inline-editing {
  background-color: #2d2d2d !important;
  color: #ffffff !important;
}

/* Fix zzType cell text visibility */
[data-theme="dark"] .ag-theme-quartz-dark .zz-type-cell .ag-cell-value {
  color: #ffffff !important;
}

/* Description column styling */
.ag-theme-quartz .description-column {
  font-weight: 500;
  background-color: #f8f9fa;
}

[data-theme="dark"] .ag-theme-quartz-dark .description-column {
  font-weight: 500;
  background-color: #2a2a2a;
}

/* Manually edited markup cells styling - Make them VERY visible for testing */
.ag-theme-quartz .ag-cell.markup-manually-set {
  color: #ffffff !important;
  background-color: #ff0000 !important;  /* Bright red for testing */
  font-weight: 700 !important;
  font-style: italic !important;
  border: 2px solid #ff00ff !important;  /* Magenta border for testing */
}

[data-theme="dark"] .ag-theme-quartz-dark .ag-cell.markup-manually-set {
  color: #ffffff !important;
  background-color: #ff0000 !important;  /* Bright red for testing */
  font-weight: 700 !important;
  font-style: italic !important;
  border: 2px solid #ff00ff !important;  /* Magenta border for testing */
}
</style>
