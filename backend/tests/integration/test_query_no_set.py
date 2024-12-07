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

import kangas as kg

dg = kg.read_datagrid(
    "https://github.com/caleb-kaiser/kangas_examples/raw/master/coco-500.datagrid"
)


def test_query_basic_1():
    df = dg.select_dataframe(where='image.labels.dog > 0')
    assert len(df) == 30


def test_query_basic_2():
    df = dg.select_dataframe(where='image.labels.dog and image.labels.cat')
    assert len(df) == 3


def test_query_basic_3():
    df = dg.select_dataframe('image.labels.dog == image.labels.cat')
    assert len(df) == 2


def test_query_basic_4():
    df = dg.select_dataframe('image.labels.person > 16')
    assert len(df) == 1


def test_query_basic_5():
    df = dg.select_dataframe(
        'image.labels.toilet > 9',
    )
    assert len(df) == 1


def test_query_in_sql():
    df = dg.select_dataframe(
        computed_columns={"x": '"dog" in image.labels.keys()'}, where='x'
    )
    assert len(df) == 30


def test_query_in_sql_1():
    df = dg.select_dataframe(
        computed_columns={"x": 'image.labels.dog in [1]'}, where='x'
    )
    assert len(df) == 20


def test_query_in_sql_2():
    df = dg.select_dataframe(
        computed_columns={"x": 'image.labels.dog in [2]'}, where='x'
    )
    assert len(df) == 9


def test_query_in_sql_3():
    df = dg.select_dataframe(
        computed_columns={"x": 'image.labels.dog in [1, 2]'}, where='x'
    )
    assert len(df) == 29


def test_query_in_sql_4():
    df = dg.select_dataframe(
        computed_columns={"x": '"1895" in Image.filename'}, where='x'
    )
    assert len(df) == 2


def test_query_in_python():
    df = dg.select_dataframe(
        computed_columns={"x": '[x == "dog" for x in image.labels.keys()]'},
        where='any(x)',
    )
    assert len(df) == 30


def test_query_in_python_1():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([key == "dog" for key in x]) for x in image.labels]'
        },
        where='any(x)',
    )
    assert len(df) == 30


def test_query_in_python_2():
    df = dg.select_dataframe(
        computed_columns={"x": '["dog" in x for x in image.labels.keys()]'},
        where='any(x)',
    )
    assert len(df) == 30


def test_query_in_python_3():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([annotation["label"] == "dog" for annotation in layer["data"]]) for layer in Image.annotations]'
        },
        where='any(x)',
    )
    assert len(df) == 30


def test_query_in_python_4():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([annotation["label"] == "person" for annotation in layer["data"]]) for layer in Image.annotations]'
        },
        where='any(x)',
    )
    assert len(df) == 212


def test_query_in_python_5():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([annotation["label"] in ["car", "bicycle"] for annotation in layer["data"]]) for layer in Image.annotations]'
        },
        where='any(x)',
    )
    assert len(df) == 75


def test_query_in_python_6():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([annotation["label"] == "cat" or annotation["label"] == "dog" for annotation in layer["data"]]) for layer in Image.annotations]'
        },
        where='any(x)',
    )
    assert len(df) == 66


def test_query_in_python_7():
    df = dg.select_dataframe(
        computed_columns={
            "cat": '[any([annotation["label"] == "cat" for annotation in layer["data"]]) for layer in Image.annotations]',
            "dog": '[any([annotation["label"] == "dog" for annotation in layer["data"]]) for layer in Image.annotations]',
        },
        where='any(cat) or any(dog)',
    )
    assert len(df) == 66


def test_query_in_python_8():
    df = dg.select_dataframe(
        computed_columns={
            "x": '[any([annotation["score"] > 0.999 for annotation in layer["data"]]) for layer in Image.annotations]'
        },
        where='any(x)',
    )
    assert len(df) == 2
