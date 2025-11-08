<template>
  <div
    class="modal fade"
    :class="{ 'show d-block': isOpen }"
    tabindex="-1"
    @click.self="close"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-arrow-repeat me-2"></i>
            Update Template from Excel
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <p class="text-muted small mb-3">
            Update an existing template based on SKU matching. This will add new items, update changed items, and optionally remove items not in the Excel sheet.
          </p>

          <!-- Template Selection -->
          <div class="mb-3">
            <label class="form-label">Select Template to Update</label>
            <select
              v-model="selectedTemplateId"
              class="form-select"
              :disabled="loading || templates.length === 0"
              @change="analyzeChanges"
            >
              <option value="">-- Select a template --</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.templateName }} ({{ template.items?.length || 0 }} items)
              </option>
            </select>
          </div>

          <!-- Options -->
          <div class="mb-3">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="addNewItems"
                v-model="addNewItems"
                @change="analyzeChanges"
              />
              <label class="form-check-label" for="addNewItems">
                Add new items from Excel to template
              </label>
            </div>
            <div class="form-check mt-2">
              <input
                class="form-check-input"
                type="checkbox"
                id="removeDeletedItems"
                v-model="removeDeletedItems"
                @change="analyzeChanges"
              />
              <label class="form-check-label" for="removeDeletedItems">
                Remove items from template that are not in Excel sheet
              </label>
            </div>
          </div>

          <!-- Change Summary -->
          <div v-if="selectedTemplateId && changesSummary" class="mb-3">
            <h6 class="mb-2">Changes Summary:</h6>
            <ul class="list-group">
              <li class="list-group-item d-flex justify-content-between align-items-center" v-if="changesSummary.toAdd.length > 0 && addNewItems">
                <span><i class="bi bi-plus-circle text-success me-2"></i>Items to add</span>
                <span class="badge bg-success rounded-pill">{{ changesSummary.toAdd.length }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center" v-if="changesSummary.toUpdate.length > 0">
                <span><i class="bi bi-arrow-repeat text-primary me-2"></i>Items to update</span>
                <span class="badge bg-primary rounded-pill">{{ changesSummary.toUpdate.length }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center" v-if="changesSummary.toRemove.length > 0 && removeDeletedItems">
                <span><i class="bi bi-trash text-danger me-2"></i>Items to remove</span>
                <span class="badge bg-danger rounded-pill">{{ changesSummary.toRemove.length }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center" v-if="changesSummary.unchanged.length > 0">
                <span><i class="bi bi-check-circle text-muted me-2"></i>Items unchanged</span>
                <span class="badge bg-secondary rounded-pill">{{ changesSummary.unchanged.length }}</span>
              </li>
            </ul>

            <!-- No changes message -->
            <div v-if="!hasChanges" class="alert alert-info mt-2">
              <i class="bi bi-info-circle me-2"></i>
              No changes detected. Template is already up to date.
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-danger mb-0">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ error }}
          </div>

          <!-- Success Message -->
          <div v-if="success" class="alert alert-success mb-0">
            <i class="bi bi-check-circle me-2"></i>
            {{ success }}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleUpdate"
            :disabled="loading || !selectedTemplateId || !hasChanges"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-arrow-repeat me-2"></i>
            {{ loading ? 'Updating...' : 'Update Template' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div v-if="isOpen" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import useElectronAPI from '../../composables/useElectronAPI';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  },
  columnMappings: {
    type: Object,
    default: null
  },
  preSelectedTemplateId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'updated']);

const api = useElectronAPI();

// State
const templates = ref([]);
const selectedTemplateId = ref('');
const addNewItems = ref(false);
const removeDeletedItems = ref(false);
const loading = ref(false);
const error = ref(null);
const success = ref(null);
const changesSummary = ref(null);

// Computed
const hasChanges = computed(() => {
  if (!changesSummary.value) return false;
  return (addNewItems.value && changesSummary.value.toAdd.length > 0) ||
         changesSummary.value.toUpdate.length > 0 ||
         (removeDeletedItems.value && changesSummary.value.toRemove.length > 0);
});

// Load templates
const loadTemplates = async () => {
  try {
    const response = await api.templatesStore.getList();
    if (response?.success) {
      templates.value = response.data || [];
    }
  } catch (err) {
    console.error('Error loading templates:', err);
  }
};

// Convert Excel row to template item format
const convertRowToTemplateItem = (row) => {
  // Helper function to get value from Excel row using column mappings
  const getExcelValue = (prefColumnId) => {
    if (!props.columnMappings || !props.columnMappings.preferredColumns) {
      return null;
    }

    const mapping = props.columnMappings.preferredColumns.find(col => col.id === prefColumnId);
    if (mapping && mapping.excelColumn) {
      return row[mapping.excelColumn];
    }
    return null;
  };

  // Get values using column mappings
  const code = getExcelValue('sku') || getExcelValue('code') || row.SKU || row.Code || '';
  const description = getExcelValue('description') || getExcelValue('name') || row.Description || row.Name || '';
  const unit = getExcelValue('units') || getExcelValue('unit') || row.Units || row.Unit || '';
  const costEachValue = getExcelValue('costEach') || getExcelValue('cost') || row['Cost Each'] || row.Cost || 0;
  const costCode = getExcelValue('costCode') || row['SC #'] || row['Cost Code'] || '';
  const category = getExcelValue('category') || row.Category || '';
  const subCategory = getExcelValue('custom1') || getExcelValue('subCategory') || row['Sub Category'] || '';

  return {
    code: code || '',
    description: description || '',
    unit: unit || '',
    costEach: parseFloat(costEachValue) || 0,
    costCode: costCode || '',
    category: category || '',
    subCategory: subCategory || '',
    markupPercent: parseFloat(row._markupPercent || row.markupPercent || row['Markup %']) || null,
    costType: row._costType || row.costType || row['Cost Type'] || 'Subcontractor',
    zzType: row._zzType || row.zzType || row.zztype || 'count'
  };
};

// Check if two items are different
const itemsAreDifferent = (item1, item2) => {
  return item1.description !== item2.description ||
         item1.unit !== item2.unit ||
         item1.costEach !== item2.costEach ||
         item1.costCode !== item2.costCode ||
         item1.category !== item2.category ||
         item1.subCategory !== item2.subCategory ||
         item1.markupPercent !== item2.markupPercent ||
         item1.costType !== item2.costType ||
         item1.zzType !== item2.zzType;
};

// Analyze changes between Excel and template
const analyzeChanges = async () => {
  if (!selectedTemplateId.value) {
    changesSummary.value = null;
    return;
  }

  try {
    console.log('[UpdateTemplateModal] Analyzing changes');
    console.log('[UpdateTemplateModal] Column mappings:', props.columnMappings);
    console.log('[UpdateTemplateModal] Excel items count:', props.items.length);

    // Get the selected template
    const getResponse = await api.templatesStore.get(selectedTemplateId.value);
    if (!getResponse.success) {
      error.value = 'Failed to load template';
      return;
    }

    const template = getResponse.data;
    const existingItems = template.items || [];

    // Convert Excel rows to template format
    const excelItems = props.items.map(convertRowToTemplateItem);
    console.log('[UpdateTemplateModal] Converted Excel items (first 3):', excelItems.slice(0, 3));

    // Create SKU maps
    const excelBySku = new Map(excelItems.map(item => [item.code, item]));
    const templateBySku = new Map(existingItems.map(item => [item.code, item]));

    const toAdd = [];
    const toUpdate = [];
    const unchanged = [];
    const toRemove = [];

    // Check Excel items against template
    for (const excelItem of excelItems) {
      if (!excelItem.code) continue; // Skip items without SKU

      if (!templateBySku.has(excelItem.code)) {
        // New item in Excel
        toAdd.push(excelItem);
      } else {
        // Item exists in both
        const templateItem = templateBySku.get(excelItem.code);
        if (itemsAreDifferent(excelItem, templateItem)) {
          toUpdate.push(excelItem);
        } else {
          unchanged.push(excelItem);
        }
      }
    }

    // Check for items in template but not in Excel
    for (const templateItem of existingItems) {
      if (!templateItem.code) continue;

      if (!excelBySku.has(templateItem.code)) {
        toRemove.push(templateItem);
      }
    }

    changesSummary.value = {
      toAdd,
      toUpdate,
      toRemove,
      unchanged
    };

  } catch (err) {
    console.error('Error analyzing changes:', err);
    error.value = 'Failed to analyze changes';
  }
};

// Helper function to create clean plain object (removes AG Grid and Vue proxy properties)
const createCleanItem = (item) => {
  return {
    code: item.code || '',
    description: item.description || '',
    unit: item.unit || '',
    costEach: item.costEach || 0,
    costCode: item.costCode || '',
    category: item.category || '',
    subCategory: item.subCategory || '',
    markupPercent: item.markupPercent !== null && item.markupPercent !== undefined ? item.markupPercent : null,
    costType: item.costType || 'Subcontractor',
    zzType: item.zzType || 'count'
  };
};

// Handle update template
const handleUpdate = async () => {
  error.value = null;
  success.value = null;
  loading.value = true;

  try {
    if (!selectedTemplateId.value) {
      error.value = 'Please select a template';
      loading.value = false;
      return;
    }

    if (!changesSummary.value || !hasChanges.value) {
      error.value = 'No changes to apply';
      loading.value = false;
      return;
    }

    // Get the template
    const getResponse = await api.templatesStore.get(selectedTemplateId.value);
    if (!getResponse.success) {
      error.value = 'Failed to load template';
      loading.value = false;
      return;
    }

    const template = getResponse.data;
    let updatedItems = (template.items || []).map(createCleanItem);

    // Create SKU map for tracking
    const skuSet = new Set(updatedItems.map(item => item.code));

    let addedCount = 0;
    let updatedCount = 0;

    // Add new items (only if addNewItems is checked)
    if (addNewItems.value) {
      for (const item of changesSummary.value.toAdd) {
        if (!skuSet.has(item.code)) {
          updatedItems.push(createCleanItem(item));
          skuSet.add(item.code);
          addedCount++;
        }
      }
    }

    // Update existing items
    for (const updatedItem of changesSummary.value.toUpdate) {
      const index = updatedItems.findIndex(item => item.code === updatedItem.code);
      if (index !== -1) {
        updatedItems[index] = createCleanItem(updatedItem);
        updatedCount++;
      }
    }

    // Remove deleted items if option is checked
    let removedCount = 0;
    if (removeDeletedItems.value) {
      const codesToRemove = new Set(changesSummary.value.toRemove.map(item => item.code));
      const beforeLength = updatedItems.length;
      updatedItems = updatedItems.filter(item => !codesToRemove.has(item.code));
      removedCount = beforeLength - updatedItems.length;
    }

    // Create clean template object for saving (no Vue proxy properties)
    const templateToSave = {
      id: template.id,
      templateName: template.templateName,
      items: updatedItems
    };

    const saveResponse = await api.templatesStore.save(templateToSave);

    if (!saveResponse.success) {
      error.value = saveResponse.message || 'Failed to update template';
      loading.value = false;
      return;
    }

    success.value = `Template updated successfully! Added: ${addedCount}, Updated: ${updatedCount}, Removed: ${removedCount}`;

    // Close modal after a short delay
    setTimeout(() => {
      emit('updated', {
        templateId: selectedTemplateId.value,
        added: addedCount,
        updated: updatedCount,
        removed: removedCount
      });
      close();
    }, 2000);

  } catch (err) {
    console.error('Error updating template:', err);
    error.value = err.message || 'Failed to update template';
  } finally {
    loading.value = false;
  }
};

// Close modal
const close = () => {
  if (!loading.value) {
    selectedTemplateId.value = '';
    addNewItems.value = false;
    removeDeletedItems.value = false;
    changesSummary.value = null;
    error.value = null;
    success.value = null;
    emit('close');
  }
};

// Watch for modal open
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    console.log('[UpdateTemplateModal] Modal opened');
    console.log('[UpdateTemplateModal] Items received:', props.items.length);
    console.log('[UpdateTemplateModal] Column mappings received:', props.columnMappings);
    console.log('[UpdateTemplateModal] First Excel row sample:', props.items[0]);
    console.log('[UpdateTemplateModal] Pre-selected template ID:', props.preSelectedTemplateId);

    await loadTemplates();
    error.value = null;
    success.value = null;
    changesSummary.value = null;

    // Pre-select template if provided
    if (props.preSelectedTemplateId) {
      selectedTemplateId.value = props.preSelectedTemplateId;
      // Automatically analyze changes for the pre-selected template
      await analyzeChanges();
    }
  }
});

// Load templates on mount
onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Dark mode styles */
[data-theme="dark"] .modal-content {
  background-color: #2d2d2d;
  color: #e4e4e4;
}

[data-theme="dark"] .modal-header,
[data-theme="dark"] .modal-footer {
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
}

[data-theme="dark"] .form-check-input {
  background-color: #1e1e1e;
  border-color: #3e3e3e;
}

[data-theme="dark"] .form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

[data-theme="dark"] .btn-close {
  filter: invert(1);
}

[data-theme="dark"] .list-group-item {
  background-color: #1e1e1e;
  border-color: #3e3e3e;
  color: #e4e4e4;
}

[data-theme="dark"] .alert-info {
  background-color: #1e3a5f;
  border-color: #2c5282;
  color: #90cdf4;
}
</style>
