<template>
  <div class="btn-group position-relative" role="group">
    <button
      @click="goBackToLastTab"
      class="btn btn-sm btn-warning"
      title="Back to Last Tab"
    >
      <i class="bi bi-arrow-left-circle me-1"></i>
      Back to {{ lastTabLabel }}
    </button>
    <button
      type="button"
      class="btn btn-sm btn-warning dropdown-toggle dropdown-toggle-split"
      @click="toggleDropdown"
      title="Select Tab"
    >
      <span class="visually-hidden">Select Tab</span>
    </button>
    <ul class="dropdown-menu" :class="{ 'show': showDropdown }">
      <li v-for="tab in availableTabs" :key="tab.path">
        <a
          class="dropdown-item"
          href="#"
          @click.prevent="selectTab(tab)"
          :class="{ 'active': lastVisitedTabFromParent?.value === tab.path }"
        >
          <i :class="tab.icon" class="me-2"></i>
          {{ tab.label }}
        </a>
      </li>
      <li><hr class="dropdown-divider"></li>
      <li>
        <a
          class="dropdown-item text-danger"
          href="#"
          @click.prevent="exitFullscreenMode"
        >
          <i class="bi bi-fullscreen-exit me-2"></i>
          Exit Fullscreen
        </a>
      </li>
    </ul>
  </div>

  <!-- Backdrop to close dropdown when clicking outside -->
  <div
    v-if="showDropdown"
    class="dropdown-backdrop"
    @click="closeDropdown"
  ></div>
</template>

<script setup>
import { ref, inject, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Inject from App.vue
const isFullscreen = inject('isFullscreen');
const exitFullscreen = inject('exitFullscreen');
const lastVisitedTabFromParent = inject('lastVisitedTab');

// Dropdown state
const showDropdown = ref(false);

// Tab navigation data
const availableTabs = [
  { path: '/excel', label: 'Excel Grid', icon: 'bi bi-grid-3x3-gap' },
  { path: '/recents', label: 'Recents', icon: 'bi bi-clock-history' },
  { path: '/history', label: 'History', icon: 'bi bi-clock' },
  { path: '/zztakeoff-web', label: 'zzTakeoff', icon: 'bi bi-globe' },
  { path: '/templates', label: 'Templates', icon: 'bi bi-folder' },
  { path: '/preferences', label: 'Preferences', icon: 'bi bi-gear' }
];

// Computed label for the "Back to" button
const lastTabLabel = computed(() => {
  if (!lastVisitedTabFromParent || !lastVisitedTabFromParent.value) {
    return 'Excel Grid';
  }
  const tab = availableTabs.find(t => t.path === lastVisitedTabFromParent.value);
  return tab ? tab.label : 'Excel Grid';
});

// Toggle dropdown
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

// Close dropdown
const closeDropdown = () => {
  showDropdown.value = false;
};

// Navigate back to the last visited tab
const goBackToLastTab = () => {
  closeDropdown();
  const targetPath = lastVisitedTabFromParent?.value || '/excel';
  router.push(targetPath);
};

// Select a specific tab from dropdown
const selectTab = (tab) => {
  closeDropdown();
  router.push(tab.path);
};

// Exit fullscreen mode
const exitFullscreenMode = () => {
  closeDropdown();
  if (exitFullscreen) {
    exitFullscreen();
  }
};
</script>

<style scoped>
.dropdown-menu {
  min-width: 200px;
}

.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: transparent;
}

.btn-group {
  z-index: 1000;
}

.dropdown-menu.show {
  z-index: 1001;
}

/* Dark mode styles */
[data-theme="dark"] .dropdown-menu {
  background-color: #2d2d2d;
  border-color: #3e3e3e;
}

[data-theme="dark"] .dropdown-item {
  color: #e4e4e4;
}

[data-theme="dark"] .dropdown-item:hover {
  background-color: #3e3e3e;
  color: #ffffff;
}

[data-theme="dark"] .dropdown-item.active {
  background-color: #0d6efd;
  color: #ffffff;
}

[data-theme="dark"] .dropdown-divider {
  border-color: #3e3e3e;
}
</style>
