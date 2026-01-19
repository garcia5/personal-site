# Auto-Syncing Dotfiles

To keep your terminal sandbox up-to-date with your real configuration, you can set up a GitHub Action in your `dotfiles` repository to trigger a rebuild of this site whenever you push changes.

## 1. Create a Personal Access Token (PAT)
1. Go to **GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)**.
2. Generate a new token with `repo` scope (to trigger workflows).
3. Copy the token.

## 2. Add Secret to Dotfiles Repo
1. Go to your `garcia5/dotfiles` repository.
2. **Settings > Secrets and variables > Actions**.
3. Create a new secret `PERSONAL_SITE_PAT`.
4. Paste the token.

## 3. Add Workflow to Dotfiles Repo
Create `.github/workflows/trigger-site-rebuild.yml` in your **dotfiles** repository:

```yaml
name: Trigger Personal Site Rebuild

on:
  push:
    branches:
      - master # or main

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Site Rebuild
        run: |
          curl -X POST https://api.github.com/repos/yourusername/personal-site/dispatches \
          -H 'Accept: application/vnd.github.everest-preview+json' \
          -H 'Authorization: token ${{ secrets.PERSONAL_SITE_PAT }}' \
          -d '{"event_type": "dotfiles_update"}'
```
*(Replace `yourusername/personal-site` with your actual repo)*

## 4. Update Personal Site Workflow
We need to update `.github/workflows/deploy-backend.yml` in this repository to listen for this event.

Update the `on:` section:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'server/**'
      - 'deploy/**'
  repository_dispatch:
    types: [dotfiles_update]
```

Now, every time you push to dotfiles, this site will rebuild its Docker container!

```