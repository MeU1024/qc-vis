import * as vscode from 'vscode';
import {getLogger} from './components/logger';
import {QuantumGate} from './providers/structurelib/quantumgate';
import * as qv from './quantivine';

const logger = getLogger('Extension');

export function activate(context: vscode.ExtensionContext) {
  void vscode.commands.executeCommand('setContext', 'quantivine:enabled', true);

  qv.init(context);

  qv.manager.updateSource();

  registerQuantivineCommands();

  registerProviders();
}

function registerQuantivineCommands() {
  qv.registerDisposable(
    vscode.commands.registerCommand('quantivine.build', () =>
      qv.commander.build()
    ),
    vscode.commands.registerCommand(
      'quantivine.view',
      (mode: 'tab' | vscode.Uri | undefined) => qv.commander.view(mode)
    )
  );
  qv.registerDisposable(
    vscode.commands.registerCommand(
      'quantivine.editEntry',
      (node: QuantumGate) => qv.commander.edit(node)
    )
  );
}

function registerProviders() {
  const configuration = vscode.workspace.getConfiguration('quantivine');
}
