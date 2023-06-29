import path from "path";
import * as vscode from "vscode";

import { getLogger } from "../components/logger";
import { QCViewerManagerService } from "../components/viewerlib/qcviewermanager";

import * as qv from "../quantivine";
import { getExtensionUri } from "../quantivine";
import { DataLoader } from "./structurelib/dataloader";
import { SemanticLayout } from "./structurelib/layout";
import {
  Qubit,
  ComponentGate,
  Layer,
  SuperQubit,
  DrawableCircuit,
  Region,
} from "./structurelib/qcmodel";
import { QuantumTreeNode } from "./structurelib/quantumgate";

const logger = getLogger("DataProvider", "Component");

export class ComponentDataProvider {
  private _data: ComponentCircuit | undefined;
  private _dataFile: vscode.Uri;

  constructor(_dataFile?: vscode.Uri) {
    if (_dataFile) {
      this._dataFile = _dataFile;
    } else {
      this._dataFile = qv.getDefaultDataFile();
    }
  }

  get data() {
    return this._data;
  }

  set data(data: any) {
    this._data = data;
  }

  async updateData() {
    this._data = await this.componentQcData();
    this._postData();
  }
  setFocus(index: number) {
    const data = this._data?.setFocus(index);
    if (data !== undefined) {
      this._postHighlightData(data);
    }
  }

  async componentQcData() {
    let componentCircuit = new ComponentCircuit(this._dataFile);

    return componentCircuit;
  }

  private async _postHighlightData(
    data: {
      layer: number[];
      qubit: number[];
      name: string;
      weight: number;
    }[]
  ) {
    if (data !== undefined) {
      let message = {
        command: "component.setRegion",
        data: data,
      };

      let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

      panelSet?.forEach((panel) => {
        panel.postMessage(message);
        logger.log(`Sent Message: ${panel.sourceFileUri}`);
      });
    }
  }

  private async _postData() {
    if (!this._data) {
      return;
    }
    let message1 = {
      command: "component.setTitle",
      data: { title: "Component View" },
    };

    let message2 = {
      command: "component.setCircuit",
      data: this._data.exportJson(),
    };

    let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

    panelSet?.forEach((panel) => {
      panel.postMessage(message1);
      panel.postMessage(message2);
      // logger.log(`Sent Message: ${panel.dataFileUri}`);
    });
  }
}

export class ComponentCircuit {
  getPredecessors(gate: ComponentGate): ComponentGate[] {
    throw new Error("Method not implemented.");
  }
  getSuccessors(gate: ComponentGate): ComponentGate[] {
    throw new Error("Method not implemented.");
  }
  private _originalGates: ComponentGate[];
  private _originalQubits: Qubit[];
  private _treeStructure: {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[];

  private _superQubits: Qubit[];
  private _qubits: Qubit[];
  private _gates: ComponentGate[];
  private _layers: Layer[];
  private _pushLayers: Layer[];
  private _gateLayerMap: Map<ComponentGate, number>;
  private _treeMap: Map<number, number>;
  private _groupInfoMap: Map<number, { gatesIndex: number[] }>;
  private _superQubitMap: Map<Qubit, number>;
  private _layerMap: Map<number, number[]>;
  private _drawableCircuit: DrawableCircuit;
  private _treeChildrenList: number[][];
  private _highlightedComponent: number[];
  constructor(dataFile: vscode.Uri) {
    this._qubits = [];

    // if (jsonData === undefined) {
    //   jsonData.qubits.forEach((qubitName: string) => {
    //     this._qubits.push(new Qubit(qubitName, this._qubits.length));
    //   });
    // }

    this._gates = [];
    this._layers = [];
    this._pushLayers = [];

    this._superQubits = [];
    this._originalQubits = [];
    this._originalGates = [];
    this._treeChildrenList = [];
    this._superQubitMap = new Map<Qubit, number>();
    this._gateLayerMap = new Map<ComponentGate, number>();
    this._treeMap = new Map<number, number>();
    this._layerMap = new Map<number, number[]>();
    this._groupInfoMap = new Map<number, { gatesIndex: number[] }>();
    this._drawableCircuit = new DrawableCircuit();
    this._highlightedComponent = [];

    const algorithmName = path.basename(dataFile.fsPath, ".py");

    const dataLoader = qv.manager.dataLoader;
    this._originalQubits = dataLoader.qubits;
    this._originalGates = dataLoader.quantumGates;
    this._treeStructure = this._importStructureFromFile();
    this._updateTreeMap();
    this._build();
  }

  private _groupGates(rawGates: ComponentGate[]) {
    const labelMap = this._labelGate(rawGates);

    let componentGates: ComponentGate[] = [];
    labelMap.forEach((gates, label) => {
      let node = this._getTreeNode(gates[0]);
      let gateName = this._treeStructure[node.treeIndex].name;
      let qubits: Qubit[] = [];
      let range: number[] = gates[0].range;
      let treeIndex: number = node.treeIndex;
      let treePath = gates[0].treePath.slice(0, node.semanticDepth + 1);

      gates.forEach((gate) => {
        qubits = qubits.concat(gate.qubits);
      });

      qubits = qubits.filter((qubit, index) => {
        return qubits.indexOf(qubit) === index;
      });

      if (gateName[0] === "_" && gateName[1] !== "c") {
        qubits.sort((a, b) => {
          return parseInt(a.qubitName) - parseInt(b.qubitName);
        });
      }

      let componentGate = new ComponentGate(
        gateName,
        qubits,
        range,
        treeIndex,
        treePath
      );

      componentGates.push(componentGate);
    });

    return componentGates;
  }

  private _labelGate(rawGates: ComponentGate[]) {
    let labelMap = new Map<number, ComponentGate[]>();
    rawGates.forEach((gate: ComponentGate) => {
      let node = this._getTreeNode(gate);
      let depth = node.semanticDepth;
      let label = gate.treePath[depth];
      if (!labelMap.has(label)) {
        labelMap.set(label, []);
      }
      labelMap.get(label)?.push(gate);
    });
    return labelMap;
  }

  private _getTreeNode(gate: ComponentGate) {
    let semanticTreeNodeIndex = this._treeMap.get(gate.treeIndex);
    if (semanticTreeNodeIndex === undefined) {
      throw new Error("Semantic tree node not found");
    }
    let node = qv.semanticTreeViewer.getNodeByTreeIndex(semanticTreeNodeIndex);

    if (node === undefined) {
      throw new Error("Semantic tree node not found");
    }
    return node;
  }

  private _mapGateToLayer(): Map<ComponentGate, number> {
    let gateLayerMap = new Map<ComponentGate, number>();
    this._layers.forEach((layer, layerIndex) => {
      layer.gates.forEach((gate) => {
        gateLayerMap.set(gate, layerIndex);
      });
    });
    return gateLayerMap;
  }

  setFocus(index: number) {
    if (!this._highlightedComponent.includes(index)) {
      this._highlightedComponent.push(index);
    }

    const regions = this.getComponentRegion();

    return regions;
  }
  getGateLayer(gate: ComponentGate): number | undefined {
    return this._gateLayerMap.get(gate);
  }

  getOriginalGates(): ComponentGate[] {
    return this._originalGates;
  }

  getOriginalQubits(): Qubit[] {
    return this._originalQubits;
  }

  getQubits(): Qubit[] {
    return this._qubits;
  }

  getLayers(): Layer[] {
    return this._layers;
  }

  private _importGatesFromFile(dataFile: vscode.Uri) {
    logger.log("Load layer data from: " + dataFile.fsPath);
    let data = require(dataFile.fsPath);

    this._originalQubits = [];
    data.qubits.forEach((qubitName: string) => {
      this._originalQubits.push(
        new Qubit(qubitName, this._originalQubits.length)
      );
    });

    data.layers.forEach((layer: any) => {
      layer.forEach((gate: any) => {
        const qubits = gate[1].map((bit: number) => {
          return this._originalQubits[bit];
        });
        const componentGate = new ComponentGate(
          gate[0],
          qubits,
          gate[2],
          gate[3],
          gate[4]
        );
        this._originalGates.push(componentGate);
      });
    });
  }

  private _importStructureFromFile(): {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[] {
    const dataLoader = qv.manager.dataLoader;
    const data = dataLoader.structureData;
    let treeStructure = data.map((tree: any) => {
      return {
        name: tree.name,
        parentIndex: tree.parentIndex,
        index: tree.index,
        type: tree.type,
      };
    });
    return treeStructure;
  }

  private _updateTreeMap() {
    this._treeChildrenList = this._treeStructure.map((item) => [item.index]);
    this._treeStructure.forEach(
      (item: {
        name: string;
        parentIndex: number;
        index: number;
        type: string;
      }) => {
        let parentIndex = item.parentIndex;
        let treeIndex = item.index;
        let previousIndex = treeIndex;
        while (1) {
          let treeVisible = qv.semanticTreeViewer.isVisible(treeIndex);
          // let parentVisible = qv.semanticTreeViewer.isVisible(parentIndex);

          if (treeVisible) {
            if (this._treeStructure[treeIndex].type === "rep") {
              treeIndex = previousIndex;
            }
            break;
          } else {
            if (this._treeStructure[treeIndex].type !== "rep") {
              previousIndex = treeIndex;
            }
            parentIndex = this._treeStructure[parentIndex].parentIndex;
            treeIndex = this._treeStructure[treeIndex].parentIndex;
          }
        }

        this._treeMap.set(item.index, treeIndex);

        let nodeIndex = item.parentIndex;
        while (nodeIndex !== 0) {
          this._treeChildrenList[nodeIndex].push(item.index);
          nodeIndex = this._treeStructure[nodeIndex].parentIndex;
        }
        // this._funcNodeMap.set();
      }
    );
  }
  private _build() {
    // Build component circuit

    let componentGates = this._groupGates(qv.manager.dataLoader.quantumGates);
    const { edgeMap, qubitMap } = this._bundling(componentGates);
    const newComponentGates = this._updateGateQubit(componentGates, edgeMap);
    this._gates = newComponentGates;
    let layout = new SemanticLayout(newComponentGates);
    let laidGates = layout.gates;
    let laidLayers = layout.layers;

    this._generateLayout(laidLayers);
  }

  private _bundling_(
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
      repTimes: string;
    }[]
  ) {
    //bundling
    let qubitsGateSetList: { gateSet: Set<number>; isMergable: boolean }[] =
      this._originalQubits.map((bit: Qubit) => {
        return { gateSet: new Set(), isMergable: true };
      });
    let edgeMap = this._originalQubits.map((qubit: Qubit, qubitIndex) => {
      return qubitIndex;
    });

    gatesInfo.forEach((gateInfo, index) => {
      gateInfo.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = parseInt(qubit.qubitName);
        qubitsGateSetList[qubitIndex].gateSet.add(index);
        if (this._treeStructure[gateInfo.treeIndex].type === "rep_item") {
          qubitsGateSetList[qubitIndex].isMergable = false;
        }
      });
    });

    const eqSet = (xs: Set<number>, ys: Set<number>) =>
      xs.size === ys.size && [...xs].every((x) => ys.has(x));

    let mergableEdges: number[] = [];
    let currentSet: Set<number> = new Set();
    let newEdges: number[][] = [];
    edgeMap.forEach((edge: number) => {
      if (qubitsGateSetList[edge].isMergable) {
        if (mergableEdges.length === 0) {
          currentSet = qubitsGateSetList[edge].gateSet;
          mergableEdges.push(edge);
        } else {
          if (eqSet(qubitsGateSetList[edge].gateSet, currentSet)) {
            mergableEdges.push(edge);
          } else {
            newEdges.push(mergableEdges);
            mergableEdges = [edge];
            currentSet = qubitsGateSetList[edge].gateSet;
          }
        }
      } else {
        if (mergableEdges.length !== 0) {
          newEdges.push(mergableEdges);
          mergableEdges = [];
          currentSet = new Set();
        }
        newEdges.push([edge]);
      }
    });
    if (mergableEdges.length !== 0) {
      newEdges.push(mergableEdges);
    }

    newEdges.sort((a: number[], b: number[]) => {
      return a[0] - b[0];
    });
    let superQubitMap = new Map<Qubit, number>();
    let qubitMap = new Map<Qubit, SuperQubit>();

    let superQubits = newEdges.map((edges: number[], index) => {
      const qubits = edges.map((index) => {
        return this._originalQubits[index];
      });
      const qubitName =
        qubits.length === 1
          ? edges[0].toString()
          : edges[0].toString() + "-" + edges[edges.length - 1].toString();
      const superQubit = new SuperQubit(qubitName, qubits);
      superQubitMap.set(superQubit, index);
      qubits.forEach((qubit: Qubit) => {
        qubitMap.set(qubit, superQubit);
      });
      return superQubit;
    });

    this._qubits = superQubits;
    this._superQubitMap = superQubitMap;

    //mapping to new edge
    newEdges.forEach((edges: number[], index) => {
      edges.forEach((edge: number) => {
        edgeMap[edge] = index;
      });
    });

    return { edgeMap, qubitMap };
  }

  private _bundling(componentGates: ComponentGate[]) {
    //bundling
    let qubitsGateSetList: { gateSet: Set<number>; isMergable: boolean }[] =
      this._originalQubits.map((bit: Qubit) => {
        return { gateSet: new Set(), isMergable: true };
      });
    let edgeMap = this._originalQubits.map((qubit: Qubit, qubitIndex) => {
      return qubitIndex;
    });

    componentGates.forEach((componentGate, index) => {
      componentGate.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = parseInt(qubit.qubitName);
        qubitsGateSetList[qubitIndex].gateSet.add(index);
        if (this._treeStructure[componentGate.treeIndex].type === "rep_item") {
          qubitsGateSetList[qubitIndex].isMergable = false;
        }
      });
    });

    const eqSet = (xs: Set<number>, ys: Set<number>) =>
      xs.size === ys.size && [...xs].every((x) => ys.has(x));

    let mergableEdges: number[] = [];
    let currentSet: Set<number> = new Set();
    let newEdges: number[][] = [];
    edgeMap.forEach((edge: number) => {
      if (qubitsGateSetList[edge].isMergable) {
        if (mergableEdges.length === 0) {
          currentSet = qubitsGateSetList[edge].gateSet;
          mergableEdges.push(edge);
        } else {
          if (eqSet(qubitsGateSetList[edge].gateSet, currentSet)) {
            mergableEdges.push(edge);
          } else {
            newEdges.push(mergableEdges);
            mergableEdges = [edge];
            currentSet = qubitsGateSetList[edge].gateSet;
          }
        }
      } else {
        if (mergableEdges.length !== 0) {
          newEdges.push(mergableEdges);
          mergableEdges = [];
          currentSet = new Set();
        }
        newEdges.push([edge]);
      }
    });
    if (mergableEdges.length !== 0) {
      newEdges.push(mergableEdges);
    }

    newEdges.sort((a: number[], b: number[]) => {
      return a[0] - b[0];
    });
    let superQubitMap = new Map<Qubit, number>();
    let qubitMap = new Map<Qubit, SuperQubit>();

    let superQubits = newEdges.map((edges: number[], index) => {
      const qubits = edges.map((index) => {
        return this._originalQubits[index];
      });
      const qubitName =
        qubits.length === 1
          ? edges[0].toString()
          : edges[0].toString() + "-" + edges[edges.length - 1].toString();
      const superQubit = new SuperQubit(qubitName, qubits);
      superQubitMap.set(superQubit, index);
      qubits.forEach((qubit: Qubit) => {
        qubitMap.set(qubit, superQubit);
      });
      return superQubit;
    });

    this._qubits = superQubits;
    this._superQubitMap = superQubitMap;

    //mapping to new edge
    newEdges.forEach((edges: number[], index) => {
      edges.forEach((edge: number) => {
        edgeMap[edge] = index;
      });
    });

    return { edgeMap, qubitMap };
  }

  private _updateGateQubit(componentGates: ComponentGate[], edgeMap: number[]) {
    const newGates = componentGates.map((gate) => {
      const qubitSet = new Set<Qubit>();
      gate.qubits.forEach((qubit) => {
        qubitSet.add(this._qubits[edgeMap[parseInt(qubit.qubitName)]]);
      });
      return new ComponentGate(
        gate.gateName,
        Array.from(qubitSet),
        gate.range,
        gate.treeIndex,
        gate.repTimes
      );
    });

    return newGates;
  }
  private _placement(
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
    }[],
    edgeMap: number[]
  ) {
    //gate placement
    let qubitsPlacement = this._qubits.map((bit: Qubit) => {
      return 0;
    });
    let qubitsMask = this._qubits.map((bit: Qubit) => {
      return 0;
    });

    let layers: number[][] = [];
    gatesInfo.forEach((gateInfo, index) => {
      //placement
      let layerIndex = 0;
      gateInfo.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
        if (qubitIndex !== undefined) {
          if (qubitsPlacement[qubitIndex] > layerIndex) {
            layerIndex = qubitsPlacement[qubitIndex];
          }
        }
      });
      if (layers.length < layerIndex + 1) {
        layers.push([index]);
      } else {
        layers[layerIndex].push(index);
      }

      gateInfo.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
        if (qubitIndex !== undefined) {
          qubitsPlacement[qubitIndex] = layerIndex + 1;
        }
      });
    });

    return layers;
  }

  private _semBasedPlacement(
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
      repTimes: string;
    }[],
    edgeMap: number[]
    // treeIndexGatesMap: Map<number, number[]>
  ) {
    //gate placement
    let qubitsPlacement = this._qubits.map((bit: Qubit) => {
      return 0;
    });
    let layers: number[][] = [];

    let functionPlacement = 0;
    let qSet = new Set<number>();
    let functionTreeIndex = 0;

    gatesInfo.forEach((gateInfo, index) => {
      //placement
      let layerIndex = 0;

      //get parent function index
      let node = this._treeStructure[gateInfo.treeIndex];
      node = this._treeStructure[node.parentIndex];
      while (node.type !== "fun") {
        node = this._treeStructure[node.parentIndex];
      }
      const parentFuncIndex = node.index;

      //if parent change update qubit placement state
      if (parentFuncIndex !== functionTreeIndex) {
        const qRange = Array.from(qSet).sort((a: number, b: number) => {
          return a - b;
        });

        for (
          let index = qRange[0];
          index <= qRange[qRange.length - 1];
          index++
        ) {
          qubitsPlacement[index] = functionPlacement;
        }
        functionPlacement = 0;
        qSet = new Set<number>();
        functionTreeIndex = parentFuncIndex;
      }

      gateInfo.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
        if (qubitIndex !== undefined) {
          if (qubitsPlacement[qubitIndex] > layerIndex) {
            layerIndex = qubitsPlacement[qubitIndex];
          }
          qSet.add(qubitIndex);
        }
      });
      if (layers.length < layerIndex + 1) {
        layers.push([index]);
      } else {
        layers[layerIndex].push(index);
      }

      if (functionPlacement < layerIndex + 1) {
        functionPlacement = layerIndex + 1;
      }

      gateInfo.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
        if (qubitIndex !== undefined) {
          qubitsPlacement[qubitIndex] = layerIndex + 1;
        }
      });
    });

    return layers;
  }

  private _generateLayout_(
    layers: number[][],
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
      repTimes: string;
    }[],
    qubitMap: Map<Qubit, SuperQubit>
  ) {
    this._gates = [];
    const componentLayers = layers.map((layer: number[]) => {
      const gates = layer.map((gateIndex: number) => {
        const gateInfo = gatesInfo[gateIndex];
        const qubits = new Set<SuperQubit>();
        gateInfo.qubits.forEach((qubit) => {
          const superQubit = qubitMap.get(qubit);
          if (superQubit !== undefined) {
            qubits.add(superQubit);
          }
        });

        const gate = new ComponentGate(
          gateInfo.name,
          Array.from(qubits),
          gateInfo.range,
          gateInfo.treeIndex,
          []
        );
        this._gates.push(gate);
        return gate;
      });
      return new Layer(gates);
    });

    this._layers = componentLayers;
    this._pushLayers = this._checkOverlap(componentLayers);
    this._gateLayerMap = this._mapGateToLayer();
    this._drawableCircuit.loadFromLayers(
      this._pushLayers,
      this._qubits,
      this._superQubitMap
    );
  }

  private _generateLayout(layers: ComponentGate[][]) {
    const componentLayers = layers.map((layer: ComponentGate[]) => {
      return new Layer(layer);
    });

    this._layers = componentLayers;
    this._pushLayers = this._checkOverlap(componentLayers);
    this._gateLayerMap = this._mapGateToLayer();
    this._drawableCircuit.loadFromLayers(
      this._layers,
      this._qubits,

      this._superQubitMap
    );
  }

  private _checkOverlap(componentLayers: Layer[]) {
    const newLayers: Layer[] = [];
    const layerMap: Map<number, number[]> = new Map<number, number[]>();
    for (
      let layerIndex = 0;
      layerIndex < componentLayers.length;
      layerIndex++
    ) {
      const layer = componentLayers[layerIndex];
      let qubitsPlacement = new Array(this._qubits.length).fill(0);
      let newLayer: ComponentGate[] = [];
      const layerMapValue: number[] = [];
      layer.gates.forEach((gate: ComponentGate, index) => {
        let minQubit = this._superQubitMap.get(gate.qubits[0]);
        let maxQubit = this._superQubitMap.get(
          gate.qubits[gate.qubits.length - 1]
        );
        if (minQubit !== undefined && maxQubit !== undefined) {
          if (minQubit > maxQubit) {
            const temp = maxQubit;
            maxQubit = minQubit;
            minQubit = temp;
          }
          let ifOverlap = false;
          for (let index = minQubit; index <= maxQubit; index++) {
            if (qubitsPlacement[index] === 1) {
              ifOverlap = true;
              break;
            }
          }
          if (ifOverlap) {
            layerMapValue.push(newLayers.length);
            newLayers.push(new Layer(newLayer));
            for (let index = 0; index <= this._qubits.length; index++) {
              qubitsPlacement[index] = 0;
            }
            for (let index = minQubit; index <= maxQubit; index++) {
              qubitsPlacement[index] = 1;
            }
            newLayer = [];
            newLayer.push(gate);
          } else {
            newLayer.push(gate);
            for (let index = minQubit; index <= maxQubit; index++) {
              qubitsPlacement[index] = 1;
            }
          }
        }
      });
      if (newLayer.length !== 0) {
        newLayers.push(new Layer(newLayer));
        newLayer = [];
        for (let index = 0; index <= this._qubits.length; index++) {
          qubitsPlacement[index] = 0;
        }
      }
      layerMap.set(layerIndex, layerMapValue);
    }
    this._layerMap = layerMap;
    return newLayers;
  }

  slice(range: number[]): ComponentGate[] {
    let ret: ComponentGate[] = [];

    this._gates.forEach((gate) => {
      if (gate.range[0] >= range[0] && gate.range[1] <= range[1]) {
        ret.push(gate);
      }
    });

    return ret;
  }

  getNodeDepth(treeIndex: number) {
    let depth = 0;
    let node = this._treeStructure[treeIndex];
    while (node.index !== 0) {
      if (node.type !== "rep") {
        depth++;
      }
      node = this._treeStructure[node.parentIndex];
    }
    return depth;
  }

  getComponentRegion() {
    const gateGroupDictList: {
      dict: { [key: number]: ComponentGate[] };
      index: number;
    }[] = [];
    this._highlightedComponent.forEach((componentIndex) => {
      let gatesDict: { [key: number]: ComponentGate[] } = {};
      this._gates.forEach((gate, index) => {
        if (this._treeChildrenList[componentIndex].includes(gate.treeIndex)) {
          const uni_index = gate.treePath[this.getNodeDepth(componentIndex)];
          const gates = gatesDict[uni_index];
          if (gates !== undefined) {
            gatesDict[uni_index] = [...gates, gate];
          } else {
            gatesDict[uni_index] = [gate];
          }
        }
      });
      gateGroupDictList.push({ dict: gatesDict, index: componentIndex });
    });

    const componentRegion: {
      layer: number[];
      qubit: number[];
      name: string;
      weight: number;
    }[] = [];

    gateGroupDictList.forEach(
      (
        groupInfo: {
          dict: { [key: number]: ComponentGate[] };
          index: number;
        },
        gateIndex
      ) => {
        const allGatesIndex = Object.values(groupInfo.dict);

        allGatesIndex.forEach((gatesIndex: ComponentGate[]) => {
          let regionLayer = [-1, -1];
          let regionQubit = [this._originalQubits.length + 1, -1];
          gatesIndex.forEach((cmpgate: ComponentGate) => {
            const layer = this.getGateLayer(cmpgate);
            const qubits = cmpgate.qubits.map((qubit) => {
              const qubitIndex = this._superQubitMap.get(qubit);
              if (qubitIndex !== undefined) {
                regionQubit = [
                  Math.min(qubitIndex, regionQubit[0]),
                  Math.max(qubitIndex, regionQubit[1]),
                ];
              }
            });

            if (layer !== undefined) {
              if (regionLayer[0] === -1) {
                regionLayer = [layer, layer];
              } else {
                regionLayer = [
                  Math.min(layer, regionLayer[0]),
                  Math.max(layer, regionLayer[1]),
                ];
              }
            }
          });

          componentRegion.push({
            layer: regionLayer,
            qubit: regionQubit,
            name: this._treeStructure[groupInfo.index].name,
            weight: gateIndex / gateGroupDictList.length,
          });
        });
      }
    );
    return componentRegion;
  }

  getHighlightComponents() {
    return this._highlightedComponent;
  }

  getTreeChildrenList() {
    return this._treeChildrenList;
  }
  get layers() {
    return this._layers;
  }

  get gates() {
    return this._gates;
  }

  get qubits() {
    return this._qubits;
  }

  get width() {
    return this._layers.length;
  }

  get height() {
    return this._qubits.length;
  }

  exportJson(): any {
    const data = this._drawableCircuit.exportJson();
    data["originalQubitLength"] = this._originalQubits.length;
    data["originalGateLength"] = this._originalGates.length;
    data["componentRegion"] = this.getComponentRegion();

    return data;
  }
}
