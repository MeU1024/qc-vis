import * as vscode from "vscode";
import { getLogger } from "../../components/logger";
import * as qv from "../../quantivine";
import { QuantumGate, GateType } from "./quantumgate";

const logger = getLogger("Structure", "Circuit");

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
   * @returns An array of {@link QuantumGate} to be shown in vscode view.
   */
  static async buildQcModel(file?: vscode.Uri): Promise<QuantumGate[]> {
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
  ): Promise<QuantumGate[]> {
    let content = vscode.window.activeTextEditor?.document.getText();

    if (content === undefined) {
      return [];
    }

    // TODO: ast parser
    let ast: any;

    let gates: QuantumGate[] = [];
    gates = testTree();

    return gates;
  }

  protected static normalizeDepths(flatNodes: QuantumGate[]) {
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

function testTree() {
  let gates: QuantumGate[] = [];

  gates.push(
    new QuantumGate(
      GateType.superGate,
      "QuantumCircuit01",
      vscode.TreeItemCollapsibleState.Expanded,
      0,
      1,
      10
    )
  );

  const firstLevelGates = ["h", "PA", "Ent"];

  firstLevelGates.forEach((label) => {
    const gateType = label.endsWith("Gate")
      ? GateType.basicGate
      : GateType.superGate;
    let newGate = new QuantumGate(
      gateType,
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      1,
      1,
      10
    );
    newGate.parent = gates[0];
    gates[0].children.push(newGate);
  });

  const secondLevelGates = ["H-Gate", "G41", "G42"];

  secondLevelGates.forEach((label) => {
    const parentGate = gates[0].children[1];
    const gateType = label.endsWith("Gate")
      ? GateType.basicGate
      : GateType.superGate;
    let newGate = new QuantumGate(
      gateType,
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      2,
      1,
      10
    );
    newGate.parent = parentGate;
    parentGate.children.push(newGate);
  });

  return gates;
}
