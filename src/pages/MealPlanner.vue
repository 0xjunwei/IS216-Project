<template>
  <div class="min-vh-100 bg-light content-under-nav">
    <div class="container-fluid py-4 px-4">
      <div class="row g-4 align-items-start">
        <!-- Meal Planner Column -->
        <div class="col-12 col-lg-9">
          <div class="card surface-card glass-card shadow-sm border-0">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">Weekly Meal Planner</h5>
                <div class="d-flex gap-2">
                  <button class="btn btn-glass btn-sm" @click="clearAllMeals" :disabled="!hasAnyMeals">
                    Clear All
                  </button>
                  <button class="btn btn-glow btn-sm" @click="generateShoppingList" :disabled="!hasAnyMeals">
                    Generate Shopping List
                  </button>
                </div>
              </div>

              <!-- Week Navigation -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-glass btn-sm week-nav-btn" @click="previousWeek">
                  ◀
                </button>
                <h6 class="mb-0">{{ currentWeekRange }}</h6>
                <button class="btn btn-glass btn-sm week-nav-btn" @click="nextWeek">
                  ▶
                </button>
              </div>

              <!-- Weekly Calendar Grid -->
              <div class="weekly-grid">
                <div v-for="day in weekDays" :key="day.date" class="day-column">
                  <div class="meal-day-card h-100" :class="{ 'today': day.isToday }">
                    <div class="day-header">
                      <h6 class="mb-1">{{ day.name }}</h6>
                      <small class="text-muted">{{ day.date }}</small>
                    </div>
                    
                    <!-- Meal Slots -->
                    <div class="meal-slots">
                      <div 
                        v-for="mealType in mealTypes" 
                        :key="mealType"
                        class="meal-slot"
                        @drop="dropMeal($event, day.date, mealType)"
                        @dragover.prevent
                        @dragenter.prevent
                      >
                        <div class="meal-type-label">{{ mealType }}</div>
                        <div v-if="getMealsForSlot(day.date, mealType).length > 0" class="meal-items-container">
                          <div 
                            v-for="(meal, index) in getMealsForSlot(day.date, mealType)"
                            :key="`${day.date}-${mealType}-${index}`"
                            class="meal-item"
                            draggable="true"
                            @dragstart="dragMeal($event, day.date, mealType, index)"
                          >
                            <div class="meal-title">{{ meal.title }}</div>
                            <button class="btn-remove-meal" @click="removeMeal(day.date, mealType, index)">
                              ×
                            </button>
                          </div>
                        </div>
                        <div v-else class="empty-slot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Available Meals & Shopping List Column -->
        <div class="col-12 col-lg-3">
          <!-- Available Meals -->
          <div class="card surface-card glass-card shadow-sm border-0 mb-3">
            <div class="card-body">
              <h5 class="card-title mb-3">Available Meals</h5>
              <div v-if="!availableMeals.length" class="text-muted small">
                No meals available. Go to Recipe Suggestions to find meals for your pantry.
              </div>
              <div v-else class="meal-library">
                <div 
                  v-for="meal in availableMeals" 
                  :key="meal.id"
                  class="meal-card"
                  draggable="true"
                  @dragstart="dragMealFromLibrary($event, meal)"
                >
                  <div class="meal-image">
                    <img :src="meal.image" :alt="meal.title" />
                  </div>
                  <div class="meal-info">
                    <div class="meal-title">{{ meal.title }}</div>
                    <div class="meal-meta">
                      <span class="badge bg-primary">{{ meal.readyInMinutes }}min</span>
                      <span class="badge bg-success">{{ meal.sustainabilityScore }}% sustainable</span>
                      <span v-if="meal.zeroWaste" class="badge bg-warning">Zero Waste</span>
                    </div>
                    <div class="meal-ingredients">
                      <small class="text-muted">
                        Uses: {{ meal.usedIngredients?.length || 0 }} ingredients
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Shopping List -->
          <div class="card surface-card glass-card shadow-sm border-0">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Shopping List</h5>
                <div class="d-flex gap-2">
                  <button class="btn btn-glass btn-sm" @click="clearShoppingList" :disabled="!shoppingList.length">
                    Clear
                  </button>
                  <button class="btn btn-glow btn-sm" @click="exportShoppingList" :disabled="!shoppingList.length">
                    Export
                  </button>
                </div>
              </div>

              <div v-if="!shoppingList.length" class="text-muted small">
                Generate a shopping list based on your planned meals.
              </div>
              <div v-else class="shopping-list">
                <div v-for="item in shoppingList" :key="item.id" class="shopping-item">
                  <div class="form-check">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      :id="`item-${item.id}`"
                      v-model="item.purchased"
                      @change="saveShoppingList"
                    />
                    <label class="form-check-label" :for="`item-${item.id}`">
                      <span :class="{ 'purchased': item.purchased }">{{ item.name }}</span>
                      <small class="text-muted d-block">{{ item.amount }} {{ item.unit }}</small>
                    </label>
                  </div>
                  <div class="item-actions">
                    <button class="btn btn-sm btn-outline-secondary" @click="removeShoppingItem(item.id)">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Sustainable Alternatives -->
              <div v-if="sustainableAlternatives.length" class="mt-4">
                <h6 class="mb-2">🌱 Sustainable Alternatives</h6>
                <div class="sustainable-alternatives">
                  <div v-for="alt in sustainableAlternatives" :key="alt.id" class="alternative-item">
                    <div class="alternative-info">
                      <strong>{{ alt.original }}</strong> → <span class="text-success">{{ alt.alternative }}</span>
                      <small class="d-block text-muted">{{ alt.benefit }}</small>
                    </div>
                  </div>
                </div>
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
import { auth, db } from "../js/config.js";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Reactive data
const currentWeekStart = ref(new Date());
const plannedMeals = ref({});
const shoppingList = ref([]);
const sustainableAlternatives = ref([]);

// Auth state management
const user = ref(auth.currentUser);
let unsub = null;

// Mock available meals (in real app, this would come from SmartRecipes)
const availableMeals = ref([
  {
    id: 1,
    title: "Chicken Stir Fry",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop",
    readyInMinutes: 25,
    sustainabilityScore: 85,
    zeroWaste: true,
    usedIngredients: [
      { name: "chicken breast", amount: 2, unit: "pcs" },
      { name: "broccoli", amount: 1, unit: "head" },
      { name: "carrots", amount: 2, unit: "pcs" }
    ],
    missedIngredients: [
      { name: "soy sauce", amount: 2, unit: "tbsp" },
      { name: "garlic", amount: 3, unit: "cloves" }
    ]
  },
  {
    id: 2,
    title: "Vegetarian Pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop",
    readyInMinutes: 20,
    sustainabilityScore: 92,
    zeroWaste: true,
    usedIngredients: [
      { name: "pasta", amount: 200, unit: "g" },
      { name: "tomatoes", amount: 3, unit: "pcs" }
    ],
    missedIngredients: [
      { name: "olive oil", amount: 2, unit: "tbsp" },
      { name: "basil", amount: 1, unit: "bunch" }
    ]
  },
  {
    id: 3,
    title: "Salmon Bowl",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
    readyInMinutes: 30,
    sustainabilityScore: 78,
    zeroWaste: false,
    usedIngredients: [
      { name: "salmon", amount: 1, unit: "fillet" },
      { name: "rice", amount: 1, unit: "cup" }
    ],
    missedIngredients: [
      { name: "avocado", amount: 1, unit: "pcs" },
      { name: "cucumber", amount: 1, unit: "pcs" }
    ]
  }
]);

const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

// Computed properties
const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  
  // Adjust to start from Monday (day 1)
  const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get to Monday
  start.setDate(start.getDate() + mondayOffset);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    days.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toISOString().split('T')[0],
      isToday: isToday(date)
    });
  }
  
  return days;
});

const currentWeekRange = computed(() => {
  const start = new Date(currentWeekStart.value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
});

const hasAnyMeals = computed(() => {
  return Object.keys(plannedMeals.value).length > 0;
});

// Helper functions
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getMealsForSlot(date, mealType) {
  const key = `${date}-${mealType}`;
  return plannedMeals.value[key] || [];
}

function dragMealFromLibrary(event, meal) {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'from-library',
    meal: meal
  }));
}

function dragMeal(event, date, mealType, index) {
  const meals = getMealsForSlot(date, mealType);
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'move',
    fromDate: date,
    fromMealType: mealType,
    fromIndex: index,
    meal: meals[index]
  }));
}

function dropMeal(event, date, mealType) {
  event.preventDefault();
  const data = JSON.parse(event.dataTransfer.getData('text/plain'));
  
  if (data.type === 'from-library') {
    // Add meal from library
    const key = `${date}-${mealType}`;
    if (!plannedMeals.value[key]) {
      plannedMeals.value[key] = [];
    }
    plannedMeals.value[key].push(data.meal);
  } else if (data.type === 'move') {
    // Move existing meal
    const fromKey = `${data.fromDate}-${data.fromMealType}`;
    const toKey = `${date}-${mealType}`;
    
    // Remove from old location
    if (plannedMeals.value[fromKey]) {
      plannedMeals.value[fromKey].splice(data.fromIndex, 1);
      if (plannedMeals.value[fromKey].length === 0) {
        delete plannedMeals.value[fromKey];
      }
    }
    
    // Add to new location
    if (!plannedMeals.value[toKey]) {
      plannedMeals.value[toKey] = [];
    }
    plannedMeals.value[toKey].push(data.meal);
  }
  
  savePlannedMeals();
}

function removeMeal(date, mealType, index) {
  const key = `${date}-${mealType}`;
  if (plannedMeals.value[key]) {
    plannedMeals.value[key].splice(index, 1);
    if (plannedMeals.value[key].length === 0) {
      delete plannedMeals.value[key];
    }
  }
  savePlannedMeals();
}

function clearAllMeals() {
  plannedMeals.value = {};
  savePlannedMeals();
}

function generateShoppingList() {
  const allMissingIngredients = [];
  
  // Collect all missing ingredients from planned meals
  Object.values(plannedMeals.value).forEach(mealArray => {
    // mealArray is now an array of meals
    mealArray.forEach(meal => {
      if (meal.missedIngredients) {
        meal.missedIngredients.forEach(ingredient => {
          allMissingIngredients.push({
            id: `${meal.id}-${ingredient.name}`,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            purchased: false
          });
        });
      }
    });
  });
  
  // Merge duplicate ingredients
  const mergedIngredients = {};
  allMissingIngredients.forEach(ingredient => {
    const key = ingredient.name.toLowerCase();
    if (mergedIngredients[key]) {
      mergedIngredients[key].amount += ingredient.amount;
    } else {
      mergedIngredients[key] = { ...ingredient };
    }
  });
  
  shoppingList.value = Object.values(mergedIngredients);
  generateSustainableAlternatives();
  saveShoppingList();
}

function generateSustainableAlternatives() {
  // Mock sustainable alternatives
  sustainableAlternatives.value = [
    {
      id: 1,
      original: "Chicken",
      alternative: "Tofu",
      benefit: "Reduces carbon footprint by 75%"
    },
    {
      id: 2,
      original: "Beef",
      alternative: "Lentils",
      benefit: "Uses 90% less water"
    },
    {
      id: 3,
      original: "Dairy Milk",
      alternative: "Oat Milk",
      benefit: "60% less greenhouse gas emissions"
    }
  ];
}

function removeShoppingItem(itemId) {
  shoppingList.value = shoppingList.value.filter(item => item.id !== itemId);
  saveShoppingList();
}

function clearShoppingList() {
  shoppingList.value = [];
  sustainableAlternatives.value = [];
  saveShoppingList();
}

function exportShoppingList() {
  const unpurchasedItems = shoppingList.value.filter(item => !item.purchased);
  const listText = unpurchasedItems.map(item => `- ${item.name} (${item.amount} ${item.unit})`).join('\n');
  
  const blob = new Blob([listText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopping-list.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function previousWeek() {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
  saveCurrentWeek();
}

function nextWeek() {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
  saveCurrentWeek();
}

// Local storage functions
function loadPlannedMeals() {
  const saved = localStorage.getItem('plannedMeals');
  if (saved) {
    plannedMeals.value = JSON.parse(saved);
  }
}

function savePlannedMeals() {
  localStorage.setItem('plannedMeals', JSON.stringify(plannedMeals.value));
  savePlannedMealsToFirestore(); // Add Firestore sync
}

function loadShoppingList() {
  const saved = localStorage.getItem('shoppingList');
  if (saved) {
    shoppingList.value = JSON.parse(saved);
  }
}

function saveShoppingList() {
  localStorage.setItem('shoppingList', JSON.stringify(shoppingList.value));
  saveShoppingListToFirestore(); // Add Firestore sync
}

function loadCurrentWeek() {
  const saved = localStorage.getItem('currentWeekStart');
  if (saved) {
    currentWeekStart.value = new Date(saved);
  }
}

function saveCurrentWeek() {
  localStorage.setItem('currentWeekStart', currentWeekStart.value.toISOString());
}

// Firestore functions for planned meals
async function savePlannedMealsToFirestore() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  try {
    const mealsRef = doc(db, "users", currentUser.uid);
    await setDoc(mealsRef, { 
      plannedMeals: plannedMeals.value,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log("Planned meals saved to Firestore");
  } catch (error) {
    console.error("Error saving planned meals:", error);
  }
}

async function loadPlannedMealsFromFirestore() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  try {
    const mealsRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(mealsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.plannedMeals) {
        plannedMeals.value = data.plannedMeals;
        savePlannedMeals(); // Also save to localStorage as backup
      }
    }
  } catch (error) {
    console.error("Error loading planned meals:", error);
  }
}

// Firestore functions for shopping list
async function saveShoppingListToFirestore() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  try {
    const listRef = doc(db, "users", currentUser.uid);
    await setDoc(listRef, { 
      shoppingList: shoppingList.value,
      sustainableAlternatives: sustainableAlternatives.value,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log("Shopping list saved to Firestore");
  } catch (error) {
    console.error("Error saving shopping list:", error);
  }
}

async function loadShoppingListFromFirestore() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  try {
    const listRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(listRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.shoppingList) {
        shoppingList.value = data.shoppingList;
        saveShoppingList(); // Also save to localStorage
      }
      if (data.sustainableAlternatives) {
        sustainableAlternatives.value = data.sustainableAlternatives;
      }
    }
  } catch (error) {
    console.error("Error loading shopping list:", error);
  }
}

// Sync function for manual cloud sync
async function syncWithFirestore() {
  await savePlannedMealsToFirestore();
  await saveShoppingListToFirestore();
  alert('Data synced to cloud!');
}

// Lifecycle
onMounted(() => {
  unsub = onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser;
    if (firebaseUser) {
      loadPlannedMealsFromFirestore();
      loadShoppingListFromFirestore();
    }
  });
  
  loadPlannedMeals();
  loadShoppingList();
  loadCurrentWeek();
});

onUnmounted(() => {
  if (unsub) unsub();
});
</script>

<style scoped>
/* Light theme styling to match other pages */
.min-vh-100 {
  background: #f8f9fa !important;
  color: #212529 !important;
  font-family: "Inter", "Segoe UI", sans-serif;
}

/* Push page content below the fixed navbar */
.content-under-nav {
  padding-top: 80px;
}
@media (min-width: 992px) {
  .content-under-nav { padding-top: 80px; }
}

/* Standard Bootstrap card styling */
.card {
  background: #fff !important;
  color: #212529 !important;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/* Surface cards with light theme */
.surface-card {
  background: #fff !important;
  border: 1px solid #dee2e6 !important;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
}

/* Standard Bootstrap button styling */
.btn-glow {
  background: #0d6efd;
  color: #fff;
  border: 1px solid #0d6efd;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 600;
}
.btn-glow:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
}

.btn-glass {
  background: #6c757d;
  color: #fff;
  border: 1px solid #6c757d;
  border-radius: 12px;
}
.btn-glass:hover {
  background: #5c636a;
  border-color: #565e64;
}

/* Meal Planner Styles */
.week-nav-btn {
  background: none !important;
  border: none !important;
  color: #6c757d !important;
  font-size: 2rem;
  padding: 0.5rem;
  transition: all 0.3s ease;
  font-weight: bold;
}

.week-nav-btn:hover {
  color: #0d6efd !important;
  transform: scale(1.1);
}

.weekly-grid {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.day-column {
  flex: 1;
  min-width: 0;
}

.meal-day-card {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 1rem;
  min-height: 600px;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.meal-day-card.today {
  border-color: #198754;
  background: #d1e7dd;
}

.day-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  flex-shrink: 0;
  height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.day-header h6 {
  color: #212529 !important;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  font-size: 1.1rem;
}

.day-header small {
  color: #6c757d !important;
  font-weight: 500;
  line-height: 1;
  font-size: 0.9rem;
}

.meal-slots {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
}

.meal-slot {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  height: 130px;
  max-height: 130px;
  transition: all 0.3s ease;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.meal-slot:hover {
  border-color: #198754;
  background: #d1e7dd;
}

.meal-type-label {
  font-size: 0.9rem;
  color: #212529 !important;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.empty-slot {
  flex: 1;
}

.meal-item {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: move;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 40px;
}

.meal-item:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.meal-title {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0;
  color: #212529 !important;
  line-height: 1.2;
  padding-right: 25px;
}

.meal-items-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100% - 2rem);
  padding-right: 0.25rem;
}

/* Custom scrollbar for meal items container */
.meal-items-container::-webkit-scrollbar {
  width: 4px;
}

.meal-items-container::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 2px;
}

.meal-items-container::-webkit-scrollbar-thumb {
  background: #198754;
  border-radius: 2px;
}

.meal-items-container::-webkit-scrollbar-thumb:hover {
  background: #157347;
}

.btn-remove-meal {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: #dc3545;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove-meal:hover {
  background: #c82333;
  transform: scale(1.1);
}

/* Available Meals Library */
.meal-library {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.meal-card {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: move;
  transition: all 0.3s ease;
  display: flex;
  gap: 0.75rem;
}

.meal-card:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.meal-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.meal-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meal-info {
  flex: 1;
  min-width: 0;
}

.meal-info .meal-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #212529 !important;
  line-height: 1.2;
}

.meal-info .meal-meta {
  margin-bottom: 0.25rem;
}

.meal-ingredients {
  font-size: 0.75rem;
}

/* Shopping List */
.shopping-list {
  max-height: 300px;
  overflow-y: auto;
}

.shopping-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.shopping-item:last-child {
  border-bottom: none;
}

.form-check-label {
  cursor: pointer;
  flex: 1;
}

.purchased {
  text-decoration: line-through;
  opacity: 0.6;
}

.item-actions {
  margin-left: 0.5rem;
}

/* Sustainable Alternatives */
.sustainable-alternatives {
  background: #d1e7dd;
  border: 1px solid #198754;
  border-radius: 8px;
  padding: 0.75rem;
}

.alternative-item {
  padding: 0.25rem 0;
}

.alternative-item:not(:last-child) {
  border-bottom: 1px solid #198754;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .meal-card {
    flex-direction: column;
    text-align: center;
  }
  
  .meal-image {
    width: 100%;
    height: 80px;
    margin: 0 auto;
  }
  
  .meal-slot {
    height: 100px;
    max-height: 100px;
    padding: 0.75rem;
  }
  
  .meal-title {
    font-size: 0.8rem;
  }
  
  .meal-type-label {
    font-size: 0.8rem;
  }
  
  .weekly-grid {
    gap: 0.2rem;
  }
}

/* Drag and drop visual feedback */
.meal-slot.drag-over {
  border-color: #0d6efd;
  background: #cfe2ff;
}

.meal-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}
</style>
