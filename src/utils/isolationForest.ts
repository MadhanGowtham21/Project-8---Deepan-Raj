import { AnomalyOutput, LiveMetrics } from '../types/simulator';

interface TreeNode {
  splitFeature?: 'rssi' | 'snr' | 'pdr' | 'latency';
  splitValue?: number;
  left?: TreeNode;
  right?: TreeNode;
  size: number;
  isLeaf: boolean;
}

// Euler-Mascheroni constant
const EULER_MASCHERONI = 0.5772156649;

/**
 * Average path length of unsuccessful search in Binary Search Tree
 * c(n) = 2 * (ln(n - 1) + 0.5772156649) - (2 * (n - 1) / n)
 */
export function calculateAveragePathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * (Math.log(n - 1) + EULER_MASCHERONI) - (2 * (n - 1) / n);
}

// Baseline nominal operating conditions for wireless communication link
const NOMINAL_DISTRIBUTIONS = {
  rssi: { min: -62, max: -45, mean: -52, std: 3.5 },
  snr: { min: 22, max: 34, mean: 28, std: 2.2 },
  pdr: { min: 96, max: 100, mean: 98.8, std: 1.0 },
  latency: { min: 8, max: 20, mean: 12.5, std: 2.5 },
};

/**
 * Generate synthetic training samples representing nominal baseline link conditions
 */
function generateNominalTrainingSet(sampleCount: number = 256): Array<{ rssi: number; snr: number; pdr: number; latency: number }> {
  const samples = [];
  for (let i = 0; i < sampleCount; i++) {
    // Box-Muller transform for gaussian noise
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const rssi = Math.min(-40, Math.max(-65, NOMINAL_DISTRIBUTIONS.rssi.mean + z0 * NOMINAL_DISTRIBUTIONS.rssi.std));
    const snr = Math.min(36, Math.max(20, NOMINAL_DISTRIBUTIONS.snr.mean + z0 * NOMINAL_DISTRIBUTIONS.snr.std));
    const pdr = Math.min(100, Math.max(94, NOMINAL_DISTRIBUTIONS.pdr.mean + (Math.random() - 0.5) * 3));
    const latency = Math.max(6, NOMINAL_DISTRIBUTIONS.latency.mean + Math.abs(z0) * NOMINAL_DISTRIBUTIONS.latency.std);

    samples.push({ rssi, snr, pdr, latency });
  }
  return samples;
}

export class IsolationForestSimulator {
  private trees: TreeNode[] = [];
  private numTrees: number = 40;
  private subSampleSize: number = 64;
  private maxDepth: number = 6; // ceil(log2(64)) = 6
  private cN: number = 0;
  private currentThreshold: number = 0.60;

  constructor(numTrees: number = 40, subSampleSize: number = 64, threshold: number = 0.60) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
    this.currentThreshold = threshold;
    this.maxDepth = Math.ceil(Math.log2(subSampleSize));
    this.cN = calculateAveragePathLength(subSampleSize);
    this.train();
  }

  public setThreshold(th: number) {
    this.currentThreshold = Math.max(0.35, Math.min(0.90, th));
  }

  public getThreshold(): number {
    return this.currentThreshold;
  }

  public train() {
    const trainingData = generateNominalTrainingSet(300);
    this.trees = [];

    for (let t = 0; t < this.numTrees; t++) {
      // Subsample data without replacement
      const shuffled = [...trainingData].sort(() => 0.5 - Math.random());
      const subSample = shuffled.slice(0, this.subSampleSize);
      const root = this.buildTree(subSample, 0);
      this.trees.push(root);
    }
  }

  private buildTree(data: Array<{ rssi: number; snr: number; pdr: number; latency: number }>, currentDepth: number): TreeNode {
    if (currentDepth >= this.maxDepth || data.length <= 1) {
      return {
        isLeaf: true,
        size: data.length,
      };
    }

    const features: Array<'rssi' | 'snr' | 'pdr' | 'latency'> = ['rssi', 'snr', 'pdr', 'latency'];
    const selectedFeature = features[Math.floor(Math.random() * features.length)];

    const values = data.map((d) => d[selectedFeature]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    if (minVal === maxVal) {
      return {
        isLeaf: true,
        size: data.length,
      };
    }

    // Uniform random split between min and max
    const splitVal = minVal + Math.random() * (maxVal - minVal);

    const leftData = data.filter((d) => d[selectedFeature] < splitVal);
    const rightData = data.filter((d) => d[selectedFeature] >= splitVal);

    return {
      isLeaf: false,
      size: data.length,
      splitFeature: selectedFeature,
      splitValue: splitVal,
      left: this.buildTree(leftData, currentDepth + 1),
      right: this.buildTree(rightData, currentDepth + 1),
    };
  }

  private evaluatePathLength(node: TreeNode, sample: { rssi: number; snr: number; pdr: number; latency: number }, currentDepth: number): number {
    if (node.isLeaf || !node.splitFeature || node.splitValue === undefined) {
      return currentDepth + calculateAveragePathLength(node.size);
    }

    const val = sample[node.splitFeature];
    if (val < node.splitValue) {
      return node.left ? this.evaluatePathLength(node.left, sample, currentDepth + 1) : currentDepth;
    } else {
      return node.right ? this.evaluatePathLength(node.right, sample, currentDepth + 1) : currentDepth;
    }
  }

  public detect(metrics: LiveMetrics): AnomalyOutput {
    const sample = {
      rssi: metrics.rssi,
      snr: metrics.snr,
      pdr: metrics.pdr,
      latency: metrics.latency,
    };

    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += this.evaluatePathLength(tree, sample, 0);
    }

    const avgDepth = totalPathLength / this.trees.length;

    // Isolation forest anomaly score: s(x, n) = 2^(- E(h(x)) / c(n))
    // When avgDepth is very small (point is isolated very quickly), s -> 1 (Anomaly)
    // When avgDepth is near c(n), s -> 0.5 (Normal)
    // When avgDepth > c(n), s -> 0 (Very dense normal cluster)
    const anomalyScore = Math.pow(2, -avgDepth / Math.max(0.1, this.cN));

    // Calculate feature deviation / contribution metrics
    // Compare how far each feature is from its nominal baseline distribution in standard deviations
    const rssiDev = Math.max(0, Math.abs(metrics.rssi - NOMINAL_DISTRIBUTIONS.rssi.mean) / NOMINAL_DISTRIBUTIONS.rssi.std);
    const snrDev = Math.max(0, (NOMINAL_DISTRIBUTIONS.snr.mean - metrics.snr) / NOMINAL_DISTRIBUTIONS.snr.std);
    const pdrDev = Math.max(0, (NOMINAL_DISTRIBUTIONS.pdr.mean - metrics.pdr) / NOMINAL_DISTRIBUTIONS.pdr.std);
    const latDev = Math.max(0, (metrics.latency - NOMINAL_DISTRIBUTIONS.latency.mean) / NOMINAL_DISTRIBUTIONS.latency.std);

    const totalDev = rssiDev + snrDev + pdrDev + latDev + 0.0001;
    const featureContributions = {
      rssi: Number((rssiDev / totalDev).toFixed(3)),
      snr: Number((snrDev / totalDev).toFixed(3)),
      pdr: Number((pdrDev / totalDev).toFixed(3)),
      latency: Number((latDev / totalDev).toFixed(3)),
    };

    // Determine dominant feature driving the anomaly
    const featureEntries = Object.entries(featureContributions) as Array<['rssi' | 'snr' | 'pdr' | 'latency', number]>;
    featureEntries.sort((a, b) => b[1] - a[1]);
    const dominantFeature = featureEntries[0][0];

    const isAnomaly = anomalyScore >= this.currentThreshold;

    return {
      isAnomaly,
      anomalyScore: Number(anomalyScore.toFixed(3)),
      threshold: this.currentThreshold,
      averageDepth: Number(avgDepth.toFixed(2)),
      expectedDepthNormal: Number(this.cN.toFixed(2)),
      featureContributions,
      dominantFeature,
    };
  }
}
