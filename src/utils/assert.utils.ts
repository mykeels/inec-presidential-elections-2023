export function invariant(
  condition: any,
  message?: string | (() => string)
): asserts condition {
  if (condition) {
    return;
  }
  // Condition not passed
  const prefix = "Invariant failed";
  const providedMessage = typeof message === "function" ? message() : message;
  const value = providedMessage ? `${prefix}: ${providedMessage}` : prefix;
  const error = new Error(value);
  error.name = "AssertError";
  throw error;
}

/**
 * Given a condition/value, ensure it is truthy, else throw an error
 * @throws {Error}
 */
export const assert = <TOptional>(
  condition: TOptional,
  message?: string | (() => string)
) => {
  invariant(
    condition,
    typeof message === "string"
      ? `AssertError: ${message}`
      : message || `AssertError: condition must be truthy`
  );
  const _condition = condition as NonNullable<TOptional>;
  return _condition;
};
