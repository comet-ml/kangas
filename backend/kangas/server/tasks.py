import os
import json
from celery import Celery
from .queries import (
    generate_chart_image,
    get_dg_path,
    select_asset,
    select_asset_group,
    select_asset_group_metadata,
    select_asset_group_thumbnail,
    select_asset_metadata,
    select_category,
    select_histogram
)

def ensure_datagrid_path(dgid):
    if dgid is not None:
        db_path = get_dg_path(dgid)
        if os.path.exists(db_path):
            return True

    return False

app = Celery('tasks', broker='pyamqp://guest@localhost//')

@app.task(bind=True)
def generate_chart_image_task(self, chart_type, data, width, height):
    try:
        if width == 0:
            width = int(height * 4.5 / 2.75)  # keep same ratio as expanded chart

        image = generate_chart_image(chart_type, data, width, height)

        return image
    except Exception as e:
        print(e)
        raise self.retry(exc=e, countdown=1)


@app.task(bind=True)
def asset_metadata(self, dgid, asset_id):
    try:
        result = select_asset_metadata(dgid, asset_id)
        return json.loads(result)
    except Exception as e:
        print(e)
        raise self.retry(exc=e, countdown=1)

@app.task(bind=True)
def download(self, dgid, asset_id, thumbnail):
    try:
        result = select_asset(dgid, asset_id, thumbnail)
        return result
    except Exception as e:
        print(e)
        raise self.retry(exc=e, countdown=1)

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
        print(e)
        raise self.retry(exc=e, countdown=1)

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
    distinct
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
            distinct
        )
        return result
    except Exception as e:
        print(e)
        raise self.retry(exc=e, countdown=1)


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
        print(e)
        raise self.retry(exc=e, countdown=1)

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
    where_expr
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
            where_expr
        )
        return result

    except Exception as e:
        print(e)
        raise self.retry(exc=e, countdown=1)

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
    where_expr
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
            where_expr
        )
        return result
        
    except Exception as e:
        print(e)
        raise self.retry(exc=e, countdown=1)
