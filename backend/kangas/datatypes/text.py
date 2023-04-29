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

from .base import Asset
from .utils import get_file_extension, is_valid_file_path


class Text(Asset):
    """
    A Text asset.
    """

    ASSET_TYPE = "Text"

    def __init__(
        self, text=None, file_name=None, metadata=None, source=None, unserialize=False
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
            self.asset_data = text
        if metadata:
            self.metadata.update(metadata)
