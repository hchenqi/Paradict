from query import Query

# import and extract panlex dataset
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
	) TO {output.stats} (HEADER, DELIMITER '\t');
""")

# deduplication
## generate concept:eid mapping from entries
mapping = Query({ "dataset": dataset }, """--sql
	CREATE VIEW entries AS
		SELECT * FROM read_parquet({dataset.entries});

	CREATE TABLE eid_lang_expr AS
		SELECT
			row_number() OVER () AS eid,
			lang,
			expr
		FROM (
			SELECT DISTINCT
				lang,
				expr
			FROM entries
		);
	COPY (
		SELECT *
		FROM eid_lang_expr
	) TO {output.eid_lang_expr} (FORMAT parquet);

	COPY (
		SELECT
			concept,
			eid
		FROM entries
		JOIN eid_lang_expr USING (lang, expr)
	) TO {output.concept_eid} (FORMAT parquet);
""")

## mapping statistics
sql_mapping_stats = """--sql
	CREATE VIEW concept_eid AS
		SELECT * FROM read_parquet({mapping.concept_eid});

	CREATE TABLE concept_count AS
		SELECT
			concept,
			COUNT(*) AS count
		FROM concept_eid
		GROUP BY concept;
	COPY (
		SELECT *
		FROM concept_count
	) TO {output.concept_count} (FORMAT parquet);

	CREATE TABLE eid_count AS
		SELECT
			eid,
			COUNT(*) AS count
		FROM concept_eid
		GROUP BY eid;
	COPY (
		SELECT *
		FROM eid_count
	) TO {output.eid_count} (FORMAT parquet);

	COPY (
		SELECT
			count,
			COUNT(*) AS concept_n
		FROM concept_count
		GROUP BY count
		ORDER BY count DESC
	) TO {output.count_concept_n} (HEADER, DELIMITER '\t');

	COPY (
		SELECT
			count,
			COUNT(*) AS eid_n
		FROM eid_count
		GROUP BY count
		ORDER BY count DESC
	) TO {output.count_eid_n} (HEADER, DELIMITER '\t');
"""

mapping_stats = Query({ "mapping": mapping }, sql_mapping_stats)

## find and remove exact concept duplicates (with <= 20 entries)
mapping_filter_exact_duplicates = Query({ "mapping": mapping, "mapping_stats": mapping_stats }, """--sql
	CREATE VIEW concept_eid AS
		SELECT * FROM read_parquet({mapping.concept_eid});

	CREATE VIEW concept_count AS
		SELECT * FROM read_parquet({mapping_stats.concept_count});

	CREATE TABLE duplicates AS
		SELECT
			concept,
			count
		FROM (
			SELECT
				concept,
				count,
				LIST(eid ORDER BY eid) AS eid_list
			FROM concept_eid
			JOIN concept_count USING (concept)
				WHERE count <= 20
			GROUP BY concept, count
		)
		QUALIFY concept != MIN(concept) OVER (
			PARTITION BY count, eid_list
		);

	COPY (
		SELECT
			count,
			COUNT(*) AS duplicate_n
		FROM duplicates
		GROUP BY count
		ORDER BY count ASC
	) TO {output.count_duplicate_n} (HEADER, DELIMITER '\t');

	COPY (
		SELECT *
		FROM concept_eid
		WHERE NOT EXISTS (
			SELECT 1
			FROM duplicates
			WHERE concept_eid.concept = duplicates.concept
		)
	) TO {output.concept_eid} (FORMAT parquet);
""")

mapping_filter_exact_duplicates_stats = Query({ "mapping": mapping_filter_exact_duplicates }, sql_mapping_stats)

## merge concepts (with >= 10 overlapping entries)
### select concepts of interest (with >= 10 and <= 50 entries)
mapping_filter_few_entries = Query({ "mapping": mapping_filter_exact_duplicates, "mapping_stats": mapping_filter_exact_duplicates_stats }, """--sql
	CREATE VIEW concept_eid AS
		SELECT * FROM read_parquet({mapping.concept_eid});

	CREATE VIEW concept_count AS
		SELECT * FROM read_parquet({mapping_stats.concept_count});

	COPY (
		SELECT concept_eid.*
		FROM concept_eid
		JOIN concept_count USING (concept)
			WHERE count >= 10 AND count <= 50
	) TO {output.concept_eid} (FORMAT parquet);
""")

mapping_filter_few_entries_stats = Query({ "mapping": mapping_filter_few_entries }, sql_mapping_stats)

### find concept pairs (with >= 10 overlapping entries)
concept_pairs = Query({ "mapping": mapping_filter_few_entries }, """--sql
	CREATE VIEW concept_eid AS
		SELECT * FROM read_parquet({mapping.concept_eid});

	COPY (
		SELECT
			ma.concept AS a,
			mb.concept AS b
		FROM concept_eid ma
		JOIN concept_eid mb
			ON ma.eid = mb.eid AND ma.concept < mb.concept
		GROUP BY a, b
		HAVING COUNT(DISTINCT ma.eid) >= 10
	) TO {output} (FORMAT parquet);
""")

concept_pairs_stats = Query({ "concept_pairs": concept_pairs }, """--sql
	CREATE VIEW concept_pairs AS
		SELECT * FROM read_parquet({concept_pairs});

	COPY (
		SELECT *
		FROM concept_pairs
	) TO {output.table};
""")

### find duplicate to canonical concept mapping
sql_id_canonical = """--sql
	CREATE VIEW edges AS
		SELECT * FROM read_parquet({edges});

	CREATE TABLE nodes AS
		SELECT a AS id FROM edges
		UNION
		SELECT b AS id FROM edges;

	CREATE TABLE undirected_edges AS
		SELECT a AS src, b AS dst FROM edges
		UNION ALL
		SELECT b AS src, a AS dst FROM edges;

	COPY (
		WITH RECURSIVE
		connected_components(id, component, parent)
		USING KEY (id)
		AS (
			SELECT
				id,
				id AS component,
				id AS parent
			FROM nodes
			UNION ALL
			SELECT
				p.id,
				MIN(c.component) AS component,
				arg_min(c.id, c.component) AS parent
			FROM connected_components AS c
			JOIN undirected_edges AS e
				ON e.src = c.id
			JOIN recurring.connected_components AS p
				ON p.id = e.dst
			GROUP BY p.id, p.component
			HAVING MIN(c.component) < p.component
		)
		SELECT
			id,
			component AS canonical,
			parent
		FROM connected_components
	) TO {output} (FORMAT parquet);
"""

'''
WITH RECURSIVE path(id, parent, depth) AS (
	SELECT
		id,
		parent,
		0
	FROM tree
		WHERE id = ''
	UNION ALL
	SELECT
		t.id,
		t.parent,
		p.depth + 1
	FROM path p
	JOIN tree t
		ON t.id = p.parent
		WHERE p.id != p.parent
)
SELECT id
FROM path;
'''

concept_canonical = Query({ "edges": concept_pairs }, sql_id_canonical)

concept_canonical_stats = Query({ "concept_canonical": concept_canonical }, """--sql
	CREATE VIEW concept_canonical AS
		SELECT * FROM read_parquet({concept_canonical});

	COPY (
		SELECT count(*)
		FROM concept_canonical
		WHERE id != canonical
	) TO {output.count};

	COPY (
		SELECT *
		FROM concept_canonical
	) TO {output.table};
""")

mapping_dedup = Query({ "mapping": mapping_filter_exact_duplicates, "concept_canonical": concept_canonical }, """--sql
	CREATE VIEW concept_eid AS
		SELECT * FROM read_parquet({mapping.concept_eid});

	CREATE VIEW concept_canonical AS
		SELECT * FROM read_parquet({concept_canonical});

	COPY (
		SELECT DISTINCT
			coalesce(canonical, concept) as concept,
			eid
		FROM concept_eid
		LEFT JOIN concept_canonical
			ON concept = id
	) TO {output.concept_eid} (FORMAT parquet);
""")

mapping_dedup_stats = Query({ "mapping": mapping_dedup }, sql_mapping_stats)

### replace concepts with their canonicals
entries_dedup = Query({ "mapping_0": mapping, "mapping_1": mapping_dedup }, """--sql
	CREATE VIEW eid_lang_expr AS
		SELECT * FROM read_parquet({mapping_0.eid_lang_expr});

	CREATE VIEW concept_eid_dedup AS
		SELECT * FROM read_parquet({mapping_1.concept_eid});

	COPY (
		SELECT
			concept,
			lang,
			expr
		FROM concept_eid_dedup
		JOIN eid_lang_expr USING (eid)
	) TO {output} (FORMAT parquet);
""")

# filter
## language statistics
sql_language_count = """--sql
	CREATE VIEW languages AS
		SELECT * FROM read_parquet({dataset.languages});

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
"""

language_count = Query({ "dataset": dataset, "entries": entries_dedup }, sql_language_count)

## filter concepts in top languages (8 in top 9)
concepts = Query({ "entries": entries_dedup, "language_count": language_count }, """--sql
	CREATE VIEW entries AS
		SELECT * FROM read_parquet({entries});

	CREATE VIEW language_count AS
		SELECT * FROM read_csv({language_count}, delim='\t', header=true);

	CREATE TABLE concepts AS
		SELECT
			concept as id
		FROM entries
		JOIN (
			SELECT id
			FROM language_count
			ORDER BY count DESC
			LIMIT 9
		)
			ON lang = id
		GROUP BY concept
		HAVING COUNT(DISTINCT lang) = 9;

	COPY (
		SELECT *
		FROM concepts
	) TO {output} (FORMAT parquet);

	COPY (
		SELECT *
		FROM concepts
	) TO 'data/concepts.tsv' (HEADER, DELIMITER '\t');
""")

entries_filter = Query({  "entries": entries_dedup, "concepts": concepts }, """--sql
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

language_count_filter = Query({ "dataset": dataset, "entries": entries_filter }, sql_language_count)

languages = Query({ "language_count": language_count_filter }, """--sql
	CREATE VIEW language_count AS
		SELECT * FROM read_csv({language_count}, delim='\t', header=true);

	CREATE TABLE languages AS
		SELECT
			id,
			code
		FROM language_count
		WHERE count >= 5000;

	COPY (
		SELECT *
		FROM languages
	) TO {output} (FORMAT parquet);

	COPY (
		SELECT *
		FROM languages
	) TO 'data/languages.tsv' (HEADER, DELIMITER '\t');
""")

entries = Query({ "entries": entries_filter, "languages": languages }, """--sql
	CREATE VIEW languages AS
		SELECT * FROM read_parquet({languages});

	CREATE TABLE entries AS
		SELECT entries.*
		FROM read_parquet({entries}) entries
		JOIN languages
			ON lang = id;

	COPY (
		SELECT *
		FROM entries
	) TO {output} (FORMAT parquet);

	COPY (
		SELECT *
		FROM entries
	) TO 'data/entries.tsv' (HEADER, DELIMITER '\t');
""")

entries.materialize()
