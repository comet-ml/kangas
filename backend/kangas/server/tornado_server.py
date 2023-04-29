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

"""
Uses KANGAS_ROOT environment variable to load
datagrids from. Defaults to the directory
where datagrid server was started.
"""

import base64
import json
import logging
import os
import platform
import sys
import urllib

import tornado
from tornado.concurrent import run_on_executor
from tornado.web import RequestHandler

from .._version import __version__
from ..datatypes.utils import THUMBNAIL_SIZE
from .queries import (
    KANGAS_ROOT,
    custom_output,
    generate_chart_image,
    get_about,
    get_completions,
    get_datagrid_timestamp,
    get_dg_path,
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
    select_query_count,
    select_query_page,
    verify_where,
)
from .utils import get_node_version

USE_AUTH = False
LOGGER = logging.getLogger(__name__)

if USE_AUTH:
    auth_wrapper = tornado.web.authenticated
else:

    def auth_wrapper(function):
        return function


def get_column_value(column_value):
    if isinstance(column_value, dict):
        if "assetId" in column_value:
            return column_value["assetId"]
    return column_value


class BaseHandler(RequestHandler):
    def set_default_headers(self):
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header(
            "Access-Control-Allow-Headers",
            "x-requested-with, Cache-Control",
        )
        self.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def write_json(self, obj):
        try:
            result = json.dumps(obj)
        except Exception:
            logging.error("can't encode %r" % obj)
            ## FIXME: how to write an error message?
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
        LOGGER.debug("DataGrid dgid: %s", dgid)
        if dgid is not None:
            db_path = get_dg_path(dgid)
            if os.path.exists(db_path):
                return True

        if dgid is not None:
            logging.error("dgid '%s' not found; ignoring" % dgid)

        self.set_status(404)
        return False


class HistogramHandler(BaseHandler):
    @run_on_executor
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
        where_expr = where_expr.strip() if where_expr else None

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

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        group_by = self.get_query_argument("groupBy", None)
        where = self.get_query_argument("where", None)
        column_name = self.get_query_argument("columnName", None)
        column_value = get_column_value(self.get_query_argument("columnValue", None))
        where_description = self.get_query_argument("whereDescription", where)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

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


class CompletionsHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        if self.ensure_datagrid_path(dgid):
            results = get_completions(dgid)
            self.write_json(results)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        if self.ensure_datagrid_path(dgid):
            results = get_completions(dgid)
            self.write_json(results)


class DescriptionHandler(BaseHandler):
    @run_on_executor
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
        where_expr = where_expr.strip() if where_expr else None

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

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        group_by = self.get_query_argument("groupBy", None)
        where = self.get_query_argument("where", None)
        column_name = self.get_query_argument("columnName", None)
        column_value = get_column_value(self.get_query_argument("columnValue", None))
        where_description = self.get_query_argument("whereDescription", where)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

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
    @run_on_executor
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
        where_expr = where_expr.strip() if where_expr else None

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

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        group_by = self.get_query_argument("groupBy", None)
        where = self.get_query_argument("where", None)
        column_name = self.get_query_argument("columnName", None)
        column_value = get_column_value(self.get_query_argument("columnValue", None))
        where_description = self.get_query_argument("whereDescription", where)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

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
    @run_on_executor
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
        where_expr = where_expr.strip() if where_expr else None
        return_url = data.get("returnUrl", False)

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
            if return_url:
                self.write_json({"uri": base64.b64encode(result).decode("utf-8")})
            else:
                self.set_header("Cache-Control", "max-age=604800")
                self.write_json(result)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        group_by = self.get_query_argument("groupBy", None)
        where = self.get_query_argument("where", None)
        column_name = self.get_query_argument("columnName", None)
        column_value = get_column_value(self.get_query_argument("columnValue", None))
        column_offset = self.get_query_argument("columnOffset", 0)
        column_limit = self.get_query_argument("columnLimit", None)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None
        return_url = self.get_query_argument("returnUrl", "false") == "true"

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
            if return_url:
                self.write_json({"uri": base64.b64encode(result).decode("utf-8")})
            else:
                self.set_header("Cache-Control", "max-age=604800")
                self.write_json(result)


class AssetGroupMetadataHandler(BaseHandler):
    @run_on_executor
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
        where_expr = where_expr.strip() if where_expr else None
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
            )
            self.write_json(result)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        group_by = self.get_query_argument("groupBy", None)
        where = self.get_query_argument("where", None)
        column_name = self.get_query_argument("columnName", None)
        column_value = get_column_value(self.get_query_argument("columnValue", None))
        column_offset = int(self.get_query_argument("columnOffset", "0"))
        column_limit = self.get_query_argument("columnLimit", None)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None
        distinct = self.get_query_argument("distinct", "true") == "true"

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
            )
            self.write_json(result)


class AssetGroupThumbnailHandler(BaseHandler):
    @run_on_executor
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
        where_expr = where_expr.strip() if where_expr else None
        return_url = data.get("returnUrl", False)

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
            if return_url:
                self.write_json({"uri": base64.b64encode(result).decode("utf-8")})
            else:
                self.set_header("Cache-Control", "max-age=604800")
                self.set_header("Content-type", "image/png")
                self.write(result)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        group_by = self.get_query_argument("groupBy", None)
        where = self.get_query_argument("where", None)
        column_name = self.get_query_argument("columnName", None)
        column_value = get_column_value(self.get_query_argument("columnValue", None))
        column_offset = self.get_query_argument("columnOffset", 0)

        gallery_size = self.get_query_argument("gallerySize", None)
        if gallery_size:
            gallery_size = [
                int(n) for n in tornado.escape.url_unescape(gallery_size).split(",")
            ]

        image_size = self.get_query_argument("imageSize", None)
        if image_size:
            image_size = [
                int(n) for n in tornado.escape.url_unescape(image_size).split(",")
            ]
        else:
            image_size = THUMBNAIL_SIZE

        background_color = self.get_query_argument("backgroundColor", None)
        if background_color:
            background_color = [
                int(n) for n in tornado.escape.url_unescape(background_color).split(",")
            ]

        border_width = int(self.get_query_argument("borderWidth", "1"))
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None
        return_url = self.get_query_argument("returnUrl", "false") == "true"

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
            if return_url:
                self.write_json({"uri": base64.b64encode(result).decode("utf-8")})
            else:
                self.set_header("Cache-Control", "max-age=604800")
                self.set_header("Content-type", "image/png")
                self.write(result)


class QueryPageHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
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
        where_expr = where_expr.strip() if where_expr else None

        if self.ensure_datagrid_path(dgid):
            LOGGER.debug("QueryPageHandler dgid: %s", dgid)
            result = select_query_page(
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

    @run_on_executor
    @auth_wrapper
    def get(self):
        dgid = self.get_query_argument("dgid", None)

        # Optional selections:
        offset = self.get_query_argument("offset", 0)
        group_by = self.get_query_argument("groupBy", None)
        sort_by = self.get_query_argument("sortBy", None)
        where = self.get_query_argument("where", None)
        limit = self.get_query_argument("limit", 10)
        sort_desc = self.get_query_argument("sortDesc", "false") == "true"
        select = self.get_query_argument("select", None)
        if select:
            select = tornado.escape.url_unescape(select).split(",")
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

        if self.ensure_datagrid_path(dgid):
            LOGGER.debug("QueryPageHandler dgid: %s", dgid)
            result = select_query_page(
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


class QueryTotalHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))
        group_by = data.get("groupBy", None)
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

        if self.ensure_datagrid_path(dgid):
            total = select_query_count(
                dgid,
                group_by,
                computed_columns,
                where_expr,
            )
            result = {"total": total}
            self.write_json(result)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)
        group_by = self.get_query_argument("groupBy", None)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

        if self.ensure_datagrid_path(dgid):
            total = select_query_count(
                dgid,
                group_by,
                computed_columns,
                where_expr,
            )
            result = {"total": total}
            self.write_json(result)


class VerifyWhereHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))
        computed_columns = data.get("computedColumns", None)
        where_expr = data.get("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

        if self.ensure_datagrid_path(dgid):
            result = verify_where(
                dgid,
                computed_columns,
                where_expr,
            )
            self.write_json(result)
        else:
            self.write_json({"valid": False, "message": "Invalid datagrid: %r" % dgid})

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)
        computed_columns = self.get_query_argument("computedColumns", None)
        where_expr = self.get_query_argument("whereExpr", None)
        where_expr = where_expr.strip() if where_expr else None

        if self.ensure_datagrid_path(dgid):
            result = verify_where(
                dgid,
                computed_columns,
                where_expr,
            )
            self.write_json(result)


class MetadataHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))

        if self.ensure_datagrid_path(dgid):
            result = select_metadata(dgid)
            self.write_json(result)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)

        if self.ensure_datagrid_path(dgid):
            result = select_metadata(dgid)
            self.write_json(result)


class AssetMetadataHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        asset_id = data.get("assetId", None)
        dgid = self.unquote(data.get("dgid", None))

        if self.ensure_datagrid_path(dgid):
            result = select_asset_metadata(dgid, asset_id)
            self.write_json(json.loads(result))

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        asset_id = self.get_query_argument("assetId", None)
        dgid = self.get_query_argument("dgid", None)

        if self.ensure_datagrid_path(dgid):
            result = select_asset_metadata(dgid, asset_id)
            self.write_json(json.loads(result))


class DownloadHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.unquote(
            tornado.escape.url_unescape(self.get_query_argument("dgid", ""))
        )
        asset_id = tornado.escape.url_unescape(self.get_query_argument("assetId", ""))
        return_url = self.get_query_argument("returnUrl", "false") == "true"
        thumbnail = self.get_query_argument("thumbnail", "false") == "true"

        if self.ensure_datagrid_path(dgid):
            result = select_asset(dgid, asset_id, thumbnail)
            if return_url:
                self.write_json({"uri": base64.b64encode(result).decode("utf-8")})
            else:
                self.set_header("Cache-Control", "max-age=604800")
                self.set_header("Content-type", "image")
                self.write(result)


class ListDataGridsHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def get(self):
        result = list_datagrids()
        self.write_json(result)


class GetDataGridTimestampHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def get(self):
        dgid = self.unquote(
            tornado.escape.url_unescape(self.get_query_argument("dgid", ""))
        )
        if dgid:
            result = get_datagrid_timestamp(dgid)
            self.write_json(result)


class StatusHandler(BaseHandler):
    @run_on_executor
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
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        input = data.get("input", None)
        code = data.get("code", None)

        output = custom_output(input, code)
        self.write_json(output)

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        input = self.get_query_argument("input", None)
        code = self.get_query_argument("code", None)

        output = custom_output(input, code)
        self.write_json(output)


class GetAboutDataGridHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def post(self):
        # Required:
        data = tornado.escape.json_decode(self.request.body)
        dgid = self.unquote(data.get("dgid", None))
        url = self.unquote(data.get("url", None))

        if self.ensure_datagrid_path(dgid):
            result = get_about(url, dgid)
            self.write_json({"about": result})

    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        dgid = self.get_query_argument("dgid", None)
        url = self.get_query_argument("url", None)

        if self.ensure_datagrid_path(dgid):
            result = get_about(url, dgid)
            self.write_json({"about": result})


class ChartImageHandler(BaseHandler):
    @run_on_executor
    @auth_wrapper
    def get(self):
        # Required:
        data = tornado.escape.json_decode(self.get_query_argument("data", "{}"))
        chart_type = self.get_query_argument("chartType", None)
        height = int(self.get_query_argument("height", "116"))
        width = int(self.get_query_argument("width", "0"))

        if width == 0:
            width = int(height * 4.5 / 2.75)  # keep same ratio as expanded chart

        image = generate_chart_image(chart_type, data, width, height)

        self.set_header("Cache-Control", "max-age=604800")
        self.set_header("Content-type", "image/png")
        self.write(image)


datagrid_handlers = [
    ("/datagrid/histogram", HistogramHandler),
    ("/datagrid/description", DescriptionHandler),
    ("/datagrid/category", CategoryHandler),
    ("/datagrid/asset-group", AssetGroupHandler),
    ("/datagrid/asset-group-metadata", AssetGroupMetadataHandler),
    ("/datagrid/asset-group-thumbnail", AssetGroupThumbnailHandler),
    ("/datagrid/asset-metadata", AssetMetadataHandler),
    ("/datagrid/query-total", QueryTotalHandler),
    ("/datagrid/query-page", QueryPageHandler),
    ("/datagrid/metadata", MetadataHandler),
    ("/datagrid/download", DownloadHandler),
    ("/datagrid/list", ListDataGridsHandler),
    #    ("/datagrid/output", CustomOutputHandler),
    ("/datagrid/verify-where", VerifyWhereHandler),
    ("/datagrid/timestamp", GetDataGridTimestampHandler),
    ("/datagrid/status", StatusHandler),
    ("/datagrid/completions", CompletionsHandler),
    ("/datagrid/about", GetAboutDataGridHandler),
    ("/datagrid/chart-image", ChartImageHandler),
]
