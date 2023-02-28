import * as vscode from 'vscode';
import {getLogger} from '../../components/logger';
import * as qv from '../../quantivine';
import {QuantumTreeNode, NodeType} from './quantumgate';

const logger = getLogger('DataProvider', 'QC Model');

export class QcStructure {
  private static qcComponentIdentifiers: {
    comps: string[];
  } = {comps: []};

  private static readonly qcGateDepths: {[id: string]: number} = {};

  /**
   * This function parses the AST tree of a quantum circuit code to build its
   * structure. This is a two-step process. In the first step, all AST nodes
   * are traversed and filtered to build an array of sections that will appear
   * in the vscode view, but without any hierarchy. Then in the second step,
   * the hierarchy is constructed based on the config `view.outline.sections`.
   *
   * @param file The base file to start building the structure. If left
   * `undefined`, the current `rootFile` is used, i.e., build the structure
   * for the whole document/project.
   * @param dirty Whether disk or dirty content should be used. Default is
   * `false`. When `subFile` is `true`, `dirty` should always be `false`.
   * @returns An array of {@link QuantumTreeNode} to be shown in vscode view.
   */
  static async buildQcModel(file?: vscode.Uri): Promise<QuantumTreeNode[]> {
    file = file ? file : qv.manager.sourceFile;

    if (!file) {
      return [];
    }

    QcStructure.refreshQcModelConfig();

    const structure = await QcStructure.buildQcStructureFromFile(file);

    return structure;
  }

  private static async buildQcStructureFromFile(
    file: vscode.Uri
  ): Promise<QuantumTreeNode[]> {
    let content = vscode.window.activeTextEditor?.document.getText();

    if (content === undefined) {
      return [];
    }

    // TODO: ast parser
    let ast: any;

    let gates: QuantumTreeNode[] = [];
    gates = loadTreeFromFile();

    return gates;
  }

  protected static normalizeDepths(flatNodes: QuantumTreeNode[]) {
    let lowest = 65535;
    flatNodes
      .filter((node) => node.depth > -1)
      .forEach((section) => {
        lowest = lowest < section.depth ? lowest : section.depth;
      });
    flatNodes
      .filter((node) => node.depth > -1)
      .forEach((section) => {
        section.depth -= lowest;
      });
  }

  protected static refreshQcModelConfig() {
    const configuration = vscode.workspace.getConfiguration('quantivine');
    const hierarchy = configuration.get(
      'view.outline.components.identifiers'
    ) as string[];
    hierarchy.forEach((ids, index) => {
      ids.split('|').forEach((id) => {
        QcStructure.qcGateDepths[id] = index;
      });
    });

    QcStructure.qcComponentIdentifiers = {
      comps: hierarchy.map((ids) => ids.split('|')).flat(),
    };
  }
}

function loadTreeFromFile(file?: vscode.Uri): QuantumTreeNode[] {
  if (!file) {
    let path = vscode.Uri.joinPath(qv.getExtensionUri(), '/resources/data/vqc-structure.json').fsPath;
    file = vscode.Uri.file(path);
  }
  logger.log('Loading tree from file: ' + file.fsPath + '...');

  let data = require(file.fsPath);

  let gates: QuantumTreeNode[] = [];
  let gateList: QuantumTreeNode[] = [];

  data.forEach((node: any) => {
    if (node.index === 0) {
      gates.push(new QuantumTreeNode(
        NodeType.superGate,
        node.name,
        vscode.TreeItemCollapsibleState.Expanded,
        0,
        0,
      ));
      gateList.push(gates[0]);
    } else {
      let parent = gateList[node.parentIndex];
      let nodeName = node.name;
      let nodeType = node.type === "fun" ? NodeType.superGate : node.type === "rep" ? NodeType.repetition : NodeType.basicGate;
      let description = undefined;

      if (nodeType === NodeType.superGate) {
        nodeName = nodeName.slice(1, nodeName.length);
      }

      if (nodeType === NodeType.repetition) {
        description = "×" + " ? times";
      }

      let newGate = new QuantumTreeNode(
        nodeType,
        nodeName,
        vscode.TreeItemCollapsibleState.Expanded,
        parent.depth + 1,
        node.index,
        description
      );

      newGate.parent = parent;
      parent.children.push(newGate);
      gateList.push(newGate);
    }
  });

  return gates;
}

function testTree() {
  let gates: QuantumTreeNode[] = [];
  let index = 0;

  gates.push(
    new QuantumTreeNode(
      NodeType.superGate,
      'QuantumCircuit01',
      vscode.TreeItemCollapsibleState.Expanded,
      0,
      index++
    )
  );

  const firstLevelGates = ['h', 'PA', 'Ent'];

  firstLevelGates.forEach((label) => {
    const gateType = label.endsWith('Gate')
      ? NodeType.basicGate
      : NodeType.superGate;
    let newGate = new QuantumTreeNode(
      gateType,
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      1,
      index++
    );
    newGate.parent = gates[0];
    gates[0].children.push(newGate);
  });

  const secondLevelGates = ['H-Gate', 'G41', 'G42'];

  secondLevelGates.forEach((label) => {
    const parentGate = gates[0].children[1];
    const gateType = label.endsWith('Gate')
      ? NodeType.basicGate
      : NodeType.superGate;
    let newGate = new QuantumTreeNode(
      gateType,
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      2,
      index++
    );
    newGate.parent = parentGate;
    parentGate.children.push(newGate);
  });

  return gates;
}


export class Layer {
  private _gates: ComponentGate[];

  constructor(gates?: ComponentGate[]) {
    this._gates = gates ? gates : [];
  }

  get gates() {
    return this._gates;
  }

  set gates(gates: ComponentGate[]) {
    this._gates = gates;
  }
}

export class Gate {
  constructor(
    readonly gateType: string,
    readonly qubits: Qubit[],
    readonly index: number
  ) {}
}

export class ComponentGate {
  constructor(
    readonly gateName: string,
    readonly qubits: Qubit[],
    readonly range: number[],
    readonly treeIndex: number
  ) {}
}

export class Qubit {
  constructor(readonly qubitName: string, readonly qubitIndex: number) {}
}

export class ComponentCircuit {
  private _qubits: Qubit[];
  private _gates: ComponentGate[];
  private _layers: Layer[];

  constructor(jsonData: any) {
    this._qubits = [];
    jsonData.qubits.forEach((qubitName: string) => {
      this._qubits.push(new Qubit(qubitName, this._qubits.length));
    });

    this._gates = [];
    this._layers = [];

    jsonData.layers.forEach((layer: any) => {
      this._layers.push(new Layer([]));
      layer.forEach((gateInfo: any) => {
        let gateName = gateInfo[0];
        let qubits: Qubit[] = [];
        gateInfo[1].forEach((qubitIndex: number) => {
          qubits.push(this._qubits[qubitIndex]);
        });
        let range = gateInfo[2];
        let treeIndex = gateInfo[3];

        let gate = new ComponentGate(gateName, qubits, range, treeIndex);
        this._gates.push(gate);
        this._layers[this._layers.length - 1].gates.push(gate);
      });
    });
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
}
