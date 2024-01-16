# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2023-2024 Kangas Development Team #
#    All rights reserved                             #
######################################################

import json
import glob
import os

from ..datatypes import DataGrid, Image


def import_from_wandb(path, name, options):
    """
    kangas import stacey/mnist-viz/baseline:v4 mnist.datagrid
    """
    import wandb

    api = wandb.Api()

    wandb_path, wandb_name = path.rsplit("/", 1)
    output_path = os.path.join("imports", wandb_path)
    
    artifact = api.artifact(path)
    if not os.path.exists(output_path):
        artifact.download(output_path)

    for json_filename in glob.glob(os.path.join(output_path, "*.json")):
        with open(json_filename) as fp:
            data = json.load(fp)

        rows = []
        for row in data["data"]:
            columns = []
            for column in row:
                if isinstance(column, dict):
                    if column["_type"] == "image-file":
                        image = Image(os.path.join(output_path, column["path"]))
                        columns.append(image)
                    else:
                        raise Exception("unknown type: %r" % column["_type"])
                else:
                    columns.append(column)
            rows.append(columns)

        datagrid = DataGrid(rows, data["columns"])
        datagrid.save(name, create_thumbnails=True)
