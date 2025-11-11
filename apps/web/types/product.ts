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
  priceDelta: number | null
  isDefault: boolean
}

