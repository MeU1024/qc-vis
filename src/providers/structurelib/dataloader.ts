import * as vscode from 'vscode';
import * as qv from '../../quantivine';
import {SemanticTree} from './layout';
import {ComponentGate, Qubit} from './qcmodel';

export class DataLoader {
  private _qubits: Qubit[] = [];
  private _quantumGates: ComponentGate[] = [];

  constructor(private algorithmName: string) {
    const compilationDataFile = vscode.Uri.joinPath(
      qv.getExtensionUri(),
      `/resources/data/${algorithmName}-json-data.json`
    );
    const structureDataFile = vscode.Uri.joinPath(
      qv.getExtensionUri(),
      `/resources/data/${algorithmName}-structure.json`
    );

    this._loadCompilationData(compilationDataFile);
    this._loadStructureData(structureDataFile);
  }

  private _loadCompilationData(dataSource: vscode.Uri) {
    let data = require(dataSource.fsPath);

    this._qubits = [];
    this._quantumGates = [];

    data.qubits.forEach((qubitName: string) => {
      this._qubits.push(new Qubit(qubitName, this._qubits.length));
    });

    data.layers.forEach((layer: any) => {
      layer.forEach((gate: any) => {
        const qubits = gate[1].map((bit: number) => {
          return this._qubits[bit];
        });
        const gateName = gate[0];
        const range = gate[2];
        const treeIndex = gate[3];
        const repTimes = gate[4];
        const componentGate = new ComponentGate(
          gateName,
          qubits,
          range,
          treeIndex,
          repTimes
        );
        this._quantumGates.push(componentGate);
      });
    });
  }

  private _loadStructureData(dataSource: vscode.Uri) {
    let data = require(dataSource.fsPath);
  }

  get quantumGates(): ComponentGate[] {
    return this._quantumGates;
  }

  get compiledTree(): SemanticTree {
    throw new Error('Method not implemented.');
  }
}
