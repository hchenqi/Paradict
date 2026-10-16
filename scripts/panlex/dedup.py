from query import *
from graph import *
from helper import *


def build_mapping(entries):
	mapping = Query({ "entries": entries }, """--sql
		CREATE VIEW entries AS
			SELECT * FROM read_parquet({entries});

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
	return { "concept_eid": mapping["concept_eid"], "eid_lang_expr": mapping["eid_lang_expr"] }


def restore_from_mapping(concept_eid, eid_lang_expr):
	entries = Query({ "concept_eid": concept_eid, "eid_lang_expr": eid_lang_expr }, """--sql
		CREATE VIEW concept_eid AS
			SELECT * FROM read_parquet({concept_eid});

		CREATE VIEW eid_lang_expr AS
			SELECT * FROM read_parquet({eid_lang_expr});

		COPY (
			SELECT
				concept,
				lang,
				expr
			FROM concept_eid
			JOIN eid_lang_expr USING (eid)
		) TO {output} (FORMAT parquet);
	""")
	return entries


def map_stats(concept_eid):
	stats = Query({ "concept_eid": concept_eid }, """--sql
		CREATE VIEW concept_eid AS
			SELECT * FROM read_parquet({concept_eid});

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

		COPY (
			SELECT *
			FROM concept_count
			ORDER BY count DESC
			LIMIT 100
		) TO {output.concept_count_top};

		COPY (
			SELECT
				count,
				COUNT(*) AS concept_n
			FROM concept_count
			GROUP BY count
			ORDER BY count DESC
		) TO {output.count_concept_n};

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
			SELECT *
			FROM eid_count
			ORDER BY count DESC
			LIMIT 100
		) TO {output.eid_count_top};

		COPY (
			SELECT
				count,
				COUNT(*) AS eid_n
			FROM eid_count
			GROUP BY count
			ORDER BY count DESC
		) TO {output.count_eid_n};
	""")
	return { "concept_count": stats["concept_count"] }


def dedup_exact(concept_eid, max_count: int):
	result = Query({ "concept_eid": concept_eid, "concept_count": map_stats(concept_eid)["concept_count"], "max_count": String(max_count) }, """--sql
		CREATE VIEW concept_eid AS
			SELECT * FROM read_parquet({concept_eid});

		CREATE VIEW concept_count AS
			SELECT * FROM read_parquet({concept_count});

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
					WHERE count <= {max_count}
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
		) TO {output.count_duplicate_n};

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
	return result["concept_eid"]


def dedup_overlapping(concept_eid, min_count: int, min_jaccard: int, min_overlap: int):
	concept_pair_count = Query({ "concept_eid": concept_eid, "min_count": String(min_count) }, """--sql
		CREATE VIEW concept_eid AS
			SELECT * FROM read_parquet({concept_eid});

		COPY (
			SELECT
				ma.concept AS a,
				mb.concept AS b,
				COUNT(DISTINCT ma.eid) AS count
			FROM concept_eid ma
			JOIN concept_eid mb
				ON ma.eid = mb.eid AND ma.concept < mb.concept
			GROUP BY a, b
			HAVING count >= {min_count}
		) TO {output} (FORMAT parquet);
	""")
	concept_pair_metrics = Query({ "concept_pair_count": concept_pair_count, "concept_count": map_stats(concept_eid)["concept_count"] }, """--sql
		CREATE VIEW concept_pair_count AS
			SELECT * FROM read_parquet({concept_pair_count});

		CREATE VIEW concept_count AS
			SELECT * FROM read_parquet({concept_count});

		COPY (
			SELECT
				p.a,
				p.b,
				p.count,
				ca.count AS a_count,
				cb.count AS b_count,
				p.count / (ca.count + cb.count - p.count) AS jaccard,
				p.count / least(ca.count, cb.count) AS overlap
			FROM concept_pair_count p
			JOIN concept_count ca
				ON p.a = ca.concept
			JOIN concept_count cb
				on p.b = cb.concept
		) TO {output} (FORMAT parquet);
	""")
	concept_pair = Query({ "concept_pair_metrics": concept_pair_metrics, "min_jaccard": String(min_jaccard), "min_overlap": String(min_overlap) }, """--sql
		CREATE VIEW concept_pair_metrics AS
			SELECT * FROM read_parquet({concept_pair_metrics});

		COPY (
			SELECT *
			FROM concept_pair_metrics
			WHERE jaccard >= {min_jaccard} OR overlap >= {min_overlap}
		) TO {output.kept} (FORMAT parquet);

		COPY (
			SELECT *
			FROM concept_pair_metrics
			WHERE jaccard < {min_jaccard} AND overlap < {min_overlap}
		) TO {output.discard} (FORMAT parquet);
	""")["kept"]
	#output_readable(concept_pair.query["kept"]).evaluate()
	#output_readable(concept_pair.query["discard"]).evaluate()
	concept_canonical = find_canonical(concept_pair)
	return Query({ "concept_eid": concept_eid, "concept_canonical": concept_canonical }, """--sql
		CREATE VIEW concept_eid AS
			SELECT * FROM read_parquet({concept_eid});

		CREATE VIEW concept_canonical AS
			SELECT * FROM read_parquet({concept_canonical});

		COPY (
			SELECT DISTINCT
				coalesce(canonical, concept) as concept,
				eid
			FROM concept_eid
			LEFT JOIN concept_canonical
				ON concept = id
		) TO {output} (FORMAT parquet);
	""")
