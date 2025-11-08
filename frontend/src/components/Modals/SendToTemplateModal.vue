<template>
  <div
    class="modal fade"
    :class="{ 'show d-block': isOpen }"
    tabindex="-1"
    @click.self="close"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-folder me-2"></i>
            Send to Template
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <p class="text-muted small mb-3">
            Send {{ selectedCount }} item(s) to a template
          </p>

          <!-- Template Selection -->
          <div class="mb-3">
            <label class="form-label">Select Template</label>
            <select
              v-model="selectedTemplateId"
              class="form-select"
              :disabled="loading || templates.length === 0"
            >
              <option value="">-- Select a template --</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.templateName }} ({{ template.items?.length || 0 }} items)
              </option>
            </select>
          </div>

          <!-- Create New Template Option -->
          <div class="mb-3">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="createNewTemplate"
                v-model="createNew"
                @change="onCreateNewChange"
              />
              <label class="form-check-label" for="createNewTemplate">
                Create new template
              </label>
            </div>
          </div>

          <!-- New Template Name (if creating new) -->
          <div v-if="createNew" class="mb-3">
            <label class="form-label">New Template Name</label>
            <input
              type="text"
              class="form-control"
              v-model="newTemplateName"
              placeholder="Enter template name..."
              :disabled="loading"
            />
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
            @click="handleSend"
            :disabled="loading || (!selectedTemplateId && !createNew) || (createNew && !newTemplateName.trim())"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-folder-plus me-2"></i>
            {{ loading ? 'Sending...' : 'Send to Template' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div v-if="isOpen" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import useElectronAPI from '../../composables/useElectronAPI';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'sent']);

const api = useElectronAPI();

// State
const templates = ref([]);
const selectedTemplateId = ref('');
const createNew = ref(false);
const newTemplateName = ref('');
const loading = ref(false);
const error = ref(null);
const success = ref(null);

// Computed
const selectedCount = ref(0);

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

// Handle create new checkbox change
const onCreateNewChange = () => {
  if (createNew.value) {
    selectedTemplateId.value = '';
  } else {
    newTemplateName.value = '';
  }
  error.value = null;
  success.value = null;
};

// Handle send to template
const handleSend = async () => {
  error.value = null;
  success.value = null;
  loading.value = true;

  try {
    let targetTemplateId = selectedTemplateId.value;
    let template = null;

    // Create new template if needed
    if (createNew.value) {
      if (!newTemplateName.value.trim()) {
        error.value = 'Please enter a template name';
        loading.value = false;
        return;
      }

      // Create new template with empty items array
      const newTemplate = {
        templateName: newTemplateName.value.trim(),
        items: []
      };

      const createResponse = await api.templatesStore.save(newTemplate);
      if (!createResponse.success) {
        error.value = createResponse.message || 'Failed to create template';
        loading.value = false;
        return;
      }

      targetTemplateId = createResponse.data.id;
      template = createResponse.data;
    } else {
      if (!targetTemplateId) {
        error.value = 'Please select a template';
        loading.value = false;
        return;
      }

      // Get the existing template
      const getResponse = await api.templatesStore.get(targetTemplateId);
      if (!getResponse.success) {
        error.value = 'Failed to load template';
        loading.value = false;
        return;
      }

      template = getResponse.data;
    }

    const existingItems = template.items || [];

    // Convert Excel rows to template items
    const newItems = props.items.map(row => {
      // Find columns from row object keys (dynamically)
      const code = row.code || row.Code || row.CODE || row.SKU || row.sku || '';
      const description = row.description || row.Description || row.DESCRIPTION || row.Name || row.name || '';
      const unit = row.unit || row.Unit || row.UNIT || row.Units || row.units || '';
      const costEach = parseFloat(row.costEach || row['Cost Each'] || row.cost || row.Cost || 0) || 0;
      const costCode = row.costCode || row['Cost Code'] || row['SC #'] || row['SC#'] || row.sc || '';
      const category = row.category || row.Category || row.CATEGORY || '';
      const subCategory = row.subCategory || row['Sub Category'] || row.subcategory || row.custom1 || '';
      const markupPercent = parseFloat(row.markupPercent || row['Markup %'] || row.markup || row._markupPercent) || null;
      const costType = row.costType || row['Cost Type'] || row._costType || 'Subcontractor';
      const zzType = row._zzType || row.zzType || row.zztype || row.ZZTYPE || 'count';

      return {
        code,
        description,
        unit,
        costEach,
        costCode,
        category,
        subCategory,
        markupPercent,
        costType,
        zzType
      };
    });

    // Merge with existing items (avoid duplicates based on code)
    const existingCodes = new Set(existingItems.map(item => item.code));
    const itemsToAdd = newItems.filter(item => item.code && !existingCodes.has(item.code));

    if (itemsToAdd.length === 0) {
      error.value = 'All selected items already exist in the template or have no code';
      loading.value = false;
      return;
    }

    const updatedItems = [...existingItems, ...itemsToAdd];

    // Update the template
    const updatedTemplate = {
      ...template,
      items: updatedItems
    };

    const saveResponse = await api.templatesStore.save(updatedTemplate);

    if (!saveResponse.success) {
      error.value = saveResponse.message || 'Failed to save template';
      loading.value = false;
      return;
    }

    success.value = `Successfully added ${itemsToAdd.length} item(s) to template`;

    // Close modal after a short delay
    setTimeout(() => {
      emit('sent', { templateId: targetTemplateId, itemsAdded: itemsToAdd.length });
      close();
    }, 1500);

  } catch (err) {
    console.error('Error sending to template:', err);
    error.value = err.message || 'Failed to send to template';
  } finally {
    loading.value = false;
  }
};

// Close modal
const close = () => {
  if (!loading.value) {
    selectedTemplateId.value = '';
    createNew.value = false;
    newTemplateName.value = '';
    error.value = null;
    success.value = null;
    emit('close');
  }
};

// Watch for modal open
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedCount.value = props.items.length;
    loadTemplates();
    error.value = null;
    success.value = null;
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
</style>
