from kangas import DataGrid, Image
from kangas.server.computed_columns import update_state
from kangas.server.queries import select_query

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
    return select_query(
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
    assert where_sql == None

    results = select_by_query(where_expr, computed_columns)


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
