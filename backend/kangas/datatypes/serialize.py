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
import datetime
import json

from .utils import is_nan, is_null


def serialize_identity_function(datagrid, item, row_id):
    """
    For FLOAT (mixed float and int) columns.
    """
    if is_nan(item):
        return None

    return item


def serialize_bool_function(datagrid, item, row_id):
    if is_null(item):
        return None

    return bool(item)


def serialize_int_function(datagrid, item, row_id):
    if is_null(item):
        return None

    return int(item)


def serialize_string_function(datagrid, item, row_id):
    if is_null(item):
        return None

    item = str(item)
    if len(item) > datagrid.MAX_COL_STRING_LENGTH:
        print("Truncating string: %r" % item)
    return item[: datagrid.MAX_COL_STRING_LENGTH]


def serialize_datetime_function(datagrid, item, row_id):
    if is_null(item):
        return None

    if isinstance(item, (int, float)):
        return item
    elif isinstance(item, datetime.datetime):
        return item.timestamp()
    elif isinstance(item, datetime.date):
        return datetime.datetime(item.year, item.month, item.day).timestamp()
    else:
        raise Exception("Can't convert %r to a DATETIME" % item)


def serialize_json_function(datagrid, item, row_id):
    if is_null(item):
        return None

    if isinstance(item, (dict, list, tuple)):
        return json.dumps(item)
    else:
        raise Exception("Can't convert %r to JSON" % item)


def serialize_vector_function(datagrid, item, row_id):
    if is_null(item):
        return None

    if isinstance(item, (list, tuple)):
        return json.dumps(item)
    elif hasattr(item, "tolist"):
        return str(item.tolist()).replace("nan", "None")
    else:
        raise Exception("Can't convert %r to vector repr" % item)


def unserialize_vector(datagrid, row, column_name):
    value = row[column_name]
    if value is not None:
        return ast.literal_eval(value)


def log_and_serialize_function(datagrid, item, row_id):
    return item.log_and_serialize(datagrid, row_id)


def unserialize(datagrid, row, column_name):
    return row[column_name]


def unserialize_datetime(datagrid, row, column_name):
    value = row[column_name]
    if value is not None:
        try:
            return datetime.datetime.fromtimestamp(value)
        except Exception:
            return value


def unserialize_boolean(datagrid, row, column_name):
    value = row[column_name]
    if value is not None:
        try:
            return bool(value)
        except Exception:
            return value


# Mapping from Datatype to allowed types, and serialize
# function:
DATAGRID_TYPES = {
    "BOOLEAN": {
        "types": [bool],
        "serialize": serialize_bool_function,
        "unserialize": unserialize_boolean,
    },
    "INTEGER": {
        "types": [int],
        "serialize": serialize_int_function,
        "unserialize": unserialize,
    },
    "FLOAT": {
        "types": [float],
        "serialize": serialize_identity_function,
        "unserialize": unserialize,
    },
    "TEXT": {
        "types": [str],
        "serialize": serialize_string_function,
        "unserialize": unserialize,
    },
    "DATETIME": {
        "types": [datetime.date, datetime.datetime],
        "serialize": serialize_datetime_function,
        "unserialize": unserialize_datetime,
    },
    "JSON": {
        "types": [dict],
        "serialize": serialize_json_function,
        "unserialize": unserialize,
    },
    "VECTOR": {
        "types": [],
        "serialize": serialize_vector_function,
        "unserialize": unserialize_vector,
    },
    "ROW_ID": {
        "types": [int],
        "serialize": serialize_int_function,
        "unserialize": unserialize,
    },
}

ASSET_TYPE_MAP = {}


def register_asset_type(name, cls, asset_type):
    if name:
        DATAGRID_TYPES[name] = {
            "types": [cls],
            "serialize": log_and_serialize_function,
            "unserialize": cls.unserialize,
            "get_statistics": cls.get_statistics,
        }
    ASSET_TYPE_MAP[asset_type] = cls
