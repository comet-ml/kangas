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

import json

from ..server.utils import pickle_dumps
from .base import Asset
from .utils import flatten, get_color, get_file_extension, is_valid_file_path


class Embedding(Asset):
    """
    An Embedding asset.
    """

    ASSET_TYPE = "Embedding"

    def __init__(
        self,
        embedding=None,
        label=None,
        projection="pca",
        file_name=None,
        metadata=None,
        source=None,
        unserialize=False,
    ):
        super().__init__(source)
        if unserialize:
            return
        if self.source is not None:
            # FIXME: this is for images, not others
            self._log_metadata(
                filename=self.source,
                extension=get_file_extension(self.source),
            )
            if metadata:
                self._log_metadata(**metadata)
            return

        if label:
            color = get_color(label)
        else:
            color = None

        self.metadata["label"] = label
        self.metadata["color"] = color
        self.metadata["projection"] = projection

        if file_name:
            if is_valid_file_path(file_name):
                with open(file_name, "r") as io_object:
                    self.asset_data = json.dumps(
                        {"vector": io_object.read(), "label": label, "color": color}
                    )
                self.metadata["extension"] = get_file_extension(file_name)
                self.metadata["filename"] = file_name
            else:
                raise ValueError("file not found: %r" % file_name)
        else:
            self.asset_data = json.dumps(
                {"vector": embedding, "label": label, "color": color}
            )
        if metadata:
            self.metadata.update(metadata)

    @classmethod
    def get_statistics(cls, datagrid, col_name, field_name):
        import numpy as np

        # FIXME: compute min and max of eigenspace
        minimum = None
        maximum = None
        avg = None
        variance = None
        total = None
        stddev = None
        other = None
        name = col_name

        kwargs = {}
        projection = None
        batch = []
        for row in datagrid.conn.execute(
            """SELECT {field_name} as assetId, asset_data, json_extract(asset_metadata, '$.projection') from datagrid JOIN assets ON assetId = assets.asset_id;""".format(
                field_name=field_name
            )
        ):
            embedding = json.loads(row[1])
            vectors = embedding["vector"]
            vector = flatten(vectors)

            if row[2] is None or row[2] == "pca":
                if projection is None:
                    from sklearn.decomposition import IncrementalPCA

                    projection = IncrementalPCA(**kwargs)
                    projection_name = "pca"
                batch.append(vector)
                if len(batch) == 10:
                    projection.partial_fit(batch)
                    batch = []
            elif row[2] == "t-sne":
                if projection is None:
                    from openTSNE import TSNE

                    projection = TSNE(perplexity=30, learning_rate=10, n_iter=500)
                    projection_name = "t-sne"
                batch.append(vector)
            elif row[2] == "umap":
                if projection is None:
                    projection_name = "umap"
            else:
                raise Exception(
                    "unknown projection %r; should be 'pca', 't-sne', or 'umap'"
                    % row[2]
                )

        if projection_name == "pca":
            if len(batch) > 0:
                projection.partial_fit(batch)
            other = json.dumps(
                {
                    "pca_eigen_vectors": projection.components_.tolist(),
                    "pca_mean": projection.mean_.tolist(),
                    "projection": projection_name,
                }
            )
        elif projection_name == "t-sne":
            embedding = projection.fit(np.array(batch))
            other = json.dumps(
                {"projection": projection_name, "embedding": pickle_dumps(embedding)}
            )
        elif projection_name == "umap":
            other = json.dumps(
                {
                    "projection": projection_name,
                }
            )

        return [minimum, maximum, avg, variance, total, stddev, other, name]
