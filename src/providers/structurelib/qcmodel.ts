import * as vscode from "vscode";
import { getLogger } from "../../components/logger";
import * as qv from "../../quantivine";
import { QuantumTreeNode, NodeType } from "./quantumgate";

const logger = getLogger("DataProvider", "QC Model");

export class QcStructure {
  private static qcComponentIdentifiers: {
    comps: string[];
  } = { comps: [] };

  private static readonly qcGateDepths: { [id: string]: number } = {};

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
    const configuration = vscode.workspace.getConfiguration("quantivine");
    const hierarchy = configuration.get(
      "view.outline.components.identifiers"
    ) as string[];
    hierarchy.forEach((ids, index) => {
      ids.split("|").forEach((id) => {
        QcStructure.qcGateDepths[id] = index;
      });
    });

    QcStructure.qcComponentIdentifiers = {
      comps: hierarchy.map((ids) => ids.split("|")).flat(),
    };
  }
}

function loadTreeFromFile(file?: vscode.Uri): QuantumTreeNode[] {
  if (!file) {
    let path = vscode.Uri.joinPath(
      qv.getExtensionUri(),
      "/resources/data/vqc-structure.json"
    ).fsPath;
    file = vscode.Uri.file(path);
  }
  logger.log("Loading tree from file: " + file.fsPath + "...");

  let data = require(file.fsPath);

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
        node.type === "fun"
          ? NodeType.superGate
          : node.type === "rep"
          ? NodeType.repetition
          : NodeType.basicGate;
      let description = undefined;
      let collapsibleState = vscode.TreeItemCollapsibleState.None;

      if (nodeType === NodeType.superGate) {
        nodeName = nodeName.slice(1, nodeName.length);
        collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      }

      if (nodeType === NodeType.repetition) {
        description = "×" + " ? times";
        collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      }

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

  return gates;
}

function testTree() {
  let gates: QuantumTreeNode[] = [];
  let index = 0;

  gates.push(
    new QuantumTreeNode(
      NodeType.superGate,
      "QuantumCircuit01",
      vscode.TreeItemCollapsibleState.Expanded,
      0,
      index++
    )
  );

  const firstLevelGates = ["h", "PA", "Ent"];

  firstLevelGates.forEach((label) => {
    const gateType = label.endsWith("Gate")
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

  const secondLevelGates = ["H-Gate", "G41", "G42"];

  secondLevelGates.forEach((label) => {
    const parentGate = gates[0].children[1];
    const gateType = label.endsWith("Gate")
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

// export class TaggedLayer {
//   constructor(readonly gates: ComponentGate[]) {}
// }
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
  constructor(readonly qubitName: string, readonly qubitIndex?: number) {}
}

export class SuperQubit extends Qubit {
  constructor(qubitName: string, readonly qubits: Qubit[]) {
    super(qubitName);
  }
}

export class DrawableCircuit {
  private _width: number;
  private _height: number;
  private _opMap: Map<string, number>;
  private _qubits: Qubit[];
  private _layers: Layer[];
  private _qubitMap: Map<Qubit, number>;

  constructor() {
    this._width = 0;
    this._height = 0;
    this._opMap = new Map<string, number>();
    this._qubits = [];
    this._layers = [];
    this._qubitMap = new Map<Qubit, number>();
  }

  loadFromLayers(
    layers: Layer[],
    qubits: Qubit[],
    qubitMap: Map<Qubit, number>
  ) {
    this._layers = layers;
    this._qubits = qubits;
    this._width = layers.length;
    this._height = qubits.length;
    this._qubitMap = qubitMap;

    // build opMap
    this._opMap.set("...", 0);
    let opCount = 1;
    layers.forEach((layer) => {
      layer.gates.forEach((gate) => {
        let opName = gate.gateName;
        if (!this._opMap.has(opName)) {
          this._opMap.set(opName, opCount++);
        }
      });
    });
  }

  exportJson(): any {
    // TODO: rename
    return {
      output_size: this.size,
      op_map: this.opMap,
      qubits: this.qubitNames,
      all_gates: this.layerInfo,
      gate_format: "",
    };
  }

  get size() {
    return [this._height, this._width];
  }

  get opMap() {
    let ret: any = {};
    this._opMap.forEach((value, key) => {
      ret[key] = value;
    });
    return ret;
  }

  get qubitNames() {
    return this._qubits.map((qubit) => {
      return qubit.qubitName;
    });
  }

  get layerInfo() {
    let ret: any[] = [];
    this._layers.forEach((layer, layerIndex) => {
      let layerInfo: any[] = [];
      layer.gates.forEach((gate) => {
        let gateInfo: any[] = [];
        const opNameIndex = this._opMap.get(gate.gateName);
        const qubitsIndex = gate.qubits.map((qubit) =>
          this._qubitMap.get(qubit)
        );
        gateInfo.push(opNameIndex);
        gateInfo.push([layerIndex]);
        gateInfo.push(qubitsIndex);
        layerInfo.push(gateInfo);
      });
      ret.push(...layerInfo);
    });
    return ret;
  }
}
