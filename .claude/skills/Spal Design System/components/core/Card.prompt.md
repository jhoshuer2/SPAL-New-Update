Base surface for grouped content, used sparingly; DESIGN.md prefers borderless sections with generous padding over card-stacking.

```jsx
<Card accent="green" padding="md">Card content</Card>
```

`accent` renders a slim 2px top strip (never a left border, that reads as generic SaaS). `elevated` swaps to the heavier two-layer shadow used for popovers/sheets. Never nest a Card inside another Card.
