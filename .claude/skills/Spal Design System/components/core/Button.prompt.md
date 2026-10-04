Solid-fill pill button, the primary tap target across SPAL, use for the one confident action on a screen.

```jsx
<Button variant="primary" size="lg" fullWidth icon={<PlusIcon/>}>Record Sale</Button>
```

Variants: `primary` (green, main CTA), `secondary` (white/bordered, alternate action), `ghost` (text-only, tertiary), `danger` (destructive, e.g. delete). Sizes: `sm` 40px / `md` 48px / `lg` 56px, all meet the 44px+ tap-target minimum. `loading` swaps content for three pulsing dots without changing button size. Press feedback is a 0.96 scale, never a color flash.
