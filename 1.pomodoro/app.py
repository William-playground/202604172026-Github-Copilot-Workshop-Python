# Pomodoro Timer App
from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    """トップページ（ポモドーロタイマー画面）を配信する薄いサーバー。"""
    return render_template("index.html")


if __name__ == "__main__":
    # デバッグモードは環境変数 FLASK_DEBUG=1 のときのみ有効化する。
    # （デバッガ経由で任意コード実行を許すため、本番相当では必ず無効のこと）
    import os

    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(debug=debug)
