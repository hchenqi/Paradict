from query import *


def languages_normalize(languages):
	return Query({ "languages": languages }, """--sql
		COPY (
			SELECT
				id,
				regexp_replace(code, '-000$', '') AS code
			FROM read_parquet({languages})
			WHERE code LIKE '%-000'
		) TO {output} (FORMAT parquet);
	""")

def languages_stats(languages, entries):
	return Query({ "languages": languages, "entries": entries }, """--sql
		COPY (
			SELECT
				id,
				code,
				COUNT(*) AS count
			FROM read_parquet({entries})
			JOIN read_parquet({languages})
				ON lang = id
			GROUP BY id, code
			ORDER BY count DESC
		) TO {output} (FORMAT parquet);
	""")

def languages_enough_entries(language_count, n: int):
	return Query({ "language_count": language_count, "n": String(n) }, """--sql
		COPY (
			SELECT
				id,
				code
			FROM read_parquet({language_count})
			WHERE count >= {n}
		) TO {output} (FORMAT parquet);
	""")


def concepts_m_in_all_n_top_languages(entries, language_count, m: int, n: int):
	return Query({ "entries": entries, "language_count": language_count, "m": String(m), "n": String(n) }, """--sql
		COPY (
			SELECT
				concept as id
			FROM read_parquet({entries})
			JOIN (
				SELECT id
				FROM read_parquet({language_count})
				ORDER BY count DESC
				LIMIT {n}
			)
				ON lang = id
			GROUP BY concept
			HAVING COUNT(DISTINCT lang) >= {m}
		) TO {output} (FORMAT parquet);
	""")

def concepts_distinct(entries):
	return Query({ "entries": entries }, """--sql
		COPY (
			SELECT DISTINCT concept as id
			FROM read_parquet({entries})
		) TO {output} (FORMAT parquet);
	""")


def entries_of_concepts(entries, concepts):
	return Query({ "entries": entries, "concepts": concepts }, """--sql
		COPY (
			SELECT concept, lang, expr
			FROM read_parquet({entries})
			JOIN read_parquet({concepts})
				ON concept = id
		) TO {output} (FORMAT parquet);
	""")

def entries_of_languages(entries, languages):
	return Query({ "entries": entries, "languages": languages }, """--sql
		COPY (
			SELECT concept, lang, expr
			FROM read_parquet({entries})
			JOIN read_parquet({languages})
				ON lang = id
		) TO {output} (FORMAT parquet);
	""")
