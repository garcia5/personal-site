from typing import List, Dict

from flask import Blueprint, render_template

bp = Blueprint("config", __name__, url_prefix="/config")


@bp.route("")
def base():
    base_url = "https://github.com/garcia5/dotfiles/blob/master"
    config_urls: List[Dict[str, str]] = [
        {
            "url": f"{base_url}/files/nvim/init.lua",
            "display": "Neovim",
            "id": "nvim",
            "image": "Nvim Showcase.png",
        },
        {
            "url": f"{base_url}/files/wezterm.lua",
            "display": "WezTerm",
            "id": "wez",
            "image": "Terminal Showcase.png",
        },
        {
            "url": f"{base_url}/files/zshrc",
            "display": "Zsh",
            "id": "zsh",
        },
        {
            "url": f"{base_url}/files/functions",
            "display": "(Mostly) FZF Integration",
            "id": "fzf",
            "image": "fzf-1.png",
        },
        {
            "url": f"{base_url}/files/sketchybar/sketchybarrc",
            "display": "Sketchybar",
            "id": "sketchybar",
            "image": "sketchybar.png",
        },
    ]
    return render_template("config.html", config_urls=config_urls)
