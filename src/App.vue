<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-dark">
    <div class="card-wrapper">
      <div class="flip-card" :class="{ 'is-flipped': isRegister }">
        
        <!-- Login Card -->
        <div class="flip-card-front card shadow-lg border-0">
          <div class="card-body p-4">
            <h3 class="text-center mb-4 text-primary">Login</h3>
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <input v-model="loginForm.email" type="email" class="form-control" placeholder="Email" required />
              </div>
              <div class="mb-3">
                <input v-model="loginForm.password" type="password" class="form-control" placeholder="Password" required />
              </div>
              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
            <p class="text-center text-muted mt-3">
              Don’t have an account? 
              <a href="#" @click.prevent="flipCard" class="text-decoration-none">Register</a>
            </p>
          </div>
        </div>

        <!-- Register Card -->
        <div class="flip-card-back card shadow-lg border-0">
          <div class="card-body p-4">
            <h3 class="text-center mb-4 text-success">Register</h3>
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
import { ref } from 'vue'

const isRegister = ref(false)

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

const flipCard = () => {
  isRegister.value = !isRegister.value
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
</script>

<style scoped>
.card-wrapper {
  perspective: 1000px;
  width: 350px;
  height: 420px;
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
</style>
