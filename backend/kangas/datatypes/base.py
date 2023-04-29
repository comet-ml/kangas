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

import json

from .utils import generate_guid


class Asset:
    """
    The base class for any object that needs to be logged.
    """

    ASSET_TYPE = "Asset"

    def __init__(self, source=None):
        """
        NOTE: each subclass will generate and cache metadata.
        """
        self._unserialize = None
        self.asset_id = generate_guid()
        self.asset_data = None
        self.metadata = {"assetId": self.asset_id}
        self.source = None
        if source is not None:
            # FIXME: check to make sure that source should be http, https, or file
            self.source = source
            self.asset_data = json.dumps({"source": self.source})
            self.metadata["source"] = source

    @property
    def asset_id(self):
        self.deserialize()
        return self._asset_id

    @asset_id.setter
    def asset_id(self, asset_id):
        self._asset_id = asset_id

    @property
    def asset_data(self):
        self.deserialize()
        return self._asset_data

    @asset_data.setter
    def asset_data(self, asset_data):
        self._asset_data = asset_data

    def deserialize(self):
        """
        Deserialize if needed.
        """
        if self._unserialize:
            self._unserialize(self)
            self._unserialize = None
        return self

    def log_and_serialize(self, datagrid, row_id):
        """
        Log and serialize an asset.

        NOTE: will only log an asset once in each datagrid db.
        """
        datagrid._log(
            self.asset_id, self.ASSET_TYPE, self.asset_data, self.metadata, row_id
        )
        return self.asset_id

    @classmethod
    def get_statistics(cls, datagrid, column_name, field_name):
        pass

    @classmethod
    def unserialize(cls, datagrid, row, column_name):
        asset_id = row[column_name]

        def _unserialize(obj):
            row = datagrid.conn.execute(
                """SELECT asset_data, asset_metadata,
                          json_extract(asset_metadata, "$.source") as asset_source
                   from assets WHERE asset_id = ?""",
                [asset_id],
            ).fetchone()
            if row:
                asset_data, asset_metadata, asset_source = row
                if asset_source:
                    obj.asset_data = obj._get_asset_data_from_source(asset_source)
                    obj.metadata = json.loads(asset_metadata)
                    obj.source = asset_source
                else:
                    obj.asset_data = asset_data
                    obj.metadata = json.loads(asset_metadata)

        obj = cls(unserialize=_unserialize)
        obj.asset_id = asset_id
        return obj

    def _get_asset_data_from_source(self, asset_source):
        # Add this method in asset class
        raise NotImplementedError("This asset subclass needs to implement this method")

    def _log_metadata(self, **metadata):
        """
        Log the metadata.
        """
        self.metadata.update(metadata)

    def __repr__(self):
        return "<%s, asset_id=%r>" % (self.ASSET_TYPE, self.asset_id)
