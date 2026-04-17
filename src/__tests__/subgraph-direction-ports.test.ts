/**
 * Tests for subgraph direction override in presence of cross-hierarchy edges.
 *
 * Reproduces the bug where a subgraph with `direction LR` and only incoming
 * cross-hierarchy edges would render its children stacked vertically instead
 * of horizontally. Fixed by pinning hierarchical port sides based on the
 * parent graph's direction so ELK can lay out children along the child's
 * direction instead of the port→node axis.
 */
import { describe, it, expect } from 'bun:test'
import { parseMermaid } from '../parser.ts'
import { layoutGraphSync } from '../layout.ts'

function nodeById(nodes: ReturnType<typeof layoutGraphSync>['nodes'], id: string) {
  const n = nodes.find(n => n.id === id)
  if (!n) throw new Error(`node ${id} not found in layout`)
  return n
}

describe('subgraph direction override with cross-hierarchy edges', () => {
  it('lays out LR child horizontally when only incoming edges exist (TB parent)', () => {
    const graph = parseMermaid(`
flowchart TB
  SRC_A["A"]
  SRC_B["B"]
  subgraph SG["Group"]
    direction LR
    N1["One"]
    N2["Two"]
    N3["Three"]
    N4["Four"]
  end
  SRC_A --> N1
  SRC_A --> N2
  SRC_B --> N3
  SRC_B --> N4
`)
    const { nodes } = layoutGraphSync(graph)
    const n1 = nodeById(nodes, 'N1')
    const n2 = nodeById(nodes, 'N2')
    const n3 = nodeById(nodes, 'N3')
    const n4 = nodeById(nodes, 'N4')

    // All four children should share (approximately) the same Y — horizontal layout
    const ys = [n1.y, n2.y, n3.y, n4.y]
    const yRange = Math.max(...ys) - Math.min(...ys)
    expect(yRange).toBeLessThan(5)

    // And have distinct X coordinates in declaration order
    const xs = [n1.x, n2.x, n3.x, n4.x]
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]!).toBeGreaterThan(xs[i - 1]!)
    }
  })

  it('lays out TB child vertically when only incoming edges exist (LR parent)', () => {
    const graph = parseMermaid(`
flowchart LR
  SRC["S"]
  subgraph SG
    direction TB
    N1
    N2
    N3
  end
  SRC --> N1
  SRC --> N2
  SRC --> N3
`)
    const { nodes } = layoutGraphSync(graph)
    const n1 = nodeById(nodes, 'N1')
    const n2 = nodeById(nodes, 'N2')
    const n3 = nodeById(nodes, 'N3')

    const xs = [n1.x, n2.x, n3.x]
    const xRange = Math.max(...xs) - Math.min(...xs)
    expect(xRange).toBeLessThan(5)

    expect(n2.y).toBeGreaterThan(n1.y)
    expect(n3.y).toBeGreaterThan(n2.y)
  })

  it('still respects internal edges inside a direction-override subgraph', () => {
    // Regression guard for the existing "A --> B inside LR subgraph" behavior
    const graph = parseMermaid(`
graph TD
subgraph one [LR Group]
    direction LR
    A --> B
end
X --> A
B --> Y
`)
    const { nodes } = layoutGraphSync(graph)
    const a = nodeById(nodes, 'A')
    const b = nodeById(nodes, 'B')
    expect(b.x).toBeGreaterThan(a.x)
    expect(Math.abs(a.y - b.y)).toBeLessThan(5)
  })
})
