# Mistakes Log & Prevention Guide

This document tracks previous development mistakes, their causes, and how to avoid them. **Always consult this file before making modifications to the codebase.**

---

## 1. Expo SQLite Android Boolean Constraint

### ❌ The Mistake
Passing boolean primitives (e.g., `true`, `false`) directly in the parameter array of SQLite query bindings (e.g., `db.runAsync(...)` or `db.executeSql(...)`).

### 🔍 Why it was made
JavaScript/TypeScript handles booleans naturally, and standard SQL databases or other SQLite JSI bindings often implicitly convert `true` to `1` and `false` to `0`. 

### 💥 Consequences
On Android platforms, passing a boolean causes the underlying `expo-sqlite` JSI binding layer to crash and throw a `java.lang.NullPointerException` inside `NativeDatabase.prepareAsync`.

### ✅ Prevention & Best Practices
- **Never** pass boolean variables directly inside the query execution arguments array.
- **Always** convert booleans to integer representation (e.g., `is_blind ? 1 : 0`) before passing them to any `expo-sqlite` call.
- Reference files:
  - [database.ts](file:///c:/Users/LENOVO/Desktop/NH-U/frontend/lib/database.ts)
  - [register-profile.tsx](file:///c:/Users/LENOVO/Desktop/NH-U/frontend/app/(auth)/register-profile.tsx)
  - [login.tsx](file:///c:/Users/LENOVO/Desktop/NH-U/frontend/app/(auth)/login.tsx)

---

## 2. React Native `@react-native-async-storage/async-storage` Native Module Crash in Expo Go

### ❌ The Mistake
Using `@react-native-async-storage/async-storage` directly for persistent key-value caching in Expo Go screens (`learning.tsx`, `profile.tsx`).

### 🔍 Why it was made
`AsyncStorage` is a common React Native library for local key-value storage. However, in modern Expo Go environments, legacy native bindings for `@react-native-async-storage/async-storage` can throw `[AsyncStorageError: Native module is null, cannot access legacy storage]`.

### 💥 Consequences
When unhandled `AsyncStorage.getItem(...)` calls throw this exception inside data loading functions (like `loadProfileAndContent()`), execution jumps straight to `catch` blocks without setting fallback state, leaving screens empty (e.g. "No content available").

### ✅ Prevention & Best Practices
- **Use `expo-secure-store`** (`SecureStore.getItemAsync`, `SecureStore.setItemAsync`, `SecureStore.deleteItemAsync`) for key-value storage in Expo projects, as it is fully integrated into the Expo core runtime.
- **Wrap all storage calls** in safe helper functions (`safeGetItem`, `safeSetItem`) that catch errors silently instead of breaking screen data flow.
- **Set default fallback data immediately** into screen state before attempting any network or storage reads so screens are guaranteed to render data regardless of network/storage exceptions.
- Reference files:
  - [learning.tsx](file:///c:/Users/LENOVO/Desktop/NH-U/frontend/app/(tabs)/learning.tsx)
  - [profile.tsx](file:///c:/Users/LENOVO/Desktop/NH-U/frontend/app/(tabs)/profile.tsx)

---

## Instructions for Antigravity AI
1. **Read this log** before every task involving code modifications, specifically those related to React Native, Expo, SQLite, state management, or backend APIs.
2. **Append any new mistakes** discovered during development or testing to this file. Every new entry should document:
   - What the mistake was
   - Why it was made (root cause)
   - How to prevent it/solution
   - Reference files

