import path from "path";
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
  private _pushLayers: Layer[];
  private _gateLayerMap: Map<ComponentGate, number>;
  private _treeMap: Map<number, number>;
  private _groupInfoMap: Map<number, { gatesIndex: number[] }>;
  private _superQubitMap: Map<Qubit, number>;
  private _layerMap: Map<number, number[]>;
  private _drawableCircuit: DrawableCircuit;

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
    this._superQubitMap = new Map<Qubit, number>();
    this._gateLayerMap = new Map<ComponentGate, number>();
    this._treeMap = new Map<number, number>();
    this._layerMap = new Map<number, number[]>();
    this._groupInfoMap = new Map<number, { gatesIndex: number[] }>();
    this._drawableCircuit = new DrawableCircuit();

    const algorithmName = path.basename(dataFile.fsPath, ".py");
    const file = vscode.Uri.file(
      vscode.Uri.joinPath(
        getExtensionUri(),
        `/resources/data/${algorithmName}-json-data.json`
      ).fsPath
    );
    logger.log(`Build component circuit from ${file.fsPath}`);
    // if (jsonData === undefined) {
    //   jsonData.layers.forEach((layer: any) => {
    //     this._layers.push(new Layer([]));
    //     layer.forEach((gateInfo: any) => {
    //       let gateName = gateInfo[0];
    //       let qubits: Qubit[] = [];
    //       gateInfo[1].forEach((qubitIndex: number) => {
    //         qubits.push(this._qubits[qubitIndex]);
    //       });
    //       let range = gateInfo[2];
    //       let treeIndex = gateInfo[3];

    //       let gate = new ComponentGate(gateName, qubits, range, treeIndex);
    //       this._gates.push(gate);
    //       this._layers[this._layers.length - 1].gates.push(gate);
    //     });
    //   });
    // }

    this._importGatesFromFile(file);
    this._treeStructure = this._importStructureFromFile(file);
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
          gate[4].toString()
        );
        this._originalGates.push(componentGate);
      });
    });
  }

  private _importStructureFromFile(file?: vscode.Uri): {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[] {
    const algorithm = qv.manager.algorithm;
    let dataSource = vscode.Uri.joinPath(
      getExtensionUri(),
      `/resources/data/${algorithm}-structure.json`
    ).fsPath;
    let data = require(dataSource);
    // if (file) {
    //   data = require(file.fsPath);
    // }
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
        let previousIndex = treeIndex;
        while (1) {
          let treeVisible = qv.semanticTreeViewer.isVisible(treeIndex);
          let parentVisible = qv.semanticTreeViewer.isVisible(parentIndex);

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

        // this._funcNodeMap.set();
      }
    );
    // this._treeStructure.forEach(
    //   (item: {
    //     name: string;
    //     parentIndex: number;
    //     index: number;
    //     type: string;
    //   }) => {
    //     let parentIndex = item.parentIndex;
    //     let treeIndex = item.index;

    //     while (1) {
    //       const treeVisible = qv.semanticTreeViewer.isVisible(treeIndex);
    //       const parentVisible = qv.semanticTreeViewer.isVisible(parentIndex);
    //       if (treeVisible) {
    //         if (this._treeStructure[treeIndex].type === "rep") {
    //           treeIndex = item.index;
    //         }
    //         break;
    //       } else {
    //         parentIndex = this._treeStructure[parentIndex].parentIndex;
    //         treeIndex = this._treeStructure[treeIndex].parentIndex;
    //       }
    //     }
    //     if (
    //       this._treeStructure[treeIndex].type === "rep" &&
    //       qv.semanticTreeViewer.isVisible(treeIndex)
    //     ) {
    //       treeIndex = item.index;
    //     }

    //     this._treeMap.set(item.index, treeIndex);
    //     // this._funcNodeMap.set();
    //   }
    // );
  }
  private _build() {
    // Build component circuit

    const { gatesInfo, treeIndexGatesMap } = this._grouping();
    const { edgeMap, qubitMap } = this._bundling(gatesInfo);
    // const layers = this._placement(gatesInfo, edgeMap);
    const layers = this._semBasedPlacement(gatesInfo, edgeMap);
    this._generateLayout(layers, gatesInfo, qubitMap);
  }

  private _grouping() {
    let treeMap = new Map<number, number[]>();
    let treeIndexGatesMap = new Map<number, { [key: string]: number[] }>();

    this._treeStructure.forEach(
      (item: {
        name: string;
        parentIndex: number;
        index: number;
        type: string;
      }) => {
        treeMap.set(item.index, []);
        treeIndexGatesMap.set(item.index, {});
      }
    );

    //aggregate gates
    // this._originalGates.forEach((gate: ComponentGate, gateIndex) => {
    //   const treeIndex = gate.treeIndex;
    //   //groupDict[tagIndex].gates.push(gateIndex);
    //   const newTreeIndex = this._treeMap.get(treeIndex);
    //   if (newTreeIndex !== undefined) {
    //     let gates = treeMap.get(newTreeIndex);
    //     if (gates !== undefined) {
    //       gates.push(gateIndex);
    //       treeMap.set(newTreeIndex, gates);
    //     }
    //   } else {
    //     let gates = treeMap.get(treeIndex);
    //     if (gates !== undefined) {
    //       gates.push(gateIndex);
    //       treeMap.set(treeIndex, gates);
    //     }
    //   }
    // });

    this._originalGates.forEach((gate: ComponentGate, gateIndex) => {
      const treeIndex = gate.treeIndex;
      const timestampKey = gate.repTimes.toString();

      const newTreeIndex = this._treeMap.get(treeIndex);
      if (newTreeIndex !== undefined) {
        let gatesDict = treeIndexGatesMap.get(newTreeIndex);
        if (gatesDict !== undefined) {
          let newGatesDict = gatesDict;
          let gateList = newGatesDict[timestampKey];
          if (gateList !== undefined) {
            newGatesDict[timestampKey] = [...gateList, gateIndex];
          } else {
            newGatesDict[timestampKey] = [gateIndex];
          }
          treeIndexGatesMap.set(newTreeIndex, newGatesDict);
        }
      } else {
        let gatesDict = treeIndexGatesMap.get(treeIndex);
        if (gatesDict !== undefined) {
          let newGatesDict = gatesDict;
          let gateList = newGatesDict[timestampKey];
          if (gateList !== undefined) {
            newGatesDict[timestampKey] = [...gateList, gateIndex];
          } else {
            newGatesDict[timestampKey] = [gateIndex];
          }
          treeIndexGatesMap.set(treeIndex, newGatesDict);
        }
      }
    });

    let gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
      repTimes: string;
    }[] = [];

    // treeMap.forEach((gates: number[], treeIndex: number) => {
    //   const treeNodeType = this._treeStructure[treeIndex].type;
    //   const treeNodeName = this._treeStructure[treeIndex].name;
    //   if (gates.length !== 0) {
    //     let timeRange = this._originalGates[gates[0]].range;
    //     let bits = new Set<Qubit>();
    //     switch (treeNodeType) {
    //       case "fun":
    //         gates.forEach((gateIndex: number) => {
    //           const gate = this._originalGates[gateIndex];
    //           if (gate.range[0] < timeRange[0]) {
    //             timeRange[0] = gate.range[0];
    //           }
    //           if (gate.range[1] > timeRange[1]) {
    //             timeRange[1] = gate.range[1];
    //           }
    //           gate.qubits.forEach((bit: Qubit) => {
    //             bits.add(bit);
    //           });
    //         });
    //         gatesInfo.push({
    //           gates: gates,
    //           name: treeNodeName,
    //           qubits: Array.from(bits).sort((a, b) => {
    //             return parseInt(a.qubitName) - parseInt(b.qubitName);
    //           }),
    //           range: timeRange,
    //           treeIndex: treeIndex,

    //         });
    //         this._groupInfoMap.set(treeIndex, {
    //           gatesIndex: [gatesInfo.length - 1],
    //         });
    //         break;

    //       case "rep_item":
    //         gates.forEach((gateIndex: number) => {
    //           gatesInfo.push({
    //             gates: [gateIndex],
    //             name: treeNodeName,
    //             qubits: this._originalGates[gateIndex].qubits,
    //             range: this._originalGates[gateIndex].range,
    //             treeIndex: treeIndex,
    //           });
    //           const gates = this._groupInfoMap.get(treeIndex);
    //           if (gates !== undefined) {
    //             this._groupInfoMap.set(treeIndex, {
    //               gatesIndex: [...gates.gatesIndex, gatesInfo.length - 1],
    //             });
    //           } else {
    //             this._groupInfoMap.set(treeIndex, {
    //               gatesIndex: [gatesInfo.length - 1],
    //             });
    //           }
    //         });

    //         break;
    //       default:
    //         break;
    //     }
    //   }
    // });

    treeIndexGatesMap.forEach(
      (
        gatesDict: {
          [key: string]: number[];
        },
        treeIndex: number
      ) => {
        for (const [timestampKey, gates] of Object.entries(gatesDict)) {
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
                  qubits: Array.from(bits).sort((a, b) => {
                    return parseInt(a.qubitName) - parseInt(b.qubitName);
                  }),
                  range: timeRange,
                  treeIndex: treeIndex,
                  repTimes: timestampKey,
                });
                this._groupInfoMap.set(treeIndex, {
                  gatesIndex: [gatesInfo.length - 1],
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
                    repTimes: timestampKey,
                  });
                  const gates = this._groupInfoMap.get(treeIndex);
                  if (gates !== undefined) {
                    this._groupInfoMap.set(treeIndex, {
                      gatesIndex: [...gates.gatesIndex, gatesInfo.length - 1],
                    });
                  } else {
                    this._groupInfoMap.set(treeIndex, {
                      gatesIndex: [gatesInfo.length - 1],
                    });
                  }
                });

                break;
              default:
                break;
            }
          }
        }
      }
    );

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
          repTimes: string;
        }
      ) => {
        return a.range[0] - b.range[0];
      }
    );

    return { gatesInfo, treeIndexGatesMap };
  }

  private _bundling(
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

  private _semBasedPlacement2(
    gatesInfo: {
      gates: number[];
      name: string;
      qubits: Qubit[];
      range: number[];
      treeIndex: number;
    }[],
    edgeMap: number[],
    treeMap: Map<number, number[]>
  ) {
    //gate placement
    let qubitsPlacement = this._qubits.map((bit: Qubit) => {
      return 0;
    });
    let layers: number[][] = [];

    this._groupInfoMap.forEach((value, treeIndex) => {
      let functionPlacement = 0;
      let qSet = new Set<number>();
      value.gatesIndex.forEach((gateIndex: number, index) => {
        let layerIndex = 0;
        gatesInfo[gateIndex].qubits.forEach((qubit: Qubit) => {
          const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
          if (qubitIndex !== undefined) {
            if (qubitsPlacement[qubitIndex] > layerIndex) {
              layerIndex = qubitsPlacement[qubitIndex];
            }
          }
          qSet.add(qubitIndex);
        });

        if (layers.length < layerIndex + 1) {
          layers.push([gateIndex]);
        } else {
          layers[layerIndex].push(gateIndex);
        }

        if (functionPlacement < layerIndex + 1) {
          functionPlacement = layerIndex + 1;
        }

        gatesInfo[gateIndex].qubits.forEach((qubit: Qubit) => {
          const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
          if (qubitIndex !== undefined) {
            qubitsPlacement[qubitIndex] = layerIndex + 1;
          }
        });
      });

      const qRange = Array.from(qSet).sort((a: number, b: number) => {
        return a - b;
      });

      for (let index = qRange[0]; index <= qRange[qRange.length - 1]; index++) {
        qubitsPlacement[index] = functionPlacement;
      }
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

    // this._groupInfoMap.forEach((value, treeIndex) => {
    //   let functionPlacement = 0;
    //   let qSet = new Set<number>();
    //   value.gatesIndex.forEach((gateIndex: number, index) => {
    //     let layerIndex = 0;
    //     gatesInfo[gateIndex].qubits.forEach((qubit: Qubit) => {
    //       const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
    //       if (qubitIndex !== undefined) {
    //         if (qubitsPlacement[qubitIndex] > layerIndex) {
    //           layerIndex = qubitsPlacement[qubitIndex];
    //         }
    //       }
    //       qSet.add(qubitIndex);
    //     });

    //     if (layers.length < layerIndex + 1) {
    //       layers.push([gateIndex]);
    //     } else {
    //       layers[layerIndex].push(gateIndex);
    //     }

    //     if (functionPlacement < layerIndex + 1) {
    //       functionPlacement = layerIndex + 1;
    //     }

    //     gatesInfo[gateIndex].qubits.forEach((qubit: Qubit) => {
    //       const qubitIndex = edgeMap[parseInt(qubit.qubitName)];
    //       if (qubitIndex !== undefined) {
    //         qubitsPlacement[qubitIndex] = layerIndex + 1;
    //       }
    //     });
    //   });

    //   const qRange = Array.from(qSet).sort((a: number, b: number) => {
    //     return a - b;
    //   });

    //   for (let index = qRange[0]; index <= qRange[qRange.length - 1]; index++) {
    //     qubitsPlacement[index] = functionPlacement;
    //   }
    // });
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

  private _generateLayout(
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
          gateInfo.repTimes
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

    return data;
  }
}
