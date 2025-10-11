<template>
  <div class="container-fluid px-3 py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10 col-xl-8">
        <div class="mb-4">
          <h1 class="h3 fw-bold mb-2">Recipe Suggestions</h1>
          <p class="text-muted">Discover delicious recipes using what you already have.</p>
        </div>

        <!-- Select Your Ingredients Card -->
        <div class="card shadow-sm mb-4">
          <div class="card-body p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4">
              <div class="flex-grow-1 me-3">
                <h2 class="h5 fw-semibold mb-1">Select Your Ingredients</h2>
                <p class="text-muted small">Add ingredients manually or import from your pantry.</p>
              </div>
              <button 
                v-if="user"
                @click="retrievePantry"
                class="btn btn-success btn-sm mt-2 mt-md-0"
              >
                <i class="bi bi-cart me-2"></i>
                Import from Pantry
              </button>
            </div>

            <!-- Add Custom Ingredients -->
            <div class="add-ingredient-wrapper mb-4">
              <input
                v-model="customIngredient"
                type="text"
                class="form-control"
                placeholder="e.g., Garlic, Onions, Pasta..."
                @keyup.enter="addCustomIngredient"
              />
              <button 
                @click="addCustomIngredient"
                class="btn btn-success add-btn"
                type="button"
                :disabled="!customIngredient.trim()"
              >
                +
              </button>
            </div>

            <!-- Selected Ingredients Display -->
            <div v-if="selectedIngredients.length === 0" class="text-center py-5">
              <i class="bi bi-cart text-muted" style="font-size: 4rem;"></i>
              <p class="text-muted mt-3">No ingredients selected. Add custom ingredients or import from your pantry.</p>
            </div>
            <div v-else class="d-flex flex-wrap gap-2">
              <span
                v-for="ingredient in selectedIngredients"
                :key="ingredient.id"
                :class="[
                  'badge ingredient-badge d-inline-flex align-items-center',
                  isExpired(ingredient) ? 'bg-danger-subtle text-danger-emphasis' : 
                  isExpiringSoon(ingredient) ? 'bg-warning-subtle text-warning-emphasis' : 
                  'bg-success-subtle text-success-emphasis'
                ]"
                @click="openExpiryModal(ingredient)"
                :title="ingredient.expiry ? (isExpired(ingredient) ? `Expired: ${ingredient.expiry}` : `Expires: ${ingredient.expiry}`) : 'Click to set expiry date'"
              >
                <i v-if="isExpired(ingredient)" class="bi bi-x-circle me-1"></i>
                <i v-else-if="isExpiringSoon(ingredient)" class="bi bi-clock-history me-1"></i>
                {{ ingredient.name }}
                <button 
                  class="btn-remove"
                  @click.stop="removeIngredient(ingredient.id)"
                  title="Remove ingredient"
                >
                  ×
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- Expiry Date Modal -->
        <div v-if="showExpiryModal" class="modal-overlay" @click="closeExpiryModal">
          <div class="modal-content" @click.stop>
            <h5 class="mb-3">Set Expiry Date for {{ editingIngredient?.name }}</h5>
            <div class="mb-3">
              <label class="form-label">Expiry Date</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="tempExpiryDate"
                :min="getTodayDate()"
              />
            </div>
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-secondary" @click="closeExpiryModal">Cancel</button>
              <button class="btn btn-danger" @click="clearExpiryDate" v-if="editingIngredient?.expiry">Clear Date</button>
              <button class="btn btn-success" @click="saveExpiryDate">Save</button>
            </div>
          </div>
        </div>

        <!-- Ready to Find Recipes Card -->
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <div class="text-center mb-4">
              <i class="bi bi-egg-fried text-muted mb-3" style="font-size: 4rem;"></i>
              <h2 class="h5 fw-semibold mb-2">Ready to Find Recipes?</h2>
              <p class="text-muted mb-0">
                Select ingredients from your pantry or add custom ingredients, then click 'Find Recipes' to discover delicious meals you can make.
              </p>
            </div>

            <!-- Filter Options -->
            <div class="d-flex flex-wrap gap-3 justify-content-center mb-4">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="zeroWasteOnly" v-model="zeroWasteOnly">
                <label class="form-check-label" for="zeroWasteOnly">
                  <i class="bi bi-recycle me-1"></i>
                  Zero-waste only
                </label>
              </div>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="prioritizeExpiring" v-model="prioritizeExpiring">
                <label class="form-check-label" for="prioritizeExpiring">
                  <i class="bi bi-clock-history me-1"></i>
                  Prioritize expiring soon
                </label>
              </div>
            </div>

            <div class="d-flex gap-2 justify-content-center flex-wrap">
              <button 
                @click="findRecipes"
                :disabled="selectedIngredients.length === 0 || loading"
                class="btn btn-success"
              >
                <span v-if="!loading">Find Recipes</span>
                <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </button>
              <button 
                @click="clearPantry"
                :disabled="selectedIngredients.length === 0"
                class="btn btn-outline-secondary"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="alert alert-danger mt-4">{{ error }}</div>

        <!-- Recipe Results -->
        <div v-if="recipes.length > 0" class="mt-4">
          <h2 class="h4 fw-bold mb-3">Recipe Results</h2>
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
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading" class="d-flex justify-content-center py-5">
          <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { auth, db } from "../js/config.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, setDoc, getDocs } from "firebase/firestore";

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


const API_KEY = import.meta.env.VITE_SPOONACULAR_KEY

let nextId = 1
const selectedIngredients = ref([])
const zeroWasteOnly = ref(false)
const prioritizeExpiring = ref(false)
const customIngredient = ref('')
const showExpiryModal = ref(false)
const editingIngredient = ref(null)
const tempExpiryDate = ref('')

// might add, NFT for user whom make use of their ingredient list, with high sustainability scoring, > 80% score and utilize
// Mint a NFT to their wallet or smth?
// If user is logged in, then when viewing the recipe, allow them to decrement the items from the pantry?


function addCustomIngredient() {
  if (!customIngredient.value.trim()) return
  
  const ingredientName = customIngredient.value.trim().toLowerCase()
  const exists = selectedIngredients.value.find(i => i.name === ingredientName)
  
  if (!exists) {
    selectedIngredients.value.push({
      id: nextId++,
      name: ingredientName,
      expiry: null
    })
  }
  
  customIngredient.value = ''
}

function removeIngredient(id) {
  selectedIngredients.value = selectedIngredients.value.filter(i => i.id !== id)
}

function clearPantry() {
  selectedIngredients.value = []
}

function openExpiryModal(ingredient) {
  editingIngredient.value = ingredient
  tempExpiryDate.value = ingredient.expiry || ''
  showExpiryModal.value = true
}

function closeExpiryModal() {
  showExpiryModal.value = false
  editingIngredient.value = null
  tempExpiryDate.value = ''
}

function saveExpiryDate() {
  if (editingIngredient.value) {
    editingIngredient.value.expiry = tempExpiryDate.value
  }
  closeExpiryModal()
}

function clearExpiryDate() {
  if (editingIngredient.value) {
    editingIngredient.value.expiry = null
  }
  closeExpiryModal()
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function isExpired(ingredient) {
  if (!ingredient.expiry) return false
  const expiryDate = new Date(ingredient.expiry)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiryDate.setHours(0, 0, 0, 0)
  return expiryDate < today
}

function isExpiringSoon(ingredient) {
  if (!ingredient.expiry) return false
  if (isExpired(ingredient)) return false
  const expiryDate = new Date(ingredient.expiry)
  const today = new Date()
  const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 3
}

function getExpiringIngredients() {
  return selectedIngredients.value.filter(isExpiringSoon)
}


const recipes = ref([])
const loading = ref(false)
const error = ref('')

const filteredRecipes = computed(() => {
  return zeroWasteOnly.value ? recipes.value.filter(r => r.zeroWaste) : recipes.value
})

function listNames(arr = []) {
  return arr.map(i => i.name).join(', ')
}

function displayNutrient(recipe, name) {
  const nutrient = recipe?.nutrition?.nutrients?.find(n => n.name === name)
  if (!nutrient) return '—'
  const value = Math.round(nutrient.amount)
  const unit = nutrient.unit?.toLowerCase() === 'kcal' ? '' : nutrient.unit
  return unit ? `${value}${unit}` : `${value}`
}

function computeSustainabilityScore(recipe, pantryItems, expiringIngredients = []) {
  const total = (recipe.usedIngredients?.length || 0) + (recipe.missedIngredients?.length || 0)
  const pantryRatio = total ? (recipe.usedIngredients?.length || 0) / total : 0
  const missingPenalty = total ? 1 - ((recipe.missedIngredients?.length || 0) / total) : 1

  const expiringNames = new Set(expiringIngredients.map(i => i.name.toLowerCase()))
  const usesExpiring = (recipe.usedIngredients || []).filter(i => 
    expiringNames.has(i.name?.toLowerCase())
  )
  const expiringBonus = expiringIngredients.length > 0 ? 
    usesExpiring.length / expiringIngredients.length : 0

  let score = Math.round(50 * pantryRatio + 30 * missingPenalty + 20 * expiringBonus)
  score = Math.max(0, Math.min(100, score))
  
  return { score, usesExpiring }
}

async function findRecipes() {
  error.value = ''
  recipes.value = []
  if (!API_KEY) {
    error.value = 'Missing API key'
    return
  }
  if (!selectedIngredients.value.length) return

  loading.value = true
  try {
    const ingredientList = selectedIngredients.value.map(i => encodeURIComponent(i.name)).join(',')
    const res = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientList}&number=12&ranking=1&ignorePantry=true&apiKey=${API_KEY}`)
    
    if (!res.ok && res.status == 402) {
      throw new Error('API limit reached');
    } else if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    
    const base = await res.json()
    const expiringIngredients = prioritizeExpiring.value ? getExpiringIngredients() : []

    const details = await Promise.all(
      base.map(async (r) => {
        const infoRes = await fetch(`https://api.spoonacular.com/recipes/${r.id}/information?includeNutrition=true&apiKey=${API_KEY}`)
        if (!infoRes.ok) {
          throw new Error('Failed to fetch recipe details')
        }
        const info = await infoRes.json()

        const usedIngredients = (r.usedIngredients || []).map(x => ({ 
          name: x.name, amount: x.amount, unit: x.unit 
        }))
        const missedIngredients = (r.missedIngredients || []).map(x => ({ 
          name: x.name, amount: x.amount, unit: x.unit 
        }))

        const { score, usesExpiring } = computeSustainabilityScore(
          { ...r, usedIngredients, missedIngredients },
          selectedIngredients.value,
          expiringIngredients
        )

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
          nutrition: info.nutrition,
          sustainabilityScore: score,
          usesExpiring: usesExpiring.length,
          zeroWaste: r.missedIngredientCount === 0,
          showDetails: false,
        }
      })
    )

    recipes.value = details.sort((a, b) => {
      if (zeroWasteOnly.value && a.zeroWaste !== b.zeroWaste) {
        return b.zeroWaste - a.zeroWaste
      }
      if (prioritizeExpiring.value && a.usesExpiring !== b.usesExpiring) {
        return b.usesExpiring - a.usesExpiring
      }
      if (a.sustainabilityScore !== b.sustainabilityScore) {
        return b.sustainabilityScore - a.sustainabilityScore
      }
      return a.missedIngredientCount - b.missedIngredientCount
    })
  } catch (e) {
    error.value = e.message || 'Failed to fetch recipes.'
  } finally {
    loading.value = false
  }
}

function toggleDetails(recipe) {
  recipe.showDetails = !recipe.showDetails
}

async function retrievePantry() {
  const user = auth.currentUser;
  if (!user) {
    console.warn("User not logged in");
    return;
  }

  const pantryRef = doc(db, "users", user.uid);
  try {
    const snapshot = await getDoc(pantryRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log("Retrieved pantry:", data.pantry);
      // Import pantry items into selectedIngredients
      const pantryItems = data.pantry || [];
      // Merge with existing ingredients, avoiding duplicates
      const existingNames = new Set(selectedIngredients.value.map(i => i.name.toLowerCase()));
      pantryItems.forEach(item => {
        const itemName = item.name.toLowerCase();
        if (!existingNames.has(itemName)) {
          selectedIngredients.value.push({
            id: nextId++,
            name: itemName,
            expiry: item.expiry || null // Preserve expiry date if available
          });
        }
      });
    } else {
      console.log("No pantry found for this user.");
    }
  } catch (err) {
    console.error("Error getting pantry:", err);
  }
}
// Test functions as I am not supposed to add to pantry ingredients, but required for backend testing
async function testSetPantryToFirestore() {
  const user = auth.currentUser;
  if (!user) {
    console.warn("User not logged in");
    return;
  }

  const pantryRef = doc(db, "users", user.uid);

  // Example pantry data
  const testPantry = [
    { name: "chicken breast", qty: 2, unit: "pcs", expiry: "2025-10-20" },
    { name: "milk", qty: 1, unit: "L", expiry: "2025-10-10" },
    { name: "broccoli", qty: 3, unit: "pcs", expiry: "2025-10-09" },
  ];

  try {
    await setDoc(pantryRef, { pantry: testPantry }, { merge: true });
    console.log("Test pantry written to Firestore!");
  } catch (err) {
    console.error("Error writing pantry:", err);
  }
}


window.testSetPantryToFirestore = testSetPantryToFirestore;
// window.testGetPantryFromFirestore = testGetPantryFromFirestore;

</script>

<style scoped>
/* Light theme styling */
.card {
  border-radius: 0.5rem;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

/* Add ingredient input wrapper */
.add-ingredient-wrapper {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-ingredient-wrapper .form-control {
  flex: 1;
  min-width: 0;
}

.add-ingredient-wrapper .add-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  padding: 0;
  border-radius: 50%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: #198754 !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-ingredient-wrapper .add-btn:hover:not(:disabled) {
  background-color: #157347 !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.add-ingredient-wrapper .add-btn {
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1;
}

.add-ingredient-wrapper .add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form inputs */
.form-control {
  border-radius: 0.375rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
}

/* Buttons */
.btn {
  border-radius: 0.375rem;
  padding: 0.5rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover:not(:disabled) {
  background-color: #157347;
  border-color: #146c43;
}

.btn-success:disabled {
  opacity: 0.6;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

/* List items */
.list-group-item {
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

/* Ingredient badges */
.ingredient-badge {
  padding: 0.5em 0.75em;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding-right: 2rem;
}

.ingredient-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ingredient-badge.bg-success-subtle {
  background-color: #d1e7dd;
  color: #0f5132;
}

.ingredient-badge.bg-success-subtle:hover {
  background-color: #c1d7cd;
}

.ingredient-badge.bg-warning-subtle {
  background-color: #fff3cd;
  color: #664d03;
  border: 1px solid #ffecb5;
}

.ingredient-badge.bg-warning-subtle:hover {
  background-color: #ffe3ad;
}

.ingredient-badge.bg-danger-subtle {
  background-color: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}

.ingredient-badge.bg-danger-subtle:hover {
  background-color: #f1c0c4;
}

.ingredient-badge .btn-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.3rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.5rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.ingredient-badge .btn-remove:hover {
  opacity: 1;
  color: #dc3545;
  transform: translateY(-50%) scale(1.2);
}

.badge.bg-warning {
  color: #000;
}

/* Progress bar */
.progress {
  height: 0.5rem;
  border-radius: 0.25rem;
}

.progress-bar {
  background-color: #198754;
}

/* Form range slider */
.form-range::-webkit-slider-thumb {
  background-color: #198754;
}

.form-range::-moz-range-thumb {
  background-color: #198754;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Recipe card images */
.object-fit-cover {
  object-fit: cover;
}

/* Spinner */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

/* Modal styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .add-ingredient-wrapper {
    gap: 6px;
  }
  
  .add-ingredient-wrapper .add-btn {
    width: 38px !important;
    height: 38px !important;
    min-width: 38px !important;
    font-size: 1.4rem !important;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
  }
  
  .btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
  }
}

/* Scrollbar styling for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
