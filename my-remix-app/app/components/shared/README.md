# Shared Components

This directory contains reusable components used across the application.

## Image Preview Components

### PaymentMethodTags.tsx

A basic image preview component for QR codes in payment method tags. Features:

- Simple modal preview
- Click to view larger image
- Hover effects with eye icon
- Accessible button implementation

**Usage:**

```tsx
<PaymentMethodTags redeemId="123" targetId="payment_method_id" />
```

### PaymentMethodTagsAdvanced.tsx

An enhanced version using the ImagePreview component with advanced features:

- Zoom in/out functionality
- Image rotation
- Download capability
- Fullscreen mode
- Keyboard shortcuts

**Usage:**

```tsx
<PaymentMethodTagsAdvanced redeemId="123" targetId="payment_method_id" />
```

### ImagePreview.tsx

A reusable image preview component with advanced features:

**Features:**

- Zoom in/out (25% increments, 25% - 300% range)
- Image rotation (90° increments)
- Download functionality
- Fullscreen toggle
- Keyboard shortcuts:
  - `+` / `-`: Zoom in/out
  - `R`: Rotate image
  - `ESC`: Close modal
- Responsive design
- Accessibility support

**Usage:**

```tsx
// Basic usage
<ImagePreview
  src="/path/to/image.jpg"
  alt="Image description"
  className="w-16 h-16"
/>

// With custom trigger
<ImagePreview src="/path/to/image.jpg" alt="Image description">
  <div className="custom-trigger">
    <img src="/path/to/thumbnail.jpg" alt="Thumbnail" />
  </div>
</ImagePreview>

// Controlled state
<ImagePreview
  src="/path/to/image.jpg"
  alt="Image description"
  showPreview={isOpen}
  onPreviewChange={setIsOpen}
/>
```

**Props:**

- `src`: Image source URL (required)
- `alt`: Image alt text (optional, defaults to "Image")
- `className`: Additional CSS classes (optional)
- `showPreview`: Control modal state externally (optional)
- `onPreviewChange`: Callback when modal state changes (optional)
- `children`: Custom trigger element (optional)

## Recommendations

1. **For simple QR code previews**: Use `PaymentMethodTags.tsx`
2. **For enhanced user experience**: Use `PaymentMethodTagsAdvanced.tsx`
3. **For custom image preview needs**: Use `ImagePreview.tsx` directly

The components follow the existing design system using Radix UI Dialog and Lucide React icons, maintaining consistency with the rest of the application.
