# Processing PanLex Dataset

## Load Dataset

```sh
pip install -U datasets
python scripts/panlex/load.py
```

output file:

- `data/panlex_meanings.parquet`

## Extract Data

install duckdb

```sh
duckdb -c ".read scripts/panlex/extract.sql"
```

output files:

- `data/concepts.tsv`
- `data/languages.tsv`
- `data/entries.tsv`

## Filter Data

```sh
duckdb -c ".read scripts/panlex/filter.sql"
```

output files:

- `data/concepts_final.tsv`
- `data/languages_final.tsv`
- `data/entries_final.tsv`
