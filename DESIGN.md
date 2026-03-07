# Design System Reference

## Color Palette
- **Primary**: Teal (teal-600 / teal-700) - buttons, accents, active states
- **Success**: Green-600 / Green-400 (dark)
- **Danger**: Red-600 / Red-400 (dark)
- **Warning**: Amber-600 / Amber-400 (dark)
- **Neutral surfaces**: white / gray-800 (dark)
- **Neutral borders**: gray-200 / gray-700 (dark)
- **Text primary**: gray-900 / white (dark)
- **Text secondary**: gray-500 / gray-400 (dark)
- **NEVER use**: purple, indigo, violet hues

## Typography
- **Headings**: font-semibold, text-gray-900 dark:text-white
- **Labels**: text-sm font-medium, text-gray-700 dark:text-gray-200
- **Body/values**: text-sm, text-gray-900 dark:text-white
- **Captions/helpers**: text-xs, text-gray-500 dark:text-gray-400
- **Max font weights**: 3 (normal, medium, semibold/bold)
- **Line spacing**: 150% body, 120% headings

## Spacing (8px system)
- **Form gap between fields**: gap-3 (12px)
- **Section spacing**: mb-4 or space-y-4 (16px)
- **Card padding**: p-4 sm:p-5
- **Label to input gap**: mb-1.5 (6px)
- **Inner group spacing**: gap-2 (8px)

## Form Elements
- **Input height**: py-2 (compact), consistent across all inputs
- **Input text**: text-sm
- **Border**: border-gray-300 dark:border-gray-600
- **Focus**: ring-2 ring-teal-500 border-transparent
- **Border radius**: rounded-lg (all inputs, buttons, cards)
- **Input background**: white / dark:bg-gray-700

## Buttons
- **Primary**: bg-gradient-to-r from-teal-600 to-teal-700, text-white, py-2.5 px-5, rounded-lg
- **Hover**: from-teal-700 to-teal-800, shadow-md
- **Disabled**: from-gray-300 to-gray-300, cursor-not-allowed
- **Inline actions**: text-sm, gap-1.5, rounded, hover:bg-{color}-50

## Cards & Containers
- **Card**: bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
- **Subtle section**: bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3
- **Shadow**: shadow-sm on buttons, shadow-xl on dropdowns/popovers

## Layout Rules
- **Grid**: Use sm: and lg: breakpoints for responsive grids
- **Form rows**: grid grid-cols-1 sm:grid-cols-2 or sm:grid-cols-3 gap-3
- **Keep forms compact**: Minimize vertical whitespace, inline fields where logical
- **Notes/optional fields**: Full width below main grid

## Interactive States
- **Selected card/chip**: border-teal-500 bg-teal-50 dark:bg-teal-900/20
- **Hover card**: hover:border-gray-300 or hover:bg-gray-50
- **Check badge on selected**: absolute -top-1.5 -right-1.5, bg-teal-500 rounded-full

## Animations
- fadeIn: opacity 0->1 + translateY 8px->0, 0.3s ease-out
- scaleIn: opacity 0->1 + scale 0.96->1, 0.2s ease-out
- Use for page transitions, modals, toast notifications

## Popover / Dropdown
- **Position**: absolute, z-50
- **Background**: bg-white dark:bg-gray-800
- **Border**: border-gray-200 dark:border-gray-700
- **Shadow**: shadow-xl
- **Radius**: rounded-xl
- **Padding**: p-4
- **Close on outside click**: always

## Key Principles
1. Compact over spacious - no unnecessary whitespace
2. Consistent 8px spacing grid
3. Readable contrast ratios on all backgrounds
4. Single responsibility per view
5. Progressive disclosure for secondary actions
6. All form inputs same visual height within a row
7. Responsive: mobile-first, scale up with sm:/lg: breakpoints
