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

import kangas as kg

dg = kg.read_datagrid(
    "https://github.com/caleb-kaiser/kangas_examples/raw/master/coco-500.datagrid"
)


def test_query_basic_1():
    df = dg.select_dataframe(where='{"image"}.labels.dog > 0')
    assert len(df) == 30


def test_query_basic_2():
    df = dg.select_dataframe(where='{"image"}.labels.dog and {"image"}.labels.cat')
    assert len(df) == 3


def test_query_basic_3():
    df = dg.select_dataframe('{"image"}.labels.dog == {"image"}.labels.cat')
    assert len(df) == 2


def test_query_basic_4():
    df = dg.select_dataframe('{"image"}.labels.person > 16')
    assert len(df) == 2


def test_query_basic_5():
    df = dg.select_dataframe(
        '{"image"}.labels.toilet > 9',
    )
    assert len(df) == 1


def test_query_in_sql():
    df = dg.select_dataframe(
        computed_columns={"x": '"dog" in {"image"}.labels.keys()'}, where='{"x"}'
    )
    assert len(df) == 30


def test_query_in_sql_1():
    df = dg.select_dataframe(
        computed_columns={"x": '{"image"}.labels.dog in [1]'}, where='{"x"}'
    )
    assert len(df) == 19


def test_query_in_sql_2():
    df = dg.select_dataframe(
        computed_columns={"x": '{"image"}.labels.dog in [2]'}, where='{"x"}'
    )
    assert len(df) == 9


def test_query_in_sql_3():
    df = dg.select_dataframe(
        computed_columns={"x": '{"image"}.labels.dog in [1, 2]'}, where='{"x"}'
    )
    assert len(df) == 28


def test_query_in_python():
    df = dg.select_dataframe(
        computed_columns={"x": '[x == "dog" for x in {"image"}.labels.keys()]'},
        where='any({"x"})',
    )
    assert len(df) == 30


def test_query_in_python_1():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([key == "dog" for key in x]) for x in {"image"}.labels]'
        },
        where='any({"x"})',
    )
    assert len(df) == 30


def test_query_in_python_2():
    df = dg.select_dataframe(
        computed_columns={"x": '["dog" in x for x in {"image"}.labels.keys()]'},
        where='any({"x"})',
    )
    assert len(df) == 30
