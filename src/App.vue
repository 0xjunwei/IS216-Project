<template>
  <ErrorBoundary>
    <div>
      <!-- Login/Register Screen -->
      <div
        v-if="!isLoggedIn"
        class="d-flex justify-content-center align-items-center min-vh-100 bg-dark"
      >
        <div class="card-wrapper">
          <div class="flip-card" :class="{ 'is-flipped': isRegister }">
            <!-- Login Card -->
            <div class="flip-card-front card shadow-lg border-0">
              <div class="card-body p-4">
                <h3
                  class="text-center mb-4 text-primary"
                  :class="{ 'tracking-in-expand': animateTitle && !isRegister }"
                >
                  Login
                </h3>
                <form @submit.prevent="handleLogin">
                  <div class="mb-3">
                    <input
                      v-model="loginForm.email"
                      type="email"
                      class="form-control"
                      :class="{ 'is-invalid': loginErrors.email }"
                      placeholder="Email"
                      required
                      :disabled="isLoading"
                    />
                    <div v-if="loginErrors.email" class="invalid-feedback">
                      {{ loginErrors.email }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <input
                      v-model="loginForm.password"
                      type="password"
                      class="form-control"
                      :class="{ 'is-invalid': loginErrors.password }"
                      placeholder="Password"
                      required
                      :disabled="isLoading"
                    />
                    <div v-if="loginErrors.password" class="invalid-feedback">
                      {{ loginErrors.password }}
                    </div>
                  </div>
                  <button
                    type="submit"
                    class="btn btn-primary w-100"
                    :disabled="isLoading"
                  >
                    <span
                      v-if="isLoading"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {{ isLoading ? "Logging in..." : "Login" }}
                  </button>
                </form>
                <div v-if="isGoogleOAuthEnabled" class="text-center mt-3">
                  <div id="google-btn"></div>
                </div>
                <p class="text-center text-muted mt-3">
                  Don't have an account?
                  <a
                    href="#"
                    @click.prevent="flipCard"
                    class="text-decoration-none"
                    >Register</a
                  >
                </p>
              </div>
            </div>

            <!-- Register Card -->
            <div class="flip-card-back card shadow-lg border-0">
              <div class="card-body p-4">
                <h3
                  class="text-center mb-4 text-success"
                  :class="{ 'tracking-in-expand': animateTitle && isRegister }"
                >
                  Register
                </h3>
                <form @submit.prevent="handleRegister">
                  <div class="mb-3">
                    <input
                      v-model="registerForm.email"
                      type="email"
                      class="form-control"
                      :class="{ 'is-invalid': registerErrors.email }"
                      placeholder="Email"
                      required
                      :disabled="isLoading"
                    />
                    <div v-if="registerErrors.email" class="invalid-feedback">
                      {{ registerErrors.email }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <input
                      v-model="registerForm.password"
                      type="password"
                      class="form-control"
                      :class="{ 'is-invalid': registerErrors.password }"
                      placeholder="Password"
                      required
                      :disabled="isLoading"
                    />
                    <div
                      v-if="registerErrors.password"
                      class="invalid-feedback"
                    >
                      {{ registerErrors.password }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <input
                      v-model="registerForm.confirmPassword"
                      type="password"
                      class="form-control"
                      :class="{ 'is-invalid': registerErrors.confirmPassword }"
                      placeholder="Confirm Password"
                      required
                      :disabled="isLoading"
                    />
                    <div
                      v-if="registerErrors.confirmPassword"
                      class="invalid-feedback"
                    >
                      {{ registerErrors.confirmPassword }}
                    </div>
                  </div>
                  <button
                    type="submit"
                    class="btn btn-success w-100"
                    :disabled="isLoading"
                  >
                    <span
                      v-if="isLoading"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {{ isLoading ? "Registering..." : "Register" }}
                  </button>
                </form>
                <p class="text-center text-muted mt-3">
                  Already have an account?
                  <a
                    href="#"
                    @click.prevent="flipCard"
                    class="text-decoration-none"
                    >Login</a
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main App Screen -->
      <div v-else>
        <Navigation
          :current-page="currentPage"
          :user-email="userEmail"
          @navigate="handleNavigation"
          @logout="handleLogout"
        />

        <div class="main-content">
          <!-- Meal Planner Page -->
          <ErrorBoundary v-if="currentPage === 'meal-planner'">
            <MealPlanner />
          </ErrorBoundary>

          <!-- Placeholder for other pages -->
          <div v-else class="container-fluid py-5">
            <div class="row justify-content-center">
              <div class="col-lg-8">
                <div class="card shadow-lg border-0">
                  <div class="card-body text-center py-5">
                    <i class="fas fa-construction fa-3x text-muted mb-3"></i>
                    <h3 class="text-muted">{{ getPageTitle() }} Coming Soon</h3>
                    <p class="text-muted">This feature is under development.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading Spinner -->
    <LoadingSpinner 
      :is-loading="isLoading" 
      :message="loadingMessage" 
    />
  </ErrorBoundary>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from "vue";
import Navigation from "./components/Navigation.vue";
import MealPlanner from "./components/MealPlanner.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import { useValidation } from "./composables/useValidation.js";
import { storageService } from "./services/storage.js";
import { errorHandler } from "./services/errorHandler.js";

// Initialize validation
const { getEmailError, getPasswordError, getConfirmPasswordError } =
  useValidation();

// Authentication state
const isLoggedIn = ref(false);
const userEmail = ref("");
const currentPage = ref("meal-planner");

const isRegister = ref(false);
const animateTitle = ref(true); // animates on first load

// Form data
const loginForm = ref({
  email: "",
  password: "",
});

const registerForm = ref({
  email: "",
  password: "",
  confirmPassword: "",
});

// Error states
const loginErrors = ref({
  email: null,
  password: null,
});

const registerErrors = ref({
  email: null,
  password: null,
  confirmPassword: null,
});

// Loading states
const isLoading = ref(false);
const loadingMessage = ref('');

// Google OAuth state
const isGoogleOAuthEnabled = computed(() => {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID && 
         import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here';
});

// Trigger animation, delayed to sync with flip duration (0.6s)
const triggerAnimation = async () => {
  animateTitle.value = false;
  await nextTick();
  setTimeout(() => {
    animateTitle.value = true;
  }, 600); // match the .flip-card transition time
};

const flipCard = async () => {
  isRegister.value = !isRegister.value;
  triggerAnimation();

  if (!isRegister.value) {
    await nextTick(); // wait for DOM update
    renderGoogleButton();
  }
};

const handleLogin = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Signing you in...';

    // Clear previous errors
    loginErrors.value = { email: null, password: null };

    // Validate inputs
    const emailError = getEmailError(loginForm.value.email);
    const passwordError = getPasswordError(loginForm.value.password);

    if (emailError || passwordError) {
      loginErrors.value = { email: emailError, password: passwordError };
      errorHandler.handleValidationError(loginErrors.value);
      return;
    }

    // Simulate API call (replace with actual authentication)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save authentication state
    const authData = {
      email: loginForm.value.email,
      loginTime: new Date().toISOString(),
    };

    const authSaved = storageService.saveAuthState(authData);
    if (!authSaved) {
      throw new Error("Failed to save authentication state");
    }

    // Update UI state
    userEmail.value = loginForm.value.email;
    isLoggedIn.value = true;
    currentPage.value = "meal-planner";

    // Show success message
    errorHandler.showSuccess("Login successful! Welcome back.");
  } catch (error) {
    errorHandler.logError(error, "handleLogin");
    errorHandler.showError(errorHandler.handleApiError(error));
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const handleRegister = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Creating your account...';

    // Clear previous errors
    registerErrors.value = {
      email: null,
      password: null,
      confirmPassword: null,
    };

    // Validate inputs
    const emailError = getEmailError(registerForm.value.email);
    const passwordError = getPasswordError(registerForm.value.password);
    const confirmPasswordError = getConfirmPasswordError(
      registerForm.value.password,
      registerForm.value.confirmPassword,
    );

    if (emailError || passwordError || confirmPasswordError) {
      registerErrors.value = {
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      };
      errorHandler.handleValidationError(registerErrors.value);
      return;
    }

    // Simulate API call (replace with actual registration)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save authentication state
    const authData = {
      email: registerForm.value.email,
      loginTime: new Date().toISOString(),
    };

    const authSaved = storageService.saveAuthState(authData);
    if (!authSaved) {
      throw new Error("Failed to save authentication state");
    }

    // Update UI state
    userEmail.value = registerForm.value.email;
    isLoggedIn.value = true;
    currentPage.value = "meal-planner";

    // Show success message
    errorHandler.showSuccess("Registration successful! Welcome to EcoEats.");
  } catch (error) {
    errorHandler.logError(error, "handleRegister");
    errorHandler.showError(errorHandler.handleApiError(error));
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const handleCredentialResponse = async () => {
  try {
    isLoading.value = true;

    // In a real app, you would verify the credential with your backend
    // For now, we'll simulate a successful login

    // Save authentication state
    const authData = {
      email: "google.user@example.com",
      loginTime: new Date().toISOString(),
      provider: "google",
    };

    const authSaved = storageService.saveAuthState(authData);
    if (!authSaved) {
      throw new Error("Failed to save authentication state");
    }

    userEmail.value = "google.user@example.com";
    isLoggedIn.value = true;
    currentPage.value = "meal-planner";

    errorHandler.showSuccess("Google login successful! Welcome to EcoEats.");
  } catch (error) {
    errorHandler.logError(error, "handleCredentialResponse");
    errorHandler.showError(errorHandler.handleApiError(error));
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const handleNavigation = (page) => {
  currentPage.value = page;
};

const handleLogout = () => {
  try {
    // Clear authentication state
    storageService.clearAuthState();

    // Reset UI state
    isLoggedIn.value = false;
    currentPage.value = "meal-planner";
    userEmail.value = "";

    // Clear forms
    loginForm.value = { email: "", password: "" };
    registerForm.value = { email: "", password: "", confirmPassword: "" };

    // Clear errors
    loginErrors.value = { email: null, password: null };
    registerErrors.value = {
      email: null,
      password: null,
      confirmPassword: null,
    };

    // Show success message
    errorHandler.showSuccess("You have been logged out successfully.");
  } catch (error) {
    errorHandler.logError(error, "handleLogout");
    errorHandler.showError(
      "Failed to logout properly. Please refresh the page.",
    );
  }
};

const getPageTitle = () => {
  const titles = {
    pantry: "My Pantry",
    recipes: "Recipes",
    analytics: "Analytics",
    profile: "Profile",
    settings: "Settings",
  };
  return titles[currentPage.value] || "Page";
};

const renderGoogleButton = () => {
  const btn = document.getElementById("google-btn");
  if (btn && btn.childElementCount === 0) {
    // avoid duplicates
    window.google?.accounts.id.renderButton(btn, {
      theme: "outline",
      size: "large",
      width: "100%",
    });
  }
};

// Environment validation
const validateEnvironment = () => {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    console.warn("VITE_GOOGLE_CLIENT_ID is not properly configured - Google OAuth will be disabled");
    // Don't block the app, just disable Google OAuth
    return true;
  }
  return true;
};

onMounted(async () => {
  try {
    // Validate environment
    if (!validateEnvironment()) {
      return;
    }

    // Load saved authentication state
    const savedAuth = storageService.loadAuthState();
    if (savedAuth) {
      isLoggedIn.value = true;
      userEmail.value = savedAuth.email;
      currentPage.value = "meal-planner";
    }

    // Load Google script
    await loadGoogleScript();

    // Initialize Google OAuth only if client ID is properly configured
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      renderGoogleButton();
    } else {
      console.warn("Google OAuth disabled - client ID not configured");
    }
  } catch (error) {
    errorHandler.logError(error, "onMounted");
    errorHandler.showError(
      "Failed to initialize application. Please refresh the page.",
    );
  }
});

const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};
</script>

<style scoped>
#google-btn {
  display: flex;
  justify-content: center;
}
/* Animista tracking-in-expand */
@-webkit-keyframes tracking-in-expand {
  0% {
    letter-spacing: -0.5em;
    opacity: 0;
  }
  40% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
@keyframes tracking-in-expand {
  0% {
    letter-spacing: -0.5em;
    opacity: 0;
  }
  40% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.tracking-in-expand {
  -webkit-animation: tracking-in-expand 0.7s cubic-bezier(0.215, 0.61, 0.355, 1)
    both;
  animation: tracking-in-expand 0.7s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

/* Card flip styles */
.card-wrapper {
  perspective: 1000px;
  width: clamp(320px, 28vw, 420px);
  height: clamp(380px, 40vh, 500px);
}

.flip-card {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
}

.flip-card-front {
  background-color: #fff;
}

.flip-card-back {
  background-color: #fff;
  transform: rotateY(180deg);
}

.bg-dark {
  background: #0f2027;
  position: relative;
  overflow: hidden;
}

.bg-dark::before,
.bg-dark::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.6;
}

.bg-dark::before {
  width: 40vw;
  height: 40vw;
  background: #21d4fd;
  top: -10vw;
  left: -10vw;
}

.bg-dark::after {
  width: 50vw;
  height: 50vw;
  background: #b21f1f;
  bottom: -15vw;
  right: -15vw;
}

@media (max-width: 400px) {
  .bg-dark::before,
  .bg-dark::after {
    opacity: 0.4; /* softer glow on tiny screens */
  }
}

/* Main content styling */
.main-content {
  padding-top: 80px; /* Account for fixed navbar */
  min-height: 100vh;
}

/* Font Awesome icons */
.fas,
.far,
.fab {
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
}

.fas:before {
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
}
</style>
