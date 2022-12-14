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
"""
Examples:
    datagrid server
    datagrid viewer

For more information:
    datagrid COMMAND --help
"""
import argparse
import sys

from .. import __version__


def add_subparser(subparsers, module, name):
    """
    Loads scripts and creates subparser.

    Assumes: NAME works for:
       * NAME.NAME is the function
       * module.ADDITIONAL_ARGS is set to True/False
       * module.get_parser_arguments is defined
    """
    func = getattr(module, name)
    additional_args = module.ADDITIONAL_ARGS
    get_parser_arguments = module.get_parser_arguments
    docs = module.__doc__

    parser = subparsers.add_parser(
        name, description=docs, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.set_defaults(func=func)
    parser.set_defaults(additional_args=additional_args)
    get_parser_arguments(parser)


def main(raw_args=sys.argv[1:]):
    # Import CLI commands:
    from . import server, viewer

    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--version",
        help="Display datagrid version",
        action="store_const",
        const=True,
        default=False,
    )
    subparsers = parser.add_subparsers()

    # Register CLI commands:
    add_subparser(subparsers, server, "server")
    add_subparser(subparsers, viewer, "viewer")

    # First identify the subparser as some subparser pass additional args to
    # the subparser and other not

    args, rest = parser.parse_known_args(raw_args)

    # args won't have additional args if no subparser added
    if hasattr(args, "additional_args") and args.additional_args:
        parser_func = args.func

        parser_func(args, rest)
    elif args.version:
        print(__version__)
    else:
        # If the subcommand doesn't need extra args, reparse in strict mode so
        # the users get a nice message in case of unsupported CLi argument
        args = parser.parse_args(raw_args)
        if hasattr(args, "func"):
            parser_func = args.func

            parser_func(args)
        else:
            # datagrid with no args; call recursively:
            main(["--help"])


if __name__ == "__main__":
    main(sys.argv[1:])
