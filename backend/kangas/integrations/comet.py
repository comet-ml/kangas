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
import io
import json
import os
import sqlite3
import zipfile

import requests

from ..utils import ProgressBar


def get_annnotation_type(annotation):
    for atype in ["mask", "points", "boxes", "markers", "lines"]:
        if atype in annotation:
            return atype
    return None


def get_comet_type(asset_type):
    """
    Mapping from datagrid Asset type to Comet
    asset type.
    """
    if asset_type == "Text":
        return "text-sample"
    else:
        # Audio, Image, Video, Curve, etc.
        return asset_type.lower()


def import_from_comet(path, name, options):
    from comet_ml import API

    from kangas import DataGrid, Image

    api = API()

    if path.count("/") == 2:
        # FIXME: id or name:
        workspace, project_name, experiment_id = path.split("/", 2)
        experiments = [api.get_experiment(workspace, project_name, experiment_id)]
    elif path.count("/") == 1:
        workspace, project_name = path.split("/", 1)
        experiments = api.get_experiments(workspace, project_name)
    elif path:
        workspace = path
        experiments = api.get_experiments(workspace)
    else:
        raise Exception(
            "PATH should be one of: workspace/project/exp, workspace/project, or workspace"
        )

    if name.endswith(".datagrid"):
        name = name[:-9]

    if "/" in name:
        save_path, name = name.rsplit("/", 1)
    else:
        save_path, name = "./", name

    full_path = os.path.join(save_path, name + ".datagrid")

    if os.path.isfile(full_path):
        os.remove(full_path)

    dg = DataGrid(
        name=name,
        columns=[
            "Image",
            "File name",
            "Created at",
            "File size",
            "Step",
            "Comet asset id",
            "Tags",
            "Comet experiment id",
        ],
    )
    for experiment in experiments:
        asset_list = experiment.get_asset_list()
        # Assuming just one datagrid per experiment for now:
        for asset in asset_list:
            # FIXME: pass in type(s) to get; currently gets all known
            # FIXME: each type will need its own column
            if asset["type"] == "image":
                metadata = json.loads(asset["metadata"])
                dg.append(
                    [
                        Image(source=asset["link"], metadata=metadata),
                        asset["fileName"],
                        datetime.datetime.fromtimestamp(asset["createdAt"] / 1000),
                        asset["fileSize"],
                        asset["step"],
                        asset["assetId"],
                        asset["tags"] if asset["tags"] else None,  # list, []
                        asset["experimentKey"],
                    ]
                )
            # FIXME: append audio, video, curve, JSON, etc.
    dg.save(full_path)


def export_to_comet(path, name, options):
    """
    Create the SQLite database, zip it, and log it to
    an experiment.

    Args:

    * path - (str, optional)
    * name - (str) the name of the datagrid file
    * options: "output_dir" (optional, str) the name of the output directory
        for the zipped datagrid file
    """
    import comet_ml

    output_dir = options.get("output_dir", ".")

    comet_ml.config._init(should_prompt_user=True)
    if comet_ml.config.get_config("comet.api_key") is None:
        raise Exception(
            "You will need to set your Comet API key; see: https://www.comet.com/docs/v2/guides/getting-started/quickstart/"
        )

    base_name, ext = os.path.splitext(name)
    zip_file = os.path.join(output_dir, base_name + "-comet.datagrid.zip")
    output = os.path.join(output_dir, base_name + "-comet.datagrid")

    if os.path.isfile(output):
        os.remove(output)

    if os.path.isfile(zip_file):
        os.remove(zip_file)

    conn = sqlite3.connect(output)
    cur = conn.cursor()
    cur.execute("ATTACH DATABASE '{name}' as original;".format(name=name))
    rows = conn.execute("SELECT * from original.assets;")

    if path is None:
        experiment = comet_ml.Experiment()
        experiment.log_other("Created from", "kangas")
    elif path.count("/") == 2:
        # FIXME: id or name:
        workspace, project_name, experiment_id = path.split("/", 2)
        experiment = comet_ml.ExistingExperiment(previous_experiment=experiment_id)
    elif path.count("/") == 1:
        workspace, project_name = path.split("/", 1)
        experiment = comet_ml.Experiment(workspace=workspace, project_name=project_name)
        experiment.log_other("Created from", "kangas")
    else:
        project_name = path
        experiment = comet_ml.Experiment(project_name=project_name)
        experiment.log_other("Created from", "kangas")

    # Log all of the assets:
    asset_map = {}
    for row in ProgressBar(rows.fetchall(), "Uploading DataGrid assets to comet.com"):
        asset_id, asset_type, asset_data, asset_metadata, asset_thumbnail = row
        metadata = json.loads(asset_metadata)
        ## Only send what comet can accept:
        for layer_index, annotation_layer in enumerate(metadata["annotations"]):
            for index, annotation in reversed(
                list(enumerate(annotation_layer["data"][:]))
            ):
                if get_annnotation_type(annotation) not in ["points", "boxes"]:
                    del metadata["annotations"][layer_index]["data"][index]
        if asset_data:
            if isinstance(asset_data, str):
                if asset_data.startswith("{"):
                    # remote "source" image
                    asset_json = json.loads(asset_data)
                    asset_data = requests.get(asset_json["source"]).content
                    # Comet does not like filenames that are URLs!
                    metadata["filename"] = "%s-%s" % (asset_type, asset_id)
                    binary_io = io.BytesIO(asset_data)
                else:
                    binary_io = io.StringIO(asset_data)
            else:
                binary_io = io.BytesIO(asset_data)
        else:
            raise Exception("asset has no asset_data")
        file_name = metadata.get("filename", "%s-%s" % (asset_type, asset_id))
        # When we have more than one asset type:
        # comet_type = get_comet_type(asset_type)
        if "step" in metadata:
            step = metadata["step"]
        else:
            step = 0

        asset_results = experiment.log_image(
            binary_io,
            name=file_name,
            annotations=metadata["annotations"],
            step=step,
        )
        # For consistenency:
        asset_results["assetId"] = asset_results["imageId"]
        # Save for asset metadata:
        asset_map[asset_id] = asset_results

    cur.execute("CREATE TABLE datagrid AS SELECT * from original.datagrid;")
    cur.execute("CREATE TABLE metadata AS SELECT * from original.metadata;")
    cur.execute(
        "CREATE TABLE assets AS SELECT asset_id, asset_type, asset_metadata, asset_thumbnail from original.assets;"
    )
    cur.execute("CREATE TABLE settings AS SELECT * from original.settings;")
    cur.execute("ALTER TABLE assets ADD COLUMN asset_data BLOB;")
    rows = list(
        conn.execute("SELECT asset_id, asset_metadata from original.assets;").fetchall()
    )

    for asset_id, asset_metadata_string in ProgressBar(
        rows, "Updating DataGrid metadata"
    ):
        asset_metadata = json.loads(asset_metadata_string)
        asset_metadata["source"] = asset_map[asset_id]["web"]
        asset_metadata["cometAssetId"] = asset_map[asset_id]["assetId"]
        cur.execute(
            "UPDATE assets SET asset_metadata = ? WHERE asset_id = ?;",
            (json.dumps(asset_metadata), asset_id),
        )
    conn.commit()

    try:
        # zlib may not be installed
        with zipfile.ZipFile(zip_file, "w", zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(output)
    except Exception:
        # if not, we'll just "zip" it without compression:
        with zipfile.ZipFile(zip_file, "w") as zipf:
            zipf.write(output)

    print("Saved local DataGrid as %r" % output)
    print("Saved local compressed DataGrid as %r" % zip_file)
    experiment._log_asset(zip_file, file_name=zip_file, asset_type="datagrid")
    experiment.end()
