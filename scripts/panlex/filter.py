from query import *


def languages_stats(languages, entries):
	return Query({ "languages": languages, "entries": entries }, """--sql
		CREATE VIEW languages AS
			SELECT * FROM read_parquet({languages});

		CREATE VIEW entries AS
			SELECT * FROM read_parquet({entries});

		COPY (
			SELECT
				id,
				regexp_replace(code, '-000$', '') AS code,
				COUNT(*) AS count
			FROM entries
			JOIN languages
				ON lang = id
			WHERE code LIKE '%-000'
			GROUP BY id, code
			ORDER BY count DESC
		) TO {output} (HEADER, DELIMITER '\t');
	""")


def languages_enough_entries(language_count, n: int):
	return Query({ "language_count": language_count, "n": String(n) }, """--sql
		CREATE VIEW language_count AS
			SELECT * FROM read_csv({language_count}, header=true, delim='\t');

		CREATE TABLE languages AS
			SELECT
				id,
				code
			FROM language_count
			WHERE count >= {n};

		COPY (
			SELECT *
			FROM languages
		) TO {output} (FORMAT parquet);
	""")


def concepts_all_top_languages(entries, language_count, n: int):
	return Query({ "entries": entries, "language_count": language_count, "n": String(n) }, """--sql
		CREATE VIEW entries AS
			SELECT * FROM read_parquet({entries});

		CREATE VIEW language_count AS
			SELECT * FROM read_csv({language_count}, header=true, delim='\t');

		COPY (
			SELECT
				concept as id
			FROM entries
			JOIN (
				SELECT id
				FROM language_count
				ORDER BY count DESC
				LIMIT {n}
			)
				ON lang = id
			GROUP BY concept
			HAVING COUNT(DISTINCT lang) = {n}
		) TO {output} (FORMAT parquet);
	""")


def concepts_distinct(entries):
	return Query({ "entries": entries }, """--sql
		CREATE VIEW entries AS
			SELECT * FROM read_parquet({entries});

		COPY (
			SELECT DISTINCT concept as id
			FROM entries
		) TO {output} (FORMAT parquet);
	""")


def entries_of_concepts(entries, concepts):
	return Query({ "entries": entries, "concepts": concepts }, """--sql
		CREATE VIEW entries AS
			SELECT * FROM read_parquet({entries});

		CREATE VIEW concepts AS
			SELECT * FROM read_parquet({concepts});

		COPY (
			SELECT entries.*
			FROM entries
			JOIN concepts
				ON concept = id
		) TO {output} (FORMAT parquet);
	""")


def entries_of_languages(entries, languages):
	return Query({ "entries": entries, "languages": languages }, """--sql
		CREATE VIEW entries AS
			SELECT * FROM read_parquet({entries});

		CREATE VIEW languages AS
			SELECT * FROM read_parquet({languages});

		COPY (
			SELECT entries.*
			FROM entries
			JOIN languages
				ON lang = id
		) TO {output} (FORMAT parquet);
	""")
