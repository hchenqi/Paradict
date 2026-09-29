# PanLex Dataset Process Pipeline

## Prerequisits

- Install:
  - python
  - duckdb

(All data files are under `data/`)

## Download Panlex Dataset

```sh
pip install -U datasets
python scripts/panlex/load.py
```

Output:
- `00_panlex_meanings.parquet`: (id, langvar, text, text_degr, meaning, langvar_uid)

## Extract Columns with Statistics

```sh
duckdb -c ".read scripts/panlex/extract.sql"
```

Output:
- `10_languages.tsv`: (id, code)
- `10_entries.tsv`: (concept, lang, expr)

## Merge Concept Duplicates



## Filter

```sh
duckdb -c ".read scripts/panlex/filter.sql"
```

output files:

- `data/concepts_final.tsv`
- `data/languages_final.tsv`
- `data/entries_final.tsv`
