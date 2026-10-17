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
- `panlex_meanings.parquet`: (id, langvar, text, text_degr, meaning, langvar_uid)

## Process the Dataset

```sh
python scripts/panlex/process.py
```

Output:
- `concepts.tsv`
- `languages.tsv`
- `entries.tsv`

## Normalize Expressions

(can be skipped because already normalized) 

```sh
python scripts/panlex/normalize.py
```

## Import Tables

```psql
SET statement_timeout = '1h';
\copy public.concepts(id) FROM 'concepts.tsv' (FORMAT csv, HEADER true);
\copy public.languages(id, code) FROM 'languages.tsv' (FORMAT csv, HEADER true, DELIMITER E'\t');
\copy public.entries(concept, lang, expr) FROM 'entries.tsv' (FORMAT csv, HEADER true, DELIMITER E'\t');
```
