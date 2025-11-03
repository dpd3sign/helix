import {
  assert,
  assertEquals,
  assertGreater,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type EPEInput,
  type ExerciseRow,
  generatePlanPreview,
  type RecipeRow,
} from "./planner.ts";

const baseRecipes: RecipeRow[] = [
  {
    id: "recipe-1",
    name: "Tofu Power Bowl",
    kcal: 520,
    protein_g: 32,
    carbs_g: 58,
    fat_g: 18,
    diet_type: "vegan",
    allergens: [] as string[],
    ingredients: [],
    tags: { meal_type: "lunch", diet: ["vegan"], macro_focus: "balanced" },
  },
  {
    id: "recipe-2",
    name: "Chickpea Salad",
    kcal: 430,
    protein_g: 22,
    carbs_g: 55,
    fat_g: 12,
    diet_type: "vegetarian",
    allergens: [] as string[],
    ingredients: [],
    tags: {
      meal_type: "dinner",
      diet: ["vegetarian"],
      macro_focus: "balanced",
    },
  },
  {
    id: "recipe-3",
    name: "Berry Smoothie",
    kcal: 300,
    protein_g: 26,
    carbs_g: 35,
    fat_g: 5,
    diet_type: "vegetarian",
    allergens: [] as string[],
    ingredients: [],
    tags: { meal_type: "snack", macro_focus: "high_protein" },
  },
  {
    id: "recipe-4",
    name: "Quinoa Breakfast",
    kcal: 410,
    protein_g: 24,
    carbs_g: 52,
    fat_g: 11,
    diet_type: "vegan",
    allergens: [] as string[],
    ingredients: [],
    tags: { meal_type: "breakfast", macro_focus: "balanced" },
  },
  {
    id: "recipe-5",
    name: "Lentil Stew",
    kcal: 460,
    protein_g: 24,
    carbs_g: 60,
    fat_g: 10,
    diet_type: "vegan",
    allergens: [] as string[],
    ingredients: [],
    tags: { meal_type: "dinner", macro_focus: "carb_forward" },
  },
];

const baseExercises: ExerciseRow[] = [
  {
    id: "ex-1",
    name: "Goblet Squat",
    description: null,
    tags: {
      equipment: ["dumbbells"],
      pattern: ["squat"],
      complexity: "beginner",
    },
  },
  {
    id: "ex-2",
    name: "Dumbbell RDL",
    description: null,
    tags: {
      equipment: ["dumbbells"],
      pattern: ["hinge"],
      complexity: "beginner",
    },
  },
  {
    id: "ex-3",
    name: "Band Row",
    description: null,
    tags: { equipment: ["bands"], pattern: ["pull"], complexity: "beginner" },
  },
  {
    id: "ex-4",
    name: "Tempo Push-Up",
    description: null,
    tags: {
      equipment: ["bodyweight"],
      pattern: ["push"],
      complexity: "beginner",
    },
  },
  {
    id: "ex-5",
    name: "Plank",
    description: null,
    tags: {
      equipment: ["bodyweight"],
      pattern: ["core"],
      complexity: "beginner",
    },
  },
  {
    id: "ex-6",
    name: "Barbell Back Squat",
    description: null,
    tags: {
      equipment: ["barbell", "rack"],
      pattern: ["squat"],
      complexity: "intermediate",
    },
  },
  {
    id: "ex-7",
    name: "Bench Press",
    description: null,
    tags: {
      equipment: ["barbell", "bench"],
      pattern: ["push"],
      complexity: "intermediate",
    },
  },
  {
    id: "ex-8",
    name: "Lat Pulldown",
    description: null,
    tags: {
      equipment: ["cable", "gym"],
      pattern: ["pull"],
      complexity: "beginner",
    },
  },
];

Deno.test("EPE fat loss preview respects diet, equipment, and explanations", async () => {
  const input: EPEInput = {
    user_id: "user-fatloss",
    sex: "male",
    dob: "1990-05-04",
    height_cm: 180,
    weight_kg: 86,
    body_fat_pct: 17,
    training_age: "new",
    activity_level: "moderate",
    equipment: ["dumbbells", "bands", "bodyweight"],
    primary_goal: "fat_loss",
    goal_duration_weeks: 12,
    weekly_change_rate: -0.4,
    diet_type: "vegetarian",
    allergies: [],
    restricted_foods: [],
    preferred_foods: [],
    training_days_per_week: 4,
    session_length_min: 40,
    recent_metrics: { steps: 4200, hrv_rmssd: 38, sleep_score: 68 },
    stress_baseline: 3,
    motivation_baseline: 2,
  };

  const plan = await generatePlanPreview(input, baseRecipes, baseExercises);
  assertEquals(plan.week.length, 7);
  assert(plan.explanations.length >= 3);
  assert(plan.macros.protein_g >= Math.round(2.1 * input.weight_kg));

  plan.week.forEach((day, index) => {
    day.meals.forEach((meal) => {
      assert(
        ["breakfast", "lunch", "snack", "dinner"].includes(meal.meal_type),
      );
      assertGreater(meal.kcal, 0);
    });
    if (index < input.training_days_per_week) {
      assert(day.workouts.length > 0);
      day.workouts.forEach((workout) => {
        workout.blocks.forEach((block) => {
          block.exercises.forEach((exercise) => {
            const match = baseExercises.find((ex) =>
              ex.id === exercise.exercise_id
            );
            assert(match, "exercise exists in pool");
            if (match?.tags?.equipment) {
              const equipment = match.tags.equipment as string[];
              assert(
                equipment.some((tool) =>
                  input.equipment.includes(tool) || tool === "bodyweight"
                ),
                "exercise matches available equipment",
              );
            }
          });
        });
      });
    }
  });
});

Deno.test("EPE muscle gain preview scales calories and uses gym equipment", async () => {
  const input: EPEInput = {
    user_id: "user-muscle",
    sex: "male",
    dob: "1985-03-10",
    height_cm: 183,
    weight_kg: 88,
    body_fat_pct: 15,
    training_age: "3y+",
    activity_level: "high",
    equipment: ["barbell", "bench", "rack", "cable", "gym", "dumbbells"],
    primary_goal: "muscle_gain",
    goal_duration_weeks: 16,
    diet_type: "omnivore",
    allergies: [],
    restricted_foods: [],
    preferred_foods: [],
    training_days_per_week: 5,
    session_length_min: 70,
    recent_metrics: { steps: 9000, hrv_rmssd: 75, sleep_score: 82 },
    stress_baseline: 2,
    motivation_baseline: 4,
  };

  const plan = await generatePlanPreview(input, baseRecipes, baseExercises);
  assertEquals(plan.week.length, 7);
  assert(plan.macros.kcal_target > 2600);
  assert(plan.explanations.some((msg) => msg.toLowerCase().includes("muscle")));

  const trainingDays = plan.week.filter((day) => day.focus === "train");
  assertEquals(trainingDays.length, input.training_days_per_week);
  trainingDays.forEach((day) => {
    assert(day.workouts.length > 0);
    day.workouts.forEach((workout) => {
      assertEquals(workout.intensity, "progressive");
      assertGreater(workout.blocks[0]?.exercises.length ?? 0, 0);
    });
  });
});
