import { TypeFormData } from "../types";

export function setItemLocal(key: string, value: TypeFormData): void {
  const serializedValue = JSON.stringify(value);
  localStorage.setItem(key, serializedValue);
}

export function getItemLocal<T>(key: string): T | null {
  const serializedValue = localStorage.getItem(key);
  if (serializedValue === null) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(serializedValue);
    return parsedValue as T;
  } catch (error) {
    console.error(`Error parsing local storage item with key "${key}":`, error);
    return null;
  }
}

export function removeItemLocal(key: string): void {
  localStorage.removeItem(key);
}

export function clearLocal(): void {
  localStorage.clear();
}
