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
              <div class="d-flex flex-column flex-sm-row gap-2 mt-2 mt-md-0">
              <button 
                v-if="user"
                @click="retrievePantry"
                class="btn btn-success btn-sm mt-2 mt-md-0 flex-fill"
              >
                <i class="bi bi-cart me-2"></i>
                Import from Pantry
              </button>
              <button 
                  v-if="user"
                  @click="openWalletModal"
                  class="btn btn-outline-primary btn-sm mt-2 mt-md-0 flex-fill"
                >
                  <i class="bi bi-wallet2 me-2"></i>
                  Manage Wallet
                </button>
                </div>
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

        <!--Show wallet Modal for Web3 wallet-->
        <div v-if="showWalletModal" class="modal-overlay" @click="closeWalletModal">
          <div class="modal-content" @click.stop>
            <h5 class="mb-3">Manage Web3 Wallet</h5>
            <p class="text-muted small mb-3">Add or update your wallet address.</p>
            <div class="mb-3">
              <label for="walletAddressInput" class="form-label">Ethereum Wallet Address</label>
              <input
                type="text"
                class="form-control"
                id="walletAddressInput"
                v-model="walletAddress"
                placeholder="0x"
              />
            </div>
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-secondary" @click="closeWalletModal">Cancel</button>
              <button class="btn btn-success" @click="saveWalletAddress">Save</button>
            </div>
          </div>
        </div>
        <!-- Deduct Ingredients Modal -->
        <div v-if="showDeductModal" class="modal-overlay" @click="closeDeductModal">
          <div class="modal-content-large" @click.stop>
            <h5 class="mb-3">Use Ingredients for {{ deductingRecipe?.title }}</h5>
            <p class="text-muted small mb-3">Adjust quantities to deduct from your pantry</p>
            
            <div class="mb-3" style="max-height: 400px; overflow-y: auto;">
              <div 
                v-for="ingredient in deductIngredientsList" 
                :key="ingredient.name"
                class="card mb-2"
              >
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                      <strong>{{ ingredient.name }}</strong>
                    <div class="small text-muted">
                        Recipe needs: {{ ingredient.amount }} {{ ingredient.unit }}
                    </div>
                      <div class="small text-muted">
                        In pantry: {{ ingredient.pantryQuantity || 0 }} {{ ingredient.pantryUnit || ingredient.unit }}
                  </div>
                  </div>
                    <div class="form-check">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="'use-' + ingredient.name"
                        v-model="ingredient.selected"
                      />
                      <label class="form-check-label" :for="'use-' + ingredient.name">
                        Use
                      </label>
            </div>
          </div>

                  <div v-if="ingredient.selected" class="row g-2">
                    <div class="col-6">
                      <label class="form-label small">Amount to deduct</label>
                      <input 
                        type="number" 
                        class="form-control form-control-sm" 
                        v-model.number="ingredient.deductAmount"
                        :min="0"
                        step="0.1"
                      />
                    </div>
                    <div class="col-6">
                      <label class="form-label small">Unit</label>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        v-model="ingredient.deductUnit"
                      />
                    </div>
                  </div>
                </div>
              </div>
          </div>

            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-secondary" @click="closeDeductModal">Cancel</button>
              <button 
                class="btn btn-success" 
                @click="confirmDeductIngredients"
                :disabled="!deductIngredientsList.some(i => i.selected)"
              >
                Confirm Usage
            </button>
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
                        <button 
                          v-if="user"
                          class="btn btn-success btn-sm"
                          @click="openDeductModal(recipe)"
                        >
                          <i class="bi bi-dash-circle me-1"></i>
                          Use Ingredients
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
import axios from 'axios';
import { ethers } from 'ethers';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_SPOONACULAR_KEY;

// Current user to show import button
const user = ref(null);
let authListener = null;

// Listen for auth state changes
onMounted(() => {
  authListener = onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
  });
});

// Clean up listener when component unmounts
onUnmounted(() => {
  if (authListener) authListener();
});

let nextId = 1;
const selectedIngredients = ref([]);
const customIngredient = ref('');

// Filter options
const zeroWasteOnly = ref(false);
const prioritizeExpiring = ref(false);

// Modal states for expiry date and deduct ingredients
const showExpiryModal = ref(false);
const editingIngredient = ref(null);
const tempExpiryDate = ref('');

const showDeductModal = ref(false);
const deductingRecipe = ref(null);
const deductIngredientsList = ref([]);

// Web3 wallet
const showWalletModal = ref(false);
const walletAddress = ref('');

const MINTER_PRIVATE_KEY = import.meta.env.VITE_MINTER_PRIVATE_KEY;
const RPC_URL = import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL;
const CONTRACT_ADDRESS = '0x7Cc19FbE20D26Eeab6620c61e8E6918bb710C1aF';
const TOKEN_URI = 'https://storage.googleapis.com/meal-planner-badges/1.json#';

// ABI for safeMint
const contractABI = [
  {
    "name": "safeMint",
    "type": "function",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "uri", "type": "string" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable"
  }
];

// Recipe data
const recipes = ref([]);
const loading = ref(false);
const error = ref('');


// Wallet Modal Functions
async function openWalletModal() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  showWalletModal.value = true;
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data().walletAddress) {
      walletAddress.value = docSnap.data().walletAddress;
    } else {
      walletAddress.value = '';
    }
    
  } catch (err) {
    console.error("Error fetching wallet address:", err);
  }
}

function closeWalletModal() {
  showWalletModal.value = false;
  walletAddress.value = '';
}

async function saveWalletAddress() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, { walletAddress: walletAddress.value.trim() }, { merge: true });
    closeWalletModal();
  } catch (err) {
    console.error("Error saving wallet address:", err);
  }
}

async function mintSustainabilityBadge(recipientAddress) {
  if (!MINTER_PRIVATE_KEY || !RPC_URL) {
    console.error("Minter private key or RPC URL is not configured in the .env file.");
    return;
  }
  if (!ethers.isAddress(recipientAddress)) {
    console.error("Invalid recipient address for NFT minting:", recipientAddress);
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(MINTER_PRIVATE_KEY, provider);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    console.log(`Attempting to mint sustainability badge to ${recipientAddress}...`);
    const tx = await contract.safeMint(recipientAddress, TOKEN_URI);
    
    console.log("Mint transaction sent. Waiting for confirmation...", `TxHash: ${tx.hash}`);

    const receipt = await tx.wait();
  
    console.log("NFT minted successfully! Transaction confirmed");
  } catch (error) {
    console.error("Failed to mint NFT:", error.reason || error.message);
  }
}

// Add ingredient to list
function addCustomIngredient() {
  if (!customIngredient.value.trim()) {
    return;
  }
  
  const ingredientName = customIngredient.value.trim().toLowerCase();
  const alreadyExists = selectedIngredients.value.find(item => item.name === ingredientName);
  
  if (!alreadyExists) {
    selectedIngredients.value.push({
    id: nextId++,
      name: ingredientName,
      expiry: null,
      fromPantry: false
    });
  }
  
  customIngredient.value = '';
}

function removeIngredient(id) {
  selectedIngredients.value = selectedIngredients.value.filter(item => item.id !== id);
}

function clearPantry() {
  selectedIngredients.value = [];
}

function openExpiryModal(ingredient) {
  editingIngredient.value = ingredient;
  tempExpiryDate.value = ingredient.expiry || '';
  showExpiryModal.value = true;
}

function closeExpiryModal() {
  showExpiryModal.value = false;
  editingIngredient.value = null;
  tempExpiryDate.value = '';
}

async function saveExpiryDate() {
  if (editingIngredient.value) {
    editingIngredient.value.expiry = tempExpiryDate.value;
    
    // update firebase
    if (editingIngredient.value.fromPantry && user.value) {
      await updatePantryIngredient(editingIngredient.value.name, tempExpiryDate.value);
    }
  }
  closeExpiryModal();
}

async function clearExpiryDate() {
  if (editingIngredient.value) {
    editingIngredient.value.expiry = null;
    
    // update firebase
    if (editingIngredient.value.fromPantry && user.value) {
      await updatePantryIngredient(editingIngredient.value.name, null);
    }
  }
  closeExpiryModal();
}

async function updatePantryIngredient(ingredientName, newExpiry) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  try {
    // ref user pantry
    const pantryRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(pantryRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      const pantryItems = data.pantry || [];
      
      // Find and update the matching ingredient
      const updatedPantry = pantryItems.map(item => {
        if (item.name.toLowerCase() === ingredientName.toLowerCase()) {
          // Spread operation to expand item
          return { ...item, expiry: newExpiry };
        }
        return item;
      });
      
      await setDoc(pantryRef, { pantry: updatedPantry }, { merge: true });
    }
  } catch (err) {
    console.error("Error updating pantry:", err);
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function isExpired(ingredient) {
  if (!ingredient.expiry) return false;
  
  const expiryDate = new Date(ingredient.expiry);
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  return expiryDate < today;
}


function isExpiringSoon(ingredient) {
  if (!ingredient.expiry) return false;
  if (isExpired(ingredient)) return false;
  
  const expiryDate = new Date(ingredient.expiry);
  const today = new Date();
  
  // Calculate days until expiry
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // Check if ingredient expires within 3 days
  return diffDays >= 0 && diffDays <= 3;
}

function getExpiringIngredients() {
  return selectedIngredients.value.filter(isExpiringSoon);
}

// Filter recipes based on zero waste toggle
const filteredRecipes = computed(() => {
  if (zeroWasteOnly.value) {
    return recipes.value.filter(recipe => recipe.zeroWaste);
  }
  return recipes.value;
});

// Convert array of ingredients to comma-separated string
function listNames(ingredientArray) {
  if (!ingredientArray || ingredientArray.length === 0) return '';
  return ingredientArray.map(item => item.name).join(', ');
}

// Display nutrient value with unit
function displayNutrient(recipe, nutrientName) {
  if (!recipe.nutrition || !recipe.nutrition.nutrients) return '—';
  
  const nutrient = recipe.nutrition.nutrients.find(n => n.name === nutrientName);
  if (!nutrient) return '—';
  
  const value = Math.round(nutrient.amount);
  const unit = nutrient.unit;
  
  // Don't show unit for calories
  if (unit && unit.toLowerCase() === 'kcal') {
    return `${value}`;
  }
  
  return unit ? `${value}${unit}` : `${value}`;
}

// Calculate sustainability score for recipe
function computeSustainabilityScore(recipe, expiringIngredients) {
  // Count total ingredients needed
  const usedCount = recipe.usedIngredients ? recipe.usedIngredients.length : 0;
  const missedCount = recipe.missedIngredients ? recipe.missedIngredients.length : 0;
  const totalIngredients = usedCount + missedCount;
  
  // Calculate pantry ratio
  let pantryRatio = totalIngredients > 0 ? usedCount / totalIngredients : 0;
  let missingPenalty = totalIngredients > 0 ? 1 - (missedCount / totalIngredients) : 1;
  
  // Calculate expiring bonus
  let expiringBonus = 0;
  if (expiringIngredients && expiringIngredients.length > 0) {
    // Count how many expiring ingredients this recipe uses
    let usesExpiringCount = 0;
    for (let i = 0; i < recipe.usedIngredients.length; i++) {
      const ingredient = recipe.usedIngredients[i];
      for (let j = 0; j < expiringIngredients.length; j++) {
        if (ingredient.name.toLowerCase() === expiringIngredients[j].name.toLowerCase()) {
          usesExpiringCount++;
          break;
        }
      }
    }
    expiringBonus = usesExpiringCount / expiringIngredients.length;
  }
  
  // Calculate final score (out of 100)
  // 50% based on ingredients we have
  // 30% based on ingredients we don't need to buy
  // 20% based on using expiring ingredients
  // Math might not be perfect but should be ok, since its 80 points (which i think is sustainable if u utilize your whole pantry)
  // else more if expiring.
  let score = (50 * pantryRatio) + (30 * missingPenalty) + (20 * expiringBonus);
  score = Math.round(score);
  
  // Make sure score is between 0 and 100
  score = score < 0 ? 0 : score > 100 ? 100 : score;
  
  return { score: score, usesExpiring: [] };
}

// Search for recipes using selected ingredients
async function findRecipes() {
  error.value = '';
  recipes.value = [];
  
  // Checks
  if (!API_KEY) {
    error.value = 'Missing API key';
    return;
  }
  
  if (selectedIngredients.value.length === 0) {
    return;
  }

  loading.value = true;
  
  try {
    // Create comma-separated list of ingredients
    const ingredientNames = selectedIngredients.value.map(item => encodeURIComponent(item.name));
    const ingredientList = ingredientNames.join(',');
    
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredientList,
        number: 5, // Adjusted to 5 to save API calls
        ranking: 1, // is maximize used ingredients (1) or minimize missing ingredients (2)
        ignorePantry: true, // ignore water/salt etc based on docs
        apiKey: API_KEY
      }
    });
    
    const recipesData = response.data;
    
    let expiringIngredients = [];
    if (prioritizeExpiring.value) {
      expiringIngredients = getExpiringIngredients();
    }

    const recipeDetails = [];
    for (let i = 0; i < recipesData.length; i++) {
      const recipe = recipesData[i];
      
      try {
        // Fetch nutrition and details
        const detailResponse = await axios.get(`https://api.spoonacular.com/recipes/${recipe.id}/information`, {
          params: {
            includeNutrition: true,
            apiKey: API_KEY
          }
        });
        
        const details = detailResponse.data;

        // Format ingredients
        const used = [];
        for (let j = 0; j < recipe.usedIngredients.length; j++) {
          const ing = recipe.usedIngredients[j];
          used.push({ name: ing.name, amount: ing.amount, unit: ing.unit });
        }
        
        const missed = [];
        for (let j = 0; j < recipe.missedIngredients.length; j++) {
          const ing = recipe.missedIngredients[j];
          missed.push({ name: ing.name, amount: ing.amount, unit: ing.unit });
        }

        // Calculate sustainability score
        const scoreData = computeSustainabilityScore(
          { usedIngredients: used, missedIngredients: missed },
          expiringIngredients
        );

        // Building recipe object
        recipeDetails.push({
          id: recipe.id,
          title: details.title,
          image: details.image,
          sourceUrl: details.sourceUrl,
          readyInMinutes: details.readyInMinutes,
          servings: details.servings,
          usedIngredients: used,
          missedIngredients: missed,
          usedIngredientCount: recipe.usedIngredientCount,
          missedIngredientCount: recipe.missedIngredientCount,
          nutrition: details.nutrition,
          sustainabilityScore: scoreData.score,
          usesExpiring: 0,
          zeroWaste: recipe.missedIngredientCount === 0,
          showDetails: false
        });
      } catch (err) {
        // Skip this recipe if there's an error fetching details
        continue;
      }
    }

    // Sort recipes by score
    recipeDetails.sort((a, b) => {
      // Zero waste first if enabled
      if (zeroWasteOnly.value && a.zeroWaste !== b.zeroWaste) {
        return b.zeroWaste ? 1 : -1;
      }
      
      // Then by sustainability score
      if (a.sustainabilityScore !== b.sustainabilityScore) {
        return b.sustainabilityScore - a.sustainabilityScore;
      }
      
      // Finally by missing ingredients
      return a.missedIngredientCount - b.missedIngredientCount;
    });
    
    recipes.value = recipeDetails;
    
  } catch (err) {
    // Handle axios errors
    if (err.response && err.response.status === 402) {
      error.value = 'API limit reached';
    } else {
      error.value = err.message || 'Failed to fetch recipes';
    }
  } finally {
    loading.value = false;
  }
}

// Show/hide recipe details
function toggleDetails(recipe) {
  recipe.showDetails = !recipe.showDetails;
}

// Open modal to deduct ingredients from pantry
async function openDeductModal(recipe) {
  deductingRecipe.value = recipe;
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const pantryRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(pantryRef);
    const pantryItems = snapshot.exists() ? snapshot.data().pantry || [] : [];

    const ingredientsList = [];
    for (const recipeIngredient of recipe.usedIngredients) {
      const recipeIngredientName = recipeIngredient.name.toLowerCase();

      // Find the best matching pantry item using a more flexible search.
      const matchedPantryItem = pantryItems.find(pantryItem => {
        const pantryItemName = pantryItem.name.toLowerCase();
        return recipeIngredientName.includes(pantryItemName) || pantryItemName.includes(recipeIngredientName);
      });

      
      const pantryInfo = matchedPantryItem
        ? {
            quantity: matchedPantryItem.qty || matchedPantryItem.quantity || 0,
            unit: matchedPantryItem.unit || '',
          }
        : { quantity: 0, unit: '' };

      const hasStock = pantryInfo.quantity > 0;

      ingredientsList.push({
        name: recipeIngredient.name,
        amount: recipeIngredient.amount || 0,
        unit: recipeIngredient.unit || '',
        pantryQuantity: pantryInfo.quantity,
        pantryUnit: pantryInfo.unit || recipeIngredient.unit || '',
        selected: hasStock,
        deductAmount: recipeIngredient.amount || 0,
        deductUnit: recipeIngredient.unit || '',
      });
    }

    deductIngredientsList.value = ingredientsList;
    showDeductModal.value = true;

  } catch (err) {
    console.error("Error opening deduct modal:", err);
  }
}

function closeDeductModal() {
  showDeductModal.value = false;
  deductingRecipe.value = null;
  deductIngredientsList.value = [];
}

async function confirmDeductIngredients() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const recipeToDeduct = deductingRecipe.value;
  
  try {
    const pantryRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(pantryRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.data();
      let pantryItems = userData.pantry || [];
      const userWalletAddress = userData.walletAddress || null;

      for (const ingredient of deductIngredientsList.value) {
        if (ingredient.selected && ingredient.deductAmount > 0) {
          const foundIndex = pantryItems.findIndex(pantryItem => {
              const pantryItemName = pantryItem.name.toLowerCase();
              const ingredientName = ingredient.name.toLowerCase();
              return ingredientName.includes(pantryItemName) || pantryItemName.includes(ingredientName);
          });
          
          if (foundIndex !== -1) {
            const currentQty = pantryItems[foundIndex].qty || pantryItems[foundIndex].quantity || 0;
            const newQty = currentQty - ingredient.deductAmount;

            if (newQty <= 0) {
              pantryItems.splice(foundIndex, 1);
            } else {
              if (pantryItems[foundIndex].qty !== undefined) {
                pantryItems[foundIndex].qty = newQty;
              } else {
                pantryItems[foundIndex].quantity = newQty;
              }
            }
          }
        }
      }
      closeDeductModal();
      await setDoc(pantryRef, { pantry: pantryItems }, { merge: true });

      await refreshSelectedIngredients();

      if (recipeToDeduct && recipeToDeduct.sustainabilityScore >= 80) {
        if (userWalletAddress) {
          mintSustainabilityBadge(userWalletAddress);
        } else {
          console.log("User earned a badge but has no wallet address configured.");
        }
      }
      
      
    }
  } catch (err) {
    console.error("Error confirming ingredient deduction:", err);
  }
}

async function retrievePantry() {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  try {
    const pantryRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(pantryRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log("Pantry data:", data);
      const pantryItems = data.pantry || [];
      const existingIngredients = [];
      console.log("Pantry items:", pantryItems);
      
      for (let i = 0; i < selectedIngredients.value.length; i++) {
        existingIngredients.push(selectedIngredients.value[i].name.toLowerCase());
      }
      for (let i = 0; i < pantryItems.length; i++) {
        const item = pantryItems[i];
        const itemName = item.name.toLowerCase();

        let alreadyExists = false;
        for (let j = 0; j < existingIngredients.length; j++) {
          if (existingIngredients[j] === itemName) {
            alreadyExists = true;
            break;
          }
        }
        
        if (!alreadyExists) {
          selectedIngredients.value.push({
            id: nextId++,
            name: itemName,
            expiry: item.expiry || null,
            fromPantry: true
          });
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function refreshSelectedIngredients() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const pantryRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(pantryRef);

    if (snapshot.exists()) {
      const updatedPantryItems = snapshot.data().pantry || [];

      const pantryItemNames = updatedPantryItems.map(item => item.name.toLowerCase());


      selectedIngredients.value = selectedIngredients.value.filter(ingredient => {

        if (!ingredient.fromPantry) {
          return true;
        }

        return pantryItemNames.includes(ingredient.name.toLowerCase());
      });
    } else {

      selectedIngredients.value = selectedIngredients.value.filter(
        (ingredient) => !ingredient.fromPantry
      );
    }
  } catch (err) {
    console.error("Error refreshing selected ingredients:", err);
  }
}


// Testing function to add sample pantry data
async function testSetPantryToFirestore() {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  const pantryRef = doc(db, "users", user.uid);

  // Sample pantry data for testing
  const testPantry = [
    { name: "chicken breast", qty: 2, unit: "pcs", expiry: "2025-10-20" },
    { name: "milk", qty: 1, unit: "L", expiry: "2025-10-10" },
    { name: "broccoli", qty: 3, unit: "pcs", expiry: "2025-10-09" },
  ];

  try {
    await setDoc(pantryRef, { pantry: testPantry }, { merge: true });
    console.log("Test pantry written to Firestore!");
  } catch (err) {
    console.error("Error:", err);
  }
}

// Make function available for testing in browser console
window.testSetPantryToFirestore = testSetPantryToFirestore;
//window.mintSustainabilityBadge = mintSustainabilityBadge;
</script>

<style scoped>

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


.form-control {
  border-radius: 0.375rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
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


.progress {
  height: 0.5rem;
  border-radius: 0.25rem;
}

.progress-bar {
  background-color: #198754;
}


.form-range::-webkit-slider-thumb {
  background-color: #198754;
}

.form-range::-moz-range-thumb {
  background-color: #198754;
}


.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.object-fit-cover {
  object-fit: cover;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

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

.modal-content-large {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}


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
