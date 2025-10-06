<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-dark">
    <div class="card-wrapper">
      <div class="flip-card" :class="{ 'is-flipped': isRegister }">
        
        <!-- Login Card -->
        <div class="flip-card-front card shadow-lg border-0">
          <div class="card-body p-4">
            <h3 
              class="text-center mb-4 text-primary"
              :class="{ 'tracking-in-expand': animateTitle && !isRegister }">
              Login
            </h3>
            <form @submit.prevent="handleLogin" class="auth-form">
              <div class="mb-3">
                <input v-model="loginForm.email" type="email" class="form-control" placeholder="Email" required />
              </div>
              <div class="mb-3">
                <input v-model="loginForm.password" type="password" class="form-control" placeholder="Password" required />
              </div>
              <button type="submit" class="btn btn-primary w-100">Login</button>
              <div class="feedback-slot">
                <div v-if="loginError" class="alert alert-danger alert-compact mb-0" role="alert">
                  {{ loginError }}
                </div>
              </div>
            </form>
          
            <p class="text-center text-muted mt-auto">
              Don’t have an account? 
              <a href="#" @click.prevent="flipCard" class="text-decoration-none">Register</a>
            </p>
          </div>
        </div>

        <!-- Register Card -->
        <div class="flip-card-back card shadow-lg border-0"> 
          <div class="card-body p-4">
            <h3 
              class="text-center mb-4 text-success"
              :class="{ 'tracking-in-expand': animateTitle && isRegister }">
              Register
            </h3>
            <form @submit.prevent="handleRegister" class="auth-form">
              <div class="mb-3">
                <input v-model="registerForm.email" type="email" class="form-control" placeholder="Email" required />
              </div>
              <div class="mb-3">
                <input v-model="registerForm.password" type="password" class="form-control" placeholder="Password" required />
              </div>
              <div class="mb-3">
                <input v-model="registerForm.confirmPassword" type="password" class="form-control" placeholder="Confirm Password" required />
                <small v-if="passwordsFilled && !passwordsMatch" class="text-danger">Passwords do not match.</small>
              </div>
              <button type="submit" class="btn btn-success w-100" :disabled="!passwordsMatch || registering">
                <span v-if="!registering">Register</span>
                <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </button>
              <div class="feedback-slot">
                <div v-if="registerError" class="alert alert-danger alert-compact mb-0" role="alert">
                  {{ registerError }}
                </div>
              </div>
            </form>
            
            <p class="text-center text-muted mt-auto">
              Already have an account? 
              <a href="#" @click.prevent="flipCard" class="text-decoration-none">Login</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

const router = useRouter();

const isRegister = ref(false);
const animateTitle = ref(true);


const loginForm = ref({ email: "", password: "" });
const registerForm = ref({ email: "", password: "", confirmPassword: "" });


const loggingIn = ref(false);
const registering = ref(false);
const sendingReset = ref(false);

const loginError = ref("");
const registerError = ref("");
const resetInfo = ref("");

const triggerAnimation = async () => {
  animateTitle.value = false;
  await nextTick();
  setTimeout(() => (animateTitle.value = true), 600);
};

const flipCard = async () => {
  isRegister.value = !isRegister.value;
  loginError.value = "";
  registerError.value = "";
  resetInfo.value = "";
  triggerAnimation();
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
    // Needs a landing page will modify and make one for now send to the only page i have i guess
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
  sendingReset.value = true;
  try {
    await sendPasswordResetEmail(auth, email);
    resetInfo.value = "Password reset email sent. Please check your inbox.";
  } catch (e) {
    loginError.value = mapAuthError(e);
  } finally {
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
  -webkit-animation: tracking-in-expand 0.7s cubic-bezier(0.215,0.610,0.355,1.000) both;
  animation: tracking-in-expand 0.7s cubic-bezier(0.215,0.610,0.355,1.000) both;
}

/* Error message */
.feedback-slot{
  min-height: 48px;         
  margin-top: .75rem; 
}

/* smaller alert so it doesn’t push content */
.alert-compact{
  padding: .5rem .75rem;
  font-size: .875rem;
  border-radius: .5rem;
}


/* Card flip styles */
.card-wrapper{
  width: clamp(320px, 48vw, 500px);
  height: clamp(480px, 32vh, 600px);
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

.flip-card-front .card-body,
.flip-card-back .card-body{
  height: 100%;
  display: flex;
  flex-direction: column;
}


.auth-form{
  flex: 1 1 auto;
  overflow-y: auto;
}
/*
.bg-dark {
  background: #0f2027;
  position: relative;
  overflow: hidden;
}

.bg-dark::before,
.bg-dark::after {
  content: '';
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
  
@media (max-width: 420px){
  .card-wrapper{
    width: 92vw;
    height: min(80vh, 600px);
  }
  .alert-compact{ font-size: .82rem; padding: .45rem .65rem; }
}*/




</style>
