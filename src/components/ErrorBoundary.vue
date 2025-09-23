<template>
  <div v-if="hasError" class="error-boundary">
    <div class="container-fluid py-5">
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card shadow-lg border-0">
            <div class="card-body text-center py-5">
              <div class="error-icon mb-4">
                <i class="fas fa-exclamation-triangle fa-4x text-warning"></i>
              </div>
              <h3 class="text-danger mb-3">Oops! Something went wrong</h3>
              <p class="text-muted mb-4">
                We encountered an unexpected error. Don't worry, your data is
                safe.
              </p>

              <!-- Error details (only in development) -->
              <div
                v-if="showDetails && errorDetails"
                class="alert alert-light text-start mb-4"
              >
                <h6 class="text-danger">Error Details:</h6>
                <pre class="small text-muted mb-0">{{ errorDetails }}</pre>
              </div>

              <!-- Action buttons -->
              <div class="d-flex gap-3 justify-content-center">
                <button @click="retry" class="btn btn-primary">
                  <i class="fas fa-redo me-2"></i>Try Again
                </button>
                <button @click="goHome" class="btn btn-outline-secondary">
                  <i class="fas fa-home me-2"></i>Go Home
                </button>
                <button
                  v-if="!showDetails"
                  @click="toggleDetails"
                  class="btn btn-outline-info"
                >
                  <i class="fas fa-bug me-2"></i>Show Details
                </button>
              </div>

              <!-- Additional help -->
              <div class="mt-4">
                <small class="text-muted">
                  If this problem persists, please
                  <a href="#" @click="reportError" class="text-decoration-none"
                    >report the error</a
                  >
                  or contact support.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured, computed, watch } from "vue";
import { errorHandler } from "@/services/errorHandler.js";

// Props
const props = defineProps({
  fallback: {
    type: String,
    default: "Something went wrong. Please try again.",
  },
  showErrorDetails: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["error", "retry"]);

// Reactive state
const hasError = ref(false);
const errorMessage = ref("");
const errorStack = ref("");
const showDetails = ref(props.showErrorDetails);

// Computed
const errorDetails = computed(() => {
  if (!errorMessage.value && !errorStack.value) return null;
  return `Message: ${errorMessage.value}\n\nStack: ${errorStack.value}`;
});

// Error capture
onErrorCaptured((error, instance, info) => {
  hasError.value = true;
  errorMessage.value = error.message;
  errorStack.value = error.stack;

  // Log error for debugging
  errorHandler.logError(error, "ErrorBoundary", {
    componentInfo: info,
    instance: instance?.$options.name || "Unknown",
  });

  // Emit error event for parent components
  emit("error", {
    error,
    message: error.message,
    stack: error.stack,
    info,
  });

  // Don't propagate the error further
  return false;
});

// Methods
const retry = () => {
  hasError.value = false;
  errorMessage.value = "";
  errorStack.value = "";
  showDetails.value = props.showErrorDetails;

  // Emit retry event
  emit("retry");
};

const goHome = () => {
  // Reset error state
  retry();

  // Navigate to home (you might want to use a router here)
  window.location.href = "/";
};

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const reportError = () => {
  // Create error report
  const errorReport = {
    message: errorMessage.value,
    stack: errorStack.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  // In a real application, you would send this to your error reporting service
  console.log("Error Report:", errorReport);

  // For now, just show a success message
  errorHandler.showSuccess(
    "Error report generated. Thank you for your feedback!",
  );
};

// Watch for prop changes
watch(
  () => props.showErrorDetails,
  (newValue) => {
    showDetails.value = newValue;
  },
);
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.error-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.card {
  border-radius: 16px;
  overflow: hidden;
}

.btn {
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.alert {
  border-radius: 8px;
  border: none;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>
