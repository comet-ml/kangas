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
import logging

from .base import Asset

LOGGER = logging.getLogger(__name__)


class Curve(Asset):
    """
    A Curve asset.
    """

    ASSET_TYPE = "Curve"

    def __init__(
        self, name, x=None, y=None, metadata=None, source=None, unserialize=False
    ):
        """
        Log timeseries data.

        Args:
            name: (str) name of data
            x: list of x-axis values
            y: list of y-axis values
        """
        super().__init__(source)
        if unserialize:
            return
        if not isinstance(name, str):
            raise ValueError("'curve' requires string 'name'")

        if self.source is not None:
            self._log_metadata(
                name=name,
            )
            if metadata:
                self._log_metadata(**metadata)
            return

        self.x = list(x)
        self.y = list(y)
        self.name = name

        if len(self.x) != len(self.y):
            raise ValueError("'curve' requires lists 'x' and 'y' of equal lengths")

        data = {"x": self.x, "y": self.y, "name": self.name}
        self.asset_data = json.dumps(data)
        self.metadata["name"] = self.name
        self.metadata["min(x)"] = min(self.x)
        self.metadata["min(y)"] = min(self.y)
        self.metadata["max(x)"] = max(self.x)
        self.metadata["max(y)"] = max(self.y)
        if metadata:
            self.metadata.update(metadata)

    @classmethod
    def get_statistics(cls, datagrid, col_name, field_name):
        # min, max, avg, variance, total, stddev, other, name
        x_min = y_min = float("inf")
        x_max = y_max = float("-inf")
        other = None
        try:
            # go through all rows, compute x min/max, y min/max
            for row in datagrid.to_dicts():
                curve_instance = row[col_name]
                x_min = min(min(curve_instance.x), x_min)
                x_max = max(max(curve_instance.x), x_max)
                y_min = min(min(curve_instance.y), y_min)
                y_max = max(max(curve_instance.y), y_max)

            other = json.dumps(
                {
                    "x_min": x_min,
                    "x_max": x_max,
                    "y_min": y_min,
                    "y_max": y_max,
                }
            )

        except Exception:
            LOGGER.info("can't compute curve stats on column %s", col_name)

        # min, max, avg, variance, total, stddev, other, name
        return [None, None, None, None, None, None, other, col_name]
