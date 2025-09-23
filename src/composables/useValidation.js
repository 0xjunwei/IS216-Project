/**
 * Validation composable for form inputs and data validation
 * Provides reusable validation functions and error messages
 */

export const useValidation = () => {
  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid email format
   */
  const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validates password strength
   * @param {string} password - Password to validate
   * @returns {boolean} - True if password meets requirements
   */
  const validatePassword = (password) => {
    if (!password) return false;
    return password.length >= 8;
  };

  /**
   * Validates meal object structure
   * @param {Object} meal - Meal object to validate
   * @returns {boolean} - True if meal is valid
   */
  const validateMeal = (meal) => {
    if (!meal || typeof meal !== "object") return false;
    return !!(meal.name && meal.ingredients?.length > 0);
  };

  /**
   * Validates ingredient object structure
   * @param {Object} ingredient - Ingredient object to validate
   * @returns {boolean} - True if ingredient is valid
   */
  const validateIngredient = (ingredient) => {
    if (!ingredient || typeof ingredient !== "object") return false;
    return !!(ingredient.name && ingredient.quantity);
  };

  /**
   * Gets email validation error message
   * @param {string} email - Email to validate
   * @returns {string|null} - Error message or null if valid
   */
  const getEmailError = (email) => {
    if (!email) return "Email is required";
    if (!validateEmail(email)) return "Please enter a valid email address";
    return null;
  };

  /**
   * Gets password validation error message
   * @param {string} password - Password to validate
   * @returns {string|null} - Error message or null if valid
   */
  const getPasswordError = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8)
      return "Password must be at least 8 characters long";
    return null;
  };

  /**
   * Gets confirm password validation error message
   * @param {string} password - Original password
   * @param {string} confirmPassword - Confirmation password
   * @returns {string|null} - Error message or null if valid
   */
  const getConfirmPasswordError = (password, confirmPassword) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  /**
   * Gets meal validation error message
   * @param {Object} meal - Meal object to validate
   * @returns {string|null} - Error message or null if valid
   */
  const getMealError = (meal) => {
    if (!meal) return "Meal is required";
    if (!meal.name) return "Meal name is required";
    if (!meal.ingredients || meal.ingredients.length === 0)
      return "At least one ingredient is required";
    return null;
  };

  /**
   * Validates all form fields and returns error object
   * @param {Object} formData - Form data to validate
   * @param {Object} rules - Validation rules to apply
   * @returns {Object} - Object containing validation errors
   */
  const validateForm = (formData, rules = {}) => {
    const errors = {};

    // Email validation
    if (rules.email && formData.email !== undefined) {
      const emailError = getEmailError(formData.email);
      if (emailError) errors.email = emailError;
    }

    // Password validation
    if (rules.password && formData.password !== undefined) {
      const passwordError = getPasswordError(formData.password);
      if (passwordError) errors.password = passwordError;
    }

    // Confirm password validation
    if (
      rules.confirmPassword &&
      formData.password &&
      formData.confirmPassword !== undefined
    ) {
      const confirmPasswordError = getConfirmPasswordError(
        formData.password,
        formData.confirmPassword,
      );
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    }

    // Meal validation
    if (rules.meal && formData.meal !== undefined) {
      const mealError = getMealError(formData.meal);
      if (mealError) errors.meal = mealError;
    }

    return errors;
  };

  /**
   * Checks if form has any validation errors
   * @param {Object} errors - Error object from validateForm
   * @returns {boolean} - True if form has errors
   */
  const hasErrors = (errors) => {
    return Object.keys(errors).length > 0;
  };

  /**
   * Clears all validation errors
   * @returns {Object} - Empty error object
   */
  const clearErrors = () => {
    return {};
  };

  return {
    // Validation functions
    validateEmail,
    validatePassword,
    validateMeal,
    validateIngredient,

    // Error message functions
    getEmailError,
    getPasswordError,
    getConfirmPasswordError,
    getMealError,

    // Form validation
    validateForm,
    hasErrors,
    clearErrors,
  };
};
