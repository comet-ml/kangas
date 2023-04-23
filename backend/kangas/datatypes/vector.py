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


class Vector(Asset):
    """
    A Vector asset.
    """

    ASSET_TYPE = "Vector"

    def __init__(
        self,
        vector,
        metadata=None,
        unserialize=False,
    ):
        """
        Create a vector asset.

        Args:
            vector: a vector (possibly-nested list of numbers)

        Example:

        ```python
        >>> import kangas as kg
        >>> dg = kg.DataGrid()
        >>> for row in rows:
        >>>     vector = row[0]
        >>>     kg.append([kg.Vector(vector)])
        >>> dg.save("vectors.datagrid")
        ```
        """
        super().__init__()
        if unserialize:
            return

        self.asset_data = json.dumps(vector)
        if metadata:
            self.metadata.update(metadata)
