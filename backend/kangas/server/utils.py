# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2022 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import inspect
import re
import subprocess
import urllib

try:
    import marko
except Exception:
    marko = None


def safe_builtin_funcs():
    return {
        "abs": abs,
        "all": all,
        "any": any,
        "ascii": ascii,
        "bin": bin,
        "bool": bool,
        "bytes": bytes,
        "callable": callable,
        "chr": chr,
        "complex": complex,
        "dict": dict,
        "dir": dir,
        "divmod": divmod,
        "enumerate": enumerate,
        "filter": filter,
        "float": float,
        "format": format,
        "hasattr": hasattr,
        "hash": hash,
        "hex": hex,
        "id": id,
        "int": int,
        "isinstance": isinstance,
        "issubclass": issubclass,
        "iter": iter,
        "len": len,
        "list": list,
        "map": map,
        "max": max,
        "min": min,
        "oct": oct,
        "ord": ord,
        "pow": pow,
        "range": range,
        "repr": repr,
        "reversed": reversed,
        "round": round,
        "set": set,
        "slice": slice,
        "sorted": sorted,
        "str": str,
        "sum": sum,
        "tuple": tuple,
        "type": type,
        "zip": zip,
    }


try:
    import RestrictedPython
    import RestrictedPython.Eval
    import RestrictedPython.Guards

    def safe_compile(source):
        return RestrictedPython.compile_restricted_eval(source).code

    def safe_builtins():
        env = RestrictedPython.Guards.safe_builtins.copy()
        env.update(safe_builtin_funcs())
        return env

    def safe_env(**kwargs):
        env = {
            "_getattr_": getattr,
            "_getitem_": RestrictedPython.Eval.default_guarded_getitem,
            "_getiter_": RestrictedPython.Eval.default_guarded_getiter,
            "_iter_unpack_sequence_": RestrictedPython.Guards.guarded_iter_unpack_sequence,
            "__name__": "restricted namespace",
            "__builtins__": safe_builtins(),
        }
        env.update(kwargs)
        return env

except Exception:

    def safe_compile(source):
        return compile(source, "<string>", "eval")

    def safe_env(**kwargs):
        env = {
            "__builtins__": safe_builtins(),
        }
        env.update(kwargs)
        return env

    def safe_builtins():
        env = {}
        env.update(safe_builtin_funcs())
        return env


def get_argument_bindings(function, args, kwargs):
    signature = inspect.signature(function)
    try:
        binding = signature.bind(*args, **kwargs)
    except TypeError:
        return None
    # Set default values for missing values:
    binding.apply_defaults()
    ignore_param_list = ["self"]
    # Side-effect, remove ignored items:
    [
        binding.arguments.pop(item)
        for item in ignore_param_list
        if item in binding.arguments
    ]
    # Returns OrderedDict:
    return binding.arguments


def parse_args_kwargs(params):
    env = safe_env()
    env["get_args_and_params"] = lambda *args, **kwargs: (args, kwargs)
    code = "get_args_and_params({params})".format(params=params)
    args, kwargs = eval(safe_compile(code), env)
    return args, kwargs


def create_markdown_button(url, dgid, params):
    import kangas

    args, kwargs = parse_args_kwargs(params)
    if (
        len(args) > 0
        and isinstance(args[0], str)
        and args[0].endswith(".datagrid")
        or "datagrid" in kwargs
    ):
        params = get_argument_bindings(kangas.show, list(args), kwargs)
    else:
        # Add an arg for self:
        params = get_argument_bindings(
            kangas.DataGrid.show, [None] + list(args), kwargs
        )

    # Copy kwargs to params:
    if "kwargs" in params:
        params.update(params["kwargs"])

    if params is None:
        return ""
    elif params:
        query_args = {
            key: value
            for key, value in params.items()
            if key
            in ["filter", "sort", "group", "page", "rows", "select", "descending"]
            and value is not None
        }
        query_args["datagrid"] = dgid
    else:
        query_args = {"datagrid": dgid}

    qargs = urllib.parse.urlencode(query_args)
    return f"""<a href="{url}?{qargs}"><button>Show DataGrid</button></a>"""


def process_about(url, dgid, text):
    if marko is not None:
        regex = r"```python.*?\.show\((.*?)\)[^`]*```"
        retval = ""
        start = 0
        matches = re.finditer(regex, text, re.MULTILINE | re.DOTALL)
        found = False
        for match in matches:
            found = True
            end, newstart = match.span()
            previous = text[start:end]
            retval += previous
            code = match.group(0)
            retval += code + "\n\n"
            retval += create_markdown_button(url, dgid, match.groups(0)[0])
            start = newstart
        if not found:
            retval = text
        return marko.Markdown().convert(retval)
    else:
        return ""


def get_node_version():
    try:
        import nodejs
    except Exception:
        nodejs = None

    if nodejs is not None:
        return nodejs.__version__

    output = subprocess.check_output(["node", "--version"])
    if output:
        return output.decode("utf-8").strip()

    return "unknown"
