# -*- coding: utf-8 -*-
# *******************************************************
#   ____                     _               _
#  / ___|___  _ __ ___   ___| |_   _ __ ___ | |
# | |   / _ \| '_ ` _ \ / _ \ __| | '_ ` _ \| |
# | |__| (_) | | | | | |  __/ |_ _| | | | | | |
#  \____\___/|_| |_| |_|\___|\__(_)_| |_| |_|_|
#
#  Sign up for free at http://www.comet.ml
#  Copyright (C) 2015-2020 Comet ML INC
#  This file can not be copied and/or distributed without the express
#  permission of Comet ML Inc.
# *******************************************************

import traceback
from inspect import istraceback

from flask.json import JSONEncoder

convert_functions = []


try:
    import numpy

    def convert_numpy_array(value):
        try:
            return numpy.asscalar(value)

        except (ValueError, IndexError, AttributeError, TypeError):
            return

    convert_functions.append(convert_numpy_array)
except ImportError:
    pass


class NestedEncoder(JSONEncoder):
    """
    A JSON Encoder that converts floats/decimals to strings and allows nested objects
    """

    def default(self, obj):

        # First convert the object
        obj = self.convert(obj)

        # Check if the object is convertible
        try:
            super().encode(obj)
            return obj

        except TypeError:
            pass

        # Custom conversion
        if type(obj) == Exception or isinstance(obj, Exception) or type(obj) == type:
            return str(obj)

        elif istraceback(obj):
            return "".join(traceback.format_tb(obj)).strip()

        elif hasattr(obj, "repr_json"):
            return obj.repr_json()

        elif isinstance(obj, complex):
            return str(obj)

        else:
            try:
                return super().default(obj)

            except TypeError:
                return "%s not JSON serializable" % obj.__class__.__name__

    def floattostr(self, o, _inf=float("Inf"), _neginf=-float("-Inf"), nan_str="None"):
        if o != o:
            return nan_str

        else:
            return o.__repr__()

    def convert(self, obj):
        """
        Try converting the obj to something json-encodable
        """
        for converter in convert_functions:
            converted = converter(obj)

            if converted is not None:
                obj = converted

        return obj
