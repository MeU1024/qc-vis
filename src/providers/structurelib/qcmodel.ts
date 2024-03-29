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

    const structure = qv.manager.dataLoader.structure;

    return structure;
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
  ) { }
}

export class ComponentGate {
  constructor(
    readonly gateName: string,
    readonly qubits: Qubit[],
    readonly range: number[],
    readonly treeIndex: number,
    readonly repTimes: number[]
  ) { }

  get treePath(): number[] {
    return this.repTimes;
  }

  get depth(): number {
    return this.treePath.length - 1;
  }

  get index(): number {
    return this.treePath[this.depth];
  }
}

export class Qubit {
  constructor(readonly qubitName: string, readonly qubitIndex?: number) { }
  get index(): number {
    return this.qubitIndex ? this.qubitIndex : 0;
  }
}

export class SuperQubit extends Qubit {
  constructor(qubitName: string, readonly qubits: Qubit[]) {
    super(qubitName);
  }
}

export class Region {
  constructor(layer: number[], qubit: number[], name: string) { }
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
        const qubitsIndex = gate.qubits.map((qubit) => {
          return this._qubitMap.get(qubit);
          // const index = this._qubitMap.get(qubit);
          // if (index !== undefined) {
          //   return index;
          // } else {
          //   return -1;
          // }
        });

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
