Status: closed

# Remove impossible-case guard from useApp

## What to build

`AppContext.tsx` contains a runtime guard that throws if `useApp()` is called outside `AppProvider`. Every call site in this codebase is inside a component tree that is always wrapped in `AppProvider` (wired unconditionally in `main.tsx`). The guard can never fire, so it is dead defensive code.

Remove the null check and the `throw`. Replace the `AppContextValue | null` context type with `AppContextValue` (non-nullable) and initialize the context with a non-null assertion or a lazy initializer, or simply keep `createContext` typed as non-nullable from the start. The hook body becomes a direct return of `useContext(AppContext)` with a non-null assertion if needed.

## Acceptance criteria

- [ ] The `throw new Error('useApp must be used within AppProvider')` is removed
- [ ] `useApp` returns `AppContextValue` directly with no null check
- [ ] No TypeScript errors introduced
- [ ] All existing tests pass; typecheck clean

## Blocked by

None — can start immediately.
