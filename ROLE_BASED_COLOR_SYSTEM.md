# Role-Based Smart Color System Implementation

## Overview
The AppointEase booking plugin now uses a Role-Based Color System that simplifies customization while ensuring professional, accessible designs.

## System Structure

### 1. Theme Selection (Simple Presets)
- **Light Mode (Default)**: Professional design for most businesses
- **Dark Mode**: Modern, sleek design for contemporary brands  
- **Custom**: Match exact brand colors

### 2. Custom Brand Colors (Only 3 Core Colors)
When "Custom" is selected, users define:

1. **Primary Action / Accent Color**
   - Used for: buttons, selected items, active progress steps, links
   - System automatically calculates contrast text color

2. **Header Background Color** 
   - Used for: main header area background
   - System automatically calculates contrast text color

3. **Main Text Color**
   - Used for: headings and descriptive text on light backgrounds

### 3. Smart Logic Implementation

#### Automatic Contrast Calculation
```php
private function get_contrast_color($hex) {
    // Calculate luminance and return appropriate text color
    $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
    return $luminance > 0.5 ? '#263238' : '#FFFFFF';
}
```

#### Automatic Hover States
```php
$primary_dark = $this->darken_color($primary_color, 15%);
```

#### Theme-Based Defaults
- Light theme: Teal/blue professional palette
- Dark theme: Purple/dark modern palette
- Custom: User-defined with smart calculations

## Benefits

1. **Simplicity**: Only 2-3 color choices instead of 15+
2. **Safety**: Impossible to create unreadable designs
3. **Professional Results**: Automatic hover states and contrast
4. **Reduced Support**: Fewer "ugly colors" complaints
5. **Brand Matching**: Quick customization in under a minute

## CSS Variables Generated
```css
:root {
    --appointease-primary: [user choice]
    --appointease-primary-dark: [auto calculated]
    --appointease-primary-text: [auto calculated]
    --appointease-header: [user choice]
    --appointease-header-text: [auto calculated]
    --appointease-text: [user choice]
    /* ... other smart variables */
}
```

This approach balances customization freedom with design quality guardrails.