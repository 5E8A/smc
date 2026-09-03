export type DeviceType = "phone" | "android" | "tablet" | "tablet-android" | "laptop" | "desktop" | "custom";

export interface DevicePreset {
  name: string;
  w: number;
  h: number;
  type: DeviceType;
}

export interface DeviceGroup {
  label: string;
  presets: DevicePreset[];
}

export const DEVICE_GROUPS: DeviceGroup[] = [
  {
    label: "iOS",
    presets: [
      { name: "iPhone 17 Pro", w: 402, h: 874, type: "phone" },
      { name: "iPhone 17 Pro Max", w: 440, h: 956, type: "phone" },
      { name: "iPhone Air", w: 420, h: 912, type: "phone" },
      { name: "iPhone 16", w: 393, h: 852, type: "phone" },
    ],
  },
  {
    label: "iPad",
    presets: [
      { name: "iPad Pro 13\" M4", w: 1032, h: 1376, type: "tablet" },
      { name: "iPad Air 11\"", w: 820, h: 1180, type: "tablet" },
    ],
  },
  {
    label: "Android",
    presets: [
      { name: "Galaxy S25 Ultra", w: 384, h: 824, type: "android" },
      { name: "Galaxy S25", w: 360, h: 780, type: "android" },
      { name: "Pixel 10 Pro", w: 412, h: 892, type: "android" },
      { name: "OnePlus 13", w: 412, h: 919, type: "android" },
    ],
  },
  {
    label: "Fold & Tablet",
    presets: [
      { name: "Galaxy Z Fold 6", w: 673, h: 841, type: "tablet-android" },
      { name: "Galaxy Tab S10", w: 800, h: 1280, type: "tablet-android" },
    ],
  },
  {
    label: "Laptop & Desktop",
    presets: [
      { name: "MacBook Pro 14\"", w: 1512, h: 982, type: "laptop" },
      { name: "MacBook Air 13\"", w: 1280, h: 832, type: "laptop" },
      { name: "Desktop 1080p", w: 1920, h: 1080, type: "desktop" },
      { name: "Desktop 1440p", w: 2560, h: 1440, type: "desktop" },
      { name: "Desktop 4K", w: 3840, h: 2160, type: "desktop" },
    ],
  },
  {
    label: "Legacy",
    presets: [
      { name: "iPhone SE 2022", w: 375, h: 667, type: "phone" },
      { name: "Galaxy S9", w: 360, h: 740, type: "android" },
      { name: "Moto G Power", w: 360, h: 800, type: "android" },
      { name: "iPad 6th Gen", w: 768, h: 1024, type: "tablet" },
      { name: "Laptop 768p", w: 1366, h: 768, type: "laptop" },
    ],
  },
];

export const CUSTOM_PRESET: DevicePreset = { name: "Custom", w: 800, h: 600, type: "desktop" };

export const MIN_DIM = 240;
export const MAX_DIM = 4000;
