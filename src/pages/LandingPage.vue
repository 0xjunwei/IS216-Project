<template>
  <div class="min-vh-100 bg-gradient-landing">
    <section class="container py-5 py-lg-6">
      <div class="row align-items-center">
        <div class="col-lg-6 mb-4 mb-lg-0">
          <div class="badge bg-success-subtle text-success px-3 py-2 rounded-pill mb-4">
            {{ activeUserCount.toLocaleString() }}+ Active Users
          </div>
          <h1 class="display-2 fw-bold text-dark mb-4">
            Plan Your Meals<br />
            <span class="text-success">Reduce Food Waste</span>
          </h1>
          <p class="lead text-secondary mb-4">
            A simple app to help you plan meals and reduce food waste. Track what's in your pantry and get recipe suggestions.
          </p>
          <div class="d-flex flex-column flex-sm-row gap-3 mb-4">
            <button @click="handleButtonClick" class="btn btn-success btn-lg px-5 py-3 rounded-3 shadow-sm">
              {{ isLoggedIn ? "Let's get started!" : "Sign Up Now" }}
            </button>
          </div>
          
        </div>
        <div class="col-lg-6 position-relative">
          <div class="ratio ratio-16x9">
            <div class="bg-light rounded-4 shadow-lg d-flex align-items-center justify-content-center">
              <!-- searched via unsplash images, just took a random one to test-->
              <img src="https://images.unsplash.com/photo-1589010588553-46e8e7c21788" alt="Landing Page Image" class="img-fluid img-thumbnail">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Banner -->
    <section class="bg-success py-5">
      <div class="container">
        <div class="row g-4 text-center">
          <div class="col-6 col-md-3" v-for="(stat, index) in stats" :key="index">
            <div class="mb-2">
              <span class="display-4 fw-bold text-white">
                {{ stat.animatedValue }}{{ stat.suffix }}
              </span>
            </div>
            <div class="text-white-50 small">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose FoodSaver -->
    <section id="features" class="container py-5 py-lg-6">
      <div class="text-center mb-5">
        <h2 class="display-4 fw-bold text-dark mb-3">
          Features
        </h2>
        <p class="lead text-secondary max-width mx-auto">
          What you can do with FoodSaver
        </p>
      </div>

      <div class="row g-4">
        <div class="col-12 col-md-4" v-for="(feature, index) in features" :key="index">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body p-4 d-flex align-items-start gap-3">
              <div class="bg-success-subtle p-3 rounded-4 flex-shrink-0 feature-icon-container">
                <i :class="feature.icon" class="text-success feature-icon"></i>
              </div>
              <div class="flex-grow-1">
                <h3 class="h5 fw-bold text-dark mb-2">{{ feature.title }}</h3>
                <p class="text-secondary mb-0">
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sustainable Recipes Carousel -->
    <section id="recipes" class="bg-light py-5 py-lg-6">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="display-4 fw-bold text-dark mb-3">
            Recipes
          </h2>
          <p class="lead text-secondary mb-4">
            Browse recipes by category
          </p>
          
          <!-- Filter Buttons -->
          <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
            <button 
              v-for="filter in recipeFilters" 
              :key="filter.value"
              @click="setActiveFilter(filter.value)"
              class="btn rounded-pill px-4"
              :class="activeFilter === filter.value ? 'btn-success' : 'btn-outline-success'"
            >
              <i :class="filter.icon" class="me-2"></i>
              {{ filter.label }}
            </button>
          </div>
        </div>

        <div v-if="isLoadingRecipes" class="text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-secondary">Loading delicious recipes...</p>
        </div>

        <div v-else-if="recipes.length > 0" class="position-relative">
          <!-- Recipe Card -->
          <div class="card border-0 shadow-lg">
            <div class="row g-0">
              <!-- Recipe Image -->
              <div class="col-12 col-md-6">
                <div class="recipe-image-wrapper p-3 p-md-4 p-lg-5">
                  <div class="ratio ratio-16x9 bg-light position-relative">
                    <template v-if="recipes[currentRecipeIndex]?.image">
                      <img :src="recipes[currentRecipeIndex]?.image" 
                           :alt="recipes[currentRecipeIndex]?.title"
                           class="img-fluid object-fit-cover"
                           @error="handleImageError">
                    </template>
                    <template v-else>
                      <div class="d-flex align-items-center justify-content-center h-100">
                        <i class="bi bi-image text-muted placeholder-icon"></i>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              
              <!-- Recipe Details -->
              <div class="col-12 col-md-6">
                <div class="card-body p-3 p-md-4 p-lg-5">
                  <!-- Tags -->
                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <span v-for="tag in recipes[currentRecipeIndex]?.tags" 
                          :key="tag"
                          class="badge bg-success-subtle text-success">
                      {{ tag }}
                    </span>
                  </div>
                  
                  <!-- Title -->
                  <h3 class="h3 fw-bold text-dark mb-3">
                    {{ recipes[currentRecipeIndex]?.title }}
                  </h3>
                  
                  <!-- Description -->
                  <p class="text-secondary mb-4 small">
                    {{ recipes[currentRecipeIndex]?.description }}
                  </p>
                  
                  <!-- Info Boxes -->
                  <div class="row g-2 mb-4">
                    <div class="col-4">
                      <div class="text-center p-2 p-sm-3 bg-success-subtle rounded-2">
                        <div class="h5 h6-md h4-lg fw-bold text-success mb-1">
                          {{ recipes[currentRecipeIndex]?.prepTime }}m
                        </div>
                        <div class="small text-secondary">Prep</div>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="text-center p-2 p-sm-3 bg-success-subtle rounded-2">
                        <div class="h5 h6-md h4-lg fw-bold text-success mb-1">
                          {{ recipes[currentRecipeIndex]?.servings }}
                        </div>
                        <div class="small text-secondary">Serves</div>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="text-center p-2 p-sm-3 bg-success-subtle rounded-2">
                        <div class="h5 h6-md h4-lg fw-bold text-success mb-1">
                          {{ recipes[currentRecipeIndex]?.healthScore }}
                        </div>
                        <div class="small text-secondary">Health</div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    @click="viewFullRecipe"
                    class="btn btn-success w-100 py-2 rounded-3 fw-semibold"
                    :disabled="!recipes[currentRecipeIndex]?.sourceUrl"
                  >
                    <i class="bi bi-arrow-right me-2"></i>
                    View Full Recipe
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <template v-if="recipes.length > 1">
            <button 
              @click="prevRecipe"
              class="recipe-carousel-btn position-absolute start-0 top-50 translate-middle-y bg-white p-3 rounded-circle shadow-lg border-0 recipe-arrow recipe-arrow-left"
              type="button"
            >
              <i class="bi bi-chevron-left text-success fs-5"></i>
            </button>
            
            <button 
              @click="nextRecipe"
              class="recipe-carousel-btn position-absolute end-0 top-50 translate-middle-y bg-white p-3 rounded-circle shadow-lg border-0 recipe-arrow recipe-arrow-right"
              type="button"
            >
              <i class="bi bi-chevron-right text-success fs-5"></i>
            </button>
          </template>

          <!-- Carousel Dots -->
          <div v-if="recipes.length > 1" class="d-flex justify-content-center gap-2 mt-4">
            <button
              v-for="(recipe, index) in recipes"
              :key="recipe.id"
              @click="currentRecipeIndex = index"
              class="btn p-0 border-0 rounded-pill carousel-dot"
              :class="index === currentRecipeIndex ? 'bg-success' : 'bg-secondary'"
              type="button"
            ></button>
          </div>
        </div>
        
        <div v-else class="text-center py-5">
          <i class="bi bi-inbox text-muted placeholder-icon"></i>
          <p class="text-muted mt-3">No recipes available. Please try again later.</p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="container py-5 py-lg-6">
      <div class="text-center mb-5">
        <h2 class="display-4 fw-bold text-dark mb-3">
          How It Works
        </h2>
        <p class="lead text-secondary">
          How to use FoodSaver
        </p>
      </div>

      <div class="row g-4">
        <div class="col-md-4 text-center" v-for="(step, index) in steps" :key="index">
          <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 step-number">
            {{ step.number }}
          </div>
          <h3 class="h4 fw-bold text-dark mb-3">{{ step.title }}</h3>
          <p class="text-secondary">
            {{ step.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section id="testimonials" class="bg-light py-5 py-lg-6">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="display-4 fw-bold text-dark mb-3">
            User Reviews
          </h2>
          <p class="lead text-secondary">
            What users think about FoodSaver
          </p>
        </div>

        <div class="card border-0 shadow-lg max-width mx-auto">
          <div class="card-body p-4 p-md-5 text-center">
            <div class="mb-4">
              <span v-for="n in 5" :key="n" class="text-warning fs-4">★</span>
            </div>
            <p class="fs-5 text-secondary mb-4 fst-italic">
              "{{ testimonials[currentTestimonialIndex].text }}"
            </p>
            <div class="d-flex align-items-center justify-content-center gap-3">
              <div class="text-start">
                <div class="fw-bold text-dark">{{ testimonials[currentTestimonialIndex].name }}</div>
                <div class="text-secondary">{{ testimonials[currentTestimonialIndex].role }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Testimonial Dots -->
        <div class="d-flex justify-content-center gap-2 mt-4">
          <button
            v-for="(testimonial, index) in testimonials"
            :key="index"
            @click="currentTestimonialIndex = index"
            class="btn p-0 border-0 testimonial-dot"
            :class="index === currentTestimonialIndex ? 'bg-success' : 'bg-secondary'"
          ></button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { db, auth } from '../js/config.js'
import { collection, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const router = useRouter()

// Get API key from environment
const API_KEY = import.meta.env.VITE_SPOONACULAR_KEY
const statRefs = ref([])
const activeUserCount = ref(0)
const isLoggedIn = ref(false)

// Recipes state
const recipes = ref([])
const cachedRecipes = ref([])
const currentRecipeIndex = ref(0)
const isLoadingRecipes = ref(true)
const recipesError = ref(null)
const activeFilter = ref('all')
const recipesFetched = ref(false)

// Recipe filters
const recipeFilters = ref([
  { value: 'all', label: 'All Recipes', icon: 'bi bi-funnel-fill' },
  { value: 'vegetarian', label: 'Vegetarian', icon: 'bi bi-flower1' },
  { value: 'vegan', label: 'Vegan', icon: 'bi bi-leaf-fill' },
  { value: 'healthy', label: 'Healthy', icon: 'bi bi-heart-fill' }
])

// Placeholder images
const placeholderImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400'
]

// Testimonials
const testimonials = ref([
  {
    name: 'Rachael Tan',
    role: 'SMU Student',
    text: 'FoodSaver issa good!'
  },
  {
    name: 'Andrew Chen',
    role: 'SMU Student',
    text: 'Best app ever!'
  },
  {
    name: 'Benjamin Wong',
    role: 'SMU Student',
    text: 'Save money from eating in school, to meal prepping for school!'
  }
])
const currentTestimonialIndex = ref(0)

// Stats
const stats = ref([
  { value: 0, animatedValue: 0, targetValue: 0, suffix: '+', label: 'Active Users' },
  { value: 100, animatedValue: 100, targetValue: 100, suffix: '+', label: 'Meals Planned' },
  { value: 40, animatedValue: 40, targetValue: 40, suffix: '%', label: 'Food Waste Reduced' },
  { value: 5000, animatedValue: 5000 , targetValue: 5000, suffix: '+', label: 'Recipes' }
])

// Features
const features = ref([
  {
    icon: 'bi bi-clipboard-check fs-3',
    title: 'Meal Planning',
    description: 'Plan your meals based on what you have in your pantry and fridge.'
  },
  {
    icon: 'bi bi-piggy-bank fs-3',
    title: 'Save Money',
    description: 'Reduce food waste and save money by using ingredients you already have.'
  },
  {
    icon: 'bi bi-globe fs-3',
    title: 'Reduce Waste',
    description: 'Track your food items and get reminders before they expire.'
  },
  {
    icon: 'bi bi-book fs-3',
    title: 'Recipe Suggestions',
    description: 'Get recipe ideas based on ingredients you have available.'
  },
  {
    icon: 'bi bi-cart fs-3',
    title: 'Shopping Lists',
    description: 'Create shopping lists for ingredients you need to buy.'
  },
  {
    icon: 'bi bi-clock-history fs-3',
    title: 'Expiry Tracking',
    description: 'Keep track of when your food items expire so nothing goes to waste.'
  }
])

// Steps
const steps = ref([
  {
    number: 1,
    title: 'Add Your Ingredients',
    description: 'Add items from your fridge and pantry to track what you have'
  },
  {
    number: 2,
    title: 'Get Recipe Suggestions',
    description: 'Browse recipes based on ingredients you have available'
  },
  {
    number: 3,
    title: 'Plan Your Meals',
    description: 'Plan your meals and create shopping lists for what you need'
  }
])

let recipeInterval = null
let testimonialInterval = null
let authUnsubscribe = null

const fetchActiveUserCount = async () => {
  try {
    const usersCollection = collection(db, 'users')
    const snapshot = await getDocs(usersCollection)
    const userCount = snapshot.size
    
    activeUserCount.value = userCount
    stats.value[0].targetValue = userCount
    stats.value[0].value = userCount
    stats.value[0].animatedValue = 0
    
    animateStatsForIndex(0)
  } catch (error) {
    console.error('Error fetching user count:', error)
  }
}

const animateStatsForIndex = (index) => {
  const stat = stats.value[index]
  if (typeof stat.targetValue === 'number' && stat.targetValue > 0) {
    let currentValue = 0
    const increment = stat.targetValue / 30
    
    const interval = setInterval(() => {
      currentValue += increment
      
      if (currentValue >= stat.targetValue) {
        currentValue = stat.targetValue
        clearInterval(interval)
      }
      
      if (stat.label === 'Active Users' || stat.label === 'Recipes') {
        stat.animatedValue = Math.floor(currentValue).toLocaleString()
      } else {
        stat.animatedValue = Math.floor(currentValue)
      }
    }, 50)
  }
}

const animateStats = () => {
  stats.value.forEach((stat) => {
    if (typeof stat.targetValue === 'number' && stat.targetValue > 0) {
      let currentValue = 0
      const increment = stat.targetValue / 30
      
      const interval = setInterval(() => {
        currentValue += increment
        
        if (currentValue >= stat.targetValue) {
          currentValue = stat.targetValue
          clearInterval(interval)
        }
        
        if (stat.label === 'Active Users' || stat.label === 'Recipes') {
          stat.animatedValue = Math.floor(currentValue).toLocaleString()
        } else {
          stat.animatedValue = Math.floor(currentValue)
        }
      }, 50)
    }
  })
}

const getFallbackRecipes = () => {
  return [
    {
      id: 1,
      title: 'Zero-Waste Vegetable Stir Fry',
      image: placeholderImages[0],
      description: 'Use up leftover vegetables in this delicious, sustainable stir fry that reduces food waste.',
      prepTime: 20,
      servings: 4,
      healthScore: 92,
      tags: ['Vegetarian', 'Vegan', 'Quick'],
      vegetarian: true,
      vegan: true
    },
    {
      id: 2,
      title: 'Sustainable Lentil Curry',
      image: placeholderImages[1],
      description: 'A protein-rich, plant-based curry that\'s good for you and the planet.',
      prepTime: 35,
      servings: 6,
      healthScore: 88,
      tags: ['Vegan', 'Gluten-Free'],
      vegetarian: true,
      vegan: true
    },
    {
      id: 3,
      title: 'Healthy Quinoa Bowl',
      image: placeholderImages[2],
      description: 'A nutritious bowl packed with fresh vegetables and wholesome grains.',
      prepTime: 25,
      servings: 2,
      healthScore: 95,
      tags: ['Healthy', 'Vegetarian'],
      vegetarian: true,
      vegan: false
    },
    {
      id: 4,
      title: 'Green Goddess Salad',
      image: placeholderImages[0],
      description: 'Fresh and vibrant salad loaded with seasonal vegetables and herbs.',
      prepTime: 15,
      servings: 4,
      healthScore: 90,
      tags: ['Healthy', 'Vegetarian', 'Vegan'],
      vegetarian: true,
      vegan: true
    },
    {
      id: 5,
      title: 'Roasted Vegetable Medley',
      image: placeholderImages[1],
      description: 'Seasonal vegetables roasted to perfection with herbs and olive oil.',
      prepTime: 30,
      servings: 4,
      healthScore: 87,
      tags: ['Vegetarian', 'Vegan', 'Healthy'],
      vegetarian: true,
      vegan: true
    }
  ]
}

const filterRecipes = () => {
  if (!cachedRecipes.value || cachedRecipes.value.length === 0) {
    recipes.value = getFallbackRecipes()
    return
  }

  let filtered = []
  
  switch (activeFilter.value) {
    case 'vegetarian':
      filtered = cachedRecipes.value.filter(recipe => 
        recipe.vegetarian === true || recipe.tags?.some(tag => tag === 'Vegetarian')
      )
      break
    case 'vegan':
      filtered = cachedRecipes.value.filter(recipe => 
        recipe.vegan === true || recipe.tags?.some(tag => tag === 'Vegan')
      )
      break
    case 'healthy':
      filtered = cachedRecipes.value.filter(recipe => 
        recipe.healthScore >= 85 || recipe.tags?.some(tag => tag === 'Healthy')
      )
      break
    default:
      filtered = cachedRecipes.value
  }

  if (filtered.length === 0) {
    recipes.value = getFallbackRecipes()
  } else {
    recipes.value = filtered
  }
  
  currentRecipeIndex.value = 0
}

const setActiveFilter = (filterValue) => {
  activeFilter.value = filterValue
  filterRecipes()
}

const fetchRecipes = async () => {
  if (recipesFetched.value) {
    filterRecipes()
    return
  }

  recipesFetched.value = true

  if (!API_KEY) {
    cachedRecipes.value = getFallbackRecipes()
    filterRecipes()
    isLoadingRecipes.value = false
    return
  }

  try {
    isLoadingRecipes.value = true
    recipesError.value = null
    
    const url = 'https://api.spoonacular.com/recipes/random'
    const params = {
      number: 3,
      apiKey: API_KEY
    }
    
    const response = await axios.get(url, { params })
    const data = response.data
    
    if (data.status === 'failure' || data.message) {
      throw new Error(data.message || 'API error')
    }
    
    let recipesArray = null
    if (Array.isArray(data)) {
      recipesArray = data
    } else if (data.recipes && Array.isArray(data.recipes)) {
      recipesArray = data.recipes
    } else if (data.results && Array.isArray(data.results)) {
      recipesArray = data.results
    }
    
    if (!recipesArray || recipesArray.length === 0) {
      throw new Error('No recipes returned')
    }
    
    cachedRecipes.value = recipesArray.map((recipe, index) => ({
      id: recipe.id || index + 1000,
      title: recipe.title || 'Delicious Recipe',
      image: recipe.image || placeholderImages[index % placeholderImages.length],
      description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || 'A delicious sustainable recipe',
      prepTime: recipe.readyInMinutes || 30,
      servings: recipe.servings || 4,
      healthScore: recipe.healthScore || 85,
      vegetarian: recipe.vegetarian || false,
      vegan: recipe.vegan || false,
      sourceUrl: recipe.sourceUrl || recipe.spoonacularSourceUrl || null,
      tags: [
        recipe.vegetarian && 'Vegetarian',
        recipe.vegan && 'Vegan',
        recipe.glutenFree && 'Gluten-Free',
        recipe.dairyFree && 'Dairy-Free',
        recipe.healthScore >= 85 && 'Healthy'
      ].filter(Boolean)
    }))
    
    recipesError.value = null
    filterRecipes()
    
  } catch (error) {
    console.error('Error:', error)
    
    if (error.response) {
      const status = error.response.status
      if (status === 402) {
        recipesError.value = 'Quota exceeded'
      } else if (status === 429) {
        recipesError.value = 'Rate limit exceeded'
      } else {
        recipesError.value = `API error ${status}`
      }
    } else {
      recipesError.value = 'Failed to load recipes'
    }
    
    cachedRecipes.value = getFallbackRecipes()
    filterRecipes()
  } finally {
    isLoadingRecipes.value = false
  }
}

const nextRecipe = () => {
  if (recipes.value.length > 0) {
    currentRecipeIndex.value = (currentRecipeIndex.value + 1) % recipes.value.length
  }
}

const prevRecipe = () => {
  if (recipes.value.length > 0) {
    currentRecipeIndex.value = currentRecipeIndex.value === 0 
      ? recipes.value.length - 1 
      : currentRecipeIndex.value - 1
  }
}

const nextTestimonial = () => {
  currentTestimonialIndex.value = (currentTestimonialIndex.value + 1) % testimonials.value.length
}

const prevTestimonial = () => {
  currentTestimonialIndex.value = currentTestimonialIndex.value === 0 
    ? testimonials.value.length - 1 
    : currentTestimonialIndex.value - 1
}

function goToLogin() {
  router.push('/login')
}

function handleButtonClick() {
  if (isLoggedIn.value) {
    router.push('/dashboard')
  } else {
    router.push('/login')
  }
}

function viewFullRecipe() {
  const currentRecipe = recipes.value[currentRecipeIndex.value]
  if (currentRecipe?.sourceUrl) {
    window.open(currentRecipe.sourceUrl, '_blank', 'noopener,noreferrer')
  } else {
    // Fallback to recipes page if no URL available
    router.push('/recipe')
  }
}

const handleImageError = (event) => {
  console.error('Image failed to load:', event.target.src)
  event.target.style.display = 'none'
}

onMounted(async () => {
  // Check authentication status
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user
  })
  
  await fetchRecipes()
  fetchActiveUserCount()
  
  nextTick(() => {
    animateStats()
  })
  
  if (recipes.value.length > 1) {
    recipeInterval = setInterval(() => {
      nextRecipe()
    }, 5000)
  }
  
  testimonialInterval = setInterval(() => {
    nextTestimonial()
  }, 6000)
})

onUnmounted(() => {
  if (recipeInterval) clearInterval(recipeInterval)
  if (testimonialInterval) clearInterval(testimonialInterval)
  if (authUnsubscribe) authUnsubscribe()
})
</script>

<style scoped>
.max-width {
  max-width: 800px;
}

.object-fit-cover {
  object-fit: cover;
}

.bg-gradient-landing {
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
}

.feature-icon-container {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recipe-arrow-left {
  margin-left: -20px;
}

.recipe-arrow-right {
  margin-right: -20px;
}

.carousel-dot {
  width: 40px;
  height: 8px;
  border-radius: 4px;
}

.testimonial-dot {
  width: 40px;
  height: 8px;
  border-radius: 4px;
}

.step-number {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
}

.placeholder-icon {
  font-size: 4rem;
}

@media (max-width: 576px) {
  .recipe-carousel-btn {
    display: none !important;
  }
  
  .carousel-dot,
  .testimonial-dot {
    width: 30px !important;
    height: 6px !important;
  }
}
</style>

