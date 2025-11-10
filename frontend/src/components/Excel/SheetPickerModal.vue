<template>
  <div v-if="isVisible" class="modal-backdrop" @click.self="close">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-file-earmark-spreadsheet"></i>
            Select Sheet to Open
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <div class="sheet-picker-help">
            <p class="text-muted mb-3">
              <i class="bi bi-info-circle"></i>
              This Excel file contains multiple sheets. Please select which sheet you'd like to work with.
            </p>
          </div>

          <!-- Show hidden sheets toggle -->
          <div class="form-check mb-3" v-if="hasHiddenSheets">
            <input
              class="form-check-input"
              type="checkbox"
              id="show-hidden-sheets"
              v-model="showHiddenSheets"
            />
            <label class="form-check-label" for="show-hidden-sheets">
              Show hidden sheets
            </label>
          </div>

          <!-- Sheet list -->
          <div class="sheet-list">
            <div
              v-for="sheet in visibleSheets"
              :key="sheet.name"
              class="sheet-item"
              :class="{
                'sheet-selected': selectedSheet?.name === sheet.name,
                'sheet-hidden': sheet.hidden
              }"
              @click="selectSheet(sheet)"
            >
              <div class="sheet-info">
                <div class="sheet-header">
                  <i class="bi bi-file-spreadsheet me-2"></i>
                  <strong>{{ sheet.name }}</strong>
                  <span v-if="sheet.hidden" class="badge bg-secondary ms-2">Hidden</span>
                </div>
                <div class="sheet-meta text-muted">
                  {{ sheet.rowCount }} rows
                </div>
              </div>

              <div class="sheet-actions">
                <i v-if="selectedSheet?.name === sheet.name" class="bi bi-check-circle-fill text-primary"></i>
                <i v-else class="bi bi-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmSelection"
            :disabled="!selectedSheet"
          >
            <i class="bi bi-check-lg"></i>
            Open Sheet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  sheets: {
    type: Array,
    required: true,
    // Each sheet: { name, rowCount, hidden }
  }
});

const emit = defineEmits(['close', 'select']);

const isVisible = ref(props.visible);
const selectedSheet = ref(null);
const showHiddenSheets = ref(false);

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal;
  if (newVal) {
    // Auto-select first visible sheet when opening
    const firstVisible = props.sheets.find(s => !s.hidden);
    selectedSheet.value = firstVisible || props.sheets[0] || null;
  } else {
    // Reset selection when closing
    selectedSheet.value = null;
    showHiddenSheets.value = false;
  }
});

// Computed properties
const hasHiddenSheets = computed(() => {
  return props.sheets.some(s => s.hidden);
});

const visibleSheets = computed(() => {
  if (showHiddenSheets.value) {
    return props.sheets;
  }
  return props.sheets.filter(s => !s.hidden);
});

// Methods
const selectSheet = (sheet) => {
  selectedSheet.value = sheet;
};

const close = () => {
  emit('close');
};

const confirmSelection = () => {
  if (selectedSheet.value) {
    emit('select', selectedSheet.value);
    close();
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-dialog {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  background: var(--bs-body-bg);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  border: 1px solid var(--bs-border-color);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--bs-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
  color: var(--bs-body-color);
}

.btn-close:hover {
  opacity: 1;
}

.btn-close::before {
  content: '×';
  font-size: 2rem;
  line-height: 1;
  color: var(--bs-body-color);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.sheet-picker-help {
  margin-bottom: 1rem;
}

.sheet-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sheet-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bs-tertiary-bg);
  border: 2px solid var(--bs-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.sheet-item:hover {
  background: var(--bs-secondary-bg);
  border-color: var(--bs-primary);
}

.sheet-item.sheet-selected {
  background: var(--bs-primary-bg-subtle);
  border-color: var(--bs-primary);
}

.sheet-item.sheet-hidden {
  opacity: 0.7;
}

.sheet-info {
  flex: 1;
}

.sheet-header {
  display: flex;
  align-items: center;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.sheet-meta {
  font-size: 0.85rem;
  margin-left: 1.75rem;
  color: var(--bs-secondary-color);
}

.text-muted {
  color: var(--bs-secondary-color) !important;
}

.sheet-actions {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
}

.sheet-actions i {
  transition: color 0.2s;
}

.form-check {
  padding-left: 0;
}

.form-check-input {
  margin-right: 0.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--bs-border-color);
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover:not(:disabled) {
  background: var(--bs-tertiary-bg);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--bs-primary-border-subtle);
}

.btn-secondary {
  background: var(--bs-secondary);
  color: white;
  border-color: var(--bs-secondary);
}

.btn-secondary:hover {
  opacity: 0.9;
}

.badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
}

.bg-secondary {
  background-color: var(--bs-secondary) !important;
  color: white !important;
}

/* Icon colors for dark mode */
.bi {
  color: var(--bs-body-color);
}

.text-primary .bi,
.bi.text-primary {
  color: var(--bs-primary) !important;
}
</style>
