<template>
  <div class="meal-planner-container">
    <div class="container-fluid">
      <div class="row">
        <!-- Weekly Calendar -->
        <div class="col-lg-8">
          <div class="weekly-calendar">
            <!-- Week Navigation Header -->
            <div class="calendar-header">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">
                  <i class="fas fa-calendar-alt me-2 text-success"></i>
                  {{ currentWeekRange }}
                </h4>
                <div class="d-flex align-items-center gap-3">
                  <input 
                    type="date" 
                    v-model="selectedDate" 
                    @change="goToDate"
                    class="form-control form-control-sm"
                    style="width: auto;"
                  />
                  <div class="d-flex align-items-center gap-2">
                    <button @click="previousWeek" class="btn btn-outline-success" title="Previous Week">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <button @click="nextWeek" class="btn btn-outline-success" title="Next Week">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Day Headers -->
            <div class="day-headers">
              <div class="day-header" v-for="day in weekDays" :key="day.name">
                <div class="day-name">{{ day.name }}</div>
                <div class="day-date">{{ day.dateNumber }}</div>
                <div class="day-month">{{ day.fullDate.toLocaleDateString('en-US', { month: 'short' }) }}</div>
              </div>
            </div>
            
            <!-- Meal Planning Grid -->
            <div class="meal-planning-grid">
              <div 
                class="day-column" 
                v-for="(day, dayIndex) in weekDays" 
                :key="dayIndex"
                @drop="dropMeal($event, day.date, dayIndex)"
                @dragover.prevent
                @dragenter.prevent
              >
                <div class="meal-slots">
                  <div 
                    class="meal-slot breakfast"
                    @drop="dropMeal($event, day.date, dayIndex, 'breakfast')"
                    @dragover.prevent
                    @dragenter.prevent
                  >
                    <div class="meal-label">
                      <i class="fas fa-sun me-1"></i>Breakfast
                    </div>
                    <div class="meals-container">
                      <div 
                        v-for="(meal, mealIndex) in getMealsForDate(day.date).breakfast"
                        :key="`breakfast-${mealIndex}`"
                        class="meal-card"
                        draggable="true"
                        @dragstart="dragMeal($event, day.date, dayIndex, 'breakfast', mealIndex)"
                      >
                        {{ meal.name }}
                        <button @click="removeMeal(day.date, dayIndex, 'breakfast', mealIndex)" class="btn-remove">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div 
                    class="meal-slot lunch"
                    @drop="dropMeal($event, day.date, dayIndex, 'lunch')"
                    @dragover.prevent
                    @dragenter.prevent
                  >
                    <div class="meal-label">
                      <i class="fas fa-sun me-1"></i>Lunch
                    </div>
                    <div class="meals-container">
                      <div 
                        v-for="(meal, mealIndex) in getMealsForDate(day.date).lunch"
                        :key="`lunch-${mealIndex}`"
                        class="meal-card"
                        draggable="true"
                        @dragstart="dragMeal($event, day.date, dayIndex, 'lunch', mealIndex)"
                      >
                        {{ meal.name }}
                        <button @click="removeMeal(day.date, dayIndex, 'lunch', mealIndex)" class="btn-remove">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div 
                    class="meal-slot dinner"
                    @drop="dropMeal($event, day.date, dayIndex, 'dinner')"
                    @dragover.prevent
                    @dragenter.prevent
                  >
                    <div class="meal-label">
                      <i class="fas fa-moon me-1"></i>Dinner
                    </div>
                    <div class="meals-container">
                      <div 
                        v-for="(meal, mealIndex) in getMealsForDate(day.date).dinner"
                        :key="`dinner-${mealIndex}`"
                        class="meal-card"
                        draggable="true"
                        @dragstart="dragMeal($event, day.date, dayIndex, 'dinner', mealIndex)"
                      >
                        {{ meal.name }}
                        <button @click="removeMeal(day.date, dayIndex, 'dinner', mealIndex)" class="btn-remove">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Meal Library & Shopping List -->
        <div class="col-lg-4">
          <div class="row h-100">
            <!-- Meal Library -->
            <div class="col-12 mb-4">
              <div class="meal-library">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5>
                    <i class="fas fa-utensils me-2"></i>Meal Library
                  </h5>
                  <div>
                    <select v-model="selectedCategory" class="form-select form-select-sm me-2" style="width: auto;">
                      <option value="">All Categories</option>
                      <option v-for="category in mealCategories" :key="category" :value="category">
                        {{ category }}
                      </option>
                    </select>
                  </div>
                </div>
                
                <div class="search-box mb-3">
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control"
                    placeholder="Search meals..."
                  />
                </div>
                
                <div class="meal-grid">
                  <div
                    v-for="meal in filteredMeals"
                    :key="meal.id"
                    class="meal-item"
                    draggable="true"
                    @dragstart="dragMealFromLibrary($event, meal)"
                  >
                    <div class="meal-image">
                      <i :class="meal.icon"></i>
                    </div>
                    <div class="meal-info">
                      <h6 class="meal-name">{{ meal.name }}</h6>
                      <div class="meal-tags">
                        <span v-for="tag in meal.tags" :key="tag" class="meal-tag">
                          {{ tag }}
                        </span>
                      </div>
                      <div v-if="meal.sustainable" class="sustainable-indicator">
                        <i class="fas fa-leaf"></i> Sustainable
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shopping List -->
            <div class="col-12">
              <div class="shopping-list">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5>
                    <i class="fas fa-shopping-cart me-2"></i>Shopping List
                    <small class="text-muted ms-2">(Items: {{ computedShoppingList.ingredients.length }})</small>
                  </h5>
                  <div>
                    <button @click="clearAllMeals" class="btn btn-outline-danger btn-sm me-2">
                      <i class="fas fa-trash"></i> Clear All
                    </button>
                    <button @click="generateShoppingList" class="btn btn-success btn-sm">
                      <i class="fas fa-sync"></i> Generate
                    </button>
                  </div>
                </div>
                
                <div class="shopping-items">
                  <div v-if="computedShoppingList.ingredients.length === 0" class="text-muted text-center py-3">
                    <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                    <p>Add meals to generate your shopping list</p>
                  </div>
                  <div 
                    v-for="(item, index) in computedShoppingList.ingredients" 
                    :key="index"
                    class="shopping-item"
                    :class="{ 'purchased': item.purchased }"
                  >
                    <div class="form-check">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="`item-${index}`"
                        :checked="item.purchased"
                        @change="toggleShoppingItem(item.name)"
                      >
                      <label class="form-check-label" :for="`item-${index}`">
                        <span class="item-name" :class="{ 'text-decoration-line-through text-muted': item.purchased }">{{ item.name }}</span>
                        <span class="item-quantity" :class="{ 'text-decoration-line-through text-muted': item.purchased }">{{ item.quantity }}</span>
                        <span v-if="item.sustainable" class="sustainable-badge" :class="{ 'opacity-50': item.purchased }">
                          <i class="fas fa-leaf"></i>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sustainable Alternatives -->
              <div v-if="computedShoppingList.alternatives.length > 0" class="sustainable-alternatives mt-3">
                <h6 class="text-success">
                  <i class="fas fa-leaf me-1"></i>Sustainable Alternatives
                </h6>
                <div class="alternatives-list">
                  <div 
                    v-for="(alt, index) in computedShoppingList.alternatives" 
                    :key="index"
                    class="alternative-item"
                  >
                    <div class="alternative-info">
                      <strong>{{ alt.original }}</strong> → 
                      <span class="text-success">{{ alt.alternative }}</span>
                    </div>
                    <div class="alternative-benefit">{{ alt.benefit }}</div>
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
import { ref, computed } from 'vue'

// Reactive data
const currentWeek = ref(new Date())
const selectedDate = ref(new Date().toISOString().split('T')[0]) // Today's date in YYYY-MM-DD format
const searchQuery = ref('')
const selectedCategory = ref(null)
// Store meals by date string (YYYY-MM-DD format)
const weeklyMeals = ref({})
// Store purchased state for shopping list items
const purchasedItems = ref(new Set())

// Helper functions for date handling
const getDateString = (date) => {
  return date.toISOString().split('T')[0]
}

const getWeekDates = (weekStart) => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    dates.push(date)
  }
  return dates
}

const getMealsForDate = (date) => {
  const dateString = getDateString(date)
  return weeklyMeals.value[dateString] || { breakfast: [], lunch: [], dinner: [] }
}

// Computed property for shopping list that automatically updates
const computedShoppingList = computed(() => {
  const ingredients = []
  const alternatives = []
  
  // Check if there are any meals at all
  let hasAnyMeals = false
  // Use the same date generation logic as the UI to ensure consistency
  const startOfWeek = new Date(currentWeek.value)
  startOfWeek.setDate(currentWeek.value.getDate() - currentWeek.value.getDay())
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    return date
  })
  
  for (const date of weekDates) {
    const dayMeals = getMealsForDate(date)
    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
      const mealArray = dayMeals[mealType]
      if (Array.isArray(mealArray) && mealArray.length > 0) {
        hasAnyMeals = true
        break
      }
    }
    if (hasAnyMeals) break
  }
  
  // If no meals, return empty arrays
  if (!hasAnyMeals) {
    return { ingredients: [], alternatives: [] }
  }
  
  const ingredientMap = new Map()
  
  // Collect all ingredients from planned meals for current week
  let totalMealsProcessed = 0
  let totalIngredientsProcessed = 0
  
  for (const date of weekDates) {
    const dayMeals = getMealsForDate(date)
    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
      const mealArray = dayMeals[mealType]
      if (Array.isArray(mealArray) && mealArray.length > 0) {
        mealArray.forEach(meal => {
          totalMealsProcessed++
          
          if (meal && meal.ingredients) {
            meal.ingredients.forEach(ingredient => {
              if (!ingredient.inPantry) {
                totalIngredientsProcessed++
                const ingredientName = ingredient.name
                const quantityStr = ingredient.quantity
                
                
                // Parse quantity more intelligently
                let ingredientQty = 1
                let unit = ''
                
                // Handle different quantity formats
                if (quantityStr.includes('/')) {
                  // Handle fractions like "1/2"
                  const parts = quantityStr.split(' ')
                  const fraction = parts[0]
                  if (fraction.includes('/')) {
                    const [numerator, denominator] = fraction.split('/')
                    ingredientQty = parseFloat(numerator) / parseFloat(denominator)
                  } else {
                    ingredientQty = parseFloat(fraction)
                  }
                  unit = parts[1] || ''
                } else {
                  // Handle regular numbers like "2 slices"
                  const parts = quantityStr.split(' ')
                  ingredientQty = parseFloat(parts[0]) || 1
                  unit = parts.slice(1).join(' ') || ''
                }
                
                if (ingredientMap.has(ingredientName)) {
                  // Add to existing quantity
                  const existing = ingredientMap.get(ingredientName)
                  existing.quantity += ingredientQty
                } else {
                  // Add new ingredient
                  ingredientMap.set(ingredientName, {
                    name: ingredientName,
                    quantity: ingredientQty,
                    unit: unit,
                    sustainable: meal.sustainable,
                    purchased: false
                  })
                }
              }
            })
          }
        })
      }
    }
  }
  
  
         // Convert map to array for display
         const allIngredients = Array.from(ingredientMap.values()).map(item => {
           // Format quantity nicely
           let displayQuantity = item.quantity.toString()
           if (item.quantity % 1 !== 0) {
             // Handle decimals nicely
             if (item.quantity === 0.5) {
               displayQuantity = '1/2'
             } else if (item.quantity === 0.25) {
               displayQuantity = '1/4'
             } else if (item.quantity === 0.75) {
               displayQuantity = '3/4'
             } else {
               displayQuantity = item.quantity.toFixed(1)
             }
           }

           return {
             name: item.name,
             quantity: `${displayQuantity} ${item.unit}`.trim(),
             sustainable: item.sustainable,
             purchased: purchasedItems.value.has(item.name)
           }
         })
  
  
  // Generate sustainable alternatives
  allIngredients.forEach(ingredient => {
    if (!ingredient.sustainable) {
      const alternative = getSustainableAlternative(ingredient.name)
      if (alternative) {
        alternatives.push(alternative)
      }
    }
  })
  
  return { ingredients: allIngredients, alternatives: alternatives }
})

// Meal categories
const mealCategories = ref(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Vegetarian', 'Vegan', 'Quick', 'Healthy'])

// Sample meal library
const mealLibrary = ref([
  {
    id: 1,
    name: 'Avocado Toast',
    category: 'Breakfast',
    icon: 'fas fa-bread-slice',
    tags: ['Quick', 'Healthy'],
    sustainable: true,
    ingredients: [
      { name: 'Bread', quantity: '2 slices', inPantry: false },
      { name: 'Avocado', quantity: '1 medium', inPantry: false },
      { name: 'Lemon', quantity: '1/2', inPantry: true },
      { name: 'Salt', quantity: 'pinch', inPantry: true }
    ]
  },
  {
    id: 2,
    name: 'Quinoa Buddha Bowl',
    category: 'Lunch',
    icon: 'fas fa-seedling',
    tags: ['Vegetarian', 'Healthy'],
    sustainable: true,
    ingredients: [
      { name: 'Quinoa', quantity: '1 cup', inPantry: false },
      { name: 'Chickpeas', quantity: '1/2 can', inPantry: true },
      { name: 'Spinach', quantity: '2 cups', inPantry: false },
      { name: 'Tahini', quantity: '2 tbsp', inPantry: true }
    ]
  },
  {
    id: 3,
    name: 'Lentil Curry',
    category: 'Dinner',
    icon: 'fas fa-pepper-hot',
    tags: ['Vegan', 'Healthy'],
    sustainable: true,
    ingredients: [
      { name: 'Lentils', quantity: '1 cup', inPantry: false },
      { name: 'Coconut Milk', quantity: '1 can', inPantry: false },
      { name: 'Onion', quantity: '1 medium', inPantry: true },
      { name: 'Garlic', quantity: '3 cloves', inPantry: true },
      { name: 'Curry Powder', quantity: '2 tbsp', inPantry: true }
    ]
  },
  {
    id: 4,
    name: 'Greek Salad',
    category: 'Lunch',
    icon: 'fas fa-leaf',
    tags: ['Healthy', 'Quick'],
    sustainable: true,
    ingredients: [
      { name: 'Tomatoes', quantity: '2 medium', inPantry: false },
      { name: 'Cucumber', quantity: '1 large', inPantry: false },
      { name: 'Feta Cheese', quantity: '100g', inPantry: false },
      { name: 'Olives', quantity: '1/2 cup', inPantry: true },
      { name: 'Olive Oil', quantity: '3 tbsp', inPantry: true }
    ]
  },
  {
    id: 5,
    name: 'Chicken Stir Fry',
    category: 'Dinner',
    icon: 'fas fa-drumstick-bite',
    tags: ['Quick'],
    sustainable: false,
    ingredients: [
      { name: 'Chicken Breast', quantity: '300g', inPantry: false },
      { name: 'Broccoli', quantity: '2 cups', inPantry: false },
      { name: 'Bell Peppers', quantity: '2 medium', inPantry: false },
      { name: 'Soy Sauce', quantity: '3 tbsp', inPantry: true },
      { name: 'Ginger', quantity: '1 inch', inPantry: true }
    ]
  },
  {
    id: 6,
    name: 'Overnight Oats',
    category: 'Breakfast',
    icon: 'fas fa-bowl-food',
    tags: ['Healthy', 'Quick'],
    sustainable: true,
    ingredients: [
      { name: 'Oats', quantity: '1/2 cup', inPantry: false },
      { name: 'Almond Milk', quantity: '1 cup', inPantry: false },
      { name: 'Chia Seeds', quantity: '1 tbsp', inPantry: true },
      { name: 'Honey', quantity: '1 tbsp', inPantry: true },
      { name: 'Berries', quantity: '1/2 cup', inPantry: false }
    ]
  }
])

// Computed properties
const weekDays = computed(() => {
  const startOfWeek = new Date(currentWeek.value)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNumber: date.getDate(),
      fullDate: new Date(date),
      date: date // The actual date object for the new system
    }
  })
})

const currentWeekRange = computed(() => {
  const start = weekDays.value[0].fullDate
  const end = weekDays.value[6].fullDate
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
})

const filteredMeals = computed(() => {
  let filtered = mealLibrary.value

  if (searchQuery.value) {
    filtered = filtered.filter(meal => 
      meal.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(meal => 
      meal.category === selectedCategory.value || 
      meal.tags.includes(selectedCategory.value)
    )
  }

  return filtered
})

// Methods
const previousWeek = () => {
  currentWeek.value = new Date(currentWeek.value.getTime() - 7 * 24 * 60 * 60 * 1000)
}

const nextWeek = () => {
  currentWeek.value = new Date(currentWeek.value.getTime() + 7 * 24 * 60 * 60 * 1000)
}

const goToDate = () => {
  if (selectedDate.value) {
    const targetDate = new Date(selectedDate.value)
    // Set the week to start on Sunday of the selected date's week
    const startOfWeek = new Date(targetDate)
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay())
    currentWeek.value = startOfWeek
  }
}

const dragMealFromLibrary = (event, meal) => {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'fromLibrary',
    meal: meal
    }))
}

const dragMeal = (event, date, dayIndex, mealType, mealIndex) => {
  const dayMeals = getMealsForDate(date)
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'move',
    date: getDateString(date),
    dayIndex: dayIndex,
    mealType: mealType,
    mealIndex: mealIndex,
    meal: dayMeals[mealType][mealIndex]
  }))
}

const dropMeal = (event, date, dayIndex, mealType) => {
  event.preventDefault()
  const data = JSON.parse(event.dataTransfer.getData('text/plain'))
  const targetDateString = getDateString(date)
  
  if (data.type === 'fromLibrary') {
    // Add meal from library - create a deep copy to avoid reference issues
    if (!weeklyMeals.value[targetDateString]) {
      weeklyMeals.value[targetDateString] = { breakfast: [], lunch: [], dinner: [] }
    }
    if (!weeklyMeals.value[targetDateString][mealType]) {
      weeklyMeals.value[targetDateString][mealType] = []
    }
    // Create a deep copy of the meal to avoid reference issues
    const mealCopy = JSON.parse(JSON.stringify(data.meal))
    weeklyMeals.value[targetDateString][mealType].push(mealCopy)
  } else if (data.type === 'move') {
    // Move existing meal
    if (data.date !== targetDateString || data.mealType !== mealType) {
      // Remove from original location
      if (weeklyMeals.value[data.date] && weeklyMeals.value[data.date][data.mealType]) {
        weeklyMeals.value[data.date][data.mealType].splice(data.mealIndex, 1)
      }
      // Add to new location
      if (!weeklyMeals.value[targetDateString]) {
        weeklyMeals.value[targetDateString] = { breakfast: [], lunch: [], dinner: [] }
      }
      if (!weeklyMeals.value[targetDateString][mealType]) {
        weeklyMeals.value[targetDateString][mealType] = []
      }
      weeklyMeals.value[targetDateString][mealType].push(data.meal)
    }
  }
}

const removeMeal = (date, dayIndex, mealType, mealIndex) => {
  const dateString = getDateString(date)
  if (weeklyMeals.value[dateString] && weeklyMeals.value[dateString][mealType]) {
    weeklyMeals.value[dateString][mealType].splice(mealIndex, 1)
  }
}

const clearAllMeals = () => {
  weeklyMeals.value = {}
  purchasedItems.value.clear()
}

const toggleShoppingItem = (ingredientName) => {
  if (purchasedItems.value.has(ingredientName)) {
    purchasedItems.value.delete(ingredientName)
  } else {
    purchasedItems.value.add(ingredientName)
  }
}


const getSustainableAlternative = (ingredient) => {
  const alternatives = {
    'Chicken Breast': {
      original: 'Chicken Breast',
      alternative: 'Tempeh or Tofu',
      benefit: 'Reduces carbon footprint by 80%'
    },
    'Beef': {
      original: 'Beef',
      alternative: 'Lentils or Mushrooms',
      benefit: 'Reduces water usage by 90%'
    },
    'Dairy Milk': {
      original: 'Dairy Milk',
      alternative: 'Oat Milk or Almond Milk',
      benefit: 'Reduces greenhouse gas emissions by 60%'
    },
    'Cheese': {
      original: 'Cheese',
      alternative: 'Nutritional Yeast or Cashew Cheese',
      benefit: 'Reduces water usage by 85%'
    },
    'Eggs': {
      original: 'Eggs',
      alternative: 'Chia Seeds or Flax Seeds',
      benefit: 'Reduces animal suffering and carbon footprint'
    }
  }
  
  return alternatives[ingredient] || null
}
</script>

<style scoped>
.meal-planner-container {
  padding: 1rem;
  background: #ffffff;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
}

.header-section {
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.weekly-calendar {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.calendar-header {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 1rem;
  flex-shrink: 0;
}

.day-headers {
  background: #f8f9fa;
  display: flex;
  border-bottom: 2px solid #e9ecef;
  flex-shrink: 0;
}

.day-header {
  text-align: center;
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-right: 1px solid #e9ecef;
  background: #f8f9fa;
}

.day-header:last-child {
  border-right: none;
}

.day-name {
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #495057;
}

.day-date {
  font-size: 1.4rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.day-month {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
}

.meal-planning-grid {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.day-column {
  flex: 1;
  border-right: 1px solid #e9ecef;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
}

.day-column:last-child {
  border-right: none;
}

.meal-slots {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  height: 100%;
}

.meal-slot {
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 2px dashed #e9ecef;
  transition: all 0.3s ease;
  min-height: 120px;
}

.meal-slot:hover {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
}

.meal-label {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #495057;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 4px;
}

.meals-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
  max-height: 100%;
}

.meal-card {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  min-height: 50px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: move;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.meal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-remove {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.meal-library, .shopping-list {
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: calc(50vh - 100px);
  display: flex;
  flex-direction: column;
}

.meal-grid, .shopping-items, .alternatives-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.meal-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: move;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meal-item:hover {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
}

.meal-image {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.meal-info {
  flex: 1;
}

.meal-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.meal-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.meal-tag {
  background: #e9ecef;
  color: #6c757d;
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.sustainable-indicator {
  color: #27ae60;
  font-size: 0.75rem;
  font-weight: 500;
}

.shopping-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.shopping-item:hover {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.05);
}

.shopping-item.purchased {
  background-color: #e9ecef;
  opacity: 0.7;
  border-color: #dee2e6;
}

.shopping-item .form-check {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0;
}

.shopping-item .form-check-input {
  margin-right: 0.75rem;
  margin-top: 0;
  transform: scale(1.1);
}

.shopping-item .form-check-label {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  cursor: pointer;
}

.item-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.item-quantity {
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
}

.sustainable-badge {
  color: #27ae60;
  font-size: 0.8rem;
}

.text-decoration-line-through {
  text-decoration: line-through !important;
}

.opacity-50 {
  opacity: 0.5 !important;
}

.sustainable-alternatives {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #27ae60;
}

.alternative-item {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e9ecef;
}

.alternative-info {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.alternative-benefit {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
}

.search-box input {
  border-radius: 20px;
  border: 1px solid #e9ecef;
  padding: 0.5rem 1rem;
}

.search-box input:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 0.2rem rgba(39, 174, 96, 0.25);
}

.form-select:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 0.2rem rgba(39, 174, 96, 0.25);
}

.btn-success {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  border: none;
}

.btn-success:hover {
  background: linear-gradient(135deg, #229954 0%, #27ae60 100%);
  transform: translateY(-1px);
}

.btn-outline-success {
  border-color: #27ae60;
  color: #27ae60;
}

.btn-outline-success:hover {
  background-color: #27ae60;
  border-color: #27ae60;
  transform: translateY(-1px);
}

.btn-outline-danger:hover {
  transform: translateY(-1px);
}

/* Custom scrollbar */
.meal-grid::-webkit-scrollbar,
.shopping-items::-webkit-scrollbar,
.alternatives-list::-webkit-scrollbar,
.meals-container::-webkit-scrollbar {
  width: 6px;
}

.meal-grid::-webkit-scrollbar-track,
.shopping-items::-webkit-scrollbar-track,
.alternatives-list::-webkit-scrollbar-track,
.meals-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.meal-grid::-webkit-scrollbar-thumb,
.shopping-items::-webkit-scrollbar-thumb,
.alternatives-list::-webkit-scrollbar-thumb,
.meals-container::-webkit-scrollbar-thumb {
  background: #27ae60;
  border-radius: 3px;
}

.meal-grid::-webkit-scrollbar-thumb:hover,
.shopping-items::-webkit-scrollbar-thumb:hover,
.alternatives-list::-webkit-scrollbar-thumb:hover,
.meals-container::-webkit-scrollbar-thumb:hover {
  background: #229954;
}
</style>
