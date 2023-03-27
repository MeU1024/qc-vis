import {ComponentGate, Qubit, SuperQubit} from './qcmodel';

export class SemanticLayout {
  private _layout: Layout;
  constructor(componentGates: ComponentGate[]) {
    this._layout = this.layout(componentGates);
  }

  layout(componentGates: ComponentGate[]): Layout {
    const gates = this._sortGates(componentGates);
    let layoutMap = new Map<number, Layout>(); // treeIndex -> layout

    // strart from the bottom of the tree
    let maxDepth = Math.max(...gates.map((gate) => gate.depth));

    let treeLayers: ComponentGate[][] = new Array(maxDepth + 1);

    gates.forEach((gate) => {
      if (!treeLayers[gate.depth]) {
        treeLayers[gate.depth] = [];
      }
      treeLayers[gate.depth].push(gate);
    });

    let curDepth = maxDepth;
    let upperLayouts = new Map<number, Layout>();

    while (curDepth >= 0) {
      let curLayouts: Layout[] = Array.from(upperLayouts.values());
      upperLayouts = new Map<number, Layout>();
      treeLayers[curDepth]?.forEach((gate) => {
        let curLayout = new Layout([gate]);
        curLayouts.push(curLayout);
      });

      // merge the layouts
      curLayouts
        .sort((a, b) => {
          return a.timeRange[0] - b.timeRange[0];
        })
        .forEach((curLayout) => {
          let parentIndex = curLayout.treePath[curDepth - 1];
          let upperLayout = upperLayouts.get(parentIndex);

          if (!upperLayout) {
            upperLayout = curLayout;
            upperLayouts.set(parentIndex, upperLayout);
          } else {
            upperLayout.appendLayout(curLayout);
          }
        });
      
      upperLayouts.forEach((layout) => {
        layout.merge();
      });
      
      curDepth--;
    }

    if (upperLayouts.size > 1) {
      throw new Error('The layout is not unique');
    }

    return upperLayouts.values().next().value;
  }

  private _sortGates(componentGates: ComponentGate[]) {
    return componentGates.sort((a, b) => {
      if (a.depth === b.depth) {
        return a.index - b.index;
      }
      return a.depth - b.depth;
    });
  }

  get layers(): ComponentGate[][] {
    return this._layout.layers;
  }

  get gates(): ComponentGate[] {
    let gates: ComponentGate[] = [];
    this._layout.layers.forEach((layer) => {
      gates = gates.concat(layer);
    });
    return gates;
  }
}

export class Layout {
  private _qubitSet: Set<Qubit>;
  private _layers: ComponentGate[][];
  private _timeRange: number[];
  private _pendingLayouts: Layout[];

  constructor(gates: ComponentGate[]) {
    this._layers = [];
    this._qubitSet = new Set<Qubit>();
    this._pendingLayouts = [];

    // append the gates to the layout in order of the range
    gates
      .sort((a, b) => {
        return a.range[0] - b.range[0];
      })
      .forEach((gate) => {
        this.append(gate);
      });

    // set the time range
    this._timeRange = [
      gates[0].range[0],
      gates[gates.length - 1].range[1],
    ];
  }

  append(gate: ComponentGate) {
    let qubits = gate.qubits;

    // find the leftmost layer that the gate can be inserted
    let layerIndex = this._layers.length - 1;
    while (true) {
      if (layerIndex < 0) {
        layerIndex = 0;
        break;
      }

      let layer = this._layers[layerIndex];
      if (
        layer.some((gate) =>
          gate.qubits.some((qubit) => qubits.includes(qubit))
        )
      ) {
        // the gate cannot be inserted into this layer
        // move back to the previous layer
        layerIndex++;
        break;
      }
      layerIndex--;
    }

    // if the gate cannot be inserted into any layer
    // create a new layer
    if (layerIndex === this._layers.length) {
      this._layers.push([gate]);
    } else {
      // insert the gate into the layer
      this._layers[layerIndex].push(gate);
    }

    // merge the qubits avoiding duplicates
    this._mergeQubits(qubits);
  }

  appendLayout(newLayout: Layout) {
    this._pendingLayouts.push(newLayout);
  }

  merge() {
    let layouts: Layout[] = [this];
    layouts = layouts.concat(this._pendingLayouts);
    layouts.sort((a, b) => {
      return a.timeRange[0] - b.timeRange[0];
    });

    // calculate the max qubit index
    let maxQubitIndex = Math.max(
      ...layouts.map((layout) =>
        Math.max(...layout.qubits.map((qubit) => qubit.index))
      )
    );

    let depthBuffer: number[] = new Array(maxQubitIndex + 1).fill(0);

    // the max length of newLayers is the sum of the width of the layouts
    let newLayers: ComponentGate[][] = new Array(
      layouts.reduce((acc, layout) => acc + layout.width, 0)
    );

    layouts.forEach((layout) => {
      const rangeY = layout.rangeY;

      // find the leftmost layer that the gate can be inserted
      let layerIndex = 0;
      for (let i = rangeY[0]; i <= rangeY[1]; i++) {
        layerIndex = Math.max(layerIndex, depthBuffer[i]);
      }

      // insert the gates starting from the layerIndex
      layout.layers.forEach((layer) => {
        if (!newLayers[layerIndex]) {
          newLayers[layerIndex] = [];
        }
        newLayers[layerIndex].push(...layer);
        layerIndex++;
      });

      // update the depth buffer
      for (let i = rangeY[0]; i <= rangeY[1]; i++) {
        depthBuffer[i] = layerIndex;
      }
    });

    // remove the empty layers
    newLayers = newLayers.filter((layer) => layer.length > 0);

    // set the new layers
    this._layers = newLayers;

    // merge the qubits avoiding duplicates
    layouts.forEach((layout) => {
      this._mergeQubits(layout.qubits);
    });

    // empty the pending layouts
    this._pendingLayouts = [];
  }

  isIntersect(other: Layout) {
    // check if the projection of the two layouts on the y-axis intersect
    const otherRangeY = other.rangeY;
    const thisRangeY = this.rangeY;
    return (
      (otherRangeY[0] >= thisRangeY[0] && otherRangeY[0] <= thisRangeY[1]) ||
      (otherRangeY[1] >= thisRangeY[0] && otherRangeY[1] <= thisRangeY[1]) ||
      (thisRangeY[0] >= otherRangeY[0] && thisRangeY[0] <= otherRangeY[1]) ||
      (thisRangeY[1] >= otherRangeY[0] && thisRangeY[1] <= otherRangeY[1])
    );
  }

  private _mergeQubits(qubits: Qubit[]) {
    qubits.forEach((qubit) => {
      if (qubit instanceof SuperQubit) {
        this._mergeQubits(qubit.qubits);
      } else {
        this._qubitSet.add(qubit);
      }
    });
  }

  get qubits(): Qubit[] {
    return Array.from(this._qubitSet);
  }

  get layers(): ComponentGate[][] {
    return this._layers;
  }

  get width(): number {
    return this._layers.length;
  }

  get rangeY(): number[] {
    let qubits = this.qubits;
    let minY = qubits[0].index;
    let maxY = qubits[0].index;
    qubits.forEach((qubit) => {
      minY = Math.min(minY, qubit.index);
      maxY = Math.max(maxY, qubit.index);
    });
    return [minY, maxY];
  }

  get timeRange(): number[] {
    return this._timeRange;
  }

  get treePath(): number[] {
    return this.layers[0][0].treePath;
  }
}

export class SemanticTree {}
