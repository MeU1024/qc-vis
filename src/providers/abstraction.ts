import * as vscode from 'vscode';

import {getLogger} from '../components/logger';
import {
  Abstraction,
  AbstractionRule,
  Semantics,
} from './abstractionlib/abstractionrule';
import {
  ComponentCircuit,
  ComponentGate,
  DrawableCircuit,
  Layer,
  Qubit,
} from './structurelib/qcmodel';

import * as qv from '../quantivine';
import {QCViewerManagerService} from '../components/viewerlib/qcviewermanager';

const logger = getLogger('DataProvider', 'Abstraction');

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

    // let message = {
    //   command: 'setAbstractedCircuit',
    //   data: this._data.exportJson(),
    // };

    let message = {
      command: 'setTitle',
      data: {title: 'Abstraction View'},
    };

    let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

    panelSet?.forEach((panel) => {
      panel.postMessage(message);
      logger.log(`Sent Message: ${panel.dataFileUri}`);
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
  private _cached: boolean;
  private _drawableCircuit: DrawableCircuit;
  // private _visibilityMatrix: boolean[][]; // Matrix of gate visibility

  constructor(dataFile: vscode.Uri) {
    this._componentCircuit = this._importCircuitFromFile(dataFile);
    this._semanticsList = this._importSemanticsFromFile(dataFile);

    this._qubits = [];
    this._isIdleQubit = [];
    this._gates = [];
    this._layers = [];
    this._isIdleLayer = [];
    this._abstractions = [];
    this._cachedGates = new Map<ComponentGate, number>();
    this._cached = false;
    this._drawableCircuit = new DrawableCircuit();

    this._build();
  }

  private _importCircuitFromFile(dataFile: vscode.Uri): ComponentCircuit {
    logger.log('Load component data from: ' + dataFile.fsPath);
    let data = require(dataFile.fsPath);
    return new ComponentCircuit(data.circuit);
  }

  private _importSemanticsFromFile(dataFile: vscode.Uri): Semantics[] {
    logger.log('Load semantics data from: ' + dataFile.fsPath);
    let data = require(dataFile.fsPath);
    let semantics = data.semantics.map((sem: any) => {
      let semType = sem.type;
      let semRange = sem.range;
      let treeIndex = sem.treeIndex;
      return new Semantics(semType, semRange, treeIndex);
    });
    return semantics;
  }

  private _build() {
    let width = this._componentCircuit.width;
    let height = this._componentCircuit.height;

    this._qubits = this._componentCircuit.qubits;
    this._isIdleQubit = new Array(this._qubits.length).fill(true);
    this._layers = new Array(width);
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

  private _visGate(gate: ComponentGate) {
    let layerIndex = this._componentCircuit.getGateLayer(gate);
    this._isIdleLayer[layerIndex] = false;

    let firstQubitIndex = this._qubits.indexOf(gate.qubits[0]);
    this._isIdleQubit[firstQubitIndex] = false;
    let lastQubitIndex = this._qubits.indexOf(
      gate.qubits[gate.qubits.length - 1]
    );
    this._isIdleQubit[lastQubitIndex] = false;

    // TODO: Implement for multi-qubit gates
  }

  private _cacheGates(gates: ComponentGate[]) {
    gates.forEach((gate: ComponentGate) => {
      let layerIndex = this._componentCircuit.getGateLayer(gate);
      this._cachedGates.set(gate, layerIndex);
    });
    this._cached = true;
  }

  private _generateLayout() {
    if (!this._cached) {
      return;
    }

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
          newQubits.push(qubit);
        }
      }
      qubitMap.set(qubit, newQubits.length - 1);
    });

    // Generate new layers
    this._layers.forEach((layer: Layer, index: number) => {
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

    this._drawableCircuit.loadFromLayers(newLayers, newQubits, qubitMap);

    this._cached = false;
  }

  private _isVisibleGate(gate: ComponentGate): boolean {
    let layerIndex = this._componentCircuit.getGateLayer(gate);
    if (this._isIdleLayer[layerIndex]) {
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

    // TODO: Implement for multi-qubit gates

    return true;
  }

  private _writtenInSemantics(cGate: ComponentGate): Abstraction | undefined {
    let ret: Abstraction | undefined = undefined;
    let cgRange = cGate.range;

    this._semanticsList.forEach((sem: Semantics) => {
      // if the component gate is contained in the semantics
      if (
        cgRange[0] >= sem.range[0] &&
        cgRange[1] <= sem.range[1] &&
        cgRange[1] - cgRange[0] + 1 <= sem.range[2]
      ) {
        let subCircuit = this._componentCircuit.slice(sem.range);
        ret = AbstractionRule.apply(subCircuit, sem);
      }
    });

    return ret;
  }

  exportJson(): any {
    return {msg: 'Hello!'};
  }

  get width(): number {
    return this._layers.length;
  }

  get height(): number {
    return this._qubits.length;
  }
}
