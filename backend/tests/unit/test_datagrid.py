# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2022 Kangas Development Team    #
#    All rights reserved                             #
######################################################

import datetime
import os
import random

import pytest

from kangas import Audio, Curve, DataGrid, Image, Text, Video
from kangas.datatypes.utils import convert_string_to_date, convert_string_to_value
from kangas.utils import make_column_name, sanitize_name

HERE = os.path.abspath(os.path.dirname(__file__))

videos = [
    Video(os.path.join(HERE, "../data/flower.webm")),
]

images = [
    Image(os.path.join(HERE, "../data/logo.png")),
]
image1 = Image(os.path.join(HERE, "../data/logo.png"))
image2 = Image(os.path.join(HERE, "../data/logo.png"))


audios = [
    Audio(file_name=os.path.join(HERE, "../data/CantinaBand3.wav")),
    Audio(file_name=os.path.join(HERE, "../data/gettysburg10.wav")),
    Audio(file_name=os.path.join(HERE, "../data/preamble10.wav")),
    Audio(file_name=os.path.join(HERE, "../data/sample.wav")),
    Audio(file_name=os.path.join(HERE, "../data/StarWars3.wav")),
    Audio(file_name=os.path.join(HERE, "../data/taunt.wav")),
]

texts = [
    Text("Lorem ipsum"),
    Text("Sed ut perspiciatis"),
    Text("The European"),
    Text("Far far away"),
    Text("One morning"),
]


def get_video():
    return random.choice(videos)


def get_audio():
    return random.choice(audios)


def get_text():
    return random.choice(texts)


def get_image():
    return random.choice(images)


def get_date():
    return datetime.date.fromtimestamp(random.randint(111111111, 999999999))


def get_datetime():
    return datetime.datetime.fromtimestamp(random.randint(111111111, 999999999))


def get_boolean():
    return bool(random.randint(0, 1))


def get_float():
    if random.random() < 0.1:
        return random.randint(-5, 5)
    else:
        return random.random() * 10 - 5


def get_integer():
    return random.randint(1, 500000) - 250000


def get_string():
    return get_text().asset_data


@pytest.mark.parametrize(
    "string, datetime_format, expected",
    [
        ("12/1/2001", "something", None),
        ("12-1-2001", "%m/%d/%Y", None),
        ("12/1/2001", "%m/%d/%Y", datetime.datetime(2001, 12, 1)),
    ],
)
def test_convert_string_to_date(string, datetime_format, expected):
    assert convert_string_to_date(string, datetime_format) == expected


@pytest.mark.parametrize(
    "value, heuristics, datetime_format, expected",
    [
        ("12/1/2001", False, None, "12/1/2001"),
        ("12/1/2001", False, "%m/%d/%Y", datetime.datetime(2001, 12, 1)),
        ("111111111", False, None, 111111111),
        ("111111111", False, "%m/%d/%Y", 111111111),
        ("111111111", True, "%m/%d/%Y", datetime.datetime(1973, 7, 9, 17, 11, 51)),
    ],
)
def test_convert_string_to_value(value, heuristics, datetime_format, expected):
    assert convert_string_to_value(value, heuristics, datetime_format) == expected


@pytest.mark.parametrize(
    "name, delim, expected",
    [
        ("hello there", "-", "hello-there"),
        (" one two/three:four ", "-", "one-two-three-four"),
    ],
)
def test_sanitize_name(name, delim, expected):
    assert sanitize_name(name, delim) == expected


def test_datagrid_constructor_uptype():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3.0, "five", "12/02/2001", image2],
        [0, 2, 3.1, "six", "12/03/2001", image2],
    ]
    datagrid = DataGrid(name="images-1")
    datagrid.extend(data)
    assert datagrid.get_columns() == ["A", "B", "C", "D", "E", "F"]
    for r, row in enumerate(data):
        assert datagrid[r] == data[r]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "FLOAT",
        "TEXT",
        "TEXT",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_same():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(name="images-2")
    datagrid.extend(data)
    assert datagrid.get_columns() == ["A", "B", "C", "D", "E", "F"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "TEXT",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_datetime():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(
        columns={
            "A": "INTEGER",
            "B": "FLOAT",
            "C": "INTEGER",
            "D": "TEXT",
            "E": "DATETIME",
            "F": "IMAGE-ASSET",
        },
        datetime_format="%m/%d/%Y",
        name="datetime-1",
    )
    datagrid.extend(data)
    assert datagrid.get_columns() == ["A", "B", "C", "D", "E", "F"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "DATETIME",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_data():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(
        data=data,
        name="constructor-1",
    )
    assert datagrid.get_columns() == ["A", "B", "C", "D", "E", "F"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "TEXT",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_data_columns_1():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(
        columns=["one", "two", "three", "four", "five", "six"],
        data=data,
        name="constructor-2",
    )
    assert datagrid.get_columns() == ["one", "two", "three", "four", "five", "six"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "TEXT",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_data_columns_2():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(
        columns={
            "one": "INTEGER",
            "two": "FLOAT",
            "three": "INTEGER",
            "four": "TEXT",
            "five": "TEXT",
            "six": "IMAGE-ASSET",
        },
        data=data,
        name="constructor-3",
    )
    assert datagrid.get_columns() == ["one", "two", "three", "four", "five", "six"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "TEXT",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_data_strict_valid():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
    ]
    datagrid = DataGrid(data=data, datetime_format="%m/%d/%Y", name="strict-2")
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "DATETIME",
        "IMAGE-ASSET",
    ]
    datagrid.save()
    data2 = [2, 2, 3, "five", "12/02/2001", image2]
    with pytest.raises(Exception):
        datagrid.append(data2)
    datagrid.extend([data2])


def test_datagrid_constructor_data_strict_invalid():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
    ]
    datagrid = DataGrid(data=data, datetime_format="%m/%d/%Y", name="strict-2-invalid")
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "INTEGER",
        "TEXT",
        "DATETIME",
        "IMAGE-ASSET",
    ]
    datagrid.save()
    data2 = [2, "nope", 3, "five", "12/02/2001", image2]
    with pytest.raises(Exception):
        datagrid.append(data2)


def test_datagrid_constructor_data_null():
    data = [
        [None],
        [None],
    ]
    datagrid = DataGrid(data=data, datetime_format="%m/%d/%Y", name="data_null")
    assert list(datagrid._columns.values()) == ["ROW_ID", None]
    datagrid.save()


def test_datagrid_constructor_data_strict_valid2():
    data = [
        [True],
        [False],
    ]
    datagrid = DataGrid(columns=["BOOLEAN"], data=data, name="strict-4")
    assert list(datagrid._columns.values()) == ["ROW_ID", "BOOLEAN"]
    datagrid.save()


def test_datagrid_constructor_data_strict_valid3():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2, 3, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(
        columns={
            "a": "INTEGER",
            "b": "FLOAT",
            "c": "FLOAT",
            "d": "TEXT",
            "e": "DATETIME",
            "f": "IMAGE-ASSET",
        },
        data=data,
        datetime_format="%m/%d/%Y",
        name="strict-5",
    )
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "FLOAT",
        "TEXT",
        "DATETIME",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_datagrid_constructor_data_strict_valid4():
    data = [
        [True],
        [1],
    ]
    datagrid = DataGrid(data=data, name="strict-6")
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "BOOLEAN",
    ]
    datagrid.save()

    data = [
        [1],
        [True],
    ]
    datagrid = DataGrid(data=data, name="strict-7")
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "BOOLEAN",
    ]
    datagrid.save()


def test_datagrid_append_uptype():
    data = [
        [1, 1.2, 3, "four", "12/01/2001", image1],
        [2, 2.2, 3.0, "five", "12/02/2001", image2],
    ]
    datagrid = DataGrid(name="append-1")
    for row in data:
        datagrid.append(row)
    assert datagrid.get_columns() == ["A", "B", "C", "D", "E", "F"]

    for r, row in enumerate(data):
        assert datagrid[r] == data[r]

    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "INTEGER",
        "FLOAT",
        "FLOAT",
        "TEXT",
        "TEXT",
        "IMAGE-ASSET",
    ]
    datagrid.save()


def test_one_of_each():
    datagrid = DataGrid(
        name="one-of-each-1",
        columns=[
            "date",
            "integer",
            "float",
            "float2",
            "string",
            "image",
            "audio",
            "video",
            "text",
            "boolean",
            "datetime",
        ],
    )

    for i in range(1000):
        row = [
            get_date(),
            get_integer(),
            get_float(),
            get_float(),
            get_string(),
            get_image(),
            get_audio(),
            get_video(),
            get_text(),
            get_boolean(),
            get_datetime(),
        ]
        # make some NULL
        if random.random() < 0.01:
            row[random.randint(0, 10)] = None
        datagrid.append(row)

    assert datagrid.nrows == 1000
    assert datagrid.ncols == 11 + 1
    assert len(datagrid._data) == 1000
    assert len(datagrid._data[0]) == 11 + 1
    assert datagrid[0][0] is None or isinstance(datagrid[0][0], (datetime.date,))
    assert datagrid[0][1] is None or isinstance(datagrid[0][1], (int,))
    assert datagrid[0][2] is None or isinstance(datagrid[0][2], (float, int))
    assert datagrid[0][3] is None or isinstance(datagrid[0][3], (float, int))
    assert datagrid[0][4] is None or isinstance(datagrid[0][4], (str,))
    assert datagrid[0][5] is None or isinstance(datagrid[0][5], (Image,))
    assert datagrid[0][6] is None or isinstance(datagrid[0][6], (Audio,))
    assert datagrid[0][7] is None or isinstance(datagrid[0][7], (Video,))
    assert datagrid[0][8] is None or isinstance(datagrid[0][8], (Text,))
    assert datagrid[0][9] is None or isinstance(datagrid[0][9], (int,))
    assert datagrid[0][10] is None or isinstance(datagrid[0][10], (datetime.datetime,))

    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "DATETIME",
        "INTEGER",
        "FLOAT",
        "FLOAT",
        "TEXT",
        "IMAGE-ASSET",
        "AUDIO-ASSET",
        "VIDEO-ASSET",
        "TEXT-ASSET",
        "BOOLEAN",
        "DATETIME",
    ]
    datagrid.save()


def test_log_datagrid_one_of_each():
    datagrid = DataGrid(
        name="one-of-each-2",
        columns=[
            "date",
            "integer",
            "float",
            "float2",
            "string",
            "image",
            "audio",
            "video",
            "text",
            "boolean",
            "datetime",
        ],
    )

    for i in range(10):
        row = [
            get_date(),
            get_integer(),
            get_float(),
            get_float(),
            get_string(),
            Image(os.path.join(HERE, "../data/logo.png")),
            Audio(file_name=os.path.join(HERE, "../data/CantinaBand3.wav")),
            Video(os.path.join(HERE, "../data/flower.webm")),
            Text("one two three"),
            get_boolean(),
            get_datetime(),
        ]
        datagrid.append(row)

    assert datagrid.nrows == 10
    assert datagrid.ncols == 11 + 1
    assert len(datagrid._data) == 10
    assert len(datagrid._data[0]) == 11 + 1

    assert datagrid[0][0] is None or isinstance(datagrid[0][0], (datetime.date,))
    assert datagrid[0][1] is None or isinstance(datagrid[0][1], (int,))
    assert datagrid[0][2] is None or isinstance(datagrid[0][2], (float, int))
    assert datagrid[0][3] is None or isinstance(datagrid[0][3], (float, int))
    assert datagrid[0][4] is None or isinstance(datagrid[0][4], (str,))
    assert datagrid[0][5] is None or isinstance(datagrid[0][5], (Image,))
    assert datagrid[0][6] is None or isinstance(datagrid[0][6], (Audio,))
    assert datagrid[0][7] is None or isinstance(datagrid[0][7], (Video,))
    assert datagrid[0][8] is None or isinstance(datagrid[0][8], (Text,))
    assert datagrid[0][9] is None or isinstance(datagrid[0][9], (int,))
    assert datagrid[0][10] is None or isinstance(datagrid[0][10], (datetime.datetime,))
    datagrid.save()


def test_make_column_name():
    column_names = list(enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))
    for i in range(0, 10):
        column_names.append([26 + (26 * i), "A" * (i + 2)])
        column_names.append([27 + (26 * i), "B" * (i + 2)])

    for i, expected in column_names:
        assert make_column_name(i) == expected


def test_datagrid_type_curve():
    data = [
        [Curve("curve-1", x=[0, 1, 2], y=[3, 4, 5])],
        [Curve("curve-2", x=[0, 1, 2], y=[6, 7, 8])],
    ]
    datagrid = DataGrid(columns=["Curve"], name="curves-1")
    datagrid.extend(data)
    assert datagrid.get_columns() == ["Curve"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "CURVE-ASSET",
    ]
    datagrid.save()


def test_datagrid_type_json():
    data = [
        [{"name": "a"}],
        [{"name": "b"}],
    ]
    datagrid = DataGrid(columns=["JSON"], name="json-1")
    datagrid.extend(data)
    assert datagrid.get_columns() == ["JSON"]
    assert list(datagrid._columns.values()) == [
        "ROW_ID",
        "JSON",
    ]
    datagrid.save()


def test_datagrid_dicts():
    data = [
        {"brand": "off-white", "product_id": 38, "score": 21, "user_id": "user_0"},
        {"brand": "gucci", "product_id": 72, "score": 37, "user_id": "user_0"},
        {"brand": "gucci", "product_id": 88, "score": 36, "user_id": "user_0"},
        {"brand": "gucci", "product_id": 70, "score": 72, "user_id": "user_1"},
        {"brand": "gucci", "product_id": 66, "score": 25, "user_id": "user_1"},
        {"brand": "off-white", "product_id": 95, "score": 75, "user_id": "user_1"},
    ]
    dg = DataGrid(data, name="dicts-1")
    dg.save()
    assert dg.get_columns() == ["brand", "product_id", "score", "user_id"]
    assert list(dg._columns.values()) == [
        "ROW_ID",
        "TEXT",
        "INTEGER",
        "INTEGER",
        "TEXT",
    ]
    assert list(dg.to_dicts()) == data


def test_datagrid_dicts_read():
    data = [
        {"brand": "off-white", "product_id": 38, "score": 21, "user_id": "user_0"},
        {"brand": "gucci", "product_id": 72, "score": 37, "user_id": "user_0"},
        {"brand": "gucci", "product_id": 88, "score": 36, "user_id": "user_0"},
        {"brand": "gucci", "product_id": 70, "score": 72, "user_id": "user_1"},
        {"brand": "gucci", "product_id": 66, "score": 25, "user_id": "user_1"},
        {"brand": "off-white", "product_id": 95, "score": 75, "user_id": "user_1"},
    ]
    dg = DataGrid.read_datagrid("dicts-1.datagrid")
    assert dg.get_columns() == ["brand", "product_id", "score", "user_id"]
    assert list(dg._columns.values()) == [
        "ROW_ID",
        "TEXT",
        "INTEGER",
        "INTEGER",
        "TEXT",
    ]
    assert list(dg.to_dicts()) == data
