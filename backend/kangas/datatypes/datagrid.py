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

import csv
import io
import json
import logging
import math
import os
import sqlite3
import tempfile
import urllib
from collections import defaultdict

import numpy as np

from ..utils import (
    ProgressBar,
    _in_colab_environment,
    _in_jupyter_environment,
    _in_kaggle_environment,
)
from .base import Asset
from .serialize import ASSET_TYPE_MAP, DATAGRID_TYPES
from .utils import (
    RESERVED_NAMES,
    _verify_box,
    apply_converters,
    convert_row_dict,
    convert_string_to_value,
    convert_to_type,
    convert_to_value,
    create_columns,
    download_filename,
    expand_mask,
    generate_thumbnail,
    get_annotations_from_layers,
    get_labels_from_annotations,
    get_mask_from_annotations,
    is_null,
    make_dict_factory,
    python_to_markdown,
    pytype_to_dgtype,
    sanitize_name,
)

LOGGER = logging.getLogger(__name__)
VERSION = 1


def _convert_setting(value, desired_type):
    if value is None:
        return None
    elif desired_type == int:
        return int(value)
    elif desired_type == bool:
        return bool(value)
    elif desired_type == str:
        return value
    elif desired_type == float:
        return float(value)
    else:
        raise Exception("unknown setting type: %r" % desired_type)


def _createAssetEncoder(datagrid):
    """
    Create and return an JSON encoder that logs
    assets to the datagrid.
    """

    class AssetEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, Asset):
                return obj.log_and_serialize(datagrid)

            return json.JSONEncoder.default(self, obj)

    return AssetEncoder


def _convert_with_assets_to_json(metadata, datagrid):
    """
    Go through metadata, convert to JSON, logging
    any assets along the way.

    Args:
        metadata: a JSON-encodable item, with assets
        datagrid: a datagrid with _log() method.

    Returns:
        a JSON-encoded string with asset objects replaced with assetIds

    Side-effects:
        logs assets to database
    """
    return json.dumps(metadata, cls=_createAssetEncoder(datagrid))


class DataGrid:
    """
    DataGrid instances have the following atrributes:

    * columns - a list of column names, or a dict of column names
        mapped to column types
    * data - a list of lists where each is a row of data
    * name - a name of the tabular data
    """

    MAX_ROWS = 1000000
    MAX_COLS = 101
    MAX_COL_NAME_LENGTH = 50
    MAX_COL_STRING_LENGTH = 10000

    def __init__(
        self,
        data=None,
        columns=None,
        name="Untitled",
        datetime_format="%Y/%m/%d",
        heuristics=False,
        converters=None,
    ):
        """
        Create a DataGrid instance.

        Args:
            data: (optional, list of lists) The rows of data
            columns: (optional, list of strings) the column titles
            name: (optional, str) a name of the tabular data
            datetime_format: (optional, str) the Python date format that dates
                are read. For example, use "%Y/%m/%d" for dates like
                "2022/12/01".
            heuristics: if True, guess that some numbers might be dates
            converters: (optional, dict) dictionary of functions to convert items
                into values. Keys are str (to match column name)

        NOTES:

        The varaible `dg` is used below as an example DataGrid instance.

        If column names are not provided, then names will be generated
        in the sequence "A", "B", ... "Z", "AA", "BB", ...

        The DataGrid instance can be imagined as a two-dimensional list
        of lists. The first dimension is the row, and the second dimension
        is the column. For example, dg[5][2] would return the 6th row
        (zero-based) and the 3rd (zero-based) column's value.

        Likewise, you can use `dg.append(ROW)`, `dg.extend(ROWS)`, and
        `dg.pop(INDEX)` methods.

        Rows can be either lists of values, or JSON-like dictionaries
        of the form `{"COLUMN NAME": VALUE, ...}`.

        These are common methods to use on a DataGrid:

        * `dg.info()` - data about rows, columns, and datatypes
        * `dg.head()` - show the first few rows of a DataGrid
        * `dg.tail()` - show the last few rows of a DataGrid
        * `dg.show()` - open up an IFrame (if in a Jupyter Notebook) or
            a webbrowser page showing the DataGrid UI

        Examples:

        ```python
        >>> from kangas import DataGrid, Image
        >>> import glob
        >>> dg = DataGrid(name="Images", columns=["Image", "Score"])
        >>> for filename in glob.glob("*.jpg"):
        ...     score = model.predict()
        ...     dg.append([Image(filename), score])
        >>> dg.show()
        ```
        """
        self.converters = converters if converters else self._get_default_converters()
        self.datetime_format = datetime_format
        self.heuristics = heuristics
        self.about = ""
        self.create_thumbnails = False
        self.name = name
        self._data = []
        self._columns = {}
        self._on_disk = False
        # Cached:
        self._schema = None

        if isinstance(data, str):
            self.filename = download_filename(data)
            data = None
            if os.path.isfile(self.filename):
                self.conn = sqlite3.connect(str(self.filename))
            else:
                raise Exception("file not found: %r" % self.filename)

            self._on_disk = True
            schema = self.get_schema()
            self._columns = {
                column_name: schema[column_name]["type"] for column_name in schema
            }
            try:
                self._load_settings()
            except Exception:
                print("Unable to load settings from datagrid")

            return
        else:
            self.filename = sanitize_name(self.name).replace(",", "") + ".datagrid"

        # Set columns and types:
        if columns:
            self.set_columns(columns)
        elif data:
            if hasattr(data, "__iter__"):
                data = list(data)

            if isinstance(data[0], dict):
                column_names = self._verify_column_list(data[0].keys())
                self._columns = {"row-id": "ROW_ID"}
                self._columns.update(
                    {
                        self._verify_column(column_name, i): None
                        for i, column_name in enumerate(column_names)
                    }
                )
            else:
                self._columns = create_columns(len(data[0]))

        # Else, will have to add columns on the fly when we get some data

        if data:
            self.extend(ProgressBar(data))

    def __repr__(self, row=None):
        nrows = self.nrows

        if row is None:

            def row(value):
                return "%s\n" % value

        if nrows == 0:
            return "DataGrid is empty"
        elif nrows <= 10:
            output = self._display_rows_string(10, nrows, range(min(10, nrows)))
        else:
            output = self._display_rows_string(
                5, nrows, range(min(5, nrows)), footer=False
            )
            output += row("...")
            output += self._display_rows_string(
                5,
                nrows,
                reversed(range(nrows - 1, max(nrows - 5 - 1, -1), -1)),
                header=False,
            )
        output += row("")

        if not self._on_disk:
            output += row("*  Use DataGrid.save() to save to disk")
            output += row("** Use DataGrid.show() to start user interface")
        else:
            output += row("*  Use DataGrid.show() to start user interface")

        return output

    def _repr_html_(self):
        def row(value):
            return "<tr><td colspan='%s' style='text-align: left;'>%s</td></tr>" % (
                len(self.get_columns()) + 1,
                value,
            )

        output = self.__repr__(row)

        return "<table>%s</table>" % output

    def _get_default_converters(self):
        return {}  # {"row": huggingface_annotations}

    def show(
        self,
        filter=None,
        host=None,
        port=4000,
        debug=None,
        height="750px",
        width="100%",
        protocol="http",
        hide_selector=None,
        use_ngrok=False,
        cli_kwargs=None,
        **kwargs
    ):
        """
        Open DataGrid in an IFrame in the jupyter environment or browser.

        Args:
            host: (optional, str) the host name or IP number for the servers
               to listen to
            filter: (optional, str) a filter to set on the DataGrid
            port: (optional, int) the port number for the servers to listen to
            debug: (optional, str) will display additional information
               from the server (may not be visible in a notebook)
            height: (optional, str) the height of iframe in px or percentage
            width: (optional, str) the width of iframe in px or percentage
            use_ngrok: (optional, bool) force using ngrok as a proxy
            cli_kwargs: (dict) a dictionary with keys the names
                of the kangas server flags, and values the setting value
                (such as: `{"backend-port": 8000}`)
                kwargs: additional URL parameters to pass to server

        Example:

        ```python
        >>> import kangas as kg
        >>> dg = kg.DataGrid()
        >>> # append data to DataGrid
        >>> dg.show()
        >>> dg.show("{'Column Name'} == 'category three'")
        >>> dg.show("{'Column Name'} == 'category three'",
        ...     group="Another Column Name")
        ```
        """
        from kangas import launch

        url = launch(
            host,
            port,
            debug,
            protocol,
            hide_selector,
            **(cli_kwargs if cli_kwargs else {})
        )

        if not self._on_disk:
            self.save()

        query_vars = {
            "datagrid": self.filename,
            "timestamp": os.path.getmtime(self.filename),
        }
        query_vars.update(kwargs)

        if filter:
            query_vars["filter"] = filter
        qvs = "?" + urllib.parse.urlencode(query_vars)
        url = "%s%s" % (url, qvs)

        if _in_kaggle_environment() or use_ngrok:
            from IPython.display import IFrame, clear_output, display

            try:
                from pyngrok import ngrok  # noqa
            except ImportError:
                raise Exception(
                    "pyngrok is required for use in kaggle; pip install pyngrok"
                ) from None

            from ..kaggle_env import init_kaggle

            tunnel = init_kaggle(port)
            url = "%s%s" % (tunnel.public_url, qvs)

            if _in_jupyter_environment():
                clear_output(wait=True)
                display(IFrame(src=url, width=width, height=height))
            else:
                import webbrowser

                webbrowser.open(url, autoraise=True)

        elif _in_colab_environment():
            from IPython.display import clear_output

            from ..colab_env import init_colab

            clear_output(wait=True)
            init_colab(port, width, height, qvs)

        elif _in_jupyter_environment():
            from IPython.display import IFrame, clear_output, display

            clear_output(wait=True)
            display(IFrame(src=url, width=width, height=height))

        else:
            import webbrowser

            webbrowser.open(url, autoraise=True)

    def set_columns(self, columns):
        """
        Set the columns. `columns` is either a list of column names, or a
        dict where the key is the column name, and the value is a DataGrid
        type. Vaild DataGrid types are: "INTEGER", "FLOAT", "BOOLEAN",
        "DATETIME", "TEXT", "JSON", "VECTOR", or "IMAGE-ASSET".

        Example:

        ```python
        >>> dg = DataGrid()
        >>> dg.set_columns(["Column 1", "Column 2"])
        ```
        """
        if self._on_disk:
            raise Exception("unable to change columns in a saved DataGrid")

        if isinstance(columns, (tuple, list)):
            columns = self._verify_column_list(columns)
            self._columns = {"row-id": "ROW_ID"}
            self._columns.update(
                {
                    self._verify_column(column_name, i): None
                    for i, column_name in enumerate(columns)
                }
            )

        elif isinstance(columns, dict):
            # Map of column_name -> column_type
            column_names = self._verify_column_list(columns.keys())
            self._columns = {"row-id": "ROW_ID"}
            self._columns.update(
                {
                    self._verify_column(column_name, i): self._verify_type(column_type)
                    for i, (column_name, column_type) in enumerate(
                        zip(column_names, columns.values())
                    )
                }
            )

    def __iter__(self):
        """
        Iterate over data.
        """
        if self._on_disk:
            sql = "SELECT * FROM datagrid;"
            schema = self.get_schema()
            column_name_map = {
                schema[column_name]["field_name"]: column_name for column_name in schema
            }
            # Make our own connection to use row_factory:
            if os.path.isfile(self.filename):
                conn = sqlite3.connect(str(self.filename))
            else:
                raise Exception("file not found: %r" % self.filename)

            conn.row_factory = make_dict_factory(column_name_map)

            cursor = conn.cursor()
            results = cursor.execute(sql)
            for row in results:
                yield [
                    self._value_to_asset(row, column_name)
                    for column_name in self.get_columns()
                ]

            conn.row_factory = None

        else:
            for row in self._data:
                yield [row[column_name] for column_name in self.get_columns()]

    def to_csv(
        self,
        filename,
        sep=",",
        header=True,
        quotechar='"',
        encoding="utf8",
        converters=None,
    ):
        """
        Save a DataGrid as a Comma Separated Values (CSV) file.

        Args:
            filename: (str) the file to save the CSV data to
            sep: (str) separator to use in CSV; default is ","
            header: (bool) if True, write out the header; default is True
            quotechar: (str) the character to use to surround text; default is '"'
            encoding: (str) the encoding to use in the saved file; default is "utf8"
            converters: (optional, dict) dictionary of functions to convert items
                into values. Keys are str (to match column name)

        Example:
        ```python
        >>> dg.to_csv()
        ```
        """
        print("Saving DataGrid to %r..." % filename)
        with open(filename, "w", encoding=encoding, newline="") as fp:
            writer = csv.writer(fp, delimiter=sep, quotechar=quotechar)
            if header:
                writer.writerow(self.get_columns())
            for row in ProgressBar(self):
                writer.writerow(
                    [
                        apply_converters(value, colname, converters)
                        for value, colname in zip(row, self.get_columns())
                    ]
                )

    def to_dataframe(self):
        """
        Convert a DataGrid into a pandas dataframe.

        Example:
        ```python
        >>> df = dg.to_dataframe()
        ```
        """
        try:
            import pandas
        except ImportError:
            raise Exception("DataGrid.to_dataframe() requires pandas")

        print("Creating DataFrame...")
        data = self.to_dicts()
        return pandas.DataFrame(data=data, columns=self.get_columns())

    def to_dicts(self, column_names=None, format_map=None):
        """
        Iterate over data, returning dicts.

        Args:
            column_names: (optional, list of str) only return the given
                column names
            format_map: (optional, dict) dictionary of column type to
                function that takes a value, and returns a new value.

        ```python
        >>> dg = DataGrid(columns=["column 1", "column 2"])
        >>> dg.append([1, "one"])
        >>> dg.append([2, "two"])
        >>> dg.to_dicts()
        [
         {"column 1": value1_1, "column 2": value1_2, ...},
         {"column 1": value2_1, "column 2": value2_2, ...},
        ]
        >>> dg.to_dicts("column 2")
        [
         {"column two": value1_2, ...},
         {"column two": value2_2, ...},
        ]
        ```
        """
        if isinstance(column_names, str):
            column_names = [column_names]
        column_names = column_names if column_names else self.get_columns()
        if self._on_disk:
            sql = "SELECT * FROM datagrid;"
            schema = self.get_schema()
            column_name_map = {
                schema[column_name]["field_name"]: column_name for column_name in schema
            }
            # Make our own connection to use row_factory:
            if os.path.isfile(self.filename):
                conn = sqlite3.connect(str(self.filename))
            else:
                raise Exception("file not found: %r" % self.filename)

            conn.row_factory = make_dict_factory(column_name_map)

            cursor = conn.cursor()
            results = cursor.execute(sql)
            for row in results:
                yield {
                    column_name: self._value_to_asset(row, column_name, format_map)
                    for column_name in column_names
                }
            conn.row_factory = None

        else:
            for row in self._data:
                yield {column_name: row[column_name] for column_name in column_names}

    def _raw_value_to_asset(self, value):
        """
        Takes an asset from query_sql and return unserialized asset
        """
        if isinstance(value, dict):
            if "assetType" in value and "assetId" in value:
                row = {"value": value["assetId"]}
                return ASSET_TYPE_MAP[value["assetType"]].unserialize(
                    self, row, "value"
                )

        return value

    def _value_to_asset(self, row, column_name, format_map=None):
        # if this is an asset column, return Object, with asset_id, asset_data,
        # and asset_metadata
        if column_name in self._columns:
            dg_type = self._columns[column_name]
            value = DATAGRID_TYPES[dg_type]["unserialize"](self, row, column_name)
            if format_map is not None and dg_type in format_map:
                value = format_map[dg_type](value)
            return value
        return row[column_name]

    def __getitem__(self, item):
        """
        Get either a row or a column from the DataGrid.

        Args:
            item: (str or int) - if int, return the zero-based row; if str
                then item is the column name to return

        ```python
        >>> dg = DataGrid(columns=["column 1", "column 2"])
        >>> dg.append([1, "one"])
        >>> dg.append([2, "two"])
        >>> dg[0]
        [1, "one"]
        >>> dg["column 1"]
        [1, 2]
        ```
        """
        if isinstance(item, int):
            row_index = item
            column_name = None
        elif isinstance(item, str):
            row_index = None
            column_name = item
        else:
            raise Exception("invalid DataGrid accessor: %r" % item)

        if self._on_disk:
            schema = self.get_schema()
            column_name_map = {
                schema[column_name]["field_name"]: column_name for column_name in schema
            }

            self.conn.row_factory = make_dict_factory(column_name_map)

            cursor = self.conn.cursor()
            if row_index is not None:
                rowid = row_index + 1
                sql = ("SELECT * FROM datagrid WHERE column_0 = {rowid};").format(
                    rowid=rowid,
                )
                results = cursor.execute(sql)
                row = results.fetchone()
                self.conn.row_factory = None
                if row:
                    return [
                        self._value_to_asset(row, column_name)
                        for column_name in self.get_columns()
                    ]
                else:
                    raise IndexError("row index out of range")
            else:  # column mode
                sql = "SELECT * FROM datagrid;"
                results = cursor.execute(sql)
                # FIXME: make lazy by using yeild:
                rows = results.fetchall()
                self.conn.row_factory = None
                return [self._value_to_asset(row, column_name) for row in rows]
        else:
            if row_index is not None:
                if row_index < len(self._data):
                    return [
                        self._data[row_index][column_name]
                        if column_name in self._data[row_index]
                        else None
                        for column_name in self.get_columns()
                    ]
                else:
                    raise IndexError("row index out of range")
            else:
                return [
                    row[column_name] if column_name in row else None
                    for row in self.to_dicts()
                ]

    def __len__(self):
        return self.nrows

    @property
    def nrows(self):
        """
        The number of rows in the DataGrid.

        Example:

        ```python
        >>> dg.nrows
        42
        ```
        """
        if self._on_disk:
            sql = "SELECT COUNT() FROM datagrid;"
            cursor = self.conn.cursor()
            results = cursor.execute(sql)
            row = results.fetchone()
            return row[0]
        else:
            return len(self._data)

    @property
    def ncols(self):
        """
        The number of columns in the DataGrid.

        Example:

        ```python
        >>> dg.ncols
        10
        ```
        """
        return len(self._columns)

    @property
    def shape(self):
        """
        The (rows, columns) in the DataGrid.

        Example:

        ```python
        >>> dg.shape
        (10, 42)
        ```
        """
        return (self.nrows, self.ncols)

    @classmethod
    def download(cls, url, ext=None):
        """
        Download a file from a URL.

        Example:
        ```python
        >>> DataGrid.download("https://example.com/file.zip")
        ```
        """
        download_filename(url, ext)

    @classmethod
    def read_sklearn(cls, dataset_name):
        """
        Load a sklearn dataset by name.

        Args:
            dataset_name: (str) one of: 'boston', 'breast_cancer',
                'diabetes', 'digits', 'iris', 'wine'

        Example:
        ```python
        >>> dg = DataGrid.read_sklearn("iris")
        ```
        """
        import sklearn.datasets

        dataset = getattr(sklearn.datasets, "load_%s" % dataset_name)()
        if hasattr(dataset, "target_names"):
            target_names = {
                key: value for key, value in enumerate(dataset.target_names)
            }

        datagrid = DataGrid(
            name=dataset_name,
            columns=list(dataset.feature_names) + ["target"],
        )

        for i in range(len(dataset.data)):
            if hasattr(dataset, "target_names"):
                target = target_names[dataset.target[i]]
            else:
                target = dataset.target[i]
            datagrid.append(list(dataset.data[i]) + [target])

        return datagrid

    @classmethod
    def read_parquet(cls, filename, **kwargs):
        """
        Takes a parquet filename or URL and returns a DataGrid.

        Note: requires pyarrow to be installed.

        Example:
        ```python
        >>> dg = DataGrid.read_parquet("userdata1.parquet")
        ```
        """
        try:
            import pyarrow.parquet
        except Exception:
            raise Exception("DataGrid.read_parquet() requires pyarrow") from None

        filename = download_filename(filename)
        table = pyarrow.parquet.read_table(filename, **kwargs)
        data = table.to_pylist()
        dg = DataGrid(data=data)
        if "." in filename:
            dg_filename, extension = filename.rsplit(".", 1)
            dg.name = dg_filename
            dg.filename = dg_filename + ".datagrid"
        else:
            dg.name = filename
            dg.filename = filename + ".datagrid"
        return dg

    @classmethod
    def read_dataframe(cls, dataframe, **kwargs):
        """
        Takes a columnar pandas dataframe and returns a DataGrid.

        Example:
        ```python
        >>> dg = DataGrid.read_dataframe(df)
        ```
        """
        print("Reading DataFrame...")
        columns = list(dataframe.columns)
        data = [list(row) for r, row in ProgressBar(dataframe.iterrows())]
        return DataGrid(data=data, columns=columns, **kwargs)

    @classmethod
    def read_json(cls, filename, **kwargs):
        """
        Read JSON data, or JSON or JSON Line files [1]. JSON should be a
        list of objects, or a series of objects, one per line.

        Args:
            filename: the name of the file or URL to read the JSON from,
                or the data
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
        >>> from kangas import DataGrid
        >>> dg = DataGrid.read_json("json_line_file.json")
        >>> dg = DataGrid.read_json("https://instances.social/instances.json")
        >>> dg = DataGrid.read_json("https://company.com/data.json.zip")
        >>> dg = DataGrid.read_json("https://company.com/data.json.gz")
        >>> dg.save()
        ```
        """
        print("Reading JSON data...")
        filename = download_filename(filename)

        try:
            dg = DataGrid(**kwargs)

            if os.path.isfile(filename):
                fp = open(filename)

                if "." in filename:
                    dg_filename, extension = filename.rsplit(".", 1)
                    dg.name = dg_filename
                    dg.filename = dg_filename + ".datagrid"
                else:
                    dg.name = filename
                    dg.filename = filename + ".datagrid"
            else:
                # filename is the data? Let's see:
                fp = io.StringIO(filename)

            json_lines = fp.read(1) == "{"
            fp.seek(0)
            if json_lines:
                for line in ProgressBar(fp):
                    dg.append(json.loads(line))
            else:
                dg.extend(json.load(fp))

            return dg
        except Exception:
            raise Exception(
                "Unable to find JSON file, or parse JSON data: %r" % filename
            )

    @classmethod
    def read_datagrid(cls, filename, **kwargs):
        """
        Read (load) a datagrid file.

        Args:
            kwargs: any keyword to pass to the DataGrid constructor

        Example:
        ```python
        >>> dg = DataGrid.read_datagrid("mnist.datagrid")
        ```
        """
        return DataGrid(filename, **kwargs)

    @classmethod
    def read_csv(
        cls,
        filename,
        header=0,
        sep=",",
        quotechar='"',
        datetime_format=None,
        heuristics=False,
        converters=None,
    ):
        """
        Takes a CSV filename and returns a DataGrid.

        Args:
            filename: the CSV file to import
            header: (optional, int) row number (zero-based) of column headings
            sep: (optional, str) used in the CSV parsing
            quotechar: (optional, str) used in the CSV parsing
            datetime_format: (optional, str) the datetime format
            heuristics: (optional, bool) whether to guess that some float values are
                datetime representations
            converters: (optional, dict) A dictionary of functions for converting values
                in certain columns. Keys are column labels.

        Example:
        ```python
        >>> dg = DataGrid.read_csv("results.csv")
        ```
        """
        if not isinstance(header, int) or isinstance(header, bool):
            raise ValueError(
                "header should be an int indicating header row (zero-based)"
            )

        columns = None
        read_header = False
        data = []
        filename = download_filename(filename)
        print("Loading CSV file %r..." % filename)
        with open(filename) as csvfile:
            reader = csv.reader(csvfile, delimiter=sep, quotechar=quotechar)
            for r, row in ProgressBar(enumerate(reader)):
                if header is not None:
                    if not read_header:
                        if header == r:
                            columns = row
                            read_header = True
                            continue
                # Don't read any rows if header > 0
                if header is not None and r < header:
                    continue

                columns = columns if columns else create_columns(len(row))

                data.append(
                    [
                        convert_string_to_value(
                            value,
                            heuristics,
                            datetime_format,
                            colname,
                            converters,
                        )
                        for (value, colname) in zip(row, columns)
                    ]
                )

        dg = DataGrid(data=data, columns=columns)
        if "." in filename:
            dg_filename, extension = filename.rsplit(".", 1)
            dg.name = dg_filename
            dg.filename = dg_filename + ".datagrid"
        else:
            dg.name = filename
            dg.filename = filename + ".datagrid"
        return dg

    def info(self):
        """
        Display information about the DataGrid.

        Example:
        ```python
        >>> dg.info()
        DataGrid (on disk)
            Name   : coco-500-with-bbox
            Rows   : 500
            Columns: 7
        #   Column                Non-Null Count DataGrid Type
        --- -------------------- --------------- --------------------
        1   ID                               500 INTEGER
        2   Image                            500 IMAGE-ASSET
        3   Score                            500 FLOAT
        4   Confidence                       500 FLOAT
        5   Filename                         500 TEXT
        6   Category 5                       500 TEXT
        7   Category 10                      500 TEXT
        ```
        """
        widths = (3, 20, 15, 20)
        line_format = "%%-%ss %%-%ss %%%ss %%-%ss" % widths
        print("DataGrid (%s)" % tuple(["on disk" if self._on_disk else "in memory"]))
        print("    Name   :", self.name)
        print("    Rows   :", format(self.nrows, ","))
        print("    Columns:", format(len(self.get_columns()), ","))
        print(line_format % ("#", "Column", "Non-Null Count", "DataGrid Type"))
        print(
            line_format
            % ("-" * widths[0], "-" * widths[1], "-" * widths[2], "-" * widths[3])
        )
        for c, column in enumerate(self.get_columns()):
            if not self._on_disk:
                not_null_count = len(
                    [
                        1
                        for row in self._data
                        if column in row and not is_null(row[column])
                    ]
                )
            else:
                not_null_count = self.select_count(where="{'%s'} is not None" % column)
            print(
                line_format
                % (
                    c + 1,
                    column[: widths[1]],
                    format(not_null_count, ","),
                    self._columns[column],
                )
            )

    def head(self, n=5):
        """
        Display the last n rows of the DataGrid.

        Args:
            n: (optional, int) number of rows to show

        Example:
        ```python
        >>> dg.head()
                 row-id              ID           Score      Confidence        Filename
                      1          391895 0.4974163872616 0.5726406230662 COCO_val2014_00
                      2          522418 0.3612518386682 0.8539611863547 COCO_val2014_00
                      3          184613 0.1060265192042 0.1809083103203 COCO_val2014_00
                      4          318219 0.8879546879811 0.2918134509273 COCO_val2014_00
                      5          554625 0.5889039105388 0.8253719528139 COCO_val2014_00
        [500 rows x 4 columns]
        ```
        """
        nrows = self.nrows
        return self._display_rows(n, nrows, range(min(n, nrows)))

    def tail(self, n=5):
        """
        Display the last n rows of the DataGrid.
        Args:
            n: (optional, int) number of rows to show

        Example:
        ```python
        >>> dg.tail()
                 row-id              ID           Score      Confidence        Filename
                    496          391895 0.4974163872616 0.5726406230662 COCO_val2014_00
                    497          522418 0.3612518386682 0.8539611863547 COCO_val2014_00
                    498          184613 0.1060265192042 0.1809083103203 COCO_val2014_00
                    499          318219 0.8879546879811 0.2918134509273 COCO_val2014_00
                    500          554625 0.5889039105388 0.8253719528139 COCO_val2014_00

        [500 rows x 4 columns]
        ```
        """
        nrows = self.nrows
        return self._display_rows(
            n, nrows, reversed(range(nrows - 1, max(nrows - n - 1, -1), -1))
        )

    def _display_rows(self, n, nrows, enumerator):
        output = self._display_rows_string(n, nrows, enumerator)

        if output:
            if _in_jupyter_environment():
                from IPython.display import HTML, display

                display(HTML("<table>%s</table>" % output))
            else:
                print(output)
        else:
            print("DataGrid is empty")

    def _display_rows_string(self, n, nrows, enumerator, header=True, footer=True):
        if nrows == 0:
            return

        in_jupyter = _in_jupyter_environment()

        widths = []
        for column in ["row-id"] + self.get_columns():
            # FIXME: make widths dynamic
            widths.append(15)

        class Output:
            def __init__(self):
                self.output = []
                self.accum = ""

            def escape(self, value):
                return str(value)

            def display(self, value, width, header=False, colspan=1, style=""):
                if in_jupyter:
                    if header:
                        self.output.append("<th colspan='%s' %s>" % (colspan, style))
                    else:
                        self.output.append("<td colspan='%s' %s>" % (colspan, style))
                self.output.append(
                    ("%" + ("%s.%s" % (width, width)) + "s") % self.escape(value)
                )
                if in_jupyter:
                    if header:
                        self.output.append("</th>")
                    else:
                        self.output.append("</td>")

            def end_row(self):
                if in_jupyter:
                    self.output.append("<tr>")
                self.accum += " ".join(self.output) + "\n"
                if in_jupyter:
                    self.output.append("</tr>")
                self.output = []

        output = Output()
        if header:
            for c, column in enumerate(["row-id"] + self.get_columns()):
                output.display(column, widths[c], header=True)
            output.end_row()

        for i in enumerator:
            row = [i + 1] + self[i]
            for c, column in enumerate(["row-id"] + self.get_columns()):
                output.display(row[c], widths[c])
            output.end_row()

        if footer:
            output.end_row()
            totals = "[%d rows x %d columns]" % (nrows, len(self.get_columns()))
            output.display(
                totals,
                len(totals),
                colspan=len(self.get_columns()) + 1,
                style='style="text-align: left;"',
            )
            output.end_row()

        return output.accum

    def get_columns(self):
        """
        Get the public-facing, non-hidden columns. Returns
        a list of strings.

        Example:
        ```python
        >>> dg.get_columns()
        ['ID', 'Image', 'Score', 'Confidence', 'Filename']
        ```
        """
        return [
            column_name
            for column_name in self._columns
            if column_name != "row-id" and not column_name.endswith("--metadata")
        ]

    def _convert_values_row_dict(self, row_dict):
        # Guaranteed to have self._columns by now
        # Change row_dict in place
        for column_name, value in row_dict.items():
            # First, convert to a value
            new_value = convert_to_value(
                value,
                self.heuristics,
                self.datetime_format,
                column_name,
                self.converters,
            )
            # Get the first element of a row with type:
            if column_name not in self._columns or self._columns[column_name] is None:
                self._columns[column_name] = pytype_to_dgtype(new_value)
            # Then, make sure it is correct type
            try:
                row_dict[column_name] = convert_to_type(
                    new_value, self._columns[column_name]
                )
            except Exception:
                raise Exception(
                    "Invalid type for column %r: value was %r, but should have been type %r"
                    % (column_name, value, self._columns[column_name])
                ) from None

        # After conversion, apply a row-level conversion:
        convert_row_dict(row_dict, self.converters)

    def _scale_value(self, value, column_name, stats):
        if stats[column_name]["type"] == "VECTOR":
            return value
        elif (
            (stats[column_name]["minimum"] is not None)
            and (stats[column_name]["maximum"] is not None)
            and (stats[column_name]["maximum"] != stats[column_name]["minimum"])
        ):
            return (value - stats[column_name]["minimum"]) / (
                stats[column_name]["maximum"] - stats[column_name]["minimum"]
            )
        else:
            return value

    def append_iou_columns(self, image_column_name, layer1, layer2):
        """
        Add Intersection Over Union columns between two layers
        on an image column.
        """
        # First, let's find the labels on the image masks:
        labels = []
        for row in self.to_dicts([image_column_name]):
            image_kg = row[image_column_name]
            if image_kg:
                layers = image_kg.deserialize().metadata["annotations"]
                if layers:
                    annotations1 = get_annotations_from_layers(layers, layer1)
                    annotations2 = get_annotations_from_layers(layers, layer2)
                    labels = get_labels_from_annotations(annotations1)
                    labels += get_labels_from_annotations(annotations2)
                    break
        # Now, we'll add a pair of columns for each label (viz and value):
        for label in set(labels):
            self.append_iou_column(image_column_name, layer1, layer2, label)

    def append_iou_column(
        self, image_column_name, layer1, layer2, label, new_column=None
    ):
        """
        Add Intersection Over Union columns between two layers
        on an image column.
        """
        from .image import Image

        if new_column is None:
            new_column = "%s (%s vs %s) %s Image" % (
                image_column_name,
                layer1,
                layer2,
                label,
            )
            new_column_iou = "%s (%s vs %s) %s Value" % (
                image_column_name,
                layer1,
                layer2,
                label,
            )
        else:
            new_column_iou = "%s Value" % new_column

        new_column = self._verify_column(new_column)
        new_column_iou = self._verify_column(new_column_iou)

        new_data = [[], []]
        for row in ProgressBar(self.to_dicts([image_column_name])):
            image_kg = row[image_column_name]
            if image_kg:
                image = image_kg.to_pil()
                layers = image_kg.metadata["annotations"]
                annotations1 = get_annotations_from_layers(layers, layer1)
                annotations2 = get_annotations_from_layers(layers, layer2)
                mask1 = mask2 = None
                if annotations1:
                    mask1 = get_mask_from_annotations(annotations1, label)
                if annotations2:
                    mask2 = get_mask_from_annotations(annotations2, label)
                if mask1 and mask2:
                    new_image = Image(image)
                    bitmap1 = expand_mask(mask1, label)
                    bitmap2 = expand_mask(mask2, label)
                    intersection = sum(bitmap1 & bitmap2)
                    union = sum(bitmap1 | bitmap2)
                    layer1_mask = (bitmap1 & np.logical_not(bitmap2)) * 1
                    layer2_mask = (bitmap2 & np.logical_not(bitmap1)) * 2
                    both_mask = (bitmap1 & bitmap2) * 3
                    new_mask = layer1_mask + layer2_mask + both_mask
                    new_mask = new_mask.reshape((mask2["width"], mask1["height"]))
                    map = {1: layer1, 2: layer2}
                    if both_mask.sum() > 0:
                        map[3] = "intersection"
                    new_image.add_mask(map, new_mask)
                    new_data[0].append(new_image)
                    new_data[1].append((intersection / union) if union > 0 else None)
                else:
                    new_data[0].append(None)
                    new_data[1].append(None)
            else:
                new_data[0].append(None)
                new_data[1].append(None)
        self.append_columns([new_column, new_column_iou], new_data)

    def remove_unused_assets(self):
        """
        Remove any assets that don't have a reference to them
        from the datagrid table.
        """
        # First, get all columns that are -ASSET
        schema = self.get_schema()
        columns = [
            column["field_name"]
            for column in schema.values()
            if column["type"].endswith("-ASSET")
        ]
        # Delete any asset that is not used
        cursor = self.conn.cursor()
        cursor.execute(
            """DELETE FROM assets WHERE asset_id NOT IN (SELECT asset_id FROM datagrid WHERE {where});""".format(
                where=" OR ".join(
                    ["%s = assets.asset_id" % column for column in columns]
                )
            )
        )
        result = cursor.rowcount
        self.conn.commit()
        if result > 0:
            print("Deleted %s unused assets" % result)
            self._compute_stats()

    def remove_rows(self, *row_ids):
        """
        Remove specific rows, and any associated assets.
        """
        if self._on_disk:
            cursor = self.conn.cursor()
            cursor.execute(
                "DELETE from datagrid where column_0 in ({row_ids})".format(
                    row_ids=",".join(["'%s'" % x for x in row_ids])
                )
            )
            result = cursor.rowcount
            self.conn.commit()
            if result > 0:
                print("Deleted %s items" % result)
                # renumber row_ids:
                self.conn.execute("""VACUUM""")
                self.conn.execute("""UPDATE datagrid SET column_0 = rowid""")
                self.conn.commit()
                self.remove_unused_assets()
        else:
            raise Exception("unable to delete rows from in-memory data")

    def remove_columns(self, *column_names):
        """
        Delete columns from the saved DataGrid.

        Args:
            column_names: list of column names to delete

        Example:
        ```python
        >>> dg = kg.DataGrid(columns=["a", "b"])
        >>> dg.save()
        >>> dg.remove_columns("a")
        ```
        """
        if self._on_disk:
            schema = self.get_schema()
            columns = [column_name for column_name in column_names]
            columns += [column_name + "--metadata" for column_name in column_names]
            cursor = self.conn.cursor()
            for column_name in columns:
                if column_name in schema:
                    # 1. Get column field name:
                    column_field = schema[column_name]["field_name"]

                    # If the column we are deleting is an asset type
                    # then we need to delete the asset:
                    if schema[column_name]["type"].endswith("--ASSET"):
                        # Get all of the asset_ids to delete from assets
                        asset_ids = [
                            x[0]
                            for x in cursor.execute(
                                "SELECT {column_field} from datagrid;"
                            ).fetchall()
                        ]
                        cursor.execute(
                            "DELETE from assets where asset_id in ({asset_ids})".format(
                                asset_ids=",".join(["'%s'" % x for x in asset_ids])
                            )
                        )
                        self.conn.commit()

                    # 2. Remove column
                    del self._columns[column_name]

                    # 4. Update and clear cache:
                    delete_column_sql = (
                        """ALTER TABLE datagrid DROP COLUMN {column_field};""".format(
                            column_field=column_field,
                        )
                    )
                    cursor.execute(delete_column_sql)
                    self.conn.commit()
            # 3. re-create the schema, drops all metadata/stats
            self._create_schema(self._columns)
            self._compute_stats()
        else:
            raise Exception("unable to delete column from in-memory data")

    def append_column(self, column_name, rows, verify=True):
        """
        Append a column to the DataGrid.

        Args:
            column_name: column name to append
            rows: list of values
            verify: (optional, bool) if True, verify the data

        NOTE: `rows` is a list of values, one for each row.

        Example:
        ```python
        >>> dg.append_column("New Column Name", ["row1", "row2", "row3", "row4"])
        ```
        """
        ## FIXME: make sure not repeating column name
        if self._on_disk:
            if isinstance(rows, str):
                expr = rows
                rows = [
                    row[column_name]
                    for row in self.select(
                        computed_columns={column_name: expr}, to_dicts=True
                    )
                ]

            if self.nrows != len(rows):
                raise Exception("invalid number of rows to append")

            self._append_col_to_db(column_name, rows, verify)

        else:
            if isinstance(rows, str):
                raise Exception(
                    "can't append a computed column to an in-memory DataGrid"
                )

            if len(self._data) != len(rows):
                raise Exception("invalid number of rows to append")

            # add to self._columns
            self._columns.update(
                {self._verify_column(column_name, len(self._columns) + 1): None}
            )

            # append to data
            for r, row in enumerate(rows):
                row_dict = {column_name: row}
                if verify:
                    # verify each and every row
                    self._convert_values_row_dict(row_dict)
                    column_types = self._verify_row_dict(row_dict, [column_name])
                    self._check_column_types(column_types)

                self._data[r].update(row_dict)

    def append_columns(self, columns, rows=None, verify=True):
        """
        Append columns to the DataGrid.

        Args:
            columns: list of column names to append if rows is given
               or dictionary of column names as keys, and column
               rows as values.
            rows: (optional, list) list of list of values per row
            verify: (optional, bool) if True, verify the data

        Example:
        ```python
        >>> dg = kg.DataGrid(columns=["a", "b"])
        >>> dg.append([11, 12])
        >>> dg.append([21, 22])
        >>> dg.append_columns(
        ...     ["New Column 1", "New Column 2"],
        ...     [
        ...      ["row1 col1",
        ...       "row2 col1"],
        ...      ["row1 col2",
        ...       "row2 col2"],
        ...     ])
        >>> dg.append_columns(
        ...     {"New Column 3": ["row1 col3",
        ...                       "row2 col3"],
        ...      "New Column 4": ["row1 col4",
        ...                       "row2 col4"],
        ...     })
        >>> dg.info()
        row-id   a   b  New Column 1  New Column 2  New Column 3  New Column 4
             1  11  12     row1 col1     row1 col2     row1 col3     row1 col4
             2  21  22     row2 col1     row2 col2     row2 col3     row2 col4
        [2 rows x 6 columns]
        ```
        """
        if rows is None:
            for column_name, column_rows in columns.items():
                self.append_column(column_name, column_rows, verify)
        else:
            for column_name, column_rows in zip(columns, rows):
                self.append_column(column_name, column_rows, verify)

    def pop(self, index):
        """
        Pop a row by index from an in-memory DataGrid.

        Args:
            index: (int) position (zero-based) of row to remove

        Example:
        ```python
        >>> row = dg.pop(0)
        ```
        """
        if self._on_disk:
            raise Exception("Popping from a DataGrid on disk is not currently possible")

        return self._data.pop(index)

    def append(self, row):
        """
        Append this row onto the datagrid data.

        Example:
        ```python
        >>> dg.append(["column 1 value", "column 2 value", ...])
        ```
        """
        if self._on_disk:
            raise Exception(
                "Appending to a DataGrid on disk is slow: use DataGrid.extend([row, row, ...]) instead"
            )

        self.extend([row])

    def get_asset_ids(self):
        """
        Get all of the asset IDs from the DataGrid.

        Returns a list of asset IDs.
        """
        if self._on_disk:
            sql = "SELECT asset_id FROM assets;"
            cursor = self.conn.cursor()
            return [row[0] for row in cursor.execute(sql).fetchall()]
        else:
            raise Exception("an in-memory DataGrid doesn't have assets; save first")

    def extend(self, rows, verify=True):
        """
        Extend the datagrid with the given rows.

        Example:
        ```python
        >>> dg.extend([
        ...     ["row 1, column 1 value", "row 1, column 2 value", ...],
        ...     ["row 2, column 1 value", "row 2, column 2 value", ...],
        ...     ...,
        ... ])
        ```
        """
        if len(rows) == 0:
            return

        # First, check to see if we have columns yet.
        # If not, we add them here
        if self._columns == {}:
            if isinstance(rows[0], dict):
                self._columns = {"row-id": "ROW_ID"}
                column_names = self._verify_column_list(rows[0].keys())
                self._columns.update(
                    {
                        self._verify_column(column_name, i): None
                        for i, column_name in enumerate(column_names)
                    }
                )
            else:
                self._columns = create_columns(len(rows[0]))

        if self._on_disk:
            ## Append to disk
            # Do all of the expensive things once here
            schema = self.get_schema()
            field_name_map = {
                column_name: schema[column_name]["field_name"] for column_name in schema
            }
            index = self.nrows + 1
            # Get datagrid ready to append:
            self._asset_id_cache = set(self.get_asset_ids())
            self.cursor = self.conn.cursor()
            print("Extending data...")
            for row in ProgressBar(rows):
                if not isinstance(row, (dict,)):
                    row_dict = {
                        column_name: value
                        for column_name, value in zip(self.get_columns(), row)
                    }
                else:
                    row_dict = {
                        column_name: value for column_name, value in row.items()
                    }
                if verify:
                    # verify each and every row
                    self._convert_values_row_dict(row_dict)
                    column_types = self._verify_row_dict(row_dict)
                    self._check_column_types(column_types)

                self._append_row_dict_to_db(index, row_dict, field_name_map)
                index += 1
            self.conn.commit()
            self._asset_id_cache = None

            # Deletes and recomputes metadata:
            self._compute_stats()
        else:
            ## Append to memory
            for row in rows:
                if not isinstance(row, (dict,)):
                    # public columns will create columns, if it doesn't exist
                    row_dict = {
                        column_name: item
                        for column_name, item in zip(self.get_columns(), row)
                    }
                else:
                    row_dict = row.copy()
                if verify:
                    # verify each and every row
                    self._convert_values_row_dict(row_dict)
                    column_types = self._verify_row_dict(row_dict)
                    self._check_column_types(column_types)

                # we'll add row_id for consistency
                row_dict["row-id"] = len(self._data) + 1
                self._data.append(row_dict)

    def _append_col_to_db(self, column_name, rows, verify=True):
        # Get datagrid ready to append:
        self._asset_id_cache = set(self.get_asset_ids())
        self.cursor = self.conn.cursor()

        # 1. Add new columns for type inference:
        self._columns[column_name] = None
        new_column_names = set([column_name])

        # 2. Log all new data:
        data = []
        for index, item in enumerate(rows):
            # Join on rowid:
            row_dict = {column_name: item}
            if verify:
                # verify each and every row
                self._convert_values_row_dict(row_dict)
                column_types = self._verify_row_dict(row_dict)
                self._check_column_types(column_types)

            if hasattr(item, "metadata") and item.metadata:
                metadata_json = _convert_with_assets_to_json(item.metadata, self)
                metadata_column_name = "%s--metadata" % column_name
                row_dict[metadata_column_name] = metadata_json
                self._columns[metadata_column_name] = "JSON"
                new_column_names.add(metadata_column_name)

            # Now we replace assets with asset_id:
            row_dict[column_name] = self._log_and_serialize_item(
                item, column_name, row_id=index + 1
            )
            data.append(row_dict)

        # 3. Final type check for new columns (checks all):
        self._columns = {
            column_name: (ctype if ctype is not None else "TEXT")
            for column_name, ctype in self._columns.items()
        }

        # 4. re-create the schema; clears all metadata/stats
        self._create_schema(self._columns)

        # 5. create a temp in-memory table with data
        new_columns = {}  # DG type
        new_columns.update(
            {
                column_name: column_type
                for column_name, column_type in self._columns.items()
                if column_name in new_column_names
            }
        )

        cursor = self.conn.cursor()
        # use all columns to get proper field_name (eg, column_16):
        field_names = self._get_fields(self._columns)[-len(new_columns) :]
        field_types = self._sql_types(new_columns.values())
        for (field_name, field_type) in zip(field_names, field_types):
            add_column_sql = (
                """ALTER TABLE datagrid ADD COLUMN {field_name} {field_type}""".format(
                    field_name=field_name, field_type=field_type
                )
            )
            cursor.execute(add_column_sql)
        self.conn.commit()

        # 6. copy the data into datagrid
        for index, row in enumerate(data, start=1):
            for column_name, field_name in zip(new_columns, field_names):
                field_value = row.get(column_name)
                sql_update = "UPDATE datagrid SET %s = ? where column_0 = ?" % (
                    field_name,
                )
                cursor.execute(sql_update, [field_value, index])
        self.conn.commit()

        self._asset_id_cache = None

        # Update and clear cache:
        self._compute_stats()

    def _append_row_dict_to_db(self, index, row_dict, field_name_map):
        # Only for user-suppplied columns; collects column names
        # as a side efect, it logs the assets!
        new_columns = {}
        for column_name, item in row_dict.items():
            # First, add metadata columns before obj has been replaced
            # with asset_id:
            if hasattr(item, "metadata") and item.metadata:
                metadata_json = _convert_with_assets_to_json(item.metadata, self)
                metadata_column_name = "%s--metadata" % column_name
                new_columns[metadata_column_name] = metadata_json

            # Now we replace assets with asset_id:
            new_columns[column_name] = self._log_and_serialize_item(
                item, column_name, row_id=index
            )

        row_dict.update(new_columns)

        # Add row-id:
        row_dict["row-id"] = index

        # SQL insert as a dict:
        field_dict = {
            field_name_map[column_name]: value
            for column_name, value in row_dict.items()
        }
        field_names = ", ".join(field_dict.keys())
        value_names = ", ".join([":" + field_name for field_name in field_dict])
        self.cursor.execute(
            "INSERT INTO datagrid (%s) VALUES (%s)" % (field_names, value_names),
            field_dict,
        )

    def get_schema(self):
        """
        Get the DataGrid schema.

        Example:
        ```python
        >>> dg.get_schema()
        {'row-id': {'field_name': 'column_0', 'type': 'ROW_ID'},
         'ID': {'field_name': 'column_1', 'type': 'INTEGER'},
         'Image': {'field_name': 'column_2', 'type': 'IMAGE-ASSET'},
         'Score': {'field_name': 'column_3', 'type': 'FLOAT'},
         'Confidence': {'field_name': 'column_4', 'type': 'FLOAT'},
         'Filename': {'field_name': 'column_5', 'type': 'TEXT'},
         'Category 5': {'field_name': 'column_6', 'type': 'TEXT'},
         'Category 10': {'field_name': 'column_7', 'type': 'TEXT'},
         'Image--metadata': {'field_name': 'column_8', 'type': 'JSON'}}
        ```
        """
        if self._on_disk:
            if self._schema is None:
                sql = "SELECT * FROM metadata;"
                cursor = self.conn.cursor()
                results = cursor.execute(sql).fetchall()
                self._schema = {
                    row[0]: {
                        "field_name": row[1],
                        "type": row[2],
                    }
                    for row in results
                }

            return self._schema
        else:
            raise Exception("DataGrid needs to be saved first")

    def _check_column_types(self, column_types):
        column_types = self._unify_types(column_types)
        for column_name, column_type in column_types.items():
            if not self._on_disk:
                self._columns[column_name] = column_type

    def _unify_types(self, column_types):
        """
        See if datagrid types can be made compatible.
        """
        retval = {}
        for column_name, column_type in column_types.items():
            if is_null(column_type):
                # Get the type from system; ok
                retval[column_name] = self._columns[column_name]
            elif is_null(self._columns[column_name]):
                # This can't happen after saving; ok
                retval[column_name] = column_types[column_name]
            elif column_type == self._columns[column_name]:
                # Same, good; ok
                retval[column_name] = column_type
            elif (column_type in ["FLOAT", "INTEGER"]) and (
                self._columns[column_name] in ["FLOAT", "INTEGER"]
            ):
                # They are different; will need to cast to proper type
                # later if on_disk; ok
                retval[column_name] = "FLOAT"
            elif (column_type in ["JSON", "VECTOR"]) and (
                self._columns[column_name] in ["JSON", "VECTOR"]
            ):
                retval[column_name] = "JSON"
            elif (column_type in ["BOOLEAN", "INTEGER"]) and (
                self._columns[column_name] in ["BOOLEAN", "INTEGER"]
            ):
                # They are different; will need to cast to proper type
                # later if on_disk; ok
                retval[column_name] = "BOOLEAN"
            elif (column_type in ["INTEGER", "FLOAT", "DATETIME"]) and (
                self._columns[column_name] in ["INTEGER", "FLOAT", "DATETIME"]
            ):
                # They are different; will need to cast to proper type
                # later if on_disk; ok
                retval[column_name] = "DATETIME"
            else:  # When all else fails
                # May need to cast to proper type
                # later if on_disk; ok
                retval[column_name] = "TEXT"
        return retval

    def _get_completions(self, obj, completions, path=""):
        """
        Return the nested keys of this object
        """
        completions[path].add(type(obj).__name__)
        if isinstance(obj, dict):
            for key in obj:
                self._get_completions(obj[key], completions, path + "." + key)

    def _get_type(self, item):
        """
        Get the DataGrid type for an unknown object.
        """
        return pytype_to_dgtype(item)

    def _verify_type(self, type_name):
        """
        Verify that the given type name is valid.
        """
        type_name = type_name.upper()
        if type_name not in DATAGRID_TYPES:
            raise Exception(
                "%r is not a valid datagrid type: should be one of: %s"
                % (type_name, list(DATAGRID_TYPES.keys()))
            )
        return type_name

    def _verify_column(self, name, index=0):
        """
        Verify that the given name is a valid datagrid name.
        """
        name = str(name).strip()

        # Remove quotes, tabs, and newlines
        name.replace('"', "").replace("'", "").replace("\t", "").replace(
            "\n", ""
        ).replace(":", "").replace(",", "")

        if name.upper() in RESERVED_NAMES:
            raise Exception("DataGrid column name %r cannot be a reserved name" % name)

        if not name:
            name = "Column %s" % (index + 1)

        if len(name) > self.MAX_COL_NAME_LENGTH:
            raise Exception("DataGrid column name %r is too long" % name)

        return name

    def _verify_column_list(self, columns):
        """
        Verify all of the column names.
        """
        # Must be unique
        if len(columns) != len(set(columns)):
            raise Exception("Column names must be unique")

        if len(columns) > self.MAX_COLS:
            LOGGER.warning(
                "Number of columns (%s) exceeds DataGrid.MAX_COLS recommendation (%s)"
                % (len(columns), self.MAX_COLS)
            )

        return [
            self._verify_column(column_name, c) for c, column_name in enumerate(columns)
        ]

    def _verify_row_dict(self, row_dict, columns=None):
        """
        Verify a row of data.
        """
        columns = columns if columns else self.get_columns()
        unknown_columns = list((set(row_dict) - set(columns)) - set(["row-id"]))
        if unknown_columns:
            raise Exception("New data has extra columns: %r" % (unknown_columns,))

        if len(self._data) + 1 > self.MAX_ROWS:
            LOGGER.warning(
                "Number of rows (%s) exceeds DataGrid.MAX_ROWS recommendation (%s)"
                % (len(self._data) + 1, self.MAX_ROWS)
            )

        return self._verify_col_types(row_dict)

    def _verify_col_types(self, row_dict):
        """
        Ensures that all column types of data are known.
        """
        column_types = {}
        for column_name, value in row_dict.items():
            my_type = self._get_type(value)
            if my_type not in [None, "ROW_ID"] and my_type not in DATAGRID_TYPES:
                raise ValueError(
                    "DataGrid data column %r has invalid type %r"
                    % (column_name, my_type)
                )
            column_types[column_name] = my_type

        return column_types

    def _sql_type(self, type):
        """
        Adjust the types for the database.
        """
        if type.endswith("-ASSET"):
            return "TEXT"
        elif type == "ROW_ID":
            return "INTEGER"
        else:
            return type

    def _sql_types(self, types):
        """
        Adjust the datatype names for the database.
        """
        return [self._sql_type(name.upper()) for name in types]

    def _build_fields_and_types(self, columns, types):
        """
        Construct the column names and types for a database
        construction command.
        """
        return ", ".join(
            [
                "%s %s" % (field_name, type_name)
                for (field_name, type_name) in zip(self._get_fields(columns), types)
            ]
        )

    def _get_fields(self, columns):
        """
        Construct the field names from columns.
        """
        return ["column_%s" % i for i in range(len(columns))]

    def select_count(self, where="1"):
        """
        Get the count of items given a where expression.

        Args:
            where: a Python expression where column names are
                written as {"Column Name"}.

        Example:
        ```python
        >>> dg.select_count("{'column 1'} > 0.5")
        894
        ```
        """
        if not self._on_disk:
            raise Exception("Unable to select_count before saving")

        return self.select(where, count=True)

    def select_dataframe(
        self,
        where="1",
        sort_by=None,
        sort_desc=False,
        computed_columns=None,
        limit=None,
        offset=0,
    ):
        """
        Perform a selection on the database, including possibly a
        query, and returning rows in various sort orderings.

        Args:
            where: (optional, str) a Python expression where column names are
                written as {"Column Name"}.
            sort_by: (optional, str) name of column to sort on
            sort_desc: (optional, bool) sort descending?
            limit: (optional, int) select at most this value
            offset: (optional, int) start selection at this offset
            computed_columns: (optional, dict) a dictionary with the keys
                being the column name, and value is a string describing the
                expression of the column. Uses same syntax and semantics
                as the filter query expressions.

        Example:
        ```python
        >>> df = dg.select_dataframe("{'column name 1'} == {'column name 2'} and {'score'} < -1")
        ```
        """
        try:
            import pandas
        except ImportError:
            raise Exception("DataGrid.select_dataframe() requires pandas")

        results = self.select(
            where=where,
            sort_by=sort_by,
            sort_desc=sort_desc,
            to_dicts=True,
            count=False,
            computed_columns=computed_columns,
            limit=limit,
            offset=offset,
        )
        if results:
            columns = results[0].keys()
            return pandas.DataFrame(data=results, columns=columns)

    def select(
        self,
        where="1",
        sort_by=None,
        sort_desc=False,
        to_dicts=False,
        count=False,
        computed_columns=None,
        limit=None,
        offset=0,
        debug=False,
    ):
        """
        Perform a selection on the database, including possibly a
        query, and returning rows in various sort orderings.

        Args:
            where: (optional, str) a Python expression where column names are
                written as {"Column Name"}.
            sort_by: (optional, str) name of column to sort on
            sort_desc: (optional, bool) sort descending?
            limit: (optional, int) select at most this value
            offset: (optional, int) start selection at this offset
            to_dicts: (optional, cool) if True, return the rows in dicts where
                the keys are the column names.
            count: (optional, bool) if True, return the count of matching rows
            computed_columns: (optional, dict) a dictionary with the keys
                being the column name, and value is a string describing the
                expression of the column. Uses same syntax and semantics
                as the filter query expressions.

        Example:
        ```python
        >>> dg.select("{'column name 1'} == {'column name 2'} and {'score'} < -1")
        [
           ["row 1, column 1 value", "row 1, column 2 value", ...],
           ["row 2, column 1 value", "row 2, column 2 value", ...],
           ...
        ]
        ```
        """
        from ..server.queries import query_sql

        if not self._on_disk:
            raise Exception("Unable to select before saving")

        schema = self.get_schema()
        column_name_map = {
            schema[column_name]["field_name"]: column_name for column_name in schema
        }

        results = query_sql(
            self,
            column_name_map,
            where,
            sort_by,
            sort_desc,
            count,
            computed_columns,
            limit,
            offset,
            debug=debug,
        )
        if count:
            return results
        else:
            if to_dicts:
                return [
                    {
                        column_name: self._raw_value_to_asset(value)
                        for column_name, value in row.items()
                    }
                    for row in results
                ]
            else:
                return [
                    [self._raw_value_to_asset(value) for value in row.values()]
                    for row in results
                ]

    def save(self, filename=None, create_thumbnails=None):
        """
        Create the SQLite database on disk.

        Args:
            filename: (optional, str) the name of the filename
                to save to
            create_thumbnails: (optional, bool) if True, then
                create thumbnail images for assets

        Example:
        ```python
        >>> dg.save()
        ```
        """
        if self._on_disk:
            if filename is None or filename == self.filename:
                self.create_thumbnails = (
                    self.create_thumbnails
                    if create_thumbnails is None
                    else create_thumbnails
                )
                print("Saving settings to %r..." % self.filename)
                self._save_settings(
                    heuristics=self.heuristics,
                    datetime_format=self.datetime_format,
                    name=self.name,
                    create_thumbnails=self.create_thumbnails,
                )
                return
            else:
                raise Exception(
                    "a saved DataGrid cannot be currently saved to another file"
                )

        filename = filename if filename else self.filename
        if filename == "untitled.datagrid" and self.name == "Untitled":
            filename = os.path.join(tempfile.mkdtemp(), "untitled.datagrid")

        self.create_thumbnails = (
            self.create_thumbnails if create_thumbnails is None else create_thumbnails
        )

        # Final check and conversion on column types:
        self._columns = {
            column_name: (ctype if ctype is not None else "TEXT")
            for column_name, ctype in self._columns.items()
        }

        # Go through the data again, to make sure all values are
        # the correct type.
        # Collect all of the extra columns (row-id, --metadata):
        new_columns = {"row-id": "ROW_ID"}  # DG type
        new_columns.update(
            {
                column_name: column_type
                for column_name, column_type in self._columns.items()
            }
        )
        print("Saving data...")
        for row in ProgressBar(self._data):
            for column_name in row:
                row[column_name] = convert_to_type(
                    row[column_name], self._columns[column_name]
                )
                if hasattr(row[column_name], "metadata") and row[column_name].metadata:
                    new_columns["%s--metadata" % column_name] = "JSON"

        field_types = self._sql_types(new_columns.values())
        field_types_names = self._build_fields_and_types(new_columns, field_types)

        drop_sql = "DROP TABLE IF EXISTS datagrid;"
        create_sql = (
            """CREATE TABLE IF NOT EXISTS datagrid ({field_types_names})""".format(
                field_types_names=field_types_names
            )
        )

        print("Saving datagrid to %r..." % filename)
        self.conn = sqlite3.connect(str(filename))

        self.conn.execute(drop_sql)
        self.conn.execute(create_sql)

        drop_assets_sql = "DROP TABLE IF EXISTS assets;"
        create_assets_sql = (
            "CREATE TABLE IF NOT EXISTS assets "
            + "(asset_id TEXT, asset_type TEXT, asset_data BLOB, asset_metadata JSON, asset_thumbnail BLOB);"
        )
        self.conn.execute(drop_assets_sql)
        self.conn.execute(create_assets_sql)
        self._create_schema(new_columns)
        self._create_settings(
            heuristics=self.heuristics,
            datetime_format=self.datetime_format,
            name=self.name,
            create_thumbnails=self.create_thumbnails,
        )

        self._on_disk = True
        self.extend(self._data, verify=False)
        self.filename = filename
        self._data = []
        self._schema = None
        schema = self.get_schema()
        self._columns = {
            column_name: schema[column_name]["type"] for column_name in schema
        }

    def _create_settings(self, **settings):
        drop_settings_sql = "DROP TABLE IF EXISTS settings;"
        create_settings_sql = """CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT)"""

        self.conn.execute(drop_settings_sql)
        self.conn.execute(create_settings_sql)

        if settings:
            self._save_settings(**settings)

    def set_about(self, markdown):
        """
        Set the about page for this DataGrid.

        Args:
            markdown: (str) the text of the markdown About text
        """
        self._save_settings(about=markdown)

    def set_about_from_script(self, filename):
        """
        Set the about page for this DataGrid.

        Args:
            filename: (str) the file that created the DataGrid
        """
        markdown = python_to_markdown(filename)
        self._save_settings(about=markdown)

    def get_about(self):
        """
        Get the about page for this DataGrid.
        """
        self._load_settings()
        return self.about

    def display_about(self):
        """
        Display the about page for this DataGrid as markdown.

        Note: this requires being in an IPython-like environment.
        """
        from IPython.display import Markdown, display

        self._load_settings()
        display(Markdown(self.about))

    def _save_settings(self, **settings):

        try:
            self.conn.cursor("""SELECT COUNT(*) from settings;""")
        except Exception:
            # Doesn't exist yet
            self._create_settings()

        insert_settings_sql = (
            """INSERT OR REPLACE INTO settings (name, value) VALUES (?,?);"""
        )
        cursor = self.conn.cursor()
        for (name, value) in settings.items():
            cursor.execute(insert_settings_sql, [name, value])
        self.conn.commit()

    def _load_settings(self):
        select_settings_sql = """SELECT * from settings;"""

        def dict_factory(cursor, row):
            d = {}
            for idx, col in enumerate(cursor.description):
                d[col[0]] = row[idx]
            return d

        self.conn.row_factory = dict_factory

        type_map = {
            "heuristics": bool,
            "datetime_format": str,
            "name": str,
            "create_thumbnails": bool,
            "about": str,
        }

        for row in self.conn.execute(select_settings_sql):
            setattr(
                self, row["name"], _convert_setting(row["value"], type_map[row["name"]])
            )

        self.conn.row_factory = None

    def _create_schema(self, new_columns):
        drop_metadata_sql = "DROP TABLE IF EXISTS metadata;"
        create_metadata_sql = """CREATE TABLE IF NOT EXISTS metadata (name TEXT, field_name TEXT, type TEXT, minimum FLOAT, maximum FLOAT, average FLOAT, variance FLOAT, total FLOAT, stddev FLOAT, other JSON)"""
        insert_metadata_sql = (
            """INSERT INTO metadata (name, field_name, type) VALUES (?,?,?)"""
        )

        self.conn.execute(drop_metadata_sql)
        self.conn.execute(create_metadata_sql)

        cursor = self.conn.cursor()
        for i, (column_name, column_type) in enumerate(new_columns.items()):
            field_name = "column_%s" % i
            cursor.execute(insert_metadata_sql, [column_name, field_name, column_type])
        self.conn.commit()
        self._schema = None

    def _compute_stats(self, columns=None):
        """
        Compute the stats and metadata for all columns.
        """
        insert_metadata_sql = """UPDATE metadata SET minimum = ?, maximum = ?, average = ?, variance = ?, total = ?, stddev= ? , other = ? WHERE name = ?;"""

        if columns is not None:
            schema = self.get_schema()
            columns = {name: schema[name] for name in columns}
        else:
            columns = self.get_schema()

        data = []
        print("Computing statistics...")
        for col_name in ProgressBar(columns):
            col_type = columns[col_name]["type"]
            field_name = columns[col_name]["field_name"]
            if col_type in ["FLOAT", "INTEGER", "ROW_ID"]:
                row = self.conn.execute(
                    """SELECT MIN({field_name}),
                              MAX({field_name}),
                              AVG({field_name}),
                              TOTAL({field_name}),
                              COUNT({field_name}),
                              COUNT(DISTINCT {field_name}) from datagrid;""".format(
                        field_name=field_name
                    )
                ).fetchone()
                minimum, maximum, avg, total, count, count_unique = row

                other = json.dumps({"count": count, "count_unique": count_unique})
                ## FIXME: somebody check my math:
                deviations = []
                for row in self.conn.execute(
                    """SELECT {field_name} from datagrid;""".format(
                        field_name=field_name
                    )
                ):
                    if not is_null(row[0]):
                        deviations.append((row[0] - avg) ** 2)

                variance = sum(deviations) / count if count > 0 else None
                if not is_null(variance):
                    stddev = math.sqrt(variance)
                    # min, max, avg, variance, total, stddev, other, name
                    data.append(
                        [
                            minimum,
                            maximum,
                            avg,
                            variance,
                            total,
                            stddev,
                            other,
                            col_name,
                        ]
                    )
                else:
                    # min, max, avg, variance, total, stddev, other, name
                    data.append(
                        [minimum, maximum, avg, variance, total, None, other, col_name]
                    )

            elif col_type == "VECTOR":
                # min, max, avg, variance, total, stddev, other, name
                data.append(
                    [
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        col_name,
                    ]
                )

            elif col_type == "JSON":
                rows = self.conn.execute(
                    "SELECT {field_name} from datagrid;".format(field_name=field_name)
                )
                completions = defaultdict(set)
                for row in rows:
                    # get key, type from all rows for fields
                    if row[0]:
                        json_data = json.loads(row[0])
                        self._get_completions(json_data, completions)

                completions_serialized = json.dumps(
                    {
                        "completions": {
                            key: list(value) for key, value in completions.items()
                        }
                    }
                )

                # min, max, avg, variance, total, stddev, other, name
                data.append(
                    [
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        completions_serialized,
                        col_name,
                    ]
                )

            elif col_type == "DATETIME":
                row = self.conn.execute(
                    "SELECT MIN({field_name}), MAX({field_name}), TOTAL({field_name}) from datagrid;".format(
                        field_name=field_name
                    )
                ).fetchone()
                # min, max, avg, variance, total, stddev, other, name
                data.append(
                    [
                        row[0],
                        row[1],
                        None,
                        None,
                        row[2],
                        None,
                        None,
                        col_name,
                    ]
                )
            elif col_type.endswith("-ASSET"):
                # min, max, avg, variance, total, stddev, other, name
                stats = DATAGRID_TYPES[col_type]["get_statistics"](
                    self, col_name, field_name
                )
                if stats:
                    data.append(stats)
            else:
                if col_type == "TEXT":
                    row = self.conn.execute(
                        """SELECT COUNT({field_name}), COUNT(DISTINCT {field_name}) from datagrid;""".format(
                            field_name=field_name
                        )
                    ).fetchone()
                    count, count_unique = row
                    other = json.dumps(
                        {
                            "completions": {"": ["str"]},
                            "count": count,
                            "count_unique": count_unique,
                        }
                    )
                else:
                    other = None
                # min, max, avg, variance, total, stddev, other, name
                data.append(
                    [
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        other,
                        col_name,
                    ]
                )

        cursor = self.conn.cursor()
        for row in data:
            cursor.execute(insert_metadata_sql, row)
        self.conn.commit()

    def _log_and_serialize_data(self):
        """
        Log and serialize each row.
        """
        return [
            {
                column_name: self._log_and_serialize_item(
                    value, column_name, row_id=index + 1
                )
                for index, (column_name, value) in enumerate(row_dict.items())
            }
            for row_dict in self._data
        ]

    def _log_and_serialize_item(self, item, column_name, row_id=None):
        """
        Log and serialize each column of data.
        """
        if is_null(item):
            return None

        ctype = self._get_type(item)

        if ctype in DATAGRID_TYPES:
            return DATAGRID_TYPES[ctype]["serialize"](self, item, row_id)
        else:
            raise ValueError(
                "unable to serialize %r in column %r" % (item, column_name)
            )

    def get_metadata(self):
        from ..server.queries import get_metadata

        if self._on_disk:
            return get_metadata(self.conn)
        else:
            return None

    def _log(self, asset_id, asset_type, asset_data, metadata, row_id):
        """
        Log the asset. As a side-effect, possibly create a thumbnail.

        NOTE: asset_thumbnail is:
            * bytes, if there is one
            * None, if one hasn't been made yet
            * "", if you should use original
        """
        if asset_id not in self._asset_id_cache:
            # Possible recusion, just on metadata:
            json_string = _convert_with_assets_to_json(metadata, self)
            # Log to database
            # If we should make a thumbnail, do it
            if self.create_thumbnails and asset_type in ["Image"]:
                ## FIXME: check metadata "source" to retrieve from file or URL
                if "annotations" in metadata and metadata["annotations"]:
                    annotations = json.loads(metadata["annotations"])
                else:
                    annotations = None
                asset_thumbnail = generate_thumbnail(
                    asset_data, annotations=annotations
                )
            else:
                asset_thumbnail = None  # means one hasn't been created yet
            self.cursor.execute(
                "INSERT INTO assets (asset_id, asset_type, asset_data, asset_metadata, asset_thumbnail) VALUES (?, ?, ?, ?, ?);",
                [asset_id, asset_type, asset_data, json_string, asset_thumbnail],
            )
            self._asset_id_cache.add(asset_id)

    def upgrade(self):
        """
        Upgrade to latest version of datagrid.
        """
        self._upgrade_table("asset_id", "asset_metadata", "assets")
        schema = self.get_schema()
        computed_stats = False
        for column_name in schema:
            if (
                column_name.endswith("--metadata")
                and schema[column_name]["type"] == "JSON"
            ):
                self._upgrade_table(
                    "column_0", schema[column_name]["field_name"], "datagrid"
                )
                self._compute_stats([column_name])
                computed_stats = True
        if not computed_stats:
            self._compute_stats()

    def _upgrade_table(self, column_id_name, column_metadata_name, table_name):
        """
        Upgrade to latest version of datagrid.
        """
        env = {
            "column_id_name": column_id_name,
            "column_metadata_name": column_metadata_name,
            "table_name": table_name,
        }
        sql = (
            "SELECT {column_id_name}, {column_metadata_name} FROM {table_name};".format(
                **env
            )
        )
        sql_update = "UPDATE {table_name} SET {column_metadata_name} = ? where {column_id_name} = ?".format(
            **env
        )

        cursor = self.conn.cursor()
        rows = list(cursor.execute(sql).fetchall())

        count = 0
        for row in ProgressBar(rows):
            asset_id, asset_json_string = row
            try:
                asset_json = json.loads(asset_json_string)
            except Exception:
                asset_json = {}

            # old style: "overlays": [{"label": "motorcycle", "type": "boxes",
            # "data": [[[359.17, 146.17], [471.62, 359.74]]], "score": 0.9247971465564591},
            # {"label": "person", "type": "regions", "data": [[352.55, 146.82, 35...]]}, ...]

            # new style: {"annotations": [
            #   {"name": str_layername,
            #    "data": [{"label": str, "boxes": [], "points": [], "score": float, "id": str}, ...]}]}

            if "overlays" in asset_json:
                data = []
                asset_json["annotations"] = [
                    {
                        "name": "(uncategorized)",
                        "data": data,
                    }
                ]
                for overlay in asset_json["overlays"]:
                    if overlay["type"] == "boxes":
                        data.append(
                            {
                                "label": overlay["label"],
                                "boxes": [_verify_box(box) for box in overlay["data"]],
                                "points": None,
                                "id": None,
                                "score": overlay["score"],
                                "metadata": (
                                    overlay["metadata"]
                                    if "metadata" in overlay
                                    else None
                                ),
                            }
                        )
                    if overlay["type"] == "regions":
                        data.append(
                            {
                                "label": overlay["label"],
                                "points": overlay["data"],
                                "boxes": None,
                                "id": None,
                                "score": overlay["score"],
                                "metadata": (
                                    overlay["metadata"]
                                    if "metadata" in overlay
                                    else None
                                ),
                            }
                        )
                del asset_json["overlays"]

            elif "annotations" in asset_json:
                for annotation in asset_json["annotations"]:
                    if isinstance(annotation, dict) and "data" in annotation:
                        for data in annotation["data"]:
                            if "regions" in data:
                                data["points"] = data["regions"]
                                data["id"] = None
                                del data["regions"]

            asset_json_new = json.dumps(asset_json)
            if asset_json_new != asset_json_string:
                cursor.execute(sql_update, [asset_json_new, asset_id])
                count += 1

        self.conn.commit()
        print("Updated %s assets" % count)
