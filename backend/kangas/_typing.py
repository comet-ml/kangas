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

"""
This module contains useful types and mirror the typing module
"""

# isort: off

from typing import *  # noqa
from typing import IO, BinaryIO, Union  # noqa


class ValidFilePath(str):
    """This type help marking a file_path as existing on disk as checked by `is_valid_file_path`"""

    pass


class TemporaryFilePath(ValidFilePath):
    """This type help marking a file_path as valid on disk as checked by `is_valid_file_path`"""

    pass


UserText = Union[bytes, Text]  # noqa
MemoryUploadable = Union[IO, UserText]  # noqa
Number = Union[int, float]  # noqa
