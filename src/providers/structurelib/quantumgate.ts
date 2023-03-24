import * as vscode from 'vscode';

export enum NodeType {
  superGate = 0,
  basicGate = 1,
  repetition = 2,
}

export class QuantumTreeNode extends vscode.TreeItem {
  public children: QuantumTreeNode[] = [];
  public parent: QuantumTreeNode | undefined = undefined; // The parent of a top level section must be undefined
  public visible: boolean = true;

  constructor(
    public readonly type: NodeType,
    public label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public depth: number,
    // public readonly lineNumber: number,
    // public toLine: number,
    public treeIndex: number,

    public readonly description?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    // super(label, collapsibleState);
  }
  contextValue = 'component';

  get semanticDepth(): number {
    let d = 0;
    let parent = this.parent;

    while (parent) {
      if (parent.type !== NodeType.repetition) {
        d++;
      }
      parent = parent.parent;
    }

    return d;
  }
}
