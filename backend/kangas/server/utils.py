# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2023 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import base64
import inspect
import io
import pickle
import re
import subprocess
import sys
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


class RestrictedUnpickler(pickle.Unpickler):
    def __init__(self, safe, *args, **kwargs):
        self.safe = safe
        super().__init__(*args, **kwargs)

    def find_class(self, module, name):
        if (module, name) in self.safe:
            if module != "builtins":
                return getattr(sys.modules[module], name)

        raise pickle.UnpicklingError(
            "global module '%s', name '%s' is forbidden" % (module, name)
        )


def pickle_dumps(obj):
    """
    Helper function analogous to pickle.dumps().
    """
    return base64.b64encode(pickle.dumps(obj)).decode("ascii")


def pickle_loads(safe, ascii_string):
    """
    Helper function analogous to pickle.loads().
    """
    return RestrictedUnpickler(
        safe,
        io.BytesIO(base64.b64decode(ascii_string)),
    ).load()


def pickle_loads_embedding_unsafe(ascii_string):
    return pickle.Unpickler(
        io.BytesIO(base64.b64decode(ascii_string)),
    ).load()


def pickle_loads_embedding(ascii_string):
    safe = {
        ("numpy", "dtype"),
        ("numpy", "ndarray"),
        ("numpy.core.multiarray", "_reconstruct"),
        ("numpy.core.multiarray", "scalar"),
        ("openTSNE.affinity", "MultiscaleMixture"),
        ("openTSNE.nearest_neighbors", "Sklearn"),
        ("openTSNE.tsne", "TSNEEmbedding"),
        ("openTSNE.tsne", "gradient_descent"),
        ("scipy.sparse._csr", "csr_matrix"),
        ("sklearn.base", "clone"),
        ("sklearn.metrics._dist_metrics", "EuclideanDistance"),
        ("sklearn.metrics._dist_metrics", "newObj"),
        ("sklearn.neighbors._kd_tree", "KDTree"),
        ("sklearn.neighbors._kd_tree", "newObj"),
        ("sklearn.neighbors._unsupervised", "NearestNeighbors"),
        ("openTSNE.nearest_neighbors", "Annoy"),
    }
    import numpy  # noqa
    import openTSNE.tsne  # noqa
    import scipy.sparse.csr  # noqa
    import sklearn  # noqa
    import sklearn.decomposition  # noqa

    return pickle_loads(safe, ascii_string)


class Cache:
    """
    LRU Cache.

    Note: Make sure you copy retrieved items to avoid
    changing it in cache.
    """

    def __init__(self, size):
        self.cache = {}
        self.max_size = 100

    def contains(self, key):
        return key in self.cache

    def put(self, key, value):
        # Check size:
        if len(self.cache) >= self.max_size:
            # too many
            first_in_key = list(self.cache.keys())[0]
            # del the first-in
            del self.cache[first_in_key]
        self.cache[key] = value

    def get(self, key):
        return self.cache[key]

    def clear(self):
        self.cache.clear()
