# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#  Copyright (c) 2023-2024 Kangas Development Team   #
#                All rights reserved                 #
######################################################

import logging
import json
import tempfile

from .base import Asset
from .math_3d import generate_image_from_points
from .utils import image_to_fp, generate_thumbnail

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

        points = points if points is not None else []
        boxes = boxes if boxes is not None else []
        
        min_max_x = [float("inf"), float("-inf")]
        min_max_y = [float("inf"), float("-inf")]
        min_max_z = [float("inf"), float("-inf")]

        for point in points:
            min_max_x = min(point[0], min_max_x[0]), max(point[0], min_max_x[1])
            min_max_y = min(point[1], min_max_y[0]), max(point[1], min_max_y[1])
            min_max_z = min(point[2], min_max_z[0]), max(point[2], min_max_z[1])

        for box in boxes:
            for segment_points in box["segments"]:
                for point in segment_points:
                    min_max_x = min(point[0], min_max_x[0]), max(
                        point[0], min_max_x[1]
                    )
                    min_max_y = min(point[1], min_max_y[0]), max(
                        point[1], min_max_y[1]
                    )
                    min_max_z = min(point[2], min_max_z[0]), max(
                        point[2], min_max_z[1]
                    )

        self.metadata["scene_name"] = scene_name
        self.metadata["step"] = step
        self.metadata["min_max_x"] = min_max_x
        self.metadata["min_max_y"] = min_max_y
        self.metadata["min_max_z"] = min_max_z
        self.metadata["points"] = points
        self.metadata["boxes"] = boxes

        self.asset_data = PointCloud.generate_thumbnail(None, self.metadata)

    @classmethod
    def generate_thumbnail(cls, asset_data, metadata):
        """
        Args:
            metadata: the metadata dict
        """
        if asset_data is None:
            points = metadata["points"]
            boxes = metadata["boxes"]
            min_max_x = metadata["min_max_x"]
            min_max_y = metadata["min_max_y"]
            min_max_z = metadata["min_max_z"]

            image = generate_image_from_points(
                points,
                boxes,
                45,
                0,
                45,
                min_max_x,
                min_max_y,
                min_max_z,
                size=(400, 300)
            )

            fp = image_to_fp(image, "png")
            image_data = fp.read()
            return image_data
        else:
            return generate_thumbnail(asset_data)
