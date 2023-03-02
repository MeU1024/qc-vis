import * as vscode from 'vscode';
import * as path from 'path';
import {EventBus} from './components/eventBus';
import {getLogger} from './components/logger';
import {Manager} from './components/manager';
import {Viewer} from './components/viewer';
import {QuantivineFileSystem} from './components/qvfs';
import {SemanticTreeViewer} from './providers/structure';

let disposables: {dispose(): any}[] = [];
let context: vscode.ExtensionContext;

export function registerDisposable(...items: vscode.Disposable[]) {
  if (context) {
    context.subscriptions.push(...disposables, ...items);
    disposables = [];
  } else {
    disposables = [...disposables, ...items];
  }
}

export * as commander from './commander';

export const extensionRoot = path.resolve(`${__dirname}/../../`);
export const eventBus = new EventBus();
export const manager = new Manager();
export const qvfs = new QuantivineFileSystem();
export const viewer = new Viewer();
export const semanticTreeViewer = new SemanticTreeViewer();

const logger = getLogger('Extension');

export function init(extensionContext: vscode.ExtensionContext) {
  context = extensionContext;
  registerDisposable();
  addLogFundamentals();
  logger.initializeStatusBarItem();
  logger.log('Quantivine initialized.');

  const qvDisposable = {
    dispose: () => {
      //   cacher.reset();
      //   server.dispose();
      //   UtensilsParser.dispose();
      //   MathJaxPool.dispose();
    },
  };
  registerDisposable(qvDisposable);
}

export function addLogFundamentals() {
  logger.log('Initializing Quantivine.');
  logger.log(`Extension root: ${getExtensionUri()}`);
  logger.log(`$PATH: ${process.env.PATH}`);
  logger.log(`$SHELL: ${process.env.SHELL}`);
  logger.log(`$LANG: ${process.env.LANG}`);
  logger.log(`$LC_ALL: ${process.env.LC_ALL}`);
  logger.log(`process.platform: ${process.platform}`);
  logger.log(`process.arch: ${process.arch}`);
  logger.log(`vscode.env.appName: ${vscode.env.appName}`);
  logger.log(`vscode.env.remoteName: ${vscode.env.remoteName}`);
  logger.log(`vscode.env.uiKind: ${vscode.env.uiKind}`);
}

export function getExtensionUri() {
  if (context) {
    return context.extensionUri;
  }
  return vscode.Uri.file(extensionRoot);
}

export function getDefaultDataFile() {
  return vscode.Uri.file(
    vscode.Uri.joinPath(
      getExtensionUri(),
      '/resources/data/default-data-source.json'
    ).fsPath
  );
}
