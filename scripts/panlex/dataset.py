from query import *


def import_dataset():
	dataset = Query({}, """--sql
		CREATE VIEW panlex_meanings AS
			SELECT * FROM read_parquet('data/panlex_meanings.parquet');

		CREATE TABLE languages AS
			SELECT DISTINCT
				langvar AS id,
				langvar_uid AS code
			FROM panlex_meanings;
		COPY (
			SELECT *
			FROM languages
		) TO {output.languages} (FORMAT parquet);

		CREATE TABLE entries AS
			SELECT DISTINCT
				meaning AS concept,
				langvar AS lang,
				txt     AS expr
			FROM panlex_meanings
			WHERE txt IS NOT NULL;
		COPY (
			SELECT *
			FROM entries
		) TO {output.entries} (FORMAT parquet);

		COPY (
			SELECT 'languages' AS file, count(*) AS count FROM languages
			UNION ALL
			SELECT 'entries', count(*) FROM entries
		) TO {output.stats};
	""")
	return { "languages": dataset["languages"], "entries": dataset["entries"] }


def export_tables(concepts, languages, entries):
	return Query({ "concepts": concepts, "languages": languages, "entries": entries }, """--sql
		COPY (
			SELECT * FROM read_parquet({concepts})
		) TO 'data/concepts.tsv' (HEADER, DELIMITER '\t');

		COPY (
			SELECT * FROM read_parquet({languages})
		) TO 'data/languages.tsv' (HEADER, DELIMITER '\t');

		COPY (
			SELECT * FROM read_parquet({entries})
		) TO 'data/entries.tsv' (HEADER, DELIMITER '\t');
	""")
