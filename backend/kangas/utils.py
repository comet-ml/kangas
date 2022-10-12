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

import math
import socket
import sys
import uuid

import six

RESERVED_NAMES = ["ROW-ID"]


def get_localhost():
    # type: () -> str
    """
    Get the local IP number.
    """
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)


def _in_jupyter_environment():
    # type: () -> bool
    """
    Check to see if code is running in a Jupyter environment,
    including jupyter notebook, lab, or console.
    """
    try:
        import IPython
    except Exception:
        return False

    ipy = IPython.get_ipython()
    if ipy is None or not hasattr(ipy, "kernel"):
        return False
    else:
        return True


def _in_ipython_environment():
    # type: () -> bool
    """
    Check to see if code is running in an IPython environment.
    """
    try:
        import IPython
    except Exception:
        return False

    ipy = IPython.get_ipython()
    if ipy is None:
        return False
    else:
        return True


def _in_colab_environment():
    # type: () -> bool
    """
    Check to see if code is running in Google colab.
    """
    try:
        import IPython
    except Exception:
        return False

    ipy = IPython.get_ipython()
    return "google.colab" in str(ipy)


class ProgressBar:
    """
    A simple ASCII progress bar, showing a box for each item.
    Uses no control characters.
    """

    def __init__(self, sequence, description=None):
        """
        The sequence to iterate over. For best results,
        don't print during the iteration.
        """
        self.sequence = sequence
        if description:
            self.description = "%s " % description
        else:
            self.description = None

    def set_description(self, description):
        self.description = "%s " % description

    def __iter__(self):
        if self.description:
            print(self.description, end="")
        print("[", end="")
        sys.stdout.flush()
        for item in self.sequence:
            print("█", end="")
            sys.stdout.flush()
            yield item
        print("]")


def _input_user(prompt):
    # type: (str) -> str
    """Independent function to apply clean_string to all responses + make mocking easier"""
    return clean_string(six.moves.input(prompt))


def _input_user_yn(prompt):
    # type: (str) -> bool
    while True:
        response = _input_user(prompt).lower()
        if response.startswith("y") or response.startswith("n"):
            break
    return response.startswith("y")


def clean_string(string):
    if string:
        return "".join([char for char in string if char not in ["'", '"', " "]])
    else:
        return ""


def is_nan(value):
    """
    Return True if value is float("NaN")
    """
    return isinstance(value, float) and math.isnan(value)


def is_null(value):
    return value is None or is_nan(value)


def sanitize_name(name, delim="-"):
    """
    Remove any unwanted characters and replace with
    the given delimiter.

    Args:
        name: (str) the text to sanitize
        delim: (str) the char to replace unwanted chars

    Returns:
        a sanitized string
    """
    return (
        name.strip()
        .lower()
        .replace(" ", delim)
        .replace("/", delim)
        .replace(":", delim)
        .replace("-", delim)
    )


def make_column_name(num):
    # type: (int) -> str
    """
    Create an automatic column name, if one isn't given.

    Args:
        num: (int) number of column

    Returns: a string appropriate for a column name
    """
    char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[num % 26]
    group = (num // 26) + 1
    return char * group


def generate_guid():
    # type: () -> str
    """Generate a GUID"""
    return uuid.uuid4().hex
