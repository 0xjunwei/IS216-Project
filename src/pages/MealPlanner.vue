<template>
  <div class="min-vh-100 bg-light content-under-nav">
    <div class="container-fluid pb-4 px-2">
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
                <button class="btn btn-glass btn-sm week-nav-btn" @click="handlePreviousNavigation">
                  ◀
                </button>
                <h6 class="mb-0">
                  <button 
                    class="btn-date-display" 
                    @click="openCalendarPicker"
                    :title="'Click to select a date'"
                  >
                    <span v-if="isMobile() && weekDays.length > 0">
                      {{ weekDays[currentDayIndex]?.name }} - {{ weekDays[currentDayIndex]?.date }}
                    </span>
                    <span v-else>{{ currentWeekRange }}</span>
                    <i class="bi bi-calendar-event ms-2"></i>
                  </button>
                </h6>
                <button class="btn btn-glass btn-sm week-nav-btn" @click="handleNextNavigation">
                  ▶
                </button>
              </div>

              <!-- Weekly Calendar Grid -->
              <div class="weekly-grid" ref="weeklyGridRef">
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
                        :data-date="day.date"
                        :data-meal-type="mealType"
                        @drop="dropMeal($event, day.date, mealType)"
                        @dragover.prevent
                        @dragenter.prevent
                        @touchmove="touchMove($event)"
                        @touchend="touchEnd"
                      >
                        <div class="meal-type-label">{{ mealType }}</div>
                        <div v-if="getMealsForSlot(day.date, mealType).length > 0" class="meal-items-container">
                          <div 
                            v-for="(meal, index) in getMealsForSlot(day.date, mealType)"
                            :key="`${day.date}-${mealType}-${index}`"
                            class="meal-item"
                            draggable="true"
                            @dragstart="dragMeal($event, day.date, mealType, index)"
                            @touchstart="touchStart($event, { type: 'move', fromDate: day.date, fromMealType: mealType, fromIndex: index, meal })"
                            @touchmove.prevent
                            @touchend="touchEnd"
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
                  @touchstart="touchStart($event, { type: 'from-library', meal })"
                  @touchmove.prevent
                  @touchend="touchEnd"
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

    <!-- Calendar Picker Modal -->
    <div 
      class="modal fade" 
      :class="{ 'show': showCalendarModal }" 
      :style="{ display: showCalendarModal ? 'block' : 'none' }"
      tabindex="-1" 
      @click.self="closeCalendarPicker"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content rounded-4 shadow border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold fs-5">
              <i class="bi bi-calendar-event text-primary me-2"></i>Select Date
            </h5>
            <button type="button" class="btn-close" @click="closeCalendarPicker" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Month/Year Navigation -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <button class="btn btn-outline-secondary btn-sm" @click="previousMonth">
                ◀
              </button>
              <h6 class="mb-0 fw-bold">
                {{ calendarMonthName }} {{ calendarYear }}
              </h6>
              <button class="btn btn-outline-secondary btn-sm" @click="nextMonth">
                ▶
              </button>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-grid">
              <!-- Day Headers -->
              <div class="calendar-weekdays">
                <div v-for="day in weekDayHeaders" :key="day" class="calendar-weekday">
                  {{ day }}
                </div>
              </div>

              <!-- Calendar Days -->
              <div class="calendar-days">
                <div 
                  v-for="(day, index) in calendarDays" 
                  :key="index"
                  class="calendar-day"
                  :class="{
                    'other-month': !day.inCurrentMonth,
                    'today': day.isToday,
                    'selected': day.isSelected
                  }"
                  @click="selectDate(day.date)"
                >
                  {{ day.day }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCalendarModal" class="modal-backdrop fade show" @click="closeCalendarPicker"></div>
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

// Calendar picker state
const showCalendarModal = ref(false);
const calendarMonth = ref(new Date().getMonth());
const calendarYear = ref(new Date().getFullYear());

// Template refs
const weeklyGridRef = ref(null);

// Touch drag state
const touchDragState = ref({
  active: false,
  data: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0
});

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
    image: "https://images.unsplash.com/photo-1708989175833-9456d81ca179?w=300&h=200&fit=crop",
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

// Calendar picker computed properties
const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const calendarMonthName = computed(() => {
  const date = new Date(calendarYear.value, calendarMonth.value, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
});

const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1);
  const lastDay = new Date(calendarYear.value, calendarMonth.value + 1, 0);
  const startDate = new Date(firstDay);
  
  // Start from Sunday of the week containing the first day
  const dayOfWeek = firstDay.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get current displayed date for selection highlight
  const currentDate = isMobile() && weekDays.value.length > 0 
    ? new Date(weekDays.value[currentDayIndex.value]?.date)
    : new Date(currentWeekStart.value);
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dateStr = date.toISOString().split('T')[0];
    const dateForComparison = new Date(date);
    dateForComparison.setHours(0, 0, 0, 0);
    
    const currentDateForComparison = new Date(currentDate);
    currentDateForComparison.setHours(0, 0, 0, 0);
    
    days.push({
      day: date.getDate(),
      date: dateStr,
      inCurrentMonth: date.getMonth() === calendarMonth.value,
      isToday: dateForComparison.getTime() === today.getTime(),
      isSelected: dateForComparison.getTime() === currentDateForComparison.getTime()
    });
  }
  
  return days;
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
  handleDrop(data, date, mealType);
}

function handleDrop(data, date, mealType) {
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
    
    // Don't move if it's the same slot
    if (fromKey === toKey && data.fromIndex === undefined) {
      return;
    }
    
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

// Touch event handlers for mobile drag-and-drop
function touchStart(event, data) {
  if (!event.touches || event.touches.length === 0) return;
  
  const touch = event.touches[0];
  touchDragState.value = {
    active: true,
    data: data,
    startX: touch.clientX,
    startY: touch.clientY,
    currentX: touch.clientX,
    currentY: touch.clientY
  };
  
  // Add visual feedback
  if (event.currentTarget) {
    event.currentTarget.classList.add('touch-dragging');
  }
}

function touchMove(event) {
  if (!touchDragState.value.active || !event.touches || event.touches.length === 0) {
    return;
  }
  
  // Prevent default scrolling when actively dragging
  event.preventDefault();
  
  const touch = event.touches[0];
  touchDragState.value.currentX = touch.clientX;
  touchDragState.value.currentY = touch.clientY;
  
  // Find element under touch point
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  if (elementBelow) {
    // Find the meal-slot element
    const mealSlot = elementBelow.closest('.meal-slot');
    if (mealSlot) {
      // Add visual feedback to drop target
      document.querySelectorAll('.meal-slot').forEach(slot => {
        slot.classList.remove('touch-drag-over');
      });
      mealSlot.classList.add('touch-drag-over');
    }
  }
}

function touchEnd(event) {
  if (!touchDragState.value.active) return;
  
  // Remove visual feedback from dragging element
  document.querySelectorAll('.meal-card, .meal-item').forEach(el => {
    el.classList.remove('touch-dragging');
  });
  
  // Find drop target using changedTouches
  const changedTouches = event.changedTouches;
  if (!changedTouches || changedTouches.length === 0) {
    touchDragState.value.active = false;
    touchDragState.value.data = null;
    // Remove visual feedback
    document.querySelectorAll('.meal-slot').forEach(slot => {
      slot.classList.remove('touch-drag-over');
    });
    return;
  }
  
  const touch = changedTouches[0];
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  
  if (elementBelow && touchDragState.value.data) {
    const mealSlot = elementBelow.closest('.meal-slot');
    if (mealSlot) {
      const date = mealSlot.getAttribute('data-date');
      const mealType = mealSlot.getAttribute('data-meal-type');
      
      if (date && mealType) {
        handleDrop(touchDragState.value.data, date, mealType);
      }
    }
  }
  
  // Remove visual feedback
  document.querySelectorAll('.meal-slot').forEach(slot => {
    slot.classList.remove('touch-drag-over');
  });
  
  touchDragState.value.active = false;
  touchDragState.value.data = null;
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

// Current day index for mobile navigation
const currentDayIndex = ref(0);

function previousWeek() {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
  saveCurrentWeek();
  scrollToStart();
}

function nextWeek() {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
  saveCurrentWeek();
  scrollToStart();
}

function previousDay() {
  if (currentDayIndex.value > 0) {
    currentDayIndex.value--;
    scrollToDay(currentDayIndex.value);
  } else {
    // Move to previous week and show last day
    previousWeek();
    setTimeout(() => {
      currentDayIndex.value = weekDays.value.length - 1;
      scrollToDay(currentDayIndex.value);
    }, 100);
  }
}

function nextDay() {
  if (currentDayIndex.value < weekDays.value.length - 1) {
    currentDayIndex.value++;
    scrollToDay(currentDayIndex.value);
  } else {
    // Move to next week and show first day
    nextWeek();
    setTimeout(() => {
      currentDayIndex.value = 0;
      scrollToDay(currentDayIndex.value);
    }, 100);
  }
}

function scrollToDay(index) {
  if (!weeklyGridRef.value) return;
  
  const dayColumns = weeklyGridRef.value.querySelectorAll('.day-column');
  if (dayColumns && dayColumns[index]) {
    const dayColumn = dayColumns[index];
    const scrollPosition = dayColumn.offsetLeft - weeklyGridRef.value.offsetLeft;
    
    weeklyGridRef.value.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }
}

function scrollToStart() {
  // Scroll to the first day on mobile when navigating weeks
  if (weeklyGridRef.value) {
    setTimeout(() => {
      weeklyGridRef.value?.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
      currentDayIndex.value = 0;
    }, 100);
  }
}

// Check if mobile view (< 576px)
function isMobile() {
  return window.innerWidth <= 575;
}

// Handle navigation based on screen size
function handlePreviousNavigation() {
  if (isMobile()) {
    previousDay();
  } else {
    previousWeek();
  }
}

function handleNextNavigation() {
  if (isMobile()) {
    nextDay();
  } else {
    nextWeek();
  }
}

// Calendar picker functions
function openCalendarPicker() {
  // Set calendar to show current date's month
  const currentDate = isMobile() && weekDays.value.length > 0
    ? new Date(weekDays.value[currentDayIndex.value]?.date)
    : new Date(currentWeekStart.value);
  
  calendarMonth.value = currentDate.getMonth();
  calendarYear.value = currentDate.getFullYear();
  showCalendarModal.value = true;
}

function closeCalendarPicker() {
  showCalendarModal.value = false;
}

function previousMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;
    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;
    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
}

function selectDate(selectedDateStr) {
  const selectedDate = new Date(selectedDateStr);
  
  // Calculate Monday of the week containing the selected date
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() + mondayOffset);
  
  // Update current week start
  currentWeekStart.value = monday;
  saveCurrentWeek();
  
  // Close modal
  closeCalendarPicker();
  
  // If mobile, find and scroll to the selected day
  if (isMobile()) {
    setTimeout(() => {
      // Find the index of the selected day in the week
      const selectedDayIndex = weekDays.value.findIndex(day => day.date === selectedDateStr);
      if (selectedDayIndex !== -1) {
        currentDayIndex.value = selectedDayIndex;
        scrollToDay(selectedDayIndex);
      } else {
        // If not found, scroll to start
        scrollToStart();
        currentDayIndex.value = 0;
      }
    }, 100);
  } else {
    // On desktop, scroll to start of week
    scrollToStart();
  }
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

// Track scroll position for day index
function updateCurrentDayIndex() {
  if (!weeklyGridRef.value || !isMobile()) return;
  
  const scrollLeft = weeklyGridRef.value.scrollLeft;
  const dayColumns = weeklyGridRef.value.querySelectorAll('.day-column');
  
  if (dayColumns.length === 0) return;
  
  let closestIndex = 0;
  let closestDistance = Infinity;
  
  dayColumns.forEach((column, index) => {
    const columnLeft = column.offsetLeft;
    const distance = Math.abs(scrollLeft - columnLeft);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  
  if (closestIndex !== currentDayIndex.value) {
    currentDayIndex.value = closestIndex;
  }
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
  
  // Track scroll position for mobile day navigation
  setTimeout(() => {
    if (weeklyGridRef.value) {
      weeklyGridRef.value.addEventListener('scroll', updateCurrentDayIndex);
      updateCurrentDayIndex(); // Initial update
    }
  }, 100);
});

onUnmounted(() => {
  if (unsub) unsub();
  if (weeklyGridRef.value) {
    weeklyGridRef.value.removeEventListener('scroll', updateCurrentDayIndex);
  }
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
  padding-top: 0px;
}
@media (min-width: 992px) {
  .content-under-nav { padding-top: 0px; }
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
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
}

.week-nav-btn:hover {
  color: #0d6efd !important;
  transform: scale(1.1);
}

.week-nav-btn:active {
  transform: scale(0.95);
}

.weekly-grid {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #198754 #f8f9fa;
}

.weekly-grid::-webkit-scrollbar {
  height: 6px;
}

.weekly-grid::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.weekly-grid::-webkit-scrollbar-thumb {
  background: #198754;
  border-radius: 3px;
}

.weekly-grid::-webkit-scrollbar-thumb:hover {
  background: #157347;
}

.day-column {
  flex: 1;
  min-width: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
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
  width: 100%;
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

/* Mobile (≤575px) - Single date column, full width */
@media (max-width: 575px) {
  .day-column {
    flex: 0 0 100%;
    min-width: calc(100% - 0.5rem);
    max-width: calc(100% - 0.5rem);
  }
  
  .meal-day-card {
    min-height: 500px;
    padding: 0.75rem;
  }
  
  .day-header {
    height: 60px;
    margin-bottom: 1rem;
  }
  
  .day-header h6 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  
  .day-header small {
    font-size: 0.85rem;
  }
  
  .meal-slot {
    height: 110px;
    max-height: 110px;
    padding: 0.75rem;
    touch-action: pan-y;
  }
  
  .meal-type-label {
    font-size: 0.85rem;
  }
  
  .meal-title {
    font-size: 0.75rem;
  }
  
  .meal-item {
    min-height: 38px;
    padding: 0.4rem;
    touch-action: none;
  }
  
  .meal-card {
    flex-direction: column;
    text-align: center;
    touch-action: none;
  }
  
  .meal-image {
    width: 100%;
    height: 80px;
    margin: 0 auto;
  }
  
  .week-nav-btn {
    font-size: 1.75rem;
    padding: 0.75rem;
    min-width: 48px;
    min-height: 48px;
  }
  
  .weekly-grid {
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  /* Improve touch targets for mobile */
  .btn-remove-meal {
    width: 24px;
    height: 24px;
    font-size: 0.9rem;
  }
  
  .btn {
    min-height: 44px;
    padding: 0.6rem 1rem;
  }
  
  /* Container adjustments */
  .container-fluid {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .card {
    border-radius: 10px;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  /* Shopping list mobile optimizations */
  .shopping-item {
    padding: 0.75rem 0;
  }
  
  /* Available meals section */
  .meal-library {
    max-height: 350px;
  }
  
  .meal-info .meal-title {
    font-size: 0.85rem;
  }
  
  /* Calendar mobile optimizations */
  .calendar-day {
    min-height: 36px;
    font-size: 0.85rem;
  }
  
  .calendar-weekday {
    font-size: 0.8rem;
    padding: 0.4rem 0;
  }
  
  .btn-date-display {
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .btn-date-display i {
    font-size: 0.8rem;
  }
}

/* Small tablets (576px-767px) - 2 days visible */
@media (min-width: 576px) and (max-width: 767px) {
  .day-column {
    flex: 0 0 50%;
    min-width: calc(50% - 0.375rem);
    max-width: calc(50% - 0.375rem);
  }
  
  .meal-day-card {
    min-height: 550px;
    padding: 0.875rem;
  }
  
  .meal-slot {
    height: 120px;
    max-height: 120px;
  }
  
  .weekly-grid {
    gap: 0.5rem;
  }
}

/* Medium tablets (768px-991px) - 4-5 days visible */
@media (min-width: 768px) and (max-width: 991px) {
  .day-column {
    flex: 0 0 33.333%;
    min-width: calc(33.333% - 0.4rem);
    max-width: calc(33.333% - 0.4rem);
  }
  
  .meal-day-card {
    min-height: 575px;
  }
  
  .meal-slot {
    height: 125px;
    max-height: 125px;
  }
  
  .meal-card {
    flex-direction: column;
    text-align: center;
  }
  
  .meal-image {
    width: 100%;
    height: 80px;
    margin: 0 auto;
  }
  
  .weekly-grid {
    gap: 0.4rem;
  }
}

/* Large screens (992px+) - All 7 days visible (desktop layout) */
@media (min-width: 992px) {
  .day-column {
    flex: 1;
    min-width: 0;
  }
  
  .weekly-grid {
    overflow-x: visible;
    scroll-snap-type: none;
  }
  
  .day-column {
    scroll-snap-align: none;
    scroll-snap-stop: normal;
  }
}

/* Legacy mobile styles (768px and below) - kept for backward compatibility */
@media (max-width: 768px) {
  .meal-title {
    font-size: 0.8rem;
  }
  
  .meal-type-label {
    font-size: 0.8rem;
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

/* Date Display Button */
.btn-date-display {
  background: none;
  border: none;
  color: inherit;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-date-display:hover {
  background: #f8f9fa;
  color: #0d6efd;
}

.btn-date-display:active {
  transform: scale(0.95);
}

.btn-date-display i {
  font-size: 0.9rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.btn-date-display:hover i {
  opacity: 1;
}

/* Calendar Picker Modal Styles */
.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6c757d;
  padding: 0.5rem 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  color: #212529;
  background: #f8f9fa;
  min-height: 40px;
  touch-action: manipulation;
}

.calendar-day:hover {
  background: #e9ecef;
  transform: scale(1.05);
}

.calendar-day.other-month {
  color: #adb5bd;
  background: transparent;
}

.calendar-day.today {
  background: #0d6efd;
  color: #fff;
  font-weight: 700;
}

.calendar-day.selected {
  background: #198754;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(25, 135, 84, 0.3);
}

.calendar-day.today.selected {
  background: #157347;
  box-shadow: 0 2px 8px rgba(21, 115, 71, 0.4);
}

.calendar-day:active {
  transform: scale(0.95);
}

/* Mobile drag and drop improvements */
@media (max-width: 767px) {
  .meal-item:active {
    opacity: 0.7;
  }
  
  .meal-card:active {
    opacity: 0.7;
    transform: scale(0.98);
  }
  
  .meal-slot:active {
    border-color: #198754;
    background: #cfe2ff;
  }
  
  /* Touch drag visual feedback */
  .touch-dragging {
    opacity: 0.6;
    transform: scale(0.95);
    transition: opacity 0.2s, transform 0.2s;
    z-index: 1000;
    position: relative;
  }
  
  .touch-drag-over {
    border-color: #198754 !important;
    background: #d1e7dd !important;
    transform: scale(1.02);
    transition: all 0.2s ease;
  }
  
  .meal-slot.touch-drag-over {
    border-style: solid !important;
    border-width: 2px !important;
  }
}
</style>
