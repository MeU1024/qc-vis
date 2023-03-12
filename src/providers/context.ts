import * as vscode from "vscode";
import * as qv from "../quantivine";

import { getLogger } from "../components/logger";
import { ComponentCircuit } from "./component";
import { QCViewerManagerService } from "../components/viewerlib/qcviewermanager";
import { QuantumTreeNode } from "./structurelib/quantumgate";
import { GateNodeProvider } from "./structure";
import { ComponentGate, Qubit } from "./structurelib/qcmodel";
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
  private _treeStructure: {
    name: string;
    parentIndex: number;
    index: number;
    type: string;
  }[];

  constructor(_dataFile: vscode.Uri) {
    this._compnentCircuit = new ComponentCircuit(_dataFile);
    this._contextTree = qv.semanticTreeViewer.data;
    this._gateHighlight = new Map();
    this._connectivityComponentIndex = 3;
    this._originalQubits = [];
    this._originalGates = [];
    this._connectivityMatrix = [];
    this._treeStructure = this._importStructureFromFile();
    this._updateConnectivity();
    this._updateQubit();
  }

  setFocusNode(gate: ComponentGate | undefined) {
    this._focusGate = gate;
    this._updateDependency();
    this._updateParallisim();
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

  private _updateParallisim() {}
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
    logger.log("qubits update");
    const layers = this._compnentCircuit.exportJson().all_gates;
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
    return {
      ...this._compnentCircuit.exportJson(),
      highlights: highlights,
      matrix: this._connectivityMatrix,
      // qubits:this.
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
