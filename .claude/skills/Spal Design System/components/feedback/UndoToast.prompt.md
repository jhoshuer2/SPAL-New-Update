Fixed-bottom toast shown after a destructive action (delete record), 10s countdown bar, single Undo action.

```jsx
<UndoToast message="Record deleted" onUndo={handleUndo} onExpire={handleExpire} />
```
