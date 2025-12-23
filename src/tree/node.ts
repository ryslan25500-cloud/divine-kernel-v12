/**
 * 🔵 DIVINE KERNEL V12 - TreeNode Class
 * 
 * Узел филогенетического дерева.
 * Представляет организм или внутренний узел (предка).
 */

import { DNASequence } from '../dna/sequence.js';
import { generateUUID } from '../utils/helpers.js';

// ═══════════════════════════════════════════════════════════
// 🔵 TREE NODE CLASS
// ═══════════════════════════════════════════════════════════

export class TreeNode {
  private _id: string;
  private _name: string;
  private _parent: TreeNode | null = null;
  private _children: TreeNode[] = [];
  private _branchLength: number = 0;
  private _sequence?: DNASequence;
  private _metadata: Record<string, any> = {};
  
  constructor(
    id: string = generateUUID(),
    name: string,
    options: TreeNodeOptions = {}
  ) {
    this._id = id;
    this._name = name;
    
    const {
      parent,
      children = [],
      branchLength = 0,
      sequence,
      metadata = {},
    } = options;
    
    this._parent = parent || null;
    this._children = children;
    this._branchLength = branchLength;
    this._sequence = sequence;
    this._metadata = metadata;
    
    // Устанавливаем себя как родителя для детей
    for (const child of children) {
      child._parent = this;
    }
  }
  
  // ───────────────────────────────────────────────────────────
  // 📏 BASIC PROPERTIES
  // ───────────────────────────────────────────────────────────
  
  get id(): string {
    return this._id;
  }
  
  get name(): string {
    return this._name;
  }
  
  set name(value: string) {
    this._name = value;
  }
  
  get parent(): TreeNode | null {
    return this._parent;
  }
  
  set parent(node: TreeNode | null) {
    this._parent = node;
  }
  
  get children(): TreeNode[] {
    return this._children;
  }
  
  set children(nodes: TreeNode[]) {
    this._children = nodes;
    
    // Устанавливаем себя как родителя
    for (const child of nodes) {
      child._parent = this;
    }
  }
  
  get branchLength(): number {
    return this._branchLength;
  }
  
  set branchLength(length: number) {
    this._branchLength = length;
  }
  
  get sequence(): DNASequence | undefined {
    return this._sequence;
  }
  
  set sequence(seq: DNASequence | undefined) {
    this._sequence = seq;
  }
  
  get metadata(): Record<string, any> {
    return this._metadata;
  }
  
  // ───────────────────────────────────────────────────────────
  // 🔍 QUERIES
  // ───────────────────────────────────────────────────────────
  
  /**
   * Проверяет является ли узел листом (нет детей)
   */
  isLeaf(): boolean {
    return this._children.length === 0;
  }
  
  /**
   * Проверяет является ли узел корнем (нет родителя)
   */
  isRoot(): boolean {
    return this._parent === null;
  }
  
  /**
   * Проверяет является ли узел внутренним (есть и родитель и дети)
   */
  isInternal(): boolean {
    return !this.isLeaf() && !this.isRoot();
  }
  
  /**
   * Получает количество потомков
   */
  getDescendantCount(): number {
    let count = this._children.length;
    
    for (const child of this._children) {
      count += child.getDescendantCount();
    }
    
    return count;
  }
  
  /**
   * Получает всех потомков
   */
  getDescendants(): TreeNode[] {
    const descendants: TreeNode[] = [];
    
    for (const child of this._children) {
      descendants.push(child);
      descendants.push(...child.getDescendants());
    }
    
    return descendants;
  }
  
  /**
   * Получает всех листьев в поддереве
   */
  getLeaves(): TreeNode[] {
    if (this.isLeaf()) {
      return [this];
    }
    
    const leaves: TreeNode[] = [];
    
    for (const child of this._children) {
      leaves.push(...child.getLeaves());
    }
    
    return leaves;
  }
  
  /**
   * Получает путь от корня к этому узлу
   */
  getPathFromRoot(): TreeNode[] {
    const path: TreeNode[] = [this];
    let current = this._parent;
    
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    
    return path;
  }
  
  /**
   * Получает глубину (расстояние от корня)
   */
  getDepth(): number {
    let depth = 0;
    let current = this._parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }
  
  /**
   * Получает высоту (максимальное расстояние до листа)
   */
  getHeight(): number {
    if (this.isLeaf()) return 0;
    
    let maxHeight = 0;
    
    for (const child of this._children) {
      const height = child.getHeight() + 1;
      maxHeight = Math.max(maxHeight, height);
    }
    
    return maxHeight;
  }
  
  // ───────────────────────────────────────────────────────────
  // ✏️ MODIFICATIONS
  // ───────────────────────────────────────────────────────────
  
  /**
   * Добавляет ребёнка
   */
  addChild(child: TreeNode): void {
    if (!this._children.includes(child)) {
      this._children.push(child);
      child._parent = this;
    }
  }
  
  /**
   * Удаляет ребёнка
   */
  removeChild(child: TreeNode): void {
    const index = this._children.indexOf(child);
    
    if (index !== -1) {
      this._children.splice(index, 1);
      child._parent = null;
    }
  }
  
  /**
   * Удаляет всех детей
   */
  clearChildren(): void {
    for (const child of this._children) {
      child._parent = null;
    }
    
    this._children = [];
  }
  
  /**
   * Заменяет ребёнка
   */
  replaceChild(oldChild: TreeNode, newChild: TreeNode): void {
    const index = this._children.indexOf(oldChild);
    
    if (index !== -1) {
      this._children[index] = newChild;
      oldChild._parent = null;
      newChild._parent = this;
    }
  }
  
  // ───────────────────────────────────────────────────────────
  // 📊 METADATA
  // ───────────────────────────────────────────────────────────
  
  /**
   * Устанавливает метаданные
   */
  setMetadata(key: string, value: any): void {
    this._metadata[key] = value;
  }
  
  /**
   * Получает метаданные
   */
  getMetadata(key: string): any {
    return this._metadata[key];
  }
  
  /**
   * Проверяет наличие метаданных
   */
  hasMetadata(key: string): boolean {
    return key in this._metadata;
  }
  
  /**
   * Удаляет метаданные
   */
  removeMetadata(key: string): void {
    delete this._metadata[key];
  }
  
  // ───────────────────────────────────────────────────────────
  // 🧬 SEQUENCE OPERATIONS
  // ───────────────────────────────────────────────────────────
  
  /**
   * Вычисляет расстояние до другого узла (Hamming)
   */
  getGeneticDistance(other: TreeNode): number | null {
    if (!this._sequence || !other.sequence) {
      return null;
    }
    
    return this._sequence.hammingDistance(other.sequence);
  }
  
  /**
   * Вычисляет идентичность с другим узлом
   */
  getIdentity(other: TreeNode): number | null {
    if (!this._sequence || !other.sequence) {
      return null;
    }
    
    return this._sequence.identity(other.sequence);
  }
  
  // ───────────────────────────────────────────────────────────
  // 🎨 FORMATTING
  // ───────────────────────────────────────────────────────────
  
  /**
   * Конвертирует в строку
   */
  toString(): string {
    let str = this._name;
    
    if (this._branchLength > 0) {
      str += `:${this._branchLength.toFixed(4)}`;
    }
    
    if (this._sequence) {
      str += ` [${this._sequence.length}bp]`;
    }
    
    return str;
  }
  
  /**
   * Конвертирует в JSON
   */
  toJSON(): object {
    return {
      id: this._id,
      name: this._name,
      branchLength: this._branchLength,
      isLeaf: this.isLeaf(),
      sequence: this._sequence ? {
        length: this._sequence.length,
        gcContent: this._sequence.gcContent,
      } : null,
      metadata: this._metadata,
      children: this._children.map(c => c.toJSON()),
    };
  }
  
  /**
   * Конвертирует в Newick формат
   */
  toNewick(): string {
    if (this.isLeaf()) {
      return `${this._name}:${this._branchLength.toFixed(4)}`;
    }
    
    const childrenNewick = this._children
      .map(c => c.toNewick())
      .join(',');
    
    const name = this._name || '';
    return `(${childrenNewick})${name}:${this._branchLength.toFixed(4)}`;
  }
  
  /**
   * Клонирует узел (глубокое копирование)
   */
  clone(): TreeNode {
    const clonedChildren = this._children.map(c => c.clone());
    
    return new TreeNode(
      generateUUID(), // Новый ID
      this._name,
      {
        children: clonedChildren,
        branchLength: this._branchLength,
        sequence: this._sequence ? this._sequence.clone() : undefined,
        metadata: { ...this._metadata },
      }
    );
  }
  
  // ───────────────────────────────────────────────────────────
  // 🔍 SEARCH
  // ───────────────────────────────────────────────────────────
  
  /**
   * Ищет узел по имени в поддереве
   */
  findByName(name: string): TreeNode | null {
    if (this._name === name) {
      return this;
    }
    
    for (const child of this._children) {
      const found = child.findByName(name);
      if (found) return found;
    }
    
    return null;
  }
  
  /**
   * Ищет узел по ID в поддереве
   */
  findById(id: string): TreeNode | null {
    if (this._id === id) {
      return this;
    }
    
    for (const child of this._children) {
      const found = child.findById(id);
      if (found) return found;
    }
    
    return null;
  }
  
  /**
   * Ищет узлы по условию
   */
  findAll(predicate: (node: TreeNode) => boolean): TreeNode[] {
    const results: TreeNode[] = [];
    
    if (predicate(this)) {
      results.push(this);
    }
    
    for (const child of this._children) {
      results.push(...child.findAll(predicate));
    }
    
    return results;
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Создаёт листовой узел
 */
export function createLeaf(
  name: string,
  sequence: DNASequence,
  branchLength: number = 0
): TreeNode {
  return new TreeNode(generateUUID(), name, {
    sequence,
    branchLength,
    metadata: { type: 'leaf' },
  });
}

/**
 * Создаёт внутренний узел
 */
export function createInternalNode(
  name: string,
  children: TreeNode[],
  branchLength: number = 0
): TreeNode {
  return new TreeNode(generateUUID(), name, {
    children,
    branchLength,
    metadata: { type: 'internal' },
  });
}

/**
 * Создаёт корневой узел
 */
export function createRootNode(name: string = 'root'): TreeNode {
  return new TreeNode('root', name, {
    metadata: { type: 'root' },
  });
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface TreeNodeOptions {
  parent?: TreeNode;
  children?: TreeNode[];
  branchLength?: number;
  sequence?: DNASequence;
  metadata?: Record<string, any>;
  isLeaf?: boolean;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default TreeNode;
