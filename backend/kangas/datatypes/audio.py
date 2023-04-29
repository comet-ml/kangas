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

import io

import numpy as np
from scipy.io.wavfile import write

from .._typing import IO, Any
from .base import Asset
from .utils import fix_special_floats, get_file_extension


class Audio(Asset):
    """
    An Audio asset.
    """

    ASSET_TYPE = "Audio"

    def __init__(
        self,
        audio_data=None,
        sample_rate=None,
        file_name=None,
        metadata=None,
        source=None,
        unserialize=False,
    ):
        """
        Logs the audio Asset determined by audio data.

        Args:
            audio_data: String or a numpy array - either the file path of the file you want
                to log, or a numpy array given to `scipy.io.wavfile.write` for wav conversion.
            sample_rate: Integer - Optional. The sampling rate given to
                `scipy.io.wavfile.write` for creating the wav file.
            file_name: String - Optional. A custom file name to be displayed.
                If not provided, the filename from the `audio_data` argument
                will be used.
        """
        super().__init__(source)
        if unserialize:
            return
        if self.source is not None:
            self._log_metadata(
                filename=self.source,
                extension=get_file_extension(self.source),
                sample_rate=sample_rate,
            )
            if metadata:
                self._log_metadata(**metadata)
            return

        if file_name is None:
            if audio_data is None:
                raise TypeError("audio_data cannot be None")

            audio_data = fix_special_floats(audio_data)

            if not isinstance(audio_data, np.ndarray):
                raise TypeError("Unsupported audio_data type %r" % type(audio_data))

            if sample_rate is None:
                raise TypeError("sample_rate cannot be None when logging a numpy array")

            if not sample_rate:
                raise TypeError("sample_rate cannot be 0 when logging a numpy array")

            self.metadata["sample_rate"] = sample_rate
            self.metadata["extension"] = "wav"

            io_object = io.BytesIO()
            write_numpy_array_as_wav(audio_data, sample_rate, io_object)
        else:
            io_object = open(file_name, "rb")
            self.metadata["sample_rate"] = 44100
            self.metadata["filename"] = file_name
            self.metadata["extension"] = get_file_extension(file_name)

        self.asset_data = io_object.read()

        if metadata:
            self.metadata.update(metadata)


def write_numpy_array_as_wav(numpy_array, sample_rate, file_object):
    # type: (Any, int, IO) -> None
    """Convert a numpy array to a WAV file using the given sample_rate and
    write it to the file object
    """
    array_max = np.max(np.abs(numpy_array))

    scaled = np.int16(numpy_array / array_max * 32767)

    # scipy.io.wavfile
    write(file_object, sample_rate, scaled)
