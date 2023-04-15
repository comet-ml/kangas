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
Creates 4 projection maps from sklearn's breast_cancer
dataset.

What is the effect of scaling on projections?
"""

from sklearn.datasets import load_breast_cancer

import kangas as kg

# Load the data:
ds = load_breast_cancer(as_frame=True)
df = ds.data
df["target"] = ds.target
cols = df.columns.tolist()
df = df[cols[-1:] + cols[:-1]]

# Get scaling values:
scales = {
    name: {
        "min": df[name].min(),
        "max": df[name].max(),
        "mean": df[name].mean(),
        "std": df[name].std(),
    }
    for name in df
}


def normalize(value, name):
    return (value - scales[name]["min"]) / (scales[name]["max"] - scales[name]["min"])


def standardize(value, name):
    return (value - scales[name]["mean"]) / scales[name]["std"]


# Create the datagrid:
pca = []
t_sne = []
normalized_pca = []
normalized_t_sne = []
standardized_pca = []
standardized_t_sne = []
labels = []

names = list(df.columns)
for index, column in df.iterrows():
    # Everything, but target:
    # Scale the data
    normalized_data = [normalize(row, names[i + 1]) for i, row in enumerate(column[1:])]
    standardized_data = [
        standardize(row, names[i + 1]) for i, row in enumerate(column[1:])
    ]
    data = [row for i, row in enumerate(column[1:])]
    # The target is the label:
    label = str(int(column[0]))
    labels.append(label)
    # PCA:
    pca.append(kg.Embedding(data, label=label, text=str(index + 1), projection="pca"))
    normalized_pca.append(
        kg.Embedding(
            normalized_data, label=label, text=str(index + 1), projection="pca"
        )
    )
    standardized_pca.append(
        kg.Embedding(
            standardized_data, label=label, text=str(index + 1), projection="pca"
        )
    )
    # t-SNE:
    t_sne.append(
        kg.Embedding(data, label=label, text=str(index + 1), projection="t-sne")
    )
    normalized_t_sne.append(
        kg.Embedding(
            normalized_data, label=label, text=str(index + 1), projection="t-sne"
        )
    )
    standardized_t_sne.append(
        kg.Embedding(
            standardized_data, label=label, text=str(index + 1), projection="t-sne"
        )
    )

dg = kg.read_dataframe(df, name="breast-cancer")
dg.append_columns(
    {
        "Label": labels,
        "PCA": pca,
        "Normalized PCA": normalized_pca,
        "Standardized PCA": standardized_pca,
        "t-SNE": t_sne,
        "Normalized t-SNE": normalized_t_sne,
        "Standardized t-SNE": standardized_t_sne,
        "All": [1] * len(pca),
    }
)
dg.save()
