#!/bin/bash
set -e

RESTRICTED_DIR="/usr/local/bin/restricted"
mkdir -p "$RESTRICTED_DIR"

# 1. Helper to link binaries if they exist
link_bin() {
  # Find the binary, ignoring the restricted directory itself to prevent loops
  local src
  src=$(which -a "$1" | grep -v "$RESTRICTED_DIR" | head -n1)
  if [ -n "$src" ] && [ -x "$src" ]; then
    ln -sf "$src" "$RESTRICTED_DIR/$1"
  fi
}

# 2. List of Allowed Tools
# Coreutils & Common Utils (needed for Zsh themes/plugins)
SAFE_TOOLS="ls cd pwd cp mv rm mkdir rmdir cat echo clear grep sed awk cut tr wc sort uniq head tail less more date uname which tput find dirname basename stat chmod chown whoami id sleep tar zip unzip gzip gunzip du df diff patch xargs"

# Showcase Tools
SHOWCASE_TOOLS="git fd rg bat eza delta git-delta"

# Link them
for tool in $SAFE_TOOLS $SHOWCASE_TOOLS zsh; do
  link_bin $tool
done

# Special case for delta on Ubuntu
if [ -f "$RESTRICTED_DIR/git-delta" ] && [ ! -f "$RESTRICTED_DIR/delta" ]; then
    ln -sf "$RESTRICTED_DIR/git-delta" "$RESTRICTED_DIR/delta"
fi

# 3. Create Wrapper for Neovim
# This allows nvim to access the FULL system path (for plugins like LSP, Copilot, etc.)
# while keeping the user shell restricted.
cat <<EOF > "$RESTRICTED_DIR/nvim"
#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
exec /usr/local/bin/nvim --cmd "set guicursor=" "\$@"
EOF
chmod +x "$RESTRICTED_DIR/nvim"

# 4. Create Wrapper for FZF
# fzf needs a shell to execute commands (like fd). We force it to use /bin/sh
# so we don't have to expose 'sh' in the restricted PATH.
cat <<EOF > "$RESTRICTED_DIR/fzf"
#!/bin/bash
export SHELL=/bin/sh
exec /usr/local/bin/fzf "\$@"
EOF
chmod +x "$RESTRICTED_DIR/fzf"

# 5. Enforce Restricted PATH in .zshrc
# We append this to the end so it overrides previous path settings
echo "" >> /home/dev/.zshrc
echo "# --- RESTRICTED SHELL SETUP ---" >> /home/dev/.zshrc
echo 'export PATH="$HOME/bin:/usr/local/bin/restricted"' >> /home/dev/.zshrc
