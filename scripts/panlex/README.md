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

Expressions are normalied to NFC.

## Import Tables

(skip if importing for the first time)

```sql
drop index if exists public.idx_entries_expr_trgm;
truncate public.entries, public.concepts, public.languages restart identity;
```

(use the following commands or use the Supabase dashboard CSV import UI to import the tables)

```psql
SET statement_timeout = '1h';
\copy public.concepts(id) FROM 'concepts.tsv' (FORMAT csv, HEADER true);
\copy public.languages(id, code) FROM 'languages.tsv' (FORMAT csv, HEADER true, DELIMITER E'\t');
\copy public.entries(concept, lang, expr) FROM 'entries.tsv' (FORMAT csv, HEADER true, DELIMITER E'\t');
```

(run the following queries to synchronize the id sequences)
(can be skipped if using Supabase dashboard CSV import UI)

```sql
select setval(pg_get_serial_sequence('public.concepts', 'id'), coalesce(max(id), 1), max(id) is not null) from public.concepts;
select setval(pg_get_serial_sequence('public.languages', 'id'), coalesce(max(id), 1), max(id) is not null) from public.languages;
```

```sql
create index idx_entries_expr_trgm on public.entries using gin (expr extensions.gin_trgm_ops);

vacuum analyze public.entries;
```
