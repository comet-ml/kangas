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
#    Copyright (c) 2023-2024 Kangas Development Team #
#    All rights reserved                             #
######################################################

import argparse
import sys

ADDITIONAL_ARGS = False


def get_parser_arguments(parser):
    parser.add_argument(
        "PATH",
        help=("The target-specific path or repository"),
        type=str,
    )
    parser.add_argument(
        "NAME",
        help=("The name of the DataGrid to use"),
        type=str,
    )
    ## Add integrations here:
    parser.add_argument(
        "--huggingface",
        help="Use huggingface as the target",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--debug",
        help="Show debugging information",
        action="store_true",
        default=False,
    )


def deploy(parsed_args, remaining=None):
    # Called via `kangas deploy ...`
    try:
        deploy_cli(parsed_args)
    except KeyboardInterrupt:
        print("Canceled by CONTROL+C")
    except Exception as exc:
        if parsed_args.debug:
            raise
        else:
            print("ERROR: " + str(exc))


def deploy_cli(parsed_args):
    # Include target-specific files here:
    from ..integrations.huggingface import deploy_to_huggingface

    if parsed_args.huggingface:
        deploy_to_huggingface(path=parsed_args.PATH, name=parsed_args.NAME)
    else:
        raise Exception("You need to add a target: --huggingface")


def main(args):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    get_parser_arguments(parser)
    parsed_args = parser.parse_args(args)
    deploy(parsed_args)


if __name__ == "__main__":
    # Called via `python -m kangas.cli.deploy ...`
    main(sys.argv[1:])
