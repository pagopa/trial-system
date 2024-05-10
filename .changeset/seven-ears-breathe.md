---
"functions-subscription": patch
---

Remove `rimraf` dependency

`rimraf` was used to remove files from the file system.
The project already has the `shx` dependency which is a wrapper arount 
ShellJS.
We have removed a redundant dependency from the project.
