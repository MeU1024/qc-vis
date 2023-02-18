import * as vscode from 'vscode';

function getMoveCommands(tabEditorGroup: string) {
  if (tabEditorGroup === 'left') {
    return {
      moveAction: 'workbench.action.moveEditorToLeftGroup',
      focusAction: 'workbench.action.focusRightGroup',
    };
  }
  if (tabEditorGroup === 'right') {
    return {
      moveAction: 'workbench.action.moveEditorToRightGroup',
      focusAction: 'workbench.action.focusLeftGroup',
    };
  }
  if (tabEditorGroup === 'above') {
    return {
      moveAction: 'workbench.action.moveEditorToAboveGroup',
      focusAction: 'workbench.action.focusBelowGroup',
    };
  }
  if (tabEditorGroup === 'below') {
    return {
      moveAction: 'workbench.action.moveEditorToBelowGroup',
      focusAction: 'workbench.action.focusAboveGroup',
    };
  }
  return;
}

export async function moveActiveEditor(
  tabEditorGroup: string,
  preserveFocus: boolean
) {
  const actions = getMoveCommands(tabEditorGroup);
  if (!actions) {
    return;
  }
  await vscode.commands.executeCommand(actions.moveAction);
  if (preserveFocus) {
    await vscode.commands.executeCommand(actions.focusAction);
  }
}
