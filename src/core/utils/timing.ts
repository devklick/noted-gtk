import GLib from "@girs/glib-2.0";

/**
 * Creates a debounced version of a function using GLib's main loop.
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced version of the function
 */
export function debounce<T extends (...args: any[]) => void>(
  delay: number,
  fn: T
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      GLib.source_remove(timeoutId);
    }

    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
      fn(...args);
      timeoutId = null;
      return GLib.SOURCE_REMOVE;
    });
  };
}
