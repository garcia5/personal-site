from flask import Flask, render_template
from flask_frozen import Freezer


def create_app():
    app = Flask(__name__)

    from agarcia import config, about

    app.register_blueprint(config.bp)
    app.register_blueprint(about.bp)

    @app.route("/")
    @app.route("/home/")
    def home():
        return render_template("index.html")

    return app


def freeze():
    app = create_app()
    app.config["FREEZER_DESTINATION"] = "../docs"
    app.config["FREEZER_DEFAULT_MIMETYPE"] = "text/html"
    app.config["FREEZER_RELATIVE_URLS"] = True
    freezer = Freezer(app=app, with_static_files=True)

    @freezer.register_generator
    def index_generator():
        yield "/"

    freezer.freeze()


if __name__ == "__main__":
    freeze()
