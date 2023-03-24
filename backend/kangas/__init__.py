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

import sys
import time
import urllib

from ._version import __version__  # noqa
from .datatypes import Audio, Curve, DataGrid, Image, Text, Video  # noqa
from .integrations import export_to_comet, import_from_comet  # noqa
from .server.queries import sqlite_query, sqlite_query_explain  # noqa
from .utils import (
    _in_colab_environment,
    _in_jupyter_environment,
    get_localhost,
    new_kangas_version_available,
)

if new_kangas_version_available():
    print("A new Kangas version is available", file=sys.stderr)


def _is_running(name, command):
    import psutil

    for pid in psutil.pids():
        try:
            process = psutil.Process(pid)
        except Exception:
            continue

        try:
            cmdline = " ".join(process.cmdline())
        except Exception:
            continue

        if process.name().startswith(name) and command in cmdline:
            return process.is_running() and process.status() != psutil.STATUS_ZOMBIE

    return False


def _process_method(name, command, method):
    import psutil

    for pid in psutil.pids():
        try:
            process = psutil.Process(pid)
        except Exception:
            continue

        try:
            cmdline = " ".join(process.cmdline())
        except Exception:
            continue

        if (
            process.name().startswith(name)
            and command in cmdline
            and "--terminate" not in cmdline
        ):
            return getattr(process, method)()


def terminate():
    """
    Terminate the Kangas servers.

    Note: this should never be needed.

    ```python
    >>> import kangas
    >>> kangas.terminate()
    ```
    """
    _process_method("node", "kangas", "terminate")
    _process_method("kangas", "server", "terminate")
    _process_method("python", "kangas", "terminate")


def launch(host=None, port=4000, debug=None, protocol="http", hide_selector=None):
    """
    Launch the Kangas servers.

    Note: this should never be needed as the Kangas
          servers are started automatically when needed.

    Args:
        host: (str) the name or IP of the machine the
            servers should listen on.
        port: (int) the port of the Kangas frontend server. The
            backend server will start on port + 1.
        debug: (str) the debugging output level will be
            shown as you run the servers.

    Example:

    ```python
    >>> import kangas
    >>> kangas.launch()
    ```
    """
    import subprocess

    host = host if host is not None else get_localhost()
    hide_selector = (
        hide_selector if hide_selector is not None else _in_jupyter_environment()
    )

    if not _is_running("node", "kangas"):
        print("Terminating any stray Kangas servers...")
        terminate()
        subprocess.Popen(
            (
                [
                    sys.executable,
                    "-m",
                    "kangas.cli.server",
                    "--frontend-port",
                    str(port),
                    "--backend-port",
                    str(port + 1),
                    "--open",
                    "no",
                    "--protocol",
                    protocol,
                ]
                + (["--host", host] if host is not None else [])
                + (["--hide-selector"] if hide_selector else [])
                + (["--debug-level", debug] if debug is not None else [])
            )
        )
        # FIXME: can we poll until it is ready?
        time.sleep(0.5)
        print("Starting Kangas server in 3...")
        time.sleep(1)
        print("Starting Kangas server in 2...")
        time.sleep(1)
        print("Starting Kangas server in 1...")
        time.sleep(1)

    return "%s://%s:%s/" % (protocol, host, port)


def show(
    datagrid=None,
    filter=None,
    host=None,
    port=4000,
    debug=None,
    height="750px",
    width="100%",
    protocol="http",
    hide_selector=False,
    **kwargs
):
    """
    Start the Kangas servers and show the DatGrid UI
    in an IFrame or browser.

    Args:
        datagrid: (str) the DataGrid's location from current
            directory
        filter: (str) a filter to set on the DataGrid
        host: (str) the name or IP of the machine the
            servers should listen on.
        port: (int) the port of the Kangas frontend server. The
            backend server will start on port + 1.
        debug: (str) debugging output level will be
            shown as you run the servers.
        height: (str) the height (in "px" pixels) of the
            iframe shown in the Jupyter notebook.
        width: (str) the width (in "px" pixels or "%" percentages) of the
            iframe shown in the Jupyter notebook.
        kwargs: additional URL parameters to pass to server

    Example:

    ```python
    >>> import kangas
    >>> kangas.show("./example.datagrid")
    >>> kangas.show("./example.datagrid", "{'Column Name'} < 0.5")
    >>> kangas.show("./example.datagrid", "{'Column Name'} < 0.5", group="Another Column Name")
    ```
    """
    import webbrowser

    from IPython.display import IFrame, clear_output, display

    url = launch(host, port, debug, protocol, hide_selector)

    if datagrid:
        query_vars = {"datagrid": datagrid}
        query_vars.update(kwargs)
        if filter:
            query_vars["filter"] = filter
        qvs = "?" + urllib.parse.urlencode(query_vars)
        url = "%s%s" % (url, qvs)
    else:
        qvs = ""

    if _in_colab_environment():
        from .colab_env import init_colab

        init_colab(port, width, height, qvs)

    elif _in_jupyter_environment():
        clear_output(wait=True)
        display(IFrame(src=url, width=width, height=height))

    else:
        webbrowser.open(url, autoraise=True)


def read_sklearn(dataset_name):
    """
    Load a sklearn dataset by name.

    Args:
        dataset_name: (str) one of: 'boston', 'breast_cancer',
            'diabetes', 'digits', 'files', 'iris',
            'linnerud', 'sample_image', 'sample_images',
            'svmlight_file', 'svmlight_files', 'wine'

    Example:
    ```python
    >>> dg = kg.read_sklearn("iris")
    ```
    """
    return DataGrid.read_sklearn(dataset_name)


def read_parquet(filename, **kwargs):
    """
    Takes a parquet filename or URL and returns a DataGrid.

    Note: requires pyarrow to be installed.

    Example:
    ```python
    >>> dg = DataGrid.read_parquet("userdata1.parquet")
    ```
    """
    return DataGrid.read_parquet(filename, **kwargs)


def read_dataframe(dataframe, **kwargs):
    """
    Takes a columnar pandas dataframe and returns a DataGrid.

    Args:
        dataframe: (pandas.DataFrame) the DataFrame to read from.
            Only works on in-memory DataFrames. If your DataFrame is
            stored on disk, you will need to load it first.
        datetime_format: (str) the Python date format that dates
            are read. For example, use "%Y/%m/%d" for dates like
            "2022/12/01".
        heuristics: (bool) whether to guess that some float values are
            datetime representations
        name: (str) the name to use for the DataGrid
        filename: (str) the filename to save the DataGrid to
        converters: (dict) dictionary of functions where the key
            is the columns name, and the value is a function that
            takes a value and converts it to the proper type and
            form.

    Note: the file or URL may end with ".zip", ".tgz", ".gz", or ".tar"
        extension. If so, it will be downloaded and unarchived. The JSON
        file is assumed to be in the archive with the same name as the
        file/URL. If it is not, then please use the kangas.download()
        function to download, and then read from the downloaded file.

    Examples:

    ```python
    >>> import kangas
    >>> from pandas import DataFrame
    >>> df = DataFrame(...)
    >>> dg = kangas.read_dataframe(df)
    >>> dg.save()
    ```
    """
    return DataGrid.read_dataframe(dataframe, **kwargs)


def read_datagrid(filename, **kwargs):
    """
    Reads a DataGrid from a filename or URL. Returns
    the DataGrid.

    Args:
        filename: the name of the file or URL to read the DataGrid
            from

    Note: the file or URL may end with ".zip", ".tgz", ".gz", or ".tar"
        extension. If so, it will be downloaded and unarchived. The JSON
        file is assumed to be in the archive with the same name as the
        file/URL. If it is not, then please use the kangas.download()
        function to download, and then read from the downloaded file.

    Examples:

    ```python
    >>> import kangas
    >>> dg = kangas.read_datagrid("example.datagrid")
    >>> dg = kangas.read_datagrid("http://example.com/example.datagrid")
    >>> dg = kangas.read_datagrid("http://example.com/example.datagrid.zip")
    >>> dg.save()
    ```
    """
    return DataGrid.read_datagrid(filename, **kwargs)


def read_json(filename, **kwargs):
    """
    Read JSON or JSON Line files [1]. JSON should be a list of objects,
    or a file with object on each line.

    Args:
        filename: the name of the file or URL to read the JSON from
        datetime_format: (str) the Python date format that dates
            are read. For example, use "%Y/%m/%d" for dates like
            "2022/12/01".
        heuristics: (bool) whether to guess that some float values are
            datetime representations
        name: (str) the name to use for the DataGrid
        converters: (dict) dictionary of functions where the key
            is the columns name, and the value is a function that
            takes a value and converts it to the proper type and
            form.

    Note: the file or URL may end with ".zip", ".tgz", ".gz", or ".tar"
        extension. If so, it will be downloaded and unarchived. The JSON
        file is assumed to be in the archive with the same name as the
        file/URL. If it is not, then please use the kangas.download()
        function to download, and then read from the downloaded file.

    [1] - https://jsonlines.org/

    Example:
    ```python
    >>> import kangas as kg
    >>> dg = kg.read_json("json_line_file.json")
    >>> dg = kg.read_json("https://instances.social/instances.json")
    >>> dg = kg.read_json("https://company.com/data.json.zip")
    >>> dg = kg.read_json("https://company.com/data.json.gz")
    >>> dg.save()
    ```
    """
    return DataGrid.read_json(filename, **kwargs)


def download(url, ext=None):
    """
    Downloads a file, and unzips, untars, or ungzips it.

    Args:
        url: (str) the URL of the file to download
        ext: (optional, str) the format of the archive: "zip",
            "tgz", "gz", or "tar".

    Note: the URL may end with ".zip", ".tgz", ".gz", or ".tar"
        extension. If so, it will be downloaded and unarchived.
        If the URL doesn't have an extension or it does not match
        one of those, but it is one of those, you can override
        it using the `ext` argument.

    Example:

    ```python
    >>> import kangas
    >>> kangas.download("https://example.com/example.images.zip")
    ```
    """
    return DataGrid.download(url, ext)


def read_csv(
    filename,
    header=0,
    sep=",",
    quotechar='"',
    heuristics=True,
    datetime_format=None,
    converters=None,
):
    """
    Takes a CSV filename and returns a DataGrid.

    Args:
        filename: the CSV file or URL to import
        header: (optional, int) row number (zero-based) of column headings
        sep:  used in the CSV parsing
        quotechar: used in the CSV parsing
        heuristics: if True, guess that some numbers might be dates
        datetime_format: (str) the Python date format that dates
            are read. For example, use "%Y/%m/%d" for dates like
            "2022/12/01".
        converters: (dict, optional) A dictionary of functions for converting
            values in certain columns. Keys are column labels.

    Note: the file or URL may end with ".zip", ".tgz", ".gz", or ".tar"
        extension. If so, it will be downloaded and unarchived. The JSON
        file is assumed to be in the archive with the same name as the
        file/URL. If it is not, then please use the kangas.download()
        function to download, and then read from the downloaded file.

    Examples:

    ```python
    >>> import kangas
    >>> dg = kangas.read_csv("example.csv")
    >>> dg = kangas.read_csv("http://example.com/example.csv")
    >>> dg = kangas.read_csv("http://example.com/example.csv.zip")
    >>> dg.save()
    ```
    """
    return DataGrid.read_csv(
        filename, header, sep, quotechar, datetime_format, heuristics, converters
    )
