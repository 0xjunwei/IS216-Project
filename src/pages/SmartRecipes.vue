<template>
  <div class="min-vh-100 bg-light content-under-nav">
    <!-- Header -->

    <div class="container py-4 pt-5">
      <div class="row g-4">
        <!-- Pantry Column -->
        <div class="col-12 col-lg-4">
          <div class="card surface-card glass-card shadow-sm border-0">
            <div class="card-body">
              <h5 class="card-title mb-3">Your Pantry</h5>
              <form @submit.prevent="addItem" class="row g-2 align-items-end">
                <div class="col-12">
                  <label class="form-label">Ingredient name</label>
                  <input v-model.trim="newItem.name" type="text" class="form-control" placeholder="e.g., chicken breast" required />
                </div>
                <div class="col-6">
                  <label class="form-label">Qty</label>
                  <input v-model.number="newItem.qty" type="number" min="1" class="form-control" placeholder="1" />
                </div>
                <div class="col-6">
                  <label class="form-label">Unit</label>
                  <input v-model.trim="newItem.unit" type="text" class="form-control" placeholder="pcs / g / ml" />
                </div>
                <div class="col-12">
                  <label class="form-label">Expiry date</label>
                  <input v-model="newItem.expiry" type="date" class="form-control" />
                </div>
                <div class="col-12 d-flex gap-2">
                  <button class="btn btn-glow" type="submit">Add to pantry</button>
                  <button v-if="user" class="btn btn-glow" type="button" @click="pullPantryFromFirebase">Retrieve Pantry</button>
                  <button class="btn btn-glass" type="button" @click="clearPantry" :disabled="!pantry.length">Clear</button>
                </div>
              </form>

              <hr />

              <div v-if="!pantry.length" class="text-muted small">No items yet. Add a few ingredients to get smart suggestions.</div>

              <ul v-else class="list-group list-group-flush">
                <li v-for="item in pantrySorted" :key="item.id" class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-semibold text-capitalize">{{ item.name }}</div>
                    <div class="small text-muted">
                      <span v-if="item.qty">{{ item.qty }} {{ item.unit }}</span>
                      <span v-if="item.expiry"> • Expires {{ formatRelative(item.expiry) }}</span>
                      <span v-else> • No expiry</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span v-if="isExpiringSoon(item)" class="badge bg-warning text-dark">expiring soon</span>
                    <button class="btn btn-sm btn-outline-danger" @click="removeItem(item.id)">Remove</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-3">
            <label class="form-label">Days considered "expiring soon"</label>
            <input type="range" class="form-range" min="1" max="14" v-model.number="expiringWindowDays" />
            <div class="small text-muted">{{ expiringWindowDays }} day(s)</div>
          </div>

          <div class="d-grid gap-2 mt-3">
            <button class="btn btn-glow" :disabled="!pantry.length || loading" @click="findRecipes">
              <span v-if="!loading">Find Recipes</span>
              <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <!-- Results Column -->
        <div class="col-12 col-lg-8">
          <div class="card surface-card glass-card shadow-sm border-0 p-4">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">Suggestions</h5>
                <div class="d-flex gap-2">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="zeroWasteOnly" v-model="zeroWasteOnly">
                    <label class="form-check-label" for="zeroWasteOnly">Zero‑waste only</label>
                  </div>
                </div>
              </div>

              <div v-if="!recipes.length && !loading" class="text-muted small">
                No recipes yet. Click <span class="fw-semibold">Find Recipes</span> to search based on your pantry.
              </div>

              <div v-if="error" class="alert alert-danger">{{ error }}</div>

              <div class="row g-3">
                <div v-for="recipe in filteredRecipes" :key="recipe.id" class="col-12">
                  <div class="card border-0 shadow-sm overflow-hidden">
                    <div class="row g-0">
                      <div class="col-12 col-sm-4">
                        <img :src="recipe.image" :alt="recipe.title" class="w-100 h-100 object-fit-cover" />
                      </div>
                      <div class="col-12 col-sm-8">
                        <div class="card-body">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <h5 class="card-title mb-0">{{ recipe.title }}</h5>
                        <span v-if="recipe.zeroWaste" class="badge bg-success">Zero‑waste</span>
                      </div>
                      <p class="card-text small text-muted mb-2">
                        Uses {{ recipe.usedIngredientCount }} pantry item(s), misses {{ recipe.missedIngredientCount }}.
                      </p>

                      <div class="d-flex flex-wrap gap-2 mb-2">
                        <span class="badge bg-secondary" v-if="recipe.readyInMinutes">⏱️ {{ recipe.readyInMinutes }} min</span>
                        <span class="badge bg-secondary" v-if="recipe.servings">🍽️ {{ recipe.servings }} servings</span>
                      </div>

                      <!-- Scores -->
                      <div class="row g-2 mb-2">
                        <div class="col-12 col-md-6">
                          <div class="p-2 rounded bg-light border">
                            <div class="small text-muted">Nutrition (per serving)</div>
                            <div class="fw-semibold">{{ displayNutrient(recipe, 'Calories') }} kcal • {{ displayNutrient(recipe, 'Protein') }} P • {{ displayNutrient(recipe, 'Carbohydrates') }} C • {{ displayNutrient(recipe, 'Fat') }} F</div>
                          </div>
                        </div>
                        <div class="col-12 col-md-6">
                          <div class="p-2 rounded bg-light border d-flex justify-content-between align-items-center">
                            <div>
                              <div class="small text-muted">Sustainability score</div>
                              <div class="fw-semibold">{{ recipe.sustainabilityScore }}/100</div>
                            </div>
                            <div class="progress flex-grow-1 ms-3" role="progressbar" :aria-valuenow="recipe.sustainabilityScore" aria-valuemin="0" aria-valuemax="100">
                              <div class="progress-bar" :style="{ width: recipe.sustainabilityScore + '%' }"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="d-flex gap-2">
                        <a :href="recipe.sourceUrl" target="_blank" rel="noopener" class="btn btn-primary btn-sm">View recipe</a>
                        <button class="btn btn-outline-secondary btn-sm" @click="toggleDetails(recipe)">
                          {{ recipe.showDetails ? 'Hide' : 'Show' }} details
                        </button>
                      </div>

                      <transition name="fade">
                        <div v-if="recipe.showDetails" class="mt-3 small">
                          <div class="mb-2"><span class="fw-semibold">Uses from pantry:</span> {{ listNames(recipe.usedIngredients) }}</div>
                          <div class="mb-2" v-if="recipe.expiringMatched.length"><span class="fw-semibold">Uses expiring soon:</span> {{ listNames(recipe.expiringMatched) }}</div>
                          <div class="mb-2" v-if="recipe.missedIngredients?.length"><span class="fw-semibold">Missing:</span> {{ listNames(recipe.missedIngredients) }}</div>
                          <div class="text-muted">ID: {{ recipe.id }}</div>
                        </div>
                      </transition>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="loading" class="d-flex justify-content-center py-5">
                <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { auth } from "../js/config.js";
import { onAuthStateChanged } from "firebase/auth";

// Check if user exists then show the retrieve button
const user = ref(auth.currentUser);
let unsub = null;
// Based on https://firebase.google.com/docs/auth/web/start#sign_in_existing_users
// Already in auth from config thus slight modification from the google version
onMounted(() => {
  unsub = onAuthStateChanged(auth, (uid) => {
    user.value = uid;
  });
});
// Incase to clear memory https://vuejs.org/api/composition-api-lifecycle
onUnmounted(() => {if (unsub) unsub()});


// Daily limit of 50 too low, have to find another service or pay for it, Estimate 2 queries per day
// May do key rotation but might get IP banned WIP / Get prof to enter his own API key for testing
// Use ENV file to protect key
const API_KEY = import.meta.env.VITE_SPOONACULAR_KEY

// Pantry state
let nextId = 1
const pantry = ref([])
const expiringWindowDays = ref(3)
const zeroWasteOnly = ref(false)

const newItem = ref({ name: '', qty: 1, unit: '', expiry: '' })

function addItem() {
  if (!newItem.value.name) return
  pantry.value.push({
    id: nextId++,
    name: newItem.value.name.toLowerCase(),
    qty: newItem.value.qty || 1,
    unit: newItem.value.unit || '',
    expiry: newItem.value.expiry || null,
  })
  newItem.value = { name: '', qty: 1, unit: '', expiry: '' }
}
function removeItem(id) {
  pantry.value = pantry.value.filter(i => i.id !== id)
}
function clearPantry() {
  pantry.value = []
}

const pantrySorted = computed(() => {
  return [...pantry.value].sort((a, b) => (a.expiry || '').localeCompare(b.expiry || ''))
})

function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  const now = new Date()
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}
function isExpiringSoon(item) {
  return daysUntil(item.expiry) <= expiringWindowDays.value
}
function formatRelative(dateStr) {
  if (!dateStr) return 'later'
  const d = daysUntil(dateStr)
  if (d === Infinity) return 'later'
  if (d < 0) return `${Math.abs(d)} day(s) ago`
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  return `in ${d} day(s)`
}

// Recipe search
const recipes = ref([])
const loading = ref(false)
const error = ref('')

const filteredRecipes = computed(() => {
  return zeroWasteOnly.value ? recipes.value.filter(r => r.zeroWaste) : recipes.value
})

function listNames(arr = []) {
  return arr.map(i => i.name).join(', ')
}
// ? to handle if the value is missing the dont throw an error, learnt from bootdev
function displayNutrient(recipe, name) {
  const n = recipe?.nutrition?.nutrients?.find(n => n.name === name)
  if (!n) return '—'
  // Calories often uses unit 'kcal'; others g.
  const value = Math.round(n.amount)
  const unit = n.unit?.toLowerCase() === 'kcal' ? '' : n.unit
  return unit ? `${value}${unit}` : `${value}`
}

// heuristic calc
function computeSustainabilityScore(recipe, pantryItems, expiringSoonSet) {
  // Heuristic (0–100):
  // 50 pts: % of ingredients that are from pantry
  // 30 pts: uses expiring‑soon items (proportional to count)
  // 20 pts: fewer missing ingredients
  const total = (recipe.usedIngredients?.length || 0) + (recipe.missedIngredients?.length || 0)
  const pantryUsageRatio = total ? (recipe.usedIngredients?.length || 0) / total : 0

  const expiringMatches = (recipe.usedIngredients || []).filter(i => expiringSoonSet.has(i.name?.toLowerCase()))
  const expiringRatio = pantryItems.length ? expiringMatches.length / pantryItems.length : 0

  const missingPenalty = total ? 1 - ((recipe.missedIngredients?.length || 0) / total) : 1

  let score = Math.round(50 * pantryUsageRatio + 30 * expiringRatio + 20 * missingPenalty)
  score = Math.max(0, Math.min(100, score))
  return { score, expiringMatches }
}

async function findRecipes() {
  error.value = ''
  recipes.value = []
  if (!API_KEY) {
    error.value = 'Missing API key. Please pass it'
    return
  }
  if (!pantry.value.length) return

  loading.value = true
  try {
    // Use findByIngredients to get matches + used/missed ingredient breakdown
    const ingredientList = pantry.value.map(i => encodeURIComponent(i.name)).join(',')
    const res = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientList}&number=12&ranking=1&ignorePantry=false&apiKey=${API_KEY}`)
    if (!res.ok && res.status == 402) {
      throw new Error(`API Limit reached, change key / contact team`);
    } else if (!res.ok) {
      console.log(typeof(res.status));
      throw new Error(`findByIngredients failed: ${res.status}`);
    }
    const base = await res.json()

    // build a quick set for expiring‑soon items
    const expiringSoonSet = new Set(
      pantry.value.filter(isExpiringSoon).map(i => i.name.toLowerCase())
    )

    // for each recipe, fetch detailed info + nutrition
    const details = await Promise.all(
      base.map(async (r) => {
        const infoRes = await fetch(`https://api.spoonacular.com/recipes/${r.id}/information?includeNutrition=true&apiKey=${API_KEY}`)
        if (!infoRes.ok && infoRes.status == 402) {
          throw new Error(`API Key exhuasted`); 
        }
        else if (!infoRes.ok) {
          throw new Error(`information failed for ${infoRes.status}`)
        }
        const info = await infoRes.json()

        // Merge fields from base (has used/missed) with info (has nutrition)
        const usedIngredients = (r.usedIngredients || []).map(x => ({ name: x.name, amount: x.amount, unit: x.unit }))
        const missedIngredients = (r.missedIngredients || []).map(x => ({ name: x.name, amount: x.amount, unit: x.unit }))

        const { score, expiringMatches } = computeSustainabilityScore(
          { ...r, usedIngredients, missedIngredients },
          pantry.value,
          expiringSoonSet
        )
        
        const zeroWaste = expiringMatches.length >= Math.max(1, Math.floor(pantry.value.filter(isExpiringSoon).length * 0.3))

        return {
          id: r.id,
          title: info.title,
          image: info.image,
          sourceUrl: info.sourceUrl,
          readyInMinutes: info.readyInMinutes,
          servings: info.servings,
          usedIngredients,
          missedIngredients,
          usedIngredientCount: r.usedIngredientCount,
          missedIngredientCount: r.missedIngredientCount,
          nutrition: info.nutrition, // includes nutrients array
          sustainabilityScore: score,
          expiringMatched: expiringMatches,
          zeroWaste,
          showDetails: false,
        }
      })
    )

    // Sort: zero‑waste first, then higher sustainability, then fewer missing
    recipes.value = details
      .sort((a, b) => (b.zeroWaste - a.zeroWaste) || (b.sustainabilityScore - a.sustainabilityScore) || (a.missedIngredientCount - b.missedIngredientCount))
  } catch (e) {
    error.value = e.message || 'Failed to fetch recipes.'
  } finally {
    loading.value = false
  }
}

function toggleDetails(recipe) {
  recipe.showDetails = !recipe.showDetails
}
</script>

<style scoped>
/* Animated gradient background + glows (glassmorphism vibe) */
.min-vh-100 {
  background: linear-gradient(135deg, #1b1b1b, #111018) !important;
  color: #f5f5f5 !important;
  font-family: "Inter", "Segoe UI", sans-serif;
  position: relative;
  overflow: hidden;
}
.min-vh-100::before,
.min-vh-100::after {
  content: "";
  position: absolute;
  inset: -20% -10% auto -10%;
  height: 60%;
  background:
    radial-gradient(60% 60% at 20% 30%, rgba(102, 126, 234, 0.22) 0%, rgba(0,0,0,0) 70%),
    radial-gradient(50% 50% at 80% 20%, rgba(118, 75, 162, 0.18) 0%, rgba(0,0,0,0) 70%);
  filter: blur(60px);
  pointer-events: none;
  animation: floatGlow 18s ease-in-out infinite alternate;
}
.min-vh-100::after {
  inset: auto -10% -30% -10%;
  height: 70%;
  background:
    radial-gradient(50% 50% at 80% 80%, rgba(46, 204, 113, 0.16) 0%, rgba(0,0,0,0) 70%),
    radial-gradient(60% 60% at 10% 90%, rgba(0, 184, 148, 0.18) 0%, rgba(0,0,0,0) 70%);
}
@keyframes floatGlow {
  0% { transform: translateY(0) }
  100% { transform: translateY(10px) }
}

/* Push page content below the fixed navbar without moving the background layers at <body> level */
.content-under-nav {
  padding-top: 88px;
}
@media (min-width: 992px) {
  .content-under-nav { padding-top: 5em; }
}

/* Override Bootstrap light backgrounds */
.bg-light {
  background: #1e1e1e !important;
  color: #f5f5f5 !important;
}

.card {
  background: #1e1e1e !important;
  color: #f5f5f5 !important;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}



/* List items */
.list-group-item {
  background: #1e1e1e !important;
  color: #ddd !important;
  border-color: #2a2a2a !important;
}

/* Forms */
.form-label {
  color: #ccc !important;
}

.form-control {
  background: #2a2a2a !important;
  color: #ffffff !important; /* main text */
  font-weight: 500;
}

/* Placeholder styling */
.form-control::placeholder {
  color: #bbbbbb !important; /* lighter grey */
  opacity: 1; /* ensure it’s visible */
}

/* Input on focus */
.form-control:focus {
  background: #333 !important;
  color: #ffffff !important;
  border-color: #00cec9 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 201, 0.25);
}

/* Buttons */
.btn {
  border-radius: 8px;
  font-weight: 600;
}
.btn-primary {
  background: linear-gradient(90deg, #00b894, #00cec9);
  border: none;
}
.btn-primary:hover {
  background: linear-gradient(90deg, #00cec9, #00b894);
}
.btn-success {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  border: none;
}
.btn-success:hover {
  background: linear-gradient(90deg, #2ecc71, #27ae60);
}
.btn-outline-secondary {
  border-color: #888;
  color: #ddd;
}
.btn-outline-secondary:hover {
  background: #444;
  color: #fff;
}

/* Progress bar */
.progress {
  background: #2a2a2a !important;
}
.progress-bar {
  background: linear-gradient(90deg, #6c5ce7, #00cec9) !important;
}

/* Switch and muted text */
.form-check-label {
  color: #ccc !important;
}
.text-muted {
  color: #aaa !important;
}

/* Nutrition + sustainability boxes */
.border {
  border-color: #333 !important;
}

/* Translucent surface used for the two main sections */
.surface-card {
  background: rgba(30,30,30,0.7) !important;
  backdrop-filter: saturate(140%) blur(12px);
  -webkit-backdrop-filter: saturate(140%) blur(12px);
  border: 1px solid rgba(255,255,255,0.06) !important;
  box-shadow: 0 14px 40px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset !important;
}

/* Glass accents for buttons/cards per provided mock */
.btn-glow {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}
.btn-glow::before {
  content: "";
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  transition: left .6s ease;
}
.btn-glow:hover::before { left: 100%; }
.btn-glow:hover { filter: brightness(1.05); box-shadow: 0 10px 25px rgba(102,126,234,.35); }

.btn-glass {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  border-radius: 12px;
}

.btn-glass:hover { background: rgba(255, 136, 90, 0.894); }

</style>
