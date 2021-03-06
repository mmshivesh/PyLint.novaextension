# PyLint

This extension adds support for PyLint in Nova.

## Requirements

Needs PyLint to be installed:

```bash
pip install pylint
```

(or) 

```bash
pip3 install pylint
```

## Configuration

Default PyLint path is `/usr/local/bin/pylint`. 

Configure how Nova highlights issues raised by PyLint.

Finally,  you can choose to use a preconfigured list of command line arguments (enabled by default). This only selectively enables issues in line with the default argument list as followed in VSCode-Python. For information see [here](https://github.com/microsoft/vscode-python/blob/ed3f29f261100190f0dc1bea10ddf85f5b82e8d1/src/client/linters/pylint.ts).

### Ignoring PyLint Issues:

1. You can choose to ignore issues generated by PyLint using appropriate command line flags using `--disable=<FLAGS>` or specific comment blocks (check the PyLint [documentation](http://pylint.pycqa.org/en/latest/user_guide/message-control.html) for further information). 

2. You can choose to make Nova ignore them by choosing `Ignore` from the dropdown for each of the PyLint Issue categories in the extension preferences (the issues will however still be generated by PyLint).

## Contribution

Feel free to open PRs with more features.