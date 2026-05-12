# VS Code Extension — Right-Click `.sql` File → Run Cloudflare D1 Query

# Goal

Build a private VS Code extension that:

```text
Right-click .sql file
        ↓
Click "Run Cloudflare SQL"
        ↓
Terminal clears
        ↓
Wrangler runs against Cloudflare D1
        ↓
SQL results appear
```

This document only covers:

```text
The extension project itself
```

and how to use the finished extension from normal VS Code afterward.

---

# Final Extension Folder Structure

```text
cloudflare-sql-runner/
├── package.json
├── README.md
├── tsconfig.json
├── node_modules/
└── src/
    ├── extension.ts
    └── scripts/
        └── run-sql-remote.sh
```

<span class="yellow">Important:</span>

The shell script must live here:

```text
src/scripts/run-sql-remote.sh
```

NOT:

```text
scripts/run-sql-remote.sh
```

---

# Step 1 — Install the VS Code Extension Generator

Open Terminal.

Run:

```bash
npm install -g yo generator-code
```

This installs:

| Tool | Purpose |
|---|---|
| `yo` | project generator framework |
| `generator-code` | official VS Code extension template |

---

# Step 2 — Create the Extension Project Folder

Choose where the extension project should live.

Example:

```bash
mkdir -p ~/Projects/cloudflare-sql-runner
```

Go into it:

```bash
cd ~/Projects/cloudflare-sql-runner
```

Verify location:

```bash
pwd
```

Expected example:

```text
/Users/carlo/Projects/cloudflare-sql-runner
```

---

# Step 3 — Generate the Extension Template

Run:

```bash
yo code
```

Answer the prompts exactly like this:

```text
What type of extension?
→ New Extension (TypeScript)

What's the name of your extension?
→ cloudflare-sql-runner

What's the identifier of your extension?
→ press Enter

What's the description?
→ Runs SQL files against Cloudflare D1

Initialize a git repository?
→ n

Bundle source code with webpack?
→ n

Which package manager?
→ npm
```

When done, open the extension project:

```bash
code .
```

---

# Step 4 — Add the Publisher

Open:

```text
package.json
```

Near the top, make sure this exists:

```json
"publisher": "roncalw",
```

Example:

```json
{
  "name": "cloudflare-sql-runner",
  "displayName": "cloudflare-sql-runner",
  "publisher": "roncalw",
  "description": "Runs SQL files against Cloudflare D1",
  "version": "1.0.1"
}
```

<span class="yellow">Important:</span>

Without a publisher, VS Code installs the extension under a bad folder name like:

```text
undefined_publisher.cloudflare-sql-runner-0.0.1
```

With the publisher:

```text
roncalw.cloudflare-sql-runner-1.0.1
```

---

# Step 5 — Configure the Right-Click Menu

Open:

```text
package.json
```

Find:

```json
"contributes": {
```

Replace the entire `contributes` section with this:

```json
"contributes": {
  "commands": [
    {
      "command": "cloudflareSqlRunner.runSqlFile",
      "title": "Run Cloudflare SQL"
    }
  ],
  "menus": {
    "explorer/context": [
      {
        "command": "cloudflareSqlRunner.runSqlFile",
        "when": "resourceExtname == .sql",
        "group": "navigation"
      }
    ]
  },
  "configuration": {
    "title": "Cloudflare SQL Runner",
    "properties": {
      "cloudflareSqlRunner.d1Database": {
        "type": "string",
        "default": "movieapp-db",
        "description": "Cloudflare D1 database name or binding to use with wrangler d1 execute."
      }
    }
  }
}
```

Save the file.

---

# What the `contributes` Section Does

| Section | Purpose |
|---|---|
| `commands` | Creates the command |
| `menus.explorer/context` | Adds right-click Explorer menu |
| `resourceExtname == .sql` | Only show menu for `.sql` files |
| `configuration` | Creates VS Code setting for DB name |

---

# Step 6 — Create the Scripts Folder

From the extension project root:

```bash
cd ~/Projects/cloudflare-sql-runner
```

Create the scripts folder:

```bash
mkdir -p src/scripts
```

Create the shell script:

```bash
touch src/scripts/run-sql-remote.sh
```

Make it executable:

```bash
chmod +x src/scripts/run-sql-remote.sh
```

Open it:

```bash
code src/scripts/run-sql-remote.sh
```

---

# Step 7 — Add the Shell Script

Paste this exact script:

```zsh
#!/usr/bin/env zsh

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: run-sql-remote.sh WORKSPACE_FOLDER SQL_FILE D1_DATABASE [TOKEN=value ...]" >&2
  exit 1
fi

workspace_folder="$1"
sql_file="$2"
d1_database="$3"

shift 3

if [[ ! -d "$workspace_folder" ]]; then
  echo "Workspace folder not found: $workspace_folder" >&2
  exit 1
fi

if [[ ! -f "$sql_file" ]]; then
  echo "SQL file not found: $sql_file" >&2
  exit 1
fi

if [[ -z "$d1_database" ]]; then
  echo "D1 database name is empty." >&2
  exit 1
fi

sql_text="$(cat "$sql_file")"

for parameter in "$@"; do
  if [[ "$parameter" != *=* ]]; then
    echo "Invalid parameter: $parameter" >&2
    echo "Expected TOKEN=value, for example START_DATE=2020-01-01" >&2
    exit 1
  fi

  parameter_name="${parameter%%=*}"
  parameter_value="${parameter#*=}"

  if [[ ! "$parameter_name" =~ '^[A-Z][A-Z0-9_]*$' ]]; then
    echo "Invalid parameter name: $parameter_name" >&2
    echo "Use uppercase names like START_DATE or END_DATE." >&2
    exit 1
  fi

  if [[ "$parameter_name" == *DATE && ! "$parameter_value" =~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' ]]; then
    echo "Invalid date for $parameter_name: $parameter_value" >&2
    echo "Use YYYY-MM-DD, for example 2020-01-01." >&2
    exit 1
  fi

  token="__${parameter_name}__"
  sql_text="${sql_text//$token/$parameter_value}"
done

cd "$workspace_folder"

npx wrangler d1 execute "$d1_database" --remote --command="$sql_text"
```

Save the file.

---

# What the Script Does

The extension will eventually run:

```text
zsh run-sql-remote.sh WORKSPACE_FOLDER SQL_FILE D1_DATABASE
```

Example:

```bash
zsh "/Users/carlo/.vscode/extensions/roncalw.cloudflare-sql-runner-1.0.1/src/scripts/run-sql-remote.sh" \
  "/Users/carlo/Projects/MovieApp" \
  "/Users/carlo/Projects/MovieApp/support/sql/test-count.sql" \
  "movieapp-db"
```

The script:

1. switches into the target project folder
2. reads the selected SQL file
3. runs Wrangler from the target project
4. executes SQL remotely against D1

---

# Step 8 — Create `src/extension.ts`

Open:

```text
src/extension.ts
```

Delete everything.

Paste this exact code:

```ts
import * as vscode from 'vscode';

let terminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'cloudflareSqlRunner.runSqlFile',
    async (uri: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage('No SQL file selected.');
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

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

export function deactivate() {}
```

Save the file.

---

# Important Line in `extension.ts`

```ts
const scriptPath = context.asAbsolutePath('src/scripts/run-sql-remote.sh');
```

This means:

```text
Find the shell script inside the installed extension folder.
```

Example installed path:

```text
~/.vscode/extensions/roncalw.cloudflare-sql-runner-1.0.1/src/scripts/run-sql-remote.sh
```

---

# Step 9 — Test the Extension with F5

While inside the extension project VS Code window:

Press:

```text
F5
```

OR:

```text
Run → Start Debugging
```

A second VS Code window opens:

```text
Extension Development Host
```

<span class="green">This second window temporarily loads the extension.</span>

No installation happens yet.

---

# Step 10 — Test Against a Real Project

Inside the `Extension Development Host` window:

```text
File → Open Folder...
```

Open a real Wrangler/Cloudflare project containing:

```text
wrangler.jsonc
package.json
.sql files
```

Create or edit:

```text
.vscode/settings.json
```

Add:

```json
{
  "cloudflareSqlRunner.d1Database": "movieapp-db"
}
```

Save it.

---

# Step 11 — Test the Right-Click Menu

Inside the Extension Development Host:

1. Find a `.sql` file
2. Right-click it
3. Click:

```text
Run Cloudflare SQL
```

Expected behavior:

```text
Terminal opens
Terminal clears
Wrangler runs
SQL results appear
```

---

# Step 12 — Stop F5 Testing

To stop debugging:

In the original extension project window:

```text
Run → Stop Debugging
```

OR:

```text
Shift+F5
```

You can also close the `Extension Development Host` window.

---

# Step 13 — Fix README Before Packaging

Open:

```text
README.md
```

Replace everything with:

````markdown
# Cloudflare SQL Runner

A private VS Code extension that adds a right-click command for `.sql` files.

The command runs the selected SQL file against a Cloudflare D1 database using Wrangler.

## Usage

Right-click a `.sql` file in VS Code Explorer and choose:

Run Cloudflare SQL

## Setting

Set the D1 database name in `.vscode/settings.json`:

```json
{
  "cloudflareSqlRunner.d1Database": "movieapp-db"
}
```
````

Save the file.

<span class="yellow">Important:</span>

`vsce package` refuses to package if the default template README is still present.

---

# Step 14 — Install the VS Code Packager

From the extension project folder:

```bash
cd ~/Projects/cloudflare-sql-runner
```

Install the packager:

```bash
npm install -g @vscode/vsce
```

---

# Step 15 — Package the Extension

Still inside the extension project folder:

```bash
vsce package
```

You may see warnings like:

```text
WARNING  A 'repository' field is missing
```

or:

```text
WARNING  LICENSE not found
```

For a private/local extension:

Type:

```text
y
```

and press Enter.

---

# Expected Result

You should now see:

```text
cloudflare-sql-runner-1.0.1.vsix
```

Verify:

```bash
ls *.vsix
```

---

# Step 16 — Install the Extension into VS Code

Still inside the extension project folder:

```bash
code --install-extension cloudflare-sql-runner-1.0.1.vsix
```

<span class="yellow">Important:</span>

Packaging does NOT install the extension.

This command installs it into VS Code itself.

---

# Step 17 — Physical Install Location

VS Code extensions install here on macOS:

```text
~/.vscode/extensions
```

Inspect before install:

```bash
ls ~/.vscode/extensions
```

Inspect after install:

```bash
ls ~/.vscode/extensions
```

Expected folder:

```text
roncalw.cloudflare-sql-runner-1.0.1
```

Open the installed extension folder:

```bash
open ~/.vscode/extensions/roncalw.cloudflare-sql-runner-1.0.1
```

You should physically see:

```text
src/scripts/run-sql-remote.sh
```

inside the installed extension.

---

# Step 18 — If You Accidentally Installed `undefined_publisher`

If you forgot `"publisher": "roncalw"` earlier, VS Code may create:

```text
undefined_publisher.cloudflare-sql-runner-0.0.1
```

Fix:

1. Open VS Code Extensions panel
2. Select the broken extension
3. Click `Uninstall`
4. Reload VS Code:

```text
Cmd+Shift+P
Developer: Reload Window
```

If needed, remove stale folder:

```bash
rm -rf ~/.vscode/extensions/undefined_publisher.cloudflare-sql-runner-0.0.1
```

Then reinstall the corrected `.vsix`.

---

# Step 19 — Use the Installed Extension Normally

Open any Wrangler/Cloudflare project normally in VS Code.

That project should contain:

```text
wrangler.jsonc
.sql files
```

Add:

```text
.vscode/settings.json
```

with:

```json
{
  "cloudflareSqlRunner.d1Database": "movieapp-db"
}
```

Then:

1. Right-click a `.sql` file
2. Click:

```text
Run Cloudflare SQL
```

Expected:

```text
Terminal clears
Wrangler runs
Query results appear
```

---

# Step 20 — Update Cycle During Development

Whenever you change the extension:

```text
edit extension
    ↓
package again
    ↓
reinstall .vsix
    ↓
reload VS Code
```

Commands:

```bash
cd ~/Projects/cloudflare-sql-runner
vsce package
code --install-extension cloudflare-sql-runner-1.0.1.vsix --force
```

Then reload VS Code:

```text
Cmd+Shift+P
Developer: Reload Window
```

---

# Step 21 — Why `--force` Exists

VS Code identifies extensions by:

```text
publisher + name + version
```

If you reinstall the same version repeatedly during development:

```text
1.0.1
```

VS Code may refuse reinstall.

Use:

```bash
--force
```

to overwrite the existing install.

If you completely removed the old install first, `--force` is not needed.

---

# Step 22 — Troubleshooting

## Problem: right-click menu missing

Check:

1. File ends in `.sql`
2. Extension installed
3. Reload VS Code:

```text
Cmd+Shift+P
Developer: Reload Window
```

---

## Problem: Wrangler fails

The target project must already support:

```bash
npx wrangler
```

Test:

```bash
cd TARGET_PROJECT
npx wrangler --version
```

---

## Problem: DB name wrong

Check:

```text
.vscode/settings.json
```

Example:

```json
{
  "cloudflareSqlRunner.d1Database": "movieapp-db"
}
```

---

## Problem: old terminal output clutter

The extension clears the terminal with:

```ts
terminal.sendText('clear');
```

before running the SQL.

---

# Final Runtime Flow

```text
Right-click .sql file
        ↓
VS Code extension command executes
        ↓
extension.ts launches:
src/scripts/run-sql-remote.sh
        ↓
script switches into target project folder
        ↓
npx wrangler d1 execute ...
        ↓
Cloudflare D1 returns query results
        ↓
results appear in VS Code terminal
```
