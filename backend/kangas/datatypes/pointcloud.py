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

import logging
import json

from .base import Asset

LOGGER = logging.getLogger(__name__)

class PointCloud(Asset):
    """
    A PointCloud asset.
    """

    ASSET_TYPE = "PointCloud"

    def __init__(
        self,
        scene_name=None,
        points=None,
        boxes=None,
        step=None,
        metadata=None,
        source=None,
        unserialize=False,
    ):
        super().__init__(source)
        if unserialize:
            # A function that takes the object to lookup
            self._unserialize = unserialize
            return

        self.metadata["scene_name"] = scene_name
        self.metadata["step"] = step

        self.asset_data = json.dumps(
            {
                "points": points,
                "boxes": boxes,
            }
        )
