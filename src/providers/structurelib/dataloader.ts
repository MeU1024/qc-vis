import * as vscode from 'vscode';
import {SemanticTree} from './layout';
import {ComponentGate, Qubit} from './qcmodel';
import {NodeType, QuantumTreeNode} from './quantumgate';

export class DataLoader {
  structureData: any;
  gateData: any;
  semanticData: any;
  private _qubits: Qubit[] = [];
  private _quantumGates: ComponentGate[] = [];
  private _structure: QuantumTreeNode[] = [];
  private _structureDataFile: vscode.Uri | undefined;
  private _gatesDataFile: vscode.Uri | undefined;
  private _semanticsDataFile: vscode.Uri | undefined;

  get structureDataFile(): vscode.Uri | undefined {
    return this._structureDataFile;
  }

  get gatesDataFile(): vscode.Uri | undefined {
    return this._gatesDataFile;
  }

  get semanticsDataFile(): vscode.Uri | undefined {
    return this._semanticsDataFile;
  }

  get qubitNum() {
    return this._qubits.length;
  }

  get structure() {
    return this._structure;
  }

  load(dataDir: vscode.Uri, codeName: string) {
    this._structureDataFile = vscode.Uri.joinPath(
      dataDir,
      `${codeName}_structure.json`
    );
    this._gatesDataFile = vscode.Uri.joinPath(
      dataDir,
      `${codeName}_gates.json`
    );
    this._semanticsDataFile = vscode.Uri.joinPath(
      dataDir,
      `${codeName}_semantics.json`
    );

    this.structureData = requireUncached(this._structureDataFile.fsPath);
    this.gateData = requireUncached(this._gatesDataFile.fsPath);
    this.semanticData = requireUncached(this._semanticsDataFile.fsPath);

    this._loadCompilationData();
    this._loadStructureData();
  }

  /**
   * Load layers, qubits, semantics.
   */
  private _loadCompilationData() {
    if (this._gatesDataFile === undefined) {
      throw new Error('Dataload Error: File not found');
    }
    let gateData = this.gateData;

    this._qubits = [];
    this._quantumGates = [];

    for (let i = 0; i < gateData.qubit; ++i) {
      this._qubits.push(new Qubit('' + i, this._qubits.length));
    }

    gateData.gates.forEach((gate: any) => {
      const qubits = Array.isArray(gate[1])
        ? gate[1].map((bit: number) => {
            return this._qubits[bit];
          })
        : [this._qubits[gate[1]]];
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
  }
  /**
   *
   *
   */
  private _loadStructureData() {
    if (this._structureDataFile === undefined) {
      throw new Error('Dataload Error: File not found');
    }

    let data = this.structureData;

    let gates: QuantumTreeNode[] = [];
    let gateList: QuantumTreeNode[] = [];

    data.forEach((node: any) => {
      if (node.index === 0) {
        gates.push(
          new QuantumTreeNode(
            NodeType.superGate,
            node.name,
            vscode.TreeItemCollapsibleState.Expanded,
            0,
            0
          )
        );
        gateList.push(gates[0]);
      } else {
        let parent = gateList[node.parentIndex];
        let nodeName = node.name;
        let nodeType =
          node.type === 'fun'
            ? NodeType.superGate
            : node.type === 'rep'
            ? NodeType.repetition
            : NodeType.basicGate;
        let description = undefined;
        let collapsibleState = vscode.TreeItemCollapsibleState.None;

        if (nodeType === NodeType.superGate) {
          nodeName = nodeName.slice(1, nodeName.length);
          collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else if (nodeType === NodeType.repetition) {
          // Set the second character of the name to uppercase
          nodeName =
            nodeName.charAt(0) +
            nodeName.charAt(1).toUpperCase() +
            nodeName.slice(2);
          description = '';
          collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        } else {
          // Set the first character of the name to uppercase
          nodeName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
        }
        // strip '_'
        nodeName = nodeName.replace(/_/g, '');
        let newGate = new QuantumTreeNode(
          nodeType,
          nodeName,
          collapsibleState,
          parent.depth + 1,
          node.index,
          description
        );

        newGate.parent = parent;
        parent.children.push(newGate);
        gateList.push(newGate);
      }
    });

    this._structure = gates;
  }

  get quantumGates(): ComponentGate[] {
    return this._quantumGates;
  }

  get compiledTree(): SemanticTree {
    throw new Error('Method not implemented.');
  }

  get qubits(): Qubit[] {
    return this._qubits;
  }
}

function requireUncached(module: string) {
  delete require.cache[require.resolve(module)];
  return require(module);
}
