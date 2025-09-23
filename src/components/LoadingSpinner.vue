<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div v-if="message" class="loading-message mt-3">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'normal', // 'small', 'normal', 'large'
    validator: (value) => ['small', 'normal', 'large'].includes(value),
  },
  overlay: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.loading-message {
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.3rem;
}

/* Size variations */
.loading-spinner.small .spinner-border {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 0.2rem;
}

.loading-spinner.large .spinner-border {
  width: 4rem;
  height: 4rem;
  border-width: 0.4rem;
}

.loading-spinner.small .loading-message {
  font-size: 0.8rem;
}

.loading-spinner.large .loading-message {
  font-size: 1rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .loading-spinner {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .spinner-border {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .loading-message {
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .loading-spinner {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .spinner-border {
    width: 2rem;
    height: 2rem;
  }
  
  .loading-message {
    font-size: 0.8rem;
  }
}

/* Animation for better UX */
.loading-overlay {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
