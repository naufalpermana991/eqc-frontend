import { Fragment } from "react";
import Icon from "../Icon";

/**
 * Penanda langkah form bertahap (Figma: Add part / product → 1 - - - - 2).
 *   <Stepper steps={["Product details", "Checking items"]} current={0} />
 * Langkah yang sudah lewat ditandai centang.
 */
export default function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Form progress">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <Fragment key={label}>
            {i > 0 && (
              <li aria-hidden="true" className="w-12 border-t-2 border-dashed border-gray-300" />
            )}
            <li
              aria-current={state === "current" ? "step" : undefined}
              title={label}
              className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${
                state === "current"
                  ? "bg-error-50 text-error-600"
                  : state === "done"
                    ? "bg-success-500 text-white"
                    : "border border-gray-200 bg-white text-gray-600"
              }`}
            >
              {state === "done" ? <Icon name="check" className="size-4" strokeWidth={2.5} /> : i + 1}
              <span className="sr-only">
                {`Step ${i + 1}: ${label}${state === "done" ? " (completed)" : state === "current" ? " (current)" : ""}`}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
