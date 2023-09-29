from flask import Flask, render_template


def create_app():
    app = Flask(__name__)

    from agarcia import config

    app.register_blueprint(config.bp)

    @app.route("/")
    @app.route("/home")
    def home():
        return render_template("home.html")

    @app.route("/about")
    def about():
        return render_template("about.html")

    return app
