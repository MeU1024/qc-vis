import * as vscode from "vscode";
import * as qv from "../../quantivine";
import { SemanticTree } from "./layout";
import { ComponentGate, Qubit } from "./qcmodel";
import { getExtensionUri } from "../../quantivine";

export class DataLoader {
  private _qubits: Qubit[] = [];
  private _quantumGates: ComponentGate[] = [];
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


  constructor(private algorithmName: string) {
    const tmpDir = qv.manager.tmpDir ? vscode.Uri.parse(qv.manager.tmpDir) : undefined;
    //TODO: fix file
    // this._structureDataFile = (tmpDir && qv.manager.algorithm) ? vscode.Uri.joinPath(tmpDir, `${qv.manager.algorithm}_structure.json`) : undefined;
    this._structureDataFile = vscode.Uri.joinPath(
      getExtensionUri(),
      `/resources/data/${qv.manager.algorithm}_structure.json`
    );
    // this._gatesDataFile = (tmpDir && qv.manager.algorithm) ? vscode.Uri.joinPath(tmpDir, `${qv.manager.algorithm}_gates.json`) : undefined;
    this._gatesDataFile = vscode.Uri.joinPath(
      getExtensionUri(),
      `/resources/data/${qv.manager.algorithm}_gates.json`
    );
    // this._semanticsDataFile = (tmpDir && qv.manager.algorithm) ? vscode.Uri.joinPath(tmpDir, `${qv.manager.algorithm}_semantics.json`) : undefined;
    this._semanticsDataFile = vscode.Uri.joinPath(
      getExtensionUri(),
      `/resources/data/${qv.manager.algorithm}_semantics.json`
    );

    if (this._structureDataFile == undefined || this._gatesDataFile == undefined || this._semanticsDataFile == undefined) {
      throw new Error('Dataload Error: File not found');
    }
    // const compilationDataFile = vscode.Uri.joinPath(
    //   qv.getExtensionUri(),
    //   `/resources/data/${algorithmName}-json-data.json`
    // );
    // const structureDataFile = vscode.Uri.joinPath(
    //   qv.getExtensionUri(),
    //   `/resources/data/${algorithmName}-structure.json`
    // );

    //TODO: readfromFile
    this._loadCompilationData(); //json-data //layers , qubits, semantics
    this._loadStructureData(this._structureDataFile);
  }

  // private _loadCompilationData(dataSource: vscode.Uri) {
  private _loadCompilationData() {
    // let data = require(dataSource.fsPath);
    if (this._gatesDataFile == undefined) {
      throw new Error('Dataload Error: File not found');
    }
    let gateData = require(this._gatesDataFile?.fsPath);

    this._qubits = [];
    this._quantumGates = [];

    // data.qubits.forEach((qubitName: string) => {
    //   this._qubits.push(new Qubit(qubitName, this._qubits.length));
    // });

    for (let i = 0; i < gateData.qubit; ++i) {
      this._qubits.push(new Qubit("" + i, this._qubits.length));
    }

    // data.layers.forEach((layer: any) => {
    //   layer.forEach((gate: any) => {
    //     const qubits = gate[1].map((bit: number) => {
    //       return this._qubits[bit];
    //     });
    //     const gateName = gate[0];
    //     const range = gate[2];
    //     const treeIndex = gate[3];
    //     const repTimes = gate[4];
    //     const componentGate = new ComponentGate(
    //       gateName,
    //       qubits,
    //       range,
    //       treeIndex,
    //       repTimes
    //     );
    //     this._quantumGates.push(componentGate);
    //   });
    // });

    gateData.gates.forEach((gate: any) => {
      const qubits = Array.isArray(gate[1]) ? gate[1].map((bit: number) => {
        return this._qubits[bit];
      }) : [this._qubits[gate[1]]];
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

    console.log("dataloader constructor ok");

  }

  private _loadStructureData(dataSource: vscode.Uri) {
    let data = require(dataSource.fsPath);
  }

  get quantumGates(): ComponentGate[] {
    return this._quantumGates;
  }

  get compiledTree(): SemanticTree {
    throw new Error("Method not implemented.");
  }

  get qubits(): Qubit[] {
    return this._qubits;
  }
}
