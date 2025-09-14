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
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <input v-model="loginForm.email" type="email" class="form-control" placeholder="Email" required />
              </div>
              <div class="mb-3">
                <input v-model="loginForm.password" type="password" class="form-control" placeholder="Password" required />
              </div>
              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
            <div class="text-center mt-3">
              <div id="google-btn"></div>
            </div>
            <p class="text-center text-muted mt-3">
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
            <form @submit.prevent="handleRegister">
              <div class="mb-3">
                <input v-model="registerForm.email" type="email" class="form-control" placeholder="Email" required />
              </div>
              <div class="mb-3">
                <input v-model="registerForm.password" type="password" class="form-control" placeholder="Password" required />
              </div>
              <div class="mb-3">
                <input v-model="registerForm.confirmPassword" type="password" class="form-control" placeholder="Confirm Password" required />
              </div>
              <button type="submit" class="btn btn-success w-100">Register</button>
            </form>
            <p class="text-center text-muted mt-3">
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
import { ref, nextTick, onMounted  } from 'vue'

const isRegister = ref(false)
const animateTitle = ref(true) // animates on first load

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

// Trigger animation, delayed to sync with flip duration (0.6s)
const triggerAnimation = async () => {
  animateTitle.value = false
  await nextTick()
  setTimeout(() => {
    animateTitle.value = true
  }, 600) // match the .flip-card transition time
}

const flipCard = async () => {
  isRegister.value = !isRegister.value
  triggerAnimation()

  if (!isRegister.value) {
    await nextTick()   // wait for DOM update
    renderGoogleButton()
  }
}

const handleLogin = () => {
  alert(`Logging in with: ${loginForm.value.email}`)
}

const handleRegister = () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('Passwords do not match!')
    return
  }
  alert(`Registering with: ${registerForm.value.email}`)
  flipCard()
}

const handleCredentialResponse = (response) => {
  console.log("Google Credential:", response.credential)
  alert("Signed in with Google successfully!")
  // TODO: send token to backend
}

const renderGoogleButton = () => {
  const btn = document.getElementById("google-btn")
  if (btn && btn.childElementCount === 0) { // avoid duplicates
    window.google?.accounts.id.renderButton(btn, {
      theme: "outline",
      size: "large",
      width: "100%"
    })
  }
}

onMounted(async () => {
  await loadGoogleScript()

  window.google?.accounts.id.initialize({
    // will fill in the client_id on my client side dont wish to leak
    client_id: "xxx.apps.googleusercontent.com",
    callback: handleCredentialResponse
  })

  renderGoogleButton()
})

const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (window.google && window.google.accounts) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = resolve
    document.head.appendChild(script)
  })
}
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
  -webkit-animation: tracking-in-expand 0.7s cubic-bezier(0.215,0.610,0.355,1.000) both;
  animation: tracking-in-expand 0.7s cubic-bezier(0.215,0.610,0.355,1.000) both;
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

@media (max-width: 400px) {
  .bg-dark::before,
  .bg-dark::after {
    opacity: 0.4;  /* softer glow on tiny screens */
  }
}



</style>
