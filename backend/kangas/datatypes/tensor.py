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

from .base import Asset


class Tensor(Asset):
    """
    A Tensor asset.
    """

    ASSET_TYPE = "Tensor"

    def __init__(
        self,
        tensor=None,
        metadata=None,
        unserialize=False,
    ):
        """
        Create a tensor asset.

        Args:
            tensor: a tensor (possibly-nested list of numbers)

        Example:

        ```python
        >>> import kangas as kg
        >>> dg = kg.DataGrid()
        >>> for row in rows:
        >>>     tensor = row[0]
        >>>     kg.append([kg.Tensor(tensor)])
        >>> dg.save("tensors.datagrid")
        ```
        """
        super().__init__()
        if unserialize:
            self._unserialize = unserialize
            return

        self.asset_data = json.dumps(tensor)
        if metadata:
            self.metadata.update(metadata)
