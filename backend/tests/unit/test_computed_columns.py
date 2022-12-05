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

from kangas import DataGrid, Image
from kangas.server.computed_columns import eval_computed_columns, update_state
from kangas.server.queries import select_query_count, select_query_page

from ..testlib import AlwaysEquals

DGID = "test_computed_columns.datagrid"
dg = DataGrid(columns=["A", "X", "Text", "Image"])
dg.filename = DGID

dg.extend(
    [
        [1, 2.0, "hello", Image([[0, 0.5, 1.0]], metadata={"tag": "dog"})],
        [2, 3.0, "world", Image([[0, 0.5, 1.0]], metadata={"tag": "cat"})],
        [3, 4.0, "test", Image([[0, 0.5, 1.0]], metadata={"tag": "dog"})],
    ]
)

dg.save()


def select_by_query(where_expr, computed_columns):
    return select_query_page(
        DGID,
        offset=0,
        group_by=None,
        sort_by=None,
        sort_desc=None,
        where=None,
        limit=100,
        select_columns=None,
        computed_columns=computed_columns,
        where_expr=where_expr,
    )


def select_by_query_count(where_expr, computed_columns, group_by=None):
    return select_query_count(
        DGID,
        group_by,
        computed_columns=computed_columns,
        where_expr=where_expr,
    )


def cc(name, field_expr, field_name, field_type="TEXT"):
    return {
        name: {
            "field_expr": field_expr,
            "field_name": field_name,
            "type": field_type,
        }
    }


def ccs(*cc):
    retval = {}
    for c in cc:
        retval.update(c)
    return retval


def test_none():
    computed_columns = {}

    metadata = cc("A", "42", "column_1")
    databases = []
    columns = ["A"]
    select_expr_as = []
    where_expr = "{'A'} == 42"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == ["A"]
    assert metadata == cc("A", "42", "column_1")
    assert databases == []
    assert select_expr_as == []
    assert where_sql == "column_1 = 42"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": ["ROW_ID", "INTEGER", "FLOAT", "TEXT", "IMAGE-ASSET", "JSON"],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata"],
        "ncols": 6,
        "nrows": 0,
        "rows": [],
    }
    assert results == expected_results
    assert 0 == select_by_query_count(where_expr, computed_columns)


def test_simple_1():
    computed_columns = cc("X", "42", "cc1")

    metadata = {}
    databases = []
    columns = []
    select_expr_as = []
    where_expr = "{'X'} == 42"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == list(computed_columns)
    assert metadata == computed_columns
    assert databases == []
    assert select_expr_as == ["42 AS cc1"]
    assert where_sql == "cc1 = 42"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": [
            "ROW_ID",
            "INTEGER",
            "TEXT",
            "TEXT",
            "IMAGE-ASSET",
            "JSON",
            "TEXT",
        ],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata", "X"],
        "ncols": 7,
        "nrows": 3,
        "rows": [
            {
                "A": 1,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"width": 3, "height": 1},
                    "tag": "dog",
                },
                "Text": "hello",
                "X": 42,
                "row-id": 1,
            },
            {
                "A": 2,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"width": 3, "height": 1},
                    "tag": "cat",
                },
                "Text": "world",
                "X": 42,
                "row-id": 2,
            },
            {
                "A": 3,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"width": 3, "height": 1},
                    "tag": "dog",
                },
                "Text": "test",
                "X": 42,
                "row-id": 3,
            },
        ],
    }
    assert results == expected_results
    assert 3 == select_by_query_count(where_expr, computed_columns)


def test_simple_2():
    computed_columns = cc("X", "42 * 15 - 1", "cc1")

    metadata = {}
    databases = []
    columns = []
    select_expr_as = []
    where_expr = "{'X'} == 42"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == list(computed_columns)
    assert metadata == cc("X", "((42 * 15) - 1)", "cc1")
    assert databases == []
    assert select_expr_as == ["((42 * 15) - 1) AS cc1"]
    assert where_sql == "cc1 = 42"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": [
            "ROW_ID",
            "INTEGER",
            "TEXT",
            "TEXT",
            "IMAGE-ASSET",
            "JSON",
            "TEXT",
        ],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata", "X"],
        "ncols": 7,
        "nrows": 0,
        "rows": [],
    }
    assert results == expected_results
    assert 0 == select_by_query_count(where_expr, computed_columns)


def test_aggregate_where1():
    computed_columns = cc("X", "42", "cc1")

    metadata = {}
    databases = []
    columns = []
    select_expr_as = []
    where_expr = "{'X'} < AVG({'X'})"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == list(computed_columns)
    assert metadata == computed_columns
    assert databases == [
        "(SELECT rowid, AVG(42) AS AVG_aggregate_column_1 FROM datagrid)"
    ]
    assert select_expr_as == ["42 AS cc1"]
    assert where_sql == "cc1 < AVG_aggregate_column_1"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": [
            "ROW_ID",
            "INTEGER",
            "TEXT",
            "TEXT",
            "IMAGE-ASSET",
            "JSON",
            "TEXT",
        ],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata", "X"],
        "ncols": 7,
        "nrows": 0,
        "rows": [],
    }
    assert results == expected_results
    assert 0 == select_by_query_count(where_expr, computed_columns)


def test_aggregate_column():
    computed_columns = cc("AVG A", "AVG({'A'})", "cc1")

    metadata = cc("A", None, "column_1")
    databases = []
    columns = ["A"]
    select_expr_as = []
    where_expr = "{'A'} < {'AVG A'}"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == ["A", "AVG A"]
    assert metadata == ccs(
        cc("A", None, "column_1"),
        cc("AVG A", "AVG_aggregate_column_1", "cc1"),
    )
    assert databases == [
        "(SELECT rowid, AVG(column_1) AS AVG_aggregate_column_1 FROM datagrid)"
    ]
    assert select_expr_as == ["AVG_aggregate_column_1 AS cc1"]
    assert where_sql == "column_1 < cc1"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": [
            "ROW_ID",
            "INTEGER",
            "FLOAT",
            "TEXT",
            "IMAGE-ASSET",
            "JSON",
            "TEXT",
        ],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata", "AVG A"],
        "ncols": 7,
        "nrows": 1,
        "rows": [
            {
                "A": 1,
                "AVG A": 2.0,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"height": 1, "width": 3},
                    "tag": "dog",
                },
                "Text": "hello",
                "X": 2.0,
                "row-id": 1,
            }
        ],
    }
    assert results == expected_results
    assert 1 == select_by_query_count(where_expr, computed_columns)


def test_image_column():
    computed_columns = {}

    metadata = cc("Image", None, "column_4")
    databases = []
    columns = ["Image"]
    select_expr_as = []
    where_expr = ""

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == ["Image"]
    assert metadata == ccs(
        cc("Image", None, "column_4"),
    )
    assert databases == []
    assert select_expr_as == []
    assert where_sql is None

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": ["ROW_ID", "INTEGER", "FLOAT", "TEXT", "IMAGE-ASSET", "JSON"],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata"],
        "ncols": 6,
        "nrows": 3,
        "rows": [
            {
                "A": 1,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"height": 1, "width": 3},
                    "tag": "dog",
                },
                "Text": "hello",
                "X": 2.0,
                "row-id": 1,
            },
            {
                "A": 2,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"height": 1, "width": 3},
                    "tag": "cat",
                },
                "Text": "world",
                "X": 3.0,
                "row-id": 2,
            },
            {
                "A": 3,
                "Image": {
                    "assetId": AlwaysEquals(),
                    "assetType": "image",
                    "type": "asset",
                },
                "Image--metadata": {
                    "assetId": AlwaysEquals(),
                    "image": {"height": 1, "width": 3},
                    "tag": "dog",
                },
                "Text": "test",
                "X": 4.0,
                "row-id": 3,
            },
        ],
    }
    assert results == expected_results
    assert 3 == select_by_query_count(where_expr, computed_columns)


def test_image_column_metadata():
    computed_columns = {}

    metadata = ccs(
        cc("Image", None, "column_4"),
        cc("Image--metadata", None, "column_5"),
    )
    databases = []
    columns = ["Image"]
    select_expr_as = []
    where_expr = "{'Image'}.extension == 'jpg'"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == ["Image"]
    assert metadata == ccs(
        cc("Image", None, "column_4"),
        cc("Image--metadata", None, "column_5"),
    )
    assert databases == []
    assert select_expr_as == []
    assert where_sql == "json_extract(column_5, '$.extension') = 'jpg'"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": ["ROW_ID", "INTEGER", "FLOAT", "TEXT", "IMAGE-ASSET", "JSON"],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata"],
        "ncols": 6,
        "nrows": 0,
        "rows": [],
    }
    assert results == expected_results
    assert 0 == select_by_query_count(where_expr, computed_columns)


def test_image_computed_column():
    computed_columns = cc("Image2", "{'Image'}.extension", "cc1")

    metadata = ccs(
        cc("Image", None, "column_4"),
        cc("Image--metadata", None, "column_5"),
    )
    databases = []
    columns = ["Image"]
    select_expr_as = []
    where_expr = "{'Image2'} == 'jpg'"

    where_sql = update_state(
        DGID,
        computed_columns,
        metadata,
        databases,
        columns,
        select_expr_as,
        where_expr,
    )

    assert columns == ["Image", "Image2"]
    assert metadata == ccs(
        cc("Image", None, "column_4"),
        cc("Image--metadata", None, "column_5"),
        cc("Image2", "json_extract(column_5, '$.extension')", "cc1"),
    )
    assert databases == []
    assert select_expr_as == ["json_extract(column_5, '$.extension') AS cc1"]
    assert where_sql == "cc1 = 'jpg'"

    results = select_by_query(where_expr, computed_columns)
    expected_results = {
        "columnTypes": [
            "ROW_ID",
            "INTEGER",
            "FLOAT",
            "TEXT",
            "IMAGE-ASSET",
            "JSON",
            "TEXT",
        ],
        "columns": ["row-id", "A", "X", "Text", "Image", "Image--metadata", "Image2"],
        "ncols": 7,
        "nrows": 0,
        "rows": [],
    }
    assert results == expected_results
    assert 0 == select_by_query_count(where_expr, computed_columns)


def test_shortcut_boolean_logic():
    results = eval_computed_columns({}, "1 < 4 < 2")
    assert results[2] == "1 < 4 and 4 < 2"


def test_boolean_logic():
    results = eval_computed_columns({}, "(1 < 4) and (4 < 2)")
    assert results[2] == "(1 < 4 and 4 < 2)"
