<template>
  <div v-if="isVisible" class="modal-backdrop" @click.self="close">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Column Manager</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <div class="column-picker-help">
            <p class="text-muted mb-3">
              <i class="bi bi-info-circle"></i>
              Drag to reorder, toggle visibility, and map columns to standard fields.
            </p>
          </div>

          <div class="column-list">
            <div
              v-for="(col, index) in localColumns"
              :key="col.field"
              class="column-item"
              :class="{ 'column-hidden': !col.visible }"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragover.prevent="handleDragOver(index)"
              @drop="handleDrop(index)"
            >
              <div class="column-drag-handle">
                <i class="bi bi-grip-vertical"></i>
              </div>

              <div class="column-info">
                <div class="column-header">
                  <strong>{{ col.headerName }}</strong>
                  <span class="text-muted ms-2">({{ col.field }})</span>
                </div>
                <div class="column-mapping" v-if="col.mappedTo">
                  <i class="bi bi-arrow-right-short"></i>
                  <span class="badge bg-primary">{{ col.mappedTo }}</span>
                </div>
              </div>

              <div class="column-actions">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="'col-visible-' + index"
                    v-model="col.visible"
                  />
                  <label class="form-check-label" :for="'col-visible-' + index">
                    {{ col.visible ? 'Visible' : 'Hidden' }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="column-actions-footer mt-3">
            <button class="btn btn-sm btn-outline-secondary" @click="showAll">
              <i class="bi bi-eye"></i> Show All
            </button>
            <button class="btn btn-sm btn-outline-secondary" @click="hideAll">
              <i class="bi bi-eye-slash"></i> Hide All
            </button>
            <button class="btn btn-sm btn-outline-secondary" @click="resetOrder">
              <i class="bi bi-arrow-counterclockwise"></i> Reset Order
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
          <button type="button" class="btn btn-primary" @click="applyChanges">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  columns: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'apply']);

const isVisible = ref(props.visible);
const localColumns = ref([]);
const draggedIndex = ref(null);

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal;
  if (newVal) {
    // Clone columns when opening
    localColumns.value = props.columns.map((col, index) => ({
      field: col.field,
      headerName: col.headerName,
      visible: !col.hide,
      order: index,
      mappedTo: col.mappedTo || null
    }));
  }
});

// Drag and drop handlers
const handleDragStart = (index) => {
  draggedIndex.value = index;
};

const handleDragOver = (index) => {
  // Allow drop
};

const handleDrop = (dropIndex) => {
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) return;

  const draggedItem = localColumns.value[draggedIndex.value];
  localColumns.value.splice(draggedIndex.value, 1);
  localColumns.value.splice(dropIndex, 0, draggedItem);

  draggedIndex.value = null;
};

const showAll = () => {
  localColumns.value.forEach(col => col.visible = true);
};

const hideAll = () => {
  localColumns.value.forEach(col => col.visible = false);
};

const resetOrder = () => {
  localColumns.value.sort((a, b) => a.order - b.order);
};

const close = () => {
  emit('close');
};

const applyChanges = () => {
  emit('apply', localColumns.value);
  close();
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
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
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.column-picker-help {
  margin-bottom: 1rem;
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s;
}

.column-item:hover {
  background: var(--bs-secondary-bg);
  border-color: var(--bs-primary);
}

.column-item.column-hidden {
  opacity: 0.5;
}

.column-drag-handle {
  color: var(--bs-secondary-color);
  font-size: 1.2rem;
  cursor: grab;
}

.column-drag-handle:active {
  cursor: grabbing;
}

.column-info {
  flex: 1;
}

.column-header {
  font-size: 0.95rem;
}

.column-mapping {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.85rem;
}

.column-actions {
  display: flex;
  align-items: center;
}

.form-check-label {
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.column-actions-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bs-border-color);
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
}

.btn:hover {
  background: var(--bs-tertiary-bg);
}

.btn-primary {
  background: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
}

.btn-primary:hover {
  background: var(--bs-primary-border-subtle);
}

.btn-secondary {
  background: var(--bs-secondary);
  color: white;
  border-color: var(--bs-secondary);
}
</style>
