/**
 * Regression metrics — pure functions reused later by the Phase 6 AI engine
 * when real model evaluation replaces sample data.
 */

import type { RegressionMetrics } from '../types'

export function meanAbsoluteError(actual: number[], predicted: number[]): number {
  assertSameLength(actual, predicted)
  if (actual.length === 0) return 0
  const total = actual.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]!), 0)
  return total / actual.length
}

export function rootMeanSquaredError(actual: number[], predicted: number[]): number {
  assertSameLength(actual, predicted)
  if (actual.length === 0) return 0
  const total = actual.reduce((sum, value, index) => {
    const error = value - predicted[index]!
    return sum + error * error
  }, 0)
  return Math.sqrt(total / actual.length)
}

export function r2Score(actual: number[], predicted: number[]): number {
  assertSameLength(actual, predicted)
  if (actual.length === 0) return 0
  const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length
  const ssTotal = actual.reduce((sum, value) => sum + (value - mean) ** 2, 0)
  if (ssTotal === 0) return 0
  const ssResidual = actual.reduce(
    (sum, value, index) => sum + (value - predicted[index]!) ** 2,
    0,
  )
  return 1 - ssResidual / ssTotal
}

export function meanAbsolutePercentageError(
  actual: number[],
  predicted: number[],
): number {
  assertSameLength(actual, predicted)
  const usable = actual
    .map((value, index) => ({ value, predicted: predicted[index]! }))
    .filter((pair) => pair.value !== 0)
  if (usable.length === 0) return 0
  const total = usable.reduce(
    (sum, pair) => sum + Math.abs((pair.value - pair.predicted) / pair.value),
    0,
  )
  return (total / usable.length) * 100
}

export function computeRegressionMetrics(
  actual: number[],
  predicted: number[],
): RegressionMetrics {
  return {
    mae: meanAbsoluteError(actual, predicted),
    rmse: rootMeanSquaredError(actual, predicted),
    r2: r2Score(actual, predicted),
    mapePct: meanAbsolutePercentageError(actual, predicted),
    testSamples: actual.length,
  }
}

function assertSameLength(actual: number[], predicted: number[]): void {
  if (actual.length !== predicted.length) {
    throw new Error(
      `actual/predicted length mismatch: ${actual.length} vs ${predicted.length}`,
    )
  }
}
