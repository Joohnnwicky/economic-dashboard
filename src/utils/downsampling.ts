import { HistoricalDataPoint } from '../types/indicator';

// Largest-Triangle-Three-Buckets downsampling for visual preservation
export function downsampleData(
  data: HistoricalDataPoint[],
  maxPoints: number = 365
): HistoricalDataPoint[] {
  if (data.length <= maxPoints) {
    return data;
  }

  const result: HistoricalDataPoint[] = [];
  const bucketSize = Math.floor(data.length / maxPoints);

  // Keep first point
  result.push(data[0]);

  for (let i = 1; i < maxPoints - 1; i++) {
    const startIdx = (i - 1) * bucketSize + 1;
    const endIdx = i * bucketSize;

    // Find point with largest triangle area
    const prevPoint = result[result.length - 1];
    const nextBucketStart = data[Math.min(endIdx + 1, data.length - 1)];

    let maxArea = -1;
    let maxAreaIdx = startIdx;

    for (let j = startIdx; j <= endIdx && j < data.length; j++) {
      const area = Math.abs(
        (prevPoint.timestamp.getTime() - nextBucketStart.timestamp.getTime()) *
          (data[j].value ?? 0) -
          (prevPoint.timestamp.getTime() - data[j].timestamp.getTime()) *
            (nextBucketStart.value ?? 0)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIdx = j;
      }
    }

    result.push(data[maxAreaIdx]);
  }

  // Keep last point
  result.push(data[data.length - 1]);

  return result;
}