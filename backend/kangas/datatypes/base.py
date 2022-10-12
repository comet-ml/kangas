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

from .utils import generate_guid


class Asset(object):
    """
    The base class for any object that needs to be logged.
    """

    ASSET_TYPE = "Asset"

    def __init__(self, source=None):
        """
        NOTE: each subclass will generate and cache metadata.
        """
        self.asset_id = generate_guid()
        self.asset_data = None
        self.metadata = {"assetId": self.asset_id}
        self.source = None
        if source is not None:
            # FIXME: check to make sure that source should be http, https, or file
            self.source = {"source": source}
            self.asset_data = json.dumps(self.source)
            self.metadata["source"] = source

    def log_and_serialize(self, datagrid):
        """
        Log and serialize an asset.

        NOTE: will only log an asset once in each datagrid db.
        """
        datagrid._log(self.asset_id, self.ASSET_TYPE, self.asset_data, self.metadata)
        return self.asset_id

    @classmethod
    def unserialize(cls, datagrid, row, column_name):
        obj = cls(unserialize=True)
        asset_id = row[column_name]
        row = datagrid.conn.execute(
            """SELECT asset_data, asset_metadata from assets WHERE asset_id = ?""",
            [asset_id],
        ).fetchone()
        if row:
            asset_data, asset_metadata = row
            obj.asset_id = asset_id
            obj.asset_data = asset_data
            obj.metadata = asset_metadata
        return obj

    def _log_metadata(self, **metadata):
        """
        Log the metadata.
        """
        self.metadata.update(metadata)

    def __repr__(self):
        return "<%s, asset_id=%r>" % (self.ASSET_TYPE, self.asset_id)
