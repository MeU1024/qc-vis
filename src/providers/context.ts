import * as vscode from 'vscode';
import * as qv from '../quantivine';

import {getLogger} from '../components/logger';
import {ComponentCircuit} from './component';
import {QCViewerManagerService} from '../components/viewerlib/qcviewermanager';
import {QuantumTreeNode} from './structurelib/quantumgate';
import {GateNodeProvider} from './structure';
import {ComponentGate} from './structurelib/qcmodel';

const logger = getLogger('DataProvider', 'Context');

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

  async updateData() {
    // TODO: Update Data
    this._postData();
  }

  private async _postData() {
    const contextPath = qv.semanticTreeViewer.focusPath?.reverse().join(' > ');

    let message1 = {
      command: 'context.setTitle',
      data: {title: `Context View: ${contextPath}`},
    };

    let message2 = {
      command: "context.setCircuit",
      data: this._data?.exportJson(),
    };

    let panelSet = QCViewerManagerService.getPanelSet(this._dataFile);

    panelSet?.forEach((panel) => {
      panel.postMessage(message1);
      panel.postMessage(message2);
      // logger.log(`Sent Message: ${panel.dataFileUri}`);
    });
  }
}

class ContextualCircuit {
  private _compnentCircuit: ComponentCircuit;
  private _contextTree: GateNodeProvider;
  private _focusGate: ComponentGate | undefined;
  private _gateHighlight: Map<ComponentGate, number>; // 0: no highlight, 1: highlight, 2: focus

  constructor(_dataFile: vscode.Uri) {
    this._compnentCircuit = new ComponentCircuit(_dataFile);
    this._contextTree = qv.semanticTreeViewer.data;
    this._gateHighlight = new Map();
  }

  setFocusNode(gate: ComponentGate | undefined) {
    this._focusGate = gate;
    this._updateDependency();
    this._updateParallisim();
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
