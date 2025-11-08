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
            <i class="bi bi-inbox me-2"></i>
            Discovered Units
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <p class="text-muted small mb-3">
            {{ discoveredUnits.length }} unit(s) found in the Excel file. Configure their default zzType mappings below.
          </p>

          <!-- Discovered Units List -->
          <div v-if="discoveredUnits.length > 0" class="list-group">
            <div
              v-for="(discovered, index) in discoveredUnits"
              :key="discovered.unit"
              class="list-group-item"
            >
              <div class="row align-items-center g-2">
                <div class="col-4">
                  <strong>{{ discovered.unit }}</strong>
                  <span class="text-muted ms-2 small">
                    ({{ discovered.count }}x)
                  </span>
                </div>
                <div class="col-5">
                  <select
                    v-model="discovered.selectedZzType"
                    class="form-select form-select-sm"
                  >
                    <option value="">Select zzType...</option>
                    <option value="area">Area</option>
                    <option value="linear">Linear</option>
                    <option value="segment">Segment</option>
                    <option value="count">Count</option>
                  </select>
                </div>
                <div class="col-3 text-end">
                  <button
                    @click="acceptUnit(discovered.unit, discovered.selectedZzType, index)"
                    class="btn btn-sm btn-success me-1"
                    :disabled="!discovered.selectedZzType"
                    title="Add to unit mappings"
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button
                    @click="rejectUnit(discovered.unit, index)"
                    class="btn btn-sm btn-outline-danger"
                    title="Ignore this unit"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="alert alert-success mb-0">
            <i class="bi bi-check-circle me-2"></i>
            All units have been configured!
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="close"
          >
            Close
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="acceptAllWithDefaults"
            :disabled="discoveredUnits.length === 0"
          >
            <i class="bi bi-check-all me-1"></i>
            Accept All as Count
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div v-if="isOpen" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, watch } from 'vue';
import useElectronAPI from '../../composables/useElectronAPI';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'updated']);

const api = useElectronAPI();
const discoveredUnits = ref([]);
const currentFilePath = ref(null);

// Load discovered units and current file path when modal opens
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await loadCurrentFilePath();
    await loadDiscoveredUnits();
  }
});

// Load current file path from preferences
const loadCurrentFilePath = async () => {
  try {
    const prefsResult = await api.preferencesStore.get();
    if (prefsResult.success) {
      currentFilePath.value = prefsResult.data.lastOpenedFile || null;
    }
  } catch (error) {
    console.error('Failed to load current file path:', error);
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

// Accept a single unit
const acceptUnit = async (unit, zzType, index) => {
  if (!zzType) return;

  try {
    // Save as file-specific mapping if we have a file path, otherwise save as global
    if (currentFilePath.value) {
      await api.preferencesStore.addFileUnitMapping(currentFilePath.value, unit, zzType, true);
    } else {
      await api.preferencesStore.saveUnitMapping(unit, zzType, true);
    }
    await api.preferencesStore.removeDiscoveredUnit(unit);

    // Remove from local array
    discoveredUnits.value.splice(index, 1);

    emit('updated');
  } catch (error) {
    console.error('Failed to accept unit:', error);
  }
};

// Reject a single unit
const rejectUnit = async (unit, index) => {
  try {
    await api.preferencesStore.removeDiscoveredUnit(unit);

    // Remove from local array
    discoveredUnits.value.splice(index, 1);

    emit('updated');
  } catch (error) {
    console.error('Failed to reject unit:', error);
  }
};

// Accept all units with 'count' as default
const acceptAllWithDefaults = async () => {
  try {
    for (const discovered of discoveredUnits.value) {
      // Save as file-specific mapping if we have a file path, otherwise save as global
      if (currentFilePath.value) {
        await api.preferencesStore.addFileUnitMapping(currentFilePath.value, discovered.unit, 'count', true);
      } else {
        await api.preferencesStore.saveUnitMapping(discovered.unit, 'count', true);
      }
      await api.preferencesStore.removeDiscoveredUnit(discovered.unit);
    }

    discoveredUnits.value = [];
    emit('updated');

    // Close modal after accepting all
    setTimeout(() => {
      close();
    }, 500);
  } catch (error) {
    console.error('Failed to accept all units:', error);
  }
};

// Close modal
const close = () => {
  emit('close');
};
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

[data-theme="dark"] .modal-title {
  color: #e4e4e4;
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

[data-theme="dark"] .list-group-item {
  background-color: #2d2d2d;
  color: #e4e4e4;
  border-color: #3e3e3e;
}

[data-theme="dark"] .list-group-item strong {
  color: #ffffff;
}

[data-theme="dark"] .text-muted {
  color: #adb5bd !important;
}

[data-theme="dark"] .btn-close {
  filter: invert(1);
}

[data-theme="dark"] .alert-success {
  background-color: #1e4620;
  color: #d1e7dd;
  border-color: #2d5c31;
}
</style>
