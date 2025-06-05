import GLib from "@girs/glib-2.0";
import str from "./str";

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

const Priorities = [
  "default",
  "default_idle",
  "high",
  "high_idle",
  "low",
] as const;
type Priority = (typeof Priorities)[number];

interface TimeoutParams {
  delay: number;
  priority?: Priority;
}

export function timeout(
  callback: () => void,
  { delay, priority: _priority = "default" }: TimeoutParams
) {
  const priority = str.upper(`PRIORITY_${_priority}`);
  GLib.timeout_add(GLib[priority], delay, () => {
    callback();
    return GLib.SOURCE_REMOVE;
  });
}

interface IntervalParams {
  delay: number;
  priority?: Priority;
  times?: number;
  duration?: number;
}

export function interval(
  callback: () => void,
  { delay, priority: _priority = "default", times, duration }: IntervalParams
) {
  const priority = str.upper(`PRIORITY_${_priority}`);
  const start = Date.now();
  let count = 0;
  GLib.timeout_add(GLib[priority], delay, () => {
    callback();
    count++;
    if (times !== undefined && count >= times) {
      return GLib.SOURCE_REMOVE;
    }
    if (duration !== undefined && duration >= Date.now() - start) {
      return GLib.SOURCE_REMOVE;
    }
    return GLib.SOURCE_CONTINUE;
  });
}
