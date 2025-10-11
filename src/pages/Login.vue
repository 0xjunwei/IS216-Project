<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center px-3" style="background: linear-gradient(to bottom, #f0fdf4, #ffffff);">
    <div class="card w-100" style="max-width: 400px;">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <div class="bg-success p-3 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 64px; height: 64px;">
            <i class="bi bi-leaf-fill text-white" style="font-size: 2rem;"></i>
          </div>
          <h1 class="h3 fw-bold text-success mb-2">Welcome to FoodSaver</h1>
          <p class="text-muted">{{ isRegister ? 'Create your account' : 'Sign in to start reducing food waste' }}</p>
        </div>

        <form v-if="!isRegister" @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              v-model="loginForm.email"
              type="email"
              class="form-control"
              id="email"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div class="mb-4">
            <label for="password" class="form-label">Password</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="form-control"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <div class="text-center mb-3">
            <button
              type="button"
              class="btn btn-link text-decoration-none small p-0"
              @click="forgotPassword"
              :disabled="sendingReset || !!resetInfo"
            >
              <span v-if="!sendingReset && !resetInfo">Forgot password?</span>
              <span v-if="resetInfo" class="text-success">Reset link sent</span>
            </button>
          </div>

          <div v-if="loginError" class="alert alert-danger" role="alert">
            {{ loginError }}
          </div>
          <div v-if="resetInfo" class="alert alert-success" role="alert">
            {{ resetInfo }}
          </div>

          <button 
            type="submit" 
            class="btn btn-success w-100"
          >
            Sign In
          </button>
        </form>

        <form v-else @submit.prevent="handleRegister">
          <div class="mb-3">
            <label for="register-email" class="form-label">Email</label>
            <input
              v-model="registerForm.email"
              type="email"
              class="form-control"
              id="register-email"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div class="mb-3">
            <label for="register-password" class="form-label">Password</label>
            <input
              v-model="registerForm.password"
              type="password"
              class="form-control"
              id="register-password"
              placeholder="Enter your password"
              required
            />
          </div>

          <div class="mb-4">
            <label for="confirm-password" class="form-label">Confirm Password</label>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              class="form-control"
              id="confirm-password"
              placeholder="Confirm your password"
              required
            />
            <small v-if="passwordsFilled && !passwordsMatch" class="text-danger">Passwords do not match.</small>
          </div>

          <div v-if="registerError" class="alert alert-danger" role="alert">
            {{ registerError }}
          </div>

          <button 
            type="submit" 
            class="btn btn-success w-100"
            :disabled="!passwordsMatch || registering"
          >
            <span v-if="!registering">Create Account</span>
            <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </button>
        </form>

        <div class="text-center mt-4">
          <p class="small text-muted">
            <span v-if="!isRegister">
              Don't have an account? 
              <a href="#" @click.prevent="flipCard" class="text-success text-decoration-none fw-medium">
                Sign up here
              </a>
            </span>
            <span v-else>
              Already have an account? 
              <a href="#" @click.prevent="flipCard" class="text-success text-decoration-none fw-medium">
                Sign in
              </a>
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../js/config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";


// If user is logged in should redirect away else weird


const router = useRouter();

const isRegister = ref(false);

const loginForm = ref({ email: "", password: "" });
const registerForm = ref({ email: "", password: "", confirmPassword: "" });

const loggingIn = ref(false);
const registering = ref(false);
const sendingReset = ref(false);

const loginError = ref("");
const registerError = ref("");
const resetInfo = ref("");
let unsubscribe = null;

onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      router.replace({ name: "SmartRecipes" });
    }
  });
});
onUnmounted(() => {
    if (unsubscribe) unsubscribe();
});

const flipCard = () => {
  isRegister.value = !isRegister.value;
  loginError.value = "";
  registerError.value = "";
  resetInfo.value = "";
};

const passwordsFilled = computed(() =>
  !!registerForm.value.password && !!registerForm.value.confirmPassword
);

const passwordsMatch = computed(() =>
  passwordsFilled.value &&
  registerForm.value.password === registerForm.value.confirmPassword
);

const matchClass = computed(() => {
  if (!passwordsFilled.value) return "";
  return passwordsMatch.value ? "is-valid glow-valid" : "is-invalid glow-invalid";
});

async function handleLogin() {
  loginError.value = "";
  resetInfo.value = "";
  loggingIn.value = true;
  try {
    await signInWithEmailAndPassword(auth, loginForm.value.email, loginForm.value.password);
    // Needs a landing page will modify and make one for now send to the only page i have i guess
    router.push({ name: "SmartRecipes" });
  } catch (e) {
    loginError.value = mapAuthError(e);
  } finally {
    loggingIn.value = false;
  }
}

async function handleRegister() {
  registerError.value = "";
  if (!passwordsMatch.value) {
    registerError.value = "Passwords do not match.";
    return;
  }
  registering.value = true;
  try {
    await createUserWithEmailAndPassword(auth, registerForm.value.email, registerForm.value.password);
    // Auto logins from registration
    router.push({ name: "SmartRecipes" });
  } catch (e) {
    registerError.value = mapAuthError(e);
  } finally {
    registering.value = false;
  }
}

async function forgotPassword() {
  loginError.value = "";
  resetInfo.value = "";

  const email = (loginForm.value.email || "").trim();

  if (!email) {
    loginError.value = 'Enter your email above, then click "Forgot password?".';
    return;
  }

  // prevent spam
  if (sendingReset.value) return;

  sendingReset.value = true;

  try {
    await sendPasswordResetEmail(auth, email);
    resetInfo.value = "A password reset link has been sent to your email.";
    
    // timeout the button
    setTimeout(() => {
      sendingReset.value = false;
      resetInfo.value = "";
    }, 30000); // 30 seconds cooldown
  } catch (e) {
    loginError.value = mapAuthError(e);
    sendingReset.value = false;
  }
}


function mapAuthError(err) {
  const code = err?.code || "";
  const M = {
    "auth/invalid-credential": "Invalid email or password.",
    "auth/user-not-found": "No account found for this email.",
    "auth/wrong-password": "Wrong password.",
    "auth/email-already-in-use": "Email already in use.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return M[code] || "Something went wrong. Please try again.";
}
</script>


<style scoped>
.card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}
</style>
