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

import ast
import io
import json
import logging
import math
import os
import re
import sqlite3
import statistics
import string
import time
import urllib
from collections import Counter, defaultdict

import numpy as np
import PIL.Image
import PIL.ImageDraw

from ..datatypes.utils import (
    generate_thumbnail,
    get_color,
    image_to_fp,
    is_nan,
    pytype_to_dgtype,
)
from .computed_columns import unify_computed_columns, update_state
from .utils import (
    Cache,
    pickle_loads_embedding_unsafe,
    process_about,
    safe_compile,
    safe_env,
)

LOGGER = logging.getLogger(__name__)
KANGAS_ROOT = os.environ.get("KANGAS_ROOT", ".")
MAX_CATEGORIES = 20
HISTOGRAM_BINS = 10

CUSTOM_CODE_INIT = """
import matplotlib.pyplot as plt
import matplotlib
from PIL import Image, ImageDraw
import json
import numpy as np
from traceback import format_exc
import math
"""

VALID_CHARS = string.ascii_letters + string.digits + "_"

PROJECTION_TRACE_CACHE = Cache(100)
PROJECTION_EMBEDDING_CACHE = Cache(50)


def sqlite_query_explain(
    filename,
    database,
    filter="1",
    select=None,
    computed_columns=None,
    column_map=None,
    sort_by=None,
    sort_desc=True,
    limit=None,
):
    """
    A generic SQLite query interface, using the Python-to-SQL
    translator.

    Args:
        filename: (str) path to SQLite database
        database: (str) name of table in database
        filter: (str, optional) Python-like string filter
        select: (list of str, optional) list of column names to select
        computed_columns: (optional) dict of column names to expressions
        column_map: (optional) dict of column name to field name
        sort_by: (str, optional) name of column to sort by
        sort_desc: (bool, optional) sort descending?
        limit: (int, optional) number of rows to select

    Examples:
    ```
    column_map = {"Score": "column_3"}
    filter = '{"Score"} > 0.5'
    computed_columns = {
        "Score + 1": '{"Score"} + 1',
        "Score + 2": '{"Score + 1"} + 1',
    }

    explanation = sqlite_query_explain(
        "coco-500.datagrid", "datagrid", filter,
        computed_columns=computed_columns,
        column_map=column_map)
    ```
    """
    explanation = next(
        sqlite_query(
            filename,
            database,
            filter,
            select,
            computed_columns,
            column_map,
            sort_by,
            sort_desc,
            limit,
            explain=True,
        )
    )
    return explanation


def sqlite_query(
    filename,
    database,
    filter="1",
    select=None,
    computed_columns=None,
    column_map=None,
    sort_by=None,
    sort_desc=True,
    limit=None,
    explain=False,
):
    """
    A generic SQLite query interface, using the Python-to-SQL
    translator.

    Args:
        filename: (str) path to SQLite database
        database: (str) name of table in database
        filter: (str, optional) Python-like string filter
        select: (list of str, optional) list of column names to select
        computed_columns: (optional) dict of column names to expressions
        column_map: (optional) dict of column name to field name
        sort_by: (str, optional) name of column to sort by
        sort_desc: (bool, optional) sort descending?
        limit: (int, optional) number of rows to select

    Examples:
    ```
    column_map = {"Score": "column_3"}
    filter = '{"Score"} > 0.5'
    computed_columns = {
        "Score + 1": '{"Score"} + 1',
        "Score + 2": '{"Score + 1"} + 1',
    }

    for row in sqlite_query("coco-500.datagrid", "datagrid", filter,
                            computed_columns=computed_columns,
                            column_map=column_map):
        print(row)
    ```
    """
    if os.path.isfile(filename):
        conn = sqlite3.connect(filename)
    else:
        raise Exception("file not found: %r" % filename)

    add_python_functions(conn)
    unify_computed_columns(computed_columns)

    columns = [
        row[0]
        for row in conn.execute("SELECT name FROM pragma_table_info(?);", (database,))
    ]

    if column_map is None:
        metadata = {}
    else:
        for column_name, field_name in column_map.items():
            if field_name in columns:
                columns.remove(field_name)
                columns.append(column_name)
        metadata = {
            key: {"field_expr": value, "field_name": value}
            for key, value in column_map.items()
        }

    metadata.update(
        {
            row[0]: {"field_expr": row[0], "field_name": row[0]}
            for row in conn.execute(
                "SELECT name FROM pragma_table_info(?);", (database,)
            )
        }
    )

    select_expr_as = [metadata[column]["field_name"] for column in columns]
    databases = [database]

    # Side-effects: updates metadata, database, columns, select_expr_as:
    where = update_state(
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        filter,
    )

    select_fields = [metadata[column]["field_name"] for column in columns]
    if sort_by is None:
        order_by = ""
    else:
        sort_by_field_name = metadata[sort_by]["field_name"]
        sort_desc = "DESC" if sort_desc else "ASC"
        order_by = f"ORDER BY {sort_by_field_name} {sort_desc}"

    if limit is None:
        limit = ""
    else:
        limit = f"LIMIT {limit}"

    env = {
        "limit": limit,
        "order_by": order_by,
        "where": where,
        "select_expr_as": ", ".join(select_expr_as),
        "select_fields": ", ".join(select_fields),
        "databases": ", ".join(databases),
    }
    select_sql = (
        "SELECT {select_expr_as} FROM {databases} WHERE {where} {order_by} {limit}"
    )

    select_command = select_sql.format(**env)

    if explain:
        yield select_command
        return

    for row in conn.execute(select_command):
        data = {name: value for name, value in zip(columns, row)}
        if select is None:
            yield data
        else:
            yield {key: data[key] for key in select}


def parse_comma_separated_values(string):
    retval = []
    for value in string.split(","):
        value = value.replace("&comma;", ",")

        if value in ["", "null", "None"]:
            retval.append(None)
            continue

        # Scientific notation
        match = re.match(r"^([-+]?[\d]+\.?[\d]*[Ee](?:[-+]?[\d]+)?)$", value)
        if match:
            try:
                retval.append(float(match.groups()[0]))
            except Exception:
                retval.append(value)
        else:
            # integers
            match = re.match(r"^([-+]?[\d]+)$", value)
            if match:
                try:
                    retval.append(int(match.groups()[0]))
                except Exception:
                    retval.append(value)
            else:
                # floating point numbers
                match = re.match(r"^([-+]?[\d]+\.?[\d]*)$", value)
                if match:
                    try:
                        retval.append(float(match.groups()[0]))
                    except Exception:
                        retval.append(value)
                else:  # string
                    retval.append(value)
    return retval


# based on: https://stackoverflow.com/questions/2298339/standard-deviation-for-sqlite
class StdevFunc:
    def __init__(self):
        self.M = 0.0
        self.S = 0.0
        self.k = 0

    def step(self, value):
        try:
            value = float(value)
            tM = self.M
            self.k += 1
            self.M += (value - tM) / self.k
            self.S += (value - tM) * (value - self.M)
        except Exception:
            pass

    def finalize(self):
        if self.k <= 1:
            return None
        return math.sqrt(self.S / (self.k - 1))  # To use MySQL version, change to k-2


def FLATTEN(lists):
    if lists:
        try:
            return str(
                [item for sublist in ast.literal_eval(lists) for item in sublist]
            )
        except Exception:
            pass

    return "[]"


def SPLIT(string, delim=None, maxsplit=-1):
    if string:
        return str(string.split(delim, maxsplit))
    else:
        return ""


def KEYS_OF(obj):
    if obj:
        try:
            return str(list(ast.literal_eval(obj).keys()))
        except Exception:
            pass

    return "[]"


def VALUES_OF(obj):
    if obj:
        try:
            return str(list(ast.literal_eval(obj).values()))
        except Exception:
            pass

    return "[]"


def LENGTH(string_or_obj):
    ## Comes in as a string, but might be "[...]"
    if string_or_obj:
        try:
            return len(ast.literal_eval(string_or_obj))
        except Exception:
            return len(string_or_obj)
    return 0


def RANGE(start, end=None, step=None):
    try:
        if step is not None:
            return str(tuple(range(start, end, step)))
        elif end is not None:
            return str(tuple(range(start, end)))
        else:
            return str(tuple(range(start)))
    except Exception:
        return None


def SUM_OF_LIST(string_or_obj):
    ## Comes in as a string, but might be "[...]"
    if string_or_obj:
        try:
            return sum(ast.literal_eval(string_or_obj))
        except Exception:
            return sum(string_or_obj)
    return 0


def MEAN(string_or_obj):
    ## Comes in as a string, but might be "[...]"
    if string_or_obj:
        try:
            return statistics.mean(ast.literal_eval(string_or_obj))
        except Exception:
            return statistics.mean(string_or_obj)
    return 0


def IN_OBJ(item, string_or_obj):
    if string_or_obj:
        try:
            return item in list(ast.literal_eval(string_or_obj))
        except Exception:
            return item in string_or_obj
    return False


def ANY_IN_GROUP(group):
    if group:
        try:
            decoded_group = ast.literal_eval(group)
        except Exception:
            decoded_group = None
        if isinstance(decoded_group, list):
            group_decoded = [x for x in decoded_group]
            return any(group_decoded)

    return False


def ALL_IN_GROUP(group):
    ## This varies from Python semantics: if you are looking for all
    ## then it doesn't make sense to return True if the list
    ## is empty
    if group:
        try:
            decoded_group = ast.literal_eval(group)
        except Exception:
            decoded_group = None
        if isinstance(decoded_group, list):
            group_decoded = [x for x in decoded_group]
        group_decoded = [x for x in decoded_group]
        return all(group_decoded)

    return False


def process_results(value):
    if value is True:
        return "1"
    elif value is False:
        return "0"
    else:
        return repr(value)


def unescape(string):
    if string:
        return string.replace("&#39;", "'").replace("&#34;", '"').replace("&#44;", ",")
    else:
        return ""


def ListComprehension(x, y, gen, ifs):
    ## [x for y in gen ifs]
    results = []
    gen = unescape(gen)
    if gen:
        x, y = unescape(x), unescape(y)
        code = safe_compile(x)
        env = safe_env()
        try:
            ## FIXME: a string that is a number is json-like
            decoded_gen = json.loads(gen)
        except Exception:
            # Maybe a list with single-quoted strings
            try:
                decoded_gen = ast.literal_eval(gen)
            except Exception:
                decoded_gen = gen

        ## first, we prepare ifs:
        if ifs:
            decoded_ifs = [unescape(exp) for exp in ifs.split(",")]
        else:
            decoded_ifs = []
        compiled_ifs = [safe_compile(exp) for exp in decoded_ifs]

        # dict:
        if isinstance(decoded_gen, dict):
            env[y] = decoded_gen

            # Short circuit logic:
            doit = all(eval(exp, env) for exp in compiled_ifs)

            if doit:
                try:
                    result = eval(code, env)
                except Exception:
                    result = None
                if result is not None:
                    results.append(process_results(result))
        else:
            # List of dicts:
            for row in decoded_gen:
                # so that item.key will be found:
                env[y] = row

                doit = all([eval(exp, env) for exp in compiled_ifs])

                if not doit:
                    continue

                try:
                    result = eval(code, env)
                except Exception:
                    result = None
                if result is not None:
                    results.append(process_results(result))
    retval = "[" + (",".join(results)) + "]"
    return retval


def add_python_functions(conn):
    conn.create_aggregate("STDEV", 1, StdevFunc)
    conn.create_function("ANY_IN_GROUP", 1, ANY_IN_GROUP)
    conn.create_function("ALL_IN_GROUP", 1, ALL_IN_GROUP)
    conn.create_function("FLATTEN", 1, FLATTEN)
    conn.create_function("SPLIT", -1, SPLIT)
    conn.create_function("LENGTH", 1, LENGTH)
    conn.create_function("RANGE", -1, RANGE)
    conn.create_function("SUM_OF_LIST", 1, SUM_OF_LIST)
    conn.create_function("MEAN", 1, MEAN)
    conn.create_function("KEYS_OF", 1, KEYS_OF)
    conn.create_function("VALUES_OF", 1, VALUES_OF)
    conn.create_function("IN_OBJ", 2, IN_OBJ)
    conn.create_function("ListComprehension", 4, ListComprehension)


def get_database_connection(dgid):
    db_path = get_dg_path(dgid)
    conn = sqlite3.connect(db_path)
    add_python_functions(conn)
    return conn


def get_completions(dgid, computed_columns):
    db_path = get_dg_path(dgid)
    conn = sqlite3.connect(db_path)
    unify_computed_columns(computed_columns)
    rows = conn.execute("SELECT name, other, type from metadata;").fetchall()
    if computed_columns:
        rows.extend(
            [(key, None, computed_columns[key]["type"]) for key in computed_columns]
        )
    results = defaultdict(set)
    constructs = [
        "AVG()",
        "COUNT()",
        "MAX()",
        "MIN()",
        "None",
        "STDEV()",
        "SUM()",
        "TOTAL()",
        "True",
        "False",
        "abs()",
        "all([])",
        "and",
        "any([])",
        "avg([])",
        "datetime",
        "for",
        "flatten()",
        "if TEST else VALUE",
        "in",
        "is",
        "is None",
        "is not",
        "is not None",
        "len()",
        "math",
        "max()",
        "min()",
        "not",
        "or",
        "random",
        "range()",
        "round()",
        "statistics",
        "sum()",
    ]
    for expr in constructs:
        trigger = expr[:1]
        results[" " + trigger].add(expr)
        if trigger != trigger.lower():
            results[" " + trigger.lower()].add(expr)

    results["datetime."] = [
        "date()",
        "datetime()",
    ]
    results["random."] = [
        "randint()",
        "random()",
    ]
    results["statistics."] = ["mean()"]
    results["math."] = [
        "acos()",
        "acosh()",
        "asin()",
        "asinh()",
        "atan()",
        "atan2()",
        "atanh()",
        "ceil()",
        "cos()",
        "cosh()",
        "degrees()",
        "exp()",
        "floor()",
        "log()",
        "log10()",
        "log2()",
        "pi",
        "radians()",
        "sin()",
        "sinh()",
        "sqrt()",
        "tan()",
        "tanh()",
        "trunc()",
    ]
    string_methods = [
        "split()",
        "upper()",
        "lower()",
        "strip()",
        "lsrtip()",
        "rstrip()",
        "endswith()",
        "startswith()",
    ]
    for method in string_methods:
        results["." + method + "."].update([x for x in string_methods if x != method])

    for row in rows:
        name, other, datatype = row
        name = name if not name.endswith("--metadata") else name[:-10]
        results["{"].add('"%s"' % name)
        if not other:
            # No metadata, but add methods for datatypes here:
            if datatype == "TEXT":
                results['{"%s"}.' % (name,)].update(string_methods)
        else:
            try:
                other = json.loads(other)
            except Exception:
                continue

            results["["].add('[x for x in {"%s"}]' % name)
            if "completions" in other:
                for comp in other["completions"].keys():
                    types = other["completions"][comp]
                    if comp == "":
                        if "str" in types:
                            results['{"%s"}.' % (name,)].update(string_methods)
                        if "dict" in types:
                            results['{"%s"}.' % (name,)].add("keys()")
                            results['{"%s"}.' % (name,)].add("values()")
                        continue

                    elif comp.count(".") == 1:
                        path = "."
                        item = comp[1:]
                    else:
                        path, item = comp.rsplit(".", 1)

                    if not path.endswith("."):
                        new_path = path + "."
                    else:
                        new_path = path

                    if all(ch in VALID_CHARS for ch in item):
                        results['{"%s"}%s' % (name, new_path)].add(item)
                        results['{"%s"}%s' % (name, new_path)].add("keys()")
                        results['{"%s"}%s' % (name, new_path)].add("values()")

                        item_path = (path + "." + item) if path != "." else ("." + item)
                        if not item_path.endswith("."):
                            item_path += "."

                        if "str" in types:
                            results['{"%s"}%s' % (name, item_path)].update(
                                string_methods
                            )
                        elif "dict" in types:
                            results['{"%s"}%s' % (name, item_path)].add("keys()")
                            results['{"%s"}%s' % (name, item_path)].add("values()")

    return {key: sorted(list(value)) for key, value in results.items()}


"""
strings:
"""


def get_metadata(conn):
    try:
        return _get_metadata(conn)
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL ERROR: %s", exc)
        raise Exception(str(exc))


def _get_metadata(conn):
    """
    Get the metadata for all columns.

    Returns a dict indexed by the user's names for columns,
    mapped to the metadata.
    """
    metadata_sql = "SELECT * FROM metadata"
    metadata = conn.execute(metadata_sql).fetchall()
    return {
        row[0]: {
            "name": row[0],
            "field_name": row[1],
            "field_expr": row[1],
            "type": row[2],
            "minimum": row[3],
            "maximum": row[4],
            "average": row[5],
            "variance": row[6],
            "total": row[7],
            "stddev": row[8],
            "other": json.loads(row[9]) if row[9] else None,
        }
        for row in metadata
    }


def plural(count, noun):
    if noun.endswith("'"):
        nouns = noun
    elif count == 0 or count > 1:
        if noun.endswith("s") or noun.endswith("x"):
            nouns = noun + "es"
        else:
            nouns = noun + "s"
    else:
        nouns = noun

    return "%s %s" % (count, nouns)


def histogram(cur, metadata, values, column):
    statistics = {
        "count": 0,
        "min": 0,
        "max": 0,
        "mean": 0,
        "median": 0,
        "std": 0,
        "25%": 0,
        "50%": 0,
        "75%": 0,
        ## "count (NaN)": 0,
        "sum": 0,
    }
    stats = metadata[column]
    column_type = stats["type"]
    name = stats.get("name", column)

    if values:
        np_values = np.array(values, dtype=np.float_)
        np_values = np_values[~np.isnan(np_values)]
    else:
        # How can this happen? The field changed
        # probably using random.random()
        np_values = np.array([], dtype=np.float_)

    if "minimum" not in stats or stats["minimum"] is None:
        LOGGER.debug(
            "column %r does not have pre-computed stats; computing on the fly", column
        )
        if values:
            minimum = np_values.min().item()
            maximum = np_values.max().item()
        else:
            minimum = maximum = 0
    else:
        minimum = stats["minimum"]
        maximum = stats["maximum"]

    range = (minimum, maximum)
    LOGGER.debug("Computing histogram...")
    counts, labels = np.histogram(np_values, bins=HISTOGRAM_BINS, range=range)

    # Compute stats for this set:
    if values:
        try:
            quantiles = np.nanquantile(np_values, q=[0.25, 0.50, 0.75], axis=0)
            std = np.nanstd(np_values, axis=0, ddof=1).item()
            if is_nan(std):
                std = 0.0
            statistics = {
                "count": len(np_values),  # ok
                "min": np_values.min().item(),  # ok
                "max": np_values.max().item(),  # ok
                "mean": np.nanmean(np_values).item(),  # ok
                "median": np.nanmedian(np_values).item(),  # ok
                "std": std,  # ok
                "25%": quantiles[0].item(),  # ok
                "50%": quantiles[1].item(),  # ok
                "75%": quantiles[2].item(),  # ok
                ## "count (NaN)": "FIXME",
                "sum": np_values.sum().item(),  # ok
            }
        except Exception:
            LOGGER.debug("failed in computing statistics")

    LOGGER.debug("Done!")
    return {
        "type": "histogram",
        "bins": counts.tolist(),
        "labels": labels.tolist(),
        "min": minimum,
        "max": maximum,
        "columnType": column_type,
        "column": name,
        "statistics": statistics,
    }


def quote_value(value):
    # Escape single quote for SQL
    return "'%s'" % value.replace("'", "''")


def get_column_value(value, column_name, metadata):
    if value == "NULL" or value is None:
        return "NULL"

    column_type = metadata[column_name]["type"]

    if column_type == "TEXT":
        return quote_value(value)
    elif column_type == "FLOAT":
        return float(value)
    elif column_type == "INTEGER":
        return int(value)
    else:
        return value


def get_field_name(column, metadata):
    """
    Get field_name
    """
    if column in metadata:
        return metadata[column]["field_name"]
    else:
        return None


def get_field_expr(column, metadata):
    """
    Get field_expr
    """
    if column in metadata:
        return metadata[column]["field_expr"]
    else:
        raise Exception("no such column: %r" % column)


def get_column_type(column, metadata):
    if column in metadata:
        return metadata[column]["type"]
    raise Exception("no such column: %r" % column)


def get_dg_path(dgid):
    return os.path.join(KANGAS_ROOT, dgid)


def get_value_column_name(row, column_name, columns):
    index = columns.index(column_name)
    return row[index]


def get_type_column_name(column_name, columns, column_types):
    index = columns.index(column_name)
    column_type = column_types[index]
    if column_type.endswith("-ASSET"):
        name, asset = column_type.split("-", 1)
        return name.lower()
    else:
        raise Exception("Invalid use of get_type_column_name")


def select_group_by_rows(
    column_name, column_value, group_by, where_expr, metadata, cur, computed_columns
):
    distinct = False
    where = None

    unify_computed_columns(computed_columns)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    group_by_field_name = get_field_name(group_by, metadata)
    group_by_field_expr = get_field_expr(group_by, metadata)
    field_name = get_field_name(column_name, metadata)
    field_expr = get_field_expr(column_name, metadata)

    column_value = get_column_value(column_value, group_by, metadata)

    try:
        rows = get_group_by_rows(
            cur,
            group_by_field_name,
            group_by_field_expr,
            field_name,
            field_expr,
            column_value,
            where,
            databases,
            select_expr_as,
            distinct,
        )
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s", exc)
        raise Exception(str(exc))

    return rows


def get_group_by_rows(
    cur,
    group_by_field_name,
    group_by_field_expr,
    field_name,
    field_expr,
    column_value,
    where,
    databases,
    select_expr_as,
    distinct=False,
):
    env = {
        "group_by_field_name": group_by_field_name,
        "group_by_field_expr": group_by_field_expr,
        "field_name": field_name,
        "field_expr": field_expr,
        "column_value": column_value,
        "where": where,
        "databases": ", ".join(databases),
        "select_expr_as": ", ".join(select_expr_as),
        "distinct": "DISTINCT " if distinct else "",
    }

    select_sql = "SELECT value FROM (SELECT {select_expr_as}, {group_by_field_expr} AS {group_by_field_name}, GROUP_CONCAT({distinct}REPLACE(IFNULL({field_expr},'None'), ',', '&comma;')) as value FROM {databases} WHERE {where} GROUP BY {group_by_field_name}) WHERE {group_by_field_name} is {column_value}"
    selection_sql = select_sql.format(**env)

    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    cur.execute(selection_sql)
    LOGGER.debug("SQL %s seconds", time.time() - start_time)
    rows = cur.fetchall()
    return rows


def select_histogram(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    field_name = get_field_name(column_name, metadata)
    field_expr = metadata[column_name]["field_expr"]
    group_by_field_name = get_field_name(group_by, metadata)
    group_by_field_expr = get_field_expr(group_by, metadata)

    column_value = get_column_value(column_value, group_by, metadata)

    try:
        rows = get_group_by_rows(
            cur,
            group_by_field_name,
            group_by_field_expr,
            field_name,
            field_expr,
            column_value,
            where,
            databases,
            select_expr_as,
        )
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s", exc)
        raise Exception(str(exc))

    # These should be numbers:
    values = []
    if rows:
        row = rows[0]
        if row:
            if row[0]:
                values = parse_comma_separated_values(row[0])
            if not isinstance(values, (list, tuple)):
                values = [values]

    results_json = histogram(cur, metadata, values, column_name)

    results_json["groupBy"] = group_by
    results_json["groupByValue"] = column_value
    results_json["whereDescription"] = where_description
    results_json["computedColumns"] = computed_columns

    return results_json


def select_metadata(dgid):
    conn = get_database_connection(dgid)

    metadata = get_metadata(conn)

    return metadata


def select_description(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    column_type = metadata[column_name]["type"]
    field_name = get_field_name(column_name, metadata)
    field_expr = metadata[column_name]["field_expr"]
    group_by_field_name = get_field_name(group_by, metadata)
    group_by_field_expr = get_field_expr(group_by, metadata)

    column_value = get_column_value(column_value, group_by, metadata)

    try:
        rows = get_group_by_rows(
            cur,
            group_by_field_name,
            group_by_field_expr,
            field_name,
            field_expr,
            column_value,
            where,
            databases,
            select_expr_as,
        )
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s", exc)
        raise Exception(str(exc))

    results_json = {"type": "verbatim", "value": "", "columnType": column_type}

    if rows:
        row = rows[0]
        if row:
            if row[0]:
                delims = row[0].count(",")
                if delims == 0:
                    results_json["value"] = row[0]
                else:
                    results_json["value"] = plural(delims + 1, "value")

    return results_json


def select_category(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    """
    column_value is the value of the group_by column.
    """
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    column_type = metadata[column_name]["type"]
    field_name = get_field_name(column_name, metadata)
    field_expr = get_field_expr(column_name, metadata)
    group_by_field_name = get_field_name(group_by, metadata)
    group_by_field_expr = get_field_expr(group_by, metadata)

    column_value = get_column_value(column_value, group_by, metadata)

    try:
        rows = get_group_by_rows(
            cur,
            group_by_field_name,
            group_by_field_expr,
            field_name,
            field_expr,
            column_value,
            where,
            databases,
            select_expr_as,
        )
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s", exc)
        raise Exception(str(exc))

    # These are categories (ints or strings):
    results_json = {"type": "verbatim", "value": "", "columnType": column_type}
    if rows:
        row = rows[0]
        if row:
            raw_value = row[0]
            if raw_value:
                values = [v.replace("&comma;", ",") for v in raw_value.split(",")]
            else:
                values = []

            counts = Counter(values)
            length = len(values)
            unique_values = list(counts.keys())
            ulength = len(unique_values)

            if length == 0:
                results_json = {
                    "type": "verbatim",
                    "value": plural(length, "value"),
                    "columnType": column_type,
                }
            elif length == 1:
                results_json = {
                    "type": "verbatim",
                    "value": values[0],
                    "columnType": column_type,
                }
            elif ulength == 1:
                results_json = {
                    "type": "verbatim",
                    "value": "%s (%s of them)" % (values[0], length),
                    "columnType": column_type,
                }
            elif ulength > MAX_CATEGORIES:
                if length == ulength:
                    results_json = {
                        "type": "verbatim",
                        "value": plural(length, "unique value"),
                        "columnType": column_type,
                    }
                else:
                    results_json = {
                        "type": "verbatim",
                        "value": (
                            plural(length, "value")
                            + ", "
                            + ("%s %s" % (ulength, "unique"))
                        ),
                        "columnType": column_type,
                    }
            else:
                counts = {
                    key: value
                    for (key, value) in sorted(counts.items(), key=lambda item: item[1])
                }
                # values: {"Animal": 37, "Plant": 12}
                results_json = {
                    "type": "category",
                    "values": counts,
                    "column": column_name,
                    "columnType": column_type,
                    "groupBy": group_by,
                    "groupByValue": column_value,
                    "whereDescription": where_description,
                    "computedColumns": computed_columns,
                }

    return results_json


def select_asset_group_thumbnail(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    column_offset,
    computed_columns,
    where_expr,
    gallery_size,
    background_color,
    image_size,
    border_width,
    distinct,
):
    # get a gallery of images

    gallery_cols, gallery_rows = gallery_size
    column_limit = gallery_cols * gallery_rows
    background_color = tuple(background_color)
    image_size = tuple(image_size)

    results_json = select_asset_group(
        dgid,
        group_by,
        where,
        column_name,
        column_value,
        column_offset,
        column_limit,
        computed_columns,
        where_expr,
        distinct,
    )

    gallery_pixel_size = (
        (image_size[0] + border_width) * gallery_cols + border_width,
        (image_size[1] + border_width) * gallery_rows + border_width,
    )
    images = []
    for asset_id in results_json["values"]:
        image = select_asset(dgid, asset_id, thumbnail=True, return_image=True)
        background = PIL.Image.new(mode="RGBA", size=image_size, color=background_color)
        left = (background.size[0] - image_size[0]) // 2
        top = (background.size[1] - image_size[1]) // 2
        background.paste(image, (left, top))
        images.append(background)

    gallery_image = PIL.Image.new(
        mode="RGBA",
        size=gallery_pixel_size,
        color=background_color,
    )

    for i, image in enumerate(images):
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        location = (
            int((i % gallery_cols) * (image_size[0] + border_width)) + border_width,
            int((i // gallery_cols) * (image_size[1] + border_width)) + border_width,
        )
        gallery_image.paste(image, location)

    fp = image_to_fp(gallery_image, "png")
    return fp.read()


def select_asset_group(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    column_offset,
    column_limit,
    computed_columns,
    where_expr,
    distinct,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    column_types = [metadata[key]["type"] for key in columns]
    group_by_field_name = get_field_name(group_by, metadata)
    group_by_field_expr = get_field_expr(group_by, metadata)
    field_name = get_field_name(column_name, metadata)
    field_expr = get_field_expr(column_name, metadata)

    column_value = get_column_value(column_value, group_by, metadata)

    try:
        rows = get_group_by_rows(
            cur,
            group_by_field_name,
            group_by_field_expr,
            field_name,
            field_expr,
            column_value,
            where,
            databases,
            select_expr_as,
            distinct,
        )
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s", exc)
        raise Exception(str(exc))

    env = {
        "group_by_field_name": group_by_field_name,
        "field_name": field_name,
        "column_value": get_column_value(column_value, group_by, metadata),
        "where": where,
        "databases": ", ".join(databases),
        "select_expr_as": ", ".join(select_expr_as),
    }
    # These are assetIds (strings):
    select_sql = "SELECT value FROM (SELECT {select_expr_as}, COUNT({field_name}) as value FROM {databases} WHERE {where} GROUP BY {group_by_field_name}) WHERE {group_by_field_name} is {column_value};"
    selection_sql = select_sql.format(**env)
    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    try:
        cur.execute(selection_sql)
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s; %s", selection_sql, exc)
        raise Exception(str(exc))

    LOGGER.debug("SQL %s seconds", time.time() - start_time)
    total_rows = cur.fetchall()
    total = 0
    if total_rows:
        total_row = total_rows[0]
        if total_row:
            total = total_row[0]

    results_json = {
        "type": "asset-group",
        "assetType": get_type_column_name(column_name, columns, column_types),
        "values": [],
        "total": total,
    }
    if rows:
        row = rows[0]
        if row and row[0]:
            values = row[0].split(",")
            results_json = {
                "type": "asset-group",
                "assetType": get_type_column_name(column_name, columns, column_types),
                "values": values[column_offset : column_offset + column_limit]
                if column_limit is not None
                else values,
                "total": total,
            }
    return results_json


def select_asset_group_metadata(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    column_offset,
    column_limit,
    computed_columns,
    where_expr,
    distinct,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    group_by_field_name = get_field_name(group_by, metadata)
    group_by_field_expr = get_field_expr(group_by, metadata)
    field_name = get_field_name(column_name, metadata)
    field_expr = get_field_expr(column_name, metadata)

    column_value = get_column_value(column_value, group_by, metadata)

    try:
        rows = get_group_by_rows(
            cur,
            group_by_field_name,
            group_by_field_expr,
            field_name,
            field_expr,
            column_value,
            where,
            databases,
            select_expr_as,
            distinct,
        )
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s", exc)
        raise Exception(str(exc))

    # Return: {"layername": {"labels": [unique list of label names],
    #                        "scoreMin": number, "scoreMax": number}}
    summary = defaultdict(
        lambda: {"labels": defaultdict(lambda: {"scoreMin": None, "scoreMax": None})}
    )
    if rows:
        row = rows[0]
        if row and row[0]:
            # asset_ids:
            values = row[0].split(",")
            if column_limit is not None:
                values = str(
                    tuple(values[column_offset : column_offset + column_limit])
                )
            else:
                values = str(tuple(values))

            if values.endswith(",)"):
                values = values[:-2] + ")"

            if values == "()":
                return {}

            sql = """SELECT asset_metadata FROM assets WHERE asset_id IN {values}""".format(
                values=values,
            )
            cur.execute(sql)
            all_asset_metadata = cur.fetchall()
            for asset_metadata in all_asset_metadata:
                json_metadata = json.loads(asset_metadata[0])
                # Annotation structure:
                # {"annotations": [{
                #     "name": layername,
                #     "data": [{"label": label, "score": number}],
                #  }, ...
                #  ]
                # }
                if "annotations" in json_metadata:
                    for annotation_layer in json_metadata["annotations"]:
                        layer_name = (
                            annotation_layer["name"]
                            if "name" in annotation_layer
                            else "(uncategorized)"
                        )
                        if "data" in annotation_layer:
                            for annotation in annotation_layer["data"]:
                                if "label" in annotation and "score" in annotation:
                                    update_score(
                                        summary,
                                        layer_name,
                                        annotation,
                                        annotation["label"],
                                        annotation["score"],
                                    )
                                if "labels" in annotation and "scores" in annotation:
                                    scores = (
                                        annotation["scores"]
                                        if annotation["scores"]
                                        else {}
                                    )
                                    for label in annotation["labels"]:
                                        update_score(
                                            summary,
                                            layer_name,
                                            annotation,
                                            label,
                                            scores.get(label),
                                        )

    for layer_name in summary:
        minimum, maximum = None, None
        for label_name in summary[layer_name]["labels"]:
            scoreMin = summary[layer_name]["labels"][label_name]["scoreMin"]
            scoreMax = summary[layer_name]["labels"][label_name]["scoreMax"]
            if scoreMin:
                minimum = min(scoreMin, minimum) if minimum is not None else scoreMin
            if scoreMax:
                maximum = max(scoreMax, maximum) if maximum is not None else scoreMax
        summary[layer_name]["scoreMin"] = minimum
        summary[layer_name]["scoreMax"] = maximum
    return summary


def update_score(summary, layer_name, annotation, label, score):
    minimum = summary[layer_name]["labels"][label]["scoreMin"]
    maximum = summary[layer_name]["labels"][label]["scoreMax"]
    if score is not None:
        summary[layer_name]["labels"][label]["scoreMin"] = (
            min(score, minimum) if minimum is not None else score
        )
        summary[layer_name]["labels"][label]["scoreMax"] = (
            max(score, maximum) if maximum is not None else score
        )


def verify_where(
    dgid,
    computed_columns,
    where_expr,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]
    where = None

    # FIXME:
    # Add the where_expr as a computed column, and return that
    # too in order to give some auto-completion hints

    # Expand to include computed columns
    if computed_columns or where_expr:
        try:
            where_sql = update_state(
                computed_columns,
                metadata,
                databases,
                columns,
                select_expr_as,
                where_expr,
            )
            if where_sql:
                where = where_sql
        except Exception as exc:
            return {
                "valid": False,
                "message": repr(exc),
            }

    where = where if where else "1"

    env = {
        "where": where,
        "select_expr_as": ", ".join(select_expr_as),
        "databases": ", ".join(databases),
    }
    select_sql = "SELECT {select_expr_as} FROM {databases} WHERE {where} LIMIT 1;"

    selection_sql = select_sql.format(**env)
    LOGGER.debug("SQL %s", selection_sql)

    try:
        cur.execute(selection_sql)
    except sqlite3.OperationalError as exc:
        return {
            "valid": False,
            "message": repr(exc),
        }

    return {"valid": True, "message": "Query is valid"}


def query_sql(
    datagrid,
    column_name_map,
    where_expr,
    sort_by,
    sort_desc,
    count,
    computed_columns=None,
    limit=None,
    offset=0,
    debug=False,
):
    dgid = datagrid.filename
    select_columns = datagrid.get_columns()
    if computed_columns:
        select_columns.extend(list(computed_columns.keys()))
    else:
        computed_columns = {}

    if count:
        results = select_query_count(
            dgid=dgid,
            group_by=None,
            computed_columns=computed_columns,
            where_expr=where_expr,
        )
        return results
    else:
        results = select_query_page(
            dgid=dgid,
            offset=offset,
            group_by=None,
            sort_by=sort_by,
            sort_desc=sort_desc,
            where=None,
            limit=limit,
            select_columns=select_columns,
            computed_columns=computed_columns,
            where_expr=where_expr,
            debug=debug,
        )
        return results["rows"]


def select_query_count(
    dgid,
    group_by,
    computed_columns,
    where_expr=None,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]
    where = None

    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"

    env = {
        "where": where,
        "select_expr_as": ", ".join(select_expr_as),
        "databases": ", ".join(databases),
    }

    if group_by:
        env["group_by_field_name"] = get_field_name(group_by, metadata)
        total_sql = "SELECT COUNT() from (SELECT {select_expr_as} FROM {databases} GROUP BY {group_by_field_name});"
    else:
        total_sql = "SELECT COUNT() FROM (SELECT {select_expr_as} FROM {databases} WHERE {where});"
    selection_sql = total_sql.format(**env)
    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    total_rows = cur.execute(selection_sql).fetchone()[0]
    LOGGER.debug("SQL %s seconds", time.time() - start_time)
    return total_rows


def select_query(
    dgid,
    offset,
    group_by,
    sort_by,
    sort_desc,
    where,
    limit,
    select_columns,
    computed_columns,
    where_expr=None,
):
    result = select_query_page(
        dgid,
        offset,
        group_by,
        sort_by,
        sort_desc,
        where,
        limit,
        select_columns,
        computed_columns,
        where_expr,
    )
    result["total"] = select_query_count(
        dgid,
        group_by,
        computed_columns,
        where_expr,
    )
    return result


def select_query_page(
    dgid,
    offset,
    group_by,
    sort_by,
    sort_desc,
    where,
    limit,
    select_columns,
    computed_columns,
    where_expr=None,
    debug=False,
    timestamp=None,
):
    sort_desc = "DESC" if sort_desc else "ASC"
    conn = get_database_connection(dgid)
    cur = conn.cursor()

    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    # NOTE: use Image.attr to get metadata

    # Expand to include computed columns
    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"
    limit = ("LIMIT %s OFFSET %s" % (limit, offset)) if limit is not None else ""

    # Metadata now has computed_columns:
    if select_columns is None:
        select_columns = [
            column_name
            for column_name in columns
            if not column_name.endswith("--metadata")
        ]

    select_fields = [get_field_name(column, metadata) for column in select_columns]
    sort_by_field_name = get_field_name(sort_by, metadata) if sort_by else "rowid"
    remove_columns = []

    if group_by:
        if group_by not in select_columns:
            select_columns.append(group_by)
            select_fields.append(get_field_name(group_by, metadata))
            remove_columns.append(group_by)

        group_by_field_name = get_field_name(group_by, metadata)
        env = {
            "limit": limit,
            "group_by_field_name": group_by_field_name,
            "sort_by_field_name": sort_by_field_name,
            "where": where,
            "sort_desc": sort_desc,
            "select_expr_as": ", ".join(select_expr_as),
            "select_fields": ", ".join(select_fields),
            "databases": ", ".join(databases),
        }
        select_sql = "SELECT {select_expr_as} FROM {databases} WHERE {where} GROUP BY {group_by_field_name} ORDER BY {sort_by_field_name} {sort_desc} {limit}"
    else:
        env = {
            "limit": limit,
            "sort_by_field_name": sort_by_field_name,
            "where": where,
            "sort_desc": sort_desc,
            "select_expr_as": ", ".join(select_expr_as),
            "select_fields": ", ".join(select_fields),
            "databases": ", ".join(databases),
        }
        select_sql = "SELECT {select_expr_as} FROM {databases} WHERE {where} ORDER BY {sort_by_field_name} {sort_desc} {limit}"

    if len(select_columns) != len(columns):
        select_sql = "SELECT {select_fields} FROM (%s);" % select_sql
    else:
        select_sql = "%s;" % select_sql
    selection_sql = select_sql.format(**env)
    if debug:
        print(selection_sql)
    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    try:
        cur.execute(selection_sql)
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s; %s", selection_sql, exc)
        raise Exception(str(exc))

    LOGGER.debug("SQL %s seconds", time.time() - start_time)
    rows = cur.fetchall()

    if group_by:
        group_by_field_name = get_field_name(group_by, metadata)
        # Add cell messages for groups and assets:
        rows = list(rows)
        for r in range(len((rows))):
            row = dict(zip(select_columns, rows[r]))
            group_by_value = row[group_by]
            for select_column in select_columns:
                column_type = get_column_type(select_column, metadata)
                column_value = row[select_column]
                column_field_name = get_field_name(select_column, metadata)
                if column_field_name == group_by_field_name:
                    if column_type.endswith("-ASSET"):
                        asset_type = column_type.split("-", 1)[0].lower()
                        row[select_column] = {
                            "type": "asset",
                            "assetType": asset_type,
                            "assetId": column_value,
                        }
                    else:
                        pass  # don't change value of group-by column
                else:  # all of the rest should be grouped
                    cell = {
                        "dgid": dgid,
                        "timestamp": timestamp,
                        "groupBy": group_by,
                        "columnName": select_column,
                        "columnValue": group_by_value,
                        "whereExpr": where_expr,
                        "computedColumns": computed_columns,
                    }
                    if column_type == "ROW_ID":
                        cell["type"] = "row-group"
                    elif column_type == "FLOAT":
                        cell["type"] = "float-group"
                    elif column_type == "TEXT":
                        cell["type"] = "text-group"
                    elif column_type == "INTEGER":
                        cell["type"] = "integer-group"
                    elif column_type == "DATETIME":
                        cell["type"] = "datetime-group"
                    elif column_type == "BOOLEAN":
                        cell["type"] = "boolean-group"
                    elif column_type == "JSON":
                        cell["type"] = "json-group"
                    elif column_type == "VECTOR":
                        cell["type"] = "json-group"
                    else:  # Asset types
                        asset_type = column_type.split("-", 1)[0].lower()
                        cell["type"] = "asset-group"
                        cell["assetType"] = asset_type
                    row[select_column] = cell

            for column in remove_columns:
                row.pop(column)

            rows[r] = row
    else:
        # Add asset messages:
        rows = list(rows)
        for r in range(len((rows))):
            row = dict(zip(select_columns, rows[r]))
            for select_column in select_columns:
                column_type = get_column_type(select_column, metadata)
                column_value = row[select_column]
                if column_type.endswith("-ASSET"):
                    asset_type = column_type.split("-", 1)[0].lower()
                    row[select_column] = {
                        "type": "asset",
                        "assetType": asset_type,
                        "assetId": column_value,
                    }
                elif column_type in ["JSON", "VECTOR"]:
                    try:
                        row[select_column] = json.loads(row[select_column])
                    except Exception:
                        # FIXME: invalid JSON; ignore?
                        pass

            for column in remove_columns:
                row.pop(column)

            rows[r] = row

    for column in remove_columns:
        select_columns.remove(column)

    return {
        "columns": select_columns,
        "columnTypes": [
            get_column_type(select_column, metadata) for select_column in select_columns
        ],
        "nrows": len(rows),
        "ncols": len(select_columns),
        "rows": rows,
    }


def select_query_raw(
    cur,
    metadata,
    columns,
    offset,
    sort_by,
    sort_desc,
    where,
    limit,
    computed_columns,
    where_expr=None,
    debug=False,
):
    unify_computed_columns(computed_columns)
    sort_desc = "DESC" if sort_desc else "ASC"
    if not columns:
        columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    # NOTE: use Image.attr to get metadata

    # Expand to include computed columns
    if computed_columns or where_expr:
        where_sql = update_state(
            computed_columns,
            metadata,
            databases,
            columns,
            select_expr_as,
            where_expr,
        )
        if where_sql:
            where = where_sql

    where = where if where else "1"
    limit = ("LIMIT %s OFFSET %s" % (limit, offset)) if limit is not None else ""

    # Metadata now has computed_columns:
    # select_columns = [
    #    column_name for column_name in columns if not column_name.endswith("--metadata")
    # ]
    select_fields = [get_field_name(column, metadata) for column in columns]

    if sort_by:
        if sort_by in metadata:
            sort_by_field_name = get_field_name(sort_by, metadata)
        else:
            # Expression
            sort_by_field_name = sort_by
    else:
        sort_by_field_name = "rowid"

    env = {
        "limit": limit,
        "sort_by_field_name": sort_by_field_name,
        "where": where,
        "sort_desc": sort_desc,
        "select_expr_as": ", ".join(select_expr_as),
        "select_fields": ", ".join(select_fields),
        "databases": ", ".join(databases),
    }
    select_sql = "SELECT {select_expr_as} FROM {databases} WHERE {where} ORDER BY {sort_by_field_name} {sort_desc} {limit}"

    selection_sql = select_sql.format(**env)
    if debug:
        print(selection_sql)
    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    try:
        cur.execute(selection_sql)
    except sqlite3.OperationalError as exc:
        LOGGER.error("SQL: %s; %s", selection_sql, exc)
        raise Exception(str(exc))

    LOGGER.debug("SQL %s seconds", time.time() - start_time)
    return cur


## Query Builder Interface


def datatype_to_qbtype(datatype):
    if datatype == "ROW_ID":
        return "number"
    elif datatype == "INTEGER":
        return "number"
    elif datatype == "FLOAT":
        return "number"
    elif datatype == "BOOLEAN":
        return "boolean"
    elif datatype == "TEXT":
        return "text"
    elif datatype == "DATETIME":
        return "datetime"
    elif datatype == "JSON":
        # Just to allow building of the subfields:
        return "JSON"
    ## FIXME: QB also has: date, time, select,
    ##   multiselect, treeselect, treemultiselect
    else:
        return None


def get_fields(dgid, metadata=None, computed_columns=None):
    """
    Get the fields from the metadata and return needed
    information to construct the QueryBuilder.
    """
    # NOTE: metadata does not contain computed_columns yet
    if metadata is None:
        conn = get_database_connection(dgid)
        metadata = get_metadata(conn)

    # Used to evaluate computed columns
    unify_computed_columns(computed_columns)
    columns = list(metadata.keys())
    select_expr_as = [get_field_name(column, metadata) for column in columns]
    databases = ["datagrid"]

    if computed_columns:
        # Only passed in when calling from endpoint
        update_state(computed_columns, metadata, databases, columns, select_expr_as)
        # Now metadata has computed columns

    fields = {}
    for column in metadata:
        datatype = metadata[column]["type"]
        field_name = get_field_name(column, metadata)
        qbtype = datatype_to_qbtype(datatype)
        if qbtype is None:
            continue

        if datatype in ["FLOAT", "INTEGER", "ROW_ID"]:
            fields[field_name] = {
                "label": column,
                "field": field_name,
                "type": qbtype,
                "tooltip": "The '%s' column (type '%s') from the data grid"
                % (column, qbtype),
            }
            # name, datatype, min, max, avg, variance, total, stddev, other
            if (metadata[column]["minimum"] is not None) and (
                metadata[column]["minimum"] is not None
            ):
                min_value = metadata[column]["minimum"]
                max_value = metadata[column]["maximum"]
                fields[field_name]["fieldSettings"] = {
                    "min": min_value,
                    "max": max_value,
                }
            fields[field_name]["valueSources"] = ["value", "field"]

        elif datatype == "DATETIME":
            field_exp = "datetime(%s, 'unixepoch')" % field_name
            fields[field_exp] = {
                "label": column,
                "field": field_name,
                "type": qbtype,
                "tooltip": "The '%s' column (type '%s') from the data grid"
                % (column, qbtype),
            }
            if (metadata[column]["minimum"] is not None) and (
                metadata[column]["minimum"] is not None
            ):
                min_value = metadata[column]["minimum"]
                max_value = metadata[column]["maximum"]
                fields[field_exp]["fieldSettings"] = {
                    "min": min_value,
                    "max": max_value,
                    # "dateFormat": "DD-MM-YYYY",
                    # "timeFormat":
                    # "valueFormat":
                }
            fields[field_exp]["valueSources"] = [
                "value",
                "field",
                "func",
            ]  # adds Now, and Relative

        elif datatype == "BOOLEAN":
            fields[field_name] = {
                "label": column,
                "field": field_name,
                "type": qbtype,
                "tooltip": "The '%s' column (type '%s') from the data grid"
                % (column, qbtype),
            }
            fields[field_name]["fieldSettings"] = {
                "labelYes": "True",
                "labelNo": "False",
            }
            fields[field_name]["valueSources"] = ["value", "field"]

        elif datatype == "TEXT":
            fields[field_name] = {
                "label": column,
                "field": field_name,
                "type": qbtype,
                "tooltip": "The '%s' column (type '%s') from the data grid"
                % (column, qbtype),
            }
            fields[field_name]["valueSources"] = ["value", "field"]

        elif datatype == "JSON":
            # Asset metadata columns are named
            # 'COLUMN_NAME.metadata' or 'COLUMN_NAME--metadata'
            fields[field_name] = {
                "label": column.replace(".metadata", "").replace("--metadata", ""),
                "field": field_name,
                "tooltip": "The '%s' column (type 'JSON') from the data grid"
                % (column,),
                "type": "!struct",
                "subfields": {},
            }
            subfields = ast.literal_eval(metadata[column]["other"])
            # Only filterable keys are in subfields
            for key in subfields:
                # Query Builder filter types: "text", "number", "boolean", or "list-of-text"
                qbtype = subfields[key]["type"]
                if qbtype == "list-of-text":
                    field_exp = "json_extract(%s, '$.%s')" % (field_name, key)
                    fields[field_name]["subfields"][field_exp] = {
                        "type": "text",
                        "label": key,
                        "field": field_name,
                        "tableName": "1",  # special signal for JSON queries in our QueryBuilder
                        "operators": ["like"],
                    }
                else:
                    field_exp = "json_extract(%s, '$.%s')" % (field_name, key)
                    fields[field_name]["subfields"][field_exp] = {
                        "type": qbtype,
                        "label": key,
                        "field": field_name,
                        "tableName": "1",  # special signal for JSON queries in our QueryBuilder
                    }
                    if "values" in subfields[key]:
                        fields[field_name]["subfields"][field_exp]["type"] = "select"
                        fields[field_name]["subfields"][field_exp]["fieldSettings"] = {
                            "listValues": sorted(subfields[key]["values"])
                        }

    return fields


def process_projection_asset_ids(
    name,
    cur,
    asset_ids,
    projection_name,
    projection,
    traces,
    size,
    default_color,
    color_override=None,
):
    # asset_ids is a list of str
    # side-effect: adds to traces

    # Turn to string:
    values = "(" + (",".join(["'%s'" % asset_id for asset_id in asset_ids])) + ")"
    if values == "()":
        return

    sql = """SELECT asset_data FROM assets WHERE asset_id IN {values}""".format(
        values=values,
    )

    trace_data = {}
    for asset_data_row in cur.execute(sql):
        asset_data_raw = asset_data_row[0]
        asset_data = json.loads(asset_data_raw)
        vector = asset_data["vector"]
        if color_override:
            color = color_override
        elif asset_data["color"]:
            color = asset_data["color"]
        else:
            color = default_color

        if name:
            trace_name = name
        else:
            trace_name = asset_data.get("name", "Grouped")

        if "row_id" in asset_data:
            row_id = asset_data["row_id"]
        else:
            row_id = None

        if trace_name not in trace_data:
            trace_data[trace_name] = {
                "vectors": [],
                "colors": [],
                "texts": [],
                "customdata": [],
            }

        trace_data[trace_name]["texts"].append(asset_data.get("text"))
        trace_data[trace_name]["vectors"].append(vector)
        trace_data[trace_name]["colors"].append(color)
        trace_data[trace_name]["customdata"].append(row_id)

    for trace_name in trace_data:
        vectors = trace_data[trace_name]["vectors"]
        texts = trace_data[trace_name]["texts"]
        colors = trace_data[trace_name]["colors"]
        customdata = trace_data[trace_name]["customdata"]

        eigen_vector = projection.transform(np.array(vectors))
        xs = eigen_vector[:, 0].tolist()
        ys = eigen_vector[:, 1].tolist()

        if texts:
            if any(texts):
                text_set = set(texts)
                if len(text_set) == 1:
                    texts = list(text_set)[0]
            else:
                texts = None
        else:
            texts = None

        if colors and len(set(colors)) == 1:
            colors = colors[0]

        trace = {
            "x": xs,
            "y": ys,
            "type": "scatter",
            "mode": "markers",
            "text": texts,
            "name": trace_name,
            "marker": {"size": 8, "color": colors},
            "customdata": customdata,
        }
        traces.append(trace)


def select_projection_data(
    dgid,
    timestamp,
    asset_id,
    column_name,
    column_value,
    group_by,
    where_expr,
    computed_columns,
):
    conn = get_database_connection(dgid)
    cur = conn.cursor()
    unify_computed_columns(computed_columns)
    metadata = get_metadata(conn)
    column_limit = None
    column_offset = 0

    if "projection" in metadata[column_name]["other"]:
        projection_name = metadata[column_name]["other"]["projection"]
    else:
        projection_name = "pca"

    if projection_name == "pca":
        from sklearn.decomposition import PCA

        pca_eigen_vectors = metadata[column_name]["other"]["pca_eigen_vectors"]
        pca_mean = metadata[column_name]["other"]["pca_mean"]
        projection = PCA()
        projection.components_ = np.array(pca_eigen_vectors)
        projection.mean_ = np.array(pca_mean)
    elif projection_name == "t-sne":
        # FIXME: Trying to prevent an error on first load; race condition?
        from openTSNE import TSNE  # noqa

        ascii_string = metadata[column_name]["other"]["embedding"]
        if not PROJECTION_EMBEDDING_CACHE.contains(ascii_string):
            PROJECTION_EMBEDDING_CACHE.put(
                ascii_string, pickle_loads_embedding_unsafe(ascii_string)
            )
        projection = PROJECTION_EMBEDDING_CACHE.get(ascii_string)

    elif projection_name == "umap":
        pass
    else:
        return

    default_color = get_color(column_name)

    traces = []
    if asset_id:
        # First, add some points to provide context:
        key = (
            "sampled",
            dgid,
            timestamp,
            column_name,
            column_value,
            group_by,
            where_expr,
        )
        if not PROJECTION_TRACE_CACHE.contains(key):
            rows = select_query_raw(
                cur,
                metadata,
                [column_name],
                offset="0",
                sort_by="RANDOM()",
                sort_desc=None,
                where=None,
                limit=200,
                computed_columns=computed_columns,
                where_expr=where_expr,
                debug=False,
            )
            process_projection_asset_ids(
                "Sampled Data",
                cur,
                [row[0] for row in rows],
                projection_name,
                projection,
                traces,
                3,
                default_color,
                "lightgray",
            )
            PROJECTION_TRACE_CACHE.put(key, traces)
        # Traces contains projection data; make copy:
        traces = PROJECTION_TRACE_CACHE.get(key)[:]

        # Next, add the selected asset:
        asset_data_raw = select_asset(dgid, asset_id)
        asset_data = json.loads(asset_data_raw)
        vector = projection.transform(np.array([asset_data["vector"]]))
        if asset_data["color"]:
            color = asset_data["color"]
        else:
            color = default_color
        if "row_id" in asset_data:
            row_id = asset_data["row_id"]
        else:
            row_id = None
        text = asset_data.get("text", column_name)

        trace = {
            "x": [round(vector[0][0], 3)],
            "y": [round(vector[0][1], 3)],
            "text": text,
            "name": text,
            "type": "scatter",
            "mode": "markers",
            "marker": {"size": 14, "color": color},
            "customdata": [row_id],
        }
        traces.append(trace)
    else:
        key = (
            "selection",
            dgid,
            timestamp,
            column_name,
            column_value,
            group_by,
            where_expr,
        )
        if not PROJECTION_TRACE_CACHE.contains(key):
            rows = select_group_by_rows(
                column_name,
                column_value,
                group_by,
                where_expr,
                metadata,
                cur,
                computed_columns,
            )
            if rows:
                row = rows[0]
                if row and row[0]:
                    values = row[0].split(",")
                    if column_limit is not None:
                        values = values[column_offset : column_offset + column_limit]

                    process_projection_asset_ids(
                        None,
                        cur,
                        values,
                        projection_name,
                        projection,
                        traces,
                        3,
                        default_color,
                    )
            PROJECTION_TRACE_CACHE.put(key, traces)
        # Traces contains projection data; make copy:
        traces = PROJECTION_TRACE_CACHE.get(key)[:]
    return traces


def select_asset(dgid, asset_id, thumbnail=False, return_image=False):
    conn = get_database_connection(dgid)
    cur = conn.cursor()
    selection = (
        "SELECT asset_data, asset_type, asset_thumbnail, "
        + 'json_extract(asset_metadata, "$.source") as asset_source, '
        + 'json_extract(asset_metadata, "$.annotations") as asset_annotations '
        + 'from assets where asset_id = "{asset_id}";'
    )
    env = {"asset_id": asset_id}
    selection_sql = selection.format(**env)
    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    row = cur.execute(selection_sql).fetchone()
    LOGGER.debug("SQL %s seconds", time.time() - start_time)

    if row:
        asset_data, asset_type, asset_thumbnail, asset_source, asset_annotations = row
        if asset_source:  # FIXME: asset_type == ["Image"]
            # FIXME: move to Image class
            # FIXME: use a cache?
            url_data = urllib.request.urlopen(asset_source)
            with io.BytesIO() as fp:
                fp.write(url_data.read())
                image = PIL.Image.open(fp)
                if image.mode == "CMYK":
                    image = image.convert("RGB")
                asset_data = image_to_fp(image, "png").read()

        if thumbnail and asset_type in ["Image"]:
            if asset_annotations:
                asset_annotations = json.loads(asset_annotations)
            thumbnail_data, thumbnail_image = generate_thumbnail(
                asset_data, annotations=asset_annotations, return_image=True
            )
            if return_image:
                return thumbnail_image
            else:
                return thumbnail_data
        else:
            return asset_data

    return None


def select_asset_metadata(dgid, asset_id):
    conn = get_database_connection(dgid)
    cur = conn.cursor()
    selection = 'SELECT asset_metadata from assets where asset_id = "{asset_id}";'
    env = {"asset_id": asset_id}
    selection_sql = selection.format(**env)
    LOGGER.debug("SQL %s", selection_sql)
    start_time = time.time()
    row = cur.execute(selection_sql).fetchone()
    LOGGER.debug("SQL %s seconds", time.time() - start_time)
    if row:
        return row[0]
    else:
        error_image = PIL.Image.new(
            mode="RGB",
            size=(100, 100),
            color="red",
        )
        asset_data = image_to_fp(error_image, "png").read()
        return asset_data

    return None


def walk(top, maxdepth=3):
    dirs, nondirs = [], []
    try:
        for entry in os.scandir(top):
            (dirs if entry.is_dir() else nondirs).append(entry.path)
    except Exception:
        pass
    yield top, dirs, sorted(nondirs)
    if maxdepth > 1:
        for path in dirs:
            yield from walk(path, maxdepth - 1)


def list_datagrids():
    """
    List all datagrids, recursively, starting in KANGAS_ROOT.
    Defaults to the directory in which datagrid server was started.
    """
    # In stand-alone mode, dgid is filename and label
    filenames = [
        filename
        for directory, dirs, files in walk(KANGAS_ROOT)
        for filename in files
        if filename.endswith(".datagrid")
    ]

    return [
        {
            "value": filename,
            "label": filename,
            "timestamp": os.path.getmtime(filename),
        }
        for filename in filenames
    ]


def get_datagrid_timestamp(dgid):
    # In stand-alone mode, dgid is filename and label
    db_path = get_dg_path(dgid)
    timestamp = os.path.getmtime(db_path)
    result = {"dgid": dgid, "label": dgid, "timestamp": timestamp}
    return result


def make_limited_env():
    local_env = {}
    byte_code = compile(CUSTOM_CODE_INIT, "<inline>", "exec")
    exec(byte_code, globals(), local_env)
    return local_env


def custom_output(input, code):
    """
    A restricted environment for executing user code.  To be
    completely secure, you'd want a remote container to execute user
    code.

    `input` is a dict representing the contents of the cell
    in the format:

    ```
    {
     "value": VALUE,
     "type": TYPE,
     "metadata": METADATA,
    }
    ```

    where:

        value: the contents of the cell
        type: `IMAGE`, `TEXT`, `FLOAT`, etc.
        metadata: (optional) a dict of user-supplied info

    `code` has access to common data science stack, already
    imported. Assign the computed output to the variable
    `output`. The output should be in the same form as
    the input.

    """
    from RestrictedPython import compile_restricted
    from RestrictedPython.Eval import default_guarded_getitem
    from RestrictedPython.PrintCollector import PrintCollector
    from RestrictedPython.Utilities import utility_builtins

    # from RestrictedPython import safe_globals
    # from RestrictedPython.Guards import safe_builtins

    local_env = make_limited_env()
    local_env["_print_"] = PrintCollector

    local_env["input"] = input
    local_env["_getattr_"] = getattr
    local_env["_getitem_"] = default_guarded_getitem
    local_env["Exception"] = Exception

    code = """
try:
    {code}
except Exception as exc:
    STDERR = format_exc()
STDOUT = printed
""".format(
        code="\n".join(["    %s" % line for line in code.split("\n")])
    )

    restricted_globals = dict(__builtins__=utility_builtins)

    try:
        byte_code = compile_restricted(code, "<inline>", "exec")
        exec(byte_code, restricted_globals, local_env)
    except Exception as exc:
        return {
            "value": None,
            "type": None,
            "metadata": None,
            "stderr": str(exc),
            "stdout": "",
        }

    output = local_env.get("output", {"value": None, "type": None, "metadata": None})
    if not isinstance(output, dict):
        output = {
            "value": output,
            "type": pytype_to_dgtype(output),
            "metadata": None,
        }
    else:
        if "value" not in output:
            output["value"] = None

        if "type" not in output:
            output["type"] = pytype_to_dgtype(output["value"])

        if "metadata" not in output:
            output["metadata"] = None

    if "STDERR" in local_env:
        output["stderr"] = local_env["STDERR"]
    else:
        output["stderr"] = ""
    output["stdout"] = local_env.get("STDOUT", "")
    return output


def get_about(url, dgid):
    db_path = get_dg_path(dgid)
    conn = sqlite3.connect(db_path)

    try:
        about_text = conn.execute(
            "SELECT value from settings where name = 'about';"
        ).fetchone()[0]
    except Exception:
        about_text = ""

    if about_text:
        return process_about(url, dgid, about_text)
    else:
        return about_text


def generate_chart_image(chart_type, data, width, height, x_range=None, y_range=None):
    # data is a list of plotly traces
    image_data = None
    image = PIL.Image.new("RGBA", (width, height))

    drawing = PIL.ImageDraw.Draw(image)

    if x_range is None and y_range is None:
        max_x, min_x = float("-inf"), float("inf")
        max_y, min_y = float("-inf"), float("inf")
        for trace in data:
            if "y" not in trace or len(trace["y"]) == 0:
                continue
            if "x" not in trace or len(trace["x"]) == 0:
                continue

            min_x, max_x = min(
                min([float(x) if not isinstance(x, str) else 0 for x in trace["x"]]),
                min_x,
            ), max(
                max([float(x) if not isinstance(x, str) else 0 for x in trace["x"]]),
                max_x,
            )
            min_y, max_y = min(
                min([float(y) if not isinstance(y, str) else 0 for y in trace["y"]]),
                min_y,
            ), max(
                max([float(y) if not isinstance(y, str) else 0 for y in trace["y"]]),
                max_y,
            )
        if max_x == float("-inf") or min_x == float("inf"):
            # May not be needed
            max_x, min_x = 0, 0

        if max_y == float("-inf") or min_y == float("inf"):
            # May not be needed
            max_y, min_y = 0, 0
    else:
        min_x, max_x = x_range
        min_y, max_y = y_range

    if min_x == max_x:
        min_x, max_x = min_x - 1, max_x + 1

    if min_y == max_y:
        min_y, max_y = min_y - 1, max_y + 1

    span_x = max_x - min_x
    span_y = max_y - min_y
    initialized = False

    for trace in data:
        if chart_type == "category":
            if "x" not in trace or len(trace["x"]) == 0:
                continue
            spacing = height / len(trace["x"])
            margin = max(spacing * 0.20, 1)

            for count, [x, y, color] in enumerate(
                zip(trace["x"], trace["y"], trace["marker"]["color"])
            ):
                position = len(trace["x"]) - count - 1
                x0, y0 = (0, position * spacing + margin)
                x1, y1 = (width * x / max_x), ((position + 1) * spacing - margin)
                x0, x1 = min(x0, x1), max(x0, x1)
                y0, y1 = min(y0, y1), max(y0, y1)
                drawing.rectangle(
                    [(x0, y0), (x1, y1)],
                    fill=color,
                )

        elif chart_type == "histogram":
            if "y" not in trace or len(trace["y"]) == 0:
                continue
            spacing = width / len(trace["y"])
            margin = max(spacing * 0.20, 1)
            color = trace["marker"]["color"]

            for count, [x, y] in enumerate(zip(trace["x"], trace["y"])):
                position = count
                x0, y0 = (position * spacing, height)
                x1, y1 = (
                    (position + 1) * spacing - margin,
                    height - height * y / max_y,
                )
                x0, x1 = min(x0, x1), max(x0, x1)
                y0, y1 = min(y0, y1), max(y0, y1)
                drawing.rectangle(
                    [(x0, y0), (x1, y1)],
                    fill=color,
                )
        elif chart_type == "scatter":
            if "y" not in trace or len(trace["y"]) == 0:
                continue

            radius = trace["marker"]["size"] / 2
            colors = trace["marker"]["color"]
            margin = 5

            total_width = width - margin * 2
            total_height = height - margin * 2

            if not initialized:
                initialized = True
                drawing.line(
                    [
                        margin,
                        margin + (total_height - total_height * (0 - min_y) / span_y),
                        margin + total_width,
                        margin + (total_height - total_height * (0 - min_y) / span_y),
                    ],
                    fill="black",
                    width=1,
                )
                drawing.line(
                    [
                        margin + (total_width * (0 - min_x) / span_x),
                        margin,
                        margin + (total_width * (0 - min_x) / span_x),
                        margin + total_height,
                    ],
                    fill="black",
                    width=1,
                )

            for count, [x, y] in enumerate(zip(trace["x"], trace["y"])):
                if isinstance(colors, list):
                    color = colors[count]
                else:
                    color = colors
                drawing.ellipse(
                    [
                        margin + (total_width * (x - min_x) / span_x) - radius,
                        margin
                        + (total_height - total_height * (y - min_y) / span_y)
                        - radius,
                        margin + (total_width * (x - min_x) / span_x) + radius,
                        margin
                        + (total_height - total_height * (y - min_y) / span_y)
                        + radius,
                    ],
                    width=1,
                    fill=color,
                )
        else:
            raise Exception("unknown chart_type: %r" % chart_type)

    with io.BytesIO() as fp:
        image.save(fp, format="png")
        fp.seek(0)
        image_data = fp.read()

    return image_data
