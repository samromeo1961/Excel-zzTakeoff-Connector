<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header">
          <h5 class="modal-title">Send to zzTakeoff</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>


        <!-- Body -->
        <div class="modal-body">
          <!-- Row Info -->
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>{{ displayData.description }}</strong>
            <br>
            <small v-if="displayData.sku">SKU: {{ displayData.sku }}</small>
            <br>
            <small v-if="displayData.zzType">Type: {{ displayData.zzType }}</small>
          </div>

          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            This will send to the currently open project in zzTakeoff. Make sure you're logged in and have a project open.
          </div>

          <!-- Item Configuration -->
          <div class="border rounded p-3 mb-3">
            <h6 class="mb-3">
              <i class="bi bi-gear me-1"></i>
              Item Configuration
            </h6>

            <div class="row g-2">
              <!-- Takeoff Type -->
              <div class="col-md-6">
                <label class="form-label small">Takeoff Type</label>
                <select v-model="itemConfig.takeoffType" class="form-select form-select-sm">
                  <option value="area">Area</option>
                  <option value="linear">Linear</option>
                  <option value="segment">Segment</option>
                  <option value="count">Count</option>
                </select>
              </div>

              <!-- Cost Type -->
              <div class="col-md-6">
                <label class="form-label small">Cost Type</label>
                <select v-model="itemConfig.costType" class="form-select form-select-sm">
                  <option value="Subcontra">Subcontra</option>
                  <option value="Material">Material</option>
                  <option value="Labor">Labor</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>

              <!-- Units -->
              <div class="col-md-4">
                <label class="form-label small">Units</label>
                <input
                  type="text"
                  v-model="itemConfig.units"
                  class="form-control form-control-sm"
                  placeholder="m2"
                />
              </div>

              <!-- Cost Each -->
              <div class="col-md-4">
                <label class="form-label small">Cost Each</label>
                <input
                  type="number"
                  v-model.number="itemConfig.costEach"
                  class="form-control form-control-sm"
                  step="0.01"
                  min="0"
                />
              </div>

              <!-- Markup % -->
              <div class="col-md-4">
                <label class="form-label small">Markup %</label>
                <input
                  type="number"
                  v-model.number="itemConfig.markup"
                  class="form-control form-control-sm"
                  step="1"
                  min="0"
                />
              </div>

              <!-- Quantity -->
              <div class="col-12">
                <label class="form-label small">Quantity</label>
                <input
                  type="number"
                  v-model.number="itemConfig.quantity"
                  class="form-control form-control-sm"
                  step="1"
                  min="0"
                />
              </div>

              <!-- Total Preview -->
              <div class="col-12 mt-2">
                <div class="alert alert-secondary mb-0 py-2">
                  <strong>Total Cost:</strong>
                  ${{ ((itemConfig.costEach * itemConfig.quantity) * (1 + itemConfig.markup/100)).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ errorMessage }}
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="send"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Sending...' : 'Send to zzTakeoff' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Updated: Improved timing and error handling for JavaScript injection
import { ref, watch, inject, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import useElectronAPI from '../../composables/useElectronAPI';

const api = useElectronAPI();
const router = useRouter();
const isMaximized = inject('webviewMaximized');

// Load column mappings
const columnMappings = ref(null);

onMounted(async () => {
  if (api.preferences && api.preferences.getColumnMappings) {
    const result = await api.preferences.getColumnMappings();
    if (result.success) {
      columnMappings.value = result.data;
      console.log('[SendModal] Column mappings loaded:', columnMappings.value);
    }
  }
});

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  rowData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'sent']);

const loading = ref(false);
const errorMessage = ref('');

// Item configuration
const itemConfig = ref({
  takeoffType: 'area',
  costType: 'Subcontra',
  units: 'm2',
  costEach: 0,
  markup: 35,
  quantity: 1
});

// Format display values
const displayData = computed(() => ({
  description: props.rowData.Description || props.rowData.Name || 'Unnamed Item',
  sku: props.rowData.SKU || props.rowData.ItemCode || props.rowData.PriceCode || '',
  zzType: props.rowData._zzType || 'area'
}));

// Initialize item config when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    errorMessage.value = '';

    // Initialize item config from row data
    itemConfig.value = {
      takeoffType: props.rowData._zzType || 'area',
      costType: 'Subcontra',
      units: props.rowData.Unit || props.rowData.Units || 'm2',
      costEach: parseFloat(props.rowData['Cost Each'] || props.rowData.Price || 0),
      markup: props.rowData._markupPercent || 35,
      quantity: parseFloat(props.rowData.Quantity || props.rowData.Units || 1)
    };
  }
});

/**
 * Build properties object dynamically based on column mappings
 * Only includes columns where sendToZzTakeoff is true
 */
const buildPropertiesFromMappings = () => {
  const properties = {};

  if (!columnMappings.value || !columnMappings.value.preferredColumns) {
    // Fallback to basic properties if mappings not loaded
    return {
      name: { value: displayData.value.description },
      sku: { value: displayData.value.sku }
    };
  }

  // Iterate through all columns that should be sent to zzTakeoff
  columnMappings.value.preferredColumns.forEach(col => {
    if (!col.sendToZzTakeoff) return;

    let value = '';

    // Handle metadata columns (user-editable values stored with _ prefix)
    if (col.isMetadata) {
      if (col.id === 'markupPercent') {
        value = itemConfig.value.markup?.toString() || '';
      } else if (col.id === 'zzType') {
        value = itemConfig.value.takeoffType || '';
      }
    }
    // Handle mapped columns (values from Excel)
    else if (col.excelColumn) {
      value = props.rowData[col.excelColumn] || '';
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
      for (const name of possibleNames) {
        if (props.rowData[name]) {
          value = props.rowData[name];
          break;
        }
      }
    }

    // Add to properties object with the column label as the key
    if (value !== undefined && value !== null) {
      properties[col.label] = { value: value.toString() };
    }
  });

  return properties;
};

const send = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    // Transform item to zzTakeoff format
    const typeMapping = {
      'area': 'area',
      'linear': 'linear',
      'segment': 'segment',
      'count': 'count'
    };

    // Build properties dynamically based on column mappings
    const properties = buildPropertiesFromMappings();

    const zzTakeoffItem = {
      type: typeMapping[itemConfig.value.takeoffType] || 'count',
      properties: properties
    };

    // Calculate total cost
    const totalCost = (itemConfig.value.costEach * itemConfig.value.quantity) * (1 + itemConfig.value.markup / 100);

    // Save to send history
    await api.sendHistory.add({
      project: 'Currently Open Project',
      items: [{
        code: displayData.value.sku,
        description: displayData.value.description,
        takeoffType: itemConfig.value.takeoffType,
        costType: itemConfig.value.costType,
        units: itemConfig.value.units,
        costEach: itemConfig.value.costEach,
        markup: itemConfig.value.markup,
        quantity: itemConfig.value.quantity,
        total: totalCost
      }],
      status: 'Sent (JavaScript Injection)',
      sentAt: new Date().toISOString(),
      itemCount: 1,
      totalCost: totalCost
    });

    console.log('[zzTakeoff] Item ready for JavaScript injection:', JSON.stringify(zzTakeoffItem, null, 2));

    // Emit success event FIRST
    emit('sent', {
      timestamp: new Date().toISOString()
    });

    // Close modal
    close();

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
    errorMessage.value = 'Error: ' + error.message;
  } finally {
    loading.value = false;
  }
};

const close = () => {
  if (!loading.value) {
    emit('close');
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-dialog {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content {
  background-color: var(--bs-body-bg);
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.5;
}

.btn-close:hover {
  opacity: 1;
}

.btn-close::before {
  content: '×';
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--bs-border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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

[data-theme="dark"] .btn-close {
  color: #e4e4e4;
}

[data-theme="dark"] .alert-info {
  background-color: #0d3a52;
  border-color: #0c5460;
  color: #bee5eb;
}

[data-theme="dark"] .alert-danger {
  background-color: #5a1e1e;
  border-color: #842029;
  color: #ea868f;
}

[data-theme="dark"] .form-select {
  background-color: #1e1e1e;
  border-color: #495057;
  color: #e4e4e4;
}

[data-theme="dark"] .form-select option {
  background-color: #2d2d2d;
  color: #e4e4e4;
}
</style>
