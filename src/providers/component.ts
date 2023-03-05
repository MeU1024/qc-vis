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
    let dataSource = vscode.Uri.file("./temp/abstraction-test.json");
    // let circuit =

    let componentCircuit = new ComponentCircuit(this._dataFile);

    return componentCircuit;
  }

  private async _postData() {
    if (!this._data) {
      return;
    }
    let message1 = {
      command: "component.setTitle",
      data: { title: "Abstraction View" },
    };

    let message2 = {
      command: "component.setCircuit",
      data: this._data.exportJson(),
    };

    let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

    panelSet?.forEach((panel) => {
      panel.postMessage(message1);
      panel.postMessage(message2);
      logger.log(`Sent Message: ${panel.dataFileUri}`);
    });
  }
}

export class ComponentCircuit {
  private _qubits: Qubit[];
  private _gates: ComponentGate[];
  private _layers: Layer[];
  private _gateLayerMap: Map<ComponentGate, number>;
  private _originalGates: ComponentGate[];
  private _taggedLayers: Layer[];
  private _superQubits: Qubit[];
  private _superQubitMap: Map<Qubit, number>;
  private _newQubitMap: Map<Qubit, number>;
  private _drawableCircuit: DrawableCircuit;
  private _treeStructure: {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[];
  constructor(jsonData: any) {
    this._qubits = [];

    if (jsonData === undefined) {
      jsonData.qubits.forEach((qubitName: string) => {
        this._qubits.push(new Qubit(qubitName, this._qubits.length));
      });
    }

    this._gates = [];
    this._layers = [];
    this._originalGates = [];
    this._superQubits = [];
    this._drawableCircuit = new DrawableCircuit();
    this._superQubitMap = new Map<Qubit, number>();
    this._newQubitMap = new Map<Qubit, number>();
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

    this._gateLayerMap = this._mapGateToLayer();
    this._taggedLayers = this._importLayersFromFile(file);
    this._treeStructure = this._importStructureFromFile();
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
  private _importLayersFromFile(dataFile: vscode.Uri): Layer[] {
    logger.log("Load layer data from: " + dataFile.fsPath);
    let data = require(dataFile.fsPath);
    let layers: Layer[] = [];
    this._qubits = [];
    data.qubits.forEach((qubitName: string) => {
      this._qubits.push(new Qubit(qubitName, this._qubits.length));
    });

    data.layers.forEach((layer: any) => {
      const gates = layer.map((gate: any) => {
        const qubits = gate[1].map((bit: number) => {
          return this._qubits[bit];
        });
        const componentGate = new ComponentGate(
          gate[0],
          qubits,
          gate[2],
          gate[3]
        );
        this._originalGates.push(componentGate);
        return componentGate;
      });
      layers.push(new Layer(gates));
    });
    return layers;
  }

  private _importStructureFromFile(dataFile?: vscode.Uri): {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[] {
    //logger.log("Load semantics data from: " + dataFile.fsPath);
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

  slice(range: number[]): ComponentGate[] {
    let ret: ComponentGate[] = [];

    this._gates.forEach((gate) => {
      if (gate.range[0] >= range[0] && gate.range[1] <= range[1]) {
        ret.push(gate);
      }
    });

    return ret;
  }

  private _build() {
    // Build component circuit

    const gatesInfo = this._grouping();
    const { edgeMap, qubitMap } = this._bundling(gatesInfo);
    this._placement(gatesInfo, edgeMap, qubitMap);
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
      let gates = treeMap.get(treeIndex);
      if (gates !== undefined) {
        gates.push(gateIndex);
        treeMap.set(treeIndex, gates);
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
      this._qubits.map((bit: Qubit) => {
        return { gateSet: new Set(), isMergable: true };
      });
    let edgeMap = this._qubits.map((qubit: Qubit, qubitIndex) => {
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
    // let newQubitMap = new Map<Qubit, number>();
    let qubitMapping = new Map<Qubit, number>();
    let superQubits = newEdges.map((edges: number[], index) => {
      const qubits = edges.map((index) => {
        return this._qubits[index];
      });
      const superQubit = new SuperQubit(qubits.length.toString(), qubits);
      superQubitMap.set(superQubit, index);
      qubits.forEach((qubit: Qubit) => {
        qubitMap.set(qubit, superQubit);
      });
      return superQubit;
    });
    // this._qubits.forEach((qubit: Qubit) => {
    //   const superQubit = qubitMap.get(qubit);
    //   if (superQubit !== undefined) {
    //     const superQubitIndex = superQubitMap.get(superQubit);
    //     if (superQubitIndex !== undefined) {
    //     //   newQubitMap.set(qubit, superQubitIndex);
    //     }
    //   }
    // });
    this._superQubits = superQubits;
    this._superQubitMap = superQubitMap;
    // this._newQubitMap = newQubitMap;

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
    edgeMap: number[],
    qubitMap: Map<Qubit, SuperQubit>
  ) {
    //gate placement
    let qubitsPlacement = this._superQubits.map((bit: Qubit) => {
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
    this._mapGateToLayer();
    this._drawableCircuit.loadFromLayers(
      componentLayers,
      this._superQubits,
      this._superQubitMap
    );
    // const test = this.layerInfo;
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

  get layerInfo() {
    let ret: any[] = [];
    this._layers.forEach((layer, layerIndex) => {
      let layerInfo: any[] = [];
      layer.gates.forEach((gate) => {
        let gateInfo: any[] = [];
        const opNameIndex = gate.gateName;
        const qubitsIndex = gate.qubits.map((qubit) =>
          this._superQubitMap.get(qubit)
        );
        gateInfo.push(opNameIndex);
        gateInfo.push([layerIndex]);
        gateInfo.push(qubitsIndex);
        layerInfo.push(gateInfo);
      });
      ret.push(...layerInfo);
    });
    return ret;
  }

  exportJson(): any {
    return this._drawableCircuit.exportJson();
  }
}
