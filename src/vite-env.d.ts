/// <reference types="vite/client" />

interface Window {
  showDirectoryPicker(options?: { mode?: "read" | "readwrite" }): Promise<FileSystemDirectoryHandle>;
}

interface FileSystemDirectoryHandle {
  requestPermission(descriptor: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
}
