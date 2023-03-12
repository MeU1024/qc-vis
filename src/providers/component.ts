import * as vscode from "vscode";

import { getLogger } from "../components/logger";
import { QCViewerManagerService } from "../components/viewerlib/qcviewermanager";

import * as qv from "../quantivine";
import { getExtensionUri } from "../quantivine";
import {
  Qubit,
  ComponentGate,
  Layer,
  SuperQubit,
  DrawableCircuit,
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

  async componentQcData() {
    let componentCircuit = new ComponentCircuit(this._dataFile);

    return componentCircuit;
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
  private _gateLayerMap: Map<ComponentGate, number>;
  private _treeMap: Map<number, number>;
  private _superQubitMap: Map<Qubit, number>;
  private _drawableCircuit: DrawableCircuit;

  constructor(jsonData: any) {
    this._qubits = [];

    if (jsonData === undefined) {
      jsonData.qubits.forEach((qubitName: string) => {
        this._qubits.push(new Qubit(qubitName, this._qubits.length));
      });
    }

    this._gates = [];
    this._layers = [];

    this._superQubits = [];
    this._originalQubits = [];
    this._originalGates = [];
    this._superQubitMap = new Map<Qubit, number>();
    this._gateLayerMap = new Map<ComponentGate, number>();
    this._treeMap = new Map<number, number>();
    this._drawableCircuit = new DrawableCircuit();

    const file = vscode.Uri.file(
      vscode.Uri.joinPath(
        getExtensionUri(),
        "/resources/data/default-data-source.json"
      ).fsPath
    );
    if (jsonData === undefined) {
      jsonData.layers.forEach((layer: any) => {
        this._layers.push(new Layer([]));
        layer.forEach((gateInfo: any) => {
          let gateName = gateInfo[0];
          let qubits: Qubit[] = [];
          gateInfo[1].forEach((qubitIndex: number) => {
            qubits.push(this._qubits[qubitIndex]);
          });
          let range = gateInfo[2];
          let treeIndex = gateInfo[3];

          let gate = new ComponentGate(gateName, qubits, range, treeIndex);
          this._gates.push(gate);
          this._layers[this._layers.length - 1].gates.push(gate);
        });
      });
    }

    this._importGatesFromFile(file);
    this._treeStructure = this._importStructureFromFile();
    this._updateTreeMap();
    this._build();
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

  getGateLayer(gate: ComponentGate): number | undefined {
    return this._gateLayerMap.get(gate);
  }

  getOriginalGates(): ComponentGate[] {
    return this._originalGates;
  }

  getOriginalQubits(): Qubit[] {
    return this._originalQubits;
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
          gate[3]
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
    let dataSource = vscode.Uri.joinPath(
      getExtensionUri(),
      "/resources/data/vqc-structure.json"
    ).fsPath;
    let data = require(dataSource);
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
    this._treeStructure.forEach(
      (item: {
        name: string;
        parentIndex: number;
        index: number;
        type: string;
      }) => {
        let parentIndex = item.parentIndex;
        let treeIndex = item.index;
        while (!qv.semanticTreeViewer.isExpanded(parentIndex)) {
          parentIndex = this._treeStructure[parentIndex].parentIndex;
          treeIndex = this._treeStructure[treeIndex].parentIndex;
        }
        if (this._treeStructure[treeIndex].type === "rep") {
          treeIndex = item.index;
        }
        this._treeMap.set(item.index, treeIndex);
      }
    );
  }
  private _build() {
    // Build component circuit

    const gatesInfo = this._grouping();
    const { edgeMap, qubitMap } = this._bundling(gatesInfo);
    const layers = this._placement(gatesInfo, edgeMap);
    this._generateLayout(layers, gatesInfo, qubitMap);
  }

  private _grouping() {
    let treeMap = new Map<number, number[]>();
    this._treeStructure.forEach(
      (item: {
        name: string;
        parentIndex: number;
        index: number;
        type: string;
      }) => {
        treeMap.set(item.index, []);
      }
    );

    //aggregate gates
    this._originalGates.forEach((gate: ComponentGate, gateIndex) => {
      const treeIndex = gate.treeIndex;
      //groupDict[tagIndex].gates.push(gateIndex);
      const newTreeIndex = this._treeMap.get(treeIndex);
      if (newTreeIndex !== undefined) {
        let gates = treeMap.get(newTreeIndex);
        if (gates !== undefined) {
          gates.push(gateIndex);
          treeMap.set(newTreeIndex, gates);
        }
      } else {
        let gates = treeMap.get(treeIndex);
        if (gates !== undefined) {
          gates.push(gateIndex);
          treeMap.set(treeIndex, gates);
        }
      }
    });

    let gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
    }[] = [];

    treeMap.forEach((gates: number[], treeIndex: number) => {
      const treeNodeType = this._treeStructure[treeIndex].type;
      const treeNodeName = this._treeStructure[treeIndex].name;
      if (gates.length !== 0) {
        let timeRange = this._originalGates[gates[0]].range;
        let bits = new Set<Qubit>();
        switch (treeNodeType) {
          case "fun":
            gates.forEach((gateIndex: number) => {
              const gate = this._originalGates[gateIndex];
              if (gate.range[0] < timeRange[0]) {
                timeRange[0] = gate.range[0];
              }
              if (gate.range[1] > timeRange[1]) {
                timeRange[1] = gate.range[1];
              }
              gate.qubits.forEach((bit: Qubit) => {
                bits.add(bit);
              });
            });
            gatesInfo.push({
              gates: gates,
              name: treeNodeName,
              qubits: Array.from(bits),
              range: timeRange,
              treeIndex: treeIndex,
            });
            break;
          case "rep_item":
            gates.forEach((gateIndex: number) => {
              gatesInfo.push({
                gates: [gateIndex],
                name: treeNodeName,
                qubits: this._originalGates[gateIndex].qubits,
                range: this._originalGates[gateIndex].range,
                treeIndex: treeIndex,
              });
            });
            break;
          default:
            break;
        }
      }
    });

    //sort new gates according to time range
    gatesInfo.sort(
      (
        a,
        b: {
          gates: number[];
          name: string;
          qubits: Qubit[];
          range: number[];
          treeIndex: number;
        }
      ) => {
        return a.range[0] - b.range[0];
      }
    );

    return gatesInfo;
  }

  private _bundling(
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
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
        newEdges.push([edge]);
      }
    });
    if (mergableEdges.length !== 0) {
      newEdges.push(mergableEdges);
    }

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

      // let minQubit = edgeMap[parseInt(gateInfo.qubits[0].qubitName)];
      // let maxQubit =
      //   edgeMap[
      //     parseInt(gateInfo.qubits[gateInfo.qubits.length - 1].qubitName)
      //   ];
      // if (minQubit > maxQubit) {
      //   const temp = maxQubit;
      //   maxQubit = minQubit;
      //   minQubit = temp;
      // }
      // for (let index = minQubit; index <= maxQubit; index++) {
      //   qubitsPlacement[index] = layerIndex + 1;
      // }
    });

    return layers;
  }

  private _generateLayout(
    layers: number[][],
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
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
          gateInfo.treeIndex
        );
        this._gates.push(gate);
        return gate;
      });
      return new Layer(gates);
    });

    this._layers = componentLayers;
    this._gateLayerMap = this._mapGateToLayer();
    this._drawableCircuit.loadFromLayers(
      componentLayers,
      this._qubits,
      this._superQubitMap
    );
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
    return this._drawableCircuit.exportJson();
  }
}
