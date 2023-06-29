import * as vscode from 'vscode';
import * as qv from '../quantivine';

import { getLogger } from '../components/logger';
import { SourceFileChanged } from '../components/eventBus';
import path from 'path';
import { DataLoader } from './structurelib/dataloader';

const logger = getLogger('DataProvider', 'Qubit');

export class QubitTreeNode extends vscode.TreeItem {
  contextValue = 'qubit';
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly treeIndex: number,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }
}

export class QubitNodeProvider
  implements vscode.TreeDataProvider<QubitTreeNode>
{
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    QubitTreeNode | undefined
  > = new vscode.EventEmitter<QubitTreeNode | undefined>();

  readonly onDidChangeTreeData: vscode.Event<QubitTreeNode | undefined>;

  public ds: QubitTreeNode[] = [];

  constructor() {
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  getTreeItem(element: QubitTreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: QubitTreeNode): Thenable<QubitTreeNode[]> {
    return Promise.resolve(this.ds);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public setQubits(): void {
    const qubitNum = qv.manager.dataLoader.qubitNum;
    this.ds = [];
    for (let i = 0; i < qubitNum; i++) {
      this.ds.push(
        new QubitTreeNode(`Qubit ${i}`, vscode.TreeItemCollapsibleState.None, i)
      );
    }
    this.refresh();
  }
}

export class QubitTreeViewer {
  private _treeView: vscode.TreeView<QubitTreeNode>;
  private _nodeProvider: QubitNodeProvider;

  constructor() {
    this._nodeProvider = new QubitNodeProvider();
    this._treeView = vscode.window.createTreeView('quantivine-qubitview', {
      treeDataProvider: this._nodeProvider,
    });
  }

  async initNodeProvider() {
    await this._nodeProvider.setQubits();
  }
}
