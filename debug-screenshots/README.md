# Debug Screenshots

This folder stores UI screenshots for debugging and tracking purposes.

## Folder Structure

```
debug-screenshots/
├── ui-states/     # Screenshots of different UI states (steps 1-7, login, dashboard)
├── errors/        # Screenshots of error states and issues
├── flows/         # Screenshots of complete user flows
└── README.md      # This file
```

## File Naming Convention

Screenshots are automatically named with the following format:

### UI States
- `step-{N}-{service|employee|date|time|form|review|success}-{timestamp}.png`
- Example: `step-1-service-selection-20251021-143022.png`

### Error States
- `error-{component}-{error-type}-{timestamp}.png`
- Example: `error-booking-validation-20251021-143022.png`

### User Flows
- `flow-{flow-name}-{step-description}-{timestamp}.png`
- Example: `flow-booking-complete-confirmation-20251021-143022.png`

## Usage

Click the 📸 button in the debug panel to capture the current UI state.
Screenshots are saved automatically with descriptive names based on:
- Current step number
- Active component
- Timestamp
- User state (logged in/out, rescheduling, etc.)

## Gitignore

This folder is excluded from git to avoid repository bloat.
Screenshots are for local debugging only.
