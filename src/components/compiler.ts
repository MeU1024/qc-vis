import * as vscode from 'vscode';
import * as path from 'path';
import * as qv from '../quantivine';
import {spawn} from 'child_process';
import {createDeferred} from '../utilities/async';
import {CodeBuilt} from './eventBus';

export class Compiler {
  /**
   * This function will build the code file and return the directory of the output files
   * @param codeFile - The code file to be built
   * @param tmpDir - The temporary directory to store the output files
   * @param target - The target variable name in the code file, representing the quantum circuit
   * @returns
   */
  build(codeFile: vscode.Uri, tmpDir: vscode.Uri, target?: string) {
    const codePath = codeFile.fsPath;

    // get python interpreter
    let pythonInterpreter = undefined;
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (pythonExtension) {
      const pythonExtensionApi = pythonExtension.exports;
      const workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0]
        : undefined;
      if (workspaceFolder) {
        pythonInterpreter = pythonExtensionApi.settings.getExecutionDetails(
          workspaceFolder.uri
        ).execCommand[0];
      } else {
        throw new Error('Workspace python interpreter not found.');
      }
    }

    const extensionRoot = qv.getExtensionUri().fsPath;
    const pythonScriptPath = path.join(extensionRoot, 'scripts/parse.py');

    const configuration = vscode.workspace.getConfiguration(
      'quantivine',
      vscode.Uri.file(codePath)
    );

    if (target === undefined) {
      target = configuration.get('python.qctarget') as string;
    }

    const algName = path.basename(codePath, path.extname(codePath));
    const tmpPath = vscode.Uri.joinPath(tmpDir, algName).fsPath;

    this.callPython(
      pythonInterpreter,
      pythonScriptPath,
      codePath,
      target,
      tmpPath
    );
  }

  /**
   * This function will call the python script to build the code file, and store the output files in the output directory
   * @param envPath - The path of the python interpreter
   * @param scriptPath - The path of the python script
   * @param codeSource - The path of the code file
   * @param target - The target variable name in the code file, representing the quantum circuit
   * @param outputDir - The directory to store the output files
   * @returns
   */
  callPython(
    envPath: string,
    scriptPath: string,
    codeSource: string,
    target: string,
    outputDir: string
  ) {
    const callingDeferred = createDeferred<void>();
    displayProgress(callingDeferred.promise);

    const pythonProcess = spawn(envPath, [
      scriptPath,
      codeSource,
      target,
      outputDir,
    ]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Received data from Python:\n ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error or warning from Python:\n ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      qv.eventBus.fire(CodeBuilt);
      callingDeferred.resolve();
    });
  }
}

function displayProgress(promise: Promise<any>) {
  const progressOptions: vscode.ProgressOptions = {
    location: vscode.ProgressLocation.Window,
    title: 'Building quantum circuit ...',
  };
  vscode.window.withProgress(progressOptions, () => promise);
}
