<template>
  <div class="container mt-4">
    <h1>Smart Recipe Suggestions</h1>
    <input v-model="query" class="form-control mb-2" placeholder="Enter pantry items" />
    <button @click="fetchRecipes" class="btn btn-primary">Find Recipes</button>

    <div v-if="recipes.length" class="mt-4">
      <h3>Suggested Recipes</h3>
      <div v-for="r in recipes" :key="r.id" class="card my-2 p-3">
        <h4>{{ r.title }}</h4>
        <img :src="r.image" class="img-fluid" style="max-width:200px;" />
        <p>Nutrition Score: {{ r.nutritionScore }}</p>
        <p>Sustainability Score: {{ r.sustainabilityScore }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')
const recipes = ref([])

async function fetchRecipes() {
  const apiKey = "YOUR_SPOONACULAR_KEY"
  const res = await fetch(
    `https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${query.value}&addRecipeNutrition=true&number=5&apiKey=${apiKey}`
  )
  const data = await res.json()
  recipes.value = data.results.map(r => ({
    ...r,
    nutritionScore: r.healthScore || "N/A",
    sustainabilityScore: Math.floor(Math.random() * 100) // temporary
  }))
}
</script>
