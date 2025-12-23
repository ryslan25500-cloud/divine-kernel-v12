/**
 * 🌲 DIVINE KERNEL V12 - Newick Format Parser/Writer
 * 
 * Парсинг и генерация деревьев в формате Newick.
 * Стандартный формат для филогенетических деревьев.
 */

import { PhylogeneticTree } from '../phylo-tree.js';
import { TreeNode } from '../node.js';
import { log } from '../../utils/logger.js';
import { TreeError } from '../../utils/errors.js';

// ═══════════════════════════════════════════════════════════
// 📤 NEWICK EXPORT
// ═══════════════════════════════════════════════════════════

/**
 * Конвертирует дерево в формат Newick
 */
export function toNewick(tree: PhylogeneticTree): string {
  if (!tree.root) {
    throw new TreeError('Cannot export tree without root');
  }
  
  return nodeToNewick(tree.root) + ';';
}

/**
 * Конвертирует узел в формат Newick (рекурсивно)
 */
function nodeToNewick(node: TreeNode): string {
  if (node.isLeaf()) {
    // Листовой узел: name:branchLength
    return `${escapeName(node.name)}:${formatBranchLength(node.branchLength)}`;
  }
  
  // Внутренний узел: (children)name:branchLength
  const childrenNewick = node.children
    .map(child => nodeToNewick(child))
    .join(',');
  
  const name = node.name ? escapeName(node.name) : '';
  const branchLength = formatBranchLength(node.branchLength);
  
  return `(${childrenNewick})${name}:${branchLength}`;
}

/**
 * Экранирует имя узла для Newick формата
 */
function escapeName(name: string): string {
  // Если имя содержит специальные символы, оборачиваем в кавычки
  if (/[(),;:\[\]']/.test(name)) {
    return `'${name.replace(/'/g, "''")}'`;
  }
  return name;
}

/**
 * Форматирует длину ветви
 */
function formatBranchLength(length: number): string {
  if (length === 0) return '0';
  return length.toFixed(6);
}

// ═══════════════════════════════════════════════════════════
// 📥 NEWICK IMPORT
// ═══════════════════════════════════════════════════════════

/**
 * Парсит строку Newick в дерево
 */
export function fromNewick(newick: string): PhylogeneticTree {
  // Удаляем завершающую точку с запятой
  newick = newick.trim();
  if (newick.endsWith(';')) {
    newick = newick.slice(0, -1);
  }
  
  // Парсим
  const { node } = parseNewick(newick, 0);
  
  log.info('Parsed Newick tree');
  
  return new PhylogeneticTree(node);
}

/**
 * Парсит Newick формат (рекурсивно)
 */
function parseNewick(
  newick: string,
  startIndex: number
): { node: TreeNode; endIndex: number } {
  let index = startIndex;
  let node: TreeNode;
  
  // Проверяем начинается ли узел с '(' - это внутренний узел
  if (newick[index] === '(') {
    // Внутренний узел с детьми
    index++; // Пропускаем '('
    
    const children: TreeNode[] = [];
    
    // Парсим детей
    while (index < newick.length && newick[index] !== ')') {
      const { node: child, endIndex } = parseNewick(newick, index);
      children.push(child);
      index = endIndex;
      
      // Пропускаем запятую между детьми
      if (newick[index] === ',') {
        index++;
      }
    }
    
    if (newick[index] !== ')') {
      throw new TreeError(`Expected ')' at position ${index}`);
    }
    index++; // Пропускаем ')'
    
    // Создаём внутренний узел
    node = new TreeNode(undefined, 'internal');
    for (const child of children) {
      node.addChild(child);
    }
  } else {
    // Листовой узел
    node = new TreeNode(undefined, 'leaf');
  }
  
  // Парсим имя узла (если есть)
  const { name, endIndex: nameEnd } = parseName(newick, index);
  if (name) {
    node.name = name;
    index = nameEnd;
  }
  
  // Парсим длину ветви (если есть)
  if (newick[index] === ':') {
    index++; // Пропускаем ':'
    const { length, endIndex: lengthEnd } = parseBranchLength(newick, index);
    node.branchLength = length;
    index = lengthEnd;
  }
  
  return { node, endIndex: index };
}

/**
 * Парсит имя узла
 */
function parseName(newick: string, startIndex: number): { name: string; endIndex: number } {
  let index = startIndex;
  let name = '';
  
  // Проверяем quoted name
  if (newick[index] === "'") {
    index++; // Пропускаем начальную кавычку
    
    while (index < newick.length) {
      if (newick[index] === "'") {
        if (newick[index + 1] === "'") {
          // Экранированная кавычка
          name += "'";
          index += 2;
        } else {
          // Конец quoted name
          index++;
          break;
        }
      } else {
        name += newick[index];
        index++;
      }
    }
  } else {
    // Обычное имя (до специального символа)
    while (
      index < newick.length &&
      !/[(),;:\[\]]/.test(newick[index])
    ) {
      name += newick[index];
      index++;
    }
  }
  
  return { name: name.trim(), endIndex: index };
}

/**
 * Парсит длину ветви
 */
function parseBranchLength(newick: string, startIndex: number): { length: number; endIndex: number } {
  let index = startIndex;
  let lengthStr = '';
  
  // Читаем число (может быть с точкой и экспонентой)
  while (
    index < newick.length &&
    /[0-9.eE+\-]/.test(newick[index])
  ) {
    lengthStr += newick[index];
    index++;
  }
  
  const length = parseFloat(lengthStr) || 0;
  
  return { length, endIndex: index };
}

// ═══════════════════════════════════════════════════════════
// 📋 EXTENDED NEWICK (NHX)
// ═══════════════════════════════════════════════════════════

/**
 * Конвертирует дерево в расширенный формат Newick (с метаданными)
 */
export function toExtendedNewick(tree: PhylogeneticTree): string {
  if (!tree.root) {
    throw new TreeError('Cannot export tree without root');
  }
  
  return nodeToExtendedNewick(tree.root) + ';';
}

/**
 * Конвертирует узел в extended Newick
 */
function nodeToExtendedNewick(node: TreeNode): string {
  const base = node.isLeaf()
    ? `${escapeName(node.name)}:${formatBranchLength(node.branchLength)}`
    : `(${node.children.map(c => nodeToExtendedNewick(c)).join(',')})${escapeName(node.name)}:${formatBranchLength(node.branchLength)}`;
  
  // Добавляем метаданные в формате [&&NHX:key=value:key2=value2]
  const metadata = node.metadata;
  if (Object.keys(metadata).length > 0) {
    const nhx = Object.entries(metadata)
      .map(([key, value]) => `${key}=${value}`)
      .join(':');
    
    return `${base}[&&NHX:${nhx}]`;
  }
  
  return base;
}

/**
 * Парсит extended Newick
 */
export function fromExtendedNewick(newick: string): PhylogeneticTree {
  // TODO: Implement full NHX parsing
  // For now, just parse basic Newick and strip NHX tags
  const cleaned = newick.replace(/\[&&NHX:[^\]]*\]/g, '');
  return fromNewick(cleaned);
}

// ═══════════════════════════════════════════════════════════
// 🔄 NEWICK VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Валидирует Newick строку
 */
export function validateNewick(newick: string): ValidationResult {
  const errors: string[] = [];
  
  // Проверка базового синтаксиса
  if (!newick.trim()) {
    errors.push('Empty Newick string');
    return { isValid: false, errors };
  }
  
  // Проверка баланса скобок
  let openParens = 0;
  let closeParens = 0;
  
  for (const char of newick) {
    if (char === '(') openParens++;
    if (char === ')') closeParens++;
    
    if (closeParens > openParens) {
      errors.push('Unbalanced parentheses: too many closing parentheses');
      return { isValid: false, errors };
    }
  }
  
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  // Проверка точки с запятой в конце
  if (!newick.trim().endsWith(';')) {
    errors.push('Newick string should end with semicolon');
  }
  
  // Попытка парсинга
  try {
    fromNewick(newick);
  } catch (error: any) {
    errors.push(`Parse error: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════
// 📊 NEWICK UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Форматирует Newick строку для читаемости
 */
export function formatNewick(newick: string): string {
  let formatted = '';
  let indent = 0;
  let inQuotes = false;
  
  for (let i = 0; i < newick.length; i++) {
    const char = newick[i];
    
    if (char === "'" && newick[i - 1] !== "'") {
      inQuotes = !inQuotes;
    }
    
    if (!inQuotes) {
      if (char === '(') {
        formatted += char + '\n' + '  '.repeat(++indent);
      } else if (char === ')') {
        formatted += '\n' + '  '.repeat(--indent) + char;
      } else if (char === ',') {
        formatted += char + '\n' + '  '.repeat(indent);
      } else {
        formatted += char;
      }
    } else {
      formatted += char;
    }
  }
  
  return formatted;
}

/**
 * Сжимает Newick строку (удаляет пробелы)
 */
export function compactNewick(newick: string): string {
  return newick.replace(/\s+/g, '');
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  toNewick,
  fromNewick,
  toExtendedNewick,
  fromExtendedNewick,
  validateNewick,
  formatNewick,
  compactNewick,
};
