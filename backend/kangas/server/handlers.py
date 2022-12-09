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

"""
Uses KANGAS_ROOT environment variable to load
datagrids from. Defaults to the directory
where datagrid server was started.
"""

import json
import logging
import os
import platform
import subprocess
import sys
import urllib

import tornado
from tornado.web import RequestHandler

from .._version import __version__
from ..datatypes.utils import THUMBNAIL_SIZE
from .queries import (
    KANGAS_ROOT,
    custom_output,
    get_datagrid_timestamp,
    get_dg_path,
    get_fields,
    list_datagrids,
    select_asset,
    select_asset_group,
    select_asset_group_metadata,
    select_asset_group_thumbnail,
    select_asset_metadata,
    select_category,
    select_description,
    select_histogram,
    select_metadata,
    select_query,
    verify_where,
)

USE_AUTH = False

if USE_AUTH:
    auth_wrapper = tornado.web.authenticated
else:

    def auth_wrapper(function):
        return function


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


def get_column_value(column_value):
    if isinstance(column_value, dict):
        if "assetId" in column_value:
            return column_value["assetId"]
    return column_value


class BaseHandler(RequestHandler):
    def set_default_headers(self):
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def write_json(self, obj):
        try:
            result = json.dumps(obj)
        except Exception:
            logging.error("can't encode %r" % obj)
            self.write("ENCODING ERROR")
            return

        self.write(result)

    def options(self, *args):
        # no body
        # `*args` is for route with `path arguments` supports
        self.set_status(204)
        self.finish()

    def unquote(self, value):
        if value:
            return urllib.parse.unquote(value)

    def ensure_datagrid_path(self, dgid):
        if dgid is not None:
            db_path = get_dg_path(dgid)
            if os.path.exists(db_path):
                return True

        if dgid is not None:
            logging.error("dgid '%s' not found; ignoring" % dgid)
        self.set_status(404)
        self.finish("<html><body><p>DataGrid file not found.</p></body></html>")
        return False


class HistogramHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        group_by = data.get("groupBy", None)
        where = data.get("where", None)
        column_name = data.get("columnName", None)
        column_value = get_column_value(data.get("columnValue", None))
        where_description = data.get("whereDescription", where)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            results = select_histogram(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                where_description,
                computed_columns,
                where_expr,
            )
            self.write_json(results)


class DescriptionHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        group_by = data.get("groupBy", None)
        where = data.get("where", None)
        column_name = data.get("columnName", None)
        column_value = get_column_value(data.get("columnValue", None))
        where_description = data.get("whereDescription", where)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            result = select_description(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                where_description,
                computed_columns,
                where_expr,
            )
            self.write_json(result)


class CategoryHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        group_by = data.get("groupBy", None)
        where = data.get("where", None)
        column_name = data.get("columnName", None)
        column_value = get_column_value(data.get("columnValue", None))
        where_description = data.get("whereDescription", where)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            result = select_category(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                where_description,
                computed_columns,
                where_expr,
            )
            self.write_json(result)


class AssetGroupHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        group_by = data.get("groupBy", None)
        where = data.get("where", None)
        column_name = data.get("columnName", None)
        column_value = get_column_value(data.get("columnValue", None))
        column_offset = data.get("columnOffset", 0)
        column_limit = data.get("columnLimit", None)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            result = select_asset_group(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                column_offset,
                column_limit,
                computed_columns,
                where_expr,
                distinct=True,
            )
            self.write_json(result)


class AssetGroupMetadataHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        group_by = data.get("groupBy", None)
        where = data.get("where", None)
        column_name = data.get("columnName", None)
        column_value = get_column_value(data.get("columnValue", None))
        column_offset = data.get("columnOffset", 0)
        column_limit = data.get("columnLimit", None)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)
        metadata_path = data.get("metadataPath", "labels")
        distinct = data.get("distinct", True)

        if self.ensure_datagrid_path(dgid):
            result = select_asset_group_metadata(
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
                metadata_path,
            )
            self.write_json(result)


class AssetGroupThumbnailHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        group_by = data.get("groupBy", None)
        where = data.get("where", None)
        column_name = data.get("columnName", None)
        column_value = get_column_value(data.get("columnValue", None))
        column_offset = data.get("columnOffset", 0)
        gallery_size = data.get("gallerySize", None)
        image_size = data.get("imageSize", THUMBNAIL_SIZE)
        background_color = data.get("backgroundColor", None)
        border_width = data.get("borderWidth", 1)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            result = select_asset_group_thumbnail(
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
                distinct=True,
            )
            self.write(result)


class QueryHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        # Optional selections:
        offset = data.get("offset", 0)
        group_by = data.get("groupBy", None)
        sort_by = data.get("sortBy", None)
        where = data.get("where", None)
        limit = data.get("limit", 10)
        sort_desc = data.get("sortDesc", False)
        select = data.get("select", None)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            result = select_query(
                dgid,
                offset,
                group_by,
                sort_by,
                sort_desc,
                where,
                limit,
                select,
                computed_columns,
                where_expr,
            )
            self.write_json(result)


class VerifyWhereHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)

        if self.ensure_datagrid_path(dgid):
            result = verify_where(
                dgid,
                computed_columns,
                where_expr,
            )
            self.write_json(result)


class MetadataHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        if self.ensure_datagrid_path(dgid):
            result = select_metadata(dgid)
            self.write_json(result)


class AssetMetadataHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        asset_id = data.get("assetId", None)
        dgid = self.unquote(data.get("dgid", None))

        if self.ensure_datagrid_path(dgid):
            result = select_asset_metadata(dgid, asset_id)
            self.write_json(result)


class FieldsHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))
        computed_columns = data.get("computedColumns", None)

        if self.ensure_datagrid_path(dgid):
            result = get_fields(dgid, computed_columns)
            self.write_json(result)


class DownloadHandler(BaseHandler):
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.unquote(
            tornado.escape.url_unescape(self.get_query_argument("dgid", ""))
        )
        asset_id = tornado.escape.url_unescape(self.get_query_argument("assetId", ""))
        thumbnail = json.loads(
            tornado.escape.url_unescape(self.get_query_argument("thumbnail", "false"))
        )

        if self.ensure_datagrid_path(dgid):
            result = select_asset(dgid, asset_id, thumbnail)
            self.write(result)


class ListDataGridsHandler(BaseHandler):
    @auth_wrapper
    def get(self):
        result = list_datagrids()
        self.write_json(result)


class GetDataGridTimestampHandler(BaseHandler):
    @auth_wrapper
    def get(self):
        dgid = self.unquote(
            tornado.escape.url_unescape(self.get_query_argument("dgid", ""))
        )
        if dgid:
            result = get_datagrid_timestamp(dgid)
            self.write_json(result)


class StatusHandler(BaseHandler):
    @auth_wrapper
    def get(self):
        result = {
            "Kangas version": __version__,
            "Kangas license": "Apache Version 2.0",
            "Kangas root": os.path.abspath(KANGAS_ROOT),
            "Python version": platform.python_version(),
            "Node version": get_node_version(),
            "OS version": "%s %s %s"
            % (platform.system(), platform.release(), platform.version()),
            "OS details": "%s (%s)" % (sys.platform, platform.platform()),
        }
        self.write_json(result)


class CustomOutputHandler(BaseHandler):
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        input = data.get("input", None)
        code = data.get("code", None)

        output = custom_output(input, code)
        self.write_json(output)


datagrid_handlers = [
    ("/datagrid/histogram", HistogramHandler),
    ("/datagrid/description", DescriptionHandler),
    ("/datagrid/fields", FieldsHandler),
    ("/datagrid/category", CategoryHandler),
    ("/datagrid/asset-group", AssetGroupHandler),
    ("/datagrid/asset-group-metadata", AssetGroupMetadataHandler),
    ("/datagrid/asset-group-thumbnail", AssetGroupThumbnailHandler),
    ("/datagrid/asset-metadata", AssetMetadataHandler),
    ("/datagrid/query", QueryHandler),
    ("/datagrid/metadata", MetadataHandler),
    ("/datagrid/download", DownloadHandler),
    ("/datagrid/list", ListDataGridsHandler),
    #    ("/datagrid/output", CustomOutputHandler),
    ("/datagrid/verify-where", VerifyWhereHandler),
    ("/datagrid/timestamp", GetDataGridTimestampHandler),
    ("/datagrid/status", StatusHandler),
]
