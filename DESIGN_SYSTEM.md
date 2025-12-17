# Analytics Dashboard Design System

## Overview

The analytics dashboard has been completely redesigned with a modern, professional design system. All existing functionality is preserved while the visual presentation has been significantly improved.

## Design Tokens

### Color System

#### Primary Colors
- **Primary**: `#6B3A8A` - Main brand color (purple)
- **Primary Light**: `#8B4BA8` - Lighter shade for hover states
- **Primary Dark**: `#4F2967` - Darker shade for contrast
- **Accent**: `#F6D1DD` - Secondary brand color (pink)
- **Accent Dark**: `#E5B8C7` - Darker pink

#### Background Colors
- **Base**: `#F8F9FB` - Page background
- **Surface**: `#FFFFFF` - Cards and containers
- **Hover**: `#F3F4F6` - Hover state background
- **Muted**: `#F8F9FA` - Subtle background (tables, charts)

#### Text Colors
- **Primary**: `#111827` - Main text
- **Secondary**: `#6B7280` - Labels, captions
- **Muted**: `#9CA3AF` - Disabled, placeholder
- **Inverse**: `#FFFFFF` - White text on dark backgrounds

#### Status Colors
- **Success**: `#10B981` - Success states
- **Warning**: `#F59E0B` - Warning states
- **Error**: `#EF4444` - Error states
- **Info**: `#3B82F6` - Information states

### Spacing Scale

All spacing uses consistent 8px-based scale:

- `--space-1`: 4px (0.25rem)
- `--space-2`: 8px (0.5rem)
- `--space-3`: 12px (0.75rem)
- `--space-4`: 16px (1rem)
- `--space-5`: 20px (1.25rem)
- `--space-6`: 24px (1.5rem)
- `--space-8`: 32px (2rem)
- `--space-10`: 40px (2.5rem)
- `--space-12`: 48px (3rem)

### Border Radius

- `--radius-sm`: 6px (0.375rem)
- `--radius-md`: 8px (0.5rem)
- `--radius-lg`: 12px (0.75rem)
- `--radius-xl`: 16px (1rem)

### Shadows

- `--shadow-sm`: Subtle elevation
- `--shadow-md`: Standard elevation
- `--shadow-lg`: Header/sticky elements
- `--shadow-xl`: Maximum elevation

### Typography

#### Font Families
- **Sans**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Mono**: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New'

#### Font Sizes
- `--text-xs`: 12px (0.75rem)
- `--text-sm`: 14px (0.875rem)
- `--text-base`: 16px (1rem)
- `--text-lg`: 18px (1.125rem)
- `--text-xl`: 20px (1.25rem)
- `--text-2xl`: 24px (1.5rem)
- `--text-3xl`: 30px (1.875rem)
- `--text-4xl`: 36px (2.25rem)

### Transitions

- `--transition-fast`: 150ms
- `--transition-base`: 200ms
- `--transition-slow`: 300ms

All transitions use `cubic-bezier(0.4, 0, 0.2, 1)` easing.

## Component Styles

### Header (.admin-header)

- Sticky positioning with gradient background
- Purple to light-purple gradient
- Backdrop blur effect (8px)
- Contains title and status badge
- Responsive: subtitle text hidden on mobile

### KPI Cards (.card, .card-value, .card-label)

- White background with subtle shadow
- Hover effect: slight elevation and shadow increase
- 4-column grid on desktop
- 2-column on tablet
- 1-column on mobile
- Highlighted card variant with gradient background

### Section Cards (.section)

- Consistent card styling
- 1px border with light gray color
- Proper padding and spacing
- Titles with 7 pixel weight
- Subtle shadow for depth

### Tables (.table-wrapper, .table-wrapper table)

- Sticky headers
- Hover state on rows
- Proper alignment for numeric columns
- Scrollable on mobile
- Striped backgrounds using CSS hover

### Controls (.admin-controls, .controls-grid, .controls-actions)

- Grouped input controls
- Grid layout that adapts to screen size
- Clear label/input associations
- Flex action buttons

### Buttons (.admin-btn)

- Primary: gradient background with shadow
- Secondary: outlined style
- Hover: elevation and shadow increase
- Active: transform down effect
- Loading state: spinner animation
- Disabled: reduced opacity

### Activity Feed (#activity-feed, .activity-item)

- Scrollable container with custom scrollbar
- Card-based item design
- Consistent spacing
- Emoji icons for event types
- Time display on the right
- Responsive layout

### Alerts (.alert)

- Full-width banner
- Color-coded (error, success)
- Left border accent
- Flex layout for content
- Slide-down animation on appear

## Responsive Breakpoints

### Tablet (768px and below)
- Header: smaller font size
- Controls: single column layout
- Cards: 2-column grid
- Full-width buttons
- Adjusted padding

### Mobile (480px and below)
- Header: even smaller font size
- Cards: single column
- Reduced padding throughout
- Optimized touch targets
- Stacked layout for all components

## Preserved Functionality

All JavaScript functionality remains unchanged:
- Element IDs preserved (token, range, load, export, etc.)
- CSS classes used by JS maintained
- Data loading and rendering logic intact
- Chart rendering (canvas)
- Map functionality (Leaflet)
- Table generation
- Activity feed updates
- CSV export

## Browser Support

- Modern browsers with CSS custom property support
- Firefox 49+
- Chrome 49+
- Safari 9.1+
- Edge 15+

## Testing

All components have been tested with:
- ✅ Token authentication flow
- ✅ Date range selection
- ✅ Data loading
- ✅ Chart rendering
- ✅ Table display
- ✅ Map visualization
- ✅ CSV export
- ✅ Responsive layout (mobile, tablet, desktop)

## Future Enhancements

Possible additions while maintaining current design:
- Dark mode theme (using CSS custom properties)
- Animation enhancements
- Additional status indicators
- Customizable color schemes
- Advanced filtering options
- Real-time data updates with visual feedback
