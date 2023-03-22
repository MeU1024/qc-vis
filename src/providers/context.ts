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

  setQubitRangeStart(qubitRangeStart: number) {
    const message = this._data?.setQubitRangeStart(qubitRangeStart);
    this._postData();
  }
  private async _postFocusData(
    data:
      | {
          idlePosition: number[][][];
          averageIdleValue: number[][];
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
  private async _postMatrixData(data: {
    matrix: number[][];
    title: string;
    curEntGroup: number[];
    preEntGroup: number[];
  }) {
    if (data !== undefined) {
      let message = {
        command: "context.setMatrix",
        data: data,
      };

      let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

      panelSet?.forEach((panel) => {
        panel.postMessage(message);
        logger.log(`Sent Message: ${panel.dataFileUri}`);
      });
    }
  }

  setMatrixComponentIndex(index: number) {
    const data = this._data?.setMatrixComponentIndex(index);
    if (data !== undefined) {
      this._postMatrixData(data);
    }
  }
  setLayerRangeStart(layerRangeStart: number) {
    const message = this._data?.setLayerRangeStart(layerRangeStart);
    this._postData();
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
  private _averageIdleValue: number[][];
  private _idlePosition: number[][][];

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
    this._subGraphLayerRange = [0, 6];
    this._subGraphQubitRange = [0, 6];

    this._idlePosition = [];
    this._focusQubitIndex = 0;
    this._focusLayerIndex = 0;

    this._originalGates = this._compnentCircuit.getOriginalGates();
    this._originalQubits = this._compnentCircuit.getOriginalQubits();
    this._averageIdleValue = [];
    this._treeStructure = this._importStructureFromFile();
    this._updateConnectivity();
    this._focusQubitGates = this._updateQubit();
    this._originalLayers = this._placement();
    this._updateParallelism();
    this._updateSubCircuit();
    this._updateIdle();
  }

  setMatrixComponentIndex(index: number) {
    this._connectivityComponentIndex = 11;
    const { curEntGroup, preEntGroup } = this._updateConnectivity();
    return {
      matrix: this._connectivityMatrix,
      title: this._treeStructure[index].name,
      curEntGroup: curEntGroup,
      preEntGroup: preEntGroup,
    };
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
      idlePosition: this._idlePosition,
      averageIdleValue: this._averageIdleValue,
    };
  }

  setQubitRangeStart(qubitStart: number) {
    this._subGraphQubitRange =
      qubitStart + 7 <= this._originalQubits.length
        ? [qubitStart, qubitStart + 6]
        : [this._originalQubits.length - 7, this._originalQubits.length - 1];
    this._updateSubCircuit();
  }

  setLayerRangeStart(layerStart: number) {
    this._subGraphLayerRange = [layerStart, layerStart + 6];
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
      "/resources/data/qugan-structure.json"
      // "/resources/data/mul-structure.json"
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

  //TODO:update averageIdleValue & _idleQubit
  private _updateIdle() {
    const qubitsNum = this._originalQubits.length;
    const layerNum = this._originalLayers.length;
    const idlePosition: number[][][] = [];
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
      // idlePosition.push(idleLayers);
    }

    // calculate average value
    // this._averageIdleValue = idlePosition.map((idleLayers: number[]) => {
    //   let averageValue = 1;
    //   if (idleLayers.length !== 0) {
    //     let sum = 0;
    //     idleLayers.forEach((layerIndex: number) => {
    //       sum = sum + this._layerParallelism[layerIndex];
    //     });
    //     averageValue = sum / idleLayers.length;
    //   }

    //   return averageValue;
    // });

    let pre: number[][] = []; // pre[row][col] : at row, the last qubit position before col
    let suf: number[][] = [];

    for (let row = 0; row < qubitsNum; ++row) {
      pre[row] = [];
      suf[row] = [];
      for (let col = 0; col < layerNum; ++col) {
        pre[row][col] = -1;
        suf[row][col] = layerNum + 1;
      }
    }

    // update pre
    for (let col = 0; col < this._originalLayers.length; ++col) {
      // 第一维是不是一定是定长的，指如果这一层没有qubit也会有这一位
      if (col != 0) {
        for (let row = 0; row < qubitsNum; ++row) {
          pre[row][col] = Math.max(pre[row][col], pre[row][col - 1]);
        }
      }
      if (col === this._originalLayers.length - 1) {
      } else {
        let layerGate = this._originalLayers[col];
        layerGate.forEach((gate: ComponentGate) => {
          if (gate.qubits.length === 1) {
            // one
            let row = parseInt(gate.qubits[0].qubitName);
            pre[row][col + 1] = Math.max(pre[row][col + 1], col);
          } else {
            // two // control gate
            let mx = -1;
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let row = parseInt(gate.qubits[idx].qubitName);
              pre[row][col + 1] = Math.max(pre[row][col + 1], col);
              mx = Math.max(mx, pre[row][col + 1]);
            }
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let row = parseInt(gate.qubits[idx].qubitName);
              pre[row][col + 1] = Math.max(pre[row][col + 1], mx);
            }
          }
        });
      }
    }

    // update suf
    for (let col = this._originalLayers.length - 1; col >= 0; --col) {
      if (col != this._originalLayers.length - 1) {
        for (let row = 0; row < qubitsNum; ++row) {
          suf[row][col] = Math.min(suf[row][col], suf[row][col + 1]);
        }
      }
      if (col === 0) {
      } else {
        let layerGate = this._originalLayers[col];
        layerGate.forEach((gate: ComponentGate) => {
          if (gate.qubits.length === 1) {
            let row = parseInt(gate.qubits[0].qubitName);
            suf[row][col - 1] = Math.min(suf[row][col - 1], col);
          } else {
            let mn = layerNum + 1;
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let row = parseInt(gate.qubits[idx].qubitName);
              suf[row][col - 1] = Math.min(suf[row][col - 1], col);
              mn = Math.min(mn, suf[row][col - 1]);
            }
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let row = parseInt(gate.qubits[idx].qubitName);
              suf[row][col - 1] = Math.min(suf[row][col - 1], mn);
            }
          }
        });
      }
    }

    // averageIdleValue
    let averageIdleValue: number[][] = [];
    for (let col = 0; col < layerNum; ++col) {
      averageIdleValue[col] = [];
      for (let row = 0; row < qubitsNum; ++row) {
        averageIdleValue[col][row] = 0;
      }
    }

    for (let row = 0; row < qubitsNum; ++row) {
      for (let col = 0; col < layerNum; ++col) {
        let sum = 0.0;
        for (let colidx = pre[row][col] + 1; colidx < suf[row][col]; ++colidx) {
          sum += this._layerParallelism[colidx];
        }
        averageIdleValue[col][row] = sum / (suf[row][col] - pre[row][col] - 1); // double？
      }
    }

    this._averageIdleValue = averageIdleValue;

    // idlePosition
    for (let col = 0; col < layerNum; ++col) {
      idlePosition[col] = [];
      for (let row = 0; row < qubitsNum; ++row) {
        idlePosition[col][row] = [];
      }
    }
    for (let row = 0; row < qubitsNum; ++row) {
      for (let col = 0; col < layerNum; ++col) {
        for (let colidx = pre[row][col] + 1; colidx < suf[row][col]; ++colidx) {
          idlePosition[col][row].push(colidx);
        }
      }
    }

    // for (let index = 0; index < 28; index++) {
    //   if (index === 0) {
    //     this._averageIdleValue.push([0, 1, 0.5, 0.2, 0.4, 0.2, 0.1, 1, 1, 1]);
    //     const qubitPos = [];
    //     for (let index = 0; index < 10; index++) {
    //       // qubitPos.push([index]);

    //     }
    //     this._idlePosition.push(qubitPos);
    //   } else {
    //   }
    //   this._averageIdleValue.push([1, 1, 1, 1, 1, 0.2, 0.1, 1, 1, 1]);
    //   const qubitPos = [];
    //   for (let index = 0; index < 10; index++) {
    //     qubitPos.push([index + 1]);
    //   }
    //   this._idlePosition.push(qubitPos);
    // }

    this._idlePosition = idlePosition;
  }

  private _updateSubCircuit() {
    const layerNum = this._originalLayers.length;
    const qubitNum = this._originalQubits.length;
    let layerRange = this._subGraphLayerRange;
    let qubitRange = this._subGraphQubitRange;
    this._subGraph = [];

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
    this._connectivityComponentIndex = 11;
    //this._treeStructure
    const originalGates = this._compnentCircuit.getOriginalGates();
    const originalQubits = this._compnentCircuit.getOriginalQubits();
    let curEntGroup: number[];
    let preEntGroup: number[];
    this._connectivityMatrix = [];

    /*
    0: no connection
    1: connection but not in component
    2: connection and in component
    */

    //initialization
    for (let row = 0; row < originalQubits.length; row++) {
      this._connectivityMatrix.push([]);
      for (let col = 0; col < originalQubits.length; col++) {
        this._connectivityMatrix[row].push(0);
      }
    }

    //iterate all gates
    originalGates.forEach((gate: ComponentGate) => {
      let node = this._treeStructure[gate.treeIndex];
      while (node.type !== "fun") {
        node = this._treeStructure[node.parentIndex];
      }
      if (node.index === this._connectivityComponentIndex) {
        const qubits = gate.qubits.map((qubit: Qubit) => {
          return parseInt(qubit.qubitName);
        });

        //TODO:cswap ryy cry cx
        if (qubits.length >= 2) {
          for (let start = 0; start < qubits.length; start++) {
            for (let end = start + 1; end < qubits.length; end++) {
              this._connectivityMatrix[qubits[start]][qubits[end]] = 1;
              if (gate.gateName === "cz" || gate.gateName === "cp") {
                this._connectivityMatrix[qubits[end]][qubits[start]] = 1;
              }
            }
          }
        } else {
          this._connectivityMatrix[qubits[0]][qubits[0]] = 1;
        }
      }
    });

    //calculation the entanglement after current component(included)
    let currentTimeStamp = 147;
    curEntGroup = [1, 1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    //calculation the entanglement before the endTimeStamp(not included)
    let beforeTimeStamp = 74;
    preEntGroup = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    return { curEntGroup, preEntGroup };
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
  private _originalLayers2Json() {
    const outputSize = [
      this._originalQubits.length,
      this._originalLayers.length,
    ];

    const qubits = this._originalQubits.map((qubit) => {
      return qubit.qubitName;
    });

    // build opMap
    const opMap = new Map<string, number>();
    opMap.set("...", 0);
    let opCount = 1;
    this._originalLayers.forEach((layer) => {
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
    this._originalLayers.forEach((layer, layerIndex) => {
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
    };
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
    let originalCircuit = this._originalLayers2Json();
    return {
      ...this._compnentCircuit.exportJson(),
      highlights: highlights,
      matrix: this._connectivityMatrix,
      focusQubitGates: focusQubitGates,
      layerParallelism: this._layerParallelism,
      subCircuit: subCircuit,
      idlePosition: this._idlePosition,
      originalCircuit: originalCircuit,
      averageIdleValue: this._averageIdleValue,
      originalCircuitSize: [
        this._originalQubits.length,
        this._originalLayers.length,
      ],
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
