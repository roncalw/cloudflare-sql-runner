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
