<template>
  <button
    @click="handleClick"
    :class="buttonClass"
    :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
  >
    <i class="bi" :class="isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></i>
    <span v-if="showText" class="ms-2">{{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}</span>
  </button>
</template>

<script setup>
import { inject } from 'vue';

// Props
const props = defineProps({
  buttonClass: {
    type: String,
    default: 'btn btn-sm btn-outline-primary'
  },
  showText: {
    type: Boolean,
    default: false
  }
});

// Inject fullscreen state and functions from App.vue
const isFullscreen = inject('isFullscreen');
const toggleFullscreen = inject('toggleFullscreen');

const handleClick = () => {
  if (toggleFullscreen) {
    toggleFullscreen();
  }
};
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
