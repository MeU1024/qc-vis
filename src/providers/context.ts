import * as vscode from "vscode";
import * as qv from "../quantivine";

import { getLogger } from "../components/logger";
import { ComponentCircuit } from "./component";
import { QCViewerManagerService } from "../components/viewerlib/qcviewermanager";
import { GateNodeProvider } from "./structure";
import {
  ComponentGate,
  Layer,
  Qubit,
  SuperQubit,
} from "./structurelib/qcmodel";

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
        logger.log(`Sent Message: ${panel.sourceFileUri}`);
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
        logger.log(`Sent Message: ${panel.sourceFileUri}`);
      });
    }
  }

  setMatrixComponentIndex(index: number) {
    const data = this._data?.setMatrixComponentIndex(index);
    if (data !== undefined) {
      this._postMatrixData(data);
    }
  }
  // setFocus(index:number){

  // }
  setLayerRangeStart(layerRangeStart: number) {
    const message = this._data?.setLayerRangeStart(layerRangeStart);
    this._postData();
  }

  setFocusQubit(focusQubit: number) {
    const message = this._data?.setFocusQubit(focusQubit);
    if (message !== undefined) {
      this._postProvenanceData({
        focusQubitGates: message.focusQubitGates,
        focusQubit: focusQubit,
      });
    }
  }

  private async _postProvenanceData(
    message:
      | {
        focusQubitGates: {
          gateName: string;
          qubits: string[];
          layer: number[];
        }[];
        focusQubit: number;
      }
      | undefined
  ) {
    const contextPath = qv.semanticTreeViewer.focusPath?.reverse().join(" > ");

    let message1 = {
      command: "context.setProvenance",
      data: message,
    };

    let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

    panelSet?.forEach((panel) => {
      panel.postMessage(message1);

      logger.log(`Sent Message: ${panel.sourceFileUri}`);
    });
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
      logger.log(`Sent Message: ${panel.sourceFileUri}`);
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
  private _focusQubitGates: { gate: ComponentGate; layer: number[] }[];
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

  private _originalGateToLayerMap: Map<ComponentGate, number>;
  private _indexToOriginalGatesMap: Map<number, ComponentGate>;

  constructor(_dataFile: vscode.Uri) {
    this._compnentCircuit = new ComponentCircuit(_dataFile);
    this._contextTree = qv.semanticTreeViewer.data;
    this._gateHighlight = new Map();
    this._connectivityComponentIndex = 0;
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
    this._originalGateToLayerMap = new Map<ComponentGate, number>();
    this._indexToOriginalGatesMap = new Map<number, ComponentGate>();

    this._originalGates = this._compnentCircuit.getOriginalGates();
    this._originalQubits = this._compnentCircuit.getOriginalQubits();
    this._mapOriginalGatesToIndex();
    this._averageIdleValue = [];
    this._treeStructure = this._importStructureFromFile();
    this._updateConnectivity();

    this._originalLayers = this._placement();
    this._focusQubitGates = this._updateQubit();
    this._updateParallelism();
    // this._updateSubCircuit();
    this._updateIdle();
  }

  private _mapOriginalGatesToIndex() {
    this._originalGates.forEach((gate) => {
      this._indexToOriginalGatesMap.set(gate.index, gate);
    });
  }
  setMatrixComponentIndex(index: number) {
    this._connectivityComponentIndex = index;
    // this._connectivityComponentIndex = 11;
    const { curEntGroup, preEntGroup } = this._updateConnectivity();
    return {
      matrix: this._connectivityMatrix,
      title: this._treeStructure[this._connectivityComponentIndex].name,
      curEntGroup: curEntGroup,
      preEntGroup: preEntGroup,
    };
  }

  setFocusNode(gate: ComponentGate | undefined) {
    this._focusGate = gate;
    this._updateDependency();
    // this._updateSubCircuit();
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
    // this._updateSubCircuit();
  }

  setLayerRangeStart(layerStart: number) {
    this._subGraphLayerRange = [layerStart, layerStart + 6];
    // this._updateSubCircuit();
  }

  setFocusQubit(focusQubit: number) {
    this._focusQubitIndex = focusQubit;
    this._focusQubitGates = this._updateQubit();

    let focusQubitGates = this._focusQubitGates.map(
      (gateInfo: { gate: ComponentGate; layer: number[] }) => {
        return {
          gateName: gateInfo.gate.gateName,
          qubits: gateInfo.gate.qubits.map((item: Qubit) => {
            return item.qubitName;
          }),
          layer: gateInfo.layer,
        };
      }
    );

    return { focusQubitGates };
  }
  private _importStructureFromFile(): {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[] {
    const dataloader = qv.manager.dataLoader;
    const data = dataloader.structureData;
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
    const idlePosition: number[][][] = [];

    let pre: number[][] = []; // pre[qubitIdx][layerIdx] : at qubitIdx（qubit wire）, the last qubit layer_idx before this layerIdx
    let suf: number[][] = [];

    for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
      pre[qubitIdx] = [];
      suf[qubitIdx] = [];
      for (let layerIdx = 0; layerIdx < this._originalLayers.length; ++layerIdx) {
        pre[qubitIdx][layerIdx] = -1;
        suf[qubitIdx][layerIdx] = this._originalLayers.length;
      }
    }

    // update pre
    for (let layerIdx = 0; layerIdx < this._originalLayers.length; ++layerIdx) {
      if (layerIdx != 0) {
        for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
          pre[qubitIdx][layerIdx] = Math.max(pre[qubitIdx][layerIdx], pre[qubitIdx][layerIdx - 1]);
        }
      }
      if (layerIdx === this._originalLayers.length - 1) {
        let layerGate = this._originalLayers[layerIdx];
        layerGate.forEach((gate: ComponentGate) => {
          if (gate.qubits.length === 1) {
          } else {
            let mx = -1;
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              mx = Math.max(mx, pre[qubitIdx][layerIdx]);
            }
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              pre[qubitIdx][layerIdx] = Math.max(pre[qubitIdx][layerIdx], mx);
            }
          }
        });
      } else {
        let layerGate = this._originalLayers[layerIdx];
        layerGate.forEach((gate: ComponentGate) => {
          if (gate.qubits.length === 1) {
            let qubitIdx = parseInt(gate.qubits[0].qubitName);
            pre[qubitIdx][layerIdx + 1] = Math.max(pre[qubitIdx][layerIdx + 1], layerIdx);
          } else {
            let mx = -1;
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              pre[qubitIdx][layerIdx + 1] = Math.max(pre[qubitIdx][layerIdx + 1], layerIdx);
              mx = Math.max(mx, pre[qubitIdx][layerIdx]);
            }
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              pre[qubitIdx][layerIdx] = Math.max(pre[qubitIdx][layerIdx], mx);
            }
          }
        });
      }
    }

    // update suf
    for (let layerIdx = this._originalLayers.length - 1; layerIdx >= 0; --layerIdx) {
      if (layerIdx != this._originalLayers.length - 1) {
        for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
          suf[qubitIdx][layerIdx] = Math.min(suf[qubitIdx][layerIdx], suf[qubitIdx][layerIdx + 1]);
        }
      }
      if (layerIdx === 0) {
        let layerGate = this._originalLayers[layerIdx];
        layerGate.forEach((gate: ComponentGate) => {
          if (gate.qubits.length === 1) {
          } else {
            let mn = this._originalLayers.length;
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              mn = Math.min(mn, suf[qubitIdx][layerIdx]);
            }
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              suf[qubitIdx][layerIdx] = Math.min(suf[qubitIdx][layerIdx], mn);
            }
          }
        });
      } else {
        let layerGate = this._originalLayers[layerIdx];
        layerGate.forEach((gate: ComponentGate) => {
          if (gate.qubits.length === 1) {
            let qubitIdx = parseInt(gate.qubits[0].qubitName);
            suf[qubitIdx][layerIdx - 1] = Math.min(suf[qubitIdx][layerIdx - 1], layerIdx);
          } else {
            let mn = this._originalLayers.length;
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              suf[qubitIdx][layerIdx - 1] = Math.min(suf[qubitIdx][layerIdx - 1], layerIdx);
              mn = Math.min(mn, suf[qubitIdx][layerIdx]);
            }
            for (let idx = 0; idx < gate.qubits.length; ++idx) {
              let qubitIdx = parseInt(gate.qubits[idx].qubitName);
              suf[qubitIdx][layerIdx] = Math.min(suf[qubitIdx][layerIdx], mn);
            }
          }
        });
      }
    }

    // averageIdleValue
    let averageIdleValue: number[][] = [];
    for (let layerIdx = 0; layerIdx < this._originalLayers.length; ++layerIdx) {
      averageIdleValue[layerIdx] = [];
      for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
        averageIdleValue[layerIdx][qubitIdx] = 0;
      }
    }

    for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
      for (let layerIdx = 0; layerIdx < this._originalLayers.length; ++layerIdx) {
        let sum = 0.0;
        for (let colidx = pre[qubitIdx][layerIdx] + 1; colidx < suf[qubitIdx][layerIdx]; ++colidx) {
          sum += this._layerParallelism[colidx];
        }
        averageIdleValue[layerIdx][qubitIdx] = sum / (suf[qubitIdx][layerIdx] - pre[qubitIdx][layerIdx] - 1);
      }
    }

    this._averageIdleValue = averageIdleValue;

    // idlePosition
    for (let layerIdx = 0; layerIdx < this._originalLayers.length; ++layerIdx) {
      idlePosition[layerIdx] = [];
      for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
        idlePosition[layerIdx][qubitIdx] = [];
      }
    }
    for (let qubitIdx = 0; qubitIdx < this._originalQubits.length; ++qubitIdx) {
      for (let layerIdx = 0; layerIdx < this._originalLayers.length; ++layerIdx) {
        for (let colidx = pre[qubitIdx][layerIdx] + 1; colidx < suf[qubitIdx][layerIdx]; ++colidx) {
          idlePosition[layerIdx][qubitIdx].push(colidx);
        }
      }
    }

    this._idlePosition = idlePosition;
  }

  private isInComponent(gate: ComponentGate, ComponentIdx: number) {
    let nwidx = gate.treeIndex;
    while (nwidx != 0) {
      if (nwidx === ComponentIdx) return true;
      nwidx = this._treeStructure[nwidx].parentIndex;
    }
    return nwidx === ComponentIdx;
  }

  private getGroupId(timeStamp: number) {
    if (timeStamp < 0) return [];
    let fa: number[] = [];
    let group: number[] = [];
    let used: boolean[] = [];

    const originalGates = this._compnentCircuit.getOriginalGates();
    const originalQubits = this._compnentCircuit.getOriginalQubits();

    // init
    for (let i = 0; i < originalQubits.length; ++i) {
      group[i] = -1;
      fa[i] = i;
    }
    for (let i = 0; i < originalQubits.length; ++i) {
      used[i] = false;
    }

    let find = (x: number) => {
      if (fa[x] == x) return x;
      fa[x] = find(fa[x]);
      return fa[x];
    };
    let union = (x: number, y: number) => {
      let pax = find(x);
      let pay = find(y);
      if (pax == pay) return;
      if (pax < pay) {
        fa[pay] = pax;
      } else {
        fa[pax] = pay;
      }
    };

    let maxTime = (gate: ComponentGate) => {
      let mx = -1;
      for (let i = 0; i < gate.range.length; ++i) {
        mx = Math.max(mx, gate.range[i]);
      }
      return mx;
    };

    for (let idx = 0; idx < originalGates.length; ++idx) {
      let gate = originalGates[idx];
      if (maxTime(gate) <= timeStamp) {
        let a = parseInt(gate.qubits[0].qubitName);
        used[a] = true;
        if (gate.qubits.length === 1) {
          continue;
        }
        for (let i = 1; i < gate.qubits.length; ++i) {
          let b = parseInt(gate.qubits[i].qubitName);
          used[b] = true;
          union(a, b);
        }
      }
    }

    let groupId = -1; //qubit1 begin with 1
    for (let i = 0; i < originalQubits.length; ++i) {
      if (used[i] === false) {
        continue;
      }
      let flag = false;
      for (let j = 0; j < i; ++j) {
        if (find(i) === find(j)) {
          group[i] = group[j];
          flag = true;
          break;
        }
      }
      if (flag) {
        continue;
      }
      group[i] = ++groupId;
    }

    for (let i = 0; i < originalQubits.length; ++i) {
      group[i]++;
    }

    return group;
  }

  private getTimestamp(ComponentIdx: number) {
    let startTimeStamp = -1;
    let endTimeStamp = -1;

    this._originalGates.forEach((gate: ComponentGate) => {
      if (this.isInComponent(gate, ComponentIdx)) {
        if (startTimeStamp === -1) {
          startTimeStamp = gate.range[0]!;
        }
        else {
          startTimeStamp = Math.min(startTimeStamp, gate.range[0]!);
        }
        if (endTimeStamp === -1) {
          endTimeStamp = gate.range[1]!;
        }
        else {
          endTimeStamp = Math.max(endTimeStamp, gate.range[1]!);
        }
      }
    });

    return { startTimeStamp, endTimeStamp };
  }

  private _updateConnectivity() {
    //this._connectivityComponentIndex
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
    for (let qubitIdx = 0; qubitIdx < originalQubits.length; qubitIdx++) {
      this._connectivityMatrix.push([]);
      for (let layerIdx = 0; layerIdx < originalQubits.length; layerIdx++) {
        this._connectivityMatrix[qubitIdx].push(0);
      }
    }

    //iterate all gates
    originalGates.forEach((gate: ComponentGate) => {

      let num = this.isInComponent(gate, this._connectivityComponentIndex)
        ? 2
        : 1;

      const qubits = gate.qubits.map((qubit: Qubit) => {
        return parseInt(qubit.qubitName);
      });

      //cz cp cswap ryy cry cx 
      if (qubits.length >= 2) {
        if(qubits.length == 2){
          for (let start = 0; start < qubits.length; start++) {
            for (let end = start + 1; end < qubits.length; end++) {
              this._connectivityMatrix[qubits[start]][qubits[end]] = num;
              if (gate.gateName === "cz" || gate.gateName === "cp" || gate.gateName === "swap") {
                this._connectivityMatrix[qubits[end]][qubits[start]] = num;
              }
            }
          }
        }
        if (gate.gateName === "cswap") {
          this._connectivityMatrix[qubits[0]][qubits[1]] = num;
          this._connectivityMatrix[qubits[0]][qubits[2]] = num;
          this._connectivityMatrix[qubits[1]][qubits[2]] = num;
          this._connectivityMatrix[qubits[2]][qubits[1]] = num;
        } else if (gate.gateName === "ccx") {
          this._connectivityMatrix[qubits[0]][qubits[1]] = num;
          this._connectivityMatrix[qubits[0]][qubits[2]] = num;
        } else if (gate.gateName === "ryy") {
          this._connectivityMatrix[qubits[0]][qubits[1]] = num;
          this._connectivityMatrix[qubits[1]][qubits[0]] = num;
        } else if (gate.gateName === "cry" || gate.gateName === "cx") {
          this._connectivityMatrix[qubits[0]][qubits[1]] = num;
        }
      } else {
        this._connectivityMatrix[qubits[0]][qubits[0]] = num;
      }
    });


    let tmpTimestamp = this.getTimestamp(this._connectivityComponentIndex);
    let beforeTimeStamp = tmpTimestamp.startTimeStamp;
    let currentTimeStamp = tmpTimestamp.endTimeStamp;


    //calculation the entanglement after current component(included)
    curEntGroup = this.getGroupId(currentTimeStamp);

    //calculation the entanglement before the endTimeStamp(NOT included)
    preEntGroup = this.getGroupId(beforeTimeStamp - 1);

    return { curEntGroup, preEntGroup };
  }

  private _updateQubit() {
    // this._mapOriginalGateToLayer
    // this._treeStructure
    // this._originalGates
    const layers = this._compnentCircuit.getLayers();
    const qubits = this._compnentCircuit.getQubits();
    let focusQubit: Qubit;
    const focusGates: { gate: ComponentGate; layer: number[] }[] = [];
    // let fakeQubit = this._focusQubitIndex;

    qubits.forEach((qubit) => {
      if (qubit instanceof SuperQubit) {
        qubit.qubits.forEach((originalQubit) => {
          if (originalQubit.index === this._focusQubitIndex) {
            focusQubit = qubit;
          }
        });
      } else {
        if (qubit.index === this._focusQubitIndex) {
          focusQubit = qubit;
        }
      }
    });
    layers.forEach((layer: Layer) => {
      layer.gates.forEach((gate: ComponentGate) => {
        if (gate.qubits.includes(focusQubit)) {
          if (this._treeStructure[gate.treeIndex].type === "rep_item") {
            const originalGate = this._indexToOriginalGatesMap.get(gate.index);
            if (originalGate !== undefined) {
              const layerIndex = this._originalGateToLayerMap.get(originalGate);
              if (layerIndex !== undefined) {
                focusGates.push({
                  gate: gate,
                  layer: [layerIndex, layerIndex],
                });
              } else {
                throw new Error("gate layer undefined.");
              }
            } else {
              throw new Error("original gate undefined.");
            }
          } else {
            let gateList: number[];
            gateList = [];
            this._originalGates.forEach((ogate: ComponentGate) => {
              let flag = false;
              // console.log("qubits", ogate.qubits)
              ogate.qubits.forEach((qubit: Qubit) => {
                if (qubit.index === this._focusQubitIndex) {
                  flag = true;
                }
              });
              if (flag) {
                ogate.repTimes.forEach((num: number) => {
                  if (num === gate.index) {
                    const layerIndex = this._originalGateToLayerMap.get(ogate);
                    if (layerIndex !== undefined) {
                      gateList.push(layerIndex);
                    } else {
                      throw new Error("gate layer undefined.");
                    }
                  }
                });
              }
            });
            gateList.sort((a: number, b: number) => {
              return a - b;
            });
            focusGates.push({
              gate: gate,
              layer: [gateList[0], gateList[gateList.length - 1]],
            }); //TODO: check
          }
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
        this._originalGateToLayerMap.set(gate, layers.length - 1);
      } else {
        layers[layerIndex].push(gate);
        this._originalGateToLayerMap.set(gate, layerIndex);
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
    let focusQubitGates = this._focusQubitGates.map(
      (gateInfo: { gate: ComponentGate; layer: number[] }) => {
        return {
          gateName: gateInfo.gate.gateName,
          qubits: gateInfo.gate.qubits.map((item: Qubit) => {
            return item.qubitName;
          }),
          layer: gateInfo.layer,
        };
      }
    );

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
