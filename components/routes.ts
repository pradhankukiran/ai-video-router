import type { Route } from "next";

/**
 * Build a typed href for the project workspace route.
 * Next 16 typed routes narrow `Route` to a union of static path strings;
 * the template literal has to be reasserted once, in one place.
 */
export function projectHref(id: string): Route {
  return `/projects/${id}` as Route;
}
