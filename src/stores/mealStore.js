/**
 * Meal Store - Centralized state management for meal planning
 * Handles meal plans, shopping lists, and meal library
 */

import { defineStore } from "pinia";
import { storageService } from "@/services/storage.js";
import { errorHandler } from "@/services/errorHandler.js";

export const useMealStore = defineStore("meals", {
  state: () => ({
    // Current week and date selection
    currentWeek: new Date(),
    selectedDate: new Date().toISOString().split("T")[0],

    // Meal planning data
    weeklyMeals: {},
    purchasedItems: new Set(),

    // Meal library and search
    mealLibrary: [
      {
        id: 1,
        name: "Avocado Toast",
        category: "Breakfast",
        icon: "fas fa-bread-slice",
        tags: ["Quick", "Healthy"],
        sustainable: true,
        ingredients: [
          { name: "Bread", quantity: "2 slices", inPantry: false },
          { name: "Avocado", quantity: "1 medium", inPantry: false },
          { name: "Lemon", quantity: "1/2", inPantry: true },
          { name: "Salt", quantity: "pinch", inPantry: true },
        ],
      },
      {
        id: 2,
        name: "Quinoa Buddha Bowl",
        category: "Lunch",
        icon: "fas fa-seedling",
        tags: ["Vegetarian", "Healthy"],
        sustainable: true,
        ingredients: [
          { name: "Quinoa", quantity: "1 cup", inPantry: false },
          { name: "Chickpeas", quantity: "1/2 can", inPantry: true },
          { name: "Spinach", quantity: "2 cups", inPantry: false },
          { name: "Tahini", quantity: "2 tbsp", inPantry: true },
        ],
      },
      {
        id: 3,
        name: "Lentil Curry",
        category: "Dinner",
        icon: "fas fa-pepper-hot",
        tags: ["Vegan", "Healthy"],
        sustainable: true,
        ingredients: [
          { name: "Lentils", quantity: "1 cup", inPantry: false },
          { name: "Coconut Milk", quantity: "1 can", inPantry: false },
          { name: "Onion", quantity: "1 medium", inPantry: true },
          { name: "Garlic", quantity: "3 cloves", inPantry: true },
          { name: "Curry Powder", quantity: "2 tbsp", inPantry: true },
        ],
      },
      {
        id: 4,
        name: "Greek Salad",
        category: "Lunch",
        icon: "fas fa-leaf",
        tags: ["Healthy", "Quick"],
        sustainable: true,
        ingredients: [
          { name: "Tomatoes", quantity: "2 medium", inPantry: false },
          { name: "Cucumber", quantity: "1 large", inPantry: false },
          { name: "Feta Cheese", quantity: "100g", inPantry: false },
          { name: "Olives", quantity: "1/2 cup", inPantry: true },
          { name: "Olive Oil", quantity: "3 tbsp", inPantry: true },
        ],
      },
      {
        id: 5,
        name: "Chicken Stir Fry",
        category: "Dinner",
        icon: "fas fa-drumstick-bite",
        tags: ["Quick"],
        sustainable: false,
        ingredients: [
          { name: "Chicken Breast", quantity: "300g", inPantry: false },
          { name: "Broccoli", quantity: "2 cups", inPantry: false },
          { name: "Bell Peppers", quantity: "2 medium", inPantry: false },
          { name: "Soy Sauce", quantity: "3 tbsp", inPantry: true },
          { name: "Ginger", quantity: "1 inch", inPantry: true },
        ],
      },
      {
        id: 6,
        name: "Overnight Oats",
        category: "Breakfast",
        icon: "fas fa-bowl-food",
        tags: ["Healthy", "Quick"],
        sustainable: true,
        ingredients: [
          { name: "Oats", quantity: "1/2 cup", inPantry: false },
          { name: "Almond Milk", quantity: "1 cup", inPantry: false },
          { name: "Chia Seeds", quantity: "1 tbsp", inPantry: true },
          { name: "Honey", quantity: "1 tbsp", inPantry: true },
          { name: "Berries", quantity: "1/2 cup", inPantry: false },
        ],
      },
    ],

    // Search and filter state
    searchQuery: "",
    selectedCategory: null,

    // Categories
    mealCategories: [
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snacks",
      "Vegetarian",
      "Vegan",
      "Quick",
      "Healthy",
    ],

    // Loading states
    isLoading: false,
    isSaving: false,
  }),

  getters: {
    // Get meals for a specific date
    getMealsForDate: (state) => (date) => {
      const dateString = date.toISOString().split("T")[0];
      return (
        state.weeklyMeals[dateString] || {
          breakfast: [],
          lunch: [],
          dinner: [],
        }
      );
    },

    // Get week days for current week
    weekDays: (state) => {
      const startOfWeek = new Date(state.currentWeek);
      startOfWeek.setDate(
        state.currentWeek.getDate() - state.currentWeek.getDay(),
      );

      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return {
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          dateNumber: date.getDate(),
          fullDate: new Date(date),
          date: date,
        };
      });
    },

    // Current week range display
    currentWeekRange: (state) => {
      const startOfWeek = new Date(state.currentWeek);
      startOfWeek.setDate(
        state.currentWeek.getDate() - state.currentWeek.getDay(),
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    },

    // Filtered meals based on search and category
    filteredMeals: (state) => {
      let filtered = state.mealLibrary;

      if (state.searchQuery) {
        filtered = filtered.filter((meal) =>
          meal.name.toLowerCase().includes(state.searchQuery.toLowerCase()),
        );
      }

      if (state.selectedCategory) {
        filtered = filtered.filter(
          (meal) =>
            meal.category === state.selectedCategory ||
            meal.tags.includes(state.selectedCategory),
        );
      }

      return filtered;
    },

    // Computed shopping list
    computedShoppingList: (state) => {
      const alternatives = [];

      // Check if there are any meals at all
      let hasAnyMeals = false;
      const startOfWeek = new Date(state.currentWeek);
      startOfWeek.setDate(
        state.currentWeek.getDate() - state.currentWeek.getDay(),
      );
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
      });

      for (const date of weekDates) {
        const dateString = date.toISOString().split("T")[0];
        const dayMeals = state.weeklyMeals[dateString] || {
          breakfast: [],
          lunch: [],
          dinner: [],
        };
        for (const mealType of ["breakfast", "lunch", "dinner"]) {
          const mealArray = dayMeals[mealType];
          if (Array.isArray(mealArray) && mealArray.length > 0) {
            hasAnyMeals = true;
            break;
          }
        }
        if (hasAnyMeals) break;
      }

      // If no meals, return empty arrays
      if (!hasAnyMeals) {
        return { ingredients: [], alternatives: [] };
      }

      const ingredientMap = new Map();

      // Collect all ingredients from planned meals for current week
      for (const date of weekDates) {
        const dateString = date.toISOString().split("T")[0];
        const dayMeals = state.weeklyMeals[dateString] || {
          breakfast: [],
          lunch: [],
          dinner: [],
        };
        for (const mealType of ["breakfast", "lunch", "dinner"]) {
          const mealArray = dayMeals[mealType];
          if (Array.isArray(mealArray) && mealArray.length > 0) {
            mealArray.forEach((meal) => {
              if (meal && meal.ingredients) {
                meal.ingredients.forEach((ingredient) => {
                  if (!ingredient.inPantry) {
                    const ingredientName = ingredient.name;
                    const quantityStr = ingredient.quantity;

                    // Parse quantity more intelligently
                    let ingredientQty = 1;
                    let unit = "";

                    // Handle different quantity formats
                    if (quantityStr.includes("/")) {
                      // Handle fractions like "1/2"
                      const parts = quantityStr.split(" ");
                      const fraction = parts[0];
                      if (fraction.includes("/")) {
                        const [numerator, denominator] = fraction.split("/");
                        ingredientQty =
                          parseFloat(numerator) / parseFloat(denominator);
                      } else {
                        ingredientQty = parseFloat(fraction);
                      }
                      unit = parts[1] || "";
                    } else {
                      // Handle regular numbers like "2 slices"
                      const parts = quantityStr.split(" ");
                      ingredientQty = parseFloat(parts[0]) || 1;
                      unit = parts.slice(1).join(" ") || "";
                    }

                    if (ingredientMap.has(ingredientName)) {
                      // Add to existing quantity
                      const existing = ingredientMap.get(ingredientName);
                      existing.quantity += ingredientQty;
                    } else {
                      // Add new ingredient
                      ingredientMap.set(ingredientName, {
                        name: ingredientName,
                        quantity: ingredientQty,
                        unit: unit,
                        sustainable: meal.sustainable,
                        purchased: state.purchasedItems.has(ingredientName),
                      });
                    }
                  }
                });
              }
            });
          }
        }
      }

      // Convert map to array for display
      const allIngredients = Array.from(ingredientMap.values()).map((item) => {
        // Format quantity nicely
        let displayQuantity = item.quantity.toString();
        if (item.quantity % 1 !== 0) {
          // Handle decimals nicely
          if (item.quantity === 0.5) {
            displayQuantity = "1/2";
          } else if (item.quantity === 0.25) {
            displayQuantity = "1/4";
          } else if (item.quantity === 0.75) {
            displayQuantity = "3/4";
          } else {
            displayQuantity = item.quantity.toFixed(1);
          }
        }

        return {
          name: item.name,
          quantity: `${displayQuantity} ${item.unit}`.trim(),
          sustainable: item.sustainable,
          purchased: item.purchased,
        };
      });

      // Generate sustainable alternatives
      allIngredients.forEach((ingredient) => {
        if (!ingredient.sustainable) {
          const alternative = getSustainableAlternative(ingredient.name);
          if (alternative) {
            alternatives.push(alternative);
          }
        }
      });

      return { ingredients: allIngredients, alternatives: alternatives };
    },
  },

  actions: {
    // Initialize store with saved data
    async initializeStore() {
      try {
        this.isLoading = true;

        // Load saved meal plan
        const savedMealPlan = storageService.loadMealPlan();
        if (savedMealPlan && Object.keys(savedMealPlan).length > 0) {
          this.weeklyMeals = savedMealPlan;
        }

        // Load saved shopping list
        const savedShoppingList = storageService.loadShoppingList();
        if (savedShoppingList && savedShoppingList.length > 0) {
          this.purchasedItems = new Set(savedShoppingList);
        }

        // Load saved meal library
        const savedMealLibrary = storageService.loadMealLibrary();
        if (savedMealLibrary && savedMealLibrary.length > 0) {
          this.mealLibrary = savedMealLibrary;
        }
      } catch (error) {
        errorHandler.logError(error, "initializeStore");
        errorHandler.showError("Failed to load saved data. Starting fresh.");
      } finally {
        this.isLoading = false;
      }
    },

    // Save all data to storage
    async saveAllData() {
      try {
        this.isSaving = true;

        const mealPlanSaved = storageService.saveMealPlan(this.weeklyMeals);
        const shoppingListSaved = storageService.saveShoppingList(
          Array.from(this.purchasedItems),
        );
        const mealLibrarySaved = storageService.saveMealLibrary(
          this.mealLibrary,
        );

        if (!mealPlanSaved || !shoppingListSaved || !mealLibrarySaved) {
          throw new Error("Failed to save some data");
        }
      } catch (error) {
        errorHandler.logError(error, "saveAllData");
        errorHandler.showError("Failed to save data. Please try again.");
      } finally {
        this.isSaving = false;
      }
    },

    // Week navigation
    previousWeek() {
      this.currentWeek = new Date(
        this.currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000,
      );
    },

    nextWeek() {
      this.currentWeek = new Date(
        this.currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
    },

    goToDate(date) {
      if (date) {
        const targetDate = new Date(date);
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        this.currentWeek = startOfWeek;
        this.selectedDate = date;
      }
    },

    // Meal management
    addMeal(meal, date, mealType) {
      try {
        const dateString = date.toISOString().split("T")[0];

        if (!this.weeklyMeals[dateString]) {
          this.weeklyMeals[dateString] = {
            breakfast: [],
            lunch: [],
            dinner: [],
          };
        }

        if (!this.weeklyMeals[dateString][mealType]) {
          this.weeklyMeals[dateString][mealType] = [];
        }

        // Create a deep copy to avoid reference issues
        const mealCopy = JSON.parse(JSON.stringify(meal));
        this.weeklyMeals[dateString][mealType].push(mealCopy);

        // Auto-save
        this.saveAllData();
      } catch (error) {
        errorHandler.logError(error, "addMeal");
        errorHandler.showError("Failed to add meal. Please try again.");
      }
    },

    removeMeal(date, mealType, mealIndex) {
      try {
        const dateString = date.toISOString().split("T")[0];

        if (
          this.weeklyMeals[dateString] &&
          this.weeklyMeals[dateString][mealType]
        ) {
          this.weeklyMeals[dateString][mealType].splice(mealIndex, 1);

          // Auto-save
          this.saveAllData();
        }
      } catch (error) {
        errorHandler.logError(error, "removeMeal");
        errorHandler.showError("Failed to remove meal. Please try again.");
      }
    },

    moveMeal(fromDate, fromMealType, fromIndex, toDate, toMealType) {
      try {
        const fromDateString = fromDate.toISOString().split("T")[0];
        const toDateString = toDate.toISOString().split("T")[0];

        if (fromDateString !== toDateString || fromMealType !== toMealType) {
          // Get the meal to move
          const meal =
            this.weeklyMeals[fromDateString][fromMealType][fromIndex];

          // Remove from original location
          this.removeMeal(fromDate, fromMealType, fromIndex);

          // Add to new location
          this.addMeal(meal, toDate, toMealType);
        }
      } catch (error) {
        errorHandler.logError(error, "moveMeal");
        errorHandler.showError("Failed to move meal. Please try again.");
      }
    },

    clearAllMeals() {
      try {
        this.weeklyMeals = {};
        this.purchasedItems.clear();
        this.saveAllData();
        errorHandler.showSuccess(
          "All meals and shopping list cleared successfully.",
        );
      } catch (error) {
        errorHandler.logError(error, "clearAllMeals");
        errorHandler.showError("Failed to clear all data. Please try again.");
      }
    },

    // Shopping list management
    toggleShoppingItem(ingredientName) {
      try {
        if (this.purchasedItems.has(ingredientName)) {
          this.purchasedItems.delete(ingredientName);
        } else {
          this.purchasedItems.add(ingredientName);
        }

        // Auto-save
        storageService.saveShoppingList(Array.from(this.purchasedItems));
      } catch (error) {
        errorHandler.logError(error, "toggleShoppingItem");
        errorHandler.showError(
          "Failed to update shopping item. Please try again.",
        );
      }
    },

    // Search and filter
    setSearchQuery(query) {
      this.searchQuery = query;
    },

    setSelectedCategory(category) {
      this.selectedCategory = category;
    },

    // Meal library management
    addMealToLibrary(meal) {
      try {
        const newMeal = {
          ...meal,
          id: Date.now(), // Simple ID generation
          category: meal.category || "Other",
          tags: meal.tags || [],
          sustainable: meal.sustainable || false,
          ingredients: meal.ingredients || [],
        };

        this.mealLibrary.push(newMeal);
        this.saveAllData();
        errorHandler.showSuccess("Meal added to library successfully.");
      } catch (error) {
        errorHandler.logError(error, "addMealToLibrary");
        errorHandler.showError(
          "Failed to add meal to library. Please try again.",
        );
      }
    },

    removeMealFromLibrary(mealId) {
      try {
        const index = this.mealLibrary.findIndex((meal) => meal.id === mealId);
        if (index > -1) {
          this.mealLibrary.splice(index, 1);
          this.saveAllData();
          errorHandler.showSuccess("Meal removed from library successfully.");
        }
      } catch (error) {
        errorHandler.logError(error, "removeMealFromLibrary");
        errorHandler.showError(
          "Failed to remove meal from library. Please try again.",
        );
      }
    },
  },
});

// Helper function for sustainable alternatives
function getSustainableAlternative(ingredient) {
  const alternatives = {
    "Chicken Breast": {
      original: "Chicken Breast",
      alternative: "Tempeh or Tofu",
      benefit: "Reduces carbon footprint by 80%",
    },
    Beef: {
      original: "Beef",
      alternative: "Lentils or Mushrooms",
      benefit: "Reduces water usage by 90%",
    },
    "Dairy Milk": {
      original: "Dairy Milk",
      alternative: "Oat Milk or Almond Milk",
      benefit: "Reduces greenhouse gas emissions by 60%",
    },
    Cheese: {
      original: "Cheese",
      alternative: "Nutritional Yeast or Cashew Cheese",
      benefit: "Reduces water usage by 85%",
    },
    Eggs: {
      original: "Eggs",
      alternative: "Chia Seeds or Flax Seeds",
      benefit: "Reduces animal suffering and carbon footprint",
    },
  };

  return alternatives[ingredient] || null;
}
