## Expo SQLite Android Constraint
When binding parameters to `expo-sqlite` queries, **never** pass boolean primitives (like `true` or `false`). On Android, passing a boolean causes the JSI binding layer to throw a `java.lang.NullPointerException` from `NativeDatabase.prepareAsync`. Always convert booleans to integers (e.g. `is_blind ? 1 : 0`) before passing them in the parameter array.

## Mistakes Log Reference
Always consult the [mistakes-log.md](file:///c:/Users/LENOVO/Desktop/NH-U/mistakes-log.md) file in the workspace root before starting work on any code modifications. If you make or encounter a mistake during implementation or debugging, log it there detailing the mistake, the root cause, and the prevention/best practice for future reference.
