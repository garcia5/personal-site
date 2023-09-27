from flask import Flask

def create_app():
    app = Flask(__name__)

    @app.route("/home")
    def home():
        return "<h1>Home</h1>"

    return app
