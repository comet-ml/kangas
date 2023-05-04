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
import json
import logging
import os
import platform
import sys
from urllib.parse import unquote

import waitress
from flask import Flask, make_response, request, send_file
from flask.logging import default_handler
from flask_caching import Cache

from .._version import __version__
from ..datatypes.utils import THUMBNAIL_SIZE, image_to_fp
from .queries import (  # custom_output,
    KANGAS_ROOT,
    get_about,
    get_completions,
    get_datagrid_timestamp,
    get_dg_path,
    select_description,
    select_metadata,
    select_query_count,
    select_query_page,
    verify_where,
)
from .tasks import (
    generate_chart_image_task,
    list_datagrids_task,
    select_asset_group_metadata_task,
    select_asset_group_task,
    select_asset_group_thumbnail_task,
    select_asset_metadata_task,
    select_asset_task,
    select_category_task,
    select_histogram_task,
    select_projection_data_task,
)
from .translogger import TransLogger
from .utils import get_node_version

USE_AUTH = False
KANGAS_CACHE_FOLDER = os.environ.get("KANGAS_CACHE_FOLDER", "/var/cache/kangas-server/")
# os.makedirs(KANGAS_CACHE_FOLDER, exist_ok=True)

SECONDS_IN_DAY = 60 * 60 * 24
SECONDS_IN_MONTH = SECONDS_IN_DAY * 31

application = Flask(__name__)
application.logger.removeHandler(default_handler)

KANGAS_CACHE_DAYS = float(
    os.environ.get("KANGAS_CACHE_DAYS", "30.0")
)  # Use 0.0 to disable
if os.path.exists(KANGAS_CACHE_FOLDER):
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


def error(error_code):
    response = make_response(str(error_code))
    response.status_code = error_code
    return response


def auth_wrapper(function):
    return function


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
    response.headers.add("x-requested-with", "Cache-Control")
    return response


def ensure_datagrid_path(dgid):
    if dgid is not None:
        db_path = get_dg_path(dgid)
        if os.path.exists(db_path):
            return True

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
# @cache.cached(
#    key_prefix=make_cache_key_fn(
#        "dgid",
#        "groupBy",
#        "columnName",
#        "columnValue",
#        "whereExpr",
#    )
# )
def get_datagrid_category_handler():
    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    where_description = request.args.get("whereDescription", where)
    where_expr = request.args.get("whereExpr", where)
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
    where_expr = where_expr.strip() if where_expr else None

    if ensure_datagrid_path(dgid):
        result = select_category_task.apply(
            args=(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                where_description,
                computed_columns,
                where_expr,
            )
        ).get()
        return result
    else:
        return error(404)


@application.route("/datagrid/histogram", methods=["GET"])
@auth_wrapper
# @cache.cached(
#    key_prefix=make_cache_key_fn(
#        "dgid",
#        "groupBy",
#        "columnName",
#        "columnValue",
#        "whereExpr",
#    )
# )
def get_datagrid_histogram_handler():
    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    where_description = request.args.get("whereDescription", where)
    where_expr = request.args.get("whereExpr", where)
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))

    if ensure_datagrid_path(dgid):
        results = select_histogram_task.apply(
            args=(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                where_description,
                computed_columns,
                where_expr,
            )
        ).get()
        return results
    else:
        return error(404)


@application.route("/datagrid/query-total")
@auth_wrapper
def get_datagrid_query_total_handler():
    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
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
    else:
        return error(404)


@application.route("/datagrid/query-page")
@auth_wrapper
def get_datagrid_query_page_handler():
    # Required:
    dgid = request.args.get("dgid")
    timestamp = request.args.get("timestamp")
    # Optional:
    offset = int(request.args.get("offset", "0"))
    limit = int(request.args.get("limit", "10"))
    group_by = request.args.get("groupBy", None)
    sort_by = request.args.get("sortBy", None)
    sort_desc = request.args.get("sortDesc", "false") == "true"
    select = json.loads(unquote(request.args.get("select", "null")))
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
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
            timestamp=timestamp,
        )
        return result
    else:
        return error(404)


@application.route("/datagrid/description")
@auth_wrapper
def get_datagrid_description_handler():
    # Required:
    dgid = request.args.get("dgid")

    # Optional:
    group_by = request.args.get("groupBy", None)
    select = request.args.get("select", None)
    if select:
        select = select.split(",")

    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
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
    else:
        return error(404)


@application.route("/datagrid/timestamp")
@auth_wrapper
def get_datagrid_timestamp_handler():
    dgid = request.args.get("dgid")
    if dgid:
        result = get_datagrid_timestamp(dgid)
        return result
    else:
        return error(404)


@application.route("/datagrid/list", methods=["GET"])
@auth_wrapper
def get_datagrid_list_handler():
    result = list_datagrids_task.apply().get()
    return result


@application.route("/datagrid/status", methods=["GET"])
@auth_wrapper
def get_datagrid_status_handler():
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
    # Required:
    asset_id = request.args.get("assetId")
    dgid = request.args.get("dgid")

    if ensure_datagrid_path(dgid):
        metadata = select_asset_metadata_task.apply(args=(dgid, asset_id))

        return metadata.get()
    else:
        return error(404)


@application.route("/datagrid/download", methods=["GET"])
@auth_wrapper
def get_datagrid_download_handler():
    import PIL.Image

    # Required:
    asset_id = request.args.get("assetId")
    dgid = request.args.get("dgid")
    return_url = request.args.get("returnUrl", "false") == "true"
    thumbnail = request.args.get("thumbnail", "false") == "true"

    if not ensure_datagrid_path(dgid):
        return error(404)

    if asset_id:
        result = select_asset_task.apply(args=(dgid, asset_id, thumbnail)).get()
        if return_url:
            if result:
                return {"uri": base64.b64encode(result).decode("utf-8")}
            else:
                error_image = PIL.Image.new(
                    mode="RGB",
                    size=(100, 100),
                    color="red",
                )
                result = image_to_fp(error_image, "png").read()
                return {"uri": base64.b64encode(result).decode("utf-8")}
        else:
            if result is None:
                error_image = PIL.Image.new(
                    mode="RGB",
                    size=(100, 100),
                    color="red",
                )
                result = image_to_fp(error_image, "png").read()

            response = make_response(result)
            response.headers.add("Cache-Control", "max-age=604800")
            response.headers.add("Content-type", "image")
            return response
    else:
        # Download the entire datagrid:
        db_path = get_dg_path(dgid)
        download_name = os.path.basename(db_path)
        fp = open(db_path, "rb")
        return send_file(fp, download_name=download_name, as_attachment=True)


@application.route("/datagrid/metadata", methods=["GET"])
@auth_wrapper
def get_datagrid_metadata_handler():
    # Required:
    dgid = request.args.get("dgid")

    if ensure_datagrid_path(dgid):
        result = select_metadata(dgid)
        return result
    else:
        return error(404)


@application.route("/datagrid/asset-group", methods=["GET"])
@auth_wrapper
def get_datagrid_asset_group_handler():
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
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
    where_expr = where_expr.strip() if where_expr else None
    return_url = request.args.get("returnUrl", "false") == "true"

    if ensure_datagrid_path(dgid):
        result = select_asset_group_task.apply(
            args=(
                dgid,
                group_by,
                where,
                column_name,
                column_value,
                column_offset,
                column_limit,
                computed_columns,
                where_expr,
                True,
            )
        ).get()

        if return_url:
            return {"uri": base64.b64encode(result).decode("utf-8")}
        else:
            response = make_response(result)
            response.headers.add("Cache-Control", "max-age=604800")
            response.headers.add("Content-type", "image/png")
            return response
    else:
        return error(404)


@application.route("/datagrid/asset-group-metadata", methods=["GET"])
@auth_wrapper
def get_datagrid_asset_group_metadata_handler():
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
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
    where_expr = where_expr.strip() if where_expr else None
    distinct = request.args.get("distinct", "true") == "true"

    if ensure_datagrid_path(dgid):
        result = select_asset_group_metadata_task.apply(
            args=(
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
        ).get()
        return result
    else:
        return error(404)


@application.route("/datagrid/asset-group-thumbnail", methods=["GET"])
@auth_wrapper
def get_datagrid_asset_group_thumbnail_handler():
    # Required:
    dgid = request.args.get("dgid")
    # Optional:
    group_by = request.args.get("groupBy", None)
    where = request.args.get("where", None)
    column_name = request.args.get("columnName", None)
    column_value = get_column_value(request.args.get("columnValue", None))
    column_offset = int(request.args.get("columnOffset", "0"))
    where_expr = request.args.get("whereExpr", where)
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
    where_expr = where_expr.strip() if where_expr else None
    gallery_size = json.loads(unquote(request.args.get("gallerySize", "[]")))
    image_size = json.loads(unquote(request.args.get("imageSize", str(THUMBNAIL_SIZE))))
    background_color = json.loads(unquote(request.args.get("backgroundColor", "null")))
    border_width = int(request.args.get("borderWidth", "1"))
    return_url = request.args.get("returnUrl", "false") == "true"
    distinct = True

    if ensure_datagrid_path(dgid):
        result = select_asset_group_thumbnail_task.apply(
            args=(
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
            )
        ).get()

        if return_url:
            return {"uri": base64.b64encode(result).decode("utf-8")}
        else:
            response = make_response(result)
            response.headers.add("Cache-Control", "max-age=604800")
            response.headers.add("Content-type", "image/png")
            return response
    else:
        return error(404)


@application.route("/datagrid/verify-where", methods=["GET"])
@auth_wrapper
def get_datagrid_verify_where_handler():
    # Required:
    dgid = request.args.get("dgid")
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))
    where_expr = request.args.get("whereExpr", None)
    where_expr = where_expr.strip() if where_expr else None

    if ensure_datagrid_path(dgid):
        result = verify_where(
            dgid,
            computed_columns,
            where_expr,
        )
        return result
    else:
        return error(404)


@application.route("/datagrid/completions", methods=["GET"])
@auth_wrapper
def get_datagrid_completions_handler():
    # Required:
    dgid = request.args.get("dgid")
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))

    if ensure_datagrid_path(dgid):
        results = get_completions(dgid, computed_columns)
        return results
    else:
        return error(404)


@application.route("/datagrid/chart-image", methods=["GET"])
@auth_wrapper
def get_datagrid_chart_image_handler():
    # Required:
    data = json.loads(request.args.get("data", "{}"))
    chart_type = request.args.get("chartType", None)
    height = int(request.args.get("height", "116"))
    width = int(request.args.get("width", "0"))

    image = generate_chart_image_task.apply(
        args=(chart_type, data, width, height, None, None)
    ).get()

    response = make_response(image)
    response.headers.add("Cache-Control", "max-age=604800")
    response.headers.add("Content-type", "image/png")
    return response


@application.route("/datagrid/about", methods=["GET"])
@auth_wrapper
def get_datagrid_about_handler():
    dgid = request.args.get("dgid")
    url = request.args.get("url")

    if ensure_datagrid_path(dgid):
        result = get_about(url, dgid)
        return {"about": result}
    else:
        return error(404)


@application.route("/datagrid/embeddings-as-pca", methods=["GET"])
@auth_wrapper
def get_embeddings_as_projection():
    dgid = request.args.get("dgid")
    timestamp = request.args.get("timestamp")
    # if one asset:
    column_name = request.args.get("columnName")
    asset_id = request.args.get("assetId")
    # group by:
    column_value = request.args.get("columnValue")
    group_by = request.args.get("groupBy")
    where_expr = request.args.get("whereExpr")
    # if thumbnail, need these:
    thumbnail = request.args.get("thumbnail", "false") == "true"
    height = int(request.args.get("height", "116"))
    width = int(request.args.get("width", "0"))
    computed_columns = json.loads(unquote(request.args.get("computedColumns", "null")))

    if ensure_datagrid_path(dgid):
        projection_data = select_projection_data_task.apply(
            args=(
                dgid,
                timestamp,
                asset_id,
                column_name,
                column_value,
                group_by,
                where_expr,
                computed_columns,
            )
        ).get()
        if thumbnail:
            metadata = select_metadata(dgid)
            x_range = metadata[column_name]["other"].get("x_range")
            y_range = metadata[column_name]["other"].get("y_range")
            image = generate_chart_image_task.apply(
                args=("scatter", projection_data, width, height, x_range, y_range)
            ).get()
            response = make_response(image)
            response.headers.add("Cache-Control", "max-age=604800")
            response.headers.add("Content-type", "image/png")
            return response
        else:
            return projection_data
    else:
        return error(404)


def run(host, port, debug_level, max_workers):
    if debug_level is None:
        debug_level = "CRITICAL"

    logging.basicConfig(
        level=debug_level,
    )
    for log_name in ["waitress", "waitress.queue"]:
        logger = logging.getLogger(log_name)
        logger.setLevel(debug_level)
        logger.propagate = False

    waitress.serve(
        TransLogger(
            application,
            setup_console_handler=False,
            set_logger_level=debug_level,
        ),
        host=host,
        port=port,
        threads=max_workers,
    )
