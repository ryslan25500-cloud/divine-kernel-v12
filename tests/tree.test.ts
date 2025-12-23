/**
 * 🌳 Tree Tests
 */

import { TreeNode } from '../src/tree/node.js';
import { PhylogeneticTree } from '../src/tree/phylo-tree.js';

console.log('🌳 Testing Tree Module...\n');

const root = new TreeNode('root', 'Root');
const child1 = new TreeNode('c1', 'Child1');
const child2 = new TreeNode('c2', 'Child2');

root.addChild(child1);
root.addChild(child2);

const tree = new PhylogeneticTree(root);

console.assert(tree.size === 3, 'Size test');
console.assert(tree.leaves.length === 2, 'Leaves test');

console.log('✅ All Tree tests passed!');
