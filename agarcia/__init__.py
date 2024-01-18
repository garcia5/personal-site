from flask import Flask, render_template
from flask_frozen import Freezer


def create_app():
    app = Flask(__name__)

    from agarcia import config, about

    app.register_blueprint(config.bp)
    app.register_blueprint(about.bp)

    @app.route("/")
    @app.route("/home")
    def home():
        return render_template("home.html")

    return app


def freeze():
    app = create_app()
    app.config['FREEZER_DESTINATION'] = "docs"
    freezer = Freezer(app=app, with_static_files=True)
    freezer.freeze()


if __name__ == "__main__":
    freeze()
