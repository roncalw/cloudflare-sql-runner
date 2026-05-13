import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'cloudflareSqlRunner.runSqlFile',
    async (uri: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage('No SQL file selected.');
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);

      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Open a workspace folder first.');
        return;
      }

      const sqlFile = uri.fsPath;

      const d1Database = vscode.workspace
        .getConfiguration('cloudflareSqlRunner')
        .get<string>('d1Database');

      if (!d1Database) {
        vscode.window.showErrorMessage(
          'Missing setting: cloudflareSqlRunner.d1Database'
        );
        return;
      }

      const scriptPath = context.asAbsolutePath(
        'src/scripts/run-sql-remote.sh'
      );

      const task = new vscode.Task(
        { type: 'cloudflareSqlRunner' },
        workspaceFolder,
        `Cloudflare SQL: ${uri.path.split('/').pop()}`,
        'Cloudflare SQL Runner',
        new vscode.ShellExecution(
          `zsh "${scriptPath}" "${workspaceFolder.uri.fsPath}" "${sqlFile}" "${d1Database}"`
        )
      );

      task.presentationOptions = {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Dedicated,
        clear: true,
        echo: false,
        focus: false,
        showReuseMessage: false
      };

      await vscode.tasks.executeTask(task);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}