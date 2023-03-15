import * as vscode from "vscode";
import * as qv from "../quantivine";

import { getLogger } from "../components/logger";
import { ComponentCircuit } from "./component";
import { QCViewerManagerService } from "../components/viewerlib/qcviewermanager";
import { QuantumTreeNode } from "./structurelib/quantumgate";
import { GateNodeProvider } from "./structure";
import { ComponentGate, Layer, Qubit } from "./structurelib/qcmodel";
import { getExtensionUri } from "../quantivine";

const logger = getLogger("DataProvider", "Context");

export class ContextDataProvider {
  private _data: ContextualCircuit | undefined;
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
    // TODO: Update Data
    this._data = await this.contextualQcData();
    this._postData();
  }

  async contextualQcData() {
    let contextualCircuit = new ContextualCircuit(this._dataFile);

    return contextualCircuit;
  }
  setFocusLayer(focusLayer: number) {
    const message = this._data?.setFocusLayer(focusLayer);
    this._postFocusData(message);
  }

  setQubitRangeCenter(qubitRangeCenter: number) {
    const message = this._data?.setQubitRangeCenter(qubitRangeCenter);
    this._postData();
  }
  private async _postFocusData(
    data:
      | {
          idleQubit: number[][];
          averageIdleValue: number[];
        }
      | undefined
  ) {
    if (data !== undefined) {
      let message = {
        command: "context.setFocusData",
        data: data,
      };

      let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

      panelSet?.forEach((panel) => {
        panel.postMessage(message);
        logger.log(`Sent Message: ${panel.dataFileUri}`);
      });
    }
  }

  private async _postData() {
    const contextPath = qv.semanticTreeViewer.focusPath?.reverse().join(" > ");

    let message1 = {
      command: "context.setTitle",
      data: { title: `Context View: ${contextPath}` },
    };

    let message2 = {
      command: "context.setCircuit",
      data: this._data?.exportJson(),
    };

    let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

    panelSet?.forEach((panel) => {
      panel.postMessage(message1);
      panel.postMessage(message2);
      logger.log(`Sent Message: ${panel.dataFileUri}`);
    });
  }
}

class ContextualCircuit {
  private _compnentCircuit: ComponentCircuit;
  private _contextTree: GateNodeProvider;
  private _focusGate: ComponentGate | undefined;
  private _gateHighlight: Map<ComponentGate, number>; // 0: no highlight, 1: highlight, 2: focus
  private _connectivityComponentIndex: number;
  private _originalQubits: Qubit[];
  private _originalGates: ComponentGate[];
  private _connectivityMatrix: number[][];
  private _focusQubitGates: ComponentGate[];
  private _treeStructure: {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[];
  private _focusQubitIndex: number;
  private _focusLayerIndex: number;
  private _layerParallelism: number[];
  private _originalLayers: ComponentGate[][];
  private _subGraph: ComponentGate[][];
  private _subGraphQubitRange: number[];
  private _subGraphLayerRange: number[];
  private _averageIdleValue: number[];
  private _idleQubit: number[][];

  constructor(_dataFile: vscode.Uri) {
    this._compnentCircuit = new ComponentCircuit(_dataFile);
    this._contextTree = qv.semanticTreeViewer.data;
    this._gateHighlight = new Map();
    this._connectivityComponentIndex = 3;
    this._originalQubits = [];
    this._originalGates = [];
    this._connectivityMatrix = [];
    this._layerParallelism = [];
    this._subGraph = [];
    this._subGraphLayerRange = [];
    this._subGraphQubitRange = [0, 6];

    this._idleQubit = [];
    this._focusQubitIndex = 0;
    this._focusLayerIndex = 0;

    this._originalGates = this._compnentCircuit.getOriginalGates();
    this._originalQubits = this._compnentCircuit.getOriginalQubits();
    this._averageIdleValue = this._originalQubits.map((i) => 0);
    this._treeStructure = this._importStructureFromFile();
    this._updateConnectivity();
    this._focusQubitGates = this._updateQubit();
    this._originalLayers = this._placement();
    this._updateParallelism();
    this._updateSubCircuit();
  }

  setFocusNode(gate: ComponentGate | undefined) {
    this._focusGate = gate;
    this._updateDependency();
    this._updateSubCircuit();
  }
  setFocusLayer(focusLayer: number) {
    this._focusLayerIndex = focusLayer;
    this._updateIdle();
    return {
      idleQubit: this._idleQubit,
      averageIdleValue: this._averageIdleValue,
    };
  }
  setQubitRangeCenter(qubitStart: number) {
    this._subGraphQubitRange =
      qubitStart + 7 <= this._originalQubits.length
        ? [qubitStart, qubitStart + 6]
        : [this._originalQubits.length - 7, this._originalQubits.length - 1];
    this._updateSubCircuit();
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
  private _updateDependency() {
    this._gateHighlight.clear();
    if (!this._focusGate) {
      return;
    }
    let precursors = this._compnentCircuit.getPredecessors(this._focusGate);
    let successors = this._compnentCircuit.getSuccessors(this._focusGate);

    precursors.forEach((gate) => {
      this._gateHighlight.set(gate, 1);
    });
    successors.forEach((gate) => {
      this._gateHighlight.set(gate, 1);
    });
    this._gateHighlight.set(this._focusGate, 2);
  }

  private _updateParallelism() {
    // const layers = this._compnentCircuit.getLayers();
    const originalQubits = this._compnentCircuit.getOriginalQubits();
    const qubitsLength = originalQubits.length;
    const layerPara = this._originalLayers.map((layer: ComponentGate[]) => {
      return layer.length / qubitsLength;
    });
    this._layerParallelism = layerPara;
  }
  private _updateIdle() {
    const qubitsNum = this._originalQubits.length;
    const layerNum = this._originalLayers.length;
    const idleQubit: number[][] = [];
    for (let qubitIndex = 0; qubitIndex < qubitsNum; qubitIndex++) {
      //next idle gates
      const idleLayers = [];
      for (let index = this._focusLayerIndex; index < layerNum; index++) {
        let ifOccupied = false;
        for (
          let gateIndex = 0;
          gateIndex < this._originalLayers[index].length;
          gateIndex++
        ) {
          const qubitsArray = this._originalLayers[index][gateIndex].qubits;
          let i;
          for (i = 0; i < qubitsArray.length; i++) {
            if (parseInt(qubitsArray[i].qubitName) === qubitIndex) {
              ifOccupied = true;
              break;
            }
          }
          if (ifOccupied) {
            break;
          }
        }
        if (!ifOccupied) {
          idleLayers.push(index);
        } else {
          break;
        }
      }

      for (let index = this._focusLayerIndex - 1; index >= 0; index--) {
        let ifOccupied = false;
        for (
          let gateIndex = 0;
          gateIndex < this._originalLayers[index].length;
          gateIndex++
        ) {
          const qubitsArray = this._originalLayers[index][gateIndex].qubits;
          let i;
          for (i = 0; i < qubitsArray.length; i++) {
            if (parseInt(qubitsArray[i].qubitName) === qubitIndex) {
              ifOccupied = true;
              break;
            }
          }
          if (ifOccupied) {
            break;
          }
        }
        if (!ifOccupied) {
          idleLayers.push(index);
        } else {
          break;
        }
      }
      idleLayers.sort((a, b) => {
        return a - b;
      });
      idleQubit.push(idleLayers);
    }

    //calculate average value

    this._averageIdleValue = idleQubit.map((idleLayers: number[]) => {
      let averageValue = 1;
      if (idleLayers.length !== 0) {
        let sum = 0;
        idleLayers.forEach((layerIndex: number) => {
          sum = sum + this._layerParallelism[layerIndex];
        });
        averageValue = sum / idleLayers.length;
      }

      return averageValue;
    });

    this._idleQubit = idleQubit;
  }

  private _updateSubCircuit() {
    const layerNum = this._originalLayers.length;
    const qubitNum = this._originalQubits.length;
    let layerRange = [0, 6];
    let qubitRange = this._subGraphQubitRange;
    this._subGraph = [];
    // if (this._focusLayerIndex >= layerNum - 4) {
    //   layerRange = [layerNum - 7, layerNum - 1];
    // } else if (this._focusLayerIndex > 3) {
    //   layerRange = [this._focusLayerIndex - 3, this._focusLayerIndex + 3];
    // }

    // if (this._focusQubitIndex >= qubitNum - 4) {
    //   qubitRange = [qubitNum - 7, qubitNum - 1];
    // } else if (this._focusQubitIndex > 3) {
    //   qubitRange = [this._focusQubitIndex - 3, this._focusQubitIndex + 3];
    // }

    const subGraph = this._originalLayers.slice(
      layerRange[0],
      layerRange[1] + 1
    );
    subGraph.forEach((layer) => {
      const newGates: ComponentGate[] = [];
      layer.forEach((gate: ComponentGate) => {
        const qubits = gate.qubits.map((qubit) => {
          return parseInt(qubit.qubitName);
        });
        for (let index = 0; index < qubits.length; index++) {
          if (
            qubits[index] >= qubitRange[0] &&
            qubits[index] <= qubitRange[1]
          ) {
            newGates.push(gate);
            break;
          }
        }
      });
      this._subGraph.push(newGates);
    });

    this._subGraphLayerRange = layerRange;
  }

  private _updateConnectivity() {
    const originalGates = this._compnentCircuit.getOriginalGates();
    const originalQubits = this._compnentCircuit.getOriginalQubits();

    for (let row = 0; row < originalQubits.length; row++) {
      this._connectivityMatrix.push([]);
      for (let col = 0; col < originalQubits.length; col++) {
        this._connectivityMatrix[row].push(0);
      }
    }
    originalGates.forEach((gate: ComponentGate) => {
      let node = this._treeStructure[gate.treeIndex];
      while (node.type !== "fun") {
        node = this._treeStructure[node.parentIndex];
      }
      if (node.index === this._connectivityComponentIndex) {
        const qubits = gate.qubits.map((qubit: Qubit) => {
          return parseInt(qubit.qubitName);
        });
        //TODO:directed?
        if (qubits.length >= 2) {
          for (let start = 0; start < qubits.length; start++) {
            for (let end = start + 1; end < qubits.length; end++) {
              this._connectivityMatrix[qubits[start]][qubits[end]] = 1;
              if (gate.gateName === "cz") {
                this._connectivityMatrix[qubits[end]][qubits[start]] = 1;
              }
            }
          }
        }
      }
    });
  }
  private _updateQubit() {
    const layers = this._compnentCircuit.getLayers();
    const qubits = this._compnentCircuit.getQubits();
    const focusQubit = qubits[this._focusQubitIndex];
    const focusGates: ComponentGate[] = [];
    layers.forEach((layer: Layer) => {
      layer.gates.forEach((gate: ComponentGate) => {
        if (gate.qubits.includes(focusQubit)) {
          focusGates.push(gate);
        }
      });
    });

    return focusGates;
  }

  private _placement() {
    //gate placement
    let qubitsPlacement = this._originalQubits.map((bit: Qubit) => {
      return 0;
    });

    let layers: ComponentGate[][] = [];
    this._originalGates.forEach((gate, index) => {
      //placement
      let layerIndex = 0;
      gate.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = parseInt(qubit.qubitName);
        if (qubitsPlacement[qubitIndex] > layerIndex) {
          layerIndex = qubitsPlacement[qubitIndex];
        }
      });
      if (layers.length < layerIndex + 1) {
        layers.push([gate]);
      } else {
        layers[layerIndex].push(gate);
      }

      gate.qubits.forEach((qubit: Qubit) => {
        const qubitIndex = parseInt(qubit.qubitName);
        qubitsPlacement[qubitIndex] = layerIndex + 1;
      });
    });

    return layers;
  }
  private _subCircuit2Json() {
    const outputSize = [7, 7];

    const qubits = this._originalQubits
      .slice(this._subGraphQubitRange[0], this._subGraphQubitRange[1] + 1)
      .map((qubit) => {
        return qubit.qubitName;
      });

    // build opMap
    const opMap = new Map<string, number>();
    opMap.set("...", 0);
    let opCount = 1;
    this._subGraph.forEach((layer) => {
      layer.forEach((gate) => {
        let opName = gate.gateName;
        if (!opMap.has(opName)) {
          opMap.set(opName, opCount++);
        }
      });
    });
    let ret: any = {};
    opMap.forEach((value, key) => {
      ret[key] = value;
    });

    let allGates: any[] = [];
    this._subGraph.forEach((layer, layerIndex) => {
      let layerInfo: any[] = [];
      layer.forEach((gate) => {
        let gateInfo: any[] = [];
        const opNameIndex = opMap.get(gate.gateName);
        const qubitsIndex = gate.qubits.map((qubit) =>
          parseInt(qubit.qubitName)
        );
        gateInfo.push(opNameIndex);
        gateInfo.push([layerIndex]);
        gateInfo.push(qubitsIndex);
        layerInfo.push(gateInfo);
      });
      allGates.push(...layerInfo);
    });
    return {
      output_size: outputSize,
      op_map: ret,
      qubits: qubits,
      all_gates: allGates,
      gate_format: "",
      subGraphQubitRange: this._subGraphQubitRange,
      subGraphLayerRange: this._subGraphLayerRange,
    };
  }
  exportJson() {
    let highlights: number[] = [];
    this._compnentCircuit.gates.forEach((gate) => {
      if (this._gateHighlight.has(gate)) {
        highlights.push(this._gateHighlight.get(gate) as number);
      } else {
        highlights.push(0);
      }
    });
    let focusQubitGates = this._focusQubitGates.map((gate: ComponentGate) => {
      return {
        gateName: gate.gateName,
        qubits: gate.qubits.map((item: Qubit) => {
          return item.qubitName;
        }),
      };
    });

    let subCircuit = this._subCircuit2Json();
    return {
      ...this._compnentCircuit.exportJson(),
      highlights: highlights,
      matrix: this._connectivityMatrix,
      focusQubitGates: focusQubitGates,
      layerParallelism: this._layerParallelism,
      subCircuit: subCircuit,
      idleQubit: this._idleQubit,
      averageIdleValue: this._averageIdleValue,
    };
  }

  get height() {
    return this._compnentCircuit.height;
  }

  get width() {
    return this._compnentCircuit.width;
  }

  get numGates() {
    return this._compnentCircuit.gates.length;
  }
}
