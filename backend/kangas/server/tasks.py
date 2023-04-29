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

import json
import os

try:
    from celery import Celery
except ImportError:
    Celery = None

from .queries import (
    generate_chart_image,
    get_dg_path,
    list_datagrids,
    select_asset,
    select_asset_group,
    select_asset_group_metadata,
    select_asset_group_thumbnail,
    select_asset_metadata,
    select_category,
    select_histogram,
    select_projection_data,
)

# from .utils import get_bool_from_env

KANGAS_USE_CELERY = int(os.environ.get("KANGAS_USE_CELERY", "0"))


def ensure_datagrid_path(dgid):
    if dgid is not None:
        db_path = get_dg_path(dgid)
        if os.path.exists(db_path):
            return True

    return False


def get_retry_kwargs(e):
    print(e)
    return {
        "retry_backoff": True,  # exponential backoff to prevent swamping server
        "max_retries": 5,  # max int retries
        "countdown": 10,  # seconds
        "retry_jitter": True,  # randomness in countdown
        # "retry_backoff_max": 10,
        # "rate_limit": 20,
    }


if KANGAS_USE_CELERY and Celery is not None:
    print("Using flask with celery")

    app = Celery(
        "tasks",
        broker="pyamqp://guest@localhost//",
    )

else:
    print("Using flask")

    class Result:
        def __init__(self, function, args):
            self.function = function
            self.args = args

        def get(self):
            return self.function(self, *self.args)

        def retry(self, exc, **kwargs):
            raise exc

    class Task:
        def __init__(self, function):
            self.function = function

        def apply(self, args=tuple()):
            return Result(self.function, args)

    class App:
        @classmethod
        def task(cls, bind=True):
            def wrapper(function):
                return Task(function)

            return wrapper

    app = App()


@app.task(bind=True)
def generate_chart_image_task(self, chart_type, data, width, height, x_range, y_range):
    try:
        if width == 0:
            width = int(height * 4.5 / 2.75)  # keep same ratio as expanded chart

        image = generate_chart_image(chart_type, data, width, height, x_range, y_range)

        return image
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_asset_metadata_task(self, dgid, asset_id):
    try:
        result = select_asset_metadata(dgid, asset_id)
        return json.loads(result)
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_projection_data_task(
    self,
    dgid,
    timestamp,
    asset_id,
    column_name,
    column_value,
    group_by,
    where_expr,
    computed_columns,
):
    try:
        result = select_projection_data(
            dgid,
            timestamp,
            asset_id,
            column_name,
            column_value,
            group_by,
            where_expr,
            computed_columns,
        )
        return result
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_asset_task(self, dgid, asset_id, thumbnail):
    try:
        result = select_asset(dgid, asset_id, thumbnail)
        return result
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def list_datagrids_task(self):
    try:
        return list_datagrids()
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_asset_group_task(
    self,
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
):
    try:
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
        return result
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_asset_group_thumbnail_task(
    self,
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
    try:
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
            distinct,
        )
        return result
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_asset_group_metadata_task(
    self,
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
    try:
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
    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_histogram_task(
    self,
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    try:
        result = select_histogram(
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

    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)


@app.task(bind=True)
def select_category_task(
    self,
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    try:
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

    except Exception as e:
        kwargs = get_retry_kwargs(e)
        raise self.retry(exc=e, **kwargs)
