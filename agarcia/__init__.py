from flask import Flask, render_template


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
