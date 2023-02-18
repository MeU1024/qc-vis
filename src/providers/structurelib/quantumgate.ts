import * as vscode from 'vscode';

export enum GateType {
  superGate = 0,
  basicGate = 1,
}

export class QuantumGate extends vscode.TreeItem {
  public children: QuantumGate[] = [];
  public parent: QuantumGate | undefined = undefined; // The parent of a top level section must be undefined

  constructor(
    public readonly type: GateType,
    public label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public depth: number,
    public readonly lineNumber: number,
    public toLine: number,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }
}
