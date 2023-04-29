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
#    Copyright (c) 2023 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import argparse
import sys

from .utils import Options

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
        "NAME",
        help=("The name of the DataGrid to upload to host"),
        type=str,
    )
    ## Add integrations here:
    parser.add_argument(
        "--comet",
        help="Use comet as the target",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--debug",
        help="Show debugging information",
        action="store_true",
        default=False,
    )
    ## Add integrations here:
    parser.add_argument(
        "--huggingface",
        help="Use huggingface as the target",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--options",
        metavar="KEY=VALUE",
        help="Pass the following KEY=VALUE pairs; for --comet: --options output_dir=DIR; for --huggingface --options limit=N",
        nargs="+",
        default=[],
    )


def export_command(parsed_args, remaining=None):
    # Called via `kangas export ...`
    try:
        export_cli(parsed_args)
    except KeyboardInterrupt:
        print("Canceled by CONTROL+C")
    except Exception as exc:
        print("ERROR: " + str(exc))
        if parsed_args.debug:
            raise


def export_cli(parsed_args):
    # Include target-specific files here:
    from ..integrations.comet import export_to_comet
    from ..integrations.huggingface import export_to_huggingface

    options = Options(parsed_args.options)

    if parsed_args.NAME is None:
        parsed_args.NAME = parsed_args.PATH
        parsed_args.PATH = None

    if parsed_args.comet:
        export_to_comet(path=parsed_args.PATH, name=parsed_args.NAME, options=options)
    elif parsed_args.huggingface:
        export_to_huggingface(
            path=parsed_args.PATH, name=parsed_args.NAME, options=options
        )
    else:
        raise Exception("You need to add a target: --comet OR --huggingface")


def main(args):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    get_parser_arguments(parser)
    parsed_args = parser.parse_args(args)
    export_command(parsed_args)


if __name__ == "__main__":
    # Called via `python -m kangas.cli.export_command ...`
    main(sys.argv[1:])
