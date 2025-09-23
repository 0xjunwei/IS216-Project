import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import MealCard from '../meal-planner/MealCard.vue'

// Mock the composable
vi.mock('@/composables/useDragAndDrop.js', () => ({
  useDragAndDrop: () => ({
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
  }),
}))

describe('MealCard', () => {
  const mockMeal = {
    name: 'Test Meal',
    sustainable: true,
  }

  const defaultProps = {
    meal: mockMeal,
    mealType: 'breakfast',
    mealIndex: 0,
    date: new Date('2024-01-01'),
    dayIndex: 0,
  }

  it('renders meal name correctly', () => {
    const wrapper = mount(MealCard, {
      props: defaultProps,
    })
    expect(wrapper.text()).toContain('Test Meal')
  })

  it('shows sustainable indicator when meal is sustainable', () => {
    const wrapper = mount(MealCard, {
      props: defaultProps,
    })
    expect(wrapper.find('.sustainable-indicator').exists()).toBe(true)
  })

  it('does not show sustainable indicator when meal is not sustainable', () => {
    const nonSustainableMeal = { ...mockMeal, sustainable: false }
    const wrapper = mount(MealCard, {
      props: { ...defaultProps, meal: nonSustainableMeal },
    })
    expect(wrapper.find('.sustainable-indicator').exists()).toBe(false)
  })

  it('emits drag-meal event on drag start', async () => {
    const wrapper = mount(MealCard, {
      props: defaultProps,
    })
    
    await wrapper.trigger('dragstart')
    
    expect(wrapper.emitted('drag-meal')).toBeTruthy()
    expect(wrapper.emitted('drag-meal')[0]).toHaveLength(5)
  })

  it('emits remove-meal event when remove button is clicked', async () => {
    const wrapper = mount(MealCard, {
      props: defaultProps,
    })
    
    await wrapper.find('.btn-remove').trigger('click')
    
    expect(wrapper.emitted('remove-meal')).toBeTruthy()
    expect(wrapper.emitted('remove-meal')[0]).toEqual([
      defaultProps.date,
      defaultProps.mealType,
      defaultProps.mealIndex,
    ])
  })

  it('has correct draggable attribute', () => {
    const wrapper = mount(MealCard, {
      props: defaultProps,
    })
    expect(wrapper.attributes('draggable')).toBe('true')
  })
})
