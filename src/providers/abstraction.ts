import * as vscode from 'vscode';

import {getLogger} from '../components/logger';
import {
  Abstraction,
  AbstractionRule,
  AbstractionType,
  Semantics,
} from './abstractionlib/abstractionrule';
import {
  ComponentGate,
  DrawableCircuit,
  Layer,
  Qubit,
  SuperQubit,
} from './structurelib/qcmodel';

import * as qv from '../quantivine';
import {QCViewerManagerService} from '../components/viewerlib/qcviewermanager';
import {ComponentCircuit} from './component';
import {getExtensionUri} from '../quantivine';

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

    let message1 = {
      command: 'abstraction.setTitle',
      data: {title: 'Abstraction View'},
    };

    let message2 = {
      command: 'abstraction.setCircuit',
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
    let dataSource = vscode.Uri.joinPath(
      getExtensionUri(),
      '/resources/data/qugan-json-data-50.json'
    ).fsPath;
    let data = require(dataSource);
    let semantics = data.semantics.map((sem: any) => {
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

  private _visGate(gate: ComponentGate) {
    let layerIndex = this._componentCircuit.getGateLayer(gate);
    this._isIdleLayer[layerIndex!] = false;

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
      this._cachedGates.set(gate, layerIndex!);
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
          newQubits.push(new SuperQubit('...', [qubit]));
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
    this._drawableCircuit.loadFromLayers(pushedNewLayers, newQubits, qubitMap);
    // this._drawableCircuit.loadFromLayers(newLayers, newQubits, qubitMap);

    this._cached = false;
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

    let isIdelNewQubit = newQubits.map((qubit) => qubit.qubitName === '...');
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
          let endQubitIndex = qubitMap.get(end.qubits[0])!;
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

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < m; ++j) {
        if (!isIdelNewQubit[i] && !isIdelNewLayer[j]) {
          continue;
        }
        let curQubit = newQubits[i];
        if (curQubit instanceof SuperQubit) {
          curQubit = curQubit.qubits[0];
        }

        if (isIdelNewQubit[i] && isIdelNewLayer[j]) {
          const checkIn = checkInAbstraction(i, j, 'diagonal');
          if (checkIn) {
            ret[j].gates.push(new ComponentGate('...', [curQubit], [], 0));
          }
        }
        if (isIdelNewQubit[i]) {
          const checkIn = checkInAbstraction(i, j, 'vertical');
          if (checkIn) {
            ret[j].gates.push(new ComponentGate('...', [curQubit], [], 0));
          }
        } else if (isIdelNewLayer[j]) {
          const checkIn = checkInAbstraction(i, j, 'horizontal');
          if (checkIn) {
            ret[j].gates.push(new ComponentGate('...', [curQubit], [], 0));
          }
        }
      }
    }

    return ret;
  }

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
  exportJson(): any {
    return this._drawableCircuit.exportJson();
  }

  get width(): number {
    return this._layers.length;
  }

  get height(): number {
    return this._qubits.length;
  }
}
