#!/bin/bash
set -e

# Configuration Paths
export CONFIG_HOME=${XDG_CONFIG_HOME:-$HOME/.config}
mkdir -p "$CONFIG_HOME"
export NVIM_HOME=$CONFIG_HOME/nvim
export DF_HOME=$HOME/.dotfiles

# Helper Functions
function runcmd {
    echo "$@"
    "$@"
}

function replace_file {
    local old_file=$1
    local new_file=$2
    if [[ -e "${old_file}" ]]; then
        rm -rf "${old_file}"
    fi
    if [[ -n "${new_file}" ]]; then
        ln -s "${new_file}" "${old_file}"
    fi
}

function replace_dir {
    local old_dir=$1
    local new_dir=$2
    if [[ -d "${old_dir}" ]]; then
        rm -rf "${old_dir}"
    fi
    if [[ -n "${new_dir}" ]]; then
        ln -s "${new_dir}" "${old_dir}"
    fi
}

# --- Install Steps ---

function install_colorscheme {
    echo "Installing colorschemes..."
    # zsh syntax highlighting
    mkdir -p "$HOME/.zsh"
    curl -o- https://raw.githubusercontent.com/catppuccin/zsh-syntax-highlighting/main/themes/catppuccin_mocha-zsh-syntax-highlighting.zsh \
        > "$HOME/.zsh/catppuccin_mocha-zsh-syntax-highlighting.zsh"

    # Bat themes
    if command -v bat; then
        mkdir -p "$(bat --config-dir)/themes"
        curl -o- https://raw.githubusercontent.com/catppuccin/bat/main/themes/Catppuccin%20Mocha.tmTheme \
                > "$(bat --config-dir)/themes/Catppuccin Mocha.tmTheme"
        bat cache --build
    fi
}

function setup_nvim {
    echo "Setting up Neovim..."
    mkdir -p "$NVIM_HOME"
    replace_dir "$NVIM_HOME" "$DF_HOME/files/nvim"
    
    # Python Provider
    if [[ ! -d "$HOME/py3nvim" ]]; then
        python3 -m venv "$HOME/py3nvim"
        source "$HOME/py3nvim/bin/activate"
        pip install --upgrade pip pynvim
        deactivate
    fi
}

function setup_zsh {
    echo "Setting up Zsh..."
    # Install Oh My Zsh
    if [ ! -d "$HOME/.oh-my-zsh" ]; then
        sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    fi

    DEFAULT_ZSH_CUSTOM="$HOME/.oh-my-zsh/custom"
    
    # Plugins
    local vi_mode="${ZSH_CUSTOM:-$DEFAULT_ZSH_CUSTOM}/plugins/zsh-vi-mode"
    if [[ ! -d "${vi_mode}" ]]; then
        git clone https://github.com/jeffreytse/zsh-vi-mode "${vi_mode}"
    fi

    local syntax_highlighting="${ZSH_CUSTOM:-$DEFAULT_ZSH_CUSTOM}/plugins/zsh-syntax-highlighting"
    if [[ ! -d "${syntax_highlighting}" ]]; then
        git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "${syntax_highlighting}"
    fi

    # Configs
    replace_file "$HOME/.zshrc" "$DF_HOME/files/zshrc"
    replace_file "$HOME/.aliases" "$DF_HOME/files/aliases"
    replace_file "$HOME/.functions" "$DF_HOME/files/functions"
    replace_file "$HOME/.fzf.custom" "$DF_HOME/files/fzf.custom"
    
    # Theme
    mkdir -p "${ZSH_CUSTOM:-$DEFAULT_ZSH_CUSTOM}/themes"
    replace_file "${ZSH_CUSTOM:-$DEFAULT_ZSH_CUSTOM}/themes/quarter-life.zsh-theme" "$DF_HOME/files/quarter-life.zsh-theme" 
}

function install_scripts {
    echo "Linking scripts..."
    mkdir -p "$HOME/bin"
    for file in "${DF_HOME}"/files/bin/*; do
        fname="$(basename "$file")"
        replace_file "$HOME/bin/$fname" "$DF_HOME/files/bin/$fname"
    done
}

# --- Main Execution ---

# 1. Colors
install_colorscheme

# 2. Zsh Setup
setup_zsh

# 3. Neovim Setup
setup_nvim

# 4. Scripts
install_scripts

# 5. WezTerm (Just symlink)
replace_file "$HOME/.wezterm.lua" "$DF_HOME/files/wezterm.lua"

# 6. Bootstrap Neovim Plugins
echo "Bootstrapping Neovim plugins..."
# Sync Lazy plugins first
nvim --headless "+Lazy! sync" +qa

# Install Treesitter parsers if the variable is set
if [ -n "$TREESITTER_INSTALL" ]; then
    echo "Installing Treesitter parsers: $TREESITTER_INSTALL"
    # We use a loop or just pass them all. TSInstall accepts multiple args.
    # Note: We need to ensure nvim can run this. 
    nvim --headless "+TSInstallSync $TREESITTER_INSTALL" +qa
fi

echo "Container Setup Complete!"
