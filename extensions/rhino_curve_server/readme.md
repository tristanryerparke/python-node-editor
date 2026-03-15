



curl -X POST http://127.0.0.1:5124/cube \
  -H 'Content-Type: application/json' \
  -d '{"size": 10}'


curl -X POST http://127.0.0.1:5124/shutdown

'/Applications/Rhino 8.app/Contents/Resources/bin/rhinocode' script "/Users/tristanryerparke/python-node-editor/extensions/rhino_curve_server/stop.py"