// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let terminal: vscode.Terminal | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'cloudflareSqlRunner.runSqlFile',
    async (uri: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage('No SQL file selected.');
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;

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

      const scriptPath = context.asAbsolutePath('src/scripts/run-sql-remote.sh');

      if (!terminal) {
        terminal = vscode.window.createTerminal('Cloudflare SQL');
      }

      terminal.show();

      terminal.sendText('clear');

      terminal.sendText(
        `zsh "${scriptPath}" "${workspaceFolder}" "${sqlFile}" "${d1Database}"`
      );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
