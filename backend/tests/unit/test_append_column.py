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


def make_datagrid():
    dg = kg.DataGrid()
    dg.append([1, 2, 3, 4])
    dg.append([1, 2, 3, 4])
    dg.append([1, 2, 3, 4])
    dg.save()
    return dg


def test_append_column_int():
    dg = make_datagrid()
    dg.append_column("New Integer", ["5", "5", "5"])
    for row in range(3):
        assert dg[row][4] == 5


def test_append_column_computed_column():
    dg = make_datagrid()
    dg.append_column("New Column", "{'A'} + {'B'} + {'ROW-ID'}")
    for row in range(3):
        assert dg[row][4] == 3 + row + 1
