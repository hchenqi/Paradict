from query import *


def output_readable(table):
	return Query({ "table": table }, """--sql
		COPY (
			SELECT * FROM read_parquet({table})
		) TO {output};
	""")


def print_concepts(entries, *concepts: int):
	Query({ "entries": entries, "list": String(",".join(str(concept) for concept in concepts)) }, """--sql
		SELECT *
		FROM read_parquet({entries})
		WHERE concept in ({list})
		ORDER BY concept, lang, expr
	""").evaluate()


def print_entry(eid_lang_expr, eid: int):
	Query({ "eid_lang_expr": eid_lang_expr, "eid": String(eid) }, """--sql
		SELECT *
		FROM read_parquet({eid_lang_expr})
		WHERE eid = {eid}
	""").evaluate()
