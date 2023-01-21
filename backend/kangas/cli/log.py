#!/usr/bin/env python
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

import argparse
import sys

ADDITIONAL_ARGS = False


def get_parser_arguments(parser):
    parser.add_argument(
        "PATH",
        help=(
            "The target-specific path: workspace/project/exp, workspace/project, project, or nothing"
        ),
        nargs="?",
        default=None,
        type=str,
    )
    parser.add_argument(
        "FILENAME",
        help=("The filename of the DataGrid to log"),
        type=str,
    )
    ## Add integrations here:
    parser.add_argument(
        "--comet",
        help="Use comet as the target",
        action="store_true",
        default=False,
    )


def log(parsed_args, remaining=None):
    # Called via `kangas log ...`
    try:
        log_cli(parsed_args)
    except KeyboardInterrupt:
        print("Canceled by CONTROL+C")
    except Exception as exc:
        print("ERROR: " + str(exc))


def log_cli(parsed_args):
    # Include target-specific files here:
    from ..integrations import log_to_comet

    if parsed_args.FILENAME is None:
        parsed_args.FILENAME = parsed_args.PATH
        parsed_args.PATH = None

    if parsed_args.comet:
        log_to_comet(parsed_args.FILENAME, comet_path=parsed_args.PATH, output_dir=".")
    else:
        raise Exception("You need to add a target: --comet")


def main(args):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    get_parser_arguments(parser)
    parsed_args = parser.parse_args(args)
    log(parsed_args)


if __name__ == "__main__":
    # Called via `python -m kangas.cli.log ...`
    main(sys.argv[1:])
