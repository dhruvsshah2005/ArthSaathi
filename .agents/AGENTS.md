## Expo SQLite Android Constraint
When binding parameters to `expo-sqlite` queries, **never** pass boolean primitives (like `true` or `false`). On Android, passing a boolean causes the JSI binding layer to throw a `java.lang.NullPointerException` from `NativeDatabase.prepareAsync`. Always convert booleans to integers (e.g. `is_blind ? 1 : 0`) before passing them in the parameter array.
