import flask
# hello
import sys
from datetime import datetime

debug = False

if len(sys.argv) > 1:
    debug = sys.argv[1] == 'debug'

if debug:
    print("Running in debug mode")

app = flask.Flask(__name__)

@app.route('/')
def index():

    with open('access.log', 'a') as f:
        f.write(f"{datetime.now()},{flask.request.remote_addr}\n")

    return flask.render_template('app.html')

if __name__ == '__main__':
    app.debug=debug
    app.run(host='0.0.0.0', port=8001 if debug else 8000)
