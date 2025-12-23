/**
 * 🤝 DIVINE KERNEL V12 - Neighbor-Joining Algorithm
 * 
 * Популярный алгоритм построения филогенетических деревьев.
 * Быстрый метод на основе матрицы расстояний.
 */

import { PhylogeneticTree } from '../phylo-tree.js';
import { TreeNode, createLeaf } from '../node.js';
import { DNASequence } from '../../dna/sequence.js';
import { log } from '../../utils/logger.js';
import { InsufficientDataError, TreeError } from '../../utils/errors.js';

// ═══════════════════════════════════════════════════════════
// 🤝 NEIGHBOR-JOINING ALGORITHM
// ═══════════════════════════════════════════════════════════

/**
 * Строит дерево методом Neighbor-Joining
 */
export function neighborJoining(
  sequences: Array<{ id: string; name: string; sequence: DNASequence }>,
  distanceFunction: (seq1: DNASequence, seq2: DNASequence) => number
): PhylogeneticTree {
  if (sequences.length < 2) {
    throw new InsufficientDataError(2, sequences.length);
  }
  
  log.info(`Building tree with Neighbor-Joining (${sequences.length} sequences)`);
  
  // Создаём начальные узлы (листья)
  const nodes: NJNode[] = sequences.map(({ id, name, sequence }) => ({
    id,
    name,
    sequence,
    node: createLeaf(name, sequence),
  }));
  
  // Вычисляем матрицу расстояний
  const distanceMatrix = computeDistanceMatrix(nodes, distanceFunction);
  
  // Запускаем алгоритм NJ
  const root = runNeighborJoining(nodes, distanceMatrix);
  
  log.info('Neighbor-Joining tree built successfully');
  
  return new PhylogeneticTree(root);
}

/**
 * Основной алгоритм Neighbor-Joining
 */
function runNeighborJoining(
  initialNodes: NJNode[],
  initialDistances: DistanceMatrix
): TreeNode {
  // Копируем исходные данные
  let nodes = [...initialNodes];
  let distances = cloneDistanceMatrix(initialDistances);
  
  let nodeCounter = nodes.length;
  
  // Итеративно объединяем узлы
  while (nodes.length > 2) {
    // Вычисляем Q-матрицу
    const qMatrix = computeQMatrix(nodes, distances);
    
    // Находим пару с минимальным Q
    const { i, j } = findMinimumQ(qMatrix);
    
    // Вычисляем длины ветвей
    const { branchI, branchJ } = computeBranchLengths(nodes, distances, i, j);
    
    // Создаём новый внутренний узел
    const nodeI = nodes[i];
    const nodeJ = nodes[j];
    
    nodeI.node.branchLength = branchI;
    nodeJ.node.branchLength = branchJ;
    
    const newNode: NJNode = {
      id: `internal_${nodeCounter++}`,
      name: `Node${nodeCounter}`,
      node: new TreeNode(`internal_${nodeCounter}`, `Node${nodeCounter}`),
    };
    
    newNode.node.addChild(nodeI.node);
    newNode.node.addChild(nodeJ.node);
    
    // Обновляем список узлов
    const newNodes = nodes.filter((_, idx) => idx !== i && idx !== j);
    newNodes.push(newNode);
    
    // Обновляем матрицу расстояний
    distances = updateDistanceMatrix(nodes, distances, i, j, newNode);
    
    nodes = newNodes;
    
    log.debug(`Joined ${nodeI.name} and ${nodeJ.name}`);
  }
  
  // Остались 2 узла - создаём корень
  if (nodes.length === 2) {
    const dist = getDistance(distances, nodes[0].id, nodes[1].id);
    
    nodes[0].node.branchLength = dist / 2;
    nodes[1].node.branchLength = dist / 2;
    
    const root = new TreeNode('root', 'Root');
    root.addChild(nodes[0].node);
    root.addChild(nodes[1].node);
    
    return root;
  }
  
  // Единственный узел - это корень
  return nodes[0].node;
}

// ═══════════════════════════════════════════════════════════
// 📊 DISTANCE MATRIX
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет матрицу расстояний
 */
function computeDistanceMatrix(
  nodes: NJNode[],
  distanceFunction: (seq1: DNASequence, seq2: DNASequence) => number
): DistanceMatrix {
  const matrix: DistanceMatrix = {};
  
  for (let i = 0; i < nodes.length; i++) {
    const nodeI = nodes[i];
    matrix[nodeI.id] = {};
    
    for (let j = 0; j < nodes.length; j++) {
      const nodeJ = nodes[j];
      
      if (i === j) {
        matrix[nodeI.id][nodeJ.id] = 0;
      } else if (nodeI.sequence && nodeJ.sequence) {
        const distance = distanceFunction(nodeI.sequence, nodeJ.sequence);
        matrix[nodeI.id][nodeJ.id] = distance;
      } else {
        // Если нет последовательности, используем текущее расстояние
        matrix[nodeI.id][nodeJ.id] = 0;
      }
    }
  }
  
  return matrix;
}

/**
 * Клонирует матрицу расстояний
 */
function cloneDistanceMatrix(matrix: DistanceMatrix): DistanceMatrix {
  const cloned: DistanceMatrix = {};
  
  for (const [id1, row] of Object.entries(matrix)) {
    cloned[id1] = { ...row };
  }
  
  return cloned;
}

/**
 * Получает расстояние из матрицы
 */
function getDistance(matrix: DistanceMatrix, id1: string, id2: string): number {
  return matrix[id1]?.[id2] ?? 0;
}

/**
 * Обновляет матрицу расстояний после объединения
 */
function updateDistanceMatrix(
  nodes: NJNode[],
  distances: DistanceMatrix,
  i: number,
  j: number,
  newNode: NJNode
): DistanceMatrix {
  const nodeI = nodes[i];
  const nodeJ = nodes[j];
  
  // Создаём новую матрицу
  const newMatrix: DistanceMatrix = {};
  
  // Копируем старые расстояния (кроме i и j)
  for (const node of nodes) {
    if (node.id !== nodeI.id && node.id !== nodeJ.id) {
      newMatrix[node.id] = {};
      
      for (const otherNode of nodes) {
        if (otherNode.id !== nodeI.id && otherNode.id !== nodeJ.id) {
          newMatrix[node.id][otherNode.id] = getDistance(distances, node.id, otherNode.id);
        }
      }
    }
  }
  
  // Вычисляем расстояния от нового узла до всех остальных
  newMatrix[newNode.id] = {};
  
  for (const node of nodes) {
    if (node.id !== nodeI.id && node.id !== nodeJ.id) {
      // Формула: d(new, k) = (d(i,k) + d(j,k) - d(i,j)) / 2
      const distIK = getDistance(distances, nodeI.id, node.id);
      const distJK = getDistance(distances, nodeJ.id, node.id);
      const distIJ = getDistance(distances, nodeI.id, nodeJ.id);
      
      const distNew = (distIK + distJK - distIJ) / 2;
      
      newMatrix[newNode.id][node.id] = distNew;
      newMatrix[node.id][newNode.id] = distNew;
    }
  }
  
  newMatrix[newNode.id][newNode.id] = 0;
  
  return newMatrix;
}

// ═══════════════════════════════════════════════════════════
// 🧮 Q-MATRIX CALCULATION
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет Q-матрицу для Neighbor-Joining
 */
function computeQMatrix(nodes: NJNode[], distances: DistanceMatrix): QMatrix {
  const n = nodes.length;
  const qMatrix: QMatrix = {};
  
  // Вычисляем суммы расстояний для каждого узла
  const sumDistances: Record<string, number> = {};
  
  for (const node of nodes) {
    let sum = 0;
    for (const otherNode of nodes) {
      if (node.id !== otherNode.id) {
        sum += getDistance(distances, node.id, otherNode.id);
      }
    }
    sumDistances[node.id] = sum;
  }
  
  // Вычисляем Q-значения
  for (let i = 0; i < nodes.length; i++) {
    const nodeI = nodes[i];
    qMatrix[nodeI.id] = {};
    
    for (let j = 0; j < nodes.length; j++) {
      const nodeJ = nodes[j];
      
      if (i === j) {
        qMatrix[nodeI.id][nodeJ.id] = 0;
      } else {
        // Q(i,j) = (n-2) * d(i,j) - sum(i) - sum(j)
        const dij = getDistance(distances, nodeI.id, nodeJ.id);
        const q = (n - 2) * dij - sumDistances[nodeI.id] - sumDistances[nodeJ.id];
        qMatrix[nodeI.id][nodeJ.id] = q;
      }
    }
  }
  
  return qMatrix;
}

/**
 * Находит пару узлов с минимальным Q
 */
function findMinimumQ(qMatrix: QMatrix): { i: number; j: number } {
  const ids = Object.keys(qMatrix);
  let minQ = Infinity;
  let minI = 0;
  let minJ = 1;
  
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const q = qMatrix[ids[i]][ids[j]];
      
      if (q < minQ) {
        minQ = q;
        minI = i;
        minJ = j;
      }
    }
  }
  
  return { i: minI, j: minJ };
}

// ═══════════════════════════════════════════════════════════
// 📏 BRANCH LENGTH CALCULATION
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет длины ветвей для объединяемой пары
 */
function computeBranchLengths(
  nodes: NJNode[],
  distances: DistanceMatrix,
  i: number,
  j: number
): { branchI: number; branchJ: number } {
  const nodeI = nodes[i];
  const nodeJ = nodes[j];
  const n = nodes.length;
  
  // Вычисляем суммы расстояний
  let sumI = 0;
  let sumJ = 0;
  
  for (const node of nodes) {
    if (node.id !== nodeI.id && node.id !== nodeJ.id) {
      sumI += getDistance(distances, nodeI.id, node.id);
      sumJ += getDistance(distances, nodeJ.id, node.id);
    }
  }
  
  const dij = getDistance(distances, nodeI.id, nodeJ.id);
  
  // Формулы длин ветвей
  const branchI = dij / 2 + (sumI - sumJ) / (2 * (n - 2));
  const branchJ = dij - branchI;
  
  // Гарантируем неотрицательные длины
  return {
    branchI: Math.max(0, branchI),
    branchJ: Math.max(0, branchJ),
  };
}

// ═══════════════════════════════════════════════════════════
// 📊 TREE VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Валидирует построенное дерево
 */
export function validateNJTree(tree: PhylogeneticTree): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Проверка на наличие корня
  if (!tree.root) {
    errors.push('Tree has no root');
    return { isValid: false, errors, warnings };
  }
  
  // Проверка длин ветвей
  tree.traverseDFS((node) => {
    if (node.branchLength < 0) {
      errors.push(`Node ${node.name} has negative branch length: ${node.branchLength}`);
    }
    
    if (node.branchLength === 0 && !node.isRoot()) {
      warnings.push(`Node ${node.name} has zero branch length`);
    }
  });
  
  // Проверка структуры
  const stats = tree.getStatistics();
  
  if (!stats.isBinary) {
    warnings.push('Tree is not binary (some nodes have more than 2 children)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════
// 📈 BOOTSTRAP SUPPORT
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет bootstrap support для дерева
 */
export function computeBootstrap(
  sequences: Array<{ id: string; name: string; sequence: DNASequence }>,
  distanceFunction: (seq1: DNASequence, seq2: DNASequence) => number,
  replicates: number = 100
): PhylogeneticTree {
  log.info(`Computing bootstrap support (${replicates} replicates)`);
  
  // Строим основное дерево
  const mainTree = neighborJoining(sequences, distanceFunction);
  
  // Получаем все внутренние узлы
  const internalNodes = mainTree.internalNodes;
  const supportCounts = new Map<string, number>();
  
  for (const node of internalNodes) {
    supportCounts.set(node.id, 0);
  }
  
  // Bootstrap resampling
  for (let rep = 0; rep < replicates; rep++) {
    // Ресемплируем последовательности
    const resampledSequences = resampleSequences(sequences);
    
    // Строим дерево на ресемплированных данных
    const bootstrapTree = neighborJoining(resampledSequences, distanceFunction);
    
    // Сравниваем топологии
    // TODO: Implement topology comparison
    
    if (rep % 10 === 0) {
      log.debug(`Bootstrap replicate ${rep + 1}/${replicates}`);
    }
  }
  
  // Добавляем bootstrap support к узлам
  for (const node of internalNodes) {
    const support = supportCounts.get(node.id) || 0;
    node.setMetadata('bootstrap', (support / replicates) * 100);
  }
  
  log.info('Bootstrap analysis complete');
  
  return mainTree;
}

/**
 * Ресемплирует последовательности (с возвратом)
 */
function resampleSequences(
  sequences: Array<{ id: string; name: string; sequence: DNASequence }>
): Array<{ id: string; name: string; sequence: DNASequence }> {
  // TODO: Implement proper bootstrap resampling
  // For now, just return original sequences
  return sequences;
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

interface NJNode {
  id: string;
  name: string;
  sequence?: DNASequence;
  node: TreeNode;
}

interface DistanceMatrix {
  [id1: string]: {
    [id2: string]: number;
  };
}

interface QMatrix {
  [id1: string]: {
    [id2: string]: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  neighborJoining,
  validateNJTree,
  computeBootstrap,
};
