/**
 * Storage service for persistent data management
 * Handles localStorage operations with error handling and data validation
 */

export const storageService = {
  // Storage keys
  KEYS: {
    MEAL_PLAN: "ecoeats_meal_plan",
    USER_PREFERENCES: "ecoeats_preferences",
    AUTH_STATE: "ecoeats_auth",
    SHOPPING_LIST: "ecoeats_shopping_list",
    MEAL_LIBRARY: "ecoeats_meal_library",
  },

  /**
   * Generic save function with error handling
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @returns {boolean} - Success status
   */
  _save: (key, data) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`Failed to save data for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Generic load function with error handling
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if loading fails
   * @returns {any} - Loaded data or default value
   */
  _load: (key, defaultValue = null) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Failed to load data for key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Generic clear function
   * @param {string} key - Storage key
   * @returns {boolean} - Success status
   */
  _clear: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to clear data for key "${key}":`, error);
      return false;
    }
  },

  // Meal Plan Management
  /**
   * Save meal plan data
   * @param {Object} mealPlan - Meal plan object
   * @returns {boolean} - Success status
   */
  saveMealPlan: (mealPlan) => {
    if (!mealPlan || typeof mealPlan !== "object") {
      console.error("Invalid meal plan data provided");
      return false;
    }
    return storageService._save(storageService.KEYS.MEAL_PLAN, mealPlan);
  },

  /**
   * Load meal plan data
   * @returns {Object} - Meal plan object or empty object
   */
  loadMealPlan: () => {
    return storageService._load(storageService.KEYS.MEAL_PLAN, {});
  },

  /**
   * Clear meal plan data
   * @returns {boolean} - Success status
   */
  clearMealPlan: () => {
    return storageService._clear(storageService.KEYS.MEAL_PLAN);
  },

  // User Preferences Management
  /**
   * Save user preferences
   * @param {Object} preferences - User preferences object
   * @returns {boolean} - Success status
   */
  saveUserPreferences: (preferences) => {
    if (!preferences || typeof preferences !== "object") {
      console.error("Invalid preferences data provided");
      return false;
    }
    return storageService._save(
      storageService.KEYS.USER_PREFERENCES,
      preferences,
    );
  },

  /**
   * Load user preferences
   * @returns {Object} - User preferences object or empty object
   */
  loadUserPreferences: () => {
    return storageService._load(storageService.KEYS.USER_PREFERENCES, {});
  },

  /**
   * Clear user preferences
   * @returns {boolean} - Success status
   */
  clearUserPreferences: () => {
    return storageService._clear(storageService.KEYS.USER_PREFERENCES);
  },

  // Authentication State Management
  /**
   * Save authentication state
   * @param {Object} authData - Authentication data object
   * @returns {boolean} - Success status
   */
  saveAuthState: (authData) => {
    if (!authData || typeof authData !== "object") {
      console.error("Invalid auth data provided");
      return false;
    }

    // Add timestamp for session management
    const authWithTimestamp = {
      ...authData,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    return storageService._save(
      storageService.KEYS.AUTH_STATE,
      authWithTimestamp,
    );
  },

  /**
   * Load authentication state
   * @returns {Object|null} - Authentication data or null if expired/invalid
   */
  loadAuthState: () => {
    const authData = storageService._load(storageService.KEYS.AUTH_STATE, null);

    if (!authData) return null;

    // Check if session has expired
    if (authData.expiresAt && new Date(authData.expiresAt) < new Date()) {
      console.log("Auth session expired, clearing data");
      storageService.clearAuthState();
      return null;
    }

    return authData;
  },

  /**
   * Clear authentication state
   * @returns {boolean} - Success status
   */
  clearAuthState: () => {
    return storageService._clear(storageService.KEYS.AUTH_STATE);
  },

  // Shopping List Management
  /**
   * Save shopping list data
   * @param {Array} shoppingList - Shopping list array
   * @returns {boolean} - Success status
   */
  saveShoppingList: (shoppingList) => {
    if (!Array.isArray(shoppingList)) {
      console.error("Invalid shopping list data provided");
      return false;
    }
    return storageService._save(
      storageService.KEYS.SHOPPING_LIST,
      shoppingList,
    );
  },

  /**
   * Load shopping list data
   * @returns {Array} - Shopping list array or empty array
   */
  loadShoppingList: () => {
    return storageService._load(storageService.KEYS.SHOPPING_LIST, []);
  },

  /**
   * Clear shopping list data
   * @returns {boolean} - Success status
   */
  clearShoppingList: () => {
    return storageService._clear(storageService.KEYS.SHOPPING_LIST);
  },

  // Meal Library Management
  /**
   * Save meal library data
   * @param {Array} mealLibrary - Meal library array
   * @returns {boolean} - Success status
   */
  saveMealLibrary: (mealLibrary) => {
    if (!Array.isArray(mealLibrary)) {
      console.error("Invalid meal library data provided");
      return false;
    }
    return storageService._save(storageService.KEYS.MEAL_LIBRARY, mealLibrary);
  },

  /**
   * Load meal library data
   * @returns {Array} - Meal library array or empty array
   */
  loadMealLibrary: () => {
    return storageService._load(storageService.KEYS.MEAL_LIBRARY, []);
  },

  /**
   * Clear meal library data
   * @returns {boolean} - Success status
   */
  clearMealLibrary: () => {
    return storageService._clear(storageService.KEYS.MEAL_LIBRARY);
  },

  // Utility Functions
  /**
   * Clear all application data
   * @returns {boolean} - Success status
   */
  clearAllData: () => {
    try {
      const keys = Object.values(storageService.KEYS);
      keys.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return false;
    }
  },

  /**
   * Get storage usage information
   * @returns {Object} - Storage usage statistics
   */
  getStorageInfo: () => {
    try {
      let totalSize = 0;
      const keySizes = {};

      Object.entries(storageService.KEYS).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        keySizes[name] = size;
        totalSize += size;
      });

      return {
        totalSize,
        keySizes,
        totalKeys: Object.keys(storageService.KEYS).length,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return { totalSize: 0, keySizes: {}, totalKeys: 0 };
    }
  },

  /**
   * Check if localStorage is available
   * @returns {boolean} - True if localStorage is available
   */
  isAvailable: () => {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error("localStorage is not available:", error);
      return false;
    }
  },
};
