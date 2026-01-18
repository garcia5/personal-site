FROM ubuntu:latest

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
# We include 'bat' and 'exa' (or 'eza') if available, or map them.
# Ubuntu uses 'batcat' for bat.
RUN apt-get update && apt-get install -y \
    curl \
    git \
    zsh \
    nodejs \
    npm \
    python3 \
    python3-venv \
    python3-pip \
    gcc \
    make \
    ripgrep \
    bat \
    locales \
    sudo \
    ca-certificates \
    zsh-syntax-highlighting \
    git-delta \
    && rm -rf /var/lib/apt/lists/*

# Install latest fzf
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        FZF_ARCH="linux_amd64"; \
    elif [ "$ARCH" = "aarch64" ]; then \
        FZF_ARCH="linux_arm64"; \
    else \
        echo "Unsupported architecture for fzf: $ARCH" && exit 1; \
    fi && \
    curl -L -o fzf.tar.gz "https://github.com/junegunn/fzf/releases/download/v0.67.0/fzf-0.67.0-${FZF_ARCH}.tar.gz" && \
    tar -xzf fzf.tar.gz && \
    mv fzf /usr/local/bin/fzf && \
    rm fzf.tar.gz

# Install latest fd (fd-find)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        FD_ARCH="x86_64-unknown-linux-musl"; \
    elif [ "$ARCH" = "aarch64" ]; then \
        FD_ARCH="aarch64-unknown-linux-musl"; \
    else \
        echo "Unsupported architecture for fd: $ARCH" && exit 1; \
    fi && \
    curl -L -o fd.tar.gz "https://github.com/sharkdp/fd/releases/download/v10.2.0/fd-v10.2.0-${FD_ARCH}.tar.gz" && \
    tar -xzf fd.tar.gz && \
    mv "fd-v10.2.0-${FD_ARCH}/fd" /usr/local/bin/fd && \
    rm -rf fd.tar.gz "fd-v10.2.0-${FD_ARCH}"

# Install Neovim Nightly (v0.11.x) - Dynamic Arch Detection
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        NVIM_ARCH="nvim-linux-x86_64"; \
    elif [ "$ARCH" = "aarch64" ]; then \
        NVIM_ARCH="nvim-linux-arm64"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    curl -L -o nvim.tar.gz "https://github.com/neovim/neovim/releases/download/v0.11.5/${NVIM_ARCH}.tar.gz" && \
    tar -C /opt -xzf nvim.tar.gz && \
    ln -s "/opt/${NVIM_ARCH}/bin/nvim" /usr/local/bin/nvim && \
    rm nvim.tar.gz

# Fix 'bat' command name (Ubuntu calls it batcat)
RUN ln -s /usr/bin/batcat /usr/local/bin/bat

# Set up locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Install global npm tools
RUN npm i -g neovim bash-language-server pyright typescript-language-server vscode-langservers-extracted yaml-language-server @fsouza/prettierd typescript tree-sitter-cli

# Create a non-root user
RUN useradd -m -s /bin/zsh dev

# Mock 'brew' to prevent errors in dotfiles that assume macOS/Homebrew
# We make it return /usr/local for --prefix, which is standard on Linux
RUN echo '#!/bin/bash\nif [[ "$1" == "--prefix" ]]; then echo "/usr/local"; else echo "brew (mock)"; fi' > /usr/local/bin/brew && \
    chmod +x /usr/local/bin/brew

USER dev
WORKDIR /home/dev

# Copy .custom configuration
COPY --chown=dev:dev .custom /home/dev/.custom

# Clone dotfiles
RUN git clone https://github.com/garcia5/dotfiles.git ~/.dotfiles

# ENV for Treesitter
ENV TREESITTER_INSTALL="c,lua,vim,vimdoc,query,python,typescript,javascript,html,css,bash,markdown,json"

# Copy and run the setup script
COPY --chown=dev:dev setup_container.sh /home/dev/setup_container.sh
RUN chmod +x /home/dev/setup_container.sh && /home/dev/setup_container.sh

# Apply restricted shell environment
COPY setup_restricted.sh /home/dev/setup_restricted.sh
USER root
RUN chmod +x /home/dev/setup_restricted.sh && /home/dev/setup_restricted.sh
USER dev

# Default command
CMD ["/bin/zsh"]
