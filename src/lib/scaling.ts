export function scaleQuantity(
  baseAmount: number,
  baseServings: number,
  targetServings: number,
): number {
  if (![baseAmount, baseServings, targetServings].every(Number.isFinite)) {
    throw new Error('Scaling values must be finite numbers.');
  }
  if (baseAmount <= 0 || baseServings <= 0 || targetServings <= 0) {
    throw new Error('Scaling values must be greater than zero.');
  }

  return (
    Math.round(((baseAmount * targetServings) / baseServings) * 1000) / 1000
  );
}

export function scaleBatch(
  baseAmounts: readonly number[],
  baseServings: number,
  targetServings: number,
) {
  return baseAmounts.map((amount) =>
    scaleQuantity(amount, baseServings, targetServings),
  );
}
