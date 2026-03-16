export interface NutritionFact {
  label: string
  value: string
}

export interface FlavorOption {
  id: string
  slug: string
  displayName: string
  description: string
  imageUrl: string
  ingredients: string[]
  allergens: string[]
  nutritionFacts: NutritionFact[]
  /** When set, show this preformatted block instead of nutritionFacts grid */
  nutritionText?: string
  priceDelta: number | null
  isDefault: boolean
}

