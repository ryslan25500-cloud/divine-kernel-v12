/**
 * 🌳 DIVINE KERNEL V12 - Phylogenetic Tree
 */

import { TreeNode } from './node.js';

export class PhylogeneticTree {
  root: TreeNode;

  constructor(root: TreeNode) {
    this.root = root;
  }

  get size(): number {
    return this.countNodes(this.root);
  }

  get height(): number {
    return this.getHeight(this.root);
  }

  get leaves(): TreeNode[] {
    const result: TreeNode[] = [];
    this.collectLeaves(this.root, result);
    return result;
  }

  get internalNodes(): TreeNode[] {
    const allNodes = this.getAllNodes();
    return allNodes.filter(n => n.children.length > 0);
  }

  private countNodes(node: TreeNode): number {
    if (!node) return 0;
    return 1 + node.children.reduce((sum, child) => sum + this.countNodes(child), 0);
  }

  private getHeight(node: TreeNode): number {
    if (!node || node.children.length === 0) return 0;
    return 1 + Math.max(...node.children.map(child => this.getHeight(child)));
  }

  private collectLeaves(node: TreeNode, result: TreeNode[]): void {
    if (!node) return;
    if (node.children.length === 0) {
      result.push(node);
    } else {
      node.children.forEach(child => this.collectLeaves(child, result));
    }
  }

  toNewick(): string {
    return this.nodeToNewick(this.root) + ';';
  }

  private nodeToNewick(node: TreeNode): string {
    if (node.children.length === 0) {
      return `${node.name}:${node.branchLength.toFixed(6)}`;
    }

    const childStrings = node.children.map(child => this.nodeToNewick(child));
    return `(${childStrings.join(',')})${node.name}:${node.branchLength.toFixed(6)}`;
  }

  traverseDFS(callback: (node: TreeNode) => void): void {
    this.traverseDFSHelper(this.root, callback);
  }

  private traverseDFSHelper(node: TreeNode, callback: (node: TreeNode) => void): void {
    if (!node) return;
    callback(node);
    node.children.forEach(child => this.traverseDFSHelper(child, callback));
  }

  traversePostOrder(callback: (node: TreeNode) => void): void {
    this.traversePostOrderHelper(this.root, callback);
  }

  private traversePostOrderHelper(node: TreeNode, callback: (node: TreeNode) => void): void {
    if (!node) return;
    node.children.forEach(child => this.traversePostOrderHelper(child, callback));
    callback(node);
  }

  getNodeDepth(node: TreeNode): number {
    return this.getNodeDepthHelper(this.root, node, 0);
  }

  private getNodeDepthHelper(current: TreeNode, target: TreeNode, depth: number): number {
    if (!current) return -1;
    if (current.id === target.id) return depth;
    
    for (const child of current.children) {
      const result = this.getNodeDepthHelper(child, target, depth + 1);
      if (result !== -1) return result;
    }
    
    return -1;
  }

  getStatistics() {
    const leaves = this.leaves;
    const allNodes = this.getAllNodes();
    const internalNodes = this.internalNodes;
    
    const totalBranchLength = allNodes.reduce((sum, node) => sum + node.branchLength, 0);
    const avgBranchLength = allNodes.length > 0 ? totalBranchLength / allNodes.length : 0;
    
    const isBinary = internalNodes.every(node => node.children.length === 2);
    const isBalanced = this.checkBalance(this.root);

    return {
      totalNodes: this.size,
      leaves: leaves.length,
      internalNodes: internalNodes.length,
      height: this.height,
      averageBranchLength: avgBranchLength,
      totalBranchLength,
      isBinary,
      isBalanced,
    };
  }

  private getAllNodes(): TreeNode[] {
    const result: TreeNode[] = [];
    this.collectAllNodes(this.root, result);
    return result;
  }

  private collectAllNodes(node: TreeNode, result: TreeNode[]): void {
    if (!node) return;
    result.push(node);
    node.children.forEach(child => this.collectAllNodes(child, result));
  }

  private checkBalance(node: TreeNode): boolean {
    if (!node || node.children.length === 0) return true;
    
    const heights = node.children.map(child => this.getHeight(child));
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    
    return (maxHeight - minHeight) <= 1;
  }
}

export default PhylogeneticTree;
