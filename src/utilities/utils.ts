import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Return a function replacing placeholders of LaTeX recipes.
 *
 * @param rootFile The path of the root file.
 * @param tmpDir The path of a temporary directory.
 * @returns A function replacing placeholders.
 */
export function replaceArgumentPlaceholders(
  rootFile: string,
  tmpDir: string | undefined
): (arg: string) => string {
  return (arg: string) => {
    if (!tmpDir) {
      return '';
    }
    const configuration = vscode.workspace.getConfiguration(
      'quantivine',
      vscode.Uri.file(rootFile)
    );
    const docker = configuration.get('docker.enabled');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceDir =
      workspaceFolder?.uri.fsPath.split(path.sep).join('/') || '';
    const rootFileParsed = path.parse(rootFile);
    const docfile = rootFileParsed.name;
    const docfileExt = rootFileParsed.base;
    const dirW32 = path.normalize(rootFileParsed.dir);
    const dir = dirW32.split(path.sep).join('/');
    const docW32 = path.join(dirW32, docfile);
    const doc = docW32.split(path.sep).join('/');
    const docExtW32 = path.join(dirW32, docfileExt);
    const docExt = docExtW32.split(path.sep).join('/');
    const relativeDir = path
      .relative(workspaceDir, dir)
      .split(path.sep)
      .join('/');
    const relativeDoc = path
      .relative(workspaceDir, doc)
      .split(path.sep)
      .join('/');

    const expandPlaceHolders = (a: string): string => {
      return a
        .replace(/%DOC%/g, docker ? docfile : doc)
        .replace(/%DOC_W32%/g, docker ? docfile : docW32)
        .replace(/%DOC_EXT%/g, docker ? docfileExt : docExt)
        .replace(/%DOC_EXT_W32%/g, docker ? docfileExt : docExtW32)
        .replace(/%DOCFILE_EXT%/g, docfileExt)
        .replace(/%DOCFILE%/g, docfile)
        .replace(/%DIR%/g, docker ? './' : dir)
        .replace(/%DIR_W32%/g, docker ? './' : dirW32)
        .replace(/%TMPDIR%/g, tmpDir)
        .replace(/%WORKSPACE_FOLDER%/g, docker ? './' : workspaceDir)
        .replace(/%RELATIVE_DIR%/, docker ? './' : relativeDir)
        .replace(/%RELATIVE_DOC%/, docker ? docfile : relativeDoc);
    };
    const outDirW32 = path.normalize(
      expandPlaceHolders(configuration.get('python.outDir') as string)
    );
    const outDir = outDirW32.split(path.sep).join('/');
    return expandPlaceHolders(arg)
      .replace(/%OUTDIR%/g, outDir)
      .replace(/%OUTDIR_W32%/g, outDirW32);
  };
}
