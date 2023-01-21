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
            "The source-specific path: workspace/project/exp, workspace/project, or workspace"
        ),
        type=str,
    )
    parser.add_argument(
        "NAME",
        help=("The name of the DataGrid to create"),
        type=str,
    )
    ## Add integrations here:
    parser.add_argument(
        "--comet",
        help="Use comet as the source",
        action="store_true",
        default=False,
    )


def download(parsed_args, remaining=None):
    # Called via `kangas download ...`
    try:
        download_cli(parsed_args)
    except KeyboardInterrupt:
        print("Canceled by CONTROL+C")
    except Exception as exc:
        print("ERROR: " + str(exc))


def download_cli(parsed_args):
    # Include source-specific files here:
    from ..integrations import download_from_comet

    if parsed_args.comet:
        download_from_comet(comet_path=parsed_args.PATH, name=parsed_args.NAME)
    else:
        raise Exception("You need to add a source: --comet")


def main(args):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    get_parser_arguments(parser)
    parsed_args = parser.parse_args(args)
    download(parsed_args)


if __name__ == "__main__":
    # Called via `python -m kangas.cli.download ...`
    main(sys.argv[1:])
