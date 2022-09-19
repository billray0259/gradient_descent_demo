import flask
# hello
import sys

debug = False

if len(sys.argv) > 1:
    debug = sys.argv[1] == 'debug'

if debug:
    print("Running in debug mode")

app = flask.Flask(__name__)

@app.route('/')
def index():
    return flask.render_template('app.html')

if __name__ == '__main__':
    app.debug=debug
    app.run(host='0.0.0.0', port=8001 if debug else 8000)
