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
    // const qubitNum = this._getQubitNum(sourceFilePath);
    const qubitNum = this._getQubitNum();

    this.ds = [];
    for (let i = 0; i < qubitNum; i++) {
      this.ds.push(
        new QubitTreeNode(`Qubit ${i}`, vscode.TreeItemCollapsibleState.None, i)
      );
    }
    this.refresh();
  }

  // private _getQubitNum(sourceFilePath: string): number {
  private _getQubitNum(): number {
    // const algorithm = path.basename(sourceFilePath, '.py');
    if(qv.manager.algorithm == undefined) {
      throw new Error("algorithm undefined.");
    }
    const algorithm = qv.manager.algorithm;
    const dataloader = new DataLoader(algorithm);
    const gatesDataFile = dataloader.gatesDataFile;
    if (gatesDataFile == undefined) {
      throw new Error("gatesDataFile not found");
    }
    // const dataFile = vscode.Uri.joinPath(
    //   qv.getExtensionUri(),
    //   `/resources/data/${algorithm}-json-data.json`
    // );
    let data = require(gatesDataFile.fsPath);
    if (!data.qubit) {
      throw new Error("Qubit not found");
    }
    return data.qubit;
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

    // qv.registerDisposable(
    //   qv.eventBus.on(SourceFileChanged, (e) => {
    //     this._nodeProvider.setQubits();
    //   })
    // );
  }

  async InitNodeProvider() {
    await this._nodeProvider.setQubits();
  }
}
