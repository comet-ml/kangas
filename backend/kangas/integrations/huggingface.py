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

import datetime
import json
import os

import PIL.Image

import kangas

from ..utils import ProgressBar


class JSONEncoder(json.JSONEncoder):
    """
    Class to encode JSON structure; decoded in template below.
    """

    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return {"value": obj.timestamp(), "dtype": "datetime"}

        return json.JSONEncoder.default(self, obj)


def import_from_huggingface(path, name, options):
    try:
        import datasets
    except Exception:
        raise Exception("requires `pip install datasets`")

    if options.get("split") is not None:
        dataset = datasets.load_dataset(
            path,
            split=options.get("split"),
            streaming=bool(options.get("streaming", "False") == "True"),
        )
    else:
        dataset_splits = datasets.load_dataset(path)
        split = list(dataset_splits.keys())[0]
        dataset = datasets.load_dataset(
            path,
            split=split,
            streaming=bool(options.get("streaming", "False") == "True"),
        )

    if options.get("seed") is not None:
        dataset = dataset.shuffle(seed=int(options.get("seed")))
    if options.get("samples") is not None:
        try:
            dataset = dataset.take(int(options.get("samples")))
        except AttributeError:
            print("Unable to take samples; using entire dataset")

    if name.endswith(".datagrid"):
        name = name[:-9]

    if "/" in name:
        save_path, name = name.rsplit("/", 1)
    else:
        save_path, name = "./", name

    full_path = os.path.join(save_path, name + ".datagrid")

    if os.path.isfile(full_path):
        os.remove(full_path)

    # Preprocess rows (remove "row-id", assemble Images, assets):
    bbox = options.get("bbox")
    labels = options.get("labels")
    if labels:
        label_column, label_field = labels.split(":")  # objects:category
        label_list = dataset.info.features[label_column].feature[label_field].names
    ids = options.get("ids")
    if ids:
        id_column, id_field = ids.split(":")  # objects:bbox_id
    data = []
    for row in ProgressBar(dataset):
        if "row-id" in row:
            del row["row-id"]

        for column_name in list(row.keys()):
            if column_name.endswith("--metadata"):
                continue
            column = row[column_name]
            if isinstance(column, PIL.Image.Image):
                metadata_column = "%s--metadata" % column_name
                metadata = {}
                if metadata_column in row:
                    metadata = json.loads(row[metadata_column])
                    del row[metadata_column]
                image = kangas.Image(column, metadata=metadata)
                # Get annotations:
                if bbox:
                    bbox_column, bbox_field, bbox_type = bbox.split(
                        ":"
                    )  # objects:bbox:xywh
                    bboxes = row[bbox_column][bbox_field]
                    if labels:
                        label_ids = row[label_column][label_field]
                    for index, bbox_data in enumerate(bboxes):
                        if bbox_type == "xyxy":
                            x1, y1, x2, y2 = bbox_data
                            bbox_data = [x1, y1, x2 - x1, y2 - y1]
                        elif bbox_type == "xywh":
                            pass
                        else:
                            raise Exception("Unknown bbox type: %r" % bbox_type)
                        if labels:
                            label_id = label_ids[index]
                            label = label_list[label_id]
                        else:
                            label = "unknown"
                        if ids:
                            id = row[id_column][id_field][index]
                        else:
                            id = None

                        image.add_bounding_box(label, bbox_data, id=id)
                row[column_name] = image
        data.append(row)

    dg = kangas.DataGrid(name=name, data=data)
    dg.save(full_path)


def export_to_huggingface(path, name, options):
    try:
        import datasets
    except Exception:
        raise Exception("requires `pip install datasets`")

    dg = kangas.read_datagrid(name)

    basename, extension = os.path.splitext(name)

    def convert_image(value):
        image = value.to_pil()
        filename = "%s/%s.png" % (basename, value.asset_id)
        image.save(filename)
        return {
            "asset_type": "Image",
            "filename": filename,
        }

    # dg_type to function:
    format_map = {
        "IMAGE-ASSET": convert_image,
    }

    # mkdir name
    os.makedirs(basename, exist_ok=True)
    filename = "%s/%s.jsonl" % (basename, basename)
    column_names = dg.get_schema().keys()
    limit = int(options.get("limit", "0"))
    count = 0
    with open(filename, "w") as fp:
        for row in ProgressBar(
            dg.to_dicts(column_names=column_names, format_map=format_map)
        ):
            fp.write(json.dumps(row, cls=JSONEncoder) + "\n")
            count += 1
            if limit != 0 and count >= limit:
                break

    template = create_loader_from_datagrid(dg, basename)
    with open("%s/%s.py" % (basename, basename), "w") as fp:
        fp.write(template)

    ds = datasets.load_dataset(basename)
    private = bool(options.get("private", "True") == "True")
    if bool(options.get("push", "True") == "True"):
        ds.push_to_hub(path, private=private)


def dg_type_to_ds_type(column_name, schema):
    dg_type = schema[column_name]["type"]
    if dg_type == "ROW_ID":
        return 'datasets.Value("int32")'
    elif dg_type == "TEXT":
        return 'datasets.Value("string")'
    elif dg_type == "JSON":
        return 'datasets.Value("large_string")'
    elif dg_type == "IMAGE-ASSET":
        return "datasets.Image()"
    elif dg_type == "FLOAT":
        return 'datasets.Value("float32")'
    elif dg_type == "INTEGER":
        return 'datasets.Value("int32")'
    elif dg_type == "VECTOR":
        return 'datasets.Value("large_string")'
    elif dg_type == "DATETIME":
        return 'datasets.Value("float32")'  # FIXME: should be  'date32' or something, but HF chokes
    elif dg_type == "BOOLEAN":
        return 'datasets.Value("bool")'
    else:
        raise Exception("unknown DataGrid type: %r" % dg_type)


def create_loader_from_datagrid(
    datagrid,
    class_name,
    version="1.0.0",
    description="A Kangas DataGrid dataset",
    homepage="https://github.com/comet-ml/kangas",
    license="cc",
    citation="@misc{}",
):
    schema = datagrid.get_schema()
    features = (
        "{"
        + (
            ", ".join(
                [
                    "%r: %s" % (column_name, dg_type_to_ds_type(column_name, schema))
                    for column_name in schema
                ]
            )
        )
        + "}"
    )

    TEMPLATE = """
import datasets
import datetime
import json

class KangasDataset(datasets.GeneratorBasedBuilder):
    VERSION = datasets.Version("{version}")

    def _info(self):
        features = datasets.Features({features})

        return datasets.DatasetInfo(
            description="{description}",
            features=features,
            homepage="{homepage}",
            license="{license}",
            citation="{citation}",
        )

    def _split_generators(self, dl_manager):
        files = ["{class_name}"]
        return [
            datasets.SplitGenerator(
                name=datasets.Split.TRAIN,
                gen_kwargs={{
                    "files": files,
                }},
            ),
        ]

    def _generate_examples(self, files):
        idx = 0
        for filename in files:
            with open("%s/%s.jsonl" % (filename, filename)) as fp:
                for line in fp:
                    row = json.loads(line)
                    for column_name, value in row.items():
                        if isinstance(value, dict) and "asset_type" in value:
                            if value["asset_type"] == "Image":
                                bytes = open(value["filename"], "rb").read()
                                row[column_name] = {{"path": value["filename"], "bytes": bytes}}
                        elif isinstance(value, dict) and "dtype" in value:
                            if value["dtype"] == "datetime":
                                row[column_name] = value["value"] # FIXME: should be a datetime, but HF chokes
                    yield idx, row
                    idx += 1
"""
    return TEMPLATE.format(
        class_name=class_name,
        version=version,
        description=description,
        features=features,
        citation=citation,
        license=license,
        homepage=homepage,
    )
