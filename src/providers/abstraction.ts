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
  Layer,
  Qubit,
} from './structurelib/qcmodel';

import * as qv from '../quantivine';

const logger = getLogger('DataProvider', 'Abstraction');

export class AbstractionDataProvider {
  private _data: any;
  private _abstractData: any;

  constructor(data?: any) {
    this._data = data;
  }

  get data() {
    return this._data;
  }

  set data(data: any) {
    this._data = data;
  }

  async updateData() {
    this._data = await this.abstractQcData();
  }

  async abstractQcData() {
    let dataSource = vscode.Uri.file('./temp/abstraction-test.json');

    let abstractCircuit = new AbstractedCircuit();

    return abstractCircuit;
  }
}

class AbstractedCircuit {
  private _componentCircuit: ComponentCircuit;
  private _semanticsList: Semantics[];

  private _qubits: Set<Qubit>;
  private _qubitLineno: Map<Qubit, number>; // Map qubit to line number
  private _gates: ComponentGate[];
  private _layers: Layer[];
  private _abstractions: Abstraction[];
  private _cachedGates: Set<ComponentGate>; // Set of treeIndex of cached gates
  private _cached: boolean;

  constructor(dataSource?: vscode.Uri) {
    this._componentCircuit = this._importCircuitFromFile(dataSource);
    this._semanticsList = this._importSemanticsFromFile(dataSource);

    this._qubits = new Set<Qubit>();
    this._qubitLineno = new Map<Qubit, number>();
    this._gates = [];
    this._layers = [];
    this._abstractions = [];
    this._cachedGates = new Set<ComponentGate>();
    this._cached = false;

    this._build();

    this.justify();
  }

  private _importCircuitFromFile(dataFile?: vscode.Uri): ComponentCircuit {
    if (!dataFile) {
      let path = vscode.Uri.joinPath(qv.getExtensionUri(), '/resources/data/abstraction-test.json').fsPath;
      dataFile = vscode.Uri.file(path);
    }
    logger.log('Load component data from: ' + dataFile.fsPath);
    let data = require(dataFile.fsPath);
    return new ComponentCircuit(data.circuit);
  }

  private _importSemanticsFromFile(dataFile?: vscode.Uri): Semantics[] {
    if (!dataFile) {
      let path = vscode.Uri.joinPath(qv.getExtensionUri(), '/resources/data/abstraction-test.json').fsPath;
      dataFile = vscode.Uri.file(path);
    }
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
    // Build abstracted circuit with semantics
    this._componentCircuit.gates.forEach((gate: ComponentGate) => {
      if (this._cachedGates.has(gate)) {
        return;
      }

      let ret = this._writtenInSemantics(gate);
      if (ret) {
        ret.start.forEach((g) => this._addGate(g));
        ret.end.forEach((g) => this._addGate(g));
        this._abstractions.push(ret);

        // Cache gates in abstraction
        ret.gates.forEach((gate: ComponentGate) => {
          this._cachedGates.add(gate);
        });
      } else {
        this._addGate(gate);
        this._cachedGates.add(gate);
      }
    });

    // Generate Layout
    this._updateLayout();
  }

  private _addGate(gate: ComponentGate, layerIndex?: number) {
    gate.qubits.forEach((qubit: Qubit) => {
      this._qubits.add(qubit);
    });
    this._gates.push(gate);
    if (layerIndex === undefined) {
      layerIndex = this._layers.length;
      this._layers.push(new Layer());
    }
    this._layers[layerIndex].gates.push(gate);

    this._cached = true;
  }

  private _removeIdle() {
    // Remove layers with no gates
    let newLayers: Layer[] = [];

    this._layers.forEach((layer: Layer) => {
      if (layer.gates.length > 0) {
        newLayers.push(layer);
      }
    });

    this._layers = newLayers;
  }

  justify() {
    logger.log('Not implemented justify() yet');
  }

  private _updateLayout() {
    if (!this._cached) {
      return;
    }

    // Remove idle layers
    this._removeIdle();

    // Update line number of qubits sorted by qubit index
    let qubits: Qubit[] = [];
    this._qubits.forEach((qubit: Qubit) => {
      qubits.push(qubit);
    });

    qubits.sort((a: Qubit, b: Qubit) => {
      return a.qubitIndex - b.qubitIndex;
    });

    this._qubitLineno.clear();
    let index = 0;
    qubits.forEach((qubit: Qubit) => {
      this._qubitLineno.set(qubit, index);
      index++;
    });

    this._cached = false;
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
}
