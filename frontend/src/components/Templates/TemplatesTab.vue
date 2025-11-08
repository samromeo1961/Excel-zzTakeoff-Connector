<template>
  <div class="templates-tab h-100 d-flex flex-column">
    <!-- Reusable Toolbar Component -->
    <TabToolbar
      :is-fullscreen="isFullscreen"
      :current-file-name="excelFileState.currentFileName"
      :has-unsaved-changes="excelFileState.hasUnsavedChanges"
      :show-file-info="!!excelFileState.currentFile"
      :show-search="!!selectedTemplate"
      tab-label="Templates"
      tab-icon="bi bi-folder"
      search-placeholder="Search templates..."
      @search="handleSearch"
      @exit-fullscreen="isFullscreen = false"
    >
      <!-- Toolbar action buttons -->
      <template #toolbar-actions>
        <!-- Template Selector -->
        <select
          class="form-select form-select-sm template-selector"
          v-model="selectedTemplateId"
          @change="onTemplateChange"
        >
          <option value="">Select Template...</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.templateName }} ({{ template.items?.length || 0 }} items)
          </option>
        </select>

        <button
          class="btn btn-sm btn-success"
          @click="handleNewTemplate"
          title="New Template"
        >
          <i class="bi bi-plus-circle"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-info"
          @click="handleImportCSV"
          :disabled="!selectedTemplate"
          title="Import from CSV"
        >
          <i class="bi bi-filetype-csv"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-info"
          @click="handlePasteFromClipboard"
          :disabled="!selectedTemplate"
          title="Paste from Clipboard (Excel)"
        >
          <i class="bi bi-clipboard"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-primary"
          @click="handleUpdateFromExcel"
          :disabled="!selectedTemplate"
          title="Update template from Excel file (SKU matching)"
        >
          <i class="bi bi-arrow-repeat"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-primary"
          @click="loadTemplates"
          title="Refresh"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-danger"
          @click="handleDelete"
          :disabled="!selectedTemplate"
          :title="selectedRows.length > 0 ? `Delete ${selectedRows.length} Selected Item(s)` : 'Delete Template'"
        >
          <i class="bi bi-trash"></i>
        </button>
      </template>

      <!-- Fullscreen action buttons -->
      <template #fullscreen-actions>
        <select
          class="form-select form-select-sm template-selector-fullscreen"
          v-model="selectedTemplateId"
          @change="onTemplateChange"
        >
          <option value="">Select Template...</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.templateName }} ({{ template.items?.length || 0 }} items)
          </option>
        </select>

        <button
          class="btn btn-sm action-icon-btn"
          @click="handleNewTemplate"
          title="New Template"
        >
          <i class="bi bi-plus-circle"></i>
        </button>
        <button
          class="btn btn-sm action-icon-btn"
          @click="handleImportCSV"
          :disabled="!selectedTemplate"
          title="Import from CSV"
        >
          <i class="bi bi-filetype-csv"></i>
        </button>
        <button
          class="btn btn-sm action-icon-btn"
          @click="handlePasteFromClipboard"
          :disabled="!selectedTemplate"
          title="Paste from Clipboard"
        >
          <i class="bi bi-clipboard"></i>
        </button>
        <button
          class="btn btn-sm action-icon-btn"
          @click="handleUpdateFromExcel"
          :disabled="!selectedTemplate"
          title="Update template from Excel file"
        >
          <i class="bi bi-arrow-repeat"></i>
        </button>
        <button
          class="btn btn-sm action-icon-btn"
          @click="loadTemplates"
          title="Refresh"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <button
          class="btn btn-sm action-icon-btn"
          @click="handleDelete"
          :disabled="!selectedTemplate"
          :title="selectedRows.length > 0 ? `Delete ${selectedRows.length} Selected Item(s)` : 'Delete Template'"
        >
          <i class="bi bi-trash"></i>
        </button>
      </template>
    </TabToolbar>

    <!-- Error/Success Messages -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show m-2 mb-0" role="alert">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    <div v-if="success" class="alert alert-success alert-dismissible fade show m-2 mb-0" role="alert">
      <i class="bi bi-check-circle me-2"></i>
      {{ success }}
      <button type="button" class="btn-close" @click="success = null"></button>
    </div>

    <!-- AG Grid or Empty State -->
    <div class="flex-grow-1 position-relative d-flex flex-column">
      <!-- Empty State -->
      <div v-if="!selectedTemplate && !loading" class="flex-grow-1 text-center py-5">
        <i class="bi bi-folder-plus" style="font-size: 4rem; color: var(--text-secondary);"></i>
        <h5 class="mt-3 text-muted">No Template Selected</h5>
        <p class="text-muted">
          {{ templates.length === 0
            ? 'No templates available. Create a new template to get started.'
            : 'Select a template from the dropdown above to view its items.' }}
        </p>
      </div>

      <!-- AG Grid -->
      <div v-else class="flex-grow-1 position-relative">
        <ag-grid-vue
          class="ag-theme-quartz h-100"
          :class="{ 'ag-theme-quartz-dark': isDarkMode }"
          :columnDefs="columnDefs"
          :rowData="filteredData"
          :defaultColDef="defaultColDef"
          :pagination="true"
          :paginationPageSize="pageSize"
          :paginationPageSizeSelector="pageSizeOptions"
          :rowSelection="rowSelectionConfig"
          :loading="loading"
          :enableBrowserTooltips="true"
          @grid-ready="onGridReady"
          @selection-changed="onSelectionChanged"
          @cell-value-changed="onCellValueChanged"
        />

        <!-- Custom footer info overlaid on AG Grid pagination -->
        <div class="custom-grid-footer">
          <span class="text-muted small">
            <i class="bi bi-folder me-1"></i>
            <template v-if="searchTerm && filteredData.length < (selectedTemplate?.items?.length || 0)">
              Showing: <strong>{{ filteredData.length.toLocaleString() }}</strong> of <strong>{{ (selectedTemplate?.items?.length || 0).toLocaleString() }}</strong> items
            </template>
            <template v-else>
              Total: <strong>{{ filteredData.length.toLocaleString() }}</strong> items
            </template>
          </span>
          <span v-if="selectedRows.length > 0" class="text-primary small ms-3">
            <i class="bi bi-check2-square me-1"></i>
            {{ selectedRows.length }} selected
          </span>
        </div>
      </div>
    </div>

    <!-- New Template Modal -->
    <div
      class="modal fade"
      id="newTemplateModal"
      tabindex="-1"
      aria-labelledby="newTemplateModalLabel"
      aria-hidden="true"
      ref="newTemplateModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="newTemplateModalLabel">Create New Template</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="templateName" class="form-label">Template Name <span class="text-danger">*</span></label>
              <input
                type="text"
                id="templateName"
                class="form-control"
                placeholder="Enter template name..."
                v-model="newTemplateName"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="confirmCreateTemplate" :disabled="!newTemplateName">
              <i class="bi bi-check-circle me-1"></i>
              Create Template
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      class="modal fade"
      id="deleteModal"
      tabindex="-1"
      aria-labelledby="deleteModalLabel"
      aria-hidden="true"
      ref="deleteModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">
              {{ selectedRows.length > 0 ? 'Confirm Delete Items' : 'Confirm Delete Template' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <template v-if="selectedRows.length > 0">
              Are you sure you want to delete {{ selectedRows.length }} selected item(s) from the template "{{ selectedTemplate?.templateName }}"?
              <div class="mt-3" v-if="selectedRows.length <= 5">
                <strong>Items to be deleted:</strong>
                <ul class="mt-2">
                  <li v-for="item in selectedRows" :key="item.code">
                    {{ item.code }} - {{ item.description }}
                  </li>
                </ul>
              </div>
              <div class="mt-3" v-else>
                <strong>{{ selectedRows.length }} items will be deleted</strong>
              </div>
            </template>
            <template v-else>
              Are you sure you want to delete the template "{{ selectedTemplate?.templateName }}"?
              This action cannot be undone.
            </template>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="confirmDelete">
              Delete {{ selectedRows.length > 0 ? `${selectedRows.length} Item(s)` : 'Template' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Template Modal -->
    <UpdateTemplateModal
      :is-open="showUpdateTemplateModal"
      :items="excelItemsForUpdate"
      :column-mappings="columnMappings"
      :pre-selected-template-id="selectedTemplateId"
      @close="closeUpdateTemplateModal"
      @updated="handleTemplateUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import TabToolbar from '../common/TabToolbar.vue';
import UpdateTemplateModal from '../Modals/UpdateTemplateModal.vue';
import useElectronAPI from '../../composables/useElectronAPI';
import { useRouter } from 'vue-router';
import { Modal } from 'bootstrap';

const api = useElectronAPI();
const router = useRouter();
const theme = inject('theme');
const isMaximized = inject('webviewMaximized');
const isFullscreen = inject('isFullscreen');
const excelFileState = inject('excelFileState');

// State
const templates = ref([]);
const selectedTemplateId = ref('');
const selectedTemplate = ref(null);
const loading = ref(false);
const error = ref(null);
const success = ref(null);
const searchTerm = ref('');
const selectedRows = ref([]);
const gridApi = ref(null);
const pageSize = ref(50);
const pageSizeOptions = [25, 50, 100, 200];
const newTemplateName = ref('');
const columnMappings = ref(null);

// Update Template Modal state
const showUpdateTemplateModal = ref(false);
const excelItemsForUpdate = ref([]);

// Modals
const newTemplateModal = ref(null);
const deleteModal = ref(null);
let newTemplateModalInstance = null;
let deleteModalInstance = null;

// Check if dark mode
const isDarkMode = computed(() => {
  return theme && theme.value === 'dark';
});

// Filtered data based on search
const filteredData = computed(() => {
  if (!selectedTemplate.value || !selectedTemplate.value.items) return [];

  if (!searchTerm.value) return selectedTemplate.value.items;

  const search = searchTerm.value.toLowerCase();
  return selectedTemplate.value.items.filter(item => {
    const code = (item.code || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const unit = (item.unit || '').toLowerCase();
    const costCode = (item.costCode || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const subCategory = (item.subCategory || '').toLowerCase();
    const zzType = (item.zzType || '').toLowerCase();

    return code.includes(search) ||
           description.includes(search) ||
           unit.includes(search) ||
           costCode.includes(search) ||
           category.includes(search) ||
           subCategory.includes(search) ||
           zzType.includes(search);
  });
});

// Row selection configuration
const rowSelectionConfig = {
  mode: 'multiRow',
  checkboxes: true,
  headerCheckbox: true,
  enableClickSelection: false
};

// zzType Cell Editor (matching Excel Grid)
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
    const options = ['', 'area', 'linear', 'segment', 'count'];
    options.forEach(option => {
      const optEl = document.createElement('option');
      optEl.value = option;
      optEl.text = option || '-- Select Type --';
      if (option === this.value) {
        optEl.selected = true;
      }
      this.eInput.appendChild(optEl);
    });

    // Handle keyboard navigation
    this.eInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        params.stopEditing();
      }
    });
  }

  getGui() {
    return this.eInput;
  }

  getValue() {
    return this.eInput.value;
  }

  destroy() {}

  isPopup() {
    return false;
  }

  afterGuiAttached() {
    this.eInput.focus();
  }
}

// Cost Type Cell Editor (matching Excel Grid)
class CostTypeEditor {
  init(params) {
    this.params = params;
    this.value = params.value || 'Subcontractor';

    this.eInput = document.createElement('select');
    this.eInput.className = 'form-select form-select-sm';
    this.eInput.style.width = '100%';
    this.eInput.style.height = '100%';

    const options = ['Labour', 'Plant', 'Material', 'Subcontractor'];
    options.forEach(option => {
      const optEl = document.createElement('option');
      optEl.value = option;
      optEl.text = option;
      if (option === this.value) {
        optEl.selected = true;
      }
      this.eInput.appendChild(optEl);
    });

    this.eInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        params.stopEditing();
      }
    });
  }

  getGui() {
    return this.eInput;
  }

  getValue() {
    return this.eInput.value;
  }

  destroy() {}

  isPopup() {
    return false;
  }

  afterGuiAttached() {
    this.eInput.focus();
  }
}

// AG Grid column definitions - dynamically built from preferences column mappings
// Template data uses fixed field names, so we map preference column IDs to template fields
const columnDefs = computed(() => {
  const cols = [];

  // Map preference column IDs to template data field names
  const fieldMapping = {
    'sku': 'code',
    'code': 'code',
    'description': 'description',
    'name': 'description',
    'units': 'unit',
    'unit': 'unit',
    'costEach': 'costEach',
    'cost': 'costEach',
    'costCode': 'costCode',
    'category': 'category',
    'custom1': 'subCategory',
    'subCategory': 'subCategory'
  };

  // If column mappings are loaded, use them to build dynamic columns
  if (columnMappings.value && columnMappings.value.preferredColumns) {
    // Get visible mapped columns sorted by order
    const visibleColumns = columnMappings.value.preferredColumns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);

    // Create columns from mappings
    visibleColumns.forEach(prefCol => {
      // Map the preference column ID to template field name
      const templateField = fieldMapping[prefCol.id];
      if (!templateField) return; // Skip if no mapping exists

      const isDescriptionColumn = prefCol.id === 'description' || prefCol.id === 'name';
      const isCostEach = prefCol.id === 'costEach' || prefCol.id === 'cost';
      const isCode = prefCol.id === 'sku' || prefCol.id === 'code';

      const colDef = {
        field: templateField,
        headerName: prefCol.label,
        editable: true,
        singleClickEdit: true,
        cellEditor: isCostEach ? undefined : 'agTextCellEditor', // Force text editor for non-numeric columns (SKU can be alphanumeric)
        minWidth: isDescriptionColumn ? 455 : 100, // 30% wider (350 * 1.3 = 455)
        flex: isDescriptionColumn ? 3 : 1,
        suppressMovable: false,
        pinned: isCode ? 'left' : undefined,
        cellClass: isDescriptionColumn ? 'description-column' : (isCode ? 'code-column' : ''),
        tooltipField: isDescriptionColumn ? templateField : undefined, // Show full text on hover
        tooltipComponentParams: isDescriptionColumn ? {
          color: '#ececec'
        } : undefined
      };

      // Add special formatters for cost columns
      if (isCostEach) {
        colDef.valueFormatter = (params) => {
          if (params.value == null || params.value === '') return '';
          return `$${parseFloat(params.value).toFixed(2)}`;
        };
        colDef.valueParser = (params) => {
          const cleaned = String(params.newValue).replace(/[$,]/g, '');
          return parseFloat(cleaned) || 0;
        };
        colDef.cellStyle = { textAlign: 'right' };
      }

      cols.push(colDef);
    });
  } else {
    // Fallback: minimal columns if mappings haven't loaded yet
    cols.push(
      {
        field: 'code',
        headerName: 'Code/SKU',
        width: 150,
        pinned: 'left',
        editable: true,
        singleClickEdit: true,
        cellClass: 'code-column'
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 3,
        minWidth: 350,
        editable: true,
        singleClickEdit: true,
        cellClass: 'description-column'
      }
    );
  }

  // Add Markup % column (metadata column)
  cols.push({
    field: 'markupPercent',
    headerName: 'Markup %',
    width: 120,
    maxWidth: 120,
    editable: true,
    singleClickEdit: true,
    pinned: 'right',
    suppressSizeToFit: true,
    cellClass: 'markup-cell',
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

  // Add Cost Type column (metadata column)
  cols.push({
    field: 'costType',
    headerName: 'Cost Type',
    width: 140,
    maxWidth: 140,
    cellEditor: CostTypeEditor,
    editable: true,
    cellClass: 'cost-type-cell',
    pinned: 'right',
    suppressMovable: true,
    suppressSizeToFit: true
  });

  // Add zzType column (metadata column)
  cols.push({
    field: 'zzType',
    headerName: 'zzType',
    width: 150,
    maxWidth: 150,
    cellEditor: ZzTypeEditor,
    editable: true,
    cellClass: 'zz-type-cell',
    pinned: 'right',
    suppressMovable: true,
    suppressSizeToFit: true
  });

  // Add Actions column (metadata column)
  cols.push({
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    maxWidth: 150,
    pinned: 'right',
    cellRenderer: (params) => {
      return `
        <div class="action-buttons d-flex gap-1 justify-content-center align-items-center h-100">
          <button class="btn btn-sm btn-warning send-btn" data-action="zztakeoff" title="Send to zzTakeoff">
            <i class="bi bi-send"></i>
          </button>
          <button class="btn btn-sm btn-danger" data-action="delete" title="Delete Item">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
    },
    suppressHeaderMenuButton: true,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    suppressSizeToFit: true
  });

  return cols;
});

// Default column properties
const defaultColDef = {
  resizable: true,
  sortable: false,
  filter: false,
  floatingFilter: false
};

// Load templates
const loadTemplates = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.templatesStore.getList();
    if (response?.success) {
      templates.value = response.data || [];

      // If a template was selected, refresh it
      if (selectedTemplateId.value) {
        const updatedTemplate = templates.value.find(t => t.id === selectedTemplateId.value);
        if (updatedTemplate) {
          selectedTemplate.value = updatedTemplate;
        } else {
          // Template was deleted
          selectedTemplateId.value = '';
          selectedTemplate.value = null;
        }
      }
    } else {
      error.value = 'Failed to load templates';
    }
  } catch (err) {
    console.error('Error loading templates:', err);
    error.value = 'Error loading templates';
  } finally {
    loading.value = false;
  }
};

// Template change handler
const onTemplateChange = async () => {
  if (selectedTemplateId.value) {
    selectedTemplate.value = templates.value.find(t => t.id === selectedTemplateId.value);

    // Save last selected template to preferences
    try {
      await api.preferencesStore.update('lastSelectedTemplate', selectedTemplateId.value);
    } catch (error) {
      console.error('Failed to save last selected template:', error);
    }
  } else {
    selectedTemplate.value = null;
  }
  searchTerm.value = '';
};

// Clear search
const clearSearch = () => {
  searchTerm.value = '';
};

// Handle search from TabToolbar
const handleSearch = (search) => {
  searchTerm.value = search;
};

// Grid ready handler
const onGridReady = (params) => {
  gridApi.value = params.api;

  // Add click event listener for row actions
  params.api.addEventListener('cellClicked', (event) => {
    const target = event.event.target;
    const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;

    if (action === 'zztakeoff') {
      handleSendSingleItemToZzTakeoff(event.data);
    } else if (action === 'delete') {
      handleDeleteItem(event.data);
    }
  });
};

// Selection changed handler
const onSelectionChanged = () => {
  if (gridApi.value) {
    selectedRows.value = gridApi.value.getSelectedRows();
  }
};

// Cell value changed handler (for inline editing)
const onCellValueChanged = async (event) => {
  if (!selectedTemplate.value) return;

  try {
    // Create a clean copy of updatedItems with only serializable data
    const updatedItems = (selectedTemplate.value.items || []).map(item => {
      if (item.code === event.data.code) {
        // Create a plain object with only the fields we need (no AG Grid properties)
        return {
          code: item.code,
          description: item.description,
          unit: item.unit,
          costEach: item.costEach,
          costCode: item.costCode,
          category: item.category,
          subCategory: item.subCategory,
          markupPercent: item.markupPercent,
          costType: item.costType,
          zzType: item.zzType,
          // Update the changed field
          [event.colDef.field]: event.newValue
        };
      }
      // Return a clean copy of unchanged items too
      return {
        code: item.code,
        description: item.description,
        unit: item.unit,
        costEach: item.costEach,
        costCode: item.costCode,
        category: item.category,
        subCategory: item.subCategory,
        markupPercent: item.markupPercent,
        costType: item.costType,
        zzType: item.zzType
      };
    });

    // Save the updated template with clean data
    const templateToSave = {
      id: selectedTemplate.value.id,
      templateName: selectedTemplate.value.templateName,
      items: updatedItems
    };

    await api.templatesStore.save(templateToSave);

    // Update local state without reloading (avoids grid re-render and potential loops)
    selectedTemplate.value.items = updatedItems;

    console.log(`Updated ${event.colDef.field} for ${event.data.code}`);
  } catch (err) {
    console.error('Error updating template item:', err);
    error.value = `Failed to update ${event.colDef.field}`;
    // Revert the change
    event.node.setDataValue(event.colDef.field, event.oldValue);
  }
};

// Handle new template
const handleNewTemplate = () => {
  newTemplateName.value = '';
  if (newTemplateModalInstance) {
    newTemplateModalInstance.show();
  }
};

// Confirm create template
const confirmCreateTemplate = async () => {
  if (!newTemplateName.value) {
    error.value = 'Template name is required';
    return;
  }

  try {
    const templateToSave = {
      templateName: newTemplateName.value,
      items: []
    };

    const response = await api.templatesStore.save(templateToSave);

    if (response?.success) {
      success.value = `Template "${newTemplateName.value}" created successfully`;
      setTimeout(() => success.value = null, 3000);

      // Hide modal
      if (newTemplateModalInstance) {
        newTemplateModalInstance.hide();
      }

      // Reload templates
      await loadTemplates();

      // Select the newly created template
      selectedTemplateId.value = response.data.id;
      await onTemplateChange();
    } else {
      error.value = 'Failed to create template';
    }
  } catch (err) {
    console.error('Error creating template:', err);
    error.value = 'Failed to create template';
  }
};

// Handle Import from CSV
const handleImportCSV = () => {
  if (!selectedTemplate.value) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        error.value = 'No valid items found in CSV file';
        return;
      }

      await bulkImportItems(items);
      success.value = `Successfully imported ${items.length} items from CSV`;
      setTimeout(() => success.value = null, 3000);
    } catch (err) {
      console.error('Error importing CSV:', err);
      error.value = `Failed to import CSV: ${err.message}`;
    }
  };
  input.click();
};

// Handle Update Template from Excel
const handleUpdateFromExcel = async () => {
  if (!selectedTemplate.value) return;

  try {
    let filePath;

    // Check if there's already an Excel file loaded in the Excel Grid tab
    if (excelFileState.value.currentFile) {
      // Use the currently loaded file
      filePath = excelFileState.value.currentFile;
      console.log('[TemplatesTab] Using currently loaded Excel file:', filePath);
    } else {
      // No file loaded, prompt user to select one
      console.log('[TemplatesTab] No file loaded, opening file picker');
      const dialogResult = await api.file.openDialog({
        title: 'Select Excel File',
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls', 'xlsm'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!dialogResult.success || dialogResult.canceled) return;

      filePath = dialogResult.filePath;
      console.log('[TemplatesTab] User selected Excel file:', filePath);
    }

    // Read Excel file
    const result = await api.excel.readFile(filePath);
    if (!result.success) {
      error.value = result.message || 'Failed to read Excel file';
      return;
    }

    // Get first sheet data
    const sheet = result.data.sheets[0];
    if (!sheet || !sheet.data || sheet.data.length === 0) {
      error.value = 'No data found in Excel file';
      return;
    }

    // Load metadata
    const metadataResult = await api.excel.getMetadata(filePath);
    const metadata = metadataResult?.metadata || {};

    // Merge metadata with Excel data
    const excelDataWithMetadata = sheet.data.map(row => {
      const rowHash = row._rowHash;
      const rowMetadata = metadata[rowHash] || {};
      return {
        ...row,
        _markupPercent: rowMetadata.markupPercent,
        _costType: rowMetadata.costType || 'Subcontractor',
        _zzType: rowMetadata.zzType || 'count'
      };
    });

    // Set the Excel items for the modal
    excelItemsForUpdate.value = excelDataWithMetadata;

    // Open the modal
    showUpdateTemplateModal.value = true;

  } catch (err) {
    console.error('Error loading Excel file:', err);
    error.value = `Failed to load Excel file: ${err.message}`;
  }
};

// Close Update Template Modal
const closeUpdateTemplateModal = () => {
  showUpdateTemplateModal.value = false;
  excelItemsForUpdate.value = [];
};

// Handle Template Updated
const handleTemplateUpdated = async ({ templateId, added, updated, removed }) => {
  console.log(`Template ${templateId} updated: Added ${added}, Updated ${updated}, Removed ${removed}`);

  // Reload templates
  await loadTemplates();

  // Re-select the updated template
  selectedTemplateId.value = templateId;
  await onTemplateChange();

  // Show success message
  success.value = `Template updated! Added: ${added}, Updated: ${updated}, Removed: ${removed}`;
  setTimeout(() => success.value = null, 5000);
};

// Handle Paste from Clipboard
const handlePasteFromClipboard = async () => {
  if (!selectedTemplate.value) return;

  try {
    const text = await navigator.clipboard.readText();

    if (!text || text.trim() === '') {
      error.value = 'Clipboard is empty';
      return;
    }

    const items = parseClipboardData(text);

    if (items.length === 0) {
      error.value = 'No valid items found in clipboard data';
      return;
    }

    await bulkImportItems(items);
    success.value = `Successfully imported ${items.length} items from clipboard`;
    setTimeout(() => success.value = null, 3000);
  } catch (err) {
    console.error('Error pasting from clipboard:', err);
    error.value = `Failed to paste: ${err.message}`;
  }
};

// Parse CSV text
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const item = {};

    headers.forEach((header, index) => {
      item[header] = values[index] || '';
    });

    if (item.code || item.description) {
      items.push({
        code: item.code || '',
        description: item.description || '',
        unit: item.unit || '',
        costEach: parseFloat(item.costeach || item['cost each']) || 0,
        costCode: item.costcode || item['sc #'] || '',
        category: item.category || '',
        subCategory: item.subcategory || item['sub category'] || '',
        markupPercent: parseFloat(item.markuppercent || item.markup) || null,
        costType: item.costtype || 'Subcontractor',
        zzType: item.zztype || 'count'
      });
    }
  }

  return items;
};

// Parse clipboard data
const parseClipboardData = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 1) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const items = [];

  // Check if first line looks like headers
  const firstLine = lines[0].split(delimiter);
  const hasHeaders = firstLine.some(v =>
    v.toLowerCase().includes('code') ||
    v.toLowerCase().includes('description')
  );

  const startIndex = hasHeaders ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim());

    if (values[0] || values[1]) {
      items.push({
        code: values[0] || '',
        description: values[1] || '',
        unit: values[2] || '',
        costEach: parseFloat(values[3]) || 0,
        costCode: values[4] || '',
        category: values[5] || '',
        subCategory: values[6] || '',
        markupPercent: parseFloat(values[7]) || null,
        costType: values[8] || 'Subcontractor',
        zzType: values[9] || 'count'
      });
    }
  }

  return items;
};

// Bulk import items
const bulkImportItems = async (items) => {
  if (!selectedTemplate.value || items.length === 0) return;

  try {
    const existingItems = selectedTemplate.value.items || [];
    const existingCodes = new Set(existingItems.map(item => item.code));

    // Filter out duplicates
    const newItems = items.filter(item => !existingCodes.has(item.code));

    if (newItems.length === 0) {
      error.value = 'All items already exist in this template';
      return;
    }

    // Save updated template
    const templateToSave = {
      id: selectedTemplate.value.id,
      templateName: selectedTemplate.value.templateName,
      items: [...existingItems, ...newItems]
    };

    await api.templatesStore.save(templateToSave);
    await loadTemplates();

    const skipped = items.length - newItems.length;
    if (skipped > 0) {
      success.value = `Imported ${newItems.length} items (${skipped} duplicates skipped)`;
    }
  } catch (err) {
    throw err;
  }
};

// Handle delete
const handleDelete = () => {
  if (deleteModalInstance) {
    deleteModalInstance.show();
  }
};

// Confirm delete
const confirmDelete = async () => {
  if (selectedRows.value.length > 0) {
    await confirmDeleteItems();
  } else {
    await confirmDeleteTemplate();
  }
};

// Confirm delete items
const confirmDeleteItems = async () => {
  if (!selectedTemplate.value || selectedRows.value.length === 0) return;

  try {
    const codesToDelete = selectedRows.value.map(item => item.code);
    const updatedItems = (selectedTemplate.value.items || [])
      .filter(item => !codesToDelete.includes(item.code));

    const templateToSave = {
      id: selectedTemplate.value.id,
      templateName: selectedTemplate.value.templateName,
      items: updatedItems
    };

    await api.templatesStore.save(templateToSave);

    if (deleteModalInstance) {
      deleteModalInstance.hide();
    }

    success.value = `Deleted ${selectedRows.value.length} item(s) from template`;
    setTimeout(() => success.value = null, 3000);

    await loadTemplates();

    if (gridApi.value) {
      gridApi.value.deselectAll();
    }
  } catch (err) {
    console.error('Error deleting items:', err);
    error.value = 'Failed to delete items';
  }
};

// Confirm delete template
const confirmDeleteTemplate = async () => {
  if (!selectedTemplate.value) return;

  try {
    const response = await api.templatesStore.delete(selectedTemplate.value.id);
    if (response?.success) {
      if (deleteModalInstance) {
        deleteModalInstance.hide();
      }

      success.value = 'Template deleted successfully';
      setTimeout(() => success.value = null, 3000);

      selectedTemplateId.value = '';
      selectedTemplate.value = null;
      await loadTemplates();
    } else {
      error.value = 'Failed to delete template';
    }
  } catch (err) {
    console.error('Error deleting template:', err);
    error.value = 'Failed to delete template';
  }
};

// Handle delete single item
const handleDeleteItem = async (item) => {
  if (!selectedTemplate.value || !item) return;

  if (!confirm(`Are you sure you want to remove "${item.description}" from this template?`)) {
    return;
  }

  try {
    const updatedItems = (selectedTemplate.value.items || [])
      .filter(i => i.code !== item.code);

    const templateToSave = {
      id: selectedTemplate.value.id,
      templateName: selectedTemplate.value.templateName,
      items: updatedItems
    };

    await api.templatesStore.save(templateToSave);

    success.value = `Removed "${item.description}" from template`;
    setTimeout(() => success.value = null, 3000);

    await loadTemplates();
  } catch (err) {
    console.error('Error deleting item:', err);
    error.value = 'Failed to delete item';
  }
};

// Send single item to zzTakeoff
const handleSendSingleItemToZzTakeoff = async (item) => {
  try {
    console.log('[zzTakeoff] Sending item:', item);

    // Navigate to zzTakeoff Web tab
    if (router.currentRoute.value.path !== '/zztakeoff-web') {
      await router.push('/zztakeoff-web');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Maximize the webview
    isMaximized.value = true;

    const zzType = item.zzType || 'count';

    const jsCode = `
      (function() {
        try {
          // Navigate to Takeoff tab
          if (typeof Router !== 'undefined' && typeof appLayout !== 'undefined') {
            const takeoffUrl = appLayout.getAppUrl('takeoff');
            console.log('[zzTakeoff] Navigating to:', takeoffUrl);
            Router.go(takeoffUrl);
          }

          // Open the takeoff dialogue
          startTakeoffWithProperties({
            type: ${JSON.stringify(zzType)},
            properties: {
              name: { value: ${JSON.stringify(item.description || '')} },
              sku: { value: ${JSON.stringify(item.code || '')} },
              unit: { value: ${JSON.stringify(item.unit || '')} },
              'Cost Each': { value: ${JSON.stringify((item.costEach || 0).toString())} },
              'cost centre': { value: '' }
            }
          });

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `;

    const result = await api.webview.executeJavaScript(jsCode);

    console.log('[zzTakeoff] Result:', result);

    // Add to send history
    await api.sendHistory.add({
      items: [{
        code: item.code,
        description: item.description,
        unit: item.unit,
        costEach: item.costEach,
        costCode: item.costCode,
        category: item.category,
        subCategory: item.subCategory,
        markupPercent: item.markupPercent,
        costType: item.costType,
        zzType: item.zzType
      }],
      project: 'Template: ' + selectedTemplate.value.templateName,
      status: result.success ? 'Success' : 'Failed',
      sentAt: new Date().toISOString(),
      itemCount: 1
    });

    success.value = `Sent "${item.description}" to zzTakeoff`;
    setTimeout(() => success.value = null, 3000);

  } catch (err) {
    console.error('Error sending to zzTakeoff:', err);
    error.value = `Failed to send item: ${err.message}`;
  }
};

// Mount
onMounted(async () => {
  await loadTemplates();

  // Load column mappings from preferences
  try {
    const columnMappingsResult = await api.preferencesStore.getColumnMappings();
    if (columnMappingsResult.success) {
      columnMappings.value = columnMappingsResult.data || { preferredColumns: [] };
      console.log('[TemplatesTab] Column mappings loaded:', columnMappings.value);
    }
  } catch (error) {
    console.error('[TemplatesTab] Failed to load column mappings:', error);
    columnMappings.value = { preferredColumns: [] };
  }

  // Load last selected template from preferences
  try {
    const prefs = await api.preferencesStore.get();
    if (prefs.data?.lastSelectedTemplate && templates.value.length > 0) {
      const lastTemplateId = prefs.data.lastSelectedTemplate;
      const templateExists = templates.value.find(t => t.id === lastTemplateId);

      if (templateExists) {
        selectedTemplateId.value = lastTemplateId;
        selectedTemplate.value = templateExists;
      } else if (templates.value.length > 0) {
        // If last template doesn't exist, select the first one
        selectedTemplateId.value = templates.value[0].id;
        selectedTemplate.value = templates.value[0];
      }
    } else if (templates.value.length > 0) {
      // No preference saved, select first template
      selectedTemplateId.value = templates.value[0].id;
      selectedTemplate.value = templates.value[0];
    }
  } catch (error) {
    console.error('Failed to load last selected template:', error);
    // Default to first template if any exist
    if (templates.value.length > 0) {
      selectedTemplateId.value = templates.value[0].id;
      selectedTemplate.value = templates.value[0];
    }
  }

  // Initialize Bootstrap modals
  if (newTemplateModal.value) {
    newTemplateModalInstance = new Modal(newTemplateModal.value);
  }

  if (deleteModal.value) {
    deleteModalInstance = new Modal(deleteModal.value);
  }
});
</script>

<style scoped>
.templates-tab {
  background-color: var(--bs-body-bg);
}

/* Template Selector Styling */
.template-selector {
  min-width: 250px;
  max-width: 300px;
}

.template-selector-fullscreen {
  min-width: 200px;
  max-width: 250px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.template-selector-fullscreen option {
  background-color: #2d2d2d;
  color: #ffffff;
}

.template-selector-fullscreen:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

[data-theme="dark"] .templates-tab {
  background-color: #1e1e1e;
}

[data-theme="dark"] .ag-theme-quartz {
  --ag-background-color: #1e1e1e;
  --ag-header-background-color: #2d2d2d;
  --ag-odd-row-background-color: #252525;
  --ag-row-hover-color: #2d2d2d;
  --ag-foreground-color: #e4e4e4;
  --ag-border-color: #3e3e3e;
}

[data-theme="dark"] .input-group-text {
  background-color: #2d2d2d;
  color: #e4e4e4;
  border-color: #3e3e3e;
}

[data-theme="dark"] .form-control,
[data-theme="dark"] .form-select {
  background-color: #1e1e1e;
  color: #e4e4e4;
  border-color: #3e3e3e;
}

[data-theme="dark"] .form-control:focus,
[data-theme="dark"] .form-select:focus {
  background-color: #1e1e1e;
  color: #e4e4e4;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

[data-theme="dark"] .form-control::placeholder {
  color: #6c757d;
}

[data-theme="dark"] .modal-content {
  background-color: #2d2d2d;
  color: #e4e4e4;
}

[data-theme="dark"] .modal-header,
[data-theme="dark"] .modal-footer {
  border-color: #3e3e3e;
}

.ag-theme-quartz {
  --ag-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.custom-grid-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 10px 16px;
  z-index: 10;
  pointer-events: none;
}

[data-theme="dark"] .custom-grid-footer {
  color: var(--text-primary);
}

[data-theme="dark"] .custom-grid-footer .text-muted {
  color: var(--text-secondary) !important;
}

/* AG Grid Cell Styling (matching Excel Grid) */
:deep(.code-column) {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

:deep(.description-column) {
  white-space: normal !important;
  line-height: 1.4;
  padding: 8px !important;
}

/* Markup % column */
:deep(.markup-cell) {
  font-weight: 600;
  text-align: right;
}

[data-theme="dark"] :deep(.markup-cell) {
  color: #ffffff;
}

/* Cost Type column */
:deep(.cost-type-cell) {
  font-weight: 600;
}

[data-theme="dark"] :deep(.cost-type-cell) {
  color: #ffffff;
}

/* zzType column */
:deep(.zz-type-cell) {
  font-weight: 700;
  text-align: center;
}

[data-theme="dark"] :deep(.zz-type-cell) {
  color: #ffffff;
}

/* Action Buttons Styling */
:deep(.action-buttons) {
  padding: 4px 0;
}

:deep(.send-btn) {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
}

:deep(.send-btn:hover) {
  background-color: #ffca2c;
  border-color: #ffc720;
  color: #000;
}

:deep(.send-btn i) {
  color: #000;
  font-size: 0.9rem;
}
</style>
