from typing import Dict, List

from flask import Flask, render_template


def create_app():
    app = Flask(__name__)

    @app.route("/")
    @app.route("/home")
    def home():
        return render_template("home.html")

    @app.route("/about")
    def about():
        return render_template("about.html")

    @app.route("/config")
    def config():
        base_url = "https://github.com/garcia5/dotfiles/blob/master"
        config_urls: List[Dict[str, str]] = [
            {
                "url": f"{base_url}/files/nvim/init.lua",
                "display": "Neovim",
            },
            {
                "url": f"{base_url}/files/wezterm.lua",
                "display": "WezTerm",
            },
            {
                "url": f"{base_url}/files/zshrc",
                "display": "Zsh",
            },
            {
                "url": f"{base_url}/files/functions",
                "display": "(Mostly) FZF Integration",
            },
            {
                "url": f"{base_url}/files/tmux.conf",
                "display": "Tmux",
            },
            {
                "url": f"{base_url}/files/sketchybar/sketchybarrc",
                "display": "Sketchybar",
            },
        ]
        return render_template("config.html", config_urls=config_urls)

    return app
