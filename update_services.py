import os

services = {
    'frontend/src/services/analyticsService.js': (
        "const API_URL = 'http://localhost:3000/api/analytics'",
        "const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'\nconst API_URL = _BASE + '/analytics'"
    ),
    'frontend/src/services/donationService.js': (
        "const API_URL = 'http://localhost:3000/api/donations'",
        "const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'\nconst API_URL = _BASE + '/donations'"
    ),
    'frontend/src/services/inventoryService.js': (
        "const API_URL = 'http://localhost:3000/api/items'",
        "const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'\nconst API_URL = _BASE + '/items'"
    ),
    'frontend/src/services/mealPlanService.js': (
        "const API_URL = 'http://localhost:3000/api/meal-plan'",
        "const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'\nconst API_URL = _BASE + '/meal-plan'"
    ),
    'frontend/src/services/recipeService.js': (
        "const API_URL = 'http://localhost:3000/api/recipes'",
        "const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'\nconst API_URL = _BASE + '/recipes'"
    ),
}

for path, (old, new) in services.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new, 1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated: {path}')
    else:
        print(f'Skipped (not found): {path}')
