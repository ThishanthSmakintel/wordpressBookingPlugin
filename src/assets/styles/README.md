# CSS Organization Structure

## Overview
This directory contains all CSS/SCSS files organized by purpose and usage context.

## Directory Structure

```
styles/
├── frontend/           # Frontend application styles
│   ├── index.css      # Main entry point for frontend
│   ├── frontend.css   # Core frontend styles
│   ├── login.css      # Login form styles
│   ├── reschedule.css # Reschedule functionality styles
│   └── wp-responsive-fix.css # WordPress responsive fixes
├── editor/            # WordPress block editor styles
│   ├── index.scss     # Main entry point for editor
│   ├── editor.scss    # Block editor preview styles
│   └── style.scss     # Block frontend styles
└── components/        # Component-specific styles
    ├── appointment-card.css    # Appointment card component
    ├── appointment-dates.css   # Date display components
    ├── appointment-header.css  # Header components
    ├── booking-components.css  # General booking components
    ├── loading-states.css      # Loading animations
    └── specialist-icon.css     # Specialist icons
```

## Usage

### Frontend Application
Import the main frontend styles:
```javascript
import './assets/styles/frontend/index.css';
```

### WordPress Block Editor
Import the main editor styles:
```javascript
import './assets/styles/editor/index.scss';
```

### Individual Components
Component styles are automatically included via the main index files.

## File Purposes

### Frontend Files
- **frontend.css**: Core application styles, layout, colors
- **login.css**: Login form and authentication UI
- **reschedule.css**: Appointment rescheduling interface
- **wp-responsive-fix.css**: WordPress theme compatibility fixes

### Editor Files
- **editor.scss**: Block editor preview and admin interface styles
- **style.scss**: Styles that apply to blocks on the frontend

### Component Files
- **appointment-card.css**: Appointment display cards
- **appointment-dates.css**: Date picker and display components
- **appointment-header.css**: Header and navigation components
- **booking-components.css**: General booking form components
- **loading-states.css**: Loading spinners and animations
- **specialist-icon.css**: Staff/specialist display icons

## Benefits of This Structure

1. **Clear Separation**: Frontend vs Editor vs Component styles
2. **Easy Maintenance**: Find styles by purpose/context
3. **Modular Loading**: Import only what's needed
4. **Scalability**: Easy to add new style categories
5. **Performance**: Organized imports reduce bundle size