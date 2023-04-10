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

from .base import Asset
from .utils import flatten, get_file_extension, is_valid_file_path


class Embedding(Asset):
    """
    An Embedding asset.
    """

    ASSET_TYPE = "Embedding"

    def __init__(
        self,
        embedding=None,
        file_name=None,
        metadata=None,
        source=None,
        unserialize=False,
    ):
        super().__init__(source)
        if unserialize:
            return
        if self.source is not None:
            self._log_metadata(
                filename=self.source,
                extension=get_file_extension(self.source),
            )
            if metadata:
                self._log_metadata(**metadata)
            return

        if file_name:
            if is_valid_file_path(file_name):
                with open(file_name, "rb") as io_object:
                    self.asset_data = io_object.read()
                self.metadata["extension"] = get_file_extension(file_name)
                self.metadata["filename"] = file_name
            else:
                raise ValueError("file not found: %r" % file_name)
        else:
            self.asset_data = json.dumps(embedding)
        if metadata:
            self.metadata.update(metadata)

    @classmethod
    def get_statistics(cls, datagrid, col_name, field_name):
        from sklearn.decomposition import IncrementalPCA

        minimum = None
        maximum = None
        avg = None
        variance = None
        total = None
        stddev = None
        other = None
        name = col_name

        kwargs = {}

        pca = IncrementalPCA(**kwargs)
        batch = []
        for row in datagrid.conn.execute(
            """SELECT {field_name} as assetId, asset_data from datagrid JOIN assets ON assetId = assets.asset_id;""".format(
                field_name=field_name
            )
        ):
            vectors = json.loads(row[1])
            vector = flatten(vectors)
            # FIXME: could scale them here; leave to user for now
            batch.append(vector)
            if len(batch) == 10:
                pca.partial_fit(batch)
                batch = []
        if len(batch) > 0:
            pca.partial_fit(batch)

        other = json.dumps(
            {
                "pca_eigen_vectors": pca.components_.tolist(),
                "pca_mean": pca.mean_.tolist(),
            }
        )
        return [minimum, maximum, avg, variance, total, stddev, other, name]
