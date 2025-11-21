<template>
  <div class="preferences-tab h-100 d-flex flex-column">
    <!-- Fullscreen Header (shown only in fullscreen mode) -->
    <div v-if="isFullscreen" class="fullscreen-header border-bottom p-2 d-flex align-items-center justify-content-between">
      <FullscreenNavigation />
      <h5 class="mb-0">
        <i class="bi bi-gear me-2"></i>
        Preferences
      </h5>
    </div>

    <div class="p-3 flex-grow-1 overflow-auto">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="mb-0">Preferences</h4>
          <p class="text-muted small mb-0">Application settings and configuration</p>
      </div>
    </div>

    <!-- Accordion Container -->
    <div class="accordion mt-4" id="preferencesAccordion">

      <!-- Appearance Section -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ 'collapsed': !expandedSections.appearance }"
            type="button"
            @click="toggleSection('appearance')"
          >
            <i class="bi bi-palette me-2"></i>
            Appearance
          </button>
        </h2>
        <div v-show="expandedSections.appearance" class="accordion-collapse">
          <div class="accordion-body">
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="darkModeSwitch"
                :checked="theme === 'dark'"
                @change="toggleTheme"
              />
              <label class="form-check-label" for="darkModeSwitch">
                Dark Mode
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Default Markup % Section -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ 'collapsed': !expandedSections.markup }"
            type="button"
            @click="toggleSection('markup')"
          >
            <i class="bi bi-percent me-2"></i>
            Default Markup %
          </button>
        </h2>
        <div v-show="expandedSections.markup" class="accordion-collapse">
          <div class="accordion-body">
            <p class="text-muted small mb-3">Set default markup percentage to apply to all items in the grid</p>
            <div class="row align-items-center">
              <div class="col-md-3">
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="defaultMarkupPercent"
                    placeholder="e.g., 35"
                    min="0"
                    max="1000"
                    step="0.1"
                  />
                  <span class="input-group-text">%</span>
                </div>
              </div>
              <div class="col-md-4">
                <button
                  @click="saveAndApplyDefaultMarkup"
                  class="btn btn-primary"
                  :disabled="defaultMarkupPercent === null || defaultMarkupPercent === ''"
                >
                  <i class="bi bi-save me-2"></i>
                  Save & Apply to Grid
                </button>
              </div>
              <div class="col-md-5">
                <p class="text-muted small mb-0">Click "Save & Apply" to update all items in the currently loaded file</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unit Mappings Section -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ 'collapsed': !expandedSections.unitMappings }"
            type="button"
            @click="toggleSection('unitMappings')"
          >
            <i class="bi bi-rulers me-2"></i>
            Unit Mappings
          </button>
        </h2>
        <div v-show="expandedSections.unitMappings" class="accordion-collapse">
          <div class="accordion-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <p class="text-muted small mb-0">Map units to default zzType values</p>
              <button
                @click="refreshUnitMappings"
                class="btn btn-sm btn-outline-secondary"
                title="Refresh unit mappings"
              >
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>

            <!-- Unit Mappings Table -->
            <div v-if="unitMappings.length > 0" class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Default zzType</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mapping in unitMappings" :key="mapping.unit">
                    <td>{{ mapping.unit }}</td>
                    <td>
                      <select
                        v-model="mapping.zzType"
                        class="form-select form-select-sm"
                        @change="updateUnitMapping(mapping.unit, mapping.zzType, mapping.active)"
                      >
                        <option value="area">Area</option>
                        <option value="linear">Linear</option>
                        <option value="segment">Segment</option>
                        <option value="count">Count</option>
                      </select>
                    </td>
                    <td>
                      <div class="form-check form-switch">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          v-model="mapping.active"
                          @change="updateUnitMapping(mapping.unit, mapping.zzType, mapping.active)"
                        />
                      </div>
                    </td>
                    <td>
                      <button
                        @click="deleteUnitMapping(mapping.unit)"
                        class="btn btn-sm btn-outline-danger"
                        title="Delete mapping"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="alert alert-info">
              <div v-if="discoveredUnitsCount > 0" class="d-flex align-items-center justify-content-between">
                <div>
                  <i class="bi bi-exclamation-circle me-2"></i>
                  <strong>{{ discoveredUnitsCount }} units discovered!</strong>
                  <div class="small mt-1">These units need to be mapped to zzTypes before they appear here.</div>
                </div>
                <button class="btn btn-sm btn-primary" @click="openDiscoveredUnitsModal">
                  Configure Now
                </button>
              </div>
              <div v-else>
                <i class="bi bi-info-circle me-2"></i>
                No unit mappings configured. Load an Excel file to discover units automatically.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Discovered Units Section -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ 'collapsed': !expandedSections.discoveredUnits }"
            type="button"
            @click="toggleSection('discoveredUnits')"
          >
            <i class="bi bi-inbox me-2"></i>
            Discovered Units
            <span v-if="discoveredUnitsCount > 0" class="badge bg-primary ms-2">{{ discoveredUnitsCount }}</span>
          </button>
        </h2>
        <div v-show="expandedSections.discoveredUnits" class="accordion-collapse">
          <div class="accordion-body">
            <p class="text-muted small mb-3">Units found in Excel files awaiting configuration</p>

            <div class="d-flex gap-2 align-items-center">
              <button
                @click="openDiscoveredUnitsModal"
                class="btn btn-primary"
                :disabled="discoveredUnitsCount === 0"
              >
                <i class="bi bi-inbox me-2"></i>
                Configure Discovered Units
                <span v-if="discoveredUnitsCount > 0" class="badge bg-light text-dark ms-2">
                  {{ discoveredUnitsCount }}
                </span>
              </button>
              <button
                @click="refreshDiscoveredUnits"
                class="btn btn-outline-success"
                title="Re-scan current file for units"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>

            <div v-if="discoveredUnitsCount === 0" class="alert alert-info mt-3 mb-0">
              <i class="bi bi-info-circle me-2"></i>
              No new units discovered. Load Excel files to automatically detect units.
            </div>
          </div>
        </div>
      </div>

      <!-- Column Mappings Section -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ 'collapsed': !expandedSections.columnMappings }"
            type="button"
            @click="toggleSection('columnMappings')"
          >
            <i class="bi bi-table me-2"></i>
            Column Mappings
          </button>
        </h2>
        <div v-show="expandedSections.columnMappings" class="accordion-collapse">
          <div class="accordion-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <p class="text-muted small mb-0">Map Excel columns to preferred display columns</p>
              <div class="d-flex gap-2">
                <button
                  @click="resetColumnMappings"
                  class="btn btn-sm btn-outline-warning"
                  title="Reset to default columns"
                >
                  <i class="bi bi-arrow-counterclockwise"></i> Reset to Defaults
                </button>
                <button
                  @click="showAddCustomColumnModal = true"
                  class="btn btn-sm btn-outline-primary"
                  title="Add custom column"
                >
                  <i class="bi bi-plus-lg"></i> Add Custom Column
                </button>
                <button
                  @click="refreshColumnMappings"
                  class="btn btn-sm btn-outline-secondary"
                  title="Refresh column mappings"
                >
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>

            <!-- Column Mappings Table -->
            <div v-if="columnMappings.preferredColumns && columnMappings.preferredColumns.length > 0" class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th style="width: 50px;">Order</th>
                    <th>Preferred Column</th>
                    <th>Excel Column</th>
                    <th style="width: 80px;">Visible</th>
                    <th style="width: 100px;">Send to zzTakeoff</th>
                    <th style="width: 150px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(column, index) in sortedColumns" :key="column.id">
                    <td class="text-center">
                      <span class="badge bg-secondary">{{ column.order + 1 }}</span>
                    </td>
                    <td>
                      <!-- Editable label for custom columns -->
                      <div v-if="!column.isStandard" class="d-flex align-items-center gap-2">
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          v-model="column.label"
                          @blur="updateColumnMapping(column.id, { label: column.label })"
                          @keyup.enter="updateColumnMapping(column.id, { label: column.label })"
                          placeholder="Column Label"
                        />
                        <span class="badge bg-secondary">Custom</span>
                      </div>
                      <!-- Non-editable label for standard columns -->
                      <strong v-else>{{ column.label }}</strong>
                    </td>
                    <td>
                      <select
                        v-model="column.excelColumn"
                        class="form-select form-select-sm"
                        @change="updateColumnMapping(column.id, { excelColumn: column.excelColumn })"
                      >
                        <option :value="null">-- Not Mapped --</option>
                        <option v-for="excelCol in availableExcelColumns" :key="excelCol" :value="excelCol">
                          {{ excelCol }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <div class="form-check form-switch">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          v-model="column.visible"
                          @change="updateColumnMapping(column.id, { visible: column.visible })"
                        />
                      </div>
                    </td>
                    <td>
                      <div class="form-check form-switch">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          v-model="column.sendToZzTakeoff"
                          @change="updateColumnMapping(column.id, { sendToZzTakeoff: column.sendToZzTakeoff })"
                        />
                      </div>
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        <!-- Move Up Button -->
                        <button
                          @click="moveColumnUp(index)"
                          class="btn btn-sm btn-outline-secondary"
                          :disabled="index === 0"
                          title="Move up"
                        >
                          <i class="bi bi-arrow-up"></i>
                        </button>
                        <!-- Move Down Button -->
                        <button
                          @click="moveColumnDown(index)"
                          class="btn btn-sm btn-outline-secondary"
                          :disabled="index === sortedColumns.length - 1"
                          title="Move down"
                        >
                          <i class="bi bi-arrow-down"></i>
                        </button>
                        <!-- Delete Button (only for custom columns) -->
                        <button
                          v-if="!column.isStandard"
                          @click="deleteColumn(column.id)"
                          class="btn btn-sm btn-outline-danger"
                          title="Delete custom column"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Discovered Columns Section -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ 'collapsed': !expandedSections.discoveredColumns }"
            type="button"
            @click="toggleSection('discoveredColumns')"
          >
            <i class="bi bi-columns-gap me-2"></i>
            Discovered Excel Columns
          </button>
        </h2>
        <div v-show="expandedSections.discoveredColumns" class="accordion-collapse">
          <div class="accordion-body">
            <p class="text-muted small mb-3">Excel columns found in files awaiting mapping</p>

            <div v-if="discoveredColumns && discoveredColumns.length > 0" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              {{ discoveredColumns.length }} unmapped column(s) found. Map them in the Column Mappings table above.
              <div v-if="discoveredColumns.length > 0" class="mt-2">
                <strong>Unmapped columns:</strong> {{ discoveredColumns.map(c => c.columnName).join(', ') }}
              </div>
            </div>

            <div v-else class="alert alert-info mb-0">
              <i class="bi bi-info-circle me-2"></i>
              No unmapped columns. All discovered columns have been mapped.
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Save Preferences Button (at bottom) -->
    <div class="mt-4 p-3 border-top">
      <div class="d-flex justify-content-between align-items-center">
        <p class="text-muted small mb-0">
          Click "Apply & Reload Grid" to save all preferences and reload the Excel Grid with updated column mappings.
        </p>
        <button
          @click="saveAndReloadGrid"
          class="btn btn-primary btn-lg"
        >
          <i class="bi bi-save me-2"></i>
          Apply & Reload Grid
        </button>
      </div>
    </div>
    </div>
  </div>

  <!-- Discovered Units Modal -->
  <DiscoveredUnitsModal
    :is-open="showDiscoveredUnitsModal"
    @close="closeDiscoveredUnitsModal"
    @updated="handleDiscoveredUnitsUpdated"
  />

  <!-- Add Custom Column Modal -->
  <div
    class="modal fade"
    :class="{ 'show d-block': showAddCustomColumnModal }"
    tabindex="-1"
    @click.self="closeAddCustomColumnModal"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Custom Column</h5>
          <button type="button" class="btn-close" @click="closeAddCustomColumnModal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="customColumnLabel" class="form-label">Column Label</label>
            <input
              type="text"
              class="form-control"
              id="customColumnLabel"
              v-model="newColumnLabel"
              placeholder="e.g., Supplier Code"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeAddCustomColumnModal">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            @click="addCustomColumn"
            :disabled="!newColumnLabel.trim()"
          >
            Add Column
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Backdrop for Add Custom Column Modal -->
  <div v-if="showAddCustomColumnModal" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { inject, ref, onMounted, onActivated, computed } from 'vue';
import { useRouter } from 'vue-router';
import FullscreenNavigation from '../common/FullscreenNavigation.vue';
import DiscoveredUnitsModal from '../Modals/DiscoveredUnitsModal.vue';
import useElectronAPI from '../../composables/useElectronAPI';

const api = useElectronAPI();
const router = useRouter();
const theme = inject('theme');
const isFullscreen = inject('isFullscreen');
const sharedState = inject('excelFileState'); // Access shared file state

// Accordion state
const expandedSections = ref({
  appearance: false,
  markup: true,  // Default Markup % expanded by default
  unitMappings: false,
  discoveredUnits: false,
  columnMappings: false,
  discoveredColumns: false
});

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

// Default Markup %
const defaultMarkupPercent = ref(null);

// Unit Mappings
const unitMappings = ref([]);
const discoveredUnits = ref([]);
const showDiscoveredUnitsModal = ref(false);

// Computed count of discovered units
const discoveredUnitsCount = computed(() => discoveredUnits.value.length);

const toggleTheme = async () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light';
  theme.value = newTheme;

  try {
    await api.preferencesStore.update('theme', newTheme);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
};

const saveDefaultMarkupPercent = async () => {
  try {
    // Convert empty string to null
    const value = defaultMarkupPercent.value === '' ? null : defaultMarkupPercent.value;
    await api.preferencesStore.update('defaultMarkupPercent', value);
    console.log('Default Markup % saved:', value);
  } catch (error) {
    console.error('Failed to save default markup percent:', error);
  }
};

const saveAndApplyDefaultMarkup = async () => {
  try {
    // Save the preference first
    const value = defaultMarkupPercent.value === '' ? null : defaultMarkupPercent.value;
    await api.preferencesStore.update('defaultMarkupPercent', value);
    console.log('[Preferences] Default Markup % saved:', value);

    // Navigate to Excel Grid tab first (route is /excel, not /)
    console.log('[Preferences] Navigating to Excel Grid tab...');
    await router.push('/excel');

    // Wait for navigation to complete and component to mount
    console.log('[Preferences] Waiting for Excel Grid to mount...');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Now dispatch the event after Excel Grid is mounted and ready
    console.log('[Preferences] Dispatching apply-default-markup event with value:', value);
    window.dispatchEvent(new CustomEvent('apply-default-markup', {
      detail: { defaultMarkupPercent: value }
    }));

    // Wait a bit more for the event to be processed
    await new Promise(resolve => setTimeout(resolve, 300));

    // Show success message
    console.log('[Preferences] Operation complete, showing alert');
    alert(`Default Markup % (${value}%) saved and applied to all items in the grid!`);
  } catch (error) {
    console.error('Failed to save and apply default markup percent:', error);
    alert(`Error saving markup: ${error.message}`);
  }
};

const loadDefaultMarkupPercent = async () => {
  try {
    const result = await api.preferencesStore.get();
    const prefs = result?.data || result || {};
    defaultMarkupPercent.value = prefs.defaultMarkupPercent !== undefined ? prefs.defaultMarkupPercent : null;
    console.log('[Preferences] Loaded default markup %:', defaultMarkupPercent.value);
  } catch (error) {
    console.error('Failed to load default markup percent:', error);
  }
};

// Load unit mappings
const loadUnitMappings = async () => {
  try {
    const result = await api.preferencesStore.getUnitMappings();
    if (result.success) {
      unitMappings.value = result.data || [];
    }
  } catch (error) {
    console.error('Failed to load unit mappings:', error);
  }
};

// Load discovered units
const loadDiscoveredUnits = async () => {
  try {
    const result = await api.preferencesStore.getDiscoveredUnits();
    if (result.success) {
      discoveredUnits.value = (result.data || []).map(d => ({
        ...d,
        selectedZzType: ''
      }));
    }
  } catch (error) {
    console.error('Failed to load discovered units:', error);
  }
};

// Update a unit mapping
const updateUnitMapping = async (unit, zzType, active) => {
  try {
    await api.preferencesStore.saveUnitMapping(unit, zzType, active);
  } catch (error) {
    console.error('Failed to update unit mapping:', error);
  }
};

// Delete a unit mapping
const deleteUnitMapping = async (unit) => {
  try {
    await api.preferencesStore.deleteUnitMapping(unit);
    await loadUnitMappings();
  } catch (error) {
    console.error('Failed to delete unit mapping:', error);
  }
};

// Modal functions
const openDiscoveredUnitsModal = () => {
  showDiscoveredUnitsModal.value = true;
};

const closeDiscoveredUnitsModal = () => {
  showDiscoveredUnitsModal.value = false;
};

const handleDiscoveredUnitsUpdated = async () => {
  await loadUnitMappings();
  await loadDiscoveredUnits();
};

// Refresh functions
const refreshUnitMappings = async () => {
  await loadUnitMappings();
};

// Refresh discovered units by re-scanning current file
const refreshDiscoveredUnits = async () => {
  try {
    // Get the currently open file from shared state
    const currentFile = sharedState?.value?.currentFile;

    console.log('[Preferences] Current file from shared state:', currentFile);

    if (!currentFile) {
      alert('No file is currently open. Please open an Excel file first.');
      return;
    }

    // Re-scan the file for units
    console.log('[Preferences] Re-scanning file for units:', currentFile);
    const result = await api.excel.rescanUnits(currentFile);

    if (result.success) {
      console.log('[Preferences] Re-scan complete. Units discovered:', result.discoveredUnits?.length || 0);

      // Reload discovered units list to reflect changes
      await loadDiscoveredUnits();

      alert(`Refresh complete! Found ${result.discoveredUnits?.length || 0} unique units in the first sheet.`);
    } else {
      alert(`Failed to refresh units: ${result.message}`);
    }
  } catch (error) {
    console.error('Failed to refresh discovered units:', error);
    alert(`Error refreshing units: ${error.message}`);
  }
};

// ============================================================================
// Column Mappings
// ============================================================================

const columnMappings = ref({ preferredColumns: [] });
const discoveredColumns = ref([]);
const showAddCustomColumnModal = ref(false);
const newColumnLabel = ref('');
const availableExcelColumns = ref([]);

// Computed sorted columns
const sortedColumns = computed(() => {
  if (!columnMappings.value.preferredColumns) return [];
  return [...columnMappings.value.preferredColumns].sort((a, b) => a.order - b.order);
});

// Load column mappings
const loadColumnMappings = async () => {
  try {
    const result = await api.preferencesStore.getColumnMappings();
    if (result.success) {
      columnMappings.value = result.data || { preferredColumns: [] };
    }
  } catch (error) {
    console.error('Failed to load column mappings:', error);
  }
};

// Load discovered columns
const loadDiscoveredColumns = async () => {
  try {
    const result = await api.preferencesStore.getDiscoveredColumns();
    if (result.success) {
      discoveredColumns.value = result.data || [];

      // Update available Excel columns list
      const mappedColumns = new Set(
        columnMappings.value.preferredColumns
          .filter(c => c.excelColumn)
          .map(c => c.excelColumn)
      );

      const allColumns = [
        ...discoveredColumns.value.map(d => d.columnName),
        ...Array.from(mappedColumns)
      ];

      availableExcelColumns.value = [...new Set(allColumns)].sort();
    }
  } catch (error) {
    console.error('Failed to load discovered columns:', error);
  }
};

// Update column mapping
const updateColumnMapping = async (columnId, updates) => {
  try {
    await api.preferencesStore.updatePreferredColumn(columnId, updates);
    await loadColumnMappings();
    await loadDiscoveredColumns();
  } catch (error) {
    console.error('Failed to update column mapping:', error);
  }
};

// Add custom column
const addCustomColumn = async () => {
  if (!newColumnLabel.value.trim()) return;

  try {
    const result = await api.preferencesStore.addCustomColumn(newColumnLabel.value.trim(), null);
    if (result.success) {
      newColumnLabel.value = '';
      showAddCustomColumnModal.value = false;
      await loadColumnMappings();
    }
  } catch (error) {
    console.error('Failed to add custom column:', error);
  }
};

// Delete column
const deleteColumn = async (columnId) => {
  try {
    await api.preferencesStore.deleteCustomColumn(columnId);
    await loadColumnMappings();
  } catch (error) {
    console.error('Failed to delete column:', error);
  }
};

// Move column up
const moveColumnUp = async (index) => {
  if (index === 0) return;

  const columns = [...sortedColumns.value];
  const currentColumn = columns[index];
  const previousColumn = columns[index - 1];

  // Swap order values
  const tempOrder = currentColumn.order;
  currentColumn.order = previousColumn.order;
  previousColumn.order = tempOrder;

  try {
    // Update both columns
    await api.preferencesStore.updatePreferredColumn(currentColumn.id, { order: currentColumn.order });
    await api.preferencesStore.updatePreferredColumn(previousColumn.id, { order: previousColumn.order });
    await loadColumnMappings();
  } catch (error) {
    console.error('Failed to move column up:', error);
  }
};

// Move column down
const moveColumnDown = async (index) => {
  const columns = sortedColumns.value;
  if (index === columns.length - 1) return;

  const currentColumn = columns[index];
  const nextColumn = columns[index + 1];

  // Swap order values
  const tempOrder = currentColumn.order;
  currentColumn.order = nextColumn.order;
  nextColumn.order = tempOrder;

  try {
    // Update both columns
    await api.preferencesStore.updatePreferredColumn(currentColumn.id, { order: currentColumn.order });
    await api.preferencesStore.updatePreferredColumn(nextColumn.id, { order: nextColumn.order });
    await loadColumnMappings();
  } catch (error) {
    console.error('Failed to move column down:', error);
  }
};

// Close add custom column modal
const closeAddCustomColumnModal = () => {
  showAddCustomColumnModal.value = false;
  newColumnLabel.value = '';
};

// Refresh column mappings
const refreshColumnMappings = async () => {
  await loadColumnMappings();
  await loadDiscoveredColumns();
};

// Reset column mappings to defaults
const resetColumnMappings = async () => {
  const confirmed = confirm('Are you sure you want to reset column mappings to defaults? This will remove all custom columns and mappings.');
  if (!confirmed) return;

  try {
    await api.preferencesStore.resetColumnMappings();
    await loadColumnMappings();
    await loadDiscoveredColumns();
  } catch (error) {
    console.error('Failed to reset column mappings:', error);
  }
};

// Save preferences and reload grid
const saveAndReloadGrid = async () => {
  try {
    console.log('[Preferences] Saving all preferences and reloading grid...');

    // Get current file from shared state
    const currentFile = sharedState?.value?.currentFile;

    if (!currentFile) {
      alert('No file is currently open. Please open an Excel file first.');
      return;
    }

    // NOTE: We do NOT reset global column mappings here - that would clear user's "Excel Column" selections
    // We only clear FILE-SPECIFIC visibility settings via the custom event below

    // Navigate to Excel Grid tab
    await router.push('/excel');

    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Dispatch event to force grid reload (will respect existing column mappings)
    window.dispatchEvent(new CustomEvent('force-grid-reload', {
      detail: { rescan: false } // Don't rescan - keep existing column mappings
    }));

    alert('Preferences applied! The grid will reload with updated settings.');
  } catch (error) {
    console.error('[Preferences] Error saving and reloading:', error);
    alert(`Error: ${error.message}`);
  }
};

// Load data on mount
onMounted(() => {
  console.log('[Preferences] Component mounted, loading preferences...');
  loadDefaultMarkupPercent();
  loadUnitMappings();
  loadDiscoveredUnits();
  loadColumnMappings();
  loadDiscoveredColumns();
});

// Reload data when component is activated (for keep-alive or when navigating back)
onActivated(() => {
  console.log('[Preferences] Component activated, reloading preferences...');
  loadDefaultMarkupPercent();
  loadUnitMappings();
  loadDiscoveredUnits();
});
</script>

<style scoped>
.preferences-tab {
  background-color: var(--bs-body-bg);
}

.fullscreen-header {
  background-color: var(--bs-body-bg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

/* Dark mode text visibility */
[data-theme="dark"] .preferences-tab h4,
[data-theme="dark"] .preferences-tab h5 {
  color: #e4e4e4;
}

[data-theme="dark"] .fullscreen-header {
  background-color: #2d2d2d;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

[data-theme="dark"] .fullscreen-header h5 {
  color: #e4e4e4;
}

[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
}

[data-theme="dark"] .text-info {
  color: #6fc3ff !important;
}

[data-theme="dark"] .form-check-label {
  color: #e4e4e4;
}

[data-theme="dark"] hr {
  border-color: #3e3e3e;
  opacity: 1;
}

/* Dark mode table styling */
[data-theme="dark"] .table {
  color: #e4e4e4;
}

[data-theme="dark"] .table thead th {
  color: #ffffff;
  border-color: #3e3e3e;
}

[data-theme="dark"] .table tbody td {
  color: #e4e4e4;
  border-color: #3e3e3e;
}

[data-theme="dark"] .form-select {
  background-color: #1e1e1e;
  color: #e4e4e4;
  border-color: #3e3e3e;
}

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

[data-theme="dark"] .badge.bg-light {
  background-color: #3e3e3e !important;
  color: #ffffff !important;
}

/* Dark mode for input groups */
[data-theme="dark"] .input-group-text {
  background-color: #1e1e1e;
  border-color: #3e3e3e;
  color: #e4e4e4;
}

[data-theme="dark"] .form-control {
  background-color: #1e1e1e;
  border-color: #3e3e3e;
  color: #e4e4e4;
}

[data-theme="dark"] .form-control:focus {
  background-color: #1e1e1e;
  border-color: #0d6efd;
  color: #e4e4e4;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

[data-theme="dark"] .form-control::placeholder {
  color: #6c757d;
}

/* Accordion styling */
.accordion-button {
  font-weight: 500;
}

.accordion-button:not(.collapsed) {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
  color: var(--bs-primary);
}

/* Dark mode accordion styling */
[data-theme="dark"] .accordion-item {
  background-color: #1e1e1e;
  border-color: #3e3e3e;
}

[data-theme="dark"] .accordion-button {
  background-color: #2d2d2d;
  color: #e4e4e4;
  border-color: #3e3e3e;
}

[data-theme="dark"] .accordion-button:not(.collapsed) {
  background-color: rgba(13, 110, 253, 0.2);
  color: #4da6ff;
  box-shadow: none;
}

[data-theme="dark"] .accordion-button:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

[data-theme="dark"] .accordion-button::after {
  filter: brightness(0) invert(1);
}

[data-theme="dark"] .accordion-body {
  background-color: #1e1e1e;
  color: #e4e4e4;
}

[data-theme="dark"] .badge.bg-primary {
  background-color: #0d6efd !important;
  color: #ffffff !important;
}
</style>
