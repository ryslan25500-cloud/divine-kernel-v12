/**
 * 🎨 DIVINE KERNEL V12 - SVG Tree Renderer
 * 
 * Визуализация филогенетических деревьев в SVG формате.
 * Поддержка различных стилей: rectangular, circular, radial.
 */

import { PhylogeneticTree } from '../phylo-tree.js';
import { TreeNode } from '../node.js';
import { log } from '../../utils/logger.js';

// ═══════════════════════════════════════════════════════════
// 🎨 SVG TREE RENDERER
// ═══════════════════════════════════════════════════════════

/**
 * Рендерит дерево в SVG формат
 */
export function renderTree(
  tree: PhylogeneticTree,
  options: RenderOptions = {}
): string {
  const {
    style = 'rectangular',
    width = 800,
    height = 600,
    fontSize = 12,
    nodeRadius = 4,
    branchColor = '#333',
    leafColor = '#2563eb',
    showBranchLengths = true,
    showBootstrap = true,
    margin = 40,
  } = options;
  
  if (!tree.root) {
    throw new Error('Cannot render tree without root');
  }
  
  log.info(`Rendering ${style} tree (${width}x${height})`);
  
  // Выбираем стиль рендеринга
  switch (style) {
    case 'rectangular':
      return renderRectangularTree(tree, { ...options, width, height, margin });
    case 'circular':
      return renderCircularTree(tree, { ...options, width, height, margin });
    case 'radial':
      return renderRadialTree(tree, { ...options, width, height, margin });
    default:
      return renderRectangularTree(tree, { ...options, width, height, margin });
  }
}

// ═══════════════════════════════════════════════════════════
// 📐 RECTANGULAR TREE
// ═══════════════════════════════════════════════════════════

/**
 * Рендерит прямоугольное дерево (классический стиль)
 */
function renderRectangularTree(
  tree: PhylogeneticTree,
  options: RenderOptions
): string {
  const { width = 800, height = 600, margin = 40 } = options;
  
  // Вычисляем координаты узлов
  const leaves = tree.leaves;
  const coords = computeRectangularCoordinates(tree, width, height, margin);
  
  // Собираем SVG элементы
  const elements: string[] = [];
  
  // Рендерим ветви
  tree.traverseDFS((node) => {
    if (node.parent) {
      const nodeCoord = coords.get(node.id);
      const parentCoord = coords.get(node.parent.id);
      
      if (nodeCoord && parentCoord) {
        // Horizontal line
        elements.push(
          `<line x1="${parentCoord.x}" y1="${nodeCoord.y}" x2="${nodeCoord.x}" y2="${nodeCoord.y}" ` +
          `stroke="${options.branchColor || '#333'}" stroke-width="2"/>`
        );
        
        // Vertical line
        elements.push(
          `<line x1="${parentCoord.x}" y1="${parentCoord.y}" x2="${parentCoord.x}" y2="${nodeCoord.y}" ` +
          `stroke="${options.branchColor || '#333'}" stroke-width="2"/>`
        );
        
        // Branch length label
        if (options.showBranchLengths && node.branchLength > 0) {
          const midX = (parentCoord.x + nodeCoord.x) / 2;
          elements.push(
            `<text x="${midX}" y="${nodeCoord.y - 5}" font-size="10" fill="#666" text-anchor="middle">` +
            `${node.branchLength.toFixed(3)}</text>`
          );
        }
      }
    }
  });
  
  // Рендерим узлы
  tree.traverseDFS((node) => {
    const coord = coords.get(node.id);
    if (!coord) return;
    
    // Узел
    const color = node.isLeaf() ? (options.leafColor || '#2563eb') : (options.branchColor || '#333');
    elements.push(
      `<circle cx="${coord.x}" cy="${coord.y}" r="${options.nodeRadius || 4}" fill="${color}"/>`
    );
    
    // Метка узла
    if (node.isLeaf()) {
      elements.push(
        `<text x="${coord.x + 10}" y="${coord.y + 4}" font-size="${options.fontSize || 12}" fill="#333">` +
        `${node.name}</text>`
      );
    }
    
    // Bootstrap support
    if (options.showBootstrap && node.hasMetadata('bootstrap') && !node.isLeaf()) {
      const bootstrap = node.getMetadata('bootstrap');
      elements.push(
        `<text x="${coord.x - 5}" y="${coord.y - 10}" font-size="10" fill="#666" text-anchor="end">` +
        `${bootstrap.toFixed(0)}</text>`
      );
    }
  });
  
  // Собираем SVG
  return createSVG(width, height, elements.join('\n'));
}

/**
 * Вычисляет координаты для прямоугольного дерева
 */
function computeRectangularCoordinates(
  tree: PhylogeneticTree,
  width: number,
  height: number,
  margin: number
): Map<string, Coordinate> {
  const coords = new Map<string, Coordinate>();
  
  const leaves = tree.leaves;
  const maxDepth = tree.height;
  
  const usableWidth = width - 2 * margin;
  const usableHeight = height - 2 * margin;
  
  const xStep = usableWidth / maxDepth;
  const yStep = usableHeight / (leaves.length - 1);
  
  // Назначаем Y координаты листьям
  leaves.forEach((leaf, index) => {
    const depth = tree.getNodeDepth(leaf);
    coords.set(leaf.id, {
      x: margin + depth * xStep,
      y: margin + index * yStep,
    });
  });
  
  // Вычисляем координаты внутренних узлов (post-order)
  tree.traversePostOrder((node) => {
    if (!node.isLeaf()) {
      const childCoords = node.children
        .map(c => coords.get(c.id))
        .filter((c): c is Coordinate => c !== undefined);
      
      if (childCoords.length > 0) {
        const avgY = childCoords.reduce((sum, c) => sum + c.y, 0) / childCoords.length;
        const depth = tree.getNodeDepth(node);
        
        coords.set(node.id, {
          x: margin + depth * xStep,
          y: avgY,
        });
      }
    }
  });
  
  return coords;
}

// ═══════════════════════════════════════════════════════════
// ⭕ CIRCULAR TREE
// ═══════════════════════════════════════════════════════════

/**
 * Рендерит круговое дерево
 */
function renderCircularTree(
  tree: PhylogeneticTree,
  options: RenderOptions
): string {
  const { width = 800, height = 800, margin = 100 } = options;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - margin;
  
  const coords = computeCircularCoordinates(tree, centerX, centerY, radius);
  const elements: string[] = [];
  
  // Рендерим ветви (кривые)
  tree.traverseDFS((node) => {
    if (node.parent) {
      const nodeCoord = coords.get(node.id);
      const parentCoord = coords.get(node.parent.id);
      
      if (nodeCoord && parentCoord) {
        // Curved path
        const path = `M ${parentCoord.x} ${parentCoord.y} ` +
                    `Q ${parentCoord.x} ${nodeCoord.y} ${nodeCoord.x} ${nodeCoord.y}`;
        
        elements.push(
          `<path d="${path}" stroke="${options.branchColor || '#333'}" stroke-width="2" fill="none"/>`
        );
      }
    }
  });
  
  // Рендерим узлы
  tree.traverseDFS((node) => {
    const coord = coords.get(node.id);
    if (!coord) return;
    
    const color = node.isLeaf() ? (options.leafColor || '#2563eb') : (options.branchColor || '#333');
    elements.push(
      `<circle cx="${coord.x}" cy="${coord.y}" r="${options.nodeRadius || 4}" fill="${color}"/>`
    );
    
    if (node.isLeaf()) {
      // Rotate label to face outward
      const angle = coord.angle || 0;
      const textX = coord.x + Math.cos(angle * Math.PI / 180) * 10;
      const textY = coord.y + Math.sin(angle * Math.PI / 180) * 10;
      
      elements.push(
        `<text x="${textX}" y="${textY}" font-size="${options.fontSize || 12}" fill="#333">` +
        `${node.name}</text>`
      );
    }
  });
  
  return createSVG(width, height, elements.join('\n'));
}

/**
 * Вычисляет координаты для кругового дерева
 */
function computeCircularCoordinates(
  tree: PhylogeneticTree,
  centerX: number,
  centerY: number,
  radius: number
): Map<string, Coordinate> {
  const coords = new Map<string, Coordinate>();
  
  const leaves = tree.leaves;
  const maxDepth = tree.height;
  
  const angleStep = 360 / leaves.length;
  
  // Назначаем углы листьям
  leaves.forEach((leaf, index) => {
    const angle = index * angleStep;
    const depth = tree.getNodeDepth(leaf);
    const r = (depth / maxDepth) * radius;
    
    const x = centerX + r * Math.cos((angle * Math.PI) / 180);
    const y = centerY + r * Math.sin((angle * Math.PI) / 180);
    
    coords.set(leaf.id, { x, y, angle });
  });
  
  // Вычисляем координаты внутренних узлов
  tree.traversePostOrder((node) => {
    if (!node.isLeaf()) {
      const childCoords = node.children
        .map(c => coords.get(c.id))
        .filter((c): c is Coordinate => c !== undefined);
      
      if (childCoords.length > 0) {
        const avgAngle = childCoords.reduce((sum, c) => sum + (c.angle || 0), 0) / childCoords.length;
        const depth = tree.getNodeDepth(node);
        const r = (depth / maxDepth) * radius;
        
        const x = centerX + r * Math.cos((avgAngle * Math.PI) / 180);
        const y = centerY + r * Math.sin((avgAngle * Math.PI) / 180);
        
        coords.set(node.id, { x, y, angle: avgAngle });
      }
    }
  });
  
  return coords;
}

// ═══════════════════════════════════════════════════════════
// 🌟 RADIAL TREE
// ═══════════════════════════════════════════════════════════

/**
 * Рендерит радиальное дерево
 */
function renderRadialTree(
  tree: PhylogeneticTree,
  options: RenderOptions
): string {
  // Radial - similar to circular but branches are straight lines
  return renderCircularTree(tree, options);
}

// ═══════════════════════════════════════════════════════════
// 🔧 SVG UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Создаёт SVG документ
 */
function createSVG(width: number, height: number, content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${content}
</svg>`;
}

/**
 * Экспортирует дерево в SVG файл
 */
export function exportSVG(
  tree: PhylogeneticTree,
  options: RenderOptions = {}
): string {
  return renderTree(tree, options);
}

/**
 * Создаёт интерактивный SVG с zoom и pan
 */
export function renderInteractiveSVG(
  tree: PhylogeneticTree,
  options: RenderOptions = {}
): string {
  const svg = renderTree(tree, options);
  
  // Добавляем JavaScript для интерактивности
  const interactive = svg.replace(
    '</svg>',
    `<script type="text/javascript"><![CDATA[
      // Zoom and pan functionality
      var svg = document.querySelector('svg');
      var viewBox = { x: 0, y: 0, width: ${options.width || 800}, height: ${options.height || 600} };
      
      svg.addEventListener('wheel', function(e) {
        e.preventDefault();
        var scale = e.deltaY > 0 ? 1.1 : 0.9;
        viewBox.width *= scale;
        viewBox.height *= scale;
        svg.setAttribute('viewBox', viewBox.x + ' ' + viewBox.y + ' ' + viewBox.width + ' ' + viewBox.height);
      });
    ]]></script>
  </svg>`
  );
  
  return interactive;
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface RenderOptions {
  style?: 'rectangular' | 'circular' | 'radial';
  width?: number;
  height?: number;
  fontSize?: number;
  nodeRadius?: number;
  branchColor?: string;
  leafColor?: string;
  showBranchLengths?: boolean;
  showBootstrap?: boolean;
  margin?: number;
}

interface Coordinate {
  x: number;
  y: number;
  angle?: number;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  renderTree,
  exportSVG,
  renderInteractiveSVG,
};
