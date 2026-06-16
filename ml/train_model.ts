import * as fs from 'fs';
import * as path from 'path';

// TYPES
export interface EmployeeRecord {
  quiz_score: number;             // 0 - 100
  accuracy_percentage: number;    // 0 - 100
  time_taken: number;             // in seconds
  attempts: number;               // 1 - 5
  previous_performance: number;   // 1 = Needs Improvement, 2 = Average Performer, 3 = High Performer
  performance_category: string;   // "Needs Improvement", "Average Performer", "High Performer"
}

export interface DecisionNode {
  isLeaf: boolean;
  feature?: keyof Omit<EmployeeRecord, 'performance_category'>;
  threshold?: number;
  left?: DecisionNode;
  right?: DecisionNode;
  value?: string; // target class (if leaf)
}

export interface RandomForestModel {
  trees: DecisionNode[];
  accuracy: number;
  confusionMatrix: { [key: string]: { [key: string]: number } };
  classes: string[];
}

// 1. DATASET GENERATION (550 realistic records)
export function generateDataset(filePath: string): EmployeeRecord[] {
  const records: EmployeeRecord[] = [];
  const classes = ['Needs Improvement', 'Average Performer', 'High Performer'];

  for (let i = 0; i < 550; i++) {
    // Generate features with some random variations matching real scenarios
    let quiz_score = 0;
    let accuracy_percentage = 0;
    let time_taken = 0;
    let attempts = 1;
    let previous_performance = 1;

    // We decide the target category first, then generate features with high probability 
    // to model perfect relationships that of Random Forest classifier
    const rand = Math.random();
    let performance_category = '';

    if (rand < 0.3) {
      performance_category = 'Needs Improvement';
      quiz_score = Math.floor(Math.random() * 45) + 15; // 15 to 60
      accuracy_percentage = Math.floor(Math.random() * 45) + 15; // 15 to 60
      time_taken = Math.floor(Math.random() * 800) + 900; // 900 to 1700s
      attempts = Math.floor(Math.random() * 3) + 3; // 3 to 5
      previous_performance = Math.random() < 0.75 ? 1 : 2; // mostly 1, occasionally 2
    } else if (rand < 0.7) {
      performance_category = 'Average Performer';
      quiz_score = Math.floor(Math.random() * 25) + 55; // 55 to 80
      accuracy_percentage = Math.floor(Math.random() * 25) + 55; // 55 to 80
      time_taken = Math.floor(Math.random() * 600) + 400; // 400 to 1000s
      attempts = Math.floor(Math.random() * 2) + 1; // 1 to 2
      previous_performance = Math.random() < 0.6 ? 2 : (Math.random() < 0.5 ? 1 : 3);
    } else {
      performance_category = 'High Performer';
      quiz_score = Math.floor(Math.random() * 18) + 82; // 82 to 100
      accuracy_percentage = Math.floor(Math.random() * 18) + 82; // 82 to 100
      time_taken = Math.floor(Math.random() * 300) + 120; // 120 to 420s
      attempts = Math.random() < 0.85 ? 1 : 2; // 1 to 2
      previous_performance = Math.random() < 0.8 ? 3 : 2; // 3, occasionally 2
    }

    // Add slight noise to some features to simulate raw real-world data
    if (Math.random() < 0.05) {
      quiz_score = Math.min(100, Math.max(0, quiz_score + (Math.random() < 0.5 ? -10 : 10)));
      accuracy_percentage = Math.min(100, Math.max(0, accuracy_percentage + (Math.random() < 0.5 ? -10 : 10)));
    }

    records.push({
      quiz_score,
      accuracy_percentage,
      time_taken,
      attempts,
      previous_performance,
      performance_category
    });
  }

  // Ensure directories exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write CSV content
  const header = 'quiz_score,accuracy_percentage,time_taken,attempts,previous_performance,performance_category\n';
  const rows = records.map(r => 
    `${r.quiz_score},${r.accuracy_percentage},${r.time_taken},${r.attempts},${r.previous_performance},"${r.performance_category}"`
  ).join('\n');

  fs.writeFileSync(filePath, header + rows, 'utf-8');
  console.log(`Dataset generated successfully with 550 records at: ${filePath}`);
  return records;
}

// 2. DECISION TREE COMPONENT (Gini Impurity Split CART)
function calcGini(rows: EmployeeRecord[]): number {
  if (rows.length === 0) return 0;
  const counts: { [key: string]: number } = {};
  for (const row of rows) {
    counts[row.performance_category] = (counts[row.performance_category] || 0) + 1;
  }
  let impurity = 1;
  for (const label in counts) {
    const prob = counts[label] / rows.length;
    impurity -= prob * prob;
  }
  return impurity;
}

interface SplitResult {
  giniGain: number;
  feature: keyof Omit<EmployeeRecord, 'performance_category'>;
  threshold: number;
  leftRows: EmployeeRecord[];
  rightRows: EmployeeRecord[];
}

function findBestSplit(rows: EmployeeRecord[], featureKeys: (keyof Omit<EmployeeRecord, 'performance_category'>)[]): SplitResult | null {
  let bestGain = 0;
  let bestSplit: SplitResult | null = null;
  const currentGini = calcGini(rows);

  for (const feature of featureKeys) {
    // Collect all unique numeric values for thresholds
    const values = Array.from(new Set(rows.map(r => r[feature] as number))).sort((a, b) => a - b);
    
    // Test midpoints
    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2;
      const leftRows = rows.filter(r => (r[feature] as number) <= threshold);
      const rightRows = rows.filter(r => (r[feature] as number) > threshold);

      if (leftRows.length === 0 || rightRows.length === 0) continue;

      const leftGini = calcGini(leftRows);
      const rightGini = calcGini(rightRows);
      const childWeightGini = (leftRows.length / rows.length) * leftGini + (rightRows.length / rows.length) * rightGini;
      const gain = currentGini - childWeightGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestSplit = {
          giniGain: gain,
          feature,
          threshold,
          leftRows,
          rightRows
        };
      }
    }
  }

  return bestSplit;
}

function getMajorityLabel(rows: EmployeeRecord[]): string {
  const counts: { [key: string]: number } = {};
  let maxCount = -1;
  let majorityLabel = 'Average Performer';

  for (const r of rows) {
    counts[r.performance_category] = (counts[r.performance_category] || 0) + 1;
    if (counts[r.performance_category] > maxCount) {
      maxCount = counts[r.performance_category];
      majorityLabel = r.performance_category;
    }
  }
  return majorityLabel;
}

// Builds individual Decision Tree recursively
function buildTree(
  rows: EmployeeRecord[], 
  featureKeys: (keyof Omit<EmployeeRecord, 'performance_category'>)[], 
  maxDepth = 8, 
  currentDepth = 0, 
  minSize = 5
): DecisionNode {
  // Base cases: pure node or depth limit or too small
  const currentGini = calcGini(rows);
  if (currentGini === 0 || rows.length <= minSize || currentDepth >= maxDepth) {
    return { isLeaf: true, value: getMajorityLabel(rows) };
  }

  // Find best split
  const split = findBestSplit(rows, featureKeys);
  if (!split || split.giniGain <= 0.0001) {
    return { isLeaf: true, value: getMajorityLabel(rows) };
  }

  // Build left & right child trees
  const left = buildTree(split.leftRows, featureKeys, maxDepth, currentDepth + 1, minSize);
  const right = buildTree(split.rightRows, featureKeys, maxDepth, currentDepth + 1, minSize);

  return {
    isLeaf: false,
    feature: split.feature,
    threshold: split.threshold,
    left,
    right
  };
}

// Predict with a single Decision Tree
export function predictTree(node: DecisionNode, record: Omit<EmployeeRecord, 'performance_category'>): string {
  if (node.isLeaf) {
    return node.value!;
  }
  const featureVal = record[node.feature!] as number;
  if (featureVal <= node.threshold!) {
    return predictTree(node.left!, record);
  } else {
    return predictTree(node.right!, record);
  }
}

// 3. RANDOM FOREST ENSEMBLE COMPONENT
export function trainRandomForest(
  dataset: EmployeeRecord[],
  numTrees = 7,
  maxDepth = 8,
  minSize = 5,
  pctFeatureSample = 0.8
): RandomForestModel {
  const featureKeys: (keyof Omit<EmployeeRecord, 'performance_category'>)[] = [
    'quiz_score',
    'accuracy_percentage',
    'time_taken',
    'attempts',
    'previous_performance'
  ];

  const trees: DecisionNode[] = [];

  for (let i = 0; i < numTrees; i++) {
    // 1. Bootstrapping (sampling with replacement)
    const bootstrapSample: EmployeeRecord[] = [];
    for (let j = 0; j < dataset.length; j++) {
      const randIdx = Math.floor(Math.random() * dataset.length);
      bootstrapSample.push(dataset[randIdx]);
    }

    // 2. Feature selection subsetting (random subset of features to ensure tree diversity)
    const shuffledFeatures = [...featureKeys].sort(() => Math.random() - 0.5);
    const subFeaturesCount = Math.max(2, Math.floor(featureKeys.length * pctFeatureSample));
    const featureSubset = shuffledFeatures.slice(0, subFeaturesCount);

    // 3. Build tree
    const tree = buildTree(bootstrapSample, featureSubset, maxDepth, 0, minSize);
    trees.push(tree);
  }

  return {
    trees,
    accuracy: 0,
    confusionMatrix: {},
    classes: ['Needs Improvement', 'Average Performer', 'High Performer']
  };
}

// Predict ensemble vote
export function predictRandomForest(forest: RandomForestModel, record: Omit<EmployeeRecord, 'performance_category'>): string {
  const votes: { [key: string]: number } = {};
  for (const tree of forest.trees) {
    const p = predictTree(tree, record);
    votes[p] = (votes[p] || 0) + 1;
  }

  let maxVotes = -1;
  let winner = 'Average Performer';
  for (const label in votes) {
    if (votes[label] > maxVotes) {
      maxVotes = votes[label];
      winner = label;
    }
  }
  return winner;
}

// 4. MODEL EVALUATING AND METRICS
export function evaluateModel(forest: RandomForestModel, testSet: EmployeeRecord[]) {
  let correct = 0;
  const classes = forest.classes;
  
  // Matrix initialisation
  const matrix: { [key: string]: { [key: string]: number } } = {};
  for (const c1 of classes) {
    matrix[c1] = {};
    for (const c2 of classes) {
      matrix[c1][c2] = 0;
    }
  }

  for (const record of testSet) {
    const pred = predictRandomForest(forest, record);
    const actual = record.performance_category;
    
    matrix[actual][pred] = (matrix[actual][pred] || 0) + 1;
    if (pred === actual) {
      correct++;
    }
  }

  const accuracy = correct / testSet.length;
  forest.accuracy = accuracy;
  forest.confusionMatrix = matrix;

  // Print evaluation results beautifully
  console.log('====================================================');
  console.log('RANDOM FOREST MODEL TRAINING EVALUATION');
  console.log('====================================================');
  console.log(`Test set size: ${testSet.length} records`);
  console.log(`Validation Accuracy: ${(accuracy * 100).toFixed(2)}%\n`);

  console.log('CONFUSION MATRIX:');
  console.log('------------------');
  console.log(`                    Predicted`);
  console.log(`Actual              Needs Imp   Avg Perf   High Perf`);
  for (const actualClass of classes) {
    const row = matrix[actualClass];
    const n = String(row['Needs Improvement']).padStart(9);
    const a = String(row['Average Performer']).padStart(10);
    const h = String(row['High Performer']).padStart(11);
    const name = actualClass.slice(0, 15).padEnd(17);
    console.log(`${name}  ${n} ${a} ${h}`);
  }
  console.log('');

  console.log('CLASSIFICATION REPORT:');
  console.log('-----------------------');
  console.log(`Category             Precision   Recall    F1-Score`);
  
  for (const c of classes) {
    // Precision: True Positive / Predicted Positive
    let predPositive = 0;
    for (const act of classes) {
      predPositive += matrix[act][c];
    }
    const tp = matrix[c][c];
    const precision = predPositive > 0 ? tp / predPositive : 0;

    // Recall: True Positive / Actual Positive
    let actPositive = 0;
    for (const p of classes) {
      actPositive += matrix[c][p];
    }
    const recall = actPositive > 0 ? tp / actPositive : 0;

    // F1 Score
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    console.log(`${c.padEnd(20)} ${precision.toFixed(2).padStart(9)} ${recall.toFixed(2).padStart(8)} ${f1.toFixed(2).padStart(11)}`);
  }
  console.log('====================================================\n');
}

// 5. MAIN TRAINING PROGRAM EXECUTOR
function runTraining() {
  const datasetPath = path.join(process.cwd(), 'ml', 'dataset', 'employee_assessment_dataset.csv');
  const modelPath = path.join(process.cwd(), 'ml', 'rf_model.json');

  console.log('Generating synthetically augmented balanced dataset...');
  const dataset = generateDataset(datasetPath);

  // Shuffle and Split: 80% train, 20% test
  const shuffled = [...dataset].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(shuffled.length * 0.8);
  const trainSet = shuffled.slice(0, splitIdx);
  const testSet = shuffled.slice(splitIdx);

  console.log(`Training Random Forest Model (NumTrees: 7, MaxDepth: 8) on ${trainSet.length} entries...`);
  const forest = trainRandomForest(trainSet, 7, 8, 5, 0.8);
  
  evaluateModel(forest, testSet);

  // Serialize forest model to JSON
  console.log(`Saving RF Model state metadata file to ${modelPath}...`);
  fs.writeFileSync(modelPath, JSON.stringify(forest, null, 2), 'utf-8');
  console.log('ML Model compiled and saved successfully!');
}

// Execute program when called directly from tsx
if (import.meta.url.startsWith('file:') && process.argv[1] === path.resolve(process.argv[1])) {
  runTraining();
}
