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

import base64
import json
import logging
import os
import platform
import subprocess
import sys

from flask import Flask, jsonify, make_response, request
from flask_caching import Cache

from .._version import __version__
from ..datatypes.utils import THUMBNAIL_SIZE
from .json_encoder import NestedEncoder
from .queries import (  # custom_output,
    KANGAS_ROOT,
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

# from .utils import get_bool_from_env

USE_AUTH = False
KANGAS_CACHE_FOLDER = os.environ.get("KANGAS_CACHE_FOLDER", "/var/cache/kangas-server/")
os.makedirs(KANGAS_CACHE_FOLDER, exist_ok=True)

SECONDS_IN_DAY = 60 * 60 * 24
SECONDS_IN_MONTH = SECONDS_IN_DAY * 31

application = Flask(__name__)
application.json_encoder = NestedEncoder

KANGAS_CACHE_DAYS = float(
    os.environ.get("KANGAS_CACHE_DAYS", "30.0")
)  # Use 0.0 to disable
cache = Cache(
    application,
    config={
        "CACHE_TYPE": "FileSystemCache" if KANGAS_CACHE_DAYS > 0 else "null",
        "CACHE_DIR": KANGAS_CACHE_FOLDER,
        "CACHE_DEFAULT_TIMEOUT": int(KANGAS_CACHE_DAYS * SECONDS_IN_DAY),
    },
)

log_file = os.environ.get("KANGAS_LOG_FILE")
if log_file:
    KANGAS_LOG_FILE_LEVEL = os.environ.get("KANGAS_LOG_FILE_LEVEL", logging.DEBUG)
    file_handler = logging.FileHandler(log_file, "w+")
    application.logger.addHandler(file_handler)
    application.logger.setLevel(KANGAS_LOG_FILE_LEVEL)

application.logger.info("Loading Kangas Server version %s...", __version__)


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


def make_cache_key_fn(*keys):
    def make_cache_key(*args, **kwargs):
        path = request.path
        data = request.args.to_dict()
        # data = request.get_json(force=True)
        key_list = [path]
        for keyname in keys:
            key_list.append(str(data.get(keyname, None)))
        key = ("|".join(key_list)).encode("utf-8")
        return key

    return make_cache_key


def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def ensure_datagrid_path(dgid):
    application.logger.debug("DataGrid dgid: %s", dgid)
    if dgid is not None:
        db_path = get_dg_path(dgid)
        if os.path.exists(db_path):
            return True

    if dgid is not None:
        application.logging.error("dgid '%s' not found; ignoring" % dgid)

    # self.set_status(404)
    return False


# Handle preflight OPTIONS requests
@application.after_request
def allow_cors(response):
    if request.method == "OPTIONS":  # CORS preflight
        return _build_cors_preflight_response()
    elif request.method in ["GET", "POST"]:
        return _corsify_actual_response(response)
    else:
        raise RuntimeError("Don't know how to handle method {}".format(request.method))


@application.route("/datagrid/category", methods=["GET"])
@auth_wrapper
@cache.cached(
    key_prefix=make_cache_key_fn(
        "dgid",
        "groupBy",
        "columnName",
        "columnValue",
        "whereExpr",
    )
)
def get_datagrid_category_handler():
    application.logger.debug("GET /datagrid/category")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    where_description = request.args.get("whereDescription", where)
    where_expr = request.args.get("whereExpr", where)
    computed_columns = request.args.get("computedColumns", None)
    where_expr = where_expr.strip() if where_expr else None

    if ensure_datagrid_path(dgid):
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
        return result


@application.route("/datagrid/histogram", methods=["GET"])
@auth_wrapper
@cache.cached(
    key_prefix=make_cache_key_fn(
        "dgid",
        "groupBy",
        "columnName",
        "columnValue",
        "whereExpr",
    )
)
def get_datagrid_histogram_handler():
    application.logger.debug("GET /datagrid/histogram")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    where_description = request.args.get("whereDescription", where)
    where_expr = request.args.get("whereExpr", where)
    computed_columns = request.args.get("computedColumns", None)

    if ensure_datagrid_path(dgid):
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
        return results


@application.route("/datagrid/query-total")
@auth_wrapper
def get_datagrid_query_total_handler():
    application.logger.debug("GET /datagrid/query-total")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    computed_columns = request.args.get("computedColumns", None)
    where_expr = request.args.get("whereExpr", None)
    where_expr = where_expr.strip() if where_expr else None

    if ensure_datagrid_path(dgid):
        total = select_query_count(
            dgid,
            group_by,
            computed_columns,
            where_expr,
        )
        result = {"total": total}
        return result


@application.route("/datagrid/query-page")
@auth_wrapper
def get_datagrid_query_page_handler():
    application.logger.debug("GET /datagrid/query-page")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    offset = request.args.get("offset", 0)
    limit = request.args.get("limit", 10)
    group_by = request.args.get("groupBy", None)
    sort_by = request.args.get("sortBy", None)
    sort_desc = request.args.get("sortDesc", "false") == "true"
    select = request.args.get("select", None)
    if select:
        select = select.split(",")
    computed_columns = request.args.get("computedColumns", None)
    where = request.args.get("where", None)
    where_expr = request.args.get("whereExpr", None)
    where_expr = where_expr.strip() if where_expr else None

    if ensure_datagrid_path(dgid):
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
        return result


@application.route("/datagrid/description")
@auth_wrapper
def get_datagrid_description_handler():
    application.logger.debug("GET /datagrid/description")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    select = request.args.get("select", None)
    if select:
        select = select.split(",")
    computed_columns = request.args.get("computedColumns", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    where = request.args.get("where", None)
    where_expr = request.args.get("whereExpr", None)
    where_expr = where_expr.strip() if where_expr else None
    where_description = request.args.get("whereDescription", where)

    if ensure_datagrid_path(dgid):
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
        return result


@application.route("/datagrid/timestamp")
@auth_wrapper
def get_datagrid_timestamp_handler():
    application.logger.debug("GET /datagrid/timestamp")

    dgid = request.args.get("dgid")
    if dgid:
        result = get_datagrid_timestamp(dgid)
        return result


@application.route("/datagrid/list", methods=["GET"])
@auth_wrapper
def get_datagrid_list_handler():
    application.logger.debug("GET /datagrid/list")

    result = list_datagrids()
    return jsonify(result)


@application.route("/datagrid/status", methods=["GET"])
@auth_wrapper
def get_datagrid_status_handler():
    application.logger.debug("GET /datagrid/status")

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
    return result


@application.route("/datagrid/asset-metadata", methods=["GET"])
@auth_wrapper
def get_asset_metadata_handler():
    application.logger.debug("GET /datagrid/asset-metadata")

    # Required:
    asset_id = request.args.get("assetId", None)
    dgid = request.args.get("dgid")

    if ensure_datagrid_path(dgid):
        result = select_asset_metadata(dgid, asset_id)
        return result


@application.route("/datagrid/download", methods=["GET"])
@auth_wrapper
def get_datagrid_download_handler():
    application.logger.debug("GET /datagrid/download")

    # Required:
    asset_id = request.args.get("assetId", None)
    dgid = request.args.get("dgid")
    return_url = request.args.get("returnUrl", "false") == "true"
    thumbnail = request.args.get("thumbnail", "false") == "true"

    if ensure_datagrid_path(dgid):
        result = select_asset(dgid, asset_id, thumbnail)
        if return_url:
            return {"uri": base64.b64encode(result).decode("utf-8")}
        else:
            response = make_response(result)
            response.headers.add("Cache-Control", "max-age=604800")
            response.headers.add("Content-type", "image")
            return response


@application.route("/datagrid/metadata", methods=["GET"])
@auth_wrapper
def get_datagrid_metadata_handler():
    application.logger.debug("GET /datagrid/metadata")

    # Required:
    dgid = request.args.get("dgid", None)

    if ensure_datagrid_path(dgid):
        result = select_metadata(dgid)
        return result


@application.route("/datagrid/asset-group", methods=["GET"])
@auth_wrapper
def get_datagrid_asset_group_handler():
    application.logger.debug("GET /datagrid/asset-group")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    column_offset = int(request.args.get("columnOffset", "0"))
    column_limit = request.args.get("columnLimit", None)
    where_expr = request.args.get("whereExpr", where)
    computed_columns = request.args.get("computedColumns", None)
    where_expr = where_expr.strip() if where_expr else None
    return_url = request.args.get("returnUrl", "false") == "true"

    if ensure_datagrid_path(dgid):
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
            return {"uri": base64.b64encode(result).decode("utf-8")}
        else:
            response = make_response(result)
            response.headers.add("Cache-Control", "max-age=604800")
            return response


@application.route("/datagrid/asset-group-metadata", methods=["GET"])
@auth_wrapper
def get_datagrid_asset_group_metadata_handler():
    application.logger.debug("GET /datagrid/asset-group-metadata")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    column_offset = int(request.args.get("columnOffset", "0"))
    column_limit = request.args.get("columnLimit", None)
    where_expr = request.args.get("whereExpr", where)
    computed_columns = request.args.get("computedColumns", None)
    where_expr = where_expr.strip() if where_expr else None
    distinct = request.args.get("distinct", "true") == "true"

    if ensure_datagrid_path(dgid):
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
        return result


@application.route("/datagrid/asset-group-thumbnail", methods=["GET"])
@auth_wrapper
def get_datagrid_asset_group_thumbnail_handler():
    application.logger.debug("GET /datagrid/asset-group-metadata")

    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    column_offset = int(request.args.get("columnOffset", "0"))
    where_expr = request.args.get("whereExpr", where)
    computed_columns = request.args.get("computedColumns", None)
    where_expr = where_expr.strip() if where_expr else None
    gallery_size = request.args.get("gallerySize", None)
    if gallery_size:
        gallery_size = [int(n) for n in gallery_size.split(",")]
    image_size = request.args.get("imageSize", None)
    if image_size:
        image_size = [int(n) for n in image_size.split(",")]
    else:
        image_size = THUMBNAIL_SIZE
    background_color = request.args.get("backgroundColor", None)
    if background_color:
        background_color = [int(n) for n in background_color.split(",")]
    border_width = int(request.args.get("borderWidth", "1"))
    return_url = request.args.get("returnUrl", "false") == "true"

    if ensure_datagrid_path(dgid):
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
            return {"uri": base64.b64encode(result).decode("utf-8")}
        else:
            response = make_response(result)
            response.headers.add("Cache-Control", "max-age=604800")
            response.headers.add("Content-type", "image/png")
            return response


@application.route("/datagrid/verify-where", methods=["GET"])
@auth_wrapper
def get_datagrid_verify_where_handler():
    application.logger.debug("GET /datagrid/verify-where")

    # Required:
    dgid = request.args.get("dgid", None)
    computed_columns = request.args.get("computedColumns", None)
    where_expr = request.args.get("whereExpr", None)
    where_expr = where_expr.strip() if where_expr else None

    if ensure_datagrid_path(dgid):
        result = verify_where(
            dgid,
            computed_columns,
            where_expr,
        )
        return result


@application.route("/datagrid/completions", methods=["GET"])
@auth_wrapper
def get_datagrid_completions_handler():
    application.logger.debug("GET /datagrid/completions")

    # Required:
    dgid = request.args.get("dgid", None)

    if ensure_datagrid_path(dgid):
        results = get_completions(dgid)
        return results


@application.route("/datagrid/chart-image", methods=["GET"])
@auth_wrapper
def get_datagrid_chart_image_handler():
    application.logger.debug("GET /datagrid/chart-image")

    # Required:
    data = json.loads(request.args.get("data", "{}"))
    chart_type = request.args.get("chartType", None)
    height = int(request.args.get("height", "116"))
    width = int(request.args.get("width", "0"))

    if width == 0:
        width = int(height * 4.5 / 2.75)  # keep same ratio as expanded chart

    image = generate_chart_image(chart_type, data, width, height)

    response = make_response(image)
    response.headers.add("Cache-Control", "max-age=604800")
    response.headers.add("Content-type", "image/png")
    return response


@application.route("/datagrid/about", methods=["GET"])
@auth_wrapper
def get_datagrid_about_handler():
    application.logger.debug("GET /datagrid/about")

    dgid = request.args.get("dgid", None)
    url = request.args.get("url", None)

    if ensure_datagrid_path(dgid):
        result = get_about(url, dgid)
        return result


def run(host, port, debug, processes):
    application.run(
        host=host, port=port, debug=debug, threaded=False, processes=processes
    )
