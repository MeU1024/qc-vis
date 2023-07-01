import * as vscode from "vscode";

import { getLogger } from "../components/logger";
import {
  Abstraction,
  AbstractionRule,
  AbstractionType,
  Semantics,
} from "./abstractionlib/abstractionrule";
import {
  ComponentGate,
  DrawableCircuit,
  Layer,
  Qubit,
  SuperQubit,
} from "./structurelib/qcmodel";

import * as qv from "../quantivine";
import { QCViewerManagerService } from "../components/viewerlib/qcviewermanager";
import { ComponentCircuit } from "./component";
import { getExtensionUri } from "../quantivine";
import path from "path";
import { DataLoader } from "./structurelib/dataloader";
import { error } from "console";

const logger = getLogger("DataProvider", "Abstraction");

export class AbstractionDataProvider {
  private _data: AbstractedCircuit | undefined;
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

  setFocus(index: number) {
    const data = this._data?.setFocus(index);
    if (data !== undefined) {
      this._postHighlightData(data);
    }
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
        command: "abstraction.setRegion",
        data: data,
      };

      let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

      panelSet?.forEach((panel) => {
        panel.postMessage(message);
        logger.log(`Sent Message: ${panel.sourceFileUri}`);
      });
    }
  }

  async updateData() {
    this._data = await this.abstractQcData();
    this._postData();
  }

  async abstractQcData() {
    let abstractCircuit = new AbstractedCircuit(this._dataFile);

    return abstractCircuit;
  }

  private async _postData() {
    if (!this._data) {
      return;
    }

    let message1 = {
      command: "abstraction.setTitle",
      data: { title: "Abstraction View" },
    };

    let message2 = {
      command: "abstraction.setCircuit",
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

class AbstractedCircuit {
  private _componentCircuit: ComponentCircuit;
  private _semanticsList: Semantics[];

  private _qubits: Qubit[];
  private _isIdleQubit: boolean[];
  // private _qubitLineno: Map<Qubit, number>; // Map qubit to line number
  private _gates: ComponentGate[];
  // private _gateLayerMap: Map<ComponentGate, number>; // Map gate to layer
  private _layers: Layer[];
  private _isIdleLayer: boolean[];
  private _abstractions: Abstraction[];
  private _cachedGates: Map<ComponentGate, number>; // Map gate to layer
  // private _cached: boolean;
  private _drawableCircuit: DrawableCircuit;
  // private _visibilityMatrix: boolean[][]; // Matrix of gate visibility
  private _absGates: ComponentGate[];
  private _gateToRealLayerIndex: Map<ComponentGate, number>;
  private _treeStructure: {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[];
  private _highlightedComponent: number[];
  private _qubitMap: Map<Qubit, number>;
  constructor(dataFile: vscode.Uri) {
    this._componentCircuit = this._importCircuitFromFile(dataFile);
    this._semanticsList = this._importSemanticsFromFile(dataFile);
    // const algorithmName = path.basename(dataFile.fsPath, ".py");
    const algorithm = qv.manager.algorithm;
    if (algorithm === undefined) {
      throw new Error("Algorithm undefined");
    }
    //TODO: fix file

    // const file = vscode.Uri.file(
    //   vscode.Uri.joinPath(
    //     getExtensionUri(),
    //     `/resources/data/${algorithmName}-json-data.json`
    //   ).fsPath
    // );
    // logger.log(`Build component circuit from ${file.fsPath}`);

    this._qubits = [];
    this._isIdleQubit = [];
    this._gates = [];
    this._layers = [];
    this._isIdleLayer = [];
    this._abstractions = [];
    this._absGates = [];
    this._highlightedComponent = [];

    this._cachedGates = new Map<ComponentGate, number>();
    this._gateToRealLayerIndex = new Map<ComponentGate, number>();
    this._qubitMap = new Map<Qubit, number>();
    //TODO: fix _importStructureFromFile
    // this._treeStructure = this._importStructureFromFile(file);
    this._treeStructure = this._importStructureFromFile();
    // this._cached = false;
    this._drawableCircuit = new DrawableCircuit();

    this._newBuild();
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

  private _importCircuitFromFile(dataFile: vscode.Uri): ComponentCircuit {
    return new ComponentCircuit(dataFile);
  }

  private _importSemanticsFromFile(dataFile: vscode.Uri): Semantics[] {
    const dataloader = qv.manager.dataLoader;
    const data = dataloader.semanticData;
    let semantics = data.map((sem: any) => {
      let semType = sem.type;
      let semRange = sem.range;
      let treeIndex = sem.treeIndex;
      return new Semantics(semType, semRange, treeIndex);
    });
    return semantics;
  }

  private _build() {
    // qv.semanticTreeViewer.logTreeData();
    let width = this._componentCircuit.width;
    let height = this._componentCircuit.height;

    this._qubits = this._componentCircuit.qubits;
    this._isIdleQubit = new Array(this._qubits.length).fill(true);
    this._layers = new Array(width);
    this._isIdleLayer = new Array(width).fill(true);
    this._abstractions = [];
    this._cachedGates.clear();

    // Build abstracted circuit with semantics
    this._componentCircuit.gates.forEach((gate: ComponentGate) => {
      if (this._cachedGates.has(gate)) {
        return;
      }

      let ret = this._writtenInSemantics(gate);
      if (ret) {
        ret.start.forEach((g) => this._visGate(g));
        ret.second.forEach((g) => this._visGate(g));
        ret.end.forEach((g) => this._visGate(g));
        this._abstractions.push(ret);
        // Cache gates in abstraction
        this._cacheGates(ret.gates);
      } else {
        this._visGate(gate);
        this._cacheGates([gate]);
      }
    });

    // Generate Layout
    this._generateLayout();
  }

  private _newBuild() {
    let width = this._componentCircuit.width;

    this._qubits = this._componentCircuit.qubits;
    this._isIdleQubit = new Array(this._qubits.length).fill(true);
    this._layers = new Array(width);
    this._isIdleLayer = new Array(width).fill(true);
    this._abstractions = [];
    this._cachedGates.clear();

    // Build abstracted circuit with semantics
    this._semanticsList.forEach((semantics) => {
      if (qv.semanticTreeViewer.isVisible(semantics.treeIndex)) {
        //TODO: check range
        let tmpran: number[] = [];
        tmpran.push(semantics.range[0][0]);
        tmpran.push(semantics.range[0][1]);
        semantics.range.forEach((ran: number[]) => {
          if (tmpran[0] > ran[0]) tmpran[0] = ran[0];
          if (tmpran[1] < ran[1]) tmpran[1] = ran[1];
        });
        let subCircuit = this._componentCircuit.slice(tmpran);
        let abstraction = AbstractionRule.apply(subCircuit, semantics);
        if (abstraction) {
          // Mark symbol gates in abstraction
          abstraction.start.forEach((gate) => this._visGate(gate));
          abstraction.second.forEach((gate) => this._visGate(gate));
          abstraction.end.forEach((gate) => this._visGate(gate));
          this._abstractions.push(abstraction);

          // Cache gates in abstraction
          this._cacheGates(abstraction.gates);
        }
      }
    });

    // visualize gates that are not abstracted
    this._componentCircuit.gates.forEach((gate) => {
      if (!this._cachedGates.has(gate)) {
        this._visGate(gate);
      }
    });

    // Generate Layout
    this._generateLayout();
  }

  //change the state of idle layer and idle qubit
  private _visGate(gate: ComponentGate) {
    if (this._cachedGates.has(gate)) {
      return;
    }
    let layerIndex = this._componentCircuit.getGateLayer(gate);
    this._isIdleLayer[layerIndex!] = false;

    if (gate.qubits.length > 2 && gate.gateName[0] !== "_") {
      let firstQubitIndex = this._qubits.indexOf(gate.qubits[0]);
      this._isIdleQubit[firstQubitIndex] = false;
      let secondQubitIndex = this._qubits.indexOf(gate.qubits[1]);
      this._isIdleQubit[secondQubitIndex] = false;
      let lastQubitIndex = this._qubits.indexOf(
        gate.qubits[gate.qubits.length - 1]
      );
      this._isIdleQubit[lastQubitIndex] = false;
    } else if (gate.gateName[0] === "_") {
      let firstQubitIndex = this._qubits.indexOf(gate.qubits[0]);
      this._isIdleQubit[firstQubitIndex] = false;

      if (gate.qubits.length > 1) {
        let secondQubitIndex = this._qubits.indexOf(gate.qubits[1]);
        this._isIdleQubit[secondQubitIndex] = false;
        let secondLastQubitIndex = this._qubits.indexOf(
          gate.qubits[gate.qubits.length - 2]
        );
        this._isIdleQubit[secondLastQubitIndex] = false;
        let lastQubitIndex = this._qubits.indexOf(
          gate.qubits[gate.qubits.length - 1]
        );
        this._isIdleQubit[lastQubitIndex] = false;
      }
    } else {
      let firstQubitIndex = this._qubits.indexOf(gate.qubits[0]);
      this._isIdleQubit[firstQubitIndex] = false;
      let lastQubitIndex = this._qubits.indexOf(
        gate.qubits[gate.qubits.length - 1]
      );
      this._isIdleQubit[lastQubitIndex] = false;
    }
  }

  private _cacheGates(gates: ComponentGate[]) {
    gates.forEach((gate: ComponentGate) => {
      let layerIndex = this._componentCircuit.getGateLayer(gate);
      this._cachedGates.set(gate, layerIndex!);
    });
    // this._cached = true;
  }

  private _generateLayout() {
    let newQubits: Qubit[] = [];
    let qubitMap = new Map<Qubit, number>();
    let newLayers: Layer[] = [];
    let layerMap = new Map<Layer, number>();

    // Generate new qubits
    this._qubits.forEach((qubit: Qubit, index: number) => {
      if (!this._isIdleQubit[index]) {
        newQubits.push(qubit);
      } else {
        if (
          index === 0 ||
          index === this._qubits.length - 1 ||
          !this._isIdleQubit[index - 1]
        ) {
          newQubits.push(new SuperQubit("...", [qubit]));
        } else {
          let superQubit = newQubits[newQubits.length - 1] as SuperQubit;
          superQubit.qubits.push(qubit);
        }
      }
      qubitMap.set(qubit, newQubits.length - 1);
    });

    // Generate new layers
    this._componentCircuit.layers.forEach((layer: Layer, index: number) => {
      if (!this._isIdleLayer[index]) {
        let newLayer = new Layer();
        newLayer.gates = layer.gates.filter((gate) =>
          this._isVisibleGate(gate)
        );
        newLayers.push(newLayer);
      } else {
        if (
          index === 0 ||
          index === this._layers.length - 1 ||
          !this._isIdleLayer[index - 1]
        ) {
          let newLayer = new Layer();
          newLayers.push(newLayer);
        }
      }
      layerMap.set(layer, newLayers.length - 1);
    });
    newLayers = this._markAbstraction(newQubits, newLayers, qubitMap, layerMap);
    const pushedNewLayers = this._checkOverlap(newLayers, qubitMap);
    this._qubitMap = qubitMap;
    this._mapGateToRealLayers(pushedNewLayers);
    this._drawableCircuit.loadFromLayers(pushedNewLayers, newQubits, qubitMap);

    // this._drawableCircuit.loadFromLayers(newLayers, newQubits, qubitMap);

    // this._cached = false;
  }
  private _mapGateToRealLayers(pushedNewLayers: Layer[]) {
    pushedNewLayers.forEach((layer, layerIndex) => {
      layer.gates.forEach((gate) => {
        this._absGates.push(gate);
        this._gateToRealLayerIndex.set(gate, layerIndex);
      });
    });
  }

  private _markAbstraction(
    newQubits: Qubit[],
    newLayers: Layer[],
    qubitMap: Map<Qubit, number>,
    layerMap: Map<Layer, number>
  ): Layer[] {
    let n = newQubits.length;
    let m = newLayers.length;
    let ret = newLayers;

    let isIdelNewQubit = newQubits.map((qubit) => qubit.qubitName === "...");
    let isIdelNewLayer = newLayers.map((layer) => layer.gates.length === 0);

    const checkInAbstraction = (
      i: number,
      j: number,
      absType: AbstractionType
    ): boolean => {
      // Check if the grid(i, j) is in abstraction
      let ret = false;
      this._abstractions
        .filter((abstraction) => abstraction.type === absType)
        .forEach((abstraction) => {
          let start = abstraction.start[0];
          let end = abstraction.end[0];
          let startQubitIndex = qubitMap.get(start.qubits[0])!;
          let startLayerIndex = layerMap.get(
            this._componentCircuit.layers[
            this._componentCircuit.getGateLayer(start)!
            ]
          )!;
          let endQubitIndex = Math.max(qubitMap.get(end.qubits[end.qubits.length - 1])!, qubitMap.get(start.qubits[start.qubits.length - 1])!);
          let endLayerIndex = layerMap.get(
            this._componentCircuit.layers[
            this._componentCircuit.getGateLayer(end)!
            ]
          )!;

          ret ||=
            i >= startQubitIndex &&
            i <= endQubitIndex &&
            j >= startLayerIndex &&
            j <= endLayerIndex;
        });
      return ret;
    };

    //compute where to draw dots in case of ( vertical abs & isIdelNewLayer )
    const dotQubit = (
      i: number,
      j: number,
      absType: AbstractionType
    ): number[] => {
      // Check if the grid(i, j) is in abstraction
      let res = [-1, -1];
      this._abstractions
        .filter((abstraction) => abstraction.type === absType)
        .forEach((abstraction) => {
          let ret = false;
          let start = abstraction.start[0];
          let second = abstraction.second[0];
          let end = abstraction.end[0];
          let startQubitIndex = qubitMap.get(start.qubits[0])!;
          let startLayerIndex = layerMap.get(
            this._componentCircuit.layers[
            this._componentCircuit.getGateLayer(start)!
            ]
          )!;
          let endQubitIndex = Math.max(qubitMap.get(end.qubits[end.qubits.length - 1])!, qubitMap.get(start.qubits[start.qubits.length - 1])!);
          let endLayerIndex = layerMap.get(
            this._componentCircuit.layers[
            this._componentCircuit.getGateLayer(end)!
            ]
          )!;

          ret ||=
            i >= startQubitIndex &&
            i <= endQubitIndex &&
            j >= startLayerIndex &&
            j <= endLayerIndex;

          if(ret) {
            res[0] = Math.floor((qubitMap.get(end.qubits[0])! + qubitMap.get(second.qubits[0])!) / 2);
            res[1] = Math.floor((qubitMap.get(end.qubits[end.qubits.length - 1])! + qubitMap.get(second.qubits[second.qubits.length- 1])!) / 2);
          }
        });
      return res;
    };

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < m; ++j) {
        if (!isIdelNewQubit[i] && !isIdelNewLayer[j]) {
          continue;
        }
        let curQubit = newQubits[i];
        if (curQubit instanceof SuperQubit && curQubit.qubitName === "...") {
          curQubit = curQubit.qubits[0];
        }

        if (isIdelNewQubit[i] && isIdelNewLayer[j]) {
          const checkIn = checkInAbstraction(i, j, "diagonal");
          if (checkIn) {
            ret[j].gates.push(new ComponentGate("...", [curQubit], [], 0, []));
          }
        }
        if (isIdelNewQubit[i]) {
          const checkIn = checkInAbstraction(i, j, "vertical");
          if (checkIn) {
            ret[j].gates.push(new ComponentGate("...", [curQubit], [], 0, []));
          }
        } else if (isIdelNewLayer[j]) {
          const checkInHor = checkInAbstraction(i, j, "horizontal");
          if (checkInHor) {
            // let curQubit = newQubits[Math.floor(newQubits.length / 2)];
            // if (curQubit instanceof SuperQubit) {
            //   //curQubit = curQubit.qubits[0];
            // }

            ret[j].gates.push(
              new ComponentGate("colDots", [curQubit], [], 0, [])
            );
          }
          
          const checkInVer = checkInAbstraction(i, j, "vertical");

          if(checkInVer) {
            console.log("dotQubit", dotQubit(i, j, "vertical"));
            console.log("curQubit", parseInt(curQubit.qubitName))
          }

          if(checkInVer && 
            ( parseInt(curQubit.qubitName) == dotQubit(i, j, "vertical")[0] || parseInt(curQubit.qubitName) == dotQubit(i, j, "vertical")[1])) {
            ret[j].gates.push(
              new ComponentGate("colDots", [curQubit], [], 0, [])
            );
          }
        }
      }
    }

    // console.log("abs ret", ret);

    return ret;
  }

  //check if visible
  private _isVisibleGate(gate: ComponentGate): boolean {
    let layerIndex = this._componentCircuit.getGateLayer(gate);
    if (this._isIdleLayer[layerIndex!]) {
      return false;
    }

    let firstQubitIndex = this._qubits.indexOf(gate.qubits[0]);
    if (this._isIdleQubit[firstQubitIndex]) {
      return false;
    }
    let lastQubitIndex = this._qubits.indexOf(
      gate.qubits[gate.qubits.length - 1]
    );
    if (this._isIdleQubit[lastQubitIndex]) {
      return false;
    }

    // if (gate.qubits.length > 2 && gate.gateName[0] !== "_") {
    if (gate.qubits.length > 2 && gate.gateName[0] !== "_") {
      let secondQubitIndex = this._qubits.indexOf(gate.qubits[1]);
      if (this._isIdleQubit[secondQubitIndex]) {
        return false;
      }
    }

    return true;
  }

  private _writtenInSemantics(cGate: ComponentGate): Abstraction | undefined {
    let ret: Abstraction | undefined = undefined;
    let cgRange = cGate.range;

    this._semanticsList.forEach((sem: Semantics) => {
      // if the component gate is contained in the semantics
      let flag = false;
      let tmpran = [-1, -1];
      sem.range.forEach((ran: number[]) => {
        if (cgRange[0] >= ran[0] && cgRange[1] <= ran[1]) {
          flag = true;
          tmpran = ran;
        }
      });
      if (
        // cgRange[0] >= sem.range[0] &&
        // cgRange[1] <= sem.range[1] &&
        // cgRange[1] - cgRange[0] + 1 <= sem.range[2]
        flag
      ) {
        let subCircuit = this._componentCircuit.slice(tmpran);
        ret = AbstractionRule.apply(subCircuit, sem);
      }
    });

    return ret;
  }
  private _checkOverlap(
    componentLayers: Layer[],
    qubitMap: Map<Qubit, number>
  ) {
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
        let minQubit = qubitMap.get(gate.qubits[0]);
        let maxQubit = qubitMap.get(gate.qubits[gate.qubits.length - 1]);
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
    // this._layerMap = layerMap;
    return newLayers;
  }
  setFocus(index: number) {
    if (!this._highlightedComponent.includes(index)) {
      this._highlightedComponent.push(index);
    }
    const regions = this.getComponentRegion();

    return regions;
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
      this._absGates.forEach((gate, index) => {
        if (
          this._componentCircuit
            .getTreeChildrenList()
          [componentIndex].includes(gate.treeIndex)
        ) {
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
          let regionQubit = [
            this._componentCircuit.getOriginalQubits().length + 1,
            -1,
          ];
          gatesIndex.forEach((cmpgate: ComponentGate) => {
            const layer = this._gateToRealLayerIndex.get(cmpgate);
            const qubits = cmpgate.qubits.map((qubit) => {
              const qubitIndex = this._qubitMap.get(qubit);
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
  exportJson(): any {
    const data = this._drawableCircuit.exportJson();
    data["componentRegion"] = this.getComponentRegion();
    return data;
  }

  get width(): number {
    return this._layers.length;
  }

  get height(): number {
    return this._qubits.length;
  }
}
